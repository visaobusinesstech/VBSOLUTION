import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  Search,
  Plus,
  FileText,
  User,
  Share,
  Lock,
  AlignJustify,
  ArrowUpDown,
  Loader2,
  X
} from 'lucide-react';
import { useFiles, FileFilter, FileData } from '@/hooks/useFiles';
import { useFileUploadSimple } from '@/hooks/useFileUploadSimple';
import { FileCard } from '@/components/files/FileCard';
import { FilePreviewModal } from '@/components/files/FilePreviewModal';
import { FilesSidebar } from '@/components/files/FilesSidebar';
import { CreateDocumentModal } from '@/components/files/CreateDocumentModal';
import { UploadProgress } from '@/components/files/UploadProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Files = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<FileFilter>('todos');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'viewed_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    files,
    recentFiles,
    favoriteFiles,
    myFiles,
    loading,
    refetch,
    toggleFavorite,
    deleteFile,
    updateFileViewedAt,
    updateFileSharing
  } = useFiles({ filter: viewMode, searchTerm });

  const { uploadProgress } = useFileUploadSimple();

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearching(true);
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (!searchTerm) {
      setIsSearchExpanded(false);
    }
  };

  const handleViewModeChange = (mode: FileFilter) => {
    setViewMode(mode);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleFilePreview = async (file: FileData) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
    updateFileViewedAt(file.id);
  };

  const handleToggleFavorite = async (file: FileData) => {
    await toggleFavorite(file.id, false);
  };

  const handleDeleteFile = async (file: FileData) => {
    if (window.confirm(`Tem certeza que deseja excluir "${file.name}"?`)) {
      await deleteFile(file.id);
    }
  };

  const handleDownloadFile = async (file: FileData) => {
    try {
      // Como não temos storage, apenas mostrar que o arquivo está salvo como base64
      toast.info('Arquivo salvo como base64 no banco de dados');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleToggleShare = async (file: FileData) => {
    await updateFileSharing(file.id, false);
  };

  const handleSort = (column: 'name' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'created_at') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'viewed_at') {
      const aDate = a.viewed_at ? new Date(a.viewed_at).getTime() : 0;
      const bDate = b.viewed_at ? new Date(b.viewed_at).getTime() : 0;
      comparison = aDate - bDate;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Botões de visualização
  const viewButtons = [
    {
      id: 'todos',
      label: 'Todos',
      icon: FileText,
      active: viewMode === 'todos'
    },
    {
      id: 'meus-documentos',
      label: 'Meus documentos',
      icon: User,
      active: viewMode === 'meus-documentos'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Faixa branca contínua com botões de navegação */}
        <div className="bg-white -mt-6 -mx-6">
          {/* Botões de visualização */}
          <div className="px-3 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Botão fixo de toggle da sidebar */}
                {!sidebarExpanded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                    onClick={expandSidebarFromMenu}
                    title="Expandir barra lateral"
                  >
                    <AlignJustify size={14} />
                  </Button>
                )}

                {viewButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <Button
                      key={button.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewModeChange(button.id as FileFilter)}
                      className={`
                        h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                        ${button.active
                          ? 'bg-gray-50 text-slate-900 shadow-inner'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {button.label}
                    </Button>
                  );
                })}
              </div>

              {/* Barra de busca expansível */}
              <div className="flex items-center justify-end mr-4">
                {/* Campo de busca expansível */}
                <div className={`relative transition-all duration-300 ease-in-out ${
                  isSearchExpanded ? 'w-80' : 'w-8'
                }`}>
                  {isSearchExpanded ? (
                    <>
                      {isSearching ? (
                        <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onBlur={handleSearchBlur}
                        autoFocus
                        className="pl-10 pr-4 py-1.5 w-full text-sm bg-white border border-black/80 shadow-lg rounded-lg focus:border-black/80 focus:ring-0 transition-all duration-300"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setIsSearchExpanded(false);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleSearchClick}
                      className="w-8 h-8 flex items-center justify-center text-gray-900 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Resultados da busca - só aparece quando expandido */}
                {isSearchExpanded && searchTerm && (
                  <div className="ml-4 flex items-center gap-2 text-sm text-gray-600">
                    <Search className="h-4 w-4" />
                    <span>
                      {files.length} {files.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
                      <span className="ml-1">
                        para "<span className="font-medium text-gray-900">{searchTerm}</span>"
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar Layout */}
        <div className="px-3 py-4">
          <div className="flex gap-4">
            {/* Left Sidebar - Fixed Cards */}
            <FilesSidebar
              recentFiles={recentFiles}
              favoriteFiles={favoriteFiles}
              myFiles={myFiles}
              onFileClick={handleFilePreview}
            />

            {/* Right Content Area - File Lists */}
            <div className="flex-1">
              {loading ? (
                <Card className="p-8">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500">Carregando arquivos...</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  {sortedFiles.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-left font-medium text-gray-700 py-2 text-xs">
                            <button
                              onClick={() => handleSort('name')}
                              className="flex items-center gap-1 hover:text-gray-900"
                            >
                              Nome
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-2 text-xs">
                            Localização
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-2 text-xs">
                            Etiquetas
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-2 text-xs">
                            <button
                              onClick={() => handleSort('created_at')}
                              className="flex items-center gap-1 hover:text-gray-900"
                            >
                              Data de atualização
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-2 text-xs">
                            <button
                              onClick={() => handleSort('viewed_at')}
                              className="flex items-center gap-1 hover:text-gray-900"
                            >
                              Data de visualização
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-2 text-xs">
                            Compartilhamento
                          </TableHead>
                          <TableHead className="w-6"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedFiles.map((file) => (
                          <TableRow key={file.id} className="border-b border-gray-100 last:border-0">
                            <TableCell colSpan={7} className="p-0">
                              <FileCard
                                file={file}
                                onPreview={handleFilePreview}
                                onToggleFavorite={handleToggleFavorite}
                                onDelete={handleDeleteFile}
                                onDownload={handleDownloadFile}
                                onToggleShare={handleToggleShare}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-medium text-gray-900 mb-1 text-sm">
                            {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento encontrado'}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {searchTerm ? (
                              <>
                                Não encontramos documentos com o título "<span className="font-medium text-gray-900">{searchTerm}</span>".
                                <br />
                                Tente usar palavras-chave diferentes ou verifique a ortografia.
                              </>
                            ) : (
                              'Você ainda não criou nenhum documento. Clique no botão + para criar seu primeiro documento.'
                            )}
                          </p>
                          {searchTerm && (
                            <Button
                              onClick={() => setSearchTerm('')}
                              variant="outline"
                              size="sm"
                              className="mt-3"
                            >
                              Limpar busca
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botão flutuante de novo documento */}
      <Button
        onClick={handleOpenCreateModal}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg z-50 transition-colors duration-200"
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

      {/* Modal de criação de documento */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          // Removido o reload automático que estava causando o F5
        }}
      />

      {/* Modal de preview de arquivo */}
      <FilePreviewModal
        file={selectedFile}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedFile(null);
        }}
        onToggleFavorite={handleToggleFavorite}
        onToggleShare={handleToggleShare}
      />

      {/* Upload Progress */}
      <UploadProgress progress={uploadProgress} />
    </>
  );
};

export default Files;
