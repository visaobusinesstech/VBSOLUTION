import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailInviteData {
  email: string;
  fullName: string;
  companyName: string;
  inviteUrl: string;
  roleName?: string;
  areaName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useEmailService() {
  // Enviar convite por e-mail
  const sendInviteEmail = useCallback(async (data: EmailInviteData): Promise<EmailResult> => {
    try {
      // Em um ambiente real, você usaria um serviço de e-mail como:
      // - SendGrid
      // - Mailgun
      // - AWS SES
      // - Resend
      
      // Por enquanto, vamos simular o envio e salvar no banco
      const { data: emailData, error } = await supabase
        .from('email_logs')
        .insert({
          to_email: data.email,
          subject: `Convite para ${data.companyName}`,
          template: 'user_invite',
          data: {
            fullName: data.fullName,
            companyName: data.companyName,
            inviteUrl: data.inviteUrl,
            roleName: data.roleName,
            areaName: data.areaName,
          },
          status: 'sent',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar log de e-mail:', error);
        return { success: false, error: 'Falha ao registrar envio de e-mail' };
      }

      // Simular envio de e-mail (em produção, chamar API de e-mail)
      console.log('E-mail de convite enviado para:', data.email);
      console.log('Dados do convite:', data);

      return { 
        success: true, 
        messageId: emailData.id 
      };
    } catch (err) {
      console.error('Erro inesperado ao enviar e-mail:', err);
      return { success: false, error: 'Erro inesperado ao enviar e-mail' };
    }
  }, []);

  // Enviar e-mail de redefinição de senha
  const sendPasswordResetEmail = useCallback(async (email: string, resetUrl: string): Promise<EmailResult> => {
    try {
      const { data: emailData, error } = await supabase
        .from('email_logs')
        .insert({
          to_email: email,
          subject: 'Redefinição de Senha',
          template: 'password_reset',
          data: {
            resetUrl,
          },
          status: 'sent',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar log de e-mail:', error);
        return { success: false, error: 'Falha ao registrar envio de e-mail' };
      }

      console.log('E-mail de redefinição enviado para:', email);
      return { 
        success: true, 
        messageId: emailData.id 
      };
    } catch (err) {
      console.error('Erro inesperado ao enviar e-mail:', err);
      return { success: false, error: 'Erro inesperado ao enviar e-mail' };
    }
  }, []);

  // Enviar e-mail de boas-vindas
  const sendWelcomeEmail = useCallback(async (email: string, fullName: string, companyName: string): Promise<EmailResult> => {
    try {
      const { data: emailData, error } = await supabase
        .from('email_logs')
        .insert({
          to_email: email,
          subject: `Bem-vindo ao ${companyName}`,
          template: 'welcome',
          data: {
            fullName,
            companyName,
          },
          status: 'sent',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar log de e-mail:', error);
        return { success: false, error: 'Falha ao registrar envio de e-mail' };
      }

      console.log('E-mail de boas-vindas enviado para:', email);
      return { 
        success: true, 
        messageId: emailData.id 
      };
    } catch (err) {
      console.error('Erro inesperado ao enviar e-mail:', err);
      return { success: false, error: 'Erro inesperado ao enviar e-mail' };
    }
  }, []);

  // Gerar URL de convite
  const generateInviteUrl = useCallback((email: string, token: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite?email=${encodeURIComponent(email)}&token=${token}`;
  }, []);

  // Gerar token de convite
  const generateInviteToken = useCallback((): string => {
    return Math.random().toString(36).substr(2, 15) + Date.now().toString(36);
  }, []);

  return {
    sendInviteEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    generateInviteUrl,
    generateInviteToken,
  };
}
