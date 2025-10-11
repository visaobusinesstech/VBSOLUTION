import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';

interface Comment {
  id: string;
  author: {
    name: string;
    initials: string;
  };
  content: string;
  timestamp: string;
}

interface PostCommentsProps {
  postId: string;
  initialComments?: Comment[];
  onAddComment?: (comment: Comment) => void;
}

const PostComments = ({ postId, initialComments = [], onAddComment }: PostCommentsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: {
          name: 'Usuário Atual',
          initials: 'UC'
        },
        content: newComment.trim(),
        timestamp: 'agora'
      };
      
      setComments([...comments, comment]);
      setNewComment('');
      
      // Notify parent component
      if (onAddComment) {
        onAddComment(comment);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const toggleComments = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mt-4">
      {/* Comments Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleComments}
        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 h-auto"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {comments.length} Comentários
      </Button>

      {/* Comments Section */}
      {isOpen && (
        <Card className="mt-3 p-4 bg-gray-50 border border-gray-200">
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {comment.author.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                UC
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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

export default PostComments;
