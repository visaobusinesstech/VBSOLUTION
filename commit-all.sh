#!/bin/bash

# Script para fazer commit de TODOS os arquivos do projeto
# Sem exceções - força o envio de tudo

echo "🚀 Iniciando commit completo de todos os arquivos..."

# 1. Remover temporariamente o .gitignore para incluir TUDO
echo "📝 Fazendo backup do .gitignore..."
cp .gitignore .gitignore.backup

# 2. Criar um .gitignore vazio temporariamente
echo "🗑️ Removendo todas as restrições do .gitignore..."
echo "# Temporariamente vazio para incluir todos os arquivos" > .gitignore

# 3. Adicionar TODOS os arquivos (forçado)
echo "➕ Adicionando TODOS os arquivos ao staging..."
git add -A -f

# 4. Verificar o status
echo "📊 Status dos arquivos:"
git status --porcelain | wc -l | xargs echo "Arquivos no staging:"

# 5. Fazer commit
echo "💾 Fazendo commit..."
git commit -m "🚀 Complete project update - ALL FILES INCLUDED

✅ This commit includes EVERY SINGLE FILE:
- All source code files
- All documentation files  
- All configuration files
- All dependencies (node_modules)
- All database scripts
- All test files
- All assets and resources

🎯 NO FILES EXCLUDED - Complete project state"

# 6. Restaurar o .gitignore original
echo "🔄 Restaurando .gitignore original..."
mv .gitignore.backup .gitignore

# 7. Push para o repositório
echo "📤 Enviando para o GitHub..."
git push origin main

echo "✅ Commit completo realizado com sucesso!"
echo "📊 Todos os arquivos foram enviados para o repositório"

