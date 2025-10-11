// Conexões padrão do sistema
export const DEFAULT_CONNECTIONS = [
  // COMUNICAÇÃO
  {
    id: 'whatsapp-baileys',
    name: 'WhatsApp Web (Baileys)',
    description: 'Conectado via WhatsApp Web - Pronto para enviar e receber mensagens',
    categoryId: '1', // Comunicação
    connectionType: 'whatsapp',
    config: {
      service: 'baileys',
      features: ['send_message', 'receive_message', 'media_support']
    },
    isActive: true,
    isConnected: false
  },
  {
    id: 'webhook-connection',
    name: 'Conexão de Webhook',
    description: 'Receba eventos e envie mensagens através do seu endpoint',
    categoryId: '1', // Comunicação
    connectionType: 'webhook',
    config: {
      service: 'webhook',
      features: ['receive_events', 'send_messages']
    },
    isActive: true,
    isConnected: false
  },

  // INTEGRAÇÕES
  {
    id: 'google-integration',
    name: 'Google',
    description: 'Crie eventos no Calendar, gere reuniões no Meet, envie emails e gerencie arquivos no Drive',
    categoryId: '2', // Integrações
    connectionType: 'google',
    config: {
      service: 'google',
      features: ['calendar', 'meet', 'gmail', 'drive', 'sheets', 'docs']
    },
    isActive: true,
    isConnected: false
  },
  {
    id: 'facebook-integration',
    name: 'Facebook',
    description: 'Gerencie posts, comentários e insights das suas páginas do Facebook',
    categoryId: '2', // Integrações
    connectionType: 'facebook',
    config: {
      service: 'facebook',
      features: ['publish_posts', 'manage_comments', 'page_insights', 'manage_pages']
    },
    isActive: true,
    isConnected: false
  },
  {
    id: 'instagram-integration',
    name: 'Instagram',
    description: 'Gerencie mídia, comentários e estatísticas do seu perfil do Instagram',
    categoryId: '2', // Integrações
    connectionType: 'instagram',
    config: {
      service: 'instagram',
      features: ['manage_media', 'manage_comments', 'insights', 'stories']
    },
    isActive: true,
    isConnected: false
  },
  {
    id: 'microsoft-outlook',
    name: 'Microsoft Outlook',
    description: 'Integre com Outlook para emails e calendário',
    categoryId: '2', // Integrações
    connectionType: 'microsoft',
    config: {
      service: 'microsoft',
      features: ['send_emails', 'calendar_events', 'teams_meetings']
    },
    isActive: false,
    isConnected: false
  },
  {
    id: 'slack-workspace',
    name: 'Slack Workspace',
    description: 'Envie mensagens e notificações para canais do Slack',
    categoryId: '2', // Integrações
    connectionType: 'slack',
    config: {
      service: 'slack',
      features: ['send_messages', 'channel_notifications', 'bot_interactions']
    },
    isActive: false,
    isConnected: false
  },
  {
    id: 'discord-server',
    name: 'Discord Server',
    description: 'Integre com servidores do Discord para notificações',
    categoryId: '2', // Integrações
    connectionType: 'discord',
    config: {
      service: 'discord',
      features: ['send_messages', 'channel_notifications', 'bot_commands']
    },
    isActive: false,
    isConnected: false
  }
];

export const CONNECTION_CATEGORIES = [
  {
    id: '1',
    name: 'Canais',
    description: 'Canais de comunicação com clientes',
    icon: 'message-circle',
    color: '#3B82F6',
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Integrações',
    description: 'Aplicações de terceiros integradas',
    icon: 'zap',
    color: '#10B981',
    sortOrder: 2
  }
];

export default {
  DEFAULT_CONNECTIONS,
  CONNECTION_CATEGORIES
};
