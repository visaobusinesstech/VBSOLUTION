import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  author: {
    name: string;
    initials: string;
  };
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  type: 'text' | 'image' | 'video' | 'event';
  isLiked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  eventData?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
  postComments?: Comment[];
}

export const usePosts = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [profile.avatar_url]); // Recarregar quando o avatar mudar

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Tentando buscar posts do Supabase...');

      // Verificar se as tabelas existem primeiro
      const { data: tableCheck, error: tableError } = await supabase
        .from('feed')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('❌ Erro ao acessar tabela feed:', tableError);
        throw new Error('Tabela feed não existe. Execute o script SQL no Supabase primeiro.');
      }

      // Buscar posts do Supabase
      const { data, error: fetchError } = await supabase
        .from('feed')
        .select(`
          id,
          user_id,
          type,
          content,
          media_url,
          event_date,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Erro ao buscar posts:', fetchError);
        throw fetchError;
      }

      console.log('✅ Posts encontrados:', data?.length || 0);

      // Buscar dados dos usuários que fizeram os posts da tabela profiles
      const userIds = [...new Set(data?.map(post => post.user_id) || [])];
      let usersData: any[] = [];

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .in('id', userIds);

        if (!profilesError && profiles) {
          usersData = profiles;
          console.log('✅ Dados dos perfis encontrados:', profiles.length);
        } else {
          console.warn('Não foi possível buscar dados de perfis:', profilesError?.message);
        }
      }

      // Buscar curtidas do usuário atual
      let userLikes: string[] = [];
      if (user && data && data.length > 0) {
        const postIds = data.map(post => post.id);
        const { data: likesData } = await supabase
          .from('feed_likes')
          .select('feed_id')
          .in('feed_id', postIds)
          .eq('user_id', user.id);
        
        userLikes = likesData?.map(like => like.feed_id) || [];
      }

      // Buscar contadores de curtidas e comentários
      const postIds = data?.map(post => post.id) || [];
      const { data: likesCount } = await supabase
        .from('feed_likes')
        .select('feed_id')
        .in('feed_id', postIds);

      const { data: commentsCount } = await supabase
        .from('feed_comments')
        .select('feed_id')
        .in('feed_id', postIds);

      // Buscar comentários para todos os posts
      const { data: commentsData } = await supabase
        .from('feed_comments')
        .select('*')
        .in('feed_id', postIds)
        .order('created_at', { ascending: true });

      // Processar posts
      const processedPosts = data?.map(post => {
        const likes = likesCount?.filter(like => like.feed_id === post.id).length || 0;
        const comments = commentsCount?.filter(comment => comment.feed_id === post.id).length || 0;

        // Usar dados do usuário que fez o post
        const isCurrentUser = user && post.user_id === user.id;
        const userData = usersData?.find(u => u.id === post.user_id);
        
        const authorName = isCurrentUser 
          ? (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário')
          : (userData?.name || userData?.email?.split('@')[0] || 'Usuário');
        
        const authorAvatar = isCurrentUser
          ? (profile.avatar_url || user.user_metadata?.avatar_url || userData?.avatar_url)
          : userData?.avatar_url;

        // Buscar comentários deste post
        const postComments = commentsData
          ?.filter(comment => comment.feed_id === post.id)
          .map(comment => {
            const isCommentFromCurrentUser = user && comment.user_id === user.id;
            const commentUserData = usersData?.find(u => u.id === comment.user_id);
            
            const commentAuthorName = isCommentFromCurrentUser
              ? (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário')
              : (commentUserData?.name || commentUserData?.email?.split('@')[0] || 'Usuário');
            const commentAuthorInitials = isCommentFromCurrentUser
              ? (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'U').substring(0, 1).toUpperCase()
              : (commentUserData?.name || commentUserData?.email?.split('@')[0] || 'U').substring(0, 1).toUpperCase();

            return {
              id: comment.id,
              author: {
                name: commentAuthorName,
                initials: commentAuthorInitials
              },
              content: comment.content,
              timestamp: formatTimeAgo(comment.created_at)
            };
          }) || [];

        return {
          id: post.id,
          author: {
            name: authorName,
            avatar: authorAvatar,
            role: 'Membro da Equipe'
          },
          content: post.content || '',
          timestamp: formatTimeAgo(post.created_at),
          likes,
          comments,
          type: post.type as 'text' | 'image' | 'video' | 'event',
          isLiked: userLikes.includes(post.id),
          imageUrl: post.type === 'image' ? post.media_url : undefined,
          videoUrl: post.type === 'video' ? post.media_url : undefined,
          eventData: post.type === 'event' && post.event_date ? {
            title: post.content || 'Evento',
            date: new Date(post.event_date).toLocaleDateString('pt-BR'),
            time: new Date(post.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            location: ''
          } : undefined,
          postComments
        };
      }) || [];

      setPosts(processedPosts);

    } catch (error) {
      console.error('❌ Erro ao buscar posts:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar posts');
      
      // Se for erro de tabela não existir, mostrar mensagem específica
      if (error instanceof Error && error.message.includes('Tabela feed não existe')) {
        toast.error('Execute o script SQL no Supabase primeiro!');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return postDate.toLocaleDateString('pt-BR');
  };

  const createPost = async (
    content: string, 
    type: 'text' | 'image' | 'video' | 'event' = 'text', 
    mediaFile?: File, 
    eventData?: any
  ) => {
    if (!user) {
      toast.error('Você precisa estar logado para criar posts');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Criando post...', { content, type, user: user.id });
      
      let mediaUrl: string | undefined;
      
      // Upload de mídia se necessário
      if (mediaFile) {
        console.log('📤 Fazendo upload de mídia...');
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feed-media')
          .upload(fileName, mediaFile);

        if (uploadError) {
          console.error('❌ Erro no upload:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('feed-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        console.log('✅ Upload concluído:', publicUrl);
      }

      // Criar post no Supabase
      const postData = {
        user_id: user.id,
        type: type, // Usar o tipo correto
        content: content,
        media_url: mediaUrl,
        event_date: type === 'event' && eventData ? new Date(`${eventData.date}T${eventData.time}`).toISOString() : null
      };

      console.log('💾 Salvando no banco:', postData);

      const { data, error: insertError } = await supabase
        .from('feed')
        .insert(postData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir post:', insertError);
        throw insertError;
      }

      console.log('✅ Post criado com sucesso:', data);

      // Atualizar estado local
      const newPost: Post = {
        id: data.id,
        author: {
          name: profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          avatar: profile.avatar_url || user.user_metadata?.avatar_url,
          role: 'Membro da Equipe'
        },
        content: data.content || '',
        timestamp: 'agora',
        likes: 0,
        comments: 0,
        type: data.type as 'text' | 'image' | 'video' | 'event',
        isLiked: false,
        imageUrl: data.type === 'image' ? data.media_url : undefined,
        videoUrl: data.type === 'video' ? data.media_url : undefined,
        eventData: data.type === 'event' && data.event_date ? {
          title: data.content || 'Evento',
          date: new Date(data.event_date).toLocaleDateString('pt-BR'),
          time: new Date(data.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          location: ''
        } : undefined,
        postComments: []
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);
      toast.success('Post criado com sucesso!');
      return newPost;
    } catch (err) {
      console.error('❌ Erro ao criar post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar post';
      setError(errorMessage);
      toast.error(`Erro ao criar post: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string) => {
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
                isLiked: false, 
                likes: Math.max(0, post.likes - 1) 
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
                isLiked: true, 
                likes: post.likes + 1 
              }
            : post
        ));
      }
    } catch (err) {
      console.error('Erro ao curtir post:', err);
      setError(err instanceof Error ? err.message : 'Erro ao curtir post');
    }
  };

  const addComment = async (postId: string, comment: Comment) => {
    if (!user) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    try {
      console.log('💬 Adicionando comentário:', { postId, content: comment.content, user: user.id });

      const { data, error } = await supabase
        .from('feed_comments')
        .insert({
          feed_id: postId,
          user_id: user.id,
          content: comment.content
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir comentário:', error);
        throw error;
      }

      console.log('✅ Comentário inserido com sucesso:', data);

      const newComment: Comment = {
        id: data.id,
        author: {
          name: profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          initials: (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'U').substring(0, 1).toUpperCase()
        },
        content: data.content,
        timestamp: 'agora'
      };

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments + 1,
              postComments: [...(post.postComments || []), newComment]
            };
          }
          return post;
        })
      );

      toast.success('Comentário adicionado!');
    } catch (err) {
      console.error('❌ Erro ao adicionar comentário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário');
      toast.error('Erro ao adicionar comentário');
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para deletar posts');
      return;
    }

    try {
      const { error } = await supabase
        .from('feed')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success('Post deletado com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar post:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar post');
      toast.error('Erro ao deletar post');
    }
  };

  const getPostComments = (postId: string): Comment[] => {
    const post = posts.find(p => p.id === postId);
    return post?.postComments || [];
  };

  return {
    posts,
    loading,
    error,
    createPost,
    likePost,
    addComment,
    deletePost,
    getPostComments
  };
};