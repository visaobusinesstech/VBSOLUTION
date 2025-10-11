import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const auth = useAuthContext();
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema.",
      });

      return { data };
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('🚀 Iniciando cadastro de usuário:', { email, userData });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        console.error('❌ Erro no cadastro Supabase:', error);
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      console.log('✅ Usuário criado no Supabase Auth:', data.user?.id);

      // Se o cadastro foi bem-sucedido, criar o perfil na tabela profiles
      if (data.user) {
        try {
          console.log('📝 Criando perfil na tabela profiles...');
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: userData.name || '',
                company: userData.company || '',
              }
            ])
            .select()
            .single();

          if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError);
            toast({
              title: "Aviso",
              description: "Conta criada, mas perfil não foi criado automaticamente. Entre em contato com o suporte.",
              variant: "destructive",
            });
          } else {
            console.log('✅ Perfil criado com sucesso:', profileData);
          }
        } catch (profileError) {
          console.error('❌ Erro inesperado ao criar perfil:', profileError);
          toast({
            title: "Aviso",
            description: "Conta criada, mas perfil não foi criado automaticamente. Entre em contato com o suporte.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return { data };
    } catch (error) {
      console.error('❌ Erro inesperado no cadastro:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro durante o cadastro.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      // Redirecionar para login após logout
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao enviar o email.",
        variant: "destructive",
      });
      return { error };
    }
  };

  // Função para obter o perfil do usuário logado
  const getProfile = async () => {
    try {
      console.log('🔍 getProfile: Iniciando busca de perfil...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ getProfile: Erro ao obter usuário:', userError);
        return { profile: null, error: userError.message };
      }
      
      if (!user) {
        console.log('❌ getProfile: Nenhum usuário autenticado');
        return { profile: null, error: 'Usuário não autenticado' };
      }
      
      console.log('✅ getProfile: Usuário autenticado:', user.id, user.email);
      
      // Verificar se a tabela profiles existe
      console.log('🔍 getProfile: Verificando tabela profiles...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, company_id')
            .eq('id', user.id)
            .single();

      if (profileError) {
        console.error('❌ getProfile: Erro ao buscar perfil na tabela:', profileError);
        
        // Se a tabela não existir, vamos tentar criar um perfil básico
        if (profileError.code === 'PGRST116') {
          console.log('🔄 getProfile: Tabela profiles não encontrada, tentando criar perfil...');
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  email: user.email || '',
                  name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                  company: user.user_metadata?.company || '',
                }
              ])
              .select()
              .single();
            
            if (createError) {
              console.error('❌ getProfile: Erro ao criar perfil:', createError);
              return { profile: null, error: `Erro ao criar perfil: ${createError.message}` };
            }
            
            console.log('✅ getProfile: Perfil criado com sucesso:', newProfile);
            return { profile: newProfile, error: null };
          } catch (createErr) {
            console.error('❌ getProfile: Erro inesperado ao criar perfil:', createErr);
            return { profile: null, error: 'Erro inesperado ao criar perfil' };
          }
        }
        
        return { profile: null, error: profileError.message };
      }

      console.log('✅ getProfile: Perfil encontrado:', profile);
      return { profile, error: null };
    } catch (error) {
      console.error('❌ getProfile: Erro inesperado:', error);
      return { profile: null, error: error instanceof Error ? error.message : 'Erro inesperado' };
    }
  };

  // Função para atualizar o perfil do usuário
  const updateProfile = async (updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso.",
      });

      return { data, error: null };
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar o perfil.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signInCompanyUser = async (email: string, password: string) => {
    try {
      if (!auth.signInCompanyUser) {
        throw new Error('Função de login da empresa não disponível');
      }
      
      const result = await auth.signInCompanyUser(email, password);
      
      if (result.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema.",
        });
      } else {
        toast({
          title: "Erro no login",
          description: result.error || "Email ou senha incorretos",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro interno';
      toast({
        title: "Erro no login",
        description: error,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    ...auth,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInCompanyUser,
    getProfile,
    updateProfile,
  };
} 
