-- Criar nova estrutura simplificada para whatsapp_mensagens com status

-- Criar nova tabela whatsapp_mensagens simplificada
CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL,
    chat_id TEXT,
    message_id TEXT,
    conteudo TEXT NOT NULL,
    tipo TEXT DEFAULT 'TEXTO',
    status TEXT DEFAULT 'ATIVO', -- Status da conversa: ATIVO, FECHADO, PAUSADO
    remetente TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    lida BOOLEAN DEFAULT false,
    media_url TEXT,
    media_mime TEXT,
    duration_ms INTEGER,
    raw JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir dados de exemplo
INSERT INTO whatsapp_mensagens (
    id,
    owner_id,
    chat_id,
    message_id,
    conteudo,
    tipo,
    status,
    remetente,
    timestamp,
    lida,
    created_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    '5511999999999@s.whatsapp.net',
    'msg_test_001',
    'Mensagem de teste para o sistema simplificado',
    'TEXTO',
    'ATIVO',
    'CLIENTE',
    now(),
    false,
    now()
);

-- Verificar se foi criado
SELECT 
    'whatsapp_mensagens' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as com_status
FROM whatsapp_mensagens;
