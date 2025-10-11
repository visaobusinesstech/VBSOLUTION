import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Integration {
  id: string;
  userId: string;
  platform: 'GOOGLE' | 'FACEBOOK' | 'INSTAGRAM' | 'META' | 'WHATSAPP' | 'WEBHOOK';
  name: string;
  description?: string;
  isActive: boolean;
  isConnected: boolean;
  config?: any;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  tokens?: Array<{
    id: string;
    tokenType: string;
    expiresAt?: string;
    scope?: string;
  }>;
  permissions?: Array<{
    id: string;
    permission: string;
    granted: boolean;
  }>;
}

export interface IntegrationStatus {
  google: {
    connected: boolean;
    integrations: number;
  };
  meta: {
    connected: boolean;
    integrations: number;
  };
  total: number;
}

export function useIntegrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar integrações do usuário
  const fetchIntegrations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/integrations', {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar integrações');
      }

      const data = await response.json();
      
      if (data.success) {
        setIntegrations(data.data);
      } else {
        throw new Error(data.error || 'Erro ao buscar integrações');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar integrações:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Buscar status das integrações
  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/integrations/integrations/status', {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar status');
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar status:', err);
    }
  }, [user?.id]);

  // Criar nova integração
  const createIntegration = useCallback(async (
    platform: Integration['platform'],
    name: string,
    description?: string,
    config?: any
  ) => {
    if (!user?.id) return null;

    try {
      const response = await fetch('/api/integrations/integrations', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          name,
          description,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar integração');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchIntegrations(); // Recarregar lista
        return data.data;
      } else {
        throw new Error(data.error || 'Erro ao criar integração');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar integração:', err);
      return null;
    }
  }, [user?.id, fetchIntegrations]);

  // Desconectar integração
  const disconnectIntegration = useCallback(async (integrationId: string) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/integrations/integrations/${integrationId}/disconnect`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao desconectar integração');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchIntegrations(); // Recarregar lista
        await fetchStatus(); // Atualizar status
        return true;
      } else {
        throw new Error(data.error || 'Erro ao desconectar integração');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao desconectar integração:', err);
      return false;
    }
  }, [user?.id, fetchIntegrations, fetchStatus]);

  // Remover integração
  const deleteIntegration = useCallback(async (integrationId: string) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/integrations/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao remover integração');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchIntegrations(); // Recarregar lista
        await fetchStatus(); // Atualizar status
        return true;
      } else {
        throw new Error(data.error || 'Erro ao remover integração');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao remover integração:', err);
      return false;
    }
  }, [user?.id, fetchIntegrations, fetchStatus]);

  // Testar integração
  const testIntegration = useCallback(async (integrationId: string) => {
    if (!user?.id) return null;

    try {
      const response = await fetch(`/api/integrations/integrations/${integrationId}/test`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao testar integração');
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Erro ao testar integração');
      }
    } catch (err: any) {
      console.error('Erro ao testar integração:', err);
      return { success: false, message: err.message };
    }
  }, [user?.id]);

  // Buscar integrações conectadas por plataforma
  const getConnectedIntegrationsByPlatform = useCallback((platform: Integration['platform']) => {
    return integrations.filter(integration => 
      integration.platform === platform && integration.isConnected && integration.isActive
    );
  }, [integrations]);

  // Verificar se uma plataforma está conectada
  const isPlatformConnected = useCallback((platform: Integration['platform']) => {
    return integrations.some(integration => 
      integration.platform === platform && integration.isConnected && integration.isActive
    );
  }, [integrations]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      fetchIntegrations();
      fetchStatus();
    }
  }, [user?.id, fetchIntegrations, fetchStatus]);

  return {
    integrations,
    status,
    loading,
    error,
    createIntegration,
    disconnectIntegration,
    deleteIntegration,
    testIntegration,
    getConnectedIntegrationsByPlatform,
    isPlatformConnected,
    refreshIntegrations: fetchIntegrations,
    refreshStatus: fetchStatus,
  };
}
