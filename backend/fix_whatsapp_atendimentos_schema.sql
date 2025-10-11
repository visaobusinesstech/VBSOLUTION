-- Script para corrigir e criar a tabela whatsapp_atendimentos com todas as colunas necessárias
-- Esta tabela é responsável por gerenciar conversas/atendimentos do WhatsApp

-- Primeiro, vamos verificar se a tabela existe e criar se necessário
CREATE TABLE IF NOT EXISTS whatsapp_atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    owner_id UUID NOT NULL,
    connection_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    tags TEXT[],
    notes TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_chat_id ON whatsapp_atendimentos(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_owner_id ON whatsapp_atendimentos(owner_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_connection_id ON whatsapp_atendimentos(connection_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_status ON whatsapp_atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_assigned_to ON whatsapp_atendimentos(assigned_to);

-- Adicionar constraint única para evitar duplicatas por chat_id e status ativo
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_chat 
ON whatsapp_atendimentos (chat_id) 
WHERE status = 'ATIVO';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_atendimentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_whatsapp_atendimentos_updated_at ON whatsapp_atendimentos;
CREATE TRIGGER trigger_update_whatsapp_atendimentos_updated_at
    BEFORE UPDATE ON whatsapp_atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_atendimentos_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_atendimentos IS 'Tabela para gerenciar conversas/atendimentos do WhatsApp';
COMMENT ON COLUMN whatsapp_atendimentos.chat_id IS 'ID único do chat (ex: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN whatsapp_atendimentos.status IS 'Status do atendimento: ATIVO, FECHADO, PAUSADO';
COMMENT ON COLUMN whatsapp_atendimentos.owner_id IS 'ID do usuário proprietário do atendimento';
COMMENT ON COLUMN whatsapp_atendimentos.connection_id IS 'ID da conexão WhatsApp associada';
COMMENT ON COLUMN whatsapp_atendimentos.assigned_to IS 'ID do usuário responsável pelo atendimento';
COMMENT ON COLUMN whatsapp_atendimentos.priority IS 'Prioridade: BAIXA, NORMAL, ALTA, URGENTE';
COMMENT ON COLUMN whatsapp_atendimentos.tags IS 'Tags para categorização do atendimento';
COMMENT ON COLUMN whatsapp_atendimentos.notes IS 'Notas adicionais sobre o atendimento';

-- RLS (Row Level Security) para isolar dados por usuário
ALTER TABLE whatsapp_atendimentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios atendimentos
CREATE POLICY IF NOT EXISTS whatsapp_atendimentos_owner_policy ON whatsapp_atendimentos
    FOR ALL USING (owner_id = auth.uid()::text::uuid);

-- Política para permitir operações do service role
CREATE POLICY IF NOT EXISTS whatsapp_atendimentos_service_policy ON whatsapp_atendimentos
    FOR ALL USING (true);

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_atendimentos' 
ORDER BY ordinal_position;
