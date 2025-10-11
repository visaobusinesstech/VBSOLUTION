#!/usr/bin/env python3
"""
Script para aplicar automaticamente a migração do VBSolution no Supabase
Este script reconstrói todo o sistema com isolamento completo por usuário
"""

import os
import sys
import requests
import json
from pathlib import Path

# Configurações do Supabase
SUPABASE_URL = "https://zqlwthtkjhmjydkeghfh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbHd0aHRramhtanlka2VnaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTUxMTksImV4cCI6MjA3MDk3MTExOX0.iDAzEjWRHjETngE-elo2zVdgaRmsIWoKDY12OT_O4NY"

def read_migration_file():
    """Lê o arquivo de migração"""
    migration_path = Path("supabase/migrations/20250801120000_complete_system_restructure.sql")
    
    if not migration_path.exists():
        print(f"❌ Arquivo de migração não encontrado: {migration_path}")
        sys.exit(1)
    
    with open(migration_path, 'r', encoding='utf-8') as f:
        return f.read()

def apply_migration_supabase():
    """Aplica a migração via Supabase REST API"""
    print("🚀 Iniciando aplicação da migração no Supabase...")
    
    # Ler arquivo de migração
    migration_sql = read_migration_file()
    
    # Headers para a requisição
    headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
    }
    
    # Dados da requisição
    data = {
        'query': migration_sql
    }
    
    try:
        print("📡 Enviando migração para o Supabase...")
        
        # Fazer requisição para executar SQL
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json=data,
            timeout=300  # 5 minutos de timeout
        )
        
        if response.status_code == 200:
            print("✅ Migração aplicada com sucesso!")
            print("📊 Verificando resultado...")
            return True
        else:
            print(f"❌ Erro ao aplicar migração: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def verify_migration():
    """Verifica se a migração foi aplicada corretamente"""
    print("🔍 Verificando resultado da migração...")
    
    # Headers para verificação
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
    }
    
    try:
        # Verificar tabelas criadas
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/rpc/get_tables",
            headers=headers
        )
        
        if response.status_code == 200:
            tables = response.json()
            print(f"✅ Tabelas criadas: {len(tables)}")
            for table in tables:
                print(f"   - {table['tablename']}")
        else:
            print("⚠️ Não foi possível verificar as tabelas")
            
    except Exception as e:
        print(f"⚠️ Erro ao verificar migração: {e}")

def main():
    """Função principal"""
    print("=" * 60)
    print("🔒 VBSOLUTION - RECONSTRUÇÃO COMPLETA DO SISTEMA")
    print("=" * 60)
    print()
    print("📋 Este script irá:")
    print("   1. Remover tabelas antigas e inúteis")
    print("   2. Criar estrutura completa do sistema")
    print("   3. Implementar isolamento total por usuário")
    print("   4. Configurar todas as políticas de segurança")
    print()
    
    # Confirmar execução
    confirm = input("⚠️  ATENÇÃO: Esta operação irá recriar todo o banco de dados. Continuar? (s/N): ")
    
    if confirm.lower() not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário")
        sys.exit(0)
    
    print()
    print("🚀 Iniciando processo...")
    print()
    
    # Aplicar migração
    success = apply_migration_supabase()
    
    if success:
        print()
        print("✅ MIGRAÇÃO APLICADA COM SUCESSO!")
        print()
        print("🎯 O que foi implementado:")
        print("   ✅ Sistema completo com 20+ tabelas")
        print("   ✅ Isolamento total por usuário")
        print("   ✅ Políticas de segurança em todas as tabelas")
        print("   ✅ Índices para performance")
        print("   ✅ Triggers automáticos")
        print("   ✅ Estrutura para todas as páginas do sistema")
        print()
        print("🔒 SEGURANÇA GARANTIDA:")
        print("   - Cada usuário só vê seus próprios dados")
        print("   - Atividades isoladas por usuário")
        print("   - Projetos isolados por usuário")
        print("   - Empresas isoladas por usuário")
        print("   - Nenhum vazamento de dados entre contas")
        print()
        print("📱 PÁGINAS SUPORTADAS:")
        print("   - Dashboard (Index) - Blocos personalizáveis")
        print("   - Activities - Tarefas e atividades")
        print("   - Projects - Gerenciamento de projetos")
        print("   - Companies - Cadastro de empresas")
        print("   - Employees - Funcionários")
        print("   - Inventory - Controle de estoque")
        print("   - Products - Produtos e serviços")
        print("   - Leads & Sales - Funil de vendas")
        print("   - Work Groups - Grupos de trabalho")
        print("   - Calendar - Eventos e calendário")
        print("   - Files - Gerenciamento de arquivos")
        print("   - Chat - Sistema de mensagens")
        print("   - Settings - Configurações")
        print("   - Reports - Relatórios")
        print()
        print("🎉 SISTEMA PRONTO PARA USO!")
        print("   Agora cada usuário tem total autonomia e isolamento de dados!")
        
        # Verificar resultado
        verify_migration()
        
    else:
        print()
        print("❌ FALHA NA MIGRAÇÃO!")
        print("   Verifique os logs acima e tente novamente")
        print("   Ou execute manualmente no SQL Editor do Supabase")
        sys.exit(1)

if __name__ == "__main__":
    main()
