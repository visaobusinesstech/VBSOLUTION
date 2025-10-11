#!/usr/bin/env node

/**
 * Script para iniciar o worker de buffering de mensagens
 * Este worker processa mensagens agrupadas e envia respostas em chunks
 */

const path = require('path');
const { Worker } = require('bullmq');
const { INTEGRATIONS_CONFIG } = require('./src/config/integrations.config');

console.log('🚀 Iniciando Message Buffer Worker...\n');

// Configurar conexão Redis com configurações seguras
const connection = {
  host: INTEGRATIONS_CONFIG.REDIS.HOST,
  port: INTEGRATIONS_CONFIG.REDIS.PORT,
  password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
  username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
  connectTimeout: 60000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 60000
};

// Configurações do worker
const worker = new Worker('message-buffer', async (job) => {
  const { name, data } = job;
  
  console.log(`🔄 [${new Date().toISOString()}] Processando job: ${name} - ID: ${job.id}`);
  
  try {
    switch (name) {
      case 'process-buffered-messages':
        await processBufferedMessages(data);
        break;
      case 'send-chunked-response':
        await sendChunkedResponse(data);
        break;
      default:
        console.log(`⚠️ Tipo de job desconhecido: ${name}`);
    }
    
    console.log(`✅ [${new Date().toISOString()}] Job ${job.id} concluído com sucesso`);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Erro no job ${job.id}:`, error);
    throw error;
  }
}, {
  connection,
  concurrency: 5,
  removeOnComplete: 10,
  removeOnFail: 5,
  stalledInterval: 30000,
  maxStalledCount: 1
});

// Função para processar mensagens agrupadas
async function processBufferedMessages(data) {
  const { sessionId, ownerId, connectionId, chatId } = data;
  
  console.log(`📦 Processando mensagens agrupadas para sessão: ${sessionId}`);
  
  try {
    // Simular processamento de mensagens agrupadas
    // Aqui você integraria com o AI Agent
    const aggregatedMessage = `Mensagens agrupadas processadas para sessão ${sessionId}`;
    
    // Dividir resposta em chunks
    const chunks = chunkMessage(aggregatedMessage, 300);
    
    console.log(`✂️ Resposta dividida em ${chunks.length} chunks`);
    
    // Enviar chunks com delay
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Agendar envio do chunk
      await worker.add('send-chunked-response', {
        chunk: chunk,
        chunkIndex: i + 1,
        totalChunks: chunks.length,
        sessionId: sessionId,
        ownerId: ownerId,
        connectionId: connectionId,
        chatId: chatId
      }, {
        delay: i * 2000 // 2 segundos entre chunks
      });
      
      console.log(`📤 Chunk ${i + 1}/${chunks.length} agendado para envio`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagens agrupadas:', error);
    throw error;
  }
}

// Função para enviar chunk de resposta
async function sendChunkedResponse(data) {
  const { chunk, chunkIndex, totalChunks, sessionId, connectionId, chatId } = data;
  
  console.log(`📤 Enviando chunk ${chunkIndex}/${totalChunks}: "${chunk.substring(0, 50)}..."`);
  
  try {
    // Aqui você integraria com o sistema de envio de mensagens
    // Por exemplo, usando o WhatsApp service
    console.log(`✅ Chunk ${chunkIndex}/${totalChunks} enviado com sucesso`);
    
  } catch (error) {
    console.error(`❌ Erro ao enviar chunk ${chunkIndex}:`, error);
    throw error;
  }
}

// Função para dividir mensagem em chunks
function chunkMessage(message, maxChunkSize = 300) {
  if (message.length <= maxChunkSize) {
    return [message];
  }
  
  const chunks = [];
  let currentIndex = 0;
  
  while (currentIndex < message.length) {
    let chunkEnd = currentIndex + maxChunkSize;
    
    // Se não é o último chunk, tentar quebrar em um espaço
    if (chunkEnd < message.length) {
      const lastSpace = message.lastIndexOf(' ', chunkEnd);
      if (lastSpace > currentIndex) {
        chunkEnd = lastSpace;
      }
    }
    
    const chunk = message.substring(currentIndex, chunkEnd).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    currentIndex = chunkEnd;
  }
  
  return chunks;
}

// Event listeners do worker
worker.on('ready', () => {
  console.log('✅ Message Buffer Worker iniciado e pronto para processar jobs');
});

worker.on('error', (error) => {
  console.error('❌ Erro no Message Buffer Worker:', error);
});

worker.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} falhou:`, error);
});

worker.on('stalled', (jobId) => {
  console.log(`⚠️ Job ${jobId} travado, será reprocessado`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT, encerrando worker...');
  await worker.close();
  console.log('✅ Worker encerrado com sucesso');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando worker...');
  await worker.close();
  console.log('✅ Worker encerrado com sucesso');
  process.exit(0);
});

console.log('🔧 Message Buffer Worker configurado');
console.log('📡 Aguardando jobs...\n');
