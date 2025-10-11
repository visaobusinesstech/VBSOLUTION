#!/usr/bin/env python3
"""
Script para testar exclusão simples de leads
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def test_simple_delete():
    """Testa a exclusão simples de leads"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # 1. Verificar leads existentes
        print("🔍 Verificando leads existentes...")
        leads_result = supabase.table('leads').select('id, name, status').execute()
        print(f"📊 Total de leads encontrados: {len(leads_result.data)}")
        
        if not leads_result.data:
            print("⚠️ Nenhum lead encontrado para testar")
            return True
        
        # 2. Pegar o primeiro lead para teste
        test_lead = leads_result.data[0]
        lead_id = test_lead['id']
        lead_name = test_lead['name']
        
        print(f"🧪 Testando exclusão do lead: {lead_name} (ID: {lead_id})")
        
        # 3. Verificar se o lead existe antes da exclusão
        print("🔍 Verificando se lead existe antes da exclusão...")
        check_before = supabase.table('leads').select('id, name').eq('id', lead_id).execute()
        
        if not check_before.data:
            print("❌ Lead não encontrado antes da exclusão")
            return False
        
        print(f"✅ Lead encontrado: {check_before.data[0]['name']}")
        
        # 4. Tentar excluir o lead
        print("🗑️ Tentando excluir lead...")
        delete_result = supabase.table('leads').delete().eq('id', lead_id).execute()
        print(f"📊 Resultado da exclusão: {len(delete_result.data)} registros afetados")
        
        # 5. Verificar se foi excluído
        print("🔍 Verificando se lead foi excluído...")
        check_after = supabase.table('leads').select('id, name').eq('id', lead_id).execute()
        
        if check_after.data:
            print("❌ Lead ainda existe após exclusão!")
            print(f"📊 Lead encontrado: {check_after.data[0]['name']}")
            return False
        
        print("✅ Lead foi excluído com sucesso!")
        
        # 6. Verificar se não aparece na lista geral
        print("🔍 Verificando se lead não aparece na lista geral...")
        all_leads = supabase.table('leads').select('id, name').execute()
        
        excluded_lead = [lead for lead in all_leads.data if lead['id'] == lead_id]
        
        if excluded_lead:
            print("❌ Lead excluído ainda aparece na lista geral!")
            return False
        
        print("✅ Lead excluído não aparece na lista geral!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def test_foreign_key_handling():
    """Testa o tratamento de erros de foreign key"""
    try:
        supabase = get_supabase_client()
        print("🔍 Testando tratamento de foreign key...")
        
        # Buscar um lead que pode ter referências
        leads_result = supabase.table('leads').select('id, name').limit(1).execute()
        
        if not leads_result.data:
            print("⚠️ Nenhum lead para testar foreign key")
            return True
        
        lead_id = leads_result.data[0]['id']
        print(f"🧪 Testando exclusão de lead com possíveis referências: {lead_id}")
        
        # Tentar excluir
        try:
            delete_result = supabase.table('leads').delete().eq('id', lead_id).execute()
            print("✅ Lead excluído sem problemas de foreign key")
            return True
        except Exception as e:
            if '23503' in str(e) or 'foreign key' in str(e).lower():
                print("✅ Erro de foreign key detectado corretamente")
                print("🔄 Testando abordagem alternativa...")
                
                # Tentar soft delete
                update_result = supabase.table('leads').update({
                    'status': 'lost',
                    'name': '[EXCLUÍDO] ' + leads_result.data[0]['name']
                }).eq('id', lead_id).execute()
                
                if update_result.data:
                    print("✅ Soft delete aplicado com sucesso")
                    return True
                else:
                    print("❌ Soft delete falhou")
                    return False
            else:
                print(f"❌ Erro inesperado: {e}")
                return False
        
    except Exception as e:
        print(f"❌ Erro no teste de foreign key: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Testando exclusão de leads...")
    
    print("\n1️⃣ Teste de exclusão simples:")
    if test_simple_delete():
        print("✅ Teste de exclusão simples passou!")
    else:
        print("❌ Teste de exclusão simples falhou!")
    
    print("\n2️⃣ Teste de foreign key:")
    if test_foreign_key_handling():
        print("✅ Teste de foreign key passou!")
    else:
        print("❌ Teste de foreign key falhou!")
    
    print("\n🎉 Testes concluídos!")

if __name__ == "__main__":
    main()
