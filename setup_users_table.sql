-- Script para criar tabela users e inserir dados de teste
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir usuário de teste
INSERT INTO users (id, email, name) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'teste@empresa.com', 'Usuário Teste')
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar se foi inserido
SELECT * FROM users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 4. Inserir leads de teste
INSERT INTO leads (name, email, phone, company, value, stage_id, priority, status, source, owner_id) VALUES
('João Silva', 'joao@empresa.com', '(11) 99999-0001', 'Empresa A', 15000, (SELECT id FROM funnel_stages WHERE name = 'Qualified' LIMIT 1), 'high', 'open', 'website', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Maria Santos', 'maria@empresa.com', '(11) 99999-0002', 'Empresa B', 25000, (SELECT id FROM funnel_stages WHERE name = 'Contact Made' LIMIT 1), 'medium', 'open', 'referral', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Pedro Costa', 'pedro@empresa.com', '(11) 99999-0003', 'Empresa C', 18000, (SELECT id FROM funnel_stages WHERE name = 'Demo Scheduled' LIMIT 1), 'high', 'open', 'linkedin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Ana Oliveira', 'ana@empresa.com', '(11) 99999-0004', 'Empresa D', 32000, (SELECT id FROM funnel_stages WHERE name = 'Proposal Made' LIMIT 1), 'medium', 'open', 'email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('Carlos Ferreira', 'carlos@empresa.com', '(11) 99999-0005', 'Empresa E', 22000, (SELECT id FROM funnel_stages WHERE name = 'Negotiations Started' LIMIT 1), 'high', 'open', 'phone', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- 5. Verificar leads inseridos
SELECT l.*, fs.name as stage_name FROM leads l 
LEFT JOIN funnel_stages fs ON l.stage_id = fs.id 
ORDER BY l.created_at DESC;
