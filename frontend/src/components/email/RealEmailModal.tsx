import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Send, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEmailSender } from '@/hooks/useEmailSender';
import { AdvancedRecipientSelector } from './AdvancedRecipientSelector';

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'contact' | 'company';
  company?: string;
  phone?: string;
  avatar?: string;
}

interface ScheduledEmail {
  id: string;
  subject: string;
  recipients: string[];
  template_id?: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  message?: string;
}

interface RealEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: ScheduledEmail | null;
  onSuccess: () => void;
}

export function RealEmailModal({ isOpen, onClose, appointment, onSuccess }: RealEmailModalProps) {
  const { user } = useUserProfile();
  const { sendEmail, loading: sendingEmail } = useEmailSender();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [subject, setSubject] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMultiSelectEnabled, setIsMultiSelectEnabled] = useState(true);

  // Carregar templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Preencher formulário se editando
  useEffect(() => {
    if (appointment && isOpen) {
      const appointmentDate = new Date(appointment.scheduled_date);
      setDate(appointmentDate.toISOString().split('T')[0]);
      setTime(appointmentDate.toTimeString().slice(0, 5));
      setSubject(appointment.subject);
      setMessage(appointment.message || '');
      setSelectedTemplate(appointment.template_id || 'none');
      
      // Converter recipients para formato Recipient
      const recipients: Recipient[] = appointment.recipients.map((email, index) => ({
        id: `existing_${index}`,
        name: email.split('@')[0],
        email: email,
        type: 'contact' as const,
      }));
      setSelectedRecipients(recipients);
    } else if (!appointment && isOpen) {
      // Limpar formulário para novo agendamento
      setDate('');
      setTime('09:00');
      setSubject('');
      setSelectedRecipients([]);
      setMessage('');
      setSelectedTemplate('none');
    }
  }, [appointment, isOpen]);

  const loadTemplates = async () => {
    try {
      console.log('🔍 Carregando templates...');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('canal', 'email')
        .eq('status', 'ativo');

      if (error) {
        console.error('❌ Erro ao carregar templates:', error);
        return;
      }

      console.log('✅ Templates carregados:', data);
      setTemplates(data || []);
      
      if (!data || data.length === 0) {
        toast.info('Nenhum template encontrado. Crie templates na seção Templates.');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar templates:', error);
    }
  };

  const handleSendNow = async () => {
    if (!subject || selectedRecipients.length === 0) {
      toast.error('Preencha o assunto e selecione pelo menos um destinatário');
      return;
    }

    if (!message || message.trim() === '') {
      toast.error('Digite uma mensagem para enviar');
      return;
    }

    setLoading(true);
    console.log('📧 Iniciando envio de email...');
    
    try {
      let emailContent = message;
      
      // Se selecionou um template, buscar o conteúdo
      if (selectedTemplate && selectedTemplate !== 'none') {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          emailContent = template.conteudo;
          console.log('📄 Usando template:', template.nome);
        }
      }

      // Enviar email para cada destinatário
      const sendPromises = selectedRecipients.map(async (recipient) => {
        console.log(`📤 Enviando email para: ${recipient.email}`);
        
        try {
          const result = await sendEmail({
            to: recipient.email,
            subject: subject,
            content: emailContent,
            template_id: selectedTemplate && selectedTemplate !== 'none' ? selectedTemplate : undefined,
            contato_nome: recipient.name
          });

          console.log(`✅ Email enviado para ${recipient.email}:`, result);
          return { success: true, recipient: recipient.email };
        } catch (error) {
          console.error(`❌ Erro ao enviar para ${recipient.email}:`, error);
          return { success: false, recipient: recipient.email, error };
        }
      });

      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      const failCount = results.length - successCount;

      // Salvar registro no banco
      try {
        const response = await fetch('/api/email/scheduled', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            recipients: selectedRecipients.map(r => r.email),
            message: emailContent,
            template_id: selectedTemplate && selectedTemplate !== 'none' ? selectedTemplate : null,
            scheduled_date: new Date().toISOString(),
            status: successCount > 0 ? 'sent' : 'failed'
          }),
        });

        if (response.ok) {
          console.log('💾 Registro salvo no banco de dados');
        } else {
          console.warn('⚠️ Erro ao salvar no banco (não crítico):', response.statusText);
        }
      } catch (dbError) {
        console.warn('⚠️ Erro ao salvar no banco (não crítico):', dbError);
      }

      if (successCount === results.length) {
        toast.success(`✅ ${successCount} email(s) enviado(s) com sucesso!`);
      } else if (successCount > 0) {
        toast.warning(`⚠️ ${successCount} email(s) enviado(s), ${failCount} falharam`);
      } else {
        toast.error(`❌ Falha ao enviar emails. Verifique as configurações SMTP.`);
      }

      if (successCount > 0) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('❌ Erro geral no envio:', error);
      toast.error('Erro ao enviar emails. Verifique o console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!subject || selectedRecipients.length === 0) {
      toast.error('Preencha o assunto e selecione pelo menos um destinatário');
      return;
    }

    if (!date || !time) {
      toast.error('Selecione a data e hora para agendamento');
      return;
    }

    setLoading(true);
    
    try {
      const scheduledDateTime = new Date(`${date}T${time}:00`);
      if (isNaN(scheduledDateTime.getTime())) {
        toast.error('Data ou hora inválida');
        return;
      }

      // Verificar se a data é futura
      if (scheduledDateTime <= new Date()) {
        toast.error('A data de agendamento deve ser futura');
        return;
      }

      let emailContent = message;
      
      // Se selecionou um template, buscar o conteúdo
      if (selectedTemplate && selectedTemplate !== 'none') {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          emailContent = template.conteudo;
        }
      }

      const recipientEmails = selectedRecipients.map(recipient => recipient.email);

      if (appointment) {
        // Atualizar agendamento existente
        const response = await fetch(`/api/email/scheduled/${appointment.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            recipients: recipientEmails,
            message: emailContent,
            template_id: selectedTemplate && selectedTemplate !== 'none' ? selectedTemplate : null,
            scheduled_date: scheduledDateTime.toISOString(),
            status: 'pending'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar agendamento');
        }
        toast.success('✅ Agendamento atualizado com sucesso!');
      } else {
        // Criar novo agendamento
        const response = await fetch('/api/email/scheduled', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            recipients: recipientEmails,
            message: emailContent,
            template_id: selectedTemplate && selectedTemplate !== 'none' ? selectedTemplate : null,
            scheduled_date: scheduledDateTime.toISOString(),
            status: 'pending'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar agendamento');
        }
        toast.success(`✅ Email agendado para ${scheduledDateTime.toLocaleString('pt-BR')}!`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao agendar:', error);
      
      let errorMessage = 'Erro ao criar agendamento';
      if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as any;
        if (errorObj.message?.includes('relation "scheduled_emails" does not exist')) {
          errorMessage = 'Tabela scheduled_emails não encontrada. Execute o script CRIAR_TABELA_SCHEDULED_EMAILS.sql';
        } else {
          errorMessage = `Erro: ${errorObj.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setDate('');
    setTime('09:00');
    setSubject('');
    setSelectedRecipients([]);
    setMessage('');
    setSelectedTemplate('none');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento de Email' : 'Novo Email'}
          </DialogTitle>
          <DialogDescription>
            {appointment 
              ? 'Edite as informações do agendamento de email'
              : 'Envie um email imediatamente ou agende para envio posterior'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Checkbox Selecionar múltiplos contatos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-multiple-contacts"
              checked={isMultiSelectEnabled}
              onCheckedChange={(checked) => setIsMultiSelectEnabled(!!checked)}
            />
            <Label htmlFor="select-multiple-contacts">Selecionar múltiplos contatos</Label>
          </div>

          {/* Seletor de Destinatários */}
          {isMultiSelectEnabled && (
            <AdvancedRecipientSelector
              selectedRecipients={selectedRecipients}
              onRecipientsChange={setSelectedRecipients}
              maxRecipients={100}
              layoutVariant="image"
            />
          )}

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Assunto do email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template (opcional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template ou escreva a mensagem abaixo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum template (usar mensagem abaixo)</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui (suporta HTML)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Se selecionar um template, esta mensagem será ignorada.
            </p>
          </div>

          {/* Data de Envio (para agendamento) */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Data de Agendamento (opcional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="scheduled-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1"
              />
              <Input
                id="scheduled-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-32"
              />
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para enviar imediatamente
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={clearForm} disabled={loading || sendingEmail}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button 
              onClick={handleSendNow} 
              disabled={loading || sendingEmail}
              className="bg-white border-2 border-blue-900 text-black hover:bg-gray-50"
            >
              <Send className="mr-2 h-4 w-4" />
              {sendingEmail ? 'Enviando...' : 'Enviar Agora'}
            </Button>
            <Button 
              variant="default"
              onClick={handleSchedule} 
              disabled={loading || sendingEmail}
              className="bg-white border-2 border-blue-900 text-black hover:bg-gray-50"
            >
              <Clock className="mr-2 h-4 w-4" />
              {appointment ? 'Atualizar Agendamento' : 'Agendar Envio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


