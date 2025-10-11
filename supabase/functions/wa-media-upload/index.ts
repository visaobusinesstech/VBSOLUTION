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
    const { connectionId, chatId, file, mimeType } = body

    if (!connectionId || !chatId || !file || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'connectionId, chatId, file, and mimeType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar nome único para o arquivo
    const fileExtension = mimeType.split('/')[1] || 'bin'
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    const storageKey = `${connectionId}/${chatId}/${fileName}`

    // Converter base64 para buffer se necessário
    let fileBuffer: Uint8Array
    if (typeof file === 'string') {
      // Assumir que é base64
      const base64Data = file.replace(/^data:[^;]+;base64,/, '')
      fileBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    } else {
      // Assumir que já é um buffer/array
      fileBuffer = new Uint8Array(file)
    }

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('wa-media')
      .upload(storageKey, fileBuffer, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar URL assinada para preview
    const { data: signedUrlData } = await supabaseClient.storage
      .from('wa-media')
      .createSignedUrl(storageKey, 3600) // 1 hora de expiração

    const urlPreview = signedUrlData?.signedUrl

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          mediaKey: storageKey,
          urlPreview,
          fileName,
          mimeType,
          size: fileBuffer.length
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

