# Clone Web de Visual Basic 6

Ce projet recrée un environnement de développement inspiré de Visual Basic 6 entièrement en React et TypeScript.

## Caractéristiques
- **Concepteur de formulaires** : glisser-déposer des contrôles sur une surface de dessin (voir `AdvancedDragDropCanvas`).
- **Éditeur de code** : à base de Monaco avec coloration syntaxique et IntelliSense.
- **Gestion de projet** : explorateur de projet, fenêtre de propriétés et assistant de création.
- **Débogage et exécution** : points d’arrêt, fenêtre immédiate et console de sortie.
- **Outils supplémentaires** : analyse de code, refactoring, gestion de snippets, exportation, etc.

## Installation
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Lancer l’environnement de développement :
   ```bash
   npm run dev
   ```

## Tests
Les tests unitaires utilisent **Vitest** :
```bash
npm test
```

## Construction pour la production
```bash
npm run build
```

## Organisation du code
- `src/App.tsx` : composant principal de l’application.
- `src/context` : contexte React et réducteur pour l’état global.
- `src/stores` : store Zustand `vb6Store` regroupant l’état de l’IDE.
- `src/components` : tous les panneaux et outils de l’IDE (toolbox, explorateur, éditeur, etc.).

## Licence
Projet distribué sous licence MIT.
