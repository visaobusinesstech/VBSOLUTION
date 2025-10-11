export const PLACEHOLDER_NAMES = new Set([
  'Operador', 'Atendente', 'Você', 'Voce', 'Você - IA', 'IA', 'Grupo', 'Group'
]);

export function isEmpty(v?: string | null) {
  return !v || v.trim() === '' || v === 'undefined' || v === 'null';
}

export function isPlaceholderName(name?: string | null) {
  if (isEmpty(name)) return true;
  const n = String(name).trim();
  if (PLACEHOLDER_NAMES.has(n)) return true;
  if (/^Grupo\s+\*+/.test(n)) return true; // "Grupo ********"
  return false;
}

export function jidToPretty(jid?: string) {
  if (!jid) return '';
  // 554796643900@s.whatsapp.net -> 554796643900
  return jid.replace(/@.+$/, '');
}

/** Return preferred display name: prefer group/contact .name, else .pushName/.notify, else pretty JID */
export function resolveDisplayName(src: {
  groupName?: string | null;
  contactName?: string | null;
  pushName?: string | null;   // whatsapp pushName/notify
  notify?: string | null;
  jid?: string | null;
}) {
  const candidates = [
    src.groupName, src.contactName, src.pushName, src.notify, jidToPretty(src.jid)
  ].filter(Boolean) as string[];
  const firstGood = candidates.find(n => !isPlaceholderName(n));
  return firstGood || jidToPretty(src.jid);
}

/** Merge identity without downgrading existing good values */
export function mergeIdentity<T extends { name?: string | null; avatar?: string | null; }>
(current: T | undefined, incoming: T): T {
  const next: T = { ...(current || {}) };

  // name: only set if incoming is good, and current is empty/placeholder
  const incomingName = incoming.name;
  const currentName = next.name;
  if (!isPlaceholderName(incomingName)) {
    if (isEmpty(currentName) || isPlaceholderName(currentName)) next.name = incomingName;
  }

  // avatar: only set if incoming present and current empty
  const incomingAvatar = incoming.avatar;
  const currentAvatar = next.avatar;
  if (!isEmpty(incomingAvatar) && (isEmpty(currentAvatar) || currentAvatar?.includes('default'))) {
    next.avatar = incomingAvatar;
  }

  // copy any extra safe fields
  return { ...incoming, ...next };
}
