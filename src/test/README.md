# Tests Unitaires VB6 Web IDE

## 📋 Vue d'ensemble

Cette suite de tests unitaires couvre tous les composants critiques du démarrage de l'application VB6 Web IDE. Les tests sont organisés pour garantir la fiabilité, la performance et la sécurité de l'application.

## 🧪 Structure des Tests

### Tests de Compatibilité Navigateur
- **`polyfills.test.ts`** - Teste tous les polyfills critiques pour la compatibilité navigateur
- **`modulePatches.test.ts`** - Vérifie les patches de compatibilité des modules Node.js

### Tests de Services Principaux  
- **`stores/vb6Store.test.ts`** - Teste le store Zustand principal et toutes ses fonctionnalités
- **`utils/securityHelpers.test.ts`** - Vérifie tous les utilitaires de sécurité critiques

### Tests de Fonctionnalités Avancées
- **`hooks/useCollaboration.test.tsx`** - Teste le système de collaboration temps réel
- **`components/ErrorBoundary.test.tsx`** - Vérifie la gestion d'erreurs globale

### Tests d'Intégration
- **`integration/ApplicationStartup.test.tsx`** - Teste le démarrage complet de l'application
- **`package-scripts.test.ts`** - Vérifie la configuration npm et les dépendances

## 🚀 Scripts de Test

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode interactif avec UI
npm run test:ui

# Exécuter les tests une seule fois
npm run test:run

# Générer un rapport de couverture
npm run test:coverage

# Exécuter uniquement les tests de démarrage
npm run test:startup
```

## 📊 Couverture de Code

Les seuils de couverture sont configurés à **70%** pour :
- **Branches** : 70%
- **Fonctions** : 70% 
- **Lignes** : 70%
- **Statements** : 70%

## 🔧 Configuration

### Vitest
- **Environnement** : jsdom (simulation navigateur)
- **Globals** : Activés pour une syntaxe simplifiée
- **Setup** : `src/test/setup.ts` avec mocks globaux
- **Pool** : Threads (single thread pour la stabilité)

### Mocks Globaux
Le fichier `setup.ts` configure automatiquement :
- **DOM APIs** : ResizeObserver, IntersectionObserver, Canvas
- **Browser APIs** : localStorage, crypto, performance, fetch
- **WebRTC** : RTCPeerConnection, DataChannel
- **Monaco Editor** : API complète mockée
- **File System** : File, FileReader, Blob APIs

## 📋 Tests par Catégorie

### 🔒 Sécurité (100% critique)
- Validation d'entrées utilisateur
- Protection contre les injections
- Gestion sécurisée des erreurs
- Polyfills de sécurité

### 🌐 Compatibilité Navigateur (100% critique)
- Polyfills Buffer, Process, Util
- Patches de modules Node.js
- APIs Web modernes
- Fallbacks sécurisés

### 🎯 Fonctionnalités Core (95% critique)
- Store Zustand complet
- Gestion des contrôles VB6
- Système undo/redo
- Performance monitoring

### 🤝 Collaboration (90% critique)
- CRDT synchronisation
- WebRTC peer-to-peer
- Gestion des curseurs temps réel
- Résolution de conflits

### 🎨 Interface Utilisateur (85% critique)
- Error Boundary global
- Thèmes et styling
- Drag & Drop avancé
- Accessibilité

### 🚀 Performance (80% critique)
- Métriques de démarrage
- Utilisation mémoire
- Rendu optimisé
- Lazy loading

## 🐛 Gestion d'Erreurs Testée

### Erreurs de Démarrage
- Polyfills manquants ou corrompus
- Modules Node.js indisponibles
- Erreurs de réseau
- localStorage corrompu

### Erreurs Runtime
- Composants qui crashent
- Promesses rejetées
- Erreurs asynchrones
- Timeouts réseau

### Erreurs de Collaboration
- Connexions WebRTC échouées
- Synchronisation CRDT
- Conflits de données
- Déconnexions inattendues

## 📈 Métriques de Qualité

### Coverage Targets
- **Startup Critical Path** : 95%+
- **Security Functions** : 100%
- **Error Handlers** : 90%+
- **Core Features** : 85%+

### Performance Benchmarks
- **Test Suite Runtime** : < 30 secondes
- **Memory Usage** : < 512MB pendant les tests
- **Setup Time** : < 5 secondes

## 🔍 Debugging

### Variables d'Environnement
```bash
# Mode verbose pour debugging
DEBUG=vitest npm test

# Tests spécifiques
npm test -- --grep "polyfills"

# Mode watch pour développement
npm test -- --watch
```

### Console Outputs
Les tests capturent et vérifient :
- Messages de log critiques
- Warnings de sécurité
- Erreurs capturées
- Métriques de performance

## 🏗️ Architecture des Tests

### Pattern AAA (Arrange-Act-Assert)
Tous les tests suivent le pattern :
1. **Arrange** : Setup des mocks et données
2. **Act** : Exécution de la fonctionnalité
3. **Assert** : Vérification des résultats

### Isolation des Tests
- Chaque test est indépendant
- Cleanup automatique après chaque test
- Mocks réinitialisés
- État global reset

### Test Data Builders
Utilisation de builders pour :
- Contrôles VB6 mock
- Sessions de collaboration
- États de store
- Événements utilisateur

## 🚨 Tests Critiques à Maintenir

### Obligatoires (ne jamais désactiver)
1. **Polyfills de sécurité**
2. **Store state management**
3. **Error boundary global**
4. **Démarrage application**

### Haute Priorité
1. **Collaboration temps réel**
2. **Compatibilité navigateur**
3. **Performance monitoring**
4. **Gestion mémoire**

## 🔄 CI/CD Integration

### Pre-commit Hooks
```bash
# Tests rapides avant commit
npm run test:startup

# Vérification complète
npm run test:coverage
```

### Pipeline Stages
1. **Lint & Format** → Tests syntaxe
2. **Unit Tests** → Tests unitaires complets  
3. **Integration Tests** → Tests de démarrage
4. **Coverage Report** → Génération rapport
5. **Performance Tests** → Benchmarks

## 📚 Ressources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

### Best Practices
- Tests descriptifs et lisibles
- Arrange-Act-Assert pattern
- Mocks minimalistes mais efficaces
- Assertions spécifiques et claires

---

## ⚡ Quick Start

```bash
# Installation des dépendances
npm install

# Première exécution des tests
npm run test:startup

# Vérification complète
npm run test:coverage

# Mode développement avec UI
npm run test:ui
```

**Status** : ✅ Tous les tests de démarrage implémentés et fonctionnels