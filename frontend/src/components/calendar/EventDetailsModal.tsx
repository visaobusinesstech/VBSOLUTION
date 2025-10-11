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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Globe,
  Edit,
  Trash2,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { format } from '@/utils/dateUtils';
import { ptBR } from '@/utils/dateUtils';
import { CalendarEvent } from '@/hooks/useCalendar';
import { Lead } from '@/hooks/useLeads-simple';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onUpdate: (eventId: string, eventData: any) => Promise<boolean>;
  onDelete: (eventId: string) => Promise<boolean>;
  leads: Lead[];
  isGoogleConnected: boolean;
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onUpdate,
  onDelete,
  leads,
  isGoogleConnected,
}: EventDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start: new Date(event.start),
        end: event.end ? new Date(event.end) : undefined,
        type: event.type,
        lead_id: event.lead_id || '',
        location: event.location || '',
        attendees: event.attendees || [],
        is_all_day: event.is_all_day || false,
        reminder_minutes: event.reminder_minutes || 15,
        status: event.status,
      });
    }
  }, [event]);

  const eventTypes = [
    { value: 'meeting', label: 'Reunião', icon: Users, color: 'bg-blue-500' },
    { value: 'call', label: 'Ligação', icon: Phone, color: 'bg-green-500' },
    { value: 'demo', label: 'Demo', icon: Video, color: 'bg-purple-500' },
    { value: 'proposal', label: 'Proposta', icon: FileText, color: 'bg-orange-500' },
    { value: 'follow_up', label: 'Follow-up', icon: Clock, color: 'bg-yellow-500' },
    { value: 'deadline', label: 'Prazo', icon: AlertCircle, color: 'bg-red-500' },
    { value: 'other', label: 'Outro', icon: CalendarIcon, color: 'bg-gray-500' },
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Agendado', color: 'bg-blue-500' },
    { value: 'completed', label: 'Concluído', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
    { value: 'postponed', label: 'Adiado', color: 'bg-yellow-500' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdate = async () => {
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      const success = await onUpdate(event.id, formData);
      if (success) {
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      setLoading(true);
      setError(null);

      try {
        const success = await onDelete(event.id);
        if (success) {
          onClose();
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao excluir evento');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onClose();
  };

  if (!event) return null;

  const selectedEventType = eventTypes.find(t => t.value === event.type);
  const selectedLead = leads.find(l => l.id === event.lead_id);
  const selectedStatus = statusOptions.find(s => s.value === event.status);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isEditing ? 'Editar Evento' : 'Detalhes do Evento'}
            {event.google_event_id && (
              <Badge variant="outline" className="ml-2">
                <Globe className="h-3 w-3 mr-1" />
                Google Calendar
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="edit">Editar</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{event.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedEventType && (
                      <Badge className={`${selectedEventType.color} text-white`}>
                        <selectedEventType.icon className="h-3 w-3 mr-1" />
                        {selectedEventType.label}
                      </Badge>
                    )}
                    {selectedStatus && (
                      <Badge variant="outline" className={`border-${selectedStatus.color.replace('bg-', '')} text-${selectedStatus.color.replace('bg-', '')}`}>
                        {selectedStatus.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>

              {event.description && (
                <div>
                  <h3 className="font-medium mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}

              {/* Data e hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {event.is_all_day 
                        ? format(new Date(event.start), 'dd/MM/yyyy', { locale: ptBR })
                        : format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      }
                    </p>
                    {event.end && !event.is_all_day && (
                      <p className="text-sm text-muted-foreground">
                        até {format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {/* Lead vinculado */}
              {selectedLead && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Lead Vinculado</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{selectedLead.name}</span>
                    {selectedLead.company && (
                      <span className="text-muted-foreground">- {selectedLead.company}</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {selectedLead.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{selectedLead.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Participantes */}
              {event.attendees && event.attendees.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Participantes</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.attendees.map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <span className="ml-2">
                    {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Atualizado em:</span>
                  <span className="ml-2">
                    {format(new Date(event.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
              {/* Título e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Título *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Nome do evento"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <Select value={formData.type || 'meeting'} onValueChange={(value) => handleInputChange('type', value)}>
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

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status || 'scheduled'} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data e hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onSelect={(date) => date && handleInputChange('start', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Local do evento"
                  />
                </div>
              </div>

              {/* Lead vinculado */}
              <div className="space-y-2">
                <Label>Lead Vinculado</Label>
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
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descrição do evento"
                  rows={3}
                />
              </div>

              {/* Opções */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-all-day"
                  checked={formData.is_all_day || false}
                  onCheckedChange={(checked) => handleInputChange('is_all_day', checked)}
                />
                <Label htmlFor="edit-all-day">Dia todo</Label>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="vb-button-primary">
                  {loading ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Botão para abrir no Google Calendar */}
        {event.google_event_id && (
          <div className="flex justify-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => window.open(`https://calendar.google.com/calendar/event?eid=${event.google_event_id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Google Calendar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
