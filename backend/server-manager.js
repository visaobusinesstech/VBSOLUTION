const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ServerManager {
  constructor() {
    this.serverProcess = null;
    this.isRunning = false;
    this.pidFile = path.join(__dirname, 'baileys-server.pid');
    this.logFile = path.join(__dirname, 'baileys-server.log');
  }

  async startServer() {
    if (this.isRunning) {
      console.log('✅ Servidor já está rodando');
      return true;
    }

    try {
      console.log('🚀 Iniciando servidor Baileys...');
      
      // Iniciar o servidor em background
      this.serverProcess = spawn('node', ['simple-baileys-server.js'], {
        cwd: __dirname,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Salvar PID do processo
      fs.writeFileSync(this.pidFile, this.serverProcess.pid.toString());
      
      // Configurar logs
      const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
      this.serverProcess.stdout.pipe(logStream);
      this.serverProcess.stderr.pipe(logStream);

      this.serverProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar servidor:', error);
        this.isRunning = false;
      });

      this.serverProcess.on('exit', (code) => {
        console.log(`🔄 Servidor encerrado com código: ${code}`);
        this.isRunning = false;
        this.cleanup();
      });

      // Aguardar um pouco para o servidor inicializar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se o servidor está respondendo
      const isHealthy = await this.checkServerHealth();
      
      if (isHealthy) {
        this.isRunning = true;
        console.log('✅ Servidor Baileys iniciado com sucesso!');
        return true;
      } else {
        console.log('⚠️ Servidor iniciado mas não está respondendo');
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      return false;
    }
  }

  async checkServerHealth() {
    try {
      const response = await fetch('http://localhost:3000/api/test');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async stopServer() {
    if (!this.isRunning && !this.serverProcess) {
      console.log('ℹ️ Servidor não está rodando');
      return;
    }

    try {
      if (this.serverProcess) {
        this.serverProcess.kill('SIGTERM');
        this.serverProcess = null;
      }

      // Tentar parar por PID se existir
      if (fs.existsSync(this.pidFile)) {
        const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
        try {
          process.kill(pid, 'SIGTERM');
        } catch (e) {
          // Processo já encerrado
        }
        this.cleanup();
      }

      this.isRunning = false;
      console.log('🛑 Servidor Baileys parado');
    } catch (error) {
      console.error('❌ Erro ao parar servidor:', error);
    }
  }

  cleanup() {
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
  }

  async ensureServerRunning() {
    const isHealthy = await this.checkServerHealth();
    
    if (!isHealthy) {
      console.log('🔄 Servidor não está respondendo, reiniciando...');
      await this.stopServer();
      return await this.startServer();
    }
    
    return true;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.serverProcess ? this.serverProcess.pid : null,
      hasPidFile: fs.existsSync(this.pidFile)
    };
  }
}

// Se executado diretamente, iniciar o servidor
if (require.main === module) {
  const manager = new ServerManager();
  
  // Iniciar servidor
  manager.startServer().then(success => {
    if (success) {
      console.log('🎉 Servidor Baileys está rodando!');
      console.log('📱 API disponível em: http://localhost:3000/api');
      console.log('🔗 Teste: http://localhost:3000/api/test');
      
      // Manter o processo vivo
      process.on('SIGINT', async () => {
        console.log('\n🛑 Parando servidor...');
        await manager.stopServer();
        process.exit(0);
      });
      
      // Verificar saúde periodicamente
      setInterval(async () => {
        const isHealthy = await manager.checkServerHealth();
        if (!isHealthy && manager.isRunning) {
          console.log('⚠️ Servidor não está respondendo, reiniciando...');
          await manager.ensureServerRunning();
        }
      }, 30000); // Verificar a cada 30 segundos
      
    } else {
      console.log('❌ Falha ao iniciar servidor');
      process.exit(1);
    }
  });
}

module.exports = ServerManager;