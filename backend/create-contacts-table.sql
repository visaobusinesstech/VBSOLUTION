-- Criar tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    gender VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
    pipeline VARCHAR(50),
    tags TEXT[],
    whatsapp_opted BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contact_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline ON contacts(pipeline);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Adicionar constraint para garantir que pelo menos email ou telefone seja fornecido
ALTER TABLE contacts ADD CONSTRAINT check_contact_info 
CHECK (phone IS NOT NULL AND phone != '');

-- Comentários para documentação
COMMENT ON TABLE contacts IS 'Tabela de contatos do sistema CRM';
COMMENT ON COLUMN contacts.id IS 'Identificador único do contato';
COMMENT ON COLUMN contacts.name IS 'Nome completo do contato';
COMMENT ON COLUMN contacts.phone IS 'Número de telefone (obrigatório)';
COMMENT ON COLUMN contacts.email IS 'Endereço de email (opcional)';
COMMENT ON COLUMN contacts.company IS 'Nome da empresa (opcional)';
COMMENT ON COLUMN contacts.gender IS 'Gênero do contato (opcional)';
COMMENT ON COLUMN contacts.status IS 'Status do contato: active, inactive, lead';
COMMENT ON COLUMN contacts.pipeline IS 'Pipeline de vendas (opcional)';
COMMENT ON COLUMN contacts.tags IS 'Array de tags para categorização';
COMMENT ON COLUMN contacts.whatsapp_opted IS 'Se o contato optou por receber mensagens WhatsApp';
COMMENT ON COLUMN contacts.profile_image_url IS 'URL da imagem de perfil';
COMMENT ON COLUMN contacts.created_at IS 'Data de criação do contato';
COMMENT ON COLUMN contacts.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN contacts.last_contact_at IS 'Data do último contato';
