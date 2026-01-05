import { useState, useEffect } from 'react';
import { Loader2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateVideo, useCategories } from '@/hooks/useVideos';
import { useUpload } from '@/hooks/useUpload';
import { UploadProgressBar } from '@/components/UploadProgressBar';
import { toast } from 'sonner';
import type { Video, ContentType } from '@/types/video';

interface VideoEditDialogProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoEditDialog({ video, open, onOpenChange }: VideoEditDialogProps) {
  const { data: categories } = useCategories();
  const updateVideo = useUpdateVideo();
  const { uploadPoster, isUploading, progress, error: uploadError, cancelUpload } = useUpload();

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
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        description: video.description || '',
        type: video.type,
        year: video.year?.toString() || '',
        duration_minutes: video.duration_minutes?.toString() || '',
        category_id: video.category_id || '',
        is_featured: video.is_featured,
      });
      setPosterPreview(video.poster_url);
      setBannerPreview(video.banner_url);
      setPosterFile(null);
      setBannerFile(null);
    }
  }, [video]);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    if (!formData.title) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsSubmitting(true);

    try {
      let poster_url: string | undefined;
      let banner_url: string | undefined;

      if (posterFile) {
        toast.info('Enviando poster...');
        poster_url = await uploadPoster(posterFile) || undefined;
        if (!poster_url) {
          throw new Error('Falha ao enviar poster');
        }
      }

      if (bannerFile) {
        toast.info('Enviando banner...');
        banner_url = await uploadPoster(bannerFile) || undefined;
        if (!banner_url) {
          throw new Error('Falha ao enviar banner');
        }
      }

      await updateVideo.mutateAsync({
        id: video.id,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        year: formData.year ? parseInt(formData.year) : undefined,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        category_id: formData.category_id || null,
        is_featured: formData.is_featured,
        poster_url: poster_url || (posterPreview ? video.poster_url : undefined) || undefined,
        banner_url: banner_url || (bannerPreview ? video.banner_url : undefined) || undefined,
      });

      toast.success('Vídeo atualizado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Erro ao atualizar vídeo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Vídeo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nome do filme ou série"
              className="bg-secondary border-border"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="edit-description">Sinopse</Label>
            <Textarea
              id="edit-description"
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
              <Label htmlFor="edit-year">Ano</Label>
              <Input
                id="edit-year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="2024"
                className="bg-secondary border-border"
              />
            </div>

            <div>
              <Label htmlFor="edit-duration">Duração (minutos)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                placeholder="120"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Poster and Banner Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Poster Upload */}
            <div>
              <Label>Poster (Capa do Catálogo)</Label>
              <p className="text-xs text-muted-foreground mb-2">Imagem vertical</p>
              <div className="mt-2">
                {posterPreview ? (
                  <div className="relative w-32 aspect-[2/3] rounded-lg overflow-hidden">
                    <img 
                      src={posterPreview} 
                      alt="Preview Poster" 
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
                    <span className="text-sm text-muted-foreground">Poster</span>
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

            {/* Banner Upload (Player Cover) */}
            <div>
              <Label>Banner (Capa do Player)</Label>
              <p className="text-xs text-muted-foreground mb-2">Imagem horizontal</p>
              <div className="mt-2">
                {bannerPreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={bannerPreview} 
                      alt="Preview Banner" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
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
              fileName={posterFile?.name || bannerFile?.name}
              onCancel={cancelUpload}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}