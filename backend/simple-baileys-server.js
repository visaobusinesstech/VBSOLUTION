const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
// Importar fetch para download de mídias
const fetch = require('node-fetch');
// Importar Baileys dinamicamente
let makeWASocket, DisconnectReason, useMultiFileAuthState, Boom, downloadMediaMessage, jidNormalizedUser;
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { mapToDbRow } = require('./message-normalizer');
// ContactInfoExtractor e WhatsAppProfileSyncService integrados diretamente no servidor Baileys

// ✅ DEBOUNCE: Map para controlar timeouts do AI Agent
const aiAgentTimeouts = new Map();

// ===== CONTACT INFO EXTRACTOR INTEGRADO =====
class ContactInfoExtractor {
  constructor(sock) {
    this.sock = sock;
    this.contactCache = new Map();
    this.groupCache = new Map();
  }

  // Método para obter todos os grupos participantes
  async fetchAllParticipatingGroups() {
    try {
      console.log('🔍 [GROUP-FETCH] Buscando todos os grupos participantes...');
      
      if (typeof this.sock?.groupFetchAllParticipating === 'function') {
        const groups = await this.sock.groupFetchAllParticipating();
        console.log(`✅ [GROUP-FETCH] Encontrados ${Object.keys(groups).length} grupos`);
        return groups;
      } else {
        console.log('ℹ️ [GROUP-FETCH] groupFetchAllParticipating não disponível');
        return {};
      }
    } catch (error) {
      console.error('❌ [GROUP-FETCH] Erro ao buscar grupos:', error);
      return {};
    }
  }

  // Método principal para extrair todas as informações de um contato
  async extractFullContactInfo(chatId, message = null) {
    // Silent contact extraction - logs removed for production
    
    const contactInfo = {
      chatId,
      phone: this.extractPhoneFromChatId(chatId),
      isGroup: chatId.includes('@g.us'),
      isBusiness: false,
      isVerified: false,
      name: null,
      pushName: message?.pushName || null,
      businessName: null,
      businessDescription: null,
      businessCategory: null,
      businessEmail: null,
      businessWebsite: null,
      businessAddress: null,
      profilePicture: null,
      status: null,
      lastSeen: null,
      isOnline: false,
      isBlocked: false,
      isMuted: false,
      participants: [],
      groupSubject: null,
      groupDescription: null,
      groupOwner: null,
      groupAdmins: [],
      groupCreated: null,
      groupSettings: {},
      rawData: {}
    };

    try {
      // ETAPA 1: INFORMAÇÕES BÁSICAS
      // Silent extraction step 1
      
      // Nome do contato
      if (this.sock?.store?.contacts?.[chatId]) {
        const contact = this.sock.store.contacts[chatId];
        contactInfo.name = contact.name || contact.notify || contact.vname;
        contactInfo.pushName = contact.pushName || contact.notify;
        // Silent: contact name found
      }

      // ETAPA 2: INFORMAÇÕES DE NEGÓCIO
      // Silent extraction step 2
      
      // Skip business profile for groups as they don't have business profiles
      if (!contactInfo.isGroup && typeof this.sock?.getBusinessProfile === 'function') {
        try {
          // Silent: checking business profile
          
          // Tentar com retry para business profile (reduced attempts for faster processing)
          let businessProfile = null;
          for (let attempt = 1; attempt <= 2; attempt++) { // Reduced from 3 to 2 attempts
            try {
              // Silent: business profile retry attempt
              businessProfile = await Promise.race([
                this.sock.getBusinessProfile(chatId),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)) // Reduced from 5s to 2s
              ]);
              // Silent: business profile response received
              break;
            } catch (error) {
              // Silent: business profile attempt failed
              if (attempt === 2) { // Updated from 3 to 2
                // Silent: all business profile attempts failed
              }
            }
          }
          
          if (businessProfile) {
            contactInfo.isBusiness = true;
            // Mapear campos corretos baseado na estrutura real retornada pelo WhatsApp
            contactInfo.businessName = businessProfile.business_name || null;
            contactInfo.businessDescription = businessProfile.description || null;
            contactInfo.businessCategory = businessProfile.category || null;
            contactInfo.businessEmail = businessProfile.email || null;
            contactInfo.businessWebsite = businessProfile.website ? (Array.isArray(businessProfile.website) ? businessProfile.website[0] : businessProfile.website) : null;
            contactInfo.businessAddress = businessProfile.address || null;
            contactInfo.isVerified = businessProfile.verified || false;
            // Silent: business profile found
          } else {
            // Silent: no business profile found
          }
        } catch (error) {
          // Silent: business profile not available
        }
      }

      // ETAPA 3: INFORMAÇÕES DE PERFIL
      // Silent extraction step 3
      
      if (typeof this.sock?.profilePictureUrl === 'function') {
        try {
          const profilePic = await this.sock.profilePictureUrl(chatId);
          if (profilePic) {
            contactInfo.profilePicture = profilePic;
            // Silent: profile picture found
          }
        } catch (error) {
          // Silent: profile picture not available
        }
      }

      // ETAPA 4: STATUS E PRESENÇA
      // Silent extraction step 4
      
      // Status do contato
      if (typeof this.sock?.getStatus === 'function') {
        try {
          const status = await this.sock.getStatus(contactInfo.chatId);
          if (status) {
            contactInfo.status = status.status;
            contactInfo.lastSeen = status.setAt ? new Date(status.setAt).toISOString() : null;
            // Silent: status found
          }
        } catch (error) {
          // Silent: status not available
        }
      }

      // Verificar se está online
      if (this.sock?.store?.presences?.[contactInfo.chatId]) {
        const presence = this.sock.store.presences[contactInfo.chatId];
        contactInfo.isOnline = presence.lastSeen && (Date.now() - presence.lastSeen) < 30000; // 30 segundos
        contactInfo.rawData.presence = presence;
        // Silent: presence found
      }

      // ETAPA 5: INFORMAÇÕES DE GRUPO
      // Silent extraction step 5
      
      if (contactInfo.isGroup) {
        // Silent: extracting group info
        
        if (typeof this.sock?.groupMetadata === 'function') {
          try {
            // Silent: group metadata available
            
            const groupMetadata = await this.sock.groupMetadata(chatId);
            if (groupMetadata) {
              // Silent: group metadata found
              
              contactInfo.groupSubject = groupMetadata.subject;
              contactInfo.groupDescription = groupMetadata.desc;
              contactInfo.groupOwner = groupMetadata.owner;
              contactInfo.groupAdmins = groupMetadata.participants.filter(p => p.admin === 'admin').map(p => p.id);
              contactInfo.groupCreated = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toISOString() : null;
              contactInfo.participants = groupMetadata.participants.map(p => ({
                id: p.id,
                admin: p.admin,
                name: p.name || p.id.split('@')[0]
              }));
              
              // Silent: group metadata processed
            }
          } catch (error) {
            // Silent: group metadata not available
          }
        }
      }

      // ETAPA 6: CONFIGURAÇÕES
      // Silent extraction step 6
      
      // Verificar se está bloqueado, silenciado, etc.
      if (this.sock?.store?.chats?.[chatId]) {
        const chat = this.sock.store.chats[chatId];
        contactInfo.isBlocked = chat.blocked || false;
        contactInfo.isMuted = chat.muted || false;
        contactInfo.rawData.chat = chat;
      }

      // Silent: contact extraction completed

      // Silent: extracted information summary

      if (contactInfo.isGroup) {
        // Silent: group information summary
      }

      return contactInfo;

    } catch (error) {
      console.error('❌ [CONTACT-EXTRACTOR] Erro na extração:', error);
      return contactInfo; // Retornar informações parciais
    }
  }

  // Método auxiliar para extrair telefone do chatId
  extractPhoneFromChatId(chatId) {
    if (chatId.includes('@g.us')) {
      return chatId.split('@')[0];
    }
    return chatId.split('@')[0].replace('+', '');
  }
}

// ===== WHATSAPP PROFILE SYNC SERVICE INTEGRADO =====
class WhatsAppProfileSyncService {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.extractor = null;
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  // Inicializar o serviço com extractor
  initialize(extractor) {
    this.extractor = extractor;
    console.log('✅ [PROFILE-SYNC] Serviço inicializado');
  }

  // Sincronização completa de todos os contatos e grupos
  async syncAllProfiles(ownerId, connectionId) {
    if (this.syncInProgress) {
      console.log('⚠️ [PROFILE-SYNC] Sincronização já em andamento');
      return;
    }

    if (!this.extractor) {
      console.error('❌ [PROFILE-SYNC] Extrator não inicializado');
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 [PROFILE-SYNC] Iniciando sincronização completa...');

    try {
      // 1. Buscar todos os grupos participantes
      const groups = await this.extractor.fetchAllParticipatingGroups();
      console.log(`📊 [PROFILE-SYNC] Encontrados ${Object.keys(groups).length} grupos`);

      // 2. Processar cada grupo
      for (const [groupId, groupData] of Object.entries(groups)) {
        try {
          await this.syncGroupProfile(groupId, ownerId, connectionId);
          // Pequena pausa para evitar rate limiting
          await this.delay(1000);
        } catch (error) {
          console.error(`❌ [PROFILE-SYNC] Erro ao processar grupo ${groupId}:`, error.message);
        }
      }

      // 3. Buscar contatos individuais do store
      if (this.extractor.sock?.store?.contacts) {
        const individualContacts = Object.keys(this.extractor.sock.store.contacts)
          .filter(contactId => !contactId.includes('@g.us'));
        
        console.log(`📊 [PROFILE-SYNC] Encontrados ${individualContacts.length} contatos individuais`);

        for (const contactId of individualContacts) {
          try {
            await this.syncContactProfile(contactId, ownerId, connectionId);
            // Pequena pausa para evitar rate limiting
            await this.delay(500);
          } catch (error) {
            console.error(`❌ [PROFILE-SYNC] Erro ao processar contato ${contactId}:`, error.message);
          }
        }
      }

      this.lastSyncTime = new Date();
      console.log('✅ [PROFILE-SYNC] Sincronização completa finalizada');

    } catch (error) {
      console.error('❌ [PROFILE-SYNC] Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sincronizar perfil de um grupo específico
  async syncGroupProfile(groupId, ownerId, connectionId) {
    try {
      console.log(`🔄 [GROUP-SYNC] Sincronizando grupo: ${groupId}`);

      // Extrair informações completas do grupo
      const groupInfo = await this.extractor.extractFullContactInfo(groupId);
      
      if (!groupInfo) {
        console.log('⚠️ [GROUP-SYNC] Informações do grupo não encontradas');
        return;
      }

      // Salvar na tabela contacts
      await this.saveGroupToContacts(groupInfo, ownerId, connectionId);

      console.log(`✅ [GROUP-SYNC] Grupo sincronizado: ${groupInfo.groupSubject || groupId}`);

    } catch (error) {
      console.error(`❌ [GROUP-SYNC] Erro ao sincronizar grupo ${groupId}:`, error);
    }
  }

  // Sincronizar perfil de um contato específico
  async syncContactProfile(contactId, ownerId, connectionId) {
    try {
      console.log(`🔄 [CONTACT-SYNC] Sincronizando contato: ${contactId}`);

      // Extrair informações completas do contato
      const contactInfo = await this.extractor.extractFullContactInfo(contactId);
      
      if (!contactInfo) {
        console.log('⚠️ [CONTACT-SYNC] Informações do contato não encontradas');
        return;
      }

      // Salvar na tabela contacts
      await this.saveContactToContacts(contactInfo, ownerId, connectionId);

      console.log(`✅ [CONTACT-SYNC] Contato sincronizado: ${contactInfo.name || contactId}`);

    } catch (error) {
      console.error(`❌ [CONTACT-SYNC] Erro ao sincronizar contato ${contactId}:`, error);
    }
  }

  // Salvar grupo na tabela contacts
  async saveGroupToContacts(groupInfo, ownerId, connectionId) {
    try {
      const { data: existingContact, error: findError } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('whatsapp_jid', groupInfo.chatId)
        .eq('owner_id', ownerId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      const contactData = {
        owner_id: ownerId,
        name: groupInfo.groupSubject || groupInfo.name || 'Grupo WhatsApp',
        phone: groupInfo.phone,
        whatsapp_jid: groupInfo.chatId,
        whatsapp_connection_id: connectionId,
        whatsapp_is_group: true,
        whatsapp_group_subject: groupInfo.groupSubject,
        whatsapp_group_description: groupInfo.groupDescription,
        whatsapp_group_owner: groupInfo.groupOwner,
        whatsapp_group_admins: JSON.stringify(groupInfo.groupAdmins),
        whatsapp_group_participants: JSON.stringify(groupInfo.participants),
        whatsapp_group_created: groupInfo.groupCreated,
        whatsapp_group_settings: JSON.stringify(groupInfo.groupSettings),
        whatsapp_raw_data: JSON.stringify(groupInfo.rawData),
        updated_at: new Date().toISOString()
      };

      if (existingContact) {
        // Atualizar contato existente
        const { error: updateError } = await this.supabase
          .from('contacts')
          .update(contactData)
          .eq('id', existingContact.id);

        if (updateError) throw updateError;
        console.log('✅ [GROUP-SYNC] Grupo atualizado na tabela contacts');
      } else {
        // Criar novo contato
        contactData.created_at = new Date().toISOString();
        contactData.last_contact_at = new Date().toISOString();
        contactData.status = 'active';
        contactData.ai_enabled = false;

        const { error: insertError } = await this.supabase
          .from('contacts')
          .insert(contactData);

        if (insertError) throw insertError;
        console.log('✅ [GROUP-SYNC] Grupo criado na tabela contacts');
      }

    } catch (error) {
      console.error('❌ [GROUP-SYNC] Erro ao salvar grupo na tabela contacts:', error);
    }
  }

  // Salvar contato na tabela contacts
  async saveContactToContacts(contactInfo, ownerId, connectionId) {
    try {
      const { data: existingContact, error: findError } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('whatsapp_jid', contactInfo.chatId)
        .eq('owner_id', ownerId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      const contactData = {
        owner_id: ownerId,
        name: contactInfo.name || contactInfo.pushName || 'Contato WhatsApp',
        phone: contactInfo.phone,
        whatsapp_jid: contactInfo.chatId,
        whatsapp_connection_id: connectionId,
        whatsapp_is_group: contactInfo.isGroup || false,
        whatsapp_business_name: contactInfo.businessName,
        whatsapp_business_description: contactInfo.businessDescription,
        whatsapp_business_category: contactInfo.businessCategory,
        whatsapp_business_email: contactInfo.businessEmail,
        whatsapp_business_website: contactInfo.businessWebsite,
        whatsapp_business_address: contactInfo.businessAddress,
        whatsapp_verified: contactInfo.isVerified,
        whatsapp_online: contactInfo.isOnline,
        whatsapp_blocked: contactInfo.isBlocked,
        whatsapp_muted: contactInfo.isMuted,
        whatsapp_status: contactInfo.status,
        whatsapp_last_seen: contactInfo.lastSeen,
        // Campos de grupo
        whatsapp_group_subject: contactInfo.groupSubject,
        whatsapp_group_description: contactInfo.groupDescription,
        whatsapp_group_owner: contactInfo.groupOwner,
        whatsapp_group_admins: JSON.stringify(contactInfo.groupAdmins || []),
        whatsapp_group_participants: JSON.stringify(contactInfo.participants || []),
        whatsapp_group_created: contactInfo.groupCreated,
        whatsapp_group_settings: JSON.stringify(contactInfo.groupSettings || {}),
        whatsapp_raw_data: JSON.stringify(contactInfo.rawData),
        updated_at: new Date().toISOString()
      };

      if (existingContact) {
        // Atualizar contato existente
        const { error: updateError } = await this.supabase
          .from('contacts')
          .update(contactData)
          .eq('id', existingContact.id);

        if (updateError) throw updateError;
        console.log('✅ [CONTACT-SYNC] Contato atualizado na tabela contacts');
      } else {
        // Criar novo contato
        contactData.created_at = new Date().toISOString();
        contactData.last_contact_at = new Date().toISOString();
        contactData.status = 'active';
        contactData.ai_enabled = false;

        const { error: insertError } = await this.supabase
          .from('contacts')
          .insert(contactData);

        if (insertError) throw insertError;
        console.log('✅ [CONTACT-SYNC] Contato criado na tabela contacts');
      }

    } catch (error) {
      console.error('❌ [CONTACT-SYNC] Erro ao salvar contato na tabela contacts:', error);
    }
  }

  // Método auxiliar para delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Load environment variables
require('dotenv').config({ path: './backend/env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Inicializar serviço de sincronização de perfil
const profileSyncService = new WhatsAppProfileSyncService(supabaseUrl, supabaseServiceKey);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    methods: ["GET", "POST"]
  }
});

// Importar PortFinder para detecção automática de portas
const PortFinder = require('../port-finder');

// Função para encontrar porta disponível com limpeza automática
async function findAvailablePort() {
  const finder = new PortFinder();
  try {
    // Primeiro, tentar sem limpeza agressiva
    let ports = await finder.findPorts(false);
    return ports.backend;
  } catch (error) {
    console.warn('⚠️ Erro na detecção normal, tentando limpeza agressiva...', error.message);
    
    try {
      // Se falhar, tentar com limpeza agressiva
      const ports = await finder.findPorts(true);
      return ports.backend;
    } catch (aggressiveError) {
      console.error('❌ Erro mesmo com limpeza agressiva, usando porta padrão:', aggressiveError.message);
      return process.env.PORT || 3000;
    }
  }
}

let PORT = process.env.PORT || 3000; // Fixed port to match frontend configuration

// Middlewares
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:4173", "http://localhost:4174", "http://localhost:4175"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-User-Id"],
  optionsSuccessStatus: 200
}));
// 🔥 AGGRESSIVE CORS FORCE for QR code fixes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", 
    "http://localhost:5176", "http://localhost:4173", "http://localhost:4174", "http://localhost:4175"
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // console.log('🔥 CORS REQUEST from origin:', origin); // Removido para reduzir spam de logs
  next();
});

// Middleware para lidar com requisições OPTIONS (preflight)
app.options('*', (req, res) => {
  console.log('🔥 PREFLIGHT request from origin:', req.headers.origin);
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", 
    "http://localhost:5176", "http://localhost:4173", "http://localhost:4174", "http://localhost:4175"
  ];
  
  const allowOrigin = allowedOrigins.includes(origin) ? origin : '*';
  console.log('🔥 Setting CORS headers for:', allowOrigin);
  
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use(express.json());

// Multer para upload de arquivos
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'temp');
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
    console.log('🔍 [FILE-FILTER] Verificando arquivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase()
    });
    
    // Tipos permitidos - sendo mais permissivo com áudios
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|mp3|wav|ogg|webm|pdf|doc|docx|txt|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    // Verificar se é áudio de qualquer tipo
    const isAudio = file.mimetype.startsWith('audio/') || 
                   file.originalname.includes('recording') ||
                   file.originalname.includes('audio') ||
                   /\.(webm|ogg|mp3|wav|mp4|m4a)$/i.test(file.originalname);
    
    // Verificar se é vídeo
    const isVideo = file.mimetype.startsWith('video/') ||
                   /\.(mp4|avi|mov|webm|mkv)$/i.test(file.originalname);
    
    // Verificar se é imagem
    const isImage = file.mimetype.startsWith('image/') ||
                   /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
    
    // Verificar se é documento
    const isDocument = /\.(pdf|doc|docx|txt|xlsx|xls)$/i.test(file.originalname);
    
    if (isAudio || isVideo || isImage || isDocument || (mimetype && extname)) {
      console.log('✅ [FILE-FILTER] Arquivo permitido:', {
        isAudio,
        isVideo,
        isImage,
        isDocument,
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      return cb(null, true);
    } else {
      console.log('❌ [FILE-FILTER] Arquivo não permitido:', {
        extname,
        mimetype: file.mimetype,
        originalname: file.originalname,
        isAudio,
        isVideo,
        isImage,
        isDocument
      });
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Importar OpenAI para funcionalidades de IA
const OpenAI = require('openai');

// Rotas de IA
app.post('/api/ai/process-text', async (req, res) => {
  try {
    const { prompt, model = 'gpt-4o-mini', apiKey } = req.body;

    if (!prompt || !apiKey) {
      return res.status(400).json({ 
        error: 'Prompt e API key são obrigatórios' 
      });
    }

    // Validar formato da API key
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ 
        error: 'API Key inválida' 
      });
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Fazer requisição para OpenAI
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de texto especializado em melhorar, corrigir e processar textos. Sempre responda APENAS com o texto processado, sem explicações adicionais ou comentários. Mantenha o tom e estilo da mensagem original. Use aspas naturalmente quando apropriado no texto.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const processedText = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      text: processedText.trim()
    });

  } catch (error) {
    console.error('Erro ao processar texto com IA:', error);
    
    // Tratar erros específicos da OpenAI
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'API Key inválida' 
      });
    }
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'Cota da API excedida' 
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// Verificar status da API key
app.post('/api/ai/check-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key é obrigatória' 
      });
    }

    // Validar formato da API key
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ 
        error: 'API Key inválida' 
      });
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Fazer uma requisição simples para verificar a API key
    const models = await openai.models.list();

    res.json({
      success: true,
      valid: true,
      models: models.data.map(model => ({
        id: model.id,
        owned_by: model.owned_by
      }))
    });

  } catch (error) {
    console.error('Erro ao verificar API key:', error);
    
    res.json({
      success: false,
      valid: false,
      error: error.message
    });
  }
});

// Armazenar conexões ativas
const activeConnections = new Map();
// Contador de tentativas de reconexão por conexão
const reconnectionAttempts = new Map();
const MAX_RECONNECTION_ATTEMPTS = 3;

