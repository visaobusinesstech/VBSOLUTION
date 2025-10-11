-- Função para incrementar contador de mensagens WhatsApp
CREATE OR REPLACE FUNCTION increment_whatsapp_message_count(contact_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.contacts 
    SET whatsapp_message_count = COALESCE(whatsapp_message_count, 0) + 1,
        updated_at = NOW()
    WHERE id = contact_id
    RETURNING whatsapp_message_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Comentário da função
COMMENT ON FUNCTION increment_whatsapp_message_count(UUID) IS 'Incrementa o contador de mensagens WhatsApp de um contato';
