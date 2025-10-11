#!/usr/bin/env python3
"""
Script para testar exclusão em cascata de leads
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def test_cascade_delete():
    """Testa exclusão em cascata"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # 1. Criar um lead de teste
        print("🧪 Criando lead de teste...")
        test_lead = {
            'name': 'Lead Teste Cascata',
            'email': 'cascata@teste.com',
            'stage_id': '550e8400-e29b-41d4-a716-446655440001',
            'status': 'hot'
        }
        
        lead_result = supabase.table('leads').insert(test_lead).execute()
        
        if not lead_result.data:
            print("❌ Erro ao criar lead de teste")
            return False
        
        lead_id = lead_result.data[0]['id']
        print(f"✅ Lead criado com ID: {lead_id}")
        
        # 2. Criar atendimentos para o lead
        print("🧪 Criando atendimentos de teste...")
        atendimentos = [
            {
                'lead_id': lead_id,
                'tipo': 'telefone',
                'descricao': 'Atendimento telefônico',
                'data_atendimento': '2024-01-01T10:00:00Z'
            },
            {
                'lead_id': lead_id,
                'tipo': 'email',
                'descricao': 'Atendimento por email',
                'data_atendimento': '2024-01-02T14:00:00Z'
            }
        ]
        
        atendimentos_result = supabase.table('atendimentos').insert(atendimentos).execute()
        
        if not atendimentos_result.data:
            print("❌ Erro ao criar atendimentos de teste")
            # Limpar lead
            supabase.table('leads').delete().eq('id', lead_id).execute()
            return False
        
        print(f"✅ {len(atendimentos_result.data)} atendimentos criados")
        
        # 3. Verificar se atendimentos foram criados
        print("🔍 Verificando atendimentos criados...")
        check_atendimentos = supabase.table('atendimentos').select('id, lead_id').eq('lead_id', lead_id).execute()
        print(f"📊 Atendimentos encontrados: {len(check_atendimentos.data)}")
        
        # 4. Tentar exclusão em cascata (como no frontend)
        print("🗑️ Testando exclusão em cascata...")
        
        # Primeiro, excluir atendimentos
        print("🔄 Removendo atendimentos...")
        delete_atendimentos = supabase.table('atendimentos').delete().eq('lead_id', lead_id).execute()
        print(f"📊 Atendimentos removidos: {len(delete_atendimentos.data)}")
        
        # Verificar se atendimentos foram removidos
        check_after_atendimentos = supabase.table('atendimentos').select('id').eq('lead_id', lead_id).execute()
        if check_after_atendimentos.data:
            print("❌ Atendimentos não foram removidos!")
            return False
        
        print("✅ Atendimentos removidos com sucesso!")
        
        # Agora excluir o lead
        print("🗑️ Excluindo lead...")
        delete_lead = supabase.table('leads').delete().eq('id', lead_id).execute()
        print(f"📊 Lead removido: {len(delete_lead.data)}")
        
        # Verificar se lead foi excluído
        check_lead = supabase.table('leads').select('id').eq('id', lead_id).execute()
        if check_lead.data:
            print("❌ Lead não foi excluído!")
            return False
        
        print("✅ Lead excluído com sucesso!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def test_soft_delete_fallback():
    """Testa soft delete como fallback"""
    try:
        supabase = get_supabase_client()
        print("🧪 Testando soft delete como fallback...")
        
        # Buscar um lead existente
        leads_result = supabase.table('leads').select('id, name, status').limit(1).execute()
        
        if not leads_result.data:
            print("⚠️ Nenhum lead para testar soft delete")
            return True
        
        lead = leads_result.data[0]
        lead_id = lead['id']
        original_name = lead['name']
        
        print(f"🧪 Testando soft delete do lead: {original_name}")
        
        # Aplicar soft delete
        soft_delete_result = supabase.table('leads').update({
            'status': 'lost',
            'name': '[EXCLUÍDO] ' + original_name,
            'email': None,
            'phone': None,
            'company': None
        }).eq('id', lead_id).execute()
        
        if not soft_delete_result.data:
            print("❌ Soft delete falhou")
            return False
        
        print("✅ Soft delete aplicado com sucesso!")
        
        # Verificar se o lead foi marcado como excluído
        check_result = supabase.table('leads').select('name, status, email').eq('id', lead_id).execute()
        
        if check_result.data:
            updated_lead = check_result.data[0]
            print(f"📊 Lead atualizado:")
            print(f"   Nome: {updated_lead['name']}")
            print(f"   Status: {updated_lead['status']}")
            print(f"   Email: {updated_lead['email']}")
            
            if '[EXCLUÍDO]' in updated_lead['name'] and updated_lead['status'] == 'lost':
                print("✅ Soft delete funcionando corretamente!")
                return True
            else:
                print("❌ Soft delete não aplicado corretamente")
                return False
        else:
            print("❌ Lead não encontrado após soft delete")
            return False
        
    except Exception as e:
        print(f"❌ Erro no teste de soft delete: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Testando exclusão em cascata de leads...")
    
    print("\n1️⃣ Teste de exclusão em cascata:")
    if test_cascade_delete():
        print("✅ Teste de exclusão em cascata passou!")
    else:
        print("❌ Teste de exclusão em cascata falhou!")
    
    print("\n2️⃣ Teste de soft delete:")
    if test_soft_delete_fallback():
        print("✅ Teste de soft delete passou!")
    else:
        print("❌ Teste de soft delete falhou!")
    
    print("\n🎉 Testes de exclusão concluídos!")

if __name__ == "__main__":
    main()
