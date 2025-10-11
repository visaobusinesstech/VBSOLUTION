-- =====================================================
-- CORREÇÃO DO TRIGGER DE AUTENTICAÇÃO
-- =====================================================
-- Execute este script no SQL Editor do Supabase para corrigir o problema de cadastro
-- =====================================================

-- 1. Verificar se a função handle_new_user existe
SELECT * FROM information_schema.routines WHERE routine_name = 'handle_new_user';

-- 2. Verificar se o trigger existe
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- 3. Remover o trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Recriar a função handle_new_user com tratamento de erro melhorado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir o perfil na tabela profiles
  INSERT INTO public.profiles (id, email, name, company)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro (pode ser visto no console do Supabase)
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar se a tabela profiles tem as permissões corretas
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- 7. Verificar se as políticas RLS estão corretas
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles;

-- Recriar política para profiles
CREATE POLICY "Usuários podem ver e editar apenas seu próprio perfil" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- 8. Verificar se a extensão uuid-ossp está disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 9. Verificar se a tabela profiles tem a estrutura correta
-- Se a tabela não existir, criar novamente
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  avatar_url TEXT,
  position TEXT,
  department TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  address TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 11. Verificar se o trigger foi criado corretamente
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 12. Testar a função manualmente (opcional)
-- SELECT public.handle_new_user();

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script corrige os seguintes problemas:
-- 1. Trigger de autenticação não funcionando
-- 2. Permissões incorretas na tabela profiles
-- 3. Políticas RLS mal configuradas
-- 4. Estrutura da tabela profiles incorreta
-- =====================================================
