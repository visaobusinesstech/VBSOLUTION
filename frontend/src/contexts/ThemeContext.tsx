import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  topBarColor: string;
  sidebarColor: string;
  buttonColor: string;
  setTopBarColor: (color: string) => void;
  setSidebarColor: (color: string) => void;
  setButtonColor: (color: string) => void;
  systemBackground: string;
  textColor: string;
  loadCompanyTheme: (userId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    const darkModeEnabled = saved ? JSON.parse(saved) : false;
    
    // Aplicar classe dark imediatamente na inicialização
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return darkModeEnabled;
  });

  const [topBarColor, setTopBarColor] = useState('#3F30F1');
  const [sidebarColor, setSidebarColor] = useState('#dee2e3');
  const [buttonColor, setButtonColor] = useState('#4A5477');

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const systemBackground = isDarkMode ? '#000000' : '#f8fafc';
  const textColor = isDarkMode ? '#ffffff' : '#1f2937';

  // Função para carregar tema da empresa
  const loadCompanyTheme = async (userId: string) => {
    if (!userId) return;

    try {
      const { data: companySettings, error } = await supabase
        .from('company_settings')
        .select('sidebar_color, topbar_color, button_color')
        .eq('company_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar tema da empresa:', error);
        return;
      }

      if (companySettings) {
        setSidebarColor(companySettings.sidebar_color || '#dee2e3');
        setTopBarColor(companySettings.topbar_color || '#3F30F1');
        setButtonColor(companySettings.button_color || '#4A5477');

        // Aplicar cores no CSS
        document.documentElement.style.setProperty('--sidebar-color', companySettings.sidebar_color || '#dee2e3');
        document.documentElement.style.setProperty('--topbar-color', companySettings.topbar_color || '#3F30F1');
        document.documentElement.style.setProperty('--button-color', companySettings.button_color || '#4A5477');
      }
    } catch (error) {
      console.error('Erro ao carregar tema da empresa:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    
    // Aplicar classe dark no elemento raiz
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    topBarColor,
    sidebarColor,
    buttonColor,
    setTopBarColor,
    setSidebarColor,
    setButtonColor,
    systemBackground,
    textColor,
    loadCompanyTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 
