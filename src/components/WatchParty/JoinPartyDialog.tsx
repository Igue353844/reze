import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWatchParty } from '@/hooks/useWatchParty';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface JoinPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinPartyDialog({ open, onOpenChange }: JoinPartyDialogProps) {
  const navigate = useNavigate();
  const { joinParty } = useWatchParty();
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error('Digite o código da sala');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Digite seu nome');
      return;
    }

    setIsLoading(true);
    try {
      const party = await joinParty.mutateAsync({
        code: code.trim(),
        displayName: displayName.trim(),
      });
      
      toast.success('Você entrou na sala!');
      onOpenChange(false);
      navigate(`/party/${party.id}`);
    } catch (error) {
      toast.error('Sala não encontrada');
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
            <UserPlus className="h-5 w-5" />
            Entrar em uma Sala
          </DialogTitle>
          <DialogDescription>
            Digite o código da sala compartilhado pelo host
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código da Sala</Label>
            <Input
              id="code"
              placeholder="Ex: ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Seu Nome</Label>
            <Input
              id="displayName"
              placeholder="Como você quer ser chamado?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleJoin} disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
