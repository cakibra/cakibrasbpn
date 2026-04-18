import type { ConnectionProfile, Hysteria2Details } from '../../types';
import { buildBaseProfile, type ParseContext, parsePort } from './common';

export function parseHysteria2Link(link: string, context: ParseContext): ConnectionProfile {
  const normalized = link.replace(/^hy2:\/\//i, 'hysteria2://');
  const url = new URL(normalized);
  const details: Hysteria2Details = {
    password: decodeURIComponent(url.username || url.searchParams.get('password') || ''),
    obfsType: (url.searchParams.get('obfs') as Hysteria2Details['obfsType']) ?? undefined,
    obfsPassword: url.searchParams.get('obfs-password') ?? undefined,
    tlsEnabled: true,
    tlsServerName: url.searchParams.get('sni') ?? url.hostname,
    tlsInsecure: url.searchParams.get('insecure') === '1'
  };
  return buildBaseProfile({ name: decodeURIComponent(url.hash.replace(/^#/, '')) || `Hysteria2 ${url.hostname}`, protocol: 'hysteria2', server: url.hostname, port: parsePort(url.port, 443), details, rawInput: link, context });
}
export function exportHysteria2Link(profile: ConnectionProfile): string {
  const details = profile.details as Hysteria2Details;
  const url = new URL(`hysteria2://${encodeURIComponent(details.password)}@${profile.server}:${profile.port}`);
  if (details.obfsType) url.searchParams.set('obfs', details.obfsType);
  if (details.obfsPassword) url.searchParams.set('obfs-password', details.obfsPassword);
  if (details.tlsServerName) url.searchParams.set('sni', details.tlsServerName);
  if (details.tlsInsecure) url.searchParams.set('insecure', '1');
  url.hash = encodeURIComponent(profile.name);
  return url.toString();
}
