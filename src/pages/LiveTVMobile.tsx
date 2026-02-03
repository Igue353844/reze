import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TVLayout } from '@/components/tv/TVLayout';
import { TVVideoPlayer } from '@/components/tv/TVVideoPlayer';
import { useLiveChannels, useLiveChannel } from '@/hooks/useLiveChannels';
import { Loader2, Tv, Radio, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LiveTVMobile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: channels, isLoading: channelsLoading } = useLiveChannels();
  const { data: selectedChannel } = useLiveChannel(slug || '');
  const [showChannelList, setShowChannelList] = useState(false);
  const [focusedChannelIndex, setFocusedChannelIndex] = useState(0);
  const channelListRef = useRef<HTMLDivElement>(null);

  const currentChannel = selectedChannel || (channels && channels.length > 0 ? channels[0] : null);

  // Find current channel index
  useEffect(() => {
    if (channels && currentChannel) {
      const index = channels.findIndex(c => c.id === currentChannel.id);
      if (index >= 0) setFocusedChannelIndex(index);
    }
  }, [channels, currentChannel]);

  // D-pad navigation for channel list
  useEffect(() => {
    if (!showChannelList || !channels) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedChannelIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedChannelIndex(prev => Math.min(channels.length - 1, prev + 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const channel = channels[focusedChannelIndex];
          if (channel) {
            navigate(`/tv/${channel.slug}`);
            setShowChannelList(false);
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          setShowChannelList(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChannelList, channels, focusedChannelIndex, navigate]);

  // Global key handler for showing channel list
  useEffect(() => {
    if (showChannelList) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setShowChannelList(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChannelList]);

  // Scroll focused channel into view
  useEffect(() => {
    if (showChannelList && channelListRef.current) {
      const buttons = channelListRef.current.querySelectorAll('button');
      buttons[focusedChannelIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedChannelIndex, showChannelList]);

  const handleBack = () => {
    if (showChannelList) {
      setShowChannelList(false);
    } else {
      navigate(-1);
    }
  };

  if (channelsLoading) {
    return (
      <TVLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      </TVLayout>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <TVLayout onBack={handleBack}>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <Tv className="w-20 h-20 text-muted-foreground mb-6" />
          <h1 className="font-display text-3xl text-foreground mb-2">Nenhum Canal Disponível</h1>
          <p className="text-muted-foreground text-lg">Os canais de TV ao vivo ainda não foram configurados.</p>
        </div>
      </TVLayout>
    );
  }

  return (
    <TVLayout onBack={handleBack}>
      <div className="min-h-screen flex items-center justify-center bg-black relative">
        {/* Video Player */}
        {currentChannel && (
          <TVVideoPlayer
            src={currentChannel.stream_url}
            title={currentChannel.name}
            poster={currentChannel.logo_url || undefined}
            onBack={handleBack}
          />
        )}

        {/* Channel Info Badge */}
        {currentChannel && !showChannelList && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg">
            {currentChannel.logo_url && (
              <img 
                src={currentChannel.logo_url} 
                alt={currentChannel.name} 
                className="w-8 h-8 object-contain"
              />
            )}
            <div className="flex items-center gap-2">
              <Radio className="w-3 h-3 text-destructive animate-pulse" />
              <span className="text-sm font-medium text-white">AO VIVO</span>
            </div>
          </div>
        )}

        {/* Channel List Toggle Hint */}
        {!showChannelList && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
            <ChevronUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-white/80">Pressione ↑↓ para trocar canal</span>
            <ChevronDown className="w-4 h-4 text-primary" />
          </div>
        )}

        {/* Channel List Overlay */}
        {showChannelList && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <h2 className="font-display text-2xl text-white mb-4 text-center">Canais</h2>
              
              <div 
                ref={channelListRef}
                className="max-h-[350px] overflow-y-auto space-y-2 pr-2"
              >
                {channels.map((channel, index) => (
                  <button
                    key={channel.id}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl transition-all",
                      index === focusedChannelIndex
                        ? "bg-primary text-primary-foreground scale-105 ring-4 ring-primary/50"
                        : currentChannel?.id === channel.id
                        ? "bg-primary/30 text-white"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    onClick={() => {
                      navigate(`/tv/${channel.slug}`);
                      setShowChannelList(false);
                    }}
                  >
                    {channel.logo_url ? (
                      <img
                        src={channel.logo_url}
                        alt={channel.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center">
                        <Tv className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-lg">{channel.name}</p>
                      {channel.category && (
                        <p className="text-sm opacity-70">{channel.category}</p>
                      )}
                    </div>
                    {currentChannel?.id === channel.id && (
                      <Radio className="w-4 h-4 text-destructive animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-4 text-center text-sm text-white/60">
                <span className="text-primary">↑↓</span> Navegar • 
                <span className="text-primary"> OK</span> Selecionar • 
                <span className="text-primary"> ESC</span> Voltar
              </div>
            </div>
          </div>
        )}
      </div>
    </TVLayout>
  );
};

export default LiveTVMobile;
