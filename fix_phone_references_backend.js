const fs = require('fs');
const path = require('path');

const backendFile = path.join(__dirname, 'backend', 'simple-baileys-server.js');

console.log('🔧 Corrigindo referências de phone_number para phone no backend...');

try {
  let content = fs.readFileSync(backendFile, 'utf8');
  
  // Substituir todas as referências de phone_number para phone (apenas para whatsapp_sessions)
  const replacements = [
    // WhatsApp sessions table references
    { from: /\.eq\('phone_number',/g, to: ".eq('phone'," },
    { from: /\.select\('owner_id, phone_number'\)/g, to: ".select('owner_id, phone')" },
    { from: /phone_number: sessionData\.phone_number/g, to: "phone: sessionData.phone" },
    { from: /session\.phone_number/g, to: "session.phone" },
    { from: /connection\.phone_number/g, to: "connection.phone" },
    { from: /data\.phone_number/g, to: "data.phone" },
    { from: /existingSession\.phone_number/g, to: "existingSession.phone" },
    
    // Message data references (keep as phone_number for contacts table)
    // { from: /messageData\.phone_number/g, to: "messageData.phone" }, // Keep this for contacts
    // { from: /msg\.phone_number/g, to: "msg.phone" }, // Keep this for contacts
  ];
  
  let changeCount = 0;
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      changeCount += matches.length;
      console.log(`✅ Substituído: ${from} -> ${to} (${matches.length} ocorrências)`);
    }
  });
  
  // Escrever arquivo corrigido
  fs.writeFileSync(backendFile, content, 'utf8');
  
  console.log(`🎉 Correção concluída! ${changeCount} referências corrigidas.`);
  console.log('📝 Arquivo salvo:', backendFile);
  
} catch (error) {
  console.error('❌ Erro ao corrigir arquivo:', error);
}

