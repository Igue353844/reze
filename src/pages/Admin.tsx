import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Film, 
  Trash2, 
  Plus, 
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Users,
  Video,
  LogOut,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Tv,
  Radio
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useVideos, useCategories, useCreateVideo, useDeleteVideo } from '@/hooks/useVideos';
import { useUpload } from '@/hooks/useUpload';
import { UploadProgressBar } from '@/components/UploadProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { ContentType, Video as VideoType } from '@/types/video';
import { SeriesManager } from '@/components/SeriesManager';
import { ChannelManager } from '@/components/ChannelManager';

// Video list item component with series management
function VideoListItem({ 
  video, 
  onDelete 
}: { 
  video: VideoType; 
  onDelete: (id: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-secondary rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-16 h-24 rounded overflow-hidden bg-muted flex-shrink-0">
          {video.poster_url ? (
            <img 
              src={video.poster_url} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link 
            to={`/watch/${video.slug}`}
            className="font-medium text-foreground hover:text-primary truncate block"
          >
            {video.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded">
              {video.type === 'movie' && 'Filme'}
              {video.type === 'series' && 'Série'}
              {video.type === 'trailer' && 'Trailer'}
            </span>
            {video.year && <span>{video.year}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {video.type === 'series' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="text-primary hover:text-primary"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(video.id, video.title)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Series Manager */}
      {video.type === 'series' && expanded && (
        <div className="px-3 pb-3 border-t border-border pt-3">
          <SeriesManager video={video} />
        </div>
      )}
    </div>
  );
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: categories } = useCategories();
  const createVideo = useCreateVideo();
  const deleteVideo = useDeleteVideo();
  const { uploadVideo, uploadPoster, isUploading, progress, error: uploadError, cancelUpload } = useUpload();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'movie' as ContentType,
    year: '',
    duration_minutes: '',
    category_id: '',
    is_featured: false,
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('O título é obrigatório');
      return;
    }

    if (!isAdmin) {
      toast.error('Você não tem permissão para adicionar vídeos');
      return;
    }

    setIsSubmitting(true);

    try {
      let poster_url: string | undefined;
      let video_url: string | undefined;

      // Upload poster
      if (posterFile) {
        toast.info('Enviando poster...');
        poster_url = await uploadPoster(posterFile) || undefined;
        if (!poster_url) {
          throw new Error('Falha ao enviar poster');
        }
      }

      // Upload video
      if (videoFile) {
        toast.info('Enviando vídeo...');
        video_url = await uploadVideo(videoFile) || undefined;
        if (!video_url) {
          throw new Error('Falha ao enviar vídeo');
        }
      }

      // Create video entry
      await createVideo.mutateAsync({
        title: formData.title,
        slug: generateSlug(formData.title) + '-' + Date.now(),
        description: formData.description || undefined,
        type: formData.type,
        year: formData.year ? parseInt(formData.year) : undefined,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        category_id: formData.category_id || undefined,
        is_featured: formData.is_featured,
        poster_url,
        banner_url: poster_url,
        video_url,
      });

      toast.success('Vídeo adicionado com sucesso!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'movie',
        year: '',
        duration_minutes: '',
        category_id: '',
        is_featured: false,
      });
      setPosterFile(null);
      setVideoFile(null);
      setPosterPreview(null);

    } catch (error) {
      console.error('Error creating video:', error);
      toast.error('Erro ao adicionar vídeo. Verifique suas permissões.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!isAdmin) {
      toast.error('Você não tem permissão para excluir vídeos');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir "${title}"?`)) {
      try {
        await deleteVideo.mutateAsync(id);
        toast.success('Vídeo excluído');
      } catch (error) {
        toast.error('Erro ao excluir vídeo. Verifique suas permissões.');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="font-display text-4xl text-foreground mb-4">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground mb-2">
            Você está logado como: <span className="text-foreground">{user.email}</span>
          </p>
          <p className="text-muted-foreground mb-8">
            Sua conta não possui permissão de administrador para gerenciar vídeos.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="secondary" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Início
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-4xl text-foreground">PAINEL DE ADMIN</h1>
              <p className="text-muted-foreground">Logado como: {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/users">
              <Button variant="secondary" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Gerenciar Admins</span>
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="videos" className="gap-2">
              <Film className="w-4 h-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="tv" className="gap-2">
              <Radio className="w-4 h-4" />
              TV ao Vivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
          {/* Upload Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Adicionar Novo Vídeo
              </CardTitle>
              <CardDescription>
                Preencha as informações e faça upload do conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome do filme ou série"
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Sinopse</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do conteúdo"
                    rows={3}
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Type and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: ContentType) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="movie">Filme</SelectItem>
                        <SelectItem value="series">Série</SelectItem>
                        <SelectItem value="trailer">Trailer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Year and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="2024"
                      className="bg-secondary border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="120"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                {/* Poster Upload */}
                <div>
                  <Label>Poster / Capa</Label>
                  <div className="mt-2">
                    {posterPreview ? (
                      <div className="relative w-32 aspect-[2/3] rounded-lg overflow-hidden">
                        <img 
                          src={posterPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 w-6 h-6"
                          onClick={() => {
                            setPosterFile(null);
                            setPosterPreview(null);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Clique para enviar</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePosterChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <Label>Arquivo de Vídeo</Label>
                  <div className="mt-2">
                    {videoFile ? (
                      <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                        <Video className="w-8 h-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {videoFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setVideoFile(null)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Clique para enviar vídeo
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          MP4, WebM, MKV, MOV, AVI (máx. 10GB)
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Destaque</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir no banner principal
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                </div>

                {/* Progress */}
                {(isUploading || progress || uploadError) && (
                  <UploadProgressBar
                    progress={progress}
                    isUploading={isUploading}
                    error={uploadError}
                    fileName={videoFile?.name || posterFile?.name}
                    onCancel={cancelUpload}
                  />
                )}

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar Vídeo
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Video List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" />
                Vídeos Cadastrados
              </CardTitle>
              <CardDescription>
                {videos?.length || 0} vídeos no catálogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {videos.map(video => (
                    <VideoListItem
                      key={video.id}
                      video={video}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum vídeo cadastrado ainda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* TV ao Vivo Tab */}
          <TabsContent value="tv">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  Canais de TV ao Vivo
                </CardTitle>
                <CardDescription>
                  Gerencie os canais de TV com streaming m3u8
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChannelManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
