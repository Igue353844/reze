import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Loader2,
  UserPlus,
  Trash2,
  Search,
  ShieldAlert
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  email?: string;
}

const AdminManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Fetch all admin users
  const { data: adminUsers, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: isAdmin,
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      // First, find the user by email using auth admin API via edge function
      // Since we can't directly query auth.users, we'll add by user_id
      // The user must first create an account
      
      // For now, we'll check if user exists via a workaround
      // by attempting to sign in (this will fail but tell us if user exists)
      // Actually, let's create an edge function or use a different approach
      
      // Simpler approach: Ask for user_id or let admin see users who registered
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin')
        .limit(100);
      
      if (checkError) throw checkError;

      // We need the user_id, so we'll use a server function
      // For now, let's use the email to look up in our system
      // This requires an edge function to safely query auth.users
      
      throw new Error('Para adicionar um admin, use o ID do usuário. O usuário precisa primeiro criar uma conta em /auth');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Administrador adicionado com sucesso!');
      setNewAdminEmail('');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add admin by user ID
  const addAdminById = async (userId: string) => {
    setIsSubmitting(true);
    try {
      // Check if user already has admin role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (existing) {
        toast.error('Este usuário já é um administrador');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) {
        if (error.message.includes('foreign key')) {
          toast.error('Usuário não encontrado. Certifique-se de que ele criou uma conta.');
        } else {
          throw error;
        }
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Administrador adicionado com sucesso!');
      setNewAdminEmail('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Erro ao adicionar administrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Administrador removido');
    },
    onError: () => {
      toast.error('Erro ao remover administrador');
    },
  });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Validate - could be email or UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newAdminEmail);
    
    if (isUUID) {
      await addAdminById(newAdminEmail);
    } else {
      // Try to validate as email
      try {
        emailSchema.parse(newAdminEmail);
        toast.info('Para adicionar por email, o usuário deve primeiro criar uma conta. Use o User ID em vez disso.');
      } catch {
        setEmailError('Insira um User ID válido (UUID) ou email');
      }
    }
  };

  const handleRemoveAdmin = async (roleId: string, userId: string) => {
    // Prevent removing yourself
    if (userId === user?.id) {
      toast.error('Você não pode remover a si mesmo como administrador');
      return;
    }

    if (confirm('Tem certeza que deseja remover este administrador?')) {
      removeAdminMutation.mutate(roleId);
    }
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-6" />
          <h1 className="font-display text-4xl text-foreground mb-4">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground mb-8">
            Apenas administradores podem acessar esta página.
          </p>
          <Link to="/">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-4xl text-foreground">GERENCIAR ADMINS</h1>
            <p className="text-muted-foreground">Adicione ou remova administradores do sistema</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Add Admin Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Adicionar Administrador
              </CardTitle>
              <CardDescription>
                Adicione um novo administrador usando o User ID. O usuário deve primeiro criar uma conta em /auth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="User ID (UUID) do usuário"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="bg-secondary border-border"
                  />
                  {emailError && (
                    <p className="text-sm text-destructive mt-1">{emailError}</p>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting || !newAdminEmail} className="gap-2">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Adicionar
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Como encontrar o User ID:</strong>
                </p>
                <ol className="text-sm text-muted-foreground mt-2 list-decimal list-inside space-y-1">
                  <li>O usuário deve criar uma conta em <code className="bg-muted px-1 rounded">/auth</code></li>
                  <li>Acesse o Cloud Backend e vá em "Users"</li>
                  <li>Copie o ID do usuário desejado</li>
                  <li>Cole o ID acima e clique em Adicionar</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Admin List Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Administradores Atuais
              </CardTitle>
              <CardDescription>
                {adminUsers?.length || 0} administrador(es) no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : adminUsers && adminUsers.length > 0 ? (
                <div className="space-y-3">
                  {adminUsers.map((adminRole) => (
                    <div 
                      key={adminRole.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {adminRole.user_id === user?.id ? 'Você' : 'Administrador'}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {adminRole.user_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Desde {new Date(adminRole.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {adminRole.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAdmin(adminRole.id, adminRole.user_id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={removeAdminMutation.isPending}
                        >
                          {removeAdminMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldX className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum administrador configurado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Current User ID */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Seu User ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-secondary px-3 py-2 rounded text-sm font-mono text-muted-foreground">
                  {user?.id}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.id || '');
                    toast.success('User ID copiado!');
                  }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Email: {user?.email}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminManagement;
