
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from 'lucide-react';

export type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewSelectorProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const CalendarViewSelector = ({ currentView, onViewChange }: CalendarViewSelectorProps) => {
  const views = [
    { id: 'month', label: 'Mês', icon: Calendar },
    { id: 'week', label: 'Semana', icon: CalendarDays },
    { id: 'day', label: 'Dia', icon: Clock }
  ] as const;

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <Button
            key={view.id}
            variant={currentView === view.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(view.id as CalendarViewType)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {view.label}
          </Button>
        );
      })}
    </div>
  );
};

export default CalendarViewSelector;
