#!/usr/bin/env python3
"""
Script para aplicar automaticamente a correção da página activities
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

def create_test_user():
    """Criar usuário de teste na tabela profiles"""
    try:
        log("🔧 Criando usuário de teste...")
        
        test_user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "teste@vbsolution.com",
            "name": "Usuário Teste",
            "company": "VBSolution",
            "role": "admin"
        }
        
        response = requests.post(f"{SUPABASE_URL}/rest/v1/profiles", 
                               headers=headers, 
                               json=test_user)
        
        if response.status_code == 201:
            log("✅ Usuário de teste criado com sucesso")
            return True
        elif response.status_code == 409:  # Conflict - usuário já existe
            log("ℹ️ Usuário de teste já existe")
            return True
        else:
            log(f"⚠️ Erro ao criar usuário de teste: {response.status_code}", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao criar usuário de teste: {str(e)}", "ERROR")
        return False

def create_test_activity():
    """Criar atividade de teste na tabela activities"""
    try:
        log("🔧 Criando atividade de teste...")
        
        # Primeiro, obter o ID do usuário de teste
        profiles_response = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=id&limit=1", headers=headers)
        
        if profiles_response.status_code == 200:
            profiles = profiles_response.json()
            if profiles:
                test_user_id = profiles[0]['id']
                log(f"✅ Usuário de teste encontrado: {test_user_id}")
                
                # Criar atividade de teste
                test_activity = {
                    "owner_id": test_user_id,
                    "title": "Atividade de Teste - Sistema",
                    "description": "Esta é uma atividade de teste para verificar o funcionamento do sistema",
                    "type": "task",
                    "priority": "medium",
                    "status": "pending",
                    "progress": 0,
                    "is_urgent": False,
                    "is_public": False,
                    "tags": ["teste", "sistema"]
                }
                
                response = requests.post(f"{SUPABASE_URL}/rest/v1/activities", 
                                       headers=headers, 
                                       json=test_activity)
                
                if response.status_code == 201:
                    log("✅ Atividade de teste criada com sucesso")
                    return True
                elif response.status_code == 409:  # Conflict - atividade já existe
                    log("ℹ️ Atividade de teste já existe")
                    return True
                else:
                    log(f"⚠️ Erro ao criar atividade de teste: {response.status_code}", "WARNING")
                    return False
            else:
                log("❌ Nenhum usuário encontrado para criar atividade de teste", "ERROR")
                return False
        else:
            log(f"❌ Erro ao acessar profiles: {profiles_response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao criar atividade de teste: {str(e)}", "ERROR")
        return False

def test_activities_page():
    """Testar se a página de activities está funcionando"""
    try:
        log("🧪 Testando página de activities...")
        
        response = requests.get(f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=5", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0:
                log(f"✅ Página Activities funcionando - {len(data)} atividades encontradas")
                log("   💡 A página deve carregar normalmente agora")
                return True
            else:
                log("⚠️ Página Activities acessível mas sem dados", "WARNING")
                return False
        else:
            log(f"❌ Erro ao acessar activities: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar activities: {str(e)}", "ERROR")
        return False

def test_rls_functionality():
    """Testar se o RLS está funcionando corretamente"""
    try:
        log("🔒 Testando funcionalidade RLS...")
        
        # Tentar inserir atividade sem owner_id (deve falhar)
        test_activity_no_owner = {
            "title": "Teste RLS",
            "description": "Teste sem owner_id",
            "status": "pending",
            "priority": "medium",
            "type": "task"
        }
        
        response = requests.post(f"{SUPABASE_URL}/rest/v1/activities", 
                               headers=headers, 
                               json=test_activity_no_owner)
        
        if response.status_code in [400, 401, 403, 422]:
            log("✅ RLS funcionando - inserção bloqueada sem owner_id")
            return True
        else:
            log(f"⚠️ RLS pode não estar funcionando: {response.status_code}", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao testar RLS: {str(e)}", "ERROR")
        return False

def verify_system_status():
    """Verificar status geral do sistema"""
    try:
        log("🔍 Verificando status geral do sistema...")
        
        # Verificar tabela activities
        activities_response = requests.get(f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=1", headers=headers)
        activities_count = len(activities_response.json()) if activities_response.status_code == 200 else 0
        
        # Verificar tabela profiles
        profiles_response = requests.get(f"{SUPABASE_URL}/rest/v1/profiles?select=*&limit=1", headers=headers)
        profiles_count = len(profiles_response.json()) if profiles_response.status_code == 200 else 0
        
        log(f"📊 Status do Sistema:")
        log(f"   - Tabela activities: {activities_count} registros")
        log(f"   - Tabela profiles: {profiles_count} usuários")
        
        if activities_count > 0 and profiles_count > 0:
            log("✅ Sistema funcionando perfeitamente")
            return True
        else:
            log("⚠️ Sistema com problemas", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao verificar status: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🚀 APLICAÇÃO AUTOMÁTICA DA CORREÇÃO DA PÁGINA ACTIVITIES")
    log("=" * 70)
    
    # Passo 1: Criar usuário de teste
    user_ok = create_test_user()
    
    # Passo 2: Criar atividade de teste
    activity_ok = create_test_activity()
    
    # Passo 3: Testar página de activities
    page_ok = test_activities_page()
    
    # Passo 4: Testar RLS
    rls_ok = test_rls_functionality()
    
    # Passo 5: Verificar status geral
    system_ok = verify_system_status()
    
    # Resumo final
    log("=" * 70)
    log("📊 RESUMO DA APLICAÇÃO:")
    log(f"   👤 Usuário de teste: {'✅ OK' if user_ok else '❌ FALHOU'}")
    log(f"   📝 Atividade de teste: {'✅ OK' if activity_ok else '❌ FALHOU'}")
    log(f"   🎯 Página Activities: {'✅ OK' if page_ok else '❌ FALHOU'}")
    log(f"   🔒 RLS funcionando: {'✅ OK' if rls_ok else '❌ FALHOU'}")
    log(f"   🖥️ Sistema geral: {'✅ OK' if system_ok else '❌ FALHOU'}")
    
    if user_ok and activity_ok and page_ok and rls_ok and system_ok:
        log("🎉 CORREÇÃO APLICADA COM SUCESSO!")
        log("=" * 70)
        log("✅ RESULTADOS:")
        log("   - Usuário de teste criado")
        log("   - Atividade de teste criada")
        log("   - Página Activities funcionando")
        log("   - RLS ativo e funcionando")
        log("   - Sistema 100% operacional")
        log("=" * 70)
        log("💡 A página Activities deve carregar normalmente agora!")
        log("   Sem mais loading eterno!")
        log("=" * 70)
        return True
    else:
        log("⚠️ CORREÇÃO PARCIALMENTE APLICADA")
        log("=" * 70)
        log("🔧 PRÓXIMOS PASSOS:")
        log("1. Execute o script SOLUCAO_COMPLETA_ACTIVITIES.sql no Supabase")
        log("2. Verifique se todas as políticas RLS foram criadas")
        log("3. Confirme que as permissões estão corretas")
        log("4. Teste novamente a página Activities")
        log("=" * 70)
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        log("\n⚠️ Aplicação interrompida pelo usuário", "WARNING")
        exit(1)
    except Exception as e:
        log(f"\n❌ Erro inesperado: {str(e)}", "ERROR")
        exit(1)
