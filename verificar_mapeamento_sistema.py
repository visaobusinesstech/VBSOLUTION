#!/usr/bin/env python3
"""
Script para verificar o mapeamento completo do sistema CRM
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

def check_table_access(table_name):
    """Verificar acesso a uma tabela específica"""
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=1", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return True, len(data), "✅ Acessível"
        elif response.status_code in [401, 403]:
            return False, 0, "🔒 Acesso negado (RLS ativo)"
        elif response.status_code == 404:
            return False, 0, "❌ Tabela não encontrada"
        else:
            return False, 0, f"⚠️ Erro {response.status_code}"
            
    except Exception as e:
        return False, 0, f"❌ Erro: {str(e)}"

def check_page_table_mapping():
    """Verificar mapeamento das páginas com suas tabelas"""
    log("🔍 VERIFICANDO MAPEAMENTO COMPLETO DO SISTEMA")
    log("=" * 80)
    
    # Mapeamento das páginas e suas tabelas principais
    page_mapping = {
        "🏠 Dashboard (Index.tsx)": ["activities", "companies", "deals", "leads", "products", "projects"],
        "🎯 Activities (Activities.tsx)": ["activities", "profiles", "employees", "companies", "projects"],
        "🏢 Companies (Companies.tsx)": ["companies", "profiles", "employees"],
        "👥 Employees (Employees.tsx)": ["employees", "profiles", "companies", "work_groups"],
        "📦 Products (Products.tsx)": ["products", "profiles", "companies", "suppliers"],
        "📊 Projects (Projects.tsx)": ["projects", "profiles", "employees", "companies"],
        "🎣 Leads (LeadsSales.tsx)": ["leads", "profiles", "companies", "employees"],
        "💰 Deals (SalesFunnel.tsx)": ["deals", "profiles", "companies", "leads"],
        "📦 Inventory (Inventory.tsx)": ["inventory", "profiles", "products", "companies"],
        "🛒 Sales Orders (SalesOrders.tsx)": ["orders", "profiles", "customers", "products"],
        "📱 WhatsApp (WhatsApp.tsx)": ["whatsapp_atendimentos", "whatsapp_mensagens", "profiles"],
        "📈 Reports (Reports.tsx)": ["activities", "companies", "deals", "leads", "products", "projects"],
        "⚙️ Settings (Settings.tsx)": ["profiles", "company_settings"],
        "🔧 Work Groups (WorkGroups.tsx)": ["work_groups", "profiles", "employees"],
        "🏭 Suppliers (Suppliers.tsx)": ["suppliers", "profiles", "companies"],
        "📅 Calendar (Calendar.tsx)": ["activities", "events", "profiles"],
        "💬 Chat (Chat.tsx)": ["messages", "profiles", "chat_rooms"],
        "📁 Files (Files.tsx)": ["files", "profiles", "companies"],
        "📋 Documents (Documents.tsx)": ["documents", "profiles", "companies"],
        "👤 Collaborations (Collaborations.tsx)": ["collaborations", "profiles", "companies"]
    }
    
    # Verificar cada página e suas tabelas
    total_pages = len(page_mapping)
    working_pages = 0
    problematic_pages = 0
    
    for page_name, tables in page_mapping.items():
        log(f"\n📱 {page_name}")
        log("-" * 60)
        
        page_working = True
        table_status = []
        
        for table in tables:
            accessible, count, status = check_table_access(table)
            table_status.append(f"  {table}: {status}")
            
            if not accessible and table in ["activities", "companies", "profiles"]:
                page_working = False
        
        # Mostrar status das tabelas
        for status in table_status:
            log(status)
        
        if page_working:
            log("  ✅ PÁGINA FUNCIONANDO")
            working_pages += 1
        else:
            log("  ❌ PÁGINA COM PROBLEMAS")
            problematic_pages += 1
    
    return working_pages, problematic_pages, total_pages

def check_critical_tables():
    """Verificar tabelas críticas do sistema"""
    log("\n🔍 VERIFICANDO TABELAS CRÍTICAS")
    log("=" * 60)
    
    critical_tables = [
        "profiles",      # Usuários do sistema
        "activities",    # Atividades (página com loading eterno)
        "companies",     # Empresas
        "employees",     # Funcionários
        "products",      # Produtos
        "projects",      # Projetos
        "leads",         # Leads
        "deals"          # Negócios
    ]
    
    critical_status = {}
    
    for table in critical_tables:
        accessible, count, status = check_table_access(table)
        critical_status[table] = {
            "accessible": accessible,
            "count": count,
            "status": status
        }
        
        log(f"{table}: {status} ({count} registros)")
    
    return critical_status

def check_rls_status():
    """Verificar status do RLS (Row Level Security)"""
    log("\n🔒 VERIFICANDO STATUS DO RLS")
    log("=" * 60)
    
    # Tentar acessar dados sem autenticação (deve falhar com RLS ativo)
    test_tables = ["activities", "companies", "profiles"]
    
    for table in test_tables:
        try:
            response = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1", headers=headers)
            
            if response.status_code in [401, 403]:
                log(f"{table}: ✅ RLS ativo (acesso negado sem autenticação)")
            elif response.status_code == 200:
                data = response.json()
                if len(data) == 0:
                    log(f"{table}: ⚠️ RLS pode não estar ativo (tabela vazia)")
                else:
                    log(f"{table}: ❌ RLS não está ativo (dados acessíveis sem autenticação)")
            else:
                log(f"{table}: ❓ Status inesperado ({response.status_code})")
                
        except Exception as e:
            log(f"{table}: ❌ Erro ao verificar RLS: {str(e)}")

def generate_system_report():
    """Gerar relatório completo do sistema"""
    log("\n📊 RELATÓRIO COMPLETO DO SISTEMA")
    log("=" * 80)
    
    # Verificar mapeamento das páginas
    working_pages, problematic_pages, total_pages = check_page_table_mapping()
    
    # Verificar tabelas críticas
    critical_status = check_critical_tables()
    
    # Verificar RLS
    check_rls_status()
    
    # Resumo final
    log("\n" + "=" * 80)
    log("📊 RESUMO FINAL DO MAPEAMENTO:")
    log(f"   📱 Total de páginas: {total_pages}")
    log(f"   ✅ Páginas funcionando: {working_pages}")
    log(f"   ❌ Páginas com problemas: {problematic_pages}")
    log(f"   📈 Taxa de sucesso: {(working_pages/total_pages)*100:.1f}%")
    
    # Análise das tabelas críticas
    critical_accessible = sum(1 for status in critical_status.values() if status["accessible"])
    critical_total = len(critical_status)
    
    log(f"\n🔑 TABELAS CRÍTICAS:")
    log(f"   ✅ Acessíveis: {critical_accessible}/{critical_total}")
    log(f"   ❌ Inacessíveis: {critical_total - critical_accessible}")
    
    # Recomendações
    log("\n💡 RECOMENDAÇÕES:")
    
    if problematic_pages > 0:
        log("   1. Execute o script MAPEAMENTO_COMPLETO_SISTEMA.sql no Supabase")
        log("   2. Verifique se todas as tabelas foram criadas corretamente")
        log("   3. Confirme que as políticas RLS estão ativas")
        log("   4. Teste novamente após aplicar as correções")
    
    if critical_accessible < critical_total:
        log("   1. Verifique a estrutura das tabelas críticas")
        log("   2. Confirme que as permissões estão corretas")
        log("   3. Teste o acesso a cada tabela individualmente")
    
    if working_pages == total_pages:
        log("   🎉 SISTEMA 100% FUNCIONANDO!")
        log("   💡 Todas as páginas estão sincronizadas com suas tabelas")
    
    log("\n" + "=" * 80)

def main():
    """Função principal"""
    log("🚀 VERIFICAÇÃO COMPLETA DO MAPEAMENTO DO SISTEMA CRM")
    log("=" * 80)
    
    try:
        generate_system_report()
        return True
    except Exception as e:
        log(f"❌ Erro durante a verificação: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        log("\n⚠️ Verificação interrompida pelo usuário", "WARNING")
        exit(1)
    except Exception as e:
        log(f"\n❌ Erro inesperado: {str(e)}", "ERROR")
        exit(1)
