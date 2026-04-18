import type { ConnectionProfile, ShadowsocksDetails } from '../../types';
import { decodeBase64Utf8, isBase64String } from '../../lib/utils';
import { buildBaseProfile, type ParseContext, parsePort } from './common';

function parseUserInfo(encodedPart: string): { method: string; password: string } {
  const decoded = isBase64String(encodedPart) ? decodeBase64Utf8(encodedPart) : encodedPart;
  const [method, password] = decoded.split(':');
  if (!method || password == null) throw new Error('Invalid Shadowsocks credentials');
  return { method, password };
}
export function parseShadowsocksLink(link: string, context: ParseContext): ConnectionProfile {
  const working = link.replace(/^ss:\/\//i, '');
  const [beforeHash, hash] = working.split('#');
  const [mainPart, queryString] = beforeHash.split('?');
  const parts = mainPart.split('@');
  if (parts.length !== 2) throw new Error('Invalid Shadowsocks link');
  const { method, password } = parseUserInfo(parts[0]);
  const [server, portText] = parts[1].split(':');
  const params = new URLSearchParams(queryString ?? '');
  const details: ShadowsocksDetails = { method, password, plugin: params.get('plugin') ?? undefined };
  return buildBaseProfile({ name: decodeURIComponent(hash ?? '') || `SS ${server}`, protocol: 'shadowsocks', server, port: parsePort(portText, 8388), details, rawInput: link, context });
}
export function exportShadowsocksLink(profile: ConnectionProfile): string {
  const details = profile.details as ShadowsocksDetails;
  const userInfo = btoa(`${details.method}:${details.password}`);
  const url = new URL(`ss://${userInfo}@${profile.server}:${profile.port}`);
  if (details.plugin) url.searchParams.set('plugin', details.plugin);
  url.hash = encodeURIComponent(profile.name);
  return url.toString();
}
