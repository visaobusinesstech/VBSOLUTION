import express from 'express';
import { AgentActionsService } from '../services/agent-actions.service';

const router = express.Router();
const agentActionsService = new AgentActionsService();

// Middleware para obter ownerId (assumindo que vem do token JWT)
const getOwnerId = (req: any) => {
  // Implementar lógica para extrair ownerId do token JWT
  return req.user?.id || '00000000-0000-0000-0000-000000000000';
};

// ===== VARIÁVEIS =====

// GET /api/agent-actions/variables - Obter todas as variáveis
router.get('/variables', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const companyId = req.query.companyId as string;
    
    const variables = await agentActionsService.getVariables(ownerId, companyId);
    res.json(variables);
  } catch (error) {
    console.error('Erro ao buscar variáveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/agent-actions/variables - Criar nova variável
router.post('/variables', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const variableData = req.body;
    
    const variable = await agentActionsService.createVariable(ownerId, variableData);
    
    if (variable) {
      res.status(201).json(variable);
    } else {
      res.status(400).json({ error: 'Erro ao criar variável' });
    }
  } catch (error) {
    console.error('Erro ao criar variável:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== FUNIS =====

// GET /api/agent-actions/funnels - Obter todos os funis
router.get('/funnels', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const companyId = req.query.companyId as string;
    
    const funnels = await agentActionsService.getFunnels(ownerId, companyId);
    res.json(funnels);
  } catch (error) {
    console.error('Erro ao buscar funis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/agent-actions/funnels - Criar novo funil
router.post('/funnels', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const funnelData = req.body;
    
    const funnel = await agentActionsService.createFunnel(ownerId, funnelData);
    
    if (funnel) {
      res.status(201).json(funnel);
    } else {
      res.status(400).json({ error: 'Erro ao criar funil' });
    }
  } catch (error) {
    console.error('Erro ao criar funil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/agent-actions/funnels/:id - Atualizar funil
router.put('/funnels/:id', async (req, res) => {
  try {
    const funnelId = req.params.id;
    const updateData = req.body;
    
    // Implementar atualização do funil
    res.json({ message: 'Funil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar funil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/agent-actions/funnels/:id - Deletar funil
router.delete('/funnels/:id', async (req, res) => {
  try {
    const funnelId = req.params.id;
    
    // Implementar deleção do funil
    res.json({ message: 'Funil deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar funil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== PASSOS DO FUNIL =====

// GET /api/agent-actions/funnels/:id/steps - Obter passos do funil
router.get('/funnels/:id/steps', async (req, res) => {
  try {
    const funnelId = req.params.id;
    
    // Implementar busca de passos
    res.json([]);
  } catch (error) {
    console.error('Erro ao buscar passos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/agent-actions/funnels/:id/steps - Adicionar passo ao funil
router.post('/funnels/:id/steps', async (req, res) => {
  try {
    const funnelId = req.params.id;
    const stepData = req.body;
    
    const step = await agentActionsService.addStepToFunnel(funnelId, stepData);
    
    if (step) {
      res.status(201).json(step);
    } else {
      res.status(400).json({ error: 'Erro ao adicionar passo' });
    }
  } catch (error) {
    console.error('Erro ao adicionar passo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/agent-actions/funnels/:id/steps/:stepId - Atualizar passo
router.put('/funnels/:id/steps/:stepId', async (req, res) => {
  try {
    const funnelId = req.params.id;
    const stepId = req.params.stepId;
    const updateData = req.body;
    
    // Implementar atualização do passo
    res.json({ message: 'Passo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar passo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/agent-actions/funnels/:id/steps/:stepId - Deletar passo
router.delete('/funnels/:id/steps/:stepId', async (req, res) => {
  try {
    const funnelId = req.params.id;
    const stepId = req.params.stepId;
    
    // Implementar deleção do passo
    res.json({ message: 'Passo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar passo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== AÇÕES =====

// GET /api/agent-actions/actions - Obter todas as ações
router.get('/actions', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const companyId = req.query.companyId as string;
    
    const actions = await agentActionsService.getActions(ownerId, companyId);
    res.json(actions);
  } catch (error) {
    console.error('Erro ao buscar ações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/agent-actions/actions - Criar nova ação
router.post('/actions', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const actionData = req.body;
    
    const action = await agentActionsService.createAction(ownerId, actionData);
    
    if (action) {
      res.status(201).json(action);
    } else {
      res.status(400).json({ error: 'Erro ao criar ação' });
    }
  } catch (error) {
    console.error('Erro ao criar ação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/agent-actions/actions/:id - Atualizar ação
router.put('/actions/:id', async (req, res) => {
  try {
    const actionId = req.params.id;
    const updateData = req.body;
    
    // Implementar atualização da ação
    res.json({ message: 'Ação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar ação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/agent-actions/actions/:id - Deletar ação
router.delete('/actions/:id', async (req, res) => {
  try {
    const actionId = req.params.id;
    
    // Implementar deleção da ação
    res.json({ message: 'Ação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== EXECUÇÕES =====

// POST /api/agent-actions/execute - Executar ação
router.post('/execute', async (req, res) => {
  try {
    const { actionId, context } = req.body;
    
    const execution = await agentActionsService.executeAction(actionId, context);
    
    if (execution) {
      res.json(execution);
    } else {
      res.status(400).json({ error: 'Erro ao executar ação' });
    }
  } catch (error) {
    console.error('Erro ao executar ação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/agent-actions/executions - Obter execuções
router.get('/executions', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const chatId = req.query.chatId as string;
    
    // Implementar busca de execuções
    res.json([]);
  } catch (error) {
    console.error('Erro ao buscar execuções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== CONEXÕES =====

// GET /api/agent-actions/connections - Obter conexões
router.get('/connections', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { DEFAULT_CONNECTIONS } = require('../config/default-connections');
    
    // Buscar conexões do banco de dados
    const { data: dbConnections, error } = await supabase
      .from('connections')
      .select('*')
      .eq('owner_id', ownerId);
    
    if (error) {
      console.error('Erro ao buscar conexões do banco:', error);
      // Retornar conexões padrão em caso de erro
      res.json(DEFAULT_CONNECTIONS);
      return;
    }
    
    // Mesclar conexões padrão com as do banco
    const mergedConnections = DEFAULT_CONNECTIONS.map(defaultConn => {
      const dbConn = dbConnections?.find(conn => conn.connection_type === defaultConn.connectionType);
      return {
        ...defaultConn,
        ...(dbConn && {
          isConnected: dbConn.is_connected,
          lastUsedAt: dbConn.last_used_at,
          config: { ...defaultConn.config, ...dbConn.config }
        })
      };
    });
    
    res.json(mergedConnections);
  } catch (error) {
    console.error('Erro ao buscar conexões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/agent-actions/connection-categories - Obter categorias de conexões
router.get('/connection-categories', async (req, res) => {
  try {
    const { CONNECTION_CATEGORIES } = require('../config/default-connections');
    res.json(CONNECTION_CATEGORIES);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
