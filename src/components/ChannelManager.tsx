import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLiveChannels, useCreateChannel, useDeleteChannel, useUpdateChannel, LiveChannel } from '@/hooks/useLiveChannels';
import { Loader2, Plus, Trash2, Tv, Edit2, X, Check } from 'lucide-react';

export function ChannelManager() {
  const { data: channels, isLoading } = useLiveChannels();
  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();
  const updateChannel = useUpdateChannel();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    stream_url: '',
    logo_url: '',
    category: '',
    is_active: true,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      stream_url: '',
      logo_url: '',
      category: '',
      is_active: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.stream_url) {
      toast({
        title: 'Erro',
        description: 'Nome e URL do stream são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingId) {
        await updateChannel.mutateAsync({
          id: editingId,
          ...formData,
          logo_url: formData.logo_url || null,
          category: formData.category || null,
        });
        toast({ title: 'Canal atualizado com sucesso!' });
      } else {
        await createChannel.mutateAsync({
          ...formData,
          logo_url: formData.logo_url || null,
          category: formData.category || null,
        });
        toast({ title: 'Canal adicionado com sucesso!' });
      }
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (channel: LiveChannel) => {
    setFormData({
      name: channel.name,
      slug: channel.slug,
      stream_url: channel.stream_url,
      logo_url: channel.logo_url || '',
      category: channel.category || '',
      is_active: channel.is_active,
    });
    setEditingId(channel.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este canal?')) return;

    try {
      await deleteChannel.mutateAsync(id);
      toast({ title: 'Canal excluído com sucesso!' });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (channel: LiveChannel) => {
    try {
      await updateChannel.mutateAsync({
        id: channel.id,
        is_active: !channel.is_active,
      });
      toast({ title: `Canal ${channel.is_active ? 'desativado' : 'ativado'}` });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingId ? 'Editar Canal' : 'Adicionar Canal'}</span>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Canal *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: TV Globo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="tv-globo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream_url">URL do Stream (m3u8) *</Label>
                <Input
                  id="stream_url"
                  value={formData.stream_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, stream_url: e.target.value }))}
                  placeholder="https://example.com/stream.m3u8"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL do Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Entretenimento"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Canal Ativo</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createChannel.isPending || updateChannel.isPending}>
                    {(createChannel.isPending || updateChannel.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Canal
        </Button>
      )}

      {/* Channel List */}
      <div className="grid gap-4">
        {channels?.map((channel) => (
          <Card key={channel.id} className={!channel.is_active ? 'opacity-60' : ''}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                {channel.logo_url ? (
                  <img
                    src={channel.logo_url}
                    alt={channel.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                    <Tv className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{channel.stream_url}</p>
                  {channel.category && (
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded mt-1 inline-block">
                      {channel.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={channel.is_active}
                    onCheckedChange={() => toggleActive(channel)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(channel)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(channel.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!channels || channels.length === 0) && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            <Tv className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum canal cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
