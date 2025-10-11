import { Router } from 'express';
import { aiAgentController } from '../controllers/ai-agent.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Obter configuração do Agente IA
router.get('/:ownerId', (req, res) => aiAgentController.getAgentConfig(req, res));

// Listar ações disponíveis do AI Agent
router.get('/actions', (req, res) => aiAgentController.getAvailableActions(req, res));

// Salvar configuração do Agente IA
router.post('/:ownerId', (req, res) => aiAgentController.saveAgentConfig(req, res));

// Atualizar configuração do Agente IA
router.put('/:ownerId', (req, res) => aiAgentController.saveAgentConfig(req, res));

// Salvar API Key do Agente IA
router.post('/:ownerId/api-key', (req, res) => aiAgentController.saveApiKey(req, res));

// Ações de IA - Processamento de Texto
router.post('/:ownerId/actions/grammar', (req, res) => aiAgentController.correctGrammar(req, res));
router.post('/:ownerId/actions/improve', (req, res) => aiAgentController.improveText(req, res));
router.post('/:ownerId/actions/translate', (req, res) => aiAgentController.translateText(req, res));
router.post('/:ownerId/actions/categorize', (req, res) => aiAgentController.categorizeText(req, res));
router.post('/:ownerId/actions/summarize', (req, res) => aiAgentController.summarizeText(req, res));

// Ativar/Desativar Agente IA
router.patch('/:ownerId/toggle', (req, res) => aiAgentController.toggleAgentStatus(req, res));

// Deletar configuração do Agente IA
router.delete('/:ownerId', (req, res) => aiAgentController.deleteAgentConfig(req, res));

export default router;
