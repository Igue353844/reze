import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import type { WatchPartyMessage } from '@/types/watchParty';
import { cn } from '@/lib/utils';

interface PartyChatProps {
  messages: WatchPartyMessage[];
  onSendMessage: (message: string) => void;
  currentUserId?: string;
  className?: string;
}

export function PartyChat({ messages, onSendMessage, currentUserId, className }: PartyChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border", className)}>
      <div className="p-3 border-b flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        <span className="font-semibold text-sm">Chat</span>
      </div>
      
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhuma mensagem ainda
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  msg.user_id === currentUserId && "items-end"
                )}
              >
                <span className="text-xs text-muted-foreground mb-1">
                  {msg.display_name}
                </span>
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg max-w-[80%] text-sm",
                    msg.user_id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
