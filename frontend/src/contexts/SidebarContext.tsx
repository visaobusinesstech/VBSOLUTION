import { createContext, useContext, ReactNode } from 'react';

interface SidebarContextType {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  showMenuButtons: boolean;
  setShowMenuButtons: (show: boolean) => void;
  expandSidebarFromMenu: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  showMenuButtons: boolean;
  setShowMenuButtons: (show: boolean) => void;
}

export const SidebarProvider = ({ 
  children, 
  sidebarExpanded, 
  setSidebarExpanded,
  showMenuButtons,
  setShowMenuButtons
}: SidebarProviderProps) => {
  
  // Função especial para expandir sidebar via botões de menu
  const expandSidebarFromMenu = () => {
    if (!sidebarExpanded) {
      setSidebarExpanded(true);
      setShowMenuButtons(false);
    }
  };

  return (
    <SidebarContext.Provider value={{ 
      sidebarExpanded, 
      setSidebarExpanded, 
      showMenuButtons, 
      setShowMenuButtons,
      expandSidebarFromMenu 
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
