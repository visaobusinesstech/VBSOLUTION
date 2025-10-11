
import { 
  Home, 
  Inbox, 
  MoreHorizontal, 
  Star, 
  ChevronRight, 
  Search, 
  Plus, 
  Folder, 
  List, 
  User, 
  HelpCircle,
  Settings,
  Calendar,
  Target,
  Building2,
  Users,
  MessageCircle,
  Phone,
  Briefcase,
  BarChart3,
  Users2,
  Package,
  Truck,
  CreditCard,
  ShoppingBag,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

const AppSidebar = () => {
  const { userName } = useUser();
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);

  return (
    <Sidebar className="border-r border-gray-200 bg-white w-64 sidebar-shadow sidebar-shadow-transition">
      {/* Header com seletor de usuário/workspace */}
      <SidebarHeader className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {userName || 'Usuário'}...
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-2">
        {/* Navegação Principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors">
                    <Home className="h-4 w-4" />
                    <span className="text-sm">Início</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/inbox" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors">
                    <Inbox className="h-4 w-4" />
                    <span className="text-sm">Caixa de entrada</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/more" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-2 py-2 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="text-sm">Mais</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Seção de Favoritos */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>
            <Collapsible open={isFavoritesExpanded} onOpenChange={setIsFavoritesExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Star className="h-3 w-3" />
                    Favoritos
                  </div>
                  <ChevronRight className={`h-3 w-3 text-gray-400 transition-transform ${isFavoritesExpanded ? 'rotate-90' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="pl-4 space-y-1">
                  {/* Itens favoritos podem ser adicionados aqui */}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* Seção de Espaços */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>
            <div className="flex items-center justify-between mb-2">
              <Collapsible open={isSpacesExpanded} onOpenChange={setIsSpacesExpanded}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Espaços
                    </div>
                    <ChevronRight className={`h-3 w-3 text-gray-400 transition-transform ${isSpacesExpanded ? 'rotate-90' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-1">
                    {/* Botões de ação dos espaços */}
                    <div className="flex items-center gap-2 mb-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                        <Search className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Item "Tudo" */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50">
                      <Star className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-700">Tudo</span>
                    </div>

                    {/* Espaço da Equipe */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50">
                      <Plus className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-700">E Espaço da equipe</span>
                    </div>

                    {/* Projetos */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50">
                      <Folder className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-700">Projetos</span>
                      <Plus className="h-3 w-3 text-gray-400 ml-auto" />
                    </div>

                    {/* Projeto 1 - Ativo */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 ml-4">
                      <List className="h-3 w-3 text-purple-600" />
                      <span className="text-sm text-purple-700 font-medium">Projeto 1</span>
                      <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 text-xs px-2 py-0.5">
                        3
                      </Badge>
                    </div>

                    {/* Projeto 2 */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 ml-4">
                      <List className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-700">Projeto 2</span>
                      <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
                        3
                      </Badge>
                    </div>

                    {/* Botão Criar Espaço */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start h-8 px-2 mt-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Criar Espaço
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* Botões de ação no final */}
        <div className="mt-auto pt-4 space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <User className="h-3 w-3 mr-2" />
            Convidar
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <HelpCircle className="h-3 w-3 mr-2" />
            Ajuda
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
