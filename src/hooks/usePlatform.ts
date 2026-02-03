import { useState, useEffect } from 'react';

interface PlatformInfo {
  isCapacitor: boolean;
  isTV: boolean;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  platform: 'web' | 'android' | 'ios' | 'tv';
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isCapacitor: false,
    isTV: false,
    isMobile: false,
    isAndroid: false,
    isIOS: false,
    platform: 'web'
  });

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check if running in Capacitor (Android/iOS app)
      const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
      
      // Check for Android
      const isAndroid = userAgent.includes('android');
      
      // Check for iOS
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      
      // Check for TV Box / Android TV indicators
      const isTV = 
        userAgent.includes('android tv') ||
        userAgent.includes('smart-tv') ||
        userAgent.includes('googletv') ||
        userAgent.includes('crkey') ||
        userAgent.includes('aftb') || // Amazon Fire TV
        userAgent.includes('aftt') || // Fire TV Stick
        userAgent.includes('aftm') || // Fire TV Stick 4K
        userAgent.includes('bravia') || // Sony Bravia
        userAgent.includes('philipstv') ||
        userAgent.includes('hbbtv') ||
        // Check for typical TV Box resolution/screen
        (isAndroid && window.screen.width >= 1280 && !('ontouchstart' in window));

      // Determine primary platform
      let platform: 'web' | 'android' | 'ios' | 'tv' = 'web';
      if (isTV) {
        platform = 'tv';
      } else if (isAndroid || (isCapacitor && !isIOS)) {
        platform = 'android';
      } else if (isIOS) {
        platform = 'ios';
      }

      setPlatformInfo({
        isCapacitor,
        isTV,
        isMobile: isAndroid || isIOS,
        isAndroid,
        isIOS,
        platform
      });
    };

    detectPlatform();
  }, []);

  return platformInfo;
}
