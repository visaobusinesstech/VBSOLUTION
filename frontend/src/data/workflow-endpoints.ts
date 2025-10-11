import { SystemEndpoint } from '@/types/workflow';

// Endpoints do backend disponíveis no sistema
export const SYSTEM_ENDPOINTS: SystemEndpoint[] = [
  // Contatos
  {
    name: 'Criar Contato',
    description: 'Criar novo contato no sistema',
    category: 'Contacts',
    method: 'POST',
    url: '/api/contacts',
    authRequired: true,
    parameters: {
      name: { required: true, type: 'string' },
      phone: { required: false, type: 'string' },
      email: { required: false, type: 'string' },
      company: { required: false, type: 'string' }
    }
  },
  {
    name: 'Atualizar Contato',
    description: 'Atualizar contato existente',
    category: 'Contacts',
    method: 'PUT',
    url: '/api/contacts/:id',
    authRequired: true,
    parameters: {
      id: { required: true, type: 'string' },
      name: { required: false, type: 'string' },
      phone: { required: false, type: 'string' },
      email: { required: false, type: 'string' }
    }
  },
  {
    name: 'Listar Contatos',
    description: 'Listar todos os contatos',
    category: 'Contacts',
    method: 'GET',
    url: '/api/contacts',
    authRequired: true,
    parameters: {}
  },
  
  // WhatsApp
  {
    name: 'Enviar Mensagem WhatsApp',
    description: 'Enviar mensagem para número WhatsApp',
    category: 'WhatsApp',
    method: 'POST',
    url: '/api/baileys-simple/connections/:connectionId/send-message',
    authRequired: true,
    parameters: {
      connectionId: { required: true, type: 'string' },
      chatId: { required: true, type: 'string' },
      text: { required: true, type: 'string' },
      type: { required: false, type: 'string', default: 'text' }
    }
  },
  {
    name: 'Listar Conversas WhatsApp',
    description: 'Listar conversas do WhatsApp',
    category: 'WhatsApp',
    method: 'GET',
    url: '/api/baileys-simple/test-conversations',
    authRequired: true,
    parameters: {
      ownerId: { required: true, type: 'string' }
    }
  },
  {
    name: 'Finalizar Conversa WhatsApp',
    description: 'Finalizar conversa no WhatsApp',
    category: 'WhatsApp',
    method: 'POST',
    url: '/api/baileys-simple/connections/:connectionId/finalizar-conversa',
    authRequired: true,
    parameters: {
      connectionId: { required: true, type: 'string' },
      chatId: { required: true, type: 'string' }
    }
  },

  // Empresas
  {
    name: 'Criar Empresa',
    description: 'Criar nova empresa',
    category: 'Companies',
    method: 'POST',
    url: '/api/companies',
    authRequired: true,
    parameters: {
      name: { required: true, type: 'string' },
      description: { required: false, type: 'string' },
      website: { required: false, type: 'string' }
    }
  },
  {
    name: 'Atualizar Empresa',
    description: 'Atualizar empresa existente',
    category: 'Companies',
    method: 'PUT',
    url: '/api/companies/:id',
    authRequired: true,
    parameters: {
      id: { required: true, type: 'string' },
      name: { required: false, type: 'string' },
      description: { required: false, type: 'string' }
    }
  },
  {
    name: 'Listar Empresas',
    description: 'Listar todas as empresas',
    category: 'Companies',
    method: 'GET',
    url: '/api/companies',
    authRequired: true,
    parameters: {}
  },

  // Leads e Vendas
  {
    name: 'Criar Lead',
    description: 'Criar novo lead',
    category: 'Sales',
    method: 'POST',
    url: '/api/leads',
    authRequired: true,
    parameters: {
      name: { required: true, type: 'string' },
      email: { required: false, type: 'string' },
      phone: { required: false, type: 'string' }
    }
  },
  {
    name: 'Atualizar Lead',
    description: 'Atualizar lead existente',
    category: 'Sales',
    method: 'PUT',
    url: '/api/leads/:id',
    authRequired: true,
    parameters: {
      id: { required: true, type: 'string' }
    }
  },

  // Projetos
  {
    name: 'Criar Projeto',
    description: 'Criar novo projeto',
    category: 'Projects',
    method: 'POST',
    url: '/api/projects',
    authRequired: true,
    parameters: {
      name: { required: true, type: 'string' },
      description: { required: false, type: 'string' },
      status: { required: false, type: 'string', default: 'pending' }
    }
  },
  {
    name: 'Atualizar Projeto',
    description: 'Atualizar projeto existente',
    category: 'Projects',
    method: 'PUT',
    url: '/api/projects/:id',
    authRequired: true,
    parameters: {
      id: { required: true, type: 'string' }
    }
  },

  // IA Agent
  {
    name: 'Processar Texto com IA',
    description: 'Processar texto usando GPT',
    category: 'AI',
    method: 'POST',
    url: '/api/ai/process-text',
    authRequired: true,
    parameters: {
      prompt: { required: true, type: 'string' },
      model: { required: false, type: 'string', default: 'gpt-4o-mini' }
    }
  },
  {
    name: 'Verificar API Key',
    description: 'Verificar validade da API Key',
    category: 'AI',
    method: 'POST',
    url: '/api/ai/check-api-key',
    authRequired: true,
    parameters: {
      apiKey: { required: true, type: 'string' }
    }
  },

  // Webhooks
  {
    name: 'Aguardar Webhook',
    description: 'Pausar execução aguardando webhook',
    category: 'Webhooks',
    method: 'GET',
    url: '/api/webhooks/:webhookId',
    authRequired: true,
    parameters: {
      webhookId: { required: true, type: 'string' }
    }
  },

  // E-mails (futuras implementações)
  {
    name: 'Enviar Email',
    description: 'Enviar e-mail',
    category: 'Email',
    method: 'POST',
    url: '/api/emails/send',
    authRequired: true,
    parameters: {
      to: { required: true, type: 'string' },
      subject: { required: true, type: 'string' },
      body: { required: true, type: 'string' }
    }
  },

  // Google Calendar (futuras implementações)
  {
    name: 'Criar Evento Google Calendar',
    description: 'Criar evento no Google Calendar',
    category: 'Google',
    method: 'POST',
    url: '/api/google/calendar/events',
    authRequired: true,
    parameters: {
      title: { required: true, type: 'string' },
      start: { required: true, type: 'string' },
      end: { required: true, type: 'string' }
    }
  },

  // Google Sheets (futuras implementações)
  {
    name: 'Adicionar Linha Google Sheets',
    description: 'Adicionar linha ao Google Sheets',
    category: 'Google',
    method: 'POST',
    url: '/api/google/sheets/rows',
    authRequired: true,
    parameters: {
      spreadsheetId: { required: true, type: 'string' },
      values: { required: true, type: 'array' }
    }
  }
];

export const SORTED_ENDPOINTS_BY_CATEGORY = SYSTEM_ENDPOINTS.reduce((acc, endpoint) => {
  if (!acc[endpoint.category]) {
    acc[endpoint.category] = [];
  }
  acc[endpoint.category].push(endpoint);
  return acc;
}, {} as Record<string, SystemEndpoint[]>);

// Função para obter endpoints por categoria
export const getEndpointsByCategory = (category: string): SystemEndpoint[] => {
  return SORTED_ENDPOINTS_BY_CATEGORY[category] || [];
};

// Função para buscar endpoint por nome
export const findEndpointByName = (name: string): SystemEndpoint | undefined => {
  return SYSTEM_ENDPOINTS.find(endpoint => endpoint.name.toLowerCase() === name.toLowerCase());
};
