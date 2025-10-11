import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  name: string;
  position: string;
  department: string;
  avatar_url: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    position: '',
    department: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Prevent infinite loops
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const loadProfile = async () => {
    if (!user?.id || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('name, position, department, avatar_url')
        .eq('id', user.id)
        .maybeSingle(); // ✅ Use maybeSingle instead of single

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setProfile({
          name: data.name || '',
          position: data.position || '',
          department: data.department || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Fallback to user metadata
        setProfile({
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          position: '',
          department: '',
          avatar_url: user.user_metadata?.avatar_url || ''
        });
      }
    } catch (err: any) {
      // Silent error - don't spam console
      setError(err.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load profile ONCE when user changes
  useEffect(() => {
    if (!user?.id) {
      hasLoadedRef.current = false;
      return;
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadProfile();
  }, [user?.id]); // ✅ Only depend on user?.id

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile
  };
}