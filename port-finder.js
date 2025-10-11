#!/usr/bin/env node

/**
 * Port Finder - Sistema Universal de Detecção de Portas
 * Encontra portas disponíveis automaticamente em qualquer sistema
 */

const net = require('net');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class PortFinder {
  constructor() {
    this.defaultPorts = {
      frontend: [5173, 5174, 5175, 3000, 3001, 8080, 8081],
      backend: [30001, 30002, 30003, 3000, 3001, 8000, 8001, 8080, 8081]
    };
  }

  /**
   * Verificar se uma porta está disponível
   */
  async isPortAvailable(port, host = 'localhost') {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, host, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Verificar se um serviço está rodando em uma porta
   */
  async isServiceRunning(port, path = '/', timeout = 2000) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}${path}`, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });

      req.on('error', () => resolve(false));
      req.setTimeout(timeout, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Obter PID do processo que está usando uma porta
   */
  async getProcessUsingPort(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      return pids.length > 0 ? pids[0] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar se o processo é nosso próprio serviço
   */
  async isOurService(port, serviceType) {
    try {
      const isRunning = await this.isServiceRunning(port, serviceType === 'backend' ? '/api/baileys-simple/health' : '/');
      return isRunning;
    } catch (error) {
      return false;
    }
  }

  /**
   * Matar processo que está usando uma porta (apenas se não for nosso serviço)
   */
  async killProcessOnPort(port, serviceType) {
    try {
      const pid = await this.getProcessUsingPort(port);
      if (!pid) return false;

      // Verificar se é nosso próprio serviço
      const isOurService = await this.isOurService(port, serviceType);
      if (isOurService) {
        console.log(`🔄 Reutilizando porta ${port} (nosso próprio serviço)`);
        return true;
      }

      console.log(`⚠️ Processo ${pid} está usando a porta ${port}, tentando liberar...`);
      
      // Tentar matar o processo
      await execAsync(`kill -9 ${pid}`);
      console.log(`✅ Processo ${pid} finalizado, porta ${port} liberada`);
      
      // Aguardar um pouco para a porta ser liberada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.warn(`⚠️ Não foi possível liberar a porta ${port}:`, error.message);
      return false;
    }
  }

  /**
   * Tentar liberar porta automaticamente
   */
  async tryFreePort(port, serviceType) {
    const isAvailable = await this.isPortAvailable(port);
    if (isAvailable) return true;

    console.log(`🔍 Porta ${port} não está disponível, tentando liberar...`);
    
    const freed = await this.killProcessOnPort(port, serviceType);
    if (freed) {
      // Verificar novamente se a porta está disponível
      return await this.isPortAvailable(port);
    }
    
    return false;
  }

  /**
   * Encontrar porta disponível para frontend
   */
  async findFrontendPort() {
    console.log('🔍 Procurando porta disponível para frontend...');
    
    for (const port of this.defaultPorts.frontend) {
      // Tentar liberar a porta se estiver ocupada
      const isAvailable = await this.tryFreePort(port, 'frontend');
      const isRunning = await this.isServiceRunning(port);
      
      if (isAvailable || isRunning) {
        console.log(`✅ Porta ${port} ${isRunning ? 'já em uso (reutilizando)' : 'disponível'} para frontend`);
        return port;
      }
    }
    
    // Se não encontrar nas portas padrão, procurar qualquer porta disponível
    for (let port = 3000; port <= 9999; port++) {
      const isAvailable = await this.tryFreePort(port, 'frontend');
      if (isAvailable) {
        console.log(`✅ Porta ${port} encontrada para frontend`);
        return port;
      }
    }
    
    throw new Error('Nenhuma porta disponível encontrada para frontend');
  }

  /**
   * Encontrar porta disponível para backend
   */
  async findBackendPort() {
    console.log('🔍 Procurando porta disponível para backend...');
    
    for (const port of this.defaultPorts.backend) {
      // Tentar liberar a porta se estiver ocupada
      const isAvailable = await this.tryFreePort(port, 'backend');
      const isRunning = await this.isServiceRunning(port, '/api/baileys-simple/health');
      
      if (isAvailable || isRunning) {
        console.log(`✅ Porta ${port} ${isRunning ? 'já em uso (reutilizando)' : 'disponível'} para backend`);
        return port;
      }
    }
    
    // Se não encontrar nas portas padrão, procurar qualquer porta disponível
    for (let port = 3000; port <= 9999; port++) {
      const isAvailable = await this.tryFreePort(port, 'backend');
      if (isAvailable) {
        console.log(`✅ Porta ${port} encontrada para backend`);
        return port;
      }
    }
    
    throw new Error('Nenhuma porta disponível encontrada para backend');
  }

  /**
   * Detectar portas atualmente em uso
   */
  async detectRunningServices() {
    console.log('🔍 Detectando serviços em execução...');
    
    const services = {
      frontend: null,
      backend: null
    };

    // Verificar portas comuns do frontend
    for (const port of this.defaultPorts.frontend) {
      const isRunning = await this.isServiceRunning(port);
      if (isRunning) {
        services.frontend = port;
        console.log(`🌐 Frontend detectado na porta ${port}`);
        break;
      }
    }

    // Verificar portas comuns do backend
    for (const port of this.defaultPorts.backend) {
      const isRunning = await this.isServiceRunning(port, '/api/baileys-simple/health');
      if (isRunning) {
        services.backend = port;
        console.log(`🔧 Backend detectado na porta ${port}`);
        break;
      }
    }

    return services;
  }

  /**
   * Limpar todas as portas conflitantes (modo agressivo)
   */
  async cleanupAllConflicts() {
    console.log('🧹 Limpando conflitos de porta...');
    
    const portsToCheck = [...this.defaultPorts.frontend, ...this.defaultPorts.backend];
    const cleanedPorts = [];
    
    for (const port of portsToCheck) {
      const pid = await this.getProcessUsingPort(port);
      if (pid) {
        const isOurService = await this.isOurService(port, 'backend') || await this.isOurService(port, 'frontend');
        if (!isOurService) {
          try {
            await execAsync(`kill -9 ${pid}`);
            console.log(`✅ Processo ${pid} na porta ${port} finalizado`);
            cleanedPorts.push(port);
          } catch (error) {
            console.warn(`⚠️ Não foi possível finalizar processo ${pid} na porta ${port}`);
          }
        }
      }
    }
    
    if (cleanedPorts.length > 0) {
      console.log(`🧹 ${cleanedPorts.length} portas limpas: ${cleanedPorts.join(', ')}`);
      // Aguardar um pouco para as portas serem liberadas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return cleanedPorts;
  }

  /**
   * Encontrar portas para ambos os serviços
   */
  async findPorts(aggressiveCleanup = false) {
    console.log('🚀 Iniciando detecção de portas...\n');
    
    // Limpeza agressiva se solicitada
    if (aggressiveCleanup) {
      await this.cleanupAllConflicts();
    }
    
    const runningServices = await this.detectRunningServices();
    
    const ports = {
      frontend: runningServices.frontend || await this.findFrontendPort(),
      backend: runningServices.backend || await this.findBackendPort()
    };

    console.log('\n📊 Portas detectadas:');
    console.log(`🌐 Frontend: ${ports.frontend}`);
    console.log(`🔧 Backend: ${ports.backend}`);
    
    return ports;
  }
}

// Função principal para uso direto
async function main() {
  const finder = new PortFinder();
  
  try {
    const ports = await finder.findPorts();
    console.log('\n✅ Detecção de portas concluída com sucesso!');
    return ports;
  } catch (error) {
    console.error('❌ Erro na detecção de portas:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PortFinder;
