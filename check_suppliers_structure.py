#!/usr/bin/env python3
"""
Script para verificar a estrutura da tabela suppliers
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

def check_suppliers_structure():
    """Verificar a estrutura da tabela suppliers"""
    try:
        log("🔍 Verificando estrutura da tabela suppliers...")
        
        # Tentar buscar dados da tabela (sem filtros)
        response = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            log(f"✅ Tabela acessível. Dados encontrados: {len(data)} registros")
            
            if data:
                log("📋 Estrutura do primeiro registro:")
                for key, value in data[0].items():
                    log(f"  - {key}: {type(value).__name__} = {value}")
            else:
                log("📋 Tabela vazia - verificando estrutura via SELECT vazio")
                
                # Tentar SELECT vazio para ver a estrutura
                response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/suppliers?select=*&limit=0", 
                    headers=headers
                )
                
                if response.status_code == 200:
                    log("✅ Estrutura verificada via SELECT vazio")
                else:
                    log(f"❌ Erro ao verificar estrutura: {response.status_code}")
                    
        elif response.status_code == 400:
            log("❌ Erro 400 - Problema com a estrutura da tabela")
            log(f"Resposta: {response.text}")
        else:
            log(f"❌ Status inesperado: {response.status_code}")
            log(f"Resposta: {response.text}")
            
    except Exception as e:
        log(f"❌ Erro ao verificar estrutura: {str(e)}", "ERROR")

def test_simple_insert():
    """Testar inserção simples"""
    try:
        log("🧪 Testando inserção simples...")
        
        # Dados mínimos para teste
        test_data = {
            "name": "Teste Simples"
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/suppliers",
            headers=headers,
            json=test_data
        )
        
        if response.status_code == 201:
            log("✅ Inserção simples funcionou!")
            return True
        else:
            log(f"❌ Inserção falhou: Status {response.status_code}")
            log(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        log(f"❌ Erro no teste de inserção: {str(e)}", "ERROR")
        return False

def check_required_columns():
    """Verificar colunas obrigatórias"""
    try:
        log("🔍 Verificando colunas obrigatórias...")
        
        # Tentar inserir com diferentes combinações de colunas
        test_cases = [
            {"name": "Teste 1", "status": "active"},
            {"name": "Teste 2", "company_id": "00000000-0000-0000-0000-000000000000"},
            {"name": "Teste 3", "created_by": "00000000-0000-0000-0000-000000000000"},
            {"name": "Teste 4", "responsible_id": "00000000-0000-0000-0000-000000000000"}
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            log(f"🧪 Teste {i}: {test_case}")
            
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/suppliers",
                headers=headers,
                json=test_case
            )
            
            if response.status_code == 201:
                log(f"✅ Teste {i} passou!")
            else:
                log(f"❌ Teste {i} falhou: {response.status_code}")
                log(f"Resposta: {response.text}")
                
    except Exception as e:
        log(f"❌ Erro ao testar colunas: {str(e)}", "ERROR")

def main():
    """Função principal"""
    log("🔧 Iniciando verificação da estrutura da tabela suppliers...")
    
    # Verificar estrutura
    check_suppliers_structure()
    
    # Testar inserção simples
    test_simple_insert()
    
    # Verificar colunas obrigatórias
    check_required_columns()
    
    log("✅ Verificação concluída!")

if __name__ == "__main__":
    main()
