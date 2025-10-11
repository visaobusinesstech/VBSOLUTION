import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      "date-fns": path.resolve(process.cwd(), "./src/utils/dateUtils"),
    },
  },
  optimizeDeps: {
    exclude: ['date-fns']
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true, // Forçar uso da porta 5173
    // Proxy temporariamente desabilitado para evitar erros de WebSocket
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   },
    //   '/uploads': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   },
    //   '/socket.io': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //     ws: true,
    //   },
    // },
  },
  publicDir: 'public',
})