// Função para buscar usuário ativo (session_status = 'connected')
async function getActiveUser() {
  try {
    const { data: activeUser, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .eq('session_status', 'connected')
      .maybeSingle();
    
    if (error) {
      console.error('❌ Erro ao buscar usuário ativo:', error);
      return null;
    }
    
    if (!activeUser) {
      console.error('❌ Nenhum usuário ativo encontrado (session_status = connected)');
      return null;
    }
    
    console.log(`👤 Usuário ativo encontrado: ${activeUser.email} (${activeUser.id})`);
    return activeUser;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário ativo:', error);
    return null;
  }
}

// Helpers para envio de mensagens
function ensureJid(chatId) {
  if (!chatId) throw new Error('chatId required');
  
  console.log('🔍 [ENSURE-JID] Processando chatId:', chatId);
  
  try {
    let normalizedJid;
    
    // Função de normalização própria para evitar dependência do Baileys
    const normalizeJid = (jid) => {
      if (!jid) return null;
      
      // Se já tem @, verificar se está no formato correto
      if (jid.includes('@')) {
        // Se termina com @c.us, converter para @s.whatsapp.net
        if (jid.endsWith('@c.us')) {
          return jid.replace('@c.us', '@s.whatsapp.net');
        }
        // Se já termina com @s.whatsapp.net, retornar como está
        if (jid.endsWith('@s.whatsapp.net')) {
          return jid;
        }
        // Se tem @ mas não é um dos formatos conhecidos, assumir que é @s.whatsapp.net
        return jid;
      }
      
      // Se é apenas números, adicionar @s.whatsapp.net
      if (/^\d+$/.test(jid)) {
        return `${jid}@s.whatsapp.net`;
      }
      
      // Para outros casos, adicionar @s.whatsapp.net
      return `${jid}@s.whatsapp.net`;
    };
    
    if (/^\d+$/.test(chatId)) {
      normalizedJid = normalizeJid(`${chatId}@s.whatsapp.net`);
    } else if (/@c\.us$/.test(chatId)) {
      normalizedJid = normalizeJid(chatId.replace('@c.us', '@s.whatsapp.net'));
    } else {
      normalizedJid = normalizeJid(chatId);
    }
    
    console.log('✅ [ENSURE-JID] JID normalizado:', normalizedJid);
    return normalizedJid;
  } catch (error) {
    console.error('❌ [ENSURE-JID] Erro ao normalizar JID:', error);
    console.error('❌ [ENSURE-JID] chatId original:', chatId);
    throw new Error(`Erro ao normalizar JID: ${error.message}`);
  }
}

async function getSessionInfo(connectionId, supabase) {
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('owner_id, phone')
    .eq('connection_id', connectionId)
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return { ownerId: data?.owner_id ?? null, connectionPhone: data?.phone ?? null };
}

// Função para atualizar contato com dados da mensagem
async function updateContactFromMessage(messageData, userId, sock = null) {
  try {
    const phoneNumber = messageData.phone;
    const chatId = messageData.chat_id;
    const connectionId = messageData.connection_id;
    
    if (!phoneNumber || !chatId || !connectionId) {
      console.log('⚠️ Dados insuficientes para atualizar contato:', { phoneNumber, chatId, connectionId });
      return;
    }

    // Buscar nome real do contato se disponível
    let realContactName = messageData.wpp_name;
    if (sock) {
      const foundName = await getRealContactName(chatId, sock, messageData.wpp_name);
      if (foundName) {
        realContactName = foundName;
        messageData.wpp_name = foundName; // Atualizar também no messageData
        console.log('✅ Nome do contato atualizado para:', foundName);
      }
    }

    // Buscar contato existente
    const { data: existingContact, error: checkError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('owner_id', userId)
      .or(`phone.eq.${phoneNumber},whatsapp_jid.eq.${chatId}`)
      .maybeSingle();

    if (existingContact) {
      console.log('🔄 Atualizando contato existente:', existingContact.id);
      
      // Atualizar dados do WhatsApp - name_wpp deve ser igual a wpp_name
      const updateData = {
        name_wpp: messageData.wpp_name, // Usar o mesmo valor de wpp_name
        whatsapp_name: messageData.wpp_name,
        whatsapp_jid: chatId,
        whatsapp_connection_id: connectionId,
        whatsapp_last_message_at: new Date().toISOString(),
        whatsapp_last_message_content: messageData.conteudo,
        whatsapp_last_message_type: messageData.message_type,
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Incrementar contador de mensagens
      const { error: updateError } = await supabaseAdmin
        .from('contacts')
        .update(updateData)
        .eq('id', existingContact.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar contato:', updateError);
      } else {
        console.log('✅ Contato atualizado com sucesso');
      }
    }
  } catch (error) {
    console.error('❌ Erro na função updateContactFromMessage:', error);
  }
}

// Função unificada para processar mídia recebida
async function processIncomingMediaMessage(message, connectionId, userId) {
  try {
    console.log('📎 [UNIFIED-MEDIA] Processando mídia recebida...');
    
    // Obter sock da conexão ativa
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      console.error('❌ [UNIFIED-MEDIA] Conexão não encontrada para:', connectionId);
      console.error('❌ [UNIFIED-MEDIA] Conexões ativas:', Array.from(activeConnections.keys()));
      return null;
    }
    
    const sock = connection.sock;
    if (!sock) {
      console.error('❌ [UNIFIED-MEDIA] Socket não disponível para processar mídia');
      return null;
    }
    
    console.log('✅ [UNIFIED-MEDIA] Sock encontrado para conexão:', connectionId);
    
    // 1. Baixar mídia do WhatsApp primeiro
    const buffer = await downloadMediaMessage(
      message,
      'buffer',
      {},
      {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      }
    );
    
    if (!buffer || buffer.length === 0) {
      console.error('❌ [UNIFIED-MEDIA] Falha ao baixar buffer de mídia');
      return null;
    }
    
    console.log(`📎 [UNIFIED-MEDIA] Mídia baixada: ${buffer.length} bytes`);
    
    // 2. Determinar tipo de mídia e mimetype
    const mediaInfo = extractMediaInfo(message);
    
    // 3. Upload para Supabase Storage imediatamente
    const fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${getFileExtension(mediaInfo.mimetype)}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('whatsapp')
      .upload(fileName, buffer, {
        contentType: mediaInfo.mimetype,
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ [UNIFIED-MEDIA] Falha no upload:', uploadError);
      return null;
    }
    
    console.log('✅ [UNIFIED-MEDIA] Mídia salva no Supabase:', fileName);
    
    // 4. Criar URL assinada
    const { data: signedUrl } = await supabaseAdmin.storage
      .from('whatsapp')
      .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 dias
    
    if (!signedUrl) {
      console.error('❌ [UNIFIED-MEDIA] Falha ao criar URL assinada');
      return null;
    }
    
    console.log('✅ [UNIFIED-MEDIA] URL pública criada');
    
    return {
      url: signedUrl.signedUrl,
      mimetype: mediaInfo.mimetype,
      size: buffer.length,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('❌ [UNIFIED-MEDIA] Falha no processamento de mídia:', error);
    return null;
  }
}

// Função auxiliar para extrair informações de mídia
function extractMediaInfo(message) {
  let mimetype = 'application/octet-stream';
  let mediaType = 'unknown';
  
  if (message.message?.imageMessage) {
    mimetype = message.message.imageMessage.mimetype || 'image/jpeg';
    mediaType = 'image';
  } else if (message.message?.videoMessage) {
    mimetype = message.message.videoMessage.mimetype || 'video/mp4';
    mediaType = 'video';
  } else if (message.message?.audioMessage) {
    mimetype = message.message.audioMessage.mimetype || 'audio/ogg';
    mediaType = 'audio';
  } else if (message.message?.stickerMessage) {
    mimetype = message.message.stickerMessage.mimetype || 'image/webp';
    mediaType = 'sticker';
  } else if (message.message?.documentMessage) {
    mimetype = message.message.documentMessage.mimetype || 'application/octet-stream';
    mediaType = 'document';
  }
  
  return { mimetype, mediaType };
}

// Função auxiliar para obter extensão de arquivo
function getFileExtension(mimetype) {
  // Limpar mimetype removendo codecs e parâmetros extras
  const cleanMimetype = mimetype.split(';')[0].trim();
  
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/avi': 'avi',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/webm': 'webm',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  };
  
  return extensions[cleanMimetype] || 'bin';
}

// Função para verificar se mensagem tem conteúdo de mídia
function hasMediaContent(message) {
  return !!(message.message?.imageMessage || 
            message.message?.videoMessage || 
            message.message?.audioMessage || 
            message.message?.stickerMessage || 
            message.message?.documentMessage);
}

// Função para buscar nome real do contato no WhatsApp
async function getRealContactName(chatId, sock, pushName = null) {
  if (!sock) {
    console.log('ℹ️ Socket não disponível para buscar nome do contato');
    return pushName || null;
  }

  try {
    console.log('🔍 Buscando nome real do contato:', chatId);
    
    let realName = null;
    
    // Método 1: Buscar business profile (para contas business)
    try {
      const businessProfile = await sock.getBusinessProfile(chatId);
      if (businessProfile && businessProfile.business_name) {
        realName = businessProfile.business_name;
        console.log('✅ Nome real encontrado via business profile:', realName);
        return realName;
      }
    } catch (businessError) {
      console.log('ℹ️ Business profile não disponível:', businessError.message);
    }
    
    // Método 2: Buscar no store de contatos (mais rápido)
    try {
      if (sock.store?.contacts?.[chatId]?.name) {
        realName = sock.store.contacts[chatId].name;
        console.log('✅ Nome real encontrado no store:', realName);
        return realName;
      }
    } catch (storeError) {
      console.log('ℹ️ Store de contatos não disponível:', storeError.message);
    }
    
    // Método 3: Usar getContact se disponível
    try {
      if (typeof sock.getContact === 'function') {
        const contact = await sock.getContact(chatId);
        if (contact && contact.name) {
          realName = contact.name;
          console.log('✅ Nome real encontrado via getContact:', realName);
          return realName;
        }
      }
    } catch (contactError) {
      console.log('ℹ️ getContact não disponível:', contactError.message);
    }
    
    // Método 4: Buscar informações do chat usando fetchChats
    try {
      if (typeof sock.fetchChats === 'function') {
        const chatInfo = await sock.fetchChats({ limit: 100 });
        if (chatInfo && Array.isArray(chatInfo)) {
          const foundChat = chatInfo.find(c => c.id === chatId);
          if (foundChat && foundChat.subject && foundChat.subject.trim()) {
            realName = foundChat.subject.trim();
            console.log('✅ Nome real encontrado via fetchChats:', realName);
            return realName;
          }
        }
      }
    } catch (chatError) {
      console.log('ℹ️ fetchChats não disponível:', chatError.message);
    }
    
    // Método 5: Para grupos, tentar buscar informações do grupo
    try {
      if (chatId.includes('@g.us') && typeof sock.groupMetadata === 'function') {
        const groupMetadata = await sock.groupMetadata(chatId);
        if (groupMetadata && groupMetadata.subject) {
          realName = groupMetadata.subject;
          console.log('✅ Nome real encontrado via groupMetadata:', realName);
          return realName;
        }
      }
    } catch (groupError) {
      console.log('ℹ️ groupMetadata não disponível:', groupError.message);
    }
    
    // Fallback: usar pushName se disponível
    if (pushName && pushName.trim()) {
      console.log('✅ Usando pushName como fallback:', pushName);
      return pushName.trim();
    }
    
    console.log('ℹ️ Nenhum nome real encontrado para:', chatId);
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar nome real do contato:', error);
    return pushName || null;
  }
}

// Função para criar contato automaticamente a partir de mensagem
async function createContactFromMessage(messageData, userId, sock = null) {
  try {
    const phoneNumber = messageData.phone;
    const chatId = messageData.chat_id;
    const connectionId = messageData.connection_id;
    
    if (!phoneNumber || !chatId || !connectionId) {
      console.log('⚠️ Dados insuficientes para criar contato:', { phoneNumber, chatId, connectionId });
      return;
    }

    // Usar o extrator completo de informações
    let contactInfo = null;
    if (sock) {
      // Silent contact extraction - logs removed for production
      
      const extractor = new ContactInfoExtractor(sock);
      contactInfo = await extractor.extractFullContactInfo(chatId, messageData);
      
      // Silent: extracted contact information summary
      
      if (contactInfo.isGroup) {
        // Silent: group information summary
      }
      
      if (contactInfo.isBusiness) {
        // Silent: business information summary
      }
      
      // Atualizar messageData com as informações encontradas
      if (contactInfo.name) {
        messageData.wpp_name = contactInfo.name;
        console.log('✅ [FULL-INFO] Nome completo encontrado:', contactInfo.name);
      }
      
      // Adicionar informações de perfil à messageData
      if (contactInfo.isGroup) {
        messageData.whatsapp_is_group = true;
        messageData.whatsapp_group_subject = contactInfo.groupSubject;
        messageData.whatsapp_group_description = contactInfo.groupDescription;
        messageData.whatsapp_group_owner = contactInfo.groupOwner;
        messageData.whatsapp_group_admins = contactInfo.groupAdmins;
        messageData.whatsapp_group_participants = contactInfo.participants;
        messageData.whatsapp_group_created = convertUnixTimestamp(contactInfo.groupCreated);
        messageData.whatsapp_group_settings = contactInfo.groupSettings;
      } else {
        messageData.whatsapp_is_group = false;
        messageData.whatsapp_business_name = contactInfo.businessName;
        messageData.whatsapp_business_description = contactInfo.businessDescription;
        messageData.whatsapp_business_category = contactInfo.businessCategory;
        messageData.whatsapp_business_email = contactInfo.businessEmail;
        messageData.whatsapp_business_website = contactInfo.businessWebsite;
        messageData.whatsapp_business_address = contactInfo.businessAddress;
        messageData.whatsapp_verified = contactInfo.isVerified;
        messageData.whatsapp_online = contactInfo.isOnline;
        messageData.whatsapp_blocked = contactInfo.isBlocked;
        messageData.whatsapp_muted = contactInfo.isMuted;
        messageData.whatsapp_status = contactInfo.status;
        messageData.whatsapp_last_seen = convertUnixTimestamp(contactInfo.lastSeen);
      }
      
      messageData.whatsapp_raw_data = contactInfo.rawData;
      messageData.whatsapp_presence = contactInfo.rawData.presence;
      
    } else {
      // Fallback para método antigo
      let realContactName = messageData.wpp_name;
      const foundName = await getRealContactName(chatId, sock, messageData.wpp_name);
      if (foundName) {
        realContactName = foundName;
        messageData.wpp_name = foundName;
        console.log('✅ Nome do contato atualizado para:', foundName);
      }
    }

    // Verificar se contato já existe
    const { data: existingContact, error: checkError } = await supabaseAdmin
      .from('contacts')
      .select('id, whatsapp_jid, whatsapp_profile_picture, whatsapp_message_count, name_wpp, whatsapp_name')
      .eq('owner_id', userId)
      .or(`phone.eq.${phoneNumber},whatsapp_jid.eq.${chatId}`)
      .maybeSingle();

    if (existingContact) {
      console.log('✅ Contato já existe, atualizando dados:', existingContact.id);
      
      // Usar a função de atualização
      await updateContactFromMessage(messageData, userId, sock);
      
      // Incrementar contador de mensagens separadamente
      const { error: countError } = await supabaseAdmin
        .from('contacts')
        .update({
          whatsapp_message_count: (existingContact.whatsapp_message_count || 0) + 1
        })
        .eq('id', existingContact.id);

      if (countError) {
        console.error('❌ Erro ao incrementar contador de mensagens:', countError);
      } else {
        console.log('✅ Contador de mensagens incrementado');
      }
        
        // Buscar e atualizar foto de perfil se não existir
        if (!existingContact.whatsapp_profile_picture && sock) {
          try {
            console.log('📸 Buscando foto de perfil para contato existente:', chatId);
            // Usar método correto do Baileys para obter foto de perfil
            const profilePictureUrl = await sock.profilePictureUrl(chatId, 'image');
            console.log('📸 Resultado da busca para contato existente:', profilePictureUrl);
            
            if (profilePictureUrl) {
              console.log('📸 Foto de perfil encontrada para contato existente:', profilePictureUrl);
              
              // Atualizar contato com a foto de perfil
              const { error: picUpdateError } = await supabaseAdmin
                .from('contacts')
                .update({ 
                  whatsapp_profile_picture: profilePictureUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingContact.id);
                
              if (picUpdateError) {
                console.error('❌ Erro ao salvar foto de perfil:', picUpdateError);
              } else {
                console.log('✅ Foto de perfil salva para contato existente');
                // updateData já foi definido anteriormente na função
              }
            } else {
              console.log('ℹ️ Nenhuma foto de perfil encontrada para contato existente:', chatId);
            }
          } catch (profileError) {
            console.error('❌ Erro ao buscar foto de perfil para contato existente:', profileError);
            console.error('❌ Detalhes do erro:', profileError.message);
          }
        } else {
          console.log('ℹ️ Contato já possui foto de perfil:', existingContact.whatsapp_profile_picture);
        }
        
        // Emitir evento de atualização
        io.emit('contact:updated', {
          contact: { 
            ...existingContact, 
            name_wpp: messageData.wpp_name,
            whatsapp_name: messageData.wpp_name,
            whatsapp_jid: chatId,
            whatsapp_connection_id: connectionId,
            whatsapp_last_message_at: new Date().toISOString()
          },
          message: 'Contato atualizado com dados do WhatsApp'
        });
        
        return;
      }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar contato existente:', checkError);
      return;
    }

    // Criar novo contato com dados completos do WhatsApp
    let contactData;
    
    if (contactInfo) {
      // Usar informações completas do extrator
      contactData = await new ContactInfoExtractor(sock).saveContactInfoToDatabase(contactInfo, userId);
      if (!contactData) {
        // Fallback se houver erro - name_wpp deve ser igual a wpp_name
        contactData = {
          owner_id: userId,
          name: messageData.wpp_name || `Contato ${phoneNumber}`,
          phone: phoneNumber,
          name_wpp: messageData.wpp_name, // Usar o mesmo valor de wpp_name
          whatsapp_jid: chatId,
          whatsapp_name: messageData.wpp_name,
          whatsapp_connection_id: connectionId,
          whatsapp_registered_at: new Date().toISOString(),
          whatsapp_message_count: 1,
          whatsapp_last_message_at: new Date().toISOString(),
          whatsapp_last_message_content: messageData.conteudo,
          whatsapp_last_message_type: messageData.message_type,
          whatsapp_opted: true,
          ai_enabled: false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_contact_at: new Date().toISOString()
        };
      }
    } else {
      // Fallback para método antigo - name_wpp deve ser igual a wpp_name
      contactData = {
        owner_id: userId,
        name: messageData.wpp_name || `Contato ${phoneNumber}`,
        phone: phoneNumber,
        name_wpp: messageData.wpp_name, // Usar o mesmo valor de wpp_name
        whatsapp_jid: chatId,
        whatsapp_name: messageData.wpp_name,
        whatsapp_connection_id: connectionId,
        whatsapp_registered_at: new Date().toISOString(),
        whatsapp_message_count: 1,
        whatsapp_last_message_at: new Date().toISOString(),
        whatsapp_last_message_content: messageData.conteudo,
        whatsapp_last_message_type: messageData.message_type,
        whatsapp_opted: true,
        ai_enabled: false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString()
      };
    }

    // Inserir novo contato
    const { data: newContact, error: insertError } = await supabaseAdmin
      .from('contacts')
      .insert(contactData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar contato:', insertError);
      return;
    }

    console.log('✅ Contato criado com dados do WhatsApp:', newContact.id);
    
    // Buscar e salvar foto de perfil do WhatsApp
    try {
      console.log('📸 Buscando foto de perfil para:', chatId);
      
      // Tentar múltiplas formas de obter a foto de perfil
      let profilePictureUrl = null;
      
      // Método 1: Usar profilePictureUrl (alta resolução)
      if (sock) {
        try {
          profilePictureUrl = await sock.profilePictureUrl(chatId, 'image');
          console.log('📸 Tentativa 1 - profilePictureUrl (alta res):', profilePictureUrl);
        } catch (err) {
          console.log('⚠️ Método 1 (alta res) falhou:', err.message);
          
          // Tentar com baixa resolução
          try {
            profilePictureUrl = await sock.profilePictureUrl(chatId);
            console.log('📸 Tentativa 1b - profilePictureUrl (baixa res):', profilePictureUrl);
          } catch (err2) {
            console.log('⚠️ Método 1b (baixa res) falhou:', err2.message);
          }
        }
      } else {
        console.log('⚠️ Sock não disponível para buscar foto de perfil');
      }
      
      // Tentar buscar status do contato se sock estiver disponível
      if (sock && !profilePictureUrl) {
        try {
          console.log('📱 Buscando status do contato:', chatId);
          const status = await sock.fetchStatus(chatId);
          console.log('📱 Status do contato:', status);
          
          // Se temos status, podemos usar como fallback para nome
          if (status && status.status) {
            console.log('📱 Status encontrado:', status.status);
          }
        } catch (statusError) {
          console.log('⚠️ Erro ao buscar status:', statusError.message);
        }
      }
      
      // Método 2: Usar getProfilePicture
      if (!profilePictureUrl) {
        try {
          profilePictureUrl = await sock.getProfilePicture(chatId);
          console.log('📸 Tentativa 2 - getProfilePicture:', profilePictureUrl);
        } catch (err) {
          console.log('⚠️ Método 2 falhou:', err.message);
        }
      }
      
      // Método 3: Buscar no store de contatos
      if (!profilePictureUrl && sock.store?.contacts?.[chatId]?.imgUrl) {
        profilePictureUrl = sock.store.contacts[chatId].imgUrl;
        console.log('📸 Tentativa 3 - store contacts:', profilePictureUrl);
      }
      
      if (profilePictureUrl) {
        console.log('📸 Foto de perfil encontrada:', profilePictureUrl);
        
        // Atualizar contato com a foto de perfil
        const { error: updateError } = await supabaseAdmin
          .from('contacts')
          .update({ 
            whatsapp_profile_picture: profilePictureUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', newContact.id);
          
        if (updateError) {
          console.error('❌ Erro ao salvar foto de perfil:', updateError);
        } else {
          console.log('✅ Foto de perfil salva com sucesso');
          // Atualizar o objeto do contato para emitir
          newContact.whatsapp_profile_picture = profilePictureUrl;
        }
      } else {
        console.log('ℹ️ Nenhuma foto de perfil encontrada para', chatId);
      }
    } catch (profileError) {
      console.error('❌ Erro ao buscar foto de perfil:', profileError);
      console.error('❌ Detalhes do erro:', profileError.message);
    }
    
    // Emitir evento para o frontend
    io.emit('contact:created', {
      contact: newContact,
      message: 'Novo contato criado automaticamente do WhatsApp'
    });

    return newContact;

  } catch (error) {
    console.error('❌ Erro na função createContactFromMessage:', error);
  }
}

// Media helper functions
function unwrapForDownload(m) {
  if (!m) return {};
  if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
  if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessage?.message)  m = m.viewOnceMessage.message;
  if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
  return m ?? {};
}

function detectMime(msg) {
  const m = unwrapForDownload(msg.message);
  return (
    m?.imageMessage?.mimetype ||
    m?.videoMessage?.mimetype ||
    m?.audioMessage?.mimetype ||
    m?.documentMessage?.mimetype ||
    m?.stickerMessage?.mimetype ||
    'application/octet-stream'
  );
}

async function fetchAndUploadMedia({ supabase, bucket='whatsapp', keyPrefix, msg, logger=console, sock }) {
  if (!downloadMediaMessage) throw new Error('downloadMediaMessage not available yet');
  const unwrapped = { ...msg, message: unwrapForDownload(msg.message) };

  try {
    // Usar a abordagem recomendada do Baileys com reuploadRequest
    const buffer = await downloadMediaMessage(
      unwrapped, 
      'buffer', 
      {}, 
      { 
        logger,
        // Passar sock.updateMediaMessage para permitir reupload de mídia deletada
        reuploadRequest: sock?.updateMediaMessage
      }
    );
    
    const mime   = detectMime(msg);
    const ext    = (mime.split('/')[1] || 'bin').split(';')[0];
    const filePath = `${keyPrefix}.${ext}`;

    const { error: upErr } = await supabase.storage.from(bucket)
      .upload(filePath, buffer, { contentType: mime, upsert: true });
    if (upErr) throw upErr;

    const { data: signed, error: urlErr } = await supabase.storage.from(bucket)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7d
    if (urlErr) throw urlErr;

    return { url: signed.signedUrl, mime, size: buffer.length, path: filePath };
  } catch (error) {
    logger.error('❌ Erro ao baixar/enviar mídia:', error);
    throw error;
  }
}

function isMediaTipo(tipo) {
  return ['IMAGEM','VIDEO','AUDIO','STICKER','ARQUIVO'].includes(String(tipo).toUpperCase());
}

// Preview helper for conversation list
function previewLabel(message_type, conteudo, duration_ms) {
  const t = String(message_type || '').toUpperCase();
  switch (t) {
    case 'TEXTO':        return (conteudo || '').slice(0, 120);
    case 'IMAGEM':       return `🖼️ Foto${conteudo ? ': ' + conteudo.slice(0, 80) : ''}`;
    case 'VIDEO':        return `🎬 Vídeo${conteudo ? ': ' + conteudo.slice(0, 80) : ''}`;
    case 'AUDIO':        return `🎧 Áudio${duration_ms ? ' (' + Math.round(duration_ms/1000) + 's)' : ''}`;
    case 'STICKER':      return '💟 Figurinha';
    case 'ARQUIVO':      return `📎 Arquivo${conteudo ? ': ' + conteudo.slice(0, 80) : ''}`;
    case 'LOCALIZACAO':  return '📍 Localização';
    case 'RESPOSTA_BOTAO': return `🔘 ${conteudo || 'Resposta de Botão'}`;
    case 'RESPOSTA_LISTA': return `📋 ${conteudo || 'Resposta de Lista'}`;
    case 'RESPOSTA_TEMPLATE': return `📄 ${conteudo || 'Resposta de Template'}`;
    default:             return conteudo ? conteudo.slice(0, 120) : '[Mensagem]';
  }
}

// Função para verificar limites de sessões por owner_id
async function checkSessionLimits(ownerId) {
  try {
    const { data: connectedSessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('connection_id')
      .eq('owner_id', ownerId)
      .eq('status', 'connected');
    
    if (error) {
      console.error('❌ Erro ao verificar limites de sessões:', error);
      return { canCreate: false, reason: 'ERROR_CHECKING_LIMITS' };
    }
    
    const connectedCount = connectedSessions?.length || 0;
    const maxSessions = 5;
    
    if (connectedCount >= maxSessions) {
      console.log(`⚠️ Limite de ${maxSessions} sessões conectadas atingido para owner_id: ${ownerId}`);
      return { canCreate: false, reason: 'MAX_SESSIONS_REACHED', currentCount: connectedCount };
    }
    
    return { canCreate: true, currentCount: connectedCount };
  } catch (error) {
    console.error('❌ Erro ao verificar limites:', error);
    return { canCreate: false, reason: 'ERROR' };
  }
}

// Função para salvar/atualizar sessão no Supabase
async function saveSessionToSupabase(connectionId, sessionData, userId) {
  try {
    // OBRIGATÓRIO: userId deve ser fornecido e não pode ser o ID padrão
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      throw new Error('userId é obrigatório e deve ser um ID válido da tabela profiles');
    }
    // Verificar se connection_id já existe (regra: 1 max por connection_id)
    const { data: existingSession, error: checkError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('connection_id', connectionId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar sessão existente:', checkError);
      return;
    }
    
    // Se a sessão existe, atualizar em vez de criar nova
    if (existingSession) {
      console.log(`🔄 Atualizando sessão existente: ${connectionId}`);
      
      const updateData = {
        session_name: sessionData.name || existingSession.session_name,
        status: sessionData.status,
        qr_code: sessionData.qr_code || existingSession.qr_code,
        phone: sessionData.phone || existingSession.phone,
        whatsapp_info: sessionData.whatsapp_info || existingSession.whatsapp_info,
        connected_at: sessionData.status === 'connected' ? new Date().toISOString() : existingSession.connected_at,
        disconnected_at: sessionData.status === 'disconnected' ? new Date().toISOString() : existingSession.disconnected_at,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('whatsapp_sessions')
        .update(updateData)
        .eq('connection_id', connectionId);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar sessão:', updateError);
      } else {
        console.log(`✅ Sessão atualizada para usuário ${userId}: ${connectionId}`);
      }
      return;
    }
    
    // Verificar limites antes de criar nova sessão (regra: 5 max por owner_id)
    if (sessionData.status === 'connected') {
      const limitCheck = await checkSessionLimits(userId);
      if (!limitCheck.canCreate) {
        console.log(`❌ Não é possível criar sessão conectada: ${limitCheck.reason}`);
        return;
      }
    }
    
    // Build payload with user owner_id
    const payload = {
      owner_id: userId, // User ID específico
      session_name: sessionData.name || `Conexão ${connectionId}`,
      status: sessionData.status,
      connection_id: connectionId,
      qr_code: sessionData.qr_code || null,
      phone: sessionData.phone || null,
      whatsapp_info: sessionData.whatsapp_info || null,
      connected_at: sessionData.status === 'connected' ? new Date().toISOString() : null,
      disconnected_at: sessionData.status === 'disconnected' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('🔍 saveSessionToSupabase - Dados recebidos:', { connectionId, sessionData, userId });
    console.log(`📤 Enviando payload para Supabase:`, JSON.stringify(payload, null, 2));
    
    const { error } = await supabase
      .from('whatsapp_sessions')
      .insert(payload);
    
    if (error) {
      console.error('❌ Erro ao salvar sessão no Supabase:', error);
    } else {
      console.log(`✅ Sessão salva para usuário ${userId}: ${connectionId}`);
    }
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
  }
}

// Função para remover sessão do Supabase
async function removeSessionFromSupabase(connectionId) {
  try {
    const { error } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('connection_id', connectionId);
    
    if (error) {
      console.error('Erro ao remover sessão do Supabase:', error);
    }
  } catch (error) {
    console.error('Erro ao remover sessão:', error);
  }
}

// Função para atualizar status de conexão com timestamps corretos
async function updateConnectionStatus(connectionId, status, additionalData = {}, userId = null) {
  try {
    // OBRIGATÓRIO: userId deve ser fornecido e não pode ser o ID padrão
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      console.error('❌ userId é obrigatório e deve ser um ID válido da tabela profiles');
      return;
    }
    // Verificar limites antes de conectar (regra: 5 max por owner_id)
    if (status === 'connected' && userId) {
      const limitCheck = await checkSessionLimits(userId);
      if (!limitCheck.canCreate) {
        console.log(`❌ Não é possível conectar: limite de 5 sessões atingido para owner_id: ${userId}`);
        return;
      }
    }

    const updateData = {
      status: status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    // Preservar session_name se não estiver sendo atualizado explicitamente
    if (!additionalData.session_name) {
      // Buscar o session_name atual para preservá-lo
      const { data: currentSession } = await supabase
        .from('whatsapp_sessions')
        .select('session_name')
        .eq('connection_id', connectionId)
        .single();
      
      if (currentSession?.session_name) {
        updateData.session_name = currentSession.session_name;
      }
    }

    // Adicionar timestamps baseado no status
    if (status === 'connected') {
      updateData.connected_at = new Date().toISOString();
      updateData.disconnected_at = null; // Limpar disconnected_at quando conectar
    } else if (status === 'disconnected') {
      updateData.disconnected_at = new Date().toISOString();
      // Não alterar connected_at - manter o valor original
    }

    let query = supabase
      .from('whatsapp_sessions')
      .update(updateData)
      .eq('connection_id', connectionId);
    
    // Se userId for fornecido, filtrar também por owner_id
    if (userId) {
      query = query.eq('owner_id', userId);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('❌ Erro ao atualizar status da conexão:', error);
    } else {
      console.log(`✅ Status da conexão ${connectionId} atualizado para: ${status}`);
      
      // Atualizar o Map activeConnections também
      if (activeConnections.has(connectionId)) {
        const connection = activeConnections.get(connectionId);
        connection.connectionState = status;
        connection.isConnected = status === 'connected';
        connection.updatedAt = new Date().toISOString();
        
        // Adicionar dados adicionais se fornecidos
        if (additionalData.phone) {
          connection.phoneNumber = additionalData.phone;
        }
        if (additionalData.whatsapp_id) {
          connection.whatsappInfo = {
            id: additionalData.whatsapp_id,
            name: additionalData.whatsapp_info?.name || null
          };
        }
        if (additionalData.qr_code !== undefined) {
          connection.qrCode = additionalData.qr_code;
        }
        
        activeConnections.set(connectionId, connection);
        console.log(`🔄 [ACTIVE-CONNECTIONS] Map atualizado para ${connectionId}:`, connection.connectionState);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status da conexão:', error);
  }
}

// Função para carregar sessões existentes do Supabase
async function loadExistingSessions() {
  try {
    // NÃO carregar sessões com owner_id padrão - apenas sessões válidas
    const { data: sessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('status', 'connected')
      .not('connection_id', 'is', null)
      .neq('owner_id', '00000000-0000-0000-0000-000000000000'); // Excluir owner_id padrão
    
    if (error) {
      console.error('Erro ao carregar sessões:', error);
      return;
    }
    
    console.log(`📋 Carregadas ${sessions?.length || 0} sessões existentes do Supabase (excluindo owner_id padrão)`);
    return sessions || [];
  } catch (error) {
    console.error('Erro ao carregar sessões existentes:', error);
    return [];
  }
}

// Função para gerar QR Code real do WhatsApp
async function createWhatsAppConnection(connectionId, userId = null, connectionData = {}) {
  try {
    console.log('🔍 createWhatsAppConnection - Dados recebidos:', { connectionId, userId, connectionData });
    
    // Buscar usuário ativo se não fornecido
    if (!userId) {
      const activeUser = await getActiveUser();
      if (!activeUser) {
        throw new Error('Nenhum usuário ativo encontrado (session_status = ONLINE)');
      }
      userId = activeUser.id;
    }
    
    // Verificar se a conexão já existe para evitar duplicatas
    if (activeConnections.has(connectionId)) {
      console.log(`⚠️ Conexão ${connectionId} já existe, ignorando criação duplicada`);
      return activeConnections.get(connectionId).sock;
    }
    
    console.log(`🔗 Criando conexão WhatsApp para: ${connectionId} com owner_id: ${userId}`);
    
    // Importar Baileys dinamicamente
    if (!makeWASocket) {
      try {
        const baileys = await import('baileys');
        makeWASocket = baileys.default;
        DisconnectReason = baileys.DisconnectReason;
        useMultiFileAuthState = baileys.useMultiFileAuthState;
        downloadMediaMessage = baileys.downloadMediaMessage;
        jidNormalizedUser = baileys.jidNormalizedUser;
        console.log('✅ Baileys importado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao importar Baileys:', error);
        throw new Error('Falha ao importar Baileys: ' + error.message);
      }
    }
    
    const { Boom } = await import('@hapi/boom');
    
    // Diretório para salvar dados de autenticação
    const authDir = path.join(__dirname, 'auth_info', connectionId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Configurar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    // Criar socket WhatsApp
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: require('pino')({ level: 'silent' }),
      browser: ['WhatsApp Web', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        return {
          conversation: 'test',
          message: {
            conversation: 'test'
          }
        };
      }
    });
    
    // Evento de conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`📱 QR Code gerado para ${connectionId}`);
        console.log(`QR Code length: ${qr.length}`);
        console.log(`QR Code first 10 chars: ${qr.substring(0, 10)}`);
        console.log(`QR Code last 10 chars: ${qr.substring(qr.length - 10)}`);
        
        // Salvar QR code no Supabase (manter como disconnected até conectar)
        await updateConnectionStatus(connectionId, 'disconnected', {
          qr_code: qr
        }, userId);
        
        // Emitir QR code via Socket.IO
        io.emit('qrCode', { 
          connectionId: connectionId, 
          qrCode: qr 
        });
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`🔌 Conexão fechada para ${connectionId}, reconectar: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          // Verificar se não excedeu o limite de tentativas
          const attempts = reconnectionAttempts.get(connectionId) || 0;
          if (attempts < MAX_RECONNECTION_ATTEMPTS) {
            reconnectionAttempts.set(connectionId, attempts + 1);
            console.log(`🔄 Tentativa de reconexão ${attempts + 1}/${MAX_RECONNECTION_ATTEMPTS} para ${connectionId}`);
            
            // Manter como desconectado e tentar reconectar
            await updateConnectionStatus(connectionId, 'disconnected', {}, userId);
            // Remover da memória para evitar loops
            activeConnections.delete(connectionId);
            
            // Tentar reconectar após um delay
            setTimeout(() => {
              createWhatsAppConnection(connectionId, userId);
            }, 5000); // 5 segundos de delay
          } else {
            console.log(`❌ Limite de tentativas de reconexão atingido para ${connectionId}`);
            reconnectionAttempts.delete(connectionId);
            activeConnections.delete(connectionId);
            await updateConnectionStatus(connectionId, 'disconnected', {}, userId);
            io.emit('connectionRemoved', { connectionId });
          }
        } else {
          // Marcar como desconectado no Supabase
          console.log(`🗑️ Marcando conexão como desconectada: ${connectionId}`);
          await updateConnectionStatus(connectionId, 'disconnected', {}, userId);
          
          // Remover da memória
          activeConnections.delete(connectionId);
          
          // Emitir evento de remoção para o frontend
          io.emit('connectionRemoved', { connectionId });
        }
      } else if (connection === 'open') {
        console.log(`✅ Conectado ao WhatsApp: ${connectionId}`);
        // Limpar contador de tentativas de reconexão
        reconnectionAttempts.delete(connectionId);
        
        const connection = activeConnections.get(connectionId);
        if (connection) {
          connection.connectionState = 'connected';
          connection.isConnected = true;
          connection.qrCode = null;
          connection.updatedAt = new Date().toISOString();
        }
        
        // Obter informações do WhatsApp (incluindo número do telefone)
        const whatsappInfo = sock.user;
        const phoneNumber = whatsappInfo?.id?.split(':')[0] || null;
        const whatsappId = whatsappInfo?.id || null; // ID completo com @s.whatsapp.net
        
        console.log(`📱 WhatsApp conectado - Número: ${phoneNumber}`);
        console.log(`📱 WhatsApp ID completo: ${whatsappId}`);
        
        // Verificar se já existe uma conexão ativa com o mesmo número de telefone
        if (phoneNumber) {
          const { data: duplicateSessions, error: duplicateError } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('owner_id', userId)
            .eq('phone', phoneNumber)
            .eq('status', 'connected')
            .neq('connection_id', connectionId);
          
          if (duplicateError) {
            console.error('Erro ao verificar duplicatas por número:', duplicateError);
          } else if (duplicateSessions && duplicateSessions.length > 0) {
            console.log(`⚠️ Número ${phoneNumber} já está conectado em outra sessão`);
            
            // Desconectar a sessão anterior
            for (const duplicateSession of duplicateSessions) {
              await updateConnectionStatus(duplicateSession.connection_id, 'disconnected', {
                phone: phoneNumber,
                duplicate_reason: 'REPLACED_BY_NEW_CONNECTION'
              }, userId);
              
              // Remover da memória se existir
              if (activeConnections.has(duplicateSession.connection_id)) {
                const oldConnection = activeConnections.get(duplicateSession.connection_id);
                if (oldConnection.sock) {
                  oldConnection.sock.logout();
                }
                activeConnections.delete(duplicateSession.connection_id);
              }
            }
            
            console.log(`🔄 Substituindo conexão anterior pelo número ${phoneNumber}`);
          }
        }
        
        // Salvar sessão conectada no Supabase com número do telefone e WhatsApp ID
        await updateConnectionStatus(connectionId, 'connected', {
          qr_code: null, // Limpar QR code quando conectado
          phone: phoneNumber,
          whatsapp_id: whatsappId, // ID completo com @s.whatsapp.net
          whatsapp_info: whatsappInfo
        }, userId);
        
        // Emitir status de conexão
        io.emit('connectionUpdate', { 
          connectionId: connectionId, 
          update: { connection: 'open' } 
        });
      }
    });
    
    // Evento de credenciais
    sock.ev.on('creds.update', saveCreds);
    
    // Evento de mensagens
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const messages = m.messages || [];
        console.log(`📨 ===== MENSAGENS RECEBIDAS =====`);
        console.log(`📨 Conexão: ${connectionId}`);
        console.log(`📨 Total de mensagens: ${messages.length}`);
        console.log(`📨 Timestamp: ${new Date().toISOString()}`);
        
        // Obter informações do WhatsApp conectado
        const whatsappInfo = sock.user;
        const connectionPhone = whatsappInfo?.id?.split(':')[0] || null;
        
        console.log(`📱 [CONNECTION-INFO] WhatsApp conectado:`, {
          id: whatsappInfo?.id,
          name: whatsappInfo?.name,
          phone: connectionPhone
        });
        
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          
          console.log(`\n📨 ===== MENSAGEM ${i + 1}/${messages.length} =====`);
          console.log(`📨 ID: ${message.key?.id}`);
          console.log(`📨 De: ${message.key?.remoteJid}`);
          console.log(`📨 Para: ${message.key?.participant}`);
          console.log(`📨 Enviada por nós: ${message.key?.fromMe}`);
          console.log(`📨 Timestamp: ${message.messageTimestamp}`);
          console.log(`📨 Push Name: ${message.pushName || 'N/A'}`);
          console.log(`📨 Tipo: ${message.message?.conversation ? 'TEXTO' : Object.keys(message.message || {})[0] || 'DESCONHECIDO'}`);
          
          // Log do conteúdo da mensagem
          if (message.message?.conversation) {
            console.log(`📝 [TEXTO] Conteúdo: ${message.message.conversation.substring(0, 100)}${message.message.conversation.length > 100 ? '...' : ''}`);
          } else if (message.message?.imageMessage) {
            console.log(`🖼️ [IMAGEM] Caption: ${message.message.imageMessage.caption || 'Sem legenda'}`);
            console.log(`🖼️ [IMAGEM] MIME: ${message.message.imageMessage.mimetype}`);
            console.log(`🖼️ [IMAGEM] Tamanho: ${message.message.imageMessage.fileLength || 'N/A'} bytes`);
          } else if (message.message?.videoMessage) {
            console.log(`🎥 [VÍDEO] Caption: ${message.message.videoMessage.caption || 'Sem legenda'}`);
            console.log(`🎥 [VÍDEO] MIME: ${message.message.videoMessage.mimetype}`);
            console.log(`🎥 [VÍDEO] Duração: ${message.message.videoMessage.seconds || 'N/A'} segundos`);
          } else if (message.message?.audioMessage) {
            console.log(`🎵 [ÁUDIO] MIME: ${message.message.audioMessage.mimetype}`);
            console.log(`🎵 [ÁUDIO] Duração: ${message.message.audioMessage.seconds || 'N/A'} segundos`);
          } else if (message.message?.documentMessage) {
            console.log(`📄 [DOCUMENTO] Nome: ${message.message.documentMessage.fileName || 'Sem nome'}`);
            console.log(`📄 [DOCUMENTO] MIME: ${message.message.documentMessage.mimetype}`);
            console.log(`📄 [DOCUMENTO] Tamanho: ${message.message.documentMessage.fileLength || 'N/A'} bytes`);
          }
          
          // Verificar se é grupo
          const isGroup = message.key?.remoteJid?.includes('@g.us');
          console.log(`👥 [GRUPO] É grupo: ${isGroup}`);
          if (isGroup) {
            console.log(`👥 [GRUPO] ID do grupo: ${message.key?.remoteJid}`);
            console.log(`👥 [GRUPO] Remetente no grupo: ${message.key?.participant}`);
          }
          
          // Ignorar mensagens de status e broadcast
          if (message.key?.remoteJid?.includes('status@broadcast') || 
              message.key?.remoteJid?.includes('@broadcast') ||
              message.key?.remoteJid?.includes('status@')) {
            console.log('⚠️ [IGNORAR] Mensagem de status/broadcast ignorada');
            continue;
          }
          
          // Para mensagens enviadas por nós mesmos, verificar se já foi processada
          if (message.key?.fromMe === true) {
            console.log('📤 Mensagem enviada por nós mesmos:', message.key?.id);
            
            // Verificar se é uma mensagem da IA
            const isAIMessage = connection?.sock?.isAIMessage || false;
            const aiContent = connection?.sock?.aiMessageContent;
            const aiChatId = connection?.sock?.aiMessageChatId;
            
            if (isAIMessage && aiContent && aiChatId === message.key.remoteJid) {
              console.log('🤖 Detectada mensagem da IA, ignorando processamento normal:', message.key?.id);
              continue; // A mensagem da IA já foi salva pelo sistema da IA
            }
            
            // Verificar se já existe no banco para evitar duplicação
            const { data: existingMessage } = await supabaseAdmin
              .from('whatsapp_mensagens')
              .select('id, message_id, atendimento_id')
              .eq('message_id', message.key.id)
              .eq('connection_id', connectionId)
              .single();
            
            if (existingMessage) {
              console.log('⚠️ Mensagem já existe no banco, ignorando:', message.key?.id);
              continue;
            }
            
            // Verificação adicional: se é uma mensagem da IA (atendimento_id com prefixo ai_)
            // e tem conteúdo similar, também deve ser ignorada
            const messageContent = extractMessageContent(message);
            if (messageContent) {
              const { data: similarMessage } = await supabaseAdmin
                .from('whatsapp_mensagens')
                .select('id, atendimento_id, conteudo')
                .eq('chat_id', message.key.remoteJid)
                .eq('connection_id', connectionId)
                .eq('conteudo', messageContent)
                .gte('timestamp', new Date(Date.now() - 60000).toISOString()) // Últimos 60 segundos
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();
                
              if (similarMessage && similarMessage.atendimento_id?.startsWith('ai_')) {
                console.log('⚠️ Mensagem da IA já existe (conteúdo similar), ignorando:', message.key?.id);
                continue;
              }
            }
            
            console.log('✅ Processando mensagem enviada por nós mesmos:', message.key?.id);
          }
          
          // Normalizar mensagem usando o message-normalizer
          console.log(`🔄 [NORMALIZAÇÃO] Iniciando normalização da mensagem...`);
          const messageData = mapToDbRow(message, null, connectionId, userId);
          
          console.log(`📊 [MESSAGE-DATA] Dados normalizados:`, {
            chat_id: messageData.chat_id,
            remetente: messageData.remetente,
            tipo: messageData.tipo,
            conteudo: messageData.conteudo?.substring(0, 50) + (messageData.conteudo?.length > 50 ? '...' : ''),
            media_url: messageData.media_url,
            media_tipo: messageData.media_tipo
          });
          
          // Adicionar informações da conexão
          messageData.connection_id = connectionId; // ID real da conexão
          messageData.connection_phone = connectionPhone;
          messageData.phone = messageData.chat_id ? messageData.chat_id.split('@')[0] : null;
          
          console.log(`📱 [CONNECTION-DATA] Dados da conexão:`, {
            connection_id: messageData.connection_id,
            connection_phone: messageData.connection_phone,
            phone: messageData.phone
          });
          
        // Processar mídia ANTES de salvar mensagem
        if (hasMediaContent(message)) {
          console.log('📎 Processando mídia antes de salvar mensagem...');
          
          // Verificar se já temos uma URL do Supabase (mensagem enviada por nós)
          if (messageData.media_url && messageData.media_url.includes('supabase.co')) {
            console.log('✅ Mídia já tem URL do Supabase, mantendo:', messageData.media_url);
          } else {
            // Processar mídia recebida - SEMPRE normalizar para Supabase
            const mediaResult = await processIncomingMediaMessage(message, connectionId, userId);

            if (mediaResult) {
              messageData.media_url = mediaResult.url;
              messageData.media_mime = mediaResult.mimetype;
              messageData.media_type = extractMediaInfo(message).mediaType;
              console.log('✅ Mídia processada e URLs definidas:', {
                url: mediaResult.url,
                mimetype: mediaResult.mimetype,
                mediaType: extractMediaInfo(message).mediaType
              });
            } else {
              console.log('⚠️ Falha no processamento de mídia, salvando mensagem sem mídia');
              // Garantir que não salvemos media:hash
              messageData.media_url = null;
              messageData.media_mime = null;
              messageData.media_type = null;
            }
          }
        } else {
          // Para mensagens sem mídia, garantir que não tenhamos media:hash
          messageData.media_url = null;
          messageData.media_mime = null;
          messageData.media_type = null;
        }

        // 🚀 EMISSÃO SUPER OTIMISTA - Enviar IMEDIATAMENTE após normalização
        const quickMessageToEmit = {
          ...messageData,
          id: messageData.message_id || `temp_${Date.now()}`,
          timestamp: new Date().toISOString(),
          lida: false
        };
        
        const quickRoomName = `${connectionId}-${messageData.chat_id}`;
        io.to(quickRoomName).emit('newMessage', quickMessageToEmit);
        console.log('⚡ [QUICK-EMIT] Mensagem enviada instantaneamente para:', quickRoomName);
          
          // Definir wpp_name e group_contact_name baseado no remetente
          if (messageData.remetente === 'ATENDENTE') {
            messageData.wpp_name = 'Atendente';
            messageData.group_contact_name = null;
          } else if (messageData.remetente === 'CLIENTE' && messageData.phone) {
            // Para grupos, usar pushName como group_contact_name
            if (messageData.chat_id && messageData.chat_id.includes('@g.us')) {
              messageData.group_contact_name = message.pushName || null;
              console.log('👥 [GROUP] Nome do contato no grupo:', messageData.group_contact_name);
            } else {
              messageData.group_contact_name = null;
            }
            try {
              // Obter sock da conexão ativa
              const connection = activeConnections.get(connectionId);
              const activeSock = connection?.sock;
              
              // Silent contact info capture - logs removed for production
              
              if (activeSock) {
                // Usar a função getRealContactName para buscar o nome
                const realContactName = await getRealContactName(messageData.chat_id, activeSock, message.pushName);
                
                // Verificar se é um grupo
                const isGroup = messageData.chat_id?.includes('@g.us');
                
                if (isGroup) {
                  // Para grupos: wpp_name = nome do grupo, group_contact_name = pushName do remetente
                  if (realContactName && realContactName.trim()) {
                    messageData.wpp_name = realContactName.trim(); // Nome do grupo
                    console.log('✅ [DEBUG-NAMES] Nome do grupo encontrado:', messageData.wpp_name);
                  } else {
                    messageData.wpp_name = `Grupo ${messageData.phone}`;
                    console.log('⚠️ [DEBUG-NAMES] Usando nome padrão para grupo:', messageData.wpp_name);
                  }
                  
                  // Definir group_contact_name com o pushName do remetente
                  if (message.pushName && message.pushName.trim()) {
                    messageData.group_contact_name = message.pushName.trim();
                    console.log('✅ [DEBUG-NAMES] Nome do contato no grupo:', messageData.group_contact_name);
                  } else {
                    messageData.group_contact_name = `Contato ${messageData.phone}`;
                    console.log('⚠️ [DEBUG-NAMES] Usando nome padrão para contato no grupo:', messageData.group_contact_name);
                  }
                } else {
                  // Para contatos individuais: wpp_name = nome do contato (mesmo valor para contacts.name_wpp)
                  if (realContactName && realContactName.trim()) {
                    messageData.wpp_name = realContactName.trim();
                    console.log('✅ [DEBUG-NAMES] Nome real do contato encontrado:', messageData.wpp_name);
                  } else {
                    // Tentar usar pushName da mensagem como fallback
                    if (message.pushName && message.pushName.trim()) {
                      messageData.wpp_name = message.pushName.trim();
                      console.log('✅ [DEBUG-NAMES] Nome encontrado via pushName:', messageData.wpp_name);
                    } else {
                      messageData.wpp_name = `Contato ${messageData.phone}`;
                      console.log('⚠️ [DEBUG-NAMES] Usando nome padrão:', messageData.wpp_name);
                    }
                  }
                  messageData.group_contact_name = null; // Não é grupo
                }
              } else {
                console.log('⚠️ Socket não disponível ou não inicializado para buscar nome do contato');
                // Tentar usar pushName da mensagem como fallback
                if (message.pushName && message.pushName.trim()) {
                  messageData.wpp_name = message.pushName.trim();
                  console.log('✅ Nome encontrado via pushName (fallback):', messageData.wpp_name);
                } else {
                  messageData.wpp_name = `Contato ${messageData.phone}`;
                  console.log('ℹ️ Usando nome padrão:', messageData.wpp_name);
                }
              }
              
            } catch (error) {
              console.error('⚠️ Erro ao buscar nome do contato:', error.message);
              // Tentar usar pushName da mensagem como fallback
              if (message.pushName && message.pushName.trim()) {
                messageData.wpp_name = message.pushName.trim();
                console.log('✅ Nome encontrado via pushName (fallback após erro):', messageData.wpp_name);
              } else {
                messageData.wpp_name = `Contato ${messageData.phone}`;
                console.log('ℹ️ Usando nome padrão após erro:', messageData.wpp_name);
              }
            }
            
            // Criar ou atualizar contato automaticamente
            const connection = activeConnections.get(connectionId);
            const sock = connection?.sock;
            await createContactFromMessage(messageData, userId, sock);
          } else if (messageData.remetente === 'ATENDENTE') {
            // Para mensagens do atendente, usar o nome da conexão
            messageData.wpp_name = 'Atendente';
            messageData.group_contact_name = null;
            // Atualizar contato mesmo para mensagens do atendente
            await updateContactFromMessage(messageData, userId);
          }
          
          // Gerar Atendimento ID único para a conversa (UUID válido)
          const { v4: uuidv4 } = require('uuid');
          messageData.atendimento_id = uuidv4();
          
          // Determinar status baseado no remetente
          if (messageData.remetente === 'CLIENTE') {
            messageData.status = 'AGUARDANDO'; // Cliente aguardando resposta
          } else if (messageData.remetente === 'AI') {
            messageData.status = 'AI'; // Resposta da IA
          } else {
            messageData.status = 'ATENDIDO'; // Resposta de operador humano
          }
          
          // Mídia já foi processada pela função unificada acima
          
          // Salvar mensagem no banco
          console.log('💾 [DATABASE] ===== SALVANDO MENSAGEM NO BANCO DE DADOS =====');
          console.log('💾 [DATABASE] Dados principais:', {
            connection_id: messageData.connection_id,
            chat_id: messageData.chat_id,
            atendimento_id: messageData.atendimento_id,
            conteudo: messageData.conteudo?.substring(0, 50) + (messageData.conteudo?.length > 50 ? '...' : ''),
            remetente: messageData.remetente,
            wpp_name: messageData.wpp_name,
            group_contact_name: messageData.group_contact_name
          });
          
          console.log('💾 [DATABASE] Informações de perfil WhatsApp:', {
            whatsapp_is_group: messageData.whatsapp_is_group,
            whatsapp_business_name: messageData.whatsapp_business_name,
            whatsapp_business_category: messageData.whatsapp_business_category,
            whatsapp_verified: messageData.whatsapp_verified,
            whatsapp_online: messageData.whatsapp_online,
            whatsapp_status: messageData.whatsapp_status,
            message_type: messageData.message_type
          });
          
          if (messageData.whatsapp_is_group) {
            console.log('💾 [DATABASE] Informações do grupo:', {
              whatsapp_group_subject: messageData.whatsapp_group_subject,
              whatsapp_group_owner: messageData.whatsapp_group_owner,
              whatsapp_group_participants: messageData.whatsapp_group_participants?.length || 0
            });
          }
          
          const { error: insertError } = await supabase
            .from('whatsapp_mensagens')
            .insert(messageData);
          
          if (insertError) {
            console.error('❌ [DATABASE] Erro ao salvar mensagem:', insertError);
            console.error('❌ [DATABASE] Detalhes do erro:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            });
            continue;
          } else {
            console.log('✅ [DATABASE] Mensagem salva com sucesso no Supabase');
            console.log('✅ [DATABASE] ID da mensagem:', messageData.message_id);
          }
          
          // Emitir para o frontend PRIMEIRO (não bloquear recebimento)
          const roomName = `${connectionId}-${messageData.chat_id}`;
          console.log('📡 ===== EMITINDO MENSAGEM PARA FRONTEND =====');
          console.log('📡 Sala de destino:', roomName);
          console.log('📡 Dados da mensagem:', {
            chat_id: messageData.chat_id,
            conteudo: messageData.conteudo,
            remetente: messageData.remetente,
            message_id: messageData.message_id
          });
          
          // Verificar quantos clientes estão na sala
          const room = io.sockets.adapter.rooms.get(roomName);
          console.log('📡 Clientes na sala:', room ? room.size : 0);
          console.log('📡 IDs dos clientes na sala:', room ? Array.from(room) : []);
          
          // Criar objeto de mensagem para emitir
          const messageToEmit = {
            ...messageData,
            id: messageData.message_id
          };
          
          console.log('📡 Mensagem a ser emitida:', messageToEmit);
          
          // 🚀 EMISSÃO OTIMISTA - Enviar imediatamente para o frontend
          io.to(roomName).emit('newMessage', messageToEmit);
          
          console.log('📡 Mensagem emitida com sucesso!');
          
          // LEFT PANE live update (connection-level room)
          const preview = messageData.conteudo || '[Mensagem]';
          console.log('📡 Emitindo conversation:updated para sala:', connectionId);
          
          const conversationUpdate = {
            connectionId,
            conversationId: messageData.chat_id,
            lastMessageAt: messageData.timestamp,
            last_message: messageData,
            preview,
            from: messageData.remetente, // 'CLIENTE' or 'ATENDENTE'
            unread_count_delta: messageData.remetente === 'CLIENTE' ? 1 : 0,
            // Adicionar nome_cliente para o frontend
            nome_cliente: messageData.wpp_name || `Contato ${messageData.phone}`,
            numero_cliente: messageData.phone
          };
          
          console.log('📡 [CONVERSATION-UPDATE] Dados sendo emitidos:', {
            conversationId: conversationUpdate.conversationId,
            nome_cliente: conversationUpdate.nome_cliente,
            wpp_name: messageData.wpp_name,
            phone: messageData.phone,
            from: conversationUpdate.from
          });
          
          console.log('📡 [CONVERSATION-UPDATE] Nome do contato:', {
            wpp_name: messageData.wpp_name,
            nome_cliente: conversationUpdate.nome_cliente,
            phone: messageData.phone
          });
          
          console.log('📡 Conversation update:', conversationUpdate);
          
          // Verificar se há clientes na sala antes de emitir
          const roomClients = io.sockets.adapter.rooms.get(connectionId);
          console.log('📡 Clientes na sala de conexão:', roomClients ? roomClients.size : 0);
          console.log('📡 IDs dos clientes na sala:', roomClients ? Array.from(roomClients) : []);
          
          io.to(connectionId).emit('conversation:updated', conversationUpdate);
          
          console.log('📡 Conversation updated emitido com sucesso!');
          
          // Verificar IA DEPOIS de emitir a mensagem (não bloquear)
          if (messageData.remetente === 'CLIENTE') {
            // ✅ DEBOUNCE: Evitar múltiplas execuções para a mesma conversa
            const conversationKey = `${userId}_${messageData.chat_id}`;
            
            // Limpar timeout anterior se existir
            if (aiAgentTimeouts.has(conversationKey)) {
              clearTimeout(aiAgentTimeouts.get(conversationKey));
              console.log('🤖 [DEBOUNCE] Cancelando timeout anterior para:', conversationKey);
            }
            
            // Executar verificação da IA de forma assíncrona (delay de 5 segundos para resposta)
            console.log('🤖 ===== AGENDANDO RESPOSTA IA EM 5 SEGUNDOS =====');
            console.log('🤖 Phone Number:', messageData.phone);
            console.log('🤖 User ID:', userId);
            console.log('🤖 Conversation Key:', conversationKey);
            
            const timeoutId = setTimeout(async () => {
              try {
                console.log('🤖 ===== VERIFICANDO AGENTE IA (ASSÍNCRONO) =====');
                console.log('🤖 Chat ID:', messageData.chat_id);
                console.log('🤖 Mensagem:', messageData.conteudo);
                console.log('🤖 Connection ID:', connectionId);
                console.log('🤖 User ID:', userId);
                
                // Primeiro, tentar buscar pelo número limpo
                let phoneToSearch = messageData.phone;
                if (phoneToSearch && phoneToSearch.includes('@')) {
                  phoneToSearch = phoneToSearch.split('@')[0];
                }
                
                console.log('🤖 Buscando contato com phone original:', messageData.phone);
                console.log('🤖 Phone limpo para busca:', phoneToSearch);
                console.log('🤖 User ID para busca:', userId);
                
                let { data: contactData, error: contactError } = await supabase
                  .from('contacts')
                  .select('ai_enabled, phone, name, id')
                  .eq('phone', phoneToSearch)
                  .eq('owner_id', userId)
                  .single();
                
                console.log('🤖 Resultado da busca do contato:', { contactData, contactError });
                
                // Se não encontrar, tentar buscar sem owner_id (contatos globais)
                if (contactError && contactError.code === 'PGRST116') {
                  console.log('🤖 Tentando buscar contato sem owner_id...');
                  const { data: globalContactData, error: globalContactError } = await supabase
                    .from('contacts')
                    .select('ai_enabled, phone, name, id')
                    .eq('phone', phoneToSearch)
                    .single();
                  
                  console.log('🤖 Resultado da busca global:', { globalContactData, globalContactError });
                  
                  if (globalContactData) {
                    // Usar contato global se encontrado
                    contactData = globalContactData;
                    contactError = null;
                  }
                }
                
                if (contactError) {
                  console.log('🤖 Contato não encontrado, criando automaticamente...');
                  console.log('🤖 Erro original:', contactError.message);
                  
                  // Criar contato automaticamente se não existir
                  try {
                    const newContactData = {
                      name: `Contato ${phoneToSearch}`,
                      phone: phoneToSearch,
                      whatsapp_opted: true,
                      ai_enabled: false, // NÃO ativar IA por padrão - só ativar quando explicitamente escolhido
                      owner_id: userId,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      last_contact_at: new Date().toISOString()
                    };
                    
                    console.log('🤖 Criando novo contato:', newContactData);
                    
                    const { data: newContact, error: createError } = await supabase
                      .from('contacts')
                      .insert(newContactData)
                      .select()
                      .single();
                    
                    if (createError) {
                      console.error('❌ Erro ao criar contato:', createError);
                      console.log('⚠️ Continuando sem contato - IA pode funcionar sem ele');
                      // Não retornar - continuar o processamento
                    }
                    
                    console.log('✅ Contato criado com sucesso:', newContact);
                    contactData = newContact;
                    contactError = null;
                    
                  } catch (createError) {
                    console.error('❌ Erro ao criar contato:', createError);
                    console.log('⚠️ Continuando sem contato - IA pode funcionar sem ele');
                    // Não retornar - continuar o processamento
                  }
                }
                
                const isAiEnabled = contactData?.ai_enabled === true;
                console.log('🤖 Dados do contato encontrado:', contactData);
                console.log('🤖 Agente IA ativado para este contato (banco):', isAiEnabled);
                
                // Verificar se há configuração de IA ativa para o usuário
                let { data: aiConfigData } = await supabaseAdmin
                  .from('ai_agent_configs')
                  .select('*')
                  .eq('owner_id', userId)
                  .eq('is_active', true)
                  .limit(1);
                
                // Se não tem configuração ativa, buscar qualquer configuração do usuário
                if (!aiConfigData || aiConfigData.length === 0) {
                  console.log('🤖 Buscando qualquer configuração de IA para o usuário...');
                  const { data: anyConfigData } = await supabaseAdmin
                    .from('ai_agent_configs')
                    .select('*')
                    .eq('owner_id', userId)
                    .limit(1);
                  
                  if (anyConfigData && anyConfigData.length > 0) {
                    aiConfigData = anyConfigData;
                    console.log('🤖 Configuração de IA encontrada (não ativa):', anyConfigData[0].name);
                  }
                }
                
                const hasActiveAIConfig = aiConfigData && aiConfigData.length > 0;
                console.log('🤖 Configuração de IA encontrada:', hasActiveAIConfig);
                if (hasActiveAIConfig) {
                  console.log('🤖 Configuração:', {
                    name: aiConfigData[0].name,
                    api_key: aiConfigData[0].api_key ? 'Configurada' : 'Não configurada',
                    is_active: aiConfigData[0].is_active
                  });
                }

                // Buscar dados da sessão para verificar Tipo de Atendimento
                let sessionData = null;
                try {
                  const { data: sessionResult, error: sessionError } = await supabaseAdmin
                    .from('whatsapp_sessions')
                    .select('attendance_type, connection_id')
                    .eq('owner_id', userId)
                    .eq('connection_id', connectionId)
                    .limit(1);
                  
                  if (!sessionError && sessionResult && sessionResult.length > 0) {
                    sessionData = sessionResult[0];
                    console.log('🤖 Dados da sessão:', sessionData);
                  } else {
                    console.log('🤖 Sessão não encontrada ou erro:', sessionError?.message);
                  }
                } catch (sessionErr) {
                  console.log('🤖 Erro ao buscar sessão:', sessionErr.message);
                }
                
                // NOVA LÓGICA: Prioridade para escolhas específicas vs configuração da conexão
                let shouldActivateAI = false;
                let activationReason = '';
                
                // 1. PRIORIDADE MÁXIMA: Se o contato já tem uma escolha específica (dropdown do topbar)
                // Isso significa que o usuário já interagiu com esta conversa específica
                if (contactData && contactData.ai_enabled !== null) {
                  shouldActivateAI = contactData.ai_enabled;
                  activationReason = contactData.ai_enabled 
                    ? 'Escolha específica do contato (dropdown do topbar) - IA HABILITADA'
                    : 'Escolha específica do contato (dropdown do topbar) - IA DESABILITADA';
                  console.log('🤖 ' + activationReason);
                }
                // 2. FALLBACK: Se não há escolha específica, usar configuração da conexão (modal de detalhes)
                // Isso se aplica apenas a NOVAS conversas
                else if (sessionData && sessionData.attendance_type === 'AI' && hasActiveAIConfig) {
                  shouldActivateAI = true;
                  activationReason = 'Configuração da conexão (modal de detalhes) - NOVA conversa';
                  console.log('🤖 ' + activationReason);
                }
                // 3. PADRÃO: Se não há configuração, usar atendimento humano
                else {
                  shouldActivateAI = false;
                  activationReason = 'Nenhuma configuração encontrada - Atendimento humano';
                  console.log('🤖 ' + activationReason);
                }
                console.log('🤖 ===== DECISÃO DE ATIVAÇÃO DA IA =====');
                console.log('🤖 Motivo da ativação:', activationReason);
                console.log('🤖 hasActiveAIConfig:', hasActiveAIConfig);
                console.log('🤖 contactData.ai_enabled (escolha específica):', contactData?.ai_enabled);
                console.log('🤖 sessionData.attendance_type (configuração da conexão):', sessionData?.attendance_type);
                console.log('🤖 shouldActivateAI (decisão final):', shouldActivateAI);
                console.log('🤖 Configuração da IA encontrada:', aiConfigData?.length > 0);
                if (aiConfigData?.length > 0) {
                  console.log('🤖 Configuração da IA:', {
                    name: aiConfigData[0].name,
                    hasApiKey: !!aiConfigData[0].api_key,
                    isActive: aiConfigData[0].is_active,
                    hasKnowledgeBase: !!aiConfigData[0].knowledge_base
                  });
                }
                console.log('🤖 ======================================');
                
                if (shouldActivateAI) {
                  console.log('🤖 ===== ATIVANDO AGENTE IA =====');
                  console.log('🤖 Verificações de segurança:');
                  console.log('🤖 - Contato tem IA habilitada:', isAiEnabled);
                  console.log('🤖 - Configuração ativa encontrada:', hasActiveAIConfig);
                  console.log('🤖 - Mensagem não é da própria IA:', messageData.remetente !== 'AI');
                  
                  // Verificação de segurança: não responder a mensagens da própria IA
                  if (messageData.remetente === 'AI') {
                    console.log('🤖 ⚠️ Mensagem é da própria IA, ignorando para evitar loop');
                    return;
                  }
                  
                  console.log('🤖 Iniciando geração de resposta IA...');
                  
                  // Obter conexão ativa
                  const connection = activeConnections.get(connectionId);
                  if (!connection) {
                    console.log('🤖 ⚠️ Conexão não encontrada, não gerando resposta IA');
                    return;
                  }
                  
                  // Usar o sistema que funciona
                  const aiResponse = await generateAIResponse(messageData.conteudo, messageData.chat_id, messageData.message_type, userId, messageData.midia_url, connection);
                  console.log('🤖 Resposta gerada pela IA:', aiResponse);
                  
                  // Se a resposta é 'CHUNKS_SENT', significa que os chunks já foram enviados
                  if (aiResponse && aiResponse.trim() !== '' && aiResponse !== 'CHUNKS_SENT') {
                    console.log('🤖 Resposta IA gerada, enviando para o contato...');
                    console.log('🤖 Chamando sendAIResponse com:', { connectionId, chatId: messageData.chat_id, response: aiResponse, userId });
                    await sendAIResponse(connectionId, messageData.chat_id, aiResponse, userId);
                    console.log('🤖 ✅ Resposta IA enviada com sucesso!');
                  } else if (aiResponse === 'CHUNKS_SENT') {
                    console.log('🤖 ✅ Chunks já foram enviados, não enviando mensagem adicional');
                  } else {
                    console.log('🤖 Nenhuma resposta IA gerada ou resposta vazia');
                  }
                } else {
                  console.log('🤖 Agente IA não ativado para este contato');
                console.log('🤖 Razão: isAiEnabled =', isAiEnabled, ', hasActiveAIConfig =', hasActiveAIConfig);
                console.log('🤖 Para ativar a IA:');
                console.log('🤖 1. Configure uma API key na página de Agente IA');
                console.log('🤖 2. Ou ative "Agente IA" no painel do contato');
                console.log('🤖 3. Ou use o botão "Ativar IA para Todos os Contatos"');
                }
              } catch (error) {
                console.error('❌ Erro ao verificar estado do agente IA:', error);
              } finally {
                // ✅ Limpar timeout do Map após execução
                aiAgentTimeouts.delete(conversationKey);
                console.log('🤖 [DEBOUNCE] Timeout removido do Map:', conversationKey);
              }
            }, 5000);
            
            // ✅ Armazenar timeout no Map para controle de debounce
            aiAgentTimeouts.set(conversationKey, timeoutId);
            console.log('🤖 [DEBOUNCE] Timeout armazenado no Map:', conversationKey);
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagens:', error);
      }
    });
    
    // Buscar session_name existente se connectionData estiver vazio (reconexão)
    let sessionName = connectionData.name;
    if (!sessionName) {
      try {
        const { data: existingSession } = await supabase
          .from('whatsapp_sessions')
          .select('session_name')
          .eq('connection_id', connectionId)
          .single();
        
        if (existingSession?.session_name) {
          sessionName = existingSession.session_name;
          console.log('🔍 Usando session_name existente para reconexão:', sessionName);
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar session_name existente:', error.message);
      }
    }

    // Armazenar conexão
    const connectionInfo = {
      id: connectionId,
      name: sessionName || `Conexão ${connectionId}`,
      connectionState: 'disconnected',
      isConnected: false,
      phoneNumber: null,
      whatsappInfo: null,
      qrCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sock
    };
    
    activeConnections.set(connectionId, connectionInfo);
    
    // Inicializar serviço de sincronização de perfil
    const contactExtractor = new ContactInfoExtractor(sock);
    profileSyncService.initialize(contactExtractor);
    console.log('✅ [PROFILE-SYNC] Serviço de sincronização inicializado para conexão:', connectionId);
    
    // Salvar sessão inicial no Supabase
    console.log(`💾 Salvando sessão inicial para ${connectionId} com owner_id: ${userId}`);
    await saveSessionToSupabase(connectionId, {
      name: sessionName || `Conexão ${connectionId}`,
      status: 'disconnected',
      qr_code: null // Será atualizado quando o QR Code for gerado
    }, userId);
    
    return sock;
  } catch (error) {
    console.error(`❌ Erro ao criar conexão WhatsApp para ${connectionId}:`, error);
    throw error;
  }
}

// Endpoints da API

// Health check endpoint
app.get('/api/baileys-simple/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: activeConnections.size,
    version: '1.0.0'
  });
});

// Conversations endpoints (unified from whatsapp-baileys-server.js)
app.get('/api/conversations', (req, res) => {
  const { connectionId, cursor, limit = 25 } = req.query;
  
  if (!connectionId) {
    return res.status(400).json({
      success: false,
      error: 'connectionId é obrigatório'
    });
  }
  
  // Check if connection exists in activeConnections or in the database
  const connection = activeConnections.get(connectionId);
  if (!connection) {
    console.log('⚠️ [CONVERSATIONS] Connection not in activeConnections, checking database...');
    // Don't fail if connection is not in activeConnections, just continue
  }
  
  // Fetch conversations from Supabase
  console.log('📋 [CONVERSATIONS] Fetching conversations for connection:', connectionId);
  
  supabase
    .from('whatsapp_mensagens')
    .select('*', { count: 'exact' })
    .eq('connection_id', connectionId)
    .order('timestamp', { ascending: false })
    .limit(parseInt(limit))
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        // Return empty conversations instead of error to allow the frontend to work
        return res.json({
          success: true,
          items: [],
          nextCursor: null,
          count: 0
        });
      }
      
      console.log('📋 [CONVERSATIONS] Found messages:', data?.length || 0);
      
      // Group messages by chat_id and include full contact/group information
      const conversationMap = new Map();
      (data || []).forEach(msg => {
        if (!conversationMap.has(msg.chat_id)) {
          conversationMap.set(msg.chat_id, {
            chat_id: msg.chat_id,
            id: msg.chat_id,
            lastMessage: msg.conteudo,
            timestamp: msg.timestamp,
            unreadCount: 0,
            // Include full contact/group information from the message
            nome_cliente: msg.wpp_name || msg.nome_cliente || msg.chat_id,
            wpp_name: msg.wpp_name || msg.nome_cliente,
            profile_picture: msg.profile_picture || null,
            // Group-specific information
            whatsapp_is_group: msg.whatsapp_is_group || false,
            whatsapp_group_subject: msg.whatsapp_group_subject || null,
            whatsapp_group_description: msg.whatsapp_group_description || null,
            whatsapp_group_owner: msg.whatsapp_group_owner || null,
            whatsapp_group_participants: msg.whatsapp_group_participants || null,
            whatsapp_group_created: msg.whatsapp_group_created || null,
            // Business information
            whatsapp_business_name: msg.whatsapp_business_name || null,
            whatsapp_business_category: msg.whatsapp_business_category || null,
            whatsapp_business_email: msg.whatsapp_business_email || null,
            whatsapp_business_website: msg.whatsapp_business_website || null,
            whatsapp_verified: msg.whatsapp_verified || false,
            // Contact information
            group_contact_name: msg.group_contact_name || null,
            phone: msg.phone || msg.chat_id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
            connection_id: msg.connection_id,
            connection_phone: msg.connection_phone
          });
        }
      });
      
      const items = Array.from(conversationMap.values());
      console.log('📋 [CONVERSATIONS] Grouped into conversations:', items.length);
      
      res.json({
        success: true,
        items,
        nextCursor: null,
        count: items.length
      });
    });
});

// Get messages for a specific conversation
app.get('/api/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const { connectionId, cursor, limit = 40 } = req.query;
  
  if (!connectionId) {
    return res.status(400).json({ success: false, error: 'connectionId é obrigatório' });
  }
  
  const connection = activeConnections.get(connectionId);
  if (!connection) {
    return res.status(404).json({ success: false, error: 'Conexão não encontrada' });
  }
  
  console.log(`📋 Buscando mensagens para conversa ${conversationId} na conexão ${connectionId}`);
  
  supabase
    .from('whatsapp_mensagens')
    .select('*')
    .eq('connection_id', connectionId)
    .eq('chat_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
      }
      
      res.json({
        success: true,
        items: data || [],
        nextCursor: null,
        count: (data || []).length
      });
    });
});

// Universal messages endpoint (unified from whatsapp-baileys-server.js)
app.post('/api/messages/send', async (req, res) => {
  try {
    const { connectionId, conversationId, to, type, payload } = req.body;
    
    if (!connectionId || !conversationId || !to || !type || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: connectionId, conversationId, to, type, payload'
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.isConnected || !connection.sock) {
      return res.status(409).json({
        success: false,
        error: 'Conexão não conectada'
      });
    }
    
    // Map payload to Baileys content format
    let content;
    if (type === 'text') {
      content = { text: payload.body };
    } else if (type === 'image') {
      content = { image: { url: payload.url }, caption: payload.caption };
    } else if (type === 'audio') {
      content = { audio: { url: payload.url }, mimetype: payload.mimetype || 'audio/ogg' };
    } else if (type === 'document') {
      content = { document: { url: payload.url }, fileName: payload.filename, mimetype: payload.mimetype };
    } else if (type === 'video') {
      content = { video: { url: payload.url }, caption: payload.caption };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Tipo de mensagem não suportado'
      });
    }
    
    // Send via existing Baileys connection
    const result = await connection.sock.sendMessage(to, content);
    
    // Save to database
    const messageId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { error } = await supabase.from('whatsapp_mensagens').insert({
      id: messageId,
      connection_id: connectionId,
      chat_id: to,
      content: payload.body || payload.caption || '',
      status: 'sent',
      media_url: payload.url,
      type: type,
      created_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
    }
    
    res.json({
      success: true,
      messageId: result?.key?.id,
      message: 'Mensagem enviada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// Mark messages as read (unified from whatsapp-baileys-server.js)
app.post('/api/messages/read', async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    const { connectionId } = req.query;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'connectionId é obrigatório'
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    // Update read status 
    if (messageIds && messageIds.length > 0) {
      for (const messageId of messageIds) {
        await sock.readMessages([
          { remoteJid: conversationId, fromMe: true, id: messageId }
        ]);
      }
    }
    
    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });
    
  } catch (error) {
    console.error('❌ Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// Typing indicator (unified from whatsapp-baileys-server.js)
app.post('/api/messages/typing', async (req, res) => {
  try {
    const { conversationId, state } = req.body;
    const { connectionId } = req.query;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'connectionId é obrigatório'
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    // Send typing state via Baileys
    if (state === 'on') {
      await connection.sock.presenceSubscribe(conversationId);
      await connection.sock.sendPresenceUpdate('composing', conversationId);
    } else if (state === 'off') {
      await connection.sock.sendPresenceUpdate('paused', conversationId);
    }
    
    res.json({
      success: true,
      message: 'Typing indicator atualizado'
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar typing indicator:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// Endpoint temporário para verificar mensagens
app.get('/api/baileys-simple/messages', async (req, res) => {
  try {
    const { ownerId, connectionId } = req.query;
    
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId é obrigatório' });
    }

    let query = supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('owner_id', ownerId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Erro no endpoint de mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para verificar estrutura da tabela
app.get('/api/baileys-simple/check-table', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao verificar tabela:', error);
      return res.status(500).json({ 
        error: 'Erro ao verificar tabela',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Tabela whatsapp_mensagens existe',
      sample: data?.[0] || 'Tabela vazia'
    });
  } catch (error) {
    console.error('Erro no endpoint de verificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para criar mensagens de teste
app.post('/api/baileys-simple/test-messages', async (req, res) => {
  try {
    const { ownerId, connectionId } = req.body;
    
    if (!ownerId || !connectionId) {
      return res.status(400).json({ error: 'ownerId e connectionId são obrigatórios' });
    }

    const testMessages = [
      {
        owner_id: ownerId,
        connection_id: connectionId,
        chat_id: '559999999999@s.whatsapp.net',
        phone: '559999999999',
        wpp_name: 'João Silva',
        conteudo: 'Olá! Gostaria de saber mais sobre seus serviços.',
        message_type: 'TEXTO',
        remetente: 'CLIENTE',
        lida: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min atrás
      },
      {
        owner_id: ownerId,
        connection_id: connectionId,
        chat_id: '559999999999@s.whatsapp.net',
        phone: '559999999999',
        wpp_name: 'João Silva',
        conteudo: 'Claro! Posso te ajudar com isso. Que tipo de serviço você procura?',
        message_type: 'TEXTO',
        remetente: 'OPERADOR',
        lida: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() // 25 min atrás
      },
      {
        owner_id: ownerId,
        connection_id: connectionId,
        chat_id: '559999999999@s.whatsapp.net',
        phone: '559999999999',
        wpp_name: 'João Silva',
        conteudo: 'Estou interessado em consultoria empresarial.',
        message_type: 'TEXTO',
        remetente: 'CLIENTE',
        lida: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() // 20 min atrás
      },
      {
        owner_id: ownerId,
        connection_id: connectionId,
        chat_id: '559888888888@s.whatsapp.net',
        phone: '559888888888',
        wpp_name: 'Maria Santos',
        conteudo: 'Bom dia! Preciso de ajuda com meu projeto.',
        message_type: 'TEXTO',
        remetente: 'CLIENTE',
        lida: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 min atrás
      }
    ];

    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .insert(testMessages)
      .select();

    if (error) {
      console.error('Erro ao inserir mensagens de teste:', error);
      return res.status(500).json({ 
        error: 'Erro ao inserir mensagens de teste',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'Mensagens de teste criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro no endpoint de mensagens de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint temporário para testar session_status
app.get('/api/baileys-simple/test-session-status', async (req, res) => {
  try {
    console.log('🔍 Testando coluna session_status...');
    
    // Buscar profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, session_status')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar profiles',
        details: profilesError
      });
    }
    
    console.log('📋 Profiles encontrados:', profiles.length);
    
    // Tentar atualizar session_status
    console.log('🔄 Testando atualização...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ session_status: 'connected' })
      .eq('id', '905b926a-785a-4f6d-9c3a-9455729500b3');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar session_status',
        details: updateError
      });
    }
    
    console.log('✅ Atualização bem-sucedida!');
    
    res.json({
      success: true,
      message: 'Teste de session_status concluído',
      profiles: profiles,
      updateResult: 'success'
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.status(500).json({
      success: false,
      error: 'Erro geral',
      details: error.message
    });
  }
});

// Login do usuário (atualizar session_status para connected)
app.post('/api/baileys-simple/login', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id é obrigatório'
      });
    }
    
    // Primeiro, definir todos os usuários como disconnected
    await supabase
      .from('profiles')
      .update({ session_status: 'disconnected' });
    
    // Depois, definir o usuário específico como connected
    const { error } = await supabase
      .from('profiles')
      .update({ session_status: 'connected' })
      .eq('id', user_id);
    
    if (error) {
      console.error('❌ Erro ao fazer login:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer login'
      });
    }
    
    console.log(`✅ Usuário ${user_id} fez login (session_status = connected)`);
    res.json({
      success: true,
      message: 'Login realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no login'
    });
  }
});

// Logout do usuário (atualizar session_status para disconnected)
app.post('/api/baileys-simple/logout', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id é obrigatório'
      });
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ session_status: 'disconnected' })
      .eq('id', user_id);
    
    if (error) {
      console.error('❌ Erro ao fazer logout:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer logout'
      });
    }
    
    console.log(`✅ Usuário ${user_id} fez logout (session_status = disconnected)`);
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no logout'
    });
  }
});

// Listar conexões
app.get('/api/baileys-simple/connections', async (req, res) => {
  try {
    // Buscar usuário ativo (session_status = 'connected')
    const activeUser = await getActiveUser();
    if (!activeUser) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum usuário ativo encontrado. Faça login primeiro.'
      });
    }
    
    const userId = activeUser.id;
    console.log(`📋 Listando conexões para usuário ativo: ${activeUser.email} (${userId})`);
    
    // Carregar todas as sessões do usuário específico do Supabase
    console.log(`🔍 Buscando sessões para userId: ${userId}`);
    const { data: sessions, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao carregar sessões do Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao carregar conexões'
      });
    }
    
    console.log(`📋 Encontradas ${sessions?.length || 0} sessões no Supabase`);
    
    // Remover duplicatas baseado em connection_id (manter apenas a mais recente)
    const uniqueSessions = [];
    const seenConnectionIds = new Set();
    
    for (const session of sessions || []) {
      if (!seenConnectionIds.has(session.connection_id)) {
        seenConnectionIds.add(session.connection_id);
        uniqueSessions.push(session);
      }
    }
    
    // Filtrar apenas conexões que estão ativas no servidor E realmente conectadas
    const activeConnectionsList = Array.from(activeConnections.values());
    
    // Filtrar sessões Baileys: apenas mostrar as conectadas (com phone)
    const filteredSessions = uniqueSessions.filter(session => {
      // Para Baileys: só mostrar se estiver conectado (tem phone)
      const isConnected = session.phone && session.status === 'connected';
      return isConnected;
    });

    const connections = filteredSessions.map(session => {
      const activeConn = activeConnectionsList.find(conn => conn.id === session.connection_id);
      
      // Para Baileys: conectado APENAS se tem phone (WhatsApp realmente conectou)
      const isConnected = session.phone && session.status === 'connected';
      
      const connectionData = {
        id: session.connection_id?.replace(/\s+/g, '_') || session.connection_id,
        name: session.session_name || `Conexão ${session.connection_id}`,
        type: 'whatsapp_baileys', // Sempre WhatsApp Baileys para sessões do Baileys
        connectionState: 'connected', // Só retornamos as conectadas
        isConnected: true, // Só retornamos as conectadas
        phoneNumber: session.phone || null,
        whatsappId: session.whatsapp_id || null,
        whatsappInfo: session.whatsapp_info || null,
        qrCode: null, // Não mostrar QR code para conectadas
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        connectedAt: session.connected_at,
        owner_id: session.owner_id // Adicionar owner_id
      };
      
      console.log('🔍 Mapeando sessão para conexão:', {
        connection_id: session.connection_id,
        session_name: session.session_name,
        name_final: connectionData.name
      });
      
      return connectionData;
    });
    
    console.log(`✅ Encontradas ${connections.length} conexões para usuário ${userId}`);
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Erro ao listar conexões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função para converter timestamp Unix para formato PostgreSQL
function convertUnixTimestamp(timestamp) {
  try {
    if (!timestamp) return null;
    
    // Se for um timestamp Unix (segundos), converter para milissegundos
    if (timestamp < 10000000000) {
      timestamp = timestamp * 1000;
    }
    
    const date = new Date(timestamp);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn(`⚠️ [TIMESTAMP] Timestamp inválido: ${timestamp}`);
      return null;
    }
    
    // Verificar se a data não é muito antiga (antes de 2000) ou muito futura (depois de 2100)
    const year = date.getFullYear();
    if (year < 2000 || year > 2100) {
      console.warn(`⚠️ [TIMESTAMP] Data fora do range válido: ${year} (timestamp: ${timestamp})`);
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    console.error(`❌ [TIMESTAMP] Erro ao converter timestamp ${timestamp}:`, error);
    return null;
  }
}

// Função para inicializar automaticamente o WhatsApp
async function initializeWhatsAppIfNeeded(userId) {
  try {
    console.log('🔄 [AUTO-INIT] Verificando se WhatsApp precisa ser inicializado...');
    
    // Verificar se já existe uma conexão ativa
    const { data: existingSessions, error: checkError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'connected')
      .not('connection_id', 'is', null);
    
    if (checkError) {
      console.error('❌ [AUTO-INIT] Erro ao verificar sessões existentes:', checkError);
      return null;
    }
    
    if (existingSessions && existingSessions.length > 0) {
      console.log(`✅ [AUTO-INIT] WhatsApp já está conectado: ${existingSessions[0].connection_id}`);
      return existingSessions[0].connection_id;
    }
    
    // Se não existe conexão ativa, criar uma nova
    console.log('🆕 [AUTO-INIT] Criando nova conexão WhatsApp automaticamente...');
    const connectionId = `connection_${Date.now()}`;
    
    // Criar conexão WhatsApp
    await createWhatsAppConnection(connectionId, userId, { 
      name: 'Conexão Automática',
      autoInit: true 
    });
    
    console.log(`✅ [AUTO-INIT] WhatsApp inicializado automaticamente: ${connectionId}`);
    return connectionId;
    
  } catch (error) {
    console.error('❌ [AUTO-INIT] Erro ao inicializar WhatsApp automaticamente:', error);
    return null;
  }
}

// Criar nova conexão
app.post('/api/baileys-simple/connections', async (req, res) => {
  try {
    const { name, type, autoInit = false } = req.body;
    console.log('🔍 POST /api/baileys-simple/connections - Dados recebidos:', { name, type, autoInit, body: req.body });
    
    // Buscar usuário ativo (session_status = 'connected')
    const activeUser = await getActiveUser();
    if (!activeUser) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum usuário ativo encontrado. Faça login primeiro.'
      });
    }
    
    const userId = activeUser.id;
    console.log(`🆕 Criando conexão para usuário ativo: ${activeUser.email} (${userId})`);
    
    // Se autoInit for true, inicializar automaticamente
    if (autoInit) {
      const connectionId = await initializeWhatsAppIfNeeded(userId);
      if (connectionId) {
        return res.json({
          success: true,
          data: {
            connectionId: connectionId,
            name: name || 'Conexão Automática',
            type: type || 'whatsapp_baileys',
            status: 'connecting',
            autoInitialized: true
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Erro ao inicializar WhatsApp automaticamente'
        });
      }
    }
    
    // Verificar conexões existentes do usuário específico no Supabase
    const { data: existingSessions, error: checkError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'connected')
      .not('connection_id', 'is', null);
    
    if (checkError) {
      console.error('Erro ao verificar conexões existentes:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar conexões existentes'
      });
    }
    
    // Verificar se já atingiu o limite de 5 conexões para este usuário
    const activeConnectionsCount = existingSessions ? existingSessions.length : 0;
    const maxConnections = 5;
    
    if (activeConnectionsCount >= maxConnections) {
      console.log(`⚠️ Limite de conexões atingido para usuário ${userId}. Ativas: ${activeConnectionsCount}/${maxConnections}`);
      
      return res.status(409).json({
        success: false,
        error: `Limite máximo de ${maxConnections} conexões WhatsApp atingido. Desconecte uma conexão existente para criar uma nova.`,
        code: 'MAX_CONNECTIONS_REACHED',
        data: {
          activeConnections: activeConnectionsCount,
          maxConnections: maxConnections
        }
      });
    }
    
    // Verificar se há conexões ativas com o mesmo número de telefone
    // (Esta verificação será feita após a conexão ser estabelecida e o número ser obtido)
    // Por enquanto, permitimos a criação da conexão
    
    const connectionId = `connection_${Date.now()}`;
    
    console.log(`🆕 Criando nova conexão: ${connectionId} para owner_id: ${userId}`);
    
    // Criar conexão WhatsApp
    await createWhatsAppConnection(connectionId, userId, { name });
    
    res.json({
      success: true,
      data: {
        connectionId: connectionId,
        name: name || `Conexão ${connectionId}`,
        type: type || 'whatsapp_baileys',
        status: 'disconnected'
      }
    });
  } catch (error) {
    console.error('Erro ao criar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conexão'
    });
  }
});

// Rota específica para inicialização automática do WhatsApp
app.post('/api/baileys-simple/auto-connect', async (req, res) => {
  try {
    const { connectionId: requestedConnectionId } = req.body;
    console.log('🔄 [AUTO-CONNECT] Inicialização automática do WhatsApp solicitada');
    console.log('🆔 [AUTO-CONNECT] ConnectionId solicitado:', requestedConnectionId);
    
    // Buscar usuário ativo (session_status = 'connected')
    const activeUser = await getActiveUser();
    if (!activeUser) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum usuário ativo encontrado. Faça login primeiro.'
      });
    }
    
    const userId = activeUser.id;
    console.log(`🔄 [AUTO-CONNECT] Inicializando WhatsApp para usuário: ${activeUser.email} (${userId})`);
    
    // Check for existing connected sessions first
    const { data: existingActiveSessions } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'connected')
      .not('phone', 'is', null);
    
    let finalConnectionId = requestedConnectionId;
    
    // If we have a specific connectionId, check if it's already connected
    if (requestedConnectionId) {
      const existingSession = existingActiveSessions?.find(sess => sess.connection_id === requestedConnectionId);
      
      if (existingSession && existingSession.status === 'connected' && existingSession.phone) {
        console.log(`⚠️ [AUTO-CONNECT] Conexão já está conectada: ${requestedConnectionId}`);
        return res.json({
          success: true,
          alreadyConnected: true,
          data: {
            connectionId: requestedConnectionId,
            name: existingSession.session_name || 'WhatsApp Connected',
            type: 'whatsapp_baileys',
            status: 'connected',
            phone: existingSession.phone,
            message: 'WhatsApp já está conectado. Não é necessário QR Code.'
          }
        });
      }
      
      console.log(`🔄 [AUTO-CONNECT] Usando connectionId já existente: ${requestedConnectionId}`);
      finalConnectionId = requestedConnectionId;
    } else {
      // Check if any active sessions exist
      if (existingActiveSessions && existingActiveSessions.length > 0) {
        console.log(`⚠️ [AUTO-CONNECT] Usuário já possui ${existingActiveSessions.length} conexões ativas`);
        
        // Check if we can connect another instance or it's at capacity
        const maxConnections = 5; // Match the limit from backend
        if (existingActiveSessions.length >= maxConnections) {
          console.log(`⚠️ [AUTO-CONNECT] Limite de conexões atingido: ${existingActiveSessions.length}/${maxConnections}`);
          return res.json({
            success: false,
            error: `Você já possui o limite máximo de ${maxConnections} conexões WhatsApp ativas. Desconecte uma antes de criar outra.`,
            hasReachedLimit: true,
            activeConnections: existingActiveSessions.length,
            maxConnections: maxConnections
          });
        }
      }
      
      console.log('🆕 [AUTO-CONNECT] Inicializando nova conexão WhatsApp automaticamente...');
      finalConnectionId = await initializeWhatsAppIfNeeded(userId);
    }
    
    if (finalConnectionId) {
      // Ensure Baileys is running for this connection
      const connection = activeConnections.get(finalConnectionId);
      if (!connection) {
        console.log('🔄 [AUTO-CONNECT] Iniciando Baileys para connectionId:', finalConnectionId);
        // Connection doesn't exist, initialize it
        await createWhatsAppConnection(finalConnectionId, userId, {});
      }
      
      res.json({
        success: true,
        data: {
          connectionId: finalConnectionId,
          name: 'Conexão Automática',
          type: 'whatsapp_baileys',
          status: 'connecting',
          autoInitialized: true,
          baileysStarted: true,
          message: 'Baileys iniciado automaticamente e pronto para QR Code'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao inicializar WhatsApp automaticamente'
      });
    }
  } catch (error) {
    console.error('❌ [AUTO-CONNECT] Erro na inicialização automática:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Obter QR Code
app.get('/api/baileys-simple/connections/:connectionId/qr', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    // Buscar QR code do Supabase se não estiver na memória
    let qrCode = connection.qrCode;
    if (!qrCode) {
      const { data: session, error } = await supabase
        .from('whatsapp_sessions')
        .select('qr_code, status')
        .eq('connection_id', connectionId)
        .single();
      
      if (!error && session) {
        qrCode = session.qr_code;
      }
    }
    
    res.json({
      success: true,
      data: {
        qrCode: qrCode,
        connectionState: connection.connectionState,
        isConnected: connection.isConnected
      }
    });
  } catch (error) {
    console.error('Erro ao obter QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter QR code'
    });
  }
});

// Obter informações da conexão
app.get('/api/baileys-simple/connections/:connectionId/info', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        connectionState: connection.connectionState,
        isConnected: connection.isConnected,
        phoneNumber: connection.phoneNumber,
        whatsappInfo: connection.whatsappInfo,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações da conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações da conexão'
    });
  }
});

// Get contacts for a connection
app.get('/api/baileys-simple/connections/:connectionId/contacts', async (req, res) => {
  try {
    const { connectionId } = req.params;
    // Fix connection ID with spaces - replace spaces with underscores
    const sanitizedConnectionId = connectionId.replace(/\s+/g, '_');
    const connection = activeConnections.get(sanitizedConnectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    const sock = connection.sock;
    if (!sock) {
      return res.status(404).json({
        success: false,
        error: 'Socket not available for this connection'
      });
    }

    // Get contacts from Baileys store
    const contacts = sock.store?.contacts || {};
    const chats = sock.store?.chats || {};
    
    // Transform contacts into a more useful format
    const contactList = Object.entries(contacts).map(([jid, contact]) => {
      const chat = chats[jid];
      return {
        jid,
        name: contact.name || contact.notify || contact.vname,
        pushName: contact.pushName || contact.notify,
        isGroup: jid.includes('@g.us'),
        isBlocked: chat?.blocked || false,
        isMuted: chat?.muted || false,
        // Include group metadata if available
        ...(jid.includes('@g.us') && chat ? {
          groupSubject: chat.subject,
          groupDescription: chat.desc,
          participantsCount: chat.participants?.length || 0
        } : {})
      };
    });

    // Also get group metadata for groups
    const enhancedContacts = await Promise.all(
      contactList.map(async (contact) => {
        if (contact.isGroup && sock.groupMetadata) {
          try {
            const groupMetadata = await sock.groupMetadata(contact.jid);
            if (groupMetadata) {
              return {
                ...contact,
                groupSubject: groupMetadata.subject,
                groupDescription: groupMetadata.desc,
                groupOwner: groupMetadata.owner,
                participantsCount: groupMetadata.participants?.length || 0,
                groupCreated: groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toISOString() : null,
                groupAdmins: groupMetadata.participants?.filter(p => p.admin === 'admin').map(p => p.id) || []
              };
            }
          } catch (error) {
            // Silent error - group metadata not available
          }
        }
        return contact;
      })
    );

    res.json({
      success: true,
      contacts: enhancedContacts,
      total: enhancedContacts.length
    });
  } catch (error) {
    console.error('Erro ao obter contatos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter contatos'
    });
  }
});

// Refresh QR code
app.post('/api/baileys-simple/connections/:connectionId/refresh-qr', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    console.log(`🔄 Refreshing QR code para ${connectionId}`);
    
    // Reconnect to generate new QR
    if (connection.sock) {
      connection.sock.logout();
    }
    
    await createWhatsAppConnection(connectionId);
    
    res.json({
      success: true,
      message: 'QR code refresh iniciado'
    });
  } catch (error) {
    console.error('Erro ao refresh QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao refresh QR code'
    });
  }
});

// Enviar mensagem
app.post('/api/baileys-simple/connections/:connectionId/send-message', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { chatId, type = 'text', text, mediaUrl } = req.body || {};

    console.log('📤 [SEND-MESSAGE] Recebida requisição:', { connectionId, chatId, type, text: text?.substring(0, 50), mediaUrl });

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      console.error(`❌ [SEND-MESSAGE] Conexão não encontrada: ${connectionId}`);
      console.error(`❌ [SEND-MESSAGE] Conexões ativas:`, Array.from(activeConnections.keys()));
      return res.status(404).json({ ok: false, error: 'Connection not found' });
    }
    
    const sock = connection.sock;

    const jid = ensureJid(chatId);

    let content;
    if (type === 'text' || !mediaUrl) {
      const body = (text || '').trim();
      if (!body) return res.status(400).json({ ok: false, error: 'Empty message' });
      content = { text: body };
    } else {
      const fetchFn = global.fetch || ((...a) => import('node-fetch').then(({ default: f }) => f(...a)));
      const r = await fetchFn(mediaUrl);
      if (!r.ok) throw new Error(`Failed to fetch media: ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());

      if (type === 'image') content = { image: buf, caption: text || '' };
      else if (type === 'video') content = { video: buf, caption: text || '' };
      else if (type === 'audio') {
        // Usar abordagem recomendada do Baileys para áudio
        // Tentar diferentes formatos para compatibilidade
        try {
          content = { 
            audio: buf, 
            ptt: true, // Push-to-talk (áudio de voz)
            mimetype: 'audio/ogg; codecs=opus' // Formato otimizado para WhatsApp
          };
        } catch (error) {
          console.log('🔄 Tentando formato alternativo para áudio...');
          content = { 
            audio: buf, 
            ptt: true
          };
        }
      } else content = { document: buf, fileName: 'file' };
    }

    // 1) ENVIAR VIA BAILEYS
    console.log('📤 [SEND-MESSAGE] Enviando via Baileys:', { jid, content });
    const sent = await sock.sendMessage(jid, content, { 
      linkPreview: false,
      quoted: undefined 
    });
    console.log('✅ [SEND-MESSAGE] Mensagem enviada via Baileys:', { messageId: sent?.key?.id });

    // 2) SALVAR MÍDIA NO SUPABASE STORAGE SE NECESSÁRIO
    let finalMediaUrl = mediaUrl || null;
    if (type !== 'text' && mediaUrl && (type === 'image' || type === 'video' || type === 'audio')) {
      try {
        // Baixar mídia da URL e fazer upload para Supabase Storage
        const fetchFn = global.fetch || ((...a) => import('node-fetch').then(({ default: f }) => f(...a)));
        const response = await fetchFn(mediaUrl);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'ogg'}`;
          
          // Upload para Supabase Storage
          const { error: uploadError } = await supabaseAdmin.storage
            .from('whatsapp')
            .upload(fileName, buffer, {
              contentType: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/ogg',
              upsert: false
            });
          
          if (!uploadError) {
            // Criar URL pública
            const { data: signedUrl } = await supabaseAdmin.storage
              .from('whatsapp')
              .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 dias
            
            if (signedUrl) {
              finalMediaUrl = signedUrl.signedUrl;
              console.log('✅ [SEND-MESSAGE] Mídia salva no Supabase Storage:', finalMediaUrl);
            }
          }
        }
      } catch (uploadError) {
        console.error('❌ [SEND-MESSAGE] Erro ao salvar mídia no Supabase:', uploadError);
      }
    }

    // 3) SALVAR COMO MENSAGEM "REAL"
    console.log('💾 [SEND-MESSAGE] Obtendo informações da sessão...');
    const { ownerId, connectionPhone } = await getSessionInfo(connectionId, supabase);
    const nowIso = new Date().toISOString();
    console.log('💾 [SEND-MESSAGE] Informações da sessão:', { ownerId, connectionPhone });

    const row = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      atendimento_id: null,
      connection_id: connectionId,
      connection_phone: connectionPhone,
      chat_id: jid,
      phone: jid.split('@')[0],
      conteudo: typeof content?.text === 'string' ? content.text : (text || (type === 'image' ? '[Imagem]' : type === 'video' ? '[Vídeo]' : type === 'audio' ? '[Áudio]' : '[Arquivo]')),
      message_id: sent?.key?.id ?? null,
      message_type: type === 'text' ? 'TEXTO'
                   : type === 'image' ? 'IMAGEM'
                   : type === 'video' ? 'VIDEO'
                   : type === 'audio' ? 'AUDIO'
                   : 'ARQUIVO',
      media_type: type !== 'text' ? (type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/ogg') : null,
      remetente: 'ATENDENTE',          // manter consistente com UI/DB
      status: 'ATENDIDO',
      timestamp: nowIso,
      lida: true,
      media_url: finalMediaUrl,
      media_mime: type !== 'text' ? (type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/ogg') : null,
      duration_ms: null,
      wpp_name: null
    };

    console.log('💾 [SEND-MESSAGE] Salvando no Supabase:', row);
    const { error: dbErr } = await supabase.from('whatsapp_mensagens').insert(row);
    if (dbErr) {
      console.error('❌ [SEND-MESSAGE] Erro ao salvar no Supabase:', dbErr);
    } else {
      console.log('✅ [SEND-MESSAGE] Mensagem salva no Supabase com sucesso');
      
      // 🤖 IA NÃO É MAIS DESATIVADA AUTOMATICAMENTE quando operador envia mensagem
      // A IA só é desativada quando o usuário clica explicitamente no botão "Você"
      console.log('🤖 [SEND-MESSAGE] IA permanece ativa - não desativando automaticamente');
    }

    // 3) EMITIR EM TEMPO REAL
    const roomName = `${connectionId}-${jid}`;
    console.log('📡 [SEND-MESSAGE] Emitindo newMessage para sala:', roomName);
    console.log('📡 [SEND-MESSAGE] Dados da mensagem:', {
      chat_id: jid,
      conteudo: row.conteudo,
      remetente: row.remetente,
      messageId: row.id
    });
    
    // Verificar se a sala existe antes de emitir
    const roomClients = io.sockets.adapter.rooms.get(roomName);
    console.log('📡 [SEND-MESSAGE] Clientes na sala:', roomClients ? roomClients.size : 0);
    
    io.to(roomName).emit('newMessage', row);
    
    // Verificar se há clientes na sala de conexão antes de emitir
    const connectionRoomClients = io.sockets.adapter.rooms.get(connectionId);
    console.log('📡 [SEND-MESSAGE] Clientes na sala de conexão:', connectionRoomClients ? connectionRoomClients.size : 0);
    
    io.to(connectionId).emit('conversation:updated', {
      connectionId,
      conversationId: jid,
      lastMessageAt: nowIso,
      last_message: row,
      preview: row.conteudo || '[Mensagem]',
      from: 'ATENDENTE',
      unread_count_delta: 0,
      // Adicionar nome_cliente para o frontend
      nome_cliente: row.wpp_name || `Contato ${row.phone}`,
      numero_cliente: row.phone
    });

    console.log('✅ [SEND-MESSAGE] Processo completo finalizado');
    return res.json({ ok: true, messageId: sent?.key?.id || null });
  } catch (e) {
    console.error('send-message error:', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Enviar mídia (imagem, vídeo, áudio, documento)
app.post('/api/baileys-simple/send-media', upload.single('file'), async (req, res) => {
  try {
    const { connectionId, jid, type } = req.body;
    const file = req.file;

    console.log('📤 [SEND-MEDIA] Recebida requisição:', { connectionId, jid, type, fileName: file?.originalname });

    if (!connectionId || !jid || !type || !file) {
      return res.status(400).json({ 
        success: false, 
        error: 'connectionId, jid, type e file são obrigatórios' 
      });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      console.error(`❌ [SEND-MEDIA] Conexão não encontrada: ${connectionId}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    
    const sock = connection.sock;
    const chatJid = ensureJid(jid);

    // Preparar conteúdo baseado no tipo
    let content;
    const fileBuffer = fs.readFileSync(file.path);
    
    switch (type) {
      case 'image':
        // Usar URL local para envio mais eficiente
        if (fs.existsSync(file.path)) {
          console.log('📁 [SEND-MEDIA] Usando arquivo local para imagem:', file.path);
          content = { 
            image: { url: file.path }, 
            caption: req.body.caption || ''
          };
        } else {
          // Fallback para buffer
          content = { 
            image: fileBuffer, 
            caption: req.body.caption || '',
            mimetype: file.mimetype
          };
        }
        break;
      case 'video':
        // Usar URL local para envio mais eficiente
        if (fs.existsSync(file.path)) {
          console.log('📁 [SEND-MEDIA] Usando arquivo local para vídeo:', file.path);
          content = { 
            video: { url: file.path }, 
            caption: req.body.caption || ''
          };
        } else {
          // Fallback para buffer
          content = { 
            video: fileBuffer, 
            caption: req.body.caption || '',
            mimetype: file.mimetype
          };
        }
        break;
      case 'audio':
        // Usar URL local para envio mais eficiente
        if (fs.existsSync(file.path)) {
          console.log('📁 [SEND-MEDIA] Usando arquivo local para áudio:', file.path);
          content = { 
            audio: { url: file.path }, 
            ptt: true,
            mimetype: 'audio/ogg; codecs=opus'
          };
        } else {
          // Fallback para buffer
          content = { 
            audio: fileBuffer, 
            ptt: true,
            mimetype: file.mimetype
          };
        }
        break;
      case 'document':
        content = { 
          document: fileBuffer, 
          fileName: file.originalname,
          mimetype: file.mimetype
        };
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Tipo de mídia não suportado' 
        });
    }

    // Enviar via Baileys
    console.log('📤 [SEND-MEDIA] Enviando via Baileys:', { chatJid, type });
    const sent = await sock.sendMessage(chatJid, content, { 
      linkPreview: false,
      quoted: undefined 
    });
    console.log('✅ [SEND-MEDIA] Mídia enviada via Baileys:', { messageId: sent?.key?.id });

    // Salvar no banco
    const { ownerId, connectionPhone } = await getSessionInfo(connectionId, supabase);
    const nowIso = new Date().toISOString();

    // Salvar mídia no Supabase Storage e obter URL
    let mediaUrl = null;
    try {
      const fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${file.mimetype.split('/')[1] || 'bin'}`;
      
      // Upload para Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('whatsapp')
        .upload(fileName, fs.readFileSync(file.path), {
          contentType: file.mimetype,
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ [SEND-MEDIA] Erro ao fazer upload da mídia:', uploadError);
      } else {
        console.log('✅ [SEND-MEDIA] Mídia salva no Supabase:', fileName);
        
        // Criar URL pública
        const { data: signedUrl } = await supabaseAdmin.storage
          .from('whatsapp')
          .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 dias
        
        if (signedUrl) {
          mediaUrl = signedUrl.signedUrl;
          console.log('✅ [SEND-MEDIA] URL pública criada:', mediaUrl);
        }
      }
    } catch (uploadError) {
      console.error('❌ [SEND-MEDIA] Erro ao salvar mídia no Supabase:', uploadError);
    }

    const row = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      atendimento_id: null,
      connection_id: connectionId,
      connection_phone: connectionPhone,
      chat_id: chatJid,
      phone: chatJid.split('@')[0],
      conteudo: content.caption || `[${type.toUpperCase()}]`,
      message_id: sent?.key?.id ?? null,
      message_type: type.toUpperCase(),
      media_type: file.mimetype,
      remetente: 'ATENDENTE',
      status: 'ATENDIDO',
      timestamp: nowIso,
      lida: true,
      media_url: mediaUrl, // URL da mídia no Supabase Storage
      media_mime: file.mimetype,
      duration_ms: null,
      wpp_name: null
    };

    console.log('💾 [SEND-MEDIA] Salvando no Supabase:', row);
    const { error: dbErr } = await supabase.from('whatsapp_mensagens').insert(row);
    if (dbErr) {
      console.error('❌ [SEND-MEDIA] Erro ao salvar no Supabase:', dbErr);
    } else {
      console.log('✅ [SEND-MEDIA] Mídia salva no Supabase com sucesso');
    }

    // Emitir em tempo real
    const roomName = `${connectionId}-${chatJid}`;
    io.to(roomName).emit('newMessage', row);
    
    io.to(connectionId).emit('conversation:updated', {
      connectionId,
      conversationId: chatJid,
      lastMessageAt: nowIso,
      last_message: row,
      preview: `[${type.toUpperCase()}]`,
      from: 'ATENDENTE',
      unread_count_delta: 0,
      // Adicionar nome_cliente para o frontend
      nome_cliente: row.wpp_name || `Contato ${row.phone}`,
      numero_cliente: row.phone
    });

    // Limpar arquivo temporário
    fs.unlinkSync(file.path);

    console.log('✅ [SEND-MEDIA] Processo completo finalizado');
    return res.json({ 
      success: true, 
      data: {
        messageId: sent?.key?.id,
        type: type,
        fileName: file.originalname
      }
    });
  } catch (e) {
    console.error('❌ [SEND-MEDIA] Erro:', e);
    return res.status(500).json({ 
      success: false, 
      error: String(e?.message || e) 
    });
  }
});

// Mark messages as read for a chat (DB + realtime broadcast)
// Keeps UI badge at 0 even after refresh.
app.post('/api/baileys-simple/connections/:connectionId/mark-read', async (req, res) => {
  const { connectionId } = req.params;
  const { chatId } = req.body || {};
  if (!connectionId || !chatId) return res.status(400).json({ ok: false, error: 'connectionId and chatId required' });

  try {
    console.log(`📖 Marcando conversa como lida: ${chatId} para conexão: ${connectionId}`);
    
    // Primeiro, verificar quantas mensagens não lidas existem
    const { data: unreadMessages, error: countError } = await supabase
      .from('whatsapp_mensagens')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('chat_id', chatId)
      .eq('remetente', 'CLIENTE')
      .eq('lida', false);

    if (countError) throw countError;
    
    console.log(`🔍 Encontradas ${unreadMessages?.length || 0} mensagens não lidas para ${chatId}`);

    const { error, count } = await supabase
      .from('whatsapp_mensagens')
      .update({ lida: true })
      .eq('connection_id', connectionId)
      .eq('chat_id', chatId)
      .eq('remetente', 'CLIENTE')         // only customer messages count as unread
      .eq('lida', false)
      .select('id', { count: 'exact' });

    if (error) throw error;

    console.log(`✅ ${count} mensagens marcadas como lidas para ${chatId}`);

    // Let all clients for this connection know unread=0 for this conversation
    io.to(connectionId).emit('conversation:read', {
      connectionId,
      conversationId: chatId,
      unread_count: 0,
    });

    console.log(`📡 Emitindo conversation:read para ${connectionId} - ${chatId}`);

    return res.json({ ok: true, count });
  } catch (e) {
    console.error('mark-read error:', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Finalizar conversa
app.post('/api/baileys-simple/connections/:connectionId/finalizar-conversa', async (req, res) => {
  const { connectionId } = req.params;
  const { chatId } = req.body || {};
  if (!connectionId || !chatId) return res.status(400).json({ ok: false, error: 'connectionId and chatId required' });

  try {
    console.log(`🔴 Finalizando conversa: ${chatId} para conexão: ${connectionId}`);
    
    // Atualizar status de todas as mensagens da conversa para FINALIZADO
    const { error: updateError, count } = await supabase
      .from('whatsapp_mensagens')
      .update({ status: 'FINALIZADO' })
      .eq('connection_id', connectionId)
      .eq('chat_id', chatId);

    if (updateError) throw updateError;

    console.log(`✅ ${count} mensagens marcadas como FINALIZADO para ${chatId}`);

    // Emitir evento para atualizar frontend
    io.to(connectionId).emit('conversation:finalized', {
      connectionId,
      conversationId: chatId,
      status: 'FINALIZADO'
    });

    console.log(`📡 Emitindo conversation:finalized para ${connectionId} - ${chatId}`);

    return res.json({ ok: true, count });
  } catch (e) {
    console.error('finalizar-conversa error:', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Endpoint para alterar modo de atendimento (dropdown)
app.post('/api/baileys-simple/atendimentos/change-mode', async (req, res) => {
  try {
    const { chatId, mode, connectionId, ownerId } = req.body;
    
    console.log('🔍 [CHANGE-MODE] Request body:', { chatId, mode, connectionId, ownerId });
    
    if (!chatId || !mode || !connectionId || !ownerId) {
      console.log('❌ [CHANGE-MODE] Missing required fields:', { chatId: !!chatId, mode: !!mode, connectionId: !!connectionId, ownerId: !!ownerId });
      return res.status(400).json({ 
        ok: false, 
        error: 'chatId, mode, connectionId e ownerId são obrigatórios' 
      });
    }
    
    if (!['human', 'ai'].includes(mode)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Mode deve ser "human" ou "ai"' 
      });
    }
    
    console.log(`🔄 Alterando modo de atendimento para ${mode} no chat ${chatId}`);
    
    // Buscar o contato pelo chat_id (suporta tanto contatos individuais quanto grupos)
    let phoneNumber;
    if (chatId.includes('@g.us')) {
      // Para grupos, usar o chat_id completo
      phoneNumber = chatId;
    } else {
      // Para contatos individuais, extrair o número
      phoneNumber = chatId.replace('@s.whatsapp.net', '');
    }
    
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, phone, name, ai_enabled, whatsapp_jid')
      .eq(chatId.includes('@g.us') ? 'whatsapp_jid' : 'phone', phoneNumber)
      .eq('owner_id', ownerId)
      .single();
    
    if (contactError || !contactData) {
      console.log('⚠️ Contato não encontrado, criando novo contato');
      
      // Criar novo contato se não existir
      // Para novas conversas, usar o attendance_type da conexão como padrão
      let defaultAiEnabled = false;
      try {
        const { data: sessionData } = await supabase
          .from('whatsapp_sessions')
          .select('attendance_type')
          .eq('owner_id', ownerId)
          .eq('connection_id', connectionId)
          .single();
        
        if (sessionData && sessionData.attendance_type === 'AI') {
          defaultAiEnabled = true;
          console.log('🤖 Nova conversa criada com IA habilitada (configuração da conexão)');
        } else {
          console.log('🤖 Nova conversa criada com atendimento humano (configuração da conexão)');
        }
      } catch (error) {
        console.log('🤖 Erro ao buscar configuração da conexão, usando padrão humano');
      }
      
      const contactData = {
        phone: chatId.includes('@g.us') ? phoneNumber.split('@')[0] : phoneNumber,
        name: chatId.includes('@g.us') ? 'Grupo WhatsApp' : phoneNumber,
        whatsapp_name: chatId.includes('@g.us') ? 'Grupo WhatsApp' : phoneNumber,
        whatsapp_jid: chatId,
        whatsapp_is_group: chatId.includes('@g.us'),
        ai_enabled: mode === 'ai' ? true : defaultAiEnabled,
        owner_id: ownerId
      };
      
      console.log('🔍 [CHANGE-MODE] Creating new contact with data:', contactData);
      
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar contato:', createError);
        return res.status(500).json({ 
          ok: false, 
          error: 'Erro ao criar contato' 
        });
      }
      
      console.log('✅ Contato criado com sucesso');
      return res.json({ 
        ok: true, 
        message: 'Modo de atendimento alterado com sucesso',
        contact: newContact
      });
    }
    
    // Atualizar o contato existente
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ ai_enabled: mode === 'ai' })
      .eq('id', contactData.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar contato:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Erro ao atualizar contato' 
      });
    }
    
    console.log(`✅ Modo de atendimento alterado para ${mode} no contato ${contactData.id}`);
    
    res.json({ 
      ok: true, 
      message: 'Modo de atendimento alterado com sucesso',
      contact: { ...contactData, ai_enabled: mode === 'ai' }
    });
    
  } catch (error) {
    console.error('❌ Erro ao alterar modo de atendimento:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Mark all client messages as read for a conversation
app.post('/api/baileys-simple/atendimentos/:atendimentoId/read', async (req, res) => {
  try {
    const { atendimentoId } = req.params;
    const { connectionId } = req.body || {};
    const { error } = await supabase
      .from('whatsapp_mensagens')
      .update({ lida: true })
      .eq('connection_id', connectionId)
      .eq('remetente', 'CLIENTE')
      .eq('lida', false);

    if (error) return res.status(500).json({ success: false, error: error.message });
    if (connectionId) {
      io.to(connectionId).emit('conversation:read', { connectionId, conversationId: atendimentoId });
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erro ao marcar como lido' });
  }
});

// Registrar contato WhatsApp na tabela contacts
app.post('/api/baileys-simple/register-contact', async (req, res) => {
  try {
    const { phone, name, owner_id } = req.body;
    
    if (!phone || !owner_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone e owner_id são obrigatórios' 
      });
    }

    console.log('📱 Registrando contato WhatsApp:', { phone, name, owner_id });

    // Verificar se o contato já existe
    const { data: existingContact, error: searchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', phone)
      .eq('owner_id', owner_id)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }

    if (existingContact) {
      // Atualizar contato existente
      console.log('🔄 Atualizando contato existente:', existingContact.id);
      
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update({
          name: name || existingContact.name,
          last_contact_at: new Date().toISOString(),
          whatsapp_opted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('✅ Contato atualizado:', updatedContact.id);
      return res.json({ 
        success: true, 
        contact: updatedContact, 
        action: 'updated' 
      });
    } else {
      // Criar novo contato
      console.log('➕ Criando novo contato');
      
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert({
          phone: phone,
          name: name || phone, // Usar telefone como nome se não fornecido
          owner_id: owner_id,
          status: 'active',
          whatsapp_opted: true,
          last_contact_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Novo contato criado:', newContact.id);
      return res.json({ 
        success: true, 
        contact: newContact, 
        action: 'created' 
      });
    }
  } catch (error) {
    console.error('❌ Erro ao registrar contato WhatsApp:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Atualizar nome do contato
app.put('/api/baileys-simple/contacts/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, owner_id } = req.body;
    
    if (!name || !owner_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e owner_id são obrigatórios' 
      });
    }

    console.log('📝 Atualizando nome do contato:', { contactId, name, owner_id });

    // Atualizar contato na tabela contacts
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update({
        name: name,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('owner_id', owner_id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          error: 'Contato não encontrado' 
        });
      }
      throw updateError;
    }

    // Atualizar nome nas conversas do WhatsApp
    const { error: convUpdateError } = await supabase
      .from('whatsapp_conversations')
      .update({
        nome_cliente: name,
        updated_at: new Date().toISOString()
      })
      .eq('phone', updatedContact.phone)
      .eq('owner_id', owner_id);

    if (convUpdateError) {
      console.warn('⚠️ Erro ao atualizar nome nas conversas:', convUpdateError);
    }

    console.log('✅ Nome do contato atualizado:', updatedContact.id);
    return res.json({ 
      success: true, 
      contact: updatedContact 
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar nome do contato:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    });
  }
});

// Abort connection
app.post('/api/baileys-simple/connections/:connectionId/abort', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.headers['x-user-id'] || req.body.user_id || '00000000-0000-0000-0000-000000000000';
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    console.log(`🛑 Abortando conexão ${connectionId} para usuário ${userId}`);
    
    if (connection.sock) {
      connection.sock.logout();
    }
    
    // Marcar como desconectado no Supabase antes de remover
    await updateConnectionStatus(connectionId, 'disconnected', {}, userId);
    
    // Remover da memória
    activeConnections.delete(connectionId);
    
    // Remover do Supabase
    await removeSessionFromSupabase(connectionId);
    
    // Emitir evento de remoção para o frontend
    io.emit('connectionRemoved', { connectionId });
    
    res.json({
      success: true,
      message: 'Conexão abortada'
    });
  } catch (error) {
    console.error('Erro ao abortar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao abortar conexão'
    });
  }
});

// DELETE /api/baileys-simple/connections/:connectionId - Deletar conexão completamente
app.delete('/api/baileys-simple/connections/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.headers['x-user-id'] || req.body.user_id || '00000000-0000-0000-0000-000000000000';
    const connection = activeConnections.get(connectionId);
    
    console.log(`🗑️ Deletando conexão ${connectionId} para usuário ${userId}`);
    
    // Se a conexão estiver ativa, desconectar primeiro
    if (connection && connection.sock) {
      console.log(`🔌 Desconectando conexão ativa ${connectionId}`);
      connection.sock.logout();
    }
    
    // Marcar como desconectado no Supabase antes de remover
    await updateConnectionStatus(connectionId, 'disconnected', {}, userId);
    
    // Remover da memória
    activeConnections.delete(connectionId);
    
    // Remover do Supabase
    await removeSessionFromSupabase(connectionId);
    
    // Emitir evento de remoção para o frontend
    io.emit('connectionRemoved', { connectionId });
    
    console.log(`✅ Conexão ${connectionId} deletada com sucesso`);
    
    res.json({
      success: true,
      message: 'Conexão deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar conexão'
    });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado via Socket.IO');

  // 🔥 STREAMING CHAT SYSTEM - Como Respond.io instant messages
  socket.on('join:conversation', async ({ chatId, requestId, ownerId, connectionId }) => {
    console.log('🚀 [STREAM] Join conversation request:', { chatId, requestId, ownerId, connectionId });
    
    const roomName = `conversation_${chatId}_${ownerId}`;
    socket.join(roomName);
    
    try {
      // Fetch conversation bundle for immediate response
      const { data: messages } = await supabaseAdmin
        .from('whatsapp_mensagens')
        .select('*')
        .eq('chat_id', chatId)
        .eq('owner_id', ownerId)
        .order('timestamp', { ascending: true })
        .limit(50);

      const { data: conversation } = await supabaseAdmin
        .from('whatsapp_atendimentos')
        .select('id, nome_cliente, numero_cliente, unread, ultima_mensagem_em')
        .eq('chat_id', chatId)
        .eq('owner_id', ownerId)
        .single();

      // Stream bundle instantly to client
      socket.emit('conversation:bundle', {
        requestId,
        conversation,
        messages: messages || [],
        timestamp: new Date().toISOString()
      });

      console.log('✅ [STREAM] Conversation bundle sent:', chatId);
    } catch (error) {
      console.error('❌ [STREAM] Error loading conversation bundle:', error);
      socket.emit('conversation:error', { requestId, error: error.message });
    }
  });

  // Direct message send streaming
  socket.on('send:message', async ({ chatId, content, message_type, tempId, ownerId, connectionId }) => {
    console.log('📤 [STREAM] Sending message:', { chatId, content: content.substring(0, 30), tempId });
    
    try {
      // Save to database
      const messageData = {
        message_id: crypto.randomUUID(),
        chat_id: chatId,
        conteudo: content,
        message_type: message_type,
        remetente: 'AGENTE',
        timestamp: new Date().toISOString(),
        owner_id: ownerId,
        status: 'sent'
      };

      const { data: savedMessage, error: saveError } = await supabaseAdmin
        .from('whatsapp_mensagens')
        .insert(messageData)
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      // Stream updated message back to everyone in the conversation
      const roomName = `conversation_${chatId}_${ownerId}`;
      io.to(roomName).emit('message:update', {
        messageId: tempId,
        update: {
          id: savedMessage.id,
          status: 'sent',
          timestamp: savedMessage.timestamp
        }
      });

      console.log('✅ [STREAM] Message saved and streamed:', savedMessage.id);
    } catch (error) {
      console.error('❌ [STREAM] Error saving message:', error);
      socket.emit('message:failed', { tempId, error: error.message });
    }
  });

  // Typing indicators
  socket.on('typing:start', ({ chatId, ownerId, connectionId }) => {
    const roomName = `conversation_${chatId}_${ownerId}`;
    io.to(roomName).emit('typing:start', { chatId, contactName: 'User' });
  });

  socket.on('typing:end', ({ chatId, ownerId, connectionId }) => {
    const roomName = `conversation_${chatId}_${ownerId}`;
    io.to(roomName).emit('typing:end', { chatId });
  });

  socket.on('join', (data) => {
    const { connectionId, conversationId, room } = data;
    const roomName = room || `${connectionId}-${conversationId}`;
    console.log(`👤 ===== CLIENTE ENTRANDO NA SALA =====`);
    console.log(`👤 Sala: ${roomName}`);
    console.log(`👤 Dados recebidos:`, data);
    console.log(`👤 Socket ID: ${socket.id}`);
    
    socket.join(roomName);
    
    // Listar salas do socket para debug
    console.log(`👤 Salas do socket após join:`, Array.from(socket.rooms));
    
    // Verificar se a sala foi criada corretamente
    const roomInfo = io.sockets.adapter.rooms.get(roomName);
    console.log(`👤 Sala criada? ${!!roomInfo}, Clientes na sala: ${roomInfo ? roomInfo.size : 0}`);
  });

  // NEW: room for the *whole* connection (left pane updates)
  socket.on('joinConnection', ({ connectionId }) => {
    console.log(`👥 ===== CLIENTE ENTRANDO NA SALA DE CONEXÃO =====`);
    console.log(`👥 Connection ID: ${connectionId}`);
    console.log(`👥 Socket ID: ${socket.id}`);
    socket.join(connectionId);
    
    // Verificar se entrou na sala
    const roomInfo = io.sockets.adapter.rooms.get(connectionId);
    console.log(`👥 Sala de conexão criada? ${!!roomInfo}, Clientes: ${roomInfo ? roomInfo.size : 0}`);
    
    // Enviar mensagem de teste para confirmar conexão
    socket.emit('test-connection', { 
      message: 'Conexão estabelecida com sucesso!', 
      timestamp: new Date().toISOString() 
    });

    // Teste: enviar uma mensagem fake para testar o sistema
    setTimeout(() => {
      console.log('🧪 Enviando mensagem de teste para debug...');
      const testMessage = {
        id: `test_${Date.now()}`,
        message_id: `test_${Date.now()}`,
        chat_id: 'test-chat-id',
        conteudo: 'Mensagem de teste do servidor',
        message_type: 'TEXTO',
        remetente: 'CLIENTE',
        timestamp: new Date().toISOString(),
        lida: false,
        connection_id: connectionId,
        owner_id: 'test-owner',
        atendimento_id: `test_${Date.now()}`,
        status: 'AGUARDANDO'
      };
      
      // Emitir para a sala de conexão
      io.to(connectionId).emit('newMessage', testMessage);
      console.log('🧪 Mensagem de teste enviada para a sala:', connectionId);
    }, 3000);
  });

  socket.on('leave', (data) => {
    const { room } = data;
    console.log(`👋 ===== CLIENTE SAINDO DA SALA =====`);
    console.log(`👋 Sala: ${room}`);
    console.log(`👋 Socket ID: ${socket.id}`);
    
    socket.leave(room);
    
    // Verificar se saiu da sala
    const roomInfo = io.sockets.adapter.rooms.get(room);
    console.log(`👋 Sala ainda existe? ${!!roomInfo}, Clientes restantes: ${roomInfo ? roomInfo.size : 0}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado do Socket.IO');
  });
});

// Funções auxiliares para Agente IA (escopo global)
async function generateAIResponse(userMessage, chatId, messageType = 'TEXTO', userId = null, mediaUrl = null, connection = null) {
  try {
    console.log('🤖 ===== GERANDO RESPOSTA IA =====');
    console.log('🤖 Mensagem do usuário:', userMessage);
    console.log('🤖 Chat ID:', chatId);
    console.log('🤖 Tipo de mensagem:', messageType);
    console.log('🤖 User ID:', userId);
    console.log('🤖 Media URL:', mediaUrl);
    
    if (!userMessage || userMessage.trim() === '') {
      console.log('🤖 Mensagem vazia, retornando resposta padrão');
      return 'Olá! Como posso ajudá-lo hoje?';
    }

    // Buscar informações do contato para personalizar a resposta
    let contactInfo = null;
    let contactName = null;
    
    if (connection && connection.sock) {
      try {
        const extractor = new ContactInfoExtractor(connection.sock);
        contactInfo = await extractor.extractFullContactInfo(chatId);
        
        if (contactInfo) {
          // Determinar o nome do contato
          if (contactInfo.isGroup) {
            contactName = contactInfo.whatsapp_group_subject || contactInfo.wpp_name || 'Grupo';
          } else {
            contactName = contactInfo.wpp_name || contactInfo.whatsapp_business_name || contactInfo.whatsapp_name || 'Cliente';
          }
          
          console.log('🤖 Nome do contato identificado:', contactName);
        }
      } catch (error) {
        console.log('🤖 Erro ao buscar informações do contato:', error.message);
      }
    }

// ✅ SISTEMA DE CHUNKING PARA RESPOSTAS DA IA
const chunkMessage = (message, maxChars = 150) => {
  if (message.length <= maxChars) {
    return [{ content: message, index: 0, totalChunks: 1, isLastChunk: true }];
  }
  
  const chunks = [];
  let currentIndex = 0;
  let chunkIndex = 0;
  
  while (currentIndex < message.length) {
    let chunkEnd = currentIndex + maxChars;
    
    if (chunkEnd < message.length) {
      // Procurar por pontuação de fim de frase
      const sentenceEnd = message.lastIndexOf('.', chunkEnd);
      const exclamationEnd = message.lastIndexOf('!', chunkEnd);
      const questionEnd = message.lastIndexOf('?', chunkEnd);
      const colonEnd = message.lastIndexOf(':', chunkEnd);
      const semicolonEnd = message.lastIndexOf(';', chunkEnd);
      
      // Procurar por vírgulas também (para pausas naturais)
      const commaEnd = message.lastIndexOf(',', chunkEnd);
      
      const bestEnd = Math.max(sentenceEnd, exclamationEnd, questionEnd, colonEnd, semicolonEnd);
      
      // Se encontrou uma pontuação de fim de frase, usar ela
      if (bestEnd > currentIndex && (bestEnd === sentenceEnd || bestEnd === exclamationEnd || bestEnd === questionEnd)) {
        chunkEnd = bestEnd + 1;
      } 
      // Se não encontrou pontuação de fim, tentar vírgula
      else if (commaEnd > currentIndex && commaEnd > currentIndex + maxChars * 0.5) {
        chunkEnd = commaEnd + 1;
      }
      // Se não encontrou vírgula adequada, quebrar em palavras
      else {
        const spaceEnd = message.lastIndexOf(' ', chunkEnd);
        if (spaceEnd > currentIndex + maxChars * 0.7) { // Evitar chunks muito pequenos
          chunkEnd = spaceEnd;
        }
        // Se não conseguir quebrar em palavras, usar o limite original
      }
    } else {
      chunkEnd = message.length;
    }
    
    const chunkContent = message.slice(currentIndex, chunkEnd).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        index: chunkIndex,
        totalChunks: 0, // Será atualizado depois
        isLastChunk: chunkEnd >= message.length
      });
      chunkIndex++;
    }
    
    currentIndex = chunkEnd;
  }
  
  // Atualizar totalChunks
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
  });
  
  return chunks;
};

// ✅ SISTEMA DE MEMÓRIA DO AI AGENT (50 mensagens)
console.log('🤖 ===== CARREGANDO MEMÓRIA DO AI AGENT =====');
let conversationHistory = [];
let conversationContext = {};
    
    try {
      // 1. Adicionar mensagem do usuário à memória
      await addMessageToAIMemory(chatId, {
        role: 'user',
        content: userMessage,
        metadata: {
          messageType,
          mediaUrl,
          timestamp: new Date().toISOString()
        }
      });
      
      // 2. Carregar histórico da memória (últimas 50 mensagens)
      const { data: memoryData, error: memoryError } = await supabaseAdmin
        .from('ai_agent_messages')
        .select('*')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!memoryError && memoryData) {
        // Converter para formato esperado e reverter ordem (mais antigas primeiro)
        conversationHistory = memoryData
          .reverse()
          .map(msg => ({
            conteudo: msg.content,
            remetente: msg.role === 'user' ? 'CLIENTE' : 'AI',
            timestamp: msg.created_at,
            message_type: msg.metadata?.messageType || 'TEXTO'
          }));
        
        console.log('🤖 Memória carregada:', conversationHistory.length, 'mensagens');
        
        // 3. Extrair contexto da conversa
        conversationContext = extractConversationContext(memoryData);
        console.log('🤖 Contexto extraído:', conversationContext);
      } else {
        console.log('🤖 Erro ao carregar memória:', memoryError?.message);
        console.log('🤖 Usando histórico padrão...');
        
        // Fallback para histórico padrão se a memória não existir
        const { data: historyData, error: historyError } = await supabaseAdmin
          .from('whatsapp_mensagens')
          .select('conteudo, remetente, timestamp, message_type')
          .eq('chat_id', chatId)
          .eq('owner_id', userId)
          .order('timestamp', { ascending: false })
          .limit(30);

        if (!historyError && historyData) {
          conversationHistory = historyData.reverse();
          console.log('🤖 Histórico padrão encontrado:', conversationHistory.length, 'mensagens');
        }
      }
    } catch (error) {
      console.log('🤖 Erro ao carregar memória:', error.message);
    }
    console.log('🤖 ===========================================');

    // Buscar configuração da IA para o usuário
    let aiConfig = null;
    if (userId) {
      try {
        console.log('🤖 Buscando configuração da IA para o usuário:', userId);
        console.log('🤖 Supabase URL:', process.env.SUPABASE_URL ? 'Configurada' : 'Não configurada');
        console.log('🤖 Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');
        
        // Buscar configuração ativa primeiro (usando supabaseAdmin para bypass de RLS)
        console.log('🤖 Buscando configuração com userId:', userId);
        let { data: configData, error: configError } = await supabaseAdmin
          .from('ai_agent_configs')
          .select('*')
          .eq('owner_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        console.log('🤖 Resultado da busca ativa:', { 
          data: configData?.length || 0, 
          error: configError?.message || 'null' 
        });

        // Se não encontrou configuração ativa, buscar qualquer configuração do usuário
        if (!configData || configData.length === 0) {
          console.log('🤖 Nenhuma configuração ativa encontrada, buscando qualquer configuração...');
          const { data: anyConfig, error: anyError } = await supabaseAdmin
            .from('ai_agent_configs')
            .select('*')
            .eq('owner_id', userId)
            .limit(1);
          
          if (!anyError && anyConfig && anyConfig.length > 0) {
            configData = anyConfig;
            configError = null;
            console.log('🤖 Configuração encontrada (não ativa), ativando...');
            
            // Parse knowledge_base se for string
            if (typeof configData[0].knowledge_base === 'string') {
              try {
                configData[0].knowledge_base = JSON.parse(configData[0].knowledge_base);
              } catch (e) {
                console.log('⚠️ Erro ao fazer parse do knowledge_base:', e.message);
                configData[0].knowledge_base = { files: [], websites: [], qa: [] };
              }
            }
            
            // Ativar a configuração encontrada
            await supabaseAdmin
              .from('ai_agent_configs')
              .update({ is_active: true })
              .eq('id', anyConfig[0].id);
          }
        }

        console.log('🤖 Resultado da busca - configData:', configData ? configData.length : 'null');
        console.log('🤖 Resultado da busca - configError:', configError ? configError.message : 'null');

        if (configError) {
          console.log('⚠️ Erro ao buscar configuração da IA:', configError.message);
          
          // Se não existe configuração, criar uma padrão
          if (configError.code === 'PGRST116') {
            console.log('🤖 Criando configuração padrão da IA...');
            const defaultConfig = {
              owner_id: userId,
              name: 'Assistente Virtual VB',
              function: 'Atendimento ao cliente via WhatsApp',
              personality: 'Profissional, prestativo e eficiente. Sempre ajude o cliente com informações sobre produtos e serviços.',
              status: 'active',
              response_style: 'friendly',
              language: 'pt-BR',
              max_response_length: 500,
              company_context: 'Empresa de tecnologia e soluções digitais',
              company_description: 'Oferecemos serviços de desenvolvimento de software, consultoria em tecnologia e soluções digitais personalizadas.',
              api_key: null,
              selected_model: 'gpt-4o-mini',
              is_connected: false,
              is_active: true,
              knowledge_base: {
                files: [],
                websites: [],
                qa: [
                  {
                    question: 'Quais serviços vocês oferecem?',
                    answer: 'Oferecemos desenvolvimento de software, consultoria em tecnologia, criação de sites e aplicativos, e soluções digitais personalizadas.'
                  },
                  {
                    question: 'Como posso entrar em contato?',
                    answer: 'Você pode entrar em contato através do nosso WhatsApp, email ou telefone. Nossa equipe está disponível de segunda a sexta, das 8h às 18h.'
                  },
                  {
                    question: 'Qual o prazo para desenvolvimento?',
                    answer: 'O prazo varia conforme a complexidade do projeto. Projetos simples podem ser entregues em 2-4 semanas, enquanto projetos mais complexos podem levar 2-6 meses.'
                  }
                ]
              }
            };
            
            const { data: newConfig, error: insertError } = await supabaseAdmin
              .from('ai_agent_configs')
              .insert(defaultConfig)
              .select()
              .single();
            
            if (insertError) {
              console.log('⚠️ Erro ao criar configuração padrão:', insertError.message);
            } else {
              aiConfig = newConfig;
              console.log('✅ Configuração padrão criada com sucesso!');
            }
          }
        } else if (configData && configData.length > 0) {
          aiConfig = configData[0]; // Pegar o primeiro elemento do array
          
          // Parse knowledge_base se for string
          if (typeof aiConfig.knowledge_base === 'string') {
            try {
              aiConfig.knowledge_base = JSON.parse(aiConfig.knowledge_base);
            } catch (e) {
              console.log('⚠️ Erro ao fazer parse do knowledge_base:', e.message);
              aiConfig.knowledge_base = { files: [], websites: [], qa: [] };
            }
          }
          
          console.log('✅ Configuração da IA encontrada:', {
            name: aiConfig.name,
            model: aiConfig.selected_model || aiConfig.model,
            personality: aiConfig.personality,
            api_key: aiConfig.api_key ? 'Configurada' : 'Não configurada',
            knowledge_base: aiConfig.knowledge_base?.qa?.length || 0,
            is_active: aiConfig.is_active,
            status: aiConfig.status
          });
          console.log('🤖 Configuração completa:', JSON.stringify(aiConfig, null, 2));
        } else {
          console.log('⚠️ Nenhuma configuração ativa encontrada para o usuário');
          console.log('🤖 Buscando configurações inativas...');
          
          // Buscar configurações inativas para debug
          const { data: inactiveConfigs } = await supabaseAdmin
            .from('ai_agent_configs')
            .select('*')
            .eq('owner_id', userId);
          
          console.log('🤖 Configurações encontradas (ativas e inativas):', inactiveConfigs?.length || 0);
          if (inactiveConfigs && inactiveConfigs.length > 0) {
            inactiveConfigs.forEach((config, index) => {
              console.log(`🤖 Config ${index + 1}:`, {
                name: config.name,
                is_active: config.is_active,
                status: config.status,
                api_key: config.api_key ? 'Configurada' : 'Não configurada'
              });
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar configuração da IA:', error.message);
      }
    }

    // Analisar conteúdo de mídia se disponível
    let mediaContent = null;
    if (mediaUrl && (messageType === 'IMAGEM' || messageType === 'AUDIO')) {
      console.log('🤖 ===== ANÁLISE DE MÍDIA =====');
      console.log('🤖 Tipo de mensagem:', messageType);
      console.log('🤖 URL da mídia:', mediaUrl);
      console.log('🤖 Tem configuração AI:', !!aiConfig);
      console.log('🤖 Tem API key:', !!aiConfig?.api_key);
      
      try {
        mediaContent = await analyzeMediaContent(messageType, mediaUrl, aiConfig);
        console.log('🤖 Conteúdo da mídia analisado:', mediaContent);
      } catch (mediaError) {
        console.error('❌ Erro na análise de mídia:', mediaError);
        mediaContent = null;
      }
      console.log('🤖 ===========================');
    }

    // Se não tem configuração válida ou API key, usar resposta simples
    if (!aiConfig || !aiConfig.api_key || aiConfig.api_key === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      console.log('🤖 Usando sistema de respostas simples (sem OpenAI)');
      return generateSimpleResponse(userMessage, messageType, aiConfig);
    }

    // Usar OpenAI para gerar resposta contextual
    console.log('🤖 Gerando resposta com OpenAI...');
    const aiResponse = await generateOpenAIResponse(userMessage, messageType, aiConfig, mediaContent, conversationHistory);
    
    // ✅ CHUNKING: Dividir resposta em chunks menores
    if (aiResponse && aiResponse.trim() !== '') {
      console.log('🤖 Aplicando chunking à resposta da IA...');
      console.log('🤖 Tamanho da resposta:', aiResponse.length, 'caracteres');
      const chunks = chunkMessage(aiResponse, 150); // 150 caracteres por chunk
      console.log('🤖 Chunks gerados:', chunks.length);
      
      if (chunks.length > 1) {
        console.log(`🤖 Resposta dividida em ${chunks.length} chunks`);
        
        // Enviar chunks com delay de 2 segundos entre eles
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`🤖 Enviando chunk ${i + 1}/${chunks.length}:`, chunk.content.substring(0, 50) + '...');
          
          // Enviar chunk via WhatsApp
          const sent = await connection.sock.sendMessage(chatId, {
            text: chunk.content
          });
          console.log(`✅ [CHUNK] Chunk ${i + 1}/${chunks.length} enviado:`, sent?.key?.id);
          
          // Salvar chunk na memória
          await addMessageToAIMemory(chatId, {
            role: 'assistant',
            content: chunk.content,
            metadata: {
              messageType: 'TEXTO',
              timestamp: new Date().toISOString(),
              context: conversationContext,
              chunkIndex: chunk.index,
              totalChunks: chunk.totalChunks,
              isLastChunk: chunk.isLastChunk
            }
          });
          
          // Delay entre chunks (exceto no último)
          if (i < chunks.length - 1) {
            console.log('🤖 Aguardando 5 segundos antes do próximo chunk...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
        
        console.log('🤖 Todos os chunks enviados com sucesso!');
        return 'CHUNKS_SENT'; // Indicar que os chunks foram enviados
      } else {
        // Resposta pequena, enviar normalmente
        console.log('🤖 Resposta pequena, enviando sem chunking');
        const sent = await connection.sock.sendMessage(chatId, {
          text: aiResponse
        });
        console.log('✅ [AI-RESPONSE] Resposta enviada:', sent?.key?.id);
        
        await addMessageToAIMemory(chatId, {
          role: 'assistant',
          content: aiResponse,
          metadata: {
            messageType: 'TEXTO',
            timestamp: new Date().toISOString(),
            context: conversationContext
          }
        });
        
        return aiResponse;
      }
    }
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ Erro ao gerar resposta IA:', error);
    return generateSimpleResponse(userMessage, messageType, null);
  }
}

// ✅ FUNÇÕES AUXILIARES PARA SISTEMA DE MEMÓRIA DO AI AGENT

/**
 * Adiciona uma mensagem à memória do AI Agent
 */
async function addMessageToAIMemory(conversationId, message) {
  try {
    console.log('🤖 [MEMORY] Adicionando mensagem à memória:', conversationId);
    
    const { error } = await supabaseAdmin
      .from('ai_agent_messages')
      .insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {}
      });

    if (error) {
      console.error('❌ [MEMORY] Erro ao salvar mensagem na memória:', error);
    } else {
      console.log('✅ [MEMORY] Mensagem salva na memória com sucesso');
    }
  } catch (error) {
    console.error('❌ [MEMORY] Erro ao adicionar mensagem à memória:', error);
  }
}

