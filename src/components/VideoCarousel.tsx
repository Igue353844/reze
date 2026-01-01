import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoCard } from './VideoCard';
import type { Video } from '@/types/video';

interface VideoCarouselProps {
  title: string;
  videos: Video[];
}

export function VideoCarousel({ title, videos }: VideoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (videos.length === 0) return null;

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
        <h2 className="font-display text-2xl lg:text-3xl text-foreground tracking-wide">
          {title}
        </h2>
        
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar px-4 lg:px-0 pb-4"
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            className="flex-shrink-0 w-36 sm:w-44 lg:w-52"
          />
        ))}
      </div>
    </section>
  );
}
