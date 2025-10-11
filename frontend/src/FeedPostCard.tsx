
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
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {getInitials(post.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
              <p className="text-sm text-gray-500">{post.author.role}</p>
              <p className="text-xs text-gray-400">{post.timestamp}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed">{post.content}</p>
          
          {/* Media Content */}
          {post.type === 'image' && post.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt="Post image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {post.type === 'video' && post.videoUrl && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <video 
                src={post.videoUrl} 
                controls 
                className="w-full h-auto max-h-96"
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 h-auto py-2 px-3 ${
              isLiked ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            {likesCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-auto py-2 px-3"
          >
            <Share className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        {/* Comments Section */}
        <PostComments 
          postId={post.id} 
          initialComments={post.postComments || []}
          onAddComment={handleAddComment}
        />
      </CardContent>
    </Card>
  );
};

export default FeedPostCard;
