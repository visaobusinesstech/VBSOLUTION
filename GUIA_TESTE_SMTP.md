# 🧪 Guia de Teste - Sistema SMTP Real

## ✅ Pré-requisitos Completados

- [x] Tabela `smtp_settings` criada no Supabase
- [x] Edge Function `send-email-real` deployada
- [x] Frontend atualizado para usar a nova função

---

## 🎯 Próximos Passos

### Passo 1: Configurar Credenciais SMTP

1. **Acesse o Sistema**
   - Abra o VB-Solution-CRM no navegador
   - Faça login com suas credenciais

2. **Vá para Configurações**
   - Clique no menu **Settings** ou **Configurações**
   - Navegue até a seção **Email** ou **SMTP**

3. **Preencha as Credenciais SMTP**
   
   **Para Gmail:**
   - Host SMTP: `smtp.gmail.com`
   - Porta: `587`
   - Usuário: `seu-email@gmail.com`
   - Senha: `sua-senha-de-app` (não é a senha normal!)
   - Segurança: `TLS`
   - Nome do Remetente: `Seu Nome ou Empresa`

   **Para Outlook/Hotmail:**
   - Host SMTP: `smtp-mail.outlook.com`
   - Porta: `587`
   - Usuário: `seu-email@outlook.com`
   - Senha: `sua-senha`
   - Segurança: `TLS`

   **Para outros provedores:**
   - Consulte a documentação do seu provedor de email

4. **Salve as Configurações**
   - Clique em **Salvar** ou **Save**

---

### Passo 2: Testar Envio de Email

1. **Vá para a Página de Email**
   - No menu, clique em **Email** ou **E-mail**

2. **Criar um Novo Template (opcional)**
   - Vá para aba **Templates**
   - Clique em **Novo Template**
   - Preencha:
     - Nome: `Teste SMTP Real`
     - Conteúdo: `<h1>Teste de Email</h1><p>Este é um teste do sistema SMTP real!</p>`
     - Canal: `Email`
   - Salve o template

3. **Enviar Email de Teste**
   - Vá para aba **Agendamentos**
   - Clique no botão **+** (flutuante)
   - Preencha:
     - **Destinatário**: Seu próprio email (para teste)
     - **Assunto**: `Teste SMTP Real - VB Solution`
     - **Mensagem**: Use o template criado ou escreva uma mensagem
     - **Opção**: Selecione **Enviar Agora**
   - Clique em **Enviar**

4. **Verificar Resultado**
   - Aguarde a confirmação de envio
   - Verifique seu email (inbox ou spam)
   - O email deve chegar em alguns segundos

---

### Passo 3: Verificar Logs

#### No Frontend (Navegador)

1. Abra o **Console do Navegador** (F12)
2. Vá para a aba **Console**
3. Procure por mensagens como:
   ```
   ✅ Email enviado com sucesso
   ```

#### No Supabase Dashboard

1. Acesse o **Supabase Dashboard**
2. Vá para **Edge Functions** → **send-email-real**
3. Clique em **Logs** ou **View Logs**
4. Procure por mensagens:
   ```
   📨 Recebida requisição de envio SMTP REAL
   📧 Configurações SMTP encontradas
   📤 Enviando email via SMTP real...
   ✅ Email enviado com sucesso
   ```

#### No Banco de Dados

1. No Supabase Dashboard, vá para **Table Editor**
2. Abra a tabela `email_logs` (se existir)
3. Verifique se há um registro do email enviado

---

## 🚨 Solução de Problemas

### Erro: "Configurações SMTP não encontradas"

**Solução:**
1. Verifique se você salvou as configurações SMTP em Settings
2. Execute este SQL no Supabase:
```sql
SELECT * FROM public.smtp_settings WHERE user_id = auth.uid();
```
3. Se estiver vazio, configure novamente em Settings

---

### Erro: "Authentication failed" ou "Invalid credentials"

**Causas Comuns:**

**Gmail:**
- ❌ Usando senha normal (não funciona!)
- ✅ Use uma **Senha de App**:
  1. Vá para https://myaccount.google.com/security
  2. Ative a **Verificação em 2 etapas**
  3. Vá para **Senhas de app**
  4. Gere uma senha para "Email"
  5. Use essa senha de 16 caracteres

