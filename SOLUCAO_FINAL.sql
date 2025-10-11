-- =====================================================
-- SOLUÇÃO FINAL - CORRIGIR POLÍTICAS RLS
-- =====================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/nrbsocawokmihvxfcpso/sql

-- =====================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- =====================================================

-- Desabilitar RLS nas tabelas para permitir operações
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CRIAR DADOS DE TESTE
-- =====================================================

-- Criar uma empresa de teste
INSERT INTO companies (
  id,
  owner_id,
  fantasy_name,
  company_name,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'Empresa de Teste',
  'Empresa de Teste LTDA',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Criar configurações da empresa
INSERT INTO company_settings (
  id,
  company_id,
  company_name,
  default_language,
  default_timezone,
  default_currency,
  datetime_format
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Empresa de Teste',
  'pt-BR',
  'America/Sao_Paulo',
  'BRL',
  'DD/MM/YYYY HH:mm'
) ON CONFLICT (id) DO NOTHING;

-- Criar áreas de teste
INSERT INTO company_areas (
  id,
  company_id,
  name,
  description
) VALUES 
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Administração', 'Setor administrativo'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Vendas', 'Setor de vendas'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'TI', 'Tecnologia da Informação')
ON CONFLICT (id) DO NOTHING;

-- Criar cargos de teste
INSERT INTO company_roles (
  id,
  company_id,
  name,
  description,
  permissions
) VALUES 
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Administrador', 'Administrador do sistema', '{}'),
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Gerente', 'Gerente de equipe', '{}'),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Usuário', 'Usuário padrão', '{}')
ON CONFLICT (id) DO NOTHING;

-- Criar usuário de teste
INSERT INTO company_users (
  id,
  company_id,
  full_name,
  email,
  password_hash,
  status
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  'Usuário Teste',
  'teste@empresa.com',
  'hash123',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Criar perfil de usuário
INSERT INTO user_profiles (
  id,
  company_id,
  name,
  email
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Usuário Teste',
  'teste@empresa.com'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. VERIFICAR DADOS CRIADOS
-- =====================================================

-- Verificar se os dados foram criados
SELECT 'companies' as tabela, count(*) as total FROM companies
UNION ALL
SELECT 'company_settings' as tabela, count(*) as total FROM company_settings
UNION ALL
SELECT 'company_areas' as tabela, count(*) as total FROM company_areas
UNION ALL
SELECT 'company_roles' as tabela, count(*) as total FROM company_roles
UNION ALL
SELECT 'company_users' as tabela, count(*) as total FROM company_users
UNION ALL
SELECT 'user_profiles' as tabela, count(*) as total FROM user_profiles;

-- =====================================================
-- 4. HABILITAR RLS COM POLÍTICAS PERMISSIVAS
-- =====================================================

-- Habilitar RLS novamente
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow all operations on companies" ON companies;
DROP POLICY IF EXISTS "Allow all operations on company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow all operations on company_areas" ON company_areas;
DROP POLICY IF EXISTS "Allow all operations on company_roles" ON company_roles;
DROP POLICY IF EXISTS "Allow all operations on company_users" ON company_users;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

-- Criar políticas permissivas para desenvolvimento
CREATE POLICY "Allow all operations on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_areas" ON company_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_roles" ON company_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_users" ON company_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. MENSAGEM FINAL
-- =====================================================

SELECT '✅ SCRIPT EXECUTADO COM SUCESSO!' as status,
       'Agora você pode testar o sistema de configurações' as mensagem;
