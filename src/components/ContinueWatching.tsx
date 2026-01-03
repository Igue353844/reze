import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { useContinueWatching, WatchProgressWithVideo } from '@/hooks/useWatchProgress';
import { cn } from '@/lib/utils';

function formatProgress(progressSeconds: number, durationSeconds: number): string {
  const remaining = Math.max(0, durationSeconds - progressSeconds);
  const minutes = Math.floor(remaining / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}min restantes`;
  }
  return `${minutes}min restantes`;
}

function getWatchUrl(item: WatchProgressWithVideo): string {
  const baseUrl = `/watch/${item.videos.slug}`;
  if (item.episode_id && item.episodes) {
    return `${baseUrl}?ep=${item.episode_id}`;
  }
  return baseUrl;
}

function ContinueWatchingCard({ item }: { item: WatchProgressWithVideo }) {
  const progressPercent = item.duration_seconds > 0 
    ? (item.progress_seconds / item.duration_seconds) * 100 
    : 0;

  const displayTitle = item.episodes 
    ? `${item.videos.title} - T${item.episodes.seasons?.season_number || '?'}:E${item.episodes.episode_number}`
    : item.videos.title;

  return (
    <Link
      to={getWatchUrl(item)}
      className={cn(
        "group relative block rounded-lg overflow-hidden transition-all duration-300",
        "hover:scale-105 hover:z-10 flex-shrink-0 w-64 sm:w-72 lg:w-80"
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-secondary relative">
        {item.videos.poster_url ? (
          <img
            src={item.videos.poster_url}
            alt={item.videos.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-card">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {displayTitle}
        </h3>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatProgress(item.progress_seconds, item.duration_seconds)}</span>
        </div>
      </div>
    </Link>
  );
}

export const ContinueWatching = memo(function ContinueWatching() {
  const { data: watchProgress, isLoading } = useContinueWatching();

  // Don't render if no progress or loading
  if (isLoading || !watchProgress || watchProgress.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
        <h2 className="font-display text-2xl lg:text-3xl text-foreground tracking-wide">
          Continuar Assistindo
        </h2>
      </div>

      {/* Carousel */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 lg:px-0 pb-4">
        {watchProgress.map((item) => (
          <ContinueWatchingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
});
