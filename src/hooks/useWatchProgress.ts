import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback, useRef } from 'react';

export interface WatchProgress {
  id: string;
  user_id: string;
  video_id: string;
  episode_id: string | null;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched_at: string;
  created_at: string;
}

export interface WatchProgressWithVideo extends WatchProgress {
  videos: {
    id: string;
    title: string;
    slug: string;
    poster_url: string | null;
    type: 'movie' | 'series' | 'trailer';
    duration_minutes: number | null;
  };
  episodes?: {
    id: string;
    title: string;
    episode_number: number;
    season_id: string;
    seasons?: {
      season_number: number;
    };
  } | null;
}

// Hook to get all watch progress for continue watching section
export function useContinueWatching() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watch-progress', 'continue-watching', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watch_progress')
        .select(`
          *,
          videos (
            id,
            title,
            slug,
            poster_url,
            type,
            duration_minutes
          ),
          episodes (
            id,
            title,
            episode_number,
            season_id,
            seasons (
              season_number
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('last_watched_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching watch progress:', error);
        throw error;
      }

      return data as unknown as WatchProgressWithVideo[];
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook to get watch progress for a specific video/episode
export function useVideoProgress(videoId: string | undefined, episodeId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watch-progress', videoId, episodeId, user?.id],
    queryFn: async () => {
      if (!user || !videoId) return null;

      let query = supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (episodeId) {
        query = query.eq('episode_id', episodeId);
      } else {
        query = query.is('episode_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching video progress:', error);
        return null;
      }

      return data as WatchProgress | null;
    },
    enabled: !!user && !!videoId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to save watch progress
export function useSaveProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastSaveRef = useRef<number>(0);

  const mutation = useMutation({
    mutationFn: async ({
      videoId,
      episodeId,
      progressSeconds,
      durationSeconds,
    }: {
      videoId: string;
      episodeId?: string | null;
      progressSeconds: number;
      durationSeconds: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Mark as completed if progress is > 90% of duration
      const completed = durationSeconds > 0 && progressSeconds / durationSeconds > 0.9;

      const { data, error } = await supabase
        .from('watch_progress')
        .upsert(
          {
            user_id: user.id,
            video_id: videoId,
            episode_id: episodeId || null,
            progress_seconds: Math.floor(progressSeconds),
            duration_seconds: Math.floor(durationSeconds),
            completed,
            last_watched_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,video_id,episode_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving watch progress:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['watch-progress', 'continue-watching'] });
      queryClient.invalidateQueries({ queryKey: ['watch-progress', variables.videoId] });
    },
  });

  // Throttled save function - only save every 10 seconds
  const saveProgress = useCallback(
    (params: Parameters<typeof mutation.mutate>[0]) => {
      const now = Date.now();
      if (now - lastSaveRef.current < 10000) return; // 10 seconds throttle
      
      lastSaveRef.current = now;
      mutation.mutate(params);
    },
    [mutation]
  );

  // Force save function - bypasses throttle (for unmount/pause)
  const forceSaveProgress = useCallback(
    (params: Parameters<typeof mutation.mutate>[0]) => {
      lastSaveRef.current = Date.now();
      mutation.mutate(params);
    },
    [mutation]
  );

  return {
    saveProgress,
    forceSaveProgress,
    isSaving: mutation.isPending,
  };
}
