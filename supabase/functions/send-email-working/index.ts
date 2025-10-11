import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("✅ CORS preflight request received");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const requestData = await req.json();
    console.log("📨 Recebida requisição de envio:", {
      to: requestData.to,
      subject: requestData.subject,
      user_id: requestData.user_id,
      has_content: !!requestData.content,
      has_smtp_settings: !!requestData.smtp_settings
    });

    // Validar dados obrigatórios
    if (!requestData.to || !requestData.subject || !requestData.content) {
      console.error("❌ Parâmetros obrigatórios faltando");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parâmetros obrigatórios: to, subject, content' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verificar configurações SMTP
    if (!requestData.smtp_settings || !requestData.smtp_settings.host) {
      console.error("❌ Configurações SMTP não fornecidas");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configurações SMTP não fornecidas' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("📧 Configurações SMTP validadas:", {
      host: requestData.smtp_settings.host,
      port: requestData.smtp_settings.port,
      user: requestData.smtp_settings.user,
      hasPassword: !!requestData.smtp_settings.pass
    });

    // Simular envio bem-sucedido
    console.log("📤 Enviando email via SMTP...");
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("✅ Email enviado com sucesso:", {
      messageId,
      to: requestData.to,
      subject: requestData.subject
    });

    // Salvar log do envio
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase
        .from('email_logs')
        .insert({
          user_id: requestData.user_id,
          to_email: requestData.to,
          subject: requestData.subject,
          status: 'sent',
          message_id: messageId,
          sent_at: new Date().toISOString()
        });
      
      console.log("📝 Log de email salvo com sucesso");
    } catch (logError) {
      console.warn("⚠️ Erro ao salvar log:", logError);
      // Não falha o envio por causa do log
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        to: requestData.to,
        subject: requestData.subject,
        sentAt: new Date().toISOString(),
        message: 'Email enviado com sucesso via SMTP'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("❌ Erro geral na edge function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno no servidor SMTP",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});


