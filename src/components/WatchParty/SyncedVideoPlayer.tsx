import { useRef, useEffect, useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Crown, Users, Volume2, VolumeX, Maximize } from 'lucide-react';
import type { WatchParty } from '@/types/watchParty';
import { cn } from '@/lib/utils';

interface SyncedVideoPlayerProps {
  party: WatchParty;
  isHost: boolean;
  onPlaybackUpdate: (currentTime: number, isPlaying: boolean) => void;
}

export function SyncedVideoPlayer({ party, isHost, onPlaybackUpdate }: SyncedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSyncTime = useRef<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoUrl = party.episodes?.video_url || party.videos?.video_url;

  // Sync playback from host (for non-hosts)
  useEffect(() => {
    if (isHost || !videoRef.current) return;

    const video = videoRef.current;
    const serverTime = party.current_time_seconds;
    const timeDiff = Math.abs(video.currentTime - serverTime);

    // Only sync if difference is more than 2 seconds
    if (timeDiff > 2) {
      setIsSyncing(true);
      video.currentTime = serverTime;
      setTimeout(() => setIsSyncing(false), 500);
    }

    // Sync play/pause state
    if (party.is_playing && video.paused) {
      video.play().catch(console.error);
    } else if (!party.is_playing && !video.paused) {
      video.pause();
    }
  }, [party.current_time_seconds, party.is_playing, isHost]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Host sends updates
      if (isHost) {
        const now = Date.now();
        if (now - lastSyncTime.current >= 2000) {
          lastSyncTime.current = now;
          onPlaybackUpdate(video.currentTime, !video.paused);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (isHost) {
        onPlaybackUpdate(video.currentTime, true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (isHost) {
        onPlaybackUpdate(video.currentTime, false);
      }
    };

    const handleSeeked = () => {
      if (isHost) {
        onPlaybackUpdate(video.currentTime, !video.paused);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [isHost, onPlaybackUpdate]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    
    if (!container || !video) return;

    try {
      // Check if we're already in fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        // Try container fullscreen first (works on most browsers)
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          // Safari
          await (container as any).webkitRequestFullscreen();
        } else if ((video as any).webkitEnterFullscreen) {
          // iOS Safari - needs to be on the video element
          await (video as any).webkitEnterFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback: try video element fullscreen for iOS
      if ((video as any).webkitEnterFullscreen) {
        try {
          await (video as any).webkitEnterFullscreen();
        } catch (e) {
          console.error('Video fullscreen fallback error:', e);
        }
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum vídeo selecionado</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group fullscreen:rounded-none"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={party.videos?.poster_url || undefined}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
        webkit-playsinline="true"
      />
      
      {/* Overlay badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        {isHost ? (
          <Badge className="flex items-center gap-1 bg-primary/80 backdrop-blur-sm">
            <Crown className="h-3 w-3" />
            Você é o Host
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1 bg-background/80 backdrop-blur-sm">
            <Users className="h-3 w-3" />
            Sincronizado
          </Badge>
        )}
        
        {isSyncing && (
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            Sincronizando...
          </Badge>
        )}
      </div>
      
      {/* Controls overlay */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress bar */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="mb-3"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={party.is_playing ? "default" : "secondary"} className="flex items-center gap-1">
              {party.is_playing ? (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  Reproduzindo
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  Pausado
                </>
              )}
            </Badge>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
