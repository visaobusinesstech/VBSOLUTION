import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, MoreVertical, Calendar, MapPin, Clock } from 'lucide-react';
import { FeedPost, FeedComment } from '@/types/feed';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PostCommentsNew from './PostCommentsNew';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeedPostCardNewProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
}

const FeedPostCardNew = ({ post, onLike, onAddComment, onDelete }: FeedPostCardNewProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    onLike(post.id);
  };

  const handleAddComment = (content: string) => {
    onAddComment(post.id, content);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Tem certeza que deseja deletar este post?')) {
      onDelete(post.id);
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

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTypeIcon = () => {
    switch (post.type) {
      case 'image':
        return '📷';
      case 'video':
        return '🎥';
      case 'event':
        return '📅';
      default:
        return '📝';
    }
  };

  const getTypeLabel = () => {
    switch (post.type) {
      case 'image':
        return 'Imagem';
      case 'video':
        return 'Vídeo';
      case 'event':
        return 'Evento';
      default:
        return 'Post';
    }
  };

  const isOwner = user?.id === post.user_id;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-md">
                <AvatarImage src={post.user?.avatar_url} alt={post.user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-semibold text-sm">
                  {getInitials(post.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {post.user?.name || 'Usuário'}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {getTypeIcon()} {getTypeLabel()}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 rounded-full p-2"
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Deletar Post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          {post.content && (
            <p className="text-gray-800 leading-relaxed text-base font-medium mb-4">
              {post.content}
            </p>
          )}
          
          {/* Media Content */}
          {post.type === 'image' && post.media_url && (
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={post.media_url} 
                alt="Post image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {post.type === 'video' && post.media_url && (
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <video 
                src={post.media_url} 
                controls 
                className="w-full h-auto max-h-96"
              />
            </div>
          )}

          {/* Event Card */}
          {post.type === 'event' && post.event_date && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Evento Agendado</h4>
                  <p className="text-sm text-gray-600">Confira os detalhes abaixo</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span>{formatEventDate(post.event_date)}</span>
                </div>
                {post.content && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span>{post.content}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100/80">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 h-auto py-2 px-4 rounded-full transition-all duration-200 ${
                post.is_liked 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-auto py-2 px-4 rounded-full transition-all duration-200"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">{post.comments_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50 h-auto py-2 px-4 rounded-full transition-all duration-200"
            >
              <Share className="h-5 w-5" />
              <span className="font-medium">Compartilhar</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <PostCommentsNew 
              postId={post.id} 
              onAddComment={handleAddComment}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedPostCardNew;
