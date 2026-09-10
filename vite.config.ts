/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project site under /wiggle-wars/; dev/preview use root.
  base: command === 'build' ? '/wiggle-wars/' : '/',
  // The game ships as plain static files — keep the build boring on purpose.
  build: {
    target: 'es2020',
  },
  plugins: [
    // Make Wiggle Wars an installable, fully-offline app: "Add to Home Screen"
    // on Android (Chrome) and iPad (Safari). Workbox precaches the whole app
    // shell (including the self-hosted font), and the game makes no network
    // calls, so it works with no internet.
    VitePWA({
      registerType: 'autoUpdate',
      // Inline the registration in index.html so store scanners (PWABuilder)
      // can see the service worker without executing a separate script.
      injectRegister: 'inline',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg', 'fonts/*.woff2'],
      manifest: {
        // A stable id so browsers keep recognising the install if start_url moves.
        id: 'wiggle-wars',
        name: 'Wiggle Wars',
        short_name: 'Wiggle Wars',
        description:
          'A friendly classroom multiplayer line game — and a lesson in spotting the tricks games use.',
        lang: 'en',
        dir: 'ltr',
        theme_color: '#0F1512',
        background_color: '#0F1512',
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        start_url: '.',
        scope: '.',
        categories: ['games', 'education'],
        prefer_related_applications: false,
        launch_handler: { client_mode: 'navigate-existing' },
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: 'screenshots/home-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Home: pick a mode',
          },
          {
            src: 'screenshots/setup-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Set up a same-device match',
          },
          {
            src: 'screenshots/play-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Four players round one tablet',
          },
          {
            src: 'screenshots/home-narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Home on a phone',
          },
        ],
        shortcuts: [
          {
            name: 'Learn: spot the tricks',
            short_name: 'Learn',
            description: 'Six short lessons on the tricks games use',
            url: './?screen=learn',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'WiFi / Online game',
            short_name: 'WiFi game',
            description: 'Host or join a game with a room code',
            url: './?screen=wifi',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
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
}));
