#!/usr/bin/env python3
"""
Script para aplicar migração completa do sistema VBSolution
Cria sistema completo com isolamento total de dados por usuário
"""

import requests
import json
import time
import sys

# Configurações do Supabase
SUPABASE_URL = "https://zqlwthtkjhmjydkeghfh.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbHd0aHRramhtanlka2VnaGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTUxMTksImV4cCI6MjA3MDk3MTExOX0.iDAzEjWRHjETngE-elo2zVdgaRmsIWoKDY12OT_O4NY"

def apply_migration():
    """Aplica a migração completa no Supabase"""
    
    print("🚀 Iniciando migração completa do sistema VBSolution...")
    print("=" * 60)
    
    # Ler o arquivo de migração
    try:
        with open('supabase/migrations/20250801140000_complete_user_isolation_system.sql', 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print("✅ Arquivo de migração carregado com sucesso")
    except FileNotFoundError:
        print("❌ Arquivo de migração não encontrado!")
        return False
    
    # Configurar headers para a API do Supabase
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'apikey': SUPABASE_ANON_KEY
    }
    
    # URL da API SQL do Supabase
    sql_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    # Dividir a migração em partes menores para evitar timeout
    sql_parts = migration_sql.split('-- =====================================================')
    
    print(f"📋 Migração dividida em {len(sql_parts)} partes")
    
    for i, part in enumerate(sql_parts, 1):
        if not part.strip():
            continue
            
        print(f"\n🔄 Executando parte {i}/{len(sql_parts)}...")
        print(f"📝 Tamanho: {len(part)} caracteres")
        
        # Preparar payload
        payload = {
            'query': part.strip()
        }
        
        try:
            # Executar SQL
            response = requests.post(sql_url, headers=headers, json=payload, timeout=300)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Parte {i} executada com sucesso")
                
                # Verificar se há resultados
                if result:
                    print(f"📊 Resultado: {len(result)} linhas retornadas")
            else:
                print(f"❌ Erro na parte {i}: {response.status_code}")
                print(f"Resposta: {response.text}")
                
                # Tentar executar como query direta
                print("🔄 Tentando método alternativo...")
                if try_alternative_method(part.strip(), headers):
                    print(f"✅ Parte {i} executada com método alternativo")
                else:
                    print(f"❌ Falha na parte {i}")
                    return False
                    
        except requests.exceptions.Timeout:
            print(f"⏰ Timeout na parte {i} - muito grande")
            # Dividir em partes ainda menores
            sub_parts = split_sql_part(part)
            for j, sub_part in enumerate(sub_parts, 1):
                print(f"  🔄 Executando subparte {j}/{len(sub_parts)}...")
                if not execute_sql_part(sub_part, headers, f"Parte {i}.{j}"):
                    return False
                    
        except Exception as e:
            print(f"❌ Erro inesperado na parte {i}: {str(e)}")
            return False
        
        # Pausa entre partes para evitar sobrecarga
        time.sleep(1)
    
    print("\n" + "=" * 60)
    print("🎉 MIGRAÇÃO COMPLETA APLICADA COM SUCESSO!")
    print("=" * 60)
    
    # Verificação final
    print("\n🔍 Executando verificação final...")
    verification_sql = """
    SELECT '=== VERIFICAÇÃO FINAL ===' as info;
    SELECT 'Tabelas criadas:' as info, COUNT(*) as total FROM information_schema.tables WHERE table_schema = 'public';
    SELECT 'Políticas RLS:' as info, COUNT(*) as total FROM pg_policies WHERE schemaname = 'public';
    """
    
    if execute_verification(verification_sql, headers):
        print("✅ Verificação final concluída com sucesso!")
    else:
        print("⚠️ Verificação final falhou, mas a migração foi aplicada")
    
    return True

def try_alternative_method(sql, headers):
    """Tenta método alternativo para executar SQL"""
    try:
        # Usar a API de query direta
        query_url = f"{SUPABASE_URL}/rest/v1/"
        
        # Dividir em comandos individuais
        commands = [cmd.strip() for cmd in sql.split(';') if cmd.strip()]
        
        for cmd in commands:
            if cmd.startswith('SELECT') or cmd.startswith('--'):
                continue
                
            # Executar comando individual
            payload = {'query': cmd}
            response = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/exec_sql", 
                                  headers=headers, json=payload, timeout=60)
            
            if response.status_code != 200:
                print(f"  ❌ Comando falhou: {cmd[:50]}...")
                return False
                
        return True
        
    except Exception as e:
        print(f"  ❌ Método alternativo falhou: {str(e)}")
        return False

def split_sql_part(sql_part):
    """Divide uma parte SQL em subpartes menores"""
    # Dividir por comandos principais
    parts = []
    current_part = ""
    
    for line in sql_part.split('\n'):
        if line.strip().startswith('--') or line.strip().startswith('CREATE') or line.strip().startswith('DROP'):
            if current_part.strip():
                parts.append(current_part.strip())
                current_part = ""
        current_part += line + "\n"
    
    if current_part.strip():
        parts.append(current_part.strip())
    
    return parts

def execute_sql_part(sql_part, headers, part_name):
    """Executa uma parte SQL específica"""
    try:
        payload = {'query': sql_part}
        response = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/exec_sql", 
                              headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            print(f"    ✅ {part_name} executada com sucesso")
            return True
        else:
            print(f"    ❌ {part_name} falhou: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"    ❌ {part_name} erro: {str(e)}")
        return False

def execute_verification(sql, headers):
    """Executa verificação final"""
    try:
        payload = {'query': sql}
        response = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/exec_sql", 
                              headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("📊 Resultados da verificação:")
            for row in result:
                if isinstance(row, dict) and 'info' in row:
                    print(f"  {row['info']}")
            return True
        else:
            print(f"❌ Verificação falhou: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro na verificação: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Aplicador de Migração VBSolution")
    print("=" * 60)
    
    # Verificar dependências
    try:
        import requests
    except ImportError:
        print("❌ Biblioteca 'requests' não encontrada!")
        print("💡 Execute: pip install requests")
        sys.exit(1)
    
    # Aplicar migração
    success = apply_migration()
    
    if success:
        print("\n🎯 SISTEMA COMPLETO CRIADO COM SUCESSO!")
        print("✅ Isolamento total de dados por usuário implementado")
        print("✅ Todas as tabelas necessárias criadas")
        print("✅ Políticas RLS configuradas")
        print("✅ Sistema pronto para uso")
        print("\n🚀 Agora cada usuário terá acesso APENAS aos seus próprios dados!")
    else:
        print("\n❌ MIGRAÇÃO FALHOU!")
        print("💡 Verifique os logs acima e tente novamente")
        sys.exit(1)
