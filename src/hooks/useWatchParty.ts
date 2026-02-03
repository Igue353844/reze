import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { WatchParty, WatchPartyParticipant, WatchPartyMessage } from '@/types/watchParty';

interface NextEpisodeInfo {
  id: string;
  title: string;
  episode_number: number;
  video_url: string | null;
}

export function useWatchParty(partyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<WatchPartyParticipant[]>([]);
  const [messages, setMessages] = useState<WatchPartyMessage[]>([]);
  const [currentParty, setCurrentParty] = useState<WatchParty | null>(null);
  const [nextEpisode, setNextEpisode] = useState<NextEpisodeInfo | null>(null);

  // Fetch party details
  const { data: party, isLoading } = useQuery({
    queryKey: ['watchParty', partyId],
    queryFn: async () => {
      if (!partyId) return null;
      const { data, error } = await supabase
        .from('watch_parties')
        .select('*, videos(id, title, poster_url, video_url), episodes(id, title, video_url)')
        .eq('id', partyId)
        .single();
      
      if (error) throw error;
      return data as WatchParty;
    },
    enabled: !!partyId,
  });

  // Fetch participants
  const { data: initialParticipants } = useQuery({
    queryKey: ['watchPartyParticipants', partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data, error } = await supabase
        .from('watch_party_participants')
        .select('*')
        .eq('party_id', partyId);
      
      if (error) throw error;
      return data as WatchPartyParticipant[];
    },
    enabled: !!partyId,
  });

  // Fetch messages
  const { data: initialMessages } = useQuery({
    queryKey: ['watchPartyMessages', partyId],
    queryFn: async () => {
      if (!partyId) return [];
      const { data, error } = await supabase
        .from('watch_party_messages')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as WatchPartyMessage[];
    },
    enabled: !!partyId,
  });

  // Update local state when queries complete
  useEffect(() => {
    if (party) setCurrentParty(party);
  }, [party]);

  useEffect(() => {
    if (initialParticipants) setParticipants(initialParticipants);
  }, [initialParticipants]);

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // Fetch next episode when watching a series
  useEffect(() => {
    const fetchNextEpisode = async () => {
      if (!currentParty?.episode_id) {
        setNextEpisode(null);
        return;
      }

      // First, get the current episode to find its season and episode number
      const { data: currentEpisode, error: episodeError } = await supabase
        .from('episodes')
        .select('season_id, episode_number')
        .eq('id', currentParty.episode_id)
        .single();

      if (episodeError || !currentEpisode) {
        setNextEpisode(null);
        return;
      }

      // Try to find the next episode in the same season
      const { data: nextInSeason } = await supabase
        .from('episodes')
        .select('id, title, episode_number, video_url')
        .eq('season_id', currentEpisode.season_id)
        .eq('episode_number', currentEpisode.episode_number + 1)
        .single();

      if (nextInSeason) {
        setNextEpisode(nextInSeason);
        return;
      }

      // If no next episode in current season, try next season
      const { data: currentSeason } = await supabase
        .from('seasons')
        .select('video_id, season_number')
        .eq('id', currentEpisode.season_id)
        .single();

      if (!currentSeason) {
        setNextEpisode(null);
        return;
      }

      // Find next season
      const { data: nextSeason } = await supabase
        .from('seasons')
        .select('id')
        .eq('video_id', currentSeason.video_id)
        .eq('season_number', currentSeason.season_number + 1)
        .single();

      if (!nextSeason) {
        setNextEpisode(null);
        return;
      }

      // Get first episode of next season
      const { data: firstOfNextSeason } = await supabase
        .from('episodes')
        .select('id, title, episode_number, video_url')
        .eq('season_id', nextSeason.id)
        .order('episode_number', { ascending: true })
        .limit(1)
        .single();

      setNextEpisode(firstOfNextSeason || null);
    };

    fetchNextEpisode();
  }, [currentParty?.episode_id]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!partyId) return;

    // Subscribe to party updates (for sync)
    const partyChannel = supabase
      .channel(`party-${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'watch_parties',
          filter: `id=eq.${partyId}`,
        },
        (payload) => {
          setCurrentParty(prev => prev ? { ...prev, ...payload.new } : payload.new as WatchParty);
        }
      )
      .subscribe();

    // Subscribe to participants
    const participantsChannel = supabase
      .channel(`participants-${partyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watch_party_participants',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [...prev, payload.new as WatchPartyParticipant]);
          } else if (payload.eventType === 'DELETE') {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to messages
    const messagesChannel = supabase
      .channel(`messages-${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watch_party_messages',
          filter: `party_id=eq.${partyId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as WatchPartyMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(partyChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [partyId]);

  // Create party
  const createParty = useMutation({
    mutationFn: async ({ name, videoId, episodeId, customUrl, customTitle }: { 
      name: string; 
      videoId?: string; 
      episodeId?: string;
      customUrl?: string;
      customTitle?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Generate unique code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('watch_parties')
        .insert({
          host_id: user.id,
          video_id: videoId || null,
          episode_id: episodeId || null,
          custom_url: customUrl || null,
          custom_title: customTitle || null,
          name,
          code,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add host as participant
      await supabase
        .from('watch_party_participants')
        .insert({
          party_id: data.id,
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Host',
          is_host: true,
        });
      
      return data;
    },
  });

  // Join party by code
  const joinParty = useMutation({
    mutationFn: async ({ code, displayName }: { code: string; displayName: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Find party by code
      const { data: party, error: findError } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (findError || !party) throw new Error('Party not found');
      
      // Check if already joined
      const { data: existing } = await supabase
        .from('watch_party_participants')
        .select('id')
        .eq('party_id', party.id)
        .eq('user_id', user.id)
        .single();
      
      if (!existing) {
        // Join party
        await supabase
          .from('watch_party_participants')
          .insert({
            party_id: party.id,
            user_id: user.id,
            display_name: displayName,
            is_host: false,
          });
      }
      
      return party;
    },
  });

  // Leave party
  const leaveParty = useMutation({
    mutationFn: async () => {
      if (!user || !partyId) throw new Error('Invalid state');
      
      await supabase
        .from('watch_party_participants')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', user.id);
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !partyId) throw new Error('Invalid state');
      
      const participant = participants.find(p => p.user_id === user.id);
      
      const { error } = await supabase
        .from('watch_party_messages')
        .insert({
          party_id: partyId,
          user_id: user.id,
          display_name: participant?.display_name || user.email?.split('@')[0] || 'Anonymous',
          message,
        });
      
      if (error) throw error;
    },
  });

  // Update playback state (host only)
  const updatePlayback = useCallback(async (currentTime: number, isPlaying: boolean) => {
    if (!user || !partyId || !currentParty) return;
    if (currentParty.host_id !== user.id) return;
    
    await supabase
      .from('watch_parties')
      .update({
        current_time_seconds: Math.floor(currentTime),
        is_playing: isPlaying,
      })
      .eq('id', partyId);
  }, [user, partyId, currentParty]);

  // End party (host only)
  const endParty = useMutation({
    mutationFn: async () => {
      if (!user || !partyId) throw new Error('Invalid state');
      
      await supabase
        .from('watch_parties')
        .update({ is_active: false })
        .eq('id', partyId)
        .eq('host_id', user.id);
    },
  });

  // Change to next episode (host only)
  const changeToNextEpisode = useMutation({
    mutationFn: async () => {
      if (!user || !partyId || !nextEpisode) throw new Error('Invalid state');
      if (currentParty?.host_id !== user.id) throw new Error('Only host can change episode');

      const { error } = await supabase
        .from('watch_parties')
        .update({ 
          episode_id: nextEpisode.id,
          current_time_seconds: 0,
          is_playing: false,
        })
        .eq('id', partyId)
        .eq('host_id', user.id);

      if (error) throw error;

      // Update local state immediately
      setCurrentParty(prev => prev ? {
        ...prev,
        episode_id: nextEpisode.id,
        current_time_seconds: 0,
        is_playing: false,
        episodes: {
          id: nextEpisode.id,
          title: nextEpisode.title,
          video_url: nextEpisode.video_url,
        }
      } : null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchParty', partyId] });
    },
  });

  const isHost = user?.id === currentParty?.host_id;
  const hasNextEpisode = !!nextEpisode;

  return {
    party: currentParty,
    participants,
    messages,
    isLoading,
    isHost,
    hasNextEpisode,
    nextEpisode,
    createParty,
    joinParty,
    leaveParty,
    sendMessage,
    updatePlayback,
    endParty,
    changeToNextEpisode,
  };
}

export function useMyParties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const partiesQuery = useQuery({
    queryKey: ['myWatchParties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('watch_parties')
        .select('*, videos(id, title, poster_url)')
        .eq('host_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WatchParty[];
    },
    enabled: !!user,
  });

  const deleteParty = useMutation({
    mutationFn: async (partyId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      // First verify the user is a participant (needed for RLS)
      const { data: participant, error: participantError } = await supabase
        .from('watch_party_participants')
        .select('id')
        .eq('party_id', partyId)
        .eq('user_id', user.id)
        .single();
      
      if (participantError || !participant) {
        // If not a participant, add them temporarily to satisfy RLS
        await supabase
          .from('watch_party_participants')
          .insert({
            party_id: partyId,
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
            is_host: false,
          });
      }
      
      // Delete all messages first
      const { error: msgError } = await supabase
        .from('watch_party_messages')
        .delete()
        .eq('party_id', partyId);
      
      if (msgError) {
        console.error('Error deleting messages:', msgError);
      }
      
      // Delete all participants
      const { error: partError } = await supabase
        .from('watch_party_participants')
        .delete()
        .eq('party_id', partyId);
      
      if (partError) {
        console.error('Error deleting participants:', partError);
      }
      
      // Delete the party
      const { error } = await supabase
        .from('watch_parties')
        .delete()
        .eq('id', partyId);
      
      if (error) {
        console.error('Error deleting party:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWatchParties', user?.id] });
    },
  });

  return {
    ...partiesQuery,
    deleteParty,
  };
}
