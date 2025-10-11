// src/whatsapi/client.ts
export async function getJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 15000);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3000";

// cache simples
const subjectCache = new Map<string, string>();
const ppCache = new Map<string, string | null>();

export async function getGroupSubject(jid: string, connectionId: string): Promise<string | null> {
  if (!jid.endsWith("@g.us")) return null;
  if (subjectCache.has(jid)) return subjectCache.get(jid)!;

  try {
    const res = await fetch(`${API_BASE}/api/groups/metadata?connectionId=${encodeURIComponent(connectionId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const found = Array.isArray(data) ? data.find((g: any) => g.id === jid) : null;
    const subject = (found?.subject ?? "").trim();
    if (subject) subjectCache.set(jid, subject);
    return subject || null;
  } catch {
    return null;
  }
}

export async function getProfilePictureUrl(jid: string, connectionId?: string): Promise<string | null> {
  if (ppCache.has(jid)) return ppCache.get(jid)!;
  
  // If no connectionId provided, return null to avoid 404 errors
  if (!connectionId) {
    ppCache.set(jid, null);
    return null;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/whatsapp-profile/${connectionId}/profile-picture/${encodeURIComponent(jid)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const url = data?.url ?? null;
    ppCache.set(jid, url);
    return url;
  } catch {
    ppCache.set(jid, null);
    return null;
  }
}
