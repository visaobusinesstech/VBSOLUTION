# 🔐 Correção: Senha SMTP Não Está Sendo Salva

## 🔍 PROBLEMA IDENTIFICADO

A senha SMTP não está sendo salva por dois motivos:

1. **Condição incorreta** no código: `&& formData.smtp_pass` impedia salvar senhas vazias
2. **Falta de sincronização** entre `user_profiles` e `smtp_settings`

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Corrigido useSettings.ts**

**ANTES (linha 95):**
```typescript
if (formData.smtp_pass !== undefined && formData.smtp_pass) dataToSave.smtp_pass = formData.smtp_pass;
```

**DEPOIS:**
```typescript
if (formData.smtp_pass !== undefined) userProfileData.smtp_pass = formData.smtp_pass; // SEMPRE salvar senha
```

### 2. **Adicionada Sincronização Dupla**

Agora salva em **ambas** as tabelas:
- ✅ `user_profiles` - Para compatibilidade
- ✅ `smtp_settings` - Para edge function

### 3. **Logs de Debug**

Adicionados logs para verificar:
```
✅ Configurações SMTP atualizadas na tabela smtp_settings
✅ Configurações SMTP criadas na tabela smtp_settings
```

## 🧪 COMO TESTAR A CORREÇÃO

### 1. **Verificar Configurações Atuais**

Execute no Supabase SQL Editor:
```sql
-- Verificar senhas salvas
SELECT 
    email_usuario,
    smtp_host,
    CASE 
        WHEN smtp_pass IS NOT NULL AND smtp_pass != '' THEN '✅ Senha OK'
        ELSE '❌ Sem senha'
    END as status_senha,
    LENGTH(smtp_pass) as tamanho_senha
FROM public.user_profiles
WHERE smtp_host IS NOT NULL;
```

### 2. **Testar Salvamento**

1. **Acesse**: Settings → Email
2. **Preencha** as configurações SMTP:
   - Host: `smtp.gmail.com`
   - Porta: `587`
   - Usuário: `seu-email@gmail.com`
   - **Senha**: `sua-senha-de-app`
   - Segurança: `TLS`
   - Nome: `Seu Nome`
3. **Clique em "Salvar"**
4. **Verifique o console** (F12) - deve aparecer:
   ```
   ✅ Configurações SMTP atualizadas na tabela smtp_settings
   ```

### 3. **Verificar Se Salvou**

Execute novamente:
```sql
SELECT 
    email_usuario,
    CASE 
        WHEN smtp_pass IS NOT NULL AND smtp_pass != '' THEN '✅ Senha OK'
        ELSE '❌ Sem senha'
    END as status_senha,
    LENGTH(smtp_pass) as tamanho_senha
FROM public.user_profiles
WHERE smtp_host IS NOT NULL;
```

**Resultado esperado:**
- ✅ Senha OK
- Tamanho > 0

### 4. **Testar Envio de Email**

1. **Vá para**: Email → Agendamento
2. **Clique no +** (botão flutuante)
3. **Selecione** destinatários
4. **Preencha** assunto e mensagem
5. **Clique em "Enviar Agora"**

**Deve funcionar sem erro de autenticação!**

## 🔧 TROUBLESHOOTING

### Problema: "Ainda não está salvando"

**Soluções:**
1. **Limpe o cache** do navegador (Ctrl+F5)
2. **Verifique console** (F12) por erros
3. **Execute script de verificação**: `VERIFICAR_SENHAS_SMTP.sql`

### Problema: "Erro de autenticação"

**Possíveis causas:**
- **Gmail**: Use senha de app, não senha normal
- **Outlook**: Verifique se a senha está correta
- **Outros**: Confirme credenciais com o provedor

### Problema: "Configurações não aparecem"

**Soluções:**
1. **Recarregue** a página
2. **Faça logout/login** novamente
3. **Verifique** se está logado com o usuário correto

## 📊 VERIFICAÇÃO COMPLETA

Execute este script para diagnóstico completo:

```sql
-- Verificação completa das senhas SMTP
SELECT 
    'RESUMO SENHAS SMTP' as titulo,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_host IS NOT NULL) as usuarios_com_smtp,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_pass IS NOT NULL AND smtp_pass != '') as usuarios_com_senha,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE is_active = true) as configuracoes_ativas,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE pass IS NOT NULL AND pass != '') as configuracoes_com_senha;
```

## 🎯 CONFIGURAÇÕES RECOMENDADAS

### Gmail:
```
Host: smtp.gmail.com
Porta: 587
Usuário: seu-email@gmail.com
Senha: [senha-de-app-16-caracteres]
Segurança: TLS
Nome: Seu Nome
```

### Outlook:
```
Host: smtp-mail.outlook.com
Porta: 587
Usuário: seu-email@outlook.com
Senha: [sua-senha-normal]
Segurança: TLS
Nome: Seu Nome
```

### Yahoo:
```
Host: smtp.mail.yahoo.com
Porta: 587
Usuário: seu-email@yahoo.com
Senha: [sua-senha-normal]
Segurança: TLS
Nome: Seu Nome
```

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] ✅ Código corrigido (useSettings.ts)
- [ ] ✅ Configurações SMTP preenchidas
- [ ] ✅ Senha salva (verificar com SQL)
- [ ] ✅ Teste de envio realizado
- [ ] ✅ Email recebido na caixa de entrada
- [ ] ✅ Logs sem erros de autenticação

---

**Status:** ✅ Problema Corrigido
**Data:** 2025-10-10
**Versão:** 2.1.0


