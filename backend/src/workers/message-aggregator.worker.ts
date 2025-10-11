import { Worker, Job } from 'bullmq';
import { INTEGRATIONS_CONFIG } from '../config/integrations.config';
import { aggregateMessages, chunkReply, cleanOldMessages } from '../utils/message-utils';
import { loadAgentConfig } from '../ai/loadAgentConfig';
import { buildSystemMessage } from '../ai/buildPrompt';
import { infer } from '../ai/infer';

// Configurar conexão Redis
const connection = {
  host: INTEGRATIONS_CONFIG.REDIS.HOST,
  port: INTEGRATIONS_CONFIG.REDIS.PORT,
  password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
  username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
};

// Configurações do worker
const worker = new Worker('message-aggregation', async (job: Job) => {
  const { sessionId, messageData } = job.data;
  
  console.log(`🔄 Processando agregação para sessão: ${sessionId}`);
  
  try {
    // Conectar ao Redis
    const Redis = require('ioredis');
    const redis = new Redis(INTEGRATIONS_CONFIG.REDIS.URL);
    
    // Buscar todas as mensagens do buffer
    const bufferKey = `conv:${sessionId}:buf`;
    const rawMessages = await redis.lrange(bufferKey, 0, -1);
    
    if (rawMessages.length === 0) {
      console.log('⚠️ Buffer vazio, pulando agregação');
      await redis.disconnect();
      return;
    }
    
    // Parse das mensagens
    const messages = rawMessages.map(msg => JSON.parse(msg));
    console.log(`📦 ${messages.length} mensagens encontradas no buffer`);
    
    // Limpar mensagens antigas
    const cleanMessages = cleanOldMessages(messages);
    if (cleanMessages.length === 0) {
      console.log('⚠️ Todas as mensagens são antigas, pulando agregação');
      await redis.disconnect();
      return;
    }
    
    // Verificar se há mensagens novas desde o agendamento
    const lastMessageTime = Math.max(...cleanMessages.map(m => m.ts));
    const jobScheduledTime = job.timestamp;
    
    if (lastMessageTime > jobScheduledTime) {
      console.log('⏰ Mensagens novas detectadas, re-agendando job');
      // Re-agendar job com delay adicional
      const delay = parseInt(process.env.MESSAGE_DEBOUNCE_MS || '30000');
      // CORREÇÃO: Garantir que o delay não seja maior que 32-bit integer
      const safeDelay = Math.min(delay, 2147483647); // 2^31 - 1
      console.log(`⏰ Re-agendando com delay seguro: ${safeDelay}ms`);
      await job.moveToDelayed(Date.now() + safeDelay);
      await redis.disconnect();
      return;
    }
    
    // Agregar mensagens
    const aggregatedMessage = aggregateMessages(cleanMessages);
    console.log('📝 Mensagem agregada:', aggregatedMessage.substring(0, 100) + '...');
    
    // Limpar buffer
    await redis.del(bufferKey);
    console.log('🧹 Buffer limpo');
    
    // Carregar configuração do agente
    const ownerId = cleanMessages[0]?.originalEvent?.owner_id || 'system';
    const agentConfig = await loadAgentConfig(ownerId);
    
    if (!agentConfig) {
      console.log('⚠️ Configuração do agente não encontrada');
      await redis.disconnect();
      return;
    }
    
    // Construir prompt para o agente
    const systemMessage = buildSystemMessage(agentConfig);
    const userMessage = {
      role: 'user',
      content: aggregatedMessage
    };
    
    console.log('🤖 Enviando para o Agente IA...');
    
    // Chamar o agente
    const aiResponse = await infer.generateResponse(
      [systemMessage, userMessage],
      agentConfig
    );
    
    if (!aiResponse || !aiResponse.content) {
      console.log('⚠️ Resposta do agente vazia');
      await redis.disconnect();
      return;
    }
    
    console.log('✅ Resposta do agente recebida:', aiResponse.content.substring(0, 100) + '...');
    
    // Quebrar resposta em chunks usando configurações do agente
    const chunkSize = agentConfig.messageSettings?.chunkSize || 300;
    const chunks = chunkReply(aiResponse.content, chunkSize);
    
    console.log(`✂️ Resposta dividida em ${chunks.length} chunks`);
    
    // Enviar chunks via WhatsApp
    const connectionId = cleanMessages[0]?.originalEvent?.connection_id;
    const chatId = cleanMessages[0]?.originalEvent?.chat_id;
    
    if (!connectionId || !chatId) {
      console.log('⚠️ Connection ID ou Chat ID não encontrados');
      await redis.disconnect();
      return;
    }
    
    // Função para enviar mensagem (reutilizar do sistema existente)
    const { sendMessage } = require('../wa/sendMessage');
    
    // Função para gerar delay aleatório baseado nas configurações do agente
    const getRandomDelay = () => {
      const randomDelayEnabled = agentConfig.messageSettings?.randomDelayEnabled ?? true;
      
      if (!randomDelayEnabled) {
        // Usar delay fixo se aleatório estiver desabilitado
        return agentConfig.messageSettings?.chunkDelayMs || 2000;
      }
      
      const minDelay = agentConfig.messageSettings?.minDelayMs || 3000; // 3 segundos
      const maxDelay = agentConfig.messageSettings?.maxDelayMs || 5000; // 5 segundos
      return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    };
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`📤 Enviando chunk ${i + 1}/${chunks.length}...`);
        
        const sendResult = await sendMessage({
          connectionId,
          chatId,
          text: chunks[i]
        });
        
        if (sendResult.success) {
          console.log(`✅ Chunk ${i + 1} enviado com sucesso`);
          
          // Salvar no banco de dados
          const { supabase } = require('../supabaseClient');
          await supabase
            .from('whatsapp_mensagens')
            .insert([{
              owner_id: ownerId,
              chat_id: chatId,
              connection_id: connectionId,
              message_type: 'TEXTO',
              remetente: 'AI',
              conteudo: chunks[i],
              status: 'AI',
              lida: true,
              timestamp: new Date().toISOString(),
              message_id: `ai_chunk_${Date.now()}_${i + 1}`,
              atendimento_id: `ai_${Date.now()}`,
              wa_msg_id: sendResult.messageId,
              chunk_sequence: i + 1,
              chunk_total: chunks.length
            }]);
          
        } else {
          console.error(`❌ Erro ao enviar chunk ${i + 1}:`, sendResult.error);
        }
        
        // Delay aleatório entre chunks (exceto no último)
        if (i < chunks.length - 1) {
          const randomDelay = getRandomDelay();
          console.log(`⏳ Aguardando ${randomDelay}ms antes do próximo chunk...`);
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar chunk ${i + 1}:`, error);
        // Continuar com próximo chunk
      }
    }
    
    console.log('🎉 Agregação concluída com sucesso!');
    
    await redis.disconnect();
    
  } catch (error) {
    console.error('❌ Erro na agregação de mensagens:', error);
    throw error;
  }
}, {
  connection,
  concurrency: 5,
  removeOnComplete: 10,
  removeOnFail: 5
});

// Event listeners
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} concluído com sucesso`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} falhou:`, err);
});

worker.on('error', (err) => {
  console.error('❌ Erro no worker:', err);
});

console.log('🚀 Message Aggregator Worker iniciado');

export default worker;
