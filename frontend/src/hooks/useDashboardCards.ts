import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DashboardCard {
  id: string;
  owner_id: string;
  company_id?: string;
  card_id: string;
  title: string;
  card_type: string;
  visible: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardCardConfig {
  id: string;
  title: string;
  visible: boolean;
  type: string;
  position?: number;
}

// Cartões padrão disponíveis
export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: 'recentes', title: 'Recentes', visible: true, type: 'recentes' },
  { id: 'agenda', title: 'Agenda', visible: true, type: 'agenda' },
  { id: 'pendentes', title: 'Atividades Pendentes', visible: true, type: 'pendentes' },
  { id: 'andamento', title: 'Em Andamento', visible: true, type: 'andamento' },
  { id: 'atrasadas', title: 'Atrasadas', visible: true, type: 'atrasadas' },
  { id: 'equipes', title: 'Equipes de Trabalho', visible: true, type: 'equipes' },
  { id: 'projetos', title: 'Projetos Recentes', visible: true, type: 'projetos' },
  { id: 'standup', title: 'StandUp da IA', visible: true, type: 'standup' },
  { id: 'comentarios-atribuidos', title: 'Comentários Atribuídos', visible: false, type: 'comentarios-atribuidos' },
  { id: 'prioridades', title: 'Prioridades (LineUp)', visible: false, type: 'prioridades' },
];

