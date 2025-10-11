#!/usr/bin/env python3
"""
Script para verificar a estrutura real da tabela suppliers
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

def check_table_structure():
    """Verificar a estrutura real da tabela suppliers"""
    try:
        log("🔍 Verificando estrutura real da tabela suppliers...")
        
        # Tentar inserir com apenas o nome para ver qual coluna é obrigatória
        test_data = {
            "name": "Teste Estrutura"
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/suppliers",
            headers=headers,
            json=test_data
        )
        
        if response.status_code == 400:
            error_data = response.json()
            log(f"❌ Erro 400: {error_data.get('message', 'Erro desconhecido')}")
            
            # Se for erro de coluna obrigatória, tentar descobrir quais são
            if "null value in column" in error_data.get('message', ''):
                log("🔍 Detectado erro de coluna obrigatória. Vamos descobrir a estrutura...")
                
                # Tentar diferentes combinações
                test_cases = [
                    {"name": "Teste 1", "owner_id": "00000000-0000-0000-0000-000000000000"},
                    {"name": "Teste 2", "user_id": "00000000-0000-0000-0000-000000000000"},
                    {"name": "Teste 3", "company_id": "00000000-0000-0000-0000-000000000000"},
                    {"name": "Teste 4", "created_by": "00000000-0000-0000-0000-000000000000"}
                ]
                
                for i, test_case in enumerate(test_cases, 1):
                    log(f"🧪 Teste {i}: {test_case}")
                    
                    response = requests.post(
                        f"{SUPABASE_URL}/rest/v1/suppliers",
                        headers=headers,
                        json=test_case
                    )
                    
                    if response.status_code == 201:
                        log(f"✅ Teste {i} passou! Estrutura descoberta.")
                        # Deletar o registro de teste
                        if 'id' in response.json():
                            delete_response = requests.delete(
                                f"{SUPABASE_URL}/rest/v1/suppliers?id=eq.{response.json()['id']}",
                                headers=headers
                            )
                            if delete_response.status_code == 204:
                                log(f"🗑️ Registro de teste {i} removido")
                        return True
                    else:
                        log(f"❌ Teste {i} falhou: {response.status_code}")
                        if response.status_code == 400:
                            error = response.json()
                            log(f"   Erro: {error.get('message', 'Erro desconhecido')}")
                
                log("❌ Não foi possível descobrir a estrutura correta")
                return False
                
        elif response.status_code == 201:
            log("✅ Inserção funcionou com apenas o nome!")
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
        log(f"❌ Erro ao verificar estrutura: {str(e)}", "ERROR")
        return False

def try_insert_with_owner_id():
    """Tentar inserir com owner_id"""
    try:
        log("🧪 Tentando inserir com owner_id...")
        
        # Primeiro, vamos ver se conseguimos obter um user_id válido
        # Tentar buscar da tabela user_profiles
        response = requests.get(f"{SUPABASE_URL}/rest/v1/user_profiles", headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            if users:
                user_id = users[0]['id']
                log(f"✅ Usuário encontrado: {user_id}")
                
                # Tentar inserir fornecedor com este user_id como owner_id
                test_supplier = {
                    "name": "Fornecedor Teste",
                    "owner_id": user_id
                }
                
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/suppliers",
                    headers=headers,
                    json=test_supplier
                )
                
                if response.status_code == 201:
                    log("✅ Fornecedor criado com sucesso usando owner_id!")
                    
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
                    log(f"❌ Falha ao criar fornecedor: {response.status_code}")
                    log(f"Resposta: {response.text}")
                    return False
            else:
                log("❌ Nenhum usuário encontrado na tabela user_profiles")
                return False
        else:
            log(f"❌ Erro ao buscar usuários: {response.status_code}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao tentar inserir com owner_id: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🔧 Iniciando verificação da estrutura real da tabela suppliers...")
    
    # Verificar estrutura
    if check_table_structure():
        log("✅ Estrutura verificada com sucesso!")
    else:
        log("⚠️ Estrutura não pôde ser verificada automaticamente")
        
        # Tentar inserir com owner_id
        if try_insert_with_owner_id():
            log("✅ Inserção com owner_id funcionou!")
        else:
            log("❌ Inserção com owner_id também falhou")
    
    log("✅ Verificação concluída!")

if __name__ == "__main__":
    main()
