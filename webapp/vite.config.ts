/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {},
  server: {
    // Dev-only CORS shim: the S3 bucket does not send CORS headers,
    // so CSVs are fetched same-origin through this proxy.
    proxy: {
      '/s3': {
        target: 'https://geotimelapse.s3.eu-central-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3/, ''),
      },
    },
  },
})
