import * as express from 'express';
import { Queue } from 'bullmq';
import { INTEGRATIONS_CONFIG } from '../config/integrations.config';
import { makeSessionId, transcribeAudio } from '../utils/message-utils';

const router = express.Router();

// Configurar BullMQ com Redis Cloud
const messageQueue = new Queue('message-aggregation', {
  connection: {
    host: INTEGRATIONS_CONFIG.REDIS.HOST,
    port: INTEGRATIONS_CONFIG.REDIS.PORT,
    password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
    username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
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

// Endpoint para receber webhooks do WhatsApp/Evolution
router.post('/wa', async (req, res) => {
  try {
    console.log('📨 Webhook WhatsApp recebido:', JSON.stringify(req.body, null, 2));
    
    const event = req.body;
    
    // Normalizar sessionId
    const sessionId = makeSessionId(event);
    console.log('🆔 Session ID gerado:', sessionId);
    
    // Determinar tipo de mensagem
    let messageType = 'text';
    let text = event.text || '';
    let media = null;
    let caption = '';
    
    if (event.audio) {
      messageType = 'audio';
      media = {
        mimetype: 'audio/ogg',
        url: event.audio.url || event.audio
      };
      
      // Transcrever áudio
      try {
        console.log('🎵 Transcrevendo áudio...');
        const transcription = await transcribeAudio(media.url);
        text = transcription || '[Áudio - transcrição indisponível]';
        console.log('✅ Transcrição concluída:', text);
      } catch (error) {
        console.error('❌ Erro na transcrição:', error);
        text = '[Áudio - erro na transcrição]';
      }
    } else if (event.image) {
      messageType = 'image';
      media = {
        mimetype: 'image/jpeg',
        url: event.image.url || event.image
      };
      caption = event.image.caption || '';
      text = caption || '[Imagem enviada]';
    }
    
    // Montar dados da mensagem
    const messageData = {
      sessionId,
      type: messageType,
      text,
      media,
      caption,
      ts: Math.floor(Date.now() / 1000),
      originalEvent: event
    };
    
    console.log('📝 Dados da mensagem:', messageData);
    
    // Adicionar ao buffer Redis
    const redis = require('ioredis');
    const redisClient = new redis(INTEGRATIONS_CONFIG.REDIS.URL);
    
    await redisClient.rpush(`conv:${sessionId}:buf`, JSON.stringify(messageData));
    console.log('💾 Mensagem adicionada ao buffer Redis');
    
    // Carregar configuração do agente para obter configurações de mensagem
    const { loadAgentConfig } = require('../ai/loadAgentConfig');
    const ownerId = event.owner_id || 'system';
    const agentConfig = await loadAgentConfig(ownerId);
    
    // Usar configurações do agente ou padrões
    const debounceEnabled = agentConfig?.messageSettings?.debounceEnabled ?? true;
    const debounceTimeMs = agentConfig?.messageSettings?.debounceTimeMs ?? 30000;
    
    if (!debounceEnabled) {
      console.log('⚠️ Debounce desabilitado, processando mensagem imediatamente');
      // Processar mensagem imediatamente sem agrupamento
      // TODO: Implementar processamento imediato
      await redisClient.disconnect();
      return res.json({ 
        success: true, 
        message: 'Mensagem processada imediatamente (debounce desabilitado)',
        sessionId
      });
    }
    
    // Agendar/reatualizar job de agregação
    const jobId = `aggregate:${sessionId}`;
    const delay = debounceTimeMs;
    
    // Remover job anterior se existir
    const existingJobs = await messageQueue.getJobs(['delayed']);
    for (const job of existingJobs) {
      if (job.name === jobId) {
        await job.remove();
        console.log('🔄 Job anterior removido');
      }
    }
    
    // Criar novo job
    await messageQueue.add(
      'aggregate-messages',
      { sessionId, messageData },
      {
        jobId,
        delay,
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );
    
    console.log(`⏰ Job agendado para ${delay}ms:`, jobId);
    
    await redisClient.disconnect();
    
    res.json({ 
      success: true, 
      message: 'Evento processado com sucesso',
      sessionId,
      scheduledJob: jobId
    });
    
  } catch (error) {
    console.error('❌ Erro no webhook WhatsApp:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Endpoint para receber webhooks do Instagram
router.post('/instagram', async (req, res) => {
  try {
    console.log('📸 Webhook Instagram recebido:', JSON.stringify(req.body, null, 2));
    
    const event = req.body;
    const sessionId = makeSessionId(event);
    
    // Processar similar ao WhatsApp
    const messageData = {
      sessionId,
      type: 'text',
      text: event.text || event.message || '[Mensagem do Instagram]',
      media: event.media ? {
        mimetype: event.media.type || 'image/jpeg',
        url: event.media.url
      } : null,
      caption: event.caption || '',
      ts: Math.floor(Date.now() / 1000),
      originalEvent: event
    };
    
    // Adicionar ao buffer e agendar job
    const redis = require('ioredis');
    const redisClient = new redis(INTEGRATIONS_CONFIG.REDIS.URL);
    
    await redisClient.rpush(`conv:${sessionId}:buf`, JSON.stringify(messageData));
    
    const jobId = `aggregate:${sessionId}`;
    const delay = parseInt(process.env.MESSAGE_DEBOUNCE_MS || '30000');
    
    await messageQueue.add(
      'aggregate-messages',
      { sessionId, messageData },
      {
        jobId,
        delay,
        removeOnComplete: 10,
        removeOnFail: 5
      }
    );
    
    await redisClient.disconnect();
    
    res.json({ success: true, message: 'Evento Instagram processado' });
    
  } catch (error) {
    console.error('❌ Erro no webhook Instagram:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para status do sistema
router.get('/status', async (req, res) => {
  try {
    const redis = require('ioredis');
    const redisClient = new redis(INTEGRATIONS_CONFIG.REDIS.URL);
    
    const info = await redisClient.info();
    const queueStats = await messageQueue.getJobCounts();
    
    await redisClient.disconnect();
    
    res.json({
      status: 'online',
      redis: {
        connected: true,
        version: info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'
      },
      queue: queueStats,
      config: {
        debounceMs: process.env.MESSAGE_DEBOUNCE_MS || '30000',
        chunkSize: process.env.REPLY_CHUNK_SIZE || '300'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

export default router;
