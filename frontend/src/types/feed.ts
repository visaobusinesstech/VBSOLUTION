// Tipos para o sistema de Feed
export interface FeedPost {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'event';
  content?: string;
  media_url?: string;
  event_date?: string;
  created_at: string;
  updated_at: string;
  // Dados do usuário (join)
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  // Contadores
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface FeedLike {
  id: string;
  feed_id: string;
  user_id: string;
  created_at: string;
  // Dados do usuário (join)
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface FeedComment {
  id: string;
  feed_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Dados do usuário (join)
  user?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
}

export interface CreateFeedPostData {
  type: 'image' | 'video' | 'event';
  content?: string;
  media_file?: File;
  event_date?: string;
}

export interface CreateCommentData {
  content: string;
}

export interface FeedStats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
}
