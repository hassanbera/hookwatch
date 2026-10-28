import { z } from 'zod';
import { env } from '../../config/env.js';
import { HttpError } from '../../common/http.js';
export const id = z.string().uuid();
export const endpointInput = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.string().url().max(500),
});
export const eventInput = z.object({
  endpointId: id,
  eventType: z
    .string()
    .regex(/^[a-zA-Z0-9_.-]{1,80}$/, 'Olay türünde harf, sayı, nokta veya tire kullanın.'),
  payload: z.record(z.string(), z.unknown()).default({}),
});
export function allowedUrl(raw: string) {
  const url = new URL(raw);
  const origins = env.WEBHOOK_ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    !origins.includes(url.origin)
  )
    throw new HttpError(400, 'Bu hedef izin verilen webhook origin listesinde değil.');
  return url.toString();
}
export const MAX_ATTEMPTS = 4;
export const LEASE_MS = 30_000;
