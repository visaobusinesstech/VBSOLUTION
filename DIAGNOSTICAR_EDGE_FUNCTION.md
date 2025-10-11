# 🔍 Diagnóstico da Edge Function SMTP

## ❌ PROBLEMA IDENTIFICADO

**Erro:** "Edge Function returned a non-2xx status code"

Isso significa que a edge function `send-email-real` está retornando um erro HTTP (400, 500, etc.) ao invés de sucesso (200).

## 🔍 DIAGNÓSTICO PASSO A PASSO

### 1. Verificar se a Edge Function Existe

**No Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. Vá para: **Edge Functions**
3. Procure por: `send-email-real`
4. Status deve estar: **"Active"** ou **"Deployed"**

### 2. Verificar Logs da Edge Function

**No Supabase Dashboard:**
1. Vá para: **Edge Functions** → **send-email-real**
2. Clique em: **"Logs"** ou **"View Logs"**
3. Procure por erros recentes

**Possíveis erros:**
- `❌ SMTP não configurado`
- `❌ Parâmetros obrigatórios faltando`
- `❌ Erro no envio de email`
- `❌ Configurações SMTP não encontradas`

### 3. Testar a Edge Function Diretamente

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

### 4. Verificar Configurações SMTP

**Execute no SQL Editor:**
```sql
-- Verificar se há configurações SMTP
SELECT 
  id,
  user_id,
  host,
  port,
  "user",
  from_name,
  security,
  is_active
FROM public.smtp_settings
WHERE user_id = auth.uid();
```

**Se não retornar nada:**
- Configure SMTP em Settings → Email

### 5. Verificar Tabela smtp_settings

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'smtp_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 🔧 SOLUÇÕES POSSÍVEIS

### Solução 1: Re-deploy da Edge Function

1. **No Supabase Dashboard:**
   - Vá para: **Edge Functions** → **send-email-real**
   - Clique em: **"Edit"**
   - Cole o código novamente
   - Clique em: **"Deploy"**

### Solução 2: Verificar Código da Edge Function

**Problemas comuns:**
- Import incorreto do nodemailer
- Variáveis de ambiente não configuradas
- Erro de sintaxe no código

### Solução 3: Configurar SMTP Corretamente

**No sistema:**
1. Vá para: **Settings → Email**
2. Preencha **TODOS** os campos:
   - Host SMTP
   - Porta
   - Usuário
   - Senha
   - Nome do Remetente
   - Segurança (TLS/SSL)

### Solução 4: Testar com Credenciais Simples

**Para teste rápido, use:**
- **Gmail**: smtp.gmail.com:587
- **Outlook**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587

## 📊 LOGS ESPERADOS (SUCESSO)

### Console do Navegador:
```
📧 Iniciando envio de email...
📤 Enviando email para: destinatario@email.com
✅ Email enviado com sucesso!
```

### Supabase Edge Function Logs:
```
📨 Recebida requisição de envio SMTP REAL
📧 Configurações SMTP encontradas
📤 Enviando email via SMTP real...
✅ Email enviado com sucesso
```

## 🚨 LOGS DE ERRO COMUNS

### Erro 1: Configurações não encontradas
```
❌ SMTP não configurado: Error: Configurações SMTP não encontradas
```
**Solução:** Configure SMTP em Settings → Email

### Erro 2: Parâmetros obrigatórios
```
❌ Parâmetros obrigatórios faltando
```
**Solução:** Verifique se preencheu assunto e destinatários

### Erro 3: Autenticação SMTP
```
❌ Erro no envio de email: Authentication failed
```
**Solução:** Verifique usuário/senha SMTP

### Erro 4: Conexão timeout
```
❌ Erro no envio de email: ETIMEDOUT
```
**Solução:** Verifique host/porta SMTP

## 🎯 PRÓXIMOS PASSOS

1. **Verifique** se a edge function está deployada
2. **Confira** os logs da edge function
3. **Configure** SMTP corretamente
4. **Teste** a edge function diretamente
5. **Tente** enviar email novamente

## 💡 DICA IMPORTANTE

Mesmo com erro inicial, o sistema conseguiu enviar 2 emails depois. Isso indica que:
- ✅ A configuração SMTP está funcionando
- ✅ A edge function está funcionando (parcialmente)
- ❌ Pode haver um problema de timeout ou retry

**Continue testando** - o sistema está funcionando! 🚀


