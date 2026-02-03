import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Loader2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { TVButton } from './TVButton';
import { cn } from '@/lib/utils';

interface TVVideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  onBack?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export function TVVideoPlayer({ 
  src, 
  title, 
  poster, 
  onBack,
  onEnded,
  autoPlay = true 
}: TVVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusedControl, setFocusedControl] = useState<string>('play');
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const controls = ['back', 'rewind', 'play', 'forward', 'volume', 'fullscreen'];

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    const initPlayer = () => {
      setIsLoading(true);
      setError(null);

      // Check if it's an HLS stream
      const isHLS = src.includes('.m3u8') || src.includes('m3u8');

      if (isHLS && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => setIsPlaying(false));
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Erro de rede. Tentando reconectar...');
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Erro de mídia. Tentando recuperar...');
                hls?.recoverMediaError();
                break;
              default:
                setError('Não foi possível carregar o vídeo');
                break;
            }
          }
        });
      } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => setIsPlaying(false));
          }
        });
      } else {
        // Regular video
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => setIsPlaying(false));
          }
        });
      }
    };

    initPlayer();

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleError = () => setError('Erro ao carregar o vídeo');

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay, onEnded]);

  // D-pad navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = controls.indexOf(focusedControl);

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedControl(controls[currentIndex - 1]);
          }
          setShowControls(true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex < controls.length - 1) {
            setFocusedControl(controls[currentIndex + 1]);
          }
          setShowControls(true);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setShowControls(true);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setShowControls(false);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleControlAction(focusedControl);
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onBack?.();
          break;
      }

      resetHideControlsTimer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedControl, isPlaying, isMuted, isFullscreen, onBack]);

  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    setShowControls(true);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 5000);
  }, [isPlaying]);

  const handleControlAction = (control: string) => {
    const video = videoRef.current;
    if (!video) return;

    switch (control) {
      case 'back':
        onBack?.();
        break;
      case 'play':
        if (isPlaying) {
          video.pause();
        } else {
          video.play();
        }
        break;
      case 'rewind':
        video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case 'forward':
        video.currentTime = Math.min(duration, video.currentTime + 10);
        break;
      case 'volume':
        video.muted = !isMuted;
        setIsMuted(!isMuted);
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black overflow-hidden",
        // Otimizado para TV de tubo 720x450
        isFullscreen ? "w-screen h-screen" : "w-full max-w-[720px] aspect-video mx-auto"
      )}
      style={{ maxHeight: isFullscreen ? '100vh' : '450px' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        poster={poster}
        playsInline
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-foreground p-8">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <p className="text-xl text-center mb-6">{error}</p>
          <TVButton
            onClick={() => {
              setError(null);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            autoFocus
          >
            Tentar novamente
          </TVButton>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top Gradient with Title */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 lg:p-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                className={cn(
                  "p-2 rounded-lg transition-all",
                  focusedControl === 'back' 
                    ? "bg-primary text-primary-foreground scale-110" 
                    : "bg-black/50 text-foreground"
                )}
                onClick={() => handleControlAction('back')}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            {title && (
              <h2 className="font-display text-xl lg:text-2xl text-white truncate">
                {title}
              </h2>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 lg:p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-white/80 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4 lg:gap-8">
            {/* Rewind */}
            <button
              className={cn(
                "p-3 lg:p-4 rounded-xl transition-all",
                focusedControl === 'rewind' 
                  ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/50" 
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              onClick={() => handleControlAction('rewind')}
            >
              <SkipBack className="w-6 h-6 lg:w-8 lg:h-8" />
            </button>

            {/* Play/Pause */}
            <button
              className={cn(
                "p-4 lg:p-6 rounded-2xl transition-all",
                focusedControl === 'play' 
                  ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/50" 
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              onClick={() => handleControlAction('play')}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 lg:w-10 lg:h-10" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8 lg:w-10 lg:h-10 ml-1" fill="currentColor" />
              )}
            </button>

            {/* Forward */}
            <button
              className={cn(
                "p-3 lg:p-4 rounded-xl transition-all",
                focusedControl === 'forward' 
                  ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/50" 
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              onClick={() => handleControlAction('forward')}
            >
              <SkipForward className="w-6 h-6 lg:w-8 lg:h-8" />
            </button>

            {/* Volume */}
            <button
              className={cn(
                "p-3 lg:p-4 rounded-xl transition-all",
                focusedControl === 'volume' 
                  ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/50" 
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              onClick={() => handleControlAction('volume')}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 lg:w-8 lg:h-8" />
              ) : (
                <Volume2 className="w-6 h-6 lg:w-8 lg:h-8" />
              )}
            </button>

            {/* Fullscreen */}
            <button
              className={cn(
                "p-3 lg:p-4 rounded-xl transition-all",
                focusedControl === 'fullscreen' 
                  ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/50" 
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              onClick={() => handleControlAction('fullscreen')}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6 lg:w-8 lg:h-8" />
              ) : (
                <Maximize className="w-6 h-6 lg:w-8 lg:h-8" />
              )}
            </button>
          </div>

          {/* Navigation Hint */}
          <div className="mt-4 text-center text-sm text-white/60">
            <span className="text-primary">←→</span> Navegar • 
            <span className="text-primary"> OK</span> Selecionar • 
            <span className="text-primary"> ↓</span> Esconder
          </div>
        </div>
      </div>
    </div>
  );
}
