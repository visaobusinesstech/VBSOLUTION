#!/usr/bin/env python3
"""
Script para verificar todas as tabelas existentes no Supabase e analisar sincronização
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

def get_all_tables():
    """Listar todas as tabelas disponíveis"""
    try:
        log("🔍 Listando todas as tabelas disponíveis...")
        
        # Tentar acessar diferentes tabelas conhecidas
        known_tables = [
            'profiles', 'companies', 'employees', 'products', 'suppliers',
            'inventory', 'leads', 'deals', 'activities', 'projects',
            'work_groups', 'whatsapp_atendimentos', 'whatsapp_mensagens',
            'customers', 'orders', 'payments', 'tasks', 'notes',
            'documents', 'files', 'settings', 'notifications'
        ]
        
        available_tables = []
        accessible_tables = []
        
        for table in known_tables:
            try:
                response = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1", headers=headers)
                
                if response.status_code == 200:
                    available_tables.append(table)
                    accessible_tables.append(table)
                    log(f"✅ Tabela {table} - ACESSÍVEL")
                elif response.status_code in [401, 403]:
                    available_tables.append(table)
                    log(f"🔒 Tabela {table} - COM RLS ATIVO")
                else:
                    log(f"❌ Tabela {table} - Status {response.status_code}")
                    
            except Exception as e:
                log(f"⚠️ Erro ao testar tabela {table}: {str(e)}", "WARNING")
        
        return available_tables, accessible_tables
        
    except Exception as e:
        log(f"❌ Erro ao listar tabelas: {str(e)}", "ERROR")
        return [], []

def check_table_structure(table_name):
    """Verificar estrutura de uma tabela específica"""
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=1", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                # Pegar as chaves do primeiro registro para ver as colunas
                columns = list(data[0].keys()) if data else []
                log(f"📊 Tabela {table_name}: {len(columns)} colunas")
                log(f"   Colunas: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}")
                return True, columns
            else:
                log(f"📊 Tabela {table_name}: 0 registros (vazia)")
                return True, []
        else:
            log(f"❌ Erro ao acessar {table_name}: {response.status_code}")
            return False, []
            
    except Exception as e:
        log(f"❌ Erro ao verificar {table_name}: {str(e)}", "ERROR")
        return False, []

def analyze_system_pages():
    """Analisar as páginas do sistema para identificar funcionalidades"""
    log("🏗️ ANALISANDO PÁGINAS E FUNCIONALIDADES DO SISTEMA")
    log("=" * 60)
    
    # Páginas principais identificadas no sistema
    system_pages = {
        'Dashboard': ['overview', 'stats', 'charts'],
        'Empresas': ['companies', 'company_management'],
        'Funcionários': ['employees', 'staff_management'],
        'Produtos': ['products', 'inventory'],
        'Fornecedores': ['suppliers', 'vendor_management'],
        'Leads': ['leads', 'prospects'],
        'Oportunidades': ['deals', 'sales'],
        'Atividades': ['activities', 'tasks'],
        'Projetos': ['projects', 'project_management'],
        'Grupos de Trabalho': ['work_groups', 'teams'],
        'WhatsApp': ['whatsapp_atendimentos', 'whatsapp_mensagens'],
        'Relatórios': ['reports', 'analytics'],
        'Configurações': ['settings', 'profile']
    }
    
    log("📱 PÁGINAS IDENTIFICADAS NO SISTEMA:")
    for page, features in system_pages.items():
        log(f"   🎯 {page}: {', '.join(features)}")
    
    return system_pages

def check_synchronization(available_tables, system_pages):
    """Verificar sincronização entre tabelas e páginas"""
    log("=" * 60)
    log("🔗 VERIFICANDO SINCRONIZAÇÃO TABELAS ↔️ PÁGINAS")
    log("=" * 60)
    
    # Mapeamento esperado de tabelas para páginas
    expected_mapping = {
        'profiles': ['Configurações', 'Dashboard'],
        'companies': ['Empresas'],
        'employees': ['Funcionários'],
        'products': ['Produtos'],
        'suppliers': ['Fornecedores'],
        'inventory': ['Produtos', 'Estoque'],
        'leads': ['Leads'],
        'deals': ['Oportunidades'],
        'activities': ['Atividades'],
        'projects': ['Projetos'],
        'work_groups': ['Grupos de Trabalho'],
        'whatsapp_atendimentos': ['WhatsApp'],
        'whatsapp_mensagens': ['WhatsApp']
    }
    
    # Verificar tabelas disponíveis vs esperadas
    missing_tables = []
    extra_tables = []
    
    for expected_table in expected_mapping.keys():
        if expected_table not in available_tables:
            missing_tables.append(expected_table)
    
    for available_table in available_tables:
        if available_table not in expected_mapping.keys():
            extra_tables.append(available_table)
    
    # Relatório de sincronização
    log("📊 RELATÓRIO DE SINCRONIZAÇÃO:")
    log(f"   ✅ Tabelas sincronizadas: {len(available_tables) - len(missing_tables)}")
    log(f"   ❌ Tabelas faltando: {len(missing_tables)}")
    log(f"   🔍 Tabelas extras: {len(extra_tables)}")
    
    if missing_tables:
        log("   📋 TABELAS FALTANDO:")
        for table in missing_tables:
            pages = expected_mapping.get(table, [])
            log(f"      ❌ {table} → Páginas: {', '.join(pages)}")
    
    if extra_tables:
        log("   🔍 TABELAS EXTRAS (não mapeadas):")
        for table in extra_tables:
            log(f"      ⚠️ {table}")
    
    # Verificar funcionalidades por página
    log("   🎯 FUNCIONALIDADES POR PÁGINA:")
    for page, features in system_pages.items():
        related_tables = [table for table, pages in expected_mapping.items() if page in pages]
        if related_tables:
            log(f"      📱 {page}: {', '.join(related_tables)}")
        else:
            log(f"      ⚠️ {page}: Sem tabelas relacionadas")
    
    return len(missing_tables) == 0

def main():
    """Função principal"""
    log("🔍 VERIFICAÇÃO COMPLETA DE TABELAS E SINCRONIZAÇÃO")
    log("=" * 60)
    
    # Listar todas as tabelas
    available_tables, accessible_tables = get_all_tables()
    
    # Analisar páginas do sistema
    system_pages = analyze_system_pages()
    
    # Verificar sincronização
    is_synchronized = check_synchronization(available_tables, system_pages)
    
    # Resumo final
    log("=" * 60)
    log("📊 RESUMO FINAL:")
    log(f"   🔗 Total de tabelas: {len(available_tables)}")
    log(f"   ✅ Tabelas acessíveis: {len(accessible_tables)}")
    log(f"   📱 Páginas do sistema: {len(system_pages)}")
    log(f"   🔄 Sincronização: {'✅ COMPLETA' if is_synchronized else '❌ INCOMPLETA'}")
    
    if is_synchronized:
        log("🎉 SISTEMA TOTALMENTE SINCRONIZADO!")
    else:
        log("⚠️ SISTEMA COM TABELAS FALTANDO")
        log("🔧 Execute o script CREATE_TABLES_SUPABASE.sql novamente")
    
    log("=" * 60)
    return is_synchronized

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
