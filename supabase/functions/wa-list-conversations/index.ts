// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { cors } from "../_shared/cors.ts";
const url = Deno.env.get("DATABASE_URL")!;
const key = Deno.env.get("SERVICE_ROLE_KEY")!;
const supabase = createClient(url, key, { auth: { persistSession: false }});

Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json", ...cors(req) };
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const u = new URL(req.url);
    const q = u.searchParams.get("q")?.trim() ?? "";
    const connectionId = u.searchParams.get("connectionId");

    let query = supabase
      .from("whatsapp_atendimentos")
      .select("id, connection_id, numero_cliente, nome_cliente, ultima_mensagem_preview, ultima_mensagem_em, nao_lidas")
      .order("ultima_mensagem_em", { ascending: false, nullsFirst: false });

    if (connectionId) query = query.eq("connection_id", connectionId);
    if (q) query = query.or(`nome_cliente.ilike.%${q}%,numero_cliente.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    const items = (data ?? []).map((r) => ({
      id: r.id,
      connection_id: r.connection_id,
      chat_id: r.numero_cliente,
      title: r.nome_cliente ?? r.numero_cliente,
      last_message_preview: r.ultima_mensagem_preview,
      last_message_at: r.ultima_mensagem_em,
      unread_count: r.nao_lidas ?? 0,
    }));

    return new Response(JSON.stringify({ items }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers });
  }
});

