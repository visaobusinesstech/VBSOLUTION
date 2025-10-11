import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Removido define para usar variáveis de ambiente do .env.local
  optimizeDeps: {
    exclude: ['venom-bot']
  },
  build: {
    rollupOptions: {
      external: [
        'fs',
        'path',
        'crypto',
        'os',
        'child_process',
        'readline',
        'zlib',
        'util',
        'stream',
        'url',
        'assert'
      ]
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  publicDir: 'public',
})
