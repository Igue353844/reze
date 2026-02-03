import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { TVLayout } from '@/components/tv/TVLayout';
import { TVVideoPlayer } from '@/components/tv/TVVideoPlayer';
import { useVideos } from '@/hooks/useVideos';
import { useSeasonsWithEpisodes } from '@/hooks/useSeasons';
import { Loader2, Film } from 'lucide-react';
import { useMemo } from 'react';

const WatchMobile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get('episode');

  const { data: videos, isLoading: videosLoading } = useVideos();
  const video = useMemo(() => videos?.find(v => v.slug === slug), [videos, slug]);
  
  const { data: seasons } = useSeasonsWithEpisodes(video?.id || '');

  // Find current episode if watching a series
  const currentEpisode = useMemo(() => {
    if (!episodeId || !seasons) return null;
    for (const season of seasons) {
      const episode = season.episodes?.find(ep => ep.id === episodeId);
      if (episode) return { ...episode, seasonNumber: season.season_number };
    }
    return null;
  }, [episodeId, seasons]);

  // Determine video source
  const videoSrc = useMemo(() => {
    if (currentEpisode?.video_url) return currentEpisode.video_url;
    if (video?.video_url) return video.video_url;
    return '';
  }, [currentEpisode, video]);

  // Title to display
  const displayTitle = useMemo(() => {
    if (currentEpisode) {
      return `${video?.title} - T${currentEpisode.seasonNumber}E${currentEpisode.episode_number}: ${currentEpisode.title}`;
    }
    return video?.title || '';
  }, [currentEpisode, video]);

  // Find next episode
  const nextEpisode = useMemo(() => {
    if (!currentEpisode || !seasons) return null;
    
    for (let i = 0; i < seasons.length; i++) {
      const season = seasons[i];
      const episodes = season.episodes || [];
      
      for (let j = 0; j < episodes.length; j++) {
        if (episodes[j].id === episodeId) {
          // Check if there's a next episode in this season
          if (j + 1 < episodes.length) {
            return episodes[j + 1];
          }
          // Check if there's a next season
          if (i + 1 < seasons.length && seasons[i + 1].episodes?.length) {
            return seasons[i + 1].episodes![0];
          }
        }
      }
    }
    return null;
  }, [currentEpisode, seasons, episodeId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleVideoEnded = () => {
    if (nextEpisode) {
      navigate(`/watch/${slug}?episode=${nextEpisode.id}`, { replace: true });
    }
  };

  if (videosLoading) {
    return (
      <TVLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      </TVLayout>
    );
  }

  if (!video) {
    return (
      <TVLayout onBack={handleBack}>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <Film className="w-20 h-20 text-muted-foreground mb-6" />
          <h1 className="font-display text-3xl text-foreground mb-2">Vídeo não encontrado</h1>
          <p className="text-muted-foreground text-lg">O conteúdo que você procura não está disponível.</p>
        </div>
      </TVLayout>
    );
  }

  if (!videoSrc) {
    return (
      <TVLayout onBack={handleBack}>
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <Film className="w-20 h-20 text-muted-foreground mb-6" />
          <h1 className="font-display text-3xl text-foreground mb-2">Vídeo indisponível</h1>
          <p className="text-muted-foreground text-lg">Este conteúdo ainda não possui um vídeo.</p>
        </div>
      </TVLayout>
    );
  }

  return (
    <TVLayout onBack={handleBack}>
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <TVVideoPlayer
          src={videoSrc}
          title={displayTitle}
          poster={currentEpisode?.poster_url || video.poster_url || undefined}
          onBack={handleBack}
          onEnded={handleVideoEnded}
          autoPlay
        />
      </div>
    </TVLayout>
  );
};

export default WatchMobile;
