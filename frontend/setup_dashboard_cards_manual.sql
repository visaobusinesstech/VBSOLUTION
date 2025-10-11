-- Execute este SQL manualmente no Supabase SQL Editor
-- Para criar a tabela dashboard_cards e configurar as permissões

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS dashboard_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  card_id VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  visible BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas uma configuração por card_id
  UNIQUE(owner_id, card_id)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_dashboard_cards_owner_id ON dashboard_cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_cards_company_id ON dashboard_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_cards_position ON dashboard_cards(owner_id, position);

-- 3. Habilitar RLS
ALTER TABLE dashboard_cards ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
CREATE POLICY "Users can view their own dashboard cards" ON dashboard_cards
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own dashboard cards" ON dashboard_cards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own dashboard cards" ON dashboard_cards
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own dashboard cards" ON dashboard_cards
  FOR DELETE USING (auth.uid() = owner_id);

-- 5. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_dashboard_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_dashboard_cards_updated_at
  BEFORE UPDATE ON dashboard_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_cards_updated_at();

-- 7. Inserir cartões padrão para usuários existentes (opcional)
-- Descomente as linhas abaixo se quiser popular com dados padrão para usuários existentes

-- INSERT INTO dashboard_cards (owner_id, card_id, title, card_type, visible, position)
-- SELECT 
--   u.id as owner_id,
--   'recentes' as card_id,
--   'Recentes' as title,
--   'recentes' as card_type,
--   true as visible,
--   0 as position
-- FROM auth.users u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM dashboard_cards dc WHERE dc.owner_id = u.id AND dc.card_id = 'recentes'
-- );

-- Repita o INSERT acima para cada cartão padrão:
-- 'agenda', 'pendentes', 'andamento', 'atrasadas', 'equipes', 'projetos', 'standup'

-- Verificar se a tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'dashboard_cards' 
ORDER BY ordinal_position;
