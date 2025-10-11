
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
      // Validate file type - permitir todos os tipos de imagem e vídeo
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico'];
      const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/3gp', 'video/m4v'];
      
      const isValidType = type === 'image' 
        ? imageTypes.includes(file.type) || file.type.startsWith('image/')
        : videoTypes.includes(file.type) || file.type.startsWith('video/');
      
      if (!isValidType) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `Por favor, selecione um arquivo de ${type === 'image' ? 'imagem (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO)' : 'vídeo (MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V)'}`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size - aumentado para vídeos médios
      const maxSize = type === 'video' ? 200 * 1024 * 1024 : 20 * 1024 * 1024; // 200MB para vídeos, 20MB para imagens
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo deve ter no máximo ${type === 'video' ? '200MB' : '20MB'}`,
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
      <DialogContent className="max-w-md rounded-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            {getIcon()}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">Conteúdo da publicação</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você gostaria de compartilhar?"
              className="mt-2 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400 resize-none"
              rows={3}
            />
          </div>

          {(type === 'image' || type === 'video') && (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {type === 'image' ? 'Selecionar Imagem' : 'Selecionar Vídeo'}
              </Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={type === 'image' 
                    ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,image/ico,image/*' 
                    : 'video/mp4,video/avi,video/mov,video/wmv,video/flv,video/webm,video/mkv,video/3gp,video/m4v,video/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <Upload className="h-5 w-5 mr-2 text-gray-600" />
                  {mediaFile ? (
                    <span className="truncate max-w-[200px] text-gray-800">{mediaFile.name}</span>
                  ) : (
                    <span className="text-gray-700">Selecionar {type === 'image' ? 'Imagem' : 'Vídeo'}</span>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {type === 'image' 
                    ? 'Formatos: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO (até 20MB)'
                    : 'Formatos: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, M4V (até 200MB)'
                  }
                </p>
              </div>
              
              {mediaFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800 truncate">{mediaFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMediaFile(null)}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {mediaFile && type === 'image' && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(mediaFile)}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-xl border border-gray-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {type === 'event' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventTitle" className="text-sm font-medium text-gray-700">Título do Evento *</Label>
                <Input
                  id="eventTitle"
                  value={eventData.title}
                  onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do evento"
                  className="mt-2 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate" className="text-sm font-medium text-gray-700">Data *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-2 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventTime" className="text-sm font-medium text-gray-700">Horário *</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData(prev => ({ ...prev, time: e.target.value }))}
                    className="mt-2 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="eventLocation" className="text-sm font-medium text-gray-700">Local (opcional)</Label>
                <Input
                  id="eventLocation"
                  value={eventData.location}
                  onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Local do evento"
                  className="mt-2 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-11 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Publicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadModal;
