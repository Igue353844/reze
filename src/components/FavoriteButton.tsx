import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  videoId: string;
  videoTitle: string;
  variant?: 'default' | 'icon';
  className?: string;
}

export function FavoriteButton({ videoId, videoTitle, variant = 'default', className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { data: isFavorite, isLoading } = useIsFavorite(videoId);
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();

  const handleToggle = () => {
    if (!user) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    toggleFavorite(
      { videoId, isFavorite: !!isFavorite },
      {
        onSuccess: (result) => {
          if (result.action === 'added') {
            toast.success(`"${videoTitle}" adicionado aos favoritos`);
          } else {
            toast.success(`"${videoTitle}" removido dos favoritos`);
          }
        },
        onError: () => {
          toast.error('Erro ao atualizar favoritos');
        },
      }
    );
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isLoading || isPending}
        className={cn('hover:bg-primary/20', className)}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart 
          className={cn(
            'w-5 h-5 transition-colors',
            isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'
          )} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      onClick={handleToggle}
      disabled={isLoading || isPending}
      className={cn('gap-2', className)}
    >
      <Heart 
        className={cn(
          'w-4 h-4',
          isFavorite && 'fill-current'
        )} 
      />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  );
}
