#!/usr/bin/env python3
"""
Script para testar persistência de tags em leads
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def test_tags_persistence():
    """Testa persistência de tags em leads"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # 1. Verificar se a coluna tags existe
        print("🔍 Verificando coluna tags na tabela leads...")
        leads_result = supabase.table('leads').select('id, name, tags').limit(1).execute()
        
        if not leads_result.data:
            print("⚠️ Nenhum lead encontrado para testar")
            return True
        
        print("✅ Coluna tags existe na tabela leads")
        
        # 2. Criar um lead de teste com tags
        print("🧪 Criando lead de teste com tags...")
        test_lead = {
            'name': 'Lead Teste Tags',
            'email': 'tags@teste.com',
            'stage_id': '550e8400-e29b-41d4-a716-446655440001',
            'status': 'hot',
            'tags': ['teste', 'importante', 'urgente']
        }
        
        create_result = supabase.table('leads').insert(test_lead).execute()
        
        if not create_result.data:
            print("❌ Erro ao criar lead de teste")
            return False
        
        lead_id = create_result.data[0]['id']
        print(f"✅ Lead criado com ID: {lead_id}")
        print(f"📊 Tags iniciais: {create_result.data[0]['tags']}")
        
        # 3. Verificar se as tags foram salvas
        print("🔍 Verificando se tags foram salvas...")
        check_result = supabase.table('leads').select('id, name, tags').eq('id', lead_id).execute()
        
        if not check_result.data:
            print("❌ Lead não encontrado após criação")
            return False
        
        saved_tags = check_result.data[0]['tags']
        print(f"📊 Tags salvas: {saved_tags}")
        
        if saved_tags != test_lead['tags']:
            print("❌ Tags não foram salvas corretamente!")
            return False
        
        print("✅ Tags salvas corretamente!")
        
        # 4. Testar atualização de tags
        print("🔄 Testando atualização de tags...")
        new_tags = ['teste', 'importante', 'urgente', 'novo', 'atualizado']
        
        update_result = supabase.table('leads').update({
            'tags': new_tags
        }).eq('id', lead_id).execute()
        
        if not update_result.data:
            print("❌ Erro ao atualizar tags")
            return False
        
        print(f"📊 Tags atualizadas: {update_result.data[0]['tags']}")
        
        # 5. Verificar se a atualização foi persistida
        print("🔍 Verificando persistência da atualização...")
        verify_result = supabase.table('leads').select('id, name, tags').eq('id', lead_id).execute()
        
        if not verify_result.data:
            print("❌ Lead não encontrado após atualização")
            return False
        
        updated_tags = verify_result.data[0]['tags']
        print(f"📊 Tags após atualização: {updated_tags}")
        
        if updated_tags != new_tags:
            print("❌ Tags não foram atualizadas corretamente!")
            return False
        
        print("✅ Tags atualizadas e persistidas corretamente!")
        
        # 6. Testar remoção de tags
        print("🗑️ Testando remoção de tags...")
        removed_tags = ['teste', 'importante']
        
        remove_result = supabase.table('leads').update({
            'tags': removed_tags
        }).eq('id', lead_id).execute()
        
        if not remove_result.data:
            print("❌ Erro ao remover tags")
            return False
        
        print(f"📊 Tags após remoção: {remove_result.data[0]['tags']}")
        
        # 7. Verificar se a remoção foi persistida
        print("🔍 Verificando persistência da remoção...")
        final_result = supabase.table('leads').select('id, name, tags').eq('id', lead_id).execute()
        
        if not final_result.data:
            print("❌ Lead não encontrado após remoção")
            return False
        
        final_tags = final_result.data[0]['tags']
        print(f"📊 Tags finais: {final_tags}")
        
        if final_tags != removed_tags:
            print("❌ Tags não foram removidas corretamente!")
            return False
        
        print("✅ Tags removidas e persistidas corretamente!")
        
        # 8. Limpar lead de teste
        print("🧹 Limpando lead de teste...")
        cleanup_result = supabase.table('leads').delete().eq('id', lead_id).execute()
        print(f"📊 Lead de teste removido: {len(cleanup_result.data)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def test_empty_tags():
    """Testa comportamento com tags vazias"""
    try:
        supabase = get_supabase_client()
        print("🧪 Testando comportamento com tags vazias...")
        
        # Criar lead sem tags
        test_lead = {
            'name': 'Lead Sem Tags',
            'email': 'semtags@teste.com',
            'stage_id': '550e8400-e29b-41d4-a716-446655440001',
            'status': 'cold'
        }
        
        create_result = supabase.table('leads').insert(test_lead).execute()
        
        if not create_result.data:
            print("❌ Erro ao criar lead sem tags")
            return False
        
        lead_id = create_result.data[0]['id']
        print(f"✅ Lead sem tags criado: {lead_id}")
        
        # Verificar se tags é null ou array vazio
        check_result = supabase.table('leads').select('id, name, tags').eq('id', lead_id).execute()
        
        if not check_result.data:
            print("❌ Lead não encontrado")
            return False
        
        tags = check_result.data[0]['tags']
        print(f"📊 Tags do lead sem tags: {tags}")
        
        # Limpar
        supabase.table('leads').delete().eq('id', lead_id).execute()
        
        print("✅ Comportamento com tags vazias testado!")
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste de tags vazias: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Testando persistência de tags em leads...")
    
    print("\n1️⃣ Teste de persistência de tags:")
    if test_tags_persistence():
        print("✅ Teste de persistência passou!")
    else:
        print("❌ Teste de persistência falhou!")
    
    print("\n2️⃣ Teste de tags vazias:")
    if test_empty_tags():
        print("✅ Teste de tags vazias passou!")
    else:
        print("❌ Teste de tags vazias falhou!")
    
    print("\n🎉 Testes de tags concluídos!")

if __name__ == "__main__":
    main()
