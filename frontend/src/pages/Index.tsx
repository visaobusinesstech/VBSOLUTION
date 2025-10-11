import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  CheckCircle,
  MessageSquare,
  Target,
  Sparkles,
  Info,
  Clock,
  Users,
  AlertTriangle,
  X,
  Calendar,
  User,
  Tag,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Trash2,
  MessageCircle,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useVB } from '@/contexts/VBContext';
import { useProject } from '@/contexts/ProjectContext';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useActivities } from '@/hooks/useActivities';
import { useDashboardCards } from '@/hooks/useDashboardCards';
import { useFeed } from '@/hooks/useFeed';
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'activity' | 'project' | 'workgroup' | 'calendar'>('activity');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isManageCardsModalOpen, setIsManageCardsModalOpen] = useState(false);
  const [isGreetingSettingsOpen, setIsGreetingSettingsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  // Usar hook para gerenciar cartões do dashboard
  const { cards: dashboardCards, loading: cardsLoading, saving: cardsSaving, addCard, removeCard, reactivateCard, reorderCards } = useDashboardCards();
  
  // Estados para drag and drop
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  
  const { userName, refreshUserData } = useUser();
  const { state: vbState } = useVB();
  const { state: projectState } = useProject();
  const { workGroups } = useWorkGroup();
  const { activities } = useActivities();
  const { posts, loading: feedLoading } = useFeed();
  const navigate = useNavigate();

  // Estado para armazenar comentários reais do Feed
  const [feedComments, setFeedComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Debug: verificar se posts estão sendo carregados
  console.log('🔍 [INDEX] Estado do Feed:', {
    posts: posts?.length || 0,
    loading: feedLoading,
    user: userName
  });
  
  // Função para determinar a saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return `Bom dia, ${userName}`;
    } else if (hour >= 12 && hour < 18) {
      return `Boa tarde, ${userName}`;
    } else {
      return `Boa noite, ${userName}`;
    }
  };

  // Atualizar a saudação quando o componente montar e a cada hora
  useEffect(() => {
    setGreeting(getGreeting());
    
    // Atualizar a cada hora
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60 * 60 * 1000); // 1 hora em milissegundos

    return () => clearInterval(interval);
  }, [userName]); // Atualiza sempre que userName mudar

  // Carregar dados do usuário quando o componente montar
  useEffect(() => {
    refreshUserData();
  }, []);

  // Eventos do calendário carregados do Supabase
  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      // Buscar eventos do Supabase quando implementarmos a tabela de eventos
      // Por enquanto, array vazio
      setCalendarEvents([]);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  // Função para obter atividades recentes
  const getRecentActivities = () => {
    const recentActivities = activities
      .filter(activity => !activity.archived) // Filtra apenas se o campo archived existir e for false
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);

    // Debug: verificar status das atividades
    console.log('🔍 [INDEX] Atividades recentes com status:', recentActivities.map(a => ({
      title: a.title,
      status: a.status,
      created_at: a.created_at
    })));

    return recentActivities.map(activity => ({
      id: activity.id,
      title: activity.title,
      status: activity.status,
      type: activity.type,
      projectId: activity.project_id,
      description: activity.description,
      date: activity.due_date,
      responsibleId: activity.responsible_id,
      priority: activity.priority,
      companyId: activity.company_id
    }));
  };

  // Função para obter atividades atrasadas (considerando status e data de vencimento)
  const getOverdueActivities = () => {
    const today = new Date();
    return activities
      .filter(activity => 
        !activity.archived && // Filtra apenas se o campo archived existir e for false
        activity.status !== 'completed' && // Não incluir atividades completas
        activity.due_date && // Deve ter data de vencimento
        new Date(activity.due_date) < today // Data de vencimento já passou
      )
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) // Ordenar por data de vencimento
      .slice(0, 3);
  };

  // Função para obter atividades em andamento (status "in-progress" do kanban)
  const getInProgressActivities = () => {
    return activities
      .filter(activity => 
        !activity.archived && // Filtra apenas se o campo archived existir e for false
        activity.status === 'in-progress' // Status correto do kanban
      )
      .slice(0, 3);
  };

  // Função para obter atividades pendentes (status "pending" do kanban)
  const getPendingActivities = () => {
    return activities
      .filter(activity => 
        !activity.archived && // Filtra apenas se o campo archived existir e for false
        activity.status === 'pending' // Status correto do kanban
      )
      .slice(0, 3);
  };

  // Função para obter projetos recentes
  const getRecentProjects = () => {
    return projectState.projects
      .filter(project => !project.archived) // Filtra apenas se o campo archived existir e for false
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  // Função para obter equipes de trabalho
  const getWorkGroupsData = () => {
    return workGroups.slice(0, 3).map(group => ({
      id: group.id,
      name: group.name,
      members: group.members.length,
      activeProjects: group.activeProjects,
      color: group.color,
      description: group.description,
      sector: group.sector,
      membersList: group.members
    }));
  };
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      weekday: 'short' 
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>;
      case 'high':
        return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>;
      case 'medium':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      case 'low':
        return <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      default:
        return <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Pendente URGENTE';
      case 'high':
        return 'Pendente ALTA';
      case 'medium':
        return 'Pendente';
      case 'low':
        return 'Pendente BAIXA';
      default:
        return 'Pendente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-3 w-3 text-white" />
        </div>;
      case 'in-progress':
        return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <Clock className="h-3 w-3 text-white" />
        </div>;
      case 'pending':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      case 'overdue':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>;
      default:
        return <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in-progress':
        return 'Em Progresso';
      case 'overdue':
        return 'Atrasada';
      case 'pending':
        return 'Pendente';
      default:
        return 'Pendente';
    }
  };

  // Função para traduzir status dos projetos
  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planejamento';
      case 'active':
        return 'Ativo';
      case 'on_hold':
        return 'Em Pausa';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Funções para abrir modais
  const openActivityModal = (activity: any) => {
    setSelectedItem(activity);
    setModalType('activity');
    setIsModalOpen(true);
  };

  const openProjectModal = (project: any) => {
    setSelectedItem(project);
    setModalType('project');
    setIsModalOpen(true);
  };

  const openWorkGroupModal = (workGroup: any) => {
    setSelectedItem(workGroup);
    setModalType('workgroup');
    setIsModalOpen(true);
  };

  const openCalendarModal = (event: any) => {
    setSelectedItem(event);
    setModalType('calendar');
    setIsModalOpen(true);
  };

  // Funções de navegação
  const navigateToActivities = () => navigate('/activities');
  const navigateToProjects = () => navigate('/projects');
  const navigateToCalendar = () => navigate('/calendar');
  const navigateToWorkGroups = () => navigate('/work-groups');

  // Funções para criar novos itens
  const createNewActivity = () => navigate('/activities');
  const createNewProject = () => navigate('/projects');
  const createNewCalendarEvent = () => navigate('/calendar');

  // Função para remover um bloco do dashboard (agora usa o hook)
  const handleRemoveCard = async (cardId: string) => {
    await removeCard(cardId);
  };

  // Função para adicionar novo bloco de Comentários Atribuídos
  const handleAddAssignedCommentsCard = async () => {
    await addCard('comentarios-atribuidos', 'Comentários Atribuídos', 'comentarios-atribuidos');
  };

  // Função para adicionar novo bloco de Prioridades
  const handleAddPrioritiesCard = async () => {
    await addCard('prioridades', 'Prioridades (LineUp)', 'prioridades');
  };

  // Função para buscar comentários reais das publicações do Feed
  const fetchFeedComments = async () => {
    setCommentsLoading(true);
    console.log('🔍 [INDEX] Iniciando fetchFeedComments...');
    
    try {
      // Buscar diretamente da tabela feed as últimas 3 publicações
      const { data: recentPosts, error: postsError } = await supabase
        .from('feed')
        .select(`
          id,
          content,
          created_at,
          user_id,
          users:user_id (
            id,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (postsError) {
        console.error('❌ Erro ao buscar posts do Feed:', postsError);
        setFeedComments([]);
        return;
      }

      console.log('🔍 [INDEX] Posts recentes encontrados:', recentPosts?.length || 0, recentPosts);

      if (!recentPosts || recentPosts.length === 0) {
        console.log('🔍 [INDEX] Nenhum post encontrado no Feed');
        setFeedComments([]);
        return;
      }

      // Buscar comentários das últimas 3 publicações
      const postIds = recentPosts.map(post => post.id);
      console.log('🔍 [INDEX] IDs dos posts para buscar comentários:', postIds);

      const { data: comments, error: commentsError } = await supabase
        .from('feed_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          feed_id,
          users:user_id (
            id,
            raw_user_meta_data
          )
        `)
        .in('feed_id', postIds)
        .order('created_at', { ascending: false })
        .limit(6); // Limitar a 6 comentários

      if (commentsError) {
        console.error('❌ Erro ao buscar comentários:', commentsError);
        setFeedComments([]);
        return;
      }

      console.log('🔍 [INDEX] Comentários encontrados:', comments?.length || 0, comments);

      if (!comments || comments.length === 0) {
        console.log('🔍 [INDEX] Nenhum comentário encontrado');
        setFeedComments([]);
        return;
      }

      // Processar comentários
      const processedComments = comments.map(comment => {
        const userData = comment.users?.raw_user_meta_data;
        const post = recentPosts.find(p => p.id === comment.feed_id);
        
        return {
          id: comment.id,
          author: userData?.name || userData?.full_name || 'Usuário',
          comment: comment.content,
          project: post?.content?.substring(0, 80) + (post?.content?.length > 80 ? '...' : '') || 'Post sem descrição',
          time: getTimeAgo(comment.created_at),
          priority: 'medium',
          postId: comment.feed_id,
          avatar: userData?.avatar_url || null
        };
      });

      console.log('🔍 [INDEX] Comentários processados:', processedComments.length, processedComments);
      setFeedComments(processedComments);
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar comentários:', error);
      setFeedComments([]);
    } finally {
      setCommentsLoading(false);
      console.log('🔍 [INDEX] fetchFeedComments finalizado');
    }
  };

  // Buscar comentários quando o componente carregar
  useEffect(() => {
    console.log('🔍 [INDEX] useEffect executado, buscando comentários...');
    fetchFeedComments();
  }, []);

  // Função para obter dados de comentários atribuídos (dados reais do Feed)
  const getAssignedCommentsData = () => {
    console.log('🔍 [INDEX] Retornando comentários reais:', feedComments.length);
    return feedComments;
  };

  // Função auxiliar para calcular tempo decorrido
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours} horas atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dias atrás`;
    }
  };

  // Função auxiliar para determinar prioridade baseada no tempo
  const getCommentPriority = (post: any) => {
    const now = new Date();
    const postDate = new Date(post.created_at);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 2) {
      return 'high';
    } else if (diffInHours < 24) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  // Função para obter dados de prioridades (projetos que estão para vencer)
  const getPrioritiesData = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Filtrar projetos que estão próximos do prazo ou atrasados
    return projectState.projects
      .filter(project => {
        if (project.archived || project.status === 'completed') return false;
        
        // Se tem data de vencimento, verificar se está próxima
        if (project.due_date) {
          const dueDate = new Date(project.due_date);
          return dueDate <= nextWeek; // Projetos que vencem na próxima semana ou já venceu
        }
        
        // Se não tem data de vencimento, incluir projetos ativos recentes
        if (project.status === 'active') {
          const createdDate = new Date(project.created_at);
          const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceCreation <= 30; // Projetos criados nos últimos 30 dias
        }
        
        return false;
      })
      .sort((a, b) => {
        // Ordenar por: primeiro os atrasados, depois por data de vencimento
        const aDue = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
        const bDue = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
        
        // Se um está atrasado e outro não, o atrasado vem primeiro
        const aOverdue = aDue < today;
        const bOverdue = bDue < today;
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Caso contrário, ordenar por data
        return aDue.getTime() - bDue.getTime();
      })
      .slice(0, 5);
  };

  // Função para obter dados de novas mensagens (mock do chat)
  const getNewMessagesData = () => {
    return [
      { id: '1', sender: 'João Silva', message: 'Preciso de ajuda com o projeto...', time: '2 min atrás', unread: true },
      { id: '2', sender: 'Maria Santos', message: 'Reunião confirmada para amanhã', time: '15 min atrás', unread: true },
      { id: '3', sender: 'Carlos Lima', message: 'Documento enviado com sucesso', time: '1 hora atrás', unread: false }
    ];
  };

  // Função para renderizar o conteúdo de um bloco baseado no tipo
  const renderCardContent = (cardType: string) => {
    switch (cardType) {
      case 'recentes':
        return (
          <div className="space-y-3">
            {getRecentActivities().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                {getStatusIcon(activity.status)}
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">• {getStatusText(activity.status)}</p>
                </div>
              </div>
            ))}
            {getRecentActivities().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Nenhuma atividade recente.
                </p>
              </div>
            )}
          </div>
        );

      case 'agenda':
        return (
          <div className="h-[200px] flex flex-col"> {/* Altura fixa reduzida */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 h-6 w-6" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{formatDate(currentDate)}</span>
                <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 h-6 w-6" onClick={goToNextDay}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 px-2 py-1 text-xs flex items-center gap-1 transition-all duration-200 h-6"
                onClick={goToToday}
              >
                <CalendarDays className="h-3 w-3" />
                Hoje
              </Button>
            </div>
            
            {/* Lista de eventos com altura fixa e scroll */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {calendarEvents.length > 0 ? (
                calendarEvents.slice(0, 3).map((event) => (
                <div 
                  key={event.id}
                    className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                  onClick={() => openCalendarModal(event)}
                >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white text-xs font-medium truncate">{event.title}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{event.time} • {event.type}</p>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CalendarDays className="h-6 w-6 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Nenhum evento hoje</p>
                </div>
              )}
            </div>

            {/* Botão fixo na parte inferior - centralizado e menor */}
            <div className="mt-auto flex justify-center">
              <Button 
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1 rounded flex items-center gap-1 shadow-md transition-all duration-300 text-xs h-6"
                onClick={navigateToCalendar}
              >
                <Plus size={10} />
                Ver Calendário
              </Button>
            </div>
            </div>
        );

      case 'pendentes':
        return (
          <div className="space-y-3">
            {getPendingActivities().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                {getPriorityIcon(activity.priority)}
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">• {getPriorityText(activity.priority)}</p>
                </div>
              </div>
            ))}
            {getPendingActivities().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Nenhuma atividade pendente.
                </p>
              </div>
            )}
          </div>
        );

      case 'andamento':
        return (
          <div className="space-y-3">
            {getInProgressActivities().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">• {getStatusText(activity.status)} • {activity.type}</p>
                </div>
              </div>
            ))}
            {getInProgressActivities().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Nenhuma atividade em andamento. 
                  <span className="text-[#8854F7] underline cursor-pointer ml-1">Saiba mais</span>
                </p>
                <Button className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-md transition-all duration-300 text-[12px] h-[28px] mx-auto">
                  <Plus size={12} />
                  Iniciar atividade
                </Button>
              </div>
            )}
          </div>
        );

      case 'atrasadas':
        return (
          <div className="space-y-3">
            {getOverdueActivities().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{activity.title}</p>
                  <p className="text-red-500 dark:text-red-400 text-xs">Atrasada desde {new Date(activity.due_date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
            {getOverdueActivities().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Nenhuma atividade atrasada. 
                  <span className="text-[#8854F7] underline cursor-pointer ml-1">Saiba mais</span>
                </p>
              </div>
            )}
          </div>
        );

      case 'equipes':
        return (
          <div className="space-y-3">
            {getWorkGroupsData().map((group) => (
              <div 
                key={group.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openWorkGroupModal(group)}
              >
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: group.color }}
                >
                  <Users className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{group.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">• {group.members} membros • {group.activeProjects} projetos</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'projetos':
        return (
          <div className="space-y-3">
            {getRecentProjects().map((project) => (
              <div 
                key={project.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openProjectModal(project)}
              >
                <div className="w-4 h-4 bg-[#8854F7] rounded-full flex items-center justify-center">
                  <FileText className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{project.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">• {getProjectStatusText(project.status)}</p>
                </div>
              </div>
            ))}
            {getRecentProjects().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Nenhum projeto recente. 
                  <span className="text-[#8854F7] underline cursor-pointer ml-1">Saiba mais</span>
                </p>
                <Button className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-md transition-all duration-300 text-[12px] h-[28px] mx-auto">
                  <Plus size={12} />
                  Criar projeto
                </Button>
              </div>
            )}
          </div>
        );

      case 'standup':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8854F7] via-[#6366F1] to-[#10B981] rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
        );

      case 'comentarios-atribuidos':
        const commentsData = getAssignedCommentsData();
        
        // Debug adicional na renderização
        console.log('🔍 [INDEX] Renderizando comentários:', {
          feedLoading,
          commentsData: commentsData.length,
          posts: posts?.length || 0
        });
        
        return (
          <div className="space-y-3">
            {(feedLoading || commentsLoading) ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 font-medium">
                  Carregando comentários...
                </p>
              </div>
            ) : commentsData.length > 0 ? (
              commentsData.map((comment) => (
              <div 
                key={comment.id} 
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors duration-200 cursor-pointer border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  {/* Header com foto de perfil e informações */}
                  <div className="flex items-start gap-3 mb-2">
                    {/* Avatar do autor */}
                    {comment.avatar ? (
                      <img 
                        src={comment.avatar} 
                        alt={comment.author}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {comment.author.charAt(0).toUpperCase()}
                        </span>
                </div>
                    )}
                    
                    {/* Informações do autor e data */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white text-sm font-medium truncate">
                          {comment.author}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                          {comment.time}
                        </span>
              </div>
                    </div>
                  </div>
                  
                  {/* Conteúdo do post/comentário */}
                  <div className="ml-11">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {comment.comment}
                    </p>
                    
                    {/* Footer com descrição do post */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Feed</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">•</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs truncate" title={comment.project}>
                        {comment.project}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 font-medium">
                  Nenhum comentário recente
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">
                  Comentários de posts do Feed aparecerão aqui
                </p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7 px-3"
                    onClick={() => navigate('/feed')}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Ver Feed
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'prioridades':
        return (
          <div className="space-y-3">
            {getPrioritiesData().map((project) => {
              const isOverdue = project.due_date && new Date(project.due_date) < new Date();
              const priorityColor = isOverdue ? 'bg-red-500' : 'bg-orange-500';
              const priorityText = isOverdue ? 'Atrasado' : 'Próximo do prazo';
              
              return (
                <div 
                  key={project.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                  onClick={() => openProjectModal(project)}
              >
                  <div className={`w-4 h-4 ${priorityColor} rounded-full flex items-center justify-center`}>
                  <Flag className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-gray-900 dark:text-white text-sm font-medium">{project.name}</p>
                    <p className={`text-xs ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`}>
                      • {priorityText} • {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem data definida'}
                    </p>
                </div>
              </div>
              );
            })}
            {getPrioritiesData().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Flag className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Nenhum projeto próximo do prazo.
                </p>
              </div>
            )}
          </div>
        );

      case 'novas-mensagens':
        return (
          <div className="space-y-3">
            {getNewMessagesData().map((message) => (
              <div 
                key={message.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${message.unread ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
                  <MessageCircle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm font-medium">{message.sender}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">• {message.message} • {message.time}</p>
                </div>
                {message.unread && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Função para iniciar o drag
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    console.log('Drag started:', cardId); // Debug
    setDraggedCard(cardId);
    setIsDragging(true);
    setDragOverCard(null);
    
    // Definir dados do drag
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Efeito visual
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.opacity = '0.5';
      target.style.transform = 'scale(0.95)';
    }
  };

  // Função para permitir drop
  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedCard && draggedCard !== cardId) {
      setDragOverCard(cardId);
    }
  };

  // Função para finalizar o drop
  const handleDrop = async (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    console.log('Drop:', draggedCard, 'onto:', targetCardId); // Debug
    
    if (draggedCard && draggedCard !== targetCardId) {
      // Reordenar os cards
      const cards = [...dashboardCards];
        const draggedIndex = cards.findIndex(card => card.id === draggedCard);
        const targetIndex = cards.findIndex(card => card.id === targetCardId);
        
        console.log('Reordering:', draggedIndex, 'to', targetIndex); // Debug
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [draggedCardObj] = cards.splice(draggedIndex, 1);
          cards.splice(targetIndex, 0, draggedCardObj);
        
        // Salvar nova ordem no Supabase
        await reorderCards(cards);
      }
    }
    
    // Limpar estados
    setDraggedCard(null);
    setDragOverCard(null);
    setIsDragging(false);
  };

  // Função para finalizar o drag
  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag ended'); // Debug
    setDraggedCard(null);
    setDragOverCard(null);
    setIsDragging(false);
    
    // Restaurar aparência
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.opacity = '1';
      target.style.transform = '';
    }
  };

  return (
    <div className="min-h-screen dark:bg-black">
      {/* PageHeader - apenas para Dashboard */}
      <PageHeader 
        showManageCardsButton={true}
        onManageCards={() => setIsManageCardsModalOpen(true)}
        showSettingsButton={true}
        onSettings={() => setIsGreetingSettingsOpen(true)}
        showPageIcon={true}
        showSidebarToggle={true}
      />
      
      {/* Dashboard Content */}
      <div className="p-6 pt-[60px]">
        {/* Header with Greeting and Manage Cards Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {showGreeting ? greeting : ''}
          </h1>
          <div className="flex items-center gap-3">
            {/* Botões agora estão na PageHeader */}
          </div>
        </div>

        {/* Dashboard Grid */}
        {cardsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardCards.filter(card => card.visible).map((card) => (
            <div 
              key={card.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-300 dark:border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 cursor-pointer relative group ${
                dragOverCard === card.id ? 'ring-2 ring-[#8854F7] ring-opacity-50 bg-purple-50 dark:bg-purple-900/20' : ''
              } ${draggedCard === card.id ? 'opacity-50 scale-95' : ''}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, card.id)}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDrop={(e) => handleDrop(e, card.id)}
              onDragEnd={handleDragEnd}
            >
                {/* Botão de remoção - visível apenas no hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleRemoveCard(card.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover este campo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Botão de drag-and-drop - visível apenas no hover */}
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div
                    className="h-8 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing select-none bg-white rounded border border-gray-200 hover:bg-gray-50"
                    title="Clique e arraste para reordenar"
                    draggable={false}
                  >
                    <span className="text-lg text-gray-500 hover:text-gray-700 transition-colors">⋮⋮</span>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pr-12 pl-12">{card.title}</h2>
                {renderCardContent(card.type)}
              </div>
            ))}
          </div>
        )}
        </div>

      {/* Modal Expandido com Detalhes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between dark:text-white">
              <span>
                {modalType === 'activity' && 'Detalhes da Atividade'}
                {modalType === 'project' && 'Detalhes do Projeto'}
                {modalType === 'workgroup' && 'Detalhes da Equipe'}
                {modalType === 'calendar' && 'Detalhes do Evento'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Modal de Atividade */}
              {modalType === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <Badge className={`px-3 py-1 ${
                      selectedItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedItem.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      selectedItem.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(selectedItem.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>Tipo: {selectedItem.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Data: {new Date(selectedItem.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Responsável: {selectedItem.responsibleId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/activities/${selectedItem.id}`)} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver na Página de Atividades
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Modal de Projeto */}
              {modalType === 'project' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <Badge className="px-3 py-1 bg-blue-100 text-blue-800">
                      {selectedItem.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Criado: {new Date(selectedItem.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        <span>Status: {selectedItem.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/projects/${selectedItem.id}`)} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver na Página de Projetos
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Modal de Equipe de Trabalho */}
              {modalType === 'workgroup' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: selectedItem.color }}
                    >
                      {selectedItem.name.charAt(0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{selectedItem.members} membros</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        <span>{selectedItem.activeProjects} projetos ativos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>Setor: {selectedItem.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Membros da Equipe:</h4>
                    <div className="space-y-2">
                      {selectedItem.membersList?.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-[#0f172a] text-white">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.position}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/work-groups/${selectedItem.id}`)} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver na Página de Equipes
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Modal de Evento do Calendário */}
              {modalType === 'calendar' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <Badge className="px-3 py-1 bg-blue-100 text-blue-800">
                      {selectedItem.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Data: {new Date(selectedItem.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Horário: {selectedItem.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Local: {selectedItem.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Participantes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.attendees?.map((attendee: string, index: number) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {attendee}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/calendar')} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver no Calendário
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
      </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Gerenciar Cartões */}
      <Dialog open={isManageCardsModalOpen} onOpenChange={setIsManageCardsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Plus className="h-5 w-5" />
              Adicionar cartões
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Adicione novos cartões ao seu dashboard para personalizar sua experiência.
            </div>
            
            {/* Comentários atribuídos */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Comentários atribuídos</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visualize os comentários atribuídos a você e realize as devidas ações.</p>
              </div>
              {dashboardCards.find(card => card.id === 'comentarios-atribuidos' && card.visible) ? (
                <div className="flex gap-2">
                <Button 
                  size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-8 transition-all duration-200"
                  disabled
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Adicionado
                </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 h-8 transition-all duration-200"
                    onClick={() => handleRemoveCard('comentarios-atribuidos')}
                    disabled={cardsSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm"
                  className="bg-[#8854F7] hover:bg-[#7c4df0] text-white px-3 py-1 h-8 transition-all duration-200 hover:scale-105"
                  onClick={handleAddAssignedCommentsCard}
                  disabled={cardsSaving}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            
            {/* Prioridades (LineUp) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Prioridades (LineUp)</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Junte as tarefas mais importantes em uma lista concisa.</p>
              </div>
              {dashboardCards.find(card => card.id === 'prioridades' && card.visible) ? (
                <div className="flex gap-2">
                <Button 
                  size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-8 transition-all duration-200"
                  disabled
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Adicionado
                </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 h-8 transition-all duration-200"
                    onClick={() => handleRemoveCard('prioridades')}
                    disabled={cardsSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm"
                  className="bg-[#8854F7] hover:bg-[#7c4df0] text-white px-3 py-1 h-8 transition-all duration-200 hover:scale-105"
                  onClick={handleAddPrioritiesCard}
                  disabled={cardsSaving}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            
            <div className="pt-4 border-t dark:border-gray-600">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Todos os Cartões:</div>
              <div className="space-y-2">
                {dashboardCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${card.visible ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{card.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={card.visible ? "default" : "secondary"} className={`text-xs ${card.visible ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'dark:bg-gray-600 dark:text-gray-200'}`}>
                        {card.visible ? 'Ativo' : 'Inativo'}
                    </Badge>
                      {card.visible ? (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 px-2 py-1 h-6 text-xs transition-all duration-200"
                          onClick={() => handleRemoveCard(card.id)}
                          disabled={cardsSaving}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-600 hover:bg-green-50 px-2 py-1 h-6 text-xs transition-all duration-200"
                          onClick={() => reactivateCard(card.id)}
                          disabled={cardsSaving}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Reativar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações da Saudação */}
      <Dialog open={isGreetingSettingsOpen} onOpenChange={setIsGreetingSettingsOpen}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Settings className="h-5 w-5" />
              Layout
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Saudação da página</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Exibir saudação personalizada no topo</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div className="relative">
                <input
                  type="checkbox"
                  id="greeting-toggle"
                  checked={showGreeting}
                  onChange={(e) => setShowGreeting(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="greeting-toggle"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                    showGreeting ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      showGreeting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {showGreeting 
                  ? 'A saudação será exibida no topo da página com base no horário atual.'
                  : 'A saudação não será exibida na página.'
                }
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

