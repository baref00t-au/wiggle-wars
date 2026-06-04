/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // The game ships as plain static files — keep the build boring on purpose.
  build: {
    target: 'es2020',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
