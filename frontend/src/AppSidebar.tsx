
import { 
  Home, 
  Building2, 
  Users, 
  Calendar, 
  Target, 
  Settings, 
  Phone, 
  ShoppingCart, 
  Users2, 
  Package, 
  Briefcase, 
  MessageCircle, 
  Bot,
  BarChart3, 
  CreditCard, 
  Truck, 
  LineChart, 
  ShoppingBag, 
  DollarSign,
  ChevronRight,
  X,
  ChevronDown,
  Grid3X3,
  Activity,
  FolderOpen,
  TrendingUp,
  User,
  MoreHorizontal,
  MessageSquare,
  Users as UsersIcon,
  Minimize2,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isMoreExpanded, setIsMoreExpanded] = useState(true);

  // Função para verificar se um item está ativo
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Função para obter as classes baseadas no estado ativo
  const getItemClasses = (path: string) => {
    const active = isActive(path);
    return active 
      ? 'bg-blue-50 text-blue-700' 
      : 'text-gray-700 hover:bg-gray-50';
  };

  // Função para obter as classes dos ícones baseadas no estado ativo
  const getIconClasses = (path: string) => {
    const active = isActive(path);
    return active 
      ? 'text-blue-700' 
      : 'text-gray-600';
  };

  // Função para obter as classes dos textos baseadas no estado ativo
  const getTextClasses = (path: string) => {
    const active = isActive(path);
    return active 
      ? 'text-blue-700 font-medium' 
      : 'text-gray-700';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Espaço em branco onde estava o perfil */}
      <div className="px-4 py-6 border-b border-gray-100">
        <div className="h-10"></div>
      </div>
      
      {/* Conteúdo da sidebar */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {/* Grupo Principal */}
        <div className="space-y-1">
          <a 
            href="/" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/')}`}
          >
            <Grid3X3 className={`h-5 w-5 ${getIconClasses('/')}`} />
            <span className={`text-sm ${getTextClasses('/')}`}>Início</span>
          </a>

          <a 
            href="/atividades" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/atividades')}`}
          >
            <Activity className={`h-5 w-5 ${getIconClasses('/atividades')}`} />
            <span className={`text-sm ${getTextClasses('/atividades')}`}>Atividades</span>
          </a>

          <a 
            href="/calendar" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/calendar')}`}
          >
            <Calendar className={`h-5 w-5 ${getIconClasses('/calendar')}`} />
            <span className={`text-sm ${getTextClasses('/calendar')}`}>Calendário</span>
          </a>

          <a 
            href="/contacts" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/contacts')}`}
          >
            <Users className={`h-5 w-5 ${getIconClasses('/contacts')}`} />
            <span className={`text-sm ${getTextClasses('/contacts')}`}>Contatos</span>
          </a>

          <a 
            href="/projects" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/projects')}`}
          >
            <FolderOpen className={`h-5 w-5 ${getIconClasses('/projects')}`} />
            <span className={`text-sm ${getTextClasses('/projects')}`}>Projetos</span>
          </a>
        </div>

        {/* Grupo de Negócios/CRM */}
        <div className="space-y-1">
          <a 
            href="/leads-sales" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/leads-sales')}`}
          >
            <TrendingUp className={`h-5 w-5 ${getIconClasses('/leads-sales')}`} />
            <span className={`text-sm ${getTextClasses('/leads-sales')}`}>Leads e Vendas</span>
          </a>

          <a 
            href="/empresas" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/empresas')}`}
          >
            <Building2 className={`h-5 w-5 ${getIconClasses('/empresas')}`} />
            <span className={`text-sm ${getTextClasses('/empresas')}`}>Empresas</span>
          </a>

          <a 
            href="/funcionarios" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/funcionarios')}`}
          >
            <UsersIcon className={`h-5 w-5 ${getIconClasses('/funcionarios')}`} />
            <span className={`text-sm ${getTextClasses('/funcionarios')}`}>Funcionários</span>
          </a>
        </div>

        {/* Seção "Mais" expansível */}
        <div className="space-y-1">
          <button 
            onClick={() => setIsMoreExpanded(!isMoreExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 ${
              isMoreExpanded ? 'bg-gray-50 text-gray-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
              <span className="text-sm">Mais</span>
            </div>
            {isMoreExpanded ? (
              <X className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {isMoreExpanded && (
            <div className="ml-6 space-y-1">
              <a 
                href="/feed" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${getItemClasses('/feed')}`}
              >
                <MessageSquare className={`h-4 w-4 ${getIconClasses('/feed')}`} />
                <span className={`text-sm ${getTextClasses('/feed')}`}>Feed</span>
              </a>

              <a 
                href="/chat" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${getItemClasses('/chat')}`}
              >
                <MessageCircle className={`h-4 w-4 ${getIconClasses('/chat')}`} />
                <span className={`text-sm ${getTextClasses('/chat')}`}>Chat</span>
              </a>

              <a 
                href="/colaboracoes" 
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${getItemClasses('/colaboracoes')}`}
              >
                <Users className={`h-4 w-4 ${getIconClasses('/colaboracoes')}`} />
                <span className={`text-sm ${getTextClasses('/colaboracoes')}`}>Colaborações</span>
              </a>
            </div>
          )}
        </div>

        {/* Integrações e Configurações - Botões Fixos */}
        <div className="mt-auto pt-6 pb-2 border-t border-gray-100">
          <div className="space-y-3">
            <a 
              href="/whatsapp" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/whatsapp')}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <MessageSquare className={`h-5 w-5 ${getIconClasses('/whatsapp')}`} />
              </div>
              <span className={`text-sm font-medium ${getTextClasses('/whatsapp')}`}>WhatsApp</span>
            </a>

            <a 
              href="/ai-agent" 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-700">Agente IA</span>
            </a>

            <a 
              href="/automations" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/automations')}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <Zap className={`h-5 w-5 ${getIconClasses('/automations')}`} />
              </div>
              <span className={`text-sm font-medium ${getTextClasses('/automations')}`}>Automações</span>
            </a>

            <a 
              href="/settings" 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${getItemClasses('/settings')}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <Settings className={`h-5 w-5 ${getIconClasses('/settings')}`} />
              </div>
              <span className={`text-sm font-medium ${getTextClasses('/settings')}`}>Configurações</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer com botão Minimizar */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
          <Minimize2 className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default AppSidebar;
