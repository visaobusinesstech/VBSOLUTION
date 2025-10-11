/**
 * Rate Limiter para Supabase
 * Previne requisições excessivas que causam ERR_INSUFFICIENT_RESOURCES
 */

class SupabaseRateLimiter {
  private static instance: SupabaseRateLimiter;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private readonly MIN_INTERVAL = 100; // 100ms entre requisições
  private readonly MAX_CONCURRENT = 3; // Máximo 3 requisições simultâneas
  private activeRequests = 0;

  private constructor() {}

  static getInstance(): SupabaseRateLimiter {
    if (!SupabaseRateLimiter.instance) {
      SupabaseRateLimiter.instance = new SupabaseRateLimiter();
    }
    return SupabaseRateLimiter.instance;
  }

  private generateKey(operation: string, params: any): string {
    return `${operation}_${JSON.stringify(params)}`;
  }

  async execute<T>(
    operation: string,
    params: any,
    executor: () => Promise<T>
  ): Promise<T> {
    const key = this.generateKey(operation, params);
    
    // Se já existe uma requisição em andamento para a mesma operação
    if (this.requestQueue.has(key)) {
      console.log(`🔄 [RATE-LIMITER] Reutilizando requisição em andamento: ${operation}`);
      return this.requestQueue.get(key)!;
    }

    // Rate limiting
    const lastTime = this.lastRequestTime.get(key) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastTime;

    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      const delay = this.MIN_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ [RATE-LIMITER] Aguardando ${delay}ms antes da próxima requisição: ${operation}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Limite de requisições simultâneas
    if (this.activeRequests >= this.MAX_CONCURRENT) {
      console.log(`🚫 [RATE-LIMITER] Limite de requisições simultâneas atingido. Aguardando...`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.activeRequests++;
    this.lastRequestTime.set(key, Date.now());

    const promise = executor()
      .then(result => {
        this.activeRequests--;
        this.requestQueue.delete(key);
        return result;
      })
      .catch(error => {
        this.activeRequests--;
        this.requestQueue.delete(key);
        throw error;
      });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // Método para limpar cache de requisições antigas
  cleanup() {
    const now = Date.now();
    const maxAge = 30000; // 30 segundos

    for (const [key, time] of this.lastRequestTime.entries()) {
      if (now - time > maxAge) {
        this.lastRequestTime.delete(key);
        this.requestQueue.delete(key);
      }
    }
  }
}

export const supabaseRateLimiter = SupabaseRateLimiter.getInstance();

// Cleanup automático a cada 30 segundos
setInterval(() => {
  supabaseRateLimiter.cleanup();
}, 30000);
