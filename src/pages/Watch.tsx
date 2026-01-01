import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Tag, Copy, Check } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoCarousel } from '@/components/VideoCarousel';
import { Button } from '@/components/ui/button';
import { useVideo, useVideos } from '@/hooks/useVideos';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';

const Watch = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: video, isLoading, error } = useVideo(slug || '');
  const { data: allVideos } = useVideos();
  const [copied, setCopied] = useState(false);

  const relatedVideos = allVideos?.filter(
    v => v.id !== video?.id && v.category_id === video?.category_id
  ).slice(0, 10) || [];

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getEmbedCode = () => {
    if (!video?.video_url) return '';
    const embedUrl = window.location.origin + `/embed/${video.slug}`;
    return `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    toast.success('Código embed copiado!');
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="font-display text-4xl text-foreground mb-4">
            VÍDEO NÃO ENCONTRADO
          </h1>
          <p className="text-muted-foreground mb-8">
            O vídeo que você está procurando não existe ou foi removido.
          </p>
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
      {/* Video Section */}
      <div className="bg-black">
        <div className="container mx-auto px-4 py-4">
          {/* Back Button */}
          <Link to="/catalog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Video Player */}
          {video.video_url ? (
            <VideoPlayer 
              src={video.video_url} 
              poster={video.banner_url || video.poster_url || undefined}
              title={video.title}
            />
          ) : (
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Nenhum vídeo disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl">
          {/* Title and Type */}
          <div className="flex flex-wrap items-start gap-4 mb-4">
            <h1 className="font-display text-3xl lg:text-5xl text-foreground">
              {video.title}
            </h1>
            <span className="px-3 py-1 text-sm font-medium rounded bg-primary text-primary-foreground">
              {video.type === 'movie' && 'Filme'}
              {video.type === 'series' && 'Série'}
              {video.type === 'trailer' && 'Trailer'}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            {video.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {video.year}
              </span>
            )}
            {video.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(video.duration_minutes)}
              </span>
            )}
            {video.categories && (
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {video.categories.name}
              </span>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {video.description}
            </p>
          )}

          {/* Embed Code */}
          {video.video_url && (
            <div className="bg-card rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-foreground mb-2">Código Embed</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Use este código para incorporar o vídeo em outro site:
              </p>
              <div className="flex gap-2">
                <code className="flex-1 bg-secondary px-3 py-2 rounded text-sm text-muted-foreground overflow-x-auto">
                  {getEmbedCode()}
                </code>
                <Button variant="secondary" size="sm" onClick={copyEmbedCode} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Related Videos */}
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
