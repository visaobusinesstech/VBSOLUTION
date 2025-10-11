import OpenAI from 'openai';
import fetch from 'node-fetch';

type AnswerArgs = {
  system: string;
  language: string;
  model: string;
  temperature: number;
  max_tokens?: number;
  transcript: string[];
  userInput: string;
  imageUrl?: string;
  apiKey?: string;
};

function client(apiKey?: string) {
  return new OpenAI({ 
    apiKey: apiKey || process.env.OPENAI_API_KEY! 
  });
}

export const infer = {
  async answer(args: AnswerArgs): Promise<string | null> {
    try {
      const { system, transcript, userInput, imageUrl, model, temperature, max_tokens, language, apiKey } = args;
      const openai = client(apiKey);

      console.log('🤖 ===== CHAMADA PARA OPENAI =====');
      console.log('🤖 Modelo:', model);
      console.log('🤖 Temperatura:', temperature);
      console.log('🤖 Max tokens:', max_tokens);
      console.log('🤖 Idioma:', language);
      console.log('🤖 Tem imagem:', !!imageUrl);
      console.log('🤖 Entrada do usuário:', userInput);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: system },
        { role: 'system', content: `Responda sempre em ${language}. Seja útil e breve.` }
      ];

      // Adicionar histórico da conversa se disponível
      if (transcript.length > 0) {
        messages.push({
          role: 'system',
          content: `Histórico da conversa:\n${transcript.join('\n')}`
        });
      }

      // Construir mensagem do usuário
      if (imageUrl) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: userInput || 'Descreva e responda de forma útil.' },
            { type: 'image_url', image_url: { url: imageUrl } } as any
          ] as any
        });
      } else {
        messages.push({ role: 'user', content: userInput });
      }

      const resp = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens,
        messages
      });

      const answer = resp.choices?.[0]?.message?.content?.trim() || null;
      
      console.log('🤖 Resposta gerada:', answer);
      console.log('🤖 ================================');
      
      return answer;
    } catch (error) {
      console.error('❌ Erro na chamada para OpenAI:', error);
      return null;
    }
  },

  async transcribeAudio(url: string, cfg?: any): Promise<{ transcript: string | null }> {
    try {
      console.log('🎵 Transcrevendo áudio:', url);
      
      const openai = client(cfg?.openaiApiKey);

      // Download audio to buffer
      const r = await fetch(url);
      if (!r.ok) {
        console.error('❌ Erro ao baixar áudio:', r.status);
        return { transcript: null };
      }
      
      const blob = await r.blob();
      console.log('🎵 Áudio baixado, tamanho:', blob.size, 'bytes');

      // Whisper transcription
      const transcript = await openai.audio.transcriptions.create({
        file: new File([await blob.arrayBuffer()], 'audio.wav', { 
          type: blob.type || 'audio/wav' 
        }),
        model: 'whisper-1',
        language: 'pt' // ajustar conforme necessário
      });

      const result = transcript.text || null;
      console.log('🎵 Transcrição:', result);
      
      return { transcript: result };
    } catch (error) {
      console.error('❌ Erro na transcrição de áudio:', error);
      return { transcript: null };
    }
  },

  async describeImage(url: string, cfg?: any): Promise<{ description: string | null }> {
    try {
      console.log('🖼️ Descrevendo imagem:', url);
      
      const openai = client(cfg?.openaiApiKey);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Descreva esta imagem em detalhes. O que você vê? Identifique objetos, pessoas, texto, cores e contexto geral.'
              },
              {
                type: 'image_url',
                image_url: { url: url }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const description = response.choices[0]?.message?.content || null;
      console.log('🖼️ Descrição da imagem:', description);
      
      return { description };
    } catch (error) {
      console.error('❌ Erro na descrição de imagem:', error);
      return { description: null };
    }
  }
};
