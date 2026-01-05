import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Season, Episode, SeasonWithEpisodes } from '@/types/video';

export function useSeasons(videoId: string) {
  return useQuery({
    queryKey: ['seasons', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('video_id', videoId)
        .order('season_number', { ascending: true });
      
      if (error) throw error;
      return data as Season[];
    },
    enabled: !!videoId,
  });
}

export function useSeasonsWithEpisodes(videoId: string) {
  return useQuery({
    queryKey: ['seasons', 'with-episodes', videoId],
    queryFn: async () => {
      const { data: seasons, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .eq('video_id', videoId)
        .order('season_number', { ascending: true });
      
      if (seasonsError) throw seasonsError;
      if (!seasons || seasons.length === 0) return [];

      const seasonIds = seasons.map(s => s.id);
      const { data: episodes, error: episodesError } = await supabase
        .from('episodes')
        .select('*')
        .in('season_id', seasonIds)
        .order('episode_number', { ascending: true });
      
      if (episodesError) throw episodesError;

      const seasonsWithEpisodes: SeasonWithEpisodes[] = seasons.map(season => ({
        ...season,
        episodes: (episodes || []).filter(ep => ep.season_id === season.id) as Episode[],
      }));

      return seasonsWithEpisodes;
    },
    enabled: !!videoId,
  });
}

export function useEpisodes(seasonId: string) {
  return useQuery({
    queryKey: ['episodes', seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('season_id', seasonId)
        .order('episode_number', { ascending: true });
      
      if (error) throw error;
      return data as Episode[];
    },
    enabled: !!seasonId,
  });
}

interface CreateSeasonData {
  video_id: string;
  season_number: number;
  title?: string;
  poster_url?: string;
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (season: CreateSeasonData) => {
      const { data, error } = await supabase
        .from('seasons')
        .insert(season)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seasons', variables.video_id] });
      queryClient.invalidateQueries({ queryKey: ['seasons', 'with-episodes', variables.video_id] });
    },
  });
}

export function useDeleteSeason() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, videoId }: { id: string; videoId: string }) => {
      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return videoId;
    },
    onSuccess: (videoId) => {
      queryClient.invalidateQueries({ queryKey: ['seasons', videoId] });
      queryClient.invalidateQueries({ queryKey: ['seasons', 'with-episodes', videoId] });
    },
  });
}

interface CreateEpisodeData {
  season_id: string;
  episode_number: number;
  title: string;
  description?: string;
  duration_minutes?: number;
  poster_url?: string;
  banner_url?: string;
  video_url?: string;
}

export function useCreateEpisode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (episode: CreateEpisodeData) => {
      const { data, error } = await supabase
        .from('episodes')
        .insert(episode)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['episodes', variables.season_id] });
      queryClient.invalidateQueries({ queryKey: ['seasons', 'with-episodes'] });
    },
  });
}

interface UpdateEpisodeData {
  id: string;
  seasonId: string;
  episode_number?: number;
  title?: string;
  description?: string;
  duration_minutes?: number;
  poster_url?: string;
  banner_url?: string;
  video_url?: string;
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, seasonId, ...data }: UpdateEpisodeData) => {
      const { data: result, error } = await supabase
        .from('episodes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { result, seasonId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['episodes', data.seasonId] });
      queryClient.invalidateQueries({ queryKey: ['seasons', 'with-episodes'] });
    },
  });
}

export function useDeleteEpisode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, seasonId }: { id: string; seasonId: string }) => {
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return seasonId;
    },
    onSuccess: (seasonId) => {
      queryClient.invalidateQueries({ queryKey: ['episodes', seasonId] });
      queryClient.invalidateQueries({ queryKey: ['seasons', 'with-episodes'] });
    },
  });
}
