-- Script para corrigir o problema do user_id null na tabela templates
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar se há templates com user_id null
SELECT 
    id,
    nome,
    user_id,
    owner_id,
    canal,
    status,
    created_at
FROM public.templates
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- 2. Verificar se há usuários autenticados
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Atualizar templates com user_id null para o primeiro usuário disponível
-- (Substitua o UUID abaixo pelo ID do seu usuário)
UPDATE public.templates 
SET user_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
),
owner_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE user_id IS NULL;

-- 4. Verificar se a atualização funcionou
SELECT 
    id,
    nome,
    user_id,
    owner_id,
    canal,
    status,
    created_at
FROM public.templates
ORDER BY created_at DESC;

-- 5. Remover a inserção automática de template de teste (que estava causando o erro)
-- Esta parte não é mais necessária, mas deixamos comentada para referência
/*
INSERT INTO public.templates (user_id, owner_id, nome, conteudo, canal, status)
SELECT 
    auth.uid(),
    auth.uid(),
    'Template de Teste',
    'Este é um template de teste para verificar se a funcionalidade está funcionando.',
    'email',
    'ativo'
WHERE NOT EXISTS (
    SELECT 1 FROM public.templates 
    WHERE user_id = auth.uid() 
    AND canal = 'email' 
    AND status = 'ativo'
);
*/

-- 6. Verificar se RLS está funcionando corretamente
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'templates' 
AND schemaname = 'public';

-- 7. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'templates' 
AND schemaname = 'public';

-- 8. Teste final: tentar selecionar templates (deve funcionar se estiver logado)
SELECT 
    id,
    nome,
    canal,
    status,
    created_at
FROM public.templates
WHERE user_id = auth.uid()
ORDER BY created_at DESC;


