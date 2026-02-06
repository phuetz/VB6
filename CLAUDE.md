# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based Visual Basic 6 IDE clone built with React 18 and TypeScript. Features a complete VB6 language implementation (lexer, parser, semantic analyzer, transpiler, runtime), a sophisticated form designer with 36+ VB6 controls, and a Node.js backend server for database operations, real-time collaboration, and AI assistance. Achieves 70% VB6 compatibility.

## Quick Reference

```bash
# Frontend (root directory)
npm run dev              # Start Vite dev server
npm run build            # Production build
npm test                 # Vitest in watch mode
npm run test:run         # Run tests once (CI)
npm run lint             # ESLint
npm run format           # Prettier

# Backend (cd server first)
npm run dev              # Start with nodemon
npm run start:all        # All servers (database, AI, collaboration)
npm test                 # Jest tests
```

## Development Commands

### Frontend

```bash
npm run dev              # Start Vite dev server
npm run build            # Production build with code splitting
npm run preview          # Preview production build
npm run type-check       # TypeScript type checking
npm run lint             # ESLint code linting
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing (Vitest)
npm test                 # Watch mode
npm run test:run         # Single run (CI)
npm run test:ui          # UI interface
npm run test:coverage    # Coverage report (70% threshold)
npm run test:startup     # Critical startup tests only
npm test -- src/test/compiler/vb6Lexer.test.ts  # Single file
npm test -- --grep "pattern"                     # Pattern match

# Analysis
npm run analyze          # Bundle size analysis
npm run budget:check     # Check bundle size budget
```

### Backend Server

```bash
cd server
npm run dev              # Start with nodemon (auto-restart)
npm start                # Production server
npm run start:all        # All servers (database, AI, collaboration)
npm run start:mock       # Mock servers for development
npm run build            # Compile TypeScript
npm test                 # Jest tests
```

## Code Style & Conventions

### Formatting (Prettier)

- 2 spaces indentation, semicolons, single quotes, width 100, LF line endings, trailing commas (es5)

### Naming

- **React components**: `PascalCase` (e.g., `ModernApp.tsx`, `DesignerCanvas.tsx`)
- **Utilities/scripts**: `kebab-case` (e.g., `fix-infinite-loop.ts`)
- **Test files**: `*.test.ts` / `*.test.tsx`

### Commits (Conventional)

- Format: `type(scope): description` (e.g., `feat(runtime): add DateAdd function`)
- Types: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

## Architecture Overview

### State Management (Dual Pattern)

The project uses **two state management systems** that coexist:

1. **Zustand Store** (`src/stores/vb6Store.ts`) - Global IDE state
   - Controls, forms, UI panels, debugging, performance metrics
   - Undo/redo history, uses `subscribeWithSelector` middleware
   - Use shallow selectors: `useVB6Store(state => state.controls, shallow)`

2. **React Context** (`src/context/VB6Context.tsx`) - Form-specific operations
   - Control manipulation, clipboard, project save/load (JSZip)
   - Event execution and VB6 code evaluation
   - Uses reducer pattern (`src/context/vb6Reducer.ts`)

**When adding features:**

- Use **Zustand** for global IDE state (panels, debugging, performance)
- Use **React Context** for form-specific operations (control manipulation, events)

### Component Architecture

```
src/components/
├── Designer/      # Form designer (canvas, resize handles, alignment guides)
├── Editor/        # Monaco code editor with VB6 syntax
├── Panels/        # Toolbox, Properties Window, Project Explorer
├── Controls/      # 36+ VB6 controls (TextBox, Label, MSFlexGrid, etc.)
├── Debug/         # Debugging panels (Immediate, Locals, Watch, Call Stack)
├── DragDrop/      # @dnd-kit based drag-drop system
└── Layout/        # MenuBar, Toolbar, StatusBar
```

### VB6 Compiler Pipeline

```
src/utils/vb6Lexer.ts → src/utils/vb6Parser.ts → src/utils/vb6SemanticAnalyzer.ts → src/utils/vb6Transpiler.ts
     (Tokens)              (AST)                   (Type checking)                    (JavaScript)
```

VB6 syntax changes require coordinated updates across all four stages. Test with both unit tests (`src/test/compiler/`) and integration tests.

**Runtime Library** (`src/runtime/`) - 40+ files implementing VB6 built-in functions (string, math, date/time, file I/O, conversion, collections, error handling, graphics).

### Backend Server (`server/`)

- **Database**: ADO/DAO/RDO/ODBC with MySQL, PostgreSQL, MSSQL, SQLite, MongoDB
- **Real-time**: WebSocket via Socket.IO for collaboration
- **AI**: OpenAI/TensorFlow.js for code assistance
- **Security**: JWT auth, rate limiting, helmet.js CSP

