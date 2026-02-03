import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Smartphone, Share, Plus, Check, ArrowLeft, Chrome, Apple } from "lucide-react";

const Install = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall } = usePWAInstall();

  useEffect(() => {
    // If already installed and running as standalone, redirect to home
    if (isStandalone) {
      navigate("/");
    }
  }, [isStandalone, navigate]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Instalar App</h1>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center justify-center gap-6 max-w-md mx-auto">
        {/* App Icon */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <img 
            src="/icons/icon-192x192.png" 
            alt="RezeFlix" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold">RezeFlix</h2>
          <p className="text-muted-foreground mt-1">Sua Plataforma de Streaming</p>
        </div>

        {/* Already Installed */}
        {isInstalled && !isStandalone && (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-green-500">App Instalado!</CardTitle>
              <CardDescription>
                O RezeFlix já foi adicionado à sua tela inicial. Procure o ícone do app no seu dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} className="w-full">
                Continuar no Navegador
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Android/Chrome Install */}
        {isInstallable && !isInstalled && (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Chrome className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Instalar no Chrome</CardTitle>
              <CardDescription>
                Adicione o RezeFlix à sua tela inicial para uma experiência completa de app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Acesso Rápido</p>
                    <p className="text-sm text-muted-foreground">Abra direto da tela inicial</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Funciona Offline</p>
                    <p className="text-sm text-muted-foreground">Continue navegando sem internet</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Instalar Agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* iOS Instructions */}
        {isIOS && !isInstalled && (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Apple className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Instalar no iPhone/iPad</CardTitle>
              <CardDescription>
                Siga os passos abaixo para adicionar o RezeFlix à sua tela inicial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Toque em Compartilhar</p>
                    <p className="text-sm text-muted-foreground">
                      Toque no ícone <Share className="inline h-4 w-4" /> na barra do Safari
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Adicionar à Tela de Início</p>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo e toque em <Plus className="inline h-4 w-4" /> "Adicionar à Tela de Início"
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Confirmar</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em "Adicionar" no canto superior direito
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not installable fallback */}
        {!isInstallable && !isIOS && !isInstalled && (
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                <Smartphone className="h-6 w-6" />
              </div>
              <CardTitle>Instalação Disponível</CardTitle>
              <CardDescription>
                Para instalar o app, abra este site no Google Chrome no seu celular.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-center">
                  <span className="font-medium">Dica:</span> Use o Chrome para Android ou Safari para iOS
                </p>
              </div>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Continuar no Navegador
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="w-full mt-4">
          <h3 className="text-sm font-medium text-muted-foreground text-center mb-3">
            Por que instalar?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border rounded-lg p-3 text-center">
              <Smartphone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Experiência de App</p>
            </div>
            <div className="bg-card border rounded-lg p-3 text-center">
              <Download className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Acesso Offline</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Install;
