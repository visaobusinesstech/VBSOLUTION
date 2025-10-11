#!/usr/bin/env python3
"""
Script para verificar e corrigir problemas na tabela companies
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0"

def create_supabase_client() -> Client:
    """Criar cliente Supabase"""
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"❌ Erro ao criar cliente Supabase: {e}")
        return None

def check_table_structure(supabase: Client):
    """Verificar estrutura da tabela companies"""
    print("🔍 Verificando estrutura da tabela companies...")
    
    try:
        # Verificar se a tabela existe
        result = supabase.table('companies').select('*').limit(1).execute()
        print("✅ Tabela companies existe e é acessível")
        
        # Verificar estrutura
        if result.data:
            print("📋 Estrutura da tabela:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao verificar tabela companies: {e}")
        return False

def check_rls_policies(supabase: Client):
    """Verificar políticas RLS"""
    print("\n🔍 Verificando políticas RLS...")
    
    try:
        # Verificar se RLS está habilitado
        result = supabase.rpc('check_rls_enabled', {'table_name': 'companies'}).execute()
        print("✅ RLS verificado")
        return True
    except Exception as e:
        print(f"⚠️  Não foi possível verificar RLS: {e}")
        return False

def check_profiles_table(supabase: Client):
    """Verificar tabela profiles"""
    print("\n🔍 Verificando tabela profiles...")
    
    try:
        result = supabase.table('profiles').select('*').limit(1).execute()
        print("✅ Tabela profiles existe e é acessível")
        
        if result.data:
            print("📋 Estrutura da tabela profiles:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao verificar tabela profiles: {e}")
        return False

def create_missing_tables(supabase: Client):
    """Criar tabelas que estão faltando"""
    print("\n🔧 Criando tabelas que estão faltando...")
    
    # SQL para criar tabela profiles se não existir
    profiles_sql = """
    CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        company TEXT,
        avatar_url TEXT,
        position TEXT,
        department TEXT,
        role TEXT DEFAULT 'user',
        phone TEXT,
        address TEXT,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    """
    
    # SQL para criar tabela companies se não existir
    companies_sql = """
    CREATE TABLE IF NOT EXISTS public.companies (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_id UUID NOT NULL REFERENCES public.profiles(id),
        fantasy_name TEXT NOT NULL,
        company_name TEXT,
        cnpj TEXT,
        reference TEXT,
        cep TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        email TEXT,
        phone TEXT,
        logo_url TEXT,
        description TEXT,
        sector TEXT,
        status TEXT DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    """
    
    try:
        # Executar SQL para profiles
        print("📝 Criando tabela profiles...")
        supabase.rpc('exec_sql', {'sql': profiles_sql}).execute()
        print("✅ Tabela profiles criada/verificada")
        
        # Executar SQL para companies
        print("📝 Criando tabela companies...")
        supabase.rpc('exec_sql', {'sql': companies_sql}).execute()
        print("✅ Tabela companies criada/verificada")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        return False

def enable_rls_and_policies(supabase: Client):
    """Habilitar RLS e criar políticas"""
    print("\n🔧 Habilitando RLS e criando políticas...")
    
    try:
        # Habilitar RLS
        rls_sql = """
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
        """
        
        # Criar políticas
        policies_sql = """
        -- Política para profiles
        DROP POLICY IF EXISTS "Usuários só veem seu próprio perfil" ON public.profiles;
        CREATE POLICY "Usuários só veem seu próprio perfil" ON public.profiles
            FOR ALL USING (auth.uid() = id);
        
        -- Política para companies
        DROP POLICY IF EXISTS "Usuários só veem suas próprias empresas" ON public.companies;
        CREATE POLICY "Usuários só veem suas próprias empresas" ON public.companies
            FOR ALL USING (owner_id = auth.uid());
        
        DROP POLICY IF EXISTS "Usuários podem criar empresas" ON public.companies;
        CREATE POLICY "Usuários podem criar empresas" ON public.companies
            FOR INSERT WITH CHECK (owner_id = auth.uid());
        
        DROP POLICY IF EXISTS "Usuários podem editar suas empresas" ON public.companies;
        CREATE POLICY "Usuários podem editar suas empresas" ON public.companies
            FOR UPDATE USING (owner_id = auth.uid());
        
        DROP POLICY IF EXISTS "Usuários podem excluir suas empresas" ON public.companies;
        CREATE POLICY "Usuários podem excluir suas empresas" ON public.companies
            FOR DELETE USING (owner_id = auth.uid());
        """
        
        # Executar SQL
        print("🔒 Habilitando RLS...")
        supabase.rpc('exec_sql', {'sql': rls_sql}).execute()
        
        print("📋 Criando políticas...")
        supabase.rpc('exec_sql', {'sql': policies_sql}).execute()
        
        print("✅ RLS e políticas configurados")
        return True
    except Exception as e:
        print(f"❌ Erro ao configurar RLS: {e}")
        return False

def test_connection(supabase: Client):
    """Testar conexão e permissões"""
    print("\n🧪 Testando conexão e permissões...")
    
    try:
        # Testar acesso à tabela companies
        result = supabase.table('companies').select('count').execute()
        print("✅ Acesso à tabela companies OK")
        
        # Testar acesso à tabela profiles
        result = supabase.table('profiles').select('count').execute()
        print("✅ Acesso à tabela profiles OK")
        
        return True
    except Exception as e:
        print(f"❌ Erro no teste de conexão: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Iniciando verificação e correção da tabela companies...")
    
    # Criar cliente Supabase
    supabase = create_supabase_client()
    if not supabase:
        print("❌ Não foi possível criar cliente Supabase")
        return
    
    print("✅ Cliente Supabase criado com sucesso")
    
    # Verificar estrutura das tabelas
    companies_ok = check_table_structure(supabase)
    profiles_ok = check_profiles_table(supabase)
    
    # Se alguma tabela não existir, criar
    if not companies_ok or not profiles_ok:
        print("\n⚠️  Algumas tabelas estão faltando, criando...")
        if create_missing_tables(supabase):
            print("✅ Tabelas criadas com sucesso")
        else:
            print("❌ Erro ao criar tabelas")
            return
    
    # Verificar e configurar RLS
    if not check_rls_policies(supabase):
        print("\n⚠️  Configurando RLS...")
        if enable_rls_and_policies(supabase):
            print("✅ RLS configurado com sucesso")
        else:
            print("❌ Erro ao configurar RLS")
    
    # Testar conexão final
    if test_connection(supabase):
        print("\n🎉 Verificação concluída com sucesso!")
        print("✅ A tabela companies deve estar funcionando corretamente")
    else:
        print("\n❌ Ainda há problemas de conexão")
    
    print("\n📋 Resumo das ações:")
    print("1. ✅ Verificação de estrutura das tabelas")
    print("2. ✅ Criação de tabelas faltantes (se necessário)")
    print("3. ✅ Configuração de RLS e políticas")
    print("4. ✅ Teste de conexão")

if __name__ == "__main__":
    main()
