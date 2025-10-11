# 🔍 DIAGNÓSTICO COMPLETO: Edge Function Error

## ❌ ERRO IDENTIFICADO

**"Edge Function returned a non-2xx status code"**

Este erro indica que a edge function `send-email-real` está retornando um status HTTP de erro (400, 500, etc.) ao invés de sucesso (200).

## 🔍 ANÁLISE DETALHADA

### 1. **Possíveis Causas do Erro:**

#### A) Edge Function Não Deployada
- ❌ Função não existe no Supabase
- ❌ Função não está ativa
- ❌ URL incorreta sendo chamada

#### B) Erro de Configuração SMTP
- ❌ Configurações SMTP inválidas
- ❌ Senha incorreta
- ❌ Host/porta incorretos
- ❌ Autenticação falhou

#### C) Erro no Código da Edge Function
- ❌ Erro de sintaxe
- ❌ Import incorreto do nodemailer
- ❌ Variáveis de ambiente não configuradas
- ❌ Erro de timeout

#### D) Erro de Parâmetros
- ❌ Parâmetros obrigatórios faltando
- ❌ Formato de dados incorreto
- ❌ user_id inválido

## 🔧 DIAGNÓSTICO PASSO A PASSO

### Passo 1: Verificar se a Edge Function Existe

**No Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. Vá para: **Edge Functions**
3. Procure por: `send-email-real`
4. Status deve estar: **"Active"** ou **"Deployed"**

**Se não existir:**
- A edge function não foi deployada
- Execute o deploy usando o arquivo `deploy-edge-function.html`

### Passo 2: Verificar Logs da Edge Function

**No Supabase Dashboard:**
1. Vá para: **Edge Functions** → **send-email-real**
2. Clique em: **"Logs"** ou **"View Logs"**
3. Procure por erros recentes

**Logs esperados (sucesso):**
```
📨 Recebida requisição de envio SMTP REAL
📧 Configurações SMTP encontradas
📤 Enviando email via SMTP real...
✅ Email enviado com sucesso
```

**Logs de erro comuns:**
```
❌ SMTP não configurado: Error: Configurações SMTP não encontradas
❌ Parâmetros obrigatórios faltando
❌ Erro no envio de email: Authentication failed
❌ Erro no envio de email: ETIMEDOUT
```

### Passo 3: Testar Edge Function Diretamente

**No Supabase Dashboard:**
1. Vá para: **Edge Functions** → **send-email-real**
2. Clique em: **"Invoke function"** ou **"Test"**
3. Cole este JSON de teste:

```json
{
  "user_id": "SEU-USER-ID-AQUI",
  "to": "seu-email@example.com",
  "subject": "Teste Edge Function",
  "content": "<h1>Teste</h1><p>Testando edge function diretamente.</p>"
}
```

4. Clique em **"Run"** e veja a resposta

### Passo 4: Verificar Configurações SMTP

Execute no Supabase SQL Editor:
```sql
-- Verificar configurações SMTP atuais
SELECT 
    id,
    user_id,
    host,
    port,
    "user",
    CASE 
        WHEN pass IS NOT NULL AND pass != '' THEN '✅ Senha OK'
        ELSE '❌ Sem senha'
    END as status_senha,
    from_name,
    security,
    is_active
FROM public.smtp_settings
WHERE user_id = auth.uid();
```

### Passo 5: Verificar Console do Navegador

**No navegador (F12):**
1. Abra o **Console**
2. Procure por erros JavaScript
3. Procure por logs de requisição

**Logs esperados:**
```
📧 Iniciando envio de email...
📤 Enviando email para: destinatario@email.com
```

**Logs de erro:**
```
❌ Erro ao enviar email: [detalhes do erro]
```

## 🚨 SOLUÇÕES POR TIPO DE ERRO

### Erro 1: "Edge Function not found"

**Solução:**
1. Deploy da edge function usando `deploy-edge-function.html`
2. Verificar se o nome está correto: `send-email-real`

### Erro 2: "Configurações SMTP não encontradas"

**Solução:**
1. Verificar se as configurações foram salvas em `smtp_settings`
2. Executar script de migração se necessário
3. Configurar SMTP em Settings → Email

### Erro 3: "Authentication failed"

**Solução:**
1. **Gmail**: Usar senha de app (não senha normal)
2. **Outlook**: Verificar senha
3. **Outros**: Confirmar credenciais com provedor

### Erro 4: "ETIMEDOUT" ou "Connection timeout"

**Solução:**
1. Verificar host/porta SMTP
2. Testar com TLS (porta 587) ou SSL (porta 465)
3. Verificar firewall/proxy

### Erro 5: "Parâmetros obrigatórios faltando"

**Solução:**
1. Verificar se preencheu assunto e destinatários
2. Verificar se a mensagem não está vazia
3. Verificar se o user_id está sendo enviado

## 📊 COMANDOS DE DIAGNÓSTICO

### Verificar Status da Edge Function:
```sql
-- Verificar se a edge function está funcionando
-- (Execute no Supabase Dashboard → Edge Functions)
```

### Verificar Configurações SMTP:
```sql
SELECT 
    'DIAGNÓSTICO SMTP' as titulo,
    COUNT(*) as total_configuracoes,
    COUNT(CASE WHEN pass IS NOT NULL AND pass != '' THEN 1 END) as com_senha,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativas
FROM public.smtp_settings;
```

### Verificar Logs de Email:
```sql
SELECT 
    user_id,
    to_email,
    subject,
    status,
    sent_at,
    error_message
FROM public.email_logs
ORDER BY sent_at DESC
LIMIT 10;
```

## 🎯 PRÓXIMOS PASSOS

1. **Verifique** se a edge function está deployada
2. **Confira** os logs da edge function
3. **Teste** a edge function diretamente
4. **Verifique** as configurações SMTP
5. **Analise** o console do navegador

## 💡 DICAS IMPORTANTES

- **Gmail**: Use senha de app (16 caracteres)
- **Porta**: 587 para TLS, 465 para SSL
- **Logs**: Sempre verifique os logs para detalhes
- **Teste**: Teste a edge function diretamente primeiro

---

**Execute os passos de diagnóstico acima para identificar a causa específica do erro!**


