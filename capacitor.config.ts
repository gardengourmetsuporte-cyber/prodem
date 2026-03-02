import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c30248f4a7ad426daa9e0a1ee02a913b',
  appName: 'prodem',
  webDir: 'dist',
  server: {
    url: 'https://c30248f4-a7ad-426d-aa9e-0a1ee02a913b.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0c1120',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0c1120',
    },
  },
};

export default config;
