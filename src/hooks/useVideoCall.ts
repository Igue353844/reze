import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CallState {
  isInCall: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  participants: CallParticipant[];
  audioLevel: number;
  // Add version counter to force re-renders when streams change
  streamVersion: number;
}

interface CallParticipant {
  id: string;
  displayName: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export function useVideoCall(partyId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<CallState>({
    isInCall: false,
    isMuted: false,
    isVideoEnabled: false,
    isScreenSharing: false,
    isSpeaking: false,
    participants: [],
    audioLevel: 0,
    streamVersion: 0,
  });
  
  // Use state for remote streams to trigger re-renders
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [remoteScreenShares, setRemoteScreenShares] = useState<Map<string, MediaStream>>(new Map());
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Set video container ref
  const setVideoContainer = useCallback((container: HTMLDivElement | null) => {
    videoContainerRef.current = container;
  }, []);

  // Set local video ref
  const setLocalVideoRef = useCallback((video: HTMLVideoElement | null) => {
    localVideoRef.current = video;
    if (video && localStreamRef.current) {
      video.srcObject = localStreamRef.current;
    }
  }, []);

  // Get remote streams
  const getRemoteStreams = useCallback(() => {
    return remoteStreams;
  }, [remoteStreams]);

  // Get screen share streams
  const getScreenShareStreams = useCallback(() => {
    return remoteScreenShares;
  }, [remoteScreenShares]);
  
  // Clean up function
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop screen share stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    // Clear remote streams
    setRemoteStreams(new Map());
    setRemoteScreenShares(new Map());
    
    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Join call with optional video
  const joinCall = useCallback(async (withVideo: boolean = false) => {
    if (!partyId || !user) return;
    
    try {
      // Request media access
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      if (withVideo) {
        constraints.video = {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
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
      const channel = supabase.channel(`video-call-${partyId}`, {
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
          const presenceState = channel.presenceState();
          const participants: CallParticipant[] = Object.entries(presenceState).map(([userId, presences]) => {
            const presence = (presences as any[])[0];
            return {
              id: userId,
              displayName: presence?.displayName || 'Unknown',
              isMuted: presence?.isMuted || false,
              isVideoEnabled: presence?.isVideoEnabled || false,
              isScreenSharing: presence?.isScreenSharing || false,
              isSpeaking: presence?.isSpeaking || false,
            };
          });
          setState(prev => ({ ...prev, participants }));
        })
        .on('presence', { event: 'join' }, async ({ key }) => {
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
          
          setRemoteStreams(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          setRemoteScreenShares(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          setState(prev => ({ ...prev, streamVersion: prev.streamVersion + 1 })); // Trigger re-render
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
              isVideoEnabled: withVideo,
              isScreenSharing: false,
              isSpeaking: false,
              online_at: new Date().toISOString(),
            });
            
            setState(prev => ({ 
              ...prev, 
              isInCall: true,
              isVideoEnabled: withVideo,
            }));
            checkAudioLevel();
          }
        });
      
      toast.success(withVideo ? 'Conectado à chamada de vídeo' : 'Conectado à chamada de voz');
    } catch (error) {
      console.error('Error joining call:', error);
      if ((error as Error).name === 'NotAllowedError') {
        toast.error('Permissão de mídia negada');
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

    // Add screen share tracks if sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, screenStreamRef.current!);
      });
    }
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      // Check if it's a screen share stream (video track with specific label pattern)
      const isScreenShare = event.track.kind === 'video' && 
        (event.track.label.includes('screen') || event.track.label.includes('window') || event.track.label.includes('monitor'));
      
      if (isScreenShare) {
        setRemoteScreenShares(prev => {
          const next = new Map(prev);
          next.set(peerId, stream);
          return next;
        });
      } else {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(peerId, stream);
          return next;
        });
      }
      setState(prev => ({ ...prev, streamVersion: prev.streamVersion + 1 })); // Trigger re-render
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

  // Leave call
  const leaveCall = useCallback(async () => {
    cleanup();
    setRemoteStreams(new Map());
    setRemoteScreenShares(new Map());
    setState({
      isInCall: false,
      isMuted: false,
      isVideoEnabled: false,
      isScreenSharing: false,
      isSpeaking: false,
      participants: [],
      audioLevel: 0,
      streamVersion: 0,
    });
    toast.success('Saiu da chamada');
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
          isVideoEnabled: state.isVideoEnabled,
          isScreenSharing: state.isScreenSharing,
          isSpeaking: false,
          online_at: new Date().toISOString(),
        });
      }
    }
  }, [user, state.isVideoEnabled, state.isScreenSharing]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    
    if (videoTrack) {
      // Toggle existing video track
      videoTrack.enabled = !videoTrack.enabled;
      const isVideoEnabled = videoTrack.enabled;
      
      setState(prev => ({ ...prev, isVideoEnabled }));
      
      // Update presence
      if (channelRef.current) {
        const displayName = user?.email?.split('@')[0] || 'User';
        await channelRef.current.track({
          displayName,
          isMuted: state.isMuted,
          isVideoEnabled,
          isScreenSharing: state.isScreenSharing,
          isSpeaking: false,
          online_at: new Date().toISOString(),
        });
      }
    } else {
      // Add video track if not present
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });
        
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);
        
        // Add track to all peer connections
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(newVideoTrack, localStreamRef.current!);
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        
        setState(prev => ({ ...prev, isVideoEnabled: true }));
        
        // Update presence
        if (channelRef.current) {
          const displayName = user?.email?.split('@')[0] || 'User';
          await channelRef.current.track({
            displayName,
            isMuted: state.isMuted,
            isVideoEnabled: true,
            isScreenSharing: state.isScreenSharing,
            isSpeaking: false,
            online_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error enabling video:', error);
        toast.error('Erro ao ativar câmera');
      }
    }
  }, [user, state.isMuted, state.isScreenSharing]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    if (!state.isInCall) {
      toast.error('Entre na chamada primeiro');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      // Handle when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Add screen share tracks to all peer connections
      screenStream.getTracks().forEach(track => {
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(track, screenStream);
        });
      });

      setState(prev => ({ ...prev, isScreenSharing: true }));

      // Update presence
      if (channelRef.current) {
        const displayName = user?.email?.split('@')[0] || 'User';
        await channelRef.current.track({
          displayName,
          isMuted: state.isMuted,
          isVideoEnabled: state.isVideoEnabled,
          isScreenSharing: true,
          isSpeaking: false,
          online_at: new Date().toISOString(),
        });
      }

      toast.success('Compartilhamento de tela iniciado');
    } catch (error) {
      console.error('Error starting screen share:', error);
      if ((error as Error).name === 'NotAllowedError') {
        toast.error('Permissão negada para compartilhar tela');
      } else {
        toast.error('Erro ao compartilhar tela');
      }
    }
  }, [state.isInCall, state.isMuted, state.isVideoEnabled, user]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
        // Remove track from all peer connections
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          const sender = senders.find(s => s.track === track);
          if (sender) {
            pc.removeTrack(sender);
          }
        });
      });
      screenStreamRef.current = null;
    }

    setState(prev => ({ ...prev, isScreenSharing: false }));

    // Update presence
    if (channelRef.current && user) {
      const displayName = user.email?.split('@')[0] || 'User';
      await channelRef.current.track({
        displayName,
        isMuted: state.isMuted,
        isVideoEnabled: state.isVideoEnabled,
        isScreenSharing: false,
        isSpeaking: false,
        online_at: new Date().toISOString(),
      });
    }

    toast.success('Compartilhamento de tela encerrado');
  }, [state.isMuted, state.isVideoEnabled, user]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (state.isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [state.isScreenSharing, startScreenShare, stopScreenShare]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isInCall: state.isInCall,
    isMuted: state.isMuted,
    isVideoEnabled: state.isVideoEnabled,
    isScreenSharing: state.isScreenSharing,
    isSpeaking: state.isSpeaking,
    participants: state.participants,
    audioLevel: state.audioLevel,
    remoteStreams,
    screenShareStream: screenStreamRef.current,
    remoteScreenShares,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    setLocalVideoRef,
    setVideoContainer,
    getRemoteStreams,
    getScreenShareStreams,
  };
}
