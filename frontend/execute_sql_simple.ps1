# Script PowerShell para executar SQL no Supabase
$uri = "https://nrbsocawokmihvxfcpso.supabase.co/rest/v1/rpc/exec_sql"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0"
}

Write-Host "Executando configuracao do Supabase..." -ForegroundColor Green

# Comando 1: Criar tabela pipeline_stages
Write-Host "1. Criando tabela pipeline_stages..." -ForegroundColor Yellow
$body1 = @{
    sql_query = "CREATE TABLE IF NOT EXISTS pipeline_stages (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, position INTEGER NOT NULL, color VARCHAR(7) DEFAULT '#3b82f6', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body1
    Write-Host "SUCESSO: Tabela pipeline_stages criada!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao criar tabela: $($_.Exception.Message)" -ForegroundColor Red
}

# Comando 2: Inserir etapas padrao
Write-Host "2. Inserindo etapas padrao..." -ForegroundColor Yellow
$body2 = @{
    sql_query = "INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES ('10000000-0000-0000-0000-000000000001', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Novo Lead', 1, '#ef4444', TRUE), ('10000000-0000-0000-0000-000000000002', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Contato Inicial', 2, '#f59e0b', TRUE), ('10000000-0000-0000-0000-000000000003', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Proposta', 3, '#3b82f6', TRUE), ('10000000-0000-0000-0000-000000000004', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Reuniao', 4, '#8b5cf6', TRUE), ('10000000-0000-0000-0000-000000000005', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Fechamento', 5, '#10b981', TRUE) ON CONFLICT (id) DO NOTHING;"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body2
    Write-Host "SUCESSO: Etapas padrao inseridas!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao inserir etapas: $($_.Exception.Message)" -ForegroundColor Red
}

# Comando 3: Adicionar colunas na tabela leads
Write-Host "3. Adicionando colunas na tabela leads..." -ForegroundColor Yellow
$body3 = @{
    sql_query = "ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body3
    Write-Host "SUCESSO: Colunas adicionadas na tabela leads!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao adicionar colunas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host "Verifique se tudo funcionou executando: node test_pipeline_system.js" -ForegroundColor Cyan

