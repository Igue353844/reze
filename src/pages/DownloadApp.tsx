import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Check, 
  Github,
  Play,
  Tv,
  Users,
  Wifi,
  WifiOff,
  Shield,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DownloadApp() {
  // Link para releases do GitHub
  const githubReleasesUrl = 'https://github.com/Igue353844/reze/releases/latest';
  
  const features = [
    { icon: Play, text: 'Assista filmes e séries em HD' },
    { icon: Tv, text: 'Suporte a TV e tela cheia' },
    { icon: Users, text: 'Watch Party com amigos' },
    { icon: Wifi, text: 'Streaming otimizado' },
    { icon: WifiOff, text: 'Cache para acesso offline' },
    { icon: Shield, text: 'Seguro e privado' },
  ];

  const handleDownloadLatest = () => {
    window.open(githubReleasesUrl, '_blank');
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 mb-6">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Baixar RezeFlix Mobile</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tenha a melhor experiência de streaming diretamente no seu dispositivo Android
          </p>
        </div>

        {/* Download Card */}
        <Card className="mb-8 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="text-sm">
                Versão mais recente
              </Badge>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                Android APK
              </Badge>
            </div>
            <CardTitle className="text-2xl">RezeFlix Mobile</CardTitle>
            <CardDescription>
              APK gerado automaticamente a cada atualização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleDownloadLatest} className="gap-2 text-lg px-8">
                <Download className="h-5 w-5" />
                Baixar APK Mais Recente
              </Button>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Primeiro acesso?</AlertTitle>
              <AlertDescription>
                Se o link de download não funcionar, o projeto ainda não foi exportado para o GitHub. 
                Siga as instruções abaixo para configurar.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">📱 Como funciona:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>O APK é gerado <strong>automaticamente</strong> toda vez que o código é atualizado</li>
                <li>Basta clicar em <strong>"Baixar APK"</strong> para baixar a versão mais recente</li>
                <li>Instale no seu dispositivo Android e pronto!</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Github className="h-5 w-5" />
              Configuração Inicial (apenas uma vez)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Para ativar o download automático do APK, você precisa exportar o projeto para o GitHub:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li className="p-3 bg-muted/30 rounded-lg">
                <strong>Exporte para GitHub:</strong> No Lovable, vá em Configurações → GitHub → Conectar projeto
              </li>
              <li className="p-3 bg-muted/30 rounded-lg">
                <strong>Aguarde o build:</strong> O GitHub Actions irá compilar o APK automaticamente (cerca de 5-10 minutos)
              </li>
              <li className="p-3 bg-muted/30 rounded-lg">
                <strong>Acesse as Releases:</strong> Vá em seu repositório GitHub → Releases para baixar o APK
              </li>
            </ol>
            
            <div className="bg-primary/10 rounded-lg p-4 text-sm mt-4">
              <p className="font-medium mb-1 text-primary">💡 Após a configuração:</p>
              <p className="text-muted-foreground">
                Toda vez que você fizer alterações no Lovable, um novo APK será gerado automaticamente 
                e ficará disponível para download na página de Releases do GitHub.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-6">
            O que você terá no app
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requisitos do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                'Android 7.0 (Nougat) ou superior',
                'Mínimo 2GB de RAM',
                '100MB de espaço livre',
                'Conexão com a internet para streaming'
              ].map((req, index) => (
                <li key={index} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  {req}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Alternative - PWA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-2">
            Não quer baixar o APK?
          </p>
          <Button variant="link" onClick={() => window.location.href = '/install'}>
            Instale como App Web (PWA) →
          </Button>
        </div>
      </div>
    </Layout>
  );
}
