#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Procurando todas as referências a phone_number...');

// Buscar todas as referências a phone_number no projeto
try {
  const grepResult = execSync('grep -r "phone_number" . --exclude-dir=node_modules --exclude-dir=.git', { encoding: 'utf8' });
  
  console.log('\n📋 Referências encontradas:');
  console.log(grepResult);
  
  // Analisar especificamente o arquivo backend/simple-baileys-server.js
  const backendFile = 'backend/simple-baileys-server.js';
  
  if (fs.existsSync(backendFile)) {
    console.log('\n🔍 Analisando backend/simple-baileys-server.js...');
    
    const content = fs.readFileSync(backendFile, 'utf8');
    
    // Buscar linhas que contenham phone_number
    const lines = content.split('\n');
    const phoneNumberLines = lines
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => line.includes('phone_number'));
    
    if (phoneNumberLines.length > 0) {
      console.log('\n⚠️ Linhas com phone_number encontradas:');
      phoneNumberLines.forEach(({ line, lineNumber }) => {
        console.log(`Linha ${lineNumber}: ${line.trim()}`);
      });
    } else {
      console.log('\n✅ Nenhuma referência a phone_number encontrada no arquivo principal');
    }
  }
  
} catch (error) {
  if (error.status === 1) {
    console.log('\n✅ Nenhuma referência a phone_number encontrada!');
  } else {
    console.error('Erro ao buscar referências:', error.message);
  }
}

// Verificar especificamente se há arquivos .js que podem estar sendo executados
console.log('\n🔍 Verificando arquivos JavaScript no backend...');

const jsFiles = [
  'backend/simple-baileys-server.js',
  'backend/message-normalizer.js',
  'backend/src/config/supabase.js'
];

jsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('phone_number')) {
      console.log(`⚠️ ${file} contém phone_number`);
    } else {
      console.log(`✅ ${file} OK`);
    }
  } else {
    console.log(`ℹ️ ${file} não encontrado`);
  }
});

console.log('\n🎯 Análise concluída!');

