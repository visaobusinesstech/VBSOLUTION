export interface AIAgentVariable {
  id: string;
  ai_agent_config_id: string;
  owner_id: string;
  name: string;
  key: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'select' | 'json';
  description?: string;
  is_system_variable: boolean;
  default_value?: string;
  options?: any[];
  validation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateAIAgentVariableData {
  name: string;
  key: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'select' | 'json';
  description?: string;
  is_system_variable?: boolean;
  default_value?: string;
  options?: any[];
  validation_rules?: Record<string, any>;
}

export interface UpdateAIAgentVariableData extends Partial<CreateAIAgentVariableData> {
  id: string;
}

export const VARIABLE_TYPES = [
  { value: 'string', label: 'Texto', description: 'Texto simples' },
  { value: 'number', label: 'Número', description: 'Número inteiro ou decimal' },
  { value: 'boolean', label: 'Sim/Não', description: 'Verdadeiro ou falso' },
  { value: 'date', label: 'Data', description: 'Data e hora' },
  { value: 'email', label: 'Email', description: 'Endereço de email' },
  { value: 'phone', label: 'Telefone', description: 'Número de telefone' },
  { value: 'url', label: 'URL', description: 'Link/URL' },
  { value: 'select', label: 'Seleção', description: 'Lista de opções' },
  { value: 'json', label: 'JSON', description: 'Dados estruturados' }
] as const;
