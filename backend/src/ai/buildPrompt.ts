import type { AgentConfig } from './loadAgentConfig';

export function buildSystemMessage(cfg: AgentConfig): string {
  const lines = [
    `Você é um agente de atendimento via WhatsApp para a empresa.`,
    cfg.personality ? `Personalidade: ${cfg.personality}.` : '',
    cfg.companyDescription ? `Descrição da empresa: ${cfg.companyDescription}.` : '',
    cfg.companyContext ? `Contexto: ${cfg.companyContext}.` : '',
    cfg.tone ? `Tom de voz: ${cfg.tone}.` : '',
    cfg.responseStyle ? `Estilo de resposta: ${cfg.responseStyle}.` : '',
    `Regras: responda de forma útil, curta e direta. Se não souber, peça mais detalhes.`,
  ];

  if (cfg.rules?.length) {
    lines.push('Regras específicas:');
    for (const r of cfg.rules) lines.push(`- ${r}`);
  }

  if (cfg.qa?.length) {
    lines.push('Base de conhecimento (Q&A): use quando útil:');
    for (const { q, a, category } of cfg.qa) {
      lines.push(`Q: ${q}`);
      lines.push(`A: ${a}`);
      if (category) lines.push(`Categoria: ${category}`);
      lines.push('');
    }
  }

  // Instruções importantes
  lines.push('INSTRUÇÕES IMPORTANTES:');
  lines.push('1. SEMPRE use a base de conhecimento fornecida quando for relevante para a pergunta do usuário.');
  lines.push('2. Se a pergunta não estiver na base de conhecimento, ofereça ajuda geral e sugira que o usuário entre em contato para mais informações específicas.');
  lines.push('3. Seja prestativo e profissional em todas as respostas.');
  lines.push('4. Use as informações da empresa e base de conhecimento para dar respostas contextualizadas.');
  lines.push('5. Para imagens: descreva o que vê e responda de forma útil baseado no conteúdo.');
  lines.push('6. Para áudios: use a transcrição para entender o que o usuário disse e responda adequadamente.');

  return lines.filter(Boolean).join('\n');
}

export function buildUserMessage(
  userInput: string, 
  messageType: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO',
  mediaContent?: string
): string {
  let message = userInput || '';
  
  if (messageType === 'AUDIO' && mediaContent) {
    message = `(Transcrição do áudio) ${mediaContent}`;
  } else if (messageType === 'IMAGEM' && mediaContent) {
    message = `(Descrição da imagem) ${mediaContent}. ${userInput || 'O que você gostaria de saber sobre esta imagem?'}`;
  } else if (messageType === 'IMAGEM' && !mediaContent) {
    message = `O usuário enviou uma imagem. ${userInput || 'O que você gostaria de saber sobre esta imagem?'}`;
  } else if (messageType === 'AUDIO' && !mediaContent) {
    message = `O usuário enviou uma mensagem de áudio. ${userInput || 'O que você gostaria de saber?'}`;
  } else if (messageType === 'VIDEO') {
    message = `O usuário enviou um vídeo. ${userInput || 'O que você gostaria de saber sobre este vídeo?'}`;
  }

  return message;
}
