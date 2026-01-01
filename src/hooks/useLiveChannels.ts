import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveChannel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  stream_url: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLiveChannels() {
  return useQuery({
    queryKey: ['live-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_channels')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as LiveChannel[];
    },
  });
}

export function useLiveChannel(slug: string) {
  return useQuery({
    queryKey: ['live-channel', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_channels')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as LiveChannel;
    },
    enabled: !!slug,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: Omit<LiveChannel, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('live_channels')
        .insert(channel)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-channels'] });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LiveChannel> & { id: string }) => {
      const { data, error } = await supabase
        .from('live_channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-channels'] });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('live_channels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-channels'] });
    },
  });
}
