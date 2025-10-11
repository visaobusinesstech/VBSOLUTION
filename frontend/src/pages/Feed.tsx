import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Image, Video, Calendar, Send, AlignJustify } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePosts, Comment } from '@/hooks/usePosts';
import { useSidebar } from '@/contexts/SidebarContext';
import FeedPostCard from '@/components/FeedPostCard';
import FeedPostCreator from '@/components/FeedPostCreator';

const Feed = () => {
  const { posts, loading, createPost, likePost, addComment } = usePosts();
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'event'>('text');

  const handleCreatePost = async (content: string, type?: 'text' | 'image' | 'video' | 'event', mediaFile?: File, eventData?: any) => {
    if (!content.trim() && !mediaFile && !eventData) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Por favor, adicione conteúdo, mídia ou dados do evento",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPost(content, type || 'text', mediaFile, eventData);
      toast({
        title: "Post criado",
        description: "Sua publicação foi criada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar a publicação",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao curtir a publicação",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (postId: string, comment: Comment) => {
    try {
      await addComment(postId, comment);
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header Moderno */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botão de expandir sidebar (só aparece quando colapsada) */}
              {!sidebarExpanded && showMenuButtons && expandSidebarFromMenu && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir menu lateral"
                >
                  <AlignJustify size={16} />
                </Button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-helvetica">
                  Feed Corporativo
                </h1>
                <p className="text-sm text-gray-600 font-medium font-helvetica">
                  Conecte-se e compartilhe com sua equipe
                </p>
              </div>
            </div>
            
            {/* Stats rápidas */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{posts.length}</div>
                <div className="text-xs text-gray-500">Publicações</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {posts.reduce((acc, post) => acc + post.likes, 0)}
                </div>
                <div className="text-xs text-gray-500">Curtidas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 py-8">
        {/* Post Creator Component - Alinhado com a letra F do título */}
        <div className="mb-8">
          <FeedPostCreator onCreatePost={handleCreatePost} />
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onAddComment={handleAddComment}
            />
          ))}
        </div>

        {posts.length === 0 && !loading && (
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg">
            <CardContent className="py-20 text-center">
              <div className="text-gray-600">
                <div className="text-xl font-semibold mb-2">Nenhuma publicação ainda</div>
                <p className="text-sm">Seja o primeiro a compartilhar uma atualização com sua equipe!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Feed;