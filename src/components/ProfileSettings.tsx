import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Camera, User, Loader2, Upload } from 'lucide-react';
import { AvatarPicker, useAvatarDetails } from './AvatarPicker';
import { cn } from '@/lib/utils';

interface ProfileSettingsProps {
  children?: React.ReactNode;
}

export function ProfileSettings({ children }: ProfileSettingsProps) {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when profile loads or dialog opens
  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.display_name || '');
      setSelectedAvatar(profile.avatar_url || null);
    }
  }, [isOpen, profile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const result = await uploadAvatar.mutateAsync(file);
    if (result) {
      setSelectedAvatar(result);
    }
  };

  const handleSelectPredefinedAvatar = (avatarIdentifier: string) => {
    setSelectedAvatar(avatarIdentifier);
  };

  const handleSave = async () => {
    await updateProfile.mutateAsync({ 
      displayName,
      avatarUrl: selectedAvatar || undefined
    });
    setIsOpen(false);
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const avatarInfo = useAvatarDetails(selectedAvatar);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações do Perfil</DialogTitle>
          <DialogDescription>
            Escolha seu avatar e personalize seu perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {avatarInfo?.type === 'emoji' ? (
                <div className={cn(
                  "h-24 w-24 rounded-full flex items-center justify-center text-4xl",
                  avatarInfo.bg
                )}>
                  {avatarInfo.emoji}
                </div>
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarInfo?.url || undefined} alt="Avatar" />
                  <AvatarFallback className="text-2xl bg-primary/20">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {displayName || profile?.display_name || user?.email?.split('@')[0]}
            </p>
          </div>

          {/* Avatar Selection Tabs */}
          <Tabs defaultValue="avatars" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="avatars">Avatares</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="avatars" className="mt-4">
              <AvatarPicker 
                selectedAvatar={selectedAvatar}
                onSelectAvatar={handleSelectPredefinedAvatar}
              />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-4">
              <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed rounded-lg">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Envie sua própria foto</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                >
                  {uploadAvatar.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Escolher arquivo
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibição</Label>
            <Input
              id="displayName"
              placeholder={user?.email?.split('@')[0] || 'Seu nome'}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Este nome será exibido no chat e nas watch parties.
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
