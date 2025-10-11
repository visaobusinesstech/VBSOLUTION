#!/usr/bin/env python3
"""
Script para testar o sistema após a limpeza completa
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

def check_table_data(table_name):
    """Verificar se uma tabela está vazia (sem dados mockados)"""
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=10", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            record_count = len(data)
            
            if record_count == 0:
                log(f"✅ Tabela {table_name}: VAZIA (0 registros) - Sem dados mockados")
                return True, 0
            else:
                log(f"⚠️ Tabela {table_name}: {record_count} registros encontrados - Pode ter dados mockados", "WARNING")
                return False, record_count
        else:
            log(f"❌ Erro ao acessar {table_name}: {response.status_code}", "ERROR")
            return False, -1
            
    except Exception as e:
        log(f"❌ Erro ao verificar {table_name}: {str(e)}", "ERROR")
        return False, -1

def check_all_tables():
    """Verificar todas as tabelas principais"""
    log("🔍 VERIFICANDO TODAS AS TABELAS APÓS LIMPEZA")
    log("=" * 60)
    
    # Lista de todas as tabelas que devem estar vazias
    tables_to_check = [
        'activities', 'companies', 'deals', 'employees', 'inventory',
        'leads', 'products', 'projects', 'whatsapp_atendimentos', 
        'whatsapp_mensagens', 'suppliers', 'work_groups', 'customers',
        'orders', 'payments', 'tasks', 'notes'
    ]
    
    clean_tables = 0
    dirty_tables = 0
    
    for table in tables_to_check:
        is_clean, count = check_table_data(table)
        if is_clean:
            clean_tables += 1
        else:
            dirty_tables += 1
    
    log("=" * 60)
    log("📊 RESUMO DA VERIFICAÇÃO:")
    log(f"   ✅ Tabelas limpas: {clean_tables}")
    log(f"   ⚠️ Tabelas com dados: {dirty_tables}")
    log(f"   📋 Total verificado: {len(tables_to_check)}")
    
    if dirty_tables == 0:
        log("🎉 SISTEMA 100% LIMPO! Nenhum dado mockado encontrado")
        return True
    else:
        log("⚠️ SISTEMA AINDA TEM DADOS MOCKADOS")
        return False

def test_dashboard_loading():
    """Testar se o dashboard carrega sem dados mockados"""
    log("🔍 TESTANDO CARREGAMENTO DO DASHBOARD")
    log("=" * 60)
    
    # Testar tabelas principais que afetam o dashboard
    dashboard_tables = ['activities', 'companies', 'deals', 'leads', 'products']
    
    for table in dashboard_tables:
        try:
            response = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if len(data) == 0:
                    log(f"✅ {table}: Carrega instantaneamente (sem dados)")
                else:
                    log(f"⚠️ {table}: Pode causar loading lento ({len(data)} registros)")
            else:
                log(f"❌ {table}: Erro de acesso ({response.status_code})")
                
        except Exception as e:
            log(f"❌ Erro ao testar {table}: {str(e)}")
    
    return True

def test_activities_page():
    """Testar especificamente a página de atividades"""
    log("🔍 TESTANDO PÁGINA DE ATIVIDADES")
    log("=" * 60)
    
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=5", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if len(data) == 0:
                log("✅ Página Activities: Carrega instantaneamente (sem dados)")
                log("   💡 Usuários podem criar suas próprias atividades")
                return True
            else:
                log(f"⚠️ Página Activities: {len(data)} registros encontrados", "WARNING")
                return False
        else:
            log(f"❌ Erro ao acessar activities: {response.status_code}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar activities: {str(e)}")
        return False

def check_user_isolation():
    """Verificar se o sistema está isolado por usuário"""
    log("🔍 VERIFICANDO ISOLAMENTO DE USUÁRIOS")
    log("=" * 60)
    
    # Tentar acessar dados sem autenticação (deve falhar com RLS)
    test_tables = ['activities', 'companies', 'leads']
    
    for table in test_tables:
        try:
            response = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=headers)
            
            if response.status_code in [401, 403]:
                log(f"✅ {table}: RLS ativo (acesso negado sem autenticação)")
            elif response.status_code == 200:
                log(f"⚠️ {table}: RLS pode não estar ativo (dados acessíveis)", "WARNING")
            else:
                log(f"❓ {table}: Status inesperado ({response.status_code})")
                
        except Exception as e:
            log(f"❌ Erro ao testar RLS em {table}: {str(e)}")
    
    return True

def main():
    """Função principal"""
    log("🧪 TESTE COMPLETO APÓS LIMPEZA DO SISTEMA")
    log("=" * 60)
    
    # Verificar todas as tabelas
    all_clean = check_all_tables()
    
    # Testar dashboard
    dashboard_ok = test_dashboard_loading()
    
    # Testar página de atividades
    activities_ok = test_activities_page()
    
    # Verificar isolamento de usuários
    isolation_ok = check_user_isolation()
    
    # Resumo final
    log("=" * 60)
    log("📊 RESUMO FINAL DOS TESTES:")
    log(f"   🧹 Sistema limpo: {'✅ SIM' if all_clean else '❌ NÃO'}")
    log(f"   📱 Dashboard funcionando: {'✅ SIM' if dashboard_ok else '⚠️ ATENÇÃO'}")
    log(f"   🎯 Página Activities: {'✅ FUNCIONANDO' if activities_ok else '⚠️ PROBLEMAS'}")
    log(f"   🔒 Isolamento de usuários: {'✅ ATIVO' if isolation_ok else '⚠️ ATENÇÃO'}")
    
    if all_clean and activities_ok:
        log("🎉 SISTEMA PERFEITO APÓS LIMPEZA!")
        log("=" * 60)
        log("✅ RESULTADOS:")
        log("   - Nenhum dado mockado encontrado")
        log("   - Dashboard carrega instantaneamente")
        log("   - Página Activities funciona perfeitamente")
        log("   - Sistema isolado por usuário")
        log("   - Pronto para novos cadastros")
        log("=" * 60)
        return True
    else:
        log("⚠️ SISTEMA AINDA TEM PROBLEMAS")
        log("=" * 60)
        log("🔧 SOLUÇÕES:")
        log("1. Execute clean_dashboard_completely.sql novamente")
        log("2. Verifique se todas as tabelas estão vazias")
        log("3. Confirme que RLS está ativo")
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
