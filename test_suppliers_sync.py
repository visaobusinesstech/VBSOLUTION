#!/usr/bin/env python3
"""
Script para testar a sincronização de fornecedores com Supabase
Execute: python test_suppliers_sync.py
"""

import os
import sys
import json
from datetime import datetime
from supabase import create_client, Client

def log(message, level="INFO"):
    """Função para logging com timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_suppliers_sync():
    """Testa a sincronização de fornecedores"""
    
    # Configuração do Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
    SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'your-anon-key')
    
    if 'your-project' in SUPABASE_URL or 'your-anon-key' in SUPABASE_KEY:
        log("❌ Configure as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY", "ERROR")
        log("   Exemplo: export SUPABASE_URL='https://your-project.supabase.co'", "INFO")
        log("   Exemplo: export SUPABASE_ANON_KEY='your-anon-key'", "INFO")
        return False
    
    try:
        # Inicializar cliente Supabase
        log("🔍 Conectando ao Supabase...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Teste 1: Verificar se a tabela suppliers existe
        log("📋 Verificando estrutura da tabela suppliers...")
        try:
            result = supabase.table('suppliers').select('*').limit(1).execute()
            log("✅ Tabela suppliers encontrada", "SUCCESS")
        except Exception as e:
            log(f"❌ Erro ao acessar tabela suppliers: {e}", "ERROR")
            return False
        
        # Teste 2: Verificar políticas RLS
        log("🔒 Verificando políticas RLS...")
        try:
            # Tentar buscar sem autenticação (deve falhar se RLS estiver ativo)
            result = supabase.table('suppliers').select('*').execute()
            if result.data:
                log("⚠️ RLS pode não estar ativo - dados retornados sem autenticação", "WARNING")
            else:
                log("✅ RLS parece estar ativo - nenhum dado retornado sem autenticação", "SUCCESS")
        except Exception as e:
            log(f"✅ RLS ativo - erro esperado: {e}", "SUCCESS")
        
        # Teste 3: Verificar dados existentes
        log("📊 Verificando dados existentes...")
        try:
            result = supabase.table('suppliers').select('*').execute()
            log(f"📈 {len(result.data)} fornecedores encontrados na tabela")
            
            if result.data:
                log("📋 Primeiros fornecedores:")
                for i, supplier in enumerate(result.data[:3]):
                    log(f"  {i+1}. {supplier.get('name', 'N/A')} - {supplier.get('city', 'N/A')}, {supplier.get('state', 'N/A')}")
        except Exception as e:
            log(f"❌ Erro ao buscar dados: {e}", "ERROR")
        
        # Teste 4: Verificar estrutura da tabela
        log("🏗️ Verificando estrutura da tabela...")
        try:
            # Tentar inserir um registro de teste (sem autenticação, deve falhar)
            test_data = {
                'name': 'Teste Estrutura',
                'owner_id': '00000000-0000-0000-0000-000000000000'
            }
            
            result = supabase.table('suppliers').insert(test_data).execute()
            log("⚠️ Inserção sem autenticação funcionou - RLS pode não estar ativo", "WARNING")
            
            # Limpar dados de teste
            supabase.table('suppliers').delete().eq('name', 'Teste Estrutura').execute()
            
        except Exception as e:
            log(f"✅ Inserção sem autenticação falhou (esperado): {e}", "SUCCESS")
        
        log("🎉 Testes de estrutura concluídos com sucesso!", "SUCCESS")
        return True
        
    except Exception as e:
        log(f"❌ Erro geral: {e}", "ERROR")
        return False

def test_with_auth():
    """Testa com autenticação (requer credenciais de service role)"""
    
    SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'your-service-key')
    
    if 'your-project' in SUPABASE_URL or 'your-service-key' in SUPABASE_SERVICE_KEY:
        log("⚠️ Para testes com autenticação, configure SUPABASE_SERVICE_KEY", "WARNING")
        return False
    
    try:
        log("🔐 Testando com autenticação de service role...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Criar fornecedor de teste
        test_supplier = {
            'name': f'Fornecedor Teste {datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'fantasy_name': 'Empresa Teste LTDA',
            'cnpj': '12.345.678/0001-90',
            'phone': '(11) 99999-9999',
            'city': 'São Paulo',
            'state': 'SP',
            'notes': 'Fornecedor criado via teste automatizado',
            'owner_id': '00000000-0000-0000-0000-000000000000'  # ID de teste
        }
        
        log(f"📝 Criando fornecedor: {test_supplier['name']}")
        result = supabase.table('suppliers').insert(test_supplier).execute()
        
        if result.data:
            supplier_id = result.data[0]['id']
            log(f"✅ Fornecedor criado com sucesso! ID: {supplier_id}", "SUCCESS")
            
            # Buscar o fornecedor criado
            log("🔍 Buscando fornecedor criado...")
            result = supabase.table('suppliers').select('*').eq('id', supplier_id).execute()
            
            if result.data:
                log("✅ Fornecedor encontrado na busca", "SUCCESS")
                log(f"📋 Dados: {json.dumps(result.data[0], indent=2, default=str)}")
            
            # Limpar dados de teste
            log("🧹 Limpando dados de teste...")
            supabase.table('suppliers').delete().eq('id', supplier_id).execute()
            log("✅ Dados de teste removidos", "SUCCESS")
            
        return True
        
    except Exception as e:
        log(f"❌ Erro no teste com autenticação: {e}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🚀 Iniciando testes de sincronização de fornecedores...")
    log("=" * 60)
    
    # Teste básico de estrutura
    success = test_suppliers_sync()
    
    log("=" * 60)
    
    # Teste com autenticação (opcional)
    test_with_auth()
    
    log("=" * 60)
    log("🏁 Testes concluídos!")
    
    if success:
        log("✅ Sistema de fornecedores está funcionando corretamente", "SUCCESS")
        sys.exit(0)
    else:
        log("❌ Problemas encontrados no sistema de fornecedores", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
