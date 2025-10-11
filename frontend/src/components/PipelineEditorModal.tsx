import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Settings, 
  GripVertical,
  X
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useFunnelStages, FunnelStage, CreateFunnelStageData } from '@/hooks/useFunnelStages';
import { usePipeline, Pipeline } from '@/hooks/usePipeline';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PipelineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PipelineEditorModal: React.FC<PipelineEditorModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { topBarColor } = useTheme();
  const { stages, createStage, updateStage, deleteStage } = useFunnelStages();
  const { pipelines, createPipeline, fetchPipelineStages } = usePipeline();
  
  const [activeTab, setActiveTab] = useState<'stages' | 'pipelines'>('stages');
  const [stagesData, setStagesData] = useState<FunnelStage[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [newPipeline, setNewPipeline] = useState<{ name: string; description: string }>({ 
    name: '', 
    description: '' 
  });
  const [newStage, setNewStage] = useState<CreateFunnelStageData>({
    name: '',
    order_index: 0,
    color: '#3b82f6'
  });
  const [loading, setLoading] = useState(false);

  // Cores predefinidas para as etapas
  const predefinedColors = [
    '#3b82f6', // Azul
    '#8b5cf6', // Roxo
    '#f59e0b', // Laranja
    '#ef4444', // Vermelho
    '#10b981', // Verde
    '#06b6d4', // Ciano
    '#84cc16', // Verde lima
    '#f97316', // Laranja escuro
    '#ec4899', // Rosa
    '#6366f1'  // Índigo
  ];

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen) {
      setStagesData([...stages]);
      // Selecionar primeira pipeline se disponível
      if (pipelines.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(pipelines[0].id);
      }
    }
  }, [isOpen, stages, pipelines, selectedPipelineId]);

  // Filtrar etapas pela pipeline selecionada
  const filteredStages = stagesData.filter(stage => 
    !selectedPipelineId || stage.pipeline_id === selectedPipelineId
  );

  // Adicionar nova etapa
  const handleAddStage = async () => {
    if (!newStage.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da etapa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPipelineId) {
      toast({
        title: "Erro",
        description: "Selecione uma pipeline primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const stageData = {
        name: newStage.name.trim(),
        order_index: stagesData.length + 1,
        color: newStage.color,
        pipeline_id: selectedPipelineId
      };

      // Criar no Supabase imediatamente
      const createdStage = await createStage(stageData);
      
      if (createdStage) {
        // Adicionar à lista local com o ID real do Supabase
        setStagesData(prev => [...prev, {
          id: createdStage.id,
          name: createdStage.name,
          order_index: createdStage.order_index,
          color: createdStage.color,
          pipeline_id: createdStage.pipeline_id,
          created_at: createdStage.created_at
        }]);

        toast({
          title: "Etapa criada",
          description: "Etapa criada com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar etapa. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Limpar formulário
      setNewStage({
        name: '',
        order_index: 0,
        color: '#3b82f6'
      });
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar etapa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remover etapa
  const handleRemoveStage = async (stageId: string) => {
    // Se não é uma etapa temporária, deletar do Supabase
    if (!stageId.startsWith('temp-')) {
      const confirmed = window.confirm('Tem certeza que deseja excluir esta etapa? Esta ação não pode ser desfeita.');
      if (!confirmed) return;

      try {
        setLoading(true);
        const success = await deleteStage(stageId);
        if (success) {
          toast({
            title: "Etapa excluída",
            description: "Etapa excluída com sucesso!",
          });
        } else {
          toast({
            title: "Erro",
            description: "Erro ao excluir etapa. Tente novamente.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir etapa. Tente novamente.",
          variant: "destructive",
        });
        return;
      } finally {
        setLoading(false);
      }
    }

    // Remover da lista local
    setStagesData(prev => prev.filter(stage => stage.id !== stageId));
  };

  // Atualizar etapa
  const handleUpdateStage = async (stageId: string, updates: Partial<FunnelStage>) => {
    // Se não é uma etapa temporária, atualizar no Supabase
    if (!stageId.startsWith('temp-')) {
      try {
        setLoading(true);
        const success = await updateStage(stageId, updates);
        if (!success) {
          toast({
            title: "Erro",
            description: "Erro ao atualizar etapa. Tente novamente.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar etapa. Tente novamente.",
          variant: "destructive",
        });
        return;
      } finally {
        setLoading(false);
      }
    }

    // Atualizar na lista local
    setStagesData(prev => prev.map(stage => 
      stage.id === stageId ? { ...stage, ...updates } : stage
    ));
  };

  // Reordenar etapas
  const handleReorderStages = async (dragIndex: number, hoverIndex: number) => {
    const draggedStage = stagesData[dragIndex];
    const newStages = [...stagesData];
    newStages.splice(dragIndex, 1);
    newStages.splice(hoverIndex, 0, draggedStage);
    
    // Atualizar posições
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      order_index: index + 1
    }));
    
    // Atualizar no Supabase para etapas existentes
    try {
      setLoading(true);
      for (const stage of updatedStages) {
        if (!stage.id.startsWith('temp-')) {
          await updateStage(stage.id, { order_index: stage.order_index });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reordenar etapas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    
    setStagesData(updatedStages);
  };

  // Função para drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    if (!destination) {
      return;
    }
    
    if (destination.index === source.index) {
      return;
    }
    
    handleReorderStages(source.index, destination.index);
  };

  // Criar nova pipeline
  const handleCreatePipeline = async () => {
    if (!newPipeline.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da pipeline é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const createdPipeline = await createPipeline({
        name: newPipeline.name.trim(),
        stages: []
      });

      if (createdPipeline) {
        setSelectedPipelineId(createdPipeline.id);
        setNewPipeline({ name: '', description: '' });
        toast({
          title: "Pipeline criada",
          description: "Pipeline criada com sucesso!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar pipeline. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar alterações (agora apenas fecha o modal, pois as operações são feitas imediatamente)
  const handleSave = () => {
    toast({
      title: "Pipeline atualizada",
      description: "Todas as alterações foram salvas automaticamente!",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${
        stagesData.length >= 6 
          ? 'max-w-6xl w-[95vw]' 
          : 'max-w-4xl w-[90vw]'
      }`}>
        <DialogHeader className="relative">
          <div className="flex items-center justify-between">
          <DialogTitle>Editar Pipeline</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Filtro de Pipeline */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <Label htmlFor="pipeline-select" className="text-sm font-medium">
                Pipeline:
              </Label>
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Input
                placeholder="Nome da nova pipeline"
                value={newPipeline.name}
                onChange={(e) => setNewPipeline(prev => ({ ...prev, name: e.target.value }))}
                className="w-48"
              />
              <Button
                onClick={handleCreatePipeline}
                disabled={!newPipeline.name.trim() || loading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Criar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stages">Etapas</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="space-y-4">
            {/* Lista de etapas existentes */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900">Etapas do Funil</h3>
              </div>
              <div className="p-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="stages-list" direction="vertical">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3"
                      >
                  {filteredStages.map((stage, index) => (
                          <Draggable key={stage.id} draggableId={stage.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                {/* Handle de arrastar */}
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-move flex flex-col gap-0.5"
                                >
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    
                                {/* Indicador de cor */}
                    <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: stage.color }}
                    />
                    
                                {/* Campo de nome */}
                                <div className="flex-1">
                      <Input
                        value={stage.name}
                        onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                                    className="font-medium h-8 text-sm border-0 bg-transparent focus:ring-0 focus:border-0 p-0"
                          placeholder="Nome da etapa"
                      />
                    </div>
                    
                                {/* Paleta de cores */}
                                <div className="flex gap-1">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                                      className={`w-5 h-5 rounded-full border-2 ${
                            stage.color === color ? 'border-gray-800' : 'border-gray-300'
                                      } hover:border-gray-600 transition-colors`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleUpdateStage(stage.id, { color })}
                        />
                      ))}
                    </div>
                    
                                {/* Botão de deletar */}
                    <Button
                      variant="ghost"
                                  size="sm"
                      onClick={() => handleRemoveStage(stage.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                                  <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
                </div>

            {/* Adicionar nova etapa */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900">Adicionar Nova Etapa</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {/* Handle de arrastar (desabilitado para nova etapa) */}
                  <div className="cursor-not-allowed flex flex-col gap-0.5 opacity-30">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                  
                  {/* Indicador de cor */}
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: newStage.color }}
                  />
                  
                  {/* Campo de nome */}
                  <div className="flex-1">
                    <Input
                      value={newStage.name}
                      onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
                      className="font-medium h-8 text-sm border-0 bg-transparent focus:ring-0 focus:border-0 p-0"
                      placeholder="Nome da etapa"
                    />
                </div>

                  {/* Paleta de cores */}
                  <div className="flex gap-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        className={`w-5 h-5 rounded-full border-2 ${
                          newStage.color === color ? 'border-gray-800' : 'border-gray-300'
                        } hover:border-gray-600 transition-colors`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewStage(prev => ({ ...prev, color }))}
                      />
                    ))}
                </div>

                  {/* Botão de adicionar */}
                <Button
                  onClick={handleAddStage}
                  disabled={!newStage.name.trim() || loading}
                    className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pipelines" className="space-y-4">
            {/* Lista de pipelines existentes */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900">Pipelines Existentes</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {pipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{pipeline.name}</h4>
                          <p className="text-sm text-gray-500">
                            {pipeline.is_default ? 'Pipeline padrão' : 'Pipeline personalizada'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pipeline.is_default ? "default" : "secondary"}>
                          {pipeline.is_default ? 'Padrão' : 'Personalizada'}
                        </Badge>
                        {!pipeline.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {pipelines.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Nenhuma pipeline criada ainda.</p>
                      <p className="text-sm">Crie sua primeira pipeline personalizada abaixo.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Criar nova pipeline */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900">Criar Nova Pipeline</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pipeline-name" className="text-sm font-medium text-gray-700">
                      Nome da Pipeline
                    </Label>
                    <Input
                      id="pipeline-name"
                      value={newPipeline.name}
                      onChange={(e) => setNewPipeline(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Pipeline de Vendas Q1 2024"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      value={newPipeline.description}
                      onChange={(e) => setNewPipeline(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o propósito desta pipeline..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleCreatePipeline}
                      disabled={!newPipeline.name.trim() || loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? 'Criando...' : 'Criar Pipeline'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setNewPipeline({ name: '', description: '' })}
                      disabled={loading}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="text-white shadow-lg hover:shadow-xl transition-all duration-200"
            style={{ backgroundColor: '#021529' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#031a35';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#021529';
            }}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PipelineEditorModal;