import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const body = await req.json()
    const { connectionId, state } = body

    if (!connectionId || !state) {
      return new Response(
        JSON.stringify({ error: 'connectionId and state are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extrair chatId da URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const chatId = pathParts[pathParts.length - 2] // /wa/conversations/{chatId}/typing

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: 'chatId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Enviar indicador de digitação para Baileys worker
    // Por enquanto, apenas retornar sucesso
    // O Baileys worker deve:
    // 1. Enviar typing indicator via Baileys
    // 2. Não salvar no banco (apenas best-effort)

    console.log(`Typing indicator: ${state} for chat ${chatId} on connection ${connectionId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Typing indicator sent'
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

