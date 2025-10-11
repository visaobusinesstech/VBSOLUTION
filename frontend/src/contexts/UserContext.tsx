import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem('userName');
    return saved || '';
  });

  const [userEmail, setUserEmail] = useState(() => {
    const saved = localStorage.getItem('userEmail');
    return saved || '';
  });

  const [userAvatar, setUserAvatar] = useState(() => {
    const saved = localStorage.getItem('userAvatar');
    return saved || '';
  });

  // Função para buscar dados do perfil do Supabase
  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Erro ao obter usuário autenticado:', userError);
        return;
      }

      // Buscar perfil na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return;
      }

      if (profile) {
        // Atualizar os estados com os dados do Supabase
        if (profile.name) {
          setUserName(profile.name);
        }
        if (profile.email) {
          setUserEmail(profile.email);
        }
        if (profile.avatar_url) {
          setUserAvatar(profile.avatar_url);
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
    }
  };

  // Função para atualizar dados do usuário
  const refreshUserData = async () => {
    await fetchUserProfile();
  };

  // Carregar dados do perfil quando o componente for montado
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Salvar no localStorage sempre que houver mudanças
  useEffect(() => {
    if (userName) {
      localStorage.setItem('userName', userName);
    }
  }, [userName]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem('userEmail', userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userAvatar) {
      localStorage.setItem('userAvatar', userAvatar);
    }
  }, [userAvatar]);

  const value: UserContextType = {
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    userAvatar,
    setUserAvatar,
    refreshUserData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
