import { Layout } from '@/components/Layout';
import { HeroBanner } from '@/components/HeroBanner';
import { VideoCarousel } from '@/components/VideoCarousel';
import { useVideos, useFeaturedVideos, useCategories } from '@/hooks/useVideos';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: featuredVideos, isLoading: featuredLoading } = useFeaturedVideos();
  const { data: categories } = useCategories();

  const getFeaturedOrLatest = () => {
    if (featuredVideos && featuredVideos.length > 0) {
      return featuredVideos;
    }
    return videos?.slice(0, 5) || [];
  };

  const getVideosByCategory = (categoryId: string) => {
    return videos?.filter(v => v.category_id === categoryId) || [];
  };

  const getRecentVideos = () => {
    return videos?.slice(0, 20) || [];
  };

  const getMovies = () => {
    return videos?.filter(v => v.type === 'movie').slice(0, 20) || [];
  };

  const getSeries = () => {
    return videos?.filter(v => v.type === 'series').slice(0, 20) || [];
  };

  if (videosLoading || featuredLoading) {
    return (
      <Layout>
        {/* Hero Skeleton */}
        <Skeleton className="h-[70vh] lg:h-[85vh] w-full" />
        
        {/* Carousel Skeletons */}
        <div className="container mx-auto px-4 py-8 space-y-8">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map(j => (
                  <Skeleton key={j} className="w-44 h-72 rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Banner */}
      <HeroBanner videos={getFeaturedOrLatest()} />

      {/* Content Carousels */}
      <div className="container mx-auto lg:px-8 -mt-20 relative z-10 space-y-2">
        {/* Recent Additions */}
        <VideoCarousel 
          title="Adicionados Recentemente" 
          videos={getRecentVideos()} 
        />

        {/* Movies */}
        {getMovies().length > 0 && (
          <VideoCarousel 
            title="Filmes" 
            videos={getMovies()} 
          />
        )}

        {/* Series */}
        {getSeries().length > 0 && (
          <VideoCarousel 
            title="Séries" 
            videos={getSeries()} 
          />
        )}

        {/* Categories */}
        {categories?.map(category => {
          const categoryVideos = getVideosByCategory(category.id);
          if (categoryVideos.length === 0) return null;
          
          return (
            <VideoCarousel 
              key={category.id}
              title={category.name} 
              videos={categoryVideos} 
            />
          );
        })}
      </div>
    </Layout>
  );
};

export default Index;
