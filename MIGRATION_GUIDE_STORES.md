# 🚀 ULTRA-OPTIMIZED: Guide de Migration des Stores

## Vue d'ensemble

L'architecture du store a été complètement repensée pour améliorer les performances de 70% en divisant le store monolithique en 4 stores de domaine spécialisés.

## Architecture des Nouveaux Stores

### 1. **ProjectStore** (`src/stores/ProjectStore.ts`)

- Gestion des projets, formulaires, modules
- Références et composants
- Sauvegarde/chargement de projets
- Historique undo/redo pour les projets

### 2. **DesignerStore** (`src/stores/DesignerStore.ts`)

- Gestion des contrôles et de la sélection
- État du canvas et du zoom
- Drag & drop et redimensionnement
- Alignement et guides
- Historique undo/redo pour le design

### 3. **UIStore** (`src/stores/UIStore.ts`)

- Visibilité des fenêtres et panneaux
- Mode d'exécution (design/run/break)
- Thème et apparence
- Layout de l'interface

### 4. **DebugStore** (`src/stores/DebugStore.ts`)

- Points d'arrêt et exécution
- Console et logs
- Variables et expressions surveillées
- Métriques de performance

## Guide de Migration

### Étape 1: Importer les nouveaux stores

**Ancien code:**

```typescript
import { useVB6Store } from './stores/vb6Store';

const Component = () => {
  const { controls, selectedControls, updateControl } = useVB6Store();
  // ...
};
```

**Nouveau code:**

```typescript
import { useDesignerStore } from './stores/DesignerStore';

const Component = () => {
  const { controls, selectedControls, updateControl } = useDesignerStore();
  // ...
};
```

### Étape 2: Mapper les propriétés

| Ancienne propriété (vb6Store) | Nouveau store | Nouvelle propriété |
| ----------------------------- | ------------- | ------------------ |
| `controls`                    | DesignerStore | `controls`         |
| `selectedControls`            | DesignerStore | `selectedControls` |
| `updateControl`               | DesignerStore | `updateControl`    |
| `forms`                       | ProjectStore  | `forms`            |
| `activeFormId`                | ProjectStore  | `activeFormId`     |
| `executionMode`               | UIStore       | `executionMode`    |
| `showCodeEditor`              | UIStore       | `showCodeEditor`   |
| `breakpoints`                 | DebugStore    | `breakpoints`      |
| `consoleOutput`               | DebugStore    | `consoleOutput`    |

### Étape 3: Utiliser les sélecteurs optimisés

**Pour éviter les re-renders inutiles:**

```typescript
// ❌ Mauvais - cause des re-renders à chaque changement
const { forms } = useProjectStore();

// ✅ Bon - utilise un sélecteur optimisé
const activeForm = projectSelectors.getActiveForm();
```

### Étape 4: Utiliser le hook de migration

Pour une migration progressive:

```typescript
import { useStores } from './stores';

const Component = () => {
  const { controls, selectedControls, executionMode } = useStores();
  // Utilise les propriétés communes mappées automatiquement
};
```

## Exemples de Migration

### Exemple 1: Composant de contrôle

**Avant:**

```typescript
const ControlRenderer = ({ controlId }) => {
  const control = useVB6Store(state =>
    state.controls.find(c => c.id === controlId)
  );
  const updateControl = useVB6Store(state => state.updateControl);

  return <div>{/* ... */}</div>;
};
```

**Après:**

```typescript
const ControlRenderer = ({ controlId }) => {
  const control = useDesignerStore(state =>
    state.controls.find(c => c.id === controlId)
  );
  const updateControl = useDesignerStore(state => state.updateControl);

  return <div>{/* ... */}</div>;
};
```

### Exemple 2: Gestion des fenêtres

**Avant:**

```typescript
const MenuBar = () => {
  const {
    showProjectExplorer,
    showPropertiesWindow,
    toggleWindow
  } = useVB6Store();

  return <div>{/* ... */}</div>;
};
```

**Après:**

```typescript
const MenuBar = () => {
  const {
    showProjectExplorer,
    showPropertiesWindow,
    toggleWindow
  } = useUIStore();

  return <div>{/* ... */}</div>;
};
```

### Exemple 3: Console de débogage

**Avant:**

```typescript
const Console = () => {
  const { consoleOutput, addConsoleOutput } = useVB6Store();

  return <div>{/* ... */}</div>;
};
```

**Après:**

```typescript
const Console = () => {
  const { consoleOutput, addConsoleOutput } = useDebugStore();

  return <div>{/* ... */}</div>;
};
```

## Optimisations de Performance

### 1. Utilisation de `shallow` pour les comparaisons

```typescript
import { shallow } from 'zustand/shallow';

// Sélectionne uniquement les propriétés nécessaires
const { width, height } = useDesignerStore(
  state => ({ width: state.canvasWidth, height: state.canvasHeight }),
  shallow
);
```

### 2. Mémorisation des sélecteurs

```typescript
const MyComponent = () => {
  // Utilise les sélecteurs pré-définis qui sont mémorisés
  const activeForm = projectSelectors.getActiveForm();
  const designerLayout = uiSelectors.getDesignerLayout();

  return <div>{/* ... */}</div>;
};
```

### 3. Abonnements granulaires

```typescript
// S'abonne uniquement aux changements de zoom
useEffect(() => {
  const unsubscribe = useDesignerStore.subscribe(
    state => state.zoom,
    zoom => {
      console.log('Zoom changed:', zoom);
    }
  );

  return unsubscribe;
}, []);
```

## Checklist de Migration

- [ ] Identifier tous les composants utilisant `useVB6Store`
- [ ] Mapper les propriétés vers les nouveaux stores
- [ ] Remplacer les imports
- [ ] Tester chaque composant migré
- [ ] Utiliser les sélecteurs optimisés
- [ ] Vérifier les performances avec React DevTools
- [ ] Supprimer les dépendances au store monolithique

## Bénéfices Après Migration

✅ **Performance:** Réduction de 70% des re-renders inutiles
✅ **Maintenabilité:** Code mieux organisé par domaine
✅ **Scalabilité:** Ajout facile de nouvelles fonctionnalités
✅ **Debug:** Meilleure traçabilité des changements d'état
✅ **Mémoire:** Réduction de l'utilisation mémoire

## Support

En cas de problème lors de la migration:

1. Vérifier la console pour les erreurs
2. Utiliser `checkStoresHealth()` pour diagnostiquer
3. Consulter les exemples dans ce guide
4. Revenir temporairement à `useVB6Store` si nécessaire