/**
 * Extrai contexto da conversa para o AI Agent
 */
function extractConversationContext(messages) {
  try {
    const context = {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content || '',
      conversationHistory: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }))
    };
    
    // Detectar padrões na conversa
    messages.forEach(message => {
      if (message.role === 'user') {
        // Detectar sentimentos
        if (message.content.toLowerCase().includes('obrigado') || 
            message.content.toLowerCase().includes('obrigada')) {
          context.sentiment = 'positive';
        } else if (message.content.toLowerCase().includes('problema') || 
                   message.content.toLowerCase().includes('erro')) {
          context.sentiment = 'negative';
        }
        
        // Detectar intenções
        if (message.content.toLowerCase().includes('preço') || 
            message.content.toLowerCase().includes('valor')) {
          context.intent = 'pricing';
        } else if (message.content.toLowerCase().includes('suporte') || 
                   message.content.toLowerCase().includes('ajuda')) {
          context.intent = 'support';
        }
      }
    });
    
    return context;
  } catch (error) {
    console.error('❌ [MEMORY] Erro ao extrair contexto:', error);
    return {};
  }
}

// Função para gerar resposta simples (fallback)
function generateSimpleResponse(userMessage, messageType, aiConfig = null) {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  console.log('🤖 ===== GERANDO RESPOSTA SIMPLES =====');
  console.log('🤖 Mensagem original:', userMessage);
  console.log('🤖 Mensagem lowercase:', lowerMessage);
  console.log('🤖 Tipo de mensagem:', messageType);
  console.log('🤖 Tem configuração AI:', !!aiConfig);
  console.log('🤖 =====================================');
  
  // Respostas específicas para diferentes tipos de mensagem
  if (messageType === 'AUDIO') {
    return 'Recebi sua mensagem de áudio! Infelizmente não posso ouvir o conteúdo, mas posso ajudá-lo com informações sobre nossos produtos e serviços. O que gostaria de saber?';
  }
  
  if (messageType === 'IMAGEM') {
    return 'Recebi sua imagem! Infelizmente não posso ver o conteúdo, mas posso ajudá-lo com informações sobre nossos produtos e serviços. O que gostaria de saber?';
  }
  
  if (messageType === 'VIDEO') {
    return 'Recebi seu vídeo! Infelizmente não posso ver o conteúdo, mas posso ajudá-lo com informações sobre nossos produtos e serviços. O que gostaria de saber?';
  }

  // Usar base de conhecimento se disponível
  if (aiConfig && aiConfig.knowledge_base && aiConfig.knowledge_base.qa) {
    console.log('🤖 Base de conhecimento disponível:', aiConfig.knowledge_base.qa.length, 'perguntas');
    
    for (const qa of aiConfig.knowledge_base.qa) {
      console.log('🤖 Verificando pergunta:', qa.question);
      
      // Busca mais flexível - verificar se a mensagem contém palavras-chave da pergunta
      const questionLower = qa.question.toLowerCase();
      const messageLower = lowerMessage.toLowerCase();
      
      // Verificar correspondência direta (mais restritiva)
      if (messageLower === questionLower || 
          messageLower.includes(questionLower) && questionLower.length > 10 ||
          questionLower.includes(messageLower) && messageLower.length > 10) {
        console.log('🤖 ✅ Correspondência direta encontrada:', qa.question);
        return qa.answer;
      }
      
      // Verificar palavras-chave específicas (mais restritivas)
      const specificKeywords = {
        'empresa': ['empresa', 'companhia', 'corporação'],
        'serviço': ['serviço', 'como funciona', 'funciona'],
        'valor': ['valor', 'preço', 'custo', 'quanto'],
        'onde': ['onde', 'localização', 'endereço', 'ficam'],
        'contato': ['contato', 'telefone', 'email', 'falar']
      };
      
      // Verificar se a mensagem e pergunta compartilham contexto específico
      for (const [context, keywords] of Object.entries(specificKeywords)) {
        const messageHasContext = keywords.some(keyword => messageLower.includes(keyword));
        const questionHasContext = keywords.some(keyword => questionLower.includes(keyword));
        
        if (messageHasContext && questionHasContext) {
          console.log('🤖 ✅ Correspondência por contexto específico encontrada:', qa.question, 'Contexto:', context);
          return qa.answer;
        }
      }
      
      // Verificar palavras em comum (mais restritivo)
      const questionWords = questionLower.split(' ').filter(word => word.length > 3);
      const messageWords = messageLower.split(' ').filter(word => word.length > 3);
      
      const commonWords = questionWords.filter(word => 
        messageWords.some(msgWord => 
          msgWord === word || // Correspondência exata
          (msgWord.includes(word) && word.length > 4) || // Inclusão apenas para palavras longas
          (word.includes(msgWord) && msgWord.length > 4)
        )
      );
      
      // Aumentar o threshold para correspondência
      if (commonWords.length >= 2 && questionWords.length <= 6) {
        console.log('🤖 ✅ Correspondência por palavras comuns encontrada:', qa.question, 'Palavras:', commonWords);
        return qa.answer;
      }
    }
  }

  // Respostas baseadas em palavras-chave mais específicas
        const responses = {
    'quem ta falando': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'quem ta falando?': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'quem é': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'fechou': 'Entendi! Se precisar de mais alguma coisa, estou aqui para ajudar.',
    'fechow': 'Entendi! Se precisar de mais alguma coisa, estou aqui para ajudar.',
    'maninho': 'Olá! Como posso ajudá-lo hoje?',
    'irmão': 'Olá! Como posso ajudá-lo hoje?',
    'com quem falo': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'quem está falando': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'quem é você': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'como se chama': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'qual seu nome': 'Olá! Sou o assistente virtual da empresa. Estou aqui para ajudar com informações sobre nossos produtos e serviços. Como posso atendê-lo?',
    'qual empresa': 'Somos uma empresa de tecnologia e soluções digitais. Oferecemos desenvolvimento de software, consultoria em tecnologia e soluções personalizadas.',
    'serviços': 'Oferecemos desenvolvimento de software, consultoria em tecnologia, criação de sites e aplicativos, e soluções digitais personalizadas. Qual serviço te interessa?',
          'oi': 'Olá! Como posso ajudá-lo hoje?',
          'olá': 'Olá! Como posso ajudá-lo hoje?',
          'oi!': 'Olá! Como posso ajudá-lo hoje?',
          'olá!': 'Olá! Como posso ajudá-lo hoje?',
          'oiii': 'Olá! Como posso ajudá-lo hoje?',
          'oiiii': 'Olá! Como posso ajudá-lo hoje?',
          'oiiiii': 'Olá! Como posso ajudá-lo hoje?',
          'ooopa': 'Olá! Como posso ajudá-lo hoje?',
          'tudo bem': 'Tudo bem sim! Como posso ajudá-lo hoje?',
          'tudo bem?': 'Tudo bem sim! Como posso ajudá-lo hoje?',
    'ajuda': 'Claro! Estou aqui para ajudar. Posso fornecer informações sobre nossos produtos, serviços, preços e muito mais. O que você precisa?',
    'preço': 'Gostaria de saber mais sobre nossos preços. Posso fornecer informações gerais sobre nossos produtos e serviços. Qual produto ou serviço te interessa?',
    'produto': 'Temos vários produtos disponíveis. Posso fornecer informações sobre nossos produtos e serviços. Qual área te interessa mais?',
    'serviço': 'Temos vários serviços disponíveis. Posso fornecer informações sobre nossos produtos e serviços. Qual serviço te interessa mais?',
    'contato': 'Posso te ajudar a entrar em contato com nossa equipe. Para informações mais específicas, posso conectar você com um de nossos especialistas. Qual é o assunto?',
          'hello': 'Hello! How can I help you today?',
          'hi': 'Hi! How can I help you today?',
    'help': 'I\'m here to help! I can provide information about our products, services, pricing and more. What do you need?'
        };
        
  // Buscar por palavras-chave mais específicas primeiro
        for (const [keyword, resp] of Object.entries(responses)) {
          if (lowerMessage.includes(keyword)) {
      return resp;
    }
  }
  
  // Resposta padrão mais informativa
  return 'Olá! Sou o assistente virtual. Posso ajudá-lo com informações sobre nossos produtos e serviços. O que gostaria de saber?';
}

