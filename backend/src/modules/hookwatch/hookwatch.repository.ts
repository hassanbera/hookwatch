import { Prisma } from '../../generated/prisma/client.js';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/database.js';
import { LEASE_MS, MAX_ATTEMPTS } from './hookwatch.model.js';
export const hookwatchRepository = {
  endpoints: () => prisma.endpoint.findMany({ orderBy: { createdAt: 'asc' } }),
  endpoint: (id: string) => prisma.endpoint.findUnique({ where: { id } }),
  createEndpoint: (name: string, url: string) => prisma.endpoint.create({ data: { name, url } }),
  list: () =>
    prisma.delivery.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { endpoint: true, attempts: { orderBy: { number: 'desc' } } },
    }),
  get: (id: string) =>
    prisma.delivery.findUnique({
      where: { id },
      include: { endpoint: true, attempts: { orderBy: { number: 'desc' } } },
    }),
  create: (endpointId: string, eventType: string, payload: Prisma.InputJsonObject) =>
    prisma.delivery.create({ data: { endpointId, eventType, payload } }),
  retry: (id: string) =>
    prisma.delivery.updateMany({
      where: { id, status: 'FAILED' },
      data: {
        status: 'QUEUED',
        cycleAttempts: 0,
        nextAttemptAt: new Date(),
        lockedAt: null,
        lockToken: null,
      },
    }),
  claim: (deliveryId?: string) =>
    prisma.$transaction(async (tx) => {
      const cutoff = new Date(Date.now() - LEASE_MS);
      const scope = deliveryId ? { id: deliveryId } : {};
      await tx.delivery.updateMany({
        where: { ...scope, status: 'PROCESSING', lockedAt: { lt: cutoff } },
        data: { status: 'QUEUED', lockedAt: null, lockToken: null },
      });
      const filter = deliveryId ? Prisma.sql`AND id = ${deliveryId}::uuid` : Prisma.empty;
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "Delivery" WHERE status = 'QUEUED' AND "nextAttemptAt" <= NOW() ${filter} ORDER BY "nextAttemptAt" ASC FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!rows[0]) return null;
      return tx.delivery.update({
        where: { id: rows[0].id },
        data: {
          status: 'PROCESSING',
          lockedAt: new Date(),
          lockToken: randomUUID(),
          attemptCount: { increment: 1 },
          cycleAttempts: { increment: 1 },
        },
        include: { endpoint: true },
      });
    }),
  finish: (
    job: { id: string; lockToken: string | null; attemptCount: number; cycleAttempts: number },
    result: { statusCode: number | null; durationMs: number; error: string | null },
  ) =>
    prisma.$transaction(async (tx) => {
      const success =
        result.statusCode !== null && result.statusCode >= 200 && result.statusCode < 300;
      const retryable =
        result.statusCode === null ||
        result.statusCode >= 500 ||
        [408, 429].includes(result.statusCode);
      const status = success
        ? 'DELIVERED'
        : retryable && job.cycleAttempts < MAX_ATTEMPTS
          ? 'QUEUED'
          : 'FAILED';
      const changed = await tx.delivery.updateMany({
        where: { id: job.id, status: 'PROCESSING', lockToken: job.lockToken },
        data: {
          status,
          lockedAt: null,
          lockToken: null,
          nextAttemptAt: new Date(Date.now() + 1000 * 2 ** job.cycleAttempts),
        },
      });
      if (changed.count)
        await tx.attempt.create({
          data: { deliveryId: job.id, number: job.attemptCount, ...result },
        });
    }),
};
