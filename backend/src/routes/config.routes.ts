import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';
import { authMiddleware } from '../middlewares/auth';

export function createConfigRoutes(configController: ConfigController) {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Obter configuração de atendimento
  router.get('/atendimento', (req, res) => configController.getConfiguracaoAtendimento(req, res));

  // Atualizar configuração de atendimento
  router.put('/atendimento', (req, res) => configController.updateConfiguracaoAtendimento(req, res));

  // Listar opções de atendimento
  router.get('/opcoes', (req, res) => configController.getOpcoesAtendimento(req, res));

  // Criar nova opção de atendimento
  router.post('/opcoes', (req, res) => configController.createOpcaoAtendimento(req, res));

  // Atualizar opção de atendimento
  router.put('/opcoes/:id', (req, res) => configController.updateOpcaoAtendimento(req, res));

  // Remover opção de atendimento
  router.delete('/opcoes/:id', (req, res) => configController.deleteOpcaoAtendimento(req, res));

  return router;
}
