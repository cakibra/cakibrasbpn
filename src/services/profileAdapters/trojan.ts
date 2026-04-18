import type { ConnectionProfile, TrojanDetails } from '../../types';
import { buildBaseProfile, type ParseContext, parsePort } from './common';

export function parseTrojanLink(link: string, context: ParseContext): ConnectionProfile {
  const url = new URL(link);
  const details: TrojanDetails = {
    password: decodeURIComponent(url.username),
    transportType: (url.searchParams.get('type') as TrojanDetails['transportType']) ?? 'tcp',
    host: url.searchParams.get('host') ?? undefined,
    path: url.searchParams.get('path') ?? undefined,
    serviceName: url.searchParams.get('serviceName') ?? undefined,
    tlsEnabled: true,
    tlsServerName: url.searchParams.get('sni') ?? url.hostname,
    tlsInsecure: url.searchParams.get('allowInsecure') === '1'
  };
  return buildBaseProfile({ name: decodeURIComponent(url.hash.replace(/^#/, '')) || `Trojan ${url.hostname}`, protocol: 'trojan', server: url.hostname, port: parsePort(url.port, 443), details, rawInput: link, context });
}
export function exportTrojanLink(profile: ConnectionProfile): string {
  const details = profile.details as TrojanDetails;
  const url = new URL(`trojan://${encodeURIComponent(details.password)}@${profile.server}:${profile.port}`);
  url.searchParams.set('type', details.transportType ?? 'tcp');
  if (details.host) url.searchParams.set('host', details.host);
  if (details.path) url.searchParams.set('path', details.path);
  if (details.serviceName) url.searchParams.set('serviceName', details.serviceName);
  if (details.tlsServerName) url.searchParams.set('sni', details.tlsServerName);
  if (details.tlsInsecure) url.searchParams.set('allowInsecure', '1');
  url.hash = encodeURIComponent(profile.name);
  return url.toString();
}
