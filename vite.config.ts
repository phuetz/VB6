import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5183,
    host: true,
  },
  build: {
    // Enable source maps for production debugging (can be disabled for smaller builds)
    sourcemap: true,
    // Increase chunk size warning limit for monaco-editor
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          // Monaco Editor (large dependency)
          monaco: ['monaco-editor'],
          // Zustand state management
          zustand: ['zustand'],
          // UI libraries
          'ui-libs': ['lucide-react', '@dnd-kit/core'],
        },
      },
    },
  },
});
