import { Router } from 'express';
import { WhatsAppProfileService } from '../services/whatsapp-profile.service';
import { BaileysService } from '../services/baileys.service';

const router = Router();
const baileysService = new BaileysService();
const profileService = new WhatsAppProfileService(baileysService);

/**
 * GET /api/whatsapp-profile/:connectionId/profile-picture/:jid
 * Busca a foto de perfil de um contato
 */
router.get('/:connectionId/profile-picture/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;
    const { highRes } = req.query;

    const profilePictureUrl = await profileService.getProfilePicture(
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
    console.error('Erro ao buscar foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-profile/:connectionId/business-profile/:jid
 * Busca o perfil de negócio de um contato
 */
router.get('/:connectionId/business-profile/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const businessProfile = await profileService.getBusinessProfile(connectionId, jid);

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
    console.error('Erro ao buscar perfil de negócio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-profile/:connectionId/presence/:jid
 * Busca informações de presença de um contato
 */
router.get('/:connectionId/presence/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const presence = await profileService.getPresence(connectionId, jid);

    res.json({
      success: true,
      data: {
        jid,
        presence: presence || {
          lastSeen: null,
          isOnline: false,
          isTyping: false
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar presença:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/whatsapp-profile/:connectionId/full-profile/:jid
 * Busca informações completas do perfil
 */
router.get('/:connectionId/full-profile/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const profile = await profileService.getFullProfile(connectionId, jid);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Erro ao buscar perfil completo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/whatsapp-profile/:connectionId/update-profile-picture/:jid
 * Atualiza a foto de perfil
 */
router.post('/:connectionId/update-profile-picture/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;
    const { imageUrl, imageData } = req.body;

    if (!imageUrl && !imageData) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl ou imageData é obrigatório'
      });
    }

    const success = await profileService.updateProfilePicture(
      connectionId, 
      jid, 
      imageData || imageUrl
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Falha ao atualizar foto de perfil'
      });
    }

    res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso'
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
 * DELETE /api/whatsapp-profile/:connectionId/remove-profile-picture/:jid
 * Remove a foto de perfil
 */
router.delete('/:connectionId/remove-profile-picture/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;

    const success = await profileService.removeProfilePicture(connectionId, jid);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Falha ao remover foto de perfil'
      });
    }

    res.json({
      success: true,
      message: 'Foto de perfil removida com sucesso'
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
 * POST /api/whatsapp-profile/:connectionId/update-profile-name
 * Atualiza o nome do perfil
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

    const success = await profileService.updateProfileName(connectionId, name);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Falha ao atualizar nome do perfil'
      });
    }

    res.json({
      success: true,
      message: 'Nome do perfil atualizado com sucesso'
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
 * POST /api/whatsapp-profile/:connectionId/update-profile-status
 * Atualiza o status do perfil
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

    const success = await profileService.updateProfileStatus(connectionId, status);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Falha ao atualizar status do perfil'
      });
    }

    res.json({
      success: true,
      message: 'Status do perfil atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
