import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeed } from '@/hooks/useFeed';
import { FeedComment } from '@/types/feed';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostCommentsNewProps {
  postId: string;
  onAddComment: (content: string) => void;
}

const PostCommentsNew = ({ postId, onAddComment }: PostCommentsNewProps) => {
  const { user } = useAuth();
  const { fetchComments } = useFeed();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await fetchComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await onAddComment(newComment.trim());
      setNewComment('');
      // Recarregar comentários para mostrar o novo
      await loadComments();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'há pouco tempo';
    }
  };

  return (
    <div className="mt-4">
      {/* Comments Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {comments.length} Comentário{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">Carregando comentários...</div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white text-xs">
                  {getInitials(comment.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {comment.user?.name || 'Usuário'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">Nenhum comentário ainda</div>
        </div>
      )}

      {/* Comment Input */}
      {user && (
        <Card className="p-4 bg-gray-50 border border-gray-200">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name} />
              <AvatarFallback className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white text-xs">
                {getInitials(user.user_metadata?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                rows={2}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Comentar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PostCommentsNew;
