import type { ConnectionProfile, VmessDetails } from '../../types';
import { decodeBase64Utf8, isBase64String, safeJsonParse } from '../../lib/utils';
import { buildBaseProfile, type ParseContext, parsePort } from './common';

type VmessPayload = {
  add?: string;
  port?: string | number;
  id?: string;
  aid?: string | number;
  scy?: string;
  host?: string;
  path?: string;
  ps?: string;
  tls?: string;
  sni?: string;
  net?: string;
};

export function parseVmessLink(link: string, context: ParseContext): ConnectionProfile {
  const encoded = link.replace(/^vmess:\/\//i, '').trim();
  const decoded = isBase64String(encoded) ? decodeBase64Utf8(encoded) : encoded;
  const payload = safeJsonParse<VmessPayload>(decoded);
  if (!payload?.add || !payload.id) throw new Error('Invalid VMess link');
  const details: VmessDetails = {
    uuid: payload.id,
    alterId: Number(payload.aid ?? 0),
    security: payload.scy ?? 'auto',
    transportType: (payload.net as VmessDetails['transportType']) ?? 'tcp',
    host: payload.host ?? undefined,
    path: payload.path ?? undefined,
    tlsEnabled: payload.tls === 'tls',
    tlsServerName: payload.sni ?? payload.add
  };
  return buildBaseProfile({ name: payload.ps ?? `VMess ${payload.add}`, protocol: 'vmess', server: payload.add, port: parsePort(payload.port, 443), details, rawInput: link, context });
}

export function exportVmessLink(profile: ConnectionProfile): string {
  const details = profile.details as VmessDetails;
  const payload: VmessPayload = {
    add: profile.server, port: profile.port, id: details.uuid, aid: details.alterId ?? 0, scy: details.security ?? 'auto',
    net: details.transportType ?? 'tcp', host: details.host, path: details.path, ps: profile.name,
    tls: details.tlsEnabled ? 'tls' : '', sni: details.tlsServerName
  };
  return `vmess://${btoa(JSON.stringify(payload))}`;
}
