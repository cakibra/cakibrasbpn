import { invoke } from '@tauri-apps/api/core';
import type {
  AppSettings, ConnectionProfile, GeoLookupResult, PersistedAppState,
  PingResult, PingTarget, RuntimeSnapshot, SubscriptionFetchResponse
} from '../types';

export async function loadAppState(): Promise<PersistedAppState | null> {
  return invoke<PersistedAppState | null>('load_app_state');
}
export async function saveAppState(state: PersistedAppState): Promise<void> {
  await invoke('save_app_state', { state });
}
export async function downloadSubscription(args: { url: string; etag?: string; lastModified?: string; timeoutMs: number; }): Promise<SubscriptionFetchResponse> {
  return invoke('download_subscription', { request: { url: args.url, etag: args.etag ?? null, lastModified: args.lastModified ?? null, timeoutMs: args.timeoutMs } });
}
export async function testProfiles(targets: PingTarget[], timeoutMs: number): Promise<PingResult[]> {
  return invoke('test_profiles', { targets, timeoutMs });
}
export async function quickTest(target: PingTarget, timeoutMs: number): Promise<PingResult> {
  return invoke('quick_test', { target, timeoutMs });
}
export async function resolveGeo(server: string): Promise<GeoLookupResult> {
  return invoke('resolve_geo', { server });
}
export async function connectProfile(profile: ConnectionProfile, settings: AppSettings): Promise<RuntimeSnapshot> {
  return invoke('connect_profile', {
    request: {
      profile,
      settings: {
        localProxyPort: settings.localProxyPort,
        enableSystemProxy: settings.enableSystemProxy,
        autoReconnect: settings.autoReconnect,
        routingMode: settings.routingMode,
        tunEnabled: settings.tunEnabled,
        routeRules: settings.routeRules
      }
    }
  });
}
export async function disconnectProfile(): Promise<RuntimeSnapshot> {
  return invoke('disconnect_profile');
}
export async function getConnectionSnapshot(): Promise<RuntimeSnapshot> {
  return invoke('get_connection_snapshot');
}
export async function setAutostart(enabled: boolean): Promise<boolean> {
  return invoke('set_autostart', { enabled });
}
