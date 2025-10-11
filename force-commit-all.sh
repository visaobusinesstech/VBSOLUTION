#!/bin/bash

# Script para forçar o commit de TODOS os arquivos da raiz
# Sem exceções - inclui TUDO

echo "🚀 Forçando commit de TODOS os arquivos da raiz..."

# 1. Fazer backup do .gitignore
echo "📝 Fazendo backup do .gitignore..."
cp .gitignore .gitignore.backup

# 2. Criar .gitignore completamente vazio
echo "🗑️ Removendo TODAS as restrições..."
echo "# Forçando inclusão de todos os arquivos" > .gitignore

# 3. Remover todos os arquivos do índice Git
echo "🔄 Limpando índice Git..."
git rm -r --cached . 2>/dev/null || true

# 4. Adicionar TODOS os arquivos novamente (forçado)
echo "➕ Adicionando TODOS os arquivos da raiz..."
git add -A -f

# 5. Verificar arquivos específicos da raiz
echo "📊 Verificando arquivos da raiz:"
echo "Arquivos .md: $(find . -maxdepth 1 -name '*.md' | wc -l)"
echo "Arquivos .sql: $(find . -maxdepth 1 -name '*.sql' | wc -l)"
echo "Arquivos .py: $(find . -maxdepth 1 -name '*.py' | wc -l)"
echo "Arquivos .js: $(find . -maxdepth 1 -name '*.js' | wc -l)"
echo "Arquivos .html: $(find . -maxdepth 1 -name '*.html' | wc -l)"
echo "Arquivos .json: $(find . -maxdepth 1 -name '*.json' | wc -l)"
echo "Arquivos .yaml: $(find . -maxdepth 1 -name '*.yaml' | wc -l)"

# 6. Verificar status
echo "📊 Status dos arquivos no staging:"
git status --porcelain | wc -l | xargs echo "Total de arquivos:"

# 7. Fazer commit
echo "💾 Fazendo commit forçado..."
git commit -m "🔥 FORCE COMMIT - ALL ROOT FILES INCLUDED

✅ This commit FORCES inclusion of EVERY SINGLE FILE:
- All .md documentation files
- All .sql database scripts  
- All .py Python scripts
- All .js JavaScript files
- All .html HTML files
- All .json configuration files
- All .yaml configuration files
- All other root files

🎯 NO EXCEPTIONS - Complete root directory state"

# 8. Restaurar .gitignore
echo "🔄 Restaurando .gitignore original..."
mv .gitignore.backup .gitignore

# 9. Push para o repositório
echo "📤 Enviando para o GitHub..."
git push origin main

echo "✅ Commit forçado realizado com sucesso!"
echo "📊 TODOS os arquivos da raiz foram enviados"

