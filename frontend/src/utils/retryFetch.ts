// Utilitário para retry de requisições com backoff exponencial
export const retryFetch = async <T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      // Se é o último attempt, lança o erro
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Se é um erro de rede, tenta novamente
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} falhou, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Se não é erro de rede, não tenta novamente
      throw lastError;
    }
  }
  
  throw lastError!;
};

// Debounce para evitar múltiplas requisições simultâneas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Cache simples para evitar requisições desnecessárias
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutos

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();
