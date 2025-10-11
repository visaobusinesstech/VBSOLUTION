import { useEffect, useState } from 'react';

export type Identity = { name?: string | null; avatar?: string | null; };

// Singleton store for identities
const identityDir = new Map<string, Identity>();

// Pub-sub for identity updates
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export function subscribeIdentities(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function isPlaceholderName(name?: string | null) {
  if (!name) return true;
  const n = String(name).trim();
  const placeholders = ['Operador', 'Atendente', 'Você', 'Voce', 'Você - IA', 'IA', 'Grupo', 'Group'];
  if (placeholders.includes(n)) return true;
  if (/^Grupo\s+\*+/.test(n)) return true; // "Grupo ********"
  return false;
}

function jidToPretty(jid?: string) {
  if (!jid) return '';
  return jid.replace(/@.+$/, '');
}

function resolveDisplayName(src: {
  groupName?: string | null;
  contactName?: string | null;
  pushName?: string | null;
  notify?: string | null;
  jid?: string | null;
}) {
  const candidates = [
    src.groupName, src.contactName, src.pushName, src.notify, jidToPretty(src.jid)
  ].filter(Boolean) as string[];
  const firstGood = candidates.find(n => !isPlaceholderName(n));
  return firstGood || jidToPretty(src.jid);
}

function mergeIdentity<T extends { name?: string | null; avatar?: string | null; }>(
  current: T | undefined,
  incoming: T
): T {
  const next: T = { ...(current || {}) };

  const incomingName = incoming.name;
  const currentName = next.name;
  if (!isPlaceholderName(incomingName)) {
    if (!currentName || isPlaceholderName(currentName)) next.name = incomingName;
  }

  const incomingAvatar = incoming.avatar;
  const currentAvatar = next.avatar;
  if (incomingAvatar && (!currentAvatar || currentAvatar?.includes('default'))) {
    next.avatar = incomingAvatar;
  }

  return { ...incoming, ...next };
}

export function getIdentity(key?: string | null): Identity | undefined {
  if (!key) return undefined;
  return identityDir.get(key);
}

export function rememberIdentity(key?: string | null, incoming?: Identity): Identity | undefined {
  if (!key || !incoming) return getIdentity(key);
  const current = identityDir.get(key);
  const merged = mergeIdentity(current, incoming);
  identityDir.set(key, merged);
  notify(); // 🔔 rerender subscribers
  return merged;
}

export function clearIdentity(key: string): void {
  identityDir.delete(key);
}

export function clearAllIdentities(): void {
  identityDir.clear();
}

export function getAllIdentities(): Map<string, Identity> {
  return new Map(identityDir);
}

// Lightweight hook to auto-rerender when identity updates
export function useIdentity(jid?: string | null): Identity | undefined {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeIdentities(() => setTick(t => (t + 1) % 1000000));
    return unsub;
  }, []);
  return getIdentity(jid ?? null);
}