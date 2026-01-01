import { useParams } from 'react-router-dom';
import { useVideo } from '@/hooks/useVideos';

const Embed = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: video, isLoading, error } = useVideo(slug || '');

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video || !video.video_url) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Vídeo não encontrado</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black">
      <video
        src={video.video_url}
        poster={video.banner_url || video.poster_url || undefined}
        className="w-full h-full object-contain"
        controls
        autoPlay
        playsInline
      />
    </div>
  );
};

export default Embed;
