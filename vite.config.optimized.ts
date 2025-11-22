/**
 * ULTRA-OPTIMIZED VITE CONFIGURATION
 * Stratégie de code splitting avancée pour réduire le bundle de 4.6MB à <1MB
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // ULTRA-OPTIMIZE: Configuration du serveur de développement
  server: {
    port: 3001,
    host: '127.0.0.1',
    strictPort: false,
  },
  
  // ULTRA-OPTIMIZE: Résolution des modules optimisée
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Éviter les polyfills problématiques
      util: 'util',
    },
  },
  
  // ULTRA-OPTIMIZE: Configuration de build avancée
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false, // Désactivé en production pour réduire la taille
    
    // Configuration Rollup optimisée
    rollupOptions: {
      // CRITICAL: Code splitting intelligent par domaine
      output: {
        manualChunks: {
          // 1. VENDOR CHUNKS - Librairies externes séparées
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', 'lucide-react'],
          'editor-vendor': ['@monaco-editor/react'],
          
          // 2. FEATURE CHUNKS - Fonctionnalités par domaine
          'stores': [
            'src/stores/ProjectStore.ts',
            'src/stores/DesignerStore.ts', 
            'src/stores/UIStore.ts',
            'src/stores/DebugStore.ts'
          ],
          
          'vb6-runtime': [
            'src/runtime/VB6UltraRuntime.ts',
            'src/runtime/VB6Runtime.ts',
            'src/utils/vb6Parser.ts',
            'src/utils/vb6Transpiler.ts',
            'src/utils/vb6Lexer.ts'
          ],
          
          'designer': [
            'src/components/Designer/DesignerCanvas.tsx',
            'src/components/Designer/DragDropCanvas.tsx',
            'src/components/DragDrop/AdvancedDragDropCanvas.tsx'
          ],
          
          'controls': [
            'src/components/Controls/VB6Controls.tsx',
            'src/components/Controls/DataControl.tsx',
            'src/components/Controls/DataGridControl.tsx'
          ],
          
          // 3. LAZY CHUNKS - Composants lourds chargés à la demande
          'analysis-tools': [
            'src/components/Analysis/CodeAnalyzer.tsx',
            'src/components/Refactoring/RefactorTools.tsx'
          ],
          
          'debugging-tools': [
            'src/components/Debugging/BreakpointManager.tsx',
            'src/components/Debug/AdvancedDebugPanel.tsx'
          ]
        },
        
        // ULTRA-OPTIMIZE: Nommage des chunks avec hash pour cache busting
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 
            'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        }
      },
      
      // CRITICAL: Externaliser les modules problématiques
      external: (id) => {
        // Ne pas bundler les polyfills Node.js lourds
        if (id.includes('node:') || id.includes('vm') || id.includes('crypto')) {
          return true;
        }
        return false;
      }
    },
    
    // ULTRA-OPTIMIZE: Configuration Terser pour minification aggressive
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2 // Deux passes de minification
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false // Supprimer tous les commentaires
      }
    },
    
    // ULTRA-OPTIMIZE: Limite de taille des chunks
    chunkSizeWarningLimit: 500, // Avertir si chunk > 500KB
  },
  
  // ULTRA-OPTIMIZE: Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'immer'
    ],
    exclude: [
      // Exclure Monaco des optimisations pour contrôler son chargement
      '@monaco-editor/react',
      'monaco-editor'
    ]
  },
  
  // ULTRA-OPTIMIZE: Configuration des définitions pour tree-shaking
  define: {
    __DEV__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});