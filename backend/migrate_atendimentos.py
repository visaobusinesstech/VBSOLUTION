#!/usr/bin/env python3
"""
Script para migrar dados de whatsapp_atendimentos para whatsapp_mensagens
e deletar a tabela whatsapp_atendimentos
"""

import requests
import json
import uuid
from datetime import datetime

# Configurações do Supabase
SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def get_atendimentos():
    """Buscar todos os atendimentos"""
    response = requests.get(f"{SUPABASE_URL}/rest/v1/whatsapp_atendimentos", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao buscar atendimentos: {response.status_code} - {response.text}")
        return []

def get_mensagens():
    """Buscar todas as mensagens"""
    response = requests.get(f"{SUPABASE_URL}/rest/v1/whatsapp_mensagens", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Erro ao buscar mensagens: {response.status_code} - {response.text}")
        return []

def update_mensagens_status(atendimentos, mensagens):
    """Atualizar status das mensagens baseado nos atendimentos"""
    atendimentos_dict = {atend['id']: atend for atend in atendimentos}
    
    for mensagem in mensagens:
        if mensagem.get('atendimento_id') in atendimentos_dict:
            atendimento = atendimentos_dict[mensagem['atendimento_id']]
            if atendimento.get('status'):
                # Atualizar mensagem com status do atendimento
                update_data = {
                    "status": atendimento['status']
                }
                
                response = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/whatsapp_mensagens?id=eq.{mensagem['id']}",
                    headers=headers,
                    json=update_data
                )
                
                if response.status_code == 200:
                    print(f"✅ Atualizada mensagem {mensagem['id']} com status {atendimento['status']}")
                else:
                    print(f"❌ Erro ao atualizar mensagem {mensagem['id']}: {response.status_code} - {response.text}")

def create_mensagens_for_atendimentos(atendimentos, mensagens):
    """Criar mensagens para atendimentos que não têm mensagens"""
    mensagens_atendimento_ids = {msg.get('atendimento_id') for msg in mensagens if msg.get('atendimento_id')}
    
    for atendimento in atendimentos:
        if atendimento['id'] not in mensagens_atendimento_ids:
            # Criar mensagem para este atendimento
            nova_mensagem = {
                "id": str(uuid.uuid4()),
                "owner_id": atendimento.get('owner_id', '00000000-0000-0000-0000-000000000000'),
                "atendimento_id": atendimento['id'],
                "chat_id": atendimento.get('chat_id'),
                "message_id": None,
                "conteudo": atendimento.get('ultima_mensagem', 'Mensagem de atendimento'),
                "tipo": "TEXTO",
                "status": atendimento.get('status'),
                "remetente": "ATENDENTE",
                "timestamp": atendimento.get('ultima_mensagem', atendimento.get('data_inicio')),
                "lida": False,
                "media_url": None,
                "media_mime": None,
                "duration_ms": None,
                "raw": None,
                "created_at": atendimento.get('created_at')
            }
            
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/whatsapp_mensagens",
                headers=headers,
                json=nova_mensagem
            )
            
            if response.status_code == 201:
                print(f"✅ Criada mensagem para atendimento {atendimento['id']}")
            else:
                print(f"❌ Erro ao criar mensagem para atendimento {atendimento['id']}: {response.status_code} - {response.text}")

def delete_atendimentos_table():
    """Deletar a tabela whatsapp_atendimentos"""
    # Primeiro, vamos tentar deletar os registros
    response = requests.delete(f"{SUPABASE_URL}/rest/v1/whatsapp_atendimentos", headers=headers)
    if response.status_code == 200:
        print("✅ Registros de whatsapp_atendimentos deletados")
    else:
        print(f"❌ Erro ao deletar registros: {response.status_code} - {response.text}")

def main():
    print("🚀 Iniciando migração de whatsapp_atendimentos para whatsapp_mensagens...")
    
    # 1. Buscar dados
    print("📋 Buscando atendimentos...")
    atendimentos = get_atendimentos()
    print(f"Encontrados {len(atendimentos)} atendimentos")
    
    print("📋 Buscando mensagens...")
    mensagens = get_mensagens()
    print(f"Encontradas {len(mensagens)} mensagens")
    
    # 2. Atualizar status das mensagens existentes
    print("🔄 Atualizando status das mensagens existentes...")
    update_mensagens_status(atendimentos, mensagens)
    
    # 3. Criar mensagens para atendimentos sem mensagens
    print("🔄 Criando mensagens para atendimentos sem mensagens...")
    create_mensagens_for_atendimentos(atendimentos, mensagens)
    
    # 4. Deletar tabela de atendimentos
    print("🗑️ Deletando tabela whatsapp_atendimentos...")
    delete_atendimentos_table()
    
    print("✅ Migração concluída!")

if __name__ == "__main__":
    main()
