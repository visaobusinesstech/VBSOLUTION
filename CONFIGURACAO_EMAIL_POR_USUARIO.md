# 📧 Configuração de Email por Usuário - VB Solution CRM

## 🎯 Nova Arquitetura

Agora **cada usuário pode ter suas próprias configurações de email SMTP**! As configurações são salvas na tabela `user_profiles`, vinculadas diretamente ao usuário autenticado.

## ✅ Vantagens

- ✅ **Isolamento por Usuário**: Cada usuário tem suas próprias credenciais
- ✅ **Privacidade**: As configurações são privadas de cada usuário
- ✅ **Segurança**: Credenciais isoladas por usuário
- ✅ **Flexibilidade**: Cada usuário usa seu próprio servidor SMTP
- ✅ **Personalização**: Nome e assinatura personalizados por usuário

## 🔧 Passo 1: Configurar o Banco de Dados

### Opção A: Arquivo HTML (Automático)

1. Abra o arquivo `executar-smtp-user-profiles.html` no navegador
2. Clique em **"▶️ Executar Alterações no Supabase"**
3. Aguarde a confirmação
4. Pronto! ✅

### Opção B: SQL Editor Manual

1. Acesse: https://nrbsocawokmihvxfcpso.supabase.co/project/_/sql
2. Cole o SQL abaixo:

```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS email_porta INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS email_usuario TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT,
ADD COLUMN IF NOT EXISTS smtp_seguranca TEXT DEFAULT 'tls',
ADD COLUMN IF NOT EXISTS signature_image TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
```

3. Clique em **"Run"** ▶️
4. Aguarde a confirmação ✅

## 🚀 Passo 2: Configurar na Interface

### Para cada usuário:

1. Faça login no sistema
2. Vá em **Settings** → **Email**
3. Configure suas credenciais SMTP **pessoais**
4. Salve

## 📋 Configurações por Usuário

Cada usuário pode configurar:

### Servidor SMTP
- Gmail: `smtp.gmail.com`
- Outlook: `smtp-mail.outlook.com`
- Outro: consulte seu provedor

### Porta
- TLS: `587` (recomendado)
- SSL: `465`

### Nome do Remetente
- O nome que aparecerá nos emails que você enviar
- Exemplo: "João Silva - VB Solution"

### Email/Usuário
- Seu endereço de email pessoal
- Exemplo: joao.silva@empresa.com

### Senha/Token
- **Gmail**: Senha de App (recomendado)
- **Outlook**: Senha normal ou token
- **Outros**: Consulte seu provedor

### Segurança
- **TLS** (recomendado) ou **SSL**

## 👥 Cenário de Uso

### Empresa com 5 Usuários

**Usuário 1 - João (Vendedor)**
- Email: joao@gmail.com
- SMTP: smtp.gmail.com
- Nome: "João - Vendas"

**Usuário 2 - Maria (Gerente)**
- Email: maria@outlook.com
- SMTP: smtp-mail.outlook.com
- Nome: "Maria - Gerência"

**Usuário 3 - Pedro (Suporte)**
- Email: pedro@empresa.com
- SMTP: smtp.empresa.com
- Nome: "Pedro - Suporte"

Cada um tem suas próprias configurações independentes! 🎉

## 🔐 Segurança

### Boas Práticas

1. **Nunca compartilhe suas senhas**
2. **Use senhas de aplicativo** (Gmail, Outlook)
3. **Ative 2FA** na sua conta de email
4. **Monitore seus envios**

### Armazenamento

- Configurações salvas em `user_profiles`
- Vinculadas ao `auth.users(id)`
- RLS (Row Level Security) ativo
- Cada usuário só vê suas próprias configurações

## 📱 Exemplo: Configurar Gmail

### Passo a Passo

1. **Ativar 2FA no Gmail**
   - https://myaccount.google.com/security

2. **Gerar Senha de App**
   - https://myaccount.google.com/apppasswords
   - Selecione "Email" → "Outro"
   - Digite "VB Solution CRM"
   - Copie a senha gerada

3. **Configurar no Sistema**
   - Servidor SMTP: `smtp.gmail.com`
   - Porta: `587`
   - Email: seu-email@gmail.com
   - Senha: cola a senha de app
   - Nome: "Seu Nome - Cargo"
   - Segurança: `TLS`

## 🔄 Diferenças do Modelo Anterior

### Antes (company_settings)
❌ Configurações compartilhadas por toda empresa
❌ Um email para todos os usuários
❌ Menos flexibilidade

### Agora (user_profiles)
✅ Configurações individuais por usuário
✅ Cada usuário usa seu próprio email
✅ Total flexibilidade e privacidade

## 📊 Estrutura do Banco de Dados

```sql
user_profiles
├── id (UUID) → Referência ao auth.users
├── name (TEXT)
├── email (TEXT)
├── smtp_host (TEXT) ← NOVO
├── email_porta (INTEGER) ← NOVO
├── email_usuario (TEXT) ← NOVO
├── smtp_pass (TEXT) ← NOVO
├── smtp_from_name (TEXT) ← NOVO
├── smtp_seguranca (TEXT) ← NOVO
├── signature_image (TEXT) ← NOVO
└── two_factor_enabled (BOOLEAN) ← NOVO
```

## 🧪 Testar a Configuração

1. Configure seu email em Settings → Email
2. Vá para Leads ou Negociações
3. Envie um email de teste
4. Verifique se o email foi enviado do seu endereço
5. Confirme que o nome do remetente está correto

## 🐛 Solução de Problemas

### Erro: "Usuário não autenticado"
- Faça logout e login novamente
- Verifique se o token está válido

### Erro: "Falha na autenticação SMTP"
- Verifique email e senha
- Para Gmail, use senha de app
- Confirme que 2FA está ativo (Gmail)

### Erro: "Configurações não salvas"
- Execute o SQL no Supabase
- Verifique o console do navegador
- Confirme que está autenticado

## 📁 Arquivos Modificados

### Atualizados
- `frontend/src/hooks/useSettings.ts` - Agora usa `user_profiles`
- `frontend/src/components/EmailSettingsForm.tsx` - Mantido
- `frontend/src/components/SmtpStatusIndicator.tsx` - Mantido

### Novos
- `ADD_SMTP_COLUMNS_USER_PROFILES.sql` - SQL para user_profiles
- `executar-smtp-user-profiles.html` - Execução automática
- `CONFIGURACAO_EMAIL_POR_USUARIO.md` - Este arquivo

## ✅ Checklist

- [x] Hook useSettings atualizado para user_profiles
- [x] SQL criado para adicionar colunas em user_profiles
- [x] Arquivo HTML para execução automática
- [x] Documentação completa
- [ ] **VOCÊ DEVE**: Executar o SQL no Supabase
- [ ] **VOCÊ DEVE**: Configurar suas credenciais SMTP pessoais

## 🎉 Próximos Passos

1. ✅ Execute o SQL (arquivo HTML ou manual)
2. ✅ Acesse Settings → Email
3. ✅ Configure SEU email pessoal
4. ✅ Teste enviando um email
5. ✅ Cada usuário da empresa pode fazer o mesmo!

## 💡 Dicas Importantes

- Cada usuário deve configurar seu próprio email
- Use senhas de app, não senhas principais
- Teste antes de usar em produção
- Monitore os logs de envio

## 🆘 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Confirme que executou o SQL
3. Verifique se está autenticado
4. Revise este guia

---

**Agora você tem controle total sobre suas configurações de email! 🚀📧**
