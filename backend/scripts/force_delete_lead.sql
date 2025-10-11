-- Função RPC para exclusão forçada de leads
-- Execute este script no Supabase SQL Editor

CREATE OR REPLACE FUNCTION force_delete_lead(lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Primeiro, excluir todas as referências em outras tabelas
  DELETE FROM atendimentos WHERE lead_id = force_delete_lead.lead_id;
  DELETE FROM lead_activities WHERE lead_id = force_delete_lead.lead_id;
  DELETE FROM lead_notes WHERE lead_id = force_delete_lead.lead_id;
  DELETE FROM lead_attachments WHERE lead_id = force_delete_lead.lead_id;
  
  -- Agora excluir o lead principal
  DELETE FROM leads WHERE id = force_delete_lead.lead_id;
  
  -- Verificar se foi excluído
  IF NOT EXISTS (SELECT 1 FROM leads WHERE id = force_delete_lead.lead_id) THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro
    RAISE LOG 'Erro ao excluir lead %: %', lead_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Dar permissão para a função
GRANT EXECUTE ON FUNCTION force_delete_lead(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_lead(UUID) TO anon;

-- Comentário da função
COMMENT ON FUNCTION force_delete_lead(UUID) IS 'Exclui um lead e todas suas referências de forma forçada';
