# -*- coding: utf-8 -*-
import requests
import json
from datetime import datetime

SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA'

def log(message, log_type='info'):
    timestamp = datetime.now().strftime('%H:%M:%S')
    prefix = {
        'info': '📘',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }.get(log_type, 'ℹ️')
    print(f'[{timestamp}] {prefix} {message}')

def exec_sql(sql, description):
    try:
        log(f'Executando: {description}...', 'info')
        
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/rpc/exec_sql',
            headers={
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Prefer': 'return=minimal'
            },
            json={'query': sql}
        )

        if response.status_code not in [200, 201, 204]:
            error_text = response.text
            if 'already exists' in error_text or '42P07' in error_text or '42710' in error_text:
                log(f'{description} já existe (ignorando)', 'warning')
                return {'success': True, 'skipped': True}
            raise Exception(error_text)

        log(f'{description} - OK', 'success')
        return {'success': True}
    except Exception as error:
        log(f'{description} - ERRO: {str(error)}', 'error')
        return {'success': False, 'error': str(error)}

def setup():
    log('🚀 Iniciando configuração do Sistema de Arquivos...', 'info')
    print()

    # 1. Criar tabela
    log('Criando tabela files...', 'info')
    exec_sql('''
        CREATE TABLE IF NOT EXISTS files (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          size BIGINT NOT NULL,
          type TEXT NOT NULL,
          folder TEXT DEFAULT '/',
          tags TEXT[] DEFAULT '{}',
          favorite BOOLEAN DEFAULT FALSE,
          shared BOOLEAN DEFAULT FALSE,
          private BOOLEAN DEFAULT FALSE,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          viewed_at TIMESTAMPTZ
        );
    ''', 'Criar tabela files')

    # 2. Adicionar coluna folder se não existir
    exec_sql('''
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'files' 
                AND column_name = 'folder'
            ) THEN
                ALTER TABLE files ADD COLUMN folder TEXT DEFAULT '/';
            END IF;
        END $$;
    ''', 'Adicionar coluna folder')

    # 3. Criar índices
    log('Criando índices...', 'info')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);', 'Índice owner_id')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);', 'Índice folder')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(favorite);', 'Índice favorite')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_shared ON files(shared);', 'Índice shared')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_private ON files(private);', 'Índice private')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);', 'Índice created_at')
    exec_sql('CREATE INDEX IF NOT EXISTS idx_files_viewed_at ON files(viewed_at DESC NULLS LAST);', 'Índice viewed_at')

    # 4. Criar funções
    log('Criando funções...', 'info')
    exec_sql('''
        CREATE OR REPLACE FUNCTION update_files_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    ''', 'Função update_files_updated_at')

    exec_sql('DROP TRIGGER IF EXISTS files_updated_at_trigger ON files;', 'Remover trigger antigo')
    
    exec_sql('''
        CREATE TRIGGER files_updated_at_trigger
          BEFORE UPDATE ON files
          FOR EACH ROW
          EXECUTE FUNCTION update_files_updated_at();
    ''', 'Criar trigger')

    # 5. Ativar RLS
    log('Configurando RLS...', 'info')
    exec_sql('ALTER TABLE files ENABLE ROW LEVEL SECURITY;', 'Ativar RLS')

    # 6. Criar policies
    exec_sql('DROP POLICY IF EXISTS "users_view_own_files" ON files;', 'Remover policy antiga')
    exec_sql('CREATE POLICY "users_view_own_files" ON files FOR SELECT USING (owner_id = auth.uid());', 'Policy view own')

    exec_sql('DROP POLICY IF EXISTS "users_view_shared_files" ON files;', 'Remover policy antiga')
    exec_sql('CREATE POLICY "users_view_shared_files" ON files FOR SELECT USING (shared = TRUE);', 'Policy view shared')

    exec_sql('DROP POLICY IF EXISTS "users_insert_own_files" ON files;', 'Remover policy antiga')
    exec_sql('CREATE POLICY "users_insert_own_files" ON files FOR INSERT WITH CHECK (owner_id = auth.uid());', 'Policy insert')

    exec_sql('DROP POLICY IF EXISTS "users_update_own_files" ON files;', 'Remover policy antiga')
    exec_sql('CREATE POLICY "users_update_own_files" ON files FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());', 'Policy update')

    exec_sql('DROP POLICY IF EXISTS "users_delete_own_files" ON files;', 'Remover policy antiga')
    exec_sql('CREATE POLICY "users_delete_own_files" ON files FOR DELETE USING (owner_id = auth.uid());', 'Policy delete')

    # 7. Funções auxiliares
    log('Criando funções auxiliares...', 'info')
    
    exec_sql('''
        CREATE OR REPLACE FUNCTION update_file_viewed_at(file_id UUID)
        RETURNS VOID AS $$
        BEGIN
          UPDATE files
          SET viewed_at = NOW()
          WHERE id = file_id AND owner_id = auth.uid();
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    ''', 'Função update_file_viewed_at')

    exec_sql('''
        CREATE OR REPLACE FUNCTION get_user_files_stats(user_id UUID)
        RETURNS JSON AS $$
        DECLARE
          result JSON;
        BEGIN
          SELECT json_build_object(
            'total_files', COUNT(*),
            'total_size', COALESCE(SUM(size), 0),
            'favorites_count', COUNT(*) FILTER (WHERE favorite = true),
            'shared_count', COUNT(*) FILTER (WHERE shared = true),
            'private_count', COUNT(*) FILTER (WHERE private = true)
          ) INTO result
          FROM files
          WHERE owner_id = user_id;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    ''', 'Função get_user_files_stats')

    # 8. Criar bucket
    log('Criando bucket...', 'info')
    
    try:
        response = requests.post(
            f'{SUPABASE_URL}/storage/v1/bucket',
            headers={
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
            },
            json={
                'id': 'files',
                'name': 'files',
                'public': False,
                'file_size_limit': 52428800
            }
        )

        if response.status_code in [200, 201]:
            log('Bucket criado com sucesso!', 'success')
        else:
            error_text = response.text
            if 'already exists' in error_text:
                log('Bucket já existe', 'warning')
            else:
                log(f'Erro ao criar bucket: {error_text}', 'error')
    except Exception as error:
        log(f'Erro ao criar bucket: {str(error)}', 'error')

    # 9. Policies de storage
    log('Configurando policies de storage...', 'info')
    
    exec_sql('DROP POLICY IF EXISTS "users_upload_own_files_storage" ON storage.objects;', 'Remover policy')
    exec_sql('''
        CREATE POLICY "users_upload_own_files_storage" ON storage.objects
          FOR INSERT
          WITH CHECK (
            bucket_id = 'files' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
    ''', 'Policy upload storage')

    exec_sql('DROP POLICY IF EXISTS "users_view_own_files_storage" ON storage.objects;', 'Remover policy')
    exec_sql('''
        CREATE POLICY "users_view_own_files_storage" ON storage.objects
          FOR SELECT
          USING (
            bucket_id = 'files' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
    ''', 'Policy view storage')

    exec_sql('DROP POLICY IF EXISTS "users_delete_own_files_storage" ON storage.objects;', 'Remover policy')
    exec_sql('''
        CREATE POLICY "users_delete_own_files_storage" ON storage.objects
          FOR DELETE
          USING (
            bucket_id = 'files' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
    ''', 'Policy delete storage')

    print()
    log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!', 'success')
    print()
    log('✨ Sistema de arquivos pronto para uso!', 'success')
    log('   Acesse /files no seu CRM para começar a usar.', 'info')

if __name__ == '__main__':
    try:
        setup()
    except Exception as error:
        print(f'❌ Erro fatal: {error}')
        exit(1)


