import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Deployed on GitHub Pages under /geotimelapse/; plain root in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/geotimelapse/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        lab: resolve(import.meta.dirname, 'lab/index.html'),
        glow: resolve(import.meta.dirname, 'lab/glow/index.html'),
      },
    },
  },
}));
