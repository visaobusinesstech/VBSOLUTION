// Sistema de chunking inteligente para mensagens longas
export interface SmartChunk {
  content: string
  index: number
  totalChunks: number
  isLastChunk: boolean
}

export interface ChunkingOptions {
  maxChars?: number
  minChunkSize?: number
  preserveSentences?: boolean
  respectPunctuation?: boolean
  groupSemantically?: boolean
}

export class SmartChunking {
  private static instance: SmartChunking

  public static getInstance(): SmartChunking {
    if (!SmartChunking.instance) {
      SmartChunking.instance = new SmartChunking()
    }
    return SmartChunking.instance
  }

  public chunkMessage(
    message: string, 
    options: ChunkingOptions = {}
  ): SmartChunk[] {
    const {
      maxChars = 150,
      minChunkSize = 50,
      preserveSentences = true,
      respectPunctuation = true,
      groupSemantically = true
    } = options

    if (message.length <= maxChars) {
      return [{
        content: message,
        index: 0,
        totalChunks: 1,
        isLastChunk: true
      }]
    }

    const chunks: SmartChunk[] = []
    let currentIndex = 0
    let chunkIndex = 0

    while (currentIndex < message.length) {
      let chunkEnd = currentIndex + maxChars
      
      // Se não é o último chunk possível
      if (chunkEnd < message.length) {
        // Estratégia 1: Preservar frases completas (prioridade máxima)
        if (preserveSentences) {
          const sentenceEnd = this.findSentenceEnd(message, currentIndex, chunkEnd)
          if (sentenceEnd > currentIndex) {
            chunkEnd = sentenceEnd
          }
        }
        
        // Estratégia 2: Respeitar pontuação (segunda prioridade)
        if (respectPunctuation && chunkEnd < message.length) {
          const punctuationEnd = this.findPunctuationBreak(message, currentIndex, chunkEnd)
          if (punctuationEnd > currentIndex && punctuationEnd > chunkEnd - 20) {
            chunkEnd = punctuationEnd
          }
        }
        
        // Estratégia 3: Quebra em palavras completas (terceira prioridade)
        if (chunkEnd < message.length) {
          const wordBreak = this.findWordBreak(message, currentIndex, chunkEnd)
          if (wordBreak > currentIndex) {
            // Preferir quebra em palavras se não for muito longe do limite
            if (wordBreak > chunkEnd - 20) {
              chunkEnd = wordBreak
            } else {
              // Se a quebra em palavra está muito longe, procurar por quebra mais próxima
              const closerWordBreak = this.findWordBreak(message, currentIndex, Math.min(chunkEnd + 10, message.length))
              if (closerWordBreak > currentIndex && closerWordBreak <= chunkEnd + 10) {
                chunkEnd = closerWordBreak
              }
            }
          }
        }
        
        // Estratégia 4: Agrupamento semântico (quarta prioridade)
        if (groupSemantically && chunkEnd < message.length) {
          const semanticEnd = this.findSemanticBreak(message, currentIndex, chunkEnd)
          if (semanticEnd > currentIndex && semanticEnd > chunkEnd - 15) {
            chunkEnd = semanticEnd
          }
        }
        
        // Estratégia 5: Detectar e preservar listas e estruturas especiais
        if (chunkEnd < message.length) {
          const listBreak = this.findListBreak(message, currentIndex, chunkEnd)
          if (listBreak > currentIndex) {
            chunkEnd = listBreak
          }
        }
        
        // Garantir tamanho mínimo (mas não quebrar palavras importantes)
        if (chunkEnd - currentIndex < minChunkSize && chunkEnd < message.length) {
          const safeEnd = Math.min(currentIndex + minChunkSize, message.length)
          // Tentar encontrar uma quebra segura próxima
          const safeBreak = this.findSafeBreak(message, currentIndex, safeEnd)
          chunkEnd = safeBreak > currentIndex ? safeBreak : safeEnd
        }
      } else {
        // Último chunk - pegar todo o resto
        chunkEnd = message.length
      }

      const chunkContent = message.slice(currentIndex, chunkEnd).trim()
      
      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunkIndex,
          totalChunks: 0, // Será atualizado depois
          isLastChunk: chunkEnd >= message.length
        })
        chunkIndex++
      }

      currentIndex = chunkEnd
    }

    // Atualizar totalChunks em todos os chunks
    chunks.forEach(chunk => {
      chunk.totalChunks = chunks.length
    })

    return chunks
  }

  /**
   * Encontra quebra segura em palavras completas
   */
  private findWordBreak(message: string, start: number, maxEnd: number): number {
    // Procurar por espaço, quebra de linha ou tab
    for (let i = maxEnd; i > start; i--) {
      if (message[i] === ' ' || message[i] === '\n' || message[i] === '\t') {
        // Verificar se não está no meio de uma palavra (evitar cortar "palavra:")
        if (i > 0 && i < message.length - 1) {
          const beforeChar = message[i - 1]
          const afterChar = message[i + 1]
          
          // Se antes tem letra e depois tem dois pontos, pode ser uma lista
          if (beforeChar.match(/[a-zA-Z]/) && afterChar === ':') {
            // Pular este espaço e procurar o próximo
            continue
          }
        }
        return i
      }
    }
    return maxEnd
  }

  /**
   * Encontra quebra apropriada para listas e estruturas especiais
   */
  private findListBreak(message: string, start: number, maxEnd: number): number {
    // Procurar por padrões de lista que não devem ser quebrados
    const listPatterns = [
      /\d+\.\s+\*\*/,  // "1. **Título**"
      /-\s+/,          // "- item"
      /\*\s+/,         // "* item"
      /:\s*$/,         // "termo:" no final
      /:\s*\n/,        // "termo:" seguido de quebra de linha
    ]
    
    // Verificar se estamos no meio de uma estrutura de lista
    for (let i = start; i < maxEnd; i++) {
      const substring = message.slice(start, i + 1)
      
      for (const pattern of listPatterns) {
        const match = substring.match(pattern)
        if (match && match.index !== undefined) {
          const matchEnd = start + match.index + match[0].length
          if (matchEnd > maxEnd) {
            // Se o padrão vai além do limite, quebrar antes dele
            return Math.max(start, match.index + start)
          }
        }
      }
    }
    
    return maxEnd
  }

  /**
   * Encontra uma quebra segura próxima (espaço, pontuação leve)
   */
  private findSafeBreak(message: string, start: number, maxEnd: number): number {
    const safeChars = [' ', '\n', '\t', ',', ';', ':', '—', '–', '-']
    
    for (let i = maxEnd; i > start; i--) {
      if (safeChars.includes(message[i])) {
        // Verificar se não está no meio de uma palavra
        if (message[i] === ' ' || message[i] === '\n' || message[i] === '\t') {
          return i
        }
        // Para pontuação, verificar se há espaço após
        if (i < message.length - 1 && message[i + 1] === ' ') {
          return i + 1
        }
      }
    }
    return maxEnd
  }

  /**
   * Encontra o final de uma frase (ponto, exclamação, interrogação)
   */
  private findSentenceEnd(message: string, start: number, maxEnd: number): number {
    const sentenceEnders = ['.', '!', '?']
    const secondaryEnders = [':', ';']
    let bestEnd = start

    // Primeiro, procurar por terminadores de frase principais
    for (let i = maxEnd; i > start; i--) {
      if (sentenceEnders.includes(message[i])) {
        // Verificar se não é parte de uma abreviação (ex: "Dr.", "Sr.", "etc.")
        const beforeChar = i > 0 ? message[i - 1] : ''
        const afterChar = i < message.length - 1 ? message[i + 1] : ''
        
        // Não quebrar em abreviações comuns
        const commonAbbreviations = ['Dr', 'Sr', 'Sra', 'Prof', 'etc', 'Inc', 'Ltd', 'Corp']
        const wordBefore = this.getWordBefore(message, i)
        
        if (!commonAbbreviations.includes(wordBefore) && 
            (afterChar === ' ' || afterChar === '\n' || i === message.length - 1)) {
          bestEnd = i + 1
          break
        }
      }
    }

    // Se não encontrou terminador principal, procurar por secundários
    if (bestEnd === start) {
      for (let i = maxEnd; i > start; i--) {
        if (secondaryEnders.includes(message[i])) {
          const afterChar = i < message.length - 1 ? message[i + 1] : ''
          if (afterChar === ' ' || afterChar === '\n' || i === message.length - 1) {
            bestEnd = i + 1
            break
          }
        }
      }
    }

    return bestEnd > start ? bestEnd : maxEnd
  }

  /**
   * Obtém a palavra antes de uma posição
   */
  private getWordBefore(message: string, position: number): string {
    let start = position - 1
    while (start >= 0 && message[start].match(/[a-zA-Z]/)) {
      start--
    }
    return message.slice(start + 1, position)
  }

  /**
   * Encontra quebras de pontuação (vírgulas, dois pontos, etc.)
   */
  private findPunctuationBreak(message: string, start: number, maxEnd: number): number {
    const punctuationMarks = [',', ';', ':', '—', '–', '-']
    let bestEnd = start

    for (let i = maxEnd; i > start; i--) {
      if (punctuationMarks.includes(message[i])) {
        const afterChar = i < message.length - 1 ? message[i + 1] : ''
        if (afterChar === ' ' || afterChar === '\n' || i === message.length - 1) {
          bestEnd = i + 1
          break
        }
      }
    }

    return bestEnd > start ? bestEnd : maxEnd
  }

  /**
   * Encontra quebras semânticas (conjunções, conectores)
   */
  private findSemanticBreak(message: string, start: number, maxEnd: number): number {
    const semanticBreaks = [' mas ', ' porém ', ' entretanto ', ' além disso ', ' também ', ' ainda ', ' ainda mais ']
    let bestEnd = start

    for (const breakPhrase of semanticBreaks) {
      const index = message.indexOf(breakPhrase, start)
      if (index > start && index < maxEnd) {
        bestEnd = index + breakPhrase.length
      }
    }

    return bestEnd > start ? bestEnd : maxEnd
  }
}

// Instância singleton
export const smartChunking = SmartChunking.getInstance()

// Função de conveniência
export const chunkMessage = (message: string, options?: ChunkingOptions): SmartChunk[] => {
  return smartChunking.chunkMessage(message, options)
}
