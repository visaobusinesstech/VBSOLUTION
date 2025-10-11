import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rememberIdentity } from '@/state/identityStore';
import { hydrateGroup, hydrateIdentities } from '@/services/identityHydrator';

export function useWhatsAppGroup(chatId?: string, ownerId?: string) {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const hasHydratedRef = useRef(false);

  function nonEmpty<T>(v: T | null | undefined) {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return v !== null && v !== undefined;
  }

  function stickyMerge(prev: any, incoming: any) {
    const out = { ...(prev || {}) };
    const keys = ['subject','description','created_at','owner','membersCount','status'];
    for (const k of keys) {
      const inc = incoming?.[k];
      if (nonEmpty(inc)) out[k] = inc; // prefer non-empty
    }
    // participants
    const incPart = Array.isArray(incoming?.participants) ? incoming.participants : null;
    if (Array.isArray(out.participants)) {
      if (incPart && incPart.length) out.participants = incPart; // replace only when non-empty
    } else {
      out.participants = incPart || [];
    }
    return out;
  }

  useEffect(() => {
    if (!chatId || loadingRef.current) return;
    let cancelled = false;
    (async () => {
      loadingRef.current = true;
      setLoading(true);

      // Prefer backend first (since Supabase table 404s). If you switch later, flip this order.
      let group: any = await hydrateGroup(chatId, ownerId);

      // If backend returned nothing meaningful and you *have* a Supabase table later, attempt it here.
      // (Left commented to avoid 404 spam)
      // if (!group) { ... supabase maybeSingle() ... }

      if (cancelled) return;

      setMeta(prev => stickyMerge(prev, {
        subject: group?.subject ?? null,
        description: group?.description ?? null,
        created_at: group?.created_at ?? null,
        owner: group?.owner ?? null,
        membersCount: typeof group?.membersCount === 'number' ? group.membersCount : null,
        status: group?.status ?? null,
        participants: Array.isArray(group?.participants) ? group.participants : [],
      }));

      // Hydrate identities of participants
      const jids = (group?.participants || []).map((p: any) => p.jid).filter(Boolean);
      if (jids.length) await hydrateIdentities(jids, { ownerId });
      hasHydratedRef.current = true;
      loadingRef.current = false;
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [chatId, ownerId]);

  return { meta, loading };
}