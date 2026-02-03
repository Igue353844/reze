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
  Shield
} from 'lucide-react';

export default function DownloadApp() {
  // Instructions for downloading from GitHub Actions
  const instructions = `
1. Exporte o projeto para o GitHub via "Export to GitHub"
2. No GitHub, vá em "Actions" e aguarde o build completar
3. Clique na execução mais recente e baixe o artefato "app-debug"
4. Instale o APK no seu dispositivo Android
  `.trim();

  const features = [
    { icon: Play, text: 'Assista filmes e séries em HD' },
    { icon: Tv, text: 'Suporte a TV e tela cheia' },
    { icon: Users, text: 'Watch Party com amigos' },
    { icon: Wifi, text: 'Streaming otimizado' },
    { icon: WifiOff, text: 'Cache para acesso offline' },
    { icon: Shield, text: 'Seguro e privado' },
  ];

  const handleOpenLovable = () => {
    window.open('https://lovable.dev', '_blank');
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 mb-6">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Baixar RezeFlix para Android</h1>
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
            <CardTitle className="text-2xl">RezeFlix Android App</CardTitle>
            <CardDescription>
              Compilado automaticamente via GitHub Actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleOpenLovable} className="gap-2 text-lg px-8">
                <Github className="h-5 w-5" />
                Exportar para GitHub
              </Button>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">📱 Como obter o APK:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Exporte para GitHub</strong> - No Lovable, clique em "Export to GitHub"</li>
                <li><strong>Aguarde o Build</strong> - O GitHub Actions irá compilar o APK automaticamente</li>
                <li><strong>Baixe o APK</strong> - Vá em Actions → selecione a execução mais recente → baixe "app-debug"</li>
                <li><strong>Instale no Android</strong> - Permita fontes desconhecidas e instale o APK</li>
              </ol>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1 text-primary">💡 Dica:</p>
              <p className="text-muted-foreground">
                O APK é gerado automaticamente toda vez que você faz push para o GitHub. 
                Basta exportar seu projeto e aguardar alguns minutos para o build finalizar.
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
            Prefere não instalar o APK?
          </p>
          <Button variant="link" onClick={() => window.location.href = '/install'}>
            Instale como App Web (PWA) →
          </Button>
        </div>
      </div>
    </Layout>
  );
}
