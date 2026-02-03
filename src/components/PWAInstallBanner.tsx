import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PWAInstallBanner = () => {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, isStandalone } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Show banner after a short delay
    const timer = setTimeout(() => {
      if ((isInstallable || isIOS) && !isInstalled && !isStandalone && !dismissed) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS, isStandalone]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleInstallClick = () => {
    navigate('/install');
  };

  if (!showBanner || isDismissed || isStandalone || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary to-accent">
          <img 
            src="/icons/icon-192x192.png" 
            alt="RezeFlix" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Instalar RezeFlix</p>
          <p className="text-xs text-muted-foreground truncate">
            {isIOS ? 'Adicione à tela inicial' : 'App para seu celular'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="gap-1"
          >
            <Download className="h-4 w-4" />
            Instalar
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
