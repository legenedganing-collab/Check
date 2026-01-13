import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1573,
    host: '0.0.0.0',  // Allow all network interfaces
    middlewareMode: false,
    hmr: {
      host: 'localhost',  // For local development
      port: 1573
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'terser'
  }
})
