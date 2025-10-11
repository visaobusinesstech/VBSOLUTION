-- Migração para criar tabelas de suporte necessárias para ai_agent_actions
-- Estas tabelas são referenciadas pelas ações do AI Agent

-- 1. Tabela de contatos
CREATE TABLE IF NOT EXISTS contatos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações básicas
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    cargo VARCHAR(255),
    
    -- Informações adicionais
    data_nascimento DATE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(10),
    pais VARCHAR(100) DEFAULT 'Brasil',
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'ativo',
    origem VARCHAR(100),
    tags TEXT[],
    observacoes TEXT,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Tabela de conversas
CREATE TABLE IF NOT EXISTS conversas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
    ai_agent_config_id UUID REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
    
    -- Informações da conversa
    titulo VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ativa',
    canal VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, telegram, web, etc.
    
    -- Dados da conversa
    mensagens JSONB DEFAULT '[]'::jsonb,
    contexto JSONB DEFAULT '{}'::jsonb,
    variaveis_coletadas JSONB DEFAULT '{}'::jsonb,
    
    -- Configurações
    configuracao JSONB DEFAULT '{}'::jsonb,
    preferencias JSONB DEFAULT '{}'::jsonb,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 3. Tabela de equipes
CREATE TABLE IF NOT EXISTS equipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações da equipe
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6366f1', -- Cor em hex
    
    -- Configurações
    configuracao JSONB DEFAULT '{}'::jsonb,
    permissoes JSONB DEFAULT '{}'::jsonb,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 4. Tabela de membros da equipe
CREATE TABLE IF NOT EXISTS equipe_membros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipe_id UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraint para evitar duplicatas
    UNIQUE(equipe_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contatos_owner_id ON contatos(owner_id);
CREATE INDEX IF NOT EXISTS idx_contatos_email ON contatos(email);
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos(telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);
CREATE INDEX IF NOT EXISTS idx_contatos_created_at ON contatos(created_at);

CREATE INDEX IF NOT EXISTS idx_conversas_owner_id ON conversas(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversas_contact_id ON conversas(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversas_ai_agent_config_id ON conversas(ai_agent_config_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status ON conversas(status);
CREATE INDEX IF NOT EXISTS idx_conversas_canal ON conversas(canal);
CREATE INDEX IF NOT EXISTS idx_conversas_created_at ON conversas(created_at);
CREATE INDEX IF NOT EXISTS idx_conversas_last_message_at ON conversas(last_message_at);

CREATE INDEX IF NOT EXISTS idx_equipes_owner_id ON equipes(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipes_is_active ON equipes(is_active);
CREATE INDEX IF NOT EXISTS idx_equipes_is_default ON equipes(is_default);

CREATE INDEX IF NOT EXISTS idx_equipe_membros_equipe_id ON equipe_membros(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_user_id ON equipe_membros(user_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_role ON equipe_membros(role);

-- RLS (Row Level Security)
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_membros ENABLE ROW LEVEL SECURITY;

-- Políticas para contatos
CREATE POLICY "Users can view their own contatos" ON contatos
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own contatos" ON contatos
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own contatos" ON contatos
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own contatos" ON contatos
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para conversas
CREATE POLICY "Users can view their own conversas" ON conversas
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own conversas" ON conversas
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own conversas" ON conversas
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own conversas" ON conversas
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para equipes
CREATE POLICY "Users can view their own equipes" ON equipes
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own equipes" ON equipes
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own equipes" ON equipes
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own equipes" ON equipes
    FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para membros da equipe
CREATE POLICY "Users can view equipe_membros for their teams" ON equipe_membros
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert equipe_membros for their teams" ON equipe_membros
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update equipe_membros for their teams" ON equipe_membros
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete equipe_membros for their teams" ON equipe_membros
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM equipes 
            WHERE equipes.id = equipe_membros.equipe_id 
            AND equipes.owner_id = auth.uid()
        )
    );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_contatos_updated_at
    BEFORE UPDATE ON contatos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversas_updated_at
    BEFORE UPDATE ON conversas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_equipes_updated_at
    BEFORE UPDATE ON equipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para created_by
CREATE OR REPLACE FUNCTION set_created_by_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_contatos_created_by
    BEFORE INSERT ON contatos
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_conversas_created_by
    BEFORE INSERT ON conversas
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_equipes_created_by
    BEFORE INSERT ON equipes
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

CREATE TRIGGER trigger_equipe_membros_created_by
    BEFORE INSERT ON equipe_membros
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_column();

-- Agora podemos adicionar as foreign keys que estavam faltando
ALTER TABLE ai_agent_actions 
ADD CONSTRAINT fk_ai_agent_actions_contact_id 
FOREIGN KEY (contact_id) REFERENCES contatos(id) ON DELETE CASCADE;

ALTER TABLE ai_agent_actions 
ADD CONSTRAINT fk_ai_agent_actions_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversas(id) ON DELETE CASCADE;

ALTER TABLE ai_agent_actions 
ADD CONSTRAINT fk_ai_agent_actions_target_team_id 
FOREIGN KEY (target_team_id) REFERENCES equipes(id) ON DELETE SET NULL;

-- Comentários para documentação
COMMENT ON TABLE contatos IS 'Tabela de contatos do sistema';
COMMENT ON TABLE conversas IS 'Tabela de conversas do AI Agent';
COMMENT ON TABLE equipes IS 'Tabela de equipes para transferência de conversas';
COMMENT ON TABLE equipe_membros IS 'Tabela de membros das equipes';