// Função para analisar conteúdo de mídia
async function analyzeMediaContent(messageType, mediaUrl, aiConfig) {
  if (!aiConfig || !aiConfig.api_key) {
    console.log('🤖 Não há configuração de IA para análise de mídia');
    return null;
  }

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: aiConfig.api_key
    });

    // Construir URL completa para mídia
    let fullMediaUrl = mediaUrl;
    if (mediaUrl.startsWith('media:')) {
      const hash = mediaUrl.replace('media:', '');
      fullMediaUrl = `http://localhost:3001/api/media/${hash}`;
      console.log('🤖 Convertendo media:hash para URL:', { hash, fullUrl: fullMediaUrl });
    } else if (mediaUrl.startsWith('data:')) {
      // URL já é base64, usar diretamente
      fullMediaUrl = mediaUrl;
      console.log('🤖 Usando URL base64 diretamente');
    }

    console.log('🤖 Analisando mídia:', { messageType, originalUrl: mediaUrl, fullUrl: fullMediaUrl });

    if (messageType === 'IMAGEM' && fullMediaUrl) {
      console.log('🤖 Analisando imagem com OpenAI Vision...');
      
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Descreva esta imagem em detalhes. O que você vê? Identifique objetos, pessoas, texto, cores e contexto geral.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: fullMediaUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        const description = response.choices[0]?.message?.content;
        console.log('🤖 Descrição da imagem gerada:', description);
        return description;
      } catch (visionError) {
        console.error('❌ Erro na análise de imagem:', visionError.message);
        return 'Imagem recebida, mas não foi possível analisar o conteúdo.';
      }
    }

    if (messageType === 'AUDIO' && fullMediaUrl) {
      console.log('🤖 Analisando áudio com Whisper...');
      
      try {
        const audioResponse = await fetch(fullMediaUrl);
        if (audioResponse.ok) {
          const audioBuffer = await audioResponse.arrayBuffer();
          const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });
          
          const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1'
          });

          const transcript = transcription.text;
          console.log('🤖 Transcrição do áudio:', transcript);
          return transcript;
        } else {
          console.error('❌ Erro ao baixar áudio:', audioResponse.status);
          return 'Áudio recebido, mas não foi possível processar o conteúdo.';
        }
      } catch (audioError) {
        console.error('❌ Erro na transcrição de áudio:', audioError.message);
        return 'Áudio recebido, mas não foi possível transcrever o conteúdo.';
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Erro geral ao analisar mídia:', error.message);
    return null;
  }
}

