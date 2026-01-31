import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatePartyDialog } from '@/components/WatchParty/CreatePartyDialog';
import { JoinPartyDialog } from '@/components/WatchParty/JoinPartyDialog';
import { useMyParties } from '@/hooks/useWatchParty';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Crown, 
  Film,
  ArrowRight,
  Popcorn
} from 'lucide-react';

export default function WatchPartyLobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: myParties, isLoading } = useMyParties();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Faça login para continuar</h2>
              <p className="text-muted-foreground mb-4">
                Você precisa estar logado para usar o Watch Party
              </p>
              <Button onClick={() => navigate('/auth')}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Popcorn className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Watch Party</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Assista filmes e séries junto com seus amigos em tempo real
          </p>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setShowCreate(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Criar Sala</CardTitle>
                  <CardDescription>Seja o host e convide amigos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2">
                <Crown className="h-4 w-4" />
                Criar Watch Party
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setShowJoin(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Entrar em uma Sala</CardTitle>
                  <CardDescription>Use um código de convite</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Entrar com Código
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Parties */}
        {myParties && myParties.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Suas Salas Ativas
            </h2>
            <div className="space-y-3">
              {myParties.map((party) => (
                <Card key={party.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {party.videos?.poster_url ? (
                          <img
                            src={party.videos.poster_url}
                            alt={party.videos.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                            <Film className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{party.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Código: <span className="font-mono">{party.code}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/party/${party.id}`)}
                        className="gap-2"
                      >
                        Entrar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreatePartyDialog open={showCreate} onOpenChange={setShowCreate} />
      <JoinPartyDialog open={showJoin} onOpenChange={setShowJoin} />
    </Layout>
  );
}
