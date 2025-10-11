
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationContextType {
  currentPath: string;
  navigate: (path: string) => void;
  goBack: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setLoading] = useState(false);

  const handleNavigate = (path: string) => {
    setLoading(true);
    try {
      navigate(path);
    } finally {
      setTimeout(() => setLoading(false), 100);
    }
  };

  const goBack = () => {
    setLoading(true);
    try {
      navigate(-1);
    } finally {
      setTimeout(() => setLoading(false), 100);
    }
  };

  return (
    <NavigationContext.Provider value={{
      currentPath: location.pathname,
      navigate: handleNavigate,
      goBack,
      isLoading,
      setLoading,
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
