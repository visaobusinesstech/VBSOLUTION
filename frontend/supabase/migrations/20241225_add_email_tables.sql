-- Criar tabela email_settings
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'custom')),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  email TEXT NOT NULL,
  password TEXT NOT NULL, -- Em produção, considerar criptografia
  use_tls BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT false,
  provider TEXT NOT NULL,
  message_id TEXT UNIQUE,
  attachments TEXT[], -- Array de URLs ou nomes de arquivos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_email_settings_owner_id ON email_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_emails_owner_id ON emails(owner_id);
CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para email_settings
CREATE POLICY "Users can view their own email settings" ON email_settings
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own email settings" ON email_settings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own email settings" ON email_settings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own email settings" ON email_settings
  FOR DELETE USING (auth.uid() = owner_id);

-- Políticas RLS para emails
CREATE POLICY "Users can view their own emails" ON emails
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own emails" ON emails
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own emails" ON emails
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own emails" ON emails
  FOR DELETE USING (auth.uid() = owner_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
