import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, CheckCircle, XCircle, Loader2, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';

interface M3U8TesterProps {
  url: string;
  onValidation: (isValid: boolean) => void;
}

export function M3U8Tester({ url, onValidation }: M3U8TesterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Reset when URL changes
    setStatus('idle');
    setErrorMessage('');
    setIsPlaying(false);
    onValidation(false);
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, [url]);

  const testLink = async () => {
    if (!url.trim()) {
      setStatus('error');
      setErrorMessage('URL não pode estar vazia');
      onValidation(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setStatus('testing');
    setErrorMessage('');

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    try {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
        });
        
        hlsRef.current = hls;
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setStatus('error');
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setErrorMessage('Erro de rede - verifique a URL');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setErrorMessage('Erro de mídia - formato inválido');
                break;
              default:
                setErrorMessage('Erro ao carregar stream');
            }
            onValidation(false);
            hls.destroy();
            hlsRef.current = null;
          }
        });

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('success');
          onValidation(true);
          video.play().catch(() => {});
          setIsPlaying(true);
        });

        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setStatus('success');
          onValidation(true);
          video.play().catch(() => {});
          setIsPlaying(true);
        }, { once: true });
        
        video.addEventListener('error', () => {
          setStatus('error');
          setErrorMessage('Erro ao carregar stream');
          onValidation(false);
        }, { once: true });
      } else {
        setStatus('error');
        setErrorMessage('Navegador não suporta HLS');
        onValidation(false);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erro ao inicializar player');
      onValidation(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={testLink}
          disabled={status === 'testing' || !url.trim()}
          className="gap-2"
        >
          {status === 'testing' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Testar Link
            </>
          )}
        </Button>

        {status === 'success' && (
          <div className="flex items-center gap-1 text-sm text-green-500">
            <CheckCircle className="h-4 w-4" />
            <span>Link válido!</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Preview player */}
      <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${status !== 'success' ? 'hidden' : ''}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          muted={isMuted}
          playsInline
        />
        
        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-white/80 ml-auto">Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}
