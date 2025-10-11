// Helper para baixar mídia do WhatsApp usando Baileys
// Este arquivo será usado pelo sistema de ingestão de mídia

export async function downloadWhatsAppMedia({ connectionId, waId }: {
  connectionId: string; 
  waId: string;
}): Promise<{ buffer: Buffer; mime: string }> {
  try {
    console.log('📎 Baixando mídia WhatsApp:', { connectionId, waId });
    
    // Importar dinamicamente para evitar dependências circulares
    const { activeConnections } = require('../../simple-baileys-server.js');
    
    // Buscar conexão ativa
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock || !connection.isConnected) {
      throw new Error(`Conexão não encontrada ou não conectada: ${connectionId}`);
    }

    // Tentar usar o método direto se disponível
    if (connection.sock.downloadMediaMessage) {
      console.log('📎 Usando download direto do Baileys...');
      const buffer = await connection.sock.downloadMediaMessage(waId);
      if (buffer) {
        // Tentar detectar o tipo MIME baseado no conteúdo
        let mime = 'application/octet-stream';
        
        // Verificar se é uma imagem
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          mime = 'image/jpeg';
        } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          mime = 'image/png';
        } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
          mime = 'audio/wav';
        } else if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
          mime = 'audio/ogg';
        } else if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
          mime = 'audio/mp3';
        }

        console.log('✅ Mídia baixada com sucesso:', { 
          size: buffer.length, 
          mime,
          waId 
        });

        return { 
          buffer: Buffer.from(buffer), 
          mime 
        };
      }
    }

    // Fallback: tentar baixar usando a função de download de mídia
    console.log('📎 Tentando download alternativo...');
    const { downloadMediaMessage } = require('@whiskeysockets/baileys');
    
    // Criar um objeto de mensagem fake para o download
    const fakeMessage = {
      key: {
        remoteJid: 'fake@chat',
        id: waId,
        fromMe: false
      },
      message: {}
    };

    const buffer = await downloadMediaMessage(
      fakeMessage,
      'buffer',
      {},
      {
        logger: connection.logger,
        retryRequestDelayMs: 1500,
        getMessage: async () => fakeMessage
      }
    );

    if (!buffer) {
      throw new Error('Buffer de mídia vazio');
    }

    // Detectar MIME type
    let mime = 'application/octet-stream';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      mime = 'image/jpeg';
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      mime = 'image/png';
    } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      mime = 'audio/wav';
    } else if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      mime = 'audio/ogg';
    } else if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      mime = 'audio/mp3';
    }

    console.log('✅ Mídia baixada com sucesso (fallback):', { 
      size: buffer.length, 
      mime,
      waId 
    });

    return { 
      buffer: Buffer.from(buffer), 
      mime 
    };
    
  } catch (error) {
    console.error('❌ Erro ao baixar mídia WhatsApp:', error);
    throw error;
  }
}
