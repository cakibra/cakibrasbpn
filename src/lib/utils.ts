import type {
  ConnectionProfile,
  LanguageCode,
  PersistedAppState,
  ProfileDetails,
  ProfileStatusView,
  ProtocolType,
  AppRouteRule,
} from '../types';

export function createId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}
export function nowIso(): string {
  return new Date().toISOString();
}
export function cx(...items: Array<string | false | null | undefined>): string {
  return items.filter(Boolean).join(' ');
}
export function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}
export function flagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
export function formatLatency(latencyMs?: number | null): string {
  if (latencyMs == null || Number.isNaN(latencyMs)) return '—';
  return `${Math.round(latencyMs)} ms`;
}
export function formatDateTime(value?: string | null, language: LanguageCode = 'ru'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
export function formatDurationFromIso(value?: string | null): string {
  if (!value) return '00:00';
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return '00:00';
  const diff = Math.max(0, Math.floor((Date.now() - started) / 1000));
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
export function compareProfiles(left: ConnectionProfile, right: ConnectionProfile, sortBy: 'latency' | 'name' | 'country' | 'protocol'): number {
  if (sortBy === 'latency') {
    const leftLatency = left.latencyMs ?? Number.MAX_SAFE_INTEGER;
    const rightLatency = right.latencyMs ?? Number.MAX_SAFE_INTEGER;
    if (leftLatency !== rightLatency) return leftLatency - rightLatency;
    return left.name.localeCompare(right.name, 'ru');
  }
  if (sortBy === 'country') return (left.countryName ?? 'zzz').localeCompare(right.countryName ?? 'zzz', 'ru');
  if (sortBy === 'protocol') return left.protocol.localeCompare(right.protocol, 'en');
  return left.name.localeCompare(right.name, 'ru');
}
export function makeSourceLabel(sourceType: 'subscription' | 'local', subscriptionName?: string): string {
  return sourceType === 'subscription'
    ? subscriptionName ? `Subscription · ${subscriptionName}` : 'Subscription'
    : 'Local';
}
export function safeJsonParse<T>(value: string): T | null {
  try { return JSON.parse(value) as T; } catch { return null; }
}
export function isBase64String(input: string): boolean {
  const cleaned = input.trim().replace(/\s+/g, '');
  if (!cleaned || cleaned.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/=]+$/.test(cleaned);
}
export function decodeBase64Utf8(input: string): string {
  return decodeURIComponent(Array.from(atob(input)).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
}
export function ensureProfileDefaults(profile: ConnectionProfile): ConnectionProfile {
  return {
    ...profile,
    favorite: Boolean(profile.favorite),
    statusView: profile.statusView ?? { state: 'unknown' },
    createdAt: profile.createdAt ?? nowIso(),
    updatedAt: profile.updatedAt ?? nowIso()
  };
}

function defaultRouteRules(): AppRouteRule[] {
  return [
    {
      id: 'youtube',
      label: 'YouTube',
      description: 'youtube.com, googlevideo.com, ytimg.com',
      mode: 'proxy',
      enabled: true,
      iconKey: 'youtube',
      blockedInRu: true,
      domains: ['youtube.com', 'youtu.be', 'googlevideo.com', 'ytimg.com']
    },
    {
      id: 'chatgpt',
      label: 'ChatGPT / OpenAI',
      description: 'chatgpt.com, openai.com, oaistatic.com',
      mode: 'proxy',
      enabled: true,
      iconKey: 'chatgpt',
      blockedInRu: false,
      domains: ['chatgpt.com', 'openai.com', 'oaistatic.com', 'oaiusercontent.com']
    },
    {
      id: 'instagram',
      label: 'Instagram',
      description: 'instagram.com, cdninstagram.com',
      mode: 'proxy',
      enabled: false,
      iconKey: 'instagram',
      blockedInRu: true,
      domains: ['instagram.com', 'cdninstagram.com', 'ig.me']
    },
    {
      id: 'facebook',
      label: 'Facebook',
      description: 'facebook.com, fbcdn.net, messenger.com',
      mode: 'proxy',
      enabled: false,
      iconKey: 'facebook',
      blockedInRu: true,
      domains: ['facebook.com', 'fbcdn.net', 'messenger.com']
    },
    {
      id: 'x',
      label: 'X / Twitter',
      description: 'x.com, twitter.com, twimg.com',
      mode: 'proxy',
      enabled: false,
      iconKey: 'x',
      blockedInRu: true,
      domains: ['x.com', 'twitter.com', 'twimg.com']
    },
    {
      id: 'discord',
      label: 'Discord',
      description: 'discord.com, discord.gg, discordapp.net',
      mode: 'proxy',
      enabled: false,
      iconKey: 'discord',
      blockedInRu: true,
      domains: ['discord.com', 'discord.gg', 'discordapp.net', 'discordapp.com']
    },
    {
      id: 'signal',
      label: 'Signal',
      description: 'signal.org, updates.signal.org',
      mode: 'proxy',
      enabled: false,
      iconKey: 'signal',
      blockedInRu: true,
      domains: ['signal.org', 'updates.signal.org', 'cdn.signal.org']
    },
    {
      id: 'wikipedia',
      label: 'Wikipedia',
      description: 'wikipedia.org, wikimedia.org',
      mode: 'proxy',
      enabled: false,
      iconKey: 'wikipedia',
      blockedInRu: true,
      domains: ['wikipedia.org', 'wikimedia.org', 'mediawiki.org']
    },
    {
      id: 'speedtest',
      label: 'Speedtest / Ookla',
      description: 'speedtest.net, ooklaserver.net',
      mode: 'proxy',
      enabled: false,
      iconKey: 'speedtest',
      blockedInRu: true,
      domains: ['speedtest.net', 'ooklaserver.net']
    },
  ];
}

export function defaultPersistedState(): PersistedAppState {
  return {
    profiles: [],
    subscriptions: [],
    settings: {
      theme: 'dark',
      language: 'ru',
      accentPreset: 'carbon',
      animationsEnabled: true,
      autoUpdateSubscriptions: true,
      autoUpdateIntervalMinutes: 30,
      pingTimeoutMs: 1800,
      defaultSort: 'latency',
      localProxyPort: 2080,
      enableSystemProxy: true,
      autoReconnect: true,
      launchOnWindowsStartup: false,
      routingMode: 'split',
      tunEnabled: false,
      routeRules: defaultRouteRules()
    },
    history: [],
    favorites: []
  };
}
export function mergePersistedState(payload: Partial<PersistedAppState> | null | undefined): PersistedAppState {
  const defaults = defaultPersistedState();
  return {
    profiles: (payload?.profiles ?? defaults.profiles).map(ensureProfileDefaults),
    subscriptions: payload?.subscriptions ?? defaults.subscriptions,
    settings: { ...defaults.settings, ...(payload?.settings ?? {}), routeRules: payload?.settings?.routeRules ?? defaults.settings.routeRules },
    history: payload?.history ?? defaults.history,
    favorites: payload?.favorites ?? defaults.favorites,
    lastSelectedProfileId: payload?.lastSelectedProfileId ?? defaults.lastSelectedProfileId
  };
}
export function protocolLabel(protocol: ProtocolType): string {
  return ({
    vless: 'VLESS', vmess: 'VMess', trojan: 'Trojan',
    shadowsocks: 'Shadowsocks', socks: 'SOCKS', hysteria2: 'Hysteria2', custom: 'Custom'
  } as const)[protocol];
}
export function detailsToPrettyJson(details: ProfileDetails): string {
  return JSON.stringify(details, null, 2);
}
export function textFileDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
export function detectStatus(latencyMs?: number | null, activeProfileId?: string | null, profileId?: string): ProfileStatusView {
  if (activeProfileId && profileId && activeProfileId === profileId) return { state: 'connected', label: 'Connected' };
  if (latencyMs != null) return { state: 'online', label: 'Online' };
  return { state: 'unknown', label: 'Unknown' };
}
