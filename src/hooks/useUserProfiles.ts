import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_id: string | null;
  avatar_url: string | null;
  is_kids: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const SELECTED_PROFILE_KEY = 'rezeflix-selected-profile';

export function useUserProfiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all profiles for current user
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['user-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!user?.id,
  });

  // Get selected profile from localStorage
  const getSelectedProfile = (): UserProfile | null => {
    const stored = localStorage.getItem(SELECTED_PROFILE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Set selected profile
  const setSelectedProfile = (profile: UserProfile | null) => {
    if (profile) {
      localStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(SELECTED_PROFILE_KEY);
    }
    queryClient.invalidateQueries({ queryKey: ['selected-profile'] });
  };

  // Create profile
  const createProfile = useMutation({
    mutationFn: async ({ name, avatarId, avatarUrl, isKids }: { 
      name: string; 
      avatarId?: string;
      avatarUrl?: string;
      isKids?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const maxOrder = profiles?.reduce((max, p) => Math.max(max, p.display_order), 0) || 0;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          name,
          avatar_id: avatarId || null,
          avatar_url: avatarUrl || null,
          is_kids: isKids || false,
          display_order: maxOrder + 1,
        })
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('Maximum of 5 profiles')) {
          throw new Error('Você já atingiu o limite de 5 perfis');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles', user?.id] });
      toast.success('Perfil criado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar perfil');
    },
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async ({ id, name, avatarId, avatarUrl, isKids }: { 
      id: string;
      name?: string; 
      avatarId?: string;
      avatarUrl?: string;
      isKids?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Partial<UserProfile> = {};
      if (name !== undefined) updateData.name = name;
      if (avatarId !== undefined) updateData.avatar_id = avatarId;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
      if (isKids !== undefined) updateData.is_kids = isKids;
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles', user?.id] });
      toast.success('Perfil atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });

  // Delete profile
  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Clear selected profile if it was deleted
      const selected = getSelectedProfile();
      if (selected?.id === id) {
        setSelectedProfile(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles', user?.id] });
      toast.success('Perfil excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir perfil');
    },
  });

  return {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getSelectedProfile,
    setSelectedProfile,
    canAddMore: (profiles?.length || 0) < 5,
  };
}