**Outlook:**
- ❌ Autenticação de 2 fatores ativa sem senha de app
- ✅ Desative a autenticação de 2 fatores OU use senha de app

**Outros:**
- Verifique as configurações SMTP do seu provedor
- Alguns provedores exigem configurações específicas

---

### Erro: "Connection timeout" ou "ETIMEDOUT"

**Soluções:**
1. Verifique se a **porta está correta**:
   - TLS: porta `587`
   - SSL: porta `465`
2. Verifique se o **host está correto**
3. Alguns provedores bloqueiam conexões de servidores cloud
4. Tente mudar de TLS para SSL ou vice-versa

---

### Email não chega

**Verifique:**
1. ✅ **Pasta de Spam**: O email pode estar lá
2. ✅ **Logs do Supabase**: Confirme que foi enviado
3. ✅ **Email correto**: Verifique se o destinatário está correto
4. ✅ **Configurações do provedor**: Alguns têm limites de envio

---

### Erro: "SMTP settings table not found"

**Solução:**
1. Execute o script SQL: `CRIAR_TABELA_SMTP_SETTINGS.sql`
2. No Supabase Dashboard → SQL Editor
3. Cole e execute o script completo

---

## 🔍 Comandos de Diagnóstico

Execute estes comandos SQL no Supabase para verificar:

### 1. Verificar se a tabela smtp_settings existe
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'smtp_settings' 
  AND table_schema = 'public'
) as tabela_existe;
```

### 2. Verificar suas configurações SMTP
```sql
SELECT 
  id, 
  user_id, 
  host, 
  port, 
  "user", 
  from_name, 
  security, 
  is_active,
  created_at
FROM public.smtp_settings
WHERE user_id = auth.uid();
```

### 3. Verificar edge function está ativa
```sql
-- Verifique no Dashboard: Edge Functions → send-email-real
-- Status deve estar: "Active" ou "Deployed"
```

### 4. Verificar políticas RLS
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'smtp_settings';
```

---

## 📊 Teste Completo - Checklist

Use este checklist para garantir que tudo está funcionando:

- [ ] Script SQL executado com sucesso
- [ ] Edge function deployada e ativa
- [ ] Configurações SMTP salvas no sistema
- [ ] Teste de envio executado
- [ ] Email recebido na caixa de entrada
- [ ] Logs no console do navegador sem erros
- [ ] Logs no Supabase confirmam envio
- [ ] Registro criado em email_logs (se tabela existir)

---

## 🎉 Sucesso!

Se todos os itens do checklist estão marcados, seu sistema SMTP está **100% funcional**!

### Funcionalidades Disponíveis:

✅ **Envio de emails reais** via SMTP  
✅ **Templates personalizados** de email  
✅ **Agendamento** de emails  
✅ **Envio em massa** para múltiplos destinatários  
✅ **Logs completos** de todos os envios  
✅ **Fallback automático** entre configurações  
✅ **Segurança RLS** habilitada  

---

## 📞 Suporte Adicional

Se encontrar problemas:

1. **Verifique os Logs**: Console do navegador e Supabase Dashboard
2. **Execute os comandos de diagnóstico** acima
3. **Revise as configurações SMTP**: Host, porta, credenciais
4. **Teste com outro provedor**: Se possível, teste com Gmail ou Outlook
5. **Verifique a documentação** do seu provedor de email

---

## 🔄 Comandos Úteis de Manutenção

### Limpar logs antigos (opcional)
```sql
DELETE FROM email_logs 
WHERE sent_at < NOW() - INTERVAL '30 days';
```

### Ver estatísticas de envio
```sql
SELECT 
  DATE(sent_at) as data,
  COUNT(*) as total_enviados,
  COUNT(DISTINCT to_email) as destinatarios_unicos
FROM email_logs
WHERE user_id = auth.uid()
GROUP BY DATE(sent_at)
ORDER BY data DESC;
```

### Desativar uma configuração SMTP
```sql
UPDATE smtp_settings 
SET is_active = false 
WHERE user_id = auth.uid() 
AND id = 'id-da-configuracao';
```

---

**Última atualização:** $(date)
**Versão:** 1.0.0
**Status:** ✅ Produção


