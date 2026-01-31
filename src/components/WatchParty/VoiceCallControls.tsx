import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceParticipant {
  id: string;
  displayName: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface VoiceCallControlsProps {
  isInCall: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  participants: VoiceParticipant[];
  onJoinCall: () => void;
  onLeaveCall: () => void;
  onToggleMute: () => void;
}

export function VoiceCallControls({
  isInCall,
  isMuted,
  isSpeaking,
  participants,
  onJoinCall,
  onLeaveCall,
  onToggleMute,
}: VoiceCallControlsProps) {
  if (!isInCall) {
    return (
      <Button
        onClick={onJoinCall}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Phone className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar na chamada</span>
        <span className="sm:hidden">Chamada</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Voice participants indicator */}
      <div className="flex items-center gap-1">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex -space-x-1">
          {participants.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className={cn(
                "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium border-2 border-background",
                p.isSpeaking && "ring-2 ring-primary ring-offset-1 ring-offset-background"
              )}
              title={`${p.displayName}${p.isMuted ? ' (mudo)' : ''}`}
            >
              {p.displayName[0]?.toUpperCase()}
            </div>
          ))}
          {participants.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
              +{participants.length - 3}
            </div>
          )}
        </div>
        {participants.length > 0 && (
          <Badge variant="secondary" className="text-xs ml-1">
            {participants.length}
          </Badge>
        )}
      </div>

      {/* Speaking indicator */}
      {isSpeaking && !isMuted && (
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-75" />
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150" />
          </div>
        </div>
      )}

      {/* Mute button */}
      <Button
        onClick={onToggleMute}
        variant={isMuted ? "destructive" : "outline"}
        size="sm"
        className="gap-1.5"
      >
        {isMuted ? (
          <>
            <MicOff className="h-4 w-4" />
            <span className="hidden sm:inline">Mutado</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Mic</span>
          </>
        )}
      </Button>

      {/* Leave call button */}
      <Button
        onClick={onLeaveCall}
        variant="destructive"
        size="sm"
        className="gap-1.5"
      >
        <PhoneOff className="h-4 w-4" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </div>
  );
}
