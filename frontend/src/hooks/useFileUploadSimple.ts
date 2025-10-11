import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface UseFileUploadReturn {
  uploadFile: (file: File, options?: UploadOptions) => Promise<string | null>;
  uploadMultipleFiles: (files: File[], options?: UploadOptions) => Promise<string[]>;
  uploadProgress: UploadProgress | null;
  isUploading: boolean;
}

interface UploadOptions {
  folder?: string;
  tags?: string[];
  shared?: boolean;
  private?: boolean;
  description?: string;
  onProgress?: (progress: number) => void;
}

export function useFileUploadSimple(): UseFileUploadReturn {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File, options: UploadOptions = {}): Promise<string | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer upload');
      return null;
    }

    const {
      folder = '/',
      tags = [],
      shared = false,
      private: isPrivate = false,
      description = null,
      onProgress
    } = options;

    try {
      setIsUploading(true);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      // Validar tamanho do arquivo (10GB max)
      const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
      if (file.size > maxSize) {
        throw new Error('O arquivo deve ter no máximo 10GB');
      }

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev || prev.progress >= 90) return prev;
          return {
            ...prev,
            progress: Math.min(prev.progress + 10, 90)
          };
        });
        onProgress?.(Math.min(uploadProgress?.progress || 0 + 10, 90));
      }, 200);

      // Converter arquivo para base64 para salvar diretamente no banco
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      clearInterval(progressInterval);

      setUploadProgress(prev => prev ? { ...prev, progress: 95, status: 'processing' } : null);
      onProgress?.(95);

      // Salvar arquivo diretamente na tabela files como base64 (apenas colunas que existem)
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          owner_id: user.id, // SEMPRE com owner_id para segurança
          name: file.name,
          size: file.size,
          type: file.type,
          file_content: base64File // Salvar o conteúdo do arquivo
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setUploadProgress({
        fileName: file.name,
        progress: 100,
        status: 'completed'
      });
      onProgress?.(100);

      toast.success(`Arquivo "${file.name}" enviado com sucesso!`);

      // Limpar progresso após 2 segundos
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

      return fileData.id;
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: err.message
      });

      toast.error(`Erro ao enviar arquivo: ${err.message}`);
      
      // Limpar erro após 3 segundos
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleFiles = async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<string[]> => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer upload');
      return [];
    }

    setIsUploading(true);
    const uploadedIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setUploadProgress({
        fileName: `${file.name} (${i + 1}/${files.length})`,
        progress: 0,
        status: 'uploading'
      });

      const fileId = await uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          const overallProgress = ((i * 100) + progress) / files.length;
          setUploadProgress(prev => prev ? { ...prev, progress: overallProgress } : null);
        }
      });

      if (fileId) {
        uploadedIds.push(fileId);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (uploadedIds.length === files.length) {
      toast.success(`${files.length} arquivos enviados com sucesso!`);
    } else if (uploadedIds.length > 0) {
      toast.warning(
        `${uploadedIds.length} de ${files.length} arquivos enviados com sucesso`
      );
    } else {
      toast.error('Nenhum arquivo foi enviado');
    }

    return uploadedIds;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    uploadProgress,
    isUploading
  };
}
