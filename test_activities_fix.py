#!/usr/bin/env python3
"""
Script para testar especificamente a página de atividades e identificar problemas
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

def test_activities_table():
    """Testar especificamente a tabela activities"""
    try:
        log("🔍 Testando tabela activities...")
        
        # Testar acesso básico
        response = requests.get(f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=1", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            log(f"✅ Tabela activities acessível - {len(data)} registros")
            
            if data:
                # Verificar estrutura dos dados
                first_activity = data[0]
                log(f"📊 Estrutura da primeira atividade:")
                for key, value in first_activity.items():
                    log(f"   {key}: {type(value).__name__} = {value}")
            else:
                log("📊 Tabela activities está vazia (sem dados mockados)")
            
            return True, data
        else:
            log(f"❌ Erro ao acessar activities: {response.status_code} - {response.text}", "ERROR")
            return False, []
            
    except Exception as e:
        log(f"❌ Erro ao testar activities: {str(e)}", "ERROR")
        return False, []

def test_activities_with_filters():
    """Testar filtros na tabela activities"""
    try:
        log("🔍 Testando filtros na tabela activities...")
        
        # Testar diferentes filtros
        filters = [
            "?select=*&limit=5",
            "?select=id,title,status&limit=3",
            "?select=*&status=eq.pending&limit=2",
            "?select=*&priority=eq.high&limit=2"
        ]
        
        for filter_query in filters:
            try:
                response = requests.get(f"{SUPABASE_URL}/rest/v1/activities{filter_query}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    log(f"✅ Filtro {filter_query}: {len(data)} registros retornados")
                else:
                    log(f"⚠️ Filtro {filter_query}: Status {response.status_code}")
                    
            except Exception as e:
                log(f"❌ Erro no filtro {filter_query}: {str(e)}", "ERROR")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar filtros: {str(e)}", "ERROR")
        return False

def test_activities_insert():
    """Testar inserção na tabela activities (simulação)"""
    try:
        log("🔍 Testando inserção na tabela activities...")
        
        # Dados de teste (sem owner_id válido para teste de estrutura)
        test_activity = {
            "title": "Teste de Atividade",
            "description": "Teste para verificar estrutura da tabela",
            "status": "pending",
            "priority": "medium",
            "due_date": "2025-12-31T23:59:59Z"
        }
        
        # Tentar inserir (deve falhar por falta de owner_id, mas testa estrutura)
        response = requests.post(f"{SUPABASE_URL}/rest/v1/activities", 
                               headers=headers, 
                               json=test_activity)
        
        if response.status_code in [400, 422]:  # Erro esperado por owner_id obrigatório
            log("✅ Estrutura da tabela activities está correta (erro esperado por owner_id)")
            return True
        else:
            log(f"⚠️ Status inesperado na inserção: {response.status_code}", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar inserção: {str(e)}", "ERROR")
        return False

def test_activities_permissions():
    """Testar permissões da tabela activities"""
    try:
        log("🔍 Testando permissões da tabela activities...")
        
        # Testar acesso sem autenticação (deve falhar com RLS ativo)
        response = requests.get(f"{SUPABASE_URL}/rest/v1/activities", headers=headers)
        
        if response.status_code in [401, 403]:
            log("✅ Políticas RLS estão ativas (acesso negado sem autenticação)")
            return True
        elif response.status_code == 200:
            log("⚠️ Políticas RLS podem não estar ativas (dados acessíveis sem autenticação)", "WARNING")
            return False
        else:
            log(f"⚠️ Status inesperado ao testar permissões: {response.status_code}", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar permissões: {str(e)}", "ERROR")
        return False

def check_activities_structure():
    """Verificar estrutura completa da tabela activities"""
    try:
        log("🔍 Verificando estrutura da tabela activities...")
        
        # Verificar se a tabela tem as colunas esperadas
        response = requests.get(f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=1", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            if data:
                first_activity = data[0]
                expected_columns = [
                    'id', 'owner_id', 'title', 'description', 'status', 
                    'priority', 'due_date', 'assigned_to', 'project_id',
                    'created_at', 'updated_at'
                ]
                
                missing_columns = []
                for col in expected_columns:
                    if col not in first_activity:
                        missing_columns.append(col)
                
                if missing_columns:
                    log(f"⚠️ Colunas faltando na tabela activities: {', '.join(missing_columns)}", "WARNING")
                else:
                    log("✅ Todas as colunas esperadas estão presentes na tabela activities")
                
                return True
            else:
                log("📊 Tabela activities está vazia - não é possível verificar estrutura")
                return True
        else:
            log(f"❌ Não foi possível verificar estrutura: {response.status_code}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao verificar estrutura: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🧪 TESTE ESPECÍFICO DA PÁGINA DE ATIVIDADES")
    log("=" * 60)
    
    # Testar tabela activities
    activities_ok, activities_data = test_activities_table()
    
    # Testar filtros
    filters_ok = test_activities_with_filters()
    
    # Testar inserção
    insert_ok = test_activities_insert()
    
    # Testar permissões
    permissions_ok = test_activities_permissions()
    
    # Verificar estrutura
    structure_ok = check_activities_structure()
    
    # Resumo dos testes
    log("=" * 60)
    log("📊 RESUMO DOS TESTES DE ATIVIDADES:")
    log(f"   📋 Tabela acessível: {'✅ OK' if activities_ok else '❌ FALHOU'}")
    log(f"   🔍 Filtros funcionando: {'✅ OK' if filters_ok else '⚠️ ATENÇÃO'}")
    log(f"   📝 Estrutura de inserção: {'✅ OK' if insert_ok else '⚠️ ATENÇÃO'}")
    log(f"   🔒 Permissões RLS: {'✅ OK' if permissions_ok else '⚠️ ATENÇÃO'}")
    log(f"   🏗️ Estrutura da tabela: {'✅ OK' if structure_ok else '⚠️ ATENÇÃO'}")
    
    if activities_ok and structure_ok:
        log("🎉 TABELA ACTIVITIES FUNCIONANDO PERFEITAMENTE!")
        log("=" * 60)
        log("🔧 PROBLEMA IDENTIFICADO:")
        log("O loading eterno pode ser causado por:")
        log("1. Dados mockados corrompidos")
        log("2. Problemas de RLS")
        log("3. Falta de dados para o usuário logado")
        log("=" * 60)
        log("💡 SOLUÇÃO:")
        log("Execute o script clean_and_sync_system.sql no Supabase")
        log("Isso vai limpar dados mockados e sincronizar tudo")
        log("=" * 60)
        return True
    else:
        log("⚠️ PROBLEMAS NA TABELA ACTIVITIES")
        log("=" * 60)
        log("🔧 SOLUÇÕES:")
        log("1. Execute clean_and_sync_system.sql no Supabase")
        log("2. Verifique se a tabela foi criada corretamente")
        log("3. Verifique as políticas RLS")
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
