#!/usr/bin/env python3
"""
Script simples para testar funcionalidade de tags
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def test_tags_functionality():
    """Testa a funcionalidade de tags"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # Primeiro, verificar se existem etapas
        stages_result = supabase.table('funnel_stages').select('id, name').execute()
        print(f"📋 Etapas encontradas: {len(stages_result.data)}")
        
        if not stages_result.data:
            print("❌ Nenhuma etapa encontrada. Criando etapa de teste...")
            # Criar uma etapa de teste
            stage_result = supabase.table('funnel_stages').insert({
                'name': 'Teste',
                'color': '#3B82F6',
                'order_position': 1
            }).execute()
            
            if stage_result.data:
                stage_id = stage_result.data[0]['id']
                print(f"✅ Etapa de teste criada com ID: {stage_id}")
            else:
                print("❌ Erro ao criar etapa de teste")
                return False
        else:
            stage_id = stages_result.data[0]['id']
            print(f"✅ Usando etapa existente: {stage_id}")
        
        # Testar inserção com tags
        print("🧪 Testando inserção de lead com tags...")
        test_lead = {
            'name': 'Lead Teste Tags',
            'email': 'teste@exemplo.com',
            'stage_id': stage_id,
            'tags': ['teste', 'migração', 'python']
        }
        
        result = supabase.table('leads').insert(test_lead).execute()
        
        if result.data:
            lead_id = result.data[0]['id']
            print(f"✅ Lead de teste criado com ID: {lead_id}")
            print(f"📝 Tags inseridas: {result.data[0].get('tags', [])}")
            
            # Testar atualização de tags
            print("🔄 Testando atualização de tags...")
            update_result = supabase.table('leads').update({
                'tags': ['teste', 'migração', 'python', 'atualizado']
            }).eq('id', lead_id).execute()
            
            if update_result.data:
                print("✅ Atualização de tags funcionando!")
                print(f"📝 Tags atualizadas: {update_result.data[0].get('tags', [])}")
                
                # Testar consulta com tags
                print("🔍 Testando consulta com tags...")
                query_result = supabase.table('leads').select('id, name, tags').eq('id', lead_id).execute()
                
                if query_result.data:
                    print(f"✅ Consulta funcionando! Lead: {query_result.data[0]['name']}")
                    print(f"📝 Tags na consulta: {query_result.data[0].get('tags', [])}")
                
                # Limpar lead de teste
                print("🧹 Limpando lead de teste...")
                delete_result = supabase.table('leads').delete().eq('id', lead_id).execute()
                print("✅ Lead de teste removido")
                
                return True
            else:
                print("❌ Erro ao atualizar tags")
                return False
        else:
            print("❌ Erro ao criar lead de teste")
            return False
        
    except Exception as e:
        print(f"❌ Erro ao testar funcionalidade de tags: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testando funcionalidade de tags...")
    if test_tags_functionality():
        print("🎉 Teste concluído com sucesso!")
    else:
        print("⚠️ Teste falhou")
