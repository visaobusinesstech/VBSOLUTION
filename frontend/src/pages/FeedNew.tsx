import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlignJustify, Plus, Users, Heart, MessageCircle } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useFeed } from '@/hooks/useFeed';
import { CreateFeedPostData } from '@/types/feed';
import FeedPostCreatorNew from '@/components/FeedPostCreatorNew';
import FeedPostCardNew from '@/components/FeedPostCardNew';
import { toast } from 'sonner';

const FeedNew = () => {
  const { sidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const { 
    posts, 
    loading, 
    error, 
    createPost, 
    toggleLike, 
    addComment, 
    deletePost 
  } = useFeed();

  const handleCreatePost = async (postData: CreateFeedPostData) => {
    try {
      await createPost(postData);
    } catch (error) {
      console.error('Erro ao criar post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      await addComment(postId, { content });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
    } catch (error) {
      console.error('Erro ao deletar post:', error);
    }
  };

  // Calcular estatísticas
  const totalLikes = posts.reduce((acc, post) => acc + (post.likes_count || 0), 0);
  const totalComments = posts.reduce((acc, post) => acc + (post.comments_count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
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
                <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-1">
                  <Heart className="h-4 w-4" />
                  {totalLikes}
                </div>
                <div className="text-xs text-gray-500">Curtidas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 flex items-center justify-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {totalComments}
                </div>
                <div className="text-xs text-gray-500">Comentários</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 py-8">
        {/* Post Creator Component */}
        <div className="mb-8">
          <FeedPostCreatorNew onCreatePost={handleCreatePost} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando publicações...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-red-600 font-medium">Erro ao carregar feed</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        {!loading && !error && (
          <div className="space-y-6">
            {posts.map((post) => (
              <FeedPostCardNew
                key={post.id}
                post={post}
                onLike={handleLike}
                onAddComment={handleAddComment}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg">
            <CardContent className="py-20 text-center">
              <div className="text-gray-600">
                <div className="text-6xl mb-4">📝</div>
                <div className="text-xl font-semibold mb-2">Nenhuma publicação ainda</div>
                <p className="text-sm mb-6">Seja o primeiro a compartilhar uma atualização com sua equipe!</p>
                <Button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Publicação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FeedNew;
