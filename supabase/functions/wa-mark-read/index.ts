import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { connectionId, messageId } = body

    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'connectionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair chatId da URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const chatId = pathParts[pathParts.length - 2] // /wa/conversations/{chatId}/read

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: 'chatId is required' }),
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

    // Construir query para marcar mensagens como lidas
    let query = supabaseClient
      .from('whatsapp_mensagens')
      .update({ ack: 4 }) // 4 = read
      .eq('atendimento_id', atendimento.id)
      .eq('direction', 'in') // Apenas mensagens recebidas
      .lt('ack', 4) // Apenas mensagens não lidas

    // Se messageId específico fornecido, filtrar por ele
    if (messageId) {
      query = query.eq('id', messageId)
    }

    const { error: updateError } = await query

    if (updateError) {
      console.error('Error marking messages as read:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to mark messages as read' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resetar unread_count da conversa
    const { error: resetError } = await supabaseClient
      .from('whatsapp_atendimentos')
      .update({ unread_count: 0 })
      .eq('id', atendimento.id)

    if (resetError) {
      console.error('Error resetting unread count:', resetError)
      // Não falhar a operação por causa disso
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Messages marked as read'
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

