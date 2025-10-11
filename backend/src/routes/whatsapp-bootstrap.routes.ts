import { Router } from 'express';
import { whatsappBootstrapController } from '../controllers/whatsapp-bootstrap.controller';

const router = Router();

// Rotas de inicialização e controle
router.post('/initialize', whatsappBootstrapController.initialize.bind(whatsappBootstrapController));
router.get('/status', whatsappBootstrapController.getStatus.bind(whatsappBootstrapController));
router.get('/stats', whatsappBootstrapController.getDetailedStats.bind(whatsappBootstrapController));
router.post('/test', whatsappBootstrapController.runSystemTest.bind(whatsappBootstrapController));
router.post('/test-connection', whatsappBootstrapController.createTestConnection.bind(whatsappBootstrapController));
router.post('/restart', whatsappBootstrapController.restart.bind(whatsappBootstrapController));
router.post('/shutdown', whatsappBootstrapController.shutdown.bind(whatsappBootstrapController));

export default router;
