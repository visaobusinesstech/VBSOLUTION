import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { waSdk } from "@/lib/waSdk";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from "nanoid";

type Args = {
  connectionId: string;
  chatId: string;
  atendimentoId?: string;
};

export function useMessages({ connectionId, chatId, atendimentoId }: Args, opts?: { enabled?: boolean }) {
  const enabled = (opts?.enabled ?? true) && Boolean(connectionId && chatId);
  const key = useMemo(
    () => ["wa", "messages", connectionId, chatId, atendimentoId ?? ""],
    [connectionId, chatId, atendimentoId]
  );
  const qc = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: key,
    enabled,
    initialPageParam: undefined as string | undefined, // before cursor
    queryFn: async ({ pageParam }) => {
      const { items, nextBefore } = await waSdk.getMessages({
        connectionId,
        chatId,
        atendimentoId,
        before: pageParam, // undefined => 30; else 15 older
      });
      return { items, nextBefore }; // items ASC
    },
    getNextPageParam: (page) => page.nextBefore ?? undefined,
    select: (data) => ({
      ...data,
      flat: data.pages.flatMap((p) => p.items), // flatten ASC
    }),
  });

  // Realtime upserts (INSERT/UPDATE) for this thread
  useEffect(() => {
    if (!atendimentoId) return;
    const channel = supabase
      .channel(`wa_msgs_${atendimentoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_mensagens", filter: `atendimento_id=eq.${atendimentoId}` },
        (payload) => {
          const row: any = payload.new;
          qc.setQueryData<any>(key, (prev) => {
            if (!prev) return prev;
            const pages = prev.pages.map((p: any) => ({ ...p, items: [...p.items] }));
            // try id or client_id
            let updated = false;
            for (const p of pages) {
              const i = p.items.findIndex(
                (m: any) => m.id === row.id || (!!row.client_id && m.client_id === row.client_id)
              );
              if (i >= 0) {
                p.items[i] = { ...p.items[i], ...row };
                updated = true;
                break;
              }
            }
            if (!updated && payload.eventType === "INSERT") {
              pages[pages.length - 1].items.push(row); // append newest
            }
            return { ...prev, pages };
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, key, atendimentoId]);

  // optimistic helper
  async function addOptimistic(partial: any) {
    const clientId = partial.client_id ?? nanoid();
    qc.setQueryData<any>(key, (prev) => {
      if (!prev) return prev;
      const pages = prev.pages.map((p: any) => ({ ...p, items: [...p.items] }));
      pages[pages.length - 1].items.push({
        ...partial,
        id: `temp_${clientId}`,
        client_id: clientId,
        created_at: new Date().toISOString(),
        ack: 0,
      });
      return { ...prev, pages };
    });
    return clientId;
  }

  return {
    ...query,
    messages: (query.data?.flat ?? []) as any[],
    loading: query.isLoading,
    hasMoreOlder: Boolean(query.hasNextPage),
    isFetchingOlder: query.isFetchingNextPage,
    fetchOlder: async () => {
      if (!query.isFetchingNextPage && query.hasNextPage) await query.fetchNextPage();
    },
    addOptimistic,
  };
}
