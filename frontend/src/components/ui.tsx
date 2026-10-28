import { useEffect, useRef, useId, type ReactNode } from 'react';
import { X, ArrowUpRight, Layers3 } from 'lucide-react';
export function Shell({
  children,
  title,
  active,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  active: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-icon">
            <Layers3 size={22} />
          </span>
          HookWatch<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="avatar">B</span>
          <div>
            <strong>Portfolyo alanı</strong>
            <small>Kişisel çalışma alanı</small>
          </div>
        </div>
        <span className="nav-label">ÇALIŞMA ALANI</span>
        <nav>
          <a className="nav-item active" href="/">
            <Layers3 size={17} />
            {active}
            <span className="nav-dot" />
          </a>
        </nav>
        <div className="sidebar-bottom">
          <span className="status-light" />
          PostgreSQL + Prisma<small>React · Express · TypeScript</small>
          <a href="https://github.com/hassanbera/hookwatch" target="_blank" rel="noreferrer">
            Kaynak kodu <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Çalışma alanı <span className="crumb">/</span> <strong>{active}</strong>
          </span>
          <span className="topbar-label">
            PORTFOLYO DEMOSU <span className="avatar tiny">B</span>
          </span>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">Her olayın izini sür.</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="heading-actions">{actions}</div>
          </div>
          {children}
          <footer>
            HookWatch <span>Az karmaşa. Daha çok odak.</span>
            <span className="footer-right">Bağımsız bir portfolyo projesi</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Kapat">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Notice({ error, clear }: { error: string; clear: () => void }) {
  return error ? (
    <div className="notice" role="alert">
      {error}
      <button onClick={clear} aria-label="Bildirimi kapat">
        <X size={16} />
      </button>
    </div>
  ) : null;
}
export function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat">
      <span className="stat-label">
        {label}
        <span className="stat-icon">{icon}</span>
      </span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function Loading() {
  return (
    <div className="empty" role="status">
      <span className="spinner" />
      Veriler yükleniyor…
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
