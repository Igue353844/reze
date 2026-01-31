import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAvatars, AvatarSection, Avatar } from '@/hooks/useAvatars';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2, FolderPlus, Upload, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const BG_OPTIONS = [
  { value: 'bg-pink-100 dark:bg-pink-900', label: 'Rosa', preview: 'bg-pink-100' },
  { value: 'bg-pink-50 dark:bg-pink-950', label: 'Rosa Claro', preview: 'bg-pink-50' },
  { value: 'bg-rose-100 dark:bg-rose-900', label: 'Rose', preview: 'bg-rose-100' },
  { value: 'bg-red-100 dark:bg-red-900', label: 'Vermelho', preview: 'bg-red-100' },
  { value: 'bg-orange-100 dark:bg-orange-900', label: 'Laranja', preview: 'bg-orange-100' },
  { value: 'bg-amber-50 dark:bg-amber-950', label: 'Âmbar', preview: 'bg-amber-50' },
  { value: 'bg-yellow-100 dark:bg-yellow-900', label: 'Amarelo', preview: 'bg-yellow-100' },
  { value: 'bg-lime-100 dark:bg-lime-900', label: 'Lima', preview: 'bg-lime-100' },
  { value: 'bg-green-100 dark:bg-green-900', label: 'Verde', preview: 'bg-green-100' },
  { value: 'bg-cyan-100 dark:bg-cyan-900', label: 'Ciano', preview: 'bg-cyan-100' },
  { value: 'bg-blue-100 dark:bg-blue-900', label: 'Azul', preview: 'bg-blue-100' },
  { value: 'bg-indigo-100 dark:bg-indigo-900', label: 'Índigo', preview: 'bg-indigo-100' },
  { value: 'bg-purple-100 dark:bg-purple-900', label: 'Roxo', preview: 'bg-purple-100' },
  { value: 'bg-slate-100 dark:bg-slate-900', label: 'Slate', preview: 'bg-slate-100' },
  { value: 'bg-gray-100 dark:bg-gray-900', label: 'Cinza', preview: 'bg-gray-100' },
];

interface SectionDialogProps {
  section?: AvatarSection;
  onSave: (name: string, slug: string) => void;
  isPending: boolean;
  trigger: React.ReactNode;
}

