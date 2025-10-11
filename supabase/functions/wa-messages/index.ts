import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Message {
  id: string
  client_id?: string
  atendimento_id: string
  connection_id: string
  chat_id: string
  direction: 'in' | 'out'
  type: string
  text?: string
  media_url?: string
  storage_key?: string
  mime_type?: string
  size_bytes?: number
  ack: number
  author?: string
  error?: string
  created_at: string
  edited: boolean
  reply_to_id?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const chatId = pathParts[pathParts.length - 2] // /wa/conversations/{chatId}/messages
    const connectionId = url.searchParams.get('connectionId')
    const before = url.searchParams.get('before')
    const limit = before ? 15 : parseInt(url.searchParams.get('limit') || '30')

    if (!connectionId || !chatId) {
      return new Response(
        JSON.stringify({ error: 'connectionId and chatId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar o atendimento_id para este chat
    const { data: atendimento, error: atendimentoError } = await supabaseClient
      .from('whatsapp_atendimentos')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('chat_id', chatId)
      .single()

    if (atendimentoError || !atendimento) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir query para mensagens com cursor-based pagination
    let query = supabaseClient
      .from('whatsapp_mensagens')
      .select('*')
      .eq('atendimento_id', atendimento.id)
      .order('created_at', { ascending: false }) // DESC para pegar as mais recentes primeiro
      .order('id', { ascending: false })

    // Aplicar cursor "before" se fornecido
    if (before) {
      try {
        const decodedCursor = atob(before)
        const [cursorCreatedAt, cursorId] = decodedCursor.split('|')
        query = query.or(`created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`)
      } catch (e) {
        console.error('Invalid before cursor:', e)
        return new Response(
          JSON.stringify({ error: 'Invalid before cursor' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Aplicar limite
    query = query.limit(limit)

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const items = messages || []
    
    // Reverter ordem para ASC (cronológica) para renderização
    const reversedItems = items.reverse()

    // Gerar nextBefore cursor (aponta para o item mais antigo da página atual)
    let nextBefore = null
    if (items.length === limit && items.length > 0) {
      const oldestItem = items[0] // Primeiro item após reverse
      const cursorData = `${oldestItem.created_at}|${oldestItem.id}`
      nextBefore = btoa(cursorData)
    }

    // Mapear para formato esperado pelo frontend
    const mappedMessages: Message[] = reversedItems.map(msg => ({
      id: msg.id,
      client_id: msg.client_id,
      atendimento_id: msg.atendimento_id,
      connection_id: msg.connection_id,
      chat_id: msg.chat_id,
      direction: msg.direction,
      type: msg.type,
      text: msg.text,
      media_url: msg.media_url,
      storage_key: msg.storage_key,
      mime_type: msg.mime_type,
      size_bytes: msg.size_bytes,
      ack: msg.ack || 0,
      author: msg.author,
      error: msg.error,
      created_at: msg.created_at,
      edited: msg.edited || false,
      reply_to_id: msg.reply_to_id
    }))

    // Adicionar signed URLs para media
    async function withSignedUrls(rows: Message[]) {
      const out: Message[] = [];
      for (const r of rows) {
        if (r.storage_key) {
          // 1 hour signed URL
          const { data: s, error: sErr } = await supabaseClient
            .storage.from("wa-media")
            .createSignedUrl(r.storage_key, 3600);
          // ignore errors: fallback to null
          (r as any).media_url = s?.signedUrl ?? null;
        }
        out.push(r);
      }
      return out;
    }

    const itemsWithUrls = await withSignedUrls(mappedMessages);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          items: itemsWithUrls,
          nextBefore
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
