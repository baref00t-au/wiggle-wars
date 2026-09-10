import type { CapacitorConfig } from '@capacitor/cli';

// Native (Android) wrapper config. The web app is built with `npm run build:android`
// into dist-android/ (base path "/" instead of the GitHub Pages "/wiggle-wars/")
// and bundled INTO the APK, so the installed app needs no hosting at all.
// The WiFi/online code games still reach the PeerJS broker + STUN over the internet.
const config: CapacitorConfig = {
  appId: 'au.baref00t.wigglewars',
  appName: 'Wiggle Wars',
  webDir: 'dist-android',
  android: {
    // The game is landscape-only and uses no cleartext HTTP.
    allowMixedContent: false,
  },
};

export default config;
