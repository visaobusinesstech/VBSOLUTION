#!/usr/bin/env python3
"""
Script para adicionar coluna tags na tabela leads do Supabase
"""

import os
import sys
from supabase import create_client, Client

def get_supabase_client():
    """Cria cliente Supabase usando variáveis de ambiente"""
    url = os.getenv('SUPABASE_URL', 'https://nrbsocawokmihvxfcpso.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA')
    
    return create_client(url, key)

def check_column_exists(supabase: Client):
    """Verifica se a coluna tags já existe"""
    try:
        # Tentar fazer uma consulta que inclui a coluna tags
        result = supabase.table('leads').select('id, tags').limit(1).execute()
        return True
    except Exception as e:
        if 'column "tags" does not exist' in str(e):
            return False
        raise e

def add_tags_column(supabase: Client):
    """Adiciona a coluna tags na tabela leads"""
    try:
        # SQL para adicionar a coluna tags
        sql = """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'leads' 
                AND column_name = 'tags'
            ) THEN
                ALTER TABLE leads 
                ADD COLUMN tags TEXT[] DEFAULT '{}';
                
                COMMENT ON COLUMN leads.tags IS 'Array de tags associadas ao lead';
                
                RAISE NOTICE 'Coluna tags adicionada com sucesso na tabela leads';
            ELSE
                RAISE NOTICE 'Coluna tags já existe na tabela leads';
            END IF;
        END $$;
        """
        
        # Executar SQL
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✅ Coluna tags verificada/criada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao adicionar coluna tags: {e}")
        return False

def test_tags_functionality(supabase: Client):
    """Testa a funcionalidade de tags"""
    try:
        # Tentar inserir um lead de teste com tags
        test_lead = {
            'name': 'Lead Teste Tags',
            'email': 'teste@exemplo.com',
            'stage_id': '1',  # Assumindo que existe uma etapa com ID 1
            'tags': ['teste', 'migração', 'python']
        }
        
        result = supabase.table('leads').insert(test_lead).execute()
        
        if result.data:
            lead_id = result.data[0]['id']
            print(f"✅ Lead de teste criado com ID: {lead_id}")
            
            # Tentar atualizar as tags
            update_result = supabase.table('leads').update({
                'tags': ['teste', 'migração', 'python', 'atualizado']
            }).eq('id', lead_id).execute()
            
            if update_result.data:
                print("✅ Atualização de tags funcionando!")
                
                # Limpar lead de teste
                supabase.table('leads').delete().eq('id', lead_id).execute()
                print("✅ Lead de teste removido")
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ Erro ao testar funcionalidade de tags: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Iniciando migração para adicionar coluna tags...")
    
    try:
        # Criar cliente Supabase
        supabase = get_supabase_client()
        print("✅ Cliente Supabase conectado")
        
        # Verificar se coluna já existe
        if check_column_exists(supabase):
            print("ℹ️  Coluna tags já existe na tabela leads")
        else:
            print("ℹ️  Coluna tags não existe, criando...")
            if not add_tags_column(supabase):
                sys.exit(1)
        
        # Testar funcionalidade
        print("🧪 Testando funcionalidade de tags...")
        if test_tags_functionality(supabase):
            print("✅ Migração concluída com sucesso!")
            print("🎉 A coluna tags está funcionando corretamente!")
        else:
            print("⚠️  Migração concluída, mas teste falhou")
            
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
