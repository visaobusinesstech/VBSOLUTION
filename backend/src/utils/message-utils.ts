import { INTEGRATIONS_CONFIG } from '../config/integrations.config';

/**
 * Gera um sessionId único baseado no evento
 * Prioridade: chatId > phone > messageId
 */
export function makeSessionId(event: any): string {
  // Tentar chatId primeiro
  if (event.chatId) {
    return `chat:${event.chatId}`;
  }
  
  // Tentar phone
  if (event.phone) {
    return `phone:${event.phone}`;
  }
  
  // Tentar messageId
  if (event.messageId) {
    return `msg:${event.messageId}`;
  }
  
  // Fallback para ID do evento
  if (event.id) {
    return `event:${event.id}`;
  }
  
  // Último recurso: timestamp + random
  return `session:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Transcreve áudio usando OpenAI Whisper
 */
export async function transcribeAudio(audioUrl: string): Promise<string | null> {
  try {
    const { AudioTranscriptionService } = require('../services/audio-transcription.service');
    
    const transcriptionService = new AudioTranscriptionService(
      process.env.OPENAI_API_KEY || INTEGRATIONS_CONFIG.GENERAL.OPENAI_API_KEY,
      {
        enabled: true,
        language: 'pt-BR',
        provider: 'openai',
        model: 'whisper-1',
        autoSave: false,
        maxDuration: 300,
        fallbackText: '[Áudio - transcrição indisponível]'
      }
    );
    
    const result = await transcriptionService.transcribeAudio(audioUrl, 'system');
    
    return result.success ? result.text : null;
  } catch (error) {
    console.error('❌ Erro na transcrição:', error);
    return null;
  }
}

/**
 * Quebra texto em chunks respeitando palavras e quebras duplas
 */
export function chunkReply(text: string, limit: number = 300): string[] {
  if (!text || text.length <= limit) {
    return [text];
  }
  
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // Se o parágrafo sozinho é maior que o limite, quebrar por palavras
    if (paragraph.length > limit) {
      // Adicionar chunk atual se houver
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Quebrar parágrafo longo por palavras
      const words = paragraph.split(' ');
      let wordChunk = '';
      
      for (const word of words) {
        if ((wordChunk + ' ' + word).length > limit) {
          if (wordChunk.trim()) {
            chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            // Palavra muito longa, cortar no limite
            chunks.push(word.substring(0, limit));
            wordChunk = word.substring(limit);
          }
        } else {
          wordChunk += (wordChunk ? ' ' : '') + word;
        }
      }
      
      if (wordChunk.trim()) {
        currentChunk = wordChunk;
      }
    } else {
      // Verificar se adicionar este parágrafo excede o limite
      const testChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
      
      if (testChunk.length > limit) {
        // Adicionar chunk atual e começar novo
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph;
      } else {
        // Adicionar ao chunk atual
        currentChunk = testChunk;
      }
    }
  }
  
  // Adicionar último chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Agrega mensagens do buffer em uma mensagem completa
 */
export function aggregateMessages(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return '';
  }
  
  const textMessages: string[] = [];
  const audioCount = messages.filter(m => m.type === 'audio').length;
  const imageCount = messages.filter(m => m.type === 'image').length;
  
  // Processar mensagens por ordem de timestamp
  const sortedMessages = messages.sort((a, b) => a.ts - b.ts);
  
  for (const msg of sortedMessages) {
    if (msg.type === 'text' && msg.text) {
      textMessages.push(msg.text);
    } else if (msg.type === 'audio' && msg.text) {
      textMessages.push(`[Áudio transcrito]: ${msg.text}`);
    } else if (msg.type === 'image' && msg.caption) {
      textMessages.push(`[Imagem]: ${msg.caption}`);
    } else if (msg.type === 'image') {
      textMessages.push('[Imagem enviada]');
    }
  }
  
  // Montar mensagem completa
  let fullMessage = textMessages.join('\n\n');
  
  // Adicionar resumo de mídias se houver
  const mediaSummary: string[] = [];
  
  if (audioCount > 0) {
    mediaSummary.push(`${audioCount} áudio(s) transcrito(s)`);
  }
  
  if (imageCount > 0) {
    const imageCaptions = messages
      .filter(m => m.type === 'image' && m.caption)
      .map(m => m.caption);
    
    if (imageCaptions.length > 0) {
      mediaSummary.push(`${imageCount} imagem(ns) com legenda: ${imageCaptions.join(', ')}`);
    } else {
      mediaSummary.push(`${imageCount} imagem(ns) enviada(s)`);
    }
  }
  
  if (mediaSummary.length > 0) {
    fullMessage += `\n\n[Resumo de mídias: ${mediaSummary.join(', ')}]`;
  }
  
  return fullMessage;
}

/**
 * Envia mensagens em chunks com delay
 */
export async function sendChunksWithDelay(
  chunks: string[], 
  sendFunction: (chunk: string, index: number) => Promise<any>,
  delayMs: number = 2000
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    try {
      await sendFunction(chunks[i], i + 1);
      
      // Delay entre chunks (exceto no último)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar chunk ${i + 1}:`, error);
      // Continuar com próximo chunk mesmo se um falhar
    }
  }
}

/**
 * Valida se uma mensagem é duplicada
 */
export function isDuplicateMessage(messageId: string, existingMessages: any[]): boolean {
  return existingMessages.some(msg => 
    msg.originalEvent?.messageId === messageId ||
    msg.originalEvent?.id === messageId
  );
}

/**
 * Limpa mensagens antigas do buffer (mais de 1 hora)
 */
export function cleanOldMessages(messages: any[]): any[] {
  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
  return messages.filter(msg => msg.ts > oneHourAgo);
}
