import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    allowedHosts: ['sharmaine-pyrotechnic-sonically.ngrok-free.dev']
  }
})