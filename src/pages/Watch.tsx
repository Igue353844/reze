import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Tag, Copy, Check, Play, Film } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoCarousel } from '@/components/VideoCarousel';
import { Button } from '@/components/ui/button';
import { useVideo, useVideos } from '@/hooks/useVideos';
import { useSeasonsWithEpisodes } from '@/hooks/useSeasons';
import { useVideoProgress, useSaveProgress } from '@/hooks/useWatchProgress';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Episode } from '@/types/video';

const Watch = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: video, isLoading, error } = useVideo(slug || '');
  const { data: allVideos } = useVideos();
  const { data: seasons } = useSeasonsWithEpisodes(video?.id || '');
  const [copied, setCopied] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const { user } = useAuth();
  
  // Watch progress hooks
  const { data: watchProgress } = useVideoProgress(
    video?.id,
    currentEpisode?.id
  );
  const { saveProgress, forceSaveProgress } = useSaveProgress();

  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id);
    }
  }, [seasons, selectedSeason]);

  useEffect(() => {
    const episodeId = searchParams.get('ep');
    if (episodeId && seasons) {
      for (const season of seasons) {
        const episode = season.episodes.find(ep => ep.id === episodeId);
        if (episode) {
          setCurrentEpisode(episode);
          setSelectedSeason(season.id);
          break;
        }
      }
    }
  }, [searchParams, seasons]);

  // Handle progress update from video player
  const handleProgressUpdate = useCallback((progressSeconds: number, durationSeconds: number) => {
    if (!user || !video?.id) return;
    
    saveProgress({
      videoId: video.id,
      episodeId: currentEpisode?.id || null,
      progressSeconds,
      durationSeconds,
    });
  }, [user, video?.id, currentEpisode?.id, saveProgress]);

  // Force save on unmount
  useEffect(() => {
    return () => {
      // This cleanup runs when navigating away
    };
  }, []);

  const relatedVideos = allVideos?.filter(
    v => v.id !== video?.id && v.category_id === video?.category_id
  ).slice(0, 10) || [];

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const currentVideoUrl = currentEpisode?.video_url || video?.video_url;
  const currentPoster = currentEpisode?.poster_url || video?.banner_url || video?.poster_url;

  const getEmbedCode = () => {
    if (!currentVideoUrl) return '';
    const embedUrl = currentEpisode 
      ? window.location.origin + `/embed/${video?.slug}?ep=${currentEpisode.id}`
      : window.location.origin + `/embed/${video?.slug}`;
    return `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    toast.success('Código embed copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const playEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setSearchParams({ ep: episode.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="aspect-video w-full max-w-5xl mx-auto rounded-lg" />
          <div className="max-w-5xl mx-auto mt-8">
            <Skeleton className="h-10 w-96 mb-4" />
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !video) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-4xl text-foreground mb-4">VÍDEO NÃO ENCONTRADO</h1>
          <p className="text-muted-foreground mb-8">O vídeo que você está procurando não existe ou foi removido.</p>
          <Link to="/catalog">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Catálogo
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-black">
        <div className="container mx-auto px-4 py-4">
          <Link to="/catalog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {currentVideoUrl ? (
            <VideoPlayer 
              src={currentVideoUrl} 
              poster={currentPoster || undefined}
              title={currentEpisode ? `${video.title} - ${currentEpisode.title}` : video.title}
              videoId={video.id}
              episodeId={currentEpisode?.id || null}
              initialProgress={watchProgress?.progress_seconds}
              onProgressUpdate={handleProgressUpdate}
            />
          ) : (
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                {video.type === 'series' && seasons && seasons.length > 0 
                  ? 'Selecione um episódio para assistir'
                  : 'Nenhum vídeo disponível'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl">
          <div className="flex flex-wrap items-start gap-4 mb-4">
            <h1 className="font-display text-3xl lg:text-5xl text-foreground flex-1">{video.title}</h1>
            <div className="flex items-center gap-2">
              <FavoriteButton videoId={video.id} videoTitle={video.title} />
              <span className="px-3 py-1 text-sm font-medium rounded bg-primary text-primary-foreground">
                {video.type === 'movie' && 'Filme'}
                {video.type === 'series' && 'Série'}
                {video.type === 'trailer' && 'Trailer'}
              </span>
            </div>
          </div>

          {currentEpisode && (
            <div className="bg-card rounded-lg p-4 mb-4">
              <p className="text-lg font-medium text-foreground">
                T{seasons?.find(s => s.id === currentEpisode.season_id)?.season_number || '?'}:E{currentEpisode.episode_number} - {currentEpisode.title}
              </p>
              {currentEpisode.description && (
                <p className="text-sm text-muted-foreground mt-2">{currentEpisode.description}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            {video.year && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{video.year}</span>}
            {(currentEpisode?.duration_minutes || video.duration_minutes) && (
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(currentEpisode?.duration_minutes || video.duration_minutes)}</span>
            )}
            {video.categories && <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{video.categories.name}</span>}
          </div>

          {video.description && !currentEpisode && (
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">{video.description}</p>
          )}

          {video.type === 'series' && seasons && seasons.length > 0 && (
            <div className="bg-card rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-foreground mb-4">Episódios</h3>
              <Tabs value={selectedSeason} onValueChange={setSelectedSeason}>
                <TabsList className="mb-4">
                  {seasons.map((season) => (
                    <TabsTrigger key={season.id} value={season.id}>T{season.season_number}</TabsTrigger>
                  ))}
                </TabsList>
                {seasons.map((season) => (
                  <TabsContent key={season.id} value={season.id}>
                    {season.episodes.length > 0 ? (
                      <div className="grid gap-3">
                        {season.episodes.map((episode) => (
                          <button
                            key={episode.id}
                            onClick={() => playEpisode(episode)}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-colors text-left w-full ${
                              currentEpisode?.id === episode.id ? 'bg-primary/20 border border-primary' : 'bg-secondary hover:bg-secondary/80'
                            }`}
                          >
                            <div className="relative w-32 aspect-video rounded overflow-hidden bg-muted flex-shrink-0">
                              {episode.poster_url ? (
                                <img src={episode.poster_url} alt={episode.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-muted-foreground" /></div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play className="w-8 h-8 text-white" /></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">E{episode.episode_number}: {episode.title}</p>
                              {episode.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{episode.description}</p>}
                              {episode.duration_minutes && <p className="text-xs text-muted-foreground mt-1">{formatDuration(episode.duration_minutes)}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Nenhum episódio disponível</p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {currentVideoUrl && (
            <div className="bg-card rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-foreground mb-2">Código Embed</h3>
              <p className="text-sm text-muted-foreground mb-3">Use este código para incorporar o vídeo em outro site:</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-secondary px-3 py-2 rounded text-sm text-muted-foreground overflow-x-auto">{getEmbedCode()}</code>
                <Button variant="secondary" size="sm" onClick={copyEmbedCode} className="gap-2">
                  {copied ? <><Check className="w-4 h-4" />Copiado</> : <><Copy className="w-4 h-4" />Copiar</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        {relatedVideos.length > 0 && (
          <div className="mt-12">
            <VideoCarousel title="Relacionados" videos={relatedVideos} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Watch;
