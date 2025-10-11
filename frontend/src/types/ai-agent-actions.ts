// Tipos para a tabela ai_agent_actions

export interface AIAgentAction {
  id: string;
  ai_agent_config_id: string;
  owner_id: string;
  
  // Informações básicas do estágio
  name: string;
  condition: string;
  instruction_prompt?: string;
  
  // Dados para coleta
  collect_data: string[];
  
  // Ação a ser executada
  action?: string;
  action_config?: Record<string, any>;
  
  // Instruções finais
  final_instructions?: string;
  
  // Configurações de follow-up
  follow_up_timeout: number; // em minutos, 0 = sem timeout
  follow_up_action: 'none' | 'transfer' | 'close' | 'restart';
  
  // Status e controle
  is_active: boolean;
  execution_order: number;
  
  // Referências opcionais
  contact_id?: string;
  conversation_id?: string;
  target_team_id?: string;
  target_user_id?: string;
  
  // Configurações avançadas
  integration_config?: Record<string, any>;
  custom_variables?: Record<string, any>;
  chunking_config?: {
    enabled: boolean;
    max_chunk_size: number;
    debounce_time: number;
    delay_between_chunks: number;
  };
  validation_rules?: Record<string, any>;
  
  // Histórico e métricas
  execution_history?: ExecutionLog[];
  performance_metrics?: {
    execution_count: number;
    success_rate: number;
    average_response_time: number;
    last_executed_at?: string;
  };
  
  // Metadados
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ExecutionLog {
  timestamp: string;
  contact_id?: string;
  conversation_id?: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  success: boolean;
  error_message?: string;
}

export interface ChunkingConfig {
  enabled: boolean;
  max_chunk_size: number;
  debounce_time: number;
  delay_between_chunks: number;
}

export interface PerformanceMetrics {
  execution_count: number;
  success_rate: number;
  average_response_time: number;
  last_executed_at?: string;
}

// Tipos para ações específicas
export type ActionType = 
  | 'call_api'
  | 'send_file'
  | 'google_calendar'
  | 'transfer_human'
  | 'update_contact'
  | 'close_conversation'
  | 'send_message'
  | 'schedule_meeting'
  | 'none';

export type FollowUpAction = 'none' | 'transfer' | 'close' | 'restart';

// Interface para criar/atualizar ações
export interface CreateAIAgentActionRequest {
  ai_agent_config_id: string;
  name: string;
  condition: string;
  instruction_prompt?: string;
  collect_data?: string[];
  action?: ActionType;
  action_config?: Record<string, any>;
  final_instructions?: string;
  follow_up_timeout?: number;
  follow_up_action?: FollowUpAction;
  is_active?: boolean;
  execution_order?: number;
  contact_id?: string;
  conversation_id?: string;
  target_team_id?: string;
  target_user_id?: string;
  integration_config?: Record<string, any>;
  custom_variables?: Record<string, any>;
  chunking_config?: ChunkingConfig;
  validation_rules?: Record<string, any>;
}

export interface UpdateAIAgentActionRequest extends Partial<CreateAIAgentActionRequest> {
  id: string;
}

// Interface para resposta da API
export interface AIAgentActionResponse {
  success: boolean;
  data?: AIAgentAction;
  error?: string;
}

export interface AIAgentActionsListResponse {
  success: boolean;
  data?: AIAgentAction[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Interface para filtros de busca
export interface AIAgentActionFilters {
  ai_agent_config_id?: string;
  owner_id?: string;
  is_active?: boolean;
  action?: ActionType;
  contact_id?: string;
  conversation_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'execution_order';
  sort_order?: 'asc' | 'desc';
}

// Interface para estatísticas
export interface AIAgentActionStats {
  total_actions: number;
  active_actions: number;
  inactive_actions: number;
  total_executions: number;
  average_success_rate: number;
  most_used_action: ActionType;
  recent_executions: ExecutionLog[];
}

// Constantes para ações
export const ACTION_TYPES: Record<ActionType, string> = {
  call_api: 'Chamar uma API',
  send_file: 'Enviar arquivos',
  google_calendar: 'Conectar calendário',
  transfer_human: 'Passar para um humano',
  update_contact: 'Atualizar contato',
  close_conversation: 'Fechar conversa',
  send_message: 'Enviar mensagem',
  schedule_meeting: 'Agendar reunião',
  none: 'Nenhuma ação'
};

export const FOLLOW_UP_ACTIONS: Record<FollowUpAction, string> = {
  none: 'Nenhum',
  transfer: 'Transferir para humano',
  close: 'Fechar conversa',
  restart: 'Reiniciar funil'
};

// Configurações padrão
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  enabled: true,
  max_chunk_size: 200,
  debounce_time: 30000,
  delay_between_chunks: 1000
};

export const DEFAULT_PERFORMANCE_METRICS: PerformanceMetrics = {
  execution_count: 0,
  success_rate: 0.0,
  average_response_time: 0,
  last_executed_at: undefined
};
