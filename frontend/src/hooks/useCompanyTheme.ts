import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

export const useCompanyTheme = () => {
  const { user } = useAuth();
  const { loadCompanyTheme } = useTheme();

  useEffect(() => {
    if (user?.id) {
      loadCompanyTheme(user.id);
    }
  }, [user?.id, loadCompanyTheme]);

  return { loadCompanyTheme };
};
