-- Adicionar colunas faltantes na tabela whatsapp_atendimentos
ALTER TABLE whatsapp_atendimentos 
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Alterar o tipo da coluna connection_id de integer para varchar
ALTER TABLE whatsapp_atendimentos 
ALTER COLUMN connection_id TYPE VARCHAR(255);

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_assigned_to ON whatsapp_atendimentos(assigned_to);

-- Adicionar constraint única para evitar duplicatas por chat_id e status ativo
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_chat 
ON whatsapp_atendimentos (chat_id) 
WHERE status = 'ATIVO';

-- Criar políticas RLS
CREATE POLICY IF NOT EXISTS whatsapp_atendimentos_owner_policy ON whatsapp_atendimentos
    FOR ALL USING (owner_id = auth.uid()::text::uuid);

CREATE POLICY IF NOT EXISTS whatsapp_atendimentos_service_policy ON whatsapp_atendimentos
    FOR ALL USING (true);

-- Verificar se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_atendimentos' 
ORDER BY ordinal_position;
