import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LivePlayer } from '@/components/LivePlayer';
import { useLiveChannels, useLiveChannel } from '@/hooks/useLiveChannels';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Tv } from 'lucide-react';

const LiveTV = () => {
  const { slug } = useParams();
  const { data: channels, isLoading: channelsLoading } = useLiveChannels();
  const { data: selectedChannel, isLoading: channelLoading } = useLiveChannel(slug || '');
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  const currentChannel = selectedChannel || (channels && channels.length > 0 ? channels[0] : null);

  if (channelsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-3xl text-foreground mb-2">Nenhum Canal Disponível</h1>
          <p className="text-muted-foreground">
            Os canais de TV ao vivo ainda não foram configurados.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Radio className="w-8 h-8 text-primary animate-pulse" />
          <h1 className="font-display text-3xl lg:text-4xl text-foreground">TV AO VIVO</h1>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Player */}
          <div className="lg:col-span-3">
            {currentChannel && (
              <LivePlayer
                src={currentChannel.stream_url}
                title={currentChannel.name}
                logo={currentChannel.logo_url || undefined}
              />
            )}

            {/* Channel Info */}
            {currentChannel && (
              <div className="mt-4 p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  {currentChannel.logo_url && (
                    <img
                      src={currentChannel.logo_url}
                      alt={currentChannel.name}
                      className="h-12 w-auto object-contain"
                    />
                  )}
                  <div>
                    <h2 className="font-display text-xl text-foreground">{currentChannel.name}</h2>
                    {currentChannel.category && (
                      <p className="text-sm text-muted-foreground">{currentChannel.category}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Channel List */}
          <div className="space-y-2">
            <h3 className="font-display text-lg text-foreground mb-4">Canais</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/tv/${channel.slug}`}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    currentChannel?.id === channel.id
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-card border border-border hover:bg-secondary'
                  }`}
                  onMouseEnter={() => setHoveredChannel(channel.id)}
                  onMouseLeave={() => setHoveredChannel(null)}
                >
                  {channel.logo_url ? (
                    <img
                      src={channel.logo_url}
                      alt={channel.name}
                      className="w-10 h-10 object-contain rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                      <Tv className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{channel.name}</p>
                    {channel.category && (
                      <p className="text-xs text-muted-foreground truncate">{channel.category}</p>
                    )}
                  </div>
                  {currentChannel?.id === channel.id && (
                    <Radio className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveTV;
