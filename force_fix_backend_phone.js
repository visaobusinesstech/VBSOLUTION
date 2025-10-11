#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Forçando correção de phone_number no backend...');

const backendFile = 'backend/simple-baileys-server.js';

if (!fs.existsSync(backendFile)) {
  console.error('❌ Arquivo backend não encontrado:', backendFile);
  process.exit(1);
}

// Ler o arquivo
let content = fs.readFileSync(backendFile, 'utf8');

console.log('📖 Arquivo lido, tamanho:', content.length, 'caracteres');

// Contar referências atuais
const currentReferences = (content.match(/phone_number/g) || []).length;
console.log('🔍 Referências atuais a phone_number:', currentReferences);

if (currentReferences === 0) {
  console.log('✅ Nenhuma referência a phone_number encontrada no arquivo');
} else {
  console.log('⚠️ Encontradas', currentReferences, 'referências a phone_number');
  
  // Substituições específicas para corrigir phone_number
  const replacements = [
    // Substituir phone_number por phone em contextos de contatos
    {
      from: /contacts\.phone_number/g,
      to: 'contacts.phone',
      description: 'contacts.phone_number -> contacts.phone'
    },
    {
      from: /\.eq\(['"]phone_number['"], /g,
      to: ".eq('phone', ",
      description: '.eq("phone_number") -> .eq("phone")'
    },
    {
      from: /\.select\(['"][^'"]*phone_number[^'"]*['"]\)/g,
      to: (match) => match.replace(/phone_number/g, 'phone'),
      description: 'select phone_number -> select phone'
    },
    {
      from: /phone_number:/g,
      to: 'phone:',
      description: 'phone_number: -> phone:'
    },
    {
      from: /['"]phone_number['"]/g,
      to: "'phone'",
      description: '"phone_number" -> "phone"'
    }
  ];

  let totalReplacements = 0;
  
  replacements.forEach(replacement => {
    const before = content;
    if (typeof replacement.to === 'function') {
      content = content.replace(replacement.from, replacement.to);
    } else {
      content = content.replace(replacement.from, replacement.to);
    }
    const changes = before !== content;
    if (changes) {
      const count = (before.match(replacement.from) || []).length;
      totalReplacements += count;
      console.log(`✅ ${replacement.description}: ${count} substituições`);
    }
  });

  if (totalReplacements > 0) {
    // Fazer backup
    const backupFile = backendFile + '.backup.' + Date.now();
    fs.writeFileSync(backupFile, fs.readFileSync(backendFile, 'utf8'));
    console.log('💾 Backup criado:', backupFile);

    // Salvar arquivo corrigido
    fs.writeFileSync(backendFile, content, 'utf8');
    
    const finalReferences = (content.match(/phone_number/g) || []).length;
    console.log('🎉 Arquivo corrigido!');
    console.log('📊 Referências restantes a phone_number:', finalReferences);
    console.log('✅ Total de substituições:', totalReplacements);
  } else {
    console.log('ℹ️ Nenhuma substituição foi necessária');
  }
}

console.log('\n🚀 Correção concluída! Reinicie o backend para aplicar as mudanças.');

