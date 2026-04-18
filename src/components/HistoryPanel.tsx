import { Clock3 } from 'lucide-react';
import type { ConnectionHistoryEntry } from '../types';
import { EmptyState } from './ui/EmptyState';
import { formatDateTime, formatLatency, protocolLabel } from '../lib/utils';

interface HistoryPanelProps { history: ConnectionHistoryEntry[]; }

export function HistoryPanel({ history }: HistoryPanelProps): JSX.Element {
  if (history.length === 0) return <EmptyState icon={<Clock3 size={24} />} title="История ещё пустая" description="После первого успешного подключения здесь появятся события." />;
  return (
    <div className="stack-list">
      {history.map((entry) => (
        <div key={entry.id} className="panel-card">
          <div className="panel-card__header">
            <div><h3>{entry.profileName}</h3><p>{entry.server} · {protocolLabel(entry.protocol)}</p></div>
            <span className={`history-pill ${entry.success ? 'is-success' : 'is-error'}`}>{entry.success ? 'success' : 'error'}</span>
          </div>
          <div className="panel-card__meta-grid">
            <div><span>Подключено</span><strong>{formatDateTime(entry.connectedAt)}</strong></div>
            <div><span>Отключено</span><strong>{formatDateTime(entry.disconnectedAt)}</strong></div>
            <div><span>Пинг</span><strong>{formatLatency(entry.latencyMs)}</strong></div>
            <div><span>Источник</span><strong>{entry.sourceLabel}</strong></div>
          </div>
        </div>
      ))}
    </div>
  );
}
