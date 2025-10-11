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
    const atendimentoId = u.searchParams.get("atendimentoId");
    const limit = Number(u.searchParams.get("limit") ?? "30");
    const before = u.searchParams.get("before");

    if (!atendimentoId) return new Response(JSON.stringify({ error: "Missing atendimentoId" }), { status: 400, headers });

    let query = supabase
      .from("whatsapp_mensagens")
      .select("*")
      .eq("atendimento_id", atendimentoId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) query = query.lt("created_at", before);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []).reverse();
    const nextBefore = rows.length ? rows[0].created_at : null;

    return new Response(JSON.stringify({ items: rows, nextBefore }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers });
  }
});

