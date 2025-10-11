#!/usr/bin/env python3
"""
Script para corrigir o frontend para usar a estrutura real da tabela suppliers
"""

import requests
import json

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
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def check_auth_users():
    """Verificar se conseguimos acessar a tabela auth.users"""
    try:
        log("🔍 Verificando tabela auth.users...")
        
        # Tentar buscar da tabela auth.users (se estiver acessível)
        response = requests.get(f"{SUPABASE_URL}/rest/v1/auth/users", headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            log(f"✅ Tabela auth.users acessível. Usuários encontrados: {len(users)}")
            if users:
                log(f"📋 Primeiro usuário: {users[0]}")
            return True
        else:
            log(f"❌ Tabela auth.users não acessível: {response.status_code}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao acessar auth.users: {str(e)}", "ERROR")
        return False

def check_profiles_table():
    """Verificar se conseguimos acessar a tabela profiles"""
    try:
        log("🔍 Verificando tabela profiles...")
        
        # Tentar buscar da tabela profiles
        response = requests.get(f"{SUPABASE_URL}/rest/v1/profiles", headers=headers)
        
        if response.status_code == 200:
            profiles = response.json()
            log(f"✅ Tabela profiles acessível. Perfis encontrados: {len(profiles)}")
            if profiles:
                log(f"📋 Primeiro perfil: {profiles[0]}")
            return True
        else:
            log(f"❌ Tabela profiles não acessível: {response.status_code}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao acessar profiles: {str(e)}", "ERROR")
        return False

def create_test_supplier():
    """Criar um fornecedor de teste usando a estrutura real"""
    try:
        log("🧪 Criando fornecedor de teste...")
        
        # Primeiro, vamos tentar criar um fornecedor com dados mínimos
        # e ver se conseguimos descobrir a estrutura
        test_supplier = {
            "name": "Fornecedor Teste Sistema"
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/suppliers",
            headers=headers,
            json=test_supplier
        )
        
        if response.status_code == 400:
            error_data = response.json()
            log(f"❌ Erro 400: {error_data.get('message', 'Erro desconhecido')}")
            
            # Se for erro de owner_id obrigatório, vamos tentar com um UUID válido
            if "owner_id" in error_data.get('message', ''):
                log("🔍 Owner_id é obrigatório. Tentando com UUID válido...")
                
                # Gerar um UUID válido
                import uuid
                test_uuid = str(uuid.uuid4())
                
                test_supplier_with_owner = {
                    "name": "Fornecedor Teste Sistema",
                    "owner_id": test_uuid
                }
                
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/suppliers",
                    headers=headers,
                    json=test_supplier_with_owner
                )
                
                if response.status_code == 201:
                    log("✅ Fornecedor criado com sucesso usando UUID gerado!")
                    
                    # Deletar o registro de teste
                    if 'id' in response.json():
                        delete_response = requests.delete(
                            f"{SUPABASE_URL}/rest/v1/suppliers?id=eq.{response.json()['id']}",
                            headers=headers
                        )
                        if delete_response.status_code == 204:
                            log("🗑️ Registro de teste removido")
                    
                    return True
                else:
                    log(f"❌ Falha mesmo com UUID: {response.status_code}")
                    log(f"Resposta: {response.text}")
                    return False
                    
        elif response.status_code == 201:
            log("✅ Fornecedor criado com sucesso!")
            
            # Deletar o registro de teste
            if 'id' in response.json():
                delete_response = requests.delete(
                    f"{SUPABASE_URL}/rest/v1/suppliers?id=eq.{response.json()['id']}",
                    headers=headers
                )
                if delete_response.status_code == 204:
                    log("🗑️ Registro de teste removido")
            
            return True
        else:
            log(f"❌ Status inesperado: {response.status_code}")
            log(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao criar fornecedor de teste: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🔧 Iniciando verificação para corrigir o frontend...")
    
    # Verificar tabelas disponíveis
    check_auth_users()
    check_profiles_table()
    
    # Tentar criar fornecedor de teste
    if create_test_supplier():
        log("✅ Teste de criação funcionou!")
    else:
        log("❌ Teste de criação falhou")
    
    log("✅ Verificação concluída!")
    log("💡 Para corrigir o frontend, você precisa:")
    log("   1. Atualizar o hook useSuppliers para usar 'owner_id' em vez de 'responsible_id'")
    log("   2. Remover referências a colunas que não existem (company_id, created_by)")
    log("   3. Ou atualizar a estrutura da tabela suppliers para ser compatível")

if __name__ == "__main__":
    main()
