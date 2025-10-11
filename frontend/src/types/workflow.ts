export type StepKind =
  | 'trigger'
  | 'send_message'
  | 'http_request'
  | 'webhook_wait'
  | 'branch'
  | 'update_contact'
  | 'ai_agent'
  | 'sleep'
  | 'aggregator'
  | 'create_contact'
  | 'update_company'
  | 'send_email'
  | 'calendar_event'
  | 'google_sheets'
  | 'slack_message'
  | 'telegram_message'
  | 'instagram_message'
  | 'facebook_message'
  | 'tiktok_message'
  | 'delay';

export interface Step {
  id: string;
  kind: StepKind;
  title: string;
  config: Record<string, any>;
}

export interface CatalogItem {
  kind: StepKind;
  title: string;
  icon: string;         
  group: 'System' | 'AI' | 'HTTP' | 'Messaging' | 'Utilities' | 'Webhooks' | 'SocialMedia' | 'Google' | 'Email';
  description?: string;
  fields?: StepField[];
}

export interface StepField {
  key: string;
  type: 'text' | 'select' | 'textarea' | 'number' | 'boolean' | 'array';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  validation?: (value: any) => string | null;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
  status: 'draft' | 'active' | 'paused';
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  logs: ExecutionLog[];
  data: Record<string, any>;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  stepId?: string;
  data?: any;
}

// Endpoints mapeados do nosso sistema
export interface SystemEndpoint {
  name: string;
  description: string;
  category: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  authRequired: boolean;
  parameters?: Record<string, any>;
}

// Triggres dinâmicos baseados no sistema
export type TriggerType = 
  | 'conversation_opened'
  | 'conversation_closed' 
  | 'contact_created'
  | 'lead_assigned'
  | 'deal_updated'
  | 'file_uploaded'
  | 'message_received'
  | 'webhook_called'
  | 'schedule'
  | 'api_call';

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface WorkflowTrigger {
  type: TriggerType;
  conditions?: TriggerCondition[];
  webhookPath?: string;
  schedule?: string;
}
