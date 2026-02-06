/**
 * Tests pour les scripts npm du package.json
 * Vérifie que tous les scripts critiques fonctionnent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Package Scripts', () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  let packageJson: any;

  beforeEach(() => {
    // Charger le package.json
    const packageContent = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(packageContent);
  });

  describe('Package.json Structure', () => {
    it('should have all required scripts', () => {
      const requiredScripts = [
        'dev',
        'build',
        'lint',
        'preview',
        'test',
        'test:ui',
        'format',
        'format:check',
      ];

      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
        expect(typeof packageJson.scripts[script]).toBe('string');
        expect(packageJson.scripts[script].length).toBeGreaterThan(0);
      });
    });

    it('should have all required dependencies', () => {
      const requiredDependencies = [
        '@dnd-kit/core',
        '@monaco-editor/react',
        'react',
        'react-dom',
        'zustand',
      ];

      requiredDependencies.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
        expect(typeof packageJson.dependencies[dep]).toBe('string');
      });
    });

    it('should have all required dev dependencies', () => {
      const requiredDevDependencies = [
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@types/react',
        '@types/react-dom',
        'vitest',
        'jsdom',
        'typescript',
      ];

      requiredDevDependencies.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
        expect(typeof packageJson.devDependencies[dep]).toBe('string');
      });
    });

    it('should have correct project metadata', () => {
      expect(packageJson.name).toBe('vite-react-typescript-starter');
      expect(packageJson.private).toBe(true);
      expect(packageJson.type).toBe('module');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Script Content Validation', () => {
    it('should have correct dev script', () => {
      expect(packageJson.scripts.dev).toBe('vite');
    });

    it('should have correct build script', () => {
      expect(packageJson.scripts.build).toBe('vite build');
    });

    it('should have correct test scripts', () => {
      expect(packageJson.scripts.test).toBe('vitest');
      expect(packageJson.scripts['test:ui']).toBe('vitest --ui');
    });

    it('should have correct lint script', () => {
      expect(packageJson.scripts.lint).toBe('eslint .');
    });

    it('should have correct format scripts', () => {
      expect(packageJson.scripts.format).toBe('prettier --write .');
      expect(packageJson.scripts['format:check']).toBe('prettier --check .');
    });

    it('should have correct preview script', () => {
      expect(packageJson.scripts.preview).toBe('vite preview');
    });
  });

  describe('Dependencies Versions', () => {
    it('should have compatible React versions', () => {
      const reactVersion = packageJson.dependencies.react;
      const reactDomVersion = packageJson.dependencies['react-dom'];
      const reactTypesVersion = packageJson.devDependencies['@types/react'];
      const reactDomTypesVersion = packageJson.devDependencies['@types/react-dom'];

      // Vérifier que les versions de React et React-DOM sont compatibles
      expect(reactVersion).toMatch(/^\^18\./);
      expect(reactDomVersion).toMatch(/^\^18\./);
      expect(reactTypesVersion).toMatch(/^\^18\./);
      expect(reactDomTypesVersion).toMatch(/^\^18\./);
    });

    it('should have compatible testing library versions', () => {
      const testingLibraryReact = packageJson.devDependencies['@testing-library/react'];
      const testingLibraryJestDom = packageJson.devDependencies['@testing-library/jest-dom'];

      expect(testingLibraryReact).toMatch(/^\^?\d+\./);
      expect(testingLibraryJestDom).toMatch(/^\^?\d+\./);
    });

    it('should have compatible Vite and TypeScript versions', () => {
      const viteVersion = packageJson.devDependencies.vite;
      const typescriptVersion = packageJson.devDependencies.typescript;
      const vitestVersion = packageJson.devDependencies.vitest;

      expect(viteVersion).toMatch(/^\^?\d+\./);
      expect(typescriptVersion).toMatch(/^\^?5\./);
      expect(vitestVersion).toMatch(/^\^?\d+\./);
    });
  });

  describe('Security Checks', () => {
    it('should not have known vulnerable packages', () => {
      // Liste des packages avec des vulnérabilités connues à éviter
      const vulnerablePackages = [
        'event-stream',
        'flatmap-stream',
        'ua-parser-js@0.7.29',
        'ua-parser-js@0.7.30',
        'ua-parser-js@0.7.31',
      ];

      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      vulnerablePackages.forEach(vuln => {
        const [pkgName] = vuln.split('@');
        expect(allDependencies).not.toHaveProperty(pkgName);
      });
    });

    it('should use specific versions for security-critical packages', () => {
      // Certains packages doivent avoir des versions spécifiques pour la sécurité
      const securityCriticalPackages = ['typescript', 'vite', 'react', 'react-dom'];

      securityCriticalPackages.forEach(pkg => {
        if (packageJson.dependencies[pkg]) {
          expect(packageJson.dependencies[pkg]).toMatch(/^\^?\d+\.\d+\.\d+/);
        }
        if (packageJson.devDependencies[pkg]) {
          expect(packageJson.devDependencies[pkg]).toMatch(/^\^?\d+\.\d+\.\d+/);
        }
      });
    });
  });

  describe('Browser Compatibility', () => {
    it('should have browser-compatible polyfills', () => {
      const browserPolyfills = [
        'buffer',
        'crypto-browserify',
        'stream-browserify',
        'events',
        'util',
        'process',
      ];

      browserPolyfills.forEach(polyfill => {
        expect(packageJson.devDependencies).toHaveProperty(polyfill);
      });
    });
  });

  describe('Build Tool Configuration', () => {
    it('should have proper build tool dependencies', () => {
      const buildTools = [
        'vite',
        '@vitejs/plugin-react',
        'typescript',
        'postcss',
        'tailwindcss',
        'autoprefixer',
      ];

      buildTools.forEach(tool => {
        expect(packageJson.devDependencies).toHaveProperty(tool);
      });
    });

    it('should have linting and formatting tools', () => {
      const lintingTools = ['eslint', 'prettier', 'typescript-eslint'];

      lintingTools.forEach(tool => {
        expect(packageJson.devDependencies).toHaveProperty(tool);
      });
    });
  });

  describe('Testing Framework', () => {
    it('should have complete testing setup', () => {
      const testingDeps = [
        'vitest',
        '@testing-library/react',
        '@testing-library/jest-dom',
        'jsdom',
      ];

      testingDeps.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
      });
    });
  });

  describe('Collaboration Dependencies', () => {
    it('should have collaboration-related dependencies', () => {
      const collaborationDeps = [
        'socket.io-client', // pour la collaboration temps réel
      ];

      collaborationDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });
  });

  describe('UI and Animation Dependencies', () => {
    it('should have UI framework dependencies', () => {
      const uiDeps = [
        'framer-motion', // pour les animations
        'lucide-react', // pour les icônes
      ];

      uiDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });

    it('should have drag and drop dependencies', () => {
      const dndDeps = ['@dnd-kit/core'];

      dndDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });
  });

  describe('Monaco Editor Integration', () => {
    it('should have Monaco Editor dependencies', () => {
      const monacoDepsa = ['@monaco-editor/react', 'monaco-editor'];

      monacoDepsa.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });
  });

  describe('State Management', () => {
    it('should have state management dependencies', () => {
      const stateDeps = [
        'zustand', // pour la gestion d'état
      ];

      stateDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });
  });

  describe('File Processing', () => {
    it('should have file processing dependencies', () => {
      const fileDeps = [
        'jszip', // pour la gestion de fichiers ZIP
      ];

      fileDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });
  });

  describe('Version Consistency', () => {
    it('should have consistent peer dependencies', () => {
      // Vérifier que les peer dependencies sont cohérentes
      const reactVersion = packageJson.dependencies.react;
      const reactDomVersion = packageJson.dependencies['react-dom'];

      // Les versions majeures doivent correspondre
      const reactMajor = reactVersion.match(/\^?(\d+)/)?.[1];
      const reactDomMajor = reactDomVersion.match(/\^?(\d+)/)?.[1];

      expect(reactMajor).toBe(reactDomMajor);
    });

    it('should not have duplicate dependencies', () => {
      const deps = Object.keys(packageJson.dependencies || {});
      const devDeps = Object.keys(packageJson.devDependencies || {});

      // Vérifier qu'il n'y a pas de doublons
      const duplicates = deps.filter(dep => devDeps.includes(dep));
      expect(duplicates).toEqual([]);
    });
  });

  describe('Package Metadata', () => {
    it('should have proper package configuration', () => {
      expect(packageJson.private).toBe(true); // Doit être privé
      expect(packageJson.type).toBe('module'); // Doit être ESM

      // Vérifier la structure des scripts
      expect(typeof packageJson.scripts).toBe('object');
      expect(Object.keys(packageJson.scripts).length).toBeGreaterThan(0);
    });
  });
});
