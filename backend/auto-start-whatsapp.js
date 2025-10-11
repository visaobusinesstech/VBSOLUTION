#!/usr/bin/env node

/**
 * Script de Inicialização Automática do WhatsApp
 * Este script garante que o servidor esteja sempre rodando
 */

const WhatsAppServerManager = require('./server-manager');
const path = require('path');

class AutoStartWhatsApp {
  constructor() {
    this.manager = new WhatsAppServerManager();
    this.isRunning = false;
  }

  /**
   * Inicializar sistema automaticamente
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando sistema WhatsApp automático...');
      
      // Verificar se o servidor está rodando
      const status = await this.manager.getStatus();
      
      if (!status.success) {
        console.log('⚠️ Servidor não está rodando. Iniciando...');
        await this.manager.startServer();
      } else {
        console.log('✅ Servidor já está rodando');
      }
      
      this.isRunning = true;
      console.log('🎉 Sistema WhatsApp pronto para uso!');
      
      // Manter o processo vivo
      this.keepAlive();
      
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema:', error.message);
      process.exit(1);
    }
  }

  /**
   * Manter o processo vivo e monitorar o servidor
   */
  keepAlive() {
    console.log('🔄 Monitorando servidor...');
    
    // Verificar status a cada 30 segundos
    setInterval(async () => {
      try {
        const status = await this.manager.getStatus();
        
        if (!status.success && this.isRunning) {
          console.log('⚠️ Servidor parou. Reiniciando...');
          await this.manager.startServer();
        }
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error.message);
      }
    }, 30000);

    // Manter o processo vivo
    process.on('SIGINT', async () => {
      console.log('\n🛑 Parando sistema...');
      await this.manager.stopServer();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Parando sistema...');
      await this.manager.stopServer();
      process.exit(0);
    });
  }

  /**
   * Criar conexão automaticamente
   */
  async createConnection(name = 'Conexão Automática') {
    try {
      console.log(`🔄 Criando conexão: ${name}`);
      const connection = await this.manager.createConnection(name);
      console.log('✅ Conexão criada com sucesso!');
      return connection;
    } catch (error) {
      console.error('❌ Erro ao criar conexão:', error.message);
      throw error;
    }
  }

  /**
   * Obter QR Code de uma conexão
   */
  async getQRCode(connectionId) {
    try {
      const qrCode = await this.manager.getQRCode(connectionId);
      return qrCode;
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error.message);
      throw error;
    }
  }
}

// Função principal
async function main() {
  const autoStart = new AutoStartWhatsApp();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'start':
        await autoStart.initialize();
        break;

      case 'create':
        await autoStart.initialize();
        const connection = await autoStart.createConnection(arg || 'Nova Conexão');
        console.log('📱 Conexão criada:', JSON.stringify(connection, null, 2));
        break;

      case 'qr':
        if (!arg) {
          console.error('❌ Especifique o ID da conexão');
          console.log('Uso: node auto-start-whatsapp.js qr <connectionId>');
          process.exit(1);
        }
        await autoStart.initialize();
        const qrCode = await autoStart.getQRCode(arg);
        console.log('📱 QR Code:', qrCode);
        break;

      default:
        console.log('🔄 WhatsApp Auto Start');
        console.log('');
        console.log('Uso:');
        console.log('  node auto-start-whatsapp.js start                    - Iniciar sistema');
        console.log('  node auto-start-whatsapp.js create [nome]            - Criar conexão');
        console.log('  node auto-start-whatsapp.js qr <connectionId>        - Obter QR Code');
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutoStartWhatsApp;
