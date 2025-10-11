#!/usr/bin/env node

/**
 * Sistema de Inicialização Automática VBSolutionCRM
 * Inicializa automaticamente o frontend, backend e Baileys
 * Funciona em qualquer sistema operacional
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const PortFinder = require('./port-finder');

class AutoStartSystem {
  constructor() {
    this.projectRoot = __dirname;
    this.backendPath = path.join(this.projectRoot, 'backend');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.isWindows = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';
    
    this.backendProcess = null;
    this.frontendProcess = null;
    this.baileysProcess = null;
    this.isRunning = false;
    
    // Portas dinâmicas
    this.ports = {
      frontend: null,
      backend: null
    };
    
    this.portFinder = new PortFinder();
  }

  /**
   * Verificar se o Node.js está instalado
   */
  async checkNodeJS() {
    return new Promise((resolve) => {
      exec('node --version', (error, stdout) => {
        if (error) {
          console.error('❌ Node.js não está instalado!');
          console.error('   Instale o Node.js em: https://nodejs.org/');
          resolve(false);
        } else {
          console.log(`✅ Node.js encontrado: ${stdout.trim()}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Verificar se o npm está instalado
   */
  async checkNPM() {
    return new Promise((resolve) => {
      exec('npm --version', (error, stdout) => {
        if (error) {
          console.error('❌ NPM não está instalado!');
          resolve(false);
        } else {
          console.log(`✅ NPM encontrado: ${stdout.trim()}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Instalar dependências do backend
   */
  async installBackendDependencies() {
    const packageJsonPath = path.join(this.backendPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json não encontrado no diretório backend');
      return false;
    }

    const nodeModulesPath = path.join(this.backendPath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Instalando dependências do backend...');
      return await this.runCommand('npm', ['install'], this.backendPath);
    }

    console.log('✅ Dependências do backend encontradas');
    return true;
  }

  /**
   * Instalar dependências do frontend
   */
  async installFrontendDependencies() {
    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json não encontrado no diretório frontend');
      return false;
    }

    const nodeModulesPath = path.join(this.frontendPath, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Instalando dependências do frontend...');
      return await this.runCommand('npm', ['install'], this.frontendPath);
    }

    console.log('✅ Dependências do frontend encontradas');
    return true;
  }

  /**
   * Executar comando com retry
   */
  async runCommand(command, args, cwd, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${retries} - Executando: ${command} ${args.join(' ')}`);
        
        const result = await new Promise((resolve, reject) => {
          const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'inherit',
            shell: this.isWindows
          });

          process.on('close', (code) => {
            if (code === 0) {
              resolve(true);
            } else {
              reject(new Error(`Comando falhou com código ${code}`));
            }
          });

          process.on('error', (error) => {
            reject(error);
          });
        });

        console.log(`✅ Comando executado com sucesso: ${command}`);
        return true;
        
      } catch (error) {
        console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
        
        if (attempt === retries) {
          console.error(`💥 Falha definitiva ao executar: ${command}`);
          return false;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  /**
   * Verificar se o servidor backend está rodando
   */
  async isBackendRunning() {
    // Try the auto-retry port first (30001), then fall back to expected port
    const testPorts = this.ports.backend === 3000 ? [30001, 3000] : [this.ports.backend];
    
    for (const port of testPorts) {
      try {
        const success = await this.testHealthEndpoint(port);
        if (success) {
          this.ports.backend = port; // Update the actual running port
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    return false;
  }

  async testHealthEndpoint(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/api/baileys-simple/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.success === true);
          } catch {
            resolve(false);
          }
        });
      });

      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Verificar se o frontend está rodando
   */
  async isFrontendRunning() {
    if (!this.ports.frontend) {
      return false;
    }
    
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.ports.frontend}`, (res) => {
        // Aceitar qualquer status 2xx ou 3xx como válido
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });

      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Detectar e configurar portas
   */
  async detectPorts() {
    try {
      console.log('🔍 Detectando portas disponíveis...');
      this.ports = await this.portFinder.findPorts();
      console.log(`✅ Portas configuradas - Frontend: ${this.ports.frontend}, Backend: ${this.ports.backend}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao detectar portas:', error.message);
      return false;
    }
  }

  /**
   * Iniciar servidor Baileys (WhatsApp)
   */
  async startBaileys() {
    if (this.baileysProcess) {
      console.log('✅ Baileys já está rodando');
      return true;
    }

    const isRunning = await this.isBackendRunning();
    if (isRunning) {
      console.log('✅ Baileys já está rodando (verificado via HTTP)');
      return true;
    }

    console.log('🚀 Iniciando servidor Baileys (WhatsApp)...');

    try {
      this.baileysProcess = spawn('node', ['simple-baileys-server.js'], {
        cwd: this.backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      this.baileysProcess.stdout.on('data', (data) => {
        console.log(`[BAILEYS] ${data.toString().trim()}`);
      });

      this.baileysProcess.stderr.on('data', (data) => {
        console.error(`[BAILEYS ERROR] ${data.toString().trim()}`);
      });

      this.baileysProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar Baileys:', error);
        this.baileysProcess = null;
      });

      this.baileysProcess.on('exit', (code) => {
        console.log(`Baileys encerrado com código: ${code}`);
        this.baileysProcess = null;
      });

      // Aguardar o Baileys iniciar
      console.log('⏳ Aguardando Baileys iniciar...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const isRunning = await this.isBackendRunning();
      if (isRunning) {
        console.log('✅ Baileys iniciado com sucesso!');
        return true;
      } else {
        console.error('❌ Falha ao iniciar Baileys');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar Baileys:', error.message);
      return false;
    }
  }

  /**
   * Iniciar servidor frontend
   */
  async startFrontend() {
    if (this.frontendProcess) {
      console.log('✅ Frontend já está rodando');
      return true;
    }

    const isRunning = await this.isFrontendRunning();
    if (isRunning) {
      console.log('✅ Frontend já está rodando (verificado via HTTP)');
      return true;
    }

    console.log(`🚀 Iniciando servidor frontend na porta ${this.ports.frontend}...`);

    try {
      // Configurar variável de ambiente para a porta
      const env = {
        ...process.env,
        VITE_PORT: this.ports.frontend,
        PORT: this.ports.frontend
      };

      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.frontendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        env: env
      });

      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[FRONTEND] ${output}`);
          
          // Detectar porta real do Vite se mudou
          const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
          if (portMatch) {
            const actualPort = parseInt(portMatch[1]);
            if (actualPort !== this.ports.frontend) {
              console.log(`🔄 Vite mudou para porta ${actualPort}, atualizando configuração...`);
              this.ports.frontend = actualPort;
            }
          }
        }
      });

      this.frontendProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          console.error(`[FRONTEND ERROR] ${error}`);
        }
      });

      this.frontendProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar frontend:', error);
        this.frontendProcess = null;
      });

      this.frontendProcess.on('exit', (code) => {
        console.log(`Frontend encerrado com código: ${code}`);
        this.frontendProcess = null;
      });

      // Aguardar o frontend iniciar
      console.log('⏳ Aguardando frontend iniciar...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      const isRunning = await this.isFrontendRunning();
      if (isRunning) {
        console.log(`✅ Frontend iniciado com sucesso na porta ${this.ports.frontend}!`);
        return true;
      } else {
        console.error('❌ Falha ao iniciar frontend');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar frontend:', error.message);
      return false;
    }
  }

  /**
   * Parar todos os processos
   */
  async stopAll() {
    console.log('🛑 Parando todos os processos...');
    
    if (this.baileysProcess) {
      this.baileysProcess.kill('SIGTERM');
      this.baileysProcess = null;
    }
    
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
      this.frontendProcess = null;
    }
    
    console.log('✅ Todos os processos parados');
  }

  /**
   * Mostrar status do sistema
   */
  async showStatus() {
    console.log('\n📊 Status do Sistema VBSolutionCRM:');
    console.log('=====================================');
    
    const baileysRunning = await this.isBackendRunning();
    const frontendRunning = await this.isFrontendRunning();
    
    console.log(`🔧 Baileys (WhatsApp): ${baileysRunning ? '✅ Rodando' : '❌ Parado'}`);
    console.log(`🌐 Frontend: ${frontendRunning ? '✅ Rodando' : '❌ Parado'}`);
    
    if (this.ports.backend) {
      console.log(`   📱 API: http://localhost:${this.ports.backend}`);
      console.log(`   🔗 Health: http://localhost:${this.ports.backend}/api/baileys-simple/health`);
    }
    
    if (this.ports.frontend) {
      console.log(`   🌐 App: http://localhost:${this.ports.frontend}`);
    }
    
    console.log('=====================================\n');
  }

  /**
   * Inicializar sistema completo
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando VBSolutionCRM com Baileys Automático...\n');
      
      // Verificar Node.js e NPM
      const nodeOk = await this.checkNodeJS();
      if (!nodeOk) {
        process.exit(1);
      }

      const npmOk = await this.checkNPM();
      if (!npmOk) {
        process.exit(1);
      }

      // Detectar portas disponíveis
      const portsOk = await this.detectPorts();
      if (!portsOk) {
        process.exit(1);
      }

      // Instalar dependências
      const backendDepsOk = await this.installBackendDependencies();
      if (!backendDepsOk) {
        process.exit(1);
      }

      const frontendDepsOk = await this.installFrontendDependencies();
      if (!frontendDepsOk) {
        process.exit(1);
      }

      // Iniciar Baileys primeiro (WhatsApp)
      const baileysOk = await this.startBaileys();
      if (!baileysOk) {
        console.error('❌ Falha ao iniciar Baileys');
        process.exit(1);
      }

      // Iniciar frontend
      const frontendOk = await this.startFrontend();
      if (!frontendOk) {
        console.error('❌ Falha ao iniciar frontend');
        process.exit(1);
      }

      // Mostrar status final
      await this.showStatus();

      console.log('🎉 VBSolutionCRM com Baileys iniciado com sucesso!');
      console.log(`🌐 Acesse: http://localhost:${this.ports.frontend}`);
      console.log(`📱 WhatsApp API: http://localhost:${this.ports.backend}`);
      console.log('\n💡 Para parar o sistema, pressione Ctrl+C');

      this.isRunning = true;

      // Manter o processo vivo e monitorar
      this.keepAlive();

    } catch (error) {
      console.error('❌ Erro ao inicializar sistema:', error.message);
      process.exit(1);
    }
  }

  /**
   * Manter o processo vivo e monitorar
   */
  keepAlive() {
    // Verificar status a cada 30 segundos
    setInterval(async () => {
      try {
        const baileysRunning = await this.isBackendRunning();
        const frontendRunning = await this.isFrontendRunning();
        
        if (!baileysRunning && this.isRunning) {
          console.log('⚠️ Baileys parou. Reiniciando...');
          await this.startBaileys();
        }
        
        if (!frontendRunning && this.isRunning) {
          console.log('⚠️ Frontend parou. Reiniciando...');
          await this.startFrontend();
        }
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error.message);
      }
    }, 30000);

    // Manter o processo vivo
    process.on('SIGINT', async () => {
      console.log('\n🛑 Parando sistema...');
      await this.stopAll();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Parando sistema...');
      await this.stopAll();
      process.exit(0);
    });
  }
}

// Função principal
async function main() {
  const starter = new AutoStartSystem();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'start':
        await starter.initialize();
        break;

      case 'status':
        await starter.showStatus();
        break;

      case 'stop':
        await starter.stopAll();
        break;

      default:
        console.log('🔄 VBSolutionCRM Auto Starter com Baileys');
        console.log('');
        console.log('Uso:');
        console.log('  node auto-start-system.js start    - Iniciar sistema completo');
        console.log('  node auto-start-system.js status   - Verificar status');
        console.log('  node auto-start-system.js stop     - Parar sistema');
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

module.exports = AutoStartSystem;
