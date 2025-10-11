import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Edit, Trash2, Copy, Eye, Download, Upload, BarChart3 } from "lucide-react";

// Types
interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  createdAt: Date;
  usageCount: number;
  isActive: boolean;
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  onTemplateUse?: (template: Template) => void;
}

const CATEGORIES = [
  "Boas-vindas",
  "Follow-up", 
  "Lembrete",
  "Promoção",
  "Suporte",
  "Urgente",
  "Confirmação",
  "Cancelamento"
];

export default function TemplateManager({ onTemplateSelect, onTemplateUse }: TemplateManagerProps) {
  // State
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "1",
      name: "Boas-vindas",
      category: "Boas-vindas",
      content: "Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?",
      createdAt: new Date("2024-01-15"),
      usageCount: 45,
      isActive: true
    },
    {
      id: "2", 
      name: "Follow-up",
      category: "Follow-up",
      content: "Como está sendo sua experiência conosco? Há algo mais em que possamos ajudar?",
      createdAt: new Date("2024-01-16"),
      usageCount: 23,
      isActive: true
    },
    {
      id: "3",
      name: "Lembrete de Agendamento",
      category: "Lembrete", 
      content: "Lembrando sobre seu agendamento amanhã às 14h. Confirma sua presença?",
      createdAt: new Date("2024-01-17"),
      usageCount: 12,
      isActive: true
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    content: ""
  });

  // Handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.category || !formData.content.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category,
      content: formData.content.trim(),
      createdAt: new Date(),
      usageCount: 0,
      isActive: true
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setFormData({ name: "", category: "", content: "" });
    
    toast({
      title: "Sucesso",
      description: "Template salvo com sucesso!"
    });
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content
    });
    setIsEditing(true);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate || !formData.name.trim() || !formData.category || !formData.content.trim()) {
      return;
    }

    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, name: formData.name.trim(), category: formData.category, content: formData.content.trim() }
        : t
    ));

    setSelectedTemplate(null);
    setFormData({ name: "", category: "", content: "" });
    setIsEditing(false);
    
    toast({
      title: "Sucesso", 
      description: "Template atualizado com sucesso!"
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast({
      title: "Sucesso",
      description: "Template removido com sucesso!"
    });
  };

  const handleUseTemplate = (template: Template) => {
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ));
    
    onTemplateUse?.(template);
    toast({
      title: "Template usado",
      description: `Template "${template.name}" copiado para o chat`
    });
  };

  const handleCopyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copiado",
      description: "Conteúdo do template copiado para a área de transferência"
    });
  };

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleExportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'whatsapp-templates.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportado",
      description: "Templates exportados com sucesso!"
    });
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplates = JSON.parse(e.target?.result as string);
        setTemplates(prev => [...prev, ...importedTemplates]);
        toast({
          title: "Importado",
          description: "Templates importados com sucesso!"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Arquivo inválido",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setFormData({ name: "", category: "", content: "" });
    setSelectedTemplate(null);
    setIsEditing(false);
    setShowPreview(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Templates</h2>
            <p className="text-gray-600 mt-1">Crie e gerencie templates de mensagens para WhatsApp</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {templates.length} templates
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {templates.reduce((acc, t) => acc + t.usageCount, 0)} usos
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Creator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? "Editar Template" : "Criar Template"}
              {isEditing && (
                <Button size="sm" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {isEditing ? "Modifique os dados do template" : "Preencha os dados para criar um novo template"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Template *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Boas-vindas"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo da Mensagem *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Digite o conteúdo do template aqui..."
                rows={6}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={isEditing ? handleUpdateTemplate : handleSaveTemplate}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isEditing ? "Atualizar" : "Salvar"} Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => formData.content && handlePreviewTemplate({
                  id: "preview",
                  name: formData.name || "Preview",
                  category: formData.category || "Preview",
                  content: formData.content,
                  createdAt: new Date(),
                  usageCount: 0,
                  isActive: true
                })}
                disabled={!formData.content}
              >
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>Templates Salvos</CardTitle>
            <CardDescription>
              Gerencie seus templates existentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>Nenhum template criado ainda</p>
                  <p className="text-sm">Crie seu primeiro template usando o formulário ao lado</p>
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          {!template.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {template.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Usado {template.usageCount}x</span>
                          <span>{template.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Ferramentas para gerenciar seus templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => {/* Implementar relatórios */}}
            >
              <BarChart3 className="h-6 w-6" />
              <span>Relatórios de Uso</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={handleExportTemplates}
            >
              <Download className="h-6 w-6" />
              <span>Exportar Templates</span>
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2 w-full"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <Upload className="h-6 w-6" />
                <span>Importar Templates</span>
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImportTemplates}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pré-visualização</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Nome:</span>
                <p className="text-gray-900">{selectedTemplate.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Categoria:</span>
                <p className="text-gray-900">{selectedTemplate.category}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Conteúdo:</span>
                <div className="bg-gray-100 p-3 rounded-lg mt-1">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTemplate.content}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Usar Template
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
