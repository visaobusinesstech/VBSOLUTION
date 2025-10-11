# 🔧 Instruções para Corrigir os Erros

## 📋 Problemas Identificados

1. **❌ Erro de Foreign Key**: A tabela `leads` não tem a foreign key `stage_id` configurada corretamente
2. **❌ Erro de RLS**: Políticas de Row Level Security estão bloqueando a criação de leads
3. **❌ Erro de WebSocket**: Tentativas de conexão com servidor não disponível

## 🚀 Soluções Implementadas

### ✅ 1. Correção do WebSocket
- Adicionado tratamento de erro para conexões WebSocket
- Configurado timeout reduzido (5s)
- Adicionado fallback para continuar sem funcionalidades em tempo real
- **Status**: ✅ CORRIGIDO

### ✅ 2. Script SQL para Corrigir Banco de Dados
- Criado arquivo `fix_leads_rls.sql` com todas as correções necessárias
- **Status**: ⏳ PENDENTE - Precisa ser executado manualmente

## 📝 Passos para Executar a Correção

### Passo 1: Executar Script SQL no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto: `nrbsocawokmihvxfcpso`
3. Clique em **SQL Editor** no menu lateral
4. Copie todo o conteúdo do arquivo `fix_leads_rls.sql`
5. Cole no editor SQL
6. Clique em **Run** para executar

### Passo 2: Verificar se a Correção Funcionou

Após executar o script SQL, você deve ver:
```
========================================
CORREÇÃO CONCLUÍDA COM SUCESSO!
========================================
✅ RLS configurado corretamente
✅ Foreign key stage_id adicionada
✅ Etapas do funil criadas
✅ Índices criados para performance
========================================
```

### Passo 3: Reiniciar o Servidor de Desenvolvimento

```bash
# Parar o servidor atual (Ctrl+C)
# Depois executar:
pnpm dev
```

### Passo 4: Testar Criação de Leads

1. Acesse a página de leads no frontend
2. Tente criar um novo lead
3. Verifique se não há mais erros no console

## 🔍 Verificação dos Erros

### Antes da Correção:
- ❌ `Could not find a relationship between 'Leads' and 'funnel_stages'`
- ❌ `new row violates row-level security policy for table "leads"`
- ❌ `WebSocket connection to 'ws://localhost:3000/socket.io/' failed`

### Após a Correção:
- ✅ Leads podem ser criados sem erro de foreign key
- ✅ RLS configurado corretamente
- ✅ WebSocket falha silenciosamente sem quebrar a aplicação

## 📁 Arquivos Modificados

1. **`fix_leads_rls.sql`** - Script SQL para corrigir banco de dados
2. **`src/lib/socket.ts`** - Tratamento de erro WebSocket
3. **`src/hooks/useSocket.ts`** - Tratamento de erro WebSocket
4. **`src/lib/useChatSocket.ts`** - Tratamento de erro WebSocket
5. **`src/hooks/useRealtimeEvents.ts`** - Tratamento de erro WebSocket

## ⚠️ Observações Importantes

- O WebSocket foi configurado para falhar silenciosamente quando o servidor não estiver disponível
- As funcionalidades em tempo real podem não funcionar até que o servidor backend seja configurado
- O sistema continuará funcionando normalmente para criação e gerenciamento de leads

## 🆘 Se Ainda Houver Problemas

1. Verifique se o script SQL foi executado completamente
2. Confirme se as credenciais do Supabase estão corretas
3. Verifique se o servidor de desenvolvimento foi reiniciado
4. Limpe o cache do navegador (Ctrl+Shift+R)

## 📞 Suporte

Se precisar de ajuda adicional, verifique:
- Console do navegador para erros JavaScript
- Logs do Supabase para erros de banco de dados
- Network tab para verificar requisições HTTP

