import { Request, Response } from 'express';
import { supabase } from '../supabaseClient';
import { loadAgentConfig } from '../ai/loadAgentConfig';

export class AIAgentController {
  /**
   * Obter configuração do Agente IA
   */
  async getAgentConfig(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
      }

      const config = await loadAgentConfig(ownerId);
      
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração não encontrada'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Erro ao obter configuração do Agente IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Salvar configuração do Agente IA
   */
  async saveAgentConfig(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const configData = req.body;
      
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
      }

      // Validar dados obrigatórios
      if (!configData.name || !configData.function) {
        return res.status(400).json({
          success: false,
          error: 'Nome e função são obrigatórios'
        });
      }

      // Preparar dados para inserção/atualização
      const agentData = {
        owner_id: ownerId,
        name: configData.name,
        function: configData.function,
        personality: configData.personality || 'Profissional, prestativo e eficiente',
        status: configData.status || 'active',
        response_style: configData.response_style || 'friendly',
        language: configData.language || 'pt-BR',
        max_response_length: configData.max_response_length || 500,
        response_speed: configData.response_speed || 'normal',
        tone: configData.tone || null,
        rules: configData.rules || null,
        company_context: configData.company_context || null,
        sector: configData.sector || null,
        company_description: configData.company_description || null,
        api_key: configData.api_key || null,
        selected_model: configData.selected_model || 'gpt-4o-mini',
        creativity_temperature: configData.creativity_temperature || 0.7,
        max_tokens: configData.max_tokens || 1000,
        audio_transcription_enabled: configData.audio_transcription_enabled || false,
        audio_transcription_language: configData.audio_transcription_language || 'pt-BR',
        is_connected: configData.is_connected || false,
        knowledge_base: configData.knowledge_base || {
          files: [],
          websites: [],
          qa: []
        },
        is_company_wide: configData.is_company_wide || false,
        company_id: configData.company_id || null,
        is_active: configData.is_active !== undefined ? configData.is_active : true,
        updated_at: new Date().toISOString()
      };

      // Verificar se já existe configuração para este owner
      const { data: existingConfig } = await supabase
        .from('ai_agent_configs')
        .select('id')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .single();

      let result;
      if (existingConfig) {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('ai_agent_configs')
          .update(agentData)
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = data;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('ai_agent_configs')
          .insert([agentData])
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = data;
      }

      console.log('✅ Configuração do Agente IA salva:', result.id);

