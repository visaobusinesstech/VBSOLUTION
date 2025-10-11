const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Variáveis para importação dinâmica do Baileys
let makeWASocket, useMultiFileAuthState;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Armazenar conexões ativas
const activeConnections = new Map();

// Função para gerar QR Code do WhatsApp
async function createWhatsAppConnection(connectionId, name) {
  try {
    console.log(`🔗 Criando conexão WhatsApp para: ${connectionId}`);
    
    // Importar Baileys dinamicamente
    if (!makeWASocket) {
      const baileys = await import('baileys');
      makeWASocket = baileys.default;
      useMultiFileAuthState = baileys.useMultiFileAuthState;
    }
    
    // Diretório para salvar dados de autenticação
    const authDir = path.join(__dirname, 'auth_sessions', `auth_${connectionId}`);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Configurar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    // Criar socket WhatsApp com configurações otimizadas
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'silent' },
      browser: ['VB Solution CRM', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      retryRequestDelayMs: 2000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      defaultQueryTimeoutMs: 60000,
      getMessage: async (key) => {
        return {
          conversation: 'test',
          message: {
            conversation: 'test'
          }
        };
      }
    });

    const connection = {
      id: connectionId,
      name: name,
      socket: sock,
      connectionState: 'connecting',
      qrCode: null,
      isConnected: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    activeConnections.set(connectionId, connection);
    
    // Evento de QR Code
    sock.ev.on('connection.update', async (update) => {
      const { connection: connState, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`📱 QR Code gerado para ${connectionId}`);
        try {
          // Gerar QR Code como data URL
          const qrCodeDataURL = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          
          // Atualizar conexão com QR Code
          const conn = activeConnections.get(connectionId);
          if (conn) {
            conn.qrCode = qrCodeDataURL;
            conn.updatedAt = new Date();
            console.log(`✅ QR Code atualizado para ${connectionId}`);
            
            // Emitir QR Code via Socket.IO
            io.emit('qrCode', {
              connectionId: connectionId,
              qrCode: qrCodeDataURL
            });
          }
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }
      
      if (connState === 'close') {
        console.log(`❌ Conexão ${connectionId} fechada`);
        const conn = activeConnections.get(connectionId);
        if (conn) {
          conn.connectionState = 'disconnected';
          conn.isConnected = false;
          conn.updatedAt = new Date();
        }
        
        // Emitir atualização de status
        io.emit('connectionUpdate', {
          connectionId: connectionId,
          status: 'disconnected'
        });
      }
      
      if (connState === 'open') {
        console.log(`✅ Conexão ${connectionId} estabelecida`);
        const conn = activeConnections.get(connectionId);
        if (conn) {
          conn.connectionState = 'open';
          conn.isConnected = true;
          conn.updatedAt = new Date();
        }
        
        // Emitir atualização de status
        io.emit('connectionUpdate', {
          connectionId: connectionId,
          status: 'connected'
        });
      }
    });

    // Salvar credenciais quando necessário
    sock.ev.on('creds.update', saveCreds);

    return connection;
  } catch (error) {
    console.error('Erro ao criar conexão WhatsApp:', error);
    throw error;
  }
}

// Rotas da API
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Listar conexões
app.get('/api/connections', (req, res) => {
  const connections = Array.from(activeConnections.values()).map(conn => ({
    id: conn.id,
    name: conn.name,
    connectionState: conn.connectionState,
    isConnected: conn.isConnected,
    qrCode: conn.qrCode,
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt
  }));
  
  res.json({
    success: true,
    data: connections
  });
});

// Criar nova conexão
app.post('/api/connections', async (req, res) => {
  try {
    const { connectionId, name } = req.body;
    
    if (!connectionId || !name) {
      return res.status(400).json({
        success: false,
        error: 'connectionId e name são obrigatórios'
      });
    }
    
    // Verificar se já existe
    if (activeConnections.has(connectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Conexão já existe'
      });
    }
    
    const connection = await createWhatsAppConnection(connectionId, name);
    
    res.json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        connectionState: connection.connectionState,
        isConnected: connection.isConnected,
        createdAt: connection.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conexão',
      details: error.message
    });
  }
});

// Obter QR Code
app.get('/api/connections/:connectionId/qr', (req, res) => {
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
      qrCode: connection.qrCode,
      connectionState: connection.connectionState,
      isConnected: connection.isConnected
    }
  });
});

// Deletar conexão
app.delete('/api/connections/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  const connection = activeConnections.get(connectionId);
  
  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Conexão não encontrada'
    });
  }
  
  // Fechar socket se existir
  if (connection.socket) {
    connection.socket.end();
  }
  
  activeConnections.delete(connectionId);
  
  res.json({
    success: true,
    message: 'Conexão deletada com sucesso'
  });
});

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('join-connection', (connectionId) => {
    socket.join(`connection:${connectionId}`);
    console.log(`Cliente ${socket.id} entrou na sala da conexão ${connectionId}`);
  });
  
  socket.on('leave-connection', (connectionId) => {
    socket.leave(`connection:${connectionId}`);
    console.log(`Cliente ${socket.id} saiu da sala da conexão ${connectionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('🚀 Servidor QR Code iniciado!');
  console.log(`🌐 Rodando na porta ${PORT}`);
  console.log(`📱 Endpoint: http://localhost:${PORT}/api/connections`);
  console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
});
