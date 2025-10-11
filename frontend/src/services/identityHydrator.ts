import { getIdentity, rememberIdentity } from '@/state/identityStore';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

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

export async function hydrateGroup(chatId: string, ownerId?: string) {
  if (!chatId) return null;
  try {
    const url = new URL(`${API}/api/whatsapp/group/${encodeURIComponent(chatId)}`);
    if (ownerId) url.searchParams.set('ownerId', ownerId);
    const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!r.ok) {
      if (r.status === 404) {
        // Silent: Group endpoint not found (404) for chatId
        return null;
      }
      return null;
    }
    return await r.json();
  } catch (error) {
    // Silent: Failed to hydrate group (expected for some groups)
    return null;
  }
}

export async function hydrateIdentities(jids: string[], opts?: { ownerId?: string }) {
  const unknown = jids.filter(j => {
    const id = getIdentity(j);
    return !id || (isPlaceholderName(id?.name) && !id?.avatar);
  });
  if (unknown.length === 0) return;

  try {
    const url = new URL(`${API}/api/whatsapp/identities`);
    url.searchParams.set('jids', unknown.join(','));
    if (opts?.ownerId) url.searchParams.set('ownerId', opts.ownerId);
    const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!r.ok) return;

    const data: Array<{ jid: string; name?: string | null; avatar?: string | null }> = await r.json();
    data.forEach(d => rememberIdentity(d.jid, {
      name: resolveDisplayName({ contactName: d.name, jid: d.jid }),
      avatar: d.avatar || null
    }));
  } catch {
    /* silent */
  }
}