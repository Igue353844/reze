import { useNavigate } from 'react-router-dom';
import { ChevronDown, Users, Edit2 } from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ProfileAvatar } from '@/components/profiles/ProfileAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { cn } from '@/lib/utils';

interface ProfileSwitcherProps {
  compact?: boolean;
}

export function ProfileSwitcher({ compact = false }: ProfileSwitcherProps) {
  const navigate = useNavigate();
  const { selectedProfile, setSelectedProfile } = useProfileContext();
  const { profiles } = useUserProfiles();

  if (!selectedProfile) return null;

  const otherProfiles = profiles?.filter(p => p.id !== selectedProfile.id) || [];

  const handleSwitchProfile = (profile: typeof selectedProfile) => {
    setSelectedProfile(profile);
  };

  const handleManageProfiles = () => {
    navigate('/profiles');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "gap-2 px-2 hover:bg-secondary/50",
            compact ? "h-9" : "h-10"
          )}
        >
          <ProfileAvatar
            avatarId={selectedProfile.avatar_id}
            avatarUrl={selectedProfile.avatar_url}
            name={selectedProfile.name}
            size="sm"
            className={compact ? "w-7 h-7 text-sm" : "w-8 h-8 text-base"}
          />
          {!compact && (
            <span className="hidden sm:inline max-w-20 truncate text-sm font-medium">
              {selectedProfile.name}
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Current Profile */}
        <div className="px-2 py-2">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              avatarId={selectedProfile.avatar_id}
              avatarUrl={selectedProfile.avatar_url}
              name={selectedProfile.name}
              size="sm"
              className="w-10 h-10"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedProfile.name}</p>
              <p className="text-xs text-muted-foreground">Perfil atual</p>
            </div>
          </div>
        </div>

        {/* Other Profiles */}
        {otherProfiles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="py-1">
              <p className="px-2 py-1 text-xs text-muted-foreground font-medium">
                Trocar para
              </p>
              {otherProfiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => handleSwitchProfile(profile)}
                  className="cursor-pointer py-2"
                >
                  <div className="flex items-center gap-3 w-full">
                    <ProfileAvatar
                      avatarId={profile.avatar_id}
                      avatarUrl={profile.avatar_url}
                      name={profile.name}
                      size="sm"
                      className="w-8 h-8 text-sm"
                    />
                    <span className="flex-1 truncate">{profile.name}</span>
                    {profile.is_kids && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                        Kids
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        
        {/* Manage Profiles */}
        <DropdownMenuItem onClick={handleManageProfiles} className="cursor-pointer">
          <Users className="w-4 h-4 mr-2" />
          Gerenciar Perfis
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
