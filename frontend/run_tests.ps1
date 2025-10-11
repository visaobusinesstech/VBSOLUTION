# Script PowerShell para executar os testes e correções
Write-Host "🚀 Iniciando correção e teste do sistema de leads..." -ForegroundColor Green

# Navegar para o diretório correto
Set-Location "Sistema/Atualizado/VBSOLUTIONCRM-master/frontend"

Write-Host "📁 Diretório atual: $(Get-Location)" -ForegroundColor Yellow

# 1. Executar correção da estrutura do banco
Write-Host "`n🔧 Executando correção da estrutura do banco..." -ForegroundColor Cyan
try {
    node fix_leads_database.js
    Write-Host "✅ Correção da estrutura concluída" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na correção da estrutura: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Executar teste de salvamento
Write-Host "`n🧪 Executando teste de salvamento..." -ForegroundColor Cyan
try {
    node test_leads_save.js
    Write-Host "✅ Teste de salvamento concluído" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no teste de salvamento: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Iniciar servidor de desenvolvimento
Write-Host "`n🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host "📝 Use Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host "🌐 O servidor estará disponível em: http://localhost:5173" -ForegroundColor Yellow

try {
    pnpm dev
} catch {
    Write-Host "❌ Erro ao iniciar servidor: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Tente executar manualmente: pnpm dev" -ForegroundColor Yellow
}

Write-Host "`n🎉 Processo concluído!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Abra o navegador em http://localhost:5173" -ForegroundColor White
Write-Host "2. Vá para a página de Leads/Vendas" -ForegroundColor White
Write-Host "3. Abra o console do navegador (F12)" -ForegroundColor White
Write-Host "4. Tente criar uma nova oportunidade" -ForegroundColor White
Write-Host "5. Verifique os logs no console" -ForegroundColor White