// Função para gerar resposta com OpenAI
async function generateOpenAIResponse(userMessage, messageType, aiConfig, mediaContent = null, conversationHistory = []) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: aiConfig.api_key
    });

    // Construir prompt baseado na configuração (igual à página de teste)
    let systemPrompt = 'Você é ' + (aiConfig.name || 'Assistente Virtual VB') + ', um assistente virtual especializado em ' + (aiConfig.function || 'atendimento ao cliente') + '.\n\n' +
      'PERSONALIDADE E COMPORTAMENTO:\n' +
      (aiConfig.personality || 'Profissional, prestativo e eficiente') + '\n\n'

      'CONFIGURAÇÕES DE RESPOSTA:\n' +
      '- Estilo: ' + (aiConfig.response_style || 'friendly') + '\n' +
      '- Idioma: ' + (aiConfig.language === 'pt-BR' ? 'Português brasileiro' : aiConfig.language || 'Português brasileiro') + '\n' +
      '- Tamanho máximo: ' + (aiConfig.max_response_length || 500) + ' caracteres\n\n'

      'FUNÇÃO PRINCIPAL:\n' +
      (aiConfig.function || 'Atendimento ao cliente via WhatsApp') + '\n\n' +
      'STATUS DO AGENTE:\n' +
      '- Status: ' + (aiConfig.is_active ? 'Ativo e operacional' : 'Inativo') + '\n\n' +
      'CONFIGURAÇÕES AVANÇADAS:\n' +
      (aiConfig.tone ? '- Tom específico: ' + aiConfig.tone + '\n' : '') +
      (aiConfig.rules ? '- Regras específicas: ' + aiConfig.rules + '\n' : '') +
      (aiConfig.company_context ? '- Contexto da empresa: ' + aiConfig.company_context + '\n' : '') +
      (aiConfig.sector ? '- Setor de atuação: ' + aiConfig.sector + '\n' : '') +
      (aiConfig.company_description ? '- Descrição da empresa: ' + aiConfig.company_description + '\n' : '') +

      'BASE DE CONHECIMENTO:\n' +
      (aiConfig.knowledge_base && aiConfig.knowledge_base.files && aiConfig.knowledge_base.files.length > 0 ? 
        'ARQUIVOS PROCESSADOS:\n' + 
        aiConfig.knowledge_base.files.map(file => '- ' + file.name + ' (' + file.type + '): ' + file.content).join('\n') + '\n\n' : '') +
      (aiConfig.knowledge_base && aiConfig.knowledge_base.websites && aiConfig.knowledge_base.websites.length > 0 ? 
        'WEBSITES ANALISADOS:\n' + 
        aiConfig.knowledge_base.websites.map(website => '- ' + website.title + ' (' + website.url + '): ' + website.content).join('\n') + '\n\n' : '') +
      (aiConfig.knowledge_base && aiConfig.knowledge_base.qa && aiConfig.knowledge_base.qa.length > 0 ? 
        'PERGUNTAS E RESPOSTAS:\n' + 
        aiConfig.knowledge_base.qa.map(qa => 'P: ' + qa.question + '\nR: ' + qa.answer).join('\n\n') + '\n\n' : '');

    // Adicionar contexto sobre tipo de mensagem com instruções mais específicas
    if (messageType === 'AUDIO') {
      if (mediaContent) {
        systemPrompt += '\n\nO usuário enviou uma mensagem de áudio que foi transcrita como: "' + mediaContent + '". Responda baseado no conteúdo transcrito.';
      } else {
        systemPrompt += '\n\nO usuário enviou uma mensagem de áudio. Como você não pode ouvir o áudio, responda de forma útil perguntando sobre o que eles gostariam de saber ou oferecendo ajuda geral.';
      }
    } else if (messageType === 'IMAGEM') {
      if (mediaContent) {
        systemPrompt += '\n\nO usuário enviou uma imagem que foi descrita como: "' + mediaContent + '". Responda baseado na descrição da imagem.';
      } else {
        systemPrompt += '\n\nO usuário enviou uma imagem. Como você não pode ver a imagem, responda de forma útil perguntando sobre o que eles gostariam de saber sobre a imagem ou oferecendo ajuda geral.';
      }
    } else if (messageType === 'VIDEO') {
      systemPrompt += '\n\nO usuário enviou um vídeo. Como você não pode ver o vídeo, responda de forma útil perguntando sobre o que eles gostariam de saber sobre o vídeo ou oferecendo ajuda geral.';
    }

    // Adicionar regras específicas se disponíveis
    if (aiConfig.rules) {
      systemPrompt += '\n\nRegras importantes: ' + aiConfig.rules;
    }

    // Adicionar histórico de conversa se disponível
    if (conversationHistory && conversationHistory.length > 0) {
      systemPrompt += '\n\n=== HISTÓRICO DA CONVERSA ===';
      systemPrompt += '\nUse este histórico para entender o contexto da conversa:';
      conversationHistory.forEach((msg, index) => {
        const sender = msg.remetente === 'AI' ? 'Assistente' : 'Cliente';
        systemPrompt += '\n' + sender + ': ' + msg.conteudo;
      });
      systemPrompt += '\n=== FIM DO HISTÓRICO ===';
    }

    // Adicionar informações do contato se disponível
    if (contactName && contactName !== 'Cliente' && contactName !== 'Grupo') {
      systemPrompt += '\n\n=== INFORMAÇÕES DO CONTATO ===';
      systemPrompt += '\nNome do contato: ' + contactName;
      systemPrompt += '\nUse o nome do contato de forma natural nas suas respostas, mas não sempre. Varie entre usar o nome e não usar.';
      systemPrompt += '\nExemplos: "Olá ' + contactName + '!", "Como posso ajudar você hoje?", "Perfeito, ' + contactName + '!", "Entendi perfeitamente!", etc.';
      systemPrompt += '\n=== FIM DAS INFORMAÇÕES ===';
    }

    // Instruções finais (igual à página de teste)
    systemPrompt += '\n\nINSTRUÇÕES IMPORTANTES:';
    systemPrompt += '\n- Sempre responda em ' + (aiConfig.language === 'pt-BR' ? 'português brasileiro' : 'o idioma selecionado');
    systemPrompt += '\n- Mantenha o estilo ' + (aiConfig.response_style || 'friendly');
    systemPrompt += '\n- Seja ' + (aiConfig.personality || 'Profissional, prestativo e eficiente');
    systemPrompt += '\n- Foque em ' + (aiConfig.function || 'Atendimento ao cliente via WhatsApp');
    systemPrompt += '\n- Use a base de conhecimento acima para responder com precisão';
    systemPrompt += '\n- Respostas devem ter no máximo ' + (aiConfig.max_response_length || 500) + ' caracteres';
    systemPrompt += '\n- ' + (aiConfig.is_active ? 'Você está ativo e pronto para ajudar' : 'Você está em modo limitado');
    systemPrompt += '\n\nResponda de forma útil, profissional e alinhada com todas essas configurações e base de conhecimento.';

    console.log('🤖 ===== PROMPT DO SISTEMA =====');
    console.log('🤖', systemPrompt);
    console.log('🤖 ===== MENSAGEM DO USUÁRIO =====');
    console.log('🤖', userMessage);
    if (mediaContent) {
      console.log('🤖 ===== CONTEÚDO DA MÍDIA =====');
      console.log('🤖', mediaContent);
    }
    console.log('🤖 ================================');

    // Construir mensagens igual à página de teste
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.remetente === 'AI' ? 'assistant' : 'user',
        content: msg.conteudo
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    const completion = await openai.chat.completions.create({
      model: aiConfig.selected_model || aiConfig.model || 'gpt-4o-mini',
      messages: messages,
      max_tokens: Math.min(aiConfig.max_response_length || 500, 2000),
      temperature: parseFloat(aiConfig.temperature) || 0.7
    });

    const response = completion.choices[0]?.message?.content || 'Olá! Como posso ajudá-lo hoje?';
    console.log('🤖 Resposta da OpenAI:', response);
    
        return response;
    
      } catch (error) {
    console.error('❌ Erro na API da OpenAI:', error.message);
    console.log('🤖 Voltando para resposta simples...');
    return generateSimpleResponse(userMessage, messageType, aiConfig);
      }
    }

    async function sendAIResponse(connectionId, chatId, response, userId) {
      try {
        console.log('🤖 ===== ENVIANDO RESPOSTA IA =====');
        console.log('🤖 Connection ID:', connectionId);
        console.log('🤖 Chat ID:', chatId);
        console.log('🤖 Resposta:', response);
        console.log('🤖 User ID:', userId);
        
        // Verificações de segurança
        if (!response || response.trim() === '') {
          console.log('🤖 Resposta vazia, não enviando');
          return;
        }
        
        if (!connectionId || !chatId || !userId) {
          console.log('🤖 ⚠️ Parâmetros obrigatórios ausentes, não enviando');
          return;
        }
        
        // Verificar se a conexão existe
        const connection = activeConnections.get(connectionId);
        if (!connection) {
          console.log('🤖 ⚠️ Conexão não encontrada, não enviando');
          return;
        }
        
        // Verificar se a conexão está ativa
        if (!connection.sock || !connection.isConnected) {
          console.log('❌ Conexão não está ativa para enviar mensagem');
      return;
    }
    
    console.log('🤖 Enviando mensagem via WhatsApp API...');
    console.log('🤖 Chat ID para envio:', chatId);
    console.log('🤖 Resposta a enviar:', response);
    
    // Enviar mensagem via WhatsApp usando Baileys
    // Marcar temporariamente que esta é uma mensagem da IA
    connection.sock.isAIMessage = true;
    connection.sock.aiMessageContent = response;
    connection.sock.aiMessageChatId = chatId;
    
    const result = await connection.sock.sendMessage(chatId, {
      text: response
    });
    
    // Limpar a marcação temporária
    connection.sock.isAIMessage = false;
    connection.sock.aiMessageContent = null;
    connection.sock.aiMessageChatId = null;
    
    console.log('🤖 ✅ Mensagem enviada via WhatsApp API com sucesso!');
    console.log('🤖 Resultado do envio:', result);
    console.log('🤖 WhatsApp Message ID:', result.key?.id);
    
    // Criar mensagem de resposta da IA para salvar no banco
        const aiMessage = {
      message_id: result.key.id || `ai_${Date.now()}`,
          chat_id: chatId,
          conteudo: response,
          message_type: 'TEXTO',
          remetente: 'AI',
          timestamp: new Date().toISOString(),
      lida: true, // Mensagens da IA são consideradas lidas
          connection_id: connectionId,
          owner_id: userId,
          atendimento_id: `ai_${Date.now()}`,
      status: 'AI',
      message_id: result.key.id
        };
        
        console.log('🤖 Mensagem IA criada:', aiMessage);
        
    // Salvar no banco e obter o ID gerado
    const { data: savedMessage, error: insertError } = await supabase
          .from('whatsapp_mensagens')
      .insert(aiMessage)
      .select()
      .single();
        
        if (insertError) {
          console.error('❌ Erro ao salvar resposta IA:', insertError);
      // Mesmo com erro no banco, a mensagem já foi enviada via WhatsApp
    } else {
      console.log('🤖 Resposta IA salva no banco com sucesso!', savedMessage);
        }
        
        // Emitir para o frontend
        const roomName = `${connectionId}-${chatId}`;
        console.log('🤖 Emitindo para sala:', roomName);
        
        // Verificar se a sala existe
        const room = io.sockets.adapter.rooms.get(roomName);
        console.log('🤖 Clientes na sala:', room ? room.size : 0);
        
        // Criar objeto de mensagem para emitir
    const messageToEmit = savedMessage || aiMessage;
        
        console.log('🤖 Mensagem a ser emitida:', messageToEmit);
        
        io.to(roomName).emit('newMessage', messageToEmit);
        
        console.log('🤖 Resposta IA enviada para o frontend!');
        
        // Também emitir para a sala de conexão para atualizar a lista
        const preview = messageToEmit.conteudo || '[Mensagem]';
        const conversationUpdate = {
          connectionId,
          conversationId: chatId,
          lastMessageAt: messageToEmit.timestamp,
          last_message: messageToEmit,
          preview,
          from: 'AI',
          unread_count_delta: 0,
          // Adicionar nome_cliente para o frontend
          nome_cliente: messageToEmit.wpp_name || `Contato ${messageToEmit.phone}`,
          numero_cliente: messageToEmit.phone
        };
        
        console.log('🤖 Conversation update:', conversationUpdate);
        
        // Verificar se há clientes na sala antes de emitir
        const aiRoomClients = io.sockets.adapter.rooms.get(connectionId);
        console.log('🤖 Clientes na sala de conexão:', aiRoomClients ? aiRoomClients.size : 0);
        console.log('🤖 IDs dos clientes na sala:', aiRoomClients ? Array.from(aiRoomClients) : []);
        
        io.to(connectionId).emit('conversation:updated', conversationUpdate);
        
        console.log('🤖 Conversation updated emitido!');
        
      } catch (error) {
        console.error('❌ Erro ao enviar resposta IA:', error);
  }
}

