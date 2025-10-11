import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FeedPost, FeedLike, FeedComment, CreateFeedPostData, CreateCommentData } from '@/types/feed';
import { toast } from 'sonner';

export const useFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar posts do feed
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('feed')
        .select(`
          *,
          user:user_id (
            id,
            name:raw_user_meta_data->name,
            email,
            avatar_url:raw_user_meta_data->avatar_url
          ),
          profile:user_id!profiles!user_id (
            avatar_url
          ),
          likes_count:feed_likes(count),
          comments_count:feed_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Verificar quais posts o usuário curtiu
      if (user && data) {
        const postIds = data.map(post => post.id);
        const { data: userLikes } = await supabase
          .from('feed_likes')
          .select('feed_id')
          .in('feed_id', postIds)
          .eq('user_id', user.id);

        const likedPostIds = new Set(userLikes?.map(like => like.feed_id) || []);

        const postsWithLikes = data.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          likes_count: post.likes_count?.[0]?.count || 0,
          comments_count: post.comments_count?.[0]?.count || 0,
          user: {
            ...post.user,
            avatar_url: post.profile?.avatar_url || post.user?.avatar_url
          }
        }));

        setPosts(postsWithLikes);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Criar novo post
  const createPost = useCallback(async (postData: CreateFeedPostData) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setLoading(true);
      let mediaUrl: string | undefined;

      // Upload de mídia se necessário
      if (postData.media_file) {
        const fileExt = postData.media_file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feed-media')
          .upload(fileName, postData.media_file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('feed-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      // Criar post no banco
      const { data, error: insertError } = await supabase
        .from('feed')
        .insert({
          user_id: user.id,
          type: postData.type,
          content: postData.content,
          media_url: mediaUrl,
          event_date: postData.event_date
        })
        .select(`
          *,
          user:user_id (
            id,
            name:raw_user_meta_data->name,
            email,
            avatar_url:raw_user_meta_data->avatar_url
          ),
          profile:user_id!profiles!user_id (
            avatar_url
          )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      // Adicionar ao estado local
      const newPost: FeedPost = {
        ...data,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
        user: {
          ...data.user,
          avatar_url: data.profile?.avatar_url || data.user?.avatar_url
        }
      };

      setPosts(prev => [newPost, ...prev]);
      
      toast.success('Post criado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar post';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Curtir/descurtir post
  const toggleLike = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para curtir posts');
      return;
    }

    try {
      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('feed_likes')
        .select('id')
        .eq('feed_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Descurtir
        const { error } = await supabase
          .from('feed_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: false, 
                likes_count: Math.max(0, (post.likes_count || 0) - 1) 
              }
            : post
        ));
      } else {
        // Curtir
        const { error } = await supabase
          .from('feed_likes')
          .insert({
            feed_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: true, 
                likes_count: (post.likes_count || 0) + 1 
              }
            : post
        ));
      }
    } catch (err) {
      console.error('Erro ao curtir post:', err);
      toast.error('Erro ao curtir post');
    }
  }, [user]);

  // Buscar comentários de um post
  const fetchComments = useCallback(async (postId: string): Promise<FeedComment[]> => {
    try {
      console.log('💬 Buscando comentários para post:', postId);

      const { data, error } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('feed_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar comentários:', error);
        throw error;
      }

      console.log('✅ Comentários encontrados:', data?.length || 0);

      // Buscar dados dos usuários
      const userIds = [...new Set(data?.map(comment => comment.user_id) || [])];
      let usersData: any[] = [];

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, raw_user_meta_data')
          .in('id', userIds);

        if (!usersError && users) {
          usersData = users;
        } else {
          console.warn('Não foi possível buscar dados de usuários:', usersError?.message);
        }
      }

      // Processar comentários com dados do usuário
      const processedComments = data?.map(comment => {
        const userData = usersData?.find(u => u.id === comment.user_id);
        const isCurrentUser = user && comment.user_id === user.id;
        
        const authorName = isCurrentUser
          ? (user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário')
          : (userData?.raw_user_meta_data?.name || 'Usuário');
        const authorAvatar = isCurrentUser
          ? user.user_metadata?.avatar_url
          : userData?.raw_user_meta_data?.avatar_url;

        return {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user: {
            id: comment.user_id,
            name: authorName,
            avatar_url: authorAvatar
          }
        };
      }) || [];

      return processedComments;
    } catch (err) {
      console.error('❌ Erro ao buscar comentários:', err);
      return [];
    }
  }, [user]);

  // Adicionar comentário
  const addComment = useCallback(async (postId: string, commentData: CreateCommentData) => {
    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    try {
      console.log('💬 Adicionando comentário:', { postId, content: commentData.content, user: user.id });

      const { data, error } = await supabase
        .from('feed_comments')
        .insert({
          feed_id: postId,
          user_id: user.id,
          content: commentData.content
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir comentário:', error);
        throw error;
      }

      console.log('✅ Comentário inserido com sucesso:', data);

      // Atualizar contador de comentários
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments_count: (post.comments_count || 0) + 1 
            }
          : post
      ));

      toast.success('Comentário adicionado!');
      return data;
    } catch (err) {
      console.error('❌ Erro ao adicionar comentário:', err);
      toast.error('Erro ao adicionar comentário');
      throw err;
    }
  }, [user]);

  // Deletar post
  const deletePost = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para deletar posts');
      return;
    }

    try {
      // Verificar se o usuário é o dono do post
      const post = posts.find(p => p.id === postId);
      if (!post || post.user_id !== user.id) {
        toast.error('Você só pode deletar seus próprios posts');
        return;
      }

      const { error } = await supabase
        .from('feed')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== postId));
      toast.success('Post deletado com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar post:', err);
      toast.error('Erro ao deletar post');
    }
  }, [user, posts]);

  // Carregar posts na inicialização
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    createPost,
    toggleLike,
    fetchComments,
    addComment,
    deletePost,
    refetch: fetchPosts
  };
};
