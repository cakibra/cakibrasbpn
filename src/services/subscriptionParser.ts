import type { ConnectionProfile, SubscriptionEntry } from '../types';
import { createId } from '../lib/utils';
import { parseProfileText } from './profileAdapters';

export function buildSubscriptionEntry(input: { name: string; url: string; autoUpdate: boolean; }): SubscriptionEntry {
  const now = new Date().toISOString();
  return {
    id: createId('sub'),
    name: input.name.trim(),
    url: input.url.trim(),
    autoUpdate: input.autoUpdate,
    profileIds: [],
    createdAt: now,
    updatedAt: now
  };
}
export function parseSubscriptionPayload(payload: { raw: string; subscription: SubscriptionEntry; }): ConnectionProfile[] {
  return parseProfileText(payload.raw, {
    sourceType: 'subscription',
    subscriptionId: payload.subscription.id,
    subscriptionName: payload.subscription.name
  });
}
