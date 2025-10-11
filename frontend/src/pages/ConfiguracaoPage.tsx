import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Settings,
  MessageSquare,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  ConfiguracaoAtendimento,
  OpcaoAtendimento,
  UpdateConfiguracaoData,
  CreateOpcaoData,
  UpdateOpcaoData,
} from '@/types';

// Schema de validação para configuração
const configSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  mensagemBoasVindas: z.string().min(1, 'Mensagem de boas-vindas é obrigatória'),
  mensagemMenu: z.string().min(1, 'Mensagem do menu é obrigatória'),
  mensagemDespedida: z.string().min(1, 'Mensagem de despedida é obrigatória'),
  tempoResposta: z.number().min(1, 'Tempo de resposta deve ser maior que 0'),
  maxTentativas: z.number().min(1, 'Máximo de tentativas deve ser maior que 0'),
});

// Schema de validação para opções
const opcaoSchema = z.object({
  numero: z.number().min(1, 'Número deve ser maior que 0'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  atendenteId: z.string().min(1, 'ID do atendente é obrigatório'),
});

type ConfigFormData = z.infer<typeof configSchema>;
type OpcaoFormData = z.infer<typeof opcaoSchema>;

export default function ConfiguracaoPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfiguracaoAtendimento | null>(null);
  const [opcoes, setOpcoes] = useState<OpcaoAtendimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showOpcaoForm, setShowOpcaoForm] = useState(false);
  const [editingOpcao, setEditingOpcao] = useState<OpcaoAtendimento | null>(null);

  // Formulário de configuração
  const configForm = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      nome: '',
      mensagemBoasVindas: '',
      mensagemMenu: '',
      mensagemDespedida: '',
      tempoResposta: 30,
      maxTentativas: 3,
    },
  });

  // Formulário de opções
  const opcaoForm = useForm<OpcaoFormData>({
    resolver: zodResolver(opcaoSchema),
    defaultValues: {
      numero: 1,
      descricao: '',
      atendenteId: '',
    },
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [configResponse, opcoesResponse] = await Promise.all([
        apiClient.getConfiguracaoAtendimento(),
        apiClient.getOpcoesAtendimento(),
      ]);

      if (configResponse.success && configResponse.data) {
        setConfig(configResponse.data);
        configForm.reset(configResponse.data);
      }

      if (opcoesResponse.success && opcoesResponse.data) {
        setOpcoes(opcoesResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar configuração
  const onSaveConfig = async (data: ConfigFormData) => {
    try {
      setIsSaving(true);
      
      const response = await apiClient.updateConfiguracaoAtendimento(data);
      
      if (response.success && response.data) {
        setConfig(response.data);
        console.log('Configuração salva com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Adicionar/Editar opção
  const onSaveOpcao = async (data: OpcaoFormData) => {
    try {
      setIsSaving(true);
      
      let response;
      if (editingOpcao) {
        response = await apiClient.updateOpcaoAtendimento(editingOpcao.id, data);
      } else {
        response = await apiClient.createOpcaoAtendimento(data);
      }
      
      if (response.success && response.data) {
        if (editingOpcao) {
          setOpcoes(opcoes.map(o => o.id === editingOpcao.id ? response.data! : o));
        } else {
          setOpcoes([...opcoes, response.data!]);
        }
        
        setShowOpcaoForm(false);
        setEditingOpcao(null);
        opcaoForm.reset();
        console.log('Opção salva com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar opção:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir opção
  const onDeleteOpcao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta opção?')) return;
    
    try {
      const response = await apiClient.deleteOpcaoAtendimento(id);
      
      if (response.success) {
        setOpcoes(opcoes.filter(o => o.id !== id));
        console.log('Opção excluída com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir opção:', error);
    }
  };

  // Editar opção
  const onEditOpcao = (opcao: OpcaoAtendimento) => {
    setEditingOpcao(opcao);
    opcaoForm.reset(opcao);
    setShowOpcaoForm(true);
  };

  // Cancelar edição
  const onCancelOpcao = () => {
    setShowOpcaoForm(false);
    setEditingOpcao(null);
    opcaoForm.reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Configuração do Robô
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuração Principal */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 text-primary-600 mr-2" />
              Configuração Geral
            </h2>

            <form onSubmit={configForm.handleSubmit(onSaveConfig)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Configuração
                </label>
                <input
                  type="text"
                  {...configForm.register('nome')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {configForm.formState.errors.nome && (
                  <p className="text-sm text-red-600 mt-1">
                    {configForm.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem de Boas-vindas
                </label>
                <textarea
                  {...configForm.register('mensagemBoasVindas')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Olá! Como posso ajudá-lo hoje?"
                />
                {configForm.formState.errors.mensagemBoasVindas && (
                  <p className="text-sm text-red-600 mt-1">
                    {configForm.formState.errors.mensagemBoasVindas.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem do Menu
                </label>
                <textarea
                  {...configForm.register('mensagemMenu')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Escolha uma opção:&#10;1. Suporte técnico&#10;2. Vendas&#10;3. Financeiro"
                />
                {configForm.formState.errors.mensagemMenu && (
                  <p className="text-sm text-red-600 mt-1">
                    {configForm.formState.errors.mensagemMenu.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem de Despedida
                </label>
                <textarea
                  {...configForm.register('mensagemDespedida')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Obrigado por entrar em contato. Até logo!"
                />
                {configForm.formState.errors.mensagemDespedida && (
                  <p className="text-sm text-red-600 mt-1">
                    {configForm.formState.errors.mensagemDespedida.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempo de Resposta (segundos)
                  </label>
                  <input
                    type="number"
                    {...configForm.register('tempoResposta', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {configForm.formState.errors.tempoResposta && (
                    <p className="text-sm text-red-600 mt-1">
                      {configForm.formState.errors.tempoResposta.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Tentativas
                  </label>
                  <input
                    type="number"
                    {...configForm.register('maxTentativas', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {configForm.formState.errors.maxTentativas && (
                    <p className="text-sm text-red-600 mt-1">
                      {configForm.formState.errors.maxTentativas.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Opções de Atendimento */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-primary-600 mr-2" />
                Opções de Atendimento
              </h2>
              <button
                onClick={() => setShowOpcaoForm(true)}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de Opções */}
            <div className="space-y-3">
              {opcoes.map((opcao) => (
                <div
                  key={opcao.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2 py-1 rounded">
                      {opcao.numero}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{opcao.descricao}</p>
                      <p className="text-sm text-gray-500">ID: {opcao.atendenteId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditOpcao(opcao)}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteOpcao(opcao.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {opcoes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma opção configurada</p>
                  <p className="text-sm">Clique no botão + para adicionar</p>
                </div>
              )}
            </div>

            {/* Formulário de Opção */}
            {showOpcaoForm && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  {editingOpcao ? 'Editar Opção' : 'Nova Opção'}
                </h3>

                <form onSubmit={opcaoForm.handleSubmit(onSaveOpcao)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número
                      </label>
                      <input
                        type="number"
                        {...opcaoForm.register('numero', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {opcaoForm.formState.errors.numero && (
                        <p className="text-sm text-red-600 mt-1">
                          {opcaoForm.formState.errors.numero.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        {...opcaoForm.register('descricao')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ex: Suporte técnico"
                      />
                      {opcaoForm.formState.errors.descricao && (
                        <p className="text-sm text-red-600 mt-1">
                          {opcaoForm.formState.errors.descricao.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID do Atendente
                    </label>
                    <input
                      type="text"
                      {...opcaoForm.register('atendenteId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ex: atendente_001"
                    />
                    {opcaoForm.formState.errors.atendenteId && (
                      <p className="text-sm text-red-600 mt-1">
                        {opcaoForm.formState.errors.atendenteId.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelOpcao}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
