import { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  RefreshCw,
  MoreVertical,
  Settings
} from 'lucide-react';
import { AtendimentoWithMessages } from '@/types';
import { apiClient } from '@/lib/api';

interface AtendimentoActionsProps {
  atendimento: AtendimentoWithMessages;
  onRefresh: () => void;
}

export default function AtendimentoActions({ atendimento, onRefresh }: AtendimentoActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);

  const handleFinalizeAtendimento = async () => {
    if (!confirm('Tem certeza que deseja finalizar este atendimento?')) return;

    try {
      setIsLoading(true);
      const response = await apiClient.finalizeAtendimento(atendimento.id);
      
      if (response.success) {
        console.log('Atendimento finalizado com sucesso');
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCriarTarefa = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.criarTarefa(atendimento.id);
      
      if (response.success) {
        console.log('Tarefa criada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgendarAtendimento = async () => {
    const data = prompt('Data (DD/MM/AAAA):');
    const hora = prompt('Hora (HH:MM):');
    const observacoes = prompt('Observações (opcional):');

    if (!data || !hora) return;

    try {
      setIsLoading(true);
      const response = await apiClient.agendarAtendimento(atendimento.id, {
        data,
        hora,
        observacoes: observacoes || undefined,
      });
      
      if (response.success) {
        console.log('Atendimento agendado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao agendar atendimento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetClienteInfo = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getClienteInfo(atendimento.id);
      
      if (response.success && response.data) {
        setClientInfo(response.data);
        setShowClientInfo(true);
      }
    } catch (error) {
      console.error('Erro ao obter informações do cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Ações
        </h2>
        <p className="text-sm text-gray-600">
          Gerencie o atendimento
        </p>
      </div>

      {/* Ações Principais */}
      <div className="flex-1 p-4 space-y-3">
        {/* Finalizar Atendimento */}
        <button
          onClick={handleFinalizeAtendimento}
          disabled={isLoading || atendimento.status !== 'ATIVO'}
          className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span>Finalizar Atendimento</span>
        </button>

        {/* Criar Tarefa */}
        <button
          onClick={handleCriarTarefa}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span>Criar Tarefa</span>
        </button>

        {/* Agendar Atendimento */}
        <button
          onClick={handleAgendarAtendimento}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          <span>Agendar</span>
        </button>

        {/* Informações do Cliente */}
        <button
          onClick={handleGetClienteInfo}
          disabled={isLoading}
          className="w-full bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span>Info do Cliente</span>
        </button>
      </div>

      {/* Informações do Atendimento */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Detalhes do Atendimento
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              atendimento.status === 'ATIVO' 
                ? 'bg-green-100 text-green-800' 
                : atendimento.status === 'FINALIZADO'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {atendimento.status === 'ATIVO' ? 'Ativo' : 
               atendimento.status === 'FINALIZADO' ? 'Finalizado' : 'Cancelado'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Criado:</span>
            <span className="text-gray-900">
              {formatDate(atendimento.createdAt.toString())}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Atualizado:</span>
            <span className="text-gray-900">
              {formatDate(atendimento.updatedAt.toString())}
            </span>
          </div>
          
          {atendimento.atendenteId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Atendente:</span>
              <span className="text-gray-900">{atendimento.atendenteId}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Mensagens:</span>
            <span className="text-gray-900">{atendimento.mensagens.length}</span>
          </div>
        </div>
      </div>

      {/* Modal de Informações do Cliente */}
      {showClientInfo && clientInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Informações do Cliente
              </h3>
              <button
                onClick={() => setShowClientInfo(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{clientInfo.nome}</p>
                  <p className="text-sm text-gray-600">Nome</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{clientInfo.telefone}</p>
                  <p className="text-sm text-gray-600">Telefone</p>
                </div>
              </div>

              {clientInfo.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{clientInfo.email}</p>
                    <p className="text-sm text-gray-600">E-mail</p>
                  </div>
                </div>
              )}

              {clientInfo.historico && clientInfo.historico.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Histórico</h4>
                  <div className="space-y-2">
                    {clientInfo.historico.map((item: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowClientInfo(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
