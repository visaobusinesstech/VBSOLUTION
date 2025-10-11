import { CatalogItem, StepKind } from '@/types/workflow';

export const WORKFLOW_CATALOG: CatalogItem[] = [
  // Sistema - Trigger
  {
    kind: 'trigger',
    title: 'Trigger',
    icon: '⚡',
    group: 'System',
    description: 'Inicia o workflow',
    fields: [
      {
        key: 'type',
        type: 'select',
        label: 'Tipo de Trigger',
        required: true,
        options: [
          'conversation_opened',
          'conversation_closed',
          'contact_created',
          'lead_assigned',
          'deal_updated',
          'message_received',
          'webhook_called',
          'schedule'
        ]
      },
      {
        key: 'webhook_path',
        type: 'text',
        label: 'Caminho do Webhook',
        placeholder: '/webhook/meu-trigger',
        required: false
      },
      {
        key: 'schedule_expression',
        type: 'text',
        label: 'Expressão de Agendamento',
        placeholder: '0 9 * * 1',
        required: false
      }
    ]
  },

  // Sistema - Delay/Sleep
  {
    kind: 'sleep',
    title: 'Aguardar',
    icon: '⏳',
    group: 'System',
    description: 'Pausar execução por tempo definido',
    fields: [
      {
        key: 'duration',
        type: 'number',
        label: 'Duração (segundos)',
        required: true
      }
    ]
  },

  // Mensagens - WhatsApp
  {
    kind: 'send_message',
    title: 'Enviar Mensagem WhatsApp',
    icon: '💬',
    group: 'Messaging',
    description: 'Enviar mensagem no WhatsApp',
    fields: [
      {
        key: 'connectionId',
        type: 'select',
        label: 'Conexão WhatsApp',
        required: true,
        placeholder: 'Selecione conexão'
      },
      {
        key: 'phone',
        type: 'text',
        label: 'Número de telefone',
        required: true,
        placeholder: '+5511999999999'
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Mensagem',
        required: true,
        placeholder: 'Digite sua mensagem aqui...'
      },
      {
        key: 'mediaUrl',
        type: 'text',
        label: 'URL da Mídia (opcional)',
        required: false,
        placeholder: 'https://exemplo.com/imagem.jpg'
      }
    ]
  },

  // Mensagens - Telegram
  {
    kind: 'telegram_message',
    title: 'Enviar Mensagem Telegram',
    icon: '📱',
    group: 'Messaging',
    description: 'Enviar mensagem no Telegram',
    fields: [
      {
        key: 'bot_token',
        type: 'text',
        label: 'Token do Bot',
        required: true
      },
      {
        key: 'chat_id',
        type: 'text',
        label: 'Chat ID',
        required: true
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Mensagem',
        required: true
      }
    ]
  },

  // Mensagens - Instagram
  {
    kind: 'instagram_message',
    title: 'Enviar Mensagem Instagram',
    icon: '📷',
    group: 'SocialMedia',
    description: 'Enviar mensagem no Instagram',
    fields: [
      {
        key: 'access_token',
        type: 'text',
        label: 'Access Token',
        required: true
      },
      {
        key: 'recipient',
        type: 'text',
        label: 'Usuário destinatário',
        required: true
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Mensagem',
        required: true
      }
    ]
  },

  // Mensagens - Facebook
  {
    kind: 'facebook_message',
    title: 'Enviar Mensagem Facebook',
    icon: '👥',
    group: 'SocialMedia',
    description: 'Enviar mensagem no Facebook',
    fields: [
      {
        key: 'page_token',
        type: 'text',
        label: 'Page Access Token',
        required: true
      },
      {
        key: 'recipient_id',
        type: 'text',
        label: 'ID do destinatário',
        required: true
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Mensagem',
        required: true
      }
    ]
  },

  // Mensagens - TikTok
  {
    kind: 'tiktok_message',
    title: 'Enviar Mensagem TikTok',
    icon: '🎵',
    group: 'SocialMedia',
    description: 'Enviar mensagem no TikTok',
    fields: [
      {
        key: 'client_key',
        type: 'text',
        label: 'Client Key',
        required: true
      },
      {
        key: 'user_id',
        type: 'text',
        label: 'User ID',
        required: true
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Mensagem',
        required: true
      }
    ]
  },

  // E-mail
  {
    kind: 'send_email',
    title: 'Enviar Email',
    icon: '📧',
    group: 'Email',
    description: 'Enviar e-mail',
    fields: [
      {
        key: 'to',
        type: 'text',
        label: 'Para',
        required: true,
        placeholder: 'exemplo@email.com'
      },
      {
        key: 'subject',
        type: 'text',
        label: 'Assunto',
        required: true
      },
      {
        key: 'body',
        type: 'textarea',
        label: 'Corpo do e-mail',
        required: true
      },
      {
        key: 'isHtml',
        type: 'boolean',
        label: 'É HTML',
        required: false
      }
    ]
  },

  // Contatos
  {
    kind: 'create_contact',
    title: 'Criar Contato',
    icon: '👤',
    group: 'System',
    description: 'Criar novo contato',
    fields: [
      {
        key: 'name',
        type: 'text',
        label: 'Nome',
        required: true
      },
      {
        key: 'phone',
        type: 'text',
        label: 'Telefone',
        required: false
      },
      {
        key: 'email',
        type: 'text',
        label: 'E-mail',
        required: false
      },
      {
        key: 'company',
        type: 'text',
        label: 'Empresa',
        required: false
      },
      {
        key: 'notes',
        type: 'textarea',
        label: 'Notas',
        required: false
      }
    ]
  },

  {
    kind: 'update_contact',
    title: 'Atualizar Contato',
    icon: '✏️',
    group: 'System',
    description: 'Atualizar contato existente',
    fields: [
      {
        key: 'contact_id',
        type: 'text',
        label: 'ID do Contato',
        required: true
      },
      {
        key: 'name',
        type: 'text',
        label: 'Nome',
        required: false
      },
      {
        key: 'phone',
        type: 'text',
        label: 'Telefone',
        required: false
      },
      {
        key: 'email',
        type: 'text',
        label: 'E-mail',
        required: false
      },
      {
        key: 'company',
        type: 'text',
        label: 'Empresa',
        required: false
      }
    ]
  },

  // Empresas
  {
    kind: 'update_company',
    title: 'Atualizar Empresa',
    icon: '🏢',
    group: 'System',
    description: 'Atualizar dados da empresa',
    fields: [
      {
        key: 'company_id',
        type: 'text',
        label: 'ID da Empresa',
        required: true
      },
      {
        key: 'name',
        type: 'text',
        label: 'Nome',
        required: false
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Descrição',
        required: false
      },
      {
        key: 'website',
        type: 'text',
        label: 'Website',
        required: false
      }
    ]
  },

  // HTTP Request
  {
    kind: 'http_request',
    title: 'Requisição HTTP',
    icon: '🌐',
    group: 'HTTP',
    description: 'Fazer requisição HTTP',
    fields: [
      {
        key: 'method',
        type: 'select',
        label: 'Método',
        required: true,
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      {
        key: 'url',
        type: 'text',
        label: 'URL',
        required: true,
        placeholder: 'https://api.exemplo.com'
      },
      {
        key: 'headers',
        type: 'textarea',
        label: 'Headers (JSON)',
        required: false,
        placeholder: '{"Authorization": "Bearer token"}'
      },
      {
        key: 'body',
        type: 'textarea',
        label: 'Body (JSON)',
        required: false
      }
    ]
  },

  // Webhook Wait
  {
    kind: 'webhook_wait',
    title: 'Aguardar Webhook',
    icon: '🪝',
    group: 'Webhooks',
    description: 'Pausar até receber webhook',
    fields: [
      {
        key: 'timeout',
        type: 'number',
        label: 'Timeout (segundos)',
        required: false,
        placeholder: '300'
      }
    ]
  },

  // Branch/Condicionais
  {
    kind: 'branch',
    title: 'Condicional',
    icon: '🔀',
    group: 'Utilities',
    description: 'Executar comando baseado em condição',
    fields: [
      {
        key: 'condition_field',
        type: 'text',
        label: 'Campo da Condição',
        required: true,
        placeholder: 'user.status'
      },
      {
        key: 'operator',
        type: 'select',
        label: 'Operador',
        required: true,
        options: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than']
      },
      {
        key: 'condition_value',
        type: 'text',
        label: 'Valor de Comparação',
        required: true
      }
    ]
  },

  // Delay
  {
    kind: 'delay',
    title: 'Atraso Personalizado',
    icon: '⏰',
    group: 'Utilities',
    description: 'Aguardar tempo específico',
    fields: [
      {
        key: 'hours',
        type: 'number',
        label: 'Horas',
        required: false,
        placeholder: '0'
      },
      {
        key: 'minutes',
        type: 'number',
        label: 'Minutos',
        required: false,
        placeholder: '5'
      },
      {
        key: 'seconds',
        type: 'number',
        label: 'Segundos',
        required: false,
        placeholder: '30'
      }
    ]
  },

  // AI Agent
  {
    kind: 'ai_agent',
    title: 'Agente IA',
    icon: '🤖',
    group: 'AI',
    description: 'Usar IA para processar e responder',
    fields: [
      {
        key: 'model',
        type: 'select',
        label: 'Modelo',
        required: true,
        options: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
        placeholder: 'gpt-4o-mini'
      },
      {
        key: 'system_prompt',
        type: 'textarea',
        label: 'Instruções do Sistema',
        required: false,
        placeholder: 'Você é um assistente especializado...'
      },
      {
        key: 'user_message',
        type: 'textarea',
        label: 'Mensagem do Usuário',
        required: true
      },
      {
        key: 'max_tokens',
        type: 'number',
        label: 'Máximo de tokens',
        required: false,
        placeholder: '1000'
      }
    ]
  },

  // Google Calendar
  {
    kind: 'calendar_event',
    title: 'Evento do Google Calendar',
    icon: '📅',
    group: 'Google',
    description: 'Criar evento no calendário',
    fields: [
      {
        key: 'title',
        type: 'text',
        label: 'Título do Evento',
        required: true
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Descrição',
        required: false
      },
      {
        key: 'start_datetime',
        type: 'text',
        label: 'Data/Hora de Início',
        required: true,
        placeholder: '2024-01-15T10:00:00'
      },
      {
        key: 'end_datetime',
        type: 'text',
        label: 'Data/Hora de Fim',
        required: true,
        placeholder: '2024-01-15T11:00:00'
      },
      {
        key: 'attendees',
        type: 'text',
        label: 'Participantes (emails separados por vírgula)',
        required: false,
        placeholder: 'user1@email.com,user2@email.com'
      }
    ]
  },

  // Google Sheets
  {
    kind: 'google_sheets',
    title: 'Google Sheets',
    icon: '📊',
    group: 'Google',
    description: 'Trabalhar com planilhas',
    fields: [
      {
        key: 'action',
        type: 'select',
        label: 'Ação',
        required: true,
        options: ['append', 'update', 'read']
      },
      {
        key: 'spreadsheet_id',
        type: 'text',
        label: 'ID da Planilha',
        required: true
      },
      {
        key: 'sheet_name',
        type: 'text',
        label: 'Nome da Aba',
        required: true,
        placeholder: 'Sheet1'
      },
      {
        key: 'data',
        type: 'textarea',
        label: 'Dados (JSON array)',
        required: false,
        placeholder: '[["Nome", "Email"], ["João", "joao@email.com"]]'
      }
    ]
  },

  // Agregador
  {
    kind: 'aggregator',
    title: 'Agregador de Dados',
    icon: '📋',
    group: 'Utilities',
    description: 'Agrupar ou processar múltiplos dados',
    fields: [
      {
        key: 'operation',
        type: 'select',
        label: 'Operação',
        required: true,
        options: ['sum', 'average', 'count', 'min', 'max', 'concatenate']
      },
      {
        key: 'source_fields',
        type: 'text',
        label: 'Campos Fonte (separados por vírgula)',
        required: true,
        placeholder: 'value1, value2, value3'
      },
      {
        key: 'result_field',
        type: 'text',
        label: 'Campo de Resultado',
        required: true,
        placeholder: 'total'
      }
    ]
  }
];

export const CATALOG_BY_GROUP = WORKFLOW_CATALOG.reduce((acc, item) => {
  if (!acc[item.group]) {
    acc[item.group] = [];
  }
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, CatalogItem[]>);

export const getStepsByGroup = (group: string): CatalogItem[] => {
  return CATALOG_BY_GROUP[group] || [];
};

export const findStepByKind = (kind: StepKind): CatalogItem | undefined => {
  return WORKFLOW_CATALOG.find(step => step.kind === kind);
};
