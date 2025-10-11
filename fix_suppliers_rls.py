#!/usr/bin/env python3
"""
Script para corrigir as políticas RLS da tabela suppliers
"""

import os
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

def apply_suppliers_fix():
    """Aplicar a correção das políticas RLS dos fornecedores"""
    try:
        log("🚀 Iniciando correção das políticas RLS dos fornecedores...")
        
        # Ler o arquivo de migração
        migration_file = "supabase/migrations/20250801160000_fix_suppliers_rls.sql"
        
        if not os.path.exists(migration_file):
            log(f"❌ Arquivo de migração não encontrado: {migration_file}", "ERROR")
            return False
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        log(f"📄 Arquivo de migração carregado: {len(migration_sql)} caracteres")
        
        # Dividir o SQL em comandos individuais
        commands = []
        current_command = ""
        
        for line in migration_sql.split('\n'):
            line = line.strip()
            if line and not line.startswith('--'):
                current_command += line + " "
                if line.endswith(';'):
                    commands.append(current_command.strip())
                    current_command = ""
        
        if current_command.strip():
            commands.append(current_command.strip())
        
        log(f"📋 Total de comandos SQL: {len(commands)}")
        
        # Executar cada comando
        successful_commands = 0
        failed_commands = 0
        
        for i, command in enumerate(commands, 1):
            if not command or command.startswith('--'):
                continue
                
            try:
                log(f"🔧 Executando comando {i}/{len(commands)}...")
                
                # Usar o endpoint SQL para executar comandos
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                    headers=headers,
                    json={'sql': command}
                )
                
                if response.status_code == 200:
                    log(f"✅ Comando {i} executado com sucesso")
                    successful_commands += 1
                else:
                    log(f"❌ Erro no comando {i}: Status {response.status_code}", "ERROR")
                    log(f"Resposta: {response.text}", "ERROR")
                    failed_commands += 1
                    
            except Exception as e:
                log(f"❌ Erro ao executar comando {i}: {str(e)}", "ERROR")
                failed_commands += 1
        
        log(f"📊 Resumo: {successful_commands} comandos executados com sucesso, {failed_commands} falharam")
        
        if failed_commands == 0:
            log("🎉 Correção aplicada com sucesso!")
            return True
        else:
            log("⚠️ Alguns comandos falharam. Verifique os logs acima.", "WARNING")
            return False
            
    except Exception as e:
        log(f"❌ Erro geral: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🔧 Iniciando correção das políticas RLS dos fornecedores...")
    
    # Testar conexão
    if not test_connection():
        log("❌ Não foi possível conectar ao Supabase. Abortando.", "ERROR")
        return
    
    # Aplicar correção
    if apply_suppliers_fix():
        log("✅ Correção aplicada com sucesso!")
    else:
        log("❌ Falha ao aplicar correção. Verifique os logs acima.", "ERROR")

if __name__ == "__main__":
    main()
