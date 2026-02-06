# 📦 Guide d'Installation - VB6 Web IDE

## 🎯 Vue d'ensemble

Ce guide vous accompagne dans l'installation et la configuration de VB6 Web IDE sur votre environnement de développement local ou votre serveur de production.

## 📋 Prérequis Système

### Configuration Minimale

- **Node.js**: 16.x ou supérieur
- **NPM**: 8.x ou supérieur
- **RAM**: 4 GB minimum
- **Espace disque**: 2 GB disponible
- **Navigateur**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Configuration Recommandée

- **Node.js**: 18.x ou 20.x
- **NPM**: 9.x ou supérieur
- **RAM**: 8 GB ou plus
- **Espace disque**: 5 GB disponible
- **Processeur**: Multi-cœur pour les performances optimales

## 🚀 Installation Rapide

### 1. Cloner le Repository

```bash
# Via HTTPS
git clone https://github.com/your-org/vb6-web-ide.git

# Via SSH (recommandé)
git clone git@github.com:your-org/vb6-web-ide.git

# Accéder au répertoire
cd vb6-web-ide
```

### 2. Installer les Dépendances

```bash
# Installation standard
npm install

# Installation avec cache nettoyé (en cas de problème)
npm ci

# Installation pour production uniquement
npm install --production
```

### 3. Configuration de l'Environnement

Créer un fichier `.env.local` à la racine du projet:

```bash
# Environnement
NODE_ENV=development
VITE_APP_ENV=development

# API (optionnel)
VITE_API_URL=http://localhost:3000

# Fonctionnalités
VITE_ENABLE_ACTIVEX=true
VITE_ENABLE_COMPILER=true
VITE_ENABLE_DEBUGGER=true

# Performance
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_SERVICE_WORKER=false

# Sécurité (production uniquement)
VITE_CSP_NONCE=generate-random-nonce
```

### 4. Lancer l'Application

```bash
# Mode développement (rechargement automatique)
npm run dev

# L'application sera accessible sur http://localhost:5173
```

## 🔧 Installation Détaillée

### Installation sur Windows

1. **Installer Node.js**

   ```powershell
   # Via Chocolatey
   choco install nodejs

   # Ou télécharger depuis https://nodejs.org
   ```

2. **Cloner et installer**

   ```powershell
   git clone https://github.com/your-org/vb6-web-ide.git
   cd vb6-web-ide
   npm install
   ```

3. **Lancer l'application**
   ```powershell
   npm run dev
   ```

### Installation sur macOS

1. **Installer Node.js**

   ```bash
   # Via Homebrew
   brew install node

   # Ou via NVM (recommandé)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Cloner et installer**

   ```bash
   git clone https://github.com/your-org/vb6-web-ide.git
   cd vb6-web-ide
   npm install
   ```

3. **Lancer l'application**
   ```bash
   npm run dev
   ```

### Installation sur Linux (Ubuntu/Debian)

1. **Installer Node.js**

   ```bash
   # Via NodeSource
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Ou via NVM
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

2. **Installer les dépendances système**

   ```bash
   sudo apt-get update
   sudo apt-get install -y git build-essential
   ```

3. **Cloner et installer**

   ```bash
   git clone https://github.com/your-org/vb6-web-ide.git
   cd vb6-web-ide
   npm install
   ```

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

## 🐳 Installation avec Docker

### 1. Créer l'image Docker

```bash
# Construction de l'image
docker build -t vb6-web-ide .

# Ou utiliser docker-compose
docker-compose build
```

### 2. Lancer le conteneur

```bash
# Lancement simple
docker run -p 8080:80 vb6-web-ide

# Avec docker-compose
docker-compose up -d
```

### 3. Configuration Docker personnalisée

Créer un `docker-compose.yml`:

```yaml
version: '3.8'

services:
  vb6-ide:
    build: .
    ports:
      - '8080:80'
    environment:
      - NODE_ENV=production
      - VITE_APP_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## 📦 Installation pour Production

### 1. Build de Production

```bash
# Build optimisé
npm run build

# Vérifier la taille du bundle
npm run analyze

