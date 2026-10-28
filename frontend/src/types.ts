export interface Endpoint {
  id: string;
  name: string;
  url: string;
}
export interface Attempt {
  id: string;
  number: number;
  statusCode: number | null;
  durationMs: number;
  error: string | null;
  createdAt: string;
}
export interface Delivery {
  id: string;
  endpointId: string;
  endpoint: Endpoint;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'QUEUED' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
  attemptCount: number;
  createdAt: string;
  attempts: Attempt[];
}
export const labels: Record<Delivery['status'], string> = {
  QUEUED: 'Kuyrukta',
  PROCESSING: 'Gönderiliyor',
  DELIVERED: 'Teslim edildi',
  FAILED: 'Başarısız',
};
