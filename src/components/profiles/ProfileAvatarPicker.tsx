import { useState } from 'react';
import { useAvatars, Avatar } from '@/hooks/useAvatars';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ProfileAvatarPickerProps {
  selectedAvatarId: string | null;
  onSelect: (avatar: Avatar) => void;
}

export function ProfileAvatarPicker({ selectedAvatarId, onSelect }: ProfileAvatarPickerProps) {
  const { sections, avatars, isLoading, getAvatarsBySection } = useAvatars();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sections?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum avatar disponível
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
      {sections.map((section) => {
        const sectionAvatars = getAvatarsBySection(section.id);
        if (!sectionAvatars.length) return null;

        return (
          <div key={section.id}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {section.name}
            </h4>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {sectionAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => onSelect(avatar)}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center text-2xl transition-all',
                    'hover:scale-110 hover:ring-2 hover:ring-primary',
                    avatar.bg_class || 'bg-muted',
                    selectedAvatarId === avatar.id && 'ring-2 ring-primary scale-105'
                  )}
                >
                  {avatar.emoji ? (
                    avatar.emoji
                  ) : avatar.image_url ? (
                    <img 
                      src={avatar.image_url} 
                      alt={avatar.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
