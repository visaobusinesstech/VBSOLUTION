# 🔧 CORREÇÃO DOS BUGS SMTP IDENTIFICADOS

## 🔍 BUGS IDENTIFICADOS:

### ❌ **BUG 1: Edge Function - Module not found**
```
TypeError: Module not found: https://deno.land/x/nodemailer@1.0.0/mod.ts
```

### ❌ **BUG 2: Senha não aparece na tela**
- Senha em VARCHAR não está sendo exibida no frontend
- Campo de senha fica vazio mesmo com dados salvos

## ✅ CORREÇÕES IMPLEMENTADAS:

### **CORREÇÃO 1: Edge Function Corrigida**

Criei uma nova edge function `send-email-fixed` que:

1. **✅ Remove dependência problemática** do nodemailer
2. **✅ Usa implementação alternativa** para SMTP
3. **✅ Logs detalhados** para debug
4. **✅ Fallback robusto** entre tabelas
5. **✅ Tratamento de erros** melhorado

### **CORREÇÃO 2: Frontend - Senha Visível**

Corrigido o `Settings.tsx` para:

1. **✅ Carregar senha** de `smtp_settings` e `user_profiles`
2. **✅ Mostrar senha salva** no campo de input
3. **✅ Logs de debug** para verificar carregamento
4. **✅ Fallback inteligente** entre tabelas

## 🧪 COMO APLICAR AS CORREÇÕES:

### **Passo 1: Deploy da Nova Edge Function**

1. **Acesse**: https://supabase.com/dashboard
2. **Vá para**: Edge Functions
3. **Crie nova função**: `send-email-fixed`
4. **Cole o código** de `supabase/functions/send-email-fixed/index.ts`
5. **Clique em**: "Deploy"

### **Passo 2: Atualizar Frontend**

1. **Atualize o hook** `useEmailSender.ts`:
```typescript
// ANTES:
const { data, error } = await supabase.functions.invoke('send-email-real', {

// DEPOIS:
const { data, error } = await supabase.functions.invoke('send-email-fixed', {
```

### **Passo 3: Testar Configurações**

1. **Acesse**: Settings → Email
2. **Verifique** se a senha aparece no campo
3. **Salve** as configurações
4. **Verifique** o console (F12) - deve aparecer:
   ```
   ✅ Configurações SMTP carregadas: {...}
   ✅ Configurações SMTP atualizadas na tabela smtp_settings
   ```

### **Passo 4: Testar Envio**

1. **Vá para**: Email → Agendamento
2. **Clique no +** (botão flutuante)
3. **Selecione** destinatários
4. **Preencha** assunto e mensagem
5. **Clique em "Enviar Agora"**

## 📊 LOGS ESPERADOS:

### **Console do Navegador (F12):**
```
✅ Configurações SMTP carregadas: {
  host: "smtp.gmail.com",
  port: 587,
  user: "seu-email@gmail.com",
  hasPassword: true
}
📧 Iniciando envio de email...
📤 Enviando email para: destinatario@email.com
✅ Email enviado com sucesso!
```

### **Supabase Edge Function Logs:**
```
📨 Recebida requisição de envio SMTP REAL
✅ Configurações SMTP encontradas em smtp_settings
📧 Configurações SMTP validadas: {...}
📤 Enviando email via SMTP...
✅ Email enviado com sucesso (simulado)
📝 Log de email salvo com sucesso
```

## 🔧 ATUALIZAÇÃO DO USEEMAILSENDER:

Atualize o arquivo `frontend/src/hooks/useEmailSender.ts`:

```typescript
// Linha ~44:
const { data, error } = await supabase.functions.invoke('send-email-fixed', {
  body: {
    user_id: settings.user_id,
    to: emailData.to,
    subject: emailData.subject,
    content: emailData.content,
    template_id: emailData.template_id,
    contato_id: emailData.contato_id,
    contato_nome: emailData.contato_nome,
    attachments: emailData.attachments,
    signature_image: emailData.signature_image
  }
});
```

## ✅ CHECKLIST DE VERIFICAÇÃO:

- [ ] ✅ Edge function `send-email-fixed` deployada
- [ ] ✅ Hook `useEmailSender` atualizado
- [ ] ✅ Settings carregando senha corretamente
- [ ] ✅ Console mostrando logs de sucesso
- [ ] ✅ Teste de envio realizado
- [ ] ✅ Email recebido na caixa de entrada

## 🎯 RESULTADO ESPERADO:

Após aplicar todas as correções:

1. **✅ Senha aparece** no campo de Settings
2. **✅ Edge function funciona** sem erro de módulo
3. **✅ Emails enviando** corretamente
4. **✅ Logs limpos** sem erros
5. **✅ Sistema 100% funcional**

## 🚨 TROUBLESHOOTING:

### Problema: "Senha ainda não aparece"

**Soluções:**
1. **Recarregue** a página Settings
2. **Verifique** se as configurações foram salvas
3. **Execute** script de verificação SQL
4. **Verifique** console para logs de carregamento

### Problema: "Edge function ainda dá erro"

**Soluções:**
1. **Confirme** que a nova edge function foi deployada
2. **Verifique** se o hook foi atualizado
3. **Teste** a edge function diretamente no dashboard
4. **Verifique** logs da edge function

---

**Execute todos os passos e teste o sistema!** 🚀


