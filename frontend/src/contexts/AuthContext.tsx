import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInCompanyUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Debug log removido para console silencioso
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Mudado para true inicialmente
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        // Debug log removido para console silencioso
        setLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ AuthContext: Erro ao obter sessão:', sessionError);
          setError(sessionError.message);
        } else {
          // Debug logs removidos para console silencioso
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('❌ AuthContext: Erro inesperado:', err);
        setError('Erro inesperado ao conectar com o banco');
      } finally {
        setLoading(false);
        // Debug log removido para console silencioso
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Debug log removido para console silencioso
        
        if (event === 'SIGNED_IN') {
          // Debug log removido para console silencioso
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          // Debug log removido para console silencioso
          setSession(null);
          setUser(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          // Debug log removido para console silencioso
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err);
      setError('Erro ao fazer logout');
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setError(error.message);
      } else {
        setUser(user);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err);
      setError('Erro ao atualizar usuário');
    }
  };

  const signInCompanyUser = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando login de usuário da empresa:', email);
      
      // Buscar usuário na tabela company_users
      const { data: companyUser, error: userError } = await supabase
        .from('company_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .eq('status', 'active')
        .single();

      if (userError || !companyUser) {
        console.log('❌ Usuário não encontrado ou senha incorreta');
        return { success: false, error: 'Email ou senha incorretos' };
      }

      console.log('✅ Usuário encontrado:', companyUser.full_name);

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', companyUser.id)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        return { success: false, error: 'Erro ao buscar perfil do usuário' };
      }

      // Simular sessão do usuário
      const mockUser = {
        id: companyUser.id,
        email: companyUser.email,
        user_metadata: {
          full_name: companyUser.full_name,
          company_id: companyUser.company_id
        }
      } as User;

      const mockSession = {
        user: mockUser,
        access_token: 'mock_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        expires_at: Date.now() + 3600000, // 1 hora
        expires_in: 3600,
        token_type: 'bearer'
      } as Session;

      setUser(mockUser);
      setSession(mockSession);
      setError(null);

      console.log('✅ Login realizado com sucesso');
      return { success: true };
    } catch (err) {
      console.error('❌ Erro no login:', err);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
    refreshUser,
    signInCompanyUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
