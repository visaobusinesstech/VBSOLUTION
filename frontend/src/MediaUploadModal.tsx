
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Video, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, type: 'image' | 'video' | 'event', mediaFile?: File, eventData?: any) => void;
  type: 'image' | 'video' | 'event';
}

const MediaUploadModal = ({ isOpen, onClose, onSubmit, type }: MediaUploadModalProps) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    time: '',
    location: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const isValidType = type === 'image' ? file.type.startsWith('image/') : file.type.startsWith('video/');
      
      if (!isValidType) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `Por favor, selecione um arquivo de ${type === 'image' ? 'imagem' : 'vídeo'}`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 50MB for videos, 10MB for images)
      const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo deve ter no máximo ${type === 'video' ? '50MB' : '10MB'}`,
          variant: "destructive"
        });
        return;
      }

      setMediaFile(file);
    }
  };

  const handleSubmit = () => {
    if (type === 'event') {
      if (!eventData.title || !eventData.date || !eventData.time) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha título, data e horário do evento",
          variant: "destructive"
        });
        return;
      }
      onSubmit(content, type, undefined, eventData);
    } else {
      if (!content.trim() && !mediaFile) {
        toast({
          title: "Conteúdo obrigatório",
          description: "Por favor, adicione conteúdo ou selecione um arquivo",
          variant: "destructive"
        });
        return;
      }
      onSubmit(content, type, mediaFile || undefined);
    }
    
    // Reset form
    setContent('');
    setMediaFile(null);
    setEventData({ title: '', date: '', time: '', location: '' });
    onClose();
  };

  const getModalTitle = () => {
    switch (type) {
      case 'image': return 'Nova Publicação com Imagem';
      case 'video': return 'Nova Publicação com Vídeo';
      case 'event': return 'Criar Evento';
      default: return 'Nova Publicação';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'event': return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Conteúdo da publicação</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você gostaria de compartilhar?"
              className="mt-1"
              rows={3}
            />
          </div>

          {(type === 'image' || type === 'video') && (
            <div>
              <Label>
                {type === 'image' ? 'Selecionar Imagem' : 'Selecionar Vídeo'}
              </Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={type === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {mediaFile ? mediaFile.name : `Selecionar ${type === 'image' ? 'Imagem' : 'Vídeo'}`}
                </Button>
              </div>
              
              {mediaFile && (
                <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                  <span className="text-sm truncate">{mediaFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMediaFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {mediaFile && type === 'image' && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(mediaFile)}
                    alt="Preview"
                    className="w-full max-h-40 object-contain rounded border"
                  />
                </div>
              )}
            </div>
          )}

          {type === 'event' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="eventTitle">Título do Evento *</Label>
                <Input
                  id="eventTitle"
                  value={eventData.title}
                  onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do evento"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="eventDate">Data *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventTime">Horário *</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="eventLocation">Local (opcional)</Label>
                <Input
                  id="eventLocation"
                  value={eventData.location}
                  onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Local do evento"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-black hover:bg-gray-800 text-white">
              Publicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadModal;
