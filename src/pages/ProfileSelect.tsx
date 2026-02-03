import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfiles, UserProfile } from '@/hooks/useUserProfiles';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { AddProfileCard } from '@/components/profiles/AddProfileCard';
import { EditProfileDialog } from '@/components/profiles/EditProfileDialog';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfileSelect() {
  const navigate = useNavigate();
  const { profiles, isLoading, canAddMore } = useUserProfiles();
  const { setSelectedProfile } = useProfileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          RezeFlix
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <h2 className="text-3xl sm:text-4xl font-medium text-white mb-2">
          Quem está assistindo?
        </h2>
        
        {isEditing && (
          <p className="text-muted-foreground mb-8">
            Toque em um perfil para editar
          </p>
        )}

        {/* Profiles Grid */}
        <div className={cn(
          'flex flex-wrap justify-center gap-6 sm:gap-8 mt-8',
          'max-w-3xl'
        )}>
          {profiles?.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onClick={() => handleSelectProfile(profile)}
              isEditing={isEditing}
              onEdit={() => handleEditProfile(profile)}
            />
          ))}

          {/* Add Profile Button */}
          {canAddMore && !isEditing && (
            <AddProfileCard onClick={handleAddProfile} />
          )}
        </div>

        {/* Manage Profiles Button */}
        <div className="mt-12">
          {isEditing ? (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setIsEditing(false)}
              className="px-8"
            >
              Concluído
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setIsEditing(true)}
              className="px-8"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Gerenciar Perfis
            </Button>
          )}
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
  );
}
