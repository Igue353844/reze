import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ea6304de6b5f4c4faf39fa8b4505cc24',
  appName: 'Streaming App',
  webDir: 'dist',
  server: {
    url: 'https://ea6304de-6b5f-4c4f-af39-fa8b4505cc24.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
