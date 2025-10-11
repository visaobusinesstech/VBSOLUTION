const { supabase } = require('../supabaseClient');
const { loadAgentConfig } = require('../ai/loadAgentConfig');
const { buildSystemMessage } = require('../ai/buildPrompt');
const { infer } = require('../ai/infer');
const { resolveMedia } = require('../media/resolver');
const { sendMessage } = require('../wa/sendMessage');
const AudioTranscriptionService = require('../services/audio-transcription.service');
const { Queue } = require('bullmq');
const { INTEGRATIONS_CONFIG } = require('../config/integrations.config');
const { makeSessionId, transcribeAudio, chunkReply, aggregateMessages } = require('../utils/message-utils');
const MessageBufferService = require('../services/message-buffer.service');

// Cache para evitar processamento duplicado
const processedMessages = new Set();

// Configurar BullMQ com Redis Cloud
const messageQueue = new Queue('message-aggregation', {
  connection: {
    host: INTEGRATIONS_CONFIG.REDIS.HOST,
    port: INTEGRATIONS_CONFIG.REDIS.PORT,
    password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
    username: INTEGRATIONS_CONFIG.USERNAME,
    // CORREÇÃO: Adicionar configurações de timeout seguras
    connectTimeout: 60000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxLoadingTimeout: 60000
  },
  // CORREÇÃO: Adicionar configurações de job seguras
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
});

async function processIncomingMessage(messageData) {
  try {
    const messageId = messageData.message_id || messageData.id;
    
    // Verificar se já processamos esta mensagem
    if (processedMessages.has(messageId)) {
      console.log('⚠️ Mensagem já processada, pulando:', messageId);
      return;
    }
    
    // Marcar como processada
    processedMessages.add(messageId);
    
    console.log('🤖 ===== PROCESSANDO MENSAGEM RECEBIDA =====');
    console.log('🤖 Message ID:', messageId);
    console.log('🤖 Remetente:', messageData.remetente);
    console.log('🤖 Tipo:', messageData.message_type);
    console.log('🤖 Conteúdo:', messageData.conteudo);
    console.log('🤖 Media URL:', messageData.media_url);
    console.log('🤖 Chat ID:', messageData.chat_id);
    console.log('🤖 Owner ID:', messageData.owner_id);

    // 1. Verificar se deve processar
    if (messageData.remetente !== 'CLIENTE') {
      console.log('⚠️ Não é mensagem do cliente, pulando');
      return;
    }
    
    if (messageData.status === 'FINALIZADO') {
      console.log('⚠️ Conversa finalizada, pulando');
      return;
    }
    
    // 2. Verificar Modo de Atendimento - CRÍTICO: Só processar se IA estiver habilitada
    const { data: contactData } = await supabase
      .from('contacts')
      .select('ai_enabled, phone, name')
      .eq('phone', messageData.phone || messageData.chat_id.replace('@s.whatsapp.net', ''))
      .eq('owner_id', messageData.owner_id)
      .single();
    
    if (!contactData || !contactData.ai_enabled) {
      console.log('👤 IA não ativada para este contato - Atendimento humano');
      return;
    }

    console.log('🤖 IA ativada para este contato - Processando com Agente IA');

    // 3. Carregar configuração da IA
    console.log('🤖 Carregando configuração da IA...');
    const agentConfig = await loadAgentConfig(messageData.owner_id);
    
    if (!agentConfig) {
      console.log('❌ Nenhuma configuração de IA encontrada');
      return;
    }
    
    if (!agentConfig.openaiApiKey) {
      console.log('❌ API key da OpenAI não configurada');
      return;
    }

    // 4. SEMPRE usar sistema de agregação (manter configurações do agente)
    console.log('📦 Sistema de agregação - adicionando mensagem ao buffer Redis');
    
    // Normalizar sessionId
    const sessionId = makeSessionId({
      chatId: messageData.chat_id,
      phone: messageData.phone,
      messageId: messageId
    });
    
    // Determinar tipo de mensagem e processar mídia
    let messageType = 'text';
    let text = messageData.conteudo || '';
    let media = null;
    let caption = '';
    
    if (messageData.message_type === 'AUDIO' && messageData.media_url) {
      messageType = 'audio';
      media = {
        mimetype: 'audio/ogg',
        url: messageData.media_url
      };
      
      // Transcrever áudio
      try {
        console.log('🎵 Transcrevendo áudio...');
        const transcription = await transcribeAudio(media.url, messageData.owner_id, agentConfig);
        text = transcription || '[Áudio - transcrição indisponível]';
        console.log('✅ Transcrição concluída:', text);
      } catch (error) {
        console.error('❌ Erro na transcrição:', error);
        text = '[Áudio - erro na transcrição]';
      }
    } else if (messageData.message_type === 'IMAGEM' && messageData.media_url) {
      messageType = 'image';
      media = {
        mimetype: 'image/jpeg',
        url: messageData.media_url
      };
      caption = messageData.conteudo || '';
    }
    
    // Criar objeto de mensagem para o buffer
    const messageForBuffer = {
      sessionId: sessionId,
      type: messageType,
      text: text,
      media: media,
      caption: caption,
      ts: Math.floor(Date.now() / 1000),
      ownerId: messageData.owner_id,
      connectionId: messageData.connection_id,
      chatId: messageData.chat_id
    };
    
    // Adicionar ao buffer Redis
    const Redis = require('ioredis');
    const redis = new Redis(INTEGRATIONS_CONFIG.REDIS.URL);
    
    try {
      await redis.rpush(`conv:${sessionId}:buf`, JSON.stringify(messageForBuffer));
      console.log('📦 Mensagem adicionada ao buffer Redis');
      
      // Agendar job de agregação
      const debounceTime = agentConfig.messageSettings?.debounceTimeMs || 30000;
      const jobName = `aggregate:${sessionId}`;
      
      // Cancelar job anterior se existir
      const existingJobs = await messageQueue.getJobs(['delayed'], 0, -1);
      for (const job of existingJobs) {
        if (job.name === jobName) {
          await job.remove();
          console.log('🔄 Job anterior cancelado');
        }
      }
      
      // Agendar novo job
      await messageQueue.add('message-aggregation', {
        sessionId: sessionId,
        messageData: messageForBuffer,
        ownerId: messageData.owner_id,
        connectionId: messageData.connection_id,
        chatId: messageData.chat_id
      }, {
        delay: debounceTime,
        jobId: jobName
      });
      
      console.log(`⏰ Job de agregação agendado para ${debounceTime}ms`);
      
      await redis.disconnect();
      return; // Mensagem será processada pelo worker
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem ao buffer:', error);
      await redis.disconnect();
      // Continuar com processamento individual em caso de erro
    }
    // Se chegou aqui, houve erro no sistema de agregação
    console.log('❌ Erro no sistema de agregação - mensagem não será processada');
    console.log('🤖 ==========================================');
    
  } catch (error) {
    console.error('❌ Erro no processamento da mensagem:', error);
  }
}

module.exports = { processIncomingMessage };