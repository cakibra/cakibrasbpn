import { Box, PlusCircle } from 'lucide-react';
import type { ConnectionProfile, RuntimeSnapshot, SubscriptionEntry } from '../types';
import { EmptyState } from './ui/EmptyState';
import { ServerCard } from './ServerCard';

interface ServerListProps {
  profiles: ConnectionProfile[];
  subscriptions: SubscriptionEntry[];
  runtime: RuntimeSnapshot;
  selectedProfileId?: string;
  onSelect?: (profileId: string) => void;
  onConnect: (profile: ConnectionProfile) => void;
  onToggleFavorite: (profileId: string) => void;
  onEdit: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onExport: (profile: ConnectionProfile) => void;
  onCreateProfile: () => void;
}

export function ServerList({ profiles, runtime, selectedProfileId, onSelect, onConnect, onToggleFavorite, onEdit, onDelete, onExport, onCreateProfile }: ServerListProps): JSX.Element {
  if (profiles.length === 0) {
    return <EmptyState icon={<Box size={24} />} title="Пока нет профилей" description="Импортируйте конфиг, добавьте подписку или создайте профиль вручную." action={<button type="button" className="primary-button" onClick={onCreateProfile}><PlusCircle size={16} />Создать профиль</button>} />;
  }

  return (
    <div className="server-list-rows">
      {profiles.map((profile) => (
        <ServerCard
          key={profile.id}
          profile={profile}
          runtime={runtime}
          selected={profile.id === selectedProfileId}
          onSelect={onSelect}
          onConnect={onConnect}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
          onExport={onExport}
        />
      ))}
    </div>
  );
}
