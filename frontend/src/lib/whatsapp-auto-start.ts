/**
 * Biblioteca de Inicialização Automática do WhatsApp
 * Garante que o servidor Baileys esteja sempre rodando
 */

export class WhatsAppAutoStart {
  private static instance: WhatsAppAutoStart;
  private serverRunning = false;
  private readonly baseUrl = 'http://localhost:3000';

  private constructor() {}

  static getInstance(): WhatsAppAutoStart {
    if (!WhatsAppAutoStart.instance) {
      WhatsAppAutoStart.instance = new WhatsAppAutoStart();
    }
    return WhatsAppAutoStart.instance;
  }

  /**
   * Verificar se o servidor está rodando
   */
  async isServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/baileys-simple/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.serverRunning = data.success === true;
        return this.serverRunning;
      }
      
      return false;
    } catch (error) {
      console.warn('Servidor não está rodando:', error);
      return false;
    }
  }

  /**
   * Iniciar servidor automaticamente (on-demand)
   */
  async startServer(): Promise<boolean> {
    try {
      console.log('🚀 Iniciando servidor WhatsApp automaticamente...');
      
      // Tentar iniciar via API (se houver endpoint de inicialização)
      const response = await fetch(`${this.baseUrl}/api/baileys-simple/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        this.serverRunning = true;
        console.log('✅ Servidor iniciado via API');
        return true;
      }
    } catch (error) {
      console.warn('Não foi possível iniciar via API:', error);
    }

    // Se não conseguir via API, mostrar instruções para o usuário
    console.warn('⚠️ Servidor não está rodando. Execute:');
    console.warn('   node universal-start.js backend');
    console.warn('   ou');
    console.warn('   cd backend && node persistent-baileys-server.js');
    
    return false;
  }

  /**
   * Garantir que o servidor esteja rodando
   */
  async ensureServerRunning(): Promise<boolean> {
    const isRunning = await this.isServerRunning();
    
    if (isRunning) {
      this.serverRunning = true;
      return true;
    }

    return await this.startServer();
  }

  /**
   * Criar nova conexão WhatsApp
   */
  async createConnection(name: string = 'Nova Conexão'): Promise<any> {
    try {
      // Garantir que o servidor esteja rodando
      const serverOk = await this.ensureServerRunning();
      
      if (!serverOk) {
        throw new Error('Servidor WhatsApp não está disponível');
      }

      console.log(`🔄 Criando conexão: ${name}`);

      const response = await fetch(`${this.baseUrl}/api/baileys-simple/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type: 'whatsapp_baileys'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Conexão criada com sucesso!');
        console.log(`📱 Connection ID: ${result.data.connectionId}`);
        console.log(`📱 QR Code disponível: ${result.data.qrCode ? 'Sim' : 'Não'}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao criar conexão');
      }
    } catch (error) {
      console.error('❌ Erro ao criar conexão:', error);
      throw error;
    }
  }

  /**
   * Obter QR Code de uma conexão
   */
  async getQRCode(connectionId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/baileys-simple/connections/${connectionId}/qr`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return result.data.qrCode;
      } else {
        throw new Error(result.error || 'Erro ao obter QR Code');
      }
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      return null;
    }
  }

  /**
   * Listar conexões ativas
   */
  async listConnections(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/baileys-simple/connections`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao listar conexões');
      }
    } catch (error) {
      console.error('❌ Erro ao listar conexões:', error);
      return [];
    }
  }

  /**
   * Verificar status do servidor
   */
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/baileys-simple/health`);
      
      if (response.ok) {
        return await response.json();
      } else {
        return {
          success: false,
          error: `Erro HTTP: ${response.status}`,
          isRunning: false
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isRunning: false
      };
    }
  }
}

// Exportar instância singleton
export const whatsappAutoStart = WhatsAppAutoStart.getInstance();
