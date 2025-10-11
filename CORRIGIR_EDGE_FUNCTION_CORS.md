# 🔧 CORREÇÃO DOS PROBLEMAS IDENTIFICADOS

## 🚨 **PROBLEMAS ENCONTRADOS:**

1. **❌ CORS Error** na edge function `send-email-smtp`
2. **❌ 403 Forbidden** na tabela `scheduled_emails`

---

## **🔧 SOLUÇÃO 1: CORRIGIR TABELA SCHEDULED_EMAILS**

### **Execute este SQL no Supabase:**

```sql
-- Execute o arquivo CORRIGIR_SCHEDULED_EMAILS.sql
-- Ele vai:
-- ✅ Criar a tabela scheduled_emails se não existir
-- ✅ Configurar RLS corretamente
-- ✅ Criar políticas de acesso
-- ✅ Criar tabela email_logs para logs
```

---

## **🔧 SOLUÇÃO 2: CORRIGIR EDGE FUNCTION**

### **O problema pode ser:**

1. **Edge function não deployada corretamente**
2. **Erro interno na edge function**
3. **Configuração de CORS incorreta**

### **COMO CORRIGIR:**

#### **OPÇÃO A: Redeploy da Edge Function**

1. **Acesse**: Supabase Dashboard → Edge Functions
2. **Encontre**: `send-email-smtp`
3. **Clique em**: "Deploy" novamente
4. **Aguarde** o deploy completar

#### **OPÇÃO B: Verificar Logs da Edge Function**

1. **Acesse**: Supabase Dashboard → Edge Functions
2. **Clique em**: `send-email-smtp`
3. **Aba**: "Logs"
4. **Procure por erros** quando tentar enviar email

#### **OPÇÃO C: Usar Edge Function Alternativa**

Se a `send-email-smtp` continuar com problemas, podemos criar uma nova:

1. **Criar nova função**: `send-email-simple`
2. **Código mais simples** sem dependências complexas
3. **Foco apenas no envio individual**

---

## **🧪 TESTE APÓS CORREÇÕES:**

### **1. Execute o SQL:**
```bash
# Execute CORRIGIR_SCHEDULED_EMAILS.sql no Supabase
```

### **2. Teste o envio de email:**
1. **Abra o sistema**
2. **Vá para**: Email → Agendamentos
3. **Clique no "+"**
4. **Preencha os dados**
5. **Clique em "Enviar Agora"**

### **3. Verifique os logs:**
- **Console do navegador**: Sem erros CORS
- **Supabase Logs**: Edge function funcionando
- **Banco de dados**: Registros salvos

---

## **📊 RESULTADO ESPERADO:**

- ✅ **Sem erros CORS**
- ✅ **Email enviado com sucesso**
- ✅ **Dados salvos no banco**
- ✅ **Logs funcionando**

---

## **🚀 PRÓXIMOS PASSOS:**

1. **Execute o SQL** `CORRIGIR_SCHEDULED_EMAILS.sql`
2. **Teste o envio** de email
3. **Se ainda der erro**, me avise para criarmos uma edge function alternativa
4. **Verifique os logs** no Supabase

**Execute o SQL primeiro e teste!** 🎯


