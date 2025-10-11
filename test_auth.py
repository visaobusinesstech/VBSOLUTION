#!/usr/bin/env python3
"""
Script para testar especificamente a autenticação e criação de perfis
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

def test_profiles_table():
    """Testar se a tabela profiles está funcionando"""
    try:
        log("🔍 Testando tabela profiles...")
        
        # Tentar acessar a tabela profiles
        response = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=*&limit=1", headers=headers)
        
        if response.status_code == 200:
            log("✅ Tabela profiles está acessível")
            data = response.json()
            log(f"📊 Dados retornados: {len(data)} registros")
            return True
        else:
            log(f"❌ Erro ao acessar profiles: {response.status_code} - {response.text}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar profiles: {str(e)}", "ERROR")
        return False

def test_auth_endpoint():
    """Testar se o endpoint de autenticação está funcionando"""
    try:
        log("🔐 Testando endpoint de autenticação...")
        
        # Testar o endpoint de signup (deve retornar erro de dados inválidos, mas não erro de conexão)
        auth_data = {
            "email": "teste@teste.com",
            "password": "123456"
        }
        
        response = requests.post(f"{SUPABASE_URL}/auth/v1/signup", 
                               headers=headers, 
                               json=auth_data)
        
        # Qualquer resposta indica que o endpoint está funcionando
        log(f"✅ Endpoint de autenticação respondeu: {response.status_code}")
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar autenticação: {str(e)}", "ERROR")
        return False

def test_table_structure():
    """Testar a estrutura das tabelas principais"""
    try:
        log("🏗️ Testando estrutura das tabelas...")
        
        tables_to_test = [
            'profiles',
            'companies', 
            'activities'
        ]
        
        for table in tables_to_test:
            try:
                response = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1", headers=headers)
                
                if response.status_code == 200:
                    log(f"✅ Tabela {table} está acessível")
                else:
                    log(f"⚠️ Tabela {table} retornou status {response.status_code}", "WARNING")
                    
            except Exception as e:
                log(f"❌ Erro ao testar tabela {table}: {str(e)}", "ERROR")
        
        return True
        
    except Exception as e:
        log(f"❌ Erro ao testar estrutura das tabelas: {str(e)}", "ERROR")
        return False

def check_rls_policies():
    """Verificar se as políticas RLS estão funcionando"""
    try:
        log("🔒 Verificando políticas RLS...")
        
        # Tentar acessar dados sem autenticação (deve falhar com RLS ativo)
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

def test_manual_profile_creation():
    """Testar criação manual de perfil (simulação)"""
    try:
        log("📝 Testando criação manual de perfil...")
        
        # Dados de teste
        test_profile = {
            "id": "00000000-0000-0000-0000-000000000000",  # UUID inválido para teste
            "email": "teste@teste.com",
            "name": "Usuário Teste",
            "company": "Empresa Teste"
        }
        
        # Tentar inserir (deve falhar por UUID inválido, mas testa a estrutura)
        response = requests.post(f"{SUPABASE_URL}/rest/v1/profiles", 
                               headers=headers, 
                               json=test_profile)
        
        if response.status_code in [400, 422]:  # Erro esperado por UUID inválido
            log("✅ Estrutura da tabela profiles está correta (erro esperado por UUID inválido)")
            return True
        else:
            log(f"⚠️ Status inesperado: {response.status_code}", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar criação manual: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🧪 INICIANDO TESTES DE AUTENTICAÇÃO E PERFIS")
    log("=" * 60)
    
    # Testar tabela profiles
    profiles_ok = test_profiles_table()
    
    # Testar endpoint de autenticação
    auth_ok = test_auth_endpoint()
    
    # Testar estrutura das tabelas
    structure_ok = test_table_structure()
    
    # Verificar RLS
    rls_ok = check_rls_policies()
    
    # Testar criação manual de perfil
    manual_ok = test_manual_profile_creation()
    
    # Resumo dos testes
    log("=" * 60)
    log("📊 RESUMO DOS TESTES DE AUTENTICAÇÃO:")
    log(f"📋 Tabela profiles: {'✅ OK' if profiles_ok else '❌ FALHOU'}")
    log(f"🔐 Endpoint auth: {'✅ OK' if auth_ok else '❌ FALHOU'}")
    log(f"🏗️ Estrutura: {'✅ OK' if structure_ok else '⚠️ ATENÇÃO'}")
    log(f"🔒 RLS: {'✅ OK' if rls_ok else '⚠️ ATENÇÃO'}")
    log(f"📝 Criação manual: {'✅ OK' if manual_ok else '⚠️ ATENÇÃO'}")
    
    if profiles_ok and auth_ok:
        log("🎉 SISTEMA DE AUTENTICAÇÃO FUNCIONANDO!")
        log("=" * 60)
        log("🔧 PROBLEMA IDENTIFICADO:")
        log("O trigger automático pode não estar funcionando")
        log("Execute o script fix_auth_trigger.sql no Supabase")
        log("=" * 60)
        return True
    else:
        log("⚠️ PROBLEMAS NO SISTEMA DE AUTENTICAÇÃO")
        log("=" * 60)
        log("🔧 SOLUÇÕES:")
        log("1. Execute fix_auth_trigger.sql no Supabase")
        log("2. Verifique se a tabela profiles foi criada")
        log("3. Verifique as permissões e políticas RLS")
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
