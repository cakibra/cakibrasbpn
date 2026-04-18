import { Heart, Pencil, PlugZap, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import type { ConnectionProfile, RuntimeSnapshot } from '../types';
import { cx, flagEmoji, formatLatency, protocolLabel } from '../lib/utils';

interface ServerCardProps {
  profile: ConnectionProfile;
  runtime: RuntimeSnapshot;
  selected?: boolean;
  onSelect?: (profileId: string) => void;
  onConnect: (profile: ConnectionProfile) => void;
  onToggleFavorite: (profileId: string) => void;
  onEdit: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onExport: (profile: ConnectionProfile) => void;
}

export function ServerCard({ profile, runtime, selected, onSelect, onConnect, onToggleFavorite, onEdit, onDelete, onExport }: ServerCardProps): JSX.Element {
  const active = runtime.activeProfileId === profile.id;
  const disabled = runtime.status === 'connecting' || runtime.status === 'disconnecting';

  return (
    <article className={cx('server-row-card', selected && 'is-selected', active && 'is-active')} onClick={() => onSelect?.(profile.id)}>
      <div className="server-row-card__marker" />
      <div className="server-row-card__flag">{(profile.countryCode ?? 'UN').toUpperCase()}</div>
      <div className="server-row-card__main">
        <div className="server-row-card__title">{profile.name}</div>
        <div className="server-row-card__meta">{protocolLabel(profile.protocol)} | {profile.countryName ?? flagEmoji(profile.countryCode)} | {profile.server}:{profile.port}</div>
      </div>
      <div className="server-row-card__latency">{formatLatency(profile.latencyMs)}</div>
      <div className="server-row-card__actions">
        <button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); onToggleFavorite(profile.id); }}><Heart size={15} /></button>
        <button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); onEdit(profile.id); }}><Pencil size={15} /></button>
        <button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); onExport(profile); }}><SquareArrowOutUpRight size={15} /></button>
        <button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); onDelete(profile.id); }}><Trash2 size={15} /></button>
        <button type="button" className={cx('server-row-card__connect', active && 'is-active')} disabled={disabled} onClick={(event) => { event.stopPropagation(); onConnect(profile); }}>
          <PlugZap size={14} /> {active ? 'Активен' : 'Подключить'}
        </button>
      </div>
    </article>
  );
}
