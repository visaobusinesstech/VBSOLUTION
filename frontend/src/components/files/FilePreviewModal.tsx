import { FileData } from '@/hooks/useFiles';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Star, Share2, Printer, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  file: FileData | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (file: FileData) => void;
  onToggleShare?: (file: FileData) => void;
}

export function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onToggleFavorite,
  onToggleShare
}: FilePreviewModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      loadFileUrl();
    } else {
      setFileUrl(null);
    }
  }, [file, isOpen]);

  const loadFileUrl = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Se o arquivo tem file_content (base64), usar diretamente
      if (file.file_content) {
        setFileUrl(file.file_content);
      } else {
        // Fallback para storage (se existir path)
        if (file.path && file.path !== 'base64:') {
      const { data } = supabase.storage
        .from('files')
        .getPublicUrl(file.path);
      setFileUrl(data.publicUrl);
        } else {
          throw new Error('Arquivo não encontrado');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar URL do arquivo:', err);
      toast.error('Erro ao carregar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !fileUrl) return;

    try {
      let blob: Blob;
      
      if (file.file_content) {
        // Se é base64, converter para blob
        const response = await fetch(file.file_content);
        blob = await response.blob();
      } else {
        // Se é URL do storage, fazer fetch
      const response = await fetch(fileUrl);
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download iniciado');
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      toast.error('Erro ao baixar arquivo');
    }
  };


  // 1. Função para FAVORITAR
  const handleToggleFavorite = () => {
    if (!file || !onToggleFavorite) return;
    
    try {
      setIsFavorited(!isFavorited);
      onToggleFavorite(file);
      
      if (isFavorited) {
        toast.success('Arquivo removido dos favoritos');
      } else {
        toast.success('Arquivo adicionado aos favoritos');
      }
    } catch (err) {
      console.error('Erro ao favoritar arquivo:', err);
      toast.error('Erro ao favoritar arquivo');
    }
  };

  // 2. Função para COMPARTILHAR
  const handleToggleShare = () => {
    if (!file || !onToggleShare) return;
    
    try {
      // Criar link de compartilhamento
      const shareData = {
        title: file.name,
        text: `Compartilhando arquivo: ${file.name}`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        // Usar API nativa de compartilhamento se disponível
        navigator.share(shareData).then(() => {
          toast.success('Arquivo compartilhado com sucesso');
        }).catch(() => {
          copyToClipboard();
        });
      } else {
        // Fallback para copiar link
        copyToClipboard();
      }
      
      onToggleShare(file);
    } catch (err) {
      console.error('Erro ao compartilhar arquivo:', err);
      toast.error('Erro ao compartilhar arquivo');
    }
  };

  // Função auxiliar para copiar link
  const copyToClipboard = () => {
    const shareText = `📄 Arquivo: ${file?.name}\n📁 Tipo: ${file?.type}\n📊 Tamanho: ${file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB\n🔗 Link: ${window.location.href}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success('Informações do arquivo copiadas para a área de transferência');
    }).catch(() => {
      toast.info('Funcionalidade de compartilhamento não disponível');
    });
  };

  // 3. Função para DOWNLOAD (já implementada)
  // 4. Função para IMPRIMIR
  const handlePrint = () => {
    if (!file || !fileUrl) return;
    
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Imprimir: ${file.name}</title>
              <style>
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .file-info { margin: 10px 0; color: #666; }
                img, iframe, video, audio { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${file.name}</h1>
                <div class="file-info">Tipo: ${file.type}</div>
                <div class="file-info">Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <div class="file-info">Data: ${new Date(file.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="content">
                ${file.type.startsWith('image/') ? `<img src="${fileUrl}" style="display: block; margin: 0 auto;" />` : ''}
                ${file.type === 'application/pdf' ? `<iframe src="${fileUrl}" style="width: 100%; height: 600px; border: none;"></iframe>` : ''}
                ${!file.type.startsWith('image/') && file.type !== 'application/pdf' ? 
                  `<div style="text-align: center; padding: 50px;">
                    <h3>Arquivo: ${file.name}</h3>
                    <p>Este tipo de arquivo não pode ser impresso diretamente.</p>
                    <p>Use o botão de download para salvar o arquivo.</p>
                  </div>` : ''}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Aguardar carregamento e imprimir
        setTimeout(() => {
          printWindow.print();
          toast.success('Impressão iniciada');
        }, 1000);
      }
    } catch (err) {
      console.error('Erro ao imprimir arquivo:', err);
      toast.error('Erro ao imprimir arquivo');
    }
  };

  // 5. Função para ANEXAR AO GOOGLE DRIVE
  const handleUploadToGoogleDrive = () => {
    if (!file) return;
    
    try {
      // Simular upload para Google Drive
      toast.info('Redirecionando para o Google Drive...');
      
      // Abrir Google Drive em nova aba
      const googleDriveUrl = 'https://drive.google.com/drive/';
      window.open(googleDriveUrl, '_blank');
      
      toast.success('Redirecionamento para Google Drive iniciado');
    } catch (err) {
      console.error('Erro ao redirecionar para Google Drive:', err);
      toast.error('Erro ao acessar Google Drive');
    }
  };

  // 6. Função para FECHAR (já implementada via onClose)

  const renderPreview = () => {
    if (!file || !fileUrl) return null;

    const { type } = file;

    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Imagens
    if (type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4">
          <img
            src={fileUrl}
            alt={file.name}
            className="max-w-full max-h-[600px] object-contain rounded"
          />
        </div>
      );
    }

    // Vídeos
    if (type.startsWith('video/')) {
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          <video
            src={fileUrl}
            controls
            className="w-full max-h-[600px]"
          >
            Seu navegador não suporta a tag de vídeo.
          </video>
        </div>
      );
    }

    // Áudio
    if (type.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
          <div className="w-full max-w-md">
            <audio
              src={fileUrl}
              controls
              className="w-full"
            >
              Seu navegador não suporta a tag de áudio.
            </audio>
          </div>
        </div>
      );
    }

    // PDFs
    if (type === 'application/pdf') {
      return (
        <div className="h-[600px] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={fileUrl}
            className="w-full h-full"
            title={file.name}
          />
        </div>
      );
    }

    // Outros tipos de arquivo
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Visualização não disponível para este tipo de arquivo
          </p>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar arquivo
          </Button>
        </div>
      </div>
    );
  };

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <DialogTitle className="text-lg font-semibold truncate">
                {file.name}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className={`h-8 w-8 p-0 ${isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
                  title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Star className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                </Button>
              )}
              {onToggleShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleShare}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500"
                  title="Compartilhar arquivo"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0 text-gray-500 hover:text-green-500"
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="h-8 w-8 p-0 text-gray-500 hover:text-purple-500"
                title="Imprimir arquivo"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUploadToGoogleDrive}
                className="h-8 w-8 p-0 text-gray-500 hover:text-green-500"
                title="Anexar ao Google Drive"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                title="Fechar modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {renderPreview()}
        </div>

        <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tamanho:</span>
              <span className="ml-2 text-gray-900">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div>
              <span className="text-gray-500">Tipo:</span>
              <span className="ml-2 text-gray-900">{file.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Criado em:</span>
              <span className="ml-2 text-gray-900">
                {new Date(file.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Modificado em:</span>
              <span className="ml-2 text-gray-900">
                {new Date(file.updated_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


