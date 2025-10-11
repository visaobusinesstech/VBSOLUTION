import React, { createContext, useContext, useState, useEffect } from 'react';

interface AgentModeContextType {
  agentModes: Record<string, 'human' | 'ai'>;
  setAgentMode: (chatId: string, mode: 'human' | 'ai') => void;
  getAgentMode: (chatId: string) => 'human' | 'ai';
  isAIMode: (chatId: string) => boolean;
}

const AgentModeContext = createContext<AgentModeContextType | undefined>(undefined);

export function AgentModeProvider({ children }: { children: React.ReactNode }) {
  const [agentModes, setAgentModes] = useState<Record<string, 'human' | 'ai'>>({});

  // Carregar modos salvos do localStorage
  useEffect(() => {
    const savedModes = localStorage.getItem('agentModes');
    if (savedModes) {
      try {
        setAgentModes(JSON.parse(savedModes));
      } catch (error) {
        console.error('Erro ao carregar modos do agente:', error);
      }
    }
  }, []);

  // Salvar modos no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('agentModes', JSON.stringify(agentModes));
  }, [agentModes]);

  const setAgentMode = (chatId: string, mode: 'human' | 'ai') => {
    setAgentModes(prev => ({
      ...prev,
      [chatId]: mode
    }));
  };

  const getAgentMode = (chatId: string): 'human' | 'ai' => {
    return agentModes[chatId] || 'human'; // Padrão é humano
  };

  const isAIMode = (chatId: string): boolean => {
    return getAgentMode(chatId) === 'ai';
  };

  return (
    <AgentModeContext.Provider value={{
      agentModes,
      setAgentMode,
      getAgentMode,
      isAIMode
    }}>
      {children}
    </AgentModeContext.Provider>
  );
}

export function useAgentMode() {
  const context = useContext(AgentModeContext);
  if (context === undefined) {
    throw new Error('useAgentMode deve ser usado dentro de um AgentModeProvider');
  }
  return context;
}
