#!/usr/bin/env python3
"""
Script para verificar e corrigir a estrutura da tabela activities
"""

import requests
import json
import time

# Configurações do Supabase
SUPABASE_URL = "https://zqlwthtkjhmjydkeghfh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbHd0aHRramhtanlka2VnaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTUxMTksImV4cCI6MjA3MDk3MTExOX0.iDAzEjWRHjETngE-elo2zVdgaRmsIWoKDY12OT_O4NY"

def check_table_structure():
    """Verifica a estrutura atual da tabela activities"""
    
    print("🔍 Verificando estrutura atual da tabela activities...")
    
    # Configurar headers
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'apikey': SUPABASE_ANON_KEY
    }
    
    try:
        # Tentar buscar informações da tabela
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/activities?select=*&limit=1",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Tabela activities existe e está acessível")
            
            # Verificar se conseguimos inserir dados
            test_data = {
                "title": "Teste de Estrutura",
                "description": "Teste para verificar colunas",
                "type": "task",
                "priority": "medium",
                "status": "pending",
                "created_by": "00000000-0000-0000-0000-000000000000"  # UUID fake para teste
            }
            
            print("🧪 Testando inserção de dados...")
            insert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/activities",
                headers=headers,
                json=test_data,
                timeout=30
            )
            
            if insert_response.status_code == 201:
                print("✅ Inserção funcionou - estrutura básica OK")
                
                # Tentar buscar o registro inserido
                test_id = insert_response.json()[0]['id']
                print(f"📝 ID do teste: {test_id}")
                
                # Limpar o registro de teste
                delete_response = requests.delete(
                    f"{SUPABASE_URL}/rest/v1/activities?id=eq.{test_id}",
                    headers=headers,
                    timeout=30
                )
                
                if delete_response.status_code == 204:
                    print("✅ Registro de teste removido com sucesso")
                else:
                    print(f"⚠️ Não foi possível remover registro de teste: {delete_response.status_code}")
                    
            else:
                print(f"❌ Erro na inserção: {insert_response.status_code}")
                print(f"Resposta: {insert_response.text[:200]}")
                
        else:
            print(f"❌ Erro ao acessar tabela: {response.status_code}")
            print(f"Resposta: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Erro ao verificar tabela: {str(e)}")

def apply_fix():
    """Aplica a correção das colunas faltantes"""
    
    print("\n🔧 Aplicando correção das colunas faltantes...")
    
    # Ler o arquivo de correção
    try:
        with open('add_missing_columns.sql', 'r', encoding='utf-8') as f:
            fix_sql = f.read()
        print("✅ Arquivo de correção carregado")
    except FileNotFoundError:
        print("❌ Arquivo add_missing_columns.sql não encontrado!")
        return False
    
    # Configurar headers
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'apikey': SUPABASE_ANON_KEY
    }
    
    # Dividir em comandos SQL individuais
    commands = []
    current_command = ""
    
    for line in fix_sql.split('\n'):
        line = line.strip()
        if line.startswith('--') or not line:
            continue
        
        current_command += line + " "
        
        if line.endswith(';'):
            commands.append(current_command.strip())
            current_command = ""
    
    if current_command.strip():
        commands.append(current_command.strip())
    
    print(f"📋 Executando {len(commands)} comandos SQL...")
    
    for i, cmd in enumerate(commands, 1):
        if not cmd:
            continue
            
        print(f"\n🔄 Comando {i}/{len(commands)}: {cmd[:80]}...")
        
        try:
            # Tentar executar via API REST
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                headers=headers,
                json={'query': cmd},
                timeout=60
            )
            
            if response.status_code == 200:
                print(f"    ✅ Executado com sucesso")
            else:
                print(f"    ⚠️ Status {response.status_code}")
                if response.status_code == 404:
                    print(f"    💡 Execute este comando no SQL Editor do Supabase:")
                    print(f"    {cmd}")
                else:
                    print(f"    ❌ Erro: {response.text[:100]}")
                    
        except Exception as e:
            print(f"    ❌ Erro: {str(e)}")
            print(f"    💡 Execute este comando no SQL Editor do Supabase:")
            print(f"    {cmd}")
        
        # Pausa entre comandos
        time.sleep(0.5)
    
    print("\n🎉 Correção aplicada!")
    print("\n💡 Se algum comando falhou, execute-o manualmente no SQL Editor do Supabase")
    return True

def main():
    """Função principal"""
    
    print("🔧 Verificador e Corretor da Tabela Activities - VBSolution")
    print("=" * 70)
    
    # 1. Verificar estrutura atual
    check_table_structure()
    
    # 2. Perguntar se quer aplicar a correção
    print("\n" + "="*50)
    print("💡 Para corrigir as colunas faltantes, você tem duas opções:")
    print("1. Execute o arquivo 'add_missing_columns.sql' no SQL Editor do Supabase")
    print("2. Ou execute este script novamente para tentar correção automática")
    
    choice = input("\n❓ Deseja tentar a correção automática agora? (s/n): ").lower().strip()
    
    if choice in ['s', 'sim', 'y', 'yes']:
        success = apply_fix()
        if success:
            print("\n✅ Processo concluído!")
            print("🔄 Agora teste novamente a criação de atividades no frontend")
        else:
            print("\n❌ Ocorreram erros durante o processo")
    else:
        print("\n💡 Execute manualmente o arquivo 'add_missing_columns.sql' no SQL Editor do Supabase")
        print("🔗 Link: https://supabase.com/dashboard/project/zqlwthtkjhmjydkeghfh/sql")

if __name__ == "__main__":
    main()
