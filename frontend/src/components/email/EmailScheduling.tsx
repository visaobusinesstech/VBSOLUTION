import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Clock, Send, Calendar as CalendarIcon, Users, Mail, Trash2, Edit, X } from 'lucide-react';
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
}

export function EmailScheduling() {
  const { user } = useUserProfile();
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
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
    loadTemplates();
    loadScheduledEmails();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('canal', 'email')
        .eq('status', 'ativo');

      if (!error && data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const loadScheduledEmails = async () => {
    try {
      const response = await fetch('/api/email/scheduled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setScheduledEmails(result.data);
        }
      } else {
        console.error('Erro ao carregar emails agendados:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar emails agendados:', error);
    }
  };

  const handleSendEmail = async (sendImmediately: boolean) => {
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

      const response = await fetch('/api/email/scheduled', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          recipients: recipientEmails,
          message,
          template_id: selectedTemplate && selectedTemplate !== 'none' ? selectedTemplate : null,
          scheduled_date: scheduledDateTime.toISOString(),
          status: status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao agendar email');
      }

      toast.success(sendImmediately 
        ? `Email enviado com sucesso para ${selectedRecipients.length} destinatário(s)!`
        : `Email agendado com sucesso para ${selectedRecipients.length} destinatário(s)!`
      );
      
      // Limpar formulário
      setDate('');
      setTime('09:00');
      setSubject('');
      setSelectedRecipients([]);
      setMessage('');
      setSelectedTemplate('none');
      
      // Recarregar lista
      loadScheduledEmails();
    } catch (error) {
      console.error('Erro ao agendar email:', error);
      toast.error(`Erro ao ${sendImmediately ? 'enviar' : 'agendar'} email`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const response = await fetch(`/api/email/scheduled/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'vb_dev_token_12345'}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover agendamento');
      }

      toast.success('Agendamento excluído com sucesso!');
      loadScheduledEmails();
    } catch (error) {
      console.error('Erro ao remover agendamento:', error);
      toast.error('Erro ao remover agendamento');
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
    <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
        <CardTitle>Novo Agendamento</CardTitle>
        <CardDescription>Agende ou envie emails para seus contatos e empresas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={clearForm}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            onClick={() => handleSendEmail(true)} 
            disabled={loading}
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar Agora
          </Button>
            <Button 
            variant="default"
            onClick={() => handleSendEmail(false)} 
              disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
            <Clock className="mr-2 h-4 w-4" />
            Criar Agendamento
            </Button>
      </div>

        {/* Separador */}
        <Separator className="my-8" />

        {/* Seção de Agendamentos Existentes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Agendamentos Existentes</h2>
          {loading ? (
            <div className="text-center text-muted-foreground">Carregando agendamentos...</div>
          ) : scheduledEmails.length === 0 ? (
            <div className="text-center text-muted-foreground">Nenhum email agendado.</div>
          ) : (
            <div className="space-y-4">
              {scheduledEmails.map((email) => (
                <Card key={email.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{email.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        Para: {email.recipients.join(', ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Agendado para: {new Date(email.scheduled_date).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Status: {email.status}</p>
                      </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        toast.info('Funcionalidade de edição ainda não implementada.');
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(email.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
            </div>
          </CardContent>
        </Card>
  );
}