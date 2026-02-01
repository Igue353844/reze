import { useRef, useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Crown, Users, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Subtitles, Loader2, SkipForward } from 'lucide-react';
import type { WatchParty } from '@/types/watchParty';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Hls from 'hls.js';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

interface SyncedVideoPlayerProps {
  party: WatchParty;
  isHost: boolean;
  onPlaybackUpdate: (currentTime: number, isPlaying: boolean) => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  isChangingEpisode?: boolean;
  autoPlayNext?: boolean;
}

export function SyncedVideoPlayer({ 
  party, 
  isHost, 
  onPlaybackUpdate,
  hasNextEpisode,
  onNextEpisode,
  isChangingEpisode,
  autoPlayNext = true,
}: SyncedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSyncTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const lastTapX = useRef<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekIndicator, setSeekIndicator] = useState<'forward' | 'backward' | null>(null);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const nextEpisodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Subtitle state
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);

  const videoUrl = party.custom_url || party.episodes?.video_url || party.videos?.video_url;
  const isM3U8 = videoUrl?.endsWith('.m3u8') || videoUrl?.includes('.m3u8');

  // Setup HLS for M3U8 streams
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hlsRef.current = hls;
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('HLS fatal error:', data);
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    } else if (isM3U8 && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = videoUrl;
    } else if (!isM3U8) {
      // Regular video file
      video.src = videoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, isM3U8]);

  // Generate AI subtitles
  const generateSubtitles = useCallback(async () => {
    if (subtitles.length > 0) return; // Already have subtitles
    
    setIsLoadingSubtitles(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtitles', {
        body: {
          videoTitle: party.videos?.title || party.episodes?.title || 'Vídeo',
          context: party.episodes?.title ? `Episódio de série: ${party.episodes.title}` : 'Filme ou vídeo',
          language: 'pt-BR',
        },
      });

      if (error) throw error;
      
      if (data?.subtitles && Array.isArray(data.subtitles)) {
        setSubtitles(data.subtitles);
        toast.success('Legendas IA carregadas!');
      }
    } catch (error) {
      console.error('Error generating subtitles:', error);
      toast.error('Erro ao gerar legendas. Tente novamente.');
      setSubtitlesEnabled(false);
    } finally {
      setIsLoadingSubtitles(false);
    }
  }, [party.videos?.title, party.episodes?.title, subtitles.length]);

  // Toggle subtitles
  const toggleSubtitles = useCallback(() => {
    if (!subtitlesEnabled) {
      setSubtitlesEnabled(true);
      generateSubtitles();
    } else {
      setSubtitlesEnabled(false);
    }
  }, [subtitlesEnabled, generateSubtitles]);

  // Update current subtitle based on video time
  useEffect(() => {
    if (!subtitlesEnabled || subtitles.length === 0) {
      setCurrentSubtitle(null);
      return;
    }

    const subtitle = subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    );
    setCurrentSubtitle(subtitle?.text || null);
  }, [currentTime, subtitles, subtitlesEnabled]);

  // Initial sync for host when entering the room
  useEffect(() => {
    if (!isHost || !videoRef.current) return;
    
    const video = videoRef.current;
    
    // Sync host's player with party state on initial load
    const handleCanPlay = () => {
      if (party.current_time_seconds > 0 && video.currentTime === 0) {
        video.currentTime = party.current_time_seconds;
      }
      if (party.is_playing && video.paused) {
        video.play().catch(console.error);
      }
    };
    
    video.addEventListener('canplay', handleCanPlay);
    
    // Also check immediately if video is already ready
    if (video.readyState >= 3) {
      handleCanPlay();
    }
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isHost, party.current_time_seconds, party.is_playing]);

  // Sync playback from host (for non-hosts) with smoother sync
  useEffect(() => {
    if (isHost || !videoRef.current) return;

    const video = videoRef.current;
    const serverTime = party.current_time_seconds;
    const timeDiff = Math.abs(video.currentTime - serverTime);

    // Sync play/pause state first (prevents fighting between states)
    if (party.is_playing && video.paused) {
      video.play().catch(console.error);
    } else if (!party.is_playing && !video.paused) {
      video.pause();
    }

    // Only do a hard sync if difference is more than 1 second (reduced from 2)
    if (timeDiff > 1) {
      setIsSyncing(true);
      
      // If playing, pause briefly to avoid buffering issues during seek
      const wasPlaying = !video.paused;
      if (wasPlaying) {
        video.pause();
      }
      
      video.currentTime = serverTime;
      
      // Resume playback after seeking if it was playing
      if (wasPlaying && party.is_playing) {
        // Small delay to let the seek complete
        const playAfterSeek = () => {
          video.play().catch(console.error);
          video.removeEventListener('seeked', playAfterSeek);
        };
        video.addEventListener('seeked', playAfterSeek, { once: true });
      }
      
      setTimeout(() => setIsSyncing(false), 300);
    }
  }, [party.current_time_seconds, party.is_playing, isHost]);

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Host sends updates more frequently (every 1 second instead of 2)
      if (isHost) {
        const now = Date.now();
        if (now - lastSyncTime.current >= 1000) {
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

    const handleEnded = () => {
      // Auto-play next episode if available and enabled
      if (isHost && hasNextEpisode && onNextEpisode && autoPlayNext) {
        setShowNextOverlay(true);
        nextEpisodeTimerRef.current = setTimeout(() => {
          setShowNextOverlay(false);
          onNextEpisode();
        }, 5000); // 5 second countdown
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);
      
      // Clear timer on cleanup
      if (nextEpisodeTimerRef.current) {
        clearTimeout(nextEpisodeTimerRef.current);
      }
    };
  }, [isHost, onPlaybackUpdate, hasNextEpisode, onNextEpisode, autoPlayNext]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    
    // Show seek indicator
    setSeekIndicator(seconds > 0 ? 'forward' : 'backward');
    setTimeout(() => setSeekIndicator(null), 500);
  };

  const handleDoubleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    
    // Get tap position
    let clientX: number;
    if ('touches' in e) {
      clientX = e.changedTouches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const tapX = clientX - rect.left;
    const containerWidth = rect.width;
    
    // Check if this is a double tap (within 300ms and similar position)
    if (timeDiff < 300 && Math.abs(tapX - lastTapX.current) < 50) {
      e.preventDefault();
      
      // Left side = rewind, right side = forward
      if (tapX < containerWidth / 2) {
        seekBy(-10);
      } else {
        seekBy(10);
      }
      
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      lastTapX.current = tapX;
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
      onTouchEnd={handleDoubleTap}
      onDoubleClick={(e) => {
        // Desktop double-click support
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width / 2) {
          seekBy(-10);
        } else {
          seekBy(10);
        }
      }}
    >
      <video
        ref={videoRef}
        poster={party.videos?.poster_url || undefined}
        className="w-full h-full object-contain"
        onClick={(e) => {
          // Only toggle play on single click, not double click
          e.stopPropagation();
          togglePlay();
        }}
        playsInline
        webkit-playsinline="true"
      />

      {/* AI Subtitles display */}
      {subtitlesEnabled && currentSubtitle && (
        <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 flex justify-center pointer-events-none z-15 px-4">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg max-w-[90%] text-center">
            <p className="text-sm sm:text-base font-medium leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}

      {/* Loading subtitles indicator */}
      {isLoadingSubtitles && (
        <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 flex justify-center pointer-events-none z-15">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Gerando legendas IA...</span>
          </div>
        </div>
      )}

      {/* Double-tap seek indicators */}
      {seekIndicator && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20",
          "bg-black/60 rounded-full p-4 animate-ping",
          seekIndicator === 'backward' ? 'left-8' : 'right-8'
        )}>
          {seekIndicator === 'backward' ? (
            <RotateCcw className="h-8 w-8 text-white" />
          ) : (
            <RotateCw className="h-8 w-8 text-white" />
          )}
        </div>
      )}

      {/* Seek hint zones - visible on touch */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div className="flex-1 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
          <div className="text-white/50 text-xs">-10s</div>
        </div>
        <div className="flex-1 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
          <div className="text-white/50 text-xs">+10s</div>
        </div>
      </div>

      {/* Next episode overlay */}
      {showNextOverlay && hasNextEpisode && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30">
          <p className="text-white text-lg mb-2">Próximo episódio em</p>
          <div className="text-5xl font-bold text-primary mb-4 animate-pulse">5</div>
          <p className="text-white/80 text-sm mb-4">Próximo episódio começará automaticamente</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (nextEpisodeTimerRef.current) {
                  clearTimeout(nextEpisodeTimerRef.current);
                }
                setShowNextOverlay(false);
              }}
              className="text-white border-white/50 hover:bg-white/20"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (nextEpisodeTimerRef.current) {
                  clearTimeout(nextEpisodeTimerRef.current);
                }
                setShowNextOverlay(false);
                onNextEpisode?.();
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Pular agora
            </Button>
          </div>
        </div>
      )}
      
      {/* Overlay badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10 pr-14">
        {isHost ? (
          <Badge className="flex items-center gap-1 bg-primary/80 backdrop-blur-sm text-xs">
            <Crown className="h-3 w-3" />
            <span className="hidden sm:inline">Você é o Host</span>
            <span className="sm:hidden">Host</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1 bg-background/80 backdrop-blur-sm text-xs">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">Sincronizado</span>
            <span className="sm:hidden">Sync</span>
          </Badge>
        )}
        
        {isSyncing && (
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs">
            Sincronizando...
          </Badge>
        )}
      </div>
      
      {/* Fullscreen button - always visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 text-white bg-black/50 hover:bg-black/70 h-10 w-10"
      >
        <Maximize className="h-6 w-6" />
      </Button>

      {/* Controls overlay */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 transition-opacity",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress bar */}
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="mb-2 sm:mb-3"
        />
        
        <div className="flex items-center justify-between gap-1">
          {/* Left controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
            >
              {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
            >
              {isMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-16 sm:w-20 hidden sm:flex"
            />
            
            <span className="text-white text-xs sm:text-sm whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Subtitles toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSubtitles}
              className={cn(
                "text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10",
                subtitlesEnabled && "bg-white/30"
              )}
              disabled={isLoadingSubtitles}
              title={subtitlesEnabled ? "Desativar legendas IA" : "Ativar legendas IA"}
            >
              {isLoadingSubtitles ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Subtitles className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            {/* Next episode button - only for host when watching series */}
            {isHost && hasNextEpisode && onNextEpisode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNextEpisode}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10"
                disabled={isChangingEpisode}
                title="Próximo episódio"
              >
                {isChangingEpisode ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            )}

            <Badge 
              variant={party.is_playing ? "default" : "secondary"} 
              className="flex items-center gap-1 text-xs px-2 py-1"
            >
              {party.is_playing ? (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span className="hidden sm:inline">Reproduzindo</span>
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  <span className="hidden sm:inline">Pausado</span>
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
