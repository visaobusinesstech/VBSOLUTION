import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FileData {
  id: string;
  owner_id: string;
  name: string;
  size: number;
  type: string;
  file_content?: string;
  created_at: string;
  updated_at: string;
}

export type FileFilter = 'todos' | 'meus-documentos' | 'compartilhado' | 'privado';

interface UseFilesOptions {
  filter?: FileFilter;
  folder?: string;
  searchTerm?: string;
}

export function useFiles(options: UseFilesOptions = {}) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileData[]>([]);
  const [favoriteFiles, setFavoriteFiles] = useState<FileData[]>([]);
  const [myFiles, setMyFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar apenas arquivos do usuário logado (segurança)
      let query = supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id) // SEMPRE filtrar por owner_id
        .order('created_at', { ascending: false });

      // Aplicar busca por nome se fornecida
      if (options.searchTerm && options.searchTerm.trim()) {
        query = query.ilike('name', `%${options.searchTerm.trim()}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setFiles(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar arquivos:', err);
      setError(err.message);
      toast.error('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentFiles = async () => {
    if (!user) return;

    try {
      // Primeiro, buscar todos os arquivos do usuário
      const { data: allFiles, error: allError } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (allError) {
        console.error('Erro ao buscar arquivos:', allError);
        setRecentFiles([]);
        return;
      }

      // Filtrar arquivos que foram visualizados (se a coluna existir)
      // Se a coluna viewed_at não existir, usar os mais recentes
      const recentFiles = allFiles?.filter(file => 
        file.viewed_at || file.created_at
      ).slice(0, 5) || [];

      setRecentFiles(recentFiles);
    } catch (err) {
      console.error('Erro ao buscar arquivos recentes:', err);
      setRecentFiles([]);
    }
  };

  const fetchFavoriteFiles = async () => {
    if (!user) return;

    try {
      // Usar arquivos recentes como favoritos (sem coluna favorite)
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Erro ao buscar arquivos:', error);
        setFavoriteFiles([]);
        return;
      }
      setFavoriteFiles(data || []);
    } catch (err) {
      console.error('Erro ao buscar arquivos favoritos:', err);
      setFavoriteFiles([]);
    }
  };

  const fetchMyFiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao buscar meus arquivos:', error);
        setMyFiles([]);
        return;
      }
      setMyFiles(data || []);
    } catch (err) {
      console.error('Erro ao buscar meus arquivos:', err);
      setMyFiles([]);
    }
  };

  const toggleFavorite = async (fileId: string, currentValue: boolean) => {
    if (!user) return;

    try {
      // Como não temos coluna favorite, apenas logar a ação
      console.log('Tentativa de favoritar:', fileId, !currentValue);
      toast.info('Funcionalidade de favoritos não disponível no momento');
    } catch (err: any) {
      console.error('Erro ao alternar favorito:', err);
      toast.error('Erro ao atualizar favorito');
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!user) return;

    try {
      // Deletar do banco de dados (sem storage)
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('owner_id', user.id);

      if (dbError) throw dbError;

      toast.success('Arquivo deletado com sucesso');

      // Atualizar estados locais
      await Promise.all([
        fetchFiles(),
        fetchRecentFiles(),
        fetchFavoriteFiles(),
        fetchMyFiles()
      ]);
    } catch (err: any) {
      console.error('Erro ao deletar arquivo:', err);
      toast.error('Erro ao deletar arquivo');
    }
  };

  const updateFileViewedAt = async (fileId: string) => {
    if (!user) return;

    try {
      // Como não temos coluna viewed_at, apenas logar que o arquivo foi visualizado
      console.log('Arquivo visualizado:', fileId);
      
      // Atualizar arquivos recentes
      await fetchRecentFiles();
    } catch (err) {
      console.error('Erro ao atualizar viewed_at:', err);
    }
  };

  const updateFileSharing = async (fileId: string, shared: boolean) => {
    if (!user) return;

    try {
      // Como não temos coluna shared, apenas logar a ação
      console.log('Tentativa de compartilhamento:', fileId, shared);
      toast.info('Funcionalidade de compartilhamento não disponível no momento');
    } catch (err: any) {
      console.error('Erro ao atualizar compartilhamento:', err);
      toast.error('Erro ao atualizar compartilhamento');
    }
  };

  const updateFilePrivacy = async (fileId: string, isPrivate: boolean) => {
    if (!user) return;

    try {
      // Como não temos coluna private, apenas logar a ação
      console.log('Tentativa de alterar privacidade:', fileId, isPrivate);
      toast.info('Funcionalidade de privacidade não disponível no momento');
    } catch (err: any) {
      console.error('Erro ao atualizar privacidade:', err);
      toast.error('Erro ao atualizar privacidade');
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchRecentFiles();
    fetchFavoriteFiles();
    fetchMyFiles();
  }, [user, options.filter, options.folder, options.searchTerm]);

  return {
    files,
    recentFiles,
    favoriteFiles,
    myFiles,
    loading,
    error,
    refetch: fetchFiles,
    toggleFavorite,
    deleteFile,
    updateFileViewedAt,
    updateFileSharing,
    updateFilePrivacy,
  };
}


