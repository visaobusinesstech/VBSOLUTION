/**
 * Função utilitária para fazer requisições HTTP com tratamento robusto de erros
 */
export async function safeFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Verificar se a resposta é válida
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Verificar se o conteúdo é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Resposta não é JSON para ${url}, content-type: ${contentType}`);
      throw new Error('Resposta não é JSON válido');
    }

    // Tentar fazer o parse do JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    throw error;
  }
}

/**
 * Função para fazer requisições com fallback para dados mock
 */
export async function fetchWithFallback<T>(
  url: string, 
  options: RequestInit = {}, 
  fallbackData: T
): Promise<T> {
  try {
    return await safeFetch<T>(url, options);
  } catch (error) {
    console.warn(`Usando dados mock para ${url}:`, error);
    return fallbackData;
  }
}

/**
 * Função para verificar se uma string é JSON válido
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Função para extrair informações de erro de uma resposta HTML
 */
export function extractErrorFromHTML(html: string): string {
  // Tentar extrair mensagem de erro de páginas HTML comuns
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    return `Erro: ${titleMatch[1]}`;
  }
  
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return `Erro: ${h1Match[1]}`;
  }
  
  return 'Erro desconhecido - resposta não é JSON válido';
}
