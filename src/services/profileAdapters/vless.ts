import type { ConnectionProfile, VlessDetails } from '../../types';
import { buildBaseProfile, type ParseContext, parsePort } from './common';

function parseAlpn(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const values = raw.split(',').map((item) => item.trim()).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function decodeMaybe(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseVlessLink(link: string, context: ParseContext): ConnectionProfile {
  const url = new URL(link);
  const security = (url.searchParams.get('security') ?? 'none') as VlessDetails['security'];
  const type = (url.searchParams.get('type') as VlessDetails['transportType']) ?? 'tcp';
  const host = decodeMaybe(url.searchParams.get('host')) ?? decodeMaybe(url.searchParams.get('sni')) ?? undefined;
  const details: VlessDetails = {
    uuid: decodeURIComponent(url.username),
    flow: url.searchParams.get('flow') ?? undefined,
    encryption: url.searchParams.get('encryption') ?? 'none',
    transportType: type,
    host,
    path: decodeMaybe(url.searchParams.get('path')) ?? undefined,
    serviceName: decodeMaybe(url.searchParams.get('serviceName') ?? url.searchParams.get('service_name')) ?? undefined,
    tlsEnabled: security !== 'none',
    security,
    tlsServerName: decodeMaybe(url.searchParams.get('sni')) ?? host ?? url.hostname,
    tlsInsecure: ['1', 'true'].includes((url.searchParams.get('allowInsecure') ?? '').toLowerCase()),
    alpn: parseAlpn(url.searchParams.get('alpn')),
    fingerprint: url.searchParams.get('fp') ?? undefined,
    realityPublicKey: url.searchParams.get('pbk') ?? undefined,
    realityShortId: url.searchParams.get('sid') ?? undefined,
    realitySpiderX: decodeMaybe(url.searchParams.get('spx')) ?? undefined,
    packetEncoding: (url.searchParams.get('packetEncoding') as VlessDetails['packetEncoding']) ?? 'xudp'
  };

  const name = decodeURIComponent(url.hash.replace(/^#/, '')) || `VLESS ${url.hostname}`;
  return buildBaseProfile({ name, protocol: 'vless', server: url.hostname, port: parsePort(url.port, 443), details, rawInput: link, context });
}

export function exportVlessLink(profile: ConnectionProfile): string {
  const details = profile.details as VlessDetails;
  const url = new URL(`vless://${encodeURIComponent(details.uuid)}@${profile.server}:${profile.port}`);
  const security = details.security ?? (details.tlsEnabled ? (details.realityPublicKey ? 'reality' : 'tls') : 'none');
  url.searchParams.set('type', details.transportType ?? 'tcp');
  url.searchParams.set('security', security);
  url.searchParams.set('encryption', details.encryption ?? 'none');
  if (details.flow) url.searchParams.set('flow', details.flow);
  if (details.host) url.searchParams.set('host', details.host);
  if (details.path) url.searchParams.set('path', details.path);
  if (details.serviceName) url.searchParams.set('serviceName', details.serviceName);
  if (details.tlsServerName) url.searchParams.set('sni', details.tlsServerName);
  if (details.tlsInsecure) url.searchParams.set('allowInsecure', '1');
  if (details.alpn?.length) url.searchParams.set('alpn', details.alpn.join(','));
  if (details.fingerprint) url.searchParams.set('fp', details.fingerprint);
  if (details.realityPublicKey) url.searchParams.set('pbk', details.realityPublicKey);
  if (details.realityShortId) url.searchParams.set('sid', details.realityShortId);
  if (details.realitySpiderX) url.searchParams.set('spx', details.realitySpiderX);
  if (details.packetEncoding && details.packetEncoding !== 'none') url.searchParams.set('packetEncoding', details.packetEncoding);
  url.hash = encodeURIComponent(profile.name);
  return url.toString();
}
