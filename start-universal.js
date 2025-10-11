#!/usr/bin/env node

/**
 * Sistema Universal de Inicialização VBSolutionCRM
 * Funciona em qualquer sistema operacional (Windows, macOS, Linux)
 * Detecta automaticamente portas disponíveis
 * Inicializa Baileys automaticamente
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const PortFinder = require('./port-finder');

class UniversalStartSystem {
  constructor() {
    this.projectRoot = __dirname;
    this.backendPath = path.join(this.projectRoot, 'backend');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.isWindows = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';
    
    this.backendProcess = null;
    this.frontendProcess = null;
    this.isRunning = false;
    
    // Portas dinâmicas
    this.ports = {
      frontend: null,
      backend: null
    };
    
    this.portFinder = new PortFinder();
    
    console.log(`🖥️ Sistema operacional detectado: ${this.getOSName()}`);
  }

  /**
   * Obter nome do sistema operacional
   */
  getOSName() {
    if (this.isWindows) return 'Windows';
    if (this.isMac) return 'macOS';
    if (this.isLinux) return 'Linux';
    return 'Desconhecido';
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
   * Detectar e configurar portas
   */
  async detectPorts() {
    try {
      console.log('🔍 Detectando portas disponíveis...');
      
      // Forçar portas específicas conforme solicitado
      this.ports = {
        frontend: 5173,
        backend: 3000
      };
      
      console.log(`✅ Portas configuradas - Frontend: ${this.ports.frontend}, Backend: ${this.ports.backend}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao detectar portas:', error.message);
      return false;
    }
  }

  /**
   * Instalar dependências se necessário
   */
  async installDependencies() {
    console.log('📦 Verificando dependências...');
    
    // Backend
    const backendNodeModules = path.join(this.backendPath, 'node_modules');
    if (!fs.existsSync(backendNodeModules)) {
      console.log('📦 Instalando dependências do backend...');
      const backendOk = await this.runCommand('npm', ['install'], this.backendPath);
      if (!backendOk) return false;
    }

    // Frontend
    const frontendNodeModules = path.join(this.frontendPath, 'node_modules');
    if (!fs.existsSync(frontendNodeModules)) {
      console.log('📦 Instalando dependências do frontend...');
      const frontendOk = await this.runCommand('npm', ['install'], this.frontendPath);
      if (!frontendOk) return false;
    }

    console.log('✅ Dependências verificadas');
    return true;
  }

  /**
   * Executar comando com retry
   */
  async runCommand(command, args, cwd, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
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

        return true;
      } catch (error) {
        if (attempt === retries) {
          console.error(`💥 Falha definitiva ao executar: ${command}`);
          return false;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  /**
   * Verificar se o backend está rodando
   */
  async isBackendRunning() {
    if (!this.ports.backend) return false;
    
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.ports.backend}/api/baileys-simple/health`, (res) => {
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
    if (!this.ports.frontend) return false;
    
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${this.ports.frontend}`, (res) => {
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
   * Iniciar servidor backend (Baileys)
   */
  async startBackend() {
    if (this.backendProcess) {
      console.log('✅ Backend já está rodando');
      return true;
    }

    const isRunning = await this.isBackendRunning();
    if (isRunning) {
      console.log('✅ Backend já está rodando (verificado via HTTP)');
      return true;
    }

    console.log(`🚀 Iniciando servidor backend na porta ${this.ports.backend}...`);

    try {
      this.backendProcess = spawn('node', ['simple-baileys-server.js'], {
        cwd: this.backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          PORT: this.ports.backend
        }
      });

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          console.log(`[BACKEND] ${output}`);
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          console.error(`[BACKEND ERROR] ${error}`);
        }
      });

      this.backendProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar backend:', error);
        this.backendProcess = null;
      });

      this.backendProcess.on('exit', (code) => {
        console.log(`Backend encerrado com código: ${code}`);
        this.backendProcess = null;
      });

      // Aguardar o backend iniciar
      console.log('⏳ Aguardando backend iniciar...');
      await new Promise(resolve => setTimeout(resolve, 8000));

      const isRunning = await this.isBackendRunning();
      if (isRunning) {
        console.log(`✅ Backend iniciado com sucesso na porta ${this.ports.backend}!`);
        return true;
      } else {
        console.error('❌ Falha ao iniciar backend');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar backend:', error.message);
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
      this.frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.frontendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        env: {
          ...process.env,
          VITE_PORT: this.ports.frontend,
          PORT: this.ports.frontend
        }
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

      // Aguardar o frontend iniciar e detectar porta real
      console.log('⏳ Aguardando frontend iniciar...');
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Aguardar um pouco mais para garantir que a porta foi atualizada
      await new Promise(resolve => setTimeout(resolve, 5000));

      const isRunning = await this.isFrontendRunning();
      if (isRunning) {
        console.log(`✅ Frontend iniciado com sucesso na porta ${this.ports.frontend}!`);
        return true;
      } else {
        console.error('❌ Falha ao iniciar frontend');
        console.log(`🔍 Tentando detectar porta real do frontend...`);
        
        // Tentar detectar a porta real do frontend
        for (let port = 5173; port <= 5180; port++) {
          const testRunning = await new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}`, (res) => {
              resolve(res.statusCode >= 200 && res.statusCode < 500);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(2000, () => {
              req.destroy();
              resolve(false);
            });
          });
          
          if (testRunning) {
            console.log(`✅ Frontend encontrado na porta ${port}!`);
            this.ports.frontend = port;
            return true;
          }
        }
        
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
    
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
      this.backendProcess = null;
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
    
    const backendRunning = await this.isBackendRunning();
    const frontendRunning = await this.isFrontendRunning();
    
    console.log(`🔧 Backend (Baileys): ${backendRunning ? '✅ Rodando' : '❌ Parado'}`);
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
      console.log('🚀 Inicializando VBSolutionCRM Universal...\n');
      
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
      const depsOk = await this.installDependencies();
      if (!depsOk) {
        process.exit(1);
      }

      // Iniciar backend (Baileys)
      const backendOk = await this.startBackend();
      if (!backendOk) {
        console.error('❌ Falha ao iniciar backend');
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

      console.log('🎉 VBSolutionCRM Universal iniciado com sucesso!');
      console.log(`🌐 Acesse: http://localhost:${this.ports.frontend}`);
      console.log(`📱 WhatsApp API: http://localhost:${this.ports.backend}`);
      console.log('\n💡 Para parar o sistema, pressione Ctrl+C');

      this.isRunning = true;

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

    } catch (error) {
      console.error('❌ Erro ao inicializar sistema:', error.message);
      process.exit(1);
    }
  }
}

// Função principal
async function main() {
  const starter = new UniversalStartSystem();
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
        console.log('🔄 VBSolutionCRM Universal Starter');
        console.log('');
        console.log('Uso:');
        console.log('  node start-universal.js start    - Iniciar sistema completo');
        console.log('  node start-universal.js status   - Verificar status');
        console.log('  node start-universal.js stop     - Parar sistema');
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

module.exports = UniversalStartSystem;
