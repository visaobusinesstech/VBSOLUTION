
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image as ImageIcon, Video, Calendar, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MediaUploadModal from './MediaUploadModal';

interface FeedPostCreatorProps {
  onCreatePost: (content: string, type?: 'text' | 'image' | 'video' | 'event', mediaFile?: File, eventData?: any) => void;
}

const FeedPostCreator = ({ onCreatePost }: FeedPostCreatorProps) => {
  const { user } = useAuth();
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
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">
                  {user?.user_metadata?.name ? user.user_metadata.name.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-200/50">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="O que está acontecendo na sua equipe hoje?"
                  className="resize-none border-0 focus-visible:ring-0 p-0 text-base bg-transparent placeholder:text-gray-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaModal('image')}
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full px-4 py-2 transition-all duration-200"
                  >
                    <ImageIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">Imagem</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaModal('video')}
                    className="text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full px-4 py-2 transition-all duration-200"
                  >
                    <Video className="h-5 w-5 mr-2" />
                    <span className="font-medium">Vídeo</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaModal('event')}
                    className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full px-4 py-2 transition-all duration-200"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-medium">Evento</span>
                  </Button>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  size="sm"
                  className="text-white rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Send className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Publicar</span>
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
