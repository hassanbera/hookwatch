import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/database.js';
import { processOne } from '../src/modules/hookwatch/hookwatch.worker.js';
import { hookwatchRepository } from '../src/modules/hookwatch/hookwatch.repository.js';
let server: Server,
  origin = '',
  code = 200,
  signatureValid = false,
  endpointId = '';
beforeAll(async () => {
  server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const expected =
      'sha256=' +
      createHmac('sha256', env.WEBHOOK_SIGNING_SECRET)
        .update(req.headers['x-hookwatch-timestamp'] + '.' + raw)
        .digest('hex');
    signatureValid = req.headers['x-hookwatch-signature'] === expected;
    res.writeHead(code);
    res.end('receiver');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  origin = 'http://127.0.0.1:' + address.port;
  env.WEBHOOK_ALLOWED_ORIGINS += ',' + origin;
  endpointId = (
    await request(app)
      .post('/api/endpoints')
      .send({ name: 'Integration receiver', url: origin + '/receive' })
      .expect(201)
  ).body.data.id;
});
afterAll(async () => {
  if (endpointId) await prisma.endpoint.delete({ where: { id: endpointId } });
  await prisma.$disconnect();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
async function event() {
  return (
    await request(app)
      .post('/api/deliveries')
      .send({ endpointId, eventType: 'test.event', payload: { hello: 'world' } })
      .expect(202)
  ).body.data;
}
describe('Durable webhook queue', () => {
  it('delivers signed HTTP requests and records attempts', async () => {
    code = 200;
    const d = await event();
    await processOne(d.id);
    const saved = await hookwatchRepository.get(d.id);
    expect(saved?.status).toBe('DELIVERED');
    expect(saved?.attempts[0]?.statusCode).toBe(200);
    expect(signatureValid).toBe(true);
    await request(app)
      .post('/api/deliveries/' + d.id + '/retry')
      .send({})
      .expect(409);
  });
  it('retries temporary failures then terminates and supports manual replay', async () => {
    code = 503;
    const d = await event();
    for (let i = 0; i < 4; i++) {
      await prisma.delivery.update({ where: { id: d.id }, data: { nextAttemptAt: new Date(0) } });
      await processOne(d.id);
    }
    const failed = await hookwatchRepository.get(d.id);
    expect(failed?.status).toBe('FAILED');
    expect(failed?.attempts).toHaveLength(4);
    await request(app)
      .post('/api/deliveries/' + d.id + '/retry')
      .send({})
      .expect(200);
    code = 200;
    await processOne(d.id);
    const saved = await hookwatchRepository.get(d.id);
    expect(saved?.status).toBe('DELIVERED');
    expect(saved?.attemptCount).toBe(5);
  });
  it('claims a job once under concurrency and recovers expired leases', async () => {
    const d = await event();
    const claims = await Promise.all([
      hookwatchRepository.claim(d.id),
      hookwatchRepository.claim(d.id),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    await prisma.delivery.update({
      where: { id: d.id },
      data: { lockedAt: new Date(Date.now() - 60_000) },
    });
    code = 200;
    await processOne(d.id);
    expect((await hookwatchRepository.get(d.id))?.status).toBe('DELIVERED');
  });
  it('fails permanent HTTP errors immediately and rejects unapproved origins', async () => {
    code = 400;
    const d = await event();
    await processOne(d.id);
    expect((await hookwatchRepository.get(d.id))?.status).toBe('FAILED');
    await request(app)
      .post('/api/endpoints')
      .send({ name: 'Rejected', url: 'http://169.254.169.254/latest' })
      .expect(400);
    await request(app)
      .post('/api/endpoints')
      .send({ name: 'Rejected', url: origin + '/receive#fragment' })
      .expect(400);
  });
});
