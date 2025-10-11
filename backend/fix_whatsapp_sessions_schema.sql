-- Script para corrigir e criar a tabela whatsapp_sessions com todas as colunas necessárias
-- Este script garante que a tabela tenha todas as colunas necessárias para o funcionamento do WhatsApp Baileys

-- Primeiro, vamos verificar se a tabela existe e criar se necessário
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    qr_code TEXT,
    phone_number VARCHAR(20),
    whatsapp_id VARCHAR(255),
    whatsapp_info JSONB,
    connected_at TIMESTAMP WITH TIME ZONE,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duplicate_reason VARCHAR(100)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_owner_id ON whatsapp_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_connection_id ON whatsapp_sessions(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone_number ON whatsapp_sessions(phone_number);

-- Adicionar constraint única para evitar duplicatas por owner_id e connection_id
ALTER TABLE whatsapp_sessions 
ADD CONSTRAINT IF NOT EXISTS unique_owner_connection 
UNIQUE (owner_id, connection_id);

-- Adicionar constraint única para evitar duplicatas por phone_number quando conectado
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_phone_connected 
ON whatsapp_sessions (phone_number) 
WHERE status = 'connected' AND phone_number IS NOT NULL;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER trigger_update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_sessions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_sessions IS 'Tabela para armazenar sessões do WhatsApp Baileys de forma persistente';
COMMENT ON COLUMN whatsapp_sessions.owner_id IS 'ID do usuário proprietário da sessão';
COMMENT ON COLUMN whatsapp_sessions.session_name IS 'Nome da sessão (ex: "Conexão Principal")';
COMMENT ON COLUMN whatsapp_sessions.status IS 'Status da conexão: connected, disconnected, duplicate';
COMMENT ON COLUMN whatsapp_sessions.connection_id IS 'ID único da conexão (ex: connection_1234567890)';
COMMENT ON COLUMN whatsapp_sessions.qr_code IS 'QR Code em base64 para autenticação';
COMMENT ON COLUMN whatsapp_sessions.phone_number IS 'Número de telefone do WhatsApp (apenas números)';
COMMENT ON COLUMN whatsapp_sessions.whatsapp_id IS 'ID completo do WhatsApp (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_sessions.whatsapp_info IS 'Informações completas do WhatsApp em JSON';
COMMENT ON COLUMN whatsapp_sessions.connected_at IS 'Timestamp de quando a conexão foi estabelecida';
COMMENT ON COLUMN whatsapp_sessions.disconnected_at IS 'Timestamp de quando a conexão foi perdida';
COMMENT ON COLUMN whatsapp_sessions.duplicate_reason IS 'Motivo da duplicata (ex: PHONE_NUMBER_ALREADY_CONNECTED)';

-- RLS (Row Level Security) para isolar dados por usuário
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias sessões
CREATE POLICY IF NOT EXISTS whatsapp_sessions_owner_policy ON whatsapp_sessions
    FOR ALL USING (owner_id = auth.uid()::text::uuid);

-- Política para permitir operações do service role
CREATE POLICY IF NOT EXISTS whatsapp_sessions_service_policy ON whatsapp_sessions
    FOR ALL USING (true);

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_sessions' 
ORDER BY ordinal_position;
