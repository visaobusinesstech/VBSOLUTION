
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RightDrawerModal,
  ModalSection
} from '@/components/ui/right-drawer-modal';
import { X, Upload, File } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FileUploadModal({ isOpen, onClose }: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Upload de Arquivos"
      id="UPLOAD"
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose,
          icon: <X className="h-4 w-4" />
        },
        {
          label: uploading ? 'Enviando...' : 'Enviar Arquivos',
          variant: "primary",
          onClick: handleUpload,
          disabled: selectedFiles.length === 0 || uploading,
          icon: <Upload className="h-4 w-4" />
        }
      ]}
    >
      <div className="space-y-6">
        {/* Drop Zone */}
        <ModalSection title="Selecionar Arquivos">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <p className="text-lg font-semibold text-gray-900 mb-3">
              Clique para selecionar arquivos
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Ou arraste e solte arquivos aqui
            </p>
            <p className="text-xs text-gray-500">
              Todos os tipos de arquivo são aceitos
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </ModalSection>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <ModalSection title={`Arquivos Selecionados (${selectedFiles.length})`}>
            <div className="max-h-48 overflow-y-auto space-y-3">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <File className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ModalSection>
        )}

        {/* Info Message */}
        <ModalSection title="Informações Importantes">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Informações importantes:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Todos os tipos de arquivo são aceitos</li>
                <li>• Tamanho máximo por arquivo: 50MB</li>
                <li>• Máximo de 10 arquivos por upload</li>
              </ul>
            </div>
          </div>
        </ModalSection>
      </div>
    </RightDrawerModal>
  );
}
