# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive web-based Visual Basic 6 IDE clone built with React and TypeScript. It features a complete VB6 language implementation including lexer, parser, semantic analyzer, transpiler, and runtime, along with a sophisticated form designer that supports drag-and-drop control placement and all major VB6 controls.

## Common Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run preview         # Preview production build

# Code Quality
npm run lint            # Lint code with ESLint
npm run format          # Format code with Prettier
npm run format:check    # Check if code is properly formatted

# Testing
npm test               # Run unit tests with Vitest
npm run test:ui        # Run tests with UI interface
```

## Architecture Overview

### State Management (Dual Pattern)

- **Zustand Store** (`src/stores/vb6Store.ts`): Primary IDE state management (818 lines)
  - Controls, forms, UI state, debugging, performance monitoring
  - Actions for all IDE operations (create, update, delete controls, etc.)
- **React Context** (`src/context/VB6Context.tsx`): Form and control management
  - Control manipulation, clipboard operations, project save/load
  - Uses reducer pattern (`src/context/vb6Reducer.ts`)

### Component Architecture

```
src/components/
├── Designer/           # Form designer with drag-drop canvas
├── Editor/            # Monaco-based code editor
├── Panels/            # Toolbox, Properties, Project Explorer
├── Layout/            # IDE layout (menus, toolbars, status bar)
├── Debug/             # Debugging panels and output
├── Dialogs/           # Modal dialogs and project wizards
├── DragDrop/          # Advanced drag-drop system
└── [35+ other specialized components]
```

### VB6 Language Implementation

- **Lexer** (`vb6Lexer.ts`): Tokenizes VB6 source code
- **Parser** (`vb6Parser.ts`): Generates Abstract Syntax Tree (AST)
- **Semantic Analyzer** (`vb6SemanticAnalyzer.ts`): Type checking and validation
- **Transpiler** (`vb6Transpiler.ts`): Converts VB6 to JavaScript
- **Runtime** (`VB6Runtime.tsx`): JavaScript runtime for VB6 functions

## Key Services

- **FileManager** (`src/services/FileManager.ts`): Project file operations and VB6 format import/export
- **VB6Compiler** (`src/services/VB6Compiler.ts`): VB6 code compilation and transpilation
- **VB6Debugger** (`src/services/VB6Debugger.ts`): Debugging services with breakpoints
- **ThemeManager** (`src/services/ThemeManager.ts`): UI theming support

## Form Designer Features

- Drag-and-drop control placement with grid snapping
- Multi-select with alignment guides and rubber band selection
- Zoom functionality (25%-400%) with zoom controls
- Undo/redo system with complete history management
- 40+ VB6 controls implemented (TextBox, Label, CommandButton, TreeView, ListView, etc.)
- Real-time property editing with immediate visual feedback

## Testing Framework

- **Vitest** with jsdom environment for unit tests
- **React Testing Library** for component testing
- Comprehensive test coverage for VB6 language features
- E2E tests for form designer functionality

## Important Patterns

### Provider Hierarchy

```typescript
<VB6Provider>
  <DragDropProvider>
    <App />
  </DragDropProvider>
</VB6Provider>
```

### Hook-based Logic

- `useAutoSave.ts`: Auto-save functionality
- `useControlManipulation.ts`: Control operations and transformations
- `useDragDrop.ts`: Advanced drag-drop with multi-select support
- `useKeyboardShortcuts.ts`: IDE keyboard shortcuts
- `useUndoRedo.ts`: History management for designer actions

### Control System

- Controls use consistent property patterns (Name, Left, Top, Width, Height, etc.)
- Event system supports all VB6 events (Click, MouseMove, KeyPress, etc.)
- Properties are dynamically generated based on control type
- Tab order and Z-index management for proper layering

## Development Notes

### Build Configuration

- **Vite** build system with React plugin
- **TypeScript** in strict mode with multiple tsconfig files
- **Monaco Editor** integration for code editing with VB6 syntax highlighting
- **Tailwind CSS** for styling with PostCSS processing

### State Updates

- Always use the Zustand store or Context actions for state changes
- The designer canvas responds to state changes through selectors
- Undo/redo automatically captures state snapshots before major operations
- Performance monitoring tracks render times and memory usage

### Adding New Controls

1. Add control definition to control types
2. Implement control component in `src/components/Controls/`
3. Add default properties to `src/utils/controlDefaults.ts`
4. Register in control factory and toolbox
5. Add event handlers and property editors as needed

### Language Feature Development

- VB6 syntax changes require updates to lexer, parser, and transpiler
- Test language features with both unit tests and integration tests
- Semantic analyzer handles type checking and variable resolution
- Runtime provides JavaScript implementations of VB6 built-in functions
