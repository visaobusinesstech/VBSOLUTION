import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  Users,
  Video,
  FileText,
  AlertCircle,
  Globe2
} from 'lucide-react';
import { format } from '@/utils/dateUtils';
import { ptBR } from '@/utils/dateUtils';
import { CreateEventData } from '@/hooks/useCalendar';
// import { Lead } from '@/hooks/useLeads'; // Removido - hook não existe mais

// Interface temporária para Lead
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: CreateEventData) => Promise<void>;
  selectedDate?: Date | null;
  leads: Lead[];
  isGoogleConnected: boolean;
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  leads,
  isGoogleConnected,
}: EventModalProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    start: selectedDate || new Date(),
    end: undefined,
    type: 'meeting',
    lead_id: '',
    location: '',
    attendees: [],
    is_all_day: false,
    reminder_minutes: 15,
    sync_to_google: false,
  });

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        start: selectedDate,
      }));
    }
  }, [selectedDate]);

  const eventTypes = [
    { value: 'meeting', label: 'Reunião', icon: Users, color: 'bg-blue-500' },
    { value: 'call', label: 'Ligação', icon: Phone, color: 'bg-green-500' },
    { value: 'demo', label: 'Demo', icon: Video, color: 'bg-purple-500' },
    { value: 'proposal', label: 'Proposta', icon: FileText, color: 'bg-orange-500' },
    { value: 'follow_up', label: 'Follow-up', icon: Clock, color: 'bg-yellow-500' },
    { value: 'deadline', label: 'Prazo', icon: AlertCircle, color: 'bg-red-500' },
    { value: 'other', label: 'Outro', icon: CalendarIcon, color: 'bg-gray-500' },
  ];

  const reminderOptions = [
    { value: 0, label: 'Sem lembrete' },
    { value: 5, label: '5 minutos antes' },
    { value: 15, label: '15 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 1440, label: '1 dia antes' },
  ];

  const handleInputChange = (field: keyof CreateEventData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const newStart = new Date(date);
      if (formData.start) {
        newStart.setHours(formData.start.getHours(), formData.start.getMinutes());
      }
      
      const newEnd = formData.end ? new Date(date) : undefined;
      if (newEnd && formData.end) {
        newEnd.setHours(formData.end.getHours(), formData.end.getMinutes());
      }

      setFormData(prev => ({
        ...prev,
        start: newStart,
        end: newEnd,
      }));
    }
  };

  const handleTimeChange = (time: string, type: 'start' | 'end') => {
    const [hours, minutes] = time.split(':').map(Number);
    
    if (type === 'start') {
      const newStart = new Date(formData.start);
      newStart.setHours(hours, minutes);
      setFormData(prev => ({
        ...prev,
        start: newStart,
      }));
      setStartTime(time);
    } else {
      const newEnd = formData.end ? new Date(formData.end) : new Date(formData.start);
      newEnd.setHours(hours, minutes);
      setFormData(prev => ({
        ...prev,
        end: newEnd,
      }));
      setEndTime(time);
    }
  };

  const addAttendee = () => {
    if (attendeeEmail && !formData.attendees?.includes(attendeeEmail)) {
      setFormData(prev => ({
        ...prev,
        attendees: [...(prev.attendees || []), attendeeEmail],
      }));
      setAttendeeEmail('');
    }
  };

  const removeAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees?.filter(e => e !== email) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      // Modal será fechado pelo componente pai
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start: selectedDate || new Date(),
      end: undefined,
      type: 'meeting',
      lead_id: '',
      location: '',
      attendees: [],
      is_all_day: false,
      reminder_minutes: 15,
      sync_to_google: false,
    });
    setStartTime('09:00');
    setEndTime('10:00');
    setAttendeeEmail('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedEventType = eventTypes.find(t => t.value === formData.type);
  const selectedLead = leads.find(l => l.id === formData.lead_id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Novo Evento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Título e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Nome do evento"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${type.color}`} />
                          <IconComponent className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start ? format(formData.start, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!formData.is_all_day && (
              <>
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleTimeChange(e.target.value, 'start')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleTimeChange(e.target.value, 'end')}
                  />
                </div>
              </>
            )}
          </div>

          {/* Opções */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all_day"
              checked={formData.is_all_day}
              onCheckedChange={(checked) => handleInputChange('is_all_day', checked)}
            />
            <Label htmlFor="all_day">Dia todo</Label>
          </div>

          {/* Lead vinculado */}
          <div className="space-y-2">
            <Label>Vincular a Lead (opcional)</Label>
            <Select value={formData.lead_id || 'none'} onValueChange={(value) => handleInputChange('lead_id', value === 'none' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum lead</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{lead.name}</span>
                      {lead.company && (
                        <span className="text-muted-foreground">- {lead.company}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedLead && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedLead.name}</span>
                  {selectedLead.company && (
                    <span className="text-muted-foreground">- {selectedLead.company}</span>
                  )}
                </div>
                {selectedLead.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                {selectedLead.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="h-3 w-3" />
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Local do evento (opcional)"
            />
          </div>

          {/* Participantes */}
          <div className="space-y-2">
            <Label>Participantes</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="E-mail do participante"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
              />
              <Button type="button" onClick={addAttendee} variant="outline">
                Adicionar
              </Button>
            </div>
            
            {formData.attendees && formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.attendees.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeAttendee(email)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição do evento (opcional)"
              rows={3}
            />
          </div>

          {/* Lembrete */}
          <div className="space-y-2">
            <Label>Lembrete</Label>
            <Select value={formData.reminder_minutes?.toString() || '15'} onValueChange={(value) => handleInputChange('reminder_minutes', parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sincronização com Google */}
          {isGoogleConnected && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="sync_google"
                checked={formData.sync_to_google}
                onCheckedChange={(checked) => handleInputChange('sync_to_google', checked)}
              />
              <Label htmlFor="sync_google" className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                Sincronizar com Google Calendar
              </Label>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="vb-button-primary">
              {loading ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
