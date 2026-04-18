import { Search, SlidersHorizontal, Star } from 'lucide-react';
import type { SubscriptionEntry, UserFilters } from '../types';

interface FilterToolbarProps {
  filters: UserFilters;
  countries: string[];
  subscriptions: SubscriptionEntry[];
  onChange: (patch: Partial<UserFilters>) => void;
}

export function FilterToolbar({ filters, countries, subscriptions, onChange }: FilterToolbarProps): JSX.Element {
  return (
    <div className="filter-toolbar">
      <div className="search-field">
        <Search size={16} />
        <input value={filters.search} onChange={(event) => onChange({ search: event.target.value })} placeholder="Поиск по имени или адресу" />
      </div>
      <div className="filter-toolbar__group">
        <div className="select-field">
          <SlidersHorizontal size={16} />
          <select value={filters.country} onChange={(event) => onChange({ country: event.target.value })}>
            <option value="">Все страны</option>
            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </div>
        <div className="select-field">
          <select value={filters.protocol} onChange={(event) => onChange({ protocol: event.target.value })}>
            <option value="">Все протоколы</option>
            <option value="vless">VLESS</option><option value="vmess">VMess</option><option value="trojan">Trojan</option>
            <option value="shadowsocks">Shadowsocks</option><option value="socks">SOCKS</option><option value="hysteria2">Hysteria2</option>
          </select>
        </div>
        <div className="select-field">
          <select value={filters.subscriptionId} onChange={(event) => onChange({ subscriptionId: event.target.value })}>
            <option value="">Все источники</option>
            <option value="local">Локальные</option>
            {subscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>{subscription.name}</option>)}
          </select>
        </div>
        <div className="select-field">
          <select value={filters.sortBy} onChange={(event) => onChange({ sortBy: event.target.value as UserFilters['sortBy'] })}>
            <option value="latency">Пинг</option><option value="name">Имя</option><option value="country">Страна</option><option value="protocol">Протокол</option>
          </select>
        </div>
        <button type="button" className={`favorite-filter ${filters.favoritesOnly ? 'is-active' : ''}`} onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}>
          <Star size={16} />Избранное
        </button>
      </div>
    </div>
  );
}
