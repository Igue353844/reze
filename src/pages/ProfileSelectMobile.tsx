import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfiles, UserProfile } from '@/hooks/useUserProfiles';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { AddProfileCard } from '@/components/profiles/AddProfileCard';
import { EditProfileDialog } from '@/components/profiles/EditProfileDialog';
import { TVLayout } from '@/components/tv/TVLayout';
import { TVButton } from '@/components/tv/TVButton';
import { Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileSelectMobile() {
  const navigate = useNavigate();
  const { profiles, isLoading, canAddMore } = useUserProfiles();
  const { setSelectedProfile } = useProfileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Calculate total items (profiles + add button if available)
  const totalItems = (profiles?.length || 0) + (canAddMore && !isEditing ? 1 : 0);

  // D-pad navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showEditDialog) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(totalItems - 1, prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Move to manage button
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (focusedIndex === -1) {
          setFocusedIndex(0);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect();
        break;
      case 'Escape':
      case 'Backspace':
        e.preventDefault();
        if (isEditing) {
          setIsEditing(false);
        }
        break;
    }
  }, [focusedIndex, totalItems, isEditing, showEditDialog]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = () => {
    if (focusedIndex === -1) {
      // Manage button focused
      setIsEditing(!isEditing);
      return;
    }

    const profilesLength = profiles?.length || 0;

    if (focusedIndex < profilesLength) {
      const profile = profiles![focusedIndex];
      if (isEditing) {
        handleEditProfile(profile);
      } else {
        handleSelectProfile(profile);
      }
    } else if (focusedIndex === profilesLength && canAddMore) {
      handleAddProfile();
    }
  };

  const handleSelectProfile = (profile: UserProfile) => {
    setSelectedProfile(profile);
    navigate('/');
  };

  const handleAddProfile = () => {
    setEditingProfile(null);
    setIsNewProfile(true);
    setShowEditDialog(true);
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile(profile);
    setIsNewProfile(false);
    setShowEditDialog(true);
  };

  const handleCloseDialog = () => {
    setShowEditDialog(false);
    setEditingProfile(null);
    setIsNewProfile(false);
  };

  if (isLoading) {
    return (
      <TVLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
        </div>
      </TVLayout>
    );
  }

  return (
    <TVLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            RezeFlix
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
          <h2 className={cn(
            'text-4xl sm:text-5xl font-medium text-white mb-4',
            'animate-fade-in'
          )}>
            Quem está assistindo?
          </h2>
          
          {isEditing && (
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in">
              Selecione um perfil para editar
            </p>
          )}

          {/* Navigation hint */}
          <div className="flex items-center gap-4 mb-8 text-muted-foreground animate-fade-in">
            <span className="text-sm">Use ◀ ▶ para navegar</span>
            <span className="text-sm">OK para selecionar</span>
          </div>

          {/* Profiles Grid */}
          <div className={cn(
            'flex flex-wrap justify-center gap-8 sm:gap-12',
            'max-w-4xl'
          )}>
            {profiles?.map((profile, idx) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onClick={() => handleSelectProfile(profile)}
                isEditing={isEditing}
                onEdit={() => handleEditProfile(profile)}
                index={idx}
                isFocused={focusedIndex === idx}
              />
            ))}

            {/* Add Profile Button */}
            {canAddMore && !isEditing && (
              <AddProfileCard 
                onClick={handleAddProfile}
                index={profiles?.length || 0}
                isFocused={focusedIndex === (profiles?.length || 0)}
              />
            )}
          </div>

          {/* Manage Profiles Button */}
          <div className="mt-16">
            <TVButton
              variant={isEditing ? "primary" : "outline"}
              size="lg"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                'px-10 py-6 text-xl transition-all duration-300',
                focusedIndex === -1 && 'ring-4 ring-white scale-105'
              )}
            >
              {isEditing ? (
                'Concluído'
              ) : (
                <>
                  <Pencil className="w-5 h-5 mr-3" />
                  Gerenciar Perfis
                </>
              )}
            </TVButton>
          </div>
        </main>

        {/* Edit/Create Profile Dialog */}
        <EditProfileDialog
          profile={editingProfile}
          isOpen={showEditDialog}
          onClose={handleCloseDialog}
          isNew={isNewProfile}
        />
      </div>
    </TVLayout>
  );
}