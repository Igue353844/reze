import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileAvatarPicker } from './ProfileAvatarPicker';
import { UserProfile, useUserProfiles } from '@/hooks/useUserProfiles';
import { Avatar } from '@/hooks/useAvatars';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditProfileDialogProps {
  profile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export function EditProfileDialog({ profile, isOpen, onClose, isNew }: EditProfileDialogProps) {
  const { createProfile, updateProfile, deleteProfile } = useUserProfiles();
  const [name, setName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isKids, setIsKids] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (profile) {
        setName(profile.name);
        setSelectedAvatarId(profile.avatar_id);
        setSelectedAvatarUrl(profile.avatar_url);
        setIsKids(profile.is_kids);
      } else {
        setName('');
        setSelectedAvatarId(null);
        setSelectedAvatarUrl(null);
        setIsKids(false);
      }
    }
  }, [isOpen, profile]);

  const handleSelectAvatar = (avatar: Avatar) => {
    setSelectedAvatarId(avatar.id);
    // Build avatar URL for display consistency
    if (avatar.emoji) {
      setSelectedAvatarUrl(`emoji:${avatar.emoji}:${avatar.bg_class}`);
    } else if (avatar.image_url) {
      setSelectedAvatarUrl(avatar.image_url);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (isNew) {
      await createProfile.mutateAsync({
        name: name.trim(),
        avatarId: selectedAvatarId || undefined,
        avatarUrl: selectedAvatarUrl || undefined,
        isKids,
      });
    } else if (profile) {
      await updateProfile.mutateAsync({
        id: profile.id,
        name: name.trim(),
        avatarId: selectedAvatarId || undefined,
        avatarUrl: selectedAvatarUrl || undefined,
        isKids,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (profile) {
      await deleteProfile.mutateAsync(profile.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const isLoading = createProfile.isPending || updateProfile.isPending || deleteProfile.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'Adicionar Perfil' : 'Editar Perfil'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Avatar Preview */}
            <div className="flex justify-center">
              <ProfileAvatar 
                avatarId={selectedAvatarId}
                avatarUrl={selectedAvatarUrl}
                name={name || 'Novo Perfil'}
                size="xl"
              />
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome do Perfil</Label>
              <Input
                id="profile-name"
                placeholder="Ex: Maria, João..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Kids Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Perfil Infantil</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir apenas conteúdo adequado para crianças
                </p>
              </div>
              <Switch
                checked={isKids}
                onCheckedChange={setIsKids}
              />
            </div>

            {/* Avatar Picker */}
            <div className="space-y-3">
              <Label>Escolha um Avatar</Label>
              <ProfileAvatarPicker 
                selectedAvatarId={selectedAvatarId}
                onSelect={handleSelectAvatar}
              />
            </div>
          </div>

          <div className="flex justify-between gap-2">
            {!isNew && profile && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!name.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O histórico de visualização e favoritos 
              deste perfil serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
