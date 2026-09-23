import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Deployed on GitHub Pages under /geotimelapse/; plain root in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/geotimelapse/' : '/',
  plugins: [react(), tailwindcss()],
}));
