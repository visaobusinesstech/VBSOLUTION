'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Mail, 
  MessageSquare, 
  Phone, 
  Copy,
  Eye,
  X
} from 'lucide-react';
import { useTemplates, Template, CreateTemplateData } from '@/hooks/useTemplates';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'proposal' | 'contract' | 'presentation';
  subject?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface TemplatesManagerProps {
  templates?: Template[];
  onCreateTemplate?: (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateTemplate?: (id: string, template: Partial<Template>) => void;
  onDeleteTemplate?: (id: string) => void;
  onDuplicateTemplate?: (id: string) => void;
  className?: string;
}

const TemplatesManager: React.FC<TemplatesManagerProps> = ({
  templates = [],
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  className
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { templates: allTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useTemplates();

  // Usar dados dos hooks se disponíveis, senão usar props ou dados mock
  const displayTemplates = templates.length > 0 ? templates : allTemplates;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'proposal':
        return <FileText className="w-4 h-4" />;
      case 'contract':
        return <FileText className="w-4 h-4" />;
      case 'presentation':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      email: { label: 'Email', variant: 'default' as const },
      whatsapp: { label: 'WhatsApp', variant: 'secondary' as const },
      proposal: { label: 'Proposta', variant: 'outline' as const },
      contract: { label: 'Contrato', variant: 'outline' as const },
      presentation: { label: 'Apresentação', variant: 'outline' as const }
    };

    const config = typeMap[type as keyof typeof typeMap] || { label: type, variant: 'outline' as const };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const filteredTemplates = displayTemplates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || template.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleCreateTemplate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(id);
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    if (onDuplicateTemplate) {
      onDuplicateTemplate(template.id);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '')))] : [];
  };

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'email' as Template['type'],
    subject: '',
    content: '',
    tags: '',
    is_active: true,
    is_public: false
  });

  const handleCreateSubmit = () => {
    const variables = extractVariables(createForm.content);
    const tags = createForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const newTemplate: Omit<Template, 'id' | 'created_at' | 'updated_at'> = {
      name: createForm.name,
      type: createForm.type,
      subject: createForm.subject || undefined,
      content: createForm.content,
      variables,
      tags,
      is_active: createForm.is_active,
      is_public: createForm.is_public
    };

    if (onCreateTemplate) {
      onCreateTemplate(newTemplate);
    }

    setIsCreateModalOpen(false);
    setCreateForm({
      name: '',
      type: 'email',
      subject: '',
      content: '',
      tags: '',
      is_active: true,
      is_public: false
    });
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates de Comunicação ({filteredTemplates.length})
            </CardTitle>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">Todos os tipos</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="proposal">Proposta</option>
              <option value="contract">Contrato</option>
              <option value="presentation">Apresentação</option>
            </select>
          </div>

          {/* Lista de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <div>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        {template.subject && (
                          <p className="text-xs text-gray-600 truncate">{template.subject}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(template.type)}
                      {template.is_public && (
                        <Badge variant="outline" className="text-xs">Público</Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="destructive" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 line-clamp-3">
                      {template.content.substring(0, 100)}...
                    </div>
                    
                    {template.variables.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Variáveis:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {template.tags.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-sm">Crie seu primeiro template para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de criação */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Criar Novo Template</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nome do template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select 
                    value={createForm.type} 
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Template['type'] })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="proposal">Proposta</option>
                    <option value="contract">Contrato</option>
                    <option value="presentation">Apresentação</option>
                  </select>
                </div>
              </div>

              {createForm.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                  <Input
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    placeholder="Assunto do email"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                <Textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  placeholder="Digite o conteúdo do template. Use {{variavel}} para variáveis dinâmicas."
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {`{{nome_variavel}}`} para criar variáveis dinâmicas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <Input
                  value={createForm.tags}
                  onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe as tags com vírgulas
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.is_active}
                    onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  />
                  <span className="text-sm">Ativo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.is_public}
                    onChange={(e) => setCreateForm({ ...createForm, is_public: e.target.checked })}
                  />
                  <span className="text-sm">Público</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSubmit}>
                  Criar Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesManager;
