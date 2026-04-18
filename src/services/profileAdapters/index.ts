import type { ConnectionProfile } from '../../types';
import { decodeBase64Utf8, isBase64String, safeJsonParse } from '../../lib/utils';
import { buildBaseProfile, type ParseContext, parsePort } from './common';
import { exportHysteria2Link, parseHysteria2Link } from './hysteria2';
import { exportShadowsocksLink, parseShadowsocksLink } from './shadowsocks';
import { exportSocksLink, parseSocksLink } from './socks';
import { exportTrojanLink, parseTrojanLink } from './trojan';
import { exportVlessLink, parseVlessLink } from './vless';
import { exportVmessLink, parseVmessLink } from './vmess';

type ClashProxyRecord = Record<string, unknown> & {
  name?: string; type?: string; server?: string; port?: number | string; uuid?: string;
  password?: string; cipher?: string; tls?: boolean; sni?: string; network?: string; wsPath?: string; wsHeaders?: Record<string, string>;
};

function parseClashProxy(proxy: ClashProxyRecord, context: ParseContext): ConnectionProfile | null {
  if (!proxy.type || !proxy.server || !proxy.port) return null;
  const type = String(proxy.type).toLowerCase();
  const name = String(proxy.name ?? `${type.toUpperCase()} ${proxy.server}`);
  if (type === 'vless' && proxy.uuid) return buildBaseProfile({ name, protocol: 'vless', server: String(proxy.server), port: parsePort(proxy.port, 443), details: { uuid: String(proxy.uuid), transportType: (proxy.network as string) === 'ws' ? 'ws' : 'tcp', path: String(proxy.wsPath ?? ''), host: typeof proxy.wsHeaders === 'object' && proxy.wsHeaders ? String((proxy.wsHeaders as Record<string, string>).Host ?? '') : undefined, tlsEnabled: Boolean(proxy.tls), security: proxy.tls ? 'tls' : 'none', tlsServerName: String(proxy.sni ?? proxy.server), alpn: typeof proxy.alpn === 'string' ? String(proxy.alpn).split(',').map((v) => v.trim()).filter(Boolean) : undefined }, context });
  if (type === 'vmess' && proxy.uuid) return buildBaseProfile({ name, protocol: 'vmess', server: String(proxy.server), port: parsePort(proxy.port, 443), details: { uuid: String(proxy.uuid), transportType: (proxy.network as string) === 'ws' ? 'ws' : 'tcp', tlsEnabled: Boolean(proxy.tls), security: proxy.tls ? 'tls' : 'none', tlsServerName: String(proxy.sni ?? proxy.server), alpn: typeof proxy.alpn === 'string' ? String(proxy.alpn).split(',').map((v) => v.trim()).filter(Boolean) : undefined }, context });
  if (type === 'trojan' && proxy.password) return buildBaseProfile({ name, protocol: 'trojan', server: String(proxy.server), port: parsePort(proxy.port, 443), details: { password: String(proxy.password), tlsEnabled: true, security: proxy.tls ? 'tls' : 'none', tlsServerName: String(proxy.sni ?? proxy.server), alpn: typeof proxy.alpn === 'string' ? String(proxy.alpn).split(',').map((v) => v.trim()).filter(Boolean) : undefined }, context });
  if ((type === 'ss' || type === 'shadowsocks') && proxy.password && proxy.cipher) return buildBaseProfile({ name, protocol: 'shadowsocks', server: String(proxy.server), port: parsePort(proxy.port, 8388), details: { method: String(proxy.cipher), password: String(proxy.password) }, context });
  if (type === 'socks5' || type === 'socks') return buildBaseProfile({ name, protocol: 'socks', server: String(proxy.server), port: parsePort(proxy.port, 1080), details: { username: proxy.username ? String(proxy.username) : undefined, password: proxy.password ? String(proxy.password) : undefined, version: '5' }, context });
  if ((type === 'hy2' || type === 'hysteria2') && proxy.password) return buildBaseProfile({ name, protocol: 'hysteria2', server: String(proxy.server), port: parsePort(proxy.port, 443), details: { password: String(proxy.password), tlsEnabled: true, security: proxy.tls ? 'tls' : 'none', tlsServerName: String(proxy.sni ?? proxy.server), alpn: typeof proxy.alpn === 'string' ? String(proxy.alpn).split(',').map((v) => v.trim()).filter(Boolean) : undefined }, context });
  return null;
}

function parseSingBoxOutbound(outbound: Record<string, unknown>, context: ParseContext): ConnectionProfile | null {
  const type = String(outbound.type ?? '').toLowerCase();
  const server = String(outbound.server ?? '');
  const port = parsePort(outbound.server_port as string | number | undefined, 443);
  const name = String(outbound.tag ?? `${type.toUpperCase()} ${server}`);
  if (!type || !server) return null;
  if (type === 'vless' && outbound.uuid) return buildBaseProfile({ name, protocol: 'vless', server, port, details: { uuid: String(outbound.uuid), flow: outbound.flow ? String(outbound.flow) : undefined, tlsEnabled: Boolean(outbound.tls), security: typeof outbound.tls === 'object' && outbound.tls && typeof (outbound.tls as Record<string, unknown>).reality === 'object' ? 'reality' : 'tls', tlsServerName: typeof outbound.tls === 'object' && outbound.tls ? String((outbound.tls as Record<string, unknown>).server_name ?? server) : server, fingerprint: typeof outbound.tls === 'object' && outbound.tls && typeof (outbound.tls as Record<string, unknown>).utls === 'object' ? String(((outbound.tls as Record<string, unknown>).utls as Record<string, unknown>).fingerprint ?? '') || undefined : undefined }, context });
  if (type === 'vmess' && outbound.uuid) return buildBaseProfile({ name, protocol: 'vmess', server, port, details: { uuid: String(outbound.uuid), security: String(outbound.security ?? 'auto'), tlsEnabled: Boolean(outbound.tls) }, context });
  if (type === 'trojan' && outbound.password) return buildBaseProfile({ name, protocol: 'trojan', server, port, details: { password: String(outbound.password), tlsEnabled: Boolean(outbound.tls) }, context });
  if (type === 'shadowsocks' && outbound.password && outbound.method) return buildBaseProfile({ name, protocol: 'shadowsocks', server, port, details: { password: String(outbound.password), method: String(outbound.method) }, context });
  if (type === 'socks') return buildBaseProfile({ name, protocol: 'socks', server, port, details: { username: outbound.username ? String(outbound.username) : undefined, password: outbound.password ? String(outbound.password) : undefined, version: '5' }, context });
  if (type === 'hysteria2' && outbound.password) return buildBaseProfile({ name, protocol: 'hysteria2', server, port, details: { password: String(outbound.password), tlsEnabled: Boolean(outbound.tls) }, context });
  return null;
}

