import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, Users } from 'lucide-react';
import type { WatchPartyParticipant } from '@/types/watchParty';
import { cn } from '@/lib/utils';

interface PartyParticipantsProps {
  participants: WatchPartyParticipant[];
  className?: string;
}

export function PartyParticipants({ participants, className }: PartyParticipantsProps) {
  return (
    <div className={cn("bg-card rounded-lg border p-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4" />
        <span className="font-semibold text-sm">Participantes ({participants.length})</span>
      </div>
      
      <div className="space-y-2">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {participant.display_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm flex-1 truncate">{participant.display_name}</span>
            {participant.is_host && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Host
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
