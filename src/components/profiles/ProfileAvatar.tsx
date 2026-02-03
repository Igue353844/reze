import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  avatarId?: string | null;
  avatarUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12 text-xl',
  md: 'w-20 h-20 text-3xl',
  lg: 'w-28 h-28 text-4xl',
  xl: 'w-36 h-36 text-5xl',
};

export function ProfileAvatar({ avatarId, avatarUrl, name, size = 'lg', className }: ProfileAvatarProps) {
  // Fetch avatar details if we have an avatarId
  const { data: avatar } = useQuery({
    queryKey: ['avatar', avatarId],
    queryFn: async () => {
      if (!avatarId) return null;
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('id', avatarId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!avatarId,
  });

  // Determine what to render
  if (avatar?.emoji) {
    return (
      <div className={cn(
        'rounded-lg flex items-center justify-center',
        avatar.bg_class || 'bg-muted',
        sizeClasses[size],
        className
      )}>
        {avatar.emoji}
      </div>
    );
  }

  if (avatar?.image_url) {
    return (
      <div className={cn(
        'rounded-lg overflow-hidden',
        sizeClasses[size],
        className
      )}>
        <img 
          src={avatar.image_url} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (avatarUrl) {
    // Check if it's an emoji reference (from the old avatar system)
    if (avatarUrl.startsWith('emoji:')) {
      const parts = avatarUrl.split(':');
      const emoji = parts[1];
      const bgClass = parts[2] || 'bg-muted';
      return (
        <div className={cn(
          'rounded-lg flex items-center justify-center',
          bgClass,
          sizeClasses[size],
          className
        )}>
          {emoji}
        </div>
      );
    }
    
    // It's a URL
    return (
      <div className={cn(
        'rounded-lg overflow-hidden',
        sizeClasses[size],
        className
      )}>
        <img 
          src={avatarUrl} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Default fallback
  return (
    <div className={cn(
      'rounded-lg flex items-center justify-center bg-muted',
      sizeClasses[size],
      className
    )}>
      <User className={cn(
        size === 'sm' ? 'w-6 h-6' : 
        size === 'md' ? 'w-10 h-10' :
        size === 'lg' ? 'w-14 h-14' : 'w-18 h-18',
        'text-muted-foreground'
      )} />
    </div>
  );
}
