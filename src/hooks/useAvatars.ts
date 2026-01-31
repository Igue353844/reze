import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AvatarSection {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Avatar {
  id: string;
  section_id: string;
  emoji: string;
  name: string;
  bg_class: string;
  display_order: number;
  created_at: string;
}

export function useAvatars() {
  const queryClient = useQueryClient();

  // Fetch all sections with their avatars
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['avatar-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatar_sections')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as AvatarSection[];
    },
  });

  const { data: avatars, isLoading: avatarsLoading } = useQuery({
    queryKey: ['avatars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Avatar[];
    },
  });

  // Create section
  const createSection = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const maxOrder = sections?.reduce((max, s) => Math.max(max, s.display_order), 0) || 0;
      
      const { data, error } = await supabase
        .from('avatar_sections')
        .insert({ name, slug, display_order: maxOrder + 1 })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-sections'] });
      toast.success('Seção criada!');
    },
    onError: () => {
      toast.error('Erro ao criar seção');
    },
  });

  // Update section
  const updateSection = useMutation({
    mutationFn: async ({ id, name, slug }: { id: string; name: string; slug: string }) => {
      const { error } = await supabase
        .from('avatar_sections')
        .update({ name, slug })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-sections'] });
      toast.success('Seção atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar seção');
    },
  });

  // Delete section
  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avatar_sections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-sections'] });
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      toast.success('Seção excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir seção');
    },
  });

  // Create avatar
  const createAvatar = useMutation({
    mutationFn: async ({ sectionId, emoji, name, bgClass }: { 
      sectionId: string; 
      emoji: string; 
      name: string; 
      bgClass: string;
    }) => {
      const sectionAvatars = avatars?.filter(a => a.section_id === sectionId) || [];
      const maxOrder = sectionAvatars.reduce((max, a) => Math.max(max, a.display_order), 0);
      
      const { data, error } = await supabase
        .from('avatars')
        .insert({ 
          section_id: sectionId, 
          emoji, 
          name, 
          bg_class: bgClass,
          display_order: maxOrder + 1 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      toast.success('Avatar criado!');
    },
    onError: () => {
      toast.error('Erro ao criar avatar');
    },
  });

  // Update avatar
  const updateAvatar = useMutation({
    mutationFn: async ({ id, emoji, name, bgClass }: { 
      id: string; 
      emoji: string; 
      name: string; 
      bgClass: string;
    }) => {
      const { error } = await supabase
        .from('avatars')
        .update({ emoji, name, bg_class: bgClass })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      toast.success('Avatar atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar avatar');
    },
  });

  // Delete avatar
  const deleteAvatar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avatars')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      toast.success('Avatar excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir avatar');
    },
  });

  // Helper to get avatars by section
  const getAvatarsBySection = (sectionId: string) => {
    return avatars?.filter(a => a.section_id === sectionId) || [];
  };

  return {
    sections,
    avatars,
    isLoading: sectionsLoading || avatarsLoading,
    createSection,
    updateSection,
    deleteSection,
    createAvatar,
    updateAvatar,
    deleteAvatar,
    getAvatarsBySection,
  };
}
