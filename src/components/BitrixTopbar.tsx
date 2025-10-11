
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, MessageCircle, User, Settings, Sun, Moon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// Opções de páginas para busca
const pageOptions = [
  { value: '/', label: 'Dashboard' },
  { value: '/chat', label: 'Conversas' },
  { value: '/feed', label: 'Feed' },
  { value: '/projects', label: 'Projetos' },
  { value: '/activities', label: 'Atividades' },
  { value: '/leads-sales', label: 'Leads e Vendas' },
  { value: '/companies', label: 'Empresas' },
  { value: '/calendar', label: 'Calendário' },
  { value: '/files', label: 'Arquivos' },
  { value: '/work-groups', label: 'Grupos de Trabalho' },
  { value: '/inventory', label: 'Inventário' },
  { value: '/employees', label: 'Funcionários' },
  { value: '/products', label: 'Produtos' },
  { value: '/whatsapp', label: 'WhatsApp' },
  { value: '/email', label: 'E-mail' }
];

// Mapeamento de palavras-chave para páginas
const keywordMapping: { [key: string]: string } = {
  // Dashboard
  'dashboard': '/',
  'painel': '/',
  'inicio': '/',
  'home': '/',
  'principal': '/',
  
  // Conversas/Chat
  'chat': '/chat',
  'conversa': '/chat',
  'conversas': '/chat',
  'mensagem': '/chat',
  'mensagens': '/chat',
  'bate-papo': '/chat',
  
  // Feed
  'feed': '/feed',
  'timeline': '/feed',
  'publicacao': '/feed',
  'publicacoes': '/feed',
  'noticias': '/feed',
  'posts': '/feed',
  'post': '/feed',
  
  // Projetos
  'projeto': '/projects',
  'projetos': '/projects',
  'project': '/projects',
  'projects': '/projects',
  
  // Atividades
  'atividade': '/activities',
  'atividades': '/activities',
  'tarefa': '/activities',
  'tarefas': '/activities',
  'task': '/activities',
  'tasks': '/activities',
  'activity': '/activities',
  'activities': '/activities',
  
  // Leads e Vendas
  'lead': '/leads-sales',
  'leads': '/leads-sales',
  'venda': '/leads-sales',
  'vendas': '/leads-sales',
  'sales': '/leads-sales',
  'crm': '/leads-sales',
  'cliente': '/leads-sales',
  'clientes': '/leads-sales',
  'prospect': '/leads-sales',
  'prospects': '/leads-sales',
  
  // Empresas
  'empresa': '/companies',
  'empresas': '/companies',
  'company': '/companies',
  'companies': '/companies',
  'organizacao': '/companies',
  'organizacoes': '/companies',
  
  // Calendário
  'calendario': '/calendar',
  'calendar': '/calendar',
  'agenda': '/calendar',
  'evento': '/calendar',
  'eventos': '/calendar',
  'reuniao': '/calendar',
  'reunioes': '/calendar',
  'compromisso': '/calendar',
  'compromissos': '/calendar',
  
  // Arquivos
  'arquivo': '/files',
  'arquivos': '/files',
  'file': '/files',
  'files': '/files',
  'documento': '/files',
  'documentos': '/files',
  'anexo': '/files',
  'anexos': '/files',
  
  // Grupos de Trabalho
  'grupo': '/work-groups',
  'grupos': '/work-groups',
  'equipe': '/work-groups',
  'equipes': '/work-groups',
  'time': '/work-groups',
  'times': '/work-groups',
  'team': '/work-groups',
  'teams': '/work-groups',
  'workgroup': '/work-groups',
  'workgroups': '/work-groups',
  
  // Inventário
  'inventario': '/inventory',
  'inventory': '/inventory',
  'estoque': '/inventory',
  'item': '/inventory',
  'itens': '/inventory',
  
  // Funcionários
  'funcionario': '/employees',
  'funcionarios': '/employees',
  'employee': '/employees',
  'employees': '/employees',
  'colaborador': '/employees',
  'colaboradores': '/employees',
  'usuario': '/employees',
  'usuarios': '/employees',
  'user': '/employees',
  'users': '/employees',
  
  // Produtos
  'produto': '/products',
  'produtos': '/products',
  'product': '/products',
  'products': '/products',
  'catalogo': '/products',
  'catalog': '/products',
  
  // WhatsApp
  'whatsapp': '/whatsapp',
  'whats': '/whatsapp',
  'wpp': '/whatsapp',
  'zap': '/whatsapp',
  
  // E-mail
  'email': '/email',
  'e-mail': '/email',
  'mail': '/email',
  'correio': '/email'
};

