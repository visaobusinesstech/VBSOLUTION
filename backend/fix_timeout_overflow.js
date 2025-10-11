#!/usr/bin/env node

/**
 * Script para identificar e corrigir o TimeoutOverflowWarning
 * O problema ocorre quando valores em segundos são multiplicados por 1000 incorretamente
 * resultando em valores que excedem o limite de 32-bit signed integer (2^31 - 1 = 2147483647)
 */

const fs = require('fs');
const path = require('path');

// Valor máximo seguro para setTimeout/setInterval
const MAX_SAFE_TIMEOUT = 2147483647; // 2^31 - 1

// Padrões que podem estar causando o problema
const PROBLEMATIC_PATTERNS = [
    // Padrões de multiplicação que podem gerar valores muito grandes
    {
        pattern: /(\w+)\s*\*\s*3600\s*\*\s*1000/g,
        description: 'Multiplicação de 3600 * 1000 (pode gerar 3600000000)',
        fix: (match, variable) => `Math.min(${variable} * 1000, ${MAX_SAFE_TIMEOUT})`
    },
    {
        pattern: /(\w+)\s*\*\s*1000\s*\*\s*3600/g,
        description: 'Multiplicação de 1000 * 3600 (pode gerar 3600000000)',
        fix: (match, variable) => `Math.min(${variable} * 1000, ${MAX_SAFE_TIMEOUT})`
    },
    {
        pattern: /3600\s*\*\s*1000/g,
        description: 'Valor literal 3600 * 1000 (gera 3600000000)',
        fix: () => `${MAX_SAFE_TIMEOUT}`
    },
    {
        pattern: /(\w+)\s*\*\s*1000\s*.*setTimeout|setInterval/g,
        description: 'Multiplicação por 1000 antes de setTimeout/setInterval',
        fix: (match, variable) => `Math.min(${variable} * 1000, ${MAX_SAFE_TIMEOUT})`
    }
];

// Padrões de configurações que podem estar sendo convertidas incorretamente
const CONFIG_PATTERNS = [
    {
        pattern: /debounceTimeMs\s*[:=]\s*(\d+)/g,
        description: 'Configuração debounceTimeMs com valor suspeito',
        check: (value) => value > MAX_SAFE_TIMEOUT || value < 0,
        fix: (value) => Math.min(Math.max(value, 1000), 120000) // 1s a 2min
    },
    {
        pattern: /chunkDelayMs\s*[:=]\s*(\d+)/g,
        description: 'Configuração chunkDelayMs com valor suspeito',
        check: (value) => value > MAX_SAFE_TIMEOUT || value < 0,
        fix: (value) => Math.min(Math.max(value, 100), 10000) // 100ms a 10s
    },
    {
        pattern: /delay\s*[:=]\s*(\d+)/g,
        description: 'Configuração delay com valor suspeito',
        check: (value) => value > MAX_SAFE_TIMEOUT || value < 0,
        fix: (value) => Math.min(Math.max(value, 100), 10000) // 100ms a 10s
    }
];

function scanDirectory(dir, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
    const files = [];
    
    function scanRecursive(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Pular node_modules, .git, etc.
                if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
                    scanRecursive(fullPath);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(item);
                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }
    
    scanRecursive(dir);
    return files;
}

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Verificar padrões problemáticos
    for (const pattern of PROBLEMATIC_PATTERNS) {
        const matches = [...content.matchAll(pattern.pattern)];
        for (const match of matches) {
            issues.push({
                type: 'problematic_pattern',
                line: content.substring(0, match.index).split('\n').length,
                match: match[0],
                description: pattern.description,
                fix: pattern.fix(match[0], match[1])
            });
        }
    }
    
    // Verificar configurações suspeitas
    for (const pattern of CONFIG_PATTERNS) {
        const matches = [...content.matchAll(pattern.pattern)];
        for (const match of matches) {
            const value = parseInt(match[1]);
            if (pattern.check(value)) {
                issues.push({
                    type: 'config_issue',
                    line: content.substring(0, match.index).split('\n').length,
                    match: match[0],
                    description: pattern.description,
                    originalValue: value,
                    suggestedValue: pattern.fix(value)
                });
            }
        }
    }
    
    // Verificar valores literais problemáticos
    const literalPattern = /(\d{10,})/g; // Números com 10+ dígitos
    const literalMatches = [...content.matchAll(literalPattern)];
    for (const match of literalMatches) {
        const value = parseInt(match[1]);
        if (value > MAX_SAFE_TIMEOUT) {
            issues.push({
                type: 'literal_overflow',
                line: content.substring(0, match.index).split('\n').length,
                match: match[1],
                description: `Valor literal ${match[1]} excede o limite seguro para setTimeout`,
                suggestedValue: MAX_SAFE_TIMEOUT
            });
        }
    }
    
    return issues;
}

function fixFile(filePath, issues) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Aplicar correções
    for (const issue of issues) {
        if (issue.type === 'problematic_pattern') {
            const oldContent = content;
            content = content.replace(issue.match, issue.fix);
            if (content !== oldContent) {
                hasChanges = true;
                console.log(`✅ Corrigido padrão problemático: ${issue.match} → ${issue.fix}`);
            }
        } else if (issue.type === 'config_issue' || issue.type === 'literal_overflow') {
            const oldContent = content;
            content = content.replace(issue.match, issue.suggestedValue);
            if (content !== oldContent) {
                hasChanges = true;
                console.log(`✅ Corrigido valor: ${issue.match} → ${issue.suggestedValue}`);
            }
        }
    }
    
    if (hasChanges) {
        // Criar backup
        const backupPath = filePath + '.backup.' + Date.now();
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`📁 Backup criado: ${backupPath}`);
        
        // Salvar arquivo corrigido
        fs.writeFileSync(filePath, content);
        console.log(`💾 Arquivo corrigido: ${filePath}`);
    }
    
    return hasChanges;
}

function main() {
    const projectRoot = process.cwd();
    console.log(`🔍 Analisando projeto: ${projectRoot}`);
    
    // Escanear arquivos
    const files = scanDirectory(projectRoot);
    console.log(`📁 Encontrados ${files.length} arquivos para análise`);
    
    let totalIssues = 0;
    let fixedFiles = 0;
    
    for (const file of files) {
        const issues = analyzeFile(file);
        if (issues.length > 0) {
            console.log(`\n📄 ${file}:`);
            for (const issue of issues) {
                console.log(`  ⚠️  Linha ${issue.line}: ${issue.description}`);
                console.log(`     ${issue.match}`);
                if (issue.suggestedValue) {
                    console.log(`     → Sugestão: ${issue.suggestedValue}`);
                }
            }
            
            totalIssues += issues.length;
            
            // Perguntar se deve corrigir
            const shouldFix = process.argv.includes('--fix');
            if (shouldFix) {
                if (fixFile(file, issues)) {
                    fixedFiles++;
                }
            }
        }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   - Arquivos analisados: ${files.length}`);
    console.log(`   - Problemas encontrados: ${totalIssues}`);
    console.log(`   - Arquivos corrigidos: ${fixedFiles}`);
    
    if (totalIssues > 0 && !process.argv.includes('--fix')) {
        console.log(`\n💡 Para aplicar as correções, execute: node fix_timeout_overflow.js --fix`);
    }
    
    // Verificar configurações do banco de dados
    console.log(`\n🗄️  Para verificar configurações do banco de dados, execute:`);
    console.log(`   psql -f fix_timeout_overflow.sql`);
}

if (require.main === module) {
    main();
}

module.exports = { analyzeFile, fixFile, scanDirectory };
