// Helper para enviar mensagens via WhatsApp usando Baileys
// Este arquivo reutiliza a lógica existente do simple-baileys-server.js

export async function sendMessage({ connectionId, chatId, text }: {
  connectionId: string; 
  chatId: string; 
  text: string;
}): Promise<any> {
  try {
    console.log('📤 Enviando mensagem via WhatsApp:', {
      connectionId,
      chatId,
      text: text.substring(0, 50) + '...'
    });

    // Usar a função existente que já funciona
    const { sendAIResponse } = require('../../simple-baileys-server.js');
    
    // Simular userId (será ignorado pela função sendAIResponse)
    await sendAIResponse(connectionId, chatId, text, null);
    
    console.log('✅ Mensagem enviada via WhatsApp com sucesso');
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem via WhatsApp:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
