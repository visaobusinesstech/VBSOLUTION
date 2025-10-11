#!/usr/bin/env node

/**
 * Script para iniciar o Message Aggregator Worker
 * 
 * Uso:
 *   node src/workers/start-aggregator.js
 *   npm run worker:aggregator
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('🚀 Iniciando Message Aggregator Worker...');
console.log('📋 Configurações:');
console.log('   - Redis URL:', process.env.REDIS_URL || 'redis://localhost:6379');
console.log('   - Debounce Time:', process.env.MESSAGE_DEBOUNCE_MS || '30000ms');
console.log('   - Chunk Size:', process.env.REPLY_CHUNK_SIZE || '300 chars');
console.log('   - Chunk Delay:', process.env.REPLY_CHUNK_DELAY_MS || '2000ms');

// Importar e iniciar o worker
require('./message-aggregator.worker.ts');

// Manter o processo vivo
process.on('SIGINT', () => {
  console.log('\n🛑 Parando Message Aggregator Worker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando Message Aggregator Worker...');
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  process.exit(1);
});

console.log('✅ Message Aggregator Worker iniciado com sucesso!');
console.log('⏳ Aguardando jobs...');
