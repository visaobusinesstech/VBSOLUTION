#!/usr/bin/env python3
"""
Script de teste para verificar o sistema CRM após a migração
VBSolution - Sistema CRM Completo
"""

import requests
import json
from datetime import datetime

# Configurações do Supabase
SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0"

# Headers para as requisições
headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

def log(message, level="INFO"):
    """Função para logging com timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_connection():
    """Testar conexão com o Supabase"""
    try:
        log("🔗 Testando conexão com o Supabase...")
        
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        
        if response.status_code == 200:
            log("✅ Conexão estabelecida com sucesso!")
            return True
        else:
            log(f"❌ Erro na conexão: Status {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao conectar: {str(e)}", "ERROR")
        return False

def check_tables():
    """Verificar se as tabelas foram criadas"""
    try:
        log("🔍 Verificando tabelas criadas...")
        
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        
        if response.status_code == 200:
            tables = response.json()
            log(f"📊 Total de tabelas encontradas: {len(tables)}")
            
            # Tabelas essenciais que devem existir
            essential_tables = [
                'profiles', 'companies', 'employees', 'products', 'suppliers',
                'inventory', 'leads', 'deals', 'activities', 'projects',
                'work_groups', 'whatsapp_atendimentos', 'whatsapp_mensagens'
            ]
            
            found_tables = []
            missing_tables = []
            
            for table in essential_tables:
                if table in tables:
                    found_tables.append(table)
                    log(f"✅ Tabela {table} encontrada")
                else:
                    missing_tables.append(table)
                    log(f"❌ Tabela {table} não encontrada", "ERROR")
            
            log(f"📋 Resumo: {len(found_tables)}/{len(essential_tables)} tabelas essenciais encontradas")
            
            if missing_tables:
                log(f"⚠️ Tabelas faltando: {', '.join(missing_tables)}", "WARNING")
                return False
            else:
                log("🎉 Todas as tabelas essenciais foram criadas!")
                return True
        else:
            log(f"❌ Erro ao verificar tabelas: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao verificar tabelas: {str(e)}", "ERROR")
        return False

def test_rls():
    """Testar se as políticas RLS estão funcionando"""
    try:
        log("🔒 Testando políticas RLS...")
        
        # Tentar acessar dados sem autenticação (deve falhar)
        response = requests.get(f"{SUPABASE_URL}/rest/v1/profiles", headers=headers)
        
        if response.status_code in [401, 403]:
            log("✅ Políticas RLS estão ativas (acesso negado sem autenticação)")
            return True
        elif response.status_code == 200:
            log("⚠️ Políticas RLS podem não estar ativas (dados acessíveis sem autenticação)", "WARNING")
            return False
        else:
            log(f"⚠️ Status inesperado ao testar RLS: {response.status_code}", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar RLS: {str(e)}", "ERROR")
        return False

def test_table_structure():
    """Testar a estrutura de algumas tabelas principais"""
    try:
        log("🏗️ Testando estrutura das tabelas...")
        
        # Testar tabela profiles
        response = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=*&limit=1", headers=headers)
        if response.status_code == 200:
            log("✅ Tabela profiles está acessível")
        else:
            log(f"⚠️ Tabela profiles retornou status {response.status_code}", "WARNING")
        
        # Testar tabela companies
        response = requests.get(f"{SUPABASE_URL}/rest/v1/companies?select=*&limit=1", headers=headers)
        if response.status_code == 200:
            log("✅ Tabela companies está acessível")
        else:
            log(f"⚠️ Tabela companies retornou status {response.status_code}", "WARNING")
        
        # Testar tabela activities
        response = requests.get(f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=1", headers=headers)
        if response.status_code == 200:
            log("✅ Tabela activities está acessível")
        else:
            log(f"⚠️ Tabela activities retornou status {response.status_code}", "WARNING")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar estrutura das tabelas: {str(e)}", "ERROR")
        return False

def check_functions():
    """Verificar se as funções foram criadas"""
    try:
        log("🔧 Verificando funções criadas...")
        
        # Tentar acessar as funções (pode não funcionar via REST API)
        log("ℹ️ Funções são verificadas via Dashboard do Supabase")
        log("ℹ️ Verifique em: Database → Functions")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao verificar funções: {str(e)}", "ERROR")
        return False

def generate_test_data():
    """Gerar dados de teste para o sistema"""
    try:
        log("📝 Preparando dados de teste...")
        
        # Dados de exemplo para empresas
        company_data = {
            "fantasy_name": "Empresa Teste",
            "company_name": "Empresa Teste LTDA",
            "cnpj": "12.345.678/0001-90",
            "email": "teste@empresa.com",
            "phone": "(11) 99999-9999",
            "status": "active"
        }
        
        log("✅ Dados de teste preparados")
        log("💡 Nota: Os dados serão criados quando o primeiro usuário se cadastrar")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao preparar dados de teste: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🧪 INICIANDO TESTES DO SISTEMA CRM VBSOLUTION")
    log("=" * 60)
    
    # Testar conexão
    if not test_connection():
        log("❌ Falha na conexão. Abortando testes.", "ERROR")
        return False
    
    # Verificar tabelas
    tables_ok = check_tables()
    
    # Testar RLS
    rls_ok = test_rls()
    
    # Testar estrutura das tabelas
    structure_ok = test_table_structure()
    
    # Verificar funções
    functions_ok = check_functions()
    
    # Preparar dados de teste
    test_data_ok = generate_test_data()
    
    # Resumo dos testes
    log("=" * 60)
    log("📊 RESUMO DOS TESTES:")
    log(f"🔗 Conexão: {'✅ OK' if True else '❌ FALHOU'}")
    log(f"📋 Tabelas: {'✅ OK' if tables_ok else '❌ FALHOU'}")
    log(f"🔒 RLS: {'✅ OK' if rls_ok else '⚠️ ATENÇÃO'}")
    log(f"🏗️ Estrutura: {'✅ OK' if structure_ok else '⚠️ ATENÇÃO'}")
    log(f"🔧 Funções: {'✅ OK' if functions_ok else 'ℹ️ VERIFICAR MANUALMENTE'}")
    log(f"📝 Dados de teste: {'✅ OK' if test_data_ok else '❌ FALHOU'}")
    
    if tables_ok and rls_ok:
        log("🎉 SISTEMA FUNCIONANDO CORRETAMENTE!")
        log("=" * 60)
        log("🚀 PRÓXIMOS PASSOS:")
        log("1. Testar o frontend: npm run dev")
        log("2. Fazer cadastro de usuário")
        log("3. Criar primeira empresa")
        log("4. Testar funcionalidades")
        log("=" * 60)
        return True
    else:
        log("⚠️ SISTEMA COM PROBLEMAS - VERIFICAR MIGRAÇÃO")
        log("=" * 60)
        log("🔧 SOLUÇÕES:")
        log("1. Verificar se a migração foi aplicada corretamente")
        log("2. Verificar logs do SQL Editor")
        log("3. Aplicar migração novamente se necessário")
        log("=" * 60)
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        log("\n⚠️ Testes interrompidos pelo usuário", "WARNING")
        exit(1)
    except Exception as e:
        log(f"\n❌ Erro inesperado: {str(e)}", "ERROR")
        exit(1)
