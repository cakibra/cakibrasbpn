import type { ConnectionProfile, ProfileDetails, ProtocolType } from '../../types';
import { createId, makeSourceLabel, nowIso } from '../../lib/utils';

export interface ParseContext {
  sourceType: 'local' | 'subscription';
  subscriptionId?: string;
  subscriptionName?: string;
}

export function buildBaseProfile(input: {
  name: string;
  protocol: ProtocolType;
  server: string;
  port: number;
  details: ProfileDetails;
  rawInput?: string;
  context: ParseContext;
}): ConnectionProfile {
  const now = nowIso();
  return {
    id: createId(input.protocol),
    name: input.name.trim() || `${input.protocol.toUpperCase()} ${input.server}:${input.port}`,
    protocol: input.protocol,
    server: input.server.trim(),
    port: input.port,
    sourceType: input.context.sourceType,
    subscriptionId: input.context.subscriptionId,
    sourceLabel: makeSourceLabel(input.context.sourceType, input.context.subscriptionName),
    favorite: false,
    latencyMs: null,
    statusView: { state: 'unknown' },
    details: input.details,
    rawInput: input.rawInput,
    createdAt: now,
    updatedAt: now
  };
}

export function parsePort(value: string | number | undefined, fallback = 443): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) return fallback;
  return parsed;
}
