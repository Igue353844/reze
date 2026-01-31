import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Smile } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  displayName: string;
}

const EMOJI_OPTIONS = ['😂', '❤️', '🔥', '👏', '😮', '😢', '🎉', '👍'];

interface EmojiReactionsProps {
  partyId: string;
  className?: string;
}

export function EmojiReactions({ partyId, className }: EmojiReactionsProps) {
  const { user } = useAuth();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Subscribe to emoji reactions
  useEffect(() => {
    if (!partyId) return;

    const channel = supabase.channel(`reactions-${partyId}`)
      .on('broadcast', { event: 'emoji' }, ({ payload }) => {
        const newEmoji: FloatingEmoji = {
          id: `${Date.now()}-${Math.random()}`,
          emoji: payload.emoji,
          x: 10 + Math.random() * 80, // Random horizontal position
          displayName: payload.displayName,
        };

        setFloatingEmojis(prev => [...prev, newEmoji]);

        // Remove emoji after animation
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId]);

  const sendReaction = useCallback(async (emoji: string) => {
    if (!partyId || !user) return;

    const displayName = user.email?.split('@')[0] || 'User';

    const channel = supabase.channel(`reactions-${partyId}`);
    await channel.send({
      type: 'broadcast',
      event: 'emoji',
      payload: {
        emoji,
        displayName,
        userId: user.id,
      },
    });

    setIsOpen(false);
  }, [partyId, user]);

  return (
    <div className={cn("relative", className)}>
      {/* Floating emojis overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {floatingEmojis.map((fe) => (
          <div
            key={fe.id}
            className="absolute animate-float-up"
            style={{
              left: `${fe.x}%`,
              bottom: '20%',
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl drop-shadow-lg">{fe.emoji}</span>
              <span className="text-xs text-foreground/80 bg-background/50 px-1 rounded backdrop-blur-sm">
                {fe.displayName}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Emoji picker button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
          >
            <Smile className="h-4 w-4" />
            <span className="hidden sm:inline">Reagir</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
