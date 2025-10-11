import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  icon?: React.ReactNode;
  iconName?: string;
}

interface PageHeaderContextType {
  title?: string;
  actions: PageAction[];
  setTitle: (title: string) => void;
  setActions: (actions: PageAction[]) => void;
  addAction: (action: PageAction) => void;
  clearActions: () => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

interface PageHeaderProviderProps {
  children: ReactNode;
}

export function PageHeaderProvider({ children }: PageHeaderProviderProps) {
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [actions, setActions] = useState<PageAction[]>([]);

  const addAction = (action: PageAction) => {
    setActions(prev => [...prev, action]);
  };

  const clearActions = () => {
    setActions([]);
  };

  return (
    <PageHeaderContext.Provider value={{
      title,
      actions,
      setTitle,
      setActions,
      addAction,
      clearActions
    }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (context === undefined) {
    throw new Error('usePageHeader deve ser usado dentro de um PageHeaderProvider');
  }
  return context;
}

// Hook para facilitar o uso em páginas
export function usePageHeaderConfig(config: { title?: string; actions?: PageAction[] }) {
  const { setTitle, setActions, clearActions } = usePageHeader();

  React.useEffect(() => {
    if (config.title) {
      setTitle(config.title);
    }
    
    if (config.actions) {
      setActions(config.actions);
    }

    // Cleanup ao desmontar
    return () => {
      clearActions();
      if (config.title) {
        setTitle('');
      }
    };
  }, [config.title, config.actions, setTitle, setActions, clearActions]);
}
