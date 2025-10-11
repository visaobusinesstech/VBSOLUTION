import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Image, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/useToast';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (url: string) => void;
  onLogoRemove: () => void;
}

export function LogoUpload({ currentLogoUrl, onLogoChange, onLogoRemove }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadLogo, deleteLogo } = useFileUpload();
  const { success, error: showError } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload do arquivo
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    const result = await uploadLogo(file);
    
    if (result.success && result.url) {
      onLogoChange(result.url);
      success('Logo enviado', 'Logo da empresa atualizado com sucesso!');
    } else {
      showError('Erro no upload', result.error || 'Falha ao enviar logo');
      // Reverter preview em caso de erro
      setPreviewUrl(currentLogoUrl || null);
    }
  };

  const handleRemove = async () => {
    if (!currentLogoUrl) return;

    const result = await deleteLogo(currentLogoUrl);
    
    if (result.success) {
      setPreviewUrl(null);
      onLogoRemove();
      success('Logo removido', 'Logo da empresa removido com sucesso!');
    } else {
      showError('Erro ao remover', result.error || 'Falha ao remover logo');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview da logo */}
        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Logo da empresa" 
              className="w-full h-full object-contain"
            />
          ) : (
            <Image className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Botões de ação */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClick}
            disabled={uploading}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Upload Logo'}
          </Button>
          
          {currentLogoUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemove}
              disabled={uploading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Informações de ajuda */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>Formatos aceitos: JPG, PNG, GIF, SVG</p>
        <p>Tamanho máximo: 5MB</p>
        <p>Dimensão recomendada: 200x200px</p>
      </div>

      {/* Indicador de loading */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Processando upload...
        </div>
      )}
    </div>
  );
}
