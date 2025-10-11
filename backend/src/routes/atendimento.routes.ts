import { Router } from 'express';
import { AtendimentoController } from '../controllers/atendimento.controller';
import { authMiddleware } from '../middlewares/auth';

export function createAtendimentoRoutes(atendimentoController: AtendimentoController) {
  const router = Router();

  // Aplicar middleware de autenticação em todas as rotas
  router.use(authMiddleware);

  // Listar atendimentos ativos
  router.get('/ativos', (req, res) => atendimentoController.getAtendimentosAtivos(req, res));

  // Obter detalhes de um atendimento
  router.get('/:id', (req, res) => atendimentoController.getAtendimentoById(req, res));

  // Responder a um atendimento
  router.post('/:id/responder', (req, res) => atendimentoController.responderAtendimento(req, res));

  // Finalizar atendimento
  router.post('/:id/finalizar', (req, res) => atendimentoController.finalizarAtendimento(req, res));

  // Criar tarefa (placeholder para integração VBsolution)
  router.post('/:id/criar-tarefa', (req, res) => atendimentoController.criarTarefa(req, res));

  // Agendar atendimento (placeholder para integração VBsolution)
  router.post('/:id/agendar', (req, res) => atendimentoController.agendarAtendimento(req, res));

  // Obter informações do cliente
  router.get('/cliente/:numero', (req, res) => atendimentoController.getClienteInfo(req, res));

  return router;
}