export function parseProfileText(rawInput: string, context: ParseContext): ConnectionProfile[] {
  const trimmed = rawInput.trim();
  if (!trimmed) return [];
  const lines = trimmed.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean);
  const normalizedPayload = lines.length === 1 && isBase64String(lines[0]) && !lines[0].includes('://') ? decodeBase64Utf8(lines[0]) : trimmed;
  const json = safeJsonParse<unknown>(normalizedPayload);
  if (json && typeof json === 'object') {
    const result: ConnectionProfile[] = [];
    if (Array.isArray((json as Record<string, unknown>).proxies)) {
      for (const proxy of (json as Record<string, unknown>).proxies as ClashProxyRecord[]) {
        const parsed = parseClashProxy(proxy, context); if (parsed) result.push(parsed);
      }
      if (result.length > 0) return result;
    }
    if (Array.isArray((json as Record<string, unknown>).outbounds)) {
      for (const outbound of (json as Record<string, unknown>).outbounds as Record<string, unknown>[]) {
        const parsed = parseSingBoxOutbound(outbound, context); if (parsed) result.push(parsed);
      }
      if (result.length > 0) return result;
    }
    if (Array.isArray(json)) {
      for (const item of json) {
        if (typeof item === 'string') result.push(...parseProfileText(item, context));
        else if (item && typeof item === 'object') {
          const parsed = parseClashProxy(item as ClashProxyRecord, context); if (parsed) result.push(parsed);
        }
      }
      if (result.length > 0) return result;
    }
  }
  const textLines = normalizedPayload.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    if (isBase64String(line) && !line.includes('://')) {
      try { return decodeBase64Utf8(line).split('\n').map((inner) => inner.trim()).filter(Boolean); } catch { return [line]; }
    }
    return [line];
  });
  return textLines.map((line) => parseSingleProfile(line, context)).filter(Boolean) as ConnectionProfile[];
}

export function parseSingleProfile(input: string, context: ParseContext): ConnectionProfile {
  const trimmed = input.trim();
  const lowered = trimmed.toLowerCase();
  if (lowered.startsWith('vless://')) return parseVlessLink(trimmed, context);
  if (lowered.startsWith('vmess://')) return parseVmessLink(trimmed, context);
  if (lowered.startsWith('trojan://')) return parseTrojanLink(trimmed, context);
  if (lowered.startsWith('ss://')) return parseShadowsocksLink(trimmed, context);
  if (lowered.startsWith('socks://') || lowered.startsWith('socks5://')) return parseSocksLink(trimmed, context);
  if (lowered.startsWith('hysteria2://') || lowered.startsWith('hy2://')) return parseHysteria2Link(trimmed, context);
  throw new Error(`Unsupported profile format: ${trimmed.slice(0, 24)}`);
}

export function exportProfile(profile: ConnectionProfile): string {
  switch (profile.protocol) {
    case 'vless': return exportVlessLink(profile);
    case 'vmess': return exportVmessLink(profile);
    case 'trojan': return exportTrojanLink(profile);
    case 'shadowsocks': return exportShadowsocksLink(profile);
    case 'socks': return exportSocksLink(profile);
    case 'hysteria2': return exportHysteria2Link(profile);
    case 'custom': return JSON.stringify(profile.details, null, 2);
    default: return JSON.stringify(profile, null, 2);
  }
}

export function validateProfile(profile: ConnectionProfile): string[] {
  const errors: string[] = [];
  if (!profile.name.trim()) errors.push('Название профиля обязательно');
  if (!profile.server.trim()) errors.push('Сервер обязателен');
  if (!Number.isInteger(profile.port) || profile.port < 1 || profile.port > 65535) errors.push('Порт должен быть от 1 до 65535');
  if (profile.protocol === 'vless' && !(profile.details as Record<string, unknown>).uuid) errors.push('Для VLESS обязателен UUID');
  if (profile.protocol === 'vmess' && !(profile.details as Record<string, unknown>).uuid) errors.push('Для VMess обязателен UUID');
  if (profile.protocol === 'trojan' && !(profile.details as Record<string, unknown>).password) errors.push('Для Trojan обязателен password');
  if (profile.protocol === 'shadowsocks') {
    if (!(profile.details as Record<string, unknown>).method) errors.push('Для Shadowsocks обязателен method');
    if (!(profile.details as Record<string, unknown>).password) errors.push('Для Shadowsocks обязателен password');
  }
  if (profile.protocol === 'hysteria2' && !(profile.details as Record<string, unknown>).password) errors.push('Для Hysteria2 обязателен password');
  return errors;
}
