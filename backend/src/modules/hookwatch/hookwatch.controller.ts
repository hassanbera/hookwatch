import type { Request, Response } from 'express';
import type { Prisma } from '../../generated/prisma/client.js';
import { hookwatchService as service } from './hookwatch.service.js';
import { id, endpointInput, eventInput } from './hookwatch.model.js';
export const controller = {
  async endpoints(_req: Request, res: Response) {
    res.json({ data: await service.endpoints() });
  },
  async createEndpoint(req: Request, res: Response) {
    const d = endpointInput.parse(req.body);
    res.status(201).json({ data: await service.createEndpoint(d.name, d.url) });
  },
  async list(_req: Request, res: Response) {
    res.json({ data: await service.list() });
  },
  async get(req: Request, res: Response) {
    res.json({ data: await service.get(id.parse(req.params.id)) });
  },
  async create(req: Request, res: Response) {
    const d = eventInput.parse(req.body);
    res.status(202).json({
      data: await service.create(d.endpointId, d.eventType, d.payload as Prisma.InputJsonObject),
    });
  },
  async retry(req: Request, res: Response) {
    res.json({ data: await service.retry(id.parse(req.params.id)) });
  },
};
