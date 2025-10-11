
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BitrixSidebar } from '@/components/BitrixSidebar';
import { BitrixTopbar } from '@/components/BitrixTopbar';
import { useSidebarPreferences } from '@/hooks/useSidebarPreferences';
import { useTheme } from '@/contexts/ThemeContext';
import { useCompanyTheme } from '@/hooks/useCompanyTheme';
import { SidebarProvider } from '@/contexts/SidebarContext';
import ErrorBoundary from './ErrorBoundary';

const Layout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showMenuButtons, setShowMenuButtons] = useState(true);
  const { sidebarMode } = useSidebarPreferences();
  const { systemBackground, sidebarColor } = useTheme();
  
  // Debug do estado do sidebar
  // Debug log removido para console silencioso
  
  // Carregar tema da empresa quando o usuário estiver logado
  useCompanyTheme();

  // Para o novo layout, a sidebar não sobrepõe o conteúdo
  const getSidebarWidth = () => {
    return ''; // Não precisa de padding left pois a sidebar está ao lado
  };

  return (
    <ErrorBoundary>
      <SidebarProvider 
        sidebarExpanded={sidebarExpanded} 
        setSidebarExpanded={setSidebarExpanded}
        showMenuButtons={showMenuButtons}
        setShowMenuButtons={setShowMenuButtons}
      >
        <div 
          className="min-h-screen w-full transition-colors duration-200"
          style={{ backgroundColor: systemBackground }}
        >
          <BitrixTopbar />
          
          <div className="flex pt-[38px]">
            <BitrixSidebar isExpanded={sidebarExpanded} setIsExpanded={setSidebarExpanded} />
            
            <main 
              className={`flex-1 transition-all duration-300 ease-out`}
              style={{ 
                backgroundColor: systemBackground,
                marginLeft: sidebarExpanded ? '240px' : '64px'
              }}
            >
              <div className="p-6">
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default Layout;
