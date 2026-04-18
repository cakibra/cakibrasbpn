import { RadioTower, RefreshCcw, Trash2 } from 'lucide-react';
import type { SubscriptionEntry } from '../types';
import { EmptyState } from './ui/EmptyState';
import { formatDateTime } from '../lib/utils';

interface SubscriptionPanelProps {
  subscriptions: SubscriptionEntry[];
  onAdd: () => void;
  onRefresh: (subscriptionId: string) => void;
  onDelete: (subscriptionId: string) => void;
}

export function SubscriptionPanel({ subscriptions, onAdd, onRefresh, onDelete }: SubscriptionPanelProps): JSX.Element {
  if (subscriptions.length === 0) {
    return <EmptyState icon={<RadioTower size={24} />} title="Подписок пока нет" description="Добавьте subscription URL и обновляйте все серверы из одного источника." action={<button type="button" className="primary-button" onClick={onAdd}>Добавить подписку</button>} />;
  }
  return (
    <div className="stack-list">
      {subscriptions.map((subscription) => (
        <div className="panel-card" key={subscription.id}>
          <div className="panel-card__header">
            <div>
              <h3>{subscription.name}</h3>
              <p>{subscription.url}</p>
            </div>
            <div className="panel-card__actions">
              <button className="secondary-button secondary-button--small" type="button" onClick={() => onRefresh(subscription.id)}>
                <RefreshCcw size={16} />Обновить
              </button>
              <button className="icon-button" type="button" onClick={() => onDelete(subscription.id)}><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="panel-card__meta-grid">
            <div><span>Профилей</span><strong>{subscription.profileIds.length}</strong></div>
            <div><span>Последнее обновление</span><strong>{formatDateTime(subscription.lastUpdatedAt)}</strong></div>
            <div><span>Автообновление</span><strong>{subscription.autoUpdate ? 'Вкл' : 'Выкл'}</strong></div>
            <div><span>Ошибка</span><strong>{subscription.lastError ?? '—'}</strong></div>
          </div>
        </div>
      ))}
    </div>
  );
}
