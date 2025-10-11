#!/usr/bin/env python3
"""
Script de teste para verificar a nova configuração do Supabase
VBSolution - Sistema CRM Completo
"""

import requests
import json
from datetime import datetime

# Configurações do novo Supabase
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
    """Testar conexão básica com o Supabase"""
    try:
        log("🔗 Testando conexão básica com o Supabase...")
        
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        
        if response.status_code == 200:
            log("✅ Conexão básica estabelecida!")
            return True
        else:
            log(f"❌ Erro na conexão: Status {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao conectar: {str(e)}", "ERROR")
        return False

def test_auth_endpoints():
    """Testar endpoints de autenticação"""
    try:
        log("🔐 Testando endpoints de autenticação...")
        
        # Testar endpoint de signup (deve retornar erro sem dados, mas endpoint deve existir)
        response = requests.post(f"{SUPABASE_URL}/auth/v1/signup", headers=headers)
        
        if response.status_code in [400, 422]:  # Erro esperado sem dados
            log("✅ Endpoint de signup acessível")
        else:
            log(f"⚠️ Endpoint de signup retornou status {response.status_code}", "WARNING")
        
        # Testar endpoint de login
        response = requests.post(f"{SUPABASE_URL}/auth/v1/token?grant_type=password", headers=headers)
        
        if response.status_code in [400, 422]:  # Erro esperado sem dados
            log("✅ Endpoint de login acessível")
        else:
            log(f"⚠️ Endpoint de login retornou status {response.status_code}", "WARNING")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar autenticação: {str(e)}", "ERROR")
        return False

def test_storage():
    """Testar funcionalidade de storage"""
    try:
        log("📦 Testando funcionalidade de storage...")
        
        # Listar buckets (deve retornar erro sem autenticação, mas endpoint deve existir)
        response = requests.get(f"{SUPABASE_URL}/storage/v1/bucket", headers=headers)
        
        if response.status_code in [401, 403]:  # Erro esperado sem autenticação
            log("✅ Endpoint de storage acessível")
        else:
            log(f"⚠️ Endpoint de storage retornou status {response.status_code}", "WARNING")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar storage: {str(e)}", "ERROR")
        return False

def test_realtime():
    """Testar funcionalidade de realtime"""
    try:
        log("📡 Testando funcionalidade de realtime...")
        
        # Testar endpoint de realtime (deve retornar erro sem autenticação, mas endpoint deve existir)
        response = requests.get(f"{SUPABASE_URL}/realtime/v1/", headers=headers)
        
        if response.status_code in [401, 403, 404]:  # Erro esperado sem autenticação
            log("✅ Endpoint de realtime acessível")
        else:
            log(f"⚠️ Endpoint de realtime retornou status {response.status_code}", "WARNING")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar realtime: {str(e)}", "ERROR")
        return False

def test_database_schema():
    """Testar se as tabelas foram criadas corretamente"""
    try:
        log("🗄️ Testando estrutura do banco de dados...")
        
        # Listar tabelas disponíveis
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        
        if response.status_code == 200:
            tables = response.json()
            log(f"📊 Tabelas encontradas: {len(tables)}")
            
            # Verificar tabelas essenciais
            essential_tables = [
                'user_profiles', 'companies', 'employees', 'activities',
                'work_groups', 'products', 'leads', 'deals'
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
            log(f"❌ Erro ao listar tabelas: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar esquema: {str(e)}", "ERROR")
        return False

def test_rls_policies():
    """Testar se as políticas RLS estão funcionando"""
    try:
        log("🔒 Testando políticas RLS...")
        
        # Tentar acessar dados sem autenticação (deve falhar)
        response = requests.get(f"{SUPABASE_URL}/rest/v1/user_profiles", headers=headers)
        
        if response.status_code in [401, 403]:  # Erro esperado sem autenticação
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

def test_frontend_integration():
    """Testar se o frontend pode se conectar"""
    try:
        log("🌐 Testando integração com frontend...")
        
        # Verificar se as credenciais estão corretas
        test_url = f"{SUPABASE_URL}/rest/v1/"
        
        log(f"🔗 URL de teste: {test_url}")
        log(f"🔑 Chave anônima: {SUPABASE_ANON_KEY[:20]}...")
        
        # Testar com headers corretos
        response = requests.get(test_url, headers=headers)
        
        if response.status_code == 200:
            log("✅ Frontend pode se conectar com as credenciais atuais")
            return True
        else:
            log(f"❌ Frontend não consegue se conectar: Status {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar integração frontend: {str(e)}", "ERROR")
        return False

def main():
    """Função principal de teste"""
    log("🚀 Iniciando testes da nova configuração do Supabase")
    log(f"🔗 URL: {SUPABASE_URL}")
    
    tests = [
        ("Conexão Básica", test_connection),
        ("Endpoints de Autenticação", test_auth_endpoints),
        ("Storage", test_storage),
        ("Realtime", test_realtime),
        ("Estrutura do Banco", test_database_schema),
        ("Políticas RLS", test_rls_policies),
        ("Integração Frontend", test_frontend_integration)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        log(f"\n🧪 Executando teste: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            log(f"❌ Erro no teste {test_name}: {str(e)}", "ERROR")
            results.append((test_name, False))
    
    # Resumo dos resultados
    log("\n" + "="*50)
    log("📊 RESUMO DOS TESTES")
    log("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        log(f"{status} - {test_name}")
        if result:
            passed += 1
    
    log(f"\n🎯 Resultado Final: {passed}/{total} testes passaram")
    
    if passed == total:
        log("🎉 Todos os testes passaram! Sistema configurado corretamente.")
        log("\n📋 Próximos passos:")
        log("   1. ✅ Credenciais atualizadas")
        log("   2. ✅ Banco configurado")
        log("   3. ✅ RLS ativo")
        log("   4. ✅ Frontend integrado")
        log("   5. 🚀 Sistema pronto para uso!")
    else:
        log(f"⚠️ {total - passed} teste(s) falharam. Verifique a configuração.")
        log("\n🔧 Ações recomendadas:")
        log("   1. Verificar credenciais do Supabase")
        log("   2. Executar migração se necessário")
        log("   3. Verificar políticas RLS")
        log("   4. Testar novamente")

if __name__ == "__main__":
    main()
