# 📱 WhatsApp Frontend - VBSolution

Frontend React para sistema de atendimento via WhatsApp, com interface moderna e funcionalidades completas de chat em tempo real.

## 🚀 Funcionalidades

- **Chat em Tempo Real**: Socket.IO para mensagens instantâneas
- **Interface Moderna**: Design responsivo com Tailwind CSS
- **Gerenciamento de Estado**: Zustand para estado global
- **Validação de Formulários**: React Hook Form + Zod
- **Upload de Mídia**: Suporte a arquivos e imagens
- **Roteamento**: React Router para navegação
- **TypeScript**: Tipagem completa para melhor desenvolvimento

## 🛠️ Stack Tecnológica

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM
- **Real-time**: Socket.IO Client
- **Icons**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend WhatsApp rodando

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
VITE_API_BASE_URL=http://localhost:3000
VITE_API_BEARER=VB_DEV_TOKEN
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

## 🚀 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build
- `npm run lint` - Linting do código

## 📁 Estrutura de Arquivos

```
src/
├── components/          # Componentes React
│   ├── ChatLayout.tsx      # Layout principal do chat
│   ├── ConversationList.tsx # Lista de conversas
│   ├── ChatWindow.tsx      # Janela de chat
│   ├── MessageBubble.tsx   # Bolha de mensagem
│   ├── MessageComposer.tsx # Compositor de mensagens
│   ├── RightPanel.tsx      # Painel direito
│   ├── QrModal.tsx         # Modal do QR Code
│   ├── RobotConfigForm.tsx # Formulário de configuração
│   └── MediaPreview.tsx    # Preview de mídia
├── pages/               # Páginas da aplicação
│   ├── AtendimentoPage.tsx # Página de atendimentos
│   └── ConfigPage.tsx      # Página de configuração
├── store/               # Gerenciamento de estado
│   └── useChatStore.ts     # Store do chat
├── lib/                 # Utilitários e configurações
│   ├── api.ts              # Cliente da API
│   └── socket.ts           # Cliente Socket.IO
├── types/                # Tipos TypeScript
│   └── index.ts            # Tipos principais
├── App.tsx               # Componente principal
├── main.tsx              # Ponto de entrada
└── index.css             # Estilos globais
```

## 🎨 Componentes Principais

### ChatLayout
Layout principal que organiza a interface em três colunas:
- **Left**: Lista de conversas
- **Center**: Janela de chat
- **Right**: Painel de informações e ações

### ConversationList
Lista de atendimentos ativos com:
- Filtros por status (Novo, Em atendimento, Todos)
- Busca por número/nome
- Indicador de última mensagem
- Badge de mensagens não lidas

### ChatWindow
Janela principal do chat com:
- Histórico de mensagens
- Suporte a diferentes tipos de mídia
- Indicador de digitação
- Scroll automático para novas mensagens

### MessageBubble
Bolhas de mensagem com:
- Diferenciação visual por remetente
- Suporte a texto, imagem, áudio, documento
- Timestamp e status de leitura
- Estilos diferentes para CLIENTE, ATENDENTE e ROBO

### MessageComposer
Compositor de mensagens com:
- Campo de texto
- Upload de arquivos
- Botão de envio
- Indicador de digitação

### RightPanel
Painel direito com:
- Informações do cliente
- Botões de ação (Tarefa, Agendar, Perfil)
- Status do atendimento
- Responsável atual

## 🔌 Integração com Backend

### API Client
Cliente HTTP configurado para:
- Autenticação automática com Bearer Token
- Tratamento de erros centralizado
- Tipagem completa das respostas
- Interceptação de requisições

### Socket.IO Client
Cliente em tempo real para:
- Conexão automática ao inicializar
- Autenticação com token
- Inscrição em salas de atendimento
- Recebimento de mensagens instantâneas

## 📱 Funcionalidades do Chat

### Tipos de Mensagem Suportados
- **TEXT**: Mensagens de texto simples
- **IMAGE**: Imagens com preview
- **AUDIO**: Áudio com player nativo
- **DOCUMENT**: Documentos com download
- **STICKER**: Stickers do WhatsApp
- **LOCATION**: Localização compartilhada
- **CONTACT**: Contatos compartilhados

