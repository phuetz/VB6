import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite ultra-simple pour diagnostic
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 7777,
    host: '0.0.0.0',
    strictPort: false,
    open: false,
    cors: true,
    // Logs détaillés
    middlewareMode: false,
  },
  // Configuration minimale - pas de polyfills complexes
  define: {
    global: 'globalThis',
  },
  // Pas d'optimisation complexe pour le diagnostic
  optimizeDeps: {
    exclude: [],
    include: ['react', 'react-dom'],
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
  },
  // Logs détaillés
  logLevel: 'info',
  clearScreen: false,
});
