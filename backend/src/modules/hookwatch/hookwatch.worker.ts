import { createHmac } from 'node:crypto';
import { env } from '../../config/env.js';
import { allowedUrl } from './hookwatch.model.js';
import { hookwatchRepository as repo } from './hookwatch.repository.js';
let timer: ReturnType<typeof setTimeout> | undefined;
let active: Promise<unknown> | undefined;
let stopped = true;
export async function processOne(deliveryId?: string) {
  const job = await repo.claim(deliveryId);
  if (!job) return false;
  const start = performance.now();
  let statusCode: number | null = null,
    error: string | null = null;
  try {
    const url = allowedUrl(job.endpoint.url);
    const body = JSON.stringify({
      id: job.id,
      type: job.eventType,
      createdAt: job.createdAt.toISOString(),
      data: job.payload,
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', env.WEBHOOK_SIGNING_SECRET)
      .update(timestamp + '.' + body)
      .digest('hex');
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        'X-HookWatch-Id': job.id,
        'X-HookWatch-Timestamp': timestamp,
        'X-HookWatch-Signature': 'sha256=' + signature,
      },
      body,
    });
    statusCode = response.status;
    await response.body?.cancel();
    if (!response.ok) error = 'Alıcı HTTP ' + response.status + ' döndürdü.';
  } catch (e) {
    error = e instanceof Error ? e.message.slice(0, 500) : 'Teslimat tamamlanamadı.';
  }
  await repo.finish(job, { statusCode, durationMs: Math.round(performance.now() - start), error });
  return true;
}
export function startWorker() {
  if (!stopped) return;
  stopped = false;
  const tick = () => {
    if (stopped) return;
    active = processOne()
      .catch((e) => console.error('Worker:', e))
      .finally(() => {
        if (!stopped) timer = setTimeout(tick, 500);
      });
  };
  tick();
}
export async function stopWorker() {
  stopped = true;
  clearTimeout(timer);
  await active;
}
