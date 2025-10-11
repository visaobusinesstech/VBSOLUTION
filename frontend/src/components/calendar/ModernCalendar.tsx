import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Video,
  Phone,
  FileText,
  AlertCircle,
  Globe,
  Users,
  Eye,
  EyeOff,
  Activity,
  AlignJustify
} from 'lucide-react';
import { useCalendar, CalendarEvent, ViewMode } from '@/hooks/useCalendar';
import { useSidebar } from '@/contexts/SidebarContext';
// import { useLeads } from '@/hooks/useLeads'; // Removido - hook não existe mais
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { EventModal } from './EventModal';
import { EventDetailsModal } from './EventDetailsModal';

interface ModernCalendarProps {
  className?: string;
}

export function ModernCalendar({ className }: ModernCalendarProps) {
  const {
    events,
    loading,
    error,
    currentDate,
    viewMode,
    setViewMode,
    setCurrentDate,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForDateRange,
    navigateDate,
    goToToday,
    isGoogleConnected,
  } = useCalendar();

  const { sidebarExpanded, setSidebarExpanded } = useSidebar();

  // const { leads, getLeadById } = useLeads(); // Removido - hook não existe mais
  const leads: any[] = []; // Array vazio temporário
  const getLeadById = () => null; // Função vazia temporária

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);

  // Função para toggle da sidebar
  const handleSidebarToggle = () => {
    setSidebarExpanded(true);
  };

  // Filtrar eventos baseado na preferência do usuário
  const filteredEvents = useMemo(() => {
    if (showGoogleEvents) return events;
    return events.filter(event => !event.google_event_id);
  }, [events, showGoogleEvents]);

  // Eventos de hoje
  const todayEvents = useMemo(() => {
    return getEventsForDate(new Date());
  }, [getEventsForDate]);

  // Próximos eventos (próximos 7 dias)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    
    return getEventsForDateRange(today, weekFromNow)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [getEventsForDateRange]);

  // Estatísticas
  const stats = useMemo(() => {
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const monthEvents = getEventsForDateRange(thisMonth, nextMonth);
    
    return {
      total: monthEvents.length,
      completed: monthEvents.filter(e => e.status === 'completed').length,
      pending: monthEvents.filter(e => e.status === 'scheduled').length,
      cancelled: monthEvents.filter(e => e.status === 'cancelled').length,
    };
  }, [currentDate, getEventsForDateRange]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    const colors = {
      meeting: 'bg-blue-500',
      call: 'bg-green-500',
      demo: 'bg-purple-500',
      proposal: 'bg-orange-500',
      follow_up: 'bg-yellow-500',
      deadline: 'bg-red-500',
      other: 'bg-gray-500',
    };
    return colors[type] || colors.other;
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    const icons = {
      meeting: Users,
      call: Phone,
      demo: Video,
      proposal: FileText,
      follow_up: Clock,
      deadline: AlertCircle,
      other: CalendarIcon,
    };
    return icons[type] || CalendarIcon;
  };

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsModalOpen(true);
  };

  const handleEventCreate = async (eventData: any) => {
    const success = await createEvent(eventData);
    if (success) {
      setIsEventModalOpen(false);
      setSelectedDate(null);
    }
  };

  const handleEventUpdate = async (eventId: string, eventData: any) => {
    const success = await updateEvent(eventId, eventData);
    if (success) {
      setIsEventDetailsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      setIsEventDetailsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 ${className}`}>
      {/* Botão de alternar Google Calendar */}
      {isGoogleConnected && (
        <div className="flex items-center justify-end mb-8">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white shadow-lg"
            onClick={() => setShowGoogleEvents(!showGoogleEvents)}
          >
            {showGoogleEvents ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showGoogleEvents ? 'Ocultar Google' : 'Mostrar Google'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendário principal */}
        <div className="lg:col-span-3">
          <Card className="bg-white/70 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl">
            <CardHeader className="pb-6 bg-gradient-to-r from-white/80 to-slate-50/80 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    {/* Botão de toggle da sidebar - só aparece quando colapsada */}
                    {!sidebarExpanded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSidebarToggle}
                        className="w-7 h-7 p-0 bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/40 transition-all duration-300 opacity-70 hover:opacity-100"
                        title="Exibir barra lateral"
                      >
                        <AlignJustify className="h-3.5 w-3.5 text-gray-600" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70 transition-all duration-300"
                      onClick={() => navigateDate('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#0f172a] to-[#1e293b] bg-clip-text text-transparent">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70 transition-all duration-300"
                      onClick={() => navigateDate('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white border-0 hover:from-[#1e293b] hover:to-[#334155] transition-all duration-300"
                      onClick={goToToday}
                    >
                      Hoje
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 bg-white/30 backdrop-blur-sm rounded-xl p-1">
                  {(['month', 'week', 'day'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      className={`transition-all duration-300 ${
                        viewMode === mode 
                          ? 'bg-white shadow-md text-[#0f172a] font-semibold' 
                          : 'text-gray-600 hover:text-[#0f172a] hover:bg-white/50'
                      }`}
                      onClick={() => setViewMode(mode)}
                    >
                      {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-96 text-red-600">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  {error}
                </div>
              ) : (
                <>
                  {viewMode === 'month' && (
                    <CalendarMonthView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onDateClick={setSelectedDate}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                      getEventTypeColor={getEventTypeColor}
                      getEventTypeIcon={getEventTypeIcon}
                    />
                  )}
                  
                  {viewMode === 'week' && (
                    <CalendarWeekView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onDateClick={setSelectedDate}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                      getEventTypeColor={getEventTypeColor}
                      getEventTypeIcon={getEventTypeIcon}
                    />
                  )}
                  
                  {viewMode === 'day' && (
                    <CalendarDayView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                      getEventTypeColor={getEventTypeColor}
                      getEventTypeIcon={getEventTypeIcon}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Eventos de hoje */}
          <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-gray-50/80 rounded-t-2xl">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
                <CalendarIcon className="h-5 w-5 text-[#0f172a]" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {todayEvents.length > 0 ? (
                todayEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="group space-y-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/80 hover:shadow-md transition-all duration-300 border border-white/30"
                    onClick={() => handleEventClick(event)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm leading-tight text-gray-800 group-hover:text-[#0f172a] transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-white/70 backdrop-blur-sm border-slate-200 text-slate-700">
                          {event.type === 'meeting' ? 'Reunião' : 
                           event.type === 'call' ? 'Ligação' : 
                           event.type === 'demo' ? 'Demo' : 
                           event.type === 'proposal' ? 'Proposta' : 
                           event.type === 'follow_up' ? 'Follow-up' : 
                           event.type === 'deadline' ? 'Prazo' : 'Outro'}
                        </Badge>
                        {event.google_event_id && (
                          <Globe className="h-3 w-3 text-[#0f172a]" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-[#0f172a]" />
                        <span>
                          {event.is_all_day 
                            ? 'Dia todo' 
                            : new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          }
                        </span>
                      </div>
                      {event.lead && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-[#1e293b]" />
                          <span>{event.lead.name}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-[#334155]" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-50/50 rounded-full w-fit mx-auto mb-3">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Nenhum evento para hoje
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-gray-50/80 rounded-t-2xl">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
                <Clock className="h-5 w-5 text-[#0f172a]" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="group space-y-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/80 hover:shadow-md transition-all duration-300 border border-white/30"
                    onClick={() => handleEventClick(event)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm leading-tight text-gray-800 group-hover:text-[#0f172a] transition-colors">{event.title}</h4>
                      <Badge variant="outline" className="text-xs bg-white/70 backdrop-blur-sm border-slate-200 text-slate-700">
                        {event.type === 'meeting' ? 'Reunião' : 
                         event.type === 'call' ? 'Ligação' : 
                         event.type === 'demo' ? 'Demo' : 
                         event.type === 'proposal' ? 'Proposta' : 
                         event.type === 'follow_up' ? 'Follow-up' : 
                         event.type === 'deadline' ? 'Prazo' : 'Outro'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-[#0f172a]" />
                        <span>{new Date(event.start).toLocaleDateString('pt-BR')}</span>
                        {!event.is_all_day && (
                          <>
                            <Clock className="h-3 w-3 text-[#1e293b]" />
                            <span>{new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                      {event.lead && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-[#334155]" />
                          <span>{event.lead.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-50/50 rounded-full w-fit mx-auto mb-3">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Nenhum evento próximo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/80 to-gray-50/80 rounded-t-2xl">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-800">
                <Activity className="h-5 w-5 text-[#0f172a]" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                  <span className="text-sm font-medium text-gray-600">Total este mês</span>
                  <span className="font-bold text-lg text-gray-800">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                  <span className="text-sm font-medium text-gray-600">Pendentes</span>
                  <span className="font-bold text-lg text-yellow-600">{stats.pending}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                  <span className="text-sm font-medium text-gray-600">Concluídos</span>
                  <span className="font-bold text-lg text-green-600">{stats.completed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30">
                  <span className="text-sm font-medium text-gray-600">Cancelados</span>
                  <span className="font-bold text-lg text-red-600">{stats.cancelled}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botão flutuante para criar evento */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#1e293b] hover:to-[#334155] text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        onClick={() => setIsEventModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modais */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedDate(null);
        }}
        onSave={handleEventCreate}
        selectedDate={selectedDate}
        leads={leads}
        isGoogleConnected={isGoogleConnected}
      />

      <EventDetailsModal
        isOpen={isEventDetailsModalOpen}
        onClose={() => {
          setIsEventDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onUpdate={handleEventUpdate}
        onDelete={handleEventDelete}
        leads={leads}
        isGoogleConnected={isGoogleConnected}
      />
    </div>
  );
}
