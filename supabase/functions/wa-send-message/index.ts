// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { ulid } from "https://esm.sh/ulid@2.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

type Body = {
  connectionId: string;
  chatId: string;
  atendimentoId: string; // UUID
  type: 'text'|'image'|'audio'|'video'|'document';
  text?: string;
  mediaKey?: string;   // storage key from wa-media bucket
  mimeType?: string;
  replyToId?: string;
  clientId: string;    // for idempotency
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const idempotencyKey = req.headers.get("Idempotency-Key") ?? "";
  let body: Body;
  try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }

  // Check duplicate by clientId
  const { data: dup, error: dupErr } = await supabase
    .from("whatsapp_mensagens")
    .select("id")
    .eq("client_id", body.clientId)
    .maybeSingle();
  if (dupErr) return new Response(JSON.stringify({ error: dupErr.message }), { status: 500 });
  if (dup) return new Response(JSON.stringify({ success: true, data: dup }), { status: 200 });

  const newId = ulid();
  const now = new Date().toISOString();

  // Persist message with ack=0 (queued). Baileys worker will advance ACKs (1..4).
  const { data: saved, error } = await supabase
    .from("whatsapp_mensagens")
    .insert({
      id: newId,
      client_id: body.clientId,
      atendimento_id: body.atendimentoId,
      connection_id: body.connectionId,
      chat_id: body.chatId,
      direction: 'out',
      type: body.type,
      text: body.text ?? null,
      storage_key: body.mediaKey ?? null,
      mime_type: body.mimeType ?? null,
      media_url: null,   // optional: you can pre-generate a short-lived signed URL here
      ack: 0,
      author: null,
      created_at: now
    })
    .select("*")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // Kick your Baileys worker (HTTP webhook or queue) to actually send.
  // It must: send via WhatsApp, update ack stages, and (optionally) set media_url with a signed URL.
  // await fetch(Deno.env.get("BAILEYS_WORKER_URL")!, { method: "POST", body: JSON.stringify({ ...saved, idempotencyKey }) });

  return new Response(JSON.stringify({ success: true, data: saved }), { 
    headers: { 
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
})
