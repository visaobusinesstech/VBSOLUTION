const fs = require('fs');
const path = require('path');

// Arquivo para atualizar
const filePath = 'backend/simple-baileys-server.js';

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔄 Atualizando referências de phone_number para phone...');

// Substituições específicas para manter a funcionalidade
const replacements = [
  // Manter phone_number nas tabelas whatsapp_sessions (não é contacts)
  // Atualizar apenas as referências relacionadas a contacts
  
  // messageData.phone_number -> messageData.phone (para contatos)
  {
    from: /messageData\.phone_number/g,
    to: 'messageData.phone'
  },
  
  // phone_number em contextos de contatos
  {
    from: /\.eq\('phone_number', phoneNumber\)/g,
    to: ".eq('phone', phoneNumber)"
  },
  
  {
    from: /\.eq\('phone_number', phone\)/g,
    to: ".eq('phone', phone)"
  },
  
  // phone_number em updates de contatos
  {
    from: /\.eq\('phone_number', updatedContact\.phone\)/g,
    to: ".eq('phone', updatedContact.phone)"
  },
  
  // phone_number em contextos de mensagens (manter como está, pois é para whatsapp_sessions)
  // Mas atualizar quando usado para contatos
  
  // Logs e comentários
  {
    from: /phone_number/g,
    to: 'phone'
  }
];

// Aplicar substituições
let changesCount = 0;
replacements.forEach(({ from, to }) => {
  const before = content;
  content = content.replace(from, to);
  if (content !== before) {
    changesCount++;
    console.log(`✅ Aplicada substituição: ${from} -> ${to}`);
  }
});

// Salvar arquivo atualizado
fs.writeFileSync(filePath, content, 'utf8');

console.log(`🎉 Atualização concluída! ${changesCount} substituições aplicadas.`);
console.log('📁 Arquivo salvo:', filePath);

// Verificar se ainda há referências a phone_number
const remainingReferences = (content.match(/phone_number/g) || []).length;
console.log(`📊 Referências restantes a phone_number: ${remainingReferences}`);

if (remainingReferences > 0) {
  console.log('⚠️ Algumas referências podem ser intencionais (whatsapp_sessions)');
}