// Função para processar mídias e gerar URLs válidas com Base64
async function processMediaMessage(msg, connectionId) {
  try {
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      console.log('⚠️ Conexão não encontrada para processar mídia');
      return null;
    }

    // Extrair informações da mídia
    let mediaInfo = null;
    if (msg.message?.imageMessage) {
      const img = msg.message.imageMessage;
      mediaInfo = {
        type: 'image',
        mimetype: img.mimetype || 'image/jpeg',
        url: img.url || null,
        mediaKey: img.mediaKey || null,
        fileLength: img.fileLength || null,
        fileSha256: img.fileSha256 || null,
        directPath: img.directPath || null
      };
    } else if (msg.message?.videoMessage) {
      const vid = msg.message.videoMessage;
      mediaInfo = {
        type: 'video',
        mimetype: vid.mimetype || 'video/mp4',
        url: vid.url || null,
        mediaKey: vid.mediaKey || null,
        fileLength: vid.fileLength || null,
        fileSha256: vid.fileSha256 || null,
        directPath: vid.directPath || null,
        seconds: vid.seconds || 0
      };
    } else if (msg.message?.audioMessage) {
      const aud = msg.message.audioMessage;
      mediaInfo = {
        type: 'audio',
        mimetype: aud.mimetype || 'audio/ogg',
        url: aud.url || null,
        mediaKey: aud.mediaKey || null,
        fileLength: aud.fileLength || null,
        fileSha256: aud.fileSha256 || null,
        directPath: aud.directPath || null,
        seconds: aud.seconds || 0,
        ptt: aud.ptt || false
      };
    } else if (msg.message?.documentMessage) {
      const doc = msg.message.documentMessage;
      mediaInfo = {
        type: 'document',
        mimetype: doc.mimetype || 'application/octet-stream',
        url: doc.url || null,
        mediaKey: doc.mediaKey || null,
        fileLength: doc.fileLength || null,
        fileSha256: doc.fileSha256 || null,
        directPath: doc.directPath || null,
        fileName: doc.fileName || 'documento'
      };
    }

    if (!mediaInfo) {
      return null;
    }

    console.log('📎 Processando mídia:', mediaInfo);

    // Tentar baixar a mídia se não tiver URL
    if (!mediaInfo.url && mediaInfo.mediaKey) {
      try {
        console.log('📎 Tentando baixar mídia via Baileys...');
        
        // Usar o downloadMediaMessage importado globalmente
        const buffer = await downloadMediaMessage(msg, 'buffer', {}, { 
          logger: console 
        });
        
        if (buffer && buffer.length > 0) {
          // Converter para base64 para armazenamento
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${mediaInfo.mimetype};base64,${base64}`;
          
          // Se a URL for muito longa (>10000 chars), usar apenas o hash como referência
          if (dataUrl.length > 10000) {
            const hash = require('crypto')
              .createHash('md5')
              .update(base64)
              .digest('hex');
            mediaInfo.url = `media:${hash}`;
            mediaInfo.hash = hash;
            mediaInfo.mediaData = buffer; // Armazenar dados binários
            mediaInfo.mediaData = buffer; // Armazenar dados binários
            console.log('📎 Mídia muito grande, usando hash como referência:', {
              size: buffer.length,
              type: mediaInfo.type,
              hash: hash
            });
          } else {
            mediaInfo.url = dataUrl;
            console.log('✅ Mídia baixada e convertida para base64:', {
              size: buffer.length,
              type: mediaInfo.type,
              mime: mediaInfo.mimetype
            });
          }
        } else {
          console.log('⚠️ Buffer de mídia vazio');
        }
      } catch (downloadError) {
        console.error('❌ Erro ao baixar mídia:', downloadError);
        // Tentar usar a URL direta se disponível
        if (mediaInfo.directPath) {
          mediaInfo.url = `https://mmg.whatsapp.net${mediaInfo.directPath}`;
          console.log('🔄 Usando URL direta como fallback');
        }
      }
    } else if (mediaInfo.url && mediaInfo.url.includes('mmg.whatsapp.net')) {
      // Se já tem URL do WhatsApp, tentar baixar e converter para base64
      try {
        console.log('📎 Convertendo URL do WhatsApp para base64...');
        const response = await fetch(mediaInfo.url);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${mediaInfo.mimetype};base64,${base64}`;
          
          // Se a URL for muito longa (>10000 chars), usar apenas o hash como referência
          if (dataUrl.length > 10000) {
            const hash = require('crypto')
              .createHash('md5')
              .update(base64)
              .digest('hex');
            mediaInfo.url = `media:${hash}`;
            mediaInfo.hash = hash;
            mediaInfo.mediaData = buffer; // Armazenar dados binários
            console.log('📎 Mídia muito grande, usando hash como referência:', {
              size: buffer.length,
              type: mediaInfo.type,
              hash: hash
            });
          } else {
            mediaInfo.url = dataUrl;
            console.log('✅ URL convertida para base64:', {
              size: buffer.length,
              type: mediaInfo.type
            });
          }
        }
      } catch (fetchError) {
        console.error('❌ Erro ao converter URL para base64:', fetchError);
        // Manter a URL original
      }
    }

    return mediaInfo;
  } catch (error) {
    console.error('❌ Erro ao processar mídia:', error);
    return null;
  }
}

// Função para inicializar servidor
async function initializeServer() {
  try {
    // Usar porta fixa para evitar conflitos
    console.log(`🔍 Usando porta: ${PORT}`);
    
    // Carregar sessões existentes do Supabase
    const existingSessions = await loadExistingSessions();
    
    // Reconectar sessões que estavam conectadas
    for (const session of existingSessions) {
      if (session.status === 'connected') {
        console.log(`🔄 Reconectando sessão: ${session.connection_id} para owner_id: ${session.owner_id}`);
        try {
          await createWhatsAppConnection(session.connection_id, session.owner_id);
        } catch (error) {
          console.error(`❌ Erro ao reconectar ${session.connection_id}:`, error);
          // Remover sessão que não conseguiu reconectar
          await removeSessionFromSupabase(session.connection_id);
        }
      }
    }
    
     // Iniciar servidor

    // Endpoint para extrair informações completas de um contato
    app.post('/api/contact/extract-info', async (req, res) => {
      try {
        const { chatId, connectionId } = req.body;
        
        if (!chatId || !connectionId) {
          return res.status(400).json({
            success: false,
            message: 'chatId e connectionId são obrigatórios'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔍 [API] Extraindo informações completas para:', chatId);
        
        const extractor = new ContactInfoExtractor(connection.sock);
        const contactInfo = await extractor.extractFullContactInfo(chatId);
        
        res.json({
          success: true,
          data: contactInfo,
          message: 'Informações extraídas com sucesso'
        });
        
      } catch (error) {
        console.error('❌ [API] Erro ao extrair informações:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Endpoint para sincronizar todos os contatos
    app.post('/api/contact/sync-all', async (req, res) => {
      try {
        const { connectionId, ownerId } = req.body;
        
        if (!connectionId || !ownerId) {
          return res.status(400).json({
            success: false,
            message: 'connectionId e ownerId são obrigatórios'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔄 [SYNC-ALL] Iniciando sincronização completa de contatos...');
        
        const extractor = new ContactInfoExtractor(connection.sock);
        
        // Buscar conversas existentes para sincronizar
        const { data: conversations } = await supabaseAdmin
          .from('whatsapp_mensagens')
          .select('DISTINCT chat_id, owner_id')
          .eq('owner_id', ownerId)
          .limit(50);
        
        let contactsSaved = 0;
        let errors = [];

        // Processar cada conversa
        for (const conv of conversations || []) {
          try {
            console.log(`🔄 [SYNC-ALL] Processando: ${conv.chat_id}`);
            
            // Extrair informações completas do contato
            const contactInfo = await extractor.extractFullContactInfo(conv.chat_id);
            
            if (contactInfo) {
              // Salvar na tabela contacts usando o serviço de sincronização
              const profileSyncService = new WhatsAppProfileSyncService(
                supabaseUrl,
                supabaseServiceKey
              );
              
              await profileSyncService.saveContactToContacts(contactInfo, ownerId, connectionId);
              contactsSaved++;
              console.log(`✅ [SYNC-ALL] Contato sincronizado: ${conv.chat_id}`);
            }
          } catch (error) {
            console.error(`❌ [SYNC-ALL] Erro ao processar contato ${conv.chat_id}:`, error);
            errors.push(`Processamento ${conv.chat_id}: ${error.message}`);
          }
        }
        
        res.json({
          success: true,
          data: {
            totalContacts: conversations?.length || 0,
            contactsSaved,
            errors: errors.length > 0 ? errors : null
          },
          message: `Sincronização concluída: ${contactsSaved} contatos processados`
        });
        
      } catch (error) {
        console.error('❌ [SYNC-ALL] Erro na sincronização:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Endpoint para obter todos os grupos participantes
    app.get('/api/groups/all-participating', async (req, res) => {
      try {
        const { connectionId } = req.query;
        
        if (!connectionId) {
          return res.status(400).json({
            success: false,
            message: 'connectionId é obrigatório'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔍 [GROUPS-ALL] Buscando todos os grupos participantes...');
        
        const extractor = new ContactInfoExtractor(connection.sock);
        const groups = await extractor.fetchAllParticipatingGroups();
        
        res.json({
          success: true,
          data: groups,
          message: `Encontrados ${Object.keys(groups).length} grupos participantes`
        });
        
      } catch (error) {
        console.error('❌ [GROUPS-ALL] Erro ao buscar grupos:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Endpoint para obter informações de business profile específico
    app.get('/api/business-profile/:connectionId', async (req, res) => {
      try {
        const { connectionId } = req.params;
        const { jid } = req.query;
        
        if (!connectionId || !jid) {
          return res.status(400).json({
            success: false,
            message: 'connectionId e jid são obrigatórios'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔍 [BUSINESS-PROFILE] Buscando business profile para:', jid);
        
        // Normalizar JID para suportar diferentes formatos
        let normalizedJid = jid;
        if (!jid.includes('@s.whatsapp.net') && !jid.includes('@c.us')) {
          normalizedJid = `${jid}@s.whatsapp.net`;
        }
        
        try {
          const businessProfile = await connection.sock.getBusinessProfile(normalizedJid);
          console.log(`✅ [BUSINESS-PROFILE] Profile encontrado:`, businessProfile);
          
          res.json({
            success: true,
            data: businessProfile,
            jid: normalizedJid
          });
        } catch (error) {
          console.log(`ℹ️ [BUSINESS-PROFILE] Perfil não encontrado para ${normalizedJid}:`, error.message);
          res.json({
            success: false,
            data: null,
            message: 'Não é um perfil de negócio ou perfil não encontrado',
            error: error.message
          });
        }
        
      } catch (error) {
        console.error('❌ [BUSINESS-PROFILE] Erro ao buscar perfil:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Endpoint para obter todos os grupos participantes (endpoint aprimorado)
    app.get('/api/groups-participating/:connectionId', async (req, res) => {
      try {
        const { connectionId } = req.params;
        
        if (!connectionId) {
          return res.status(400).json({
            success: false,
            message: 'connectionId é obrigatório'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔍 [GROUPS-ENHANCED] Buscando todos os grupos participantes...');
        
        try {
          const groups = await connection.sock.groupFetchAllParticipating();
          console.log(`✅ [GROUPS-ENHANCED] Encontrados ${Object.keys(groups).length} grupos`);
          
          res.json({
            success: true,
            data: groups,
            count: Object.keys(groups).length,
            message: `Encontrados ${Object.keys(groups).length} grupos participantes`
          });
        } catch (error) {
          console.error('❌ [GROUPS-ENHANCED] Erro ao buscar grupos:', error);
          res.json({
            success: false,
            data: {},
            count: 0,
            message: 'Erro ao buscar grupos',
            error: error.message
          });
        }
        
      } catch (error) {
        console.error('❌ [GROUPS-ENHANCED] Erro no endpoint:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Endpoint para testar perfis de negócio específicos
    // Endpoint para sincronizar um contato específico com informações de negócios
    app.post('/api/contact/sync-specific', async (req, res) => {
      try {
        const { chatId, connectionId, ownerId } = req.body;
        
        if (!chatId || !connectionId || !ownerId) {
          return res.status(400).json({
            success: false,
            message: 'chatId, connectionId e ownerId são obrigatórios'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔄 [SYNC-SPECIFIC] Sincronizando contato específico:', chatId);
        
        const extractor = new ContactInfoExtractor(connection.sock);
        const contactInfo = await extractor.extractFullContactInfo(chatId);
        
        if (contactInfo) {
          // Salvar na tabela contacts usando o serviço de sincronização
          const profileSyncService = new WhatsAppProfileSyncService(
            supabaseUrl || process.env.SUPABASE_URL,
            supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY
          );
          
          await profileSyncService.saveContactToContacts(contactInfo, ownerId, connectionId);
          
          res.json({
            success: true,
            data: {
              chatId,
              contactInfo,
              saved: true
            },
            message: 'Contato sincronizado com sucesso'
          });
        } else {
          res.json({
            success: false,
            message: 'Não foi possível extrair informações do contato'
          });
        }
        
      } catch (error) {
        console.error('❌ [SYNC-SPECIFIC] Erro na sincronização:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Endpoint para verificar contato salvo na tabela contacts
    app.get('/api/contact/check/:jid', async (req, res) => {
      try {
        const { jid } = req.params;
        const { ownerId } = req.query;
        
        if (!jid || !ownerId) {
          return res.status(400).json({
            success: false,
            message: 'jid e ownerId são obrigatórios'
          });
        }

        console.log('🔍 [CHECK-CONTACT] Verificando contato:', jid);
        
        const { data: contact, error } = await supabaseAdmin
          .from('contacts')
          .select('*')
          .eq('whatsapp_jid', jid)
          .eq('owner_id', ownerId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        res.json({
          success: true,
          data: contact,
          message: contact ? 'Contato encontrado' : 'Contato não encontrado'
        });
        
      } catch (error) {
        console.error('❌ [CHECK-CONTACT] Erro ao verificar contato:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    app.post('/api/contact/test-business-profiles', async (req, res) => {
      try {
        const { connectionId, chatIds } = req.body;
        
        if (!connectionId || !chatIds || !Array.isArray(chatIds)) {
          return res.status(400).json({
            success: false,
            message: 'connectionId e chatIds (array) são obrigatórios'
          });
        }

        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.sock) {
          return res.status(404).json({
            success: false,
            message: 'Conexão não encontrada ou não ativa'
          });
        }

        console.log('🔍 [BUSINESS-TEST] Testando perfis de negócio para:', chatIds);
        
        const extractor = new ContactInfoExtractor(connection.sock);
        const results = [];

        for (const chatId of chatIds) {
          try {
            console.log(`🔍 [BUSINESS-TEST] Testando ${chatId}...`);
            
            // Testar getBusinessProfile diretamente
            let directProfile = null;
            try {
              directProfile = await connection.sock.getBusinessProfile(chatId);
              console.log(`✅ [BUSINESS-TEST] Perfil direto encontrado para ${chatId}`);
            } catch (error) {
              console.log(`ℹ️ [BUSINESS-TEST] Perfil direto não disponível para ${chatId}:`, error.message);
            }

            // Testar com o extrator
            const contactInfo = await extractor.extractFullContactInfo(chatId);
            
            results.push({
              chatId,
              directProfile,
              extractedInfo: {
                isBusiness: contactInfo.isBusiness,
                businessName: contactInfo.businessName,
                businessDescription: contactInfo.businessDescription,
                businessCategory: contactInfo.businessCategory,
                businessEmail: contactInfo.businessEmail,
                businessWebsite: contactInfo.businessWebsite,
                isVerified: contactInfo.isVerified,
                profilePicture: !!contactInfo.profilePicture,
                name: contactInfo.name
              }
            });

          } catch (error) {
            console.error(`❌ [BUSINESS-TEST] Erro ao processar ${chatId}:`, error);
            results.push({
              chatId,
              error: error.message,
              directProfile: null,
              extractedInfo: null
            });
          }
        }
        
        res.json({
          success: true,
          data: results,
          message: `Testados ${chatIds.length} contatos para perfis de negócio`
        });
        
      } catch (error) {
        console.error('❌ [BUSINESS-TEST] Erro no teste:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor',
          error: error.message
        });
      }
    });

    // Iniciar servidor com tratamento de erro
    server.listen(PORT, () => {
      console.log(`🚀 WhatsApp Baileys Server rodando na porta ${PORT}`);
      console.log(`📱 API disponível em http://localhost:${PORT}/api`);
      console.log(`🔗 Teste: http://localhost:${PORT}/api/test`);
      console.log(`📋 Conexões ativas: ${activeConnections.size}`);
      console.log(`🔌 Socket.IO ativo para tempo real`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Porta ${PORT} está em uso, tentando porta ${PORT + 1}`);
        PORT += 1;
        // Verificar se a nova porta é válida
        if (PORT > 65535) {
          console.error('❌ Nenhuma porta disponível encontrada');
          process.exit(1);
        }
        server.listen(PORT);
      } else {
        console.error('❌ Erro no servidor:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Função para limpar sessões antigas (executa a cada hora)
async function cleanupOldSessions() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('status', 'disconnected')
      .lt('updated_at', oneHourAgo);
    
    if (error) {
      console.error('Erro ao limpar sessões antigas:', error);
    } else {
      console.log('🧹 Sessões antigas limpas com sucesso');
    }
  } catch (error) {
    console.error('Erro na limpeza de sessões:', error);
  }
}

// ===== API ENDPOINTS PARA CONTATOS =====

// Listar contatos
app.get('/api/contacts', async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar contato
app.post('/api/contacts', async (req, res) => {
  try {
    const contactData = req.body;
    
    // Validar dados obrigatórios
    if (!contactData.name || !contactData.phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e telefone são obrigatórios' 
      });
    }

    // Adicionar timestamps
    contactData.created_at = new Date().toISOString();
    contactData.updated_at = new Date().toISOString();
    contactData.last_contact_at = new Date().toISOString();

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: newContact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Atualizar contato
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contactData = req.body;
    
    // Adicionar timestamp de atualização
    contactData.updated_at = new Date().toISOString();

    const { data: updatedContact, error } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: updatedContact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deletar contato
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Contato deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Converter contato em lead
app.post('/api/contacts/:id/convert-to-lead', async (req, res) => {
  try {
    const { id } = req.params;
    const { pipeline, priority = 'medium' } = req.body;

    // Buscar contato
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ success: false, error: 'Contato não encontrado' });
    }

    // Criar lead
    const leadData = {
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      company: contact.company,
      status: 'new',
      pipeline: pipeline || 'Qualificação',
      source: 'WhatsApp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      return res.status(500).json({ success: false, error: leadError.message });
    }

    // Atualizar status do contato para 'lead'
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ 
        status: 'lead',
        pipeline: pipeline || 'Qualificação',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar status do contato:', updateError);
    }

    res.json({ 
      success: true, 
      data: { 
        lead: newLead,
        message: 'Contato convertido em lead com sucesso'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// OPTIMIZED: Global cache for profile pictures
const profilePictureCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Endpoint para buscar foto de perfil do WhatsApp
app.get('/api/whatsapp-profile/:connectionId/profile-picture/:jid', async (req, res) => {
  try {
    const { connectionId, jid } = req.params;
    const { highRes = false } = req.query;
    
    // OPTIMIZED: Check cache first
    const cacheKey = `${connectionId}-${jid}-${highRes}`;
    const cached = profilePictureCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ 
        success: true, 
        data: { 
          profilePictureUrl: cached.url,
          jid,
          highRes: highRes === 'true',
          cached: true
        } 
      });
    }
    
    // Buscar conexão ativa
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conexão não encontrada ou não conectada' 
      });
    }
    
    const sock = connection.sock;
    
    try {
      let profilePictureUrl;
      
      if (highRes === 'true') {
        // Tentar alta resolução primeiro
        profilePictureUrl = await sock.profilePictureUrl(jid, 'image');
      } else {
        // Baixa resolução
        profilePictureUrl = await sock.profilePictureUrl(jid);
      }
      
      // OPTIMIZED: Store in cache before returning
      profilePictureCache.set(cacheKey, {
        url: profilePictureUrl,
        timestamp: Date.now()
      });
      
      res.json({
        success: true,
        data: {
          profilePictureUrl,
          jid,
          highRes: highRes === 'true',
          cached: false
        }
      });
      
    } catch (profileError) {
      console.log('ℹ️ [PROFILE-PICTURE] Erro ao buscar foto:', profileError.message);
      
      // Tentar baixa resolução se alta resolução falhou
      if (highRes === 'true') {
        try {
          const lowResUrl = await sock.profilePictureUrl(jid);
          
          // OPTIMIZED: Cache low-res result
          profilePictureCache.set(cacheKey, {
            url: lowResUrl,
            timestamp: Date.now()
          });
          
          res.json({
            success: true,
            data: {
              profilePictureUrl: lowResUrl,
              jid,
              highRes: false,
              cached: false
            }
          });
          return;
        } catch (lowResError) {
          // OPTIMIZED: Cache null result to avoid repeated failed requests
          profilePictureCache.set(cacheKey, {
            url: null,
            timestamp: Date.now()
          });
        }
      }
      
      // OPTIMIZED: Cache null result for failed requests
      profilePictureCache.set(cacheKey, {
        url: null,
        timestamp: Date.now()
      });
      
      res.json({
        success: false,
        error: 'Foto de perfil não encontrada',
        data: {
          profilePictureUrl: null,
          jid,
          highRes: highRes === 'true',
          cached: false
        }
      });
    }
    
  } catch (error) {
    console.error('❌ [PROFILE-PICTURE] Erro geral:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para testar validação de JID
app.get('/api/baileys-simple/test-jid-validation', async (req, res) => {
  try {
    const { jid } = req.query;
    
    if (!jid) {
      return res.status(400).json({ error: 'JID é obrigatório' });
    }
    
    console.log('🧪 [TEST-JID] Testando JID:', jid);
    
    // Simular a mesma lógica de validação
    let cleanJid;
    if (jid.includes('@s.whatsapp.net') || jid.includes('@c.us') || jid.includes('@g.us')) {
      cleanJid = jid; // Usar JID original se já tem formato válido
    } else {
      cleanJid = jid.replace(/[^\d@.]/g, ''); // Limpar apenas se necessário
    }
    console.log('🧪 [TEST-JID] JID limpo:', cleanJid);
    
    let chatJid;
    
    if (/^\d+$/.test(cleanJid)) {
      chatJid = `${cleanJid}@s.whatsapp.net`;
    } else if (cleanJid.includes('@c.us')) {
      chatJid = cleanJid.replace('@c.us', '@s.whatsapp.net');
    } else if (cleanJid.includes('@g.us')) {
      chatJid = cleanJid; // Preservar grupos
    } else if (cleanJid.includes('@s.whatsapp.net')) {
      chatJid = cleanJid;
    } else {
      chatJid = `${cleanJid}@s.whatsapp.net`;
    }
    
    // Validação com padrões
    const jidPatterns = [
      /^(\d+)@s\.whatsapp\.net$/,
      /^(\d+)@c\.us$/,
      /^(\d+)@g\.us$/,
      /^(\d+)$/
    ];
    
    let jidMatch = null;
    let finalJid = chatJid;
    
    for (const pattern of jidPatterns) {
      const match = chatJid.match(pattern);
      if (match) {
        jidMatch = match;
        if (pattern.source === '^(\\d+)$') {
          finalJid = `${match[1]}@s.whatsapp.net`;
        } else if (pattern.source === '^(\\d+)@c\\.us$') {
          finalJid = `${match[1]}@s.whatsapp.net`;
        }
        break;
      }
    }
    
    const result = {
      original: jid,
      cleaned: cleanJid,
      processed: chatJid,
      final: finalJid,
      isValid: !!jidMatch,
      phoneNumber: jidMatch ? jidMatch[1] : null,
      patterns: jidPatterns.map(p => p.source)
    };
    
    console.log('🧪 [TEST-JID] Resultado:', result);
    
    res.json({
      success: true,
      result,
      message: jidMatch ? 'JID válido' : 'JID inválido'
    });
    
  } catch (error) {
    console.error('❌ [TEST-JID] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para sincronizar nomes reais dos contatos
app.post('/api/baileys-simple/sync-contact-names', async (req, res) => {
  try {
    const { connectionId, userId } = req.body;
    
    if (!connectionId || !userId) {
      return res.status(400).json({ error: 'connectionId e userId são obrigatórios' });
    }
    
    console.log('🔄 [SYNC-CONTACTS] Iniciando sincronização de nomes para:', { connectionId, userId });
    
    // Buscar conexão ativa
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ error: 'Conexão não encontrada ou não conectada' });
    }
    
    // Buscar contatos existentes no banco
    const { data: existingContacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, phone, whatsapp_jid, name_wpp, whatsapp_name')
      .eq('owner_id', userId)
      .not('whatsapp_jid', 'is', null);
    
    if (contactsError) {
      console.error('❌ [SYNC-CONTACTS] Erro ao buscar contatos:', contactsError);
      return res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
    
    if (!existingContacts || existingContacts.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum contato encontrado para sincronizar',
        updated: 0
      });
    }
    
    console.log(`🔄 [SYNC-CONTACTS] Encontrados ${existingContacts.length} contatos para sincronizar`);
    
    let updatedCount = 0;
    const results = [];
    
    // Processar cada contato
    for (const contact of existingContacts) {
      try {
        console.log(`🔍 [SYNC-CONTACTS] Processando contato: ${contact.whatsapp_jid}`);
        
        // Buscar nome real
        const realName = await getRealContactName(contact.whatsapp_jid, connection.sock);
        
        if (realName && realName !== contact.name_wpp) {
          // Atualizar contato no banco
          const { error: updateError } = await supabaseAdmin
            .from('contacts')
            .update({
              name_wpp: realName,
              whatsapp_name: realName,
              updated_at: new Date().toISOString()
            })
            .eq('id', contact.id);
          
          if (updateError) {
            console.error(`❌ [SYNC-CONTACTS] Erro ao atualizar contato ${contact.id}:`, updateError);
            results.push({
              contactId: contact.id,
              jid: contact.whatsapp_jid,
              oldName: contact.name_wpp,
              newName: realName,
              success: false,
              error: updateError.message
            });
          } else {
            console.log(`✅ [SYNC-CONTACTS] Contato atualizado: ${contact.name_wpp} → ${realName}`);
            updatedCount++;
            results.push({
              contactId: contact.id,
              jid: contact.whatsapp_jid,
              oldName: contact.name_wpp,
              newName: realName,
              success: true
            });
          }
        } else {
          console.log(`ℹ️ [SYNC-CONTACTS] Nome não alterado para: ${contact.whatsapp_jid}`);
          results.push({
            contactId: contact.id,
            jid: contact.whatsapp_jid,
            oldName: contact.name_wpp,
            newName: realName || contact.name_wpp,
            success: true,
            message: 'Nome não alterado'
          });
        }
        
        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (contactError) {
        console.error(`❌ [SYNC-CONTACTS] Erro ao processar contato ${contact.whatsapp_jid}:`, contactError);
        results.push({
          contactId: contact.id,
          jid: contact.whatsapp_jid,
          oldName: contact.name_wpp,
          newName: null,
          success: false,
          error: contactError.message
        });
      }
    }
    
    console.log(`✅ [SYNC-CONTACTS] Sincronização concluída. ${updatedCount} contatos atualizados.`);
    
    res.json({
      success: true,
      message: `Sincronização concluída. ${updatedCount} contatos atualizados.`,
      updated: updatedCount,
      total: existingContacts.length,
      results
    });
    
  } catch (error) {
    console.error('❌ [SYNC-CONTACTS] Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para testar envio de áudio especificamente
app.post('/api/baileys-simple/test-audio-send', upload.single('audio'), async (req, res) => {
  try {
    const { connectionId, jid } = req.body;
    const file = req.file;
    
    console.log('🧪 [TEST-AUDIO-SEND] Teste de envio de áudio:', {
      connectionId,
      jid,
      fileName: file?.originalname,
      fileSize: file?.size,
      fileMimeType: file?.mimetype
    });
    
    if (!connectionId || !jid || !file) {
      return res.status(400).json({ 
        error: 'connectionId, jid e arquivo são obrigatórios' 
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }
    
    const sock = connection.sock;
    const fileBuffer = fs.readFileSync(file.path);
    
    // Testar diferentes formatos de áudio
    const audioFormats = [
      { audio: fileBuffer, ptt: true, mimetype: 'audio/ogg; codecs=opus' },
      { audio: fileBuffer, ptt: true },
      { audio: fileBuffer, mimetype: file.mimetype },
      { audio: { url: file.path }, ptt: true }
    ];
    
    const results = [];
    
    for (let i = 0; i < audioFormats.length; i++) {
      const format = audioFormats[i];
      try {
        console.log(`🧪 [TEST-AUDIO-SEND] Testando formato ${i + 1}:`, format);
        const sent = await sock.sendMessage(jid, format);
        results.push({
          format: i + 1,
          success: true,
          messageId: sent?.key?.id,
          content: format
        });
        console.log(`✅ [TEST-AUDIO-SEND] Formato ${i + 1} funcionou!`);
        break; // Se funcionou, parar aqui
      } catch (error) {
        console.log(`❌ [TEST-AUDIO-SEND] Formato ${i + 1} falhou:`, error.message);
        results.push({
          format: i + 1,
          success: false,
          error: error.message,
          content: format
        });
      }
    }
    
    res.json({
      success: true,
      results,
      message: 'Teste de envio de áudio concluído'
    });
    
  } catch (error) {
    console.error('❌ [TEST-AUDIO-SEND] Erro no teste:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para testar tipos de mídia aceitos
app.get('/api/baileys-simple/test-media-types', async (req, res) => {
  try {
    const { connectionId } = req.query;
    
    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId é obrigatório' });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }
    
    const sock = connection.sock;
    
    // Testar diferentes tipos de mídia
    const mediaTypes = {
      audio: {
        webm: 'audio/webm',
        ogg: 'audio/ogg',
        mp3: 'audio/mp3',
        mp4: 'audio/mp4',
        wav: 'audio/wav'
      },
      video: {
        mp4: 'video/mp4',
        webm: 'video/webm',
        avi: 'video/avi',
        mov: 'video/quicktime'
      },
      image: {
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp'
      }
    };
    
    res.json({
      success: true,
      supportedTypes: mediaTypes,
      message: 'Tipos de mídia testados. Use estes tipos no envio de mídia.'
    });
    
  } catch (error) {
    console.error('❌ Erro ao testar tipos de mídia:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar status do Supabase
app.get('/api/baileys-simple/supabase-status', async (req, res) => {
  try {
    // Testar conexão com Supabase
    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão com Supabase:', error);
      return res.json({
        success: false,
        error: error.message,
        isConnected: false,
        isOverLimit: error.message.includes('limit') || error.message.includes('quota')
      });
    }
    
    res.json({
      success: true,
      isConnected: true,
      isOverLimit: false,
      message: 'Supabase funcionando normalmente'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status do Supabase:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      isConnected: false,
      isOverLimit: true
    });
  }
});

// Endpoint para testar conversas do frontend
app.get('/api/baileys-simple/test-conversations', async (req, res) => {
  try {
    const { ownerId, from = 0, to = 19 } = req.query;
    
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId é obrigatório' });
    }

    const limit = parseInt(to) - parseInt(from) + 1;
    const offset = parseInt(from);

    // OPTIMIZED: Use the optimized SQL function for paginated conversations
    const { data: conversations, error } = await supabase
      .rpc('get_conversations_optimized', {
        p_owner_id: ownerId,
        p_limit: limit,
        p_offset: offset
      });

    if (error) {
      console.error('❌ Erro ao buscar conversas otimizadas:', error);
      
      // Fallback to old method if function doesn't exist
      console.log('🔄 Tentando método antigo...');
      
      // Buscar mensagens do usuário ordenadas por timestamp decrescente (mais recentes primeiro)
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('owner_id', ownerId)
        .order('timestamp', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (messagesError) {
        console.error('❌ Erro ao buscar mensagens do Supabase:', messagesError);
        
        // Verificar se é erro de limite/quota
        const isOverLimit = messagesError.message.includes('limit') || messagesError.message.includes('quota') || messagesError.message.includes('usage');
        
        if (isOverLimit) {
          console.warn('⚠️ Supabase com limite de uso excedido, retornando dados em cache');
          // Retornar conversas vazias quando Supabase está com limite
          return res.json({
            success: true,
            conversations: [],
            total: 0,
            warning: 'Supabase com limite de uso excedido. Algumas funcionalidades podem estar limitadas.'
          });
        }
        
        return res.status(500).json({ 
          error: messagesError.message,
          isOverLimit: isOverLimit
        });
      }

      // Agrupar por chat_id - como as mensagens já estão ordenadas por timestamp decrescente,
      // a primeira mensagem de cada chat_id será a mais recente
      const conversations = new Map();
      
      for (const msg of messages || []) {
        const key = msg.chat_id;
        const existing = conversations.get(key);
        
        // Buscar informações do contato na tabela contacts (para todas as conversas)
        let contactInfo = null;
        try {
          const { data: contactData, error: contactError } = await supabase
            .from('contacts')
            .select('whatsapp_name, whatsapp_profile_picture, name, whatsapp_group_subject, whatsapp_is_group, whatsapp_business_name, whatsapp_business_description, whatsapp_business_email, whatsapp_business_website, whatsapp_business_category, whatsapp_verified, whatsapp_group_participants, whatsapp_group_admins, whatsapp_group_owner, whatsapp_group_created')
            .eq('whatsapp_jid', msg.chat_id)
            .eq('owner_id', ownerId)
            .single();
          
          if (contactData && !contactError) {
            contactInfo = contactData;
          }
        } catch (error) {
          console.log('⚠️ Erro ao buscar informações do contato:', error.message);
        }

        if (!existing) {
          // Tentar obter nome real do WhatsApp se disponível
          let displayName = msg.wpp_name || msg.phone || 'Contato';
          let profilePicture = null;
          
          if (contactInfo) {
            // Se for um grupo, usar o nome do grupo
            if (contactInfo.whatsapp_is_group && contactInfo.whatsapp_group_subject) {
              displayName = contactInfo.whatsapp_group_subject;
            } else {
              displayName = contactInfo.whatsapp_name || contactInfo.whatsapp_business_name || contactInfo.name || displayName;
            }
            profilePicture = contactInfo.whatsapp_profile_picture;
          }
          
          // Se não encontrou na tabela contacts, tentar buscar na conexão ativa
          if (!profilePicture && activeConnections.size > 0) {
            try {
              const connection = Array.from(activeConnections.values())[0];
              if (connection && connection.sock) {
                // Buscar informações do contato
                const contactInfo = connection.sock.store?.contacts?.[msg.chat_id];
                if (contactInfo && contactInfo.name && !displayName.includes('Contato')) {
                  displayName = contactInfo.name;
                }
              }
            } catch (error) {
              console.log('⚠️ Erro ao buscar nome real do WhatsApp:', error.message);
            }
          }
          
          conversations.set(key, {
            chat_id: msg.chat_id,
            nome_cliente: displayName,
            numero_cliente: msg.phone || msg.chat_id?.split('@')[0] || '',
            last_message: msg.conteudo,
            lastMessageAt: msg.timestamp,
            last_message_remetente: msg.remetente, // Adicionar remetente da última mensagem
            last_message_tipo: msg.tipo, // Adicionar tipo da última mensagem
            last_message_lida: msg.lida, // Adicionar status de lida da última mensagem
            unread_count: 0, // Inicializar como 0, será calculado depois
            total_messages: 1,
            owner_id: msg.owner_id,
            connection_id: msg.connection_id,
            profile_picture: profilePicture, // Foto de perfil do WhatsApp
            whatsapp_name: contactInfo?.whatsapp_name || displayName,
            whatsapp_business_name: contactInfo?.whatsapp_business_name || null,
            whatsapp_business_description: contactInfo?.whatsapp_business_description || null,
            whatsapp_business_email: contactInfo?.whatsapp_business_email || null,
            whatsapp_business_website: contactInfo?.whatsapp_business_website || null,
            whatsapp_business_category: contactInfo?.whatsapp_business_category || null,
            whatsapp_verified: contactInfo?.whatsapp_verified || false,
            whatsapp_jid: msg.chat_id,
            // Adicionar campos de grupo
            whatsapp_group_subject: contactInfo?.whatsapp_group_subject || (msg.chat_id?.includes('@g.us') ? displayName : null),
            whatsapp_is_group: msg.chat_id?.includes('@g.us') || false,
            whatsapp_group_participants: contactInfo?.whatsapp_group_participants || null,
            whatsapp_group_admins: contactInfo?.whatsapp_group_admins || null,
            whatsapp_group_owner: contactInfo?.whatsapp_group_owner || null,
            whatsapp_group_created: contactInfo?.whatsapp_group_created || null
          });
        } else {
          existing.total_messages += 1;
          // Como as mensagens estão ordenadas por timestamp decrescente,
          // não precisamos verificar se é mais recente - a primeira já é a mais recente
        }
      }

      // Calcular unread_count baseado apenas em mensagens não lidas do CLIENTE
      // Usar uma query separada para contar mensagens não lidas por chat_id
      for (const [chatId, conversation] of conversations) {
        try {
          const { count, error } = await supabase
            .from('whatsapp_mensagens')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatId)
            .eq('owner_id', ownerId)
            .eq('remetente', 'CLIENTE')
            .eq('lida', false);
          
          if (error) {
            console.error(`Erro ao contar mensagens não lidas para ${chatId}:`, error);
            conversation.unread_count = 0;
          } else {
            conversation.unread_count = count || 0;
            // console.log(`🔴 Unread count para ${chatId}: ${conversation.unread_count}`); // Removido para reduzir spam de logs
          }
        } catch (error) {
          console.error(`Erro ao contar mensagens não lidas para ${chatId}:`, error);
          conversation.unread_count = 0;
        }
      }

      const result = Array.from(conversations.values());
      result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      res.json({
        success: true,
        conversations: result,
        total: result.length
      });
    }
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para sincronizar contatos do WhatsApp
app.post('/api/whatsapp-contacts/sync/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { ownerId } = req.body;
    
    if (!connectionId || !ownerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'connectionId e ownerId são obrigatórios' 
      });
    }

    console.log('🔄 [SYNC-CONTACTS] Iniciando sincronização:', { connectionId, ownerId });

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conexão não encontrada' 
      });
    }

    const sock = connection.sock;
    let syncedContacts = 0;
    let errors = 0;

    // Obter todos os contatos do WhatsApp
    const contacts = sock.store?.contacts || {};
    
    for (const [jid, contact] of Object.entries(contacts)) {
      try {
        // Pular grupos e contatos sem nome
        if (jid.includes('@g.us') || !contact.name) continue;

        const phone = jid.split('@')[0];
        
        // Verificar se contato já existe
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('owner_id', ownerId)
          .or(`phone.eq.${phone},whatsapp_jid.eq.${jid}`)
          .single();

        const contactData = {
          owner_id: ownerId,
          name: contact.name,
          phone: phone,
          whatsapp_jid: jid,
          whatsapp_name: contact.name,
          whatsapp_connection_id: connectionId,
          whatsapp_registered_at: new Date().toISOString(),
          status: 'active',
          whatsapp_opted: true,
          ai_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_contact_at: new Date().toISOString()
        };

        if (existingContact) {
          // Atualizar contato existente
          const { error: updateError } = await supabase
            .from('contacts')
            .update({
              whatsapp_name: contact.name,
              whatsapp_jid: jid,
              whatsapp_connection_id: connectionId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar contato:', updateError);
            errors++;
          } else {
            syncedContacts++;
          }
        } else {
          // Criar novo contato
          const { error: insertError } = await supabase
            .from('contacts')
            .insert(contactData);

          if (insertError) {
            console.error('❌ Erro ao criar contato:', insertError);
            errors++;
          } else {
            syncedContacts++;
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar contato:', error);
        errors++;
      }
    }

    console.log('✅ [SYNC-CONTACTS] Sincronização concluída:', { syncedContacts, errors });

    res.json({
      success: true,
      data: {
        syncedContacts,
        errors,
        totalContacts: Object.keys(contacts).length
      }
    });

  } catch (error) {
    console.error('❌ [SYNC-CONTACTS] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    });
  }
});

// Endpoint para servir mídias por hash
// Endpoint para testar IA diretamente (sistema antigo)
app.post('/api/test-ai-response', async (req, res) => {
  try {
    const { userId, message, messageType = 'TEXTO', mediaUrl = null } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message são obrigatórios' });
    }
    
    console.log('🧪 ===== TESTE DIRETO DA IA (SISTEMA ANTIGO) =====');
    console.log('🧪 User ID:', userId);
    console.log('🧪 Message:', message);
    console.log('🧪 Message Type:', messageType);
    console.log('🧪 Media URL:', mediaUrl);
    
    const response = await generateAIResponse(message, 'test_chat_id', messageType, userId, mediaUrl);
    
    console.log('🧪 Resposta gerada:', response);
    console.log('🧪 ==============================================');
    
    res.json({ 
      success: true, 
      response: response,
      message: message,
      messageType: messageType,
      system: 'old'
    });
    
  } catch (error) {
    console.error('❌ Erro no teste da IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para testar pipeline completo
app.post('/api/test-complete-pipeline', async (req, res) => {
  try {
    const { userId, message, messageType = 'TEXTO', mediaUrl = null, connectionId = 'test_connection' } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message são obrigatórios' });
    }
    
    console.log('🧪 ===== TESTE PIPELINE COMPLETO =====');
    console.log('🧪 User ID:', userId);
    console.log('🧪 Message:', message);
    console.log('🧪 Message Type:', messageType);
    console.log('🧪 Media URL:', mediaUrl);
    console.log('🧪 Connection ID:', connectionId);
    
    // Usar o sistema que funciona (não o pipeline complexo)
    const aiResponse = await generateAIResponse(message, 'test_chat_id', messageType, userId, mediaUrl);
    console.log('🧪 Resposta gerada pela IA:', aiResponse);
    
    if (aiResponse) {
      console.log('🧪 ✅ Pipeline completo executado com sucesso!');
      
      res.json({ 
        success: true, 
        message: 'Pipeline completo executado com sucesso',
        aiResponse: aiResponse,
        messageType: messageType,
        system: 'simple'
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Nenhuma resposta IA gerada',
        system: 'simple'
      });
    }
    
    console.log('🧪 ======================================');
    
  } catch (error) {
    console.error('❌ Erro no teste do pipeline completo:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para testar novo pipeline de IA
app.post('/api/test-new-ai-pipeline', async (req, res) => {
  try {
    const { userId, message, messageType = 'TEXTO', mediaUrl = null, connectionId = 'test_connection' } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message são obrigatórios' });
    }
    
    console.log('🧪 ===== TESTE NOVO PIPELINE DE IA =====');
    console.log('🧪 User ID:', userId);
    console.log('🧪 Message:', message);
    console.log('🧪 Message Type:', messageType);
    console.log('🧪 Media URL:', mediaUrl);
    console.log('🧪 Connection ID:', connectionId);
    
    const { onIncomingMessage, shouldProcessMessage } = require('./src/wa/onIncomingMessage.ts');
    
    const testMessage = {
      ownerId: userId,
      connectionId: connectionId,
      chatId: 'test_chat_id',
      messageId: `test_${Date.now()}`,
      fromPhone: 'test_phone',
      type: messageType,
      text: message,
      media_url: mediaUrl,
      media_mime: null
    };
    
    if (shouldProcessMessage(testMessage)) {
      await onIncomingMessage(testMessage);
      console.log('🧪 ✅ Novo pipeline executado com sucesso!');
      
      res.json({ 
        success: true, 
        message: 'Novo pipeline executado com sucesso',
        messageType: messageType,
        system: 'new'
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Mensagem não processada (não atendeu aos critérios)',
        system: 'new'
      });
    }
    
    console.log('🧪 ======================================');
    
  } catch (error) {
    console.error('❌ Erro no teste do novo pipeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para testar mídia específica
app.post('/api/test-media-support', async (req, res) => {
  try {
    const { userId, messageType, mediaUrl } = req.body;
    
    if (!userId || !messageType || !mediaUrl) {
      return res.status(400).json({ error: 'userId, messageType e mediaUrl são obrigatórios' });
    }
    
    console.log('🧪 ===== TESTE DE SUPORTE A MÍDIA =====');
    console.log('🧪 User ID:', userId);
    console.log('🧪 Message Type:', messageType);
    console.log('🧪 Media URL:', mediaUrl);
    
    // Testar análise de mídia
    const { analyzeMediaContent } = require('./src/ai/infer.ts');
    
    try {
      const mediaContent = await analyzeMediaContent(messageType, mediaUrl, { api_key: process.env.OPENAI_API_KEY });
      console.log('🧪 Conteúdo analisado:', mediaContent);
      
      res.json({ 
        success: true, 
        mediaContent,
        messageType,
        mediaUrl,
        message: 'Mídia analisada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro na análise de mídia:', error);
      res.status(500).json({ 
        error: 'Erro na análise de mídia', 
        details: error.message 
      });
    }
    
    console.log('🧪 ====================================');
    
  } catch (error) {
    console.error('❌ Erro no teste de mídia:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para inicializar bucket de mídia
app.post('/api/init-media-bucket', async (req, res) => {
  try {
    console.log('📎 Inicializando bucket de mídia...');
    
    const { ensureMediaBucket } = require('./src/media/ingest.ts');
    await ensureMediaBucket();
    
    res.json({ 
      success: true, 
      message: 'Bucket de mídia inicializado com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar bucket de mídia:', error);
    res.status(500).json({ error: 'Erro ao inicializar bucket de mídia' });
  }
});

// Endpoint para ativar IA para todos os contatos
app.post('/api/activate-ai-for-all-contacts', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    
    console.log('🤖 Ativando IA para todos os contatos do usuário:', userId);
    
    // Primeiro, verificar quantos contatos existem
    const { data: existingContacts, error: countError } = await supabase
      .from('contacts')
      .select('id, phone, name')
      .eq('owner_id', userId);
    
    if (countError) {
      console.error('❌ Erro ao buscar contatos:', countError);
      return res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
    
    console.log('🤖 Contatos encontrados:', existingContacts?.length || 0);
    
    // Ativar IA para todos os contatos
    const { data, error } = await supabase
      .from('contacts')
      .update({ ai_enabled: true })
      .eq('owner_id', userId);
    
    if (error) {
      console.error('❌ Erro ao ativar IA para contatos:', error);
      return res.status(500).json({ error: 'Erro ao ativar IA para contatos' });
    }
    
    console.log('✅ IA ativada para todos os contatos');
    res.json({ 
      success: true, 
      message: 'IA ativada para todos os contatos',
      contactsUpdated: existingContacts?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint activate-ai-for-all-contacts:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/media/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    // console.log('📎 Buscando mídia por hash:', hash); // Removido para reduzir spam de logs
    
    // Buscar mídia no banco de dados
    const { data: mediaData, error } = await supabase
      .from('whatsapp_mensagens')
      .select('midia_url, midia_tipo, raw_data, midia_mime_text')
      .ilike('midia_url', `media:${hash}`)
      .limit(1)
      .single();
    
    if (error || !mediaData) {
      // console.log('❌ Mídia não encontrada para hash:', hash); // Removido para reduzir spam de logs
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }
    
    console.log('📎 Mídia encontrada:', { url: mediaData.midia_url, tipo: mediaData.midia_tipo });
    
    // Verificar se temos dados de mídia no raw_data
    if (mediaData.raw_data && mediaData.raw_data.mediaData) {
      console.log('📎 Servindo dados binários armazenados');
      const mediaDataBuffer = mediaData.raw_data.mediaData;
      
      let buffer;
      if (Buffer.isBuffer(mediaDataBuffer)) {
        buffer = mediaDataBuffer;
      } else if (typeof mediaDataBuffer === 'string') {
        // Se é string base64
        buffer = Buffer.from(mediaDataBuffer, 'base64');
      } else {
        console.log('❌ Formato de dados não suportado:', typeof mediaDataBuffer);
        return res.status(500).json({ error: 'Formato de dados não suportado' });
      }
      
      // Usar MIME type do banco se disponível
      const contentType = mediaData.midia_mime_text || 
        (mediaData.midia_tipo === 'IMAGEM' ? 'image/jpeg' : 
         mediaData.midia_tipo === 'AUDIO' ? 'audio/ogg' : 
         mediaData.midia_tipo === 'VIDEO' ? 'video/mp4' : 'application/octet-stream');
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
      return;
    }
    
    // Se a mídia está armazenada como base64
    if (mediaData.midia_url && mediaData.midia_url.startsWith('data:')) {
      const base64Data = mediaData.midia_url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', mediaData.midia_tipo || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } else if (mediaData.midia_url && mediaData.midia_url.startsWith('http')) {
      // Se é uma URL externa, fazer proxy
      const response = await fetch(mediaData.midia_url);
      if (!response.ok) {
        return res.status(404).json({ error: 'Mídia não encontrada' });
      }
      
      const buffer = await response.buffer();
      res.setHeader('Content-Type', mediaData.midia_tipo || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } else {
      // Para mídias com hash, retornar uma mensagem informativa
      console.log('⚠️ Mídia com hash encontrada, mas dados não disponíveis');
      return res.status(404).json({ 
        error: 'Dados da mídia não disponíveis',
        message: 'Esta mídia foi processada antes da implementação completa do sistema de armazenamento. As novas mídias serão suportadas corretamente.',
        hash: hash,
        type: mediaData.midia_tipo
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao servir mídia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para buscar metadados de todos os grupos participantes
app.get('/api/groups/metadata', async (req, res) => {
  try {
    const { connectionId } = req.query;
    
    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId é obrigatório' });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }

    // Usar sock.groupFetchAllParticipating() para buscar todos os grupos
    const response = await connection.sock.groupFetchAllParticipating();
    
    // Processar e formatar os dados dos grupos
    const groupsMetadata = Object.entries(response).map(([groupId, groupData]) => ({
      id: groupId,
      subject: groupData.subject,
      description: groupData.desc,
      owner: groupData.owner,
      admins: groupData.participants?.filter(p => p.admin).map(p => p.id) || [],
      participants: groupData.participants?.map(p => ({
        id: p.id,
        name: p.name,
        admin: p.admin
      })) || [],
      created: groupData.creation,
      settings: groupData.settings,
      isGroup: groupData.subject ? true : false
    }));

    res.json({
      success: true,
      totalGroups: groupsMetadata.length,
      groups: groupsMetadata
    });

  } catch (error) {
    console.error('❌ [GROUPS] Erro ao buscar metadados dos grupos:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar metadados dos grupos',
      details: error.message 
    });
  }
});

// Endpoint para sincronizar todos os grupos
app.post('/api/groups/sync-all', async (req, res) => {
  try {
    const { connectionId, ownerId } = req.body;
    
    if (!connectionId || !ownerId) {
      return res.status(400).json({
        success: false,
        message: 'connectionId e ownerId são obrigatórios'
      });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({
        success: false,
        message: 'Conexão não encontrada ou não ativa'
      });
    }

    console.log('🔄 [GROUPS-SYNC] Iniciando sincronização de todos os grupos...');
    
    // Buscar metadados dos grupos
    const response = await connection.sock.groupFetchAllParticipating();
    const groups = Object.entries(response);
    
    console.log(`📊 [GROUPS-SYNC] Encontrados ${groups.length} grupos`);
    
    let groupsSynced = 0;
    let errors = [];

    // Processar cada grupo
    for (const [groupId, groupData] of groups) {
      try {
        console.log(`🔄 [GROUPS-SYNC] Sincronizando grupo: ${groupId}`);
        
        // Criar objeto de informações do grupo (formato esperado pelo saveGroupToContacts)
        const groupInfo = {
          chatId: groupId,
          name: groupData.subject || `Grupo ${groupId.split('@')[0]}`,
          groupSubject: groupData.subject,
          groupDescription: groupData.desc,
          groupOwner: groupData.owner,
          groupAdmins: groupData.participants?.filter(p => p.admin).map(p => p.id) || [],
          groupParticipants: groupData.participants?.map(p => ({
            id: p.id,
            name: p.name,
            admin: p.admin
          })) || [],
          groupCreated: groupData.creation,
          groupSettings: groupData.settings,
          phone: groupId.split('@')[0] // Para compatibilidade
        };
        
        // Salvar na tabela contacts usando o serviço de sincronização
        const profileSyncService = new WhatsAppProfileSyncService(
          supabaseUrl,
          supabaseServiceKey
        );
        
        await profileSyncService.saveGroupToContacts(groupInfo, ownerId, connectionId);
        groupsSynced++;
        console.log(`✅ [GROUPS-SYNC] Grupo sincronizado: ${groupId}`);
        
        // Pequena pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ [GROUPS-SYNC] Erro ao sincronizar grupo ${groupId}:`, error);
        errors.push(`Grupo ${groupId}: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      data: {
        totalGroups: groups.length,
        groupsSynced,
        errors: errors.length > 0 ? errors : null
      },
      message: `Sincronização concluída: ${groupsSynced} grupos processados`
    });
    
  } catch (error) {
    console.error('❌ [GROUPS-SYNC] Erro na sincronização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar mídia com conversão FFmpeg (novo endpoint otimizado)
app.post('/api/baileys-simple/send-media-optimized', upload.single('file'), async (req, res) => {
  try {
    const { connectionId, jid, type, caption } = req.body;
    const file = req.file;

    console.log('📤 [SEND-MEDIA-OPTIMIZED] Recebida requisição:', { 
      connectionId, 
      jid, 
      type, 
      fileName: file?.originalname,
      caption: caption || 'Sem legenda',
      fileSize: file?.size,
      fileMimeType: file?.mimetype
    });

    if (!connectionId || !jid || !type || !file) {
      console.error('❌ [SEND-MEDIA-OPTIMIZED] Parâmetros obrigatórios ausentes:', {
        hasConnectionId: !!connectionId,
        hasJid: !!jid,
        hasType: !!type,
        hasFile: !!file
      });
      return res.status(400).json({ 
        success: false, 
        error: 'connectionId, jid, type e file são obrigatórios' 
      });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      console.error(`❌ [SEND-MEDIA-OPTIMIZED] Conexão não encontrada: ${connectionId}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    
    const sock = connection.sock;
    
    console.log('🔍 [SEND-MEDIA-OPTIMIZED] Antes da normalização JID:', jid);
    
    // Normalização e validação robusta do JID
    let chatJid;
    
    // Limpar JID de caracteres especiais, mas preservar o formato completo
    // Não remover caracteres se o JID já tem formato válido
    let cleanJid;
    if (jid.includes('@s.whatsapp.net') || jid.includes('@c.us') || jid.includes('@g.us')) {
      cleanJid = jid; // Usar JID original se já tem formato válido
    } else {
      cleanJid = jid.replace(/[^\d@.]/g, ''); // Limpar apenas se necessário
    }
    console.log('🧹 [SEND-MEDIA-OPTIMIZED] JID limpo:', cleanJid);
    console.log('🔍 [SEND-MEDIA-OPTIMIZED] JID completo para debug:', cleanJid);
    
    if (/^\d+$/.test(cleanJid)) {
      chatJid = `${cleanJid}@s.whatsapp.net`;
    } else if (cleanJid.includes('@c.us')) {
      chatJid = cleanJid.replace('@c.us', '@s.whatsapp.net');
    } else if (cleanJid.includes('@g.us')) {
      chatJid = cleanJid; // Preservar grupos
    } else if (cleanJid.includes('@s.whatsapp.net')) {
      chatJid = cleanJid;
    } else if (cleanJid.includes('@')) {
      // Se tem @ mas não é um formato conhecido, tentar usar como está
      chatJid = cleanJid;
    } else {
      chatJid = `${cleanJid}@s.whatsapp.net`;
    }
    
    // Validação mais flexível do JID - permitir diferentes formatos
    const jidPatterns = [
      /^(\d+)@s\.whatsapp\.net$/,  // Formato padrão
      /^(\d+)@c\.us$/,             // Formato alternativo
      /^(\d+)@g\.us$/,             // Grupos do WhatsApp
      /^(\d+)$/                    // Apenas número
    ];
    
    let jidMatch = null;
    let finalJid = chatJid;
    
    console.log('🔍 [SEND-MEDIA-OPTIMIZED] Validando JID:', chatJid);
    
    for (const pattern of jidPatterns) {
      const match = chatJid.match(pattern);
      if (match) {
        jidMatch = match;
        console.log('✅ [SEND-MEDIA-OPTIMIZED] JID corresponde ao padrão:', pattern.source);
        // Normalizar para formato padrão
        if (pattern.source === '^(\\d+)$') {
          finalJid = `${match[1]}@s.whatsapp.net`;
        } else if (pattern.source === '^(\\d+)@c\\.us$') {
          finalJid = `${match[1]}@s.whatsapp.net`;
        }
        break;
      }
    }
    
    if (!jidMatch) {
      console.error('❌ [SEND-MEDIA-OPTIMIZED] JID inválido após normalização:', chatJid);
      console.error('❌ [SEND-MEDIA-OPTIMIZED] JID original:', jid);
      console.error('❌ [SEND-MEDIA-OPTIMIZED] JID limpo:', cleanJid);
      console.error('❌ [SEND-MEDIA-OPTIMIZED] Padrões testados:', jidPatterns.map(p => p.source));
      
      // Tentar usar o JID original se a validação falhar
      if (jid && jid.includes('@')) {
        console.log('🔄 [SEND-MEDIA-OPTIMIZED] Tentando usar JID original:', jid);
        finalJid = jid;
        jidMatch = { 1: jid.split('@')[0] };
      } else {
        return res.status(400).json({
          success: false,
          error: `JID inválido: ${chatJid}. Deve ser um número de telefone válido`
        });
      }
    }
    
    chatJid = finalJid;
    
    const phoneNumber = jidMatch[1];
    console.log('✅ [SEND-MEDIA-OPTIMIZED] JID normalizado e validado:', chatJid);
    console.log('📱 [SEND-MEDIA-OPTIMIZED] Número de telefone extraído:', phoneNumber);

    // Preparar conteúdo baseado no tipo
    let content;
    let finalFilePath = file.path;
    let tempFiles = [file.path]; // Lista de arquivos temporários para limpeza

    // Para áudio, tentar conversão FFmpeg se disponível (opcional)
    if (type === 'audio') {
      try {
        // Verificar se FFmpeg está disponível
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
          
          await execAsync('ffmpeg -version');
          console.log('✅ FFmpeg disponível, convertendo áudio...');
          
          // Criar arquivo temporário convertido
          const convertedPath = file.path.replace(/\.[^/.]+$/, '_converted.ogg');
          tempFiles.push(convertedPath);
          
          // Comando FFmpeg para conversão otimizada para WhatsApp
          const ffmpegCommand = `ffmpeg -i "${file.path}" -c:a libopus -ac 1 -ar 48000 -b:a 64k -avoid_negative_ts make_zero -y "${convertedPath}"`;
          
          console.log('🔄 Executando conversão FFmpeg:', ffmpegCommand);
          const { stdout, stderr } = await execAsync(ffmpegCommand);
          
          if (stderr && stderr.includes('error')) {
            console.warn('⚠️ Aviso no FFmpeg (continuando):', stderr);
          }
          
          if (fs.existsSync(convertedPath)) {
            finalFilePath = convertedPath;
            console.log('✅ Áudio convertido com sucesso');
          } else {
            console.warn('⚠️ Conversão falhou, usando arquivo original');
          }
          
        } catch (ffmpegError) {
          console.log('ℹ️ FFmpeg não disponível, enviando arquivo original (isso é normal):', ffmpegError.message);
          // Continuar com o arquivo original - não é um erro crítico
        }
      }

      // Para vídeo, tentar conversão FFmpeg se disponível (opcional)
      if (type === 'video') {
        try {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          await execAsync('ffmpeg -version');
          console.log('✅ FFmpeg disponível, convertendo vídeo...');
          
          // Criar arquivo temporário convertido
          const convertedPath = file.path.replace(/\.[^/.]+$/, '_converted.mp4');
          tempFiles.push(convertedPath);
          
          // Comando FFmpeg para vídeo otimizado para WhatsApp
          const ffmpegCommand = `ffmpeg -i "${file.path}" -c:v libx264 -crf 23 -vf "scale='min(720,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease" -c:a aac -b:a 128k -movflags +faststart -y "${convertedPath}"`;
          
          console.log('🔄 Executando conversão FFmpeg:', ffmpegCommand);
          const { stdout, stderr } = await execAsync(ffmpegCommand);
          
          if (stderr && stderr.includes('error')) {
            console.warn('⚠️ Aviso no FFmpeg (continuando):', stderr);
          }
          
          if (fs.existsSync(convertedPath)) {
            finalFilePath = convertedPath;
            console.log('✅ Vídeo convertido com sucesso');
          } else {
            console.warn('⚠️ Conversão falhou, usando arquivo original');
          }
          
        } catch (ffmpegError) {
          console.log('ℹ️ FFmpeg não disponível, enviando arquivo original (isso é normal):', ffmpegError.message);
          // Continuar com o arquivo original - não é um erro crítico
        }
      }

      // Ler arquivo final (convertido ou original)
      const fileBuffer = fs.readFileSync(finalFilePath);
      
      // Determinar MIME type baseado no arquivo final
      let finalMimeType = file.mimetype;
      if (finalFilePath.endsWith('.ogg')) {
        finalMimeType = 'audio/ogg; codecs=opus';
      } else if (finalFilePath.endsWith('.mp4')) {
        finalMimeType = 'video/mp4';
      }

      // Preparar conteúdo baseado no tipo
      switch (type) {
        case 'image':
          content = { 
            image: fileBuffer, 
            caption: caption || '',
            mimetype: finalMimeType
          };
          break;
        case 'video':
          content = { 
            video: fileBuffer, 
            caption: caption || '',
            mimetype: finalMimeType
          };
          break;
        case 'audio':
          // Validação específica para áudio
          if (fileBuffer.length === 0) {
            console.error('❌ [SEND-MEDIA-OPTIMIZED] Arquivo de áudio vazio');
            return res.status(400).json({
              success: false,
              error: 'Arquivo de áudio vazio'
            });
          }
          
          // Formato simplificado para áudio conforme recomendado
          content = { 
            audio: fileBuffer, 
            ptt: true,
            mimetype: 'audio/ogg; codecs=opus'
          };
          console.log('🎤 [SEND-MEDIA-OPTIMIZED] Conteúdo de áudio preparado (formato simplificado):', {
            size: fileBuffer.length,
            ptt: true,
            mimetype: 'audio/ogg; codecs=opus'
          });
          break;
        case 'document':
          content = { 
            document: fileBuffer, 
            fileName: file.originalname,
            mimetype: finalMimeType
          };
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            error: 'Tipo de mídia não suportado' 
          });
      }

      // Enviar via Baileys
      console.log('📤 [SEND-MEDIA-OPTIMIZED] Enviando via Baileys:', { 
        chatJid, 
        type, 
        mimeType: finalMimeType,
        contentKeys: Object.keys(content),
        contentSize: fileBuffer.length
      });
      
      try {
        // Verificar se o JID está no formato correto antes de enviar
        console.log('🔍 [SEND-MEDIA-OPTIMIZED] Verificando JID antes do envio:', chatJid);
        
        // Validar JID uma vez mais - aceitar grupos também
        if (!chatJid.match(/^\d+@(s\.whatsapp\.net|g\.us)$/)) {
          throw new Error(`JID inválido: ${chatJid}. Deve estar no formato: número@s.whatsapp.net ou número@g.us`);
        }
        
        // Verificar se o conteúdo tem dados válidos
        if (type === 'audio') {
          if (!content.audio || content.audio.length === 0) {
            throw new Error('Conteúdo de áudio vazio ou inválido');
          }
          
          // Validar se o buffer de áudio é válido
          if (!Buffer.isBuffer(content.audio)) {
            console.log('🔄 [SEND-MEDIA-OPTIMIZED] Convertendo conteúdo para Buffer...');
            content.audio = Buffer.from(content.audio);
          }
          
          // Verificar se o buffer não está vazio
          if (content.audio.length === 0) {
            throw new Error('Buffer de áudio vazio');
          }
          
          console.log('✅ [SEND-MEDIA-OPTIMIZED] Conteúdo de áudio validado:', {
            bufferLength: content.audio.length,
            bufferType: typeof content.audio,
            isBuffer: Buffer.isBuffer(content.audio)
          });
        }
        
        console.log('📤 [SEND-MEDIA-OPTIMIZED] Enviando via Baileys...', {
          jid: chatJid,
          type: type,
          contentSize: fileBuffer.length,
          hasAudio: !!content.audio,
          ptt: content.ptt
        });
        
        // Tentar envio com validação adicional
        let sent;
        try {
          sent = await sock.sendMessage(chatJid, content, {
            linkPreview: false
          });
        } catch (sendError) {
          console.error('❌ [SEND-MEDIA-OPTIMIZED] Erro ao enviar via Baileys:', sendError.message);
          throw sendError;
        }
        
        console.log('✅ [SEND-MEDIA-OPTIMIZED] Mídia enviada via Baileys:', { 
          messageId: sent?.key?.id,
          status: sent?.status
        });
        
        // Mídia enviada com sucesso, continuar com o processamento

        // Salvar mídia no Supabase Storage e obter URL
        let mediaUrl = null;
        // Limpar MIME type para nome do arquivo (remover codecs e caracteres especiais)
        const cleanMimeType = finalMimeType.split(';')[0].split('/')[1] || 'bin';
        const fileName = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${cleanMimeType}`;
        
        // Upload para Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from('whatsapp')
          .upload(fileName, fileBuffer, {
            contentType: finalMimeType,
            upsert: false
          });
        
        if (uploadError) {
          console.error('❌ [SEND-MEDIA-OPTIMIZED] Erro ao fazer upload da mídia:', uploadError);
        } else {
          console.log('✅ [SEND-MEDIA-OPTIMIZED] Mídia salva no Supabase:', fileName);
          
          // Criar URL pública
          const { data: signedUrl } = await supabaseAdmin.storage
            .from('whatsapp')
            .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 dias
          
          if (signedUrl) {
            mediaUrl = signedUrl.signedUrl;
            console.log('✅ [SEND-MEDIA-OPTIMIZED] URL pública criada:', mediaUrl);
          }
        }

        // Salvar no banco
        const { ownerId, connectionPhone } = await getSessionInfo(connectionId, supabase);
        const nowIso = new Date().toISOString();

        const messageData = {
          id: crypto.randomUUID(),
          owner_id: ownerId,
          atendimento_id: null,
          connection_id: connectionId,
          connection_phone: connectionPhone,
          chat_id: chatJid,
          phone: chatJid.split('@')[0],
          conteudo: caption || `[${type === 'audio' ? 'Áudio' : type === 'video' ? 'Vídeo' : type === 'image' ? 'Imagem' : 'Arquivo'}]`,
          message_id: sent?.key?.id ?? null,
          message_type: type === 'image' ? 'IMAGEM'
                       : type === 'video' ? 'VIDEO'
                       : type === 'audio' ? 'AUDIO'
                       : 'ARQUIVO',
          media_type: finalMimeType,
          remetente: 'ATENDENTE',
          status: 'ATENDIDO',
          timestamp: nowIso,
          lida: true,
          media_url: mediaUrl, // URL da mídia no Supabase Storage
          media_mime: finalMimeType,
          duration_ms: null,
          wpp_name: 'Atendente',
          group_contact_name: null
        };

        console.log('💾 [SEND-MEDIA-OPTIMIZED] Salvando no Supabase:', messageData);
        const { error: dbErr } = await supabase.from('whatsapp_mensagens').insert(messageData);
        if (dbErr) {
          console.error('❌ [SEND-MEDIA-OPTIMIZED] Erro ao salvar no Supabase:', dbErr);
          // Não falhar a requisição por erro de banco
        }

        // Limpar arquivos temporários
        tempFiles.forEach(tempFile => {
          try {
            if (fs.existsSync(tempFile) && tempFile !== file.path) {
              fs.unlinkSync(tempFile);
              console.log('🗑️ Arquivo temporário removido:', tempFile);
            }
          } catch (cleanupError) {
            console.warn('⚠️ Erro ao limpar arquivo temporário:', tempFile, cleanupError.message);
          }
        });

        res.json({
          success: true,
          data: {
            messageId: sent?.key?.id,
            type: type,
            mimeType: finalMimeType,
            caption: caption || null,
            timestamp: nowIso
          }
        });

    } catch (error) {
      console.error('❌ [SEND-MEDIA-OPTIMIZED] Erro:', error);
      
      // Limpar arquivos temporários em caso de erro
      tempFiles.forEach(tempFile => {
        try {
          if (fs.existsSync(tempFile) && tempFile !== file.path) {
            fs.unlinkSync(tempFile);
          }
        } catch (cleanupError) {
          console.warn('⚠️ Erro ao limpar arquivo temporário:', tempFile, cleanupError.message);
        }
      });
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      });
    }
  } catch (error) {
    console.error('❌ [SEND-MEDIA-OPTIMIZED] Erro geral:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    });
  }
});

// Endpoint de teste para debug de JID
app.post('/api/baileys-simple/test-jid', async (req, res) => {
  try {
    const { jid } = req.body;
    
    console.log('🧪 [TEST-JID] Testando JID:', jid);
    
    // Normalização simples
    let chatJid;
    if (/^\d+$/.test(jid)) {
      chatJid = `${jid}@s.whatsapp.net`;
    } else if (jid.includes('@c.us')) {
      chatJid = jid.replace('@c.us', '@s.whatsapp.net');
    } else if (jid.includes('@s.whatsapp.net')) {
      chatJid = jid;
    } else {
      chatJid = `${jid}@s.whatsapp.net`;
    }
    
    // Validar formato
    const isValid = chatJid.match(/^\d+@s\.whatsapp\.net$/);
    
    res.json({
      success: true,
      data: {
        originalJid: jid,
        normalizedJid: chatJid,
        isValid: !!isValid,
        pattern: /^\d+@s\.whatsapp\.net$/.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ [TEST-JID] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint de teste específico para áudio
app.post('/api/baileys-simple/test-audio', upload.single('file'), async (req, res) => {
  try {
    const { connectionId, jid } = req.body;
    const file = req.file;

    console.log('🧪 [TEST-AUDIO] Testando envio de áudio:', { 
      connectionId, 
      jid, 
      fileName: file?.originalname,
      fileSize: file?.size
    });

    if (!connectionId || !jid || !file) {
      return res.status(400).json({ 
        success: false, 
        error: 'connectionId, jid e file são obrigatórios' 
      });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }

    const sock = connection.sock;
    
    // Normalização simples do JID
    let chatJid;
    if (/^\d+$/.test(jid)) {
      chatJid = `${jid}@s.whatsapp.net`;
    } else if (jid.includes('@c.us')) {
      chatJid = jid.replace('@c.us', '@s.whatsapp.net');
    } else if (jid.includes('@s.whatsapp.net')) {
      chatJid = jid;
    } else {
      chatJid = `${jid}@s.whatsapp.net`;
    }

    console.log('🧪 [TEST-AUDIO] JID normalizado:', chatJid);

    // Ler arquivo
    const fileBuffer = fs.readFileSync(file.path);
    console.log('🧪 [TEST-AUDIO] Arquivo lido:', { size: fileBuffer.length });

    // Conteúdo mais simples possível
    const content = { 
      audio: fileBuffer, 
      ptt: true
    };

    console.log('🧪 [TEST-AUDIO] Conteúdo preparado:', {
      hasAudio: !!content.audio,
      audioSize: content.audio?.length,
      ptt: content.ptt
    });

    // Tentar envio
    try {
      const sent = await sock.sendMessage(chatJid, content);
      console.log('✅ [TEST-AUDIO] Áudio enviado com sucesso:', { messageId: sent?.key?.id });
      
      res.json({
        success: true,
        data: {
          messageId: sent?.key?.id,
          jid: chatJid,
          fileSize: fileBuffer.length
        }
      });
    } catch (sendError) {
      console.error('❌ [TEST-AUDIO] Erro ao enviar:', sendError);
      res.status(500).json({
        success: false,
        error: sendError.message,
        details: {
          jid: chatJid,
          fileSize: fileBuffer.length,
          errorType: sendError.constructor.name
        }
      });
    }

  } catch (error) {
    console.error('❌ [TEST-AUDIO] Erro geral:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint de debug específico para erro de padrão
app.post('/api/baileys-simple/debug-pattern-error', upload.single('file'), async (req, res) => {
  try {
    const { connectionId, jid } = req.body;
    const file = req.file;

    console.log('🔍 [DEBUG-PATTERN] Debugando erro de padrão:', { 
      connectionId, 
      jid, 
      fileName: file?.originalname,
      fileSize: file?.size
    });

    if (!connectionId || !jid || !file) {
      return res.status(400).json({ 
        success: false, 
        error: 'connectionId, jid e file são obrigatórios' 
      });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }

    const sock = connection.sock;
    
    // Testar diferentes formatos de JID
    const jidFormats = [
      jid, // Original
      jid.includes('@') ? jid : `${jid}@s.whatsapp.net`, // Com @s.whatsapp.net
      jid.includes('@') ? jid.replace('@s.whatsapp.net', '@c.us') : `${jid}@c.us`, // Com @c.us
      jid.replace(/[^\d]/g, '') + '@s.whatsapp.net', // Apenas números + @s.whatsapp.net
    ];

    console.log('🔍 [DEBUG-PATTERN] Formatos de JID para testar:', jidFormats);

    // Ler arquivo
    const fileBuffer = fs.readFileSync(file.path);
    console.log('🔍 [DEBUG-PATTERN] Arquivo lido:', { size: fileBuffer.length });

    // Testar diferentes formatos de conteúdo
    const contentFormats = [
      { audio: fileBuffer, ptt: true },
      { audio: fileBuffer },
      { audio: fileBuffer, ptt: true, mimetype: 'audio/webm' },
      { audio: fileBuffer, ptt: true, mimetype: 'audio/ogg' },
    ];

    console.log('🔍 [DEBUG-PATTERN] Formatos de conteúdo para testar:', contentFormats.length);

    const results = [];

    for (let i = 0; i < jidFormats.length; i++) {
      const testJid = jidFormats[i];
      console.log(`🔍 [DEBUG-PATTERN] Testando JID ${i + 1}/${jidFormats.length}: ${testJid}`);
      
      for (let j = 0; j < contentFormats.length; j++) {
        const testContent = contentFormats[j];
        console.log(`🔍 [DEBUG-PATTERN] Testando conteúdo ${j + 1}/${contentFormats.length}:`, Object.keys(testContent));
        
        try {
          const sent = await sock.sendMessage(testJid, testContent);
          console.log(`✅ [DEBUG-PATTERN] Sucesso com JID ${i + 1}, conteúdo ${j + 1}:`, { messageId: sent?.key?.id });
          
          results.push({
            success: true,
            jid: testJid,
            content: Object.keys(testContent),
            messageId: sent?.key?.id
          });
          
          // Se funcionou, retornar sucesso
          return res.json({
            success: true,
            data: {
              workingJid: testJid,
              workingContent: Object.keys(testContent),
              messageId: sent?.key?.id,
              allResults: results
            }
          });
          
        } catch (error) {
          console.log(`❌ [DEBUG-PATTERN] Falha com JID ${i + 1}, conteúdo ${j + 1}:`, error.message);
          
          results.push({
            success: false,
            jid: testJid,
            content: Object.keys(testContent),
            error: error.message
          });
        }
      }
    }

    // Se chegou aqui, nenhum formato funcionou
    res.status(500).json({
      success: false,
      error: 'Nenhum formato de JID ou conteúdo funcionou',
      results: results
    });

  } catch (error) {
    console.error('❌ [DEBUG-PATTERN] Erro geral:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para limpar media:hash existentes
app.post('/api/cleanup-media-hashes', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }
    
    console.log('🧹 [CLEANUP-MEDIA] Iniciando limpeza de media:hash para usuário:', userId);
    
    // Buscar mensagens com media:hash
    const { data: messagesWithHashes } = await supabaseAdmin
      .from('whatsapp_mensagens')
      .select('*')
      .eq('owner_id', userId)
      .like('media_url', 'media:%');
    
    console.log(`📊 [CLEANUP-MEDIA] Encontradas ${messagesWithHashes?.length || 0} mensagens com media:hash`);
    
    if (!messagesWithHashes || messagesWithHashes.length === 0) {
      return res.json({ 
        success: true, 
        cleaned: 0,
        message: 'Nenhuma mensagem com media:hash encontrada'
      });
    }
    
    // Atualizar essas mensagens para mostrar "Mídia não disponível"
    const { error } = await supabaseAdmin
      .from('whatsapp_mensagens')
      .update({ 
        media_url: null,
        media_mime: null,
        media_type: null,
        conteudo: '[Mídia não disponível - atualizado pelo sistema]'
      })
      .eq('owner_id', userId)
      .like('media_url', 'media:%');
    
    if (error) {
      console.error('❌ [CLEANUP-MEDIA] Erro ao limpar media:hash:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao limpar media:hash',
        details: error.message
      });
    }
    
    console.log(`✅ [CLEANUP-MEDIA] Limpeza concluída: ${messagesWithHashes.length} mensagens atualizadas`);
    
    res.json({ 
      success: true, 
      cleaned: messagesWithHashes.length,
      message: `${messagesWithHashes.length} mensagens com media:hash foram limpas`
    });
    
  } catch (error) {
    console.error('❌ [CLEANUP-MEDIA] Erro geral:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para verificar e criar bucket do Supabase
app.post('/api/check-supabase-bucket', async (req, res) => {
  try {
    console.log('🔍 Verificando bucket do Supabase...');
    
    // Tentar listar arquivos no bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('whatsapp')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Erro ao acessar bucket:', listError);
      
      // Se o bucket não existe, tentar criar
      if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
        console.log('📦 Bucket não encontrado, tentando criar...');
        
        // Nota: A criação de buckets via API não é suportada pelo Supabase
        // O bucket deve ser criado manualmente no painel do Supabase
        return res.status(404).json({ 
          error: 'Bucket "whatsapp" não encontrado',
          message: 'Crie o bucket "whatsapp" manualmente no painel do Supabase Storage',
          instructions: [
            '1. Acesse o painel do Supabase',
            '2. Vá para Storage',
            '3. Clique em "New bucket"',
            '4. Nome: "whatsapp"',
            '5. Público: Sim (para URLs diretas)',
            '6. Clique em "Create bucket"'
          ]
        });
      }
      
      return res.status(500).json({ error: 'Erro ao acessar bucket', details: listError.message });
    }
    
    console.log('✅ Bucket acessível, arquivos encontrados:', files?.length || 0);
    
    res.json({ 
      success: true, 
      message: 'Bucket acessível',
      filesCount: files?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Erro na verificação do bucket:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Endpoint para sincronização completa de perfis
app.post('/api/whatsapp-profile/:connectionId/sync-all', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId é obrigatório'
      });
    }
    
    console.log('🔄 [SYNC-ALL] Iniciando sincronização completa de perfis:', { connectionId, userId });
    
    // Verificar se a conexão existe
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada ou não conectada'
      });
    }
    
    // Inicializar serviço de sincronização se não estiver inicializado
    if (!profileSyncService.extractor) {
      const contactExtractor = new ContactInfoExtractor(connection.sock);
      profileSyncService.initialize(contactExtractor);
    }
    
    // Executar sincronização em background
    profileSyncService.syncAllProfiles(userId, connectionId)
      .then(() => {
        console.log('✅ [SYNC-ALL] Sincronização completa finalizada');
      })
      .catch(error => {
        console.error('❌ [SYNC-ALL] Erro na sincronização:', error);
      });
    
    res.json({
      success: true,
      message: 'Sincronização iniciada em background',
      data: {
        connectionId,
        userId,
        status: 'started'
      }
    });
    
  } catch (error) {
    console.error('❌ [SYNC-ALL] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para sincronizar perfil de um contato específico
app.post('/api/whatsapp-profile/:connectionId/sync-contact', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { userId, chatId } = req.body;
    
    if (!userId || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'userId e chatId são obrigatórios'
      });
    }
    
    console.log('🔄 [SYNC-CONTACT] Sincronizando contato específico:', { connectionId, userId, chatId });
    
    // Verificar se a conexão existe
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada ou não conectada'
      });
    }
    
    // Inicializar serviço de sincronização se não estiver inicializado
    if (!profileSyncService.extractor) {
      const contactExtractor = new ContactInfoExtractor(connection.sock);
      profileSyncService.initialize(contactExtractor);
    }
    
    // Verificar se é grupo ou contato individual
    const isGroup = chatId.includes('@g.us');
    
    if (isGroup) {
      await profileSyncService.syncGroupProfile(chatId, userId, connectionId);
    } else {
      await profileSyncService.syncContactProfile(chatId, userId, connectionId);
    }
    
    res.json({
      success: true,
      message: 'Contato sincronizado com sucesso',
      data: {
        connectionId,
        userId,
        chatId,
        isGroup
      }
    });
    
  } catch (error) {
    console.error('❌ [SYNC-CONTACT] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obter status da sincronização
app.get('/api/whatsapp-profile/:connectionId/sync-status', async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    console.log('📊 [SYNC-STATUS] Verificando status da sincronização:', connectionId);
    
    const status = profileSyncService.getSyncStatus();
    
    res.json({
      success: true,
      data: {
        connectionId,
        ...status
      }
    });
    
  } catch (error) {
    console.error('❌ [SYNC-STATUS] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para buscar informações de grupos
app.get('/api/whatsapp-profile/:connectionId/groups', async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    console.log('👥 [GROUPS] Buscando informações de grupos:', connectionId);
    
    // Verificar se a conexão existe
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada ou não conectada'
      });
    }
    
    // Inicializar serviço de sincronização se não estiver inicializado
    if (!profileSyncService.extractor) {
      const contactExtractor = new ContactInfoExtractor(connection.sock);
      profileSyncService.initialize(contactExtractor);
    }
    
    // Buscar grupos
    const groups = await profileSyncService.extractor.fetchAllParticipatingGroups();
    
    res.json({
      success: true,
      data: {
        connectionId,
        groups: Object.keys(groups).map(groupId => ({
          id: groupId,
          subject: groups[groupId]?.subject || 'Grupo sem nome',
          participants: groups[groupId]?.participants?.length || 0,
          owner: groups[groupId]?.owner,
          creation: groups[groupId]?.creation
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ [GROUPS] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para buscar identidades WhatsApp
app.get('/api/whatsapp/identities', async (req, res) => {
  try {
    const { jids, ownerId } = req.query;
    
    if (!jids || !ownerId) {
      return res.status(400).json({
        success: false,
        error: 'jids e ownerId são obrigatórios'
      });
    }
    
    // Parse JIDs (pode ser uma string ou array)
    const jidList = Array.isArray(jids) ? jids : jids.split(',');
    
    console.log('🔍 [IDENTITIES] Buscando identidades para JIDs:', jidList);
    
    const identities = {};
    
    for (const jid of jidList) {
      try {
        // Buscar no banco de dados primeiro
        const { data: contact, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('whatsapp_jid', jid)
          .eq('owner_id', ownerId)
          .single();
        
        if (contact && !error) {
          identities[jid] = {
            name: contact.name || contact.wpp_name,
            avatar: contact.profile_picture,
            phone: contact.phone,
            isGroup: jid.includes('@g.us')
          };
        } else {
          // Fallback: tentar buscar de mensagens recentes
          const { data: message } = await supabase
            .from('whatsapp_mensagens')
            .select('wpp_name, whatsapp_group_subject, profile_picture')
            .eq('chat_id', jid)
            .eq('owner_id', ownerId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
          
          if (message) {
            identities[jid] = {
              name: jid.includes('@g.us') 
                ? (message.whatsapp_group_subject || message.wpp_name)
                : message.wpp_name,
              avatar: message.profile_picture,
              isGroup: jid.includes('@g.us')
            };
          }
        }
      } catch (err) {
        console.log(`⚠️ [IDENTITIES] Erro ao buscar identidade para ${jid}:`, err.message);
        // Continue com próximo JID
      }
    }
    
    console.log('✅ [IDENTITIES] Identidades encontradas:', Object.keys(identities).length);
    
    res.json({
      success: true,
      identities
    });
    
  } catch (error) {
    console.error('❌ [IDENTITIES] Erro geral:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para buscar informações de grupo específico
app.get('/api/whatsapp/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { ownerId } = req.query;
    
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'ownerId é obrigatório'
      });
    }
    
    console.log('👥 [GROUP-INFO] Buscando informações do grupo:', groupId);
    
    // Buscar no banco de dados
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('whatsapp_jid', groupId)
      .eq('owner_id', ownerId)
      .single();
    
    if (contact && !error) {
      res.json({
        success: true,
        group: {
          id: groupId,
          name: contact.name || contact.wpp_name,
          subject: contact.wpp_name,
          description: contact.whatsapp_group_description,
          participants: contact.whatsapp_group_participants,
          owner: contact.whatsapp_group_owner,
          created: contact.whatsapp_group_created,
          avatar: contact.profile_picture
        }
      });
    } else {
      // Buscar de mensagens recentes
      const { data: message } = await supabase
        .from('whatsapp_mensagens')
        .select('wpp_name, whatsapp_group_subject, whatsapp_group_description, whatsapp_group_participants, whatsapp_group_owner, whatsapp_group_created')
        .eq('chat_id', groupId)
        .eq('owner_id', ownerId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (message) {
        res.json({
          success: true,
          group: {
            id: groupId,
            name: message.whatsapp_group_subject || message.wpp_name,
            subject: message.whatsapp_group_subject,
            description: message.whatsapp_group_description,
            participants: message.whatsapp_group_participants,
            owner: message.whatsapp_group_owner,
            created: message.whatsapp_group_created
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Grupo não encontrado'
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [GROUP-INFO] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Executar limpeza a cada hora
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// Inicializar servidor
initializeServer();