      res.json({
        success: true,
        message: 'Configuração salva com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro ao salvar configuração do Agente IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Ativar/Desativar Agente IA
   */
  async toggleAgentStatus(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { is_active } = req.body;
      
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
      }

      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'is_active deve ser um booleano'
        });
      }

      const { data, error } = await supabase
        .from('ai_agent_configs')
        .update({ 
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: `Agente IA ${is_active ? 'ativado' : 'desativado'} com sucesso`,
        data
      });
    } catch (error) {
      console.error('Erro ao alterar status do Agente IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Salvar API Key do Agente IA
   */
  async saveApiKey(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { apiKey, selectedModel, creativityTemperature, maxTokens } = req.body;
      
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API Key é obrigatória'
        });
      }

      // Verificar se já existe configuração para este owner
      const { data: existingConfig } = await supabase
        .from('ai_agent_configs')
        .select('id')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .single();

      let result;
      if (existingConfig) {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('ai_agent_configs')
          .update({
            api_key: apiKey,
            selected_model: selectedModel || 'gpt-4o-mini',
            creativity_temperature: creativityTemperature || 0.7,
            max_tokens: maxTokens || 1000,
            is_connected: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = data;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('ai_agent_configs')
          .insert([{
            owner_id: ownerId,
            name: 'Assistente Virtual VB',
            function: 'Atendimento ao cliente via WhatsApp',
            personality: 'Profissional, prestativo e eficiente',
            status: 'active',
            response_style: 'friendly',
            language: 'pt-BR',
            max_response_length: 500,
            response_speed: 'normal',
            api_key: apiKey,
            selected_model: selectedModel || 'gpt-4o-mini',
            creativity_temperature: creativityTemperature || 0.7,
            max_tokens: maxTokens || 1000,
            is_connected: true,
            knowledge_base: {
              files: [],
              websites: [],
              qa: []
            },
            is_company_wide: false,
            is_active: true
          }])
          .select()
          .single();

        if (error) {
          throw error;
        }
        result = data;
      }

      console.log('✅ API Key do Agente IA salva:', result.id);

      res.json({
        success: true,
        message: 'API Key salva com sucesso',
        data: {
          id: result.id,
          is_connected: result.is_connected,
          selected_model: result.selected_model,
          creativity_temperature: result.creativity_temperature,
          max_tokens: result.max_tokens
        }
      });
    } catch (error) {
      console.error('Erro ao salvar API Key do Agente IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar ação de IA - Corrigir Gramática
   */
  async correctGrammar(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { text } = req.body;
      
      if (!ownerId || !text) {
        return res.status(400).json({
          success: false,
          error: 'ownerId e text são obrigatórios'
        });
      }

      const config = await loadAgentConfig(ownerId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração do AI Agent não encontrada'
        });
      }

      const prompt = 'Corrija a gramática e ortografia do seguinte texto, mantendo exatamente o mesmo idioma da mensagem original. Mantenha o tom e estilo da mensagem:';
      const result = await this.processAIAction(config, prompt, text);

      res.json({
        success: true,
        data: {
          originalText: text,
          correctedText: result,
          action: 'grammar_correction'
        }
      });
    } catch (error) {
      console.error('Erro ao corrigir gramática:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar ação de IA - Melhorar Texto
   */
  async improveText(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { text } = req.body;
      
      if (!ownerId || !text) {
        return res.status(400).json({
          success: false,
          error: 'ownerId e text são obrigatórios'
        });
      }

      const config = await loadAgentConfig(ownerId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração do AI Agent não encontrada'
        });
      }

      const prompt = 'Melhore o seguinte texto tornando-o mais amigável e profissional, mas mantenha-o aproximadamente do mesmo tamanho. Adicione emojis quando apropriado para tornar a mensagem mais calorosa. Exemplo: "oi quanto custa um serviço?" deve virar "Olá! Gostaria de saber quanto custa o seu serviço! 😊":';
      const result = await this.processAIAction(config, prompt, text);

      res.json({
        success: true,
        data: {
          originalText: text,
          improvedText: result,
          action: 'text_improvement'
        }
      });
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar ação de IA - Traduzir
   */
  async translateText(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { text, targetLanguage = 'pt-BR' } = req.body;
      
      if (!ownerId || !text) {
        return res.status(400).json({
          success: false,
          error: 'ownerId e text são obrigatórios'
        });
      }

      const config = await loadAgentConfig(ownerId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração do AI Agent não encontrada'
        });
      }

      const prompt = `Traduza o seguinte texto para ${targetLanguage}, mantendo o tom e contexto original. Não adicione aspas desnecessárias - mantenha apenas as aspas que já existem no texto original:`;
      const result = await this.processAIAction(config, prompt, text);

      res.json({
        success: true,
        data: {
          originalText: text,
          translatedText: result,
          targetLanguage,
          action: 'translation'
        }
      });
    } catch (error) {
      console.error('Erro ao traduzir texto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar ação de IA - Categorizar
   */
  async categorizeText(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { text } = req.body;
      
      if (!ownerId || !text) {
        return res.status(400).json({
          success: false,
          error: 'ownerId e text são obrigatórios'
        });
      }

      const config = await loadAgentConfig(ownerId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração do AI Agent não encontrada'
        });
      }

      const prompt = 'Analise o seguinte texto e forneça: 1) Uma breve descrição do conteúdo principal, 2) Organize os tópicos importantes em categorias com bullet points. Mantenha o formato claro e profissional:';
      const result = await this.processAIAction(config, prompt, text);

      res.json({
        success: true,
        data: {
          originalText: text,
          categorizedText: result,
          action: 'categorization'
        }
      });
    } catch (error) {
      console.error('Erro ao categorizar texto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar ação de IA - Resumir
   */
  async summarizeText(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      const { text } = req.body;
      
      if (!ownerId || !text) {
        return res.status(400).json({
          success: false,
          error: 'ownerId e text são obrigatórios'
        });
      }

      const config = await loadAgentConfig(ownerId);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuração do AI Agent não encontrada'
        });
      }

      const prompt = 'Resuma o seguinte texto de forma concisa, mantendo o contexto e objetivo principal da mensagem. Não perca informações importantes:';
      const result = await this.processAIAction(config, prompt, text);

      res.json({
        success: true,
        data: {
          originalText: text,
          summarizedText: result,
          action: 'summarization'
        }
      });
    } catch (error) {
      console.error('Erro ao resumir texto:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar ações disponíveis do AI Agent
   */
  async getAvailableActions(req: Request, res: Response) {
    try {
      const actions = [
        {
          id: 'grammar',
          name: 'Corrigir Gramática',
          description: 'Corrige gramática e ortografia mantendo o tom original',
          endpoint: '/api/ai-agent/:ownerId/actions/grammar',
          method: 'POST',
          parameters: {
            text: 'string (obrigatório) - Texto a ser corrigido'
          }
        },
        {
          id: 'improve',
          name: 'Melhorar Texto',
          description: 'Melhora o texto tornando-o mais amigável e profissional',
          endpoint: '/api/ai-agent/:ownerId/actions/improve',
          method: 'POST',
          parameters: {
            text: 'string (obrigatório) - Texto a ser melhorado'
          }
        },
        {
          id: 'translate',
          name: 'Traduzir',
          description: 'Traduz texto para português brasileiro',
          endpoint: '/api/ai-agent/:ownerId/actions/translate',
          method: 'POST',
          parameters: {
            text: 'string (obrigatório) - Texto a ser traduzido',
            targetLanguage: 'string (opcional) - Idioma de destino (padrão: pt-BR)'
          }
        },
        {
          id: 'categorize',
          name: 'Categorizar',
          description: 'Analisa e organiza o texto em categorias',
          endpoint: '/api/ai-agent/:ownerId/actions/categorize',
          method: 'POST',
          parameters: {
            text: 'string (obrigatório) - Texto a ser categorizado'
          }
        },
        {
          id: 'summarize',
          name: 'Resumir',
          description: 'Resume o texto mantendo informações importantes',
          endpoint: '/api/ai-agent/:ownerId/actions/summarize',
          method: 'POST',
          parameters: {
            text: 'string (obrigatório) - Texto a ser resumido'
          }
        }
      ];

      res.json({
        success: true,
        data: {
          actions,
          total: actions.length,
          description: 'Ações disponíveis para processamento de texto com IA'
        }
      });
    } catch (error) {
      console.error('Erro ao listar ações disponíveis:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar ação de IA genérica
   */
  async processAIAction(config: any, prompt: string, text: string): Promise<string> {
    try {
      // Verificar se a API key está disponível
      if (!config.api_key || !config.is_connected) {
        throw new Error('API Key não configurada ou agente não conectado');
      }

      // Importar OpenAI dinamicamente
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        apiKey: config.api_key
      });

      const response = await openai.chat.completions.create({
        model: config.selected_model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: config.personality || 'Você é um assistente virtual prestativo e profissional.'
          },
          {
            role: 'user',
            content: `${prompt}\n\n${text}`
          }
        ],
        max_tokens: config.max_tokens || 1000,
        temperature: config.creativity_temperature || 0.7
      });

      return response.choices[0]?.message?.content || 'Erro ao processar texto';
    } catch (error) {
      console.error('Erro ao processar ação de IA:', error);
      throw error;
    }
  }

  /**
   * Deletar configuração do Agente IA
   */
  async deleteAgentConfig(req: Request, res: Response) {
    try {
      const { ownerId } = req.params;
      
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'ownerId é obrigatório'
        });
      }

      const { error } = await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('owner_id', ownerId);

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'Configuração deletada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar configuração do Agente IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export const aiAgentController = new AIAgentController();
