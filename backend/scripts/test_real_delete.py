#!/usr/bin/env python3
"""
Script para testar exclusão real de leads
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def test_real_delete():
    """Testa a exclusão real de leads"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # 1. Verificar se existem leads
        print("🔍 Verificando leads existentes...")
        leads_result = supabase.table('leads').select('id, name, deleted_at').is_('deleted_at', 'null').execute()
        print(f"📊 Leads ativos encontrados: {len(leads_result.data)}")
        
        if not leads_result.data:
            print("⚠️ Nenhum lead ativo encontrado para testar")
            return True
        
        # 2. Criar um lead de teste
        print("🧪 Criando lead de teste...")
        test_lead = {
            'name': 'Lead Teste Exclusão',
            'email': 'teste@exclusao.com',
            'stage_id': leads_result.data[0]['id'] if leads_result.data else '550e8400-e29b-41d4-a716-446655440001',
            'status': 'hot'
        }
        
        create_result = supabase.table('leads').insert(test_lead).execute()
        
        if not create_result.data:
            print("❌ Erro ao criar lead de teste")
            return False
        
        lead_id = create_result.data[0]['id']
        print(f"✅ Lead de teste criado com ID: {lead_id}")
        
        # 3. Verificar se o lead foi criado
        print("🔍 Verificando se lead foi criado...")
        check_result = supabase.table('leads').select('id, name').eq('id', lead_id).execute()
        
        if not check_result.data:
            print("❌ Lead não foi encontrado após criação")
            return False
        
        print(f"✅ Lead encontrado: {check_result.data[0]['name']}")
        
        # 4. Testar exclusão real
        print("🗑️ Testando exclusão real...")
        delete_result = supabase.table('leads').delete().eq('id', lead_id).execute()
        print(f"📊 Resultado da exclusão: {delete_result}")
        
        # 5. Verificar se foi realmente excluído
        print("🔍 Verificando se lead foi excluído...")
        verify_result = supabase.table('leads').select('id').eq('id', lead_id).execute()
        
        if verify_result.data:
            print("❌ Lead ainda existe após exclusão!")
            return False
        
        print("✅ Lead foi excluído com sucesso!")
        
        # 6. Testar filtro de leads excluídos
        print("🔍 Testando filtro de leads excluídos...")
        filtered_result = supabase.table('leads').select('id, name, deleted_at').is_('deleted_at', 'null').execute()
        
        print(f"📊 Leads ativos após exclusão: {len(filtered_result.data)}")
        
        # 7. Verificar se o lead excluído não aparece na lista
        excluded_lead = [lead for lead in filtered_result.data if lead['id'] == lead_id]
        
        if excluded_lead:
            print("❌ Lead excluído ainda aparece na lista filtrada!")
            return False
        
        print("✅ Lead excluído não aparece na lista filtrada!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Testando exclusão real de leads...")
    
    if test_real_delete():
        print("🎉 Teste de exclusão real passou com sucesso!")
        print("✅ A exclusão de leads está funcionando corretamente")
    else:
        print("⚠️ Teste de exclusão real falhou")
        print("❌ Verifique os logs para mais detalhes")

if __name__ == "__main__":
    main()
