import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncedVideoPlayer } from '@/components/WatchParty/SyncedVideoPlayer';
import { PartyChat } from '@/components/WatchParty/PartyChat';
import { PartyParticipants } from '@/components/WatchParty/PartyParticipants';
import { useWatchParty } from '@/hooks/useWatchParty';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Copy, 
  LogOut, 
  Crown, 
  Users, 
  XCircle,
  Share2
} from 'lucide-react';

export default function WatchPartyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    party, 
    participants, 
    messages, 
    isLoading, 
    isHost,
    sendMessage,
    updatePlayback,
    leaveParty,
    endParty
  } = useWatchParty(id);

  const handleCopyCode = () => {
    if (party?.code) {
      navigator.clipboard.writeText(party.code);
      toast.success('Código copiado!');
    }
  };

  const handleShare = async () => {
    if (party?.code) {
      const shareData = {
        title: `Watch Party: ${party.name}`,
        text: `Entre na minha Watch Party! Código: ${party.code}`,
        url: window.location.href,
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Link copiado para compartilhar!');
      }
    }
  };

  const handleLeave = async () => {
    try {
      await leaveParty.mutateAsync();
      toast.success('Você saiu da sala');
      navigate('/party');
    } catch (error) {
      toast.error('Erro ao sair da sala');
    }
  };

  const handleEnd = async () => {
    try {
      await endParty.mutateAsync();
      toast.success('Sala encerrada');
      navigate('/party');
    } catch (error) {
      toast.error('Erro ao encerrar sala');
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage.mutateAsync(message);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!party) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sala não encontrada</h2>
              <p className="text-muted-foreground mb-4">
                Esta sala pode ter sido encerrada ou não existe.
              </p>
              <Button onClick={() => navigate('/party')}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{party.name}</h1>
              {isHost && (
                <Badge className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Host
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participants.length} participante(s)</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              <span className="font-mono font-bold">{party.code}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            
            {isHost ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEnd}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Encerrar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeave}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video player */}
          <div className="lg:col-span-2">
            <SyncedVideoPlayer
              party={party}
              isHost={isHost}
              onPlaybackUpdate={updatePlayback}
            />
            
            {party.videos && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold">{party.videos.title}</h2>
                {party.episodes && (
                  <p className="text-muted-foreground">{party.episodes.title}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <PartyParticipants participants={participants} />
            <PartyChat
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUserId={user?.id}
              className="h-[400px]"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