# Tester le build
npm run preview
```

### 2. Déploiement sur Serveur Web

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/vb6-ide/dist;
    index index.html;

    # Gestion des routes SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Support WebAssembly
    location ~ \.wasm$ {
        add_header Content-Type application/wasm;
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    DocumentRoot /var/www/vb6-ide/dist

    <Directory /var/www/vb6-ide/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Support SPA routing
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    # MIME types
    AddType application/wasm .wasm
</VirtualHost>
```

### 3. Déploiement Cloud

#### Vercel

```bash
# Installation CLI Vercel
npm i -g vercel

# Déploiement
vercel --prod
```

#### Netlify

```bash
# Installation CLI Netlify
npm i -g netlify-cli

# Déploiement
netlify deploy --prod --dir=dist
```

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync avec S3
aws s3 sync dist/ s3://votre-bucket-vb6-ide/

# Invalider le cache CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔍 Vérification de l'Installation

### 1. Tests de Base

```bash
# Exécuter les tests unitaires
npm test

# Tests avec interface
npm run test:ui

# Tests de bout en bout
npm run test:e2e
```

### 2. Vérification des Fonctionnalités

Après l'installation, vérifiez que ces fonctionnalités sont opérationnelles:

- [ ] Le designer de formulaires charge correctement
- [ ] Les contrôles peuvent être ajoutés par glisser-déposer
- [ ] L'éditeur de code affiche la coloration syntaxique VB6
- [ ] La compilation JavaScript fonctionne
- [ ] Les propriétés des contrôles sont modifiables
- [ ] Le système d'undo/redo est fonctionnel

### 3. Performance Check

```bash
# Audit de performance
npm run lighthouse

# Analyse du bundle
npm run analyze

# Test de charge
npm run load-test
```

## 🛠️ Résolution des Problèmes

### Problème: Erreurs de dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Problème: Port déjà utilisé

```bash
# Changer le port
PORT=3000 npm run dev

# Ou modifier vite.config.ts
export default {
  server: {
    port: 3000
  }
}
```

### Problème: Mémoire insuffisante

```bash
# Augmenter la limite mémoire Node.js
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Problème: WebAssembly non supporté

Vérifier la compatibilité du navigateur:

```javascript
if (typeof WebAssembly === 'object') {
  console.log('WebAssembly supporté');
} else {
  console.error('WebAssembly non supporté');
}
```

## 📚 Configuration Avancée

### Options de Build

```json
// package.json
{
  "scripts": {
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",
    "build:analyze": "vite build --mode production --analyze"
  }
}
```

### Configuration Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
          vendor: ['react', 'react-dom'],
          vb6: ['./src/compiler', './src/runtime'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor', 'react', 'react-dom'],
  },
});
```

### Variables d'Environnement

```bash
# .env.production
NODE_ENV=production
VITE_APP_VERSION=$npm_package_version
VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your-sentry-dsn
VITE_API_ENDPOINT=https://api.vb6-ide.com
```

## 🚦 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run preview          # Prévisualiser le build

# Qualité du code
npm run lint             # Vérification ESLint
npm run format           # Formatage Prettier
npm run type-check       # Vérification TypeScript

# Tests
npm test                 # Tests unitaires
npm run test:ui          # Tests avec interface
npm run test:coverage    # Couverture de tests

# Performance
npm run analyze          # Analyse du bundle
npm run lighthouse       # Audit Lighthouse
npm run profile          # Profiling des performances

# Utilitaires
npm run clean            # Nettoyer les fichiers générés
npm run update-deps      # Mettre à jour les dépendances
```

## 📞 Support

### Ressources

- 📚 [Documentation complète](./docs/)
- 🐛 [Signaler un bug](https://github.com/your-org/vb6-web-ide/issues)
- 💬 [Discussions](https://github.com/your-org/vb6-web-ide/discussions)
- 📧 [Contact support](mailto:support@vb6-ide.com)

### Communauté

- [Discord](https://discord.gg/vb6-ide)
- [Forum](https://forum.vb6-ide.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vb6-web-ide)

---

## ✅ Installation Terminée!

Félicitations! VB6 Web IDE est maintenant installé et prêt à l'emploi.

🎯 **Prochaines étapes:**

1. Lancez l'application avec `npm run dev`
2. Accédez à http://localhost:5173
3. Créez votre premier projet VB6
4. Explorez la [documentation](./docs/) pour en savoir plus

**Bon développement avec VB6 Web IDE! 🚀**
