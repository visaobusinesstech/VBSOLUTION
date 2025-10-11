import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, MessageCircle, ChevronDown, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBarSearch } from '@/components/ui/topbar-search';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/hooks/useUserProfile';

interface BitrixTopbarProps {
  sidebarExpanded?: boolean;
}

interface Notification {
  id: string;
  type: 'activity' | 'project' | 'lead' | 'message';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  url?: string;
}

// Dados vazios - serão carregados do Supabase quando implementado
const mockNotifications: Notification[] = [];
const mockMessages: Notification[] = [];

// Mapeamento completo das páginas do sistema
const SYSTEM_PAGES = [
  { title: "Início", route: "/", keywords: ["inicio", "home", "dashboard", "principal"] },
  { title: "Atividades", route: "/activities", keywords: ["atividades", "tarefas", "atividade", "tarefa"] },
  { title: "Calendário", route: "/calendar", keywords: ["calendario", "calendário", "eventos", "agenda"] },
  { title: "Contatos", route: "/contacts", keywords: ["contatos", "contato", "pessoas", "cliente"] },
  { title: "Projetos", route: "/projects", keywords: ["projetos", "projeto", "trabalho"] },
  { title: "Empresas", route: "/companies", keywords: ["empresas", "empresa", "companhia", "organização"] },
  { title: "Inventário", route: "/inventory", keywords: ["inventario", "inventário", "estoque", "produtos"] },
  { title: "Funcionários", route: "/employees", keywords: ["funcionarios", "funcionários", "colaboradores", "equipe"] },
  { title: "Produtos", route: "/products", keywords: ["produtos", "produto", "itens", "mercadoria"] },
  { title: "Fornecedores", route: "/suppliers", keywords: ["fornecedores", "fornecedor", "vendedor"] },
  { title: "Baixas", route: "/writeoffs", keywords: ["baixas", "baixa", "perdas", "descarte"] },
  { title: "Pedidos de Venda", route: "/sales-orders", keywords: ["pedidos", "vendas", "venda", "pedido", "ordem"] },
  { title: "Funil de Vendas", route: "/sales-funnel", keywords: ["funil", "vendas", "pipeline", "processo"] },
  { title: "Grupos de Trabalho", route: "/work-groups", keywords: ["grupos", "trabalho", "equipe", "time"] },
  { title: "Arquivos", route: "/files", keywords: ["arquivos", "arquivo", "documentos", "documento"] },
  { title: "Relatórios", route: "/reports", keywords: ["relatorios", "relatórios", "relatorio", "relatório", "dados"] },
  { title: "WhatsApp", route: "/whatsapp", keywords: ["whatsapp", "mensagens", "chat", "conversas"] },
  { title: "Agente IA", route: "/ai-agent", keywords: ["agente", "ia", "inteligencia", "artificial", "ai", "bot"] },
  { title: "Automações", route: "/automations", keywords: ["automacoes", "automações", "automação", "automatizar"] },
  { title: "Configurações", route: "/settings", keywords: ["configuracoes", "configurações", "config", "ajustes"] },
  { title: "Leads e Vendas", route: "/leads-sales", keywords: ["leads", "vendas", "prospects", "clientes", "venda"] },
  { title: "Feed", route: "/feed", keywords: ["feed", "noticias", "notícias", "atualizações", "timeline"] },
  { title: "Chat", route: "/chat", keywords: ["chat", "mensagens", "conversas", "comunicação"] }
];

// Palavras-chave que podem redirecionar para múltiplas páginas
const KEYWORD_MAPPINGS = {
  "vendas": ["/leads-sales", "/sales-orders", "/sales-funnel"],
  "venda": ["/leads-sales", "/sales-orders", "/sales-funnel"],
  "cliente": ["/contacts", "/leads-sales"],
  "clientes": ["/contacts", "/leads-sales"],
  "produto": ["/products", "/inventory"],
  "produtos": ["/products", "/inventory"],
  "relatorio": ["/reports"],
  "relatorios": ["/reports"],
  "relatório": ["/reports"],
  "relatórios": ["/reports"],
  "mensagem": ["/chat", "/whatsapp"],
  "mensagens": ["/chat", "/whatsapp"],
  "conversa": ["/chat", "/whatsapp"],
  "conversas": ["/chat", "/whatsapp"]
};

