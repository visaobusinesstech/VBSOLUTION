import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { navItems } from '@/nav-items';
import { usePageConfig } from '@/hooks/usePageConfig';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Plus, Settings, Upload, Download, Users, Building2, Package, MoreHorizontal, AlignJustify, Home } from 'lucide-react';
import { getPageIcon } from '@/utils/pageIcons';

interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  icon?: React.ReactNode;
  iconName?: string;
}

interface PageHeaderProps {
  title?: string;
  actions?: PageAction[];
  onManageCards?: () => void;
  showManageCardsButton?: boolean;
  onSettings?: () => void;
  showSettingsButton?: boolean;
  pageIcon?: React.ReactNode;
  showPageIcon?: boolean;
  showSidebarToggle?: boolean;
}

// Função para renderizar ícones baseados no nome
const renderIcon = (iconName?: string) => {
  if (!iconName) return null;
  
  const iconProps = { size: 12 };
  
  switch (iconName) {
    case 'Plus':
      return <Plus {...iconProps} />;
    case 'Settings':
      return <Settings {...iconProps} />;
    case 'Upload':
      return <Upload {...iconProps} />;
    case 'Download':
      return <Download {...iconProps} />;
    case 'Users':
      return <Users {...iconProps} />;
    case 'Building2':
      return <Building2 {...iconProps} />;
    case 'Package':
      return <Package {...iconProps} />;
    default:
      return null;
  }
};

export function PageHeader({ title: propTitle, actions: propActions, onManageCards, showManageCardsButton = false, onSettings, showSettingsButton = false, pageIcon, showPageIcon = false, showSidebarToggle = false }: PageHeaderProps) {
  const location = useLocation();
  const pageConfig = usePageConfig();
  
  // Obter estado da sidebar
  let sidebarExpanded = false;
  let setSidebarExpanded: ((expanded: boolean) => void) | undefined;
  let showMenuButtons = true;
  let expandSidebarFromMenu: (() => void) | undefined;
  try {
    const { 
      sidebarExpanded: expanded, 
      setSidebarExpanded: setExpanded, 
      showMenuButtons: showButtons,
      expandSidebarFromMenu: expandFromMenu 
    } = useSidebar();
    sidebarExpanded = expanded;
    setSidebarExpanded = setExpanded;
    showMenuButtons = showButtons;
    expandSidebarFromMenu = expandFromMenu;
  } catch {
    // Se o contexto não existir, usar valor padrão
  }
  
  // Tentar usar o contexto, mas não falhar se não existir
  let contextTitle: string | undefined;
  let contextActions: PageAction[] = [];
  
  try {
    const pageHeaderContext = usePageHeader();
    contextTitle = pageHeaderContext.title;
    contextActions = pageHeaderContext.actions;
  } catch {
    // Se o contexto não existir, continuar sem ele
  }
  
  // Verificar se está na página Index (Dashboard)
  const isIndexPage = location.pathname === '/' || location.pathname === '/index';

  // Determinar o título da página
  const getPageTitle = (): string => {
    // Prioridade: contexto > props > configuração > navItems
    if (contextTitle) return contextTitle;
    if (propTitle) return propTitle;
    if (pageConfig?.title) return pageConfig.title;
    
    // Buscar no navItems baseado na rota atual
    const currentPath = location.pathname;
    const navItem = navItems.find(item => item.to === currentPath);
    
    if (navItem) {
      return navItem.title;
    }
    
    // Para rotas com parâmetros (como /companies/:id), tentar encontrar a rota base
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const basePath = `/${pathSegments[0]}`;
      const baseNavItem = navItems.find(item => item.to === basePath);
      
      if (baseNavItem) {
        // Para rotas com ID, adicionar "Detalhes" ao título
        if (pathSegments.length > 1 && pathSegments[1]) {
          return `${baseNavItem.title} - Detalhes`;
        }
        return baseNavItem.title;
      }
    }
    
    // Fallback
    return 'Página';
  };

  // Determinar as ações da página
  const getPageActions = (): PageAction[] => {
    // Prioridade: contexto > props > configuração
    if (contextActions.length > 0) return contextActions;
    if (propActions) return propActions;
    if (pageConfig?.actions) return pageConfig.actions;
    
    // Retornar ações padrão
    return [];
  };

  const pageTitle = getPageTitle();
  const pageActions = getPageActions();
  
  // Determinar o ícone da página
  const currentPageIcon = pageIcon || getPageIcon(location.pathname);

  return (
    <div 
      className="fixed top-[38px] right-0 h-[48px] bg-white dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out"
      style={{
        left: sidebarExpanded ? '240px' : '64px'
      }}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Título da página com ícones à esquerda */}
        <div className="flex items-center gap-3">
          {/* Botão de expandir sidebar (só aparece quando colapsada) - À ESQUERDA */}
          {showSidebarToggle && !sidebarExpanded && showMenuButtons && setSidebarExpanded && (
            <Button
              variant="ghost"
              size="sm"
              className={`w-6 h-6 p-0 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200 ${isIndexPage ? 'opacity-90' : ''}`}
              onClick={expandSidebarFromMenu}
              title="Expandir menu lateral"
            >
              <AlignJustify size={14} />
            </Button>
          )}
          
          {/* Ícone da página atual - À DIREITA do botão toggle */}
          {showPageIcon && (
            <div className={`flex items-center justify-center w-6 h-6 text-black dark:text-white ${isIndexPage ? 'opacity-90' : ''}`}>
              {currentPageIcon}
            </div>
          )}
          
          {/* Título */}
          <h1 className={`text-[15px] font-semibold text-gray-900 dark:text-white tracking-[-0.025em] select-none flex items-center ${isIndexPage ? 'opacity-90' : ''}`}>
            {pageTitle}
          </h1>
        </div>
        
        {/* Ações/Botões */}
        <div className="flex items-center gap-2">
          {/* Botão "Gerenciar cartões" - igual ao Dashboard mas menor */}
          {showManageCardsButton && onManageCards && (
            <Button 
              className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-md transition-all duration-300 text-[12px] h-[28px]"
              onClick={onManageCards}
            >
              <Settings size={12} />
              Gerenciar cartões
            </Button>
          )}
          
          {/* Botão de configurações (3 pontinhos) */}
          {showSettingsButton && onSettings && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[28px] w-[28px] p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              onClick={onSettings}
              title="Configurações da saudação"
            >
              <MoreHorizontal size={12} className="text-gray-600 dark:text-gray-300" />
            </Button>
          )}
          
          {/* Botões específicos da página */}
          {pageActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              className={`h-[28px] px-3 text-[13px] font-medium rounded-[6px] transition-all duration-150 shadow-sm ${
                action.variant === 'outline' 
                  ? 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 border-0 hover:shadow-md'
              }`}
            >
              {(action.icon || action.iconName) && (
                <span className="mr-1.5 opacity-90">
                  {action.icon || renderIcon(action.iconName)}
                </span>
              )}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
