#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Buscando e corrigindo TODAS as referências a phone_number...');

// 1. Buscar TODAS as referências a phone_number no projeto
console.log('\n1. Buscando referências a phone_number...');
try {
  const grepResult = execSync('grep -rn "phone_number" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md"', { encoding: 'utf8' });
  
  console.log('📋 Referências encontradas:');
  console.log(grepResult);
  
  // 2. Focar no arquivo principal do backend
  const backendFile = 'backend/simple-baileys-server.js';
  
  if (fs.existsSync(backendFile)) {
    console.log('\n2. Analisando arquivo principal do backend...');
    let content = fs.readFileSync(backendFile, 'utf8');
    
    // Verificar se há phone_number no arquivo
    const phoneNumberMatches = content.match(/phone_number/g);
    if (phoneNumberMatches) {
      console.log(`⚠️ Encontradas ${phoneNumberMatches.length} referências a phone_number no backend!`);
      
      // Mostrar as linhas com phone_number
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('phone_number')) {
          console.log(`Linha ${index + 1}: ${line.trim()}`);
        }
      });
      
      // Fazer backup
      const backupFile = backendFile + '.backup.' + Date.now();
      fs.writeFileSync(backupFile, content);
      console.log(`💾 Backup criado: ${backupFile}`);
      
      // Substituir phone_number por phone
      content = content.replace(/phone_number/g, 'phone');
      
      // Salvar arquivo corrigido
      fs.writeFileSync(backendFile, content, 'utf8');
      console.log('✅ Arquivo backend corrigido!');
      
    } else {
      console.log('✅ Nenhuma referência a phone_number encontrada no arquivo principal');
    }
  }
  
  // 3. Verificar outros arquivos importantes
  const importantFiles = [
    'backend/simple-baileys-server.js',
    'backend/simple-table-update.js',
    'backend/test-upsert.js',
    'backend/debug-connections.js',
    'backend/update-table-test.js',
    'backend/verify-system.js',
    'backend/execute-database-improvements.js',
    'backend/test-supabase.js'
  ];
  
  console.log('\n3. Verificando outros arquivos importantes...');
  importantFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/phone_number/g);
      if (matches) {
        console.log(`⚠️ ${file}: ${matches.length} referências a phone_number`);
        
        // Corrigir automaticamente
        const correctedContent = content.replace(/phone_number/g, 'phone');
        fs.writeFileSync(file, correctedContent, 'utf8');
        console.log(`✅ ${file} corrigido!`);
      } else {
        console.log(`✅ ${file}: OK`);
      }
    }
  });
  
  // 4. Verificar se ainda há referências
  console.log('\n4. Verificação final...');
  try {
    const finalCheck = execSync('grep -rn "phone_number" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.backup.*"', { encoding: 'utf8' });
    if (finalCheck.trim()) {
      console.log('⚠️ Ainda há referências a phone_number:');
      console.log(finalCheck);
    } else {
      console.log('✅ Nenhuma referência a phone_number encontrada!');
    }
  } catch (error) {
    console.log('✅ Nenhuma referência a phone_number encontrada!');
  }
  
} catch (error) {
  console.error('❌ Erro ao buscar referências:', error.message);
}

console.log('\n🎯 Próximos passos:');
console.log('1. Reinicie o backend: cd backend && node simple-baileys-server.js');
console.log('2. Teste o AI novamente');
console.log('3. Se o erro persistir, execute o SQL no Supabase');

