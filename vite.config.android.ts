import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';

// Capacitor build: same app, but served from the APK's local root instead of the
// GitHub Pages sub-path, and written to a separate folder so the two builds never
// clobber each other. The PWA plugin from the base config still runs; a service
// worker inside a WebView is harmless and keeps the two builds identical otherwise.
export default defineConfig((env) =>
  mergeConfig(baseConfig(env), {
    base: '/',
    build: { outDir: 'dist-android' },
  }),
);
