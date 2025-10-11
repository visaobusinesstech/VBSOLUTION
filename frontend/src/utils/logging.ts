/**
 * Production-safe logging that removes console spam in prod builds
 * Como Respond.io - zero noise console para performance máxima
 */

const isDevelopment = import.meta.env.DEV;
const DEBOUNCE_TIME = 100;

class CleanLogger {
  private cache = new Map<string, number>();

  /**
   * Só log em desenvolvimento, e debounced para evitar spam
   */
  warn(message: string, context?: any) {
    if (!isDevelopment) return;
    
    const key = message;
    const now = Date.now();
    
    if (this.cache.has(key) && now - this.cache.get(key)! < DEBOUNCE_TIME) {
      return;
    }
    
    this.cache.set(key, now);
    console.warn(message, context);
  }

  /**
   * Mensagens importantes mantidas mesmo em prod (erros críticos)
   */
  error(message: string, error?: any) {
    console.error(message, error);
  }

  /**
   * Debug logs removidos em produção completamente
   */
  debug(...args: any[]) {
    if (!isDevelopment) return;
    console.log(...args);
  }

  /**
   * Performance logs em desenvolvimento só
   */
  performance(message: string, context?: any) {
    if (!isDevelopment) return;
    this.warn(`🚀 ${message}`, context);
  }
}

export const logger = new CleanLogger();
