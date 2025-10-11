
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Users, MapPin, Bell } from 'lucide-react';
import { format } from '@/utils/dateUtils';
import { ptBR } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (eventData: any) => void;
}

const eventTypes = [
  { value: 'meeting', label: 'Reunião', icon: '🤝', color: '#3B82F6' },
  { value: 'call', label: 'Ligação', icon: '📞', color: '#10B981' },
  { value: 'presentation', label: 'Apresentação', icon: '🎯', color: '#F59E0B' },
  { value: 'training', label: 'Treinamento', icon: '🎓', color: '#8B5CF6' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️', color: '#EF4444' },
  { value: 'conference', label: 'Conferência', icon: '🎤', color: '#06B6D4' },
  { value: 'social', label: 'Evento Social', icon: '🎉', color: '#EC4899' },
  { value: 'other', label: 'Outro', icon: '📅', color: '#6B7280' }
];

export function EventCreateModal({ isOpen, onClose, onEventCreated }: EventCreateModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    start_time: '',
    end_time: '',
    responsible: '',
    is_recurring: false,
    recurrence_pattern: '',
    color: '#3B82F6'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.start_date || !formData.start_time) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const startDateTime = new Date(formData.start_date);
      const [startHours, startMinutes] = formData.start_time.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      let endDateTime = new Date(formData.start_date);
      if (formData.end_date) {
        endDateTime = new Date(formData.end_date);
      }
      if (formData.end_time) {
        const [endHours, endMinutes] = formData.end_time.split(':');
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));
      } else {
        // Default to 1 hour after start time
        endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        responsible: formData.responsible || null,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.recurrence_pattern || null,
        color: formData.color,
        icon: eventTypes.find(type => type.value === formData.event_type)?.icon || '📅'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      onEventCreated(data);
      
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_type: 'meeting',
        start_date: undefined,
        end_date: undefined,
        start_time: '',
        end_time: '',
        responsible: '',
        is_recurring: false,
        recurrence_pattern: '',
        color: '#3B82F6'
      });

      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar evento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventType = eventTypes.find(type => type.value === formData.event_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Criar Evento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Título */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Título do Evento *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reunião de planejamento semanal"
                required
              />
            </div>

            {/* Tipo de Evento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Evento</Label>
              <Select 
                value={formData.event_type} 
                onValueChange={(value) => {
                  const eventType = eventTypes.find(type => type.value === value);
                  setFormData({ 
                    ...formData, 
                    event_type: value,
                    color: eventType?.color || '#3B82F6'
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedEventType && (
                      <div className="flex items-center gap-2">
                        <span>{selectedEventType.icon}</span>
                        <span>{selectedEventType.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsible" className="text-sm font-medium">
                Responsável
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Data de Início */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? (
                      format(formData.start_date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => setFormData({ ...formData, start_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário de Início */}
            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-sm font-medium">
                Horário de Início *
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Data de Fim */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? (
                      format(formData.end_date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Mesmo dia</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => setFormData({ ...formData, end_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário de Fim */}
            <div className="space-y-2">
              <Label htmlFor="end_time" className="text-sm font-medium">
                Horário de Fim
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva os detalhes do evento..."
              className="min-h-[100px]"
            />
          </div>

          {/* Resumo do Evento */}
          {formData.title && formData.start_date && formData.start_time && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Resumo do Evento
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{selectedEventType?.icon}</span>
                  <span className="font-medium">{formData.title}</span>
                  <Badge 
                    variant="secondary" 
                    style={{ backgroundColor: formData.color + '20', color: formData.color }}
                  >
                    {selectedEventType?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {format(formData.start_date, "PPP", { locale: ptBR })} às {formData.start_time}
                    {formData.end_time && ` - ${formData.end_time}`}
                  </span>
                </div>
                {formData.responsible && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Responsável: {formData.responsible}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.start_date || !formData.start_time}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
