import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';
import { ZodError } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues.map((i) => i.message).join(' · ') });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      error.code === 'P2025' ? 404 : ['P2002', 'P2034', 'P2003'].includes(error.code) ? 409 : 500;
    res
      .status(status)
      .json({
        error:
          status === 404
            ? 'Kayıt bulunamadı.'
            : status === 409
              ? 'Kayıt değişti veya işlem çakıştı. Yeniden deneyin.'
              : 'Veritabanı işlemi tamamlanamadı.',
      });
    return;
  }
  if (error && typeof error === 'object' && 'status' in error && error.status === 413) {
    res.status(413).json({ error: 'İstek çok büyük.' });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Geçersiz JSON.' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Beklenmeyen bir hata oluştu.' });
};
