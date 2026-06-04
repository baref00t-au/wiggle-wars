/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // The game ships as plain static files — keep the build boring on purpose.
  build: {
    target: 'es2020',
  },
  plugins: [
    // Make Wiggle Wars an installable, fully-offline app: "Add to Home Screen"
    // on Android (Chrome) and iPad (Safari). Workbox precaches the whole app
    // shell, and the game makes no network calls, so it works with no internet.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Wiggle Wars',
        short_name: 'Wiggle Wars',
        description:
          'A friendly classroom multiplayer line game — and a lesson in spotting the tricks games use.',
        theme_color: '#0e0f1a',
        background_color: '#0e0f1a',
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        start_url: '.',
        scope: '.',
        categories: ['games', 'education'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
