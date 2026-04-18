export type ThemeMode = 'dark' | 'light' | 'system';
export type LanguageCode = 'ru' | 'en';
export type AccentPreset = 'ember' | 'carbon' | 'frost';
export type ProtocolType = 'vless' | 'vmess' | 'trojan' | 'shadowsocks' | 'socks' | 'hysteria2' | 'custom';
export type SourceType = 'subscription' | 'local';
export type RuntimeStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';
export type RoutingMode = 'global' | 'split';

export interface ProfileStatusView {
  state: 'online' | 'offline' | 'checking' | 'connected' | 'unknown';
  label?: string;
}

export interface BaseProfileDetails {
  transportType?: 'tcp' | 'ws' | 'grpc' | 'httpupgrade';
  host?: string;
  path?: string;
  serviceName?: string;
  headers?: Record<string, string>;
  tlsEnabled?: boolean;
  tlsServerName?: string;
  tlsInsecure?: boolean;
  alpn?: string[];
  fingerprint?: string;
  security?: 'none' | 'tls' | 'reality';
  realityPublicKey?: string;
  realityShortId?: string;
  realitySpiderX?: string;
}

export interface VlessDetails extends BaseProfileDetails {
  uuid: string;
  flow?: string;
  encryption?: string;
  packetEncoding?: 'xudp' | 'packetaddr' | 'none';
}

export interface VmessDetails extends Omit<BaseProfileDetails, 'security'> {
  uuid: string;
  alterId?: number;
  security?: string;
}

export interface TrojanDetails extends BaseProfileDetails {
  password: string;
}

export interface ShadowsocksDetails extends BaseProfileDetails {
  method: string;
  password: string;
  plugin?: string;
  pluginOpts?: string;
}

export interface SocksDetails extends BaseProfileDetails {
  username?: string;
  password?: string;
  version?: '4' | '5';
}

export interface Hysteria2Details extends BaseProfileDetails {
  password: string;
  obfsType?: 'salamander';
  obfsPassword?: string;
}

export interface CustomDetails {
  rawConfigJson: string;
}

export type ProfileDetails =
  | VlessDetails
  | VmessDetails
  | TrojanDetails
  | ShadowsocksDetails
  | SocksDetails
  | Hysteria2Details
  | CustomDetails
  | Record<string, unknown>;

export interface ConnectionProfile {
  id: string;
  name: string;
  protocol: ProtocolType;
  server: string;
  port: number;
  sourceType: SourceType;
  subscriptionId?: string;
  sourceLabel: string;
  favorite: boolean;
  latencyMs?: number | null;
  countryCode?: string | null;
  countryName?: string | null;
  lastCheckedAt?: string | null;
  lastSuccessfulTestAt?: string | null;
  statusView: ProfileStatusView;
  details: ProfileDetails;
  rawInput?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionEntry {
  id: string;
  name: string;
  url: string;
  autoUpdate: boolean;
  cacheRaw?: string;
  lastUpdatedAt?: string;
  lastError?: string;
  etag?: string;
  lastModified?: string;
  profileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionHistoryEntry {
  id: string;
  profileId: string;
  profileName: string;
  protocol: ProtocolType;
  server: string;
  connectedAt: string;
  disconnectedAt?: string;
  latencyMs?: number | null;
  success: boolean;
  sourceLabel: string;
}

export interface AppRouteRule {
  id: string;
  label: string;
  mode: 'proxy' | 'direct';
  domains: string[];
  enabled: boolean;
  iconKey?: string;
  description?: string;
  blockedInRu?: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  language: LanguageCode;
  accentPreset: AccentPreset;
  animationsEnabled: boolean;
  autoUpdateSubscriptions: boolean;
  autoUpdateIntervalMinutes: number;
  pingTimeoutMs: number;
  defaultSort: 'latency' | 'name' | 'country' | 'protocol';
  localProxyPort: number;
  enableSystemProxy: boolean;
  autoReconnect: boolean;
  launchOnWindowsStartup: boolean;
  routingMode: RoutingMode;
  tunEnabled: boolean;
  routeRules: AppRouteRule[];
}

export interface UserFilters {
  search: string;
  country: string;
  protocol: string;
  subscriptionId: string;
  favoritesOnly: boolean;
  sortBy: AppSettings['defaultSort'];
}

export interface RuntimeSnapshot {
  status: RuntimeStatus;
  activeProfileId?: string | null;
  activeProfileName?: string | null;
  protocol?: string | null;
  server?: string | null;
  localProxyPort?: number | null;
  pid?: number | null;
  connectedAt?: string | null;
  lastError?: string | null;
  autoReconnect?: boolean;
  systemProxyEnabled?: boolean;
}

export interface PersistedAppState {
  profiles: ConnectionProfile[];
  subscriptions: SubscriptionEntry[];
  settings: AppSettings;
  history: ConnectionHistoryEntry[];
  favorites: string[];
  lastSelectedProfileId?: string;
}

export interface SubscriptionFetchResponse {
  statusCode: number;
  finalUrl?: string | null;
  content?: string | null;
  notModified: boolean;
  etag?: string | null;
  lastModified?: string | null;
  error?: string | null;
}

export interface PingTarget {
  id: string;
  server: string;
  port: number;
}

export interface PingResult {
  id: string;
  latencyMs?: number | null;
  online: boolean;
  checkedAt: string;
  error?: string | null;
}

export interface GeoLookupResult {
  server: string;
  countryCode?: string | null;
  countryName?: string | null;
  resolvedIp?: string | null;
  error?: string | null;
}

export interface QuickStats {
  total: number;
  favorites: number;
  online: number;
  byProtocol: Record<string, number>;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  kind?: 'success' | 'error' | 'info';
}

export interface ImportPayload {
  mode: 'clipboard' | 'link' | 'file' | 'manual';
  content: string;
  fileName?: string;
}

export interface EditorSubmitPayload {
  mode: 'create' | 'update';
  profile: ConnectionProfile;
}

export interface SubscriptionSubmitPayload {
  name: string;
  url: string;
  autoUpdate: boolean;
}
