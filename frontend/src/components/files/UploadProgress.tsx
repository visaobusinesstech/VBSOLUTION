import { UploadProgress as UploadProgressType } from '@/hooks/useFileUpload';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: UploadProgressType | null;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  if (!progress) return null;

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'uploading':
        return 'Enviando...';
      case 'processing':
        return 'Processando...';
      case 'completed':
        return 'Concluído!';
      case 'error':
        return 'Erro no envio';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-500';
      case 'completed':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <Card className={`fixed bottom-4 right-4 w-96 p-4 shadow-lg border-2 ${getStatusColor()} z-50`}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {progress.fileName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getStatusText()}
            </p>
          </div>
        </div>

        {progress.status !== 'error' && (
          <div className="space-y-1">
            <Progress value={progress.progress} className="h-2" />
            <p className="text-xs text-gray-500 text-right">
              {Math.round(progress.progress)}%
            </p>
          </div>
        )}

        {progress.error && (
          <p className="text-xs text-red-600">
            {progress.error}
          </p>
        )}
      </div>
    </Card>
  );
}


