
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Calendar, MapPin, Clock } from 'lucide-react';
import PostComments from './PostComments';
import { Post } from '@/hooks/usePosts';

interface EnhancedFeedPostProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, comment: string) => void;
}

const EnhancedFeedPost = ({ post, onLike, onAddComment }: EnhancedFeedPostProps) => {
  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddComment = (comment: { content: string }) => {
    onAddComment(post.id, comment.content);
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (timeStr: string) => {
    return timeStr;
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
              {getAuthorInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
            <p className="text-sm text-gray-600">{post.author.role}</p>
          </div>
          <span className="text-sm text-gray-500">{post.timestamp}</span>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed mb-3">{post.content}</p>
          
          {/* Media content */}
          {post.type === 'image' && post.imageUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={post.imageUrl} 
                alt="Post image" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {post.type === 'video' && post.videoUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <video 
                controls 
                className="w-full h-auto max-h-96"
                src={post.videoUrl}
              />
            </div>
          )}

          {/* Event content */}
          {post.type === 'event' && post.eventData && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">{post.eventData.title}</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                {post.eventData.date && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatEventDate(post.eventData.date)}</span>
                  </div>
                )}
                
                {post.eventData.time && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formatEventTime(post.eventData.time)}</span>
                  </div>
                )}
                
                {post.eventData.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{post.eventData.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-1 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-2 hover:bg-red-50 ${
              post.isLiked ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
            {post.likes}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          >
            <MessageCircle className="h-4 w-4" />
            {post.comments}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:bg-green-50 hover:text-green-600"
          >
            <Share2 className="h-4 w-4" />
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

export default EnhancedFeedPost;
