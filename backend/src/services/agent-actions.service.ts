import { supabase } from '../supabaseClient';

export interface AgentVariable {
  id: string;
  name: string;
  key: string;
  dataType: 'string' | 'phone' | 'email' | 'number' | 'date' | 'boolean' | 'select';
  isRequired: boolean;
  isSystemVariable: boolean;
  description?: string;
  placeholder?: string;
  validationRules: any;
  options: any[];
  sourceTable?: string;
  sourceColumn?: string;
}

export interface ConversationFunnel {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerKeywords: string[];
  maxSteps: number;
  timeoutMinutes: number;
  fallbackMessage: string;
  steps: FunnelStep[];
}

export interface FunnelStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  stepType: 'collect_variable' | 'show_message' | 'execute_action' | 'conditional' | 'wait';
  messageTemplate?: string;
  variableId?: string;
  conditions: any[];
  actions: any[];
  nextStepId?: string;
  validationRules: any;
  retryAttempts: number;
  timeoutSeconds: number;
}

export interface AgentAction {
  id: string;
  name: string;
  description?: string;
  actionType: 'email' | 'calendar' | 'meeting' | 'webhook' | 'database' | 'notification';
  config: any;
  isActive: boolean;
  connectionId?: string;
  requiresAuth: boolean;
}

