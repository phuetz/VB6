# Nouveaux Contrôles VB6 Implémentés

## Vue d'ensemble

Cette documentation décrit les nouveaux contrôles VB6 qui ont été implémentés pour améliorer la compatibilité avec VB6.

## Contrôles Graphiques

### 1. LineControl

- **Fichier**: `src/components/Controls/LineControl.tsx`
- **Propriétés VB6 supportées**:
  - `x1`, `y1`, `x2`, `y2`: Coordonnées de début et fin
  - `borderColor`: Couleur de la ligne
  - `borderStyle`: Style de ligne (0-6)
  - `borderWidth`: Épaisseur de la ligne
  - `drawMode`: Mode de dessin VB6
  - `visible`: Visibilité du contrôle
- **Implémentation**: Utilise SVG pour le rendu avec support complet des styles de ligne VB6

### 2. ShapeControl

- **Fichier**: `src/components/Controls/ShapeControl.tsx`
- **Propriétés VB6 supportées**:
  - `shape`: Type de forme (0-5)
    - 0: Rectangle
    - 1: Square
    - 2: Oval
    - 3: Circle
    - 4: Rounded Rectangle
    - 5: Rounded Square
  - `fillStyle`: Style de remplissage (0-7)
  - `fillColor`: Couleur de remplissage
  - `backColor`: Couleur de fond
  - `borderStyle`, `borderWidth`, `borderColor`: Propriétés de bordure
- **Implémentation**: SVG avec patterns pour les styles de remplissage VB6

### 3. ImageControl

- **Fichier**: `src/components/Controls/ImageControl.tsx`
- **Propriétés VB6 supportées**:
  - `picture`: URL de l'image
  - `stretch`: Étirement de l'image
  - `appearance`: Apparence 3D/Flat
  - `borderStyle`: Style de bordure
  - `dataField`, `dataSource`: Liaison de données
- **Implémentation**: Balise img HTML avec styles VB6

## Contrôles de Navigation Fichiers

### 4. DriveListBox

- **Fichier**: `src/components/Controls/DriveListBox.tsx`
- **Propriétés VB6 supportées**:
  - `drive`: Lecteur sélectionné
  - Toutes les propriétés standard (font, colors, etc.)
- **Implémentation**: Select HTML simulant les lecteurs disponibles
- **Événements**: Change

### 5. DirListBox

- **Fichier**: `src/components/Controls/DirListBox.tsx`
- **Propriétés VB6 supportées**:
  - `path`: Chemin du répertoire
  - Structure arborescente avec expansion/réduction
- **Implémentation**: Liste avec indentation et icônes de dossiers
- **Événements**: Change, PathChange

### 6. FileListBox

- **Fichier**: `src/components/Controls/FileListBox.tsx`
- **Propriétés VB6 supportées**:
  - `path`: Chemin du répertoire
  - `pattern`: Filtre de fichiers (ex: \*.txt)
  - `fileName`: Fichier sélectionné
  - `multiSelect`: Sélection multiple (0=None, 1=Simple, 2=Extended)
  - `archive`, `hidden`, `normal`, `readOnly`, `system`: Filtres d'attributs
- **Implémentation**: Liste avec support de sélection multiple
- **Événements**: Click, DblClick, PathChange, PatternChange

## Intégration

### ControlFactory

Les nouveaux contrôles sont intégrés dans le système de factory:

```typescript
// src/components/Controls/index.ts
export const ControlFactory = {
  Line: { component: LineControl, defaults: getLineDefaults },
  Shape: { component: ShapeControl, defaults: getShapeDefaults },
  Image: { component: ImageControl, defaults: getImageDefaults },
  DriveListBox: { component: DriveListBox, defaults: getDriveListBoxDefaults },
  DirListBox: { component: DirListBox, defaults: getDirListBoxDefaults },
  FileListBox: { component: FileListBox, defaults: getFileListBoxDefaults },
};
```

### ControlRenderer

Le ControlRenderer a été mis à jour pour utiliser les composants dédiés au lieu du rendu inline:

```typescript
case 'Line':
  return <LineControl control={control} isDesignMode={...} />;
```

### Toolbox

Les contrôles sont disponibles dans la toolbox:

- Catégorie "General": Line, Shape, Image, DriveListBox, DirListBox, FileListBox

## État d'Implémentation

✅ **Complétés**:

- LineControl avec tous les styles VB6
- ShapeControl avec toutes les formes et patterns
- ImageControl avec stretch et appearance
- DriveListBox avec simulation de lecteurs
- DirListBox avec navigation hiérarchique
- FileListBox avec filtres et multi-sélection

🔄 **Prochaines étapes**:

- Tests d'intégration dans le designer
- Support des événements VB6 complets
- Optimisation des performances pour grandes listes
- Support de la liaison de données

## Notes Techniques

1. **Simulation en environnement web**: Les contrôles de fichiers simulent le système de fichiers car JavaScript n'a pas accès au système de fichiers réel
2. **Compatibilité VB6**: Les propriétés et comportements suivent fidèlement la spécification VB6
3. **Performance**: Les contrôles utilisent React.memo et des callbacks mémoïsés pour optimiser les re-rendus
