import { useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TVLayout } from '@/components/tv/TVLayout';
import { TVButton } from '@/components/tv/TVButton';
import { useVideos, useFeaturedVideos, useCategories } from '@/hooks/useVideos';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Play, LogIn, Film, User, Settings, History, Heart, Tv } from 'lucide-react';

const IndexMobile = () => {
  const navigate = useNavigate();
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: featuredVideos, isLoading: featuredLoading } = useFeaturedVideos();
  const { data: categories } = useCategories();
  const { user, isAdmin } = useAuth();
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first button on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      firstButtonRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const featuredVideo = useMemo(() => {
    if (featuredVideos && featuredVideos.length > 0) {
      return featuredVideos[0];
    }
    return videos?.[0] || null;
  }, [featuredVideos, videos]);

  const recentVideos = useMemo(() => {
    return videos?.slice(0, 10) || [];
  }, [videos]);

  const isLoading = videosLoading || featuredLoading;

  if (isLoading) {
    return (
      <TVLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      </TVLayout>
    );
  }

  return (
    <TVLayout>
      <div className="min-h-screen p-8 lg:p-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Film className="w-12 h-12 lg:w-16 lg:h-16 text-primary" />
            <div>
              <h1 className="font-display text-3xl lg:text-4xl tracking-wider text-foreground">
                REZEFLIX
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tv className="w-4 h-4" />
                <span className="text-sm">Mobile & TV Edition</span>
              </div>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-5 h-5" />
              <span className="text-sm truncate max-w-[150px]">{user.email}</span>
            </div>
          )}
        </header>

        {/* Featured Hero */}
        {featuredVideo && (
          <div className="mb-12 rounded-3xl overflow-hidden relative">
            <div 
              className="aspect-video lg:aspect-[21/9] bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${featuredVideo.banner_url || featuredVideo.poster_url || '/placeholder.svg'})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                <h2 className="font-display text-3xl lg:text-5xl text-foreground mb-3">
                  {featuredVideo.title}
                </h2>
                {featuredVideo.description && (
                  <p className="text-muted-foreground text-lg line-clamp-2 max-w-2xl mb-6">
                    {featuredVideo.description}
                  </p>
                )}
                
                {user && (
                  <TVButton
                    ref={firstButtonRef}
                    size="lg"
                    onClick={() => navigate(`/watch/${featuredVideo.slug}`)}
                  >
                    <Play className="w-6 h-6" />
                    Assistir Agora
                  </TVButton>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Menu */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {!user ? (
            <>
              <TVButton
                ref={!featuredVideo ? firstButtonRef : undefined}
                size="xl"
                variant="primary"
                className="flex-col h-32 lg:h-40"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-8 h-8 mb-2" />
                Entrar
              </TVButton>
              <TVButton
                size="xl"
                variant="outline"
                className="flex-col h-32 lg:h-40"
                onClick={() => navigate('/auth')}
              >
                <User className="w-8 h-8 mb-2" />
                Criar Conta
              </TVButton>
            </>
          ) : (
            <>
              <TVButton
                ref={!featuredVideo ? firstButtonRef : undefined}
                size="xl"
                variant="primary"
                className="flex-col h-32 lg:h-40"
                onClick={() => navigate('/catalog')}
              >
                <Film className="w-8 h-8 mb-2" />
                Catálogo
              </TVButton>
              <TVButton
                size="xl"
                variant="secondary"
                className="flex-col h-32 lg:h-40"
                onClick={() => navigate('/history')}
              >
                <History className="w-8 h-8 mb-2" />
                Histórico
              </TVButton>
              <TVButton
                size="xl"
                variant="outline"
                className="flex-col h-32 lg:h-40"
                onClick={() => navigate('/tv')}
              >
                <Tv className="w-8 h-8 mb-2" />
                TV ao Vivo
              </TVButton>
              {isAdmin && (
                <TVButton
                  size="xl"
                  variant="ghost"
                  className="flex-col h-32 lg:h-40"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="w-8 h-8 mb-2" />
                  Admin
                </TVButton>
              )}
            </>
          )}
        </div>

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <section className="mb-12">
            <h3 className="font-display text-2xl text-foreground mb-6">
              RECÉM ADICIONADOS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentVideos.map((video) => (
                <button
                  key={video.id}
                  data-focusable="true"
                  onClick={() => user ? navigate(`/watch/${video.slug}`) : navigate('/auth')}
                  className="group relative rounded-xl overflow-hidden aspect-[2/3] bg-secondary outline-none transition-all duration-200 focus:ring-4 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background focus:scale-105 focus:z-10"
                >
                  <img
                    src={video.poster_url || '/placeholder.svg'}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-focus:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-focus:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-focus:opacity-100 transition-opacity">
                    <p className="text-sm font-medium text-white line-clamp-2">{video.title}</p>
                    {video.year && (
                      <p className="text-xs text-white/70">{video.year}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Navigation Hint */}
        <div className="fixed bottom-6 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-4 bg-card/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border">
            <span className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">←→↑↓</span> Navegar
            </span>
            <span className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">OK</span> Selecionar
            </span>
            <span className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">ESC</span> Voltar
            </span>
          </div>
        </div>
      </div>
    </TVLayout>
  );
};

export default IndexMobile;
