import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  X,
  Upload,
  Link,
  Copy,
  FolderPlus,
  Database,
  FileText,
  Globe,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useFileUploadSimple } from '@/hooks/useFileUploadSimple';
import { toast } from 'sonner';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateDocumentModal({
  isOpen,
  onClose,
  onSuccess
}: CreateDocumentModalProps) {
  const [documentType, setDocumentType] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, uploadMultipleFiles, uploadProgress } = useFileUploadSimple();

  const handleClose = () => {
    if (!isUploading) {
      setDocumentType('');
      setDocumentTitle('');
      setDocumentDescription('');
      setSelectedFiles([]);
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setIsUploading(true);
    try {
      if (selectedFiles.length === 1) {
        await uploadFile(selectedFiles[0], {
          description: documentDescription || null,
          tags: documentType ? [documentType] : []
        });
      } else {
        await uploadMultipleFiles(selectedFiles, {
          description: documentDescription || null,
          tags: documentType ? [documentType] : []
        });
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!documentType || !documentTitle) {
      toast.error('Preencha o tipo e título do documento');
      return;
    }

    // Aqui você pode implementar a criação de documentos vazios
    // Por exemplo, criar um documento Google Docs, Wiki, etc.
    toast.info('Funcionalidade de criar documento em desenvolvimento');
    
    // Por enquanto, apenas fecha o modal
    handleClose();
  };

  const handleUploadToGoogleDrive = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo para enviar ao Google Drive');
      return;
    }

    try {
      // Simular upload para Google Drive
      toast.info('Redirecionando para o Google Drive...');
      
      // Abrir Google Drive em nova aba
      const googleDriveUrl = 'https://drive.google.com/drive/';
      window.open(googleDriveUrl, '_blank');
      
      // Opcional: fechar o modal após redirecionamento
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      console.error('Erro ao redirecionar para Google Drive:', err);
      toast.error('Erro ao acessar Google Drive');
    }
  };

  const documentTypes = [
    {
      id: 'wiki',
      label: 'Wiki',
      description: 'Base de conhecimento',
      icon: Database,
      color: 'purple'
    },
    {
      id: 'documento',
      label: 'Documento',
      description: 'Documento padrão',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'proposta',
      label: 'Proposta',
      description: 'Proposta comercial',
      icon: FileText,
      color: 'green'
    },
    {
      id: 'pagina',
      label: 'Página',
      description: 'Página da empresa',
      icon: Globe,
      color: 'orange'
    }
  ];

  const quickActions = [
    {
      id: 'upload',
      label: 'Upload de Arquivo',
      description: 'Fazer upload de um arquivo existente',
      icon: Upload,
      color: 'teal',
      onClick: () => fileInputRef.current?.click()
    },
    {
      id: 'link',
      label: 'Importar do Link',
      description: 'Importar conteúdo de uma URL',
      icon: Link,
      color: 'yellow',
      onClick: () => toast.info('Funcionalidade em desenvolvimento')
    },
    {
      id: 'duplicate',
      label: 'Duplicar Documento',
      description: 'Criar cópia de documento existente',
      icon: Copy,
      color: 'red',
      onClick: () => toast.info('Funcionalidade em desenvolvimento')
    },
    {
      id: 'folder',
      label: 'Nova Pasta',
      description: 'Criar uma nova pasta para organização',
      icon: FolderPlus,
      color: 'indigo',
      onClick: () => toast.info('Funcionalidade em desenvolvimento')
    },
    {
      id: 'google-drive',
      label: 'Anexar ao Google Drive',
      description: 'Salvar e anexar documento ao Google Drive',
      icon: ExternalLink,
      color: 'green',
      onClick: handleUploadToGoogleDrive
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      teal: 'bg-teal-100 text-teal-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      green: 'bg-green-100 text-green-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Criar Novo Documento
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Escolha o tipo de documento que deseja criar
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
              disabled={isUploading}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* Tipo de Documento */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Tipo de Documento</h3>
              <div className="grid grid-cols-2 gap-3">
                {documentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.id}
                      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        documentType === type.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setDocumentType(type.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${getColorClasses(type.color)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{type.label}</h4>
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Ações Rápidas</h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200"
                      onClick={action.onClick}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${getColorClasses(action.color)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{action.label}</h4>
                          <p className="text-xs text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Input de arquivo (oculto) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900">
                  Arquivos Selecionados ({selectedFiles.length})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                        }}
                        className="h-8 w-8 p-0"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário condicional */}
            {(documentType || selectedFiles.length > 0) && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900">
                  Detalhes {selectedFiles.length > 0 ? 'do Upload' : `do ${documentType}`}
                </h3>

                {documentType && selectedFiles.length === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título
                    </label>
                    <Input
                      placeholder={`Nome do ${documentType}`}
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="w-full"
                      disabled={isUploading}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    placeholder="Breve descrição"
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    disabled={isUploading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            {selectedFiles.length > 0 ? (
              <Button
                onClick={handleUploadFiles}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar {selectedFiles.length > 1 ? 'Arquivos' : 'Arquivo'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCreateDocument}
                disabled={!documentType || !documentTitle || isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Criar {documentType}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


