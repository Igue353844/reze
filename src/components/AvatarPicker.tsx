import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvatars } from '@/hooks/useAvatars';

interface AvatarPickerProps {
  selectedAvatar: string | null;
  onSelectAvatar: (avatarIdentifier: string) => void;
}

export function AvatarPicker({ selectedAvatar, onSelectAvatar }: AvatarPickerProps) {
  const { sections, avatars, isLoading, getAvatarsBySection } = useAvatars();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Set first section as default when data loads
  if (!selectedSection && sections && sections.length > 0) {
    setSelectedSection(sections[0].id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum avatar disponível.
      </div>
    );
  }

  const currentAvatars = selectedSection ? getAvatarsBySection(selectedSection) : [];

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={selectedSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSection(section.id)}
            className="text-xs"
          >
            {section.name}
          </Button>
        ))}
      </div>

      {/* Avatar grid */}
      <ScrollArea className="h-48">
        <div className="grid grid-cols-3 gap-3 p-2">
          {currentAvatars.map((avatar) => {
            // Create identifier for this avatar
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
                  avatar.bg_class
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

// Helper to render avatar from identifier (now fetches from DB context)
export function renderAvatarFromIdentifier(identifier: string | null | undefined) {
  if (!identifier) return null;
  
  if (identifier.startsWith('emoji:')) {
    const parts = identifier.split(':');
    if (parts.length >= 3) {
      const emoji = parts[2];
      // For now, return with default bg - the actual bg will be determined by component
      return { type: 'emoji' as const, emoji, bg: 'bg-muted', id: parts[1] };
    }
  }
  
  return { type: 'url' as const, url: identifier };
}

// Hook to get avatar details from identifier
export function useAvatarDetails(identifier: string | null | undefined) {
  const { avatars } = useAvatars();
  
  if (!identifier || !identifier.startsWith('emoji:')) {
    if (identifier) {
      return { type: 'url' as const, url: identifier };
    }
    return null;
  }
  
  const parts = identifier.split(':');
  if (parts.length >= 3) {
    const id = parts[1];
    const emoji = parts[2];
    const avatar = avatars?.find(a => a.id === id);
    
    return { 
      type: 'emoji' as const, 
      emoji, 
      bg: avatar?.bg_class || 'bg-muted',
      id 
    };
  }
  
  return null;
}