export interface ActionExecution {
  id: string;
  actionId: string;
  funnelId?: string;
  stepId?: string;
  chatId: string;
  ownerId: string;
  variablesData: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result: any;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export class AgentActionsService {
  /**
   * Obter todas as variáveis disponíveis
   */
  async getVariables(ownerId: string, companyId?: string): Promise<AgentVariable[]> {
    try {
      let query = supabase
        .from('agent_variables')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name');

      if (companyId) {
        query = query.or(`company_id.is.null,company_id.eq.${companyId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar variáveis:', error);
        return [];
      }

      return data.map(this.mapVariable);
    } catch (error) {
      console.error('❌ Erro no serviço de variáveis:', error);
      return [];
    }
  }

  /**
   * Criar nova variável
   */
  async createVariable(ownerId: string, variableData: Partial<AgentVariable>): Promise<AgentVariable | null> {
    try {
      const { data, error } = await supabase
        .from('agent_variables')
        .insert([{
          owner_id: ownerId,
          name: variableData.name,
          key: variableData.key,
          data_type: variableData.dataType,
          is_required: variableData.isRequired || false,
          is_system_variable: variableData.isSystemVariable || false,
          description: variableData.description,
          placeholder: variableData.placeholder,
          validation_rules: variableData.validationRules || {},
          options: variableData.options || [],
          source_table: variableData.sourceTable,
          source_column: variableData.sourceColumn
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar variável:', error);
        return null;
      }

      return this.mapVariable(data);
    } catch (error) {
      console.error('❌ Erro ao criar variável:', error);
      return null;
    }
  }

  /**
   * Obter todos os funis conversacionais
   */
  async getFunnels(ownerId: string, companyId?: string): Promise<ConversationFunnel[]> {
    try {
      let query = supabase
        .from('conversation_funnels')
        .select(`
          *,
          steps:funnel_steps(*)
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.or(`company_id.is.null,company_id.eq.${companyId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar funis:', error);
        return [];
      }

      return data.map(this.mapFunnel);
    } catch (error) {
      console.error('❌ Erro no serviço de funis:', error);
      return [];
    }
  }

  /**
   * Criar novo funil conversacional
   */
  async createFunnel(ownerId: string, funnelData: Partial<ConversationFunnel>): Promise<ConversationFunnel | null> {
    try {
      const { data, error } = await supabase
        .from('conversation_funnels')
        .insert([{
          owner_id: ownerId,
          name: funnelData.name,
          description: funnelData.description,
          is_active: funnelData.isActive !== false,
          trigger_keywords: funnelData.triggerKeywords || [],
          max_steps: funnelData.maxSteps || 10,
          timeout_minutes: funnelData.timeoutMinutes || 30,
          fallback_message: funnelData.fallbackMessage || 'Desculpe, não consegui processar sua solicitação.'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar funil:', error);
        return null;
      }

      return this.mapFunnel(data);
    } catch (error) {
      console.error('❌ Erro ao criar funil:', error);
      return null;
    }
  }

  /**
   * Adicionar passo ao funil
   */
  async addStepToFunnel(funnelId: string, stepData: Partial<FunnelStep>): Promise<FunnelStep | null> {
    try {
      const { data, error } = await supabase
        .from('funnel_steps')
        .insert([{
          funnel_id: funnelId,
          step_number: stepData.stepNumber,
          name: stepData.name,
          description: stepData.description,
          step_type: stepData.stepType,
          message_template: stepData.messageTemplate,
          variable_id: stepData.variableId,
          conditions: stepData.conditions || [],
          actions: stepData.actions || [],
          next_step_id: stepData.nextStepId,
          validation_rules: stepData.validationRules || {},
          retry_attempts: stepData.retryAttempts || 3,
          timeout_seconds: stepData.timeoutSeconds || 300
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar passo:', error);
        return null;
      }

      return this.mapStep(data);
    } catch (error) {
      console.error('❌ Erro ao adicionar passo:', error);
      return null;
    }
  }

  /**
   * Obter todas as ações disponíveis
   */
  async getActions(ownerId: string, companyId?: string): Promise<AgentAction[]> {
    try {
      let query = supabase
        .from('agent_actions')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name');

      if (companyId) {
        query = query.or(`company_id.is.null,company_id.eq.${companyId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar ações:', error);
        return [];
      }

      return data.map(this.mapAction);
    } catch (error) {
      console.error('❌ Erro no serviço de ações:', error);
      return [];
    }
  }

  /**
   * Criar nova ação
   */
  async createAction(ownerId: string, actionData: Partial<AgentAction>): Promise<AgentAction | null> {
    try {
      const { data, error } = await supabase
        .from('agent_actions')
        .insert([{
          owner_id: ownerId,
          name: actionData.name,
          description: actionData.description,
          action_type: actionData.actionType,
          config: actionData.config || {},
          is_active: actionData.isActive !== false,
          connection_id: actionData.connectionId,
          requires_auth: actionData.requiresAuth || false
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar ação:', error);
        return null;
      }

      return this.mapAction(data);
    } catch (error) {
      console.error('❌ Erro ao criar ação:', error);
      return null;
    }
  }

  /**
   * Executar ação
   */
  async executeAction(actionId: string, context: {
    chatId: string;
    ownerId: string;
    variablesData: any;
    funnelId?: string;
    stepId?: string;
  }): Promise<ActionExecution | null> {
    try {
      // Criar registro de execução
      const { data: execution, error: execError } = await supabase
        .from('action_executions')
        .insert([{
          action_id: actionId,
          funnel_id: context.funnelId,
          step_id: context.stepId,
          chat_id: context.chatId,
          owner_id: context.ownerId,
          variables_data: context.variablesData,
          status: 'pending'
        }])
        .select()
        .single();

      if (execError) {
        console.error('❌ Erro ao criar execução:', execError);
        return null;
      }

      // Buscar ação
      const { data: action, error: actionError } = await supabase
        .from('agent_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (actionError || !action) {
        console.error('❌ Ação não encontrada:', actionError);
        return null;
      }

      // Atualizar status para running
      await supabase
        .from('action_executions')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', execution.id);

      try {
        // Executar ação baseada no tipo
        const result = await this.executeActionByType(action, context.variablesData);
        
        // Atualizar com resultado
        await supabase
          .from('action_executions')
          .update({
            status: 'completed',
            result: result,
            completed_at: new Date().toISOString()
          })
          .eq('id', execution.id);

        return this.mapExecution({ ...execution, status: 'completed', result, completed_at: new Date().toISOString() });
      } catch (error) {
        // Atualizar com erro
        await supabase
          .from('action_executions')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
            completed_at: new Date().toISOString()
          })
          .eq('id', execution.id);

        return this.mapExecution({ ...execution, status: 'failed', error_message: error instanceof Error ? error.message : 'Erro desconhecido' });
      }
    } catch (error) {
      console.error('❌ Erro ao executar ação:', error);
      return null;
    }
  }

  /**
   * Executar ação baseada no tipo
   */
  private async executeActionByType(action: any, variablesData: any): Promise<any> {
    switch (action.action_type) {
      case 'email':
        return await this.executeEmailAction(action, variablesData);
      case 'calendar':
        return await this.executeCalendarAction(action, variablesData);
      case 'meeting':
        return await this.executeMeetingAction(action, variablesData);
      case 'webhook':
        return await this.executeWebhookAction(action, variablesData);
      case 'database':
        return await this.executeDatabaseAction(action, variablesData);
      case 'notification':
        return await this.executeNotificationAction(action, variablesData);
      default:
        throw new Error(`Tipo de ação não suportado: ${action.action_type}`);
    }
  }

  /**
   * Executar ação de email
   */
  private async executeEmailAction(action: any, variablesData: any): Promise<any> {
    // Implementar envio de email
    console.log('📧 Executando ação de email:', action.name);
    return { success: true, message: 'Email enviado com sucesso' };
  }

  /**
   * Executar ação de calendário
   */
  private async executeCalendarAction(action: any, variablesData: any): Promise<any> {
    // Implementar criação de evento no Google Calendar
    console.log('📅 Executando ação de calendário:', action.name);
    return { success: true, message: 'Evento criado no calendário' };
  }

  /**
   * Executar ação de reunião
   */
  private async executeMeetingAction(action: any, variablesData: any): Promise<any> {
    // Implementar criação de reunião no Google Meet
    console.log('🎥 Executando ação de reunião:', action.name);
    return { success: true, message: 'Reunião criada no Google Meet' };
  }

  /**
   * Executar ação de webhook
   */
  private async executeWebhookAction(action: any, variablesData: any): Promise<any> {
    // Implementar chamada de webhook
    console.log('🔗 Executando ação de webhook:', action.name);
    return { success: true, message: 'Webhook executado com sucesso' };
  }

  /**
   * Executar ação de banco de dados
   */
  private async executeDatabaseAction(action: any, variablesData: any): Promise<any> {
    // Implementar operação no banco de dados
    console.log('💾 Executando ação de banco de dados:', action.name);
    return { success: true, message: 'Dados atualizados no banco' };
  }

  /**
   * Executar ação de notificação
   */
  private async executeNotificationAction(action: any, variablesData: any): Promise<any> {
    // Implementar notificação
    console.log('🔔 Executando ação de notificação:', action.name);
    return { success: true, message: 'Notificação enviada' };
  }

  /**
   * Mapear variável do banco para interface
   */
  private mapVariable(data: any): AgentVariable {
    return {
      id: data.id,
      name: data.name,
      key: data.key,
      dataType: data.data_type,
      isRequired: data.is_required,
      isSystemVariable: data.is_system_variable,
      description: data.description,
      placeholder: data.placeholder,
      validationRules: data.validation_rules || {},
      options: data.options || [],
      sourceTable: data.source_table,
      sourceColumn: data.source_column
    };
  }

  /**
   * Mapear funil do banco para interface
   */
  private mapFunnel(data: any): ConversationFunnel {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      triggerKeywords: data.trigger_keywords || [],
      maxSteps: data.max_steps,
      timeoutMinutes: data.timeout_minutes,
      fallbackMessage: data.fallback_message,
      steps: data.steps ? data.steps.map(this.mapStep) : []
    };
  }

  /**
   * Mapear passo do banco para interface
   */
  private mapStep(data: any): FunnelStep {
    return {
      id: data.id,
      stepNumber: data.step_number,
      name: data.name,
      description: data.description,
      stepType: data.step_type,
      messageTemplate: data.message_template,
      variableId: data.variable_id,
      conditions: data.conditions || [],
      actions: data.actions || [],
      nextStepId: data.next_step_id,
      validationRules: data.validation_rules || {},
      retryAttempts: data.retry_attempts,
      timeoutSeconds: data.timeout_seconds
    };
  }

  /**
   * Mapear ação do banco para interface
   */
  private mapAction(data: any): AgentAction {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      actionType: data.action_type,
      config: data.config || {},
      isActive: data.is_active,
      connectionId: data.connection_id,
      requiresAuth: data.requires_auth
    };
  }

  /**
   * Mapear execução do banco para interface
   */
  private mapExecution(data: any): ActionExecution {
    return {
      id: data.id,
      actionId: data.action_id,
      funnelId: data.funnel_id,
      stepId: data.step_id,
      chatId: data.chat_id,
      ownerId: data.owner_id,
      variablesData: data.variables_data || {},
      status: data.status,
      result: data.result || {},
      errorMessage: data.error_message,
      startedAt: data.started_at,
      completedAt: data.completed_at
    };
  }
}

export default AgentActionsService;
