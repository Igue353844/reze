import { useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Trash2, Play, Clock, Heart } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useContinueWatching, WatchProgressWithVideo } from '@/hooks/useWatchProgress';
import { useFavorites, FavoriteWithVideo } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatProgress(progressSeconds: number, durationSeconds: number): string {
  const remaining = Math.max(0, durationSeconds - progressSeconds);
  const minutes = Math.floor(remaining / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}min restantes`;
  }
  return `${minutes}min restantes`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getWatchUrl(item: WatchProgressWithVideo): string {
  const baseUrl = `/watch/${item.videos.slug}`;
  if (item.episode_id && item.episodes) {
    return `${baseUrl}?ep=${item.episode_id}`;
  }
  return baseUrl;
}

function HistoryItem({ 
  item, 
  onRemove 
}: { 
  item: WatchProgressWithVideo; 
  onRemove: (id: string) => void;
}) {
  const progressPercent = item.duration_seconds > 0 
    ? (item.progress_seconds / item.duration_seconds) * 100 
    : 0;

  const displayTitle = item.episodes 
    ? `${item.videos.title} - T${item.episodes.seasons?.season_number || '?'}:E${item.episodes.episode_number}`
    : item.videos.title;

  return (
    <div className="flex gap-4 p-4 bg-card rounded-lg group">
      <Link to={getWatchUrl(item)} className="relative w-40 aspect-video flex-shrink-0 rounded overflow-hidden">
        {item.videos.poster_url ? (
          <img
            src={item.videos.poster_url}
            alt={item.videos.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
          <div 
            className="h-full bg-primary"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link to={getWatchUrl(item)} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
            {displayTitle}
          </Link>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatProgress(item.progress_seconds, item.duration_seconds)}
            </span>
            <span>Assistido em {formatDate(item.last_watched_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}

function FavoriteItem({ 
  item, 
  onRemove 
}: { 
  item: FavoriteWithVideo; 
  onRemove: (videoId: string) => void;
}) {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-lg group">
      <Link to={`/watch/${item.videos.slug}`} className="relative w-40 aspect-video flex-shrink-0 rounded overflow-hidden">
        {item.videos.poster_url ? (
          <img
            src={item.videos.poster_url}
            alt={item.videos.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white" />
        </div>
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link to={`/watch/${item.videos.slug}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
            {item.videos.title}
          </Link>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="capitalize">{item.videos.type === 'movie' ? 'Filme' : item.videos.type === 'series' ? 'Série' : 'Trailer'}</span>
            {item.videos.year && <span>{item.videos.year}</span>}
          </div>
          {item.videos.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.videos.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.video_id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Heart className="w-4 h-4 mr-1" />
            Desfavoritar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WatchHistory() {
  const { user } = useAuth();
  const { data: watchProgress, isLoading: isLoadingHistory } = useContinueWatching();
  const { data: favorites, isLoading: isLoadingFavorites } = useFavorites();
  const queryClient = useQueryClient();
  const [itemToRemove, setItemToRemove] = useState<{ id: string; type: 'history' | 'favorite' } | null>(null);

  const handleRemoveHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['watch-progress'] });
      toast.success('Item removido do histórico');
    } catch (error) {
      toast.error('Erro ao remover item');
    }
    setItemToRemove(null);
  };

  const handleRemoveFavorite = async (videoId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Removido dos favoritos');
    } catch (error) {
      toast.error('Erro ao remover favorito');
    }
    setItemToRemove(null);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-3xl text-foreground mb-4">Histórico de Visualização</h1>
          <p className="text-muted-foreground mb-8">Faça login para ver seu histórico e favoritos.</p>
          <Link to="/auth">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-8">Minha Biblioteca</h1>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              Favoritos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {isLoadingHistory ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-card rounded-lg animate-pulse" />
                ))}
              </div>
            ) : watchProgress && watchProgress.length > 0 ? (
              <div className="space-y-4">
                {watchProgress.map((item) => (
                  <HistoryItem 
                    key={item.id} 
                    item={item} 
                    onRemove={(id) => setItemToRemove({ id, type: 'history' })}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Seu histórico está vazio.</p>
                <Link to="/catalog" className="mt-4 inline-block">
                  <Button>Explorar Catálogo</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {isLoadingFavorites ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-card rounded-lg animate-pulse" />
                ))}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="space-y-4">
                {favorites.map((item) => (
                  <FavoriteItem 
                    key={item.id} 
                    item={item} 
                    onRemove={(videoId) => setItemToRemove({ id: videoId, type: 'favorite' })}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não tem favoritos.</p>
                <Link to="/catalog" className="mt-4 inline-block">
                  <Button>Explorar Catálogo</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
              <AlertDialogDescription>
                {itemToRemove?.type === 'history' 
                  ? 'Deseja remover este item do seu histórico?'
                  : 'Deseja remover este item dos seus favoritos?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (itemToRemove?.type === 'history') {
                    handleRemoveHistory(itemToRemove.id);
                  } else if (itemToRemove?.type === 'favorite') {
                    handleRemoveFavorite(itemToRemove.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
