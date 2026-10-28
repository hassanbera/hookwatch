import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { errorHandler } from './common/http.js';
import { router } from './modules/hookwatch/hookwatch.routes.js';
export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '32kb' }));
app.use(
  rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
);
app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ data: { status: 'ok', application: 'hookwatch' } });
});
app.use('/api', router);
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı.' });
});
app.use(errorHandler);
