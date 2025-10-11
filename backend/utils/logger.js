/**
 * Logger centralizado usando Pino
 * Substitui console.log por sistema profissional de logs
 * 
 * Níveis de log:
 * - trace: Detalhes técnicos extremos (desenvolvimento)
 * - debug: Info de debug (desenvolvimento)
 * - info: Informações importantes (produção se necessário)
 * - warn: Avisos importantes
 * - error: Erros que precisam atenção
 * - fatal: Erros críticos que param o sistema
 */

const pino = require('pino');

// Determinar nível de log baseado no ambiente
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'info');

const logger = pino({
  level: LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{msg}',
      customColors: 'trace:bgBlue,debug:bgCyan,info:bgGreen,warn:bgYellow,error:bgRed,fatal:bgMagenta'
    }
  }
});

// Helper functions para manter compatibilidade
logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warning = (msg, ...args) => logger.warn(`⚠️ ${msg}`, ...args);
logger.critical = (msg, ...args) => logger.error(`🔴 ${msg}`, ...args);

// Log da configuração inicial (apenas uma vez)
if (process.env.NODE_ENV !== 'test') {
  logger.info(`Logger inicializado - Nível: ${LOG_LEVEL} | Ambiente: ${process.env.NODE_ENV || 'development'}`);
}

module.exports = logger;

