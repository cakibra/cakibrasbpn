import { Activity, Heart, Layers3, ShieldCheck } from 'lucide-react';
import type { QuickStats, RuntimeSnapshot } from '../types';
import { cx } from '../lib/utils';

interface TopStatusBarProps {
  stats: QuickStats;
  runtime: RuntimeSnapshot;
  activeProtocolLabel: string;
}

export function TopStatusBar({ stats, runtime, activeProtocolLabel }: TopStatusBarProps): JSX.Element {
  const runtimeClass =
    runtime.status === 'connected'
      ? 'is-connected'
      : runtime.status === 'connecting'
        ? 'is-pending'
        : runtime.status === 'error'
          ? 'is-error'
          : '';
  return (
    <div className="topbar-grid">
      <div className={cx('topbar-card', runtimeClass)}>
        <div className="topbar-card__title"><ShieldCheck size={16} />Runtime</div>
        <div className="topbar-card__value">{runtime.status}</div>
        <div className="topbar-card__meta">{runtime.activeProfileName ?? 'Idle'}</div>
      </div>
      <div className="topbar-card">
        <div className="topbar-card__title"><Layers3 size={16} />Profiles</div>
        <div className="topbar-card__value">{stats.total}</div>
        <div className="topbar-card__meta">{activeProtocolLabel}</div>
      </div>
      <div className="topbar-card">
        <div className="topbar-card__title"><Activity size={16} />Online</div>
        <div className="topbar-card__value">{stats.online}</div>
        <div className="topbar-card__meta">TCP latency tested</div>
      </div>
      <div className="topbar-card">
        <div className="topbar-card__title"><Heart size={16} />Favorites</div>
        <div className="topbar-card__value">{stats.favorites}</div>
        <div className="topbar-card__meta">Pinned configs</div>
      </div>
    </div>
  );
}
