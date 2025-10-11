import { FileData } from '@/hooks/useFiles';
import { Button } from '@/components/ui/button';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileIcon,
  Star,
  Share2,
  Lock,
  MoreHorizontal,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FileCardProps {
  file: FileData;
  onPreview?: (file: FileData) => void;
  onToggleFavorite?: (file: FileData) => void;
  onDelete?: (file: FileData) => void;
  onDownload?: (file: FileData) => void;
  onToggleShare?: (file: FileData) => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.includes('pdf')) return FileText;
  if (type.includes('document') || type.includes('word')) return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileText;
  if (type.includes('presentation') || type.includes('powerpoint')) return FileText;
  return FileIcon;
};

const getFileIconColor = (type: string) => {
  if (type.startsWith('image/')) return 'text-blue-600 bg-blue-100';
  if (type.startsWith('video/')) return 'text-purple-600 bg-purple-100';
  if (type.startsWith('audio/')) return 'text-pink-600 bg-pink-100';
  if (type.includes('pdf')) return 'text-red-600 bg-red-100';
  if (type.includes('document') || type.includes('word')) return 'text-blue-600 bg-blue-100';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'text-green-600 bg-green-100';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'text-orange-600 bg-orange-100';
  return 'text-gray-600 bg-gray-100';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileCard({
  file,
  onPreview,
  onToggleFavorite,
  onDelete,
  onDownload,
  onToggleShare
}: FileCardProps) {
  const Icon = getFileIcon(file.type);
  const iconColorClass = getFileIconColor(file.type);

  const handlePreview = () => {
    onPreview?.(file);
  };

  return (
    <div
      className="group p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg"
      onClick={handlePreview}
    >
      <div className="flex items-center gap-3">
        {/* Ícone do arquivo */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Informações do arquivo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </h4>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(file.created_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          </div>
        </div>

        {/* Ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handlePreview();
            }}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onDownload?.(file);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(file);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}


