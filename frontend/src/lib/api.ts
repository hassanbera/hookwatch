export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch('/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  }).catch(() => {
    throw new Error('API bağlantısı kurulamadı. Sunucunun çalıştığını kontrol edin.');
  });
  const body = await response.json().catch(() => {
    throw new Error('Sunucudan geçerli bir yanıt alınamadı. Yeniden deneyin.');
  });
  if (!response.ok) throw new Error(body.error || 'İşlem tamamlanamadı.');
  return body.data as T;
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : 'İşlem tamamlanamadı.';
}
export const date = (value: string) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(value));
export const money = (cents: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(cents / 100);
