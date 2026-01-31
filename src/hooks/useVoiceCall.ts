import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface VoiceCallState {
  isInCall: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  participants: VoiceParticipant[];
  audioLevel: number;
}

interface VoiceParticipant {
  id: string;
  displayName: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export function useVoiceCall(partyId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<VoiceCallState>({
    isInCall: false,
    isMuted: false,
    isSpeaking: false,
    participants: [],
    audioLevel: 0,
  });
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  // Clean up function
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    // Remove all audio elements
    audioElementsRef.current.forEach(audio => {
      audio.srcObject = null;
      audio.remove();
    });
    audioElementsRef.current.clear();
    
    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Start voice call
  const joinCall = useCallback(async () => {
    if (!partyId || !user) return;
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      localStreamRef.current = stream;
      
      // Set up audio analysis for speaking detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start audio level monitoring
      const checkAudioLevel = () => {
        if (!analyserRef.current || !state.isInCall) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const isSpeaking = average > 30;
        
        setState(prev => ({
          ...prev,
          audioLevel: average,
          isSpeaking,
        }));
        
        if (state.isInCall) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
      // Set up presence channel for signaling
      const channel = supabase.channel(`voice-${partyId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });
      
      channelRef.current = channel;
      
      // Handle presence events
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const participants: VoiceParticipant[] = Object.entries(state).map(([userId, presences]) => {
            const presence = (presences as any[])[0];
            return {
              id: userId,
              displayName: presence?.displayName || 'Unknown',
              isMuted: presence?.isMuted || false,
              isSpeaking: presence?.isSpeaking || false,
            };
          });
          setState(prev => ({ ...prev, participants }));
        })
        .on('presence', { event: 'join' }, async ({ key, newPresences }) => {
          if (key === user.id) return;
          
          // Create peer connection for new participant
          await createPeerConnection(key, true);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          // Clean up peer connection when participant leaves
          const pc = peerConnectionsRef.current.get(key);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(key);
          }
          
          const audio = audioElementsRef.current.get(key);
          if (audio) {
            audio.srcObject = null;
            audio.remove();
            audioElementsRef.current.delete(key);
          }
        })
        .on('broadcast', { event: 'signal' }, async ({ payload }) => {
          if (payload.targetId !== user.id) return;
          
          const { senderId, type, data } = payload;
          
          let pc = peerConnectionsRef.current.get(senderId);
          
          if (type === 'offer') {
            if (!pc) {
              pc = await createPeerConnection(senderId, false);
            }
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                senderId: user.id,
                targetId: senderId,
                type: 'answer',
                data: answer,
              },
            });
          } else if (type === 'answer' && pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
          } else if (type === 'ice-candidate' && pc) {
            await pc.addIceCandidate(new RTCIceCandidate(data));
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const displayName = user.email?.split('@')[0] || 'User';
            await channel.track({
              displayName,
              isMuted: false,
              isSpeaking: false,
              online_at: new Date().toISOString(),
            });
            
            setState(prev => ({ ...prev, isInCall: true }));
            checkAudioLevel();
          }
        });
      
      toast.success('Conectado à chamada de voz');
    } catch (error) {
      console.error('Error joining voice call:', error);
      if ((error as Error).name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada');
      } else {
        toast.error('Erro ao entrar na chamada');
      }
      cleanup();
    }
  }, [partyId, user, state.isInCall, cleanup]);

  // Create peer connection
  const createPeerConnection = useCallback(async (peerId: string, initiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    
    peerConnectionsRef.current.set(peerId, pc);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.srcObject = event.streams[0];
      document.body.appendChild(audio);
      audioElementsRef.current.set(peerId, audio);
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current && user) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            senderId: user.id,
            targetId: peerId,
            type: 'ice-candidate',
            data: event.candidate,
          },
        });
      }
    };
    
    // Create offer if initiator
    if (initiator && channelRef.current && user) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          senderId: user.id,
          targetId: peerId,
          type: 'offer',
          data: offer,
        },
      });
    }
    
    return pc;
  }, [user]);

  // Leave voice call
  const leaveCall = useCallback(async () => {
    cleanup();
    setState({
      isInCall: false,
      isMuted: false,
      isSpeaking: false,
      participants: [],
      audioLevel: 0,
    });
    toast.success('Saiu da chamada de voz');
  }, [cleanup]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const isMuted = !audioTrack.enabled;
      
      setState(prev => ({ ...prev, isMuted }));
      
      // Update presence
      if (channelRef.current) {
        const displayName = user?.email?.split('@')[0] || 'User';
        await channelRef.current.track({
          displayName,
          isMuted,
          isSpeaking: false,
          online_at: new Date().toISOString(),
        });
      }
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isInCall: state.isInCall,
    isMuted: state.isMuted,
    isSpeaking: state.isSpeaking,
    participants: state.participants,
    audioLevel: state.audioLevel,
    joinCall,
    leaveCall,
    toggleMute,
  };
}
