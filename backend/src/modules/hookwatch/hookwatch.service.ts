import type { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../common/http.js';
import { allowedUrl } from './hookwatch.model.js';
import { hookwatchRepository as repo } from './hookwatch.repository.js';
export const hookwatchService = {
  endpoints: repo.endpoints,
  list: repo.list,
  createEndpoint: (name: string, url: string) => repo.createEndpoint(name, allowedUrl(url)),
  async create(endpointId: string, eventType: string, payload: Prisma.InputJsonObject) {
    const endpoint = await repo.endpoint(endpointId);
    if (!endpoint) throw new HttpError(404, 'Hedef bulunamadı.');
    allowedUrl(endpoint.url);
    return repo.create(endpointId, eventType, payload);
  },
  async get(id: string) {
    const item = await repo.get(id);
    if (!item) throw new HttpError(404, 'Teslimat bulunamadı.');
    return item;
  },
  async retry(id: string) {
    await this.get(id);
    const result = await repo.retry(id);
    if (!result.count)
      throw new HttpError(409, 'Yalnızca başarısız teslimatlar yeniden kuyruğa alınabilir.');
    return this.get(id);
  },
};
