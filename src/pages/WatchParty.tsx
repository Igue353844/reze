import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncedVideoPlayer } from '@/components/WatchParty/SyncedVideoPlayer';
import { PartyChat } from '@/components/WatchParty/PartyChat';
import { PartyParticipants } from '@/components/WatchParty/PartyParticipants';
import { VideoCallControls } from '@/components/WatchParty/VideoCallControls';
import { EmojiReactions } from '@/components/WatchParty/EmojiReactions';
import { useWatchParty } from '@/hooks/useWatchParty';
import { useVideoCall } from '@/hooks/useVideoCall';
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
    hasNextEpisode,
    nextEpisode,
    sendMessage,
    updatePlayback,
    leaveParty,
    endParty,
    changeToNextEpisode
  } = useWatchParty(id);

  const {
    isInCall,
    isMuted,
    isVideoEnabled,
    isSpeaking,
    participants: callParticipants,
    remoteStreams,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
    setLocalVideoRef,
  } = useVideoCall(id);

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

  const handleNextEpisode = async () => {
    try {
      await changeToNextEpisode.mutateAsync();
      toast.success(`Mudando para: ${nextEpisode?.title}`);
    } catch (error) {
      toast.error('Erro ao mudar para próximo episódio');
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
          <div className="bg-card border rounded-lg">
            <div className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sala não encontrada</h2>
              <p className="text-muted-foreground mb-4">
                Esta sala pode ter sido encerrada ou não existe.
              </p>
              <Button onClick={() => navigate('/party')}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-2 md:py-8 max-w-7xl">
        {/* Header - Compact on mobile */}
        <div className="flex flex-col gap-2 mb-3 md:mb-6">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">{party.name}</h1>
              {isHost && (
                <Badge className="flex items-center gap-1 shrink-0">
                  <Crown className="h-3 w-3" />
                  <span className="hidden sm:inline">Host</span>
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm shrink-0">
              <Users className="h-4 w-4" />
              <span>{participants.length}</span>
            </div>
          </div>
          
          {/* Actions row - scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
            {/* Video/Voice call controls */}
            <VideoCallControls
              isInCall={isInCall}
              isMuted={isMuted}
              isVideoEnabled={isVideoEnabled}
              isSpeaking={isSpeaking}
              participants={callParticipants}
              remoteStreams={remoteStreams}
              onJoinCall={joinCall}
              onLeaveCall={leaveCall}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              setLocalVideoRef={setLocalVideoRef}
            />

            {/* Emoji reactions */}
            <EmojiReactions partyId={id || ''} />

            <div className="w-px h-6 bg-border shrink-0" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="gap-1.5 shrink-0 h-8"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="font-mono font-bold text-xs">{party.code}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 shrink-0 h-8"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>
            
            {isHost ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEnd}
                className="gap-1.5 shrink-0 h-8"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Encerrar</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeave}
                className="gap-1.5 shrink-0 h-8"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main content - Stack on mobile, grid on desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-6">
          {/* Video player - Full width on mobile */}
          <div className="lg:col-span-2">
            <SyncedVideoPlayer
              party={party}
              isHost={isHost}
              onPlaybackUpdate={updatePlayback}
              hasNextEpisode={hasNextEpisode}
              onNextEpisode={handleNextEpisode}
              isChangingEpisode={changeToNextEpisode.isPending}
              autoPlayNext={true}
            />
            
            {party.videos && (
              <div className="mt-2 md:mt-4 px-1">
                <h2 className="text-base md:text-lg font-semibold">{party.videos.title}</h2>
                {party.episodes && (
                  <p className="text-sm text-muted-foreground">{party.episodes.title}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Tabs on mobile, stacked on desktop */}
          <div className="space-y-3 md:space-y-4">
            {/* Participants - Collapsible on mobile */}
            <details className="md:open group" open>
              <summary className="flex items-center justify-between cursor-pointer list-none p-2 bg-card rounded-lg border md:hidden">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Participantes ({participants.length})</span>
                </div>
                <span className="text-muted-foreground text-xs group-open:hidden">Expandir</span>
              </summary>
              <div className="mt-2 md:mt-0">
                <PartyParticipants participants={participants} />
              </div>
            </details>
            
            {/* Chat - More height on mobile when visible */}
            <PartyChat
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUserId={user?.id}
              className="h-[300px] md:h-[400px]"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
