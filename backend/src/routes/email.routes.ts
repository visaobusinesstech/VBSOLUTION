import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const emailController = new EmailController();

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Configurações de email
router.get('/settings', (req, res) => emailController.getEmailSettings(req, res));
router.post('/settings', (req, res) => emailController.saveEmailSettings(req, res));

// Sincronização de emails
router.post('/sync', (req, res) => emailController.syncEmails(req, res));

// Envio de emails
router.post('/send', (req, res) => emailController.sendEmail(req, res));

// Listagem de emails
router.get('/', (req, res) => emailController.getEmails(req, res));

// Marcar email como lido
router.patch('/:emailId/read', (req, res) => emailController.markAsRead(req, res));

// Scheduled emails
router.get('/scheduled', (req, res) => emailController.getScheduledEmails(req, res));
router.post('/scheduled', (req, res) => emailController.createScheduledEmail(req, res));
router.put('/scheduled/:id', (req, res) => emailController.updateScheduledEmail(req, res));
router.delete('/scheduled/:id', (req, res) => emailController.deleteScheduledEmail(req, res));

export default router;
