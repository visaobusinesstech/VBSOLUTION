export interface MessageChunk {
  content: string;
  sequence: number;
  totalChunks: number;
  isLast: boolean;
}

export interface MessageSplittingConfig {
  enabled: boolean;
  maxCharsPerChunk: number;
  splitStrategy: 'smart' | 'simple' | 'sentence';
  addSequenceInfo: boolean;
  delayBetweenChunks: number; // em milissegundos
}

export class MessageSplittingService {
  private config: MessageSplittingConfig;

  constructor(config: MessageSplittingConfig) {
    this.config = config;
  }

  /**
   * Divide uma mensagem em chunks menores
   */
  splitMessage(content: string): MessageChunk[] {
    if (!this.config.enabled || content.length <= this.config.maxCharsPerChunk) {
      return [{
        content,
        sequence: 1,
        totalChunks: 1,
        isLast: true
      }];
    }

    const chunks: MessageChunk[] = [];
    const totalChunks = Math.ceil(content.length / this.config.maxCharsPerChunk);

    switch (this.config.splitStrategy) {
      case 'smart':
        return this.splitSmart(content, totalChunks);
      case 'sentence':
        return this.splitBySentences(content, totalChunks);
      case 'simple':
      default:
        return this.splitSimple(content, totalChunks);
    }
  }

  /**
   * Divisão simples por caracteres
   */
  private splitSimple(content: string, totalChunks: number): MessageChunk[] {
    const chunks: MessageChunk[] = [];
    const chunkSize = Math.ceil(content.length / totalChunks);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, content.length);
      const chunkContent = content.slice(start, end);

      chunks.push({
        content: this.formatChunkContent(chunkContent, i + 1, totalChunks),
        sequence: i + 1,
        totalChunks,
        isLast: i === totalChunks - 1
      });
    }

    return chunks;
  }

  /**
   * Divisão inteligente respeitando palavras e contexto
   */
  private splitSmart(content: string, totalChunks: number): MessageChunk[] {
    const chunks: MessageChunk[] = [];
    const words = content.split(' ');
    const wordsPerChunk = Math.ceil(words.length / totalChunks);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * wordsPerChunk;
      const end = Math.min(start + wordsPerChunk, words.length);
      const chunkWords = words.slice(start, end);
      const chunkContent = chunkWords.join(' ');

      chunks.push({
        content: this.formatChunkContent(chunkContent, i + 1, totalChunks),
        sequence: i + 1,
        totalChunks,
        isLast: i === totalChunks - 1
      });
    }

    return chunks;
  }

  /**
   * Divisão por sentenças
   */
  private splitBySentences(content: string, totalChunks: number): MessageChunk[] {
    const chunks: MessageChunk[] = [];
    
    // Dividir por sentenças (pontos, exclamação, interrogação)
    const sentences = content.split(/([.!?]+)/).filter(s => s.trim());
    const sentencesPerChunk = Math.ceil(sentences.length / totalChunks);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * sentencesPerChunk;
      const end = Math.min(start + sentencesPerChunk, sentences.length);
      const chunkSentences = sentences.slice(start, end);
      const chunkContent = chunkSentences.join(' ').trim();

      if (chunkContent) {
        chunks.push({
          content: this.formatChunkContent(chunkContent, i + 1, totalChunks),
          sequence: i + 1,
          totalChunks,
          isLast: i === totalChunks - 1
        });
      }
    }

    return chunks;
  }

  /**
   * Formata o conteúdo do chunk com informações de sequência
   */
  private formatChunkContent(content: string, sequence: number, totalChunks: number): string {
    if (!this.config.addSequenceInfo || totalChunks === 1) {
      return content;
    }

    return `[${sequence}/${totalChunks}] ${content}`;
  }

  /**
   * Envia chunks com delay entre eles
   */
  async sendChunksWithDelay(
    chunks: MessageChunk[],
    sendFunction: (content: string, sequence: number) => Promise<void>
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        await sendFunction(chunk.content, chunk.sequence);
        
        // Adicionar delay entre chunks (exceto no último)
        if (!chunk.isLast && this.config.delayBetweenChunks > 0) {
          await this.delay(this.config.delayBetweenChunks);
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar chunk ${chunk.sequence}:`, error);
        // Continuar enviando os próximos chunks mesmo se um falhar
      }
    }
  }

  /**
   * Função auxiliar para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se uma mensagem precisa ser dividida
   */
  shouldSplit(content: string): boolean {
    return this.config.enabled && content.length > this.config.maxCharsPerChunk;
  }

  /**
   * Obtém estatísticas de divisão
   */
  getSplittingStats(content: string): {
    originalLength: number;
    needsSplitting: boolean;
    estimatedChunks: number;
    avgCharsPerChunk: number;
  } {
    const needsSplitting = this.shouldSplit(content);
    const estimatedChunks = needsSplitting 
      ? Math.ceil(content.length / this.config.maxCharsPerChunk)
      : 1;
    const avgCharsPerChunk = needsSplitting
      ? Math.ceil(content.length / estimatedChunks)
      : content.length;

    return {
      originalLength: content.length,
      needsSplitting,
      estimatedChunks,
      avgCharsPerChunk
    };
  }
}

export default MessageSplittingService;
