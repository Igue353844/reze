import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FavoriteWithVideo {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
  videos: {
    id: string;
    title: string;
    slug: string;
    poster_url: string | null;
    banner_url: string | null;
    type: 'movie' | 'series' | 'trailer';
    year: number | null;
    description: string | null;
  };
}

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          videos (
            id,
            title,
            slug,
            poster_url,
            banner_url,
            type,
            year,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }

      return data as unknown as FavoriteWithVideo[];
    },
    enabled: !!user,
  });
}

export function useIsFavorite(videoId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorite', videoId, user?.id],
    queryFn: async () => {
      if (!user || !videoId) return false;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle();

      if (error) {
        console.error('Error checking favorite:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user && !!videoId,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, isFavorite }: { videoId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);

        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            video_id: videoId,
          });

        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite', variables.videoId] });
    },
  });
}
