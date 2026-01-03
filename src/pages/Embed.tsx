import { useParams, useSearchParams } from 'react-router-dom';
import { useVideo } from '@/hooks/useVideos';
import { useSeasonsWithEpisodes } from '@/hooks/useSeasons';

// Check if URL is an embed/iframe link (not a direct video file)
const isEmbedUrl = (url: string): boolean => {
  const embedPatterns = [
    /seekee\.ai/i,
    /drive\.google\.com/i,
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /dailymotion\.com/i,
    /embed/i,
  ];
  return embedPatterns.some(pattern => pattern.test(url));
};

const Embed = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get('ep');
  const { data: video, isLoading, error } = useVideo(slug || '');
  const { data: seasons } = useSeasonsWithEpisodes(video?.id || '');

  // Find episode if episodeId is provided
  let videoUrl = video?.video_url;
  let poster = video?.banner_url || video?.poster_url;

  if (episodeId && seasons) {
    for (const season of seasons) {
      const episode = season.episodes.find(ep => ep.id === episodeId);
      if (episode) {
        videoUrl = episode.video_url;
        poster = episode.poster_url || poster;
        break;
      }
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video || !videoUrl) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Vídeo não encontrado</p>
      </div>
    );
  }

  // If it's an embed URL, use iframe
  if (isEmbedUrl(videoUrl)) {
    return (
      <div className="w-full h-screen bg-black">
        <iframe
          src={videoUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  // Otherwise use native video player
  return (
    <div className="w-full h-screen bg-black">
      <video
        src={videoUrl}
        poster={poster || undefined}
        className="w-full h-full object-contain"
        controls
        autoPlay
        playsInline
      />
    </div>
  );
};

export default Embed;
