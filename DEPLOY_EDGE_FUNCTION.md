# 🚀 Deploy da Edge Function SMTP Real

## Método 1: Deploy Manual pelo Dashboard (RECOMENDADO)

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto VB-Solution-CRM

2. **Navegue até Edge Functions**
   - No menu lateral, clique em **"Edge Functions"**
   - Clique no botão **"Create a new function"**

3. **Configurar a Função**
   - **Nome da função**: `send-email-real`
   - Marque a opção **"Execute function with elevated privileges"** (se disponível)

4. **Cole o Código**
   - Copie TODO o conteúdo do arquivo `supabase/functions/send-email-real/index.ts`
   - Cole no editor de código do dashboard
   - Clique em **"Deploy"** ou **"Save"**

5. **Verificar Deployment**
   - A função deve aparecer na lista de Edge Functions
   - Status deve estar como **"Active"** ou **"Deployed"**

---

## Método 2: Deploy via API (ALTERNATIVO)

Se preferir, você pode fazer o deploy via API REST do Supabase, mas requer configuração adicional.

---

## 📝 Código da Edge Function

Copie o código abaixo e cole no editor do Supabase:

\`\`\`typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log("📨 Recebida requisição de envio SMTP REAL:", {
      to: requestData.to,
      subject: requestData.subject,
      user_id: requestData.user_id,
      has_content: !!requestData.content
    });

    // Buscar configurações SMTP do usuário
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Primeiro, tentar buscar da tabela smtp_settings
    let smtpSettings = null;
    let settingsError = null;

    const { data: smtpData, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('user_id', requestData.user_id)
      .eq('is_active', true)
      .single();

    if (smtpData) {
      smtpSettings = smtpData;
    } else {
      // Fallback para user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('smtp_host, email_porta, email_usuario, smtp_pass, smtp_from_name, smtp_seguranca')
        .eq('id', requestData.user_id)
        .single();

      if (profileData && profileData.smtp_host) {
        smtpSettings = {
          host: profileData.smtp_host,
          port: profileData.email_porta || 587,
          user: profileData.email_usuario,
          pass: profileData.smtp_pass,
          from_name: profileData.smtp_from_name,
          security: profileData.smtp_seguranca || 'tls'
        };
      } else {
        settingsError = profileError || new Error('Configurações SMTP não encontradas');
      }
    }

    if (settingsError || !smtpSettings) {
      console.error("❌ SMTP não configurado:", settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Configurações SMTP não encontradas. Configure nas configurações do sistema." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validação dos dados obrigatórios
    if (!requestData.to || !requestData.subject || !requestData.content) {
      console.error("❌ Parâmetros obrigatórios faltando:", {
        to: !!requestData.to,
        subject: !!requestData.subject,
        content: !!requestData.content
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parâmetros obrigatórios: to, subject, content' 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📧 Configurações SMTP encontradas:", {
      host: smtpSettings.host,
      port: smtpSettings.port,
      user: smtpSettings.user,
      security: smtpSettings.security
    });

    // Implementação REAL do SMTP com nodemailer para Deno
    const nodemailer = await import('https://deno.land/x/nodemailer@1.0.0/mod.ts');
    
    const transporter = nodemailer.createTransporter({
      host: smtpSettings.host,
      port: parseInt(smtpSettings.port) || 587,
      secure: smtpSettings.security === 'ssl',
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log("📤 Enviando email via SMTP real...");

    const info = await transporter.sendMail({
      from: \`"\${smtpSettings.from_name || 'Sistema'}" <\${smtpSettings.user}>\`,
      to: requestData.to,
      subject: requestData.subject,
      html: requestData.content,
      attachments: requestData.attachments || []
    });

    console.log("✅ Email enviado com sucesso:", {
      messageId: info.messageId,
      to: requestData.to,
      subject: requestData.subject
    });

    // Salvar log do envio
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: requestData.user_id,
          to_email: requestData.to,
          subject: requestData.subject,
          status: 'sent',
          message_id: info.messageId,
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
        messageId: info.messageId,
        to: requestData.to,
        subject: requestData.subject,
        sentAt: new Date().toISOString(),
        message: 'Email enviado com sucesso via SMTP'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Erro no envio de email:", error);
    console.error("❌ Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno no servidor SMTP",
        timestamp: new Date().toISOString(),
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
\`\`\`

---

## ✅ Verificação Pós-Deploy

Após fazer o deploy, verifique:

1. ✅ A função aparece na lista de Edge Functions
2. ✅ Status está como "Active" ou "Deployed"
3. ✅ Não há erros de sintaxe no log
4. ✅ Você pode ver a URL da função (ex: `https://[seu-projeto].supabase.co/functions/v1/send-email-real`)

---

## 🔧 Configuração de Variáveis de Ambiente

O Supabase automaticamente injeta estas variáveis:
- `SUPABASE_URL` - URL do seu projeto
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (com privilégios elevados)
- `SUPABASE_ANON_KEY` - Chave anônima

Você não precisa configurar nada adicional!

---

## 📊 Testando a Função

Após o deploy, teste diretamente no dashboard:

1. Vá para **Edge Functions** → **send-email-real**
2. Clique em **"Invoke function"** ou **"Test"**
3. Cole este JSON de teste:

\`\`\`json
{
  "user_id": "seu-user-id-aqui",
  "to": "seu-email@example.com",
  "subject": "Teste SMTP Real",
  "content": "<h1>Teste de Email</h1><p>Este é um teste do sistema SMTP real.</p>"
}
\`\`\`

4. Clique em **"Run"** e verifique a resposta

---

## 🚨 Troubleshooting

### Erro: "Failed to compile"
- Verifique se copiou TODO o código
- Certifique-se de que não há caracteres especiais ou quebras de linha estranhas

### Erro: "Module not found"
- O Supabase deve ter acesso à internet para importar módulos Deno
- Tente fazer o deploy novamente

### Erro: "SMTP not configured"
- Execute primeiro o script SQL para criar a tabela `smtp_settings`
- Configure suas credenciais SMTP em Settings → Email

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Logs da Edge Function no dashboard
2. Console do navegador (F12)
3. Tabela `smtp_settings` foi criada corretamente
4. Credenciais SMTP estão corretas




