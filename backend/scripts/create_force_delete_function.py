#!/usr/bin/env python3
"""
Script para criar função RPC de exclusão forçada de leads
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def create_force_delete_function():
    """Cria a função RPC para exclusão forçada"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # SQL da função
        sql = """
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
        """
        
        # Executar SQL
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✅ Função force_delete_lead criada com sucesso!")
        
        # Testar a função
        print("🧪 Testando função...")
        test_result = supabase.rpc('force_delete_lead', {'lead_id': '00000000-0000-0000-0000-000000000000'}).execute()
        print(f"✅ Função testada: {test_result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar função: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Criando função de exclusão forçada de leads...")
    
    if create_force_delete_function():
        print("🎉 Função criada com sucesso!")
        print("✅ Agora os leads serão realmente excluídos do Supabase")
    else:
        print("⚠️ Erro ao criar função")

if __name__ == "__main__":
    main()
