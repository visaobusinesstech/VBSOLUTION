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

export function useFileUpload(): UseFileUploadReturn {
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

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomStr}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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

      // Fazer upload para o Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (storageError) {
        // Se der erro no storage, tentar com bucket público
        console.log('Tentando upload em bucket alternativo...');
        const { data: altStorageData, error: altStorageError } = await supabase.storage
          .from('public-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (altStorageError) {
          throw storageError; // Usar o erro original
        }
        
        // Usar dados do bucket alternativo
        filePath = altStorageData.path;
      } else {
        filePath = storageData.path;
      }

      setUploadProgress(prev => prev ? { ...prev, progress: 95, status: 'processing' } : null);
      onProgress?.(95);

      // Salvar metadados no banco de dados
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          owner_id: user.id,
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
          folder,
          tags,
          shared,
          private: isPrivate,
          description
        })
        .select()
        .single();

      if (dbError) {
        // Se falhar ao salvar no banco, tentar remover do storage
        await supabase.storage.from('files').remove([filePath]);
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
