import { Router } from 'express';
import { WhatsAppAdvancedService } from '../services/whatsapp-advanced.service';
import { BaileysService } from '../services/baileys.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const baileysService = new BaileysService();
const advancedService = new WhatsAppAdvancedService(baileysService);

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'whatsapp', 'temp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|mp3|wav|ogg|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/connect
 * Conectar com configurações avançadas
 */
router.post('/:connectionId/connect', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { 
      authPath = `./auth_${connectionId}`,
      enableLogging = true,
      enableStore = true,
      enableGroupCache = true,
      markOnlineOnConnect = true
    } = req.body;

    const sock = await advancedService.connectAdvanced({
      connectionId,
      authPath,
      enableLogging,
      enableStore,
      enableGroupCache,
      markOnlineOnConnect
    });

    res.json({
      success: true,
      message: 'Conexão avançada estabelecida',
      connectionId
    });
  } catch (error) {
    console.error('Erro ao conectar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/send-text
 * Enviar mensagem de texto
 */
router.post('/:connectionId/send-text', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, text, options } = req.body;

    if (!jid || !text) {
      return res.status(400).json({
        success: false,
        error: 'jid e text são obrigatórios'
      });
    }

    const result = await advancedService.sendTextMessage(connectionId, jid, text, options);

    res.json({
      success: true,
      message: 'Mensagem de texto enviada',
      result
    });
  } catch (error) {
    console.error('Erro ao enviar texto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/send-media
 * Enviar mensagem de mídia
 */
router.post('/:connectionId/send-media', upload.single('file'), async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, type, caption, mimetype, fileName, gifPlayback, ptt } = req.body;

    if (!jid || !type) {
      return res.status(400).json({
        success: false,
        error: 'jid e type são obrigatórios'
      });
    }

    let mediaData: any = {};
    
    if (req.file) {
      // Arquivo enviado
      mediaData.stream = fs.readFileSync(req.file.path);
      // Limpar arquivo temporário
      fs.unlinkSync(req.file.path);
    } else if (req.body.url) {
      // URL fornecida
      mediaData.url = req.body.url;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Arquivo ou URL é obrigatório'
      });
    }

    const media: any = {
      type,
      caption,
      mimetype,
      fileName,
      gifPlayback: gifPlayback === 'true',
      ptt: ptt === 'true',
      ...mediaData
    };

    const result = await advancedService.sendMediaMessage(connectionId, jid, media);

    res.json({
      success: true,
      message: 'Mensagem de mídia enviada',
      result
    });
  } catch (error) {
    console.error('Erro ao enviar mídia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/send-location
 * Enviar mensagem de localização
 */
router.post('/:connectionId/send-location', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, degreesLatitude, degreesLongitude, name, address } = req.body;

    if (!jid || !degreesLatitude || !degreesLongitude) {
      return res.status(400).json({
        success: false,
        error: 'jid, degreesLatitude e degreesLongitude são obrigatórios'
      });
    }

    const location = {
      degreesLatitude: parseFloat(degreesLatitude),
      degreesLongitude: parseFloat(degreesLongitude),
      name,
      address
    };

    const result = await advancedService.sendLocationMessage(connectionId, jid, location);

    res.json({
      success: true,
      message: 'Mensagem de localização enviada',
      result
    });
  } catch (error) {
    console.error('Erro ao enviar localização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/send-contact
 * Enviar mensagem de contato
 */
router.post('/:connectionId/send-contact', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, displayName, vcard } = req.body;

    if (!jid || !displayName || !vcard) {
      return res.status(400).json({
        success: false,
        error: 'jid, displayName e vcard são obrigatórios'
      });
    }

    const contact = {
      displayName,
      contacts: [{ vcard }]
    };

    const result = await advancedService.sendContactMessage(connectionId, jid, contact);

    res.json({
      success: true,
      message: 'Mensagem de contato enviada',
      result
    });
  } catch (error) {
    console.error('Erro ao enviar contato:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/send-poll
 * Enviar enquete
 */
router.post('/:connectionId/send-poll', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, name, values, selectableCount, toAnnouncementGroup } = req.body;

    if (!jid || !name || !values || !Array.isArray(values)) {
      return res.status(400).json({
        success: false,
        error: 'jid, name e values são obrigatórios'
      });
    }

    const poll = {
      name,
      values,
      selectableCount: parseInt(selectableCount) || 1,
      toAnnouncementGroup: toAnnouncementGroup === 'true'
    };

    const result = await advancedService.sendPollMessage(connectionId, jid, poll);

    res.json({
      success: true,
      message: 'Enquete enviada',
      result
    });
  } catch (error) {
    console.error('Erro ao enviar enquete:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/react
 * Reagir a mensagem
 */
router.post('/:connectionId/react', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, messageKey, emoji } = req.body;

    if (!jid || !messageKey || !emoji) {
      return res.status(400).json({
        success: false,
        error: 'jid, messageKey e emoji são obrigatórios'
      });
    }

    const result = await advancedService.reactToMessage(connectionId, jid, messageKey, emoji);

    res.json({
      success: true,
      message: 'Reação enviada',
      result
    });
  } catch (error) {
    console.error('Erro ao reagir:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/pin
 * Fixar mensagem
 */
router.post('/:connectionId/pin', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, messageKey, timeInSeconds = 86400 } = req.body;

    if (!jid || !messageKey) {
      return res.status(400).json({
        success: false,
        error: 'jid e messageKey são obrigatórios'
      });
    }

    const result = await advancedService.pinMessage(connectionId, jid, messageKey, timeInSeconds);

    res.json({
      success: true,
      message: 'Mensagem fixada',
      result
    });
  } catch (error) {
    console.error('Erro ao fixar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/mark-read
 * Marcar mensagens como lidas
 */
router.post('/:connectionId/mark-read', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, messageKeys } = req.body;

    if (!jid || !messageKeys || !Array.isArray(messageKeys)) {
      return res.status(400).json({
        success: false,
        error: 'jid e messageKeys são obrigatórios'
      });
    }

    const result = await advancedService.markMessagesAsRead(connectionId, jid, messageKeys);

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas',
      result
    });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/presence
 * Atualizar presença
 */
router.post('/:connectionId/presence', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { presence, jid } = req.body;

    if (!presence) {
      return res.status(400).json({
        success: false,
        error: 'presence é obrigatório'
      });
    }

    const result = await advancedService.updatePresence(connectionId, presence, jid);

    res.json({
      success: true,
      message: 'Presença atualizada',
      result
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
 * GET /api/whatsapp-advanced/:connectionId/profile-picture/:jid
 * Obter foto de perfil
 */
router.get('/:connectionId/profile-picture/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;
    const { highRes } = req.query;

    const profilePictureUrl = await advancedService.getProfilePicture(
      connectionId, 
      jid, 
      highRes === 'true'
    );

    if (!profilePictureUrl) {
      return res.status(404).json({
        success: false,
        error: 'Foto de perfil não encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        jid,
        profilePictureUrl,
        highRes: highRes === 'true'
      }
    });
  } catch (error) {
    console.error('Erro ao obter foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/business-profile/:jid
 * Obter perfil de negócio
 */
router.get('/:connectionId/business-profile/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const businessProfile = await advancedService.getBusinessProfile(connectionId, jid);

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de negócio não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        jid,
        businessProfile
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil de negócio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/subscribe-presence
 * Inscrever-se em presença
 */
router.post('/:connectionId/subscribe-presence', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid } = req.body;

    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'jid é obrigatório'
      });
    }

    const result = await advancedService.subscribeToPresence(connectionId, jid);

    res.json({
      success: true,
      message: 'Inscrito em atualizações de presença',
      result
    });
  } catch (error) {
    console.error('Erro ao inscrever-se em presença:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/update-profile-name
 * Atualizar nome do perfil
 */
router.post('/:connectionId/update-profile-name', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name é obrigatório'
      });
    }

    const result = await advancedService.updateProfileName(connectionId, name);

    res.json({
      success: true,
      message: 'Nome do perfil atualizado',
      result
    });
  } catch (error) {
    console.error('Erro ao atualizar nome do perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/update-profile-status
 * Atualizar status do perfil
 */
router.post('/:connectionId/update-profile-status', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status é obrigatório'
      });
    }

    const result = await advancedService.updateProfileStatus(connectionId, status);

    res.json({
      success: true,
      message: 'Status do perfil atualizado',
      result
    });
  } catch (error) {
    console.error('Erro ao atualizar status do perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/update-profile-picture
 * Atualizar foto de perfil
 */
router.post('/:connectionId/update-profile-picture', upload.single('image'), async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid } = req.body;

    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'jid é obrigatório'
      });
    }

    let imageData: Buffer | string;
    
    if (req.file) {
      imageData = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);
    } else if (req.body.url) {
      imageData = req.body.url;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Arquivo de imagem ou URL é obrigatório'
      });
    }

    const result = await advancedService.updateProfilePicture(connectionId, jid, imageData);

    res.json({
      success: true,
      message: 'Foto de perfil atualizada',
      result
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
 * DELETE /api/whatsapp-advanced/:connectionId/remove-profile-picture
 * Remover foto de perfil
 */
router.delete('/:connectionId/remove-profile-picture', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid } = req.body;

    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'jid é obrigatório'
      });
    }

    const result = await advancedService.removeProfilePicture(connectionId, jid);

    res.json({
      success: true,
      message: 'Foto de perfil removida',
      result
    });
  } catch (error) {
    console.error('Erro ao remover foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/check-whatsapp-id/:jid
 * Verificar se ID existe no WhatsApp
 */
router.get('/:connectionId/check-whatsapp-id/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const exists = await advancedService.checkWhatsAppId(connectionId, jid);

    res.json({
      success: true,
      data: {
        jid,
        exists
      }
    });
  } catch (error) {
    console.error('Erro ao verificar ID do WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/group-metadata/:jid
 * Obter metadados do grupo
 */
router.get('/:connectionId/group-metadata/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const metadata = await advancedService.getGroupMetadata(connectionId, jid);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Grupo não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        jid,
        metadata
      }
    });
  } catch (error) {
    console.error('Erro ao obter metadados do grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/create-group
 * Criar grupo
 */
router.post('/:connectionId/create-group', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { subject, participants } = req.body;

    if (!subject || !participants || !Array.isArray(participants)) {
      return res.status(400).json({
        success: false,
        error: 'subject e participants são obrigatórios'
      });
    }

    const result = await advancedService.createGroup(connectionId, subject, participants);

    res.json({
      success: true,
      message: 'Grupo criado',
      data: result
    });
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/update-group-participants
 * Atualizar participantes do grupo
 */
router.post('/:connectionId/update-group-participants', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, participants, action } = req.body;

    if (!jid || !participants || !action) {
      return res.status(400).json({
        success: false,
        error: 'jid, participants e action são obrigatórios'
      });
    }

    const result = await advancedService.updateGroupParticipants(connectionId, jid, participants, action);

    res.json({
      success: true,
      message: 'Participantes do grupo atualizados',
      result
    });
  } catch (error) {
    console.error('Erro ao atualizar participantes do grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/update-group-subject
 * Atualizar assunto do grupo
 */
router.post('/:connectionId/update-group-subject', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, subject } = req.body;

    if (!jid || !subject) {
      return res.status(400).json({
        success: false,
        error: 'jid e subject são obrigatórios'
      });
    }

    const result = await advancedService.updateGroupSubject(connectionId, jid, subject);

    res.json({
      success: true,
      message: 'Assunto do grupo atualizado',
      result
    });
  } catch (error) {
    console.error('Erro ao atualizar assunto do grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/update-group-description
 * Atualizar descrição do grupo
 */
router.post('/:connectionId/update-group-description', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, description } = req.body;

    if (!jid || !description) {
      return res.status(400).json({
        success: false,
        error: 'jid e description são obrigatórios'
      });
    }

    const result = await advancedService.updateGroupDescription(connectionId, jid, description);

    res.json({
      success: true,
      message: 'Descrição do grupo atualizada',
      result
    });
  } catch (error) {
    console.error('Erro ao atualizar descrição do grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/leave-group
 * Sair do grupo
 */
router.post('/:connectionId/leave-group', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid } = req.body;

    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'jid é obrigatório'
      });
    }

    const result = await advancedService.leaveGroup(connectionId, jid);

    res.json({
      success: true,
      message: 'Saiu do grupo',
      result
    });
  } catch (error) {
    console.error('Erro ao sair do grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/group-invite-code/:jid
 * Obter código de convite do grupo
 */
router.get('/:connectionId/group-invite-code/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const code = await advancedService.getGroupInviteCode(connectionId, jid);

    res.json({
      success: true,
      data: {
        jid,
        code,
        inviteLink: `https://chat.whatsapp.com/${code}`
      }
    });
  } catch (error) {
    console.error('Erro ao obter código de convite:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/revoke-group-invite
 * Revogar código de convite do grupo
 */
router.post('/:connectionId/revoke-group-invite', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid } = req.body;

    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'jid é obrigatório'
      });
    }

    const code = await advancedService.revokeGroupInviteCode(connectionId, jid);

    res.json({
      success: true,
      message: 'Código de convite revogado',
      data: {
        jid,
        newCode: code,
        inviteLink: `https://chat.whatsapp.com/${code}`
      }
    });
  } catch (error) {
    console.error('Erro ao revogar código de convite:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/accept-group-invite
 * Aceitar convite do grupo
 */
router.post('/:connectionId/accept-group-invite', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'code é obrigatório'
      });
    }

    const result = await advancedService.acceptGroupInvite(connectionId, code);

    res.json({
      success: true,
      message: 'Convite aceito',
      data: result
    });
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/group-invite-info/:code
 * Obter informações do convite do grupo
 */
router.get('/:connectionId/group-invite-info/:code', async (req, res) => {
  try {
    const { connectionId, code } = req.params;

    const info = await advancedService.getGroupInviteInfo(connectionId, code);

    res.json({
      success: true,
      data: {
        code,
        info
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações do convite:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/block-user
 * Bloquear/desbloquear usuário
 */
router.post('/:connectionId/block-user', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { jid, action } = req.body;

    if (!jid || !action) {
      return res.status(400).json({
        success: false,
        error: 'jid e action são obrigatórios'
      });
    }

    const result = await advancedService.updateBlockStatus(connectionId, jid, action);

    res.json({
      success: true,
      message: `Usuário ${action === 'block' ? 'bloqueado' : 'desbloqueado'}`,
      result
    });
  } catch (error) {
    console.error('Erro ao bloquear/desbloquear usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/privacy-settings
 * Obter configurações de privacidade
 */
router.get('/:connectionId/privacy-settings', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const settings = await advancedService.getPrivacySettings(connectionId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao obter configurações de privacidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-advanced/:connectionId/block-list
 * Obter lista de bloqueados
 */
router.get('/:connectionId/block-list', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const blockList = await advancedService.getBlockList(connectionId);

    res.json({
      success: true,
      data: {
        blockList
      }
    });
  } catch (error) {
    console.error('Erro ao obter lista de bloqueados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-advanced/:connectionId/disconnect
 * Desconectar
 */
router.post('/:connectionId/disconnect', async (req, res) => {
  try {
    const { connectionId } = req.params;

    await advancedService.disconnect(connectionId);

    res.json({
      success: true,
      message: 'Desconectado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
