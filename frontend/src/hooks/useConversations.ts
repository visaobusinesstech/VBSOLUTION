import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listConversations, subscribeConversationUpdates, type Conversation } from "@/lib/waSdk";

export function useConversations({ ownerId, q }: { ownerId: string; q?: string }) {
  const qc = useQueryClient();
  const key = useMemo(() => ["wa","conversations", ownerId, q ?? ""], [ownerId, q]);

  const query = useQuery<Conversation[]>({
    queryKey: key,
    queryFn: () => listConversations({ ownerId, q }),
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = subscribeConversationUpdates(ownerId, () => {
      qc.invalidateQueries({ queryKey: key });
    });
    return () => { /* optional: supabase.removeChannel(channel) */ };
  }, [ownerId, qc, key]);

  return query; // data is Conversation[]
}
