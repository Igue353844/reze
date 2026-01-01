import { useState } from 'react';
import { Plus, Trash2, Upload, Loader2, Film, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSeasonsWithEpisodes, useCreateSeason, useDeleteSeason, useCreateEpisode, useDeleteEpisode } from '@/hooks/useSeasons';
import { useUpload } from '@/hooks/useUpload';
import { UploadProgressBar } from '@/components/UploadProgressBar';
import { toast } from 'sonner';
import type { Video, SeasonWithEpisodes } from '@/types/video';

interface SeriesManagerProps {
  video: Video;
}

export function SeriesManager({ video }: SeriesManagerProps) {
  const { data: seasons, isLoading } = useSeasonsWithEpisodes(video.id);
  const createSeason = useCreateSeason();
  const deleteSeason = useDeleteSeason();
  const createEpisode = useCreateEpisode();
  const deleteEpisode = useDeleteEpisode();
  const { uploadVideo, uploadPoster, isUploading, progress, error: uploadError, cancelUpload } = useUpload();

  const [expandedSeasons, setExpandedSeasons] = useState<string[]>([]);
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [addingEpisodeToSeason, setAddingEpisodeToSeason] = useState<string | null>(null);

  // Season form state
  const [seasonForm, setSeasonForm] = useState({
    season_number: '',
    title: '',
  });
  const [seasonPosterFile, setSeasonPosterFile] = useState<File | null>(null);
  const [seasonPosterPreview, setSeasonPosterPreview] = useState<string | null>(null);
  const [isSubmittingSeason, setIsSubmittingSeason] = useState(false);

  // Episode form state
  const [episodeForm, setEpisodeForm] = useState({
    episode_number: '',
    title: '',
    description: '',
    duration_minutes: '',
  });
  const [episodePosterFile, setEpisodePosterFile] = useState<File | null>(null);
  const [episodePosterPreview, setEpisodePosterPreview] = useState<string | null>(null);
  const [episodeVideoFile, setEpisodeVideoFile] = useState<File | null>(null);
  const [isSubmittingEpisode, setIsSubmittingEpisode] = useState(false);

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons(prev => 
      prev.includes(seasonId) 
        ? prev.filter(id => id !== seasonId)
        : [...prev, seasonId]
    );
  };

  const handleSeasonPosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSeasonPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSeasonPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEpisodePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEpisodePosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEpisodePosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEpisodeVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEpisodeVideoFile(file);
    }
  };

  const handleAddSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seasonForm.season_number) {
      toast.error('Número da temporada é obrigatório');
      return;
    }

    setIsSubmittingSeason(true);
    try {
      let poster_url: string | undefined;

      if (seasonPosterFile) {
        toast.info('Enviando capa da temporada...');
        poster_url = await uploadPoster(seasonPosterFile) || undefined;
      }

      await createSeason.mutateAsync({
        video_id: video.id,
        season_number: parseInt(seasonForm.season_number),
        title: seasonForm.title || undefined,
        poster_url,
      });

      toast.success('Temporada adicionada!');
      setSeasonForm({ season_number: '', title: '' });
      setSeasonPosterFile(null);
      setSeasonPosterPreview(null);
      setShowAddSeason(false);
    } catch (error) {
      console.error('Error creating season:', error);
      toast.error('Erro ao adicionar temporada');
    } finally {
      setIsSubmittingSeason(false);
    }
  };

  const handleDeleteSeason = async (seasonId: string, seasonNumber: number) => {
    if (confirm(`Excluir Temporada ${seasonNumber}? Todos os episódios serão removidos.`)) {
      try {
        await deleteSeason.mutateAsync({ id: seasonId, videoId: video.id });
        toast.success('Temporada excluída');
      } catch (error) {
        toast.error('Erro ao excluir temporada');
      }
    }
  };

  const handleAddEpisode = async (e: React.FormEvent, seasonId: string) => {
    e.preventDefault();
    
    if (!episodeForm.episode_number || !episodeForm.title) {
      toast.error('Número e título do episódio são obrigatórios');
      return;
    }

    setIsSubmittingEpisode(true);
    try {
      let poster_url: string | undefined;
      let video_url: string | undefined;

      if (episodePosterFile) {
        toast.info('Enviando capa do episódio...');
        poster_url = await uploadPoster(episodePosterFile) || undefined;
      }

      if (episodeVideoFile) {
        toast.info('Enviando vídeo do episódio...');
        video_url = await uploadVideo(episodeVideoFile) || undefined;
      }

      await createEpisode.mutateAsync({
        season_id: seasonId,
        episode_number: parseInt(episodeForm.episode_number),
        title: episodeForm.title,
        description: episodeForm.description || undefined,
        duration_minutes: episodeForm.duration_minutes ? parseInt(episodeForm.duration_minutes) : undefined,
        poster_url,
        video_url,
      });

      toast.success('Episódio adicionado!');
      setEpisodeForm({ episode_number: '', title: '', description: '', duration_minutes: '' });
      setEpisodePosterFile(null);
      setEpisodePosterPreview(null);
      setEpisodeVideoFile(null);
      setAddingEpisodeToSeason(null);
    } catch (error) {
      console.error('Error creating episode:', error);
      toast.error('Erro ao adicionar episódio');
    } finally {
      setIsSubmittingEpisode(false);
    }
  };

  const handleDeleteEpisode = async (episodeId: string, seasonId: string, episodeNumber: number) => {
    if (confirm(`Excluir Episódio ${episodeNumber}?`)) {
      try {
        await deleteEpisode.mutateAsync({ id: episodeId, seasonId });
        toast.success('Episódio excluído');
      } catch (error) {
        toast.error('Erro ao excluir episódio');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Season Button */}
      {!showAddSeason && (
        <Button onClick={() => setShowAddSeason(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Temporada
        </Button>
      )}

      {/* Add Season Form */}
      {showAddSeason && (
        <Card className="bg-secondary border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Nova Temporada</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSeason} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número da Temporada *</Label>
                  <Input
                    type="number"
                    value={seasonForm.season_number}
                    onChange={(e) => setSeasonForm(prev => ({ ...prev, season_number: e.target.value }))}
                    placeholder="1"
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label>Título (opcional)</Label>
                  <Input
                    value={seasonForm.title}
                    onChange={(e) => setSeasonForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: O Início"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              {/* Season Poster */}
              <div>
                <Label>Capa da Temporada</Label>
                <div className="mt-2">
                  {seasonPosterPreview ? (
                    <div className="relative w-24 aspect-[2/3] rounded overflow-hidden">
                      <img src={seasonPosterPreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-5 h-5"
                        onClick={() => { setSeasonPosterFile(null); setSeasonPosterPreview(null); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Capa da temporada</span>
                      <input type="file" accept="image/*" onChange={handleSeasonPosterChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmittingSeason || isUploading} className="gap-2">
                  {isSubmittingSeason ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Adicionar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddSeason(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Seasons List */}
      {seasons && seasons.length > 0 ? (
        <div className="space-y-3">
          {seasons.map((season) => (
            <Collapsible
              key={season.id}
              open={expandedSeasons.includes(season.id)}
              onOpenChange={() => toggleSeason(season.id)}
            >
              <Card className="bg-secondary border-border">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {season.poster_url ? (
                          <img src={season.poster_url} alt="" className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                            <Film className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">
                            Temporada {season.season_number}
                            {season.title && ` - ${season.title}`}
                          </CardTitle>
                          <CardDescription>{season.episodes.length} episódios</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSeason(season.id, season.season_number); }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {expandedSeasons.includes(season.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {/* Episodes */}
                    {season.episodes.length > 0 && (
                      <div className="space-y-2">
                        {season.episodes.map((episode) => (
                          <div key={episode.id} className="flex items-center gap-3 p-2 bg-background rounded">
                            {episode.poster_url ? (
                              <img src={episode.poster_url} alt="" className="w-16 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                <Film className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                E{episode.episode_number}: {episode.title}
                              </p>
                              {episode.duration_minutes && (
                                <p className="text-xs text-muted-foreground">{episode.duration_minutes} min</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEpisode(episode.id, season.id, episode.episode_number)}
                              className="text-destructive hover:text-destructive h-8 w-8"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Episode Form */}
                    {addingEpisodeToSeason === season.id ? (
                      <form onSubmit={(e) => handleAddEpisode(e, season.id)} className="space-y-3 p-3 bg-background rounded border border-border">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Número *</Label>
                            <Input
                              type="number"
                              value={episodeForm.episode_number}
                              onChange={(e) => setEpisodeForm(prev => ({ ...prev, episode_number: e.target.value }))}
                              placeholder="1"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duração (min)</Label>
                            <Input
                              type="number"
                              value={episodeForm.duration_minutes}
                              onChange={(e) => setEpisodeForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                              placeholder="45"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Título *</Label>
                          <Input
                            value={episodeForm.title}
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Título do episódio"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Descrição</Label>
                          <Textarea
                            value={episodeForm.description}
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Sinopse do episódio"
                            rows={2}
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Episode Poster */}
                          <div>
                            <Label className="text-xs">Capa do Episódio</Label>
                            {episodePosterPreview ? (
                              <div className="relative w-full aspect-video rounded overflow-hidden mt-1">
                                <img src={episodePosterPreview} alt="Preview" className="w-full h-full object-cover" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 w-5 h-5"
                                  onClick={() => { setEpisodePosterFile(null); setEpisodePosterPreview(null); }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors mt-1">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Capa</span>
                                <input type="file" accept="image/*" onChange={handleEpisodePosterChange} className="hidden" />
                              </label>
                            )}
                          </div>

                          {/* Episode Video */}
                          <div>
                            <Label className="text-xs">Vídeo</Label>
                            {episodeVideoFile ? (
                              <div className="flex items-center gap-2 p-2 bg-secondary rounded mt-1">
                                <Film className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="text-xs truncate flex-1">{episodeVideoFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => setEpisodeVideoFile(null)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded cursor-pointer hover:border-primary transition-colors mt-1">
                                <Upload className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Vídeo</span>
                                <input type="file" accept="video/*" onChange={handleEpisodeVideoChange} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Progress */}
                        {(isUploading || progress || uploadError) && (
                          <UploadProgressBar
                            progress={progress}
                            isUploading={isUploading}
                            error={uploadError}
                            fileName={episodeVideoFile?.name || episodePosterFile?.name}
                            onCancel={cancelUpload}
                          />
                        )}

                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={isSubmittingEpisode || isUploading} className="gap-1">
                            {isSubmittingEpisode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Adicionar
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setAddingEpisodeToSeason(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingEpisodeToSeason(season.id)}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Episódio
                      </Button>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      ) : (
        !showAddSeason && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma temporada cadastrada. Adicione a primeira temporada para começar.
          </p>
        )
      )}
    </div>
  );
}
