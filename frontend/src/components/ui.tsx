import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import {
  Button,
  ActionIcon,
  TextInput,
  Textarea,
  NativeSelect,
  Modal as MantineModal,
  Alert,
  Paper,
  Loader,
  Badge,
} from '@mantine/core';
import { Radio, Activity, X } from 'lucide-react';
export function UiButton({
  className = '',
  type = 'submit',
  color: _color,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  if (className.includes('icon-button'))
    return <ActionIcon type={type} className={className} variant="subtle" size="lg" {...props} />;
  return (
    <Button
      type={type}
      className={className}
      variant={
        className.includes('primary') || className.includes('selected')
          ? 'filled'
          : className.includes('secondary')
            ? 'outline'
            : 'subtle'
      }
      color={className.includes('danger') ? 'red' : 'cyan'}
      {...props}
    />
  );
}
export function UiInput({
  size: _size,
  color: _color,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput {...props} />;
}
export function UiTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Textarea minRows={4} {...props} />;
}
export function UiSelect({
  size: _size,
  color: _color,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <NativeSelect {...props} />;
}
export function Shell({
  children,
  title,
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
    <div className="hookwatch-workspace">
      <aside className="operations-nav">
        <a href="/" className="operations-brand">
          <Radio />
          HookWatch
        </a>
        <a className="operations-active" href="/">
          <Activity size={18} />
          Teslimatlar
        </a>
        <div className="operations-note">
          Webhook teslimatları
          <br />
          Kuyruk ve deneme geçmişi
        </div>
      </aside>
      <div className="operations-content">
        <header className="operations-header">
          <span>Entegrasyonlar / Teslimatlar</span>
          <Badge variant="light" color="cyan">
            Canlı akış
          </Badge>
        </header>
        <main className="operations-main">
          <div className="page-heading">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="heading-actions">{actions}</div>
          </div>
          {children}
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
  return (
    <MantineModal opened onClose={close} title={title} size="lg" centered>
      {children}
    </MantineModal>
  );
}
export function Notice({ error, clear }: { error: string; clear: () => void }) {
  return error ? (
    <Alert color="red" title="İşlem tamamlanamadı" withCloseButton onClose={clear}>
      {error}
    </Alert>
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
    <Paper withBorder className="stat">
      <span className="stat-label">
        {icon}
        {label}
      </span>
      <strong className="stat-value">{value}</strong>
      <small className="stat-detail">{detail}</small>
    </Paper>
  );
}
export function Loading() {
  return (
    <div className="empty" role="status">
      <Loader size="sm" />
      Teslimatlar yükleniyor…
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
