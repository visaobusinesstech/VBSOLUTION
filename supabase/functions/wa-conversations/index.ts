import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Conversation {
  id: string
  connection_id: string
  chat_id: string
  title: string
  avatar_url?: string
  contact_id?: string
  last_message_preview?: string
  last_message_at?: string
  unread_count: number
  status: string
  created_at: string
  updated_at: string
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
    const connectionId = url.searchParams.get('connectionId')
    const q = url.searchParams.get('q') || ''
    const limit = parseInt(url.searchParams.get('limit') || '30')
    const cursor = url.searchParams.get('cursor')

    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'connectionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir query base
    let query = supabaseClient
      .from('whatsapp_atendimentos')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })

    // Aplicar filtro de busca se fornecido
    if (q) {
      query = query.or(`title.ilike.%${q}%,chat_id.ilike.%${q}%,last_message_preview.ilike.%${q}%`)
    }

    // Aplicar paginação se cursor fornecido
    if (cursor) {
      try {
        const decodedCursor = atob(cursor)
        const [lastMessageAt, lastId] = decodedCursor.split('|')
        query = query.lt('last_message_at', lastMessageAt)
          .or(`last_message_at.lt.${lastMessageAt},and(last_message_at.eq.${lastMessageAt},id.lt.${lastId})`)
      } catch (e) {
        console.error('Invalid cursor:', e)
      }
    }

    // Aplicar limite
    query = query.limit(limit + 1) // +1 para detectar se há mais páginas

    const { data: conversations, error } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch conversations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se há mais páginas
    const hasMore = conversations && conversations.length > limit
    const items = hasMore ? conversations.slice(0, limit) : (conversations || [])

    // Gerar próximo cursor se houver mais páginas
    let nextCursor = null
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]
      const cursorData = `${lastItem.last_message_at}|${lastItem.id}`
      nextCursor = btoa(cursorData)
    }

    // Mapear para formato esperado pelo frontend
    const mappedConversations: Conversation[] = items.map(conv => ({
      id: conv.id,
      connection_id: conv.connection_id,
      chat_id: conv.chat_id,
      title: conv.title || conv.chat_id,
      avatar_url: conv.avatar_url,
      contact_id: conv.contact_id,
      last_message_preview: conv.last_message_preview,
      last_message_at: conv.last_message_at,
      unread_count: conv.unread_count || 0,
      status: conv.status,
      created_at: conv.created_at,
      updated_at: conv.updated_at
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          items: mappedConversations,
          nextCursor,
          hasMore: !!hasMore
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

