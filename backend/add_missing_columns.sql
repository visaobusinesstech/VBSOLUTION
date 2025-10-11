-- Adicionar colunas faltantes na tabela whatsapp_sessions
ALTER TABLE whatsapp_sessions 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_info JSONB,
ADD COLUMN IF NOT EXISTS duplicate_reason VARCHAR(100);

-- Adicionar constraint única para evitar duplicatas por owner_id e connection_id
ALTER TABLE whatsapp_sessions 
ADD CONSTRAINT IF NOT EXISTS unique_owner_connection 
UNIQUE (owner_id, connection_id);

-- Adicionar constraint única para evitar duplicatas por phone_number quando conectado
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_phone_connected 
ON whatsapp_sessions (phone_number) 
WHERE status = 'connected' AND phone_number IS NOT NULL;

-- Criar políticas RLS
CREATE POLICY IF NOT EXISTS whatsapp_sessions_owner_policy ON whatsapp_sessions
    FOR ALL USING (owner_id = auth.uid()::text::uuid);

CREATE POLICY IF NOT EXISTS whatsapp_sessions_service_policy ON whatsapp_sessions
    FOR ALL USING (true);

-- Verificar se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_sessions' 
ORDER BY ordinal_position;
