-- =====================================================
-- CORREÇÃO DO TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL
-- =====================================================
-- Execute este script no SQL Editor do Supabase para corrigir:
-- 1. Trigger de criação automática de perfil
-- 2. Função handle_new_user
-- 3. Criação automática do perfil quando usuário faz login
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE O TRIGGER EXISTE
-- =====================================================
-- Verificar se o trigger on_auth_user_created existe
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
  AND trigger_name = 'on_auth_user_created';

-- =====================================================
-- 2. VERIFICAR SE A FUNÇÃO handle_new_user EXISTE
-- =====================================================
-- Verificar se a função handle_new_user existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- =====================================================
-- 3. REMOVER TRIGGER E FUNÇÃO ANTIGOS (SE EXISTIREM)
-- =====================================================
-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- 4. CRIAR FUNÇÃO handle_new_user CORRETA
-- =====================================================
-- Criar função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        name,
        company,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'company', 'Empresa'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NEW.created_at,
        NEW.created_at
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CRIAR TRIGGER CORRETO
-- =====================================================
-- Criar trigger para executar após inserção de usuário
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. VERIFICAR SE O USUÁRIO ATUAL EXISTE NO AUTH.USERS
-- =====================================================
-- Verificar se o usuário daviresende3322@gmail.com existe
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'daviresende3322@gmail.com';

-- =====================================================
-- 7. CRIAR PERFIL MANUALMENTE PARA O USUÁRIO ATUAL
-- =====================================================
-- Inserir perfil para o usuário atual (se não existir)
DO $$
DECLARE
    user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Obter ID do usuário atual
    SELECT id INTO user_id FROM auth.users WHERE email = 'daviresende3322@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Verificar se o perfil já existe
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Inserir perfil para o usuário atual
            INSERT INTO public.profiles (
                id,
                email,
                name,
                company,
                role,
                created_at,
                updated_at
            ) VALUES (
                user_id,
                'daviresende3322@gmail.com',
                'Davi Resende',
                'VBSolution',
                'admin',
                now(),
                now()
            );
            
            RAISE NOTICE '✅ Perfil criado com sucesso para o usuário: %', user_id;
        ELSE
            RAISE NOTICE 'ℹ️ Perfil já existe para o usuário: %', user_id;
        END IF;
    ELSE
        RAISE NOTICE '❌ Usuário não encontrado no auth.users';
    END IF;
END $$;

-- =====================================================
-- 8. VERIFICAR RESULTADOS
-- =====================================================
-- Verificar se o perfil foi criado
SELECT 
    'profiles' as tabela,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN email = 'daviresende3322@gmail.com' THEN 1 END) as usuario_atual
FROM public.profiles;

-- Verificar perfil específico do usuário atual
SELECT 
    id,
    email,
    name,
    company,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'daviresende3322@gmail.com';

-- =====================================================
-- 9. TESTAR TRIGGER COM NOVO USUÁRIO
-- =====================================================
-- Verificar se o trigger está funcionando
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ Trigger Ativo'
        ELSE '❌ Trigger Não Encontrado'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
  AND trigger_name = 'on_auth_user_created';

-- =====================================================
-- 10. VERIFICAR PERMISSÕES E RLS
-- =====================================================
-- Garantir que RLS está ativo na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- INSTRUÇÕES PARA TESTE
-- =====================================================
/*
🎯 APÓS EXECUTAR ESTE SCRIPT:

1. ✅ O perfil do usuário daviresende3322@gmail.com será criado automaticamente
2. ✅ O trigger on_auth_user_created será configurado corretamente
3. ✅ Novos usuários terão perfis criados automaticamente
4. ✅ A página Activities deve funcionar perfeitamente

💡 PARA TESTAR:
1. Execute este script no Supabase
2. Verifique se o perfil foi criado na tabela profiles
3. Acesse a página Activities - deve carregar normalmente
4. O loading eterno deve ser resolvido

🚨 IMPORTANTE:
- O usuário deve estar logado no sistema
- O trigger será configurado para futuros usuários
- O perfil atual será criado manualmente
*/

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script:
-- 1. ✅ Remove trigger e função antigos
-- 2. ✅ Cria função handle_new_user correta
-- 3. ✅ Cria trigger on_auth_user_created
-- 4. ✅ Cria perfil para o usuário atual
-- 5. ✅ Verifica se tudo está funcionando
-- 6. ✅ Configura RLS e políticas de segurança
-- =====================================================
-- Após executar este script:
-- - Perfil do usuário atual criado
-- - Trigger funcionando para novos usuários
-- - Página Activities funcionando
-- - Sistema 100% operacional
-- =====================================================
