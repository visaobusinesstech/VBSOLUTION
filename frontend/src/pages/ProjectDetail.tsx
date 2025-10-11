import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject } from '@/contexts/ProjectContext';
import { useProjects } from '@/hooks/useProjects';
import { ArrowLeft, Calendar, User, Building2, Clock, Edit, Save, X, FileText, Target, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useProject();
  const { projects, loading, error, updateProject } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    due_date: '',
    budget: '',
    currency: 'BRL',
    progress: 0,
    notes: ''
  });

  // Debug logs
  useEffect(() => {
    console.log('🔍 ProjectDetail - ID recebido:', id);
    console.log('🔍 ProjectDetail - Projetos carregados:', projects);
    console.log('🔍 ProjectDetail - Loading:', loading);
    console.log('🔍 ProjectDetail - Error:', error);
  }, [id, projects, loading, error]);

  const project = projects.find(p => p.id === id);
  const isNewProject = id === 'new';

  useEffect(() => {
    if (isNewProject) {
      setIsEditing(true);
    } else if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        budget: project.budget?.toString() || '',
        currency: project.currency || 'BRL',
        progress: project.progress || 0,
        notes: project.notes || ''
      });
    }
  }, [isNewProject, project]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando projeto...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar projeto</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/projects')} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Projetos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!project && !isNewProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h1>
            <p className="text-gray-600 mb-4">O projeto que você está procurando não existe ou foi removido.</p>
            <p className="text-gray-500 mb-4">ID procurado: {id}</p>
            <p className="text-gray-500 mb-4">Total de projetos carregados: {projects.length}</p>
            <Button onClick={() => navigate('/projects')} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Projetos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Baixa';
      case 'medium':
        return 'Média';
      case 'high':
        return 'Alta';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (!project) return;
      
      const updatedData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        progress: Number(formData.progress)
      };

      await updateProject(project.id, updatedData);
      
      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        budget: project.budget?.toString() || '',
        currency: project.currency || 'BRL',
        progress: project.progress || 0,
        notes: project.notes || ''
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Projetos
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Informações do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome do Projeto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Projeto
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Digite o nome do projeto"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{project?.name || 'Novo Projeto'}</p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Digite a descrição do projeto"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-600">{project?.description || 'Sem descrição'}</p>
                  )}
                </div>

                {/* Status e Prioridade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    {isEditing ? (
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planejamento</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="on_hold">Em Pausa</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusColor(project?.status || 'planning')}>
                        {getStatusText(project?.status || 'planning')}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    {isEditing ? (
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getPriorityColor(project?.priority || 'medium')}>
                        {getPriorityText(project?.priority || 'medium')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Início
                    </label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-600">
                        {project?.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'Não definida'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Entrega
                    </label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-600">
                        {project?.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Não definida'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Orçamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orçamento
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-gray-600">
                        {project?.budget 
                          ? `${project.currency || 'BRL'} ${Number(project.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'Não definido'
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Progresso (%)
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => handleInputChange('progress', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project?.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{project?.progress || 0}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Adicione notas sobre o projeto"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-600">{project?.notes || 'Sem notas'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Criado em:</span>
                  <span className="text-sm font-medium">
                    {project?.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Atualizado em:</span>
                  <span className="text-sm font-medium">
                    {project?.updated_at ? new Date(project.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progresso:</span>
                  <span className="text-sm font-medium">{project?.progress || 0}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-sm">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/activities')}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Ver Atividades
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/projects')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Todos os Projetos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
