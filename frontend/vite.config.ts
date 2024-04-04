/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {},
  server: { proxy: { '/api': 'http://127.0.0.1:5000/' } },
  preview: {
    proxy: { '/api': process.env.API_URL || 'http://localhost:5000/' },
  },
})
