#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Corrigindo todas as referências de phone_number para phone...');

// Lista de arquivos para atualizar
const filesToFix = [
  'backend/src/services/whatsapp-supabase-integration.service.ts',
  'backend/src/services/supabase-sessions.service.ts',
  'backend/simple-baileys-server.js'
];

// Função para atualizar um arquivo
function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`📝 Atualizando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Para arquivos TypeScript dos services, manter phone_number pois são para whatsapp_sessions
  if (filePath.includes('services/') && filePath.endsWith('.ts')) {
    console.log(`ℹ️ Mantendo phone_number em ${filePath} (tabela whatsapp_sessions)`);
    return;
  }

  // Para o arquivo principal do backend, procurar apenas referências relacionadas a contacts
  if (filePath.includes('simple-baileys-server.js')) {
    // Buscar referências específicas a contacts.phone_number
    const contactsPhoneNumberPattern = /contacts\.phone_number/g;
    if (content.match(contactsPhoneNumberPattern)) {
      content = content.replace(contactsPhoneNumberPattern, 'contacts.phone');
      changed = true;
      console.log(`✅ Corrigido contacts.phone_number -> contacts.phone em ${filePath}`);
    }

    // Buscar referências em queries de contatos
    const contactQueryPattern = /\.eq\(['"]phone_number['"], /g;
    if (content.match(contactQueryPattern)) {
      content = content.replace(contactQueryPattern, ".eq('phone', ");
      changed = true;
      console.log(`✅ Corrigido .eq('phone_number') -> .eq('phone') em ${filePath}`);
    }

    // Buscar referências em select de contatos
    const selectPattern = /\.select\(['"][^'"]*phone_number[^'"]*['"]\)/g;
    if (content.match(selectPattern)) {
      content = content.replace(/phone_number/g, 'phone');
      changed = true;
      console.log(`✅ Corrigido select phone_number -> phone em ${filePath}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Arquivo atualizado: ${filePath}`);
  } else {
    console.log(`ℹ️ Nenhuma alteração necessária em: ${filePath}`);
  }
}

// Atualizar todos os arquivos
filesToFix.forEach(updateFile);

console.log('\n🎉 Correção de referências phone_number concluída!');
console.log('\n📋 Resumo:');
console.log('✅ contacts.phone_number -> contacts.phone');
console.log('✅ .eq("phone_number") -> .eq("phone")');
console.log('✅ select phone_number -> select phone');
console.log('ℹ️ Mantido phone_number em whatsapp_sessions (tabela diferente)');

