import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Video, Category, ContentType } from '@/types/video';

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Video[];
    },
  });
}

export function useFeaturedVideos() {
  return useQuery({
    queryKey: ['videos', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*, categories(*)')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Video[];
    },
  });
}

export function useVideosByCategory(categorySlug: string) {
  return useQuery({
    queryKey: ['videos', 'category', categorySlug],
    queryFn: async () => {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      
      if (!category) return [];
      
      const { data, error } = await supabase
        .from('videos')
        .select('*, categories(*)')
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Video[];
    },
    enabled: !!categorySlug,
  });
}

export function useVideo(slug: string) {
  return useQuery({
    queryKey: ['video', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*, categories(*)')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Video;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useSearchVideos(query: string) {
  return useQuery({
    queryKey: ['videos', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*, categories(*)')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Video[];
    },
    enabled: query.length >= 2,
  });
}

interface CreateVideoData {
  title: string;
  slug: string;
  description?: string;
  type: ContentType;
  year?: number;
  duration_minutes?: number;
  poster_url?: string;
  banner_url?: string;
  video_url?: string;
  is_featured?: boolean;
  category_id?: string;
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (video: CreateVideoData) => {
      const { data, error } = await supabase
        .from('videos')
        .insert(video)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}
