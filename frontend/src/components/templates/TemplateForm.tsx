import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import { RichTextEditor, RichTextEditorRef } from '@/components/templates/RichTextEditor';
import { TemplateFileUpload } from '@/components/templates/TemplateFileUpload';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import { FontSizeSelector } from '@/components/templates/FontSizeSelector';
import { VariableInserter } from '@/components/templates/VariableInserter';
import { Template, TemplateFormData } from '@/types/template';
import { TemplateFormProps } from '@/types/template';
import { toast } from 'sonner';

// Helper function to safely parse attachments
const parseAttachments = (attachments: any): any[] => {
  if (!attachments) return [];
  
  if (Array.isArray(attachments)) {
    return attachments;
  }
  
  if (typeof attachments === 'string') {
    try {
      const parsed = JSON.parse(attachments);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing attachments:', e);
      return [];
    }
  }
  
  return [];
};

export function TemplateForm({ template, isEditing, onSave, onCancel, onSendTest }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    nome: '',
    conteudo: '',
    canal: 'email',
    assinatura: '',
    signature_image: null,
    status: 'ativo',
    attachments: [],
    descricao: '',
    template_file_url: null,
    template_file_name: null,
    image_url: null,
    font_size_px: '16px'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    console.log('TemplateForm: Loading template data', { template, isEditing });
    if (template && isEditing) {
      // Parse attachments safely to ensure it's always an array
      const parsedAttachments = parseAttachments(template.attachments);
      
      const templateData = {
        nome: template.nome || '',
        conteudo: template.conteudo || '',
        canal: template.canal || 'email',
        assinatura: template.assinatura || '',
        signature_image: template.signature_image || null,
        status: template.status || 'ativo',
        attachments: parsedAttachments,
        descricao: template.descricao || '',
        template_file_url: template.template_file_url || null,
        template_file_name: template.template_file_name || null,
        image_url: template.image_url || null,
        font_size_px: template.font_size_px || '16px'
      };
      console.log('TemplateForm: Setting form data', {
        ...templateData,
        attachments: `Array with ${parsedAttachments.length} items`,
        font_size_px: templateData.font_size_px
      });
      setFormData(templateData);
    }
  }, [template, isEditing]);

  // ✅ CORREÇÃO: Sincronizar o editor com o conteúdo quando o valor muda
  useEffect(() => {
    if (editorRef.current && formData.conteudo !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = formData.conteudo;
    }
  }, [formData.conteudo]);

  // Handle image URL changes from the rich text editor
  const handleImageUrlChange = (imageUrl: string | null) => {
    console.log('TemplateForm: Image URL changed to:', imageUrl);
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  // Handle font size changes with logging
  const handleFontSizeChange = (newFontSize: string) => {
    console.log('🎨 TemplateForm: Font-size alterado para:', newFontSize);
    setFormData(prev => ({
      ...prev,
      font_size_px: newFontSize
    }));
  };

  // Handle content changes with font-size preservation
  const handleContentChange = (newContent: string) => {
    console.log('📝 TemplateForm: Conteúdo alterado, preservando font-size:', formData.font_size_px);
    setFormData(prev => ({
      ...prev,
      conteudo: newContent
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ VALIDAÇÃO MELHORADA: Verificar campos obrigatórios
    if (!formData.nome || formData.nome.trim() === '') {
      toast.error('Nome do template é obrigatório');
      return;
    }

    if (!formData.conteudo || formData.conteudo.trim() === '') {
      toast.error('Conteúdo do template é obrigatório');
      return;
    }

    if (!formData.canal || formData.canal.trim() === '') {
      toast.error('Canal do template é obrigatório');
      return;
    }

    // ✅ CORREÇÃO: Garantir que todos os campos tenham valores válidos
    const cleanedFormData = {
      ...formData,
      nome: formData.nome.trim(),
      conteudo: formData.conteudo.trim(),
      canal: formData.canal.trim(),
      assinatura: formData.assinatura?.trim() || '',
      status: formData.status || 'ativo',
      attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
      descricao: formData.descricao?.trim() || '',
      font_size_px: formData.font_size_px || '16px'
    };

    console.log('TemplateForm: Submitting cleaned form data:', {
      ...cleanedFormData,
      content_preview: cleanedFormData.conteudo.substring(0, 100) + '...'
    });

    setIsSubmitting(true);
    try {
      const success = await onSave(cleanedFormData);
      if (success) {
        console.log('✅ Template salvo com sucesso!');
        setIsSubmitting(false);
      } else {
        console.error('❌ Falha ao salvar template');
        toast.error('Erro ao salvar template. Tente novamente.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template. Verifique sua conexão.');
      setIsSubmitting(false);
    }
  };

  // NOVA IMPLEMENTAÇÃO: Inserir variáveis diretamente no editor
  const handleInsertVariable = (variable: string) => {
    console.log('📝 Inserindo variável no editor:', variable);
    
    // Se temos uma referência ao editor, inserir na posição do cursor
    if (editorRef.current) {
      editorRef.current.insertVariable(variable);
    } else {
      // Fallback: adicionar ao final do conteúdo
      setFormData(prev => ({ 
        ...prev, 
        conteudo: prev.conteudo + ' ' + variable 
      }));
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Preview do Template</h2>
          <Button onClick={() => setShowPreview(false)} variant="outline">
            Voltar ao Editor
          </Button>
        </div>
        <TemplatePreview
          template={{
            ...formData,
            id: template?.id || '',
            created_at: template?.created_at || '',
            user_id: template?.user_id || ''
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário Principal */}
      <div className="lg:col-span-2">
        <Card className="w-full">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isEditing ? 'Editar Template' : 'Criar Novo Template'}</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Edite as informações do seu template' : 'Preencha as informações para criar um novo template'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Template *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Email de Boas-vindas"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Breve descrição do template (opcional)"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              <FontSizeSelector
                value={formData.font_size_px || '16px'}
                onChange={handleFontSizeChange}
              />

              <VariableInserter onInsertVariable={handleInsertVariable} />

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo do Template *</Label>
                <div className="space-y-2">
                  <RichTextEditor
                    ref={editorRef}
                    value={formData.conteudo}
                    onChange={handleContentChange}
                    onImageUrlChange={handleImageUrlChange}
                    placeholder="Digite o conteúdo do seu template aqui..."
                    fontSize={formData.font_size_px}
                  />
                  <div className="text-xs text-muted-foreground">
                    Use as variáveis acima para personalizar o conteúdo. As variáveis serão substituídas automaticamente durante o envio.
                  </div>
                  <div className="text-xs text-blue-600">
                    🎨 Font-size ativo: {formData.font_size_px}
                  </div>
                  {formData.image_url && (
                    <div className="text-xs text-green-600">
                      ✓ Imagem detectada: {formData.image_url}
                    </div>
                  )}
                </div>
              </div>

              <TemplateFileUpload
                attachments={formData.attachments || []}
                onChange={(newAttachments) => setFormData({
                  ...formData,
                  attachments: newAttachments
                })}
                onFileUploaded={(fileUrl, fileName) => {
                  console.log('TemplateForm: File uploaded', { fileUrl, fileName });
                  setFormData({
                    ...formData,
                    template_file_url: fileUrl,
                    template_file_name: fileName
                  });
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="assinatura">Assinatura</Label>
                <Textarea
                  id="assinatura"
                  placeholder="Sua assinatura (opcional)"
                  value={formData.assinatura || ''}
                  onChange={(e) => setFormData({ ...formData, assinatura: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-white border-2 border-blue-900 text-black hover:bg-gray-50">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Template' : 'Criar Template'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Preview Lateral */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview ao Vivo</CardTitle>
              <CardDescription>
                Visualização em tempo real do seu template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplatePreview
                template={{
                  ...formData,
                  id: template?.id || '',
                  created_at: template?.created_at || '',
                  user_id: template?.user_id || ''
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
