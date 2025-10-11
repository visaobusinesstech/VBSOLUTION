// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Body = {
  ownerId: string;           // NEW: required
  companyId?: string | null; // NEW: optional
  connectionId?: string | null;
  numero: string;            // phone/JID
  nome?: string | null;
  direction: "in" | "out";
  type: "TEXTO"|"IMAGEM"|"AUDIO"|"VIDEO"|"DOCUMENTO"|"STICKER"|"LOCALIZACAO"|"CONTATO"|"OUTRO";
  texto?: string | null;
  midia?: { url?: string | null; mime?: string | null; nome?: string | null; tamanho?: number | null } | null;
  createdAt?: string | null; // ISO
  clientId?: string | null;
};

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = Deno.env.get("INTERNAL_WEBHOOK_TOKEN") || "change_me_super_random_64_chars";

const supabase = createClient(url, serviceKey, { auth: { persistSession: false }});

function previewFrom(b: Body): string {
  if (b.type === "TEXTO") return (b.texto ?? "").slice(0, 160);
  if (b.type === "IMAGEM") return b.texto ? `🖼️ ${b.texto}` : "🖼️ Imagem";
  if (b.type === "AUDIO") return "🎤 Áudio";
  if (b.type === "VIDEO") return "🎬 Vídeo";
  if (b.type === "DOCUMENTO") return b.midia?.nome ? `📎 ${b.midia.nome}` : "📎 Documento";
  return b.texto ?? "Mensagem";
}

function cors(req: Request) {
  const origin = req.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-wa-signature, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json", ...cors(req) };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers });

  try {
    // Only check custom signature (JWT verification disabled)
    const signature = req.headers.get("x-wa-signature");
    
    if (!TOKEN || signature !== TOKEN) {
      return new Response(JSON.stringify({ error: "unauthorized - invalid signature" }), { status: 401, headers });
    }
    const body = (await req.json()) as Body;
    if (!body?.ownerId || !body?.numero || !body?.direction || !body?.type) {
      return new Response(JSON.stringify({ error: "bad request: ownerId, numero, direction, type required" }), { status: 400, headers });
    }

    const ts = body.createdAt ?? new Date().toISOString();
    const remetente = body.direction === "in" ? "CLIENTE" : "ATENDENTE";

    // 1) Upsert conversation with tenant context
    const upsertConv = {
      owner_id: body.ownerId,
      company_id: body.companyId ?? null,
      connection_id: body.connectionId ?? null,
      numero_cliente: body.numero,
      nome_cliente: body.nome ?? null,
      status: "active" as const,
      ultima_mensagem_preview: previewFrom(body),
      ultima_mensagem_em: ts,
    };

    const { data: conv, error: convErr } = await supabase
      .from("whatsapp_atendimentos")
      .upsert(upsertConv, { onConflict: "owner_id,connection_id,numero_cliente" })
      .select("id, nao_lidas")
      .single();
    if (convErr) throw convErr;
    const atendimentoId = conv!.id as string;

    // 2) Insert message row (also with owner_id)
    const { data: msg, error: msgErr } = await supabase
      .from("whatsapp_mensagens")
      .insert({
        owner_id: body.ownerId,
        atendimento_id: atendimentoId,
        conteudo: body.texto ?? null,
        tipo: body.type,
        remetente,
        timestamp: ts,
        lida: remetente === "ATENDENTE",
        midia_url: body.midia?.url ?? null,
        midia_tipo: body.midia?.mime ?? null,
        midia_nome: body.midia?.nome ?? null,
        midia_tamanho: body.midia?.tamanho ?? null,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (msgErr) throw msgErr;

    // 3) Unread count (only for inbound)
    if (remetente === "CLIENTE") {
      const { error: rpcErr } = await supabase.rpc("increment_unread_or_zero", { p_atendimento_id: atendimentoId });
      if (rpcErr) {
        await supabase.from("whatsapp_atendimentos")
          .update({ nao_lidas: (conv?.nao_lidas ?? 0) + 1 })
          .eq("id", atendimentoId);
      }
    }

    // 4) Ensure preview/time reflect latest
    await supabase
      .from("whatsapp_atendimentos")
      .update({
        ultima_mensagem_preview: previewFrom(body),
        ultima_mensagem_em: ts,
      })
      .eq("id", atendimentoId);

    return new Response(JSON.stringify({ success: true, data: { atendimentoId, message: msg } }), { headers });
  } catch (e) {
    console.error("wa-persist-message error:", e);
    return new Response(JSON.stringify({ success: false, error: String(e?.message ?? e) }), { status: 500, headers });
  }
});
