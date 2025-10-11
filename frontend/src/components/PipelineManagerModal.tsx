import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X, GripVertical, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FunnelStage {
  id: string;
  name: string;
  position: number;
  color: string;
  is_active: boolean;
  created_at: string;
  pipeline_id?: string;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  stages: FunnelStage[];
  created_at: string;
  updated_at: string;
}

interface PipelineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPipelineUpdated: () => void;
}

const PipelineManagerModal: React.FC<PipelineManagerModalProps> = ({
  isOpen,
  onClose,
  onPipelineUpdated
}) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false
  });
  const [newStage, setNewStage] = useState({
    name: '',
    color: '#3B82F6'
  });
  const [editingStage, setEditingStage] = useState<FunnelStage | null>(null);
  const [editStageData, setEditStageData] = useState({
    name: '',
    color: '#3B82F6'
  });
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colorOptions = [
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#F59E0B', label: 'Laranja' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Cinza' },
    { value: '#F97316', label: 'Laranja Escuro' }
  ];

  // Carregar pipelines e etapas
  useEffect(() => {
    if (isOpen) {
      loadPipelines();
      loadStages();
    }
  }, [isOpen]);

  const loadPipelines = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        const mockPipelines: Pipeline[] = [
          {
            id: '1',
            name: 'Pipeline Padrão',
            description: 'Pipeline padrão do sistema',
            is_default: true,
            is_active: true,
            stages: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setPipelines(mockPipelines);
        if (mockPipelines.length > 0) {
          setSelectedPipeline(mockPipelines[0]);
          setSelectedPipelineId(mockPipelines[0].id);
        }
        return;
      }

      const { data: pipelinesData, error: pipelinesError } = await supabase
        .from('pipelines')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (pipelinesError) {
        console.error('Erro ao carregar pipelines:', pipelinesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar pipelines",
          variant: "destructive"
        });
        return;
      }

      const pipelines: Pipeline[] = pipelinesData.map(pipeline => ({
        ...pipeline,
        stages: []
      }));

      setPipelines(pipelines);
      if (pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
        setSelectedPipeline(defaultPipeline);
        setSelectedPipelineId(defaultPipeline.id);
        await loadStagesForPipeline(defaultPipeline.id);
      }
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pipelines",
        variant: "destructive"
      });
    }
  };

  const loadStages = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        const mockStages: FunnelStage[] = [
          { id: '1', name: 'Novo Lead', position: 1, color: '#EF4444', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '2', name: 'Contato Inicial', position: 2, color: '#F59E0B', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '3', name: 'Proposta', position: 3, color: '#3B82F6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '4', name: 'Fechamento', position: 4, color: '#10B981', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '5', name: 'Boas Vindas', position: 5, color: '#8B5CF6', is_active: true, created_at: '2024-01-01T00:00:00Z' },
          { id: '6', name: 'Não Concluído', position: 6, color: '#6B7280', is_active: true, created_at: '2024-01-01T00:00:00Z' }
        ];
        setStages(mockStages);
        return;
      }

      const { data: stagesData, error: stagesError } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (stagesError) {
        console.error('Erro ao carregar etapas:', stagesError);
        toast({
          title: "Erro",
          description: "Erro ao carregar etapas",
          variant: "destructive"
        });
        return;
      }

      setStages(stagesData || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar etapas",
        variant: "destructive"
      });
    }
  };

  const loadStagesForPipeline = async (pipelineId: string) => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado, usando dados mock');
        return;
      }

      const { data: stagesData, error: stagesError } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (stagesError) {
        console.error('Erro ao carregar etapas da pipeline:', stagesError);
        return;
      }

      setStages(stagesData || []);
    } catch (error) {
      console.error('Erro ao carregar etapas da pipeline:', error);
    }
  };

  const handleCreatePipeline = () => {
    setIsCreating(true);
    setIsEditing(false);
    setFormData({ name: '', description: '', is_default: false });
  };

  const handleEditPipeline = (pipeline: Pipeline) => {
    setIsEditing(true);
    setIsCreating(false);
    setSelectedPipeline(pipeline);
    setFormData({
      name: pipeline.name,
      description: pipeline.description || '',
      is_default: pipeline.is_default
    });
  };

  const handleSavePipeline = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Erro",
          description: "Nome da pipeline é obrigatório",
          variant: "destructive"
        });
        return;
      }

      if (!supabase) {
        console.warn('Supabase não configurado, simulando salvamento');
        const newPipeline: Pipeline = {
          id: crypto.randomUUID(),
          name: formData.name,
          description: formData.description,
          is_default: formData.is_default,
          is_active: true,
          stages: [...stages],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (isCreating) {
          setPipelines(prev => [...prev, newPipeline]);
          toast({
            title: "Pipeline criada",
            description: "Pipeline criada com sucesso (modo simulação)"
          });
        } else {
          setPipelines(prev => prev.map(p => p.id === selectedPipeline?.id ? { ...p, ...formData } : p));
          toast({
            title: "Pipeline atualizada",
            description: "Pipeline atualizada com sucesso (modo simulação)"
          });
        }

        setIsCreating(false);
        setIsEditing(false);
        setFormData({ name: '', description: '', is_default: false });
        onPipelineUpdated();
        return;
      }

      if (isCreating) {
        // Criar nova pipeline no Supabase
        const { data: newPipeline, error: createError } = await supabase
          .from('pipelines')
          .insert([{
            name: formData.name,
            description: formData.description,
            is_default: formData.is_default,
            is_active: true
          }])
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar pipeline:', createError);
          throw createError;
        }

        setPipelines(prev => [...prev, {
          ...newPipeline,
          stages: [...stages]
        }]);

        toast({
          title: "Pipeline criada",
          description: "Pipeline criada com sucesso"
        });
      } else {
        // Atualizar pipeline existente no Supabase
        if (selectedPipeline) {
          const { error: updateError } = await supabase
            .from('pipelines')
            .update({
              name: formData.name,
              description: formData.description,
              is_default: formData.is_default,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedPipeline.id);

          if (updateError) {
            console.error('Erro ao atualizar pipeline:', updateError);
            throw updateError;
          }

          setPipelines(prev => prev.map(p => 
            p.id === selectedPipeline.id 
              ? { ...p, ...formData, updated_at: new Date().toISOString() }
              : p
          ));

          toast({
            title: "Pipeline atualizada",
            description: "Pipeline atualizada com sucesso"
          });
        }
      }

      setIsCreating(false);
      setIsEditing(false);
      setFormData({ name: '', description: '', is_default: false });
      setHasUnsavedChanges(false);
      onPipelineUpdated();
    } catch (error) {
      console.error('Erro ao salvar pipeline:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pipeline",
        variant: "destructive"
      });
    }
  };

  const handleAddStage = async () => {
    try {
      if (!newStage.name.trim()) {
        toast({
          title: "Erro",
          description: "Nome da etapa é obrigatório",
          variant: "destructive"
        });
        return;
      }

      if (!selectedPipelineId) {
        toast({
          title: "Erro",
          description: "Selecione uma pipeline primeiro",
          variant: "destructive"
        });
        return;
      }

      if (!supabase) {
        console.warn('Supabase não configurado, simulando adição de etapa');
        const stage: FunnelStage = {
          id: crypto.randomUUID(),
          name: newStage.name,
          position: stages.length + 1,
          color: newStage.color,
          is_active: true,
          pipeline_id: selectedPipelineId,
          created_at: new Date().toISOString()
        };

        setStages(prev => [...prev, stage]);
        setNewStage({ name: '', color: '#3B82F6' });
        setHasUnsavedChanges(true);

        toast({
          title: "Etapa adicionada",
          description: "Etapa adicionada com sucesso (modo simulação)"
        });
        return;
      }

      // Salvar etapa no Supabase
      const { data: savedStage, error: createError } = await supabase
        .from('funnel_stages')
        .insert([{
          name: newStage.name,
          color: newStage.color,
          position: stages.length + 1,
          is_active: true,
          pipeline_id: selectedPipelineId
        }])
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar etapa:', createError);
        throw createError;
      }

      setStages(prev => [...prev, savedStage]);
      setNewStage({ name: '', color: '#3B82F6' });
      setHasUnsavedChanges(true);

      toast({
        title: "Etapa adicionada",
        description: "Etapa adicionada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar etapa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado, simulando remoção de etapa');
        setStages(prev => prev.filter(s => s.id !== stageId));
        toast({
          title: "Etapa removida",
          description: "Etapa removida com sucesso (modo simulação)"
        });
        setHasUnsavedChanges(true);
        return;
      }

      // Verificar se o ID é um UUID válido
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stageId);
      
      if (isUUID) {
        const { error: deleteError } = await supabase
          .from('funnel_stages')
          .delete()
          .eq('id', stageId);

        if (deleteError) {
          console.error('Erro ao deletar etapa:', deleteError);
          throw deleteError;
        }
      }

      setStages(prev => prev.filter(s => s.id !== stageId));
      toast({
        title: "Etapa removida",
        description: "Etapa removida com sucesso"
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Erro ao remover etapa:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover etapa",
        variant: "destructive"
      });
    }
  };

  const handleEditStage = (stage: FunnelStage) => {
    setEditingStage(stage);
    setEditStageData({
      name: stage.name,
      color: stage.color
    });
  };

  const handleSaveStageEdit = async () => {
    try {
      if (!editStageData.name.trim()) {
        toast({
          title: "Erro",
          description: "Nome da etapa é obrigatório",
          variant: "destructive"
        });
        return;
      }

      if (!editingStage) {
        toast({
          title: "Erro",
          description: "Nenhuma etapa selecionada para edição",
          variant: "destructive"
        });
        return;
      }

      if (!supabase) {
        console.warn('Supabase não configurado, simulando atualização de etapa');
        setStages(prev => prev.map(stage => 
          stage.id === editingStage.id 
            ? { ...stage, name: editStageData.name, color: editStageData.color }
            : stage
        ));

        setEditingStage(null);
        setEditStageData({ name: '', color: '#3B82F6' });

        toast({
          title: "Etapa atualizada",
          description: "Etapa atualizada com sucesso (modo simulação)"
        });
        setHasUnsavedChanges(true);
        return;
      }

      // Verificar se o ID é um UUID válido
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(editingStage.id);
      
      if (isUUID) {
        const { error: updateError } = await supabase
          .from('funnel_stages')
          .update({
            name: editStageData.name,
            color: editStageData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStage.id);

        if (updateError) {
          console.error('Erro ao atualizar etapa:', updateError);
          throw updateError;
        }
      }

      setStages(prev => prev.map(stage => 
        stage.id === editingStage.id 
          ? { ...stage, name: editStageData.name, color: editStageData.color }
          : stage
      ));

      setEditingStage(null);
      setEditStageData({ name: '', color: '#3B82F6' });

      toast({
        title: "Etapa atualizada",
        description: "Etapa atualizada com sucesso"
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar etapa",
        variant: "destructive"
      });
    }
  };

  const handleCancelStageEdit = () => {
    setEditingStage(null);
    setEditStageData({ name: '', color: '#3B82F6' });
  };

  const handleSaveAllChanges = async () => {
    try {
      setIsSaving(true);
      
      if (!supabase) {
        console.warn('Supabase não configurado, simulando salvamento');
        toast({
          title: "Alterações salvas",
          description: "Alterações salvas localmente (modo simulação)"
        });
        setHasUnsavedChanges(false);
        return;
      }

      // Salvar etapas modificadas
      for (const stage of stages) {
        // Verificar se o ID é um UUID válido
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stage.id);
        
        if (isUUID) {
          const { error: stageError } = await supabase
            .from('funnel_stages')
            .update({
              name: stage.name,
              color: stage.color,
              position: stage.position,
              updated_at: new Date().toISOString()
            })
            .eq('id', stage.id);

          if (stageError) {
            console.error('Erro ao salvar etapa:', stageError);
            throw stageError;
          }
        } else {
          console.log(`⚠️ Pulando etapa com ID inválido: ${stage.id}`);
        }
      }

      // Salvar pipeline modificada
      if (selectedPipeline) {
        // Verificar se o ID é um UUID válido
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedPipeline.id);
        
        if (isUUID) {
          const { error: pipelineError } = await supabase
            .from('pipelines')
            .update({
              name: selectedPipeline.name,
              description: selectedPipeline.description,
              is_default: selectedPipeline.is_default,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedPipeline.id);

          if (pipelineError) {
            console.error('Erro ao salvar pipeline:', pipelineError);
            throw pipelineError;
          }
        } else {
          console.log(`⚠️ Pulando pipeline com ID inválido: ${selectedPipeline.id}`);
        }
      }

      toast({
        title: "Alterações salvas",
        description: "Todas as alterações foram salvas com sucesso"
      });

      setHasUnsavedChanges(false);
      onPipelineUpdated();
      
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePipelineChange = async (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      setSelectedPipeline(pipeline);
      await loadStagesForPipeline(pipelineId);
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    try {
      if (!supabase) {
        console.warn('Supabase não configurado, simulando remoção de pipeline');
        setPipelines(prev => prev.filter(p => p.id !== pipelineId));
        if (selectedPipeline?.id === pipelineId) {
          setSelectedPipeline(null);
        }
        toast({
          title: "Pipeline removida",
          description: "Pipeline removida com sucesso (modo simulação)"
        });
        setHasUnsavedChanges(true);
        return;
      }

      // Verificar se o ID é um UUID válido
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pipelineId);
      
      if (isUUID) {
        // Primeiro deletar todas as etapas da pipeline
        const { error: deleteStagesError } = await supabase
          .from('funnel_stages')
          .delete()
          .eq('pipeline_id', pipelineId);

        if (deleteStagesError) {
          console.error('Erro ao deletar etapas da pipeline:', deleteStagesError);
          throw deleteStagesError;
        }

        // Depois deletar a pipeline
        const { error: deletePipelineError } = await supabase
          .from('pipelines')
          .delete()
          .eq('id', pipelineId);

        if (deletePipelineError) {
          console.error('Erro ao deletar pipeline:', deletePipelineError);
          throw deletePipelineError;
        }
      }

      setPipelines(prev => prev.filter(p => p.id !== pipelineId));
      if (selectedPipeline?.id === pipelineId) {
        setSelectedPipeline(null);
      }
      toast({
        title: "Pipeline removida",
        description: "Pipeline removida com sucesso"
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Erro ao remover pipeline:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover pipeline",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Funil de Vendas</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button
                  onClick={handleSaveAllChanges}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                className="px-4 py-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8">
          {/* Filtro de Pipeline */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Pipeline</Label>
            <Select value={selectedPipelineId} onValueChange={handlePipelineChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name} {pipeline.is_default && '(Padrão)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gerenciamento de Pipelines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pipelines</h3>
              <Button
                onClick={handleCreatePipeline}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Pipeline
              </Button>
            </div>

            {/* Formulário de Criação/Edição de Pipeline */}
            {(isCreating || isEditing) && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isCreating ? 'Criar Nova Pipeline' : 'Editar Pipeline'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="pipeline-name">Nome da Pipeline</Label>
                    <Input
                      id="pipeline-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da pipeline"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pipeline-description">Descrição</Label>
                    <Textarea
                      id="pipeline-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição da pipeline"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is-default">Pipeline Padrão</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePipeline}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setFormData({ name: '', description: '', is_default: false });
                      }}
                      className="px-4 py-2"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Pipelines */}
            <div className="grid gap-4">
              {pipelines.map((pipeline) => (
                <Card key={pipeline.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{pipeline.name}</h4>
                        {pipeline.description && (
                          <p className="text-sm text-gray-600">{pipeline.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {pipeline.is_default && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Padrão
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {stages.length} etapas
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPipeline(pipeline)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!pipeline.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePipeline(pipeline.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Gerenciamento de Etapas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Etapas</h3>

            {/* Adicionar Nova Etapa */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Nova Etapa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stage-name">Nome da Etapa</Label>
                    <Input
                      id="stage-name"
                      value={newStage.name}
                      onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                      placeholder="Nome da etapa"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage-color">Cor</Label>
                    <Select value={newStage.color} onValueChange={(value) => setNewStage({ ...newStage, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color.value }}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddStage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Etapas Existentes */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Etapas Existentes</h4>
              {stages.map((stage) => (
                <Card key={stage.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    {editingStage?.id === stage.id ? (
                      // Modo de Edição
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            value={editStageData.name}
                            onChange={(e) => setEditStageData({ ...editStageData, name: e.target.value })}
                            className="w-full"
                          />
                          <Select
                            value={editStageData.color}
                            onValueChange={(value) => setEditStageData({ ...editStageData, color: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveStageEdit}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelStageEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo de Visualização
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <div>
                            <h5 className="font-medium text-gray-900">{stage.name}</h5>
                            <p className="text-sm text-gray-600">Posição: {stage.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {stage.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStage(stage)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStage(stage.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PipelineManagerModal;
