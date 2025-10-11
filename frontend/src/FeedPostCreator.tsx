
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Image as ImageIcon, Video, Calendar, Send } from 'lucide-react';
import MediaUploadModal from './MediaUploadModal';

interface FeedPostCreatorProps {
  onCreatePost: (content: string, type?: 'text' | 'image' | 'video' | 'event', mediaFile?: File, eventData?: any) => void;
}

const FeedPostCreator = ({ onCreatePost }: FeedPostCreatorProps) => {
  const [content, setContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'image' | 'video' | 'event'>('image');

  const handleSubmit = () => {
    if (content.trim()) {
      onCreatePost(content, 'text');
      setContent('');
    }
  };

  const handleMediaPost = (postContent: string, type: 'image' | 'video' | 'event', mediaFile?: File, eventData?: any) => {
    onCreatePost(postContent, type, mediaFile, eventData);
    setIsModalOpen(false);
  };

  const openMediaModal = (type: 'image' | 'video' | 'event') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="bg-white shadow-sm border border-gray-200 mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                UC
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="O que você gostaria de compartilhar?"
                className="resize-none border-0 focus-visible:ring-0 p-0 text-base bg-transparent"
                rows={3}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaModal('image')}
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Imagem
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaModal('video')}
                    className="text-gray-600 hover:text-green-600 hover:bg-green-50"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Vídeo
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaModal('event')}
                    className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Evento
                  </Button>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  size="sm"
                  className="text-white"
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
                  <Send className="h-4 w-4 mr-1" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MediaUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleMediaPost}
        type={modalType}
      />
    </>
  );
};

export default FeedPostCreator;
