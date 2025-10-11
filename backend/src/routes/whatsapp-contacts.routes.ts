import { Router } from 'express';
import { WhatsAppContactRegistrationService } from '../services/whatsapp-contact-registration.service';
import { BaileysService } from '../services/baileys.service';
import { WhatsAppAdvancedService } from '../services/whatsapp-advanced.service';

const router = Router();
const baileysService = new BaileysService();
const advancedService = new WhatsAppAdvancedService(baileysService);
const contactService = new WhatsAppContactRegistrationService(baileysService, advancedService);

/**
 * POST /api/whatsapp-contacts/register
 * Registrar contato automaticamente
 */
router.post('/register', async (req, res) => {
  try {
    const {
      jid,
      phone,
      whatsappName,
      connectionId,
      ownerId,
      lastMessageContent,
      lastMessageType,
      lastMessageAt
    } = req.body;

    if (!jid || !phone || !connectionId || !ownerId) {
      return res.status(400).json({
        success: false,
        error: 'jid, phone, connectionId e ownerId são obrigatórios'
      });
    }

    const contactData = {
      jid,
      phone,
      whatsappName,
      connectionId,
      ownerId,
      lastMessageContent,
      lastMessageType,
      lastMessageAt: lastMessageAt ? new Date(lastMessageAt) : new Date()
    };

    const contact = await contactService.registerContactFromMessage(contactData);

    res.json({
      success: true,
      message: 'Contato registrado com sucesso',
      data: contact
    });

  } catch (error) {
    console.error('Erro ao registrar contato:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-contacts/sync/:connectionId
 * Sincronizar todos os contatos de uma conexão
 */
router.post('/sync/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'ownerId é obrigatório'
      });
    }

    const contacts = await contactService.syncAllWhatsAppContacts(connectionId, ownerId);

    res.json({
      success: true,
      message: `${contacts.length} contatos sincronizados`,
      data: contacts
    });

  } catch (error) {
    console.error('Erro ao sincronizar contatos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/whatsapp-contacts/:contactId/presence
 * Atualizar presença de um contato
 */
router.put('/:contactId/presence', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { presence, isOnline, isTyping } = req.body;

    const contact = await contactService.updateContactPresence(
      contactId,
      presence,
      isOnline,
      isTyping
    );

    res.json({
      success: true,
      message: 'Presença atualizada',
      data: contact
    });

  } catch (error) {
    console.error('Erro ao atualizar presença:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/whatsapp-contacts/:contactId/profile-picture
 * Atualizar foto de perfil de um contato
 */
router.put('/:contactId/profile-picture', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { profilePictureUrl } = req.body;

    if (!profilePictureUrl) {
      return res.status(400).json({
        success: false,
        error: 'profilePictureUrl é obrigatório'
      });
    }

    const contact = await contactService.updateContactProfilePicture(
      contactId,
      profilePictureUrl
    );

    res.json({
      success: true,
      message: 'Foto de perfil atualizada',
      data: contact
    });

  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-contacts/find-by-jid
 * Buscar contato por JID do WhatsApp
 */
router.get('/find-by-jid', async (req, res) => {
  try {
    const { ownerId, jid } = req.query;

    if (!ownerId || !jid) {
      return res.status(400).json({
        success: false,
        error: 'ownerId e jid são obrigatórios'
      });
    }

    const contact = await contactService.findContactByWhatsAppJid(
      ownerId as string,
      jid as string
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contato não encontrado'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Erro ao buscar contato por JID:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-contacts/find-by-phone
 * Buscar contato por número de telefone
 */
router.get('/find-by-phone', async (req, res) => {
  try {
    const { ownerId, phone } = req.query;

    if (!ownerId || !phone) {
      return res.status(400).json({
        success: false,
        error: 'ownerId e phone são obrigatórios'
      });
    }

    const contact = await contactService.findContactByPhone(
      ownerId as string,
      phone as string
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contato não encontrado'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Erro ao buscar contato por telefone:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-contacts/list/:ownerId
 * Listar todos os contatos WhatsApp de um usuário
 */
router.get('/list/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    const contacts = await contactService.listWhatsAppContacts(ownerId);

    res.json({
      success: true,
      data: contacts,
      total: contacts.length
    });

  } catch (error) {
    console.error('Erro ao listar contatos WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
