import type { ConnectionProfile, SocksDetails } from '../../types';
import { buildBaseProfile, type ParseContext, parsePort } from './common';

export function parseSocksLink(link: string, context: ParseContext): ConnectionProfile {
  const url = new URL(link);
  const details: SocksDetails = { username: decodeURIComponent(url.username || ''), password: decodeURIComponent(url.password || ''), version: '5' };
  return buildBaseProfile({ name: decodeURIComponent(url.hash.replace(/^#/, '')) || `SOCKS ${url.hostname}`, protocol: 'socks', server: url.hostname, port: parsePort(url.port, 1080), details, rawInput: link, context });
}
export function exportSocksLink(profile: ConnectionProfile): string {
  const details = profile.details as SocksDetails;
  const auth = details.username != null && details.username !== '' ? `${encodeURIComponent(details.username)}:${encodeURIComponent(details.password ?? '')}@` : '';
  return `socks5://${auth}${profile.server}:${profile.port}#${encodeURIComponent(profile.name)}`;
}
