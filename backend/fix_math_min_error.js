#!/usr/bin/env node

/**
 * Script para corrigir o erro de sintaxe causado pela substituição incorreta
 * de setInterval por Math.min(undefined * 1000, 2147483647)
 */

const fs = require('fs');
const path = require('path');

function fixMathMinErrors(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;
        
        // Padrão problemático: Math.min(undefined * 1000, 2147483647)(...)
        const problematicPattern = /Math\.min\(undefined \* 1000, 2147483647\)/g;
        
        if (content.match(problematicPattern)) {
            // Substituir por setInterval
            content = content.replace(problematicPattern, 'setInterval');
            hasChanges = true;
            console.log(`✅ Corrigido em ${filePath}`);
        }
        
        if (hasChanges) {
            // Criar backup
            const backupPath = filePath + '.mathmin_fix.' + Date.now();
            fs.writeFileSync(backupPath, fs.readFileSync(filePath));
            console.log(`📁 Backup criado: ${backupPath}`);
            
            // Salvar arquivo corrigido
            fs.writeFileSync(filePath, content);
            console.log(`💾 Arquivo corrigido: ${filePath}`);
        }
        
        return hasChanges;
    } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    const projectRoot = process.cwd();
    console.log(`🔧 Corrigindo erros de Math.min em: ${projectRoot}\n`);
    
    // Arquivos que sabemos que têm o problema
    const filesToFix = [
        'start-baileys-anywhere.js',
        'auto-start-whatsapp.js',
        'baileys-monitor.js',
        'start-baileys-auto.js',
        'simple-baileys-server.js',
        'auto-start-baileys.js',
        'start-baileys-universal.js',
        'scripts/watch-supabase.ts',
        'server-manager.js',
        'baileys-watchdog.js',
        'src/services/whatsapp-integration.service.ts',
        'src/services/supabase-whatsapp.service.ts',
        'src/services/whatsapp-watchdog.service.ts'
    ];
    
    let fixedFiles = 0;
    
    for (const file of filesToFix) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
            if (fixMathMinErrors(filePath)) {
                fixedFiles++;
            }
        } else {
            console.log(`⚠️ Arquivo não encontrado: ${file}`);
        }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   - Arquivos corrigidos: ${fixedFiles}`);
    
    if (fixedFiles > 0) {
        console.log(`\n🎉 Correções aplicadas com sucesso!`);
        console.log(`💡 Agora você pode tentar iniciar o servidor novamente.`);
    } else {
        console.log(`\n✅ Nenhum arquivo precisou de correção.`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixMathMinErrors };
