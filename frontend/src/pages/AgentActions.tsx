import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Play, 
  Pause, 
  Settings, 
  MessageSquare, 
  User, 
  Mail, 
  Calendar, 
  Video,
  Database,
  Bell,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface AgentVariable {
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

interface FunnelStep {
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

interface ConversationFunnel {
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

interface AgentAction {
  id: string;
  name: string;
  description?: string;
  actionType: 'email' | 'calendar' | 'meeting' | 'webhook' | 'database' | 'notification';
  config: any;
  isActive: boolean;
  connectionId?: string;
  requiresAuth: boolean;
}

const AgentActions: React.FC = () => {
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [variables, setVariables] = useState<AgentVariable[]>([]);
  const [funnels, setFunnels] = useState<ConversationFunnel[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [currentFunnel, setCurrentFunnel] = useState<ConversationFunnel | null>(null);
  const [currentStep, setCurrentStep] = useState<FunnelStep | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [finalTemplate, setFinalTemplate] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar variáveis
      const variablesResponse = await fetch('/api/agent-actions/variables');
      const variablesData = await variablesResponse.json();
      setVariables(variablesData);

      // Carregar funis
      const funnelsResponse = await fetch('/api/agent-actions/funnels');
      const funnelsData = await funnelsResponse.json();
      setFunnels(funnelsData);

      // Carregar ações
      const actionsResponse = await fetch('/api/agent-actions/actions');
      const actionsData = await actionsResponse.json();
      setActions(actionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariableToggle = (variableId: string) => {
    setSelectedVariables(prev => 
      prev.includes(variableId) 
        ? prev.filter(id => id !== variableId)
        : [...prev, variableId]
    );
  };

  const handleAddStep = async (stepData: Partial<FunnelStep>) => {
    if (!currentFunnel) return;

    try {
      const response = await fetch(`/api/agent-actions/funnels/${currentFunnel.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData)
      });

      if (response.ok) {
        await loadData();
        setShowAddStep(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar passo:', error);
    }
  };

  const handleAddAction = async (actionData: Partial<AgentAction>) => {
    try {
      const response = await fetch('/api/agent-actions/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData)
      });

      if (response.ok) {
        await loadData();
        setShowAddAction(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
    }
  };

  const handleSaveFunnel = async () => {
    if (!currentFunnel) return;

    try {
      const response = await fetch(`/api/agent-actions/funnels/${currentFunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentFunnel,
          selectedVariables
        })
      });

      if (response.ok) {
        await loadData();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erro ao salvar funil:', error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'meeting': return <Video className="w-4 h-4" />;
      case 'webhook': return <Zap className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'string': return <MessageSquare className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'boolean': return <CheckCircle className="w-4 h-4" />;
      case 'select': return <ArrowDown className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-purple-600" />
                Configuração de Ações
              </h1>
              <p className="text-gray-600 mt-2">
                Configure as variáveis e funil do seu agente
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
              {isEditing && (
                <button
                  onClick={handleSaveFunnel}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Variáveis a Coletar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Variáveis a Coletar
            </h3>
            <p className="text-gray-600 mb-4">
              Selecione quais informações o agente deve coletar dos clientes
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {variables.map((variable) => (
                <div
                  key={variable.id}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedVariables.includes(variable.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleVariableToggle(variable.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedVariables.includes(variable.id)}
                      onChange={() => handleVariableToggle(variable.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getDataTypeIcon(variable.dataType)}
                        <span className="font-medium text-gray-900">
                          {variable.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {variable.key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          {variable.dataType}
                        </span>
                        <span className="text-xs px-2 py-1 rounded text-white bg-blue-500">
                          {variable.isRequired ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>
                      {variable.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {variable.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                Variáveis selecionadas: {selectedVariables.length} de {variables.length}
              </span>
            </div>
          </div>

          {/* Funil de Conversação */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Funil de Conversação
            </h3>
            <p className="text-gray-600 mb-4">
              Configure os passos que o agente deve seguir na conversa
            </p>

            {/* Seleção de Funil */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funil Atual
              </label>
              <select
                value={currentFunnel?.id || ''}
                onChange={(e) => {
                  const funnel = funnels.find(f => f.id === e.target.value);
                  setCurrentFunnel(funnel || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecionar funil</option>
                {funnels.map((funnel) => (
                  <option key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Passos do Funil */}
            {currentFunnel && (
              <div className="space-y-3">
                {currentFunnel.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {step.stepNumber}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                            {step.stepType}
                          </span>
                          {step.variableId && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                              Coleta variável
                            </span>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isEditing && (
                  <button
                    onClick={() => setShowAddStep(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Passo
                  </button>
                )}
              </div>
            )}

            {!currentFunnel && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Selecione um funil para visualizar os passos</p>
              </div>
            )}
          </div>
        </div>

        {/* Ações Disponíveis */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Ações Disponíveis
            </h3>
            {isEditing && (
              <button
                onClick={() => setShowAddAction(true)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Ação
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  {getActionIcon(action.actionType)}
                  <h4 className="font-medium text-gray-900">{action.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {action.actionType}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    action.isActive 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {action.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template de Resposta Final */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Instruções Finais
          </h3>
          <p className="text-gray-600 mb-4">
            Template de Resposta Final
          </p>
          <textarea
            value={finalTemplate}
            onChange={(e) => setFinalTemplate(e.target.value)}
            disabled={!isEditing}
            rows={4}
            placeholder="Ex: Obrigado pelas informações! Meu nome é {nome_agente} da {empresa}. Somos especializados em {especializacao} e gostaria de saber mais sobre seus desafios atuais em {area}..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 transition-all duration-200 resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Use variáveis como {`{nome_cliente}`, `{empresa}`, `{produto_interesse}`} para personalizar a resposta
          </p>
        </div>
      </div>

      {/* Modais */}
      {showAddStep && (
        <AddStepModal
          onClose={() => setShowAddStep(false)}
          onSave={handleAddStep}
          variables={variables}
          actions={actions}
        />
      )}

      {showAddAction && (
        <AddActionModal
          onClose={() => setShowAddAction(false)}
          onSave={handleAddAction}
        />
      )}
    </div>
  );
};

// Modal para adicionar passo
const AddStepModal: React.FC<{
  onClose: () => void;
  onSave: (stepData: Partial<FunnelStep>) => void;
  variables: AgentVariable[];
  actions: AgentAction[];
}> = ({ onClose, onSave, variables, actions }) => {
  const [stepData, setStepData] = useState<Partial<FunnelStep>>({
    stepType: 'collect_variable',
    retryAttempts: 3,
    timeoutSeconds: 300
  });

  const handleSave = () => {
    onSave(stepData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Passo</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Passo
            </label>
            <input
              type="text"
              value={stepData.name || ''}
              onChange={(e) => setStepData({ ...stepData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Coletar nome do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo do Passo
            </label>
            <select
              value={stepData.stepType || 'collect_variable'}
              onChange={(e) => setStepData({ ...stepData, stepType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="collect_variable">Coletar Variável</option>
              <option value="show_message">Mostrar Mensagem</option>
              <option value="execute_action">Executar Ação</option>
              <option value="conditional">Condicional</option>
              <option value="wait">Aguardar</option>
            </select>
          </div>

          {stepData.stepType === 'collect_variable' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variável
              </label>
              <select
                value={stepData.variableId || ''}
                onChange={(e) => setStepData({ ...stepData, variableId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecionar variável</option>
                {variables.map((variable) => (
                  <option key={variable.id} value={variable.id}>
                    {variable.name} ({variable.key})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template da Mensagem
            </label>
            <textarea
              value={stepData.messageTemplate || ''}
              onChange={(e) => setStepData({ ...stepData, messageTemplate: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Olá! Qual é o seu nome completo?"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para adicionar ação
const AddActionModal: React.FC<{
  onClose: () => void;
  onSave: (actionData: Partial<AgentAction>) => void;
}> = ({ onClose, onSave }) => {
  const [actionData, setActionData] = useState<Partial<AgentAction>>({
    actionType: 'email',
    isActive: true,
    requiresAuth: false
  });

  const handleSave = () => {
    onSave(actionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Ação</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Ação
            </label>
            <input
              type="text"
              value={actionData.name || ''}
              onChange={(e) => setActionData({ ...actionData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Enviar email de boas-vindas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo da Ação
            </label>
            <select
              value={actionData.actionType || 'email'}
              onChange={(e) => setActionData({ ...actionData, actionType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="email">Email</option>
              <option value="calendar">Calendário</option>
              <option value="meeting">Reunião</option>
              <option value="webhook">Webhook</option>
              <option value="database">Banco de Dados</option>
              <option value="notification">Notificação</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={actionData.description || ''}
              onChange={(e) => setActionData({ ...actionData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descreva o que esta ação faz..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentActions;
