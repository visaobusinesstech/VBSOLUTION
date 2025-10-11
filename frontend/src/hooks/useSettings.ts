import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface SettingsFormData {
  user_id?: string;
  email_smtp?: string | null;
  email_porta?: number | null;
  email_usuario?: string | null;
  email_senha?: string | null;
  area_negocio?: string | null;
  foto_perfil?: string | null;
  smtp_seguranca?: string | null;
  smtp_nome?: string | null;
  two_factor_enabled?: boolean;
  use_smtp?: boolean;
  signature_image?: string | null;
  smtp_host?: string | null;
  smtp_pass?: string | null;
  smtp_from_name?: string | null;
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsFormData | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar configurações
  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Buscar configurações do perfil do usuário
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          user_id: user.id,
          email_smtp: (data as any).email_smtp || null,
          email_porta: (data as any).email_porta || 587,
          email_usuario: (data as any).email_usuario || null,
          email_senha: null, // Nunca retornar senha do servidor
          area_negocio: (data as any).area_negocio || null,
          foto_perfil: (data as any).foto_perfil || null,
          smtp_seguranca: (data as any).smtp_seguranca || 'tls',
          smtp_nome: (data as any).smtp_nome || null,
          two_factor_enabled: (data as any).two_factor_enabled || false,
          use_smtp: true,
          signature_image: (data as any).signature_image || null,
          smtp_host: (data as any).smtp_host || null,
          smtp_pass: null, // Nunca retornar senha do servidor
          smtp_from_name: (data as any).smtp_from_name || null
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const saveSettings = async (formData: SettingsFormData): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setLoading(true);

      // Preparar dados para salvar no perfil do usuário
      const dataToSave: any = {
        updated_at: new Date().toISOString()
      };

      // Preparar dados para salvar nas duas tabelas
      const userProfileData: any = {
        updated_at: new Date().toISOString()
      };

      const smtpSettingsData: any = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      // Adicionar campos do user_profiles
      if (formData.smtp_host !== undefined) userProfileData.smtp_host = formData.smtp_host;
      if (formData.email_porta !== undefined) userProfileData.email_porta = formData.email_porta;
      if (formData.smtp_from_name !== undefined) userProfileData.smtp_from_name = formData.smtp_from_name;
      if (formData.email_usuario !== undefined) userProfileData.email_usuario = formData.email_usuario;
      if (formData.smtp_pass !== undefined) userProfileData.smtp_pass = formData.smtp_pass; // SEMPRE salvar senha
      if (formData.smtp_seguranca !== undefined) userProfileData.smtp_seguranca = formData.smtp_seguranca;
      if (formData.two_factor_enabled !== undefined) userProfileData.two_factor_enabled = formData.two_factor_enabled;
      if (formData.signature_image !== undefined) userProfileData.signature_image = formData.signature_image;

      // Adicionar campos para smtp_settings (tabela unificada)
      if (formData.smtp_host !== undefined) smtpSettingsData.host = formData.smtp_host;
      if (formData.email_porta !== undefined) smtpSettingsData.port = formData.email_porta;
      if (formData.email_usuario !== undefined) smtpSettingsData["user"] = formData.email_usuario;
      if (formData.smtp_pass !== undefined) smtpSettingsData.pass = formData.smtp_pass; // SEMPRE salvar senha
      if (formData.smtp_from_name !== undefined) smtpSettingsData.from_name = formData.smtp_from_name;
      if (formData.smtp_seguranca !== undefined) smtpSettingsData.security = formData.smtp_seguranca;

      // Atualizar perfil do usuário
      const result = await supabase
        .from('user_profiles')
        .update(userProfileData)
        .eq('id', user.id);

      if (result.error) {
        console.error('Erro ao salvar configurações:', result.error);
        toast.error('Erro ao salvar configurações');
        return false;
      }

      // Também salvar/atualizar na tabela smtp_settings (tabela unificada)
      try {
        // Verificar se já existe configuração SMTP para este usuário
        const { data: existingSmtp } = await supabase
          .from('smtp_settings')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingSmtp) {
          // Atualizar configuração existente
          const { error: updateError } = await supabase
            .from('smtp_settings')
            .update({
              ...smtpSettingsData,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.warn('Erro ao atualizar smtp_settings:', updateError);
          } else {
            console.log('✅ Configurações SMTP atualizadas na tabela smtp_settings');
          }
        } else {
          // Criar nova configuração
          const { error: insertError } = await supabase
            .from('smtp_settings')
            .insert({
              ...smtpSettingsData,
              is_active: true,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.warn('Erro ao criar smtp_settings:', insertError);
          } else {
            console.log('✅ Configurações SMTP criadas na tabela smtp_settings');
          }
        }
      } catch (smtpError) {
        console.warn('Erro ao salvar em smtp_settings (não crítico):', smtpError);
        // Não falha o processo principal por causa disso
      }

      toast.success('Configurações salvas com sucesso!');
      await loadSettings(); // Recarregar configurações
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Carregar configurações ao montar
  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    saveSettings,
    loadSettings
  };
}
