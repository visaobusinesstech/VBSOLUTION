#!/usr/bin/env python3
"""
Script para adicionar coluna deleted_at na tabela leads
"""

import os
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def add_deleted_at_column():
    """Adiciona coluna deleted_at na tabela leads"""
    try:
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # SQL para adicionar coluna deleted_at
        sql = """
        ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        
        COMMENT ON COLUMN leads.deleted_at IS 'Data e hora de exclusão do lead (soft delete)';
        
        CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at);
        """
        
        # Tentar executar via RPC se existir
        try:
            result = supabase.rpc('exec_sql', {'sql': sql}).execute()
            print("✅ Coluna deleted_at adicionada via RPC")
        except:
            print("⚠️ RPC exec_sql não disponível, tentando abordagem alternativa...")
            
            # Abordagem alternativa: criar um lead de teste para verificar estrutura
            test_lead = {
                'name': 'Teste Estrutura',
                'email': 'teste@estrutura.com',
                'stage_id': '550e8400-e29b-41d4-a716-446655440001',
                'status': 'hot',
                'deleted_at': None
            }
            
            try:
                result = supabase.table('leads').insert(test_lead).execute()
                if result.data:
                    print("✅ Coluna deleted_at já existe ou foi adicionada")
                    # Remover lead de teste
                    supabase.table('leads').delete().eq('id', result.data[0]['id']).execute()
                else:
                    print("❌ Erro ao inserir lead de teste")
                    return False
            except Exception as e:
                if 'deleted_at' in str(e):
                    print("❌ Coluna deleted_at não existe e não pode ser adicionada automaticamente")
                    print("📝 Execute manualmente no Supabase SQL Editor:")
                    print(sql)
                    return False
                else:
                    print(f"❌ Erro inesperado: {e}")
                    return False
        
        print("✅ Coluna deleted_at configurada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna: {e}")
        return False

def test_deleted_at_column():
    """Testa se a coluna deleted_at funciona"""
    try:
        supabase = get_supabase_client()
        
        # Testar inserção com deleted_at
        test_lead = {
            'name': 'Teste Deleted At',
            'email': 'teste@deleted.com',
            'stage_id': '550e8400-e29b-41d4-a716-446655440001',
            'status': 'hot',
            'deleted_at': None
        }
        
        result = supabase.table('leads').insert(test_lead).execute()
        
        if result.data:
            lead_id = result.data[0]['id']
            print(f"✅ Lead criado com deleted_at: {lead_id}")
            
            # Testar atualização com deleted_at
            update_result = supabase.table('leads').update({
                'deleted_at': '2024-01-01T00:00:00Z'
            }).eq('id', lead_id).execute()
            
            if update_result.data:
                print("✅ Lead atualizado com deleted_at")
            
            # Testar filtro
            filtered_result = supabase.table('leads').select('id, name, deleted_at').is_('deleted_at', 'null').execute()
            print(f"📊 Leads ativos (deleted_at IS NULL): {len(filtered_result.data)}")
            
            # Limpar lead de teste
            supabase.table('leads').delete().eq('id', lead_id).execute()
            print("✅ Lead de teste removido")
            
            return True
        else:
            print("❌ Erro ao criar lead de teste")
            return False
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Adicionando coluna deleted_at na tabela leads...")
    
    if add_deleted_at_column():
        print("🧪 Testando coluna deleted_at...")
        if test_deleted_at_column():
            print("🎉 Coluna deleted_at configurada e testada com sucesso!")
        else:
            print("⚠️ Coluna adicionada mas teste falhou")
    else:
        print("❌ Erro ao adicionar coluna deleted_at")
        print("📝 Execute manualmente no Supabase SQL Editor:")
        print("ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;")

if __name__ == "__main__":
    main()
