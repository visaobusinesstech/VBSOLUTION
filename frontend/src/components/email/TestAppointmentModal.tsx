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

interface TestAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: ScheduledEmail | null;
  onSuccess: () => void;
}

export function TestAppointmentModal({ isOpen, onClose, appointment, onSuccess }: TestAppointmentModalProps) {
  const { user } = useUserProfile();
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
      console.log('Carregando templates...');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('canal', 'email')
        .eq('status', 'ativo');

      if (error) {
        console.error('Erro ao carregar templates:', error);
        toast.error('Erro ao carregar templates');
        return;
      }

      console.log('Templates carregados:', data);
      setTemplates(data || []);
      
      if (!data || data.length === 0) {
        console.log('Nenhum template encontrado. Verifique se a tabela templates está configurada corretamente.');
        toast.info('Nenhum template encontrado. Crie templates na seção Templates primeiro.');
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    }
  };

  const handleSubmit = async (sendImmediately: boolean) => {
    if (!subject || selectedRecipients.length === 0) {
      toast.error('Preencha o assunto e selecione pelo menos um destinatário');
      return;
    }

    if (!sendImmediately && (!date || !time)) {
      toast.error('Selecione a data e hora para agendamento');
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let scheduledDateTime: Date;
      let status: 'pending' | 'sent' | 'failed';

      if (sendImmediately) {
        scheduledDateTime = new Date();
        status = 'sent';
      } else {
        scheduledDateTime = new Date(`${date}T${time}:00`);
        if (isNaN(scheduledDateTime.getTime())) {
          toast.error('Data ou hora inválida');
          return;
        }
        status = 'pending';
      }

      const recipientEmails = selectedRecipients.map(recipient => recipient.email);

      // Simular sucesso
      console.log('Dados que seriam salvos:', {
        user_id: user?.id,
        subject,
        recipients: recipientEmails,
        message,
        template_id: selectedTemplate && selectedTemplate !== 'none' ? selectedTemplate : null,
        scheduled_date: scheduledDateTime.toISOString(),
        status: status
      });

      toast.success(sendImmediately 
        ? `Email enviado com sucesso para ${selectedRecipients.length} destinatário(s)!`
        : `Agendamento criado com sucesso para ${selectedRecipients.length} destinatário(s)!`
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
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
            {appointment ? 'Editar Agendamento (TESTE)' : 'Novo Agendamento (TESTE)'}
          </DialogTitle>
          <DialogDescription>
            {appointment 
              ? 'Edite as informações do agendamento de email (modo teste)'
              : 'Crie um novo agendamento ou envie email imediatamente (modo teste)'
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

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum template</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de Envio */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date">Data de Envio</Label>
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
          </div>

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

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={clearForm}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button 
              onClick={() => handleSubmit(true)} 
              disabled={loading}
              className="bg-white border-2 border-blue-900 text-black hover:bg-gray-50"
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar Agora (TESTE)
            </Button>
            <Button 
              variant="default"
              onClick={() => handleSubmit(false)} 
              disabled={loading}
              className="bg-white border-2 border-blue-900 text-black hover:bg-gray-50"
            >
              <Clock className="mr-2 h-4 w-4" />
              {appointment ? 'Atualizar Agendamento (TESTE)' : 'Criar Agendamento (TESTE)'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
