
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Move,
  Building2,
  User,
  Crown
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrgNode {
  id: string;
  name: string;
  type: 'sector' | 'position' | 'person';
  parent_id?: string;
  responsible_id?: string;
  description?: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

interface CanvasProps {
  nodes: OrgNode[];
  onNodesChange: (nodes: OrgNode[]) => void;
}

const EmployeesCanvas = ({ nodes, onNodesChange }: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'person' as 'sector' | 'position' | 'person',
    parent_id: '',
    description: ''
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'sector': return Building2;
      case 'position': return Crown;
      case 'person': return User;
      default: return User;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'sector': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'position': return 'bg-green-100 border-green-300 text-green-800';
      case 'person': return 'bg-purple-100 border-purple-300 text-purple-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleNodeClick = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  }, [selectedNode]);

  const handleMouseDown = useCallback((nodeId: string, event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only left click
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsDragging(true);
    setSelectedNode(nodeId);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, [nodes]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !selectedNode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = event.clientX - canvasRect.left - dragOffset.x;
    const newY = event.clientY - canvasRect.top - dragOffset.y;

    const updatedNodes = nodes.map(node => 
      node.id === selectedNode 
        ? { ...node, position_x: Math.max(0, newX), position_y: Math.max(0, newY) }
        : node
    );

    onNodesChange(updatedNodes);
  }, [isDragging, selectedNode, nodes, onNodesChange, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleAddNode = async (parentNode?: OrgNode) => {
    setEditingNode(null);
    setFormData({
      name: '',
      type: 'person',
      parent_id: parentNode?.id || '',
      description: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditNode = (node: OrgNode) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      type: node.type,
      parent_id: node.parent_id || '',
      description: node.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNode) {
        // Update existing node
        const { error } = await supabase
          .from('organizational_structure')
          .update({
            name: formData.name,
            type: formData.type,
            parent_id: formData.parent_id || null,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNode.id);

        if (error) throw error;

        const updatedNodes = nodes.map(node => 
          node.id === editingNode.id 
            ? { ...node, ...formData, parent_id: formData.parent_id || undefined } as OrgNode
            : node
        );
        onNodesChange(updatedNodes);
        
        toast({
          title: "Sucesso",
          description: "Item atualizado com sucesso!",
        });
      } else {
        // Create new node
        const { data, error } = await supabase
          .from('organizational_structure')
          .insert([{
            name: formData.name,
            type: formData.type,
            parent_id: formData.parent_id || null,
            description: formData.description,
            position_x: 100,
            position_y: 100
          }])
          .select()
          .single();

        if (error) throw error;

        // Cast the data to OrgNode type
        const newNode = data as OrgNode;
        onNodesChange([...nodes, newNode]);
        
        toast({
          title: "Sucesso",
          description: "Item criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setFormData({ name: '', type: 'person', parent_id: '', description: '' });
    } catch (error) {
      console.error('Error saving node:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from('organizational_structure')
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      onNodesChange(nodes.filter(node => node.id !== nodeId));
      
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting node:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir item",
        variant: "destructive",
      });
    }
  };

  const renderConnections = () => {
    return nodes
      .filter(node => node.parent_id)
      .map(node => {
        const parent = nodes.find(n => n.id === node.parent_id);
        if (!parent) return null;

        return (
          <line
            key={`connection-${node.id}`}
            x1={parent.position_x + 75}
            y1={parent.position_y + 40}
            x2={node.position_x + 75}
            y2={node.position_y + 40}
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        );
      });
  };

  return (
    <div className="h-full bg-gray-50 relative">
      <div className="absolute top-4 left-4 z-10">
        <Button onClick={() => handleAddNode()} className="vb-button-primary">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>

      <div 
        ref={canvasRef}
        className="w-full h-full overflow-hidden cursor-move"
        style={{ minHeight: '600px' }}
      >
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {renderConnections()}
        </svg>

        {nodes.map(node => {
          const Icon = getNodeIcon(node.type);
          const isSelected = selectedNode === node.id;
          
          return (
            <Card
              key={node.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                getNodeColor(node.type)
              } ${
                isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
              style={{
                left: node.position_x,
                top: node.position_y,
                width: '150px',
                zIndex: isSelected ? 10 : 2
              }}
              onClick={(e) => handleNodeClick(node.id, e)}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4" />
                  <Badge variant="outline" className="text-xs">
                    {node.type === 'sector' ? 'Setor' : 
                     node.type === 'position' ? 'Cargo' : 'Pessoa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <CardTitle className="text-sm font-medium truncate">
                  {node.name}
                </CardTitle>
                {node.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {node.description}
                  </p>
                )}
                {isSelected && (
                  <div className="flex gap-1 mt-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNode(node);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNode(node);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
            <DialogDescription>
              {editingNode ? 'Edite as informações do item' : 'Adicione um novo item à estrutura organizacional'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do item"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'sector' | 'position' | 'person') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sector">Setor</SelectItem>
                  <SelectItem value="position">Cargo</SelectItem>
                  <SelectItem value="person">Pessoa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Item Pai</Label>
              <Select 
                value={formData.parent_id} 
                onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o item pai (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum (item raiz)</SelectItem>
                  {nodes
                    .filter(node => node.id !== editingNode?.id)
                    .map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({node.type === 'sector' ? 'Setor' : 
                                    node.type === 'position' ? 'Cargo' : 'Pessoa'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="vb-button-primary">
                {editingNode ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesCanvas;