export function useDashboardCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<DashboardCardConfig[]>(DEFAULT_DASHBOARD_CARDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar company_id do usuário
  const getCompanyId = useCallback(async () => {
    if (!user?.id) return null;

    try {
      // Tentar buscar na tabela company_users
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (companyUser?.company_id) {
        return companyUser.company_id;
      }

      // Tentar buscar na tabela user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.company_id) {
        return profile.company_id;
      }

      return null;
    } catch (error) {
      console.warn('Não foi possível buscar company_id:', error);
      return null;
    }
  }, [user?.id]);

  // Carregar cartões do usuário
  const loadCards = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primeiro, tentar buscar cartões salvos no Supabase
      const { data: savedCards, error: fetchError } = await supabase
        .from('dashboard_cards')
        .select('*')
        .eq('owner_id', user.id)
        .order('position', { ascending: true });

      if (fetchError) {
        console.warn('Erro ao buscar cartões salvos, usando padrões:', fetchError);
        // Se não conseguir buscar, usar cartões padrão
        setCards(DEFAULT_DASHBOARD_CARDS);
        setLoading(false);
        return;
      }

      if (savedCards && savedCards.length > 0) {
        // Converter cartões salvos para o formato esperado
        const formattedCards: DashboardCardConfig[] = savedCards.map(card => ({
          id: card.card_id,
          title: card.title,
          visible: card.visible,
          type: card.card_type,
          position: card.position
        }));

        // Adicionar cartões padrão que não estão salvos
        const savedCardIds = new Set(savedCards.map(card => card.card_id));
        const missingDefaultCards = DEFAULT_DASHBOARD_CARDS.filter(
          defaultCard => !savedCardIds.has(defaultCard.id)
        );

        const allCards = [...formattedCards, ...missingDefaultCards];
        
        // Ordenar por posição
        allCards.sort((a, b) => (a.position || 0) - (b.position || 0));
        
        setCards(allCards);
      } else {
        // Nenhum cartão salvo, usar padrões
        setCards(DEFAULT_DASHBOARD_CARDS);
        
        // Salvar cartões padrão no Supabase
        await saveDefaultCards();
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      setError('Erro ao carregar configurações dos cartões');
      setCards(DEFAULT_DASHBOARD_CARDS);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Salvar cartões padrão no Supabase
  const saveDefaultCards = useCallback(async () => {
    if (!user?.id) return;

    try {
      const companyId = await getCompanyId();
      
      const cardsToSave = DEFAULT_DASHBOARD_CARDS.map((card, index) => ({
        owner_id: user.id,
        company_id: companyId,
        card_id: card.id,
        title: card.title,
        card_type: card.type,
        visible: card.visible,
        position: index
      }));

      const { error } = await supabase
        .from('dashboard_cards')
        .upsert(cardsToSave, { onConflict: 'owner_id,card_id' });

      if (error) {
        console.error('Erro ao salvar cartões padrão:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar cartões padrão:', error);
    }
  }, [user?.id, getCompanyId]);

  // Adicionar novo cartão
  const addCard = useCallback(async (cardId: string, title: string, cardType: string) => {
    if (!user?.id) return false;

    try {
      setSaving(true);
      const companyId = await getCompanyId();
      
      // Verificar se o cartão já existe
      const existingCardIndex = cards.findIndex(card => card.id === cardId);
      
      if (existingCardIndex !== -1) {
        // Se existe mas está invisível, tornar visível
        const updatedCards = [...cards];
        updatedCards[existingCardIndex] = { ...updatedCards[existingCardIndex], visible: true };
        setCards(updatedCards);
        
        // Atualizar no Supabase
        const { error } = await supabase
          .from('dashboard_cards')
          .update({ visible: true })
          .eq('owner_id', user.id)
          .eq('card_id', cardId);

        if (error) {
          console.error('Erro ao ativar cartão:', error);
          toast.error('Erro ao ativar cartão');
          return false;
        }

        toast.success('Cartão ativado com sucesso!');
        return true;
      } else {
        // Adicionar novo cartão
        const newCard: DashboardCardConfig = {
          id: cardId,
          title,
          visible: true,
          type: cardType,
          position: cards.length
        };

        setCards(prev => [...prev, newCard]);

        // Salvar no Supabase
        const { error } = await supabase
          .from('dashboard_cards')
          .upsert({
            owner_id: user.id,
            company_id: companyId,
            card_id: cardId,
            title,
            card_type: cardType,
            visible: true,
            position: cards.length
          }, { onConflict: 'owner_id,card_id' });

        if (error) {
          console.error('Erro ao adicionar cartão:', error);
          // Reverter mudança local
          setCards(prev => prev.filter(card => card.id !== cardId));
          toast.error('Erro ao adicionar cartão');
          return false;
        }

        toast.success('Cartão adicionado com sucesso!');
        return true;
      }
    } catch (error) {
      console.error('Erro ao adicionar cartão:', error);
      setCards(prev => prev.filter(card => card.id !== cardId));
      toast.error('Erro ao adicionar cartão');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id, cards, getCompanyId]);

  // Remover cartão (ocultar)
  const removeCard = useCallback(async (cardId: string) => {
    if (!user?.id) return false;

    try {
      setSaving(true);
      
      // Atualizar estado local
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, visible: false } : card
      ));

      // Atualizar no Supabase
      const { error } = await supabase
        .from('dashboard_cards')
        .update({ visible: false })
        .eq('owner_id', user.id)
        .eq('card_id', cardId);

      if (error) {
        console.error('Erro ao remover cartão:', error);
        // Reverter mudança local
        setCards(prev => prev.map(card => 
          card.id === cardId ? { ...card, visible: true } : card
        ));
        toast.error('Erro ao remover cartão');
        return false;
      }

      toast.success('Cartão removido com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, visible: true } : card
      ));
      toast.error('Erro ao remover cartão');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  // Reativar cartão removido
  const reactivateCard = useCallback(async (cardId: string) => {
    if (!user?.id) return false;

    try {
      setSaving(true);
      
      // Atualizar estado local
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, visible: true } : card
      ));

      // Atualizar no Supabase
      const { error } = await supabase
        .from('dashboard_cards')
        .update({ visible: true })
        .eq('owner_id', user.id)
        .eq('card_id', cardId);

      if (error) {
        console.error('Erro ao reativar cartão:', error);
        // Reverter mudança local
        setCards(prev => prev.map(card => 
          card.id === cardId ? { ...card, visible: false } : card
        ));
        toast.error('Erro ao reativar cartão');
        return false;
      }

      toast.success('Cartão reativado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao reativar cartão:', error);
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, visible: false } : card
      ));
      toast.error('Erro ao reativar cartão');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  // Reordenar cartões
  const reorderCards = useCallback(async (newOrder: DashboardCardConfig[]) => {
    if (!user?.id) return false;

    try {
      setSaving(true);
      
      // Atualizar estado local
      setCards(newOrder);

      // Atualizar posições no Supabase
      const updates = newOrder.map((card, index) => ({
        owner_id: user.id,
        card_id: card.id,
        position: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('dashboard_cards')
          .update({ position: update.position })
          .eq('owner_id', update.owner_id)
          .eq('card_id', update.card_id);

        if (error) {
          console.error('Erro ao reordenar cartão:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar cartões:', error);
      toast.error('Erro ao reordenar cartões');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  // Carregar cartões quando o usuário mudar
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return {
    cards,
    loading,
    saving,
    error,
    addCard,
    removeCard,
    reactivateCard,
    reorderCards,
    refreshCards: loadCards
  };
}
