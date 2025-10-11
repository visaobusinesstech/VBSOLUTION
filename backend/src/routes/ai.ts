import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Processar texto com IA
router.post('/process-text', async (req, res) => {
  try {
    const { prompt, model = 'gpt-4o-mini', apiKey } = req.body;

    if (!prompt || !apiKey) {
      return res.status(400).json({ 
        error: 'Prompt e API key são obrigatórios' 
      });
    }

    // Validar formato da API key
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ 
        error: 'API Key inválida' 
      });
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Fazer requisição para OpenAI
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de texto especializado em melhorar, corrigir e processar textos. Sempre responda APENAS com o texto processado, sem explicações adicionais ou comentários. Mantenha o tom e estilo da mensagem original.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const processedText = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      text: processedText.trim()
    });

  } catch (error: any) {
    console.error('Erro ao processar texto com IA:', error);
    
    // Tratar erros específicos da OpenAI
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'API Key inválida' 
      });
    }
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'Cota da API excedida' 
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// Verificar status da API key
router.post('/check-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key é obrigatória' 
      });
    }

    // Validar formato da API key
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ 
        error: 'API Key inválida' 
      });
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Fazer uma requisição simples para verificar a API key
    const models = await openai.models.list();

    res.json({
      success: true,
      valid: true,
      models: models.data.map(model => ({
        id: model.id,
        owned_by: model.owned_by
      }))
    });

  } catch (error: any) {
    console.error('Erro ao verificar API key:', error);
    
    res.json({
      success: false,
      valid: false,
      error: error.message
    });
  }
});

export default router;
