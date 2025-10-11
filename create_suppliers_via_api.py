#!/usr/bin/env python3
"""
Script para criar a tabela suppliers via API REST do Supabase
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

def test_connection():
    """Testar conexão com o Supabase"""
    try:
        log("🔗 Testando conexão com o Supabase...")
        
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
        
        if response.status_code == 200:
            log("✅ Conexão estabelecida com sucesso!")
            return True
        else:
            log(f"❌ Erro na conexão: Status {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao conectar: {str(e)}", "ERROR")
        return False

def check_table_exists():
    """Verificar se a tabela suppliers já existe"""
    try:
        log("🔍 Verificando se a tabela suppliers existe...")
        
        # Tentar acessar a tabela suppliers
        response = requests.get(f"{SUPABASE_URL}/rest/v1/suppliers", headers=headers)
        
        if response.status_code == 200:
            log("✅ Tabela suppliers já existe!")
            return True
        elif response.status_code == 404:
            log("❌ Tabela suppliers não existe")
            return False
        else:
            log(f"⚠️ Status inesperado: {response.status_code}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao verificar tabela: {str(e)}", "ERROR")
        return False

def create_suppliers_table():
    """Criar a tabela suppliers via inserção de dados"""
    try:
        log("🚀 Tentando criar tabela suppliers via inserção...")
        
        # Dados de teste para criar a tabela
        test_supplier = {
            "name": "Fornecedor Teste",
            "fantasy_name": "FT Ltda",
            "email": "teste@fornecedor.com",
            "phone": "(11) 99999-9999",
            "status": "active",
            "notes": "Fornecedor criado automaticamente para testar o sistema"
        }
        
        # Tentar inserir (isso pode criar a tabela automaticamente)
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/suppliers",
            headers=headers,
            json=test_supplier
        )
        
        if response.status_code == 201:
            log("✅ Fornecedor de teste criado com sucesso!")
            return True
        elif response.status_code == 400:
            log("⚠️ Erro 400 - Pode ser problema de estrutura da tabela")
            log(f"Resposta: {response.text}")
            return False
        else:
            log(f"❌ Erro inesperado: Status {response.status_code}")
            log(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        log(f"❌ Erro ao criar fornecedor: {str(e)}", "ERROR")
        return False

def insert_sample_suppliers():
    """Inserir fornecedores de exemplo"""
    try:
        log("📝 Inserindo fornecedores de exemplo...")
        
        sample_suppliers = [
            {
                "name": "Fornecedor A",
                "fantasy_name": "FA Ltda",
                "email": "contato@fornecedora.com",
                "phone": "(11) 88888-8888",
                "status": "active",
                "notes": "Fornecedor de materiais de escritório"
            },
            {
                "name": "Fornecedor B",
                "fantasy_name": "FB Comércio",
                "email": "vendas@fornecedorb.com",
                "phone": "(11) 77777-7777",
                "status": "active",
                "notes": "Fornecedor de equipamentos de TI"
            }
        ]
        
        successful_inserts = 0
        
        for supplier in sample_suppliers:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/suppliers",
                headers=headers,
                json=supplier
            )
            
            if response.status_code == 201:
                log(f"✅ Fornecedor '{supplier['name']}' criado com sucesso!")
                successful_inserts += 1
            else:
                log(f"❌ Erro ao criar fornecedor '{supplier['name']}': {response.status_code}")
        
        log(f"📊 {successful_inserts}/{len(sample_suppliers)} fornecedores criados com sucesso")
        return successful_inserts > 0
        
    except Exception as e:
        log(f"❌ Erro ao inserir fornecedores: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🔧 Iniciando criação da tabela suppliers...")
    
    # Testar conexão
    if not test_connection():
        log("❌ Não foi possível conectar ao Supabase. Abortando.", "ERROR")
        return
    
    # Verificar se a tabela já existe
    if check_table_exists():
        log("✅ Tabela suppliers já existe. Inserindo dados de exemplo...")
        if insert_sample_suppliers():
            log("🎉 Sistema de fornecedores configurado com sucesso!")
        else:
            log("⚠️ Problemas ao inserir dados de exemplo")
        return
    
    # Tentar criar a tabela via inserção
    if create_suppliers_table():
        log("✅ Tabela suppliers criada com sucesso!")
        
        # Inserir dados de exemplo
        if insert_sample_suppliers():
            log("🎉 Sistema de fornecedores configurado com sucesso!")
        else:
            log("⚠️ Problemas ao inserir dados de exemplo")
    else:
        log("❌ Não foi possível criar a tabela suppliers automaticamente")
        log("💡 Você pode precisar executar o SQL manualmente no Supabase")

if __name__ == "__main__":
    main()
