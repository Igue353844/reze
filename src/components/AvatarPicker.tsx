import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Avatar collections organized by theme
const AVATAR_COLLECTIONS = {
  'hello-kitty': {
    name: 'Hello Kitty',
    avatars: [
      { id: 'hk-1', url: 'https://i.pinimg.com/736x/ed/c7/c7/edc7c7c6df1c95b57877d06fa tried.jpg', name: 'Hello Kitty Classic' },
      { id: 'hk-2', url: 'https://i.pinimg.com/474x/9e/44/b1/9e44b1db6a68b73b0f9c0f5e8a7b5f6a.jpg', name: 'Hello Kitty Rosa' },
      { id: 'hk-3', url: 'https://i.pinimg.com/474x/28/75/e9/2875e99d3d4d3b4f9a8a8f8a8d8a8f8a.jpg', name: 'My Melody' },
      { id: 'hk-4', url: 'https://i.pinimg.com/474x/5b/3d/8a/5b3d8a5e5b5e5b5e5b5e5b5e5b5e5b5e.jpg', name: 'Kuromi' },
      { id: 'hk-5', url: 'https://i.pinimg.com/474x/c1/c1/c1/c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1.jpg', name: 'Cinnamoroll' },
      { id: 'hk-6', url: 'https://i.pinimg.com/474x/a2/a2/a2/a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2.jpg', name: 'Pompompurin' },
    ]
  },
  'spider-man': {
    name: 'Homem Aranha',
    avatars: [
      { id: 'sm-1', url: 'https://i.pinimg.com/474x/b5/b5/b5/b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5.jpg', name: 'Spider-Man Classic' },
      { id: 'sm-2', url: 'https://i.pinimg.com/474x/d8/d8/d8/d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8.jpg', name: 'Miles Morales' },
      { id: 'sm-3', url: 'https://i.pinimg.com/474x/e3/e3/e3/e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3.jpg', name: 'Spider-Gwen' },
      { id: 'sm-4', url: 'https://i.pinimg.com/474x/f7/f7/f7/f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7.jpg', name: 'Spider-Man 2099' },
      { id: 'sm-5', url: 'https://i.pinimg.com/474x/1a/1a/1a/1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a.jpg', name: 'Spider-Punk' },
      { id: 'sm-6', url: 'https://i.pinimg.com/474x/2b/2b/2b/2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b.jpg', name: 'Venom' },
    ]
  },
  'coraline': {
    name: 'Coraline',
    avatars: [
      { id: 'cr-1', url: 'https://i.pinimg.com/474x/3c/3c/3c/3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c.jpg', name: 'Coraline' },
      { id: 'cr-2', url: 'https://i.pinimg.com/474x/4d/4d/4d/4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d.jpg', name: 'Gato Preto' },
      { id: 'cr-3', url: 'https://i.pinimg.com/474x/5e/5e/5e/5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e.jpg', name: 'Outra Mãe' },
      { id: 'cr-4', url: 'https://i.pinimg.com/474x/6f/6f/6f/6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f.jpg', name: 'Wybie' },
      { id: 'cr-5', url: 'https://i.pinimg.com/474x/7a/7a/7a/7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a.jpg', name: 'Sr. Bobinsky' },
      { id: 'cr-6', url: 'https://i.pinimg.com/474x/8b/8b/8b/8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b.jpg', name: 'Srtas. Spink e Forcible' },
    ]
  },
};

