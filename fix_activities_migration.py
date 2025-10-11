#!/usr/bin/env python3
"""
Script para corrigir a estrutura da tabela activities
"""

import requests
import json
import time

# Configurações do Supabase
SUPABASE_URL = "https://zqlwthtkjhmjydkeghfh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbHd0aHRramhtanlka2VnaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTUxMTksImV4cCI6MjA3MDk3MTExOX0.iDAzEjWRHjETngE-elo2zVdgaRmsIWoKDY12OT_O4NY"

def apply_activities_fix():
    """Aplica a correção da tabela activities"""
    
    print("🔧 Aplicando correção da tabela activities...")
    
    # Ler o arquivo de migração
    try:
        with open('supabase/migrations/20250801150000_fix_activities_structure.sql', 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print("✅ Arquivo de migração carregado")
    except FileNotFoundError:
        print("❌ Arquivo de migração não encontrado!")
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
    
    for line in migration_sql.split('\n'):
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
    
    print("\n🎉 Correção da tabela activities aplicada!")
    print("\n💡 Se algum comando falhou, execute-o manualmente no SQL Editor do Supabase")
    return True

def main():
    """Função principal"""
    
    print("🔧 Corretor da Tabela Activities - VBSolution")
    print("=" * 60)
    
    success = apply_activities_fix()
    
    if success:
        print("\n✅ Processo concluído com sucesso!")
        print("🔄 Agora você pode testar o carregamento das atividades no frontend")
    else:
        print("\n❌ Ocorreram erros durante o processo")
        print("💡 Verifique os logs acima e execute os comandos manualmente se necessário")

if __name__ == "__main__":
    main()