function SectionDialog({ section, onSave, isPending, trigger }: SectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(section?.name || '');
  const [slug, setSlug] = useState(section?.slug || '');

  const handleSave = () => {
    if (!name.trim() || !slug.trim()) return;
    onSave(name.trim(), slug.trim().toLowerCase().replace(/\s+/g, '-'));
    setOpen(false);
    if (!section) {
      setName('');
      setSlug('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? 'Editar Seção' : 'Nova Seção'}</DialogTitle>
          <DialogDescription>
            {section ? 'Edite os dados da seção.' : 'Crie uma nova seção de avatares.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Nome</Label>
            <Input
              id="section-name"
              placeholder="Ex: Naruto"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!section) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-slug">Slug</Label>
            <Input
              id="section-slug"
              placeholder="Ex: naruto"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim() || !slug.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AvatarDialogProps {
  avatar?: Avatar;
  sectionId: string;
  onSave: (data: { emoji?: string; imageUrl?: string; name: string; bgClass: string }) => void;
  isPending: boolean;
  trigger: React.ReactNode;
}

function AvatarDialog({ avatar, sectionId, onSave, isPending, trigger }: AvatarDialogProps) {
  const [open, setOpen] = useState(false);
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>(avatar?.image_url ? 'image' : 'emoji');
  const [emoji, setEmoji] = useState(avatar?.emoji || '');
  const [imageUrl, setImageUrl] = useState(avatar?.image_url || '');
  const [name, setName] = useState(avatar?.name || '');
  const [bgClass, setBgClass] = useState(avatar?.bg_class || BG_OPTIONS[0].value);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success('Imagem enviada!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (avatarType === 'emoji' && !emoji.trim()) return;
    if (avatarType === 'image' && !imageUrl.trim()) return;

    onSave({
      emoji: avatarType === 'emoji' ? emoji.trim() : undefined,
      imageUrl: avatarType === 'image' ? imageUrl.trim() : undefined,
      name: name.trim(),
      bgClass,
    });
    setOpen(false);
    if (!avatar) {
      setEmoji('');
      setImageUrl('');
      setName('');
      setBgClass(BG_OPTIONS[0].value);
      setAvatarType('emoji');
    }
  };

  const isValid = name.trim() && (
    (avatarType === 'emoji' && emoji.trim()) || 
    (avatarType === 'image' && imageUrl.trim())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{avatar ? 'Editar Avatar' : 'Novo Avatar'}</DialogTitle>
          <DialogDescription>
            {avatar ? 'Edite os dados do avatar.' : 'Adicione um novo avatar à seção.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={avatarType} onValueChange={(v) => setAvatarType(v as 'emoji' | 'image')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="emoji">Emoji</TabsTrigger>
            <TabsTrigger value="image">Imagem</TabsTrigger>
          </TabsList>

          <TabsContent value="emoji" className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
                bgClass.split(' ')[0]
              )}>
                {emoji || '?'}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-emoji">Emoji</Label>
                <Input
                  id="avatar-emoji"
                  placeholder="🎀"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="text-2xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <Select value={bgClass} onValueChange={setBgClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BG_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded-full", opt.preview)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="flex flex-col items-center gap-4">
              {imageUrl ? (
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex flex-col items-center gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Fazer Upload
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
                <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="avatar-url">Ou cole uma URL</Label>
                <Input
                  id="avatar-url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="avatar-name">Nome</Label>
          <Input
            id="avatar-name"
            placeholder="Ex: Naruto Uzumaki"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !isValid || isUploading}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AvatarManager() {
  const {
    sections,
    isLoading,
    createSection,
    updateSection,
    deleteSection,
    createAvatar,
    updateAvatar,
    deleteAvatar,
    getAvatarsBySection,
  } = useAvatars();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Avatares</h2>
        <SectionDialog
          onSave={(name, slug) => createSection.mutate({ name, slug })}
          isPending={createSection.isPending}
          trigger={
            <Button>
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Seção
            </Button>
          }
        />
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-6 pr-4">
          {sections?.map((section) => {
            const sectionAvatars = getAvatarsBySection(section.id);
            
            return (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <AvatarDialog
                        sectionId={section.id}
                        onSave={({ emoji, imageUrl, name, bgClass }) => 
                          createAvatar.mutate({ sectionId: section.id, emoji, imageUrl, name, bgClass })
                        }
                        isPending={createAvatar.isPending}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Avatar
                          </Button>
                        }
                      />
                      <SectionDialog
                        section={section}
                        onSave={(name, slug) => updateSection.mutate({ id: section.id, name, slug })}
                        isPending={updateSection.isPending}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir seção?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso excluirá a seção "{section.name}" e todos os avatares dentro dela. 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteSection.mutate(section.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {sectionAvatars.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum avatar nesta seção
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {sectionAvatars.map((avatar) => (
                        <div
                          key={avatar.id}
                          className="relative group flex flex-col items-center gap-1 p-2 rounded-lg border bg-card"
                        >
                          {avatar.image_url ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                              <img 
                                src={avatar.image_url} 
                                alt={avatar.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                              avatar.bg_class.split(' ')[0]
                            )}>
                              {avatar.emoji}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground truncate max-w-full">
                            {avatar.name}
                          </span>
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <AvatarDialog
                              avatar={avatar}
                              sectionId={section.id}
                              onSave={({ emoji, imageUrl, name, bgClass }) => 
                                updateAvatar.mutate({ id: avatar.id, emoji, imageUrl, name, bgClass })
                              }
                              isPending={updateAvatar.isPending}
                              trigger={
                                <Button variant="secondary" size="icon" className="h-6 w-6">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-6 w-6">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir avatar?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Isso excluirá o avatar "{avatar.name}". Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteAvatar.mutate(avatar.id)}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {sections?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma seção criada. Clique em "Nova Seção" para começar.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
