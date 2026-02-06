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
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/monaco-editor')) {
            return 'monaco';
          }
          if (id.includes('node_modules/zustand')) {
            return 'zustand';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@dnd-kit')) {
            return 'ui-libs';
          }
          // VB6 runtime in separate chunk (72 files, loaded on demand)
          if (id.includes('/src/runtime/')) {
            return 'vb6-runtime';
          }
        },
      },
    },
  },
});
