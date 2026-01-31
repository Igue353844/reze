import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface CallParticipant {
  id: string;
  displayName: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
}

interface VideoCallControlsProps {
  isInCall: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
  participants: CallParticipant[];
  remoteStreams: Map<string, MediaStream>;
  onJoinCall: (withVideo: boolean) => void;
  onLeaveCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  setLocalVideoRef: (ref: HTMLVideoElement | null) => void;
}

export function VideoCallControls({
  isInCall,
  isMuted,
  isVideoEnabled,
  isSpeaking,
  participants,
  remoteStreams,
  onJoinCall,
  onLeaveCall,
  onToggleMute,
  onToggleVideo,
  setLocalVideoRef,
}: VideoCallControlsProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (localVideoRef.current) {
      setLocalVideoRef(localVideoRef.current);
    }
  }, [setLocalVideoRef, isInCall]);

  // Update remote videos
  useEffect(() => {
    remoteStreams.forEach((stream, odurerId) => {
      const videoEl = remoteVideoRefs.current.get(odurerId);
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams, participants]);

  const hasVideoParticipants = participants.some(p => p.isVideoEnabled) || isVideoEnabled;

  if (!isInCall) {
    return (
      <div className="flex items-center gap-1">
        <Button
          onClick={() => onJoinCall(false)}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
        >
          <Phone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Voz</span>
        </Button>
        <Button
          onClick={() => onJoinCall(true)}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
        >
          <Video className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Vídeo</span>
        </Button>
      </div>
    );
  }

  return (
    <>
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
                title={`${p.displayName}${p.isMuted ? ' (mudo)' : ''}${p.isVideoEnabled ? ' 📹' : ''}`}
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
          className="gap-1.5 h-8"
        >
          {isMuted ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Video toggle button */}
        <Button
          onClick={onToggleVideo}
          variant={isVideoEnabled ? "default" : "outline"}
          size="sm"
          className="gap-1.5 h-8"
        >
          {isVideoEnabled ? (
            <Video className="h-3.5 w-3.5" />
          ) : (
            <VideoOff className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Open video dialog */}
        {hasVideoParticipants && (
          <Button
            onClick={() => setShowVideoDialog(true)}
            variant="secondary"
            size="sm"
            className="h-8"
          >
            Ver vídeos
          </Button>
        )}

        {/* Leave call button */}
        <Button
          onClick={onLeaveCall}
          variant="destructive"
          size="sm"
          className="gap-1.5 h-8"
        >
          <PhoneOff className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chamada de Vídeo</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {/* Local video */}
            {isVideoEnabled && (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                  <span>Você</span>
                  {isMuted && <MicOff className="h-3 w-3 text-destructive" />}
                </div>
              </div>
            )}

            {/* Remote videos */}
            {participants
              .filter(p => p.isVideoEnabled)
              .map((participant) => (
                <div key={participant.id} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(participant.id, el);
                        const stream = remoteStreams.get(participant.id);
                        if (stream && el.srcObject !== stream) {
                          el.srcObject = stream;
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className={cn(
                    "absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1",
                    participant.isSpeaking && "ring-2 ring-primary"
                  )}>
                    <span>{participant.displayName}</span>
                    {participant.isMuted && <MicOff className="h-3 w-3 text-destructive" />}
                  </div>
                </div>
              ))}

            {/* Audio-only participants */}
            {participants
              .filter(p => !p.isVideoEnabled)
              .map((participant) => (
                <div key={participant.id} className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  <div className={cn(
                    "w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-medium",
                    participant.isSpeaking && "ring-4 ring-primary ring-offset-2 ring-offset-background"
                  )}>
                    {participant.displayName[0]?.toUpperCase()}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                    <span>{participant.displayName}</span>
                    {participant.isMuted && <MicOff className="h-3 w-3 text-destructive" />}
                    <VideoOff className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
