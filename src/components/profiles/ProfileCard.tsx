import { cn } from '@/lib/utils';
import { ProfileAvatar } from './ProfileAvatar';
import { UserProfile } from '@/hooks/useUserProfiles';
import { Pencil } from 'lucide-react';

interface ProfileCardProps {
  profile: UserProfile;
  onClick?: () => void;
  isEditing?: boolean;
  onEdit?: () => void;
  className?: string;
  index?: number;
  isFocused?: boolean;
}

export function ProfileCard({ profile, onClick, isEditing, onEdit, className, index = 0, isFocused }: ProfileCardProps) {
  return (
    <div 
      className={cn(
        'group flex flex-col items-center gap-3 cursor-pointer',
        'animate-fade-in',
        className
      )}
      style={{ 
        animationDelay: `${index * 100}ms`,
      }}
      onClick={isEditing ? onEdit : onClick}
      data-focusable="true"
    >
      <div className="relative">
        <ProfileAvatar 
          avatarId={profile.avatar_id}
          avatarUrl={profile.avatar_url}
          name={profile.name}
          size="lg"
          className={cn(
            'transition-all duration-300 ease-out border-4 border-transparent',
            'group-hover:border-white group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-primary/30',
            isEditing && 'opacity-50 group-hover:opacity-70',
            isFocused && 'border-white scale-110 shadow-2xl shadow-primary/30'
          )}
        />
        
        {isEditing && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg bg-black/60',
            'transition-all duration-200',
            'group-hover:bg-black/40'
          )}>
            <Pencil className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
          </div>
        )}
        
        {profile.is_kids && (
          <span className={cn(
            'absolute -bottom-1 left-1/2 -translate-x-1/2',
            'bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded',
            'transition-transform group-hover:scale-110'
          )}>
            KIDS
          </span>
        )}
      </div>
      
      <span className={cn(
        'text-muted-foreground text-lg transition-all duration-200',
        'group-hover:text-white group-hover:scale-105',
        isFocused && 'text-white scale-105'
      )}>
        {profile.name}
      </span>
    </div>
  );
}
