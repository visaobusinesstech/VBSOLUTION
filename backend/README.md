# 📱 WhatsApp Backend - VBSolution

Backend completo para sistema de atendimento via WhatsApp, integrado ao Venom-Bot com roteamento inteligente e Socket.IO para comunicação em tempo real.

## 🚀 Funcionalidades

- **WhatsApp Integration**: Conexão via Venom-Bot com suporte a múltiplas sessões
- **Roteamento Inteligente**: Sistema de robô que direciona clientes automaticamente
- **Chat em Tempo Real**: Socket.IO para atualizações instantâneas
- **Upload de Mídia**: Suporte a imagens, documentos, áudio e vídeo
- **API RESTful**: Endpoints completos para todas as operações
- **Autenticação**: Middleware de autenticação com Bearer Token
- **Logging**: Sistema de logs com Winston
- **Validação**: Validação de dados com Zod
- **Banco de Dados**: Prisma ORM com MySQL

## 🛠️ Stack Tecnológica

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL + Prisma
- **WhatsApp**: Venom-Bot
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Upload**: Multer
- **Logging**: Winston
- **Authentication**: Bearer Token

## 📋 Pré-requisitos

- Node.js 20+
- MySQL 8.0+
- npm ou yarn

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp env.example .env
```

Configure as variáveis no `.env`:

```env
NODE_ENV=development
PORT=3000
WEB_ORIGIN=http://localhost:5173

# Auth simples
API_BEARER=VB_DEV_TOKEN

# Prisma
DATABASE_URL="mysql://root:root@localhost:3306/vbsolution"

# Venom
VENOM_MULTI_DEVICE=true
VENOM_SESSION_DIR=./sessions

# Uploads
UPLOAD_DIR=./uploads

# Logs
LOG_LEVEL=info
```

### 3. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

### 4. Criar Diretórios Necessários

```bash
mkdir -p sessions uploads logs
```

## 🚀 Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## 📚 API Endpoints

### WhatsApp

- `POST /api/whatsapp/start-session` - Inicia sessão
- `GET /api/whatsapp/status` - Status da sessão
- `GET /api/whatsapp/qr-code` - QR Code para conexão
- `POST /api/whatsapp/close-session` - Finaliza sessão
- `POST /api/whatsapp/send-test` - Envia mensagem de teste

### Atendimento

- `GET /api/atendimento/ativos` - Lista atendimentos ativos
- `GET /api/atendimento/:id` - Detalhes do atendimento
- `POST /api/atendimento/:id/responder` - Responde atendimento
- `POST /api/atendimento/:id/finalizar` - Finaliza atendimento
- `POST /api/atendimento/:id/criar-tarefa` - Cria tarefa (placeholder)
- `POST /api/atendimento/:id/agendar` - Agenda atendimento (placeholder)

### Configuração

- `GET /api/config/atendimento` - Configuração atual
- `PUT /api/config/atendimento` - Atualiza configuração
- `GET /api/config/opcoes` - Lista opções de atendimento
- `GET /api/config/stats` - Estatísticas da configuração

### Mídia

- `POST /api/media/upload` - Upload de arquivo
- `GET /api/media/file/:fileId` - Informações do arquivo
- `DELETE /api/media/file/:fileId` - Remove arquivo
- `GET /api/media/stats` - Estatísticas de uploads

## 🔌 Socket.IO Events

### Cliente → Servidor

- `chat:subscribe` - Inscreve em um atendimento
- `chat:typing` - Indica digitação
- `chat:read` - Marca mensagens como lidas
- `chat:presence` - Status de presença

### Servidor → Cliente

- `chat:qr` - QR Code para conexão
- `chat:session_status` - Status da sessão
- `chat:message_in` - Nova mensagem recebida
- `chat:subscribed` - Confirmação de inscrição

## 🗄️ Estrutura do Banco

### Tabelas Principais

- **Atendimento**: Controle de atendimentos
- **Mensagem**: Histórico de mensagens
- **ConfiguracaoAtendimento**: Configuração do robô
- **OpcaoAtendimento**: Opções de roteamento

### Enums

- **AtendimentoStatus**: NOVO, EM_ATENDIMENTO, FINALIZADO
- **Remetente**: CLIENTE, ATENDENTE, ROBO
- **TipoMensagem**: TEXT, IMAGE, AUDIO, DOCUMENT, etc.

## 🔐 Autenticação

Todas as rotas da API e Socket.IO requerem autenticação via Bearer Token:

```
Authorization: Bearer VB_DEV_TOKEN
```

## 📁 Estrutura de Arquivos

```
src/
├── controllers/          # Controladores da API
├── middlewares/          # Middlewares (auth, error, upload)
├── routes/              # Definição de rotas
├── services/            # Lógica de negócio
├── sockets/             # Configuração Socket.IO
├── types/               # Tipos TypeScript
├── app.ts               # Aplicação Express
├── server.ts            # Servidor principal
├── env.ts               # Configuração de ambiente
└── logger.ts            # Sistema de logging
```

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Cobertura de testes
npm run test:coverage
```

## 📊 Monitoramento

- **Health Check**: `GET /health`
- **API Docs**: `GET /api/docs`
- **Logs**: Arquivos em `./logs/`
- **Prisma Studio**: `npm run prisma:studio`

## 🚨 Troubleshooting

### Erro de Conexão MySQL
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `mysql -u root -p`

### Erro Venom-Bot
- Verifique se o Chrome/Chromium está instalado
- Confirme as permissões do diretório `sessions/`
- Verifique logs para detalhes do erro

### Erro de Upload
- Confirme permissões do diretório `uploads/`
- Verifique limite de tamanho (25MB)
- Confirme tipos de arquivo permitidos

## 🔄 Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Compila TypeScript
- `npm run start` - Executa versão compilada
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre interface do banco

### Estrutura de Desenvolvimento

1. **Services**: Lógica de negócio principal
2. **Controllers**: Tratamento de requisições HTTP
3. **Routes**: Definição de endpoints
4. **Middlewares**: Validação, auth, tratamento de erros
5. **Types**: Interfaces e tipos TypeScript

## 📝 Logs

Os logs são salvos em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros
- Console - Em desenvolvimento

## 🔗 Integração VBsolution

O sistema está preparado para integração com:
- Sistema de usuários/atendentes
- Sistema de tarefas
- Sistema de agendamento
- Sistema de clientes

## 📄 Licença

MIT License - VBSolution

## 🆘 Suporte

Para suporte técnico, consulte a documentação ou entre em contato com a equipe de desenvolvimento.
