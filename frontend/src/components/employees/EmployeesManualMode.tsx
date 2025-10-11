
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Crown,
  User,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  children?: OrgNode[];
}

interface ManualModeProps {
  nodes: OrgNode[];
  onNodesChange: (nodes: OrgNode[]) => void;
}

const EmployeesManualMode = ({ nodes, onNodesChange }: ManualModeProps) => {
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'person' as 'sector' | 'position' | 'person',
    parent_id: '',
    description: ''
  });

  useEffect(() => {
    // Build tree structure from flat nodes array
    const buildTree = (nodes: OrgNode[]): OrgNode[] => {
      const nodeMap = new Map<string, OrgNode>();
      const roots: OrgNode[] = [];

      // Create a map of all nodes
      nodes.forEach(node => {
        nodeMap.set(node.id, { ...node, children: [] });
      });

      // Build the tree structure
      nodes.forEach(node => {
        const treeNode = nodeMap.get(node.id)!;
        if (node.parent_id) {
          const parent = nodeMap.get(node.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(treeNode);
          } else {
            roots.push(treeNode);
          }
        } else {
          roots.push(treeNode);
        }
      });

      return roots;
    };

    setTreeData(buildTree(nodes));
  }, [nodes]);

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
      case 'sector': return 'bg-blue-100 text-blue-800';
      case 'position': return 'bg-green-100 text-green-800';
      case 'person': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddNode = (parentNode?: OrgNode) => {
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
    if (!window.confirm('Tem certeza que deseja excluir este item e todos os seus filhos?')) return;

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

  const renderTreeNode = (node: OrgNode, level: number = 0) => {
    const Icon = getNodeIcon(node.type);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="mb-2">
        <Card className="vb-card hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 20}px` }}>
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleExpanded(node.id)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}
                
                <Icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{node.name}</h3>
                    <Badge className={getNodeColor(node.type)}>
                      {node.type === 'sector' ? 'Setor' : 
                       node.type === 'position' ? 'Cargo' : 'Pessoa'}
                    </Badge>
                  </div>
                  {node.description && (
                    <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddNode(node)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditNode(node)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteNode(node.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estrutura Organizacional</h2>
          <p className="text-muted-foreground">
            Visualização hierárquica da estrutura organizacional
          </p>
        </div>
        <Button onClick={() => handleAddNode()} className="vb-button-primary">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Item Raiz
        </Button>
      </div>

      {treeData.length === 0 ? (
        <Card className="vb-card">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma estrutura encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando os setores, cargos e pessoas da sua organização
            </p>
            <Button onClick={() => handleAddNode()} className="vb-button-primary">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {treeData.map(node => renderTreeNode(node))}
        </div>
      )}

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

export default EmployeesManualMode;
