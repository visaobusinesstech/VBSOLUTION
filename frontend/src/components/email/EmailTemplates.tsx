import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Edit, Trash2, Eye, Copy, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useEmailSender } from '@/hooks/useEmailSender';
import { TemplateForm } from '@/components/templates/TemplateForm';
import { Template, TemplateFormData } from '@/types/template';

export function EmailTemplates() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { sendTestEmail } = useEmailSender();
  
  // ✅ DEBUG: Verificar autenticação
  console.log('🔍 EmailTemplates - User auth status:', { 
    user: user, 
    userId: user?.id,
    userEmail: user?.email,
    isAuthenticated: !!user?.id 
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [user?.id]);

  const loadTemplates = async () => {
    if (!user?.id) {
      console.log('❌ loadTemplates: User ID não encontrado');
      return;
    }

    console.log('🔍 loadTemplates: Carregando templates para user:', user.id);
    setLoading(true);
    try {
      // ✅ TESTE: Verificar se a tabela existe
      console.log('🔍 Testando conexão com Supabase...');
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('canal', 'email')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Templates carregados:', data?.length || 0);
      setTemplates(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates. Verifique se a tabela existe.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: TemplateFormData): Promise<boolean> => {
    console.log('🔍 Verificando autenticação:', { 
      user: user, 
      userId: user?.id,
      isAuthenticated: !!user?.id 
    });

    if (!user?.id) {
      console.error('❌ User ID não encontrado');
      console.error('❌ User object:', user);
      toast.error('Usuário não autenticado. Faça login novamente.');
      return false;
    }

    // ✅ VALIDAÇÃO: Verificar campos obrigatórios
    if (!formData.nome || formData.nome.trim() === '') {
      console.error('❌ Nome do template é obrigatório');
      toast.error('Nome do template é obrigatório');
      return false;
    }

    if (!formData.conteudo || formData.conteudo.trim() === '') {
      console.error('❌ Conteúdo do template é obrigatório');
      toast.error('Conteúdo do template é obrigatório');
      return false;
    }

    if (!formData.canal || formData.canal.trim() === '') {
      console.error('❌ Canal do template é obrigatório');
      toast.error('Canal do template é obrigatório');
      return false;
    }

    console.log('💾 Salvando template:', { 
      userId: user.id, 
      nome: formData.nome, 
      conteudo: formData.conteudo.substring(0, 50) + '...',
      canal: formData.canal 
    });

    try {
      // ✅ CORREÇÃO: Limpar e validar dados antes do envio
      const templateData = {
        user_id: user.id,
        owner_id: user.id,
        nome: formData.nome.trim(),
        conteudo: formData.conteudo.trim(),
        canal: formData.canal.trim(),
        assinatura: formData.assinatura?.trim() || null,
        signature_image: formData.signature_image || null,
        status: formData.status || 'ativo',
        attachments: Array.isArray(formData.attachments) ? formData.attachments : [],
        descricao: formData.descricao?.trim() || null,
        template_file_url: formData.template_file_url || null,
        template_file_name: formData.template_file_name || null,
        image_url: formData.image_url || null,
        font_size_px: formData.font_size_px || '16px',
        updated_at: new Date().toISOString()
      };

      console.log('📤 Enviando dados para Supabase:', templateData);

      if (editingTemplate) {
        console.log('🔄 Atualizando template existente:', editingTemplate.id);
        const { data, error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .select();
        
        if (error) {
          console.error('❌ Erro do Supabase (UPDATE):', error);
          throw error;
        }
        console.log('✅ Template atualizado:', data);
        toast.success('Template atualizado com sucesso!');
      } else {
        console.log('➕ Criando novo template');
        const { data, error } = await supabase
          .from('templates')
          .insert(templateData)
          .select();
        
        if (error) {
          console.error('❌ Erro do Supabase (INSERT):', error);
          throw error;
        }
        console.log('✅ Template criado:', data);
        toast.success('Template criado com sucesso!');
      }

      setShowForm(false);
      setEditingTemplate(null);
      loadTemplates();
      return true;
    } catch (error: any) {
      console.error('❌ Erro completo ao salvar template:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      let errorMessage = 'Erro ao salvar template';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template excluído com sucesso!');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const { id, created_at, ...templateData } = template;
      
      const { error } = await supabase
        .from('templates')
        .insert({
          ...templateData,
          nome: `${template.nome} (Cópia)`,
          user_id: user?.id
        });

      if (error) throw error;
      toast.success('Template duplicado com sucesso!');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast.error('Erro ao duplicar template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleSendTest = async (template: Template) => {
    try {
      const testEmail = prompt('Digite o email para teste:');
      if (!testEmail) return;

      await sendTestEmail(template.id, testEmail);
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste');
    }
  };

  if (previewTemplate) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Preview do Template</h2>
          <Button onClick={() => setPreviewTemplate(null)} variant="outline">
            Voltar à Lista
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{previewTemplate.nome}</CardTitle>
            {previewTemplate.descricao && (
              <CardDescription>{previewTemplate.descricao}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: previewTemplate.conteudo }}
            />
            {previewTemplate.assinatura && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {previewTemplate.assinatura}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <TemplateForm
        template={editingTemplate || undefined}
        isEditing={!!editingTemplate}
        onSave={handleSave}
        onCancel={handleCancel}
        onSendTest={handleSendTest}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Templates de Email</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus templates de email reutilizáveis
          </p>
        </div>
      </div>

      {/* Grid de Templates */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template de email usando o botão + no canto inferior direito
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg truncate">{template.nome}</span>
                  {template.status === 'ativo' ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Ativo
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Inativo
                    </span>
                  )}
                </CardTitle>
                {template.descricao && (
                  <CardDescription className="line-clamp-2">
                    {template.descricao}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div 
                  className="text-sm text-muted-foreground mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{ 
                    __html: template.conteudo.substring(0, 150) + '...' 
                  }}
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTest(template)}
                    title="Enviar teste"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botão flutuante para novo template */}
      <Button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}