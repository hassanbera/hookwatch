import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus,
  Search,
  Radio,
  CheckCircle2,
  Clock3,
  TriangleAlert,
  ArrowUpRight,
  Send,
  RotateCw,
  ChevronRight,
  Globe,
  Activity,
  Copy,
} from 'lucide-react';
import { api, message } from './lib/api';
import { Shell, Modal, Notice, Stat, Loading, Empty } from './components/ui';
import { type Endpoint, type Delivery, labels } from './types';
const time = (s: string) =>
  new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(s));
export default function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]),
    [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('ALL');
  const [modal, setModal] = useState<'endpoint' | 'event' | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const [e, d] = await Promise.all([
      api<Endpoint[]>('/endpoints'),
      api<Delivery[]>('/deliveries'),
    ]);
    setEndpoints(e);
    setDeliveries(d);
  }
  useEffect(() => {
    let disposed = false;
    async function load() {
      try {
        const [e, d] = await Promise.all([
          api<Endpoint[]>('/endpoints'),
          api<Delivery[]>('/deliveries'),
        ]);
        if (!disposed) {
          setEndpoints(e);
          setDeliveries(d);
        }
      } catch (e) {
        if (!disposed) setError(message(e));
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => {
      void load();
    }, 4000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      if (modal === 'endpoint')
        await api('/endpoints', {
          method: 'POST',
          body: JSON.stringify({ name: f.get('name'), url: f.get('url') }),
        });
      else {
        let payload: unknown;
        try {
          payload = JSON.parse(String(f.get('payload')));
        } catch {
          throw new Error('Payload geçerli bir JSON nesnesi olmalı.');
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload))
          throw new Error('Payload bir JSON nesnesi olmalı.');
        await api('/deliveries', {
          method: 'POST',
          body: JSON.stringify({
            endpointId: f.get('endpoint'),
            eventType: f.get('eventType'),
            payload,
          }),
        });
      }
      await refresh();
      setModal(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function retry(id: string) {
    setBusy(true);
    try {
      await api('/deliveries/' + id + '/retry', { method: 'POST', body: '{}' });
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const successful = deliveries.filter((d) => d.status === 'DELIVERED').length,
    failed = deliveries.filter((d) => d.status === 'FAILED').length,
    queued = deliveries.filter((d) => ['QUEUED', 'PROCESSING'].includes(d.status)).length;
  const filtered = deliveries.filter(
    (d) =>
      (filter === 'ALL' || d.status === filter) &&
      (d.eventType + d.endpoint.name + d.id)
        .toLocaleLowerCase('tr')
        .includes(search.toLocaleLowerCase('tr')),
  );
  const detail = deliveries.find((d) => d.id === selected);
  return (
    <Shell
      title="Teslimat merkezi"
      active="Webhook akışı"
      subtitle="Olayı gönder. Sonucu gör. Gerektiğinde yeniden dene."
      actions={
        <>
          <button className="secondary" onClick={() => setModal('endpoint')}>
            <Plus size={17} />
            Hedef ekle
          </button>
          <button
            className="primary"
            disabled={!endpoints.length}
            onClick={() => setModal('event')}
          >
            <Send size={17} />
            Olay gönder
          </button>
        </>
      }
    >
      <Notice error={error} clear={() => setError('')} />
      <div className="stats">
        <Stat
          label="Görünen teslimat"
          value={deliveries.length}
          detail="En son 100 olay"
          icon={<Radio size={18} />}
        />
        <Stat
          label="Teslim edildi"
          value={successful}
          detail="Alıcıdan başarılı yanıt"
          icon={<CheckCircle2 size={18} />}
        />
        <Stat
          label="Kuyrukta / işleniyor"
          value={queued}
          detail="Kalıcı PostgreSQL kuyruğu"
          icon={<Clock3 size={18} />}
        />
        <Stat
          label="Başarısız"
          value={failed}
          detail="İnceleme veya yeniden deneme"
          icon={<TriangleAlert size={18} />}
        />
      </div>
      <div className="hook-grid">
        <section className="surface destinations">
          <div className="section-toolbar">
            <h2>
              <Globe size={18} />
              Hedefler
            </h2>
            <span className="badge">{endpoints.length}</span>
          </div>
          {endpoints.length ? (
            endpoints.map((e) => (
              <div className="endpoint-card" key={e.id}>
                <span className="endpoint-icon">
                  <Globe size={19} />
                </span>
                <div>
                  <strong>{e.name}</strong>
                  <code>{e.url}</code>
                </div>
                <span className="status-light" />
              </div>
            ))
          ) : (
            <Empty>İlk webhook hedefini ekle.</Empty>
          )}
        </section>
        <div className="queue-note">
          <Activity size={25} />
          <span className="eyebrow">GÖRÜNÜR VE DAYANIKLI</span>
          <h2>Bir denemeden fazlası.</h2>
          <p>Geçici hatalarda otomatik tekrar. Her denemede süre, HTTP kodu ve sonuç.</p>
          <span className="live-indicator">
            <span className="status-light" />4 saniyede bir güncellenir
          </span>
        </div>
      </div>
      <section className="surface">
        <div className="section-toolbar">
          <h2>
            Olay akışı <span className="badge">Son 100</span>
          </h2>
          <label className="search">
            <Search size={16} />
            <input
              aria-label="Teslimatlarda ara"
              placeholder="Olay, hedef veya ID ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="tabs">
          {[
            ['ALL', 'Tümü'],
            ['DELIVERED', 'Teslim edildi'],
            ['QUEUED', 'Kuyrukta'],
            ['PROCESSING', 'Gönderiliyor'],
            ['FAILED', 'Başarısız'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'selected' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <Loading />
        ) : !filtered.length ? (
          <Empty>Bu görünümde teslimat yok. Yeni bir olay göndererek başla.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>OLAY</th>
                  <th>HEDEF</th>
                  <th>DURUM</th>
                  <th>DENEME</th>
                  <th>OLUŞTURULDU</th>
                  <th aria-label="Ayrıntı" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong className="mono">{d.eventType}</strong>
                      <small className="mono">{d.id.slice(0, 8)}</small>
                    </td>
                    <td>{d.endpoint.name}</td>
                    <td>
                      <span
                        className={
                          'status-badge ' +
                          (d.status === 'DELIVERED'
                            ? 'success'
                            : d.status === 'FAILED'
                              ? 'warning'
                              : 'neutral')
                        }
                      >
                        {labels[d.status]}
                      </span>
                    </td>
                    <td>
                      <span className="attempt-number">{d.attemptCount}</span>
                    </td>
                    <td className="muted">{time(d.createdAt)}</td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={d.eventType + ' ayrıntıları'}
                        onClick={() => setSelected(d.id)}
                      >
                        <ChevronRight size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="hint">
        <ArrowUpRight size={15} />
        503 döndüren bir alıcıyı denemek için payload içine "simulateFailure": true ekle.
      </div>
      {modal && (
        <Modal
          title={modal === 'endpoint' ? 'Yeni webhook hedefi' : 'Yeni olay gönder'}
          close={() => setModal(null)}
        >
          <Notice error={error} clear={() => setError('')} />
          <form onSubmit={submit}>
            {modal === 'endpoint' ? (
              <>
                <label>
                  Hedef adı
                  <input
                    name="name"
                    maxLength={100}
                    required
                    autoFocus
                    placeholder="Örn. Sipariş servisi"
                  />
                </label>
                <label>
                  Webhook URL
                  <input
                    name="url"
                    type="url"
                    maxLength={500}
                    required
                    defaultValue="http://localhost:4103/api/demo/receiver"
                  />
                </label>
                <p className="form-help">
                  Yalnızca sunucunun WEBHOOK_ALLOWED_ORIGINS listesinde tanımlanan hedeflere
                  gönderim yapılır.
                </p>
              </>
            ) : (
              <>
                <label>
                  Hedef
                  <select name="endpoint">
                    {endpoints.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Olay türü
                  <input
                    name="eventType"
                    required
                    maxLength={80}
                    defaultValue="project.created"
                    pattern={'[a-zA-Z0-9_.\\-]+'}
                  />
                </label>
                <label>
                  Payload (JSON)
                  <textarea
                    name="payload"
                    className="code-input"
                    rows={7}
                    defaultValue={JSON.stringify(
                      { project: 'Portfolyo', message: 'Merhaba dünya!' },
                      null,
                      2,
                    )}
                    required
                  />
                </label>
              </>
            )}
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setModal(null)}>
                Vazgeç
              </button>
              <button className="primary" disabled={busy}>
                {busy ? 'Kaydediliyor…' : modal === 'endpoint' ? 'Hedefi ekle' : 'Kuyruğa ekle'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {detail && (
        <Modal title="Teslimat ayrıntıları" close={() => setSelected(null)}>
          <div className="detail-intro">
            <div>
              <span className="eyebrow">{detail.endpoint.name}</span>
              <h3 className="mono">{detail.eventType}</h3>
              <p>
                {labels[detail.status]} · {detail.attemptCount} deneme
              </p>
            </div>
            {detail.status === 'FAILED' && (
              <button className="secondary" disabled={busy} onClick={() => retry(detail.id)}>
                <RotateCw size={15} />
                Yeniden dene
              </button>
            )}
          </div>
          <div className="id-line">
            <code>{detail.id}</code>
            <button
              className="icon-button"
              aria-label="Teslimat ID kopyala"
              onClick={() =>
                navigator.clipboard.writeText(detail.id).catch((e) => setError(message(e)))
              }
            >
              <Copy size={15} />
            </button>
          </div>
          <h4>Olay verisi</h4>
          <pre>{JSON.stringify(detail.payload, null, 2)}</pre>
          <h4>Deneme geçmişi</h4>
          {!detail.attempts.length ? (
            <p className="muted">İlk deneme bekleniyor.</p>
          ) : (
            detail.attempts.map((a) => (
              <div className="attempt-row" key={a.id}>
                <span className="attempt-number">{a.number}</span>
                <div>
                  <strong>{a.statusCode ? 'HTTP ' + a.statusCode : 'Bağlantı hatası'}</strong>
                  <small>{a.error || 'Başarıyla teslim edildi.'}</small>
                  <small>{time(a.createdAt)}</small>
                </div>
                <span className="mono">{a.durationMs} ms</span>
              </div>
            ))
          )}
        </Modal>
      )}
    </Shell>
  );
}