export function BitrixTopbar({
  sidebarExpanded = false
}: BitrixTopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { topBarColor, isDarkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [userLogo, setUserLogo] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [messages, setMessages] = useState<Notification[]>(mockMessages);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load user logo from localStorage and listen for changes
  useEffect(() => {
    const savedLogo = localStorage.getItem('userLogo');
    if (savedLogo) {
      setUserLogo(savedLogo);
    }

    // Listen for changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userLogo') {
        if (e.newValue) {
          setUserLogo(e.newValue);
        } else {
          setUserLogo(null);
        }
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === 'userLogo') {
        if (e.detail.value) {
          setUserLogo(e.detail.value);
        } else {
          setUserLogo(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []);

  // Função para buscar páginas e palavras-chave
  const searchPages = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const results = [];

    // Buscar por nome exato da página
    const exactMatch = SYSTEM_PAGES.find(page => 
      page.title.toLowerCase() === normalizedQuery
    );
    if (exactMatch) {
      results.push({ title: exactMatch.title, route: exactMatch.route, type: 'page' });
    }

    // Buscar por palavras-chave das páginas
    SYSTEM_PAGES.forEach(page => {
      const hasKeyword = page.keywords.some(keyword => 
        keyword.toLowerCase().includes(normalizedQuery) || 
        normalizedQuery.includes(keyword.toLowerCase())
      );
      if (hasKeyword && !results.find(r => r.route === page.route)) {
        results.push({ title: page.title, route: page.route, type: 'page' });
      }
    });

    // Buscar por mapeamento de palavras-chave
    Object.entries(KEYWORD_MAPPINGS).forEach(([keyword, routes]) => {
      if (keyword.toLowerCase().includes(normalizedQuery) || 
          normalizedQuery.includes(keyword.toLowerCase())) {
        routes.forEach(route => {
          const page = SYSTEM_PAGES.find(p => p.route === route);
          if (page && !results.find(r => r.route === route)) {
            results.push({ title: page.title, route: page.route, type: 'keyword' });
          }
        });
      }
    });

    return results.slice(0, 8); // Limitar a 8 resultados
  };

  // Verificar se está na página inicial (dashboard)
  const isIndexPage = location.pathname === '/';

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    console.log('Searching for:', term, 'on page:', location.pathname);
    
    if (term.trim()) {
      const results = searchPages(term);
      
      if (results.length === 0) {
        toast.error("Nenhum resultado encontrado", {
          description: `Não foi possível encontrar "${term}" no sistema.`,
          duration: 3000,
        });
        return;
      }

      if (results.length === 1) {
        // Redirecionar diretamente para a única página encontrada
        navigate(results[0].route);
        setSearchTerm("");
      } else {
        // Mostrar opções múltiplas
        toast.info("Múltiplos resultados encontrados", {
          description: `Encontramos ${results.length} páginas relacionadas a "${term}". Selecione uma das sugestões abaixo.`,
          duration: 4000,
        });
      }
    }
  };

  const getSearchPlaceholder = () => {
    return 'Pesquisar';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = messages.filter(m => !m.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markMessageAsRead = (id: string) => {
    setMessages(prev => 
      prev.map(m => m.id === id ? { ...m, read: true } : m)
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.url) {
      window.location.href = notification.url;
    }
    markNotificationAsRead(notification.id);
  };

  const handleMessageClick = (message: Notification) => {
    if (message.url) {
      window.location.href = message.url;
    }
    markMessageAsRead(message.id);
  };

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Utility function to trigger custom storage event
  const triggerStorageChange = (key: string, value: string | null) => {
    const event = new CustomEvent('customStorageChange', {
      detail: { key, value }
    });
    window.dispatchEvent(event);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 h-[38px] border-b shadow-lg z-30 transition-colors duration-200 bg-gradient-to-r from-[#0f172a] to-[#1e293b] dark:bg-gray-800 dark:from-gray-800 dark:to-gray-800"
      style={{ 
        borderColor: '#1e293b',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center px-3 h-full">
        {/* Left side - Empty for clean look */}
        <div className="flex-1"></div>

        {/* Center - Search Bar */}
        <div className="flex items-center justify-center flex-1 gap-3">
          {/* Calendar Button */}
          <button
            onClick={() => navigate('/calendar')}
            className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group"
            title="Ir para Calendário"
          >
            <Calendar className="h-4 w-4 text-white group-hover:text-gray-200 transition-colors duration-200" />
          </button>
          
          <div className="w-72">
            <TopBarSearch 
              placeholder={getSearchPlaceholder()}
              onSearch={handleSearch}
              showHistory={isIndexPage}
            />
          </div>
        </div>

        {/* Right Section - Time, Date, Icons and Profile */}
        <div className="flex items-center gap-3 justify-end flex-1">
          {/* Current Time and Date */}
          <div className="flex flex-col items-end text-white">
            <div className="text-xs font-medium">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-300">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Notifications Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:opacity-80 transition-colors relative text-white">
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {unreadNotifications}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 topbar-dropdown">
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Notificações</h3>
                <span className="text-xs text-gray-500">{unreadNotifications} não lidas</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 topbar-dropdown-item ${
                        !notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:opacity-80 transition-colors relative text-white">
                <MessageCircle className="h-4 w-4" />
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-xs bg-blue-500 text-white">
                    {unreadMessages}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 topbar-dropdown">
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Mensagens</h3>
                <span className="text-xs text-gray-500">{unreadMessages} não lidas</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhuma mensagem
                  </div>
                ) : (
                  messages.map((message) => (
                    <DropdownMenuItem
                      key={message.id}
                      className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 topbar-dropdown-item ${
                        !message.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {message.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {message.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {message.timestamp}
                          </p>
                        </div>
                        {!message.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 p-1 rounded-lg hover:opacity-80 transition-colors">
                <Avatar className="h-6 w-6 border border-white/20">
                  <AvatarImage src={profile.avatar_url || user?.user_metadata?.avatar_url} alt="User" />
                  <AvatarFallback className="bg-gray-600 text-white text-xs font-medium">
                    {(profile.name || user?.user_metadata?.name)?.substring(0, 1).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 topbar-dropdown">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || user?.user_metadata?.avatar_url} alt="User" />
                    <AvatarFallback className="bg-gray-600 text-white text-sm font-medium">
                      {(profile.name || user?.user_metadata?.name)?.substring(0, 1).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.name || user?.user_metadata?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'usuario@email.com'}
                    </p>
                  </div>
                </div>
              </div>
              
              <DropdownMenuItem 
                className="flex items-center gap-2 p-3 cursor-pointer topbar-dropdown-item"
                onClick={handleProfileClick}
              >
                <span className="text-sm">Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="flex items-center gap-2 p-3 cursor-pointer topbar-dropdown-item"
                onClick={toggleDarkMode}
              >
                <span className="text-sm">
                  {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="flex items-center gap-2 p-3 cursor-pointer topbar-dropdown-item"
                onClick={handleSettingsClick}
              >
                <span className="text-sm">Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200 mt-5" />
              
              <DropdownMenuItem 
                className="flex items-center gap-2 p-3 cursor-pointer topbar-dropdown-item hover:bg-red-50 text-red-600"
                onClick={signOut}
              >
                <span className="text-sm">Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default BitrixTopbar;