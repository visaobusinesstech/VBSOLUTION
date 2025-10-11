import { useState, useEffect, useCallback } from 'react';

interface ConversationDrafts {
  [conversationId: string]: string;
}

const DRAFTS_STORAGE_KEY = 'whatsapp_conversation_drafts';

export function useConversationDrafts() {
  const [drafts, setDrafts] = useState<ConversationDrafts>({});

  // Carregar rascunhos do localStorage na inicialização
  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
    } catch (error) {
      console.error('Erro ao carregar rascunhos:', error);
    }
  }, []);

  // Salvar rascunhos no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Erro ao salvar rascunhos:', error);
    }
  }, [drafts]);

  // Obter rascunho de uma conversa específica
  const getDraft = useCallback((conversationId: string): string => {
    return drafts[conversationId] || '';
  }, [drafts]);

  // Salvar rascunho de uma conversa específica
  const setDraft = useCallback((conversationId: string, draft: string) => {
    setDrafts(prev => ({
      ...prev,
      [conversationId]: draft
    }));
  }, []);

  // Limpar rascunho de uma conversa específica
  const clearDraft = useCallback((conversationId: string) => {
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[conversationId];
      return newDrafts;
    });
  }, []);

  // Limpar todos os rascunhos
  const clearAllDrafts = useCallback(() => {
    setDrafts({});
  }, []);

  return {
    drafts,
    getDraft,
    setDraft,
    clearDraft,
    clearAllDrafts,
    hasDraft: useCallback((conversationId: string) => {
      return Boolean(drafts[conversationId]?.trim());
    }, [drafts])
  };
}
