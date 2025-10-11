class BaileysServerManager {
  private static instance: BaileysServerManager;
  private serverUrl = 'http://localhost:3000';
  private isStarting = false;

  private constructor() {}

  static getInstance(): BaileysServerManager {
    if (!BaileysServerManager.instance) {
      BaileysServerManager.instance = new BaileysServerManager();
    }
    return BaileysServerManager.instance;
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.log('🔍 Servidor não está respondendo:', error);
      return false;
    }
  }

  async ensureServerRunning(): Promise<boolean> {
    // Verificar se já está verificando/iniciando
    if (this.isStarting) {
      console.log('⏳ Servidor já está sendo iniciado...');
      return false;
    }

    // Verificar se o servidor já está rodando
    const isHealthy = await this.checkServerHealth();
    if (isHealthy) {
      console.log('✅ Servidor Baileys já está rodando');
      return true;
    }

    console.log('🚀 Iniciando servidor Baileys...');
    this.isStarting = true;

    try {
      // Tentar iniciar o servidor via API (se houver endpoint para isso)
      const response = await fetch(`${this.serverUrl}/api/start-server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Aguardar o servidor inicializar
        await this.waitForServer();
        this.isStarting = false;
        return true;
      } else {
        throw new Error('Falha ao iniciar servidor via API');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível iniciar via API, tentando método alternativo...');
      
      // Método alternativo: mostrar instruções para o usuário
      this.showServerInstructions();
      this.isStarting = false;
      return false;
    }
  }

  private async waitForServer(maxAttempts = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      
      const isHealthy = await this.checkServerHealth();
      if (isHealthy) {
        console.log('✅ Servidor Baileys iniciado com sucesso!');
        return true;
      }
      
      console.log(`⏳ Aguardando servidor inicializar... (${i + 1}/${maxAttempts})`);
    }
    
    console.log('❌ Timeout: Servidor não iniciou a tempo');
    return false;
  }

  private showServerInstructions() {
    const instructions = `
🚀 Para iniciar o servidor Baileys, execute no terminal:

cd /Users/guilhermemartins/Documents/1\\ -\\ PROJECTS/VBSolutionCRM/backend
node simple-baileys-server.js

Ou use o comando:
cd backend && node simple-baileys-server.js
    `;
    
    console.log(instructions);
    
    // Mostrar notificação para o usuário (se disponível)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Servidor Baileys', {
          body: 'Execute o comando no terminal para iniciar o servidor',
          icon: '/favicon.ico'
        });
      }
    }
  }

  async getServerStatus() {
    const isHealthy = await this.checkServerHealth();
    return {
      isRunning: isHealthy,
      url: this.serverUrl,
      isStarting: this.isStarting
    };
  }
}

export default BaileysServerManager;
