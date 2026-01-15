import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    headers: {
      // Cambiar a credentialless para permitir recursos cross-origin
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Agregar CORP para recursos propios
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  },
  base: '/',
  define: {
    global: 'globalThis',
  },})