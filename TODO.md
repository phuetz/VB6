# TODO pour une copie améliorée de Visual Basic 6

Cette liste récapitule les fonctionnalités à implémenter ou finaliser afin d'obtenir un environnement complet inspiré de Visual Basic 6.

- [x] **Charger un projet existant** dans `Toolbar.tsx` (`loadProject`)
- [x] **Gestionnaire de templates** dans `EnhancedToolbar.tsx`
- [x] **Moniteur de performances** dans `EnhancedToolbar.tsx`
- [x] **Exécution des commandes immédiates** dans `ImmediateWindow.tsx`
- [x] **Renommer un formulaire** via `PropertiesWindow.tsx`
- [x] **Sélection du formulaire actif** dans `ProjectExplorer.tsx`
- [x] **Ajout de nouveaux formulaires** via `ProjectExplorer.tsx`
- [x] **Refactorisation des `GoTo`** lors de la conversion de code (`codeConverter.ts`)
- [x] Améliorer l'export/import de projets (.vb6)
- [x] Ajouter un suivi des performances et des journaux d'exécution avancé
- [x] Renforcer l'analyse de code et le refactoring automatique
- [x] Compléter l'éditeur de propriétés pour couvrir l'ensemble des propriétés VB6

## Implémentation complète du langage VB6

- [x] **Lexeur exhaustif** : prise en charge de tous les mots-clés, opérateurs et littéraux.
- [x] **Analyseur syntaxique** : génération d'un AST représentant modules, classes et formulaires.
- [ ] **Analyse sémantique** : résolution des types, portée des variables et cohérence des appels.
- [x] **Gestion des modules et classes** : visibilité (`Private`, `Public`), propriétés, méthodes et événements.
- [x] **Transpilation JavaScript** : conversion fidèle de chaque instruction VB6 en JS moderne.
- [x] **Bibliothèque d'exécution** : implémentation de l'ensemble des fonctions natives (Date, MsgBox, etc.).
- [ ] **Gestion des objets COM/ActiveX** : création, destruction et appels de méthodes externes.
- [ ] **Compatibilité avec les projets VB6 existants** : import et conversion automatique du code.
- [ ] **Suite de tests unitaires** couvrant instructions, erreurs et modules complexes.
- [ ] **Documentation détaillée** du compilateur et du runtime.

## Implémentation complète du concepteur de formulaires

- [x] **Surface de conception redimensionnable** avec grille, zoom et guides d'alignement.
- [x] **Glisser-déposer des contrôles** avec duplication et groupement par la souris ou le clavier.
- [ ] **Sélection multiple avancée** : alignements, espacement et redimensionnement simultané.
- [ ] **Property Grid en temps réel** : édition de toutes les propriétés (couleurs, polices, liaisons).
- [ ] **Arborescence des contrôles** pour naviguer dans la hiérarchie du formulaire.
- [x] **Système d'annulation/rétablissement** (Undo/Redo) sur toutes les actions.
- [ ] **Éditeur de menus et barres d'outils** intégré au designer.
- [ ] **Export/Import au format .frm** totalement compatible avec VB6.
- [ ] **Tests de bout en bout** validant création et manipulation des formulaires.
- [ ] **Guide utilisateur complet** pour apprendre le designer.

## Contrôles à développer

- [x] PictureBox
- [x] Label
- [x] TextBox
- [x] Frame
- [x] CommandButton
- [x] CheckBox
- [x] OptionButton
- [x] ComboBox
- [x] ListBox
- [x] HScrollBar
- [x] VScrollBar
- [x] Timer
- [x] DriveListBox
- [x] DirListBox
- [x] FileListBox
- [x] Shape
- [x] Line
- [x] Image
- [x] Data
- [x] OLE
- [x] TabStrip
- [x] Toolbar
- [x] StatusBar
- [x] ProgressBar
- [x] TreeView
- [x] ListView
- [x] ImageList
- [x] Slider
- [x] ImageCombo
- [x] MonthView
- [x] DateTimePicker
- [x] FlatScrollBar
- [x] UpDown
- [x] Animation
- [x] RichTextBox
- [ ] MaskedEdit
- [ ] WebBrowser
- [ ] Inet
- [ ] Winsock
- [ ] DataGrid
- [ ] DataList
- [ ] DataCombo
- [ ] DataRepeater
- [ ] DataEnvironment
- [ ] DataReport
- [ ] CrystalReport
- [ ] MediaPlayer
- [ ] MMControl
