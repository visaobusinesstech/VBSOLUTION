
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Plus, User } from 'lucide-react';

interface ActivitySchedulingPanelProps {
  activePanel: 'activity' | 'scheduling';
  onPanelChange: (panel: 'activity' | 'scheduling') => void;
}

export function ActivitySchedulingPanel({ activePanel, onPanelChange }: ActivitySchedulingPanelProps) {
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [activityType, setActivityType] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleCreateActivity = () => {
    console.log('Criando atividade:', {
      title: activityTitle,
      description: activityDescription,
      date: activityDate,
      time: activityTime,
      type: activityType,
      priority: priority
    });
  };

  return (
    <div className="w-80 bg-gray-50 border-l">
      <div className="p-4">
        {/* Panel selector */}
        <div className="flex items-center gap-1 mb-4 text-xs">
          <Button
            variant="ghost"
            onClick={() => onPanelChange('activity')}
            className={`px-3 py-1.5 text-xs rounded ${
              activePanel === 'activity'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Plus className="h-3 w-3 mr-1" />
            Atividade
          </Button>
          <Button
            variant="ghost"
            onClick={() => onPanelChange('scheduling')}
            className={`px-3 py-1.5 text-xs rounded ${
              activePanel === 'scheduling'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Agendamento
          </Button>
        </div>

        {/* Activity Panel */}
        {activePanel === 'activity' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Criar nova atividade</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Planeje sua próxima ação no negócio
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Título</Label>
                <Input
                  placeholder="Título da atividade"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-500">Tipo</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Prioridade</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Data</Label>
                  <Input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hora</Label>
                  <Input
                    type="time"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Descrição</Label>
                <Textarea
                  placeholder="Descreva a atividade..."
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>

              <Button 
                onClick={handleCreateActivity}
                size="sm" 
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs"
              >
                Criar Atividade
              </Button>
            </div>
          </div>
        )}

        {/* Scheduling Panel */}
        {activePanel === 'scheduling' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Agendamentos</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Visualize seus compromissos
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-gray-500">Próximos agendamentos:</div>
              
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium">Hoje, 14:00</span>
                  </div>
                  <p className="text-xs text-gray-600">Reunião com cliente</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium">Amanhã, 10:00</span>
                  </div>
                  <p className="text-xs text-gray-600">Apresentação de proposta</p>
                </div>
              </div>

              <Button size="sm" className="w-full text-white text-xs hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                <Calendar className="h-3 w-3 mr-1" />
                Ver Calendário
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
