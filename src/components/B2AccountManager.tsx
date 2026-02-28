import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Trash2, HardDrive, Loader2, Database, RefreshCw } from 'lucide-react';

interface B2Account {
  id: string;
  label: string;
  key_id: string;
  app_key: string;
  bucket_name: string;
  endpoint: string;
  max_storage_bytes: number;
  used_storage_bytes: number;
  is_active: boolean;
  priority: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function B2AccountManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    key_id: '',
    app_key: '',
    bucket_name: '',
    endpoint: '',
    max_storage_gb: '10',
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['b2-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('b2_accounts').select('*').order('priority');
      if (error) throw error;
      return data as B2Account[];
    },
  });

  const addAccount = useMutation({
    mutationFn: async (account: typeof formData) => {
      const { error } = await supabase.from('b2_accounts').insert({
        label: account.label.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        key_id: account.key_id,
        app_key: account.app_key,
        bucket_name: account.bucket_name,
        endpoint: account.endpoint,
        max_storage_bytes: parseFloat(account.max_storage_gb) * 1024 * 1024 * 1024,
        priority: (accounts?.length || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2-accounts'] });
      toast.success('Conta B2 adicionada!');
      setShowForm(false);
      setFormData({ label: '', key_id: '', app_key: '', bucket_name: '', endpoint: '', max_storage_gb: '10' });
    },
    onError: (err: Error) => {
      toast.error('Erro ao adicionar conta: ' + err.message);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('b2_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2-accounts'] });
      toast.success('Conta removida');
    },
  });

  const toggleAccount = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('b2_accounts').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2-accounts'] });
    },
  });

  const resetUsage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('b2_accounts').update({ used_storage_bytes: 0 }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2-accounts'] });
      toast.success('Uso resetado');
    },
  });

  const totalStorage = accounts?.reduce((sum, a) => sum + a.max_storage_bytes, 0) || 0;
  const totalUsed = accounts?.reduce((sum, a) => sum + a.used_storage_bytes, 0) || 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {accounts && accounts.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
          <Database className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                Pool total: {accounts.length} conta{accounts.length > 1 ? 's' : ''}
              </span>
              <span className="text-foreground font-medium">
                {formatBytes(totalUsed)} / {formatBytes(totalStorage)}
              </span>
            </div>
            <Progress value={totalStorage > 0 ? (totalUsed / totalStorage) * 100 : 0} className="h-2" />
          </div>
        </div>
      )}

      {/* Account list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {accounts?.map((account) => {
            const usagePercent = account.max_storage_bytes > 0
              ? (account.used_storage_bytes / account.max_storage_bytes) * 100
              : 0;
            const isFull = usagePercent >= 95;

            return (
              <div key={account.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <HardDrive className={`w-5 h-5 flex-shrink-0 ${isFull ? 'text-destructive' : 'text-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{account.label}</span>
                    <Badge variant={account.is_active ? 'default' : 'secondary'} className="text-xs">
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    {isFull && <Badge variant="destructive" className="text-xs">Cheia</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {account.bucket_name} • {formatBytes(account.used_storage_bytes)} / {formatBytes(account.max_storage_bytes)}
                  </div>
                  <Progress value={usagePercent} className="h-1 mt-1" />
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={account.is_active}
                    onCheckedChange={(checked) => toggleAccount.mutate({ id: account.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => resetUsage.mutate(account.id)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Resetar uso"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Remover conta "${account.label}"?`)) {
                        deleteAccount.mutate(account.id);
                      }
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nova Conta B2</CardTitle>
            <CardDescription>Preencha os dados da sua conta Backblaze B2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Nome/Label (identificador único)</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData((f) => ({ ...f, label: e.target.value }))}
                placeholder="conta-1"
                className="bg-secondary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Key ID</Label>
                <Input
                  value={formData.key_id}
                  onChange={(e) => setFormData((f) => ({ ...f, key_id: e.target.value }))}
                  placeholder="00xxxxxxx"
                  className="bg-secondary"
                />
              </div>
              <div>
                <Label>Application Key</Label>
                <Input
                  type="password"
                  value={formData.app_key}
                  onChange={(e) => setFormData((f) => ({ ...f, app_key: e.target.value }))}
                  placeholder="K00xxxxxxx"
                  className="bg-secondary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bucket Name</Label>
                <Input
                  value={formData.bucket_name}
                  onChange={(e) => setFormData((f) => ({ ...f, bucket_name: e.target.value }))}
                  placeholder="meu-bucket"
                  className="bg-secondary"
                />
              </div>
              <div>
                <Label>Endpoint (S3)</Label>
                <Input
                  value={formData.endpoint}
                  onChange={(e) => setFormData((f) => ({ ...f, endpoint: e.target.value }))}
                  placeholder="s3.us-east-005.backblazeb2.com"
                  className="bg-secondary"
                />
              </div>
            </div>
            <div>
              <Label>Limite de armazenamento (GB)</Label>
              <Input
                type="number"
                value={formData.max_storage_gb}
                onChange={(e) => setFormData((f) => ({ ...f, max_storage_gb: e.target.value }))}
                className="bg-secondary w-32"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => addAccount.mutate(formData)}
                disabled={!formData.label || !formData.key_id || !formData.app_key || !formData.bucket_name || !formData.endpoint || addAccount.isPending}
              >
                {addAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Conta B2
        </Button>
      )}
    </div>
  );
}
