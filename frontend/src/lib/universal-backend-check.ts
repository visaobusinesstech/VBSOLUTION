/**
 * Verificação Universal do Backend
 * Este módulo garante que o backend esteja sempre rodando
 */

export class UniversalBackendChecker {
  private static instance: UniversalBackendChecker;
  private backendUrl = 'http://localhost:3000';
  private checkInterval: NodeJS.Timeout | null = null;
  private isBackendRunning = false;
  private retryCount = 0;
  private maxRetries = 10;

  private constructor() {}

  static getInstance(): UniversalBackendChecker {
    if (!UniversalBackendChecker.instance) {
      UniversalBackendChecker.instance = new UniversalBackendChecker();
    }
    return UniversalBackendChecker.instance;
  }

  /**
   * Verificar se o backend está rodando
   */
  async checkBackendStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/baileys-simple/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.isBackendRunning = data.success === true;
        return this.isBackendRunning;
      }
      
      this.isBackendRunning = false;
      return false;
    } catch (error) {
      console.warn('Backend não está rodando:', error);
      this.isBackendRunning = false;
      return false;
    }
  }

  /**
   * Iniciar verificação contínua do backend
   */
  startBackendMonitoring(): void {
    if (this.checkInterval) {
      return; // Já está monitorando
    }

    console.log('🔄 Iniciando monitoramento do backend...');
    
    this.checkInterval = setInterval(async () => {
      const isRunning = await this.checkBackendStatus();
      
      if (!isRunning && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`⚠️ Backend não está rodando. Tentativa ${this.retryCount}/${this.maxRetries}`);
        
        // Mostrar instruções para o usuário
        if (this.retryCount === 1) {
          this.showBackendInstructions();
        }
      } else if (isRunning) {
        this.retryCount = 0;
        if (!this.isBackendRunning) {
          console.log('✅ Backend conectado!');
          this.isBackendRunning = true;
          // Emitir evento de reconexão
          window.dispatchEvent(new CustomEvent('backendReconnected'));
        }
      }
    }, 5000); // Verificar a cada 5 segundos
  }

  /**
   * Parar monitoramento do backend
   */
  stopBackendMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Monitoramento do backend parado');
    }
  }

  /**
   * Mostrar instruções para iniciar o backend
   */
  private showBackendInstructions(): void {
    console.log('🚀 Para iniciar o backend, execute:');
    console.log('   node universal-start.js start');
    console.log('   ou');
    console.log('   cd backend && node persistent-baileys-server.js');
  }

  /**
   * Verificar se o backend está rodando (sincrono)
   */
  isBackendAvailable(): boolean {
    return this.isBackendRunning;
  }

  /**
   * Obter URL do backend
   */
  getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Aguardar o backend ficar disponível
   */
  async waitForBackend(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isRunning = await this.checkBackendStatus();
      if (isRunning) {
        return true;
      }
      
      // Aguardar 2 segundos antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false;
  }
}

// Exportar instância singleton
export const universalBackendChecker = UniversalBackendChecker.getInstance();

// Não inicializar automaticamente - apenas quando necessário
// O monitoramento será iniciado apenas quando o usuário tentar criar uma conexão
