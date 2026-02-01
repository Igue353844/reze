import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, ImageOff } from 'lucide-react';
import type { Video } from '@/types/video';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  className?: string;
}

export const VideoCard = memo(function VideoCard({ video, className }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formattedDuration = useMemo(() => {
    if (!video.duration_minutes) return null;
    const hours = Math.floor(video.duration_minutes / 60);
    const mins = video.duration_minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  }, [video.duration_minutes]);

  const typeLabel = useMemo(() => {
    switch (video.type) {
      case 'movie': return 'Filme';
      case 'series': return 'Série';
      case 'trailer': return 'Trailer';
      default: return '';
    }
  }, [video.type]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Link 
      to={`/watch/${video.slug}`}
      className={cn(
        "group relative block rounded-lg overflow-hidden transition-all duration-300",
        "hover:scale-105 hover:z-10",
        className
      )}
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] bg-secondary relative">
        {video.poster_url && !imageError ? (
          <>
            {/* Skeleton loader while image loads */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-secondary animate-pulse flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            )}
            <img
              src={video.poster_url}
              alt={video.title}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              crossOrigin="anonymous"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary gap-2">
            <ImageOff className="w-10 h-10 text-muted-foreground" />
            <span className="text-xs text-muted-foreground text-center px-2 line-clamp-2">
              {video.title}
            </span>
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
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-medium rounded bg-primary/90 text-primary-foreground">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-card">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {video.year && <span>{video.year}</span>}
          {formattedDuration && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDuration}
              </span>
            </>
          )}
        </div>
        
        {video.categories && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded">
            {video.categories.name}
          </span>
        )}
      </div>
    </Link>
  );
});
