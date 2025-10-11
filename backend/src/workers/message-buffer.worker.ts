import { Worker, Job } from 'bullmq';
import { INTEGRATIONS_CONFIG } from '../config/integrations.config';
import MessageBufferService from '../services/message-buffer.service';

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

// Instanciar o serviço de buffer
const messageBufferService = new MessageBufferService();

// Configurações do worker
const worker = new Worker('message-buffer', async (job: Job) => {
  const { name, data } = job;
  
  console.log(`🔄 Processando job: ${name} - ID: ${job.id}`);
  
  try {
    switch (name) {
      case 'process-buffered-messages':
        await messageBufferService.processBufferedMessages(job);
        break;
        
      default:
        console.log('⚠️ Tipo de job não reconhecido:', name);
    }
    
    console.log(`✅ Job ${job.id} concluído com sucesso`);
    
  } catch (error) {
    console.error(`❌ Erro no job ${job.id}:`, error);
    throw error;
  }
}, {
  connection,
  concurrency: 3, // Processar até 3 jobs simultaneamente
  removeOnComplete: 10,
  removeOnFail: 5,
  stalledInterval: 30000,
  maxStalledCount: 1
});

// Event listeners
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} concluído com sucesso`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} falhou:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Erro no worker:', err);
});

worker.on('stalled', (jobId) => {
  console.log(`⚠️ Job ${jobId} travado, será reprocessado`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando worker...');
  await worker.close();
  await messageBufferService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando worker...');
  await worker.close();
  await messageBufferService.disconnect();
  process.exit(0);
});

console.log('🚀 Message Buffer Worker iniciado com configurações seguras');

export default worker;
