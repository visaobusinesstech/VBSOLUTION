import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Template {
  id: string;
  nome: string;
  conteudo: string;
  canal: string;
  assinatura?: string;
  signature_image?: string | null;
  status: string;
  attachments?: any[];
  descricao?: string;
  template_file_url?: string | null;
  template_file_name?: string | null;
  image_url?: string | null;
  font_size_px?: string;
  created_at: string;
  user_id: string;
}

interface TemplatePreviewProps {
  template: Template;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{template.nome}</CardTitle>
        {template.descricao && (
          <CardDescription>{template.descricao}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview do conteúdo */}
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Conteúdo do Email:</h4>
            <div 
              className="prose max-w-none"
              style={{ fontSize: template.font_size_px || '16px' }}
              dangerouslySetInnerHTML={{ __html: template.conteudo }}
            />
          </div>

          {/* Assinatura */}
          {template.assinatura && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Assinatura:</h4>
              <p className="text-sm whitespace-pre-wrap">{template.assinatura}</p>
            </div>
          )}

          {/* Informações do template */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Canal:</span>
              <span className="ml-2 text-gray-600">{template.canal}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className="ml-2 text-gray-600">{template.status}</span>
            </div>
            {template.font_size_px && (
              <div>
                <span className="font-medium text-gray-700">Tamanho da fonte:</span>
                <span className="ml-2 text-gray-600">{template.font_size_px}</span>
              </div>
            )}
            {template.attachments && template.attachments.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Anexos:</span>
                <span className="ml-2 text-gray-600">{template.attachments.length}</span>
              </div>
            )}
          </div>

          {/* Preview de como ficará no email */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Como ficará no email:</h4>
            <div className="bg-white border rounded p-3">
              <div className="border-b pb-2 mb-2">
                <p className="text-xs text-gray-500">De: seu-email@empresa.com</p>
                <p className="text-xs text-gray-500">Para: cliente@exemplo.com</p>
                <p className="text-xs text-gray-500">Assunto: [Assunto do email]</p>
              </div>
              <div 
                className="prose max-w-none text-sm"
                style={{ fontSize: template.font_size_px || '16px' }}
                dangerouslySetInnerHTML={{ __html: template.conteudo }}
              />
              {template.assinatura && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm whitespace-pre-wrap">{template.assinatura}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
