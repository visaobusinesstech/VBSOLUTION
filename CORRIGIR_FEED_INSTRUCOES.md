# 🔧 Corrigir Erro do Feed - Instruções

## ⚠️ Problema Identificado
O erro 400 que está ocorrendo na criação de posts é causado por uma **constraint** na tabela `feed` do Supabase que só permite os tipos `'image', 'video', 'event'`, mas o código está tentando criar posts com tipo `'text'`.

## ✅ Solução

### 1. **Acesse o Supabase**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto `VBSolutionCRM`

### 2. **Execute o Script de Correção**
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `fix_feed_type_constraint.sql`
4. Clique em **Run** para executar o script

### 3. **Script SQL de Correção**
```sql
-- Script para corrigir a constraint da tabela feed
-- Execute este script no SQL Editor do Supabase para permitir posts de texto

-- 1. Remover a constraint existente
ALTER TABLE public.feed DROP CONSTRAINT IF EXISTS feed_type_check;

-- 2. Adicionar a nova constraint que inclui 'text'
ALTER TABLE public.feed ADD CONSTRAINT feed_type_check 
  CHECK (type IN ('text', 'image', 'video', 'event'));

-- 3. Verificar se a alteração foi aplicada
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.feed'::regclass 
  AND conname = 'feed_type_check';
```

### 4. **Verificar se Funcionou**
Após executar o script:
1. Volte para o seu CRM
2. Acesse `/feed`
3. Tente criar um post de texto
4. O post deve ser criado com sucesso

## 🚀 Após a Correção
Quando a constraint for corrigida, o feed funcionará normalmente para:
- ✅ Posts de texto
- ✅ Posts com imagem
- ✅ Posts com vídeo
- ✅ Posts de evento

## 📋 Arquivos Atualizados
- `create_feed_tables.sql` - Script principal atualizado
- `SCRIPT_CORRIGIDO_SUPABASE.sql` - Script corrigido
- `SCRIPT_SIMPLES_SUPABASE.sql` - Script simples corrigido
- `fix_feed_type_constraint.sql` - Script específico para correção

## 🔍 Verificação
Se ainda houver problemas após executar o script, verifique:
1. Se as tabelas `feed`, `feed_likes` e `feed_comments` existem
2. Se as políticas RLS estão configuradas corretamente
3. Se o bucket `feed-media` existe no Storage
