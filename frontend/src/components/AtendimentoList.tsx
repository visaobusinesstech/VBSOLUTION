import { useState } from 'react';
import { Search, Filter, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { Atendimento, AtendimentoWithMessages } from '@/types';

interface AtendimentoListProps {
  atendimentos: Atendimento[];
  atendimentoAtual: AtendimentoWithMessages | null;
  onSelectAtendimento: (atendimento: Atendimento) => void;
  isLoading: boolean;
}

export default function AtendimentoList({
  atendimentos,
  atendimentoAtual,
  onSelectAtendimento,
  isLoading,
}: AtendimentoListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Filtrar atendimentos
  const filteredAtendimentos = atendimentos.filter((atendimento) => {
    const matchesSearch = 
      atendimento.numeroCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    
    const matchesStatus = statusFilter === 'todos' || atendimento.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-100 text-green-800';
      case 'FINALIZADO':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return <Clock className="h-3 w-3" />;
      case 'FINALIZADO':
        return <CheckCircle className="h-3 w-3" />;
      case 'CANCELADO':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Ativo';
      case 'FINALIZADO':
        return 'Finalizado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Agora';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d`;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Atendimentos
        </h2>

        {/* Busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar atendimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filtro de Status */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="todos">Todos</option>
            <option value="ATIVO">Ativos</option>
            <option value="FINALIZADO">Finalizados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="flex-1 overflow-y-auto">
        {filteredAtendimentos.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm || statusFilter !== 'todos' ? (
              <>
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhum atendimento encontrado</p>
                <p className="text-xs">Tente ajustar os filtros</p>
              </>
            ) : (
              <>
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhum atendimento</p>
                <p className="text-xs">Os atendimentos aparecerão aqui</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAtendimentos.map((atendimento) => (
              <div
                key={atendimento.id}
                onClick={() => onSelectAtendimento(atendimento)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  atendimentoAtual?.id === atendimento.id ? 'bg-primary-50 border-r-2 border-primary-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Nome do Cliente */}
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h3 className="font-medium text-gray-900 truncate">
                        {atendimento.nomeCliente || 'Cliente'}
                      </h3>
                    </div>

                    {/* Número do Cliente */}
                    <p className="text-sm text-gray-600 mb-2">
                      {atendimento.numeroCliente}
                    </p>

                    {/* Status e Tempo */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(atendimento.status)}`}>
                          {getStatusIcon(atendimento.status)}
                          <span>{getStatusText(atendimento.status)}</span>
                        </span>
                      </div>

                      {/* Tempo da última mensagem */}
                      {atendimento.ultimaMensagemAt && (
                        <span className="text-xs text-gray-500">
                          {formatTime(atendimento.ultimaMensagemAt)}
                        </span>
                      )}
                    </div>

                    {/* Última mensagem */}
                    {atendimento.ultimaMensagem && (
                      <p className="text-sm text-gray-500 mt-2 truncate">
                        {atendimento.ultimaMensagem}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer com Contador */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {filteredAtendimentos.length} atendimento{filteredAtendimentos.length !== 1 ? 's' : ''}
          </p>
          {filteredAtendimentos.length !== atendimentos.length && (
            <p className="text-xs text-gray-500">
              de {atendimentos.length} total
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