### Recursos Avançados
- **Upload de arquivos**: Drag & drop e seleção manual
- **Preview de mídia**: Visualização antes do envio
- **Histórico**: Paginação de mensagens antigas
- **Status de leitura**: Indicadores visuais
- **Digitação**: Indicador em tempo real

## 🎯 Páginas da Aplicação

### AtendimentoPage (`/atendimento`)
Página principal com:
- Layout completo do chat
- Integração com Socket.IO
- Gerenciamento de estado global
- Navegação entre atendimentos

### ConfigPage (`/config/atendimento`)
Página de configuração com:
- Formulário de mensagem padrão
- Configuração de opções de atendimento
- Validação com Zod
- Preview das configurações

## 🔄 Gerenciamento de Estado

### Zustand Store
Store centralizado para:
- **Atendimentos**: Lista e seleção
- **Mensagens**: Por atendimento
- **WhatsApp**: Status e QR Code
- **UI**: Loading e erros

### Hooks Customizados
- `useChatStore`: Estado global do chat
- `useSocket`: Conexão Socket.IO
- `useSocketEvents`: Eventos em tempo real

## 🎨 Sistema de Design

### Tailwind CSS
Framework de utilidades com:
- **Cores**: Paleta personalizada (primary, gray)
- **Componentes**: Classes utilitárias (.btn, .card, .input)
- **Animações**: Transições e keyframes customizados
- **Responsividade**: Breakpoints para mobile e desktop

### Componentes Reutilizáveis
- **Botões**: Primary, Secondary, Danger
- **Inputs**: Campos de texto e arquivo
- **Cards**: Containers com sombras
- **Chat Bubbles**: Bolhas de mensagem estilizadas

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptações
- Layout em coluna única para mobile
- Sidebar colapsível
- Touch-friendly para dispositivos móveis
- Otimizações de performance

## 🧪 Testes

### Estrutura de Testes
```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Cobertura
npm run test:coverage
```

### Componentes Testados
- Renderização de componentes
- Interações do usuário
- Integração com APIs
- Gerenciamento de estado

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Arquivos Gerados
- `dist/` - Arquivos otimizados
- `dist/index.html` - HTML principal
- `dist/assets/` - CSS e JS compilados

### Servidor de Preview
```bash
npm run preview
```

## 🔧 Configuração de Desenvolvimento

### Vite
- Hot Module Replacement (HMR)
- TypeScript support
- CSS preprocessing
- Asset optimization

### ESLint
- Regras para React
- TypeScript linting
- Prettier integration
- Auto-fix on save

### TypeScript
- Strict mode habilitado
- Path mapping
- Declaration files
- Source maps

## 📚 Documentação da API

### Endpoints Utilizados
- **WhatsApp**: `/api/whatsapp/*`
- **Atendimento**: `/api/atendimento/*`
- **Configuração**: `/api/config/*`
- **Mídia**: `/api/media/*`

### Autenticação
Todas as requisições incluem:
```typescript
headers: {
  'Authorization': `Bearer ${API_BEARER}`,
  'Content-Type': 'application/json'
}
```

## 🚨 Troubleshooting

### Problemas Comuns
- **CORS**: Verificar configuração do backend
- **Socket.IO**: Verificar conexão e autenticação
- **Upload**: Verificar tamanho e tipo de arquivo
- **Build**: Verificar dependências e TypeScript

### Debug
- Console do navegador
- React DevTools
- Network tab para APIs
- Socket.IO debug logs

## 🔗 Integração VBsolution

O frontend está preparado para:
- **Sistema de usuários**: Autenticação real
- **Permissões**: Controle de acesso
- **Temas**: Sistema de cores personalizável
- **Internacionalização**: Múltiplos idiomas

## 📄 Licença

MIT License - VBSolution

## 🆘 Suporte

Para suporte técnico:
1. Verificar documentação
2. Consultar logs do console
3. Verificar configurações
4. Contatar equipe de desenvolvimento
