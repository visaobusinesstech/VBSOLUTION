
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share, MoreVertical } from 'lucide-react';
import PostComments from '@/components/PostComments';
import { Post, Comment } from '@/hooks/usePosts';

interface FeedPostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, comment: Comment) => void;
}

const FeedPostCard = ({ post, onLike, onAddComment }: FeedPostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike(post.id);
  };

  const handleAddComment = (comment: Comment) => {
    onAddComment(post.id, comment);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-md">
                {post.author.avatar && (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-semibold text-sm" style={{ display: post.author.avatar ? 'none' : 'flex' }}>
                  {getInitials(post.author.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-lg">{post.author.name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {post.author.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{post.timestamp}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 rounded-full p-2"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-6">
          <p className="text-gray-800 leading-relaxed text-base font-medium">{post.content}</p>
          
          {/* Media Content */}
          {post.type === 'image' && post.imageUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={post.imageUrl} 
                alt="Post image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {post.type === 'video' && post.videoUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden shadow-lg">
              <video 
                src={post.videoUrl} 
                controls 
                className="w-full h-auto max-h-96"
              />
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
                isLiked 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-auto py-2 px-4 rounded-full transition-all duration-200"
            >
              <Share className="h-5 w-5" />
              <span className="font-medium">Compartilhar</span>
            </Button>
          </div>
          
          <div className="text-sm text-gray-400 font-medium">
            {post.postComments?.length || 0} comentários
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-4">
          <PostComments 
            postId={post.id} 
            initialComments={post.postComments || []}
            onAddComment={handleAddComment}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedPostCard;
