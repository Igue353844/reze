import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVideos } from '@/hooks/useVideos';
import { useSeasons } from '@/hooks/useSeasons';
import { useWatchParty } from '@/hooks/useWatchParty';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Film, Tv, ChevronRight, Link2, Library } from 'lucide-react';
import { M3U8Tester } from './M3U8Tester';

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  video_url: string | null;
}

interface CreatePartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePartyDialog({ open, onOpenChange }: CreatePartyDialogProps) {
  const navigate = useNavigate();
  const { data: videos } = useVideos();
  const { createParty } = useWatchParty();
  const [name, setName] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedEpisode, setSelectedEpisode] = useState<string>('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  
  // Custom M3U8 state
  const [contentTab, setContentTab] = useState<'library' | 'custom'>('library');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isM3U8Valid, setIsM3U8Valid] = useState(false);

  // Get selected video details
  const selectedVideoData = videos?.find(v => v.id === selectedVideo);
  const isSeries = selectedVideoData?.type === 'series';

  // Get seasons for selected series
  const { data: seasons } = useSeasons(isSeries && selectedVideo ? selectedVideo : '');

  // Load episodes when season is selected
  useEffect(() => {
    if (!selectedSeason) {
      setEpisodes([]);
      return;
    }

    const loadEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const { data, error } = await supabase
          .from('episodes')
          .select('id, title, episode_number, video_url')
          .eq('season_id', selectedSeason)
          .order('episode_number');

        if (error) throw error;
        setEpisodes(data || []);
      } catch (error) {
        console.error('Error loading episodes:', error);
        setEpisodes([]);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    loadEpisodes();
  }, [selectedSeason]);

  // Reset selections when video changes
  useEffect(() => {
    setSelectedSeason('');
    setSelectedEpisode('');
    setEpisodes([]);
  }, [selectedVideo]);

  // Reset episode when season changes
  useEffect(() => {
    setSelectedEpisode('');
  }, [selectedSeason]);

  // Reset custom fields when switching tabs
  useEffect(() => {
    if (contentTab === 'library') {
      setCustomUrl('');
      setCustomTitle('');
      setIsM3U8Valid(false);
    } else {
      setSelectedVideo('');
      setSelectedSeason('');
      setSelectedEpisode('');
    }
  }, [contentTab]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome para a sala');
      return;
    }

    // Validate based on content type
    if (contentTab === 'custom') {
      if (!customUrl.trim()) {
        toast.error('Digite a URL do stream M3U8');
        return;
      }
      if (!isM3U8Valid) {
        toast.error('Teste e valide o link M3U8 antes de criar a sala');
        return;
      }
      if (!customTitle.trim()) {
        toast.error('Digite um título para o conteúdo');
        return;
      }
    } else {
      // Library mode - series requires episode
      if (isSeries && selectedVideo && selectedVideo !== 'none') {
        if (!selectedEpisode) {
          toast.error('Selecione um episódio para assistir');
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      const party = await createParty.mutateAsync({
        name: name.trim(),
        videoId: contentTab === 'library' && selectedVideo && selectedVideo !== 'none' ? selectedVideo : undefined,
        episodeId: contentTab === 'library' && selectedEpisode ? selectedEpisode : undefined,
        customUrl: contentTab === 'custom' ? customUrl : undefined,
        customTitle: contentTab === 'custom' ? customTitle : undefined,
      });
      
      toast.success('Sala criada com sucesso!');
      onOpenChange(false);
      navigate(`/party/${party.id}`);
    } catch (error) {
      toast.error('Erro ao criar sala');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate movies and series for better organization
  const movies = videos?.filter(v => v.type === 'movie') || [];
  const series = videos?.filter(v => v.type === 'series') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Watch Party
          </DialogTitle>
          <DialogDescription>
            Crie uma sala para assistir com seus amigos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Sala</Label>
            <Input
              id="name"
              placeholder="Ex: Noite de Filmes"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          {/* Content source tabs */}
          <Tabs value={contentTab} onValueChange={(v) => setContentTab(v as 'library' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library" className="gap-2">
                <Library className="h-4 w-4" />
                Biblioteca
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Link2 className="h-4 w-4" />
                Link M3U8
              </TabsTrigger>
            </TabsList>

            {/* Library content */}
            <TabsContent value="library" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="video">Conteúdo (opcional)</Label>
                <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um filme ou série" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Escolher depois</SelectItem>
                    
                    {movies.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Film className="h-3 w-3" />
                          Filmes
                        </div>
                        {movies.map((video) => (
                          <SelectItem key={video.id} value={video.id}>
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4 text-muted-foreground" />
                              {video.title}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    
                    {series.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                          <Tv className="h-3 w-3" />
                          Séries
                        </div>
                        {series.map((video) => (
                          <SelectItem key={video.id} value={video.id}>
                            <div className="flex items-center gap-2">
                              <Tv className="h-4 w-4 text-muted-foreground" />
                              {video.title}
                              <Badge variant="secondary" className="text-xs">Série</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Season selector for series */}
              {isSeries && seasons && seasons.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="season" className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4" />
                    Temporada
                  </Label>
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma temporada" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          Temporada {season.season_number}
                          {season.title && ` - ${season.title}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Episode selector */}
              {isSeries && selectedSeason && (
                <div className="space-y-2">
                  <Label htmlFor="episode" className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4" />
                    Episódio
                  </Label>
                  <Select 
                    value={selectedEpisode} 
                    onValueChange={setSelectedEpisode}
                    disabled={loadingEpisodes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingEpisodes ? "Carregando..." : "Selecione um episódio"} />
                    </SelectTrigger>
                    <SelectContent>
                      {episodes.map((episode) => (
                        <SelectItem 
                          key={episode.id} 
                          value={episode.id}
                          disabled={!episode.video_url}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                              E{episode.episode_number.toString().padStart(2, '0')}
                            </span>
                            <span className="truncate">{episode.title}</span>
                            {!episode.video_url && (
                              <Badge variant="outline" className="text-xs">Sem vídeo</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      {episodes.length === 0 && !loadingEpisodes && (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Nenhum episódio encontrado
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Selection summary */}
              {selectedVideoData && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm font-medium">Selecionado:</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isSeries ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                    <span>{selectedVideoData.title}</span>
                  </div>
                  {selectedSeason && seasons && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                      <ChevronRight className="h-3 w-3" />
                      <span>
                        Temporada {seasons.find(s => s.id === selectedSeason)?.season_number}
                      </span>
                    </div>
                  )}
                  {selectedEpisode && episodes.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-6">
                      <ChevronRight className="h-3 w-3" />
                      <span>
                        {episodes.find(e => e.id === selectedEpisode)?.title}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Custom M3U8 content */}
            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="customTitle">Título do Conteúdo</Label>
                <Input
                  id="customTitle"
                  placeholder="Ex: Meu Filme Favorito"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customUrl">URL do Stream M3U8</Label>
                <Input
                  id="customUrl"
                  placeholder="https://exemplo.com/video.m3u8"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link direto do stream M3U8/HLS
                </p>
              </div>

              {/* M3U8 Tester */}
              {customUrl && (
                <M3U8Tester 
                  url={customUrl} 
                  onValidation={setIsM3U8Valid}
                />
              )}

              {/* Custom content summary */}
              {customTitle && isM3U8Valid && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm font-medium">Selecionado:</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    <span>{customTitle}</span>
                    <Badge variant="secondary" className="text-xs">M3U8</Badge>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Sala'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
