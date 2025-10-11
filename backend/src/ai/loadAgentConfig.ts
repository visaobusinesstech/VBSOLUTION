import { supabase } from '../supabaseClient';

export type AgentConfig = {
  model: string;
  temperature: number;
  max_tokens?: number;
  responseStyle?: string;
  language?: string;     // 'pt-BR', etc.
  tone?: string;         // 'friendly' | 'formal' | ...
  companyContext?: string;
  companyDescription?: string;
  personality?: string;  // short description of persona/behavior
  rules?: string[];      // extra constraints
  qa?: Array<{q:string; a:string; category?: string}>;
  openaiApiKey?: string; // from ai_agent_configs.api_key or system default
  
  // Configurações de transcrição de áudios
  audioTranscription?: {
    enabled: boolean;
    language: string;
    provider: 'openai' | 'disabled';
    model: string;
    autoSave: boolean;
    maxDuration: number; // em segundos
    fallbackText: string;
  };

  // Configurações de mensagens
  messageSettings?: {
    debounceEnabled: boolean;
    debounceTimeMs: number;
    chunkSize: number;
    chunkDelayMs: number;
    maxMessagesPerBatch: number;
  };
};

export async function loadAgentConfig(ownerId: string): Promise<AgentConfig | null> {
  try {
    console.log('🤖 Carregando configuração da IA para ownerId:', ownerId);
    
    // 1) Base agent config
    const { data: agentRow, error: agentErr } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (agentErr) {
      console.warn('⚠️ Erro ao carregar configuração da IA:', agentErr);
      
      // Tentar buscar qualquer configuração se não há ativa
      const { data: anyAgentRow } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!anyAgentRow) {
        console.log('❌ Nenhuma configuração da IA encontrada para o usuário');
        return null;
      }
      
      console.log('⚠️ Usando configuração inativa da IA');
      agentRow = anyAgentRow;
    }

    // Normalize knowledge_base.qa -> array
    const qa = Array.isArray(agentRow?.knowledge_base?.qa) ? agentRow.knowledge_base.qa : [];

    // 2) Optional session overrides
    const { data: sessionRow } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cfg: AgentConfig = {
      model: sessionRow?.selected_model || agentRow?.selected_model || agentRow?.model || 'gpt-4o-mini',
      temperature: Number(sessionRow?.temperature ?? agentRow?.temperature ?? 0.7),
      max_tokens: sessionRow?.max_tokens ?? agentRow?.max_tokens ?? 1500,
      responseStyle: agentRow?.response_style || 'friendly',
      language: agentRow?.language || 'pt-BR',
      tone: agentRow?.tone || 'friendly',
      companyContext: sessionRow?.company_context || agentRow?.company_context || null,
      companyDescription: sessionRow?.company_description || agentRow?.company_description || null,
      personality: agentRow?.personality || agentRow?.name || 'Assistente Virtual',
      rules: (agentRow?.rules ? [agentRow.rules] : []),
      qa,
      openaiApiKey: agentRow?.api_key || process.env.OPENAI_API_KEY,
      
    // Configurações de transcrição de áudios
    audioTranscription: {
      enabled: agentRow?.audio_transcription_enabled || false,
      language: agentRow?.audio_transcription_language || 'pt-BR',
      provider: agentRow?.audio_transcription_provider || 'openai',
      model: agentRow?.audio_transcription_model || 'whisper-1',
      autoSave: agentRow?.audio_transcription_auto_save || true,
      maxDuration: agentRow?.audio_transcription_max_duration || 300,
      fallbackText: agentRow?.audio_transcription_fallback_text || '[Áudio recebido]'
    },

    // Configurações de mensagens
    messageSettings: {
      debounceEnabled: agentRow?.message_debounce_enabled || true,
      debounceTimeMs: agentRow?.message_debounce_time_ms || 30000,
      chunkSize: agentRow?.message_chunk_size || 200,
      chunkDelayMs: agentRow?.message_chunk_delay_ms || 2000,
      maxMessagesPerBatch: agentRow?.message_max_batch_size || 5,
      randomDelayEnabled: agentRow?.message_random_delay_enabled || true,
      minDelayMs: agentRow?.message_min_delay_ms || 3000,
      maxDelayMs: agentRow?.message_max_delay_ms || 5000
    }
    };

    console.log('✅ Configuração da IA carregada:', {
      name: agentRow?.name,
      model: cfg.model,
      hasApiKey: !!cfg.openaiApiKey,
      qaCount: qa.length,
      hasSessionOverrides: !!sessionRow
    });

    return cfg;
  } catch (error) {
    console.error('❌ Erro ao carregar configuração da IA:', error);
    return null;
  }
}
