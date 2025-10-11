import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanySettings } from './useCompanySettings';
import { supabase } from '@/integrations/supabase/client';

export interface UserCompanyProfile {
  companyName: string;
  companyLogo: string | null;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  userInitials: string;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

export function useUserCompanyProfile(): UserCompanyProfile {
  const { user } = useAuth();
  const { settings, loading: settingsLoading, fetchCompanySettings } = useCompanySettings(user?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar configurações da empresa passando o ID do usuário
      await fetchCompanySettings(user.id);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar perfil';
      console.error('Erro ao carregar perfil:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, fetchCompanySettings]);

  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [user, refreshProfile]);

  // Calcular iniciais do usuário
  const getUserInitials = (): string => {
    if (!user) return 'U';
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Obter nome de exibição do usuário
  const getUserDisplayName = (): string => {
    if (!user) return 'Usuário';
    return user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
  };

  // Obter email do usuário
  const getUserEmail = (): string => {
    if (!user) return '';
    return user.email || '';
  };

  // Obter avatar do usuário
  const getUserAvatar = (): string | null => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || null;
  };

  // Obter nome da empresa
  const getCompanyName = (): string => {
    if (settingsLoading || !settings) return 'Carregando...';
    return settings.company_name || 'CRM Sistema';
  };

  // Obter logo da empresa
  const getCompanyLogo = (): string | null => {
    if (settingsLoading || !settings) return null;
    return settings.logo_url || null;
  };

  return {
    companyName: getCompanyName(),
    companyLogo: getCompanyLogo(),
    userName: getUserDisplayName(),
    userEmail: getUserEmail(),
    userAvatar: getUserAvatar(),
    userInitials: getUserInitials(),
    loading: loading || settingsLoading,
    error,
    refreshProfile,
  };
}
