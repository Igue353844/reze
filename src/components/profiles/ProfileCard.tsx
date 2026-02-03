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
}

export function ProfileCard({ profile, onClick, isEditing, onEdit, className }: ProfileCardProps) {
  return (
    <div 
      className={cn(
        'group flex flex-col items-center gap-3 cursor-pointer',
        className
      )}
      onClick={isEditing ? onEdit : onClick}
    >
      <div className="relative">
        <ProfileAvatar 
          avatarId={profile.avatar_id}
          avatarUrl={profile.avatar_url}
          name={profile.name}
          size="lg"
          className={cn(
            'transition-all duration-200 border-2 border-transparent',
            'group-hover:border-white group-hover:scale-105',
            isEditing && 'opacity-50'
          )}
        />
        
        {isEditing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
            <Pencil className="w-8 h-8 text-white" />
          </div>
        )}
        
        {profile.is_kids && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">
            KIDS
          </span>
        )}
      </div>
      
      <span className={cn(
        'text-muted-foreground text-lg transition-colors',
        'group-hover:text-white'
      )}>
        {profile.name}
      </span>
    </div>
  );
}
