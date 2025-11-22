import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'buffer', 
      'process', 
      'util', 
      'crypto-browserify', 
      'stream-browserify',
      'events'
    ]
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process.browser': 'true',
  },
  resolve: {
    alias: {
      events: 'events',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      buffer: 'buffer',
      process: 'process/browser',
    }
  },
  server: {
    port: 3001,
    host: '127.0.0.1', // Localhost seulement pour éviter les conflits
    strictPort: false,
  },
});
