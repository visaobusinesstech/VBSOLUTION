// Utilitários para limpeza e validação de URLs de mídia

export function cleanMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Remove caracteres inválidos que causam 400 errors
  return url
    .replace(/;%20codecs=opus/g, '')
    .replace(/;%20/g, '')
    .replace(/;codecs=opus/g, '')
    .replace(/;codecs/g, '')
    .trim();
}

export function isValidMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  const cleanedUrl = cleanMediaUrl(url);
  
  // Verificar se é uma URL válida
  if (!cleanedUrl.startsWith('http')) return false;
  
  // Verificar se não contém caracteres problemáticos
  if (cleanedUrl.includes(';%20') || cleanedUrl.includes(';codecs')) return false;
  
  // Verificar se não é uma URL localhost quebrada
  if (cleanedUrl.includes('localhost:3000/api/media')) return false;
  
  // Verificar se não é uma URL mmg quebrada
  if (cleanedUrl.includes('/mmg') || cleanedUrl.endsWith('mmg')) return false;
  
  // Verificar se não contém caracteres especiais problemáticos
  if (cleanedUrl.includes('%20codecs') || cleanedUrl.includes('codecs=opus')) return false;
  
  return true;
}

export function sanitizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const cleaned = cleanMediaUrl(url);
  
  if (!isValidMediaUrl(cleaned)) {
    return null;
  }
  
  return cleaned;
}
