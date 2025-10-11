import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from './useSettings';
import { toast } from 'sonner';

interface EmailData {
  to: string;
  subject: string;
  content: string;
  template_id?: string;
  contato_id?: string;
  contato_nome?: string;
  attachments?: any[];
  signature_image?: string | null;
}

interface BatchEmailData {
  emails: EmailData[];
  batch: boolean;
  optimization_config?: any;
}

export function useEmailSender() {
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const sendEmail = async (emailData: EmailData): Promise<boolean> => {
    if (!settings?.smtp_host) {
      toast.error('Configure o SMTP nas configurações antes de enviar emails');
      return false;
    }

    setLoading(true);
    try {
      const smtpSettings = {
        host: settings.smtp_host,
        port: settings.email_porta || 587,
        user: settings.email_usuario,
        pass: settings.smtp_pass,
        from_name: settings.smtp_from_name,
        security: settings.smtp_seguranca || 'tls'
      };

      const { data, error } = await supabase.functions.invoke('send-email-working', {
        body: {
          user_id: settings.user_id,
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.content,
          template_id: emailData.template_id,
          contato_id: emailData.contato_id,
          contato_nome: emailData.contato_nome,
          attachments: emailData.attachments,
          signature_image: emailData.signature_image,
          smtp_settings: smtpSettings
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Email enviado para ${emailData.to}`);
        return true;
      } else {
        toast.error(data.error || 'Erro ao enviar email');
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email: ' + (error.message || 'Erro desconhecido'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendBatchEmails = async (batchData: BatchEmailData): Promise<{
    success: boolean;
    results?: any[];
    summary?: any;
  }> => {
    if (!settings?.smtp_host) {
      toast.error('Configure o SMTP nas configurações antes de enviar emails');
      return { success: false };
    }

    if (batchData.emails.length === 0) {
      toast.error('Nenhum email para enviar');
      return { success: false };
    }

    setLoading(true);
    try {
      const smtpSettings = {
        host: settings.smtp_host,
        port: settings.email_porta || 587,
        user: settings.email_usuario,
        pass: settings.smtp_pass,
        from_name: settings.smtp_from_name,
        security: settings.smtp_seguranca || 'tls'
      };

      const { data, error } = await supabase.functions.invoke('send-email-smtp', {
        body: {
          ...batchData,
          smtp_settings: smtpSettings
        }
      });

      if (error) throw error;

      if (data.success) {
        const successCount = data.successful || 0;
        const totalCount = data.total || batchData.emails.length;
        toast.success(`Envio em lote concluído: ${successCount}/${totalCount} emails enviados`);
        
        return {
          success: true,
          results: data.results,
          summary: data.summary
        };
      } else {
        toast.error(data.error || 'Erro no envio em lote');
        return { success: false };
      }
    } catch (error: any) {
      console.error('Erro no envio em lote:', error);
      toast.error('Erro no envio em lote: ' + (error.message || 'Erro desconhecido'));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (templateId: string, testEmail: string): Promise<boolean> => {
    if (!settings?.smtp_host) {
      toast.error('Configure o SMTP nas configurações antes de enviar emails de teste');
      return false;
    }

    setLoading(true);
    try {
      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) {
        toast.error('Template não encontrado');
        return false;
      }

      const emailData: EmailData = {
        to: testEmail,
        subject: `Teste - ${template.nome}`,
        content: template.conteudo,
        template_id: templateId,
        contato_nome: 'Teste',
        signature_image: template.signature_image
      };

      return await sendEmail(emailData);
    } catch (error: any) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    sendBatchEmails,
    sendTestEmail,
    loading,
    smtpConfigured: !!settings?.smtp_host
  };
}
