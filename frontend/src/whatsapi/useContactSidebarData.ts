// src/whatsapi/useContactSidebarData.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { getJson } from './client';

// Types kept loose on purpose to avoid breaking existing code
type GroupMeta = { id: string; subject?: string; description?: string; participants?: any[] };
type BusinessProfile = { description?: string; website?: string; email?: string; category?: string; address?: string } & Record<string, any>;

type Params = {
  chatId: string;                 // e.g. "12036...@g.us" or "55119...@s.whatsapp.net"
  connectionId: string;
  ownerId: string;
  baseUrl?: string;               // default "http://localhost:3000"
  // Feature flag: only trigger participant sync when explicitly enabled (safe)
  syncParticipants?: boolean;
};

export function useContactSidebarData({
  chatId,
  connectionId,
  ownerId,
  baseUrl = 'http://localhost:3000',
  syncParticipants = true,
}: Params) {
  const [groupMeta, setGroupMeta] = useState<GroupMeta | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  const isGroup = useMemo(() => chatId?.endsWith('@g.us') ?? false, [chatId]);

  // 1) GROUP: fetch metadata (subject/description)
  useEffect(() => {
    let cancelled = false;
    if (!isGroup || !chatId) {
      setGroupMeta(null);
      return;
    }
    (async () => {
      const url = `${baseUrl}/api/groups/metadata?connectionId=${encodeURIComponent(connectionId)}`;
      const data = await getJson<{ groups: GroupMeta[] }>(url);
      if (cancelled || !data?.groups) return;
      const found = data.groups.find(g => g.id === chatId) ?? null;
      setGroupMeta(found);
      // If API already includes participants, prefer them
      if (found?.participants?.length) setParticipants(found.participants);
    })();
    return () => { cancelled = true; };
  }, [isGroup, chatId, connectionId, baseUrl]);

  // 2) GROUP: sync participants on demand (quiet)
  useEffect(() => {
    let cancelled = false;
    if (!isGroup || !chatId || !syncParticipants) {
      if (!isGroup) setParticipants([]);
      return;
    }
    (async () => {
      const url = `${baseUrl}/api/contact/sync-specific`;
      const payload = {
        chatId,
        connectionId,
        ownerId,
      };
      const data = await getJson<{ participants?: Array<{ id: string; admin?: string | null; name?: string | null }> }>(
        url,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (cancelled || !data?.participants) return;

      // Normalize: ensure we always have name and admin fields
      const norm = data.participants.map(p => ({
        id: p.id,
        admin: p.admin ?? null,
        name: p.name && p.name.trim() ? p.name : p.id.replace(/@.*/, ''), // fallback to number (without @lid)
      }));
      setParticipants(norm);
    })();
    return () => { cancelled = true; };
  }, [isGroup, chatId, connectionId, ownerId, baseUrl, syncParticipants]);

  // 3) 1:1 BUSINESS: fetch business profile
  useEffect(() => {
    let cancelled = false;
    if (isGroup || !chatId) {
      setBusiness(null);
      return;
    }
    (async () => {
      try {
        // Your backend may proxy this; if not, wire to your sock.getBusinessProfile handler
        const url = `${baseUrl}/api/business/profile/${encodeURIComponent(chatId)}`;
        const profile = await getJson<BusinessProfile>(url);
        if (cancelled) return;
        setBusiness(profile ?? null);
      } catch (error) {
        // Silent: Failed to load business profile (404 expected for non-business contacts)
        if (cancelled) return;
        setBusiness(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isGroup, chatId, baseUrl]);

  // Safe derived values for UI
  const membersCount = useMemo(() => participants?.length ?? 0, [participants]);
  const subject = groupMeta?.subject ?? null;
  const description = groupMeta?.description ?? null;

  return { isGroup, subject, description, participants, membersCount, business };
}
