import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideos } from '@/hooks/useVideos';
import { useWatchParty } from '@/hooks/useWatchParty';
import { toast } from 'sonner';
import { Users, Film } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Digite um nome para a sala');
      return;
    }

    setIsLoading(true);
    try {
      const party = await createParty.mutateAsync({
        name: name.trim(),
        videoId: selectedVideo || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          
          <div className="space-y-2">
            <Label htmlFor="video">Conteúdo (opcional)</Label>
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um filme ou série" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Escolher depois</SelectItem>
                {videos?.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      {video.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
