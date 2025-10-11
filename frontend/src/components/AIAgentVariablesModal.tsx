import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, ArrowLeft } from 'lucide-react';
import { AIAgentVariable, CreateAIAgentVariableData, VARIABLE_TYPES } from '../types/ai-agent-variables';

interface AIAgentVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: AIAgentVariable[];
  loading: boolean;
  saving: boolean;
  onCreateVariable: (data: CreateAIAgentVariableData) => Promise<void>;
  onUpdateVariable: (data: { id: string; name: string; key: string; data_type: string; description?: string; default_value?: string; options?: any[] }) => Promise<void>;
  onDeleteVariable: (id: string) => Promise<void>;
}

const AIAgentVariablesModal: React.FC<AIAgentVariablesModalProps> = ({
  isOpen,
  onClose,
  variables,
  loading,
  saving,
  onCreateVariable,
  onUpdateVariable,
  onDeleteVariable
}) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingVariable, setEditingVariable] = useState<AIAgentVariable | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    data_type: 'string' as const,
    description: '',
    default_value: '',
    options: [] as string[]
  });
  const [newOption, setNewOption] = useState('');

  // Reset form when view changes
  useEffect(() => {
    if (view === 'create') {
      setFormData({
        name: '',
        key: '',
        data_type: 'string',
        description: '',
        default_value: '',
        options: []
      });
    } else if (view === 'edit' && editingVariable) {
      setFormData({
        name: editingVariable.name,
        key: editingVariable.key,
        data_type: editingVariable.data_type,
        description: editingVariable.description || '',
        default_value: editingVariable.default_value || '',
        options: editingVariable.options || []
      });
    }
  }, [view, editingVariable]);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.key.trim()) {
      alert('Nome e chave da variável são obrigatórios');
      return;
    }

    try {
      await onCreateVariable({
        name: formData.name,
        key: formData.key,
        data_type: formData.data_type,
        description: formData.description || undefined,
        default_value: formData.default_value || undefined,
        options: formData.data_type === 'select' ? formData.options : undefined,
        is_system_variable: false
      });
      
      setView('list');
      setFormData({
        name: '',
        key: '',
        data_type: 'string',
        description: '',
        default_value: '',
        options: []
      });
    } catch (error) {
      console.error('Erro ao criar variável:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingVariable || !formData.name.trim() || !formData.key.trim()) {
      alert('Nome e chave da variável são obrigatórios');
      return;
    }

    try {
      await onUpdateVariable({
        id: editingVariable.id,
        name: formData.name,
        key: formData.key,
        data_type: formData.data_type,
        description: formData.description || undefined,
        default_value: formData.default_value || undefined,
        options: formData.data_type === 'select' ? formData.options : undefined
      });
      
      setView('list');
      setEditingVariable(null);
    } catch (error) {
      console.error('Erro ao atualizar variável:', error);
    }
  };

  const handleDelete = async (variable: AIAgentVariable) => {
    if (variable.is_system_variable) {
      alert('Não é possível deletar variáveis do sistema');
      return;
    }

    if (confirm(`Tem certeza que deseja deletar a variável "${variable.name}"?`)) {
      try {
        await onDeleteVariable(variable.id);
      } catch (error) {
        console.error('Erro ao deletar variável:', error);
      }
    }
  };

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button
                onClick={() => {
                  setView('list');
                  setEditingVariable(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {view === 'list' && 'Configurar Variáveis'}
              {view === 'create' && 'Nova Variável'}
              {view === 'edit' && 'Editar Variável'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'list' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  Gerencie as variáveis que podem ser usadas nos estágios do agente
                </p>
                <button
                  onClick={() => setView('create')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Variável
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable) => (
                    <div
                      key={variable.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{variable.name}</h3>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {VARIABLE_TYPES.find(t => t.value === variable.data_type)?.label}
                            </span>
                            {variable.is_system_variable && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Sistema
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">
                              {variable.key}
                            </span>
                          </p>
                          {variable.description && (
                            <p className="text-sm text-gray-500">{variable.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingVariable(variable);
                              setView('edit');
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!variable.is_system_variable && (
                            <button
                              onClick={() => handleDelete(variable)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {variables.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma variável criada</h3>
                      <p className="text-gray-500 mb-4">Crie sua primeira variável para começar</p>
                      <button
                        onClick={() => setView('create')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Criar Variável
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(view === 'create' || view === 'edit') && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Nome da Variável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Variável
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Nome do Cliente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Chave da Variável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave da Variável
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="Ex: data.nome_cliente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta chave será usada para referenciar a variável nos prompts
                  </p>
                </div>

                {/* Tipo da Variável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Dados
                  </label>
                  <select
                    value={formData.data_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      data_type: e.target.value as any,
                      options: e.target.value !== 'select' ? [] : prev.options
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {VARIABLE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o conteúdo da variável e como o Agente deverá solicitar o dado"
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 caracteres
                  </p>
                </div>

                {/* Valor Padrão */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Padrão (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.default_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
                    placeholder="Valor padrão quando a variável não for preenchida"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Opções para tipo Select */}
                {formData.data_type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opções de Seleção
                    </label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm flex-1">
                            {option}
                          </span>
                          <button
                            onClick={() => removeOption(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Nova opção"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && addOption()}
                        />
                        <button
                          onClick={addOption}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setView('list');
                      setEditingVariable(null);
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={view === 'create' ? handleCreate : handleUpdate}
                    disabled={saving || !formData.name.trim() || !formData.key.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {view === 'create' ? 'Criar Variável' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgentVariablesModal;