export function BitrixTopbar({
  sidebarExpanded = false
}: BitrixTopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { topBarColor, isDarkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState<string>('');
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    console.log('Searching for:', term, 'on page:', location.pathname);
  };

  // Função para busca inteligente por palavras-chave
  const findPageByKeyword = (searchText: string): string | null => {
    const text = searchText.toLowerCase().trim();
    
    // Busca exata por palavra-chave
    if (keywordMapping[text]) {
      return keywordMapping[text];
    }
    
    // Busca por palavras-chave contidas no texto
    const words = text.split(' ').filter(word => word.length > 2);
    for (const word of words) {
      if (keywordMapping[word]) {
        return keywordMapping[word];
      }
    }
    
    // Busca parcial - verifica se alguma palavra-chave está contida no texto
    for (const keyword in keywordMapping) {
      if (text.includes(keyword) || keyword.includes(text)) {
        return keywordMapping[keyword];
      }
    }
    
    return null;
  };

  const handleSearchSubmit = () => {
    const searchText = searchTerm.trim();
    
    // Primeiro: Tenta busca inteligente se há texto digitado
    if (searchText) {
      const foundPage = findPageByKeyword(searchText);
      
      if (foundPage) {
        // Redireciona para a página encontrada
        navigate(foundPage);
        return;
      }
      
      // Se não encontrou página pela palavra-chave, mas há página selecionada
      if (selectedPage) {
        const searchQuery = encodeURIComponent(searchText);
        if (selectedPage === '/') {
          navigate(`/search?q=${searchQuery}`);
        } else {
          navigate(`${selectedPage}?search=${searchQuery}`);
        }
        return;
      }
      
      // Se não há página selecionada, faz busca global
      const searchQuery = encodeURIComponent(searchText);
      navigate(`/search?q=${searchQuery}`);
      return;
    }
    
    // Se não há texto de busca, verifica se há página selecionada
    if (selectedPage) {
      navigate(selectedPage);
      return;
    }
    
    // Se não há texto nem página selecionada
    alert('Por favor, digite algo para buscar ou selecione uma página.');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
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

  // Utility function to trigger custom storage event
  const triggerStorageChange = (key: string, value: string | null) => {
    const event = new CustomEvent('customStorageChange', {
      detail: { key, value }
    });
    window.dispatchEvent(event);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 h-[46px] border-b shadow-lg z-30 transition-colors duration-200"
      style={{ 
        backgroundColor: topBarColor,
        borderColor: isDarkMode ? '#1f2937' : '#e5e7eb'
      }}
    >
      <div className="flex items-center px-2 md:px-4 h-full">
        {/* Logo and Search Bar Section */}
        <div className="flex items-center gap-6 flex-1 justify-center">
          {/* Logo */}
          <div className="w-16 h-8 md:w-20 md:h-10 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {userLogo ? (
              <img 
                src={userLogo} 
                alt="Logo da empresa" 
                className="w-14 h-6 md:w-18 md:h-8 object-contain rounded"
              />
            ) : (
              <div className="text-center">
                <div className="text-xs text-blue-300 font-medium">Logo</div>
                <div className="text-xs text-blue-400">Config</div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 w-auto">
            {/* Page Selector */}
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-40 h-8 text-sm border bg-white">
                <SelectValue placeholder="Página (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {pageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search Input and Button */}
            <div className="relative flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-3 py-1 w-64 md:w-80 border rounded-l-md text-sm h-8 transition-all duration-200 [&::placeholder]:text-gray-500"
                  style={{
                    backgroundColor: '#d6d6d6',
                    borderColor: '#d6d6d6',
                    color: '#333333',
                    outline: 'none'
                  }}
                  placeholder={getSearchPlaceholder()}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#b8b8b8';
                    e.target.style.boxShadow = '0 0 0 1px #b8b8b8';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d6d6d6';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                onClick={handleSearchSubmit}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md h-8 transition-colors duration-200 flex items-center justify-center"
                title="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Time, Notifications, Messages and Profile */}
        <div className="flex items-center gap-1 md:gap-2 justify-end">
          {/* Current Time */}
          <div className="flex flex-col items-end">
            <div className="text-xs md:text-sm font-medium text-white">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-blue-300 hidden md:block">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-blue-800/30 transition-colors relative">
                <Bell className="h-4 w-4 text-white" />
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                    {unreadNotifications}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
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
                      className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 ${
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

          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-blue-800/30 transition-colors relative">
                <MessageCircle className="h-4 w-4 text-white" />
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-blue-500 text-white">
                    {unreadMessages}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
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
                      className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 ${
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
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-blue-800/30 transition-colors">
                <Avatar className="h-6 w-6 border-2 border-white/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                  <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                    {user?.user_metadata?.name ? user.user_metadata.name.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                    <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                      {user?.user_metadata?.name ? user.user_metadata.name.substring(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'usuario@email.com'}
                    </p>
                  </div>
                </div>
              </div>
              
              <DropdownMenuItem className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-gray-500" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm">
                  {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-red-50 text-red-600"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
