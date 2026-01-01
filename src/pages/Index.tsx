import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HeroBanner } from '@/components/HeroBanner';
import { VideoCarousel } from '@/components/VideoCarousel';
import { useVideos, useFeaturedVideos, useCategories } from '@/hooks/useVideos';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Play, LogIn } from 'lucide-react';

const Index = () => {
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: featuredVideos, isLoading: featuredLoading } = useFeaturedVideos();
  const { data: categories } = useCategories();
  const { user } = useAuth();

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

      {/* CTA for non-logged users */}
      {!user && (
        <div className="container mx-auto px-4 -mt-16 relative z-10 mb-8">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl p-6 lg:p-8 border border-primary/20 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl lg:text-3xl text-foreground mb-2">
                  ASSISTA AGORA
                </h2>
                <p className="text-muted-foreground">
                  Crie sua conta grátis e tenha acesso ao catálogo completo de filmes e séries.
                </p>
              </div>
              <div className="flex gap-3">
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    <LogIn className="w-5 h-5" />
                    Criar Conta
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Carousels */}
      <div className="container mx-auto lg:px-8 relative z-10 space-y-2" style={{ marginTop: user ? '-5rem' : '0' }}>
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
