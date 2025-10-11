#!/usr/bin/env python3
"""
Script para corrigir RLS das tabelas WhatsApp
"""

import os
import sys
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

def execute_sql(sql_query):
    """Executa uma query SQL no Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
        
        payload = {
            "query": sql_query
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            log(f"✅ SQL executado com sucesso")
            return True
        else:
            log(f"❌ Erro ao executar SQL: {response.status_code} - {response.text}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Erro na requisição: {str(e)}", "ERROR")
        return False

def main():
    """Função principal"""
    log("🚀 Iniciando correção do RLS do WhatsApp...")
    
    # SQL para corrigir RLS
    sql_queries = [
        # Enable RLS
        "ALTER TABLE public.whatsapp_atendimentos ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;",
        
        # Drop existing policies
        "DROP POLICY IF EXISTS \"Usuários podem ver e editar atendimentos de suas empresas\" ON public.whatsapp_atendimentos;",
        "DROP POLICY IF EXISTS \"Usuários podem ver e editar mensagens de suas empresas\" ON public.whatsapp_mensagens;",
        
        # Create new policies
        "CREATE POLICY \"whatsapp_atendimentos_policy\" ON public.whatsapp_atendimentos FOR ALL USING (auth.uid() = owner_id);",
        "CREATE POLICY \"whatsapp_mensagens_policy\" ON public.whatsapp_mensagens FOR ALL USING (auth.uid() = owner_id);",
        
        # Grant permissions
        "GRANT ALL ON public.whatsapp_atendimentos TO authenticated;",
        "GRANT ALL ON public.whatsapp_mensagens TO authenticated;"
    ]
    
    success_count = 0
    for i, sql in enumerate(sql_queries, 1):
        log(f"Executando query {i}/{len(sql_queries)}: {sql[:50]}...")
        if execute_sql(sql):
            success_count += 1
    
    if success_count == len(sql_queries):
        log("✅ Todas as correções do RLS foram aplicadas com sucesso!")
    else:
        log(f"⚠️ {success_count}/{len(sql_queries)} correções foram aplicadas", "WARNING")

if __name__ == "__main__":
    main()
