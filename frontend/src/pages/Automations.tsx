'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
  Eye,
  Settings,
  Calendar,
  Clock,
  CheckCircle,
  AlignJustify
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import AutomationsGrid from '@/automations/AutomationsGrid';
import { Step } from '@/types/workflow';
import { useSidebar } from '@/contexts/SidebarContext';

// Mock data - substituir por dados reais da API
const mockAutomations = [
  {
    id: '1',
    name: 'Boas-vindas WhatsApp',
    description: 'Envia mensagem de boas-vindas quando conversa é aberta',
    status: 'active',
    lastRun: '2024-01-15T10:30:00Z',
    executions: 245,
    steps: 3,
    createdAt: '2024-01-10T09:00:00Z'
  },
  {
    id: '2', 
    name: 'Follow-up Lead',
    description: 'Seguimento automático para leads interessados',
    status: 'draft',
    lastRun: null,
    executions: 0,
    steps: 5,
    createdAt: '2024-01-12T14:20:00Z'
  },
  {
    id: '3',
    name: 'Lembrete Compromisso',
    description: 'Envia lembretes de compromissos via WhatsApp',
    status: 'paused',
    lastRun: '2024-01-14T15:45:00Z',
    executions: 89,
    steps: 4,
    createdAt: '2024-01-08T11:15:00Z'
  }
];

type AutomationStatus = 'active' | 'draft' | 'paused';
type ViewMode = 'list' | 'builder';

const formatLastRun = (lastRun: string | null) => {
  if (!lastRun) return 'Nunca executado';
  
  const date = new Date(lastRun);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return `Às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInHours < 48) {
    return 'Ontem';
  } else {
    return `Há ${Math.floor(diffInHours / 24)} dias`;
  }
};

const getStatusColor = (status: AutomationStatus) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

const getStatusIcon = (status: AutomationStatus) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-4 h-4" />;
    case 'draft': return <Clock className="w-4 h-4" />;
    case 'paused': return <Pause className="w-4 h-4" />;
  }
};

interface AutomationCardProps {
  automation: typeof mockAutomations[0];
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function AutomationCard({ automation, onEdit, onDuplicate, onDelete, onToggleStatus }: AutomationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">
              {automation.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mb-2">
              {automation.description}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={getStatusColor(automation.status)}>
                {getStatusIcon(automation.status)}
                <span className="ml-1">{automation.status === 'active' ? 'Ativo' : automation.status === 'draft' ? 'Rascunho' : 'Pausado'}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {automation.steps} etapas
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleStatus}>
                {automation.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Última execução: {formatLastRun(automation.lastRun)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>{automation.executions} execuções</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Automations() {
  const location = useLocation();
  const { id: automationId } = useParams();
  const navigate = useNavigate();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AutomationStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  // Detectar ação baseada na URL
  useEffect(() => {
    const pathname = location.pathname;
    
    if (pathname.includes('/automations/new')) {
      // Nova automação
      setSelectedAutomation(null);
      setShowBuilder(true);
      setViewMode('builder');
    } else if (automationId && pathname === `/automations/${automationId}`) {
      // Editar automação existente
      setSelectedAutomation(automationId);
      setShowBuilder(true);
      setViewMode('builder');
    } else if (pathname === '/automations' || pathname.endsWith('/automations')) {
      // Lista de automações (página principal)
      setShowBuilder(false);
      setViewMode('list');
      setSelectedAutomation(null);
    }
  }, [location.pathname, automationId]);

  const handleNewAutomation = () => {
    navigate('/automations/new');
  };

  const handleEditAutomation = (automationId: string) => {
    navigate(`/automations/${automationId}`);
  };

  const handleBackToList = () => {
    navigate('/automations');
  };

  const handleSaveBuilder = (steps: Step[]) => {
    console.log('Salvando automação:', steps);
    // TODO: Implementar salvar na API
    handleBackToList();
  };

  const filteredAutomations = mockAutomations.filter(automation => {
    const matchesSearch = automation.name.toLowerCase().includes(search.toLowerCase()) ||
                         automation.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || automation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showBuilder && viewMode === 'builder') {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] min-h-0 bg-white">
        {/* Header bar similar ao Respond.io - dentro do Layout normal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar para lista
            </Button>
            <div>
              <h2 className="text-xl font-semibold">
                {selectedAutomation ? 'Editar Automação' : 'Nova Automação'}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedAutomation ? 'Configure sua automação existente' : 'Configure sua nova automação'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
        
        {/* Workflow builder - ocupando altura disponível dinamicamente */}
        <div className="flex-1 min-h-0">
          <WorkflowBuilder
            onSave={handleSaveBuilder}
            title={selectedAutomation ? 'Editar Automação' : 'Nova Automação'}
            isFullscreen={false}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
          {/* Navbar com botão de navegação */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botão de toggle da sidebar - só aparece quando colapsada */}
                {!sidebarExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                    onClick={expandSidebarFromMenu}
                    title="Expandir barra lateral"
                  >
                    <AlignJustify size={14} />
                  </Button>
                )}
                
                {/* Botão de navegação - Automações */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg bg-gray-50 text-slate-900 shadow-inner"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Automações
                </Button>
              </div>
              
              {/* Espaço para futuras ações */}
              <div className="flex items-center gap-2">
                {/* Pode adicionar botões de ação aqui no futuro */}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div>
          <AutomationsGrid />
        </div>

        {/* Botão flutuante de nova automação */}
        <button
          onClick={handleNewAutomation}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
          title="Nova Automação"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
