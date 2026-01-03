import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Video } from '@/types/video';

interface HeroBannerProps {
  videos: Video[];
}

export const HeroBanner = memo(function HeroBanner({ videos }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videosLength = videos.length;

  useEffect(() => {
    if (videosLength <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videosLength);
    }, 8000);

    return () => clearInterval(interval);
  }, [videosLength]);

  if (videos.length === 0) {
    return (
      <div className="relative h-[70vh] lg:h-[85vh] bg-secondary flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl lg:text-6xl text-foreground mb-4">
            BEM-VINDO AO STREAMFLIX
          </h1>
          <p className="text-muted-foreground text-lg">
            Adicione seu primeiro vídeo para começar
          </p>
          <Link to="/admin">
            <Button className="mt-6 gap-2">
              <Play className="w-5 h-5" />
              Adicionar Vídeo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + videosLength) % videosLength);
  }, [videosLength]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videosLength) ;
  }, [videosLength]);

  return (
    <div className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentVideo.banner_url || currentVideo.poster_url ? (
          <img
            src={currentVideo.banner_url || currentVideo.poster_url || ''}
            alt={currentVideo.title}
            className="w-full h-full object-cover transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl space-y-4 lg:space-y-6">
            {/* Type Badge */}
            <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-primary text-primary-foreground">
              {currentVideo.type === 'movie' && 'Filme'}
              {currentVideo.type === 'series' && 'Série'}
              {currentVideo.type === 'trailer' && 'Trailer'}
            </span>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl text-foreground leading-tight">
              {currentVideo.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-muted-foreground">
              {currentVideo.year && (
                <span className="text-lg">{currentVideo.year}</span>
              )}
              {currentVideo.duration_minutes && (
                <>
                  <span>•</span>
                  <span>{Math.floor(currentVideo.duration_minutes / 60)}h {currentVideo.duration_minutes % 60}min</span>
                </>
              )}
              {currentVideo.categories && (
                <>
                  <span>•</span>
                  <span>{currentVideo.categories.name}</span>
                </>
              )}
            </div>

            {/* Description */}
            {currentVideo.description && (
              <p className="text-muted-foreground text-base lg:text-lg line-clamp-3 max-w-xl">
                {currentVideo.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link to={`/watch/${currentVideo.slug}`}>
                <Button size="lg" className="gap-2 text-base">
                  <Play className="w-5 h-5 fill-current" />
                  Assistir
                </Button>
              </Link>
              <Link to={`/watch/${currentVideo.slug}`}>
                <Button size="lg" variant="secondary" className="gap-2 text-base">
                  <Info className="w-5 h-5" />
                  Mais Informações
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {videos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/30 hover:bg-background/50"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/30 hover:bg-background/50"
            onClick={goToNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {videos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-12 h-1 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/50 hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
