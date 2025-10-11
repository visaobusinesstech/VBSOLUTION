import { FileData } from '@/hooks/useFiles';
import { Card } from '@/components/ui/card';
import { Clock, Star, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilesSidebarProps {
  recentFiles: FileData[];
  favoriteFiles: FileData[];
  myFiles: FileData[];
  onFileClick?: (file: FileData) => void;
}

export function FilesSidebar({
  recentFiles,
  favoriteFiles,
  myFiles,
  onFileClick
}: FilesSidebarProps) {
  const renderFileList = (files: FileData[], emptyMessage: string) => {
    if (files.length === 0) {
      return (
        <p className="text-xs text-gray-500">{emptyMessage}</p>
      );
    }

    return (
      <div className="space-y-2 mt-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
            onClick={() => onFileClick?.(file)}
          >
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(file.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-72 flex-shrink-0 space-y-3">
      {/* Recente */}
      <Card className="p-3 transition-all duration-200 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 hover:border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Recente</h3>
        </div>
        {renderFileList(
          recentFiles,
          'Seus documentos abertos recentemente serão exibidos aqui.'
        )}
      </Card>

      {/* Favoritos */}
      <Card className="p-3 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-100/50 hover:-translate-y-1 hover:border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <Star className="w-4 h-4 text-yellow-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Favoritos</h3>
        </div>
        {renderFileList(
          favoriteFiles,
          'Seus documentos favoritos serão exibidos aqui.'
        )}
      </Card>

      {/* Criados por mim */}
      <Card className="p-3 transition-all duration-200 hover:shadow-lg hover:shadow-green-100/50 hover:-translate-y-1 hover:border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <User className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Criados por mim</h3>
        </div>
        {renderFileList(
          myFiles,
          'Todos os documentos criados por você serão exibidos aqui.'
        )}
      </Card>
    </div>
  );
}


