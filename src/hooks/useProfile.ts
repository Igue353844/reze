import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async ({ displayName, avatarUrl }: { displayName?: string; avatarUrl?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updates: Partial<Profile> = {};
      if (displayName !== undefined) updates.display_name = displayName;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

      if (profile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Perfil atualizado!');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatarUrl: publicUrl });

      return publicUrl;
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da foto');
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
    uploadAvatar,
  };
}
