import 'dotenv/config';
import { z } from 'zod';
export const env = z
  .object({
    DATABASE_URL: z.string().url(),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4103),
    CORS_ORIGIN: z.string().url().default('http://localhost:5175'),
    WEBHOOK_ALLOWED_ORIGINS: z.string().default('http://localhost:4103'),
    WEBHOOK_SIGNING_SECRET: z.string().min(24),
    WORKER_ENABLED: z.enum(['true', 'false']).default('true'),
  })
  .parse(process.env);