// Fallback emoji avatars that work without external URLs
const EMOJI_AVATARS = {
  'hello-kitty': [
    { id: 'hk-e1', emoji: '🎀', name: 'Laço Rosa', bg: 'bg-pink-100 dark:bg-pink-900' },
    { id: 'hk-e2', emoji: '🌸', name: 'Flor de Cerejeira', bg: 'bg-pink-50 dark:bg-pink-950' },
    { id: 'hk-e3', emoji: '💖', name: 'Coração Brilhante', bg: 'bg-rose-100 dark:bg-rose-900' },
    { id: 'hk-e4', emoji: '🐱', name: 'Gatinha', bg: 'bg-amber-50 dark:bg-amber-950' },
    { id: 'hk-e5', emoji: '✨', name: 'Brilho', bg: 'bg-yellow-50 dark:bg-yellow-950' },
    { id: 'hk-e6', emoji: '🩷', name: 'Coração Rosa', bg: 'bg-pink-200 dark:bg-pink-800' },
  ],
  'spider-man': [
    { id: 'sm-e1', emoji: '🕷️', name: 'Aranha', bg: 'bg-red-100 dark:bg-red-900' },
    { id: 'sm-e2', emoji: '🕸️', name: 'Teia', bg: 'bg-slate-100 dark:bg-slate-900' },
    { id: 'sm-e3', emoji: '🦸', name: 'Super-herói', bg: 'bg-blue-100 dark:bg-blue-900' },
    { id: 'sm-e4', emoji: '🔴', name: 'Vermelho', bg: 'bg-red-200 dark:bg-red-800' },
    { id: 'sm-e5', emoji: '🔵', name: 'Azul', bg: 'bg-blue-200 dark:bg-blue-800' },
    { id: 'sm-e6', emoji: '⚡', name: 'Poder', bg: 'bg-yellow-100 dark:bg-yellow-900' },
  ],
  'coraline': [
    { id: 'cr-e1', emoji: '🪡', name: 'Agulha', bg: 'bg-indigo-100 dark:bg-indigo-900' },
    { id: 'cr-e2', emoji: '🐈‍⬛', name: 'Gato Preto', bg: 'bg-slate-200 dark:bg-slate-800' },
    { id: 'cr-e3', emoji: '🚪', name: 'Porta Mágica', bg: 'bg-purple-100 dark:bg-purple-900' },
    { id: 'cr-e4', emoji: '👁️', name: 'Botão', bg: 'bg-gray-100 dark:bg-gray-900' },
    { id: 'cr-e5', emoji: '🌙', name: 'Lua', bg: 'bg-blue-950 dark:bg-blue-100' },
    { id: 'cr-e6', emoji: '🦋', name: 'Borboleta', bg: 'bg-cyan-100 dark:bg-cyan-900' },
  ],
};

interface AvatarPickerProps {
  selectedAvatar: string | null;
  onSelectAvatar: (avatarUrl: string) => void;
}

export function AvatarPicker({ selectedAvatar, onSelectAvatar }: AvatarPickerProps) {
  const [selectedSection, setSelectedSection] = useState<keyof typeof EMOJI_AVATARS>('hello-kitty');

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        {Object.entries(EMOJI_AVATARS).map(([key, _]) => {
          const sectionName = key === 'hello-kitty' ? 'Hello Kitty' 
            : key === 'spider-man' ? 'Homem Aranha' 
            : 'Coraline';
          
          return (
            <Button
              key={key}
              variant={selectedSection === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSection(key as keyof typeof EMOJI_AVATARS)}
              className="text-xs"
            >
              {sectionName}
            </Button>
          );
        })}
      </div>

      {/* Avatar grid */}
      <ScrollArea className="h-48">
        <div className="grid grid-cols-3 gap-3 p-2">
          {EMOJI_AVATARS[selectedSection].map((avatar) => {
            // Create a data URL identifier for this avatar
            const avatarIdentifier = `emoji:${avatar.id}:${avatar.emoji}`;
            const isSelected = selectedAvatar === avatarIdentifier;
            
            return (
              <button
                key={avatar.id}
                onClick={() => onSelectAvatar(avatarIdentifier)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-105",
                  "border-2",
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-transparent hover:border-muted-foreground/20"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
                  avatar.bg
                )}>
                  {avatar.emoji}
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {avatar.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper to render avatar from identifier
export function renderAvatarFromIdentifier(identifier: string | null | undefined) {
  if (!identifier) return null;
  
  if (identifier.startsWith('emoji:')) {
    const parts = identifier.split(':');
    if (parts.length >= 3) {
      const emoji = parts[2];
      const id = parts[1];
      
      // Find the avatar to get the background
      for (const section of Object.values(EMOJI_AVATARS)) {
        const found = section.find(a => a.id === id);
        if (found) {
          return { type: 'emoji' as const, emoji, bg: found.bg };
        }
      }
      return { type: 'emoji' as const, emoji, bg: 'bg-muted' };
    }
  }
  
  return { type: 'url' as const, url: identifier };
}