**Routes**: `/api/database`, `/api/ado`, `/api/dao`, `/api/rdo`, `/api/reports`

## Key Services

| Service      | Location                       | Purpose                             |
| ------------ | ------------------------------ | ----------------------------------- |
| VB6Compiler  | `src/services/VB6Compiler.ts`  | Orchestrates compiler pipeline      |
| FileManager  | `src/services/FileManager.ts`  | VB6 file formats (.frm, .bas, .vbp) |
| VB6Debugger  | `src/services/VB6Debugger.ts`  | Breakpoints, step execution         |
| ThemeManager | `src/services/ThemeManager.ts` | Classic VB6/Modern/Dark themes      |

## Form Designer

### Dual Drag & Drop System

- **Toolbox → Canvas** (@dnd-kit): Creates new controls, red alignment guides
- **Canvas manipulation** (native mouse): Moves existing controls, green alignment guides

### Control Manipulation

- **Resize**: 8-direction handles (single selection only), Shift for aspect ratio
- **Alignment**: O(n) memoized guides snapping to edges and centers
- **Grid**: 8px default snapping
- **Zoom**: 25%-400% with zoom-aware boundaries
- **Keyboard**: Arrow keys for movement, Ctrl+Arrows for resizing

## Testing

- **Framework**: Vitest + React Testing Library (jsdom)
- **Coverage threshold**: 70%
- **Setup**: `src/test/setup.ts`

```
src/test/
├── compiler/       # Lexer, parser, transpiler tests
├── runtime/        # VB6 function tests
├── components/     # Component tests
├── integration/    # E2E tests
└── compatibility/  # VB6 compatibility validation
```

## Development Patterns

### Key Hooks

| Hook                        | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| `useControlManipulation.ts` | Control operations with memoized alignment guides |
| `useAutoSave.ts`            | Debounced auto-save to localStorage               |
| `useUndoRedo.ts`            | History management with snapshots                 |
| `useCollaboration.ts`       | WebSocket real-time collaboration                 |

### Control System

- Properties: `Name`, `Left`, `Top`, `Width`, `Height`, `Caption`/`Text`
- Events: `Click`, `MouseMove`, `KeyPress`, `Load`, `Resize`, etc.
- Properties defined in `VB6CompleteProperties.ts`, defaults in `controlDefaults.ts`

### Adding New Controls

1. Define interface in `src/context/types.ts`
2. Implement component in `src/components/Controls/YourControl.tsx`
3. Add defaults in `src/utils/controlDefaults.ts`
4. Register in `VB6Controls.tsx`
5. Add to toolbox in `src/data/controlCategories.ts`

## Build & Configuration

### Vite (`vite.config.ts`)

- **Code splitting**: Manual chunks (react-vendor, editor-vendor, vb6-runtime, designer, controls)
- **Bundle targets**: <1MB main, <500KB per chunk
- **Monaco**: Lazy-loaded, excluded from optimizeDeps

### TypeScript

- Strict mode enabled
- Path alias: `@/` → `src/`

### Environment

- Copy `.env.example` to `.env` (never commit secrets)
- Frontend env: `src/config/env.ts`
- Backend env: `server/.env`

## Performance Guidelines

- Use `useCallback` and memoization for expensive operations
- Clean up event listeners in unmount
- Use shallow Zustand selectors: `useVB6Store(state => state.controls, shallow)`
- Lazy load Monaco and heavy components
- Capture undo/redo snapshots only before major operations

## Boucle de feedback

Après chaque modification, exécuter automatiquement :

```bash
# 1. Vérification TypeScript
npm run type-check

# 2. Lint
npm run lint

# 3. Tests
npm run test:run

# 4. Build (optionnel)
npm run build
```

**Workflow complet :**

1. Modifier le code
2. `npm run format` - Formater avec Prettier
3. `npm run lint` - Vérifier ESLint
4. `npm run type-check` - Vérifier TypeScript
5. `npm run test:run` - Lancer les tests Vitest
6. Si erreur → corriger et recommencer
7. Si tout passe → valider

**Tests spécifiques :**

```bash
npm test -- src/test/compiler/vb6Lexer.test.ts   # Lexer
npm test -- src/test/compiler/vb6Parser.test.ts  # Parser
npm test -- src/test/runtime/                     # Runtime VB6
npm run test:startup                              # Tests critiques
```

**Couverture :**

```bash
npm run test:coverage  # Seuil : 70%
```

## VB6 Compatibility Notes

- **70% overall compatibility** - sufficient for most VB6 applications
- File system access limited by browser security (uses FileSystem API where available)
- Windows API calls partially emulated via `VB6WindowsAPIBridge.ts`
- ActiveX controls use WebAssembly bridge
- `DoEvents` simulated with `requestIdleCallback`
