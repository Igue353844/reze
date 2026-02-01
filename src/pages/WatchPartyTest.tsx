import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SyncedVideoPlayer } from '@/components/WatchParty/SyncedVideoPlayer';
import { PartyChat } from '@/components/WatchParty/PartyChat';
import { PartyParticipants } from '@/components/WatchParty/PartyParticipants';
import { VideoCallControls } from '@/components/WatchParty/VideoCallControls';
import { EmojiReactions } from '@/components/WatchParty/EmojiReactions';
import { toast } from 'sonner';
import { 
  Copy, 
  Crown, 
  Users, 
  Share2,
  TestTube,
  Info
} from 'lucide-react';

// Mock data for testing
const MOCK_USER_ID = 'test-user-123';

const MOCK_PARTY = {
  id: 'test-party-001',
  name: 'Watch Party de Teste',
  code: 'TEST01',
  host_id: MOCK_USER_ID,
  is_active: true,
  is_playing: false,
  current_time_seconds: 0,
  video_id: 'test-video-1',
  episode_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  videos: {
    id: 'test-video-1',
    title: 'Vídeo de Demonstração',
    slug: 'video-demo',
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Um vídeo de teste para demonstrar a funcionalidade do Watch Party',
  },
  episodes: null,
};

const MOCK_PARTICIPANTS = [
  {
    id: 'participant-1',
    party_id: 'test-party-001',
    user_id: MOCK_USER_ID,
    display_name: 'Você (Host)',
    is_host: true,
    joined_at: new Date().toISOString(),
  },
  {
    id: 'participant-2',
    party_id: 'test-party-001',
    user_id: 'user-2',
    display_name: 'Maria',
    is_host: false,
    joined_at: new Date().toISOString(),
  },
  {
    id: 'participant-3',
    party_id: 'test-party-001',
    user_id: 'user-3',
    display_name: 'João',
    is_host: false,
    joined_at: new Date().toISOString(),
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    party_id: 'test-party-001',
    user_id: 'user-2',
    display_name: 'Maria',
    message: 'Olá pessoal! 👋',
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'msg-2',
    party_id: 'test-party-001',
    user_id: 'user-3',
    display_name: 'João',
    message: 'Pronto para assistir!',
    created_at: new Date(Date.now() - 30000).toISOString(),
  },
];

export default function WatchPartyTest() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callParticipants, setCallParticipants] = useState<{
    id: string;
    displayName: string;
    isMuted: boolean;
    isSpeaking: boolean;
  }[]>([]);

  // Simulate speaking detection when in call
  useEffect(() => {
    if (isInCall && !isMuted) {
      const interval = setInterval(() => {
        setIsSpeaking(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsSpeaking(false);
    }
  }, [isInCall, isMuted]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(MOCK_PARTY.code);
    toast.success('Código copiado!');
  };

  const handleShare = async () => {
    const shareData = {
      title: `Watch Party: ${MOCK_PARTY.name}`,
      text: `Entre na minha Watch Party! Código: ${MOCK_PARTY.code}`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success('Link copiado para compartilhar!');
    }
  };

  const handleSendMessage = async (message: string) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      party_id: MOCK_PARTY.id,
      user_id: MOCK_USER_ID,
      display_name: 'Você (Host)',
      message,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    toast.success('Mensagem enviada!');
  };

  const handleJoinCall = () => {
    setIsInCall(true);
    setCallParticipants([
      { id: MOCK_USER_ID, displayName: 'Você', isMuted: false, isSpeaking: true },
      { id: 'user-2', displayName: 'Maria', isMuted: false, isSpeaking: false },
    ]);
    toast.success('Você entrou na chamada de voz!');
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
    setCallParticipants([]);
    setIsSpeaking(false);
    toast.info('Você saiu da chamada de voz');
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    toast.info(isMuted ? 'Microfone ativado' : 'Microfone desativado');
  };

  const handlePlaybackUpdate = (currentTime: number, isPlaying: boolean) => {
    console.log('Playback update:', { currentTime, isPlaying });
  };

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-2 md:py-8 max-w-7xl">
        {/* Test Mode Banner */}
        <Card className="mb-4 border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TestTube className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium flex items-center gap-2">
                  Modo de Teste
                  <Badge variant="secondary" className="text-xs">Demo</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Esta é uma versão de teste da Watch Party. Todas as funcionalidades estão disponíveis para experimentação.
                </p>
              </div>
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex flex-col gap-2 mb-3 md:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-2xl font-bold truncate">{MOCK_PARTY.name}</h1>
              <Badge className="flex items-center gap-1 shrink-0">
                <Crown className="h-3 w-3" />
                <span className="hidden sm:inline">Host</span>
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm shrink-0">
              <Users className="h-4 w-4" />
              <span>{MOCK_PARTICIPANTS.length}</span>
            </div>
          </div>
          
          {/* Actions row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide">
            <VideoCallControls
              isInCall={isInCall}
              isMuted={isMuted}
              isSpeaking={isSpeaking}
              participants={callParticipants}
              onJoinCall={handleJoinCall}
              onLeaveCall={handleLeaveCall}
              onToggleMute={handleToggleMute}
            />

            <EmojiReactions partyId={MOCK_PARTY.id} />

            <div className="w-px h-6 bg-border shrink-0" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="gap-1.5 shrink-0 h-8"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="font-mono font-bold text-xs">{MOCK_PARTY.code}</span>
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
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 md:gap-6">
          {/* Video player */}
          <div className="lg:col-span-2">
            <SyncedVideoPlayer
              party={MOCK_PARTY as any}
              isHost={true}
              onPlaybackUpdate={handlePlaybackUpdate}
              hasNextEpisode={false}
              onNextEpisode={() => {}}
              isChangingEpisode={false}
              autoPlayNext={false}
            />
            
            <div className="mt-2 md:mt-4 px-1">
              <h2 className="text-base md:text-lg font-semibold">{MOCK_PARTY.videos.title}</h2>
              <p className="text-sm text-muted-foreground">{MOCK_PARTY.videos.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3 md:space-y-4">
            {/* Participants */}
            <details className="md:open group" open>
              <summary className="flex items-center justify-between cursor-pointer list-none p-2 bg-card rounded-lg border md:hidden">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Participantes ({MOCK_PARTICIPANTS.length})</span>
                </div>
                <span className="text-muted-foreground text-xs group-open:hidden">Expandir</span>
              </summary>
              <div className="mt-2 md:mt-0">
                <PartyParticipants participants={MOCK_PARTICIPANTS as any} />
              </div>
            </details>
            
            {/* Chat */}
            <PartyChat
              messages={messages as any}
              onSendMessage={handleSendMessage}
              currentUserId={MOCK_USER_ID}
              className="h-[300px] md:h-[400px]"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
