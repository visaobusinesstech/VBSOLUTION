import express from 'express';
import { GoogleIntegrationService } from '../services/google-integration.service';
import { MetaIntegrationService } from '../services/meta-integration.service';

const router = express.Router();
const googleService = new GoogleIntegrationService();
const metaService = new MetaIntegrationService();

// Middleware para obter ownerId (assumindo que vem do token JWT)
const getOwnerId = (req: any) => {
  // Implementar lógica para extrair ownerId do token JWT
  return req.user?.id || '00000000-0000-0000-0000-000000000000';
};

// ===== GOOGLE INTEGRATION =====

// GET /api/integrations/google/auth - Obter URL de autorização do Google
router.get('/google/auth', async (req, res) => {
  try {
    const authUrl = googleService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autorização do Google:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/integrations/callback/google - Callback de autorização do Google
router.get('/callback/google', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Código de autorização não fornecido' });
    }

    const tokens = await googleService.getTokensFromCode(code as string);
    const ownerId = getOwnerId(req);
    
    // Salvar credenciais no banco
    await googleService.saveUserCredentials(ownerId, tokens.accessToken, tokens.refreshToken);
    
    res.json({ 
      success: true, 
      message: 'Google conectado com sucesso!',
      tokens 
    });
  } catch (error) {
    console.error('Erro no callback do Google:', error);
    res.status(500).json({ error: 'Erro ao conectar com Google' });
  }
});

// POST /api/integrations/google/calendar/event - Criar evento no Google Calendar
router.post('/google/calendar/event', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const eventData = req.body;
    
    // Carregar credenciais do usuário
    const isConnected = await googleService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Google não conectado' });
    }

    const event = await googleService.createCalendarEvent(eventData);
    res.json(event);
  } catch (error) {
    console.error('Erro ao criar evento no Google Calendar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/google/meet/meeting - Criar reunião no Google Meet
router.post('/google/meet/meeting', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const eventData = req.body;
    
    // Carregar credenciais do usuário
    const isConnected = await googleService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Google não conectado' });
    }

    const meeting = await googleService.createGoogleMeetMeeting(eventData);
    res.json(meeting);
  } catch (error) {
    console.error('Erro ao criar reunião no Google Meet:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/integrations/google/calendar/availability - Verificar disponibilidade
router.get('/google/calendar/availability', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { timeMin, timeMax, attendees } = req.query;
    
    // Carregar credenciais do usuário
    const isConnected = await googleService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Google não conectado' });
    }

    const attendeesArray = attendees ? (attendees as string).split(',') : [];
    const isAvailable = await googleService.checkAvailability(
      timeMin as string,
      timeMax as string,
      attendeesArray
    );
    
    res.json({ isAvailable });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== META INTEGRATION =====

// GET /api/integrations/meta/auth - Obter URL de autorização do Meta
router.get('/meta/auth', async (req, res) => {
  try {
    const authUrl = metaService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autorização do Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/integrations/callback/meta - Callback de autorização do Meta
router.get('/callback/meta', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Código de autorização não fornecido' });
    }

    const tokens = await metaService.getAccessTokenFromCode(code as string);
    const ownerId = getOwnerId(req);
    
    // Obter páginas do usuário
    await metaService.setAccessToken(tokens.accessToken);
    const pages = await metaService.getPages();
    
    // Salvar credenciais no banco
    await metaService.saveUserCredentials(ownerId, tokens.accessToken, tokens.longLivedToken, pages);
    
    res.json({ 
      success: true, 
      message: 'Meta conectado com sucesso!',
      pages: pages.length
    });
  } catch (error) {
    console.error('Erro no callback do Meta:', error);
    res.status(500).json({ error: 'Erro ao conectar com Meta' });
  }
});

// GET /api/integrations/meta/pages - Obter páginas do Meta
router.get('/meta/pages', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    
    // Carregar credenciais do usuário
    const isConnected = await metaService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Meta não conectado' });
    }

    const pages = await metaService.getPages();
    res.json(pages);
  } catch (error) {
    console.error('Erro ao buscar páginas do Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/meta/facebook/post - Publicar post no Facebook
router.post('/meta/facebook/post', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { pageId, message, link } = req.body;
    
    // Carregar credenciais do usuário
    const isConnected = await metaService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Meta não conectado' });
    }

    // Obter páginas para configurar token da página
    const pages = await metaService.getPages();
    const page = pages.find(p => p.id === pageId);
    
    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    await metaService.setPageAccessToken(pageId, page.access_token);
    const post = await metaService.publishPost(pageId, message, link);
    
    res.json(post);
  } catch (error) {
    console.error('Erro ao publicar post no Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/integrations/meta/facebook/posts - Obter posts do Facebook
router.get('/meta/facebook/posts', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { pageId, limit = 10 } = req.query;
    
    // Carregar credenciais do usuário
    const isConnected = await metaService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Meta não conectado' });
    }

    // Obter páginas para configurar token da página
    const pages = await metaService.getPages();
    const page = pages.find(p => p.id === pageId);
    
    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    await metaService.setPageAccessToken(pageId as string, page.access_token);
    const posts = await metaService.getPagePosts(pageId as string, parseInt(limit as string));
    
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts do Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/integrations/meta/instagram/media - Obter mídia do Instagram
router.get('/meta/instagram/media', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { instagramAccountId, limit = 10 } = req.query;
    
    // Carregar credenciais do usuário
    const isConnected = await metaService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Meta não conectado' });
    }

    // Obter páginas para configurar token da página
    const pages = await metaService.getPages();
    const page = pages.find(p => p.id === instagramAccountId);
    
    if (!page) {
      return res.status(404).json({ error: 'Conta do Instagram não encontrada' });
    }

    await metaService.setPageAccessToken(instagramAccountId as string, page.access_token);
    const media = await metaService.getInstagramMedia(instagramAccountId as string, parseInt(limit as string));
    
    res.json(media);
  } catch (error) {
    console.error('Erro ao buscar mídia do Instagram:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/meta/facebook/comment/reply - Responder comentário
router.post('/meta/facebook/comment/reply', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { commentId, message } = req.body;
    
    // Carregar credenciais do usuário
    const isConnected = await metaService.loadUserCredentials(ownerId);
    if (!isConnected) {
      return res.status(401).json({ error: 'Meta não conectado' });
    }

    const reply = await metaService.replyToComment(commentId, message);
    res.json(reply);
  } catch (error) {
    console.error('Erro ao responder comentário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== CONNECTION STATUS =====

// GET /api/integrations/status - Verificar status das conexões
router.get('/status', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    
    const [googleConnected, metaConnected] = await Promise.all([
      googleService.isUserConnected(ownerId),
      metaService.isUserConnected(ownerId)
    ]);
    
    res.json({
      google: { connected: googleConnected },
      meta: { connected: metaConnected }
    });
  } catch (error) {
    console.error('Erro ao verificar status das conexões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/disconnect - Desconectar serviço
router.post('/disconnect', async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { service } = req.body;
    
    let success = false;
    
    if (service === 'google') {
      success = await googleService.disconnectUser(ownerId);
    } else if (service === 'meta') {
      success = await metaService.disconnectUser(ownerId);
    } else {
      return res.status(400).json({ error: 'Serviço não suportado' });
    }
    
    if (success) {
      res.json({ message: `${service} desconectado com sucesso` });
    } else {
      res.status(500).json({ error: 'Erro ao desconectar' });
    }
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
