/**
 * ULTRA-PARALLEL V6.0 OTIMIZADO - Sistema estabilizado com configurações realistas
 * Meta: 50 emails/segundo com 50 conexões simultâneas e alta estabilidade
 */

interface UltraParallelConfig {
  maxConcurrent: number;
  chunkSize: number;
  delayBetweenChunks: number;
  connectionTimeout: number;
  maxRetries: number;
  targetThroughput: number;
  batchHistorySize: number;
  rateLimiting: {
    emailsPerSecond: number;
    burstLimit: number;
    backoffMultiplier: number;
  };
}

interface UltraEmailJob {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  index: number;
  retryCount?: number;
  template_id?: string;
  contato_id?: string;
  contato_nome?: string;
  template_nome?: string;
  fromName?: string;
  fromEmail?: string;
}

interface UltraResult {
  success: boolean;
  index: number;
  to: string;
  error?: string;
  duration: number;
  provider: string;
  connectionSlot: number;
  attempt: number;
  retryReason?: string;
}

/**
 * Processamento ULTRA-PARALLEL V6.0 OTIMIZADO com configurações estabilizadas
 */
export async function processOptimizedBatch(params: {
  emails: any[];
  smtp_settings: any;
  optimization_config?: any;
}): Promise<{
  success: boolean;
  batch: boolean;
  total: number;
  successful: number;
  failed: number;
  results: any[];
  summary?: any;
}> {
  const { emails, smtp_settings, optimization_config = {} } = params;
  
  // Configuração OTIMIZADA e CONSERVADORA para alta estabilidade
  const config: UltraParallelConfig = {
    maxConcurrent: 50, // Reduzido para estabilidade
    chunkSize: 50, // Chunks menores para melhor controle
    delayBetweenChunks: 2000, // 2s delay para evitar sobrecarga
    connectionTimeout: 30000, // 30s timeout (aumentado)
    maxRetries: 3, // Sistema robusto de retry
    targetThroughput: 50, // Meta realista
    batchHistorySize: 250, // Lotes menores para histórico
    rateLimiting: {
      emailsPerSecond: 2, // Rate limit conservador
      burstLimit: 10,
      backoffMultiplier: 1.5
    }
  };

  const startTime = Date.now();
  const results: UltraResult[] = [];
  let processed = 0;
  let successCount = 0;
  let errorCount = 0;
  let peakThroughput = 0;
  let progressHistory: Array<{time: number, count: number}> = [];
  let totalRetries = 0;
  let maxRetriesUsed = 0;
  let successAfterRetry = 0;
  const errorBreakdown: Record<string, number> = {};

  console.log(`🚀 ULTRA-PARALLEL V6.0 OTIMIZADO: ${emails.length} emails`);
  console.log(`🎯 META REALISTA: ${config.targetThroughput} emails/s com ${config.maxConcurrent} conexões`);

  // Rate limiter para controle de fluxo
  const rateLimiter = {
    lastCall: 0,
    callCount: 0,
    windowStart: Date.now(),
    
    async waitIfNeeded() {
      const now = Date.now();
      const windowMs = 1000; // 1 segundo
      
      // Reset da janela
      if (now - this.windowStart >= windowMs) {
        this.callCount = 0;
        this.windowStart = now;
      }
      
      // Controle de rate limiting
      if (this.callCount >= config.rateLimiting.emailsPerSecond) {
        const waitTime = windowMs - (now - this.windowStart);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          this.callCount = 0;
          this.windowStart = Date.now();
        }
      }
      
      this.callCount++;
    }
  };
  
  // Função para calcular throughput em tempo real
  const calculateThroughput = () => {
    const now = Date.now();
    progressHistory.push({ time: now, count: processed });
    progressHistory = progressHistory.filter(p => now - p.time <= 5000); // 5s de histórico

    if (progressHistory.length >= 2) {
      const recent = progressHistory[progressHistory.length - 1];
      const older = progressHistory[0];
      const timeDiff = recent.time - older.time;
      const countDiff = recent.count - older.count;
      return timeDiff > 0 ? (countDiff / timeDiff) * 1000 : 0;
    }
    return 0;
  };

  // Função para categorizar erros
  const categorizeError = (error: string): string => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('timeout') || errorLower.includes('tempo')) {
      return 'Timeout';
    } else if (errorLower.includes('connection') || errorLower.includes('conexão')) {
      return 'Erro de Conexão';
    } else if (errorLower.includes('smtp') || errorLower.includes('auth')) {
      return 'Erro SMTP/Auth';
    } else if (errorLower.includes('rate') || errorLower.includes('limit')) {
      return 'Rate Limit';
    } else if (errorLower.includes('dns') || errorLower.includes('host')) {
      return 'Erro DNS/Host';
    } else if (errorLower.includes('ssl') || errorLower.includes('tls')) {
      return 'Erro SSL/TLS';
    } else {
      return 'Erro Geral';
    }
  };

  // Processamento em chunks OTIMIZADOS
  for (let i = 0; i < emails.length; i += config.chunkSize) {
    const chunk = emails.slice(i, i + config.chunkSize);
    const chunkNumber = Math.floor(i / config.chunkSize) + 1;
    const totalChunks = Math.ceil(emails.length / config.chunkSize);

    console.log(`⚡ CHUNK OTIMIZADO ${chunkNumber}/${totalChunks}: ${chunk.length} emails`);

    // Array de promises com controle de concorrência otimizado
    const chunkPromises = chunk.map(async (emailData, emailIndex) => {
      const globalIndex = i + emailIndex;
      const connectionSlot = globalIndex % config.maxConcurrent;
      
      // Rate limiting antes do envio
      await rateLimiter.waitIfNeeded();
      
      const jobStartTime = Date.now();
      let lastError: Error;
      let retryReason = '';
      
      try {
        // Sistema de retry ROBUSTO com backoff exponencial
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
          try {
            console.log(`📤 [${globalIndex + 1}/${emails.length}] Slot ${connectionSlot} (Tent. ${attempt + 1}): ${emailData.to}`);
            
            const result = await processSingleSend(emailData, smtp_settings);
            const duration = Date.now() - jobStartTime;
            
            processed++;
            successCount++;
            if (attempt > 0) successAfterRetry++;
            totalRetries += attempt;
            if (attempt > maxRetriesUsed) maxRetriesUsed = attempt;
            
            // Calcula throughput atual
            const currentThroughput = calculateThroughput();
            if (currentThroughput > peakThroughput) {
              peakThroughput = currentThroughput;
            }
            
            console.log(`✅ [${globalIndex + 1}] SUCESSO OTIMIZADO em ${duration}ms (${currentThroughput.toFixed(2)} emails/s)`);
            if (attempt > 0) {
              console.log(`🔄 Sucesso após ${attempt} tentativas: ${retryReason}`);
            }
            
            return {
              success: true,
              result: result,
              to: emailData.to,
              index: globalIndex,
              duration,
              provider: 'ultra_parallel_v6_optimized',
              connectionSlot,
              attempt: attempt + 1,
              retryReason: attempt > 0 ? retryReason : undefined
            };
          } catch (error: any) {
            lastError = error;
            retryReason = categorizeError(error.message);
            
            console.warn(`⚠️ [${globalIndex + 1}] Tentativa ${attempt + 1} falhou: ${error.message}`);
            
            if (attempt < config.maxRetries) {
              // Backoff exponencial otimizado
              const backoffDelay = Math.min(
                1000 * Math.pow(config.rateLimiting.backoffMultiplier, attempt), 
                10000
              );
              console.log(`⏳ Aguardando ${backoffDelay}ms antes do retry...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
          }
        }
        
        // Falha após todos os retries
        const duration = Date.now() - jobStartTime;
        processed++;
        errorCount++;
        totalRetries += config.maxRetries;
        if (config.maxRetries > maxRetriesUsed) maxRetriesUsed = config.maxRetries;
        
        const errorCategory = categorizeError(lastError.message);
        errorBreakdown[errorCategory] = (errorBreakdown[errorCategory] || 0) + 1;

        const currentThroughput = calculateThroughput();
        if (currentThroughput > peakThroughput) {
          peakThroughput = currentThroughput;
        }

        console.error(`❌ [${globalIndex + 1}] FALHA FINAL após ${config.maxRetries + 1} tentativas: ${errorCategory}`);
        
        return {
          success: false,
          error: `${errorCategory}: ${lastError.message}`,
          to: emailData.to,
          index: globalIndex,
          duration,
          provider: 'ultra_parallel_v6_optimized',
          connectionSlot,
          attempt: config.maxRetries + 1,
          retryReason: errorCategory
        };
      } catch (error: any) {
        // Fallback para erros não tratados
        const duration = Date.now() - jobStartTime;
        processed++;
        errorCount++;
        
        const errorCategory = categorizeError(error.message);
        errorBreakdown[errorCategory] = (errorBreakdown[errorCategory] || 0) + 1;

        const currentThroughput = calculateThroughput();
        if (currentThroughput > peakThroughput) {
          peakThroughput = currentThroughput;
        }

        console.error(`💥 [${globalIndex + 1}] ERRO CRÍTICO: ${errorCategory}`);
        
        return {
          success: false,
          error: `${errorCategory}: ${error.message}`,
          to: emailData.to,
          index: globalIndex,
          duration,
          provider: 'ultra_parallel_v6_optimized',
          connectionSlot: 0,
          attempt: 1,
          retryReason: errorCategory
        };
      }
    });

    // Aguarda TODAS as conexões do chunk com controle de qualidade
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    // Log detalhado de performance do chunk
    const chunkThroughput = calculateThroughput();
    const chunkSuccessful = chunkResults.filter(r => r.success).length;
    const chunkSuccessRate = ((chunkSuccessful / chunk.length) * 100).toFixed(1);
    
    console.log(`🚀 CHUNK ${chunkNumber} OTIMIZADO COMPLETO: ${chunkSuccessful}/${chunk.length} sucessos (${chunkSuccessRate}%)`);
    console.log(`⚡ Throughput atual: ${chunkThroughput.toFixed(2)} emails/s (Pico: ${peakThroughput.toFixed(2)})`);

    // Delay OTIMIZADO entre chunks
    if (i + config.chunkSize < emails.length) {
      console.log(`⏳ Delay otimizado de ${config.delayBetweenChunks}ms entre chunks...`);
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenChunks));
    }
  }

  const totalDuration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const avgThroughput = (emails.length / totalDuration) * 1000;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const targetAchieved = avgThroughput >= (config.targetThroughput * 0.7) || peakThroughput >= config.targetThroughput;

  console.log(`🎯 ULTRA-PARALLEL V6.0 OTIMIZADO FINALIZADO em ${Math.round(totalDuration / 1000)}s`);
  console.log(`🚀 Taxa média OTIMIZADA: ${avgThroughput.toFixed(2)} emails/segundo`);
  console.log(`⚡ Pico absoluto: ${peakThroughput.toFixed(2)} emails/segundo`);
  console.log(`✅ Sucessos: ${successful}/${emails.length} (${((successful/emails.length)*100).toFixed(1)}%)`);
  console.log(`🔄 Estatísticas de retry: ${totalRetries} total, ${successAfterRetry} sucessos após retry`);
  console.log(`🎯 Meta atingida (70% de ${config.targetThroughput}): ${targetAchieved ? '🏆 SIM' : '📈 Quase lá'}`);

  return {
    success: true,
    batch: true,
    total: emails.length,
    successful,
    failed: emails.length - successful,
    results: results.map(r => ({
      success: r.success,
      to: r.to,
      error: r.error,
      duration: r.duration
    })),
    summary: {
      total: emails.length,
      successful,
      failed: emails.length - successful,
      avgThroughput: Math.round(avgThroughput * 100) / 100,
      peakThroughput: Math.round(peakThroughput * 100) / 100,
      totalDuration: Math.round(totalDuration / 1000),
      targetAchieved,
      avgEmailDuration: Math.round(avgDuration),
      successRate: emails.length > 0 ? ((successful / emails.length) * 100).toFixed(1) : "0",
      errorBreakdown,
      retryStats: {
        totalRetries,
        maxRetriesUsed,
        successAfterRetry
      }
    }
  };
}

/**
 * Função para processar envio individual
 */
export async function processSingleSend(emailData: any, smtpSettings: any) {
  try {
    // Aqui você implementaria o envio real via SMTP
    // Por enquanto, simula o envio
    console.log("📧 Enviando email via SMTP:", {
      to: emailData.to,
      subject: emailData.subject,
      host: smtpSettings.host,
      port: smtpSettings.port
    });
    
    // Simula delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      to: emailData.to,
      subject: emailData.subject,
      sentAt: new Date().toISOString()
    };
  } catch (error: any) {
    throw new Error(`Erro no envio SMTP: ${error.message}`);
  }
}
