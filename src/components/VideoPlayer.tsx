import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Sun,
  Gauge,
  PictureInPicture2,
  Captions,
  CaptionsOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

export type VideoQuality = '144p' | '240p' | '480p' | '720p' | '1080p' | '2K' | '4K' | 'auto';

export interface QualityOption {
  label: VideoQuality;
  src: string;
}

export interface SubtitleTrack {
  label: string;
  language: string;
  src: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  qualities?: QualityOption[];
  subtitles?: SubtitleTrack[];
  videoId?: string;
  episodeId?: string | null;
  initialProgress?: number;
  onProgressUpdate?: (progressSeconds: number, durationSeconds: number) => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VideoPlayer({ src, poster, title, qualities, subtitles, videoId, episodeId, initialProgress, onProgressUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('auto');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [showGestureIndicator, setShowGestureIndicator] = useState<{ type: 'seek' | 'brightness' | 'volume'; value: number } | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout>();
  const gestureTimeout = useRef<NodeJS.Timeout>();

  // Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialValuesRef = useRef<{ currentTime: number; brightness: number; volume: number }>({ currentTime: 0, brightness: 100, volume: 1 });
  const gestureTypeRef = useRef<'seek' | 'brightness' | 'volume' | null>(null);

  // Default quality options if not provided
  const defaultQualities: QualityOption[] = [
    { label: 'auto', src: src }
  ];

  const availableQualities = qualities && qualities.length > 0 ? qualities : defaultQualities;

  // Update source when prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setCurrentQuality('auto');
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Call progress update callback
      if (onProgressUpdate && video.duration > 0) {
        onProgressUpdate(video.currentTime, video.duration);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      // Set initial progress if provided
      if (initialProgress && initialProgress > 0 && video.duration > 0) {
        video.currentTime = Math.min(initialProgress, video.duration - 5);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      // Save progress on pause
      if (onProgressUpdate && video.duration > 0) {
        onProgressUpdate(video.currentTime, video.duration);
      }
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      // Save final progress when video ends
      if (onProgressUpdate && video.duration > 0) {
        onProgressUpdate(video.duration, video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentSrc, initialProgress, onProgressUpdate]);

  // Check PiP support
  useEffect(() => {
    setIsPiPSupported('pictureInPictureEnabled' in document && document.pictureInPictureEnabled);
  }, []);

  // PiP event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiPActive(true);
    const handleLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Handle subtitle track changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Disable all tracks first
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'disabled';
    }

    // Enable selected track
    if (subtitlesEnabled && activeSubtitle) {
      for (let i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].language === activeSubtitle) {
          video.textTracks[i].mode = 'showing';
          break;
        }
      }
    }
  }, [activeSubtitle, subtitlesEnabled]);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleQualityChange = (quality: QualityOption) => {
    const video = videoRef.current;
    if (!video) return;

    const wasPlaying = !video.paused;
    const currentTimePos = video.currentTime;

    setCurrentQuality(quality.label);
    setCurrentSrc(quality.src);

    // Wait for the new source to load, then restore position and play state
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTimePos;
        if (wasPlaying) {
          videoRef.current.play();
        }
      }
    }, 100);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleBrightnessChange = (value: number[]) => {
    setBrightness(value[0]);
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || !isPiPSupported) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const handleSubtitleChange = (language: string | null) => {
    if (language === null) {
      setSubtitlesEnabled(false);
      setActiveSubtitle(null);
    } else {
      setSubtitlesEnabled(true);
      setActiveSubtitle(language);
    }
  };

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    initialValuesRef.current = { 
      currentTime: videoRef.current?.currentTime || 0, 
      brightness, 
      volume 
    };
    gestureTypeRef.current = null;
    setShowControls(true);
  }, [brightness, volume]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !containerRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Determine gesture type if not set (only once at the start)
    if (!gestureTypeRef.current) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Need a minimum threshold to determine gesture type
      if (absX > 15 || absY > 15) {
        // Determine based on which direction is dominant
        if (absX > absY * 1.5) {
          // Clearly horizontal - seek gesture
          gestureTypeRef.current = 'seek';
        } else if (absY > absX * 1.5) {
          // Clearly vertical - brightness or volume based on position
          gestureTypeRef.current = touchStartRef.current.x < containerWidth / 2 ? 'brightness' : 'volume';
        } else {
          // Diagonal movement - decide based on starting position for vertical, otherwise horizontal
          if (absY > absX) {
            gestureTypeRef.current = touchStartRef.current.x < containerWidth / 2 ? 'brightness' : 'volume';
          } else {
            gestureTypeRef.current = 'seek';
          }
        }
      }
    }

    if (!gestureTypeRef.current) return;

    // Prevent default to stop scrolling
    e.preventDefault();

    clearTimeout(gestureTimeout.current);

    // Handle each gesture type exclusively
    switch (gestureTypeRef.current) {
      case 'seek': {
        const seekAmount = (deltaX / containerWidth) * duration * 0.5;
        const newTime = Math.max(0, Math.min(duration, initialValuesRef.current.currentTime + seekAmount));
        if (videoRef.current) {
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }
        setShowGestureIndicator({ type: 'seek', value: Math.round(seekAmount) });
        break;
      }
      case 'brightness': {
        const brightnessChange = -(deltaY / containerHeight) * 100;
        const newBrightness = Math.max(20, Math.min(150, initialValuesRef.current.brightness + brightnessChange));
        setBrightness(newBrightness);
        setShowGestureIndicator({ type: 'brightness', value: Math.round(newBrightness) });
        break;
      }
      case 'volume': {
        const volumeChange = -(deltaY / containerHeight);
        const newVolume = Math.max(0, Math.min(1, initialValuesRef.current.volume + volumeChange));
        if (videoRef.current) {
          videoRef.current.volume = newVolume;
          setVolume(newVolume);
          setIsMuted(newVolume === 0);
        }
        setShowGestureIndicator({ type: 'volume', value: Math.round(newVolume * 100) });
        break;
      }
    }
  }, [duration]);

  const handleTouchEnd = useCallback(() => {
    const touchStart = touchStartRef.current;
    touchStartRef.current = null;
    gestureTypeRef.current = null;

    // Hide gesture indicator after a delay
    gestureTimeout.current = setTimeout(() => {
      setShowGestureIndicator(null);
    }, 500);

    // Handle tap to toggle play
    if (touchStart && Date.now() - touchStart.time < 200) {
      // Quick tap - toggle play only if not a gesture
      if (!showGestureIndicator) {
        togglePlay();
      }
    }

    // Auto-hide controls
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying, showGestureIndicator]);

  // Double tap to seek
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    const containerWidth = containerRef.current?.clientWidth || 0;

    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      // Double tap detected
      const isRightSide = touch.clientX > containerWidth / 2;
      skip(isRightSide ? 10 : -10);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: touch.clientX };
    }
  }, []);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => { handleTouchStart(e); handleDoubleTap(e); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        className="w-full h-full object-contain"
        style={{ filter: `brightness(${brightness}%)` }}
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
      >
        {/* Subtitle tracks */}
        {subtitles?.map((track) => (
          <track
            key={track.language}
            kind="subtitles"
            label={track.label}
            srcLang={track.language}
            src={track.src}
          />
        ))}
      </video>

      {/* Gesture Indicator */}
      {showGestureIndicator && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-4 py-2 rounded-lg flex items-center gap-2 text-white">
          {showGestureIndicator.type === 'seek' && (
            <>
              {showGestureIndicator.value >= 0 ? <SkipForward className="w-5 h-5" /> : <SkipBack className="w-5 h-5" />}
              <span className="font-medium">{showGestureIndicator.value >= 0 ? '+' : ''}{showGestureIndicator.value}s</span>
            </>
          )}
          {showGestureIndicator.type === 'brightness' && (
            <>
              <Sun className="w-5 h-5" />
              <span className="font-medium">{showGestureIndicator.value}%</span>
            </>
          )}
          {showGestureIndicator.type === 'volume' && (
            <>
              <Volume2 className="w-5 h-5" />
              <span className="font-medium">{showGestureIndicator.value}%</span>
            </>
          )}
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground fill-current ml-1" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Title */}
        {title && (
          <div className="mb-2 sm:mb-4">
            <h3 className="text-foreground font-semibold text-sm sm:text-lg truncate">{title}</h3>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-2 sm:mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Controls Row - Mobile Optimized */}
        <div className="flex items-center justify-between gap-1">
          {/* Left Controls */}
          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            {/* Play/Pause */}
            <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 sm:h-10 sm:w-10">
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              )}
            </Button>

            {/* Skip Backward - Hidden on very small screens */}
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:flex">
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Skip Forward - Hidden on very small screens */}
            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:flex">
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            {/* Volume - Hidden on mobile, show on larger screens */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-10 w-10">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20 cursor-pointer"
              />
            </div>
          </div>

          {/* Center - Time Display */}
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Right Controls */}
          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            {/* Volume Toggle - Mobile only */}
            <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 sm:hidden">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            {/* Settings Menu (Quality, Speed, Brightness) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-popover border border-border z-50 min-w-[180px]"
              >
                {/* Playback Speed */}
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Velocidade
                </DropdownMenuLabel>
                <div className="grid grid-cols-4 gap-1 px-2 pb-2">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-1"
                      onClick={() => handleSpeedChange(speed)}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>

                <DropdownMenuSeparator />

                {/* Brightness */}
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Brilho: {brightness}%
                </DropdownMenuLabel>
                <div className="px-2 pb-2">
                  <Slider
                    value={[brightness]}
                    min={20}
                    max={150}
                    step={5}
                    onValueChange={handleBrightnessChange}
                    className="cursor-pointer"
                  />
                </div>

                {/* Quality Options */}
                {availableQualities.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Qualidade</DropdownMenuLabel>
                    {availableQualities.map((quality) => (
                      <DropdownMenuItem
                        key={quality.label}
                        onClick={() => handleQualityChange(quality)}
                        className={cn(
                          "cursor-pointer",
                          currentQuality === quality.label && "bg-accent text-accent-foreground"
                        )}
                      >
                        {quality.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {/* Subtitles */}
                {subtitles && subtitles.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <Captions className="w-4 h-4" />
                        Legendas
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => handleSubtitleChange(null)}
                          className={cn(
                            "cursor-pointer",
                            !subtitlesEnabled && "bg-accent text-accent-foreground"
                          )}
                        >
                          Desativado
                        </DropdownMenuItem>
                        {subtitles.map((track) => (
                          <DropdownMenuItem
                            key={track.language}
                            onClick={() => handleSubtitleChange(track.language)}
                            className={cn(
                              "cursor-pointer",
                              subtitlesEnabled && activeSubtitle === track.language && "bg-accent text-accent-foreground"
                            )}
                          >
                            {track.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Subtitles Toggle - Quick access */}
            {subtitles && subtitles.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                {subtitlesEnabled ? (
                  <Captions className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <CaptionsOff className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            )}

            {/* Picture-in-Picture */}
            {isPiPSupported && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={togglePiP}
                className={cn(
                  "h-8 w-8 sm:h-10 sm:w-10",
                  isPiPActive && "text-primary"
                )}
              >
                <PictureInPicture2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}

            {/* Fullscreen - Always visible */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Speed indicator when not 1x */}
      {playbackSpeed !== 1 && (
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
          {playbackSpeed}x
        </div>
      )}
    </div>
  );
}
