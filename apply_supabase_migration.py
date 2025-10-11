#!/usr/bin/env python3
"""
Script para aplicar migrações do Supabase automaticamente
Resolve o erro: Could not find the 'actual_hours' column of 'activities' in the schema cache
"""

import os
import sys
import subprocess
import time

def print_step(message):
    """Imprime uma mensagem de passo formatada"""
    print(f"\n🔧 {message}")
    print("-" * 50)

def print_success(message):
    """Imprime uma mensagem de sucesso"""
    print(f"✅ {message}")

def print_error(message):
    """Imprime uma mensagem de erro"""
    print(f"❌ {message}")

def print_info(message):
    """Imprime uma mensagem informativa"""
    print(f"ℹ️  {message}")

def check_supabase_cli():
    """Verifica se o Supabase CLI está instalado"""
    try:
        result = subprocess.run(['supabase', '--version'], 
                              capture_output=True, text=True, check=True)
        print_success(f"Supabase CLI encontrado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("Supabase CLI não encontrado")
        print_info("Instale o Supabase CLI: https://supabase.com/docs/guides/cli")
        return False

def apply_migration_sql():
    """Aplica a migração SQL diretamente"""
    print_step("Aplicando migração SQL para corrigir a tabela activities")
    
    # SQL para corrigir a tabela activities
    sql_script = """
-- CORREÇÃO COMPLETA - TABELA ACTIVITIES
-- Este script resolve o erro: Could not find the 'actual_hours' column

-- 1. ADICIONAR COLUNAS FALTANTES
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS work_group VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS comments JSONB,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. VERIFICAR ESTRUTURA ATUAL
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- 3. VERIFICAR POLÍTICAS RLS
SELECT 
    policyname, 
    cmd, 
    permissive
FROM pg_policies 
WHERE tablename = 'activities';
"""
    
    # Salvar o script SQL
    sql_file = "CORREÇÃO_COMPLETA_ACTIVITIES.sql"
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(sql_script)
    
    print_success(f"Script SQL criado: {sql_file}")
    print_info("Execute este script no SQL Editor do Supabase:")
    print_info("https://supabase.com/dashboard/project/mgvpuvjgzjeqhrkpdrel/sql")
    
    return sql_file

def generate_prisma_commands():
    """Gera comandos para sincronizar o Prisma"""
    print_step("Comandos para sincronizar o Prisma com o Supabase")
    
    commands = [
        "cd backend",
        "npm install",
        "npx prisma generate",
        "npx prisma db push --accept-data-loss",
        "npx prisma generate"
    ]
    
    print_info("Execute os seguintes comandos no terminal:")
    for cmd in commands:
        print(f"  $ {cmd}")
    
    return commands

def create_quick_fix_guide():
    """Cria um guia de correção rápida"""
    print_step("Criando guia de correção rápida")
    
    guide = """# 🚀 CORREÇÃO RÁPIDA - ERRO actual_hours

## ❌ Problema
```
Could not find the 'actual_hours' column of 'activities' in the schema cache
```

## ✅ Solução

### 1. Aplicar Migração SQL (IMEDIATO)
1. Acesse: https://supabase.com/dashboard/project/mgvpuvjgzjeqhrkpdrel/sql
2. Execute o arquivo: `CORREÇÃO_COMPLETA_ACTIVITIES.sql`
3. Verifique se as colunas foram criadas

### 2. Sincronizar Prisma (BACKEND)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npx prisma generate
```

### 3. Verificar Frontend
- Recarregue a página
- Tente criar uma nova atividade
- O erro deve desaparecer

## 🔍 Verificação
Após executar o SQL, você deve ver:
- ✅ Coluna `actual_hours` criada
- ✅ Coluna `estimated_hours` criada
- ✅ Outras colunas necessárias criadas

## 📞 Se Ainda Houver Problemas
1. Verifique se o SQL foi executado completamente
2. Confirme que o usuário está autenticado
3. Verifique os logs do console do navegador
"""
    
    guide_file = "CORREÇÃO_RAPIDA_README.md"
    with open(guide_file, 'w', encoding='utf-8') as f:
        f.write(guide)
    
    print_success(f"Guia criado: {guide_file}")
    return guide_file

def main():
    """Função principal"""
    print("🚀 CORREÇÃO AUTOMÁTICA - ERRO actual_hours")
    print("=" * 60)
    
    # Verificar Supabase CLI
    if not check_supabase_cli():
        print_info("Continuando com correção manual...")
    
    # Aplicar migração SQL
    sql_file = apply_migration_sql()
    
    # Gerar comandos Prisma
    prisma_commands = generate_prisma_commands()
    
    # Criar guia de correção
    guide_file = create_quick_fix_guide()
    
    print_step("RESUMO DA CORREÇÃO")
    print_success("1. Script SQL criado: CORREÇÃO_COMPLETA_ACTIVITIES.sql")
    print_success("2. Guia de correção criado: CORREÇÃO_RAPIDA_README.md")
    print_success("3. Comandos Prisma fornecidos")
    
    print_info("\n🎯 PRÓXIMOS PASSOS:")
    print_info("1. Execute o SQL no Supabase Dashboard")
    print_info("2. Execute os comandos Prisma no backend")
    print_info("3. Teste o frontend")
    
    print_info("\n📚 Arquivos criados:")
    print_info(f"  - {sql_file}")
    print_info(f"  - {guide_file}")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Operação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print_error(f"Erro inesperado: {e}")
        sys.exit(1)
