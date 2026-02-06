# COLAB.md - VB6 IDE Restructuring: Collaborative Work Plan

> **Version**: 3.0
> **Created**: 2026-01-07
> **Last Updated**: 2026-02-06
> **Status**: ACTIVE — Full restructuring plan with 32 iterations

---

## Table of Contents

1. [Project Overview & Baseline Metrics](#1-project-overview--baseline-metrics)
2. [AI Agent Collaboration Protocol](#2-ai-agent-collaboration-protocol)
3. [Feedback Loop Protocol](#3-feedback-loop-protocol)
4. [Git Workflow](#4-git-workflow)
5. [Status Tracking Table](#5-status-tracking-table)
6. [Phase 1: Foundation & Cleanup (Iterations 1-5)](#phase-1-foundation--cleanup-iterations-1-5)
7. [Phase 2: Component Consolidation (Iterations 6-12)](#phase-2-component-consolidation-iterations-6-12)
8. [Phase 3: State Management (Iterations 13-16)](#phase-3-state-management-iterations-13-16)
9. [Phase 4: Hook Refactoring (Iterations 17-20)](#phase-4-hook-refactoring-iterations-17-20)
10. [Phase 5: Compiler Pipeline (Iterations 21-28)](#phase-5-compiler-pipeline-iterations-21-28)
11. [Phase 6: Testing & Quality (Iterations 29-32)](#phase-6-testing--quality-iterations-29-32)
12. [Appendix A: File Impact Map](#appendix-a-file-impact-map)
13. [Appendix B: Metrics Tracking](#appendix-b-metrics-tracking)
14. [Appendix C: History from COLAB v2.0](#appendix-c-history-from-colab-v20)

---

## 1. Project Overview & Baseline Metrics

### Architecture Summary

Web-based Visual Basic 6 IDE clone built with React 18 + TypeScript. Features a complete VB6 language implementation (lexer, parser, semantic analyzer, transpiler, runtime), a form designer with 36+ VB6 controls, and a Node.js backend.

### Baseline Metrics (2026-02-06)

| Metric | Value |
|--------|-------|
| Total .ts/.tsx files | 743 |
| Total React component files (.tsx) | 278 |
| Component directories | 58 |
| Test files | 80 |
| Compiler files (src/compiler/) | 48 |
| `as any` occurrences | 731 across 233 files |
| `console.log` statements | 1,719 across 200 files |
| `aria-*` attributes | 25 across 5 files |
| TypeScript type-check | PASS (clean) |
| Build status | PASS |
| Build output (JS total) | 5.12 MB (127 chunks) |
| index chunk (gzip) | 526 KB (144 KB gzip) |
| monaco chunk (gzip) | 3,096 KB (798 KB gzip) |
| VB6DebuggerService chunk | 208 KB (58 KB gzip) |

### Critical God Files

| File | LOC | Issue |
|------|-----|-------|
| `src/stores/vb6Store.ts` | 1,580 | Monolithic store, manages everything |
| `src/ModernApp.tsx` | 655 | Root component, manages 20+ dialogs inline |
| `src/hooks/useControlManipulation.ts` | 576 | Giant hook, multiple responsibilities |
| `src/hooks/useAnimatedControlManipulation.ts` | 478 | Animated variant, duplicates logic |
| `src/context/types.ts` | 293 | Control type uses `[key: string]: any` |
| `src/components/Layout/MainContent.tsx` | 114 | Manages 15+ panel states |

### Duplicate Component Variants

| Category | Count | Files |
|----------|-------|-------|
| Toolbox | 4 | Toolbox, AdvancedToolbox, EnhancedToolbox, ModernToolbox |
| Toolbar | 5 | Toolbar, EnhancedToolbar, LayoutToolbar, ModernToolbar, UndoRedoToolbar |
| Editor | 7+ | CodeEditor, AdvancedCodeEditor, MonacoCodeEditor, OptimizedMonacoEditor, LazyMonacoEditor, MonacoCodeEditorLazy, VB6IntelliSense |
| Debug | 20 | 18 in Debug/ + 2 in Debugging/ (includes duplicate TimeTravelDebugger) |
| Ultra* | 10 | UltraPerformanceDashboard, UltraMarketplace, UltraSecurityFramework, UltraAnalyticsDashboard, UltraCollaborationHub, UltraCloudInfrastructure, UltraPerformanceEngine, UltraAIAssistant, UltraAutomationPipeline, UltraMobileIDE |

### Dead Code Locations

| Location | Description |
|----------|-------------|
| `src/archived/` | 3 files (VB6Debugger.ts, VB6COMActiveXBridge.ts, README.md) |
| `src/compiler/` | 48 files — advanced compiler pipeline (largely unused, app uses src/utils/vb6*.ts) |
| `src/components/Advanced/Ultra*` | 9 Ultra* components — feature-complete but not integrated |
| `src/components/Performance/UltraPerformanceDashboard.tsx` | 1 Ultra* component |

### Previous Work (COLAB v2.0)

The following tasks were completed in earlier sessions (Jan 7-20, 2026):
- OptimizedVB6Store.ts removed
- VB6COMActiveXBridge.ts and VB6Debugger.ts archived
- eval() secured, dangerouslySetInnerHTML sanitized with DOMPurify
- LoggingService created (41 tests)
- 190+ console.* calls migrated to LoggingService
- stores/, context/, hooks/ typed (91 `any` → 0)
- .bak files deleted

---

## 2. AI Agent Collaboration Protocol

### Agent Identification

Each AI agent session MUST identify itself at the start of work:
```
Agent: [Agent-ID]
Working on: Iteration [N] - [Title]
Started: [ISO timestamp]
```

### Claiming Work

1. **Check the Status Tracking Table** (Section 5) before starting any iteration
2. **Update status to `IN_PROGRESS`** with your Agent-ID before beginning work
3. **Never work on an iteration already claimed** by another agent
4. **Respect phase ordering**: Phase N iterations should complete before Phase N+1 starts (except Phase 5 which can run parallel to Phases 3-4)

### Status Updates

After completing each iteration, the agent MUST:
1. Update the Status Tracking Table with `DONE` status and timestamp
2. Record the feedback loop results (all 5 checks)
3. Note any issues or deviations from the plan
4. List the actual files modified

### Conflict Resolution

- **File conflicts**: If two iterations need the same file, the lower-numbered iteration has priority
- **Merge conflicts**: Always rebase on main before starting; resolve conflicts manually
- **Blocked work**: If an iteration is blocked by another, mark it `BLOCKED` with a note

### Communication Format

When completing an iteration, post a summary:
```
## Iteration [N] Complete
- Files modified: [list]
- Feedback loop: format ✅ | type-check ✅ | lint ✅ | test ✅ | build ✅
- Notes: [any deviations or discoveries]
- Next recommended: Iteration [M]
```

---

## 3. Feedback Loop Protocol

**MANDATORY** after every iteration. No iteration is complete without all 5 checks passing.

```bash
# Step 1: Format
npm run format

# Step 2: TypeScript type-check
npm run type-check

# Step 3: Lint
npm run lint

# Step 4: Tests (use targeted tests if full suite OOMs)
npm run test:run
# Fallback for memory issues:
npx vitest run src/test/[relevant-test].test.ts

# Step 5: Build
npm run build
```

### Rules

1. **All 5 must pass** for an iteration to be marked `DONE`
2. **If any check fails**, fix the issue and re-run the entire loop
3. **Do not skip checks** even if the change seems trivial
4. **Record results** in the iteration's completion summary
5. **If tests OOM** (known issue with full suite), run targeted tests for the affected files

---

## 4. Git Workflow

### Branch Strategy

```
main
 ├── refactor/phase-1-cleanup
 ├── refactor/phase-2-consolidation
 ├── refactor/phase-3-state
 ├── refactor/phase-4-hooks
 ├── refactor/phase-5-compiler
 └── refactor/phase-6-quality
```

### Commit Convention

```
type(scope): description (iter-N)

# Examples:
refactor(cleanup): remove archived dead code (iter-1)
refactor(toolbox): consolidate 4 Toolbox variants into one (iter-6)
feat(compiler): integrate RecursiveDescentParser (iter-22)
test(a11y): add accessibility tests for core components (iter-30)
```

- **Always include iteration number** in the commit message: `(iter-N)`
- **One commit per iteration** (squash if needed)
- **Squash merge** phase branches back to main

### Before Starting Work

```bash
git checkout main
git pull
git checkout -b refactor/phase-N-description
```

---

## 5. Status Tracking Table

| Iter | Phase | Title | Status | Agent | Started | Completed | Notes |
|------|-------|-------|--------|-------|---------|-----------|-------|
| 1 | 1 | Remove archived/ dead code | `PENDING` | - | - | - | |
| 2 | 1 | Remove Ultra* components | `PENDING` | - | - | - | |
| 3 | 1 | Clean console.log statements | `PENDING` | - | - | - | |
| 4 | 1 | Add ErrorBoundary wrappers | `PENDING` | - | - | - | |
| 5 | 1 | Clean unused imports & dead exports | `PENDING` | - | - | - | |
| 6 | 2 | Consolidate Toolbox variants | `PENDING` | - | - | - | |
| 7 | 2 | Consolidate Editor variants | `PENDING` | - | - | - | |
| 8 | 2 | Consolidate Toolbar variants | `PENDING` | - | - | - | |
| 9 | 2 | Consolidate Debug components (part 1) | `PENDING` | - | - | - | |
| 10 | 2 | Consolidate Debug components (part 2) | `PENDING` | - | - | - | |
| 11 | 2 | Extract DialogManager from ModernApp | `PENDING` | - | - | - | |
| 12 | 2 | Extract WindowManager from MainContent | `PENDING` | - | - | - | |
| 13 | 3 | Extract WindowStore from vb6Store | `PENDING` | - | - | - | |
| 14 | 3 | Consolidate Context/Store overlap | `PENDING` | - | - | - | |
| 15 | 3 | Type-safe Control interface | `PENDING` | - | - | - | |
| 16 | 3 | Property system refactor | `PENDING` | - | - | - | |
| 17 | 4 | Split useControlManipulation (selection) | `PENDING` | - | - | - | |
| 18 | 4 | Split useControlManipulation (resize/move) | `PENDING` | - | - | - | |
| 19 | 4 | Refactor useAnimatedControlManipulation | `PENDING` | - | - | - | |
| 20 | 4 | Optimize remaining hooks | `PENDING` | - | - | - | |
| 21 | 5 | Enhance lexer with full VB6 tokens | `PENDING` | - | - | - | |
| 22 | 5 | Integrate RecursiveDescentParser | `PENDING` | - | - | - | |
| 23 | 5 | Wire semantic analyzer to new parser | `PENDING` | - | - | - | |
| 24 | 5 | Build AST-based transpiler | `PENDING` | - | - | - | |
| 25 | 5 | Wire end-to-end compiler pipeline | `PENDING` | - | - | - | |
| 26 | 5 | Compiler error reporting & diagnostics | `PENDING` | - | - | - | |
| 27 | 5 | Runtime lazy loading & optimization | `PENDING` | - | - | - | |
| 28 | 5 | Clean up old compiler files | `PENDING` | - | - | - | |
| 29 | 6 | Add component tests for core UI | `PENDING` | - | - | - | |
| 30 | 6 | Add accessibility (a11y) coverage | `PENDING` | - | - | - | |
| 31 | 6 | Performance benchmarks & budgets | `PENDING` | - | - | - | |
| 32 | 6 | Type safety sweep (reduce `as any`) | `PENDING` | - | - | - | |

---

## Phase 1: Foundation & Cleanup (Iterations 1-5)

**Goal**: Remove dead code, clean debug artifacts, add safety nets. No functional changes.

**Parallelism**: Iterations 1-3 can run in parallel. Iteration 4-5 should follow.

---

### Iteration 1: Remove archived/ Dead Code

**Objective**: Delete the `src/archived/` directory and remove all imports/references to its contents.

**Files to modify (max 10)**:
1. `src/archived/services/VB6Debugger.ts` — DELETE
2. `src/archived/services/VB6COMActiveXBridge.ts` — DELETE
3. `src/archived/services/README.md` — DELETE
4. Any files importing from `src/archived/` (search first)

**Steps**:
1. Search the entire codebase for imports referencing `archived/`:
   ```bash
   grep -r "from.*archived/" src/ --include="*.ts" --include="*.tsx"
   ```
2. Remove or replace any found imports
3. Delete the `src/archived/` directory:
   ```bash
   rm -rf src/archived/
   ```
4. Run the feedback loop

**Acceptance Criteria**:
- [ ] `src/archived/` directory no longer exists
- [ ] No import statements reference `archived/` anywhere in codebase
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `grep -r "archived/" src/` returns no results.

---

### Iteration 2: Remove Ultra* Components

**Objective**: Delete the 10 Ultra* components that are not integrated into the application.

**Files to modify (max 10)**:
1. `src/components/Advanced/UltraMarketplace.tsx` — DELETE
2. `src/components/Advanced/UltraSecurityFramework.tsx` — DELETE
3. `src/components/Advanced/UltraAnalyticsDashboard.tsx` — DELETE
4. `src/components/Advanced/UltraCollaborationHub.tsx` — DELETE
5. `src/components/Advanced/UltraCloudInfrastructure.tsx` — DELETE
6. `src/components/Advanced/UltraPerformanceEngine.tsx` — DELETE
7. `src/components/Advanced/UltraAIAssistant.tsx` — DELETE
8. `src/components/Advanced/UltraAutomationPipeline.tsx` — DELETE
9. `src/components/Advanced/UltraMobileIDE.tsx` — DELETE
10. `src/components/Performance/UltraPerformanceDashboard.tsx` — DELETE

**Steps**:
1. Search for imports of each Ultra* component:
   ```bash
   grep -r "Ultra" src/ --include="*.ts" --include="*.tsx" -l
   ```
2. For each file importing an Ultra* component, remove the import and any JSX usage
3. Delete all 10 Ultra* files
4. If `src/components/Advanced/` becomes empty, delete the directory
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] No Ultra* component files exist in the codebase
- [ ] No imports reference Ultra* components
- [ ] All 5 feedback loop checks pass
- [ ] Build output size decreased (record new size)

**Test Command**: `npm run type-check && npm run build`

**Proof**: `find src/ -name "Ultra*"` returns no results. Build size recorded in metrics.

---

### Iteration 3: Clean console.log Statements

**Objective**: Remove or replace ~1,719 `console.log` statements with a proper logging utility. Keep `console.error` and `console.warn`.

**Files to modify (max 10 per pass — this iteration may require multiple passes)**:

**Pass 1 — Create logger utility + clean highest-impact files**:
1. `src/utils/logger.ts` — CREATE (simple logger with debug/info/warn/error levels)
2. `src/stores/vb6Store.ts` — Replace console.log calls
3. `src/ModernApp.tsx` — Replace console.log calls
4. `src/context/VB6Context.tsx` — Replace console.log calls
5. `src/services/VB6Compiler.ts` — Replace console.log calls
6. `src/hooks/useControlManipulation.ts` — Replace console.log calls

**Strategy**:
- Create a minimal `logger.ts` utility:
  ```typescript
  const isDev = import.meta.env.DEV;
  export const logger = {
    debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
    info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
    warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
    error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  };
  ```
- For files with fewer than 3 console.log calls: simply remove them
- For files with 3+ console.log calls: replace with `logger.debug()`
- **Do NOT touch console.error or console.warn** — these are intentional
- **Note**: A LoggingService already exists from earlier work. Evaluate whether to extend it or create a simpler utility.

**Acceptance Criteria**:
- [ ] console.log count reduced by at least 80% (target: <350 occurrences)
- [ ] No console.error or console.warn statements were removed
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run lint`

**Proof**: `grep -rc "console.log" src/ --include="*.ts" --include="*.tsx" | awk -F: '{sum+=$2} END {print sum}'` shows < 350.

---

### Iteration 4: Add ErrorBoundary Wrappers

**Objective**: Wrap major application sections in ErrorBoundary components to prevent full-app crashes.

**Files to modify (max 10)**:
1. `src/components/ErrorBoundary.tsx` — Review/enhance existing implementation
2. `src/ModernApp.tsx` — Add ErrorBoundary around major sections
3. `src/components/Layout/MainContent.tsx` — Wrap panel sections
4. `src/components/Editor/MonacoCodeEditor.tsx` — Wrap editor
5. `src/components/Designer/DesignerCanvas.tsx` — Wrap form designer
6. `src/components/Panels/Toolbox/Toolbox.tsx` — Wrap toolbox
7. `src/components/Debug/DebugPanel.tsx` — Wrap debug panel
8. `src/components/Panels/PropertiesWindow.tsx` — Wrap properties window

**Steps**:
1. Read the existing `ErrorBoundary.tsx` to understand current implementation
2. Ensure it supports:
   - `fallback` prop for custom error UI
   - `onError` callback for logging
   - `resetKeys` for automatic recovery on prop changes
3. In `ModernApp.tsx`, wrap each major section (editor, designer, panels) with ErrorBoundary
4. In `MainContent.tsx`, wrap each panel render with ErrorBoundary
5. Add section-specific fallback UIs (simple "Error in [Section]" messages)
6. Run the feedback loop

**Acceptance Criteria**:
- [ ] ErrorBoundary wraps at least 6 major sections
- [ ] Each boundary has a meaningful fallback UI
- [ ] An error in one section does not crash the entire app
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/components/ErrorBoundary.test.tsx`

**Proof**: ErrorBoundary test passes. Manual verification that crashing one panel doesn't crash the app.

---

### Iteration 5: Clean Unused Imports & Dead Exports

**Objective**: Remove unused imports and exports detected by TypeScript and ESLint.

**Files to modify (max 10 — highest-impact files)**:
1. `src/ModernApp.tsx` — Clean unused imports
2. `src/stores/vb6Store.ts` — Clean unused exports
3. `src/context/VB6Context.tsx` — Clean unused imports/exports
4. `src/context/types.ts` — Clean unused type exports
5. `src/services/VB6Compiler.ts` — Clean unused imports
6. `src/components/Layout/MainContent.tsx` — Clean unused imports
7. `src/utils/controlDefaults.ts` — Clean unused exports
8. `src/components/Controls/VB6Controls.tsx` — Clean unused imports

**Steps**:
1. Run TypeScript in strict unused-check mode:
   ```bash
   npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 | head -100
   ```
2. Run ESLint with the no-unused-vars rule:
   ```bash
   npm run lint 2>&1 | grep "no-unused"
   ```
3. For each file, remove unused imports and mark unused function parameters with `_` prefix
4. Remove any exports that are not imported anywhere
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] No unused import warnings in the modified files
- [ ] No unused export warnings in the modified files
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run lint && npm run type-check`

**Proof**: `npm run lint` shows no unused-import warnings for modified files.

---

## Phase 2: Component Consolidation (Iterations 6-12)

**Goal**: Merge duplicate component variants into canonical implementations. Reduce component count.

**Parallelism**: Iterations 6-10 can run in parallel (different component families). 11-12 depend on 6-10.

**Pre-requisite**: Phase 1 complete (dead code removed, error boundaries in place).

---

### Iteration 6: Consolidate Toolbox Variants

**Objective**: Merge 4 Toolbox variants into a single configurable component.

**Files to modify (max 10)**:
1. `src/components/Panels/Toolbox/Toolbox.tsx` — Canonical component (KEEP + enhance)
2. `src/components/Panels/Toolbox/AdvancedToolbox.tsx` — MERGE then DELETE
3. `src/components/Panels/Toolbox/EnhancedToolbox.tsx` — MERGE then DELETE
4. `src/components/Panels/Toolbox/ModernToolbox.tsx` — MERGE then DELETE
5. `src/ModernApp.tsx` — Update imports to use canonical Toolbox
6. `src/components/Layout/MainContent.tsx` — Update imports
7. `src/stores/vb6Store.ts` — Update any Toolbox-related state if needed

**Steps**:
1. Read all 4 Toolbox variants to identify unique features
2. Identify which features from Advanced/Enhanced/Modern should be preserved
3. Add a `variant` or `mode` prop to `Toolbox.tsx` to support needed variations
4. Update all imports across the codebase:
   ```bash
   grep -r "AdvancedToolbox\|EnhancedToolbox\|ModernToolbox" src/ --include="*.tsx" --include="*.ts" -l
   ```
5. Replace imports and usage with canonical `Toolbox`
6. Delete the 3 redundant files
7. Run the feedback loop

**Acceptance Criteria**:
- [ ] Only `Toolbox.tsx` remains in `src/components/Panels/Toolbox/`
- [ ] All unique features from variants are preserved via props
- [ ] No imports reference deleted files
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `ls src/components/Panels/Toolbox/` shows only `Toolbox.tsx`. Build succeeds.

---

### Iteration 7: Consolidate Editor Variants

**Objective**: Reduce 7+ Editor variants to 2: `MonacoCodeEditor.tsx` (full) and `LazyMonacoEditor.tsx` (lazy wrapper).

**Files to modify (max 10)**:
1. `src/components/Editor/MonacoCodeEditor.tsx` — Canonical editor (KEEP + enhance)
2. `src/components/Editor/LazyMonacoEditor.tsx` — Lazy wrapper (KEEP)
3. `src/components/Editor/CodeEditor.tsx` — MERGE then DELETE
4. `src/components/Editor/AdvancedCodeEditor.tsx` — MERGE then DELETE
5. `src/components/Editor/OptimizedMonacoEditor.tsx` — MERGE then DELETE
6. `src/components/Editor/MonacoCodeEditorLazy.tsx` — MERGE into LazyMonacoEditor then DELETE
7. `src/ModernApp.tsx` — Update editor imports
8. `src/components/Layout/MainContent.tsx` — Update editor imports

**Steps**:
1. Read all Editor variants to understand differences
2. Consolidate optimization techniques (from OptimizedMonacoEditor) into MonacoCodeEditor
3. Merge any unique CodeEditor/AdvancedCodeEditor features into MonacoCodeEditor
4. Ensure LazyMonacoEditor properly wraps MonacoCodeEditor with React.lazy
5. Update all imports:
   ```bash
   grep -r "CodeEditor\|AdvancedCodeEditor\|OptimizedMonacoEditor\|MonacoCodeEditorLazy" src/ -l
   ```
6. Delete redundant files
7. Run the feedback loop

**Acceptance Criteria**:
- [ ] Only `MonacoCodeEditor.tsx`, `LazyMonacoEditor.tsx`, and support files remain in `src/components/Editor/`
- [ ] IntelliSense features preserved (VB6IntelliSense.tsx, EnhancedIntelliSense.tsx may stay if distinct)
- [ ] All imports updated
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/components/MonacoEditor.test.tsx && npm run type-check`

**Proof**: Editor tests pass. Build succeeds with reduced chunk count.

---

### Iteration 8: Consolidate Toolbar Variants

**Objective**: Merge 5 Toolbar variants into a single configurable Toolbar.

**Files to modify (max 10)**:
1. `src/components/Layout/Toolbar.tsx` — Canonical toolbar (KEEP + enhance)
2. `src/components/Layout/EnhancedToolbar.tsx` — MERGE then DELETE
3. `src/components/Layout/LayoutToolbar.tsx` — MERGE then DELETE
4. `src/components/Layout/ModernToolbar.tsx` — MERGE then DELETE
5. `src/components/Layout/UndoRedoToolbar.tsx` — Extract into Toolbar section/slot then DELETE
6. `src/ModernApp.tsx` — Update toolbar imports
7. `src/components/Layout/MainContent.tsx` — Update toolbar imports

**Steps**:
1. Read all 5 Toolbar variants to identify unique features
2. Design a unified Toolbar with sections/slots:
   - Standard actions (New, Open, Save, etc.)
   - Undo/Redo section (from UndoRedoToolbar)
   - Debug controls section
   - Layout controls (from LayoutToolbar)
3. Add a `sections` prop or use children/slots pattern
4. Update all imports
5. Delete redundant files
6. Run the feedback loop

**Acceptance Criteria**:
- [ ] Only `Toolbar.tsx` remains as the main toolbar
- [ ] Undo/Redo functionality preserved
- [ ] Layout controls preserved
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `ls src/components/Layout/ | grep -i toolbar` shows only `Toolbar.tsx`.

---

### Iteration 9: Consolidate Debug Components (Part 1 — Merge Duplicates)

**Objective**: Eliminate duplicate Debug components between `Debug/` and `Debugging/` directories. Merge redundant panels.

**Files to modify (max 10)**:
1. `src/components/Debug/TimeTravelDebugger.tsx` — KEEP (canonical)
2. `src/components/Debugging/TimeTravelDebugger.tsx` — MERGE then DELETE
3. `src/components/Debugging/BreakpointManager.tsx` — MOVE to Debug/ or merge with BreakpointGutter
4. `src/components/Debug/DebugPanel.tsx` — KEEP (canonical panel)
5. `src/components/Debug/AdvancedDebugPanel.tsx` — MERGE into DebugPanel then DELETE
6. `src/components/Debug/WatchPanel.tsx` — KEEP
7. `src/components/Debug/WatchWindow.tsx` — MERGE into WatchPanel then DELETE
8. `src/components/Debug/VB6EnhancedWatchWindow.tsx` — MERGE into WatchPanel then DELETE
9. Files importing from `Debugging/` — Update imports

**Steps**:
1. Compare `Debug/TimeTravelDebugger.tsx` with `Debugging/TimeTravelDebugger.tsx`
2. Keep the more complete version, merge any unique features
3. Compare WatchPanel, WatchWindow, and VB6EnhancedWatchWindow — merge into one
4. Merge AdvancedDebugPanel features into DebugPanel
5. Move BreakpointManager from Debugging/ to Debug/ (or merge with BreakpointGutter)
6. Delete `src/components/Debugging/` directory if empty
7. Update all imports
8. Run the feedback loop

**Acceptance Criteria**:
- [ ] `src/components/Debugging/` directory is deleted
- [ ] No duplicate TimeTravelDebugger exists
- [ ] Watch-related components consolidated into WatchPanel
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/components/DebuggingComponents.test.tsx && npm run type-check`

**Proof**: `ls src/components/Debugging/` returns "No such file or directory".

---

### Iteration 10: Consolidate Debug Components (Part 2 — Organize)

**Objective**: Organize remaining Debug components into a clean structure with a single entry point.

**Files to modify (max 10)**:
1. `src/components/Debug/index.ts` — CREATE (barrel export)
2. `src/components/Debug/DebugPanel.tsx` — Main panel (orchestrator)
3. `src/components/Debug/DebugManager.tsx` — Evaluate: merge into DebugPanel or keep
4. `src/components/Debug/DebugWindows.tsx` — Evaluate: is this redundant with DebugPanel?
5. `src/components/Debug/DebugToolbar.tsx` — Keep (toolbar for debug mode)
6. `src/components/Debug/VisualDebugger.tsx` — Evaluate: unique enough to keep?
7. `src/components/Debug/MemoryProfiler.tsx` — Keep (distinct functionality)
8. `src/ModernApp.tsx` — Update debug imports to use barrel
9. `src/components/Layout/MainContent.tsx` — Update debug imports

**Steps**:
1. Read each remaining Debug component to assess uniqueness
2. Merge any components that are thin wrappers around others
3. Create `index.ts` barrel export for clean imports:
   ```typescript
   export { DebugPanel } from './DebugPanel';
   export { DebugToolbar } from './DebugToolbar';
   // etc.
   ```
4. Update all import paths to use the barrel
5. Target: reduce Debug/ from 18 files to ~10 distinct files
6. Run the feedback loop

**Acceptance Criteria**:
- [ ] Debug/ has an index.ts barrel export
- [ ] Debug/ contains at most 12 files (down from 18)
- [ ] Each remaining file has distinct, non-overlapping functionality
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/components/DebuggingComponents.test.tsx && npm run type-check`

**Proof**: `ls src/components/Debug/ | wc -l` shows <= 12.

---

### Iteration 11: Extract DialogManager from ModernApp

**Objective**: Extract dialog management (20+ dialogs) from ModernApp.tsx into a dedicated DialogManager component, reducing ModernApp from 655 LOC to ~300 LOC.

**Files to modify (max 10)**:
1. `src/components/Dialogs/DialogManager.tsx` — CREATE
2. `src/components/Dialogs/dialogTypes.ts` — CREATE (dialog state types)
3. `src/ModernApp.tsx` — Remove dialog logic, use DialogManager
4. `src/stores/vb6Store.ts` — Add dialog state slice if needed
5. `src/components/Dialogs/index.ts` — CREATE barrel export

**Steps**:
1. Read `ModernApp.tsx` and catalog all dialog state variables and renders
2. Create `dialogTypes.ts` with a union type for all dialog types:
   ```typescript
   type DialogType = 'projectSetup' | 'importExport' | 'settings' | 'about' | ...;
   interface DialogState {
     activeDialog: DialogType | null;
     dialogProps?: Record<string, unknown>;
   }
   ```
3. Create `DialogManager.tsx` that:
   - Receives the active dialog type from store/context
   - Renders the appropriate dialog component
   - Handles dialog open/close state
   - Uses React.lazy for each dialog
4. In `ModernApp.tsx`:
   - Remove all individual dialog state (useState for each dialog)
   - Remove all dialog render blocks
   - Add single `<DialogManager />` component
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] `ModernApp.tsx` is under 400 LOC
- [ ] `DialogManager.tsx` manages all dialog rendering
- [ ] All dialogs still function correctly
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `wc -l src/ModernApp.tsx` shows < 400.

---

### Iteration 12: Extract WindowManager from MainContent

**Objective**: Extract panel/window layout management from MainContent.tsx into a dedicated WindowManager.

**Files to modify (max 10)**:
1. `src/components/Layout/WindowManager.tsx` — CREATE
2. `src/components/Layout/windowTypes.ts` — CREATE (panel layout types)
3. `src/components/Layout/MainContent.tsx` — Simplify to use WindowManager
4. `src/stores/vb6Store.ts` — Consolidate panel visibility state
5. `src/components/Layout/index.ts` — Update barrel export

**Steps**:
1. Read `MainContent.tsx` and catalog all panel states and conditional renders
2. Create `windowTypes.ts` with panel layout types:
   ```typescript
   interface PanelConfig {
     id: string;
     component: React.LazyExoticComponent<React.ComponentType>;
     position: 'left' | 'center' | 'right' | 'bottom';
     visible: boolean;
     resizable: boolean;
   }
   ```
3. Create `WindowManager.tsx` that:
   - Takes a panel configuration array
   - Manages panel visibility, position, and sizing
   - Handles panel toggling via store
4. Simplify `MainContent.tsx` to compose panels via WindowManager
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] Panel management logic extracted to WindowManager
- [ ] MainContent.tsx is simplified to a layout shell
- [ ] All panels still render correctly
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: MainContent.tsx is primarily composition, not conditional rendering.

---

## Phase 3: State Management (Iterations 13-16)

**Goal**: Decompose the monolithic store, eliminate Context/Store duplication, enforce type safety.

**Parallelism**: 13-14 are sequential. 15-16 can run in parallel after 14.

**Pre-requisite**: Phase 2 iterations 11-12 complete (DialogManager and WindowManager extracted).

---

### Iteration 13: Extract WindowStore from vb6Store

**Objective**: Split window/panel/UI state from vb6Store.ts into a dedicated `windowStore.ts`, reducing vb6Store from 1,580 LOC.

**Files to modify (max 10)**:
1. `src/stores/windowStore.ts` — CREATE
2. `src/stores/vb6Store.ts` — Remove window/panel state
3. `src/components/Layout/WindowManager.tsx` — Use new windowStore
4. `src/components/Layout/MainContent.tsx` — Update store usage
5. `src/ModernApp.tsx` — Update store usage
6. `src/stores/index.ts` — CREATE or UPDATE barrel export for stores

**Steps**:
1. Read `vb6Store.ts` and identify all window/panel/UI state:
   - Panel visibility flags (showToolbox, showProperties, showProjectExplorer, etc.)
   - Panel positions and sizes
   - Active panel tracking
   - Window layout preferences
2. Extract these into `windowStore.ts`:
   ```typescript
   import { create } from 'zustand';
   import { subscribeWithSelector } from 'zustand/middleware';

   interface WindowState {
     panels: Record<string, PanelConfig>;
     togglePanel: (id: string) => void;
     // ...
   }
   ```
3. Update all consumers to import from the correct store
4. Verify vb6Store.ts is reduced by at least 200 LOC
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] `windowStore.ts` manages all panel/window state
- [ ] `vb6Store.ts` is under 1,400 LOC
- [ ] All panel toggles and visibility still work
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/stores/ && npm run type-check`

**Proof**: `wc -l src/stores/vb6Store.ts` shows < 1,400.

---

### Iteration 14: Consolidate Context/Store Overlap

**Objective**: Resolve the dual state management (Zustand store + React Context) by establishing clear boundaries.

**Files to modify (max 10)**:
1. `src/context/VB6Context.tsx` — Remove state that duplicates Zustand store
2. `src/context/vb6Reducer.ts` — Simplify (remove actions handled by store)
3. `src/stores/vb6Store.ts` — Absorb any unique Context state
4. `src/context/types.ts` — Clean up types
5. `src/ModernApp.tsx` — Update Context/Store usage
6. `src/components/Designer/DesignerCanvas.tsx` — Update to use correct source
7. `src/components/Controls/VB6Controls.tsx` — Update to use correct source

**Steps**:
1. Map every state value in VB6Context and identify overlap with vb6Store:
   - **Context should keep**: Form-specific operations (control manipulation, clipboard, code evaluation)
   - **Store should keep**: Global state (controls list, forms list, current form, debugging state)
2. Remove duplicated state from Context
3. Update Context actions to delegate to Store where appropriate
4. Update consumers to read from the correct source
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] No state value exists in both Context and Store
- [ ] Clear boundary: Context = form operations, Store = global state
- [ ] Context provider is simplified
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/context/ && npx vitest run src/test/stores/ && npm run type-check`

**Proof**: No state duplication between `VB6Context.tsx` and `vb6Store.ts`.

---

### Iteration 15: Type-Safe Control Interface

**Objective**: Replace `[key: string]: any` on the Control interface with proper discriminated union types.

**Files to modify (max 10)**:
1. `src/context/types.ts` — Rewrite Control interface
2. `src/utils/controlDefaults.ts` — Update defaults to match new types
3. `src/components/Controls/VB6Controls.tsx` — Update control rendering
4. `src/components/Panels/PropertiesWindow.tsx` — Update property reading
5. `src/hooks/useControlManipulation.ts` — Update control access
6. `src/stores/vb6Store.ts` — Update control state types

**Steps**:
1. Read `types.ts` and catalog all Control properties actually used
2. Create a base `ControlBase` interface with common properties:
   ```typescript
   interface ControlBase {
     Name: string;
     Left: number;
     Top: number;
     Width: number;
     Height: number;
     Visible: boolean;
     Enabled: boolean;
     TabIndex: number;
     ControlType: ControlTypeEnum;
   }
   ```
3. Create specific interfaces for each control type:
   ```typescript
   interface TextBoxControl extends ControlBase {
     ControlType: 'TextBox';
     Text: string;
     MultiLine: boolean;
     // ...
   }
   type Control = TextBoxControl | LabelControl | ButtonControl | ...;
   ```
4. Update `controlDefaults.ts` to use the typed defaults
5. Update key consumers (max 10 files)
6. Run the feedback loop

**Acceptance Criteria**:
- [ ] `Control` is a discriminated union, not `[key: string]: any`
- [ ] At least 10 control types have specific interfaces
- [ ] `as any` count reduced by at least 50 occurrences
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check`

**Proof**: `grep -c "as any" src/context/types.ts` shows 0.

---

### Iteration 16: Property System Refactor

**Objective**: Refactor the property system to use type-safe property descriptors instead of string-keyed objects.

**Files to modify (max 10)**:
1. `src/utils/VB6CompleteProperties.ts` — Add type-safe property descriptors
2. `src/components/Panels/PropertiesWindow.tsx` — Use typed property access
3. `src/components/VB6PropertyEditor.tsx` — Update property editing
4. `src/context/types.ts` — Property descriptor types
5. `src/utils/controlDefaults.ts` — Update to use property descriptors
6. `src/context/VB6Context.tsx` — Update property change handlers

**Steps**:
1. Read `VB6CompleteProperties.ts` to understand current property definitions
2. Create typed property descriptors:
   ```typescript
   interface PropertyDescriptor<T> {
     name: string;
     type: 'string' | 'number' | 'boolean' | 'enum' | 'color';
     defaultValue: T;
     category: string;
     editorType: 'text' | 'number' | 'dropdown' | 'colorPicker';
     validation?: (value: T) => boolean;
   }
   ```
3. Update PropertiesWindow to use descriptors for rendering
4. Update property editing to validate against descriptors
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] Property descriptors have TypeScript types
- [ ] PropertiesWindow uses typed property access
- [ ] Property editing validates against types
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/VB6PropertySystem.test.ts && npm run type-check`

**Proof**: Property system uses typed descriptors instead of string keys.

---

## Phase 4: Hook Refactoring (Iterations 17-20)

**Goal**: Decompose oversized hooks into focused, testable units.

**Parallelism**: 17-18 are sequential (same file). 19 can parallel with 17-18. 20 follows all.

**Pre-requisite**: Phase 3 iterations 14-15 complete (type-safe Controls, store boundaries clear).

---

### Iteration 17: Split useControlManipulation — Selection Logic

**Objective**: Extract selection-related logic from useControlManipulation.ts (576 LOC) into `useControlSelection.ts`.

**Files to modify (max 10)**:
1. `src/hooks/useControlSelection.ts` — CREATE
2. `src/hooks/useControlManipulation.ts` — Remove selection logic, import from useControlSelection
3. `src/components/Designer/DesignerCanvas.tsx` — Use new hook if directly needed
4. `src/components/Controls/VB6Controls.tsx` — Update hook usage

**Steps**:
1. Read `useControlManipulation.ts` and identify all selection-related code:
   - `selectedControlIds` state
   - `selectControl`, `deselectControl`, `selectAll`, `clearSelection`
   - Multi-select logic (Shift+click, Ctrl+click)
   - Selection rectangle/lasso
2. Extract into `useControlSelection.ts`:
   ```typescript
   export function useControlSelection() {
     return { selectedIds, selectControl, deselectAll, isSelected, ... };
   }
   ```
3. Update `useControlManipulation` to compose `useControlSelection`
4. Run the feedback loop

**Acceptance Criteria**:
- [ ] `useControlSelection.ts` exists with clear single responsibility
- [ ] `useControlManipulation.ts` is under 450 LOC
- [ ] Selection behavior unchanged
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/hooks/useControlManipulation.test.tsx && npm run type-check`

**Proof**: `wc -l src/hooks/useControlManipulation.ts` shows < 450.

---

### Iteration 18: Split useControlManipulation — Resize & Move Logic

**Objective**: Extract resize and move logic from useControlManipulation into `useControlResize.ts` and `useControlMove.ts`.

**Files to modify (max 10)**:
1. `src/hooks/useControlResize.ts` — CREATE
2. `src/hooks/useControlMove.ts` — CREATE
3. `src/hooks/useControlManipulation.ts` — Compose the extracted hooks
4. `src/components/Designer/DesignerCanvas.tsx` — Update if needed

**Steps**:
1. Extract resize logic (8-direction handles, aspect ratio, grid snapping):
   ```typescript
   export function useControlResize(controls, gridSize) {
     return { startResize, onResize, endResize, resizeHandleProps };
   }
   ```
2. Extract move logic (drag, alignment guides, grid snapping):
   ```typescript
   export function useControlMove(controls, gridSize, guides) {
     return { startMove, onMove, endMove };
   }
   ```
3. `useControlManipulation` becomes a thin composition layer:
   ```typescript
   export function useControlManipulation(options) {
     const selection = useControlSelection();
     const resize = useControlResize(...);
     const move = useControlMove(...);
     return { ...selection, ...resize, ...move };
   }
   ```
4. Run the feedback loop

**Acceptance Criteria**:
- [ ] `useControlResize.ts` and `useControlMove.ts` exist
- [ ] `useControlManipulation.ts` is under 150 LOC (composition only)
- [ ] Resize and move behavior unchanged
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/hooks/useControlManipulation.test.tsx && npm run type-check`

**Proof**: `wc -l src/hooks/useControlManipulation.ts` shows < 150.

---

### Iteration 19: Refactor useAnimatedControlManipulation

**Objective**: Refactor useAnimatedControlManipulation.ts (478 LOC) to compose the new extracted hooks + add animation layer.

**Files to modify (max 10)**:
1. `src/hooks/useAnimatedControlManipulation.ts` — Rewrite as animation wrapper
2. `src/hooks/useControlAnimation.ts` — CREATE (animation-specific logic)
3. `src/hooks/useControlSelection.ts` — Add animation hooks if needed
4. `src/hooks/useControlResize.ts` — Add animation hooks if needed
5. `src/hooks/useControlMove.ts` — Add animation hooks if needed

**Steps**:
1. Read `useAnimatedControlManipulation.ts` and separate animation concerns:
   - Spring/tween animations
   - Transition timing
   - Animation state management
2. Create `useControlAnimation.ts` with pure animation logic
3. Rewrite `useAnimatedControlManipulation` as:
   ```typescript
   export function useAnimatedControlManipulation(options) {
     const manipulation = useControlManipulation(options);
     const animation = useControlAnimation();
     return { ...manipulation, ...animation };
   }
   ```
4. Target: under 150 LOC for the main hook
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] `useAnimatedControlManipulation.ts` under 200 LOC
- [ ] `useControlAnimation.ts` exists with animation-specific logic
- [ ] Animations still work correctly
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `wc -l src/hooks/useAnimatedControlManipulation.ts` shows < 200.

---

### Iteration 20: Optimize Remaining Hooks

**Objective**: Review and optimize other hooks for performance and correctness.

**Files to modify (max 10)**:
1. `src/hooks/useAutoSave.ts` — Add proper cleanup and debouncing
2. `src/hooks/useUndoRedo.ts` — Optimize snapshot storage
3. `src/hooks/useCollaboration.ts` — Add reconnection logic
4. `src/hooks/useAlignmentGuides.ts` — Memoize guide calculations (if exists)
5. `src/hooks/index.ts` — CREATE barrel export

**Steps**:
1. Read each hook file
2. For each hook:
   - Ensure proper cleanup in useEffect return
   - Add memoization where expensive computations exist
   - Ensure no stale closures
   - Remove any `as any` type assertions
3. Create barrel export for hooks directory
4. Run the feedback loop

**Acceptance Criteria**:
- [ ] All hooks have proper cleanup
- [ ] Expensive computations are memoized
- [ ] No stale closure issues
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/hooks/ && npm run type-check`

**Proof**: Hook tests pass. No memory leaks in cleanup.

---

## Phase 5: Compiler Pipeline (Iterations 21-28)

**Goal**: Replace the regex-based compiler pipeline with the AST-based implementation from `src/compiler/`. This is the most technically complex phase.

**Parallelism**: 21-24 are sequential (each builds on previous). 25-28 follow in sequence. Phase 5 can run parallel to Phases 3-4 since compiler is independent of UI.

**Pre-requisite**: None (independent of other phases). But Phase 1 should be complete for clean codebase.

---

### Iteration 21: Enhance Lexer with Full VB6 Tokens

**Objective**: Enhance `src/utils/vb6Lexer.ts` to produce a complete token set for the recursive descent parser.

**Files to modify (max 10)**:
1. `src/utils/vb6Lexer.ts` — Enhance token types
2. `src/compiler/VB6AdvancedLexer.ts` — Reference for missing tokens
3. `src/compiler/UnifiedLexer.ts` — Reference for token definitions
4. `src/test/compiler/` — Add tests for new tokens

**Steps**:
1. Compare token types in `vb6Lexer.ts` with `VB6AdvancedLexer.ts` and `UnifiedLexer.ts`
2. Add missing token types:
   - Property Get/Let/Set
   - WithEvents
   - Implements
   - Enum/End Enum
   - Type (UDT)
   - Friend
   - Static (for variables)
   - ParamArray
   - Optional parameters
3. Ensure all VB6 keywords are recognized
4. Add comprehensive tests
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] Lexer recognizes all VB6 keywords listed in compiler tests
- [ ] New token types added for all VB6-specific constructs
- [ ] Existing tests still pass
- [ ] New tests cover the added token types
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/compiler/`

**Proof**: Compiler tests pass with new token types.

---

### Iteration 22: Integrate RecursiveDescentParser

**Objective**: Wire `src/compiler/VB6RecursiveDescentParser.ts` as the primary parser, replacing the regex-based `src/utils/vb6Parser.ts`.

**Files to modify (max 10)**:
1. `src/utils/vb6Parser.ts` — Keep as fallback, add deprecation comment
2. `src/compiler/VB6RecursiveDescentParser.ts` — Adapt to accept vb6Lexer output
3. `src/compiler/index.ts` — Export the parser
4. `src/services/VB6Compiler.ts` — Wire new parser
5. `src/test/compiler/vb6Parser.test.ts` — Update tests

**Steps**:
1. Read `VB6RecursiveDescentParser.ts` to understand its token input format
2. Create an adapter layer if the lexer output format differs
3. Update `VB6Compiler.ts` to use RecursiveDescentParser:
   ```typescript
   try {
     ast = recursiveDescentParser.parse(tokens);
   } catch {
     ast = regexParser.parse(source);
   }
   ```
4. Update tests to validate new parser output
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] RecursiveDescentParser is wired as primary parser
- [ ] Fallback to regex parser on failure
- [ ] All existing parser tests pass
- [ ] AST output validated
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/compiler/vb6Parser.test.ts`

**Proof**: Parser tests pass with new RecursiveDescentParser.

---

### Iteration 23: Wire Semantic Analyzer to New Parser

**Objective**: Connect the semantic analyzer to the AST produced by the RecursiveDescentParser.

**Files to modify (max 10)**:
1. `src/utils/vb6SemanticAnalyzer.ts` — Adapt to new AST format
2. `src/compiler/VB6AdvancedSemanticAnalyzer.ts` — Reference for advanced checks
3. `src/compiler/VB6TypeSystem.ts` — Reference for type checking
4. `src/services/VB6Compiler.ts` — Wire semantic analysis
5. `src/test/vb6Semantic.test.ts` — Update tests

**Steps**:
1. Compare the AST format from RecursiveDescentParser with what the semantic analyzer expects
2. Adapt the semantic analyzer to accept the new AST
3. Integrate advanced checks from `VB6AdvancedSemanticAnalyzer.ts` if valuable
4. Wire in `VB6Compiler.ts` pipeline
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] Semantic analyzer processes AST from RecursiveDescentParser
- [ ] Type checking works for basic VB6 types
- [ ] Scope analysis detects undeclared variables
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/vb6Semantic.test.ts`

**Proof**: Semantic tests pass with new AST input.

---

### Iteration 24: Build AST-Based Transpiler

**Objective**: Create an AST-to-JavaScript transpiler that replaces the regex-based `vb6Transpiler.ts`.

**Files to modify (max 10)**:
1. `src/utils/vb6Transpiler.ts` — Keep as fallback, add deprecation comment
2. `src/compiler/VB6UnifiedASTTranspiler.ts` — Reference/enhance
3. `src/compiler/VB6JSGenerator.ts` — Reference for JS generation
4. `src/compiler/VB6CodeGenerator.ts` — Wire as primary transpiler
5. `src/services/VB6Compiler.ts` — Use new transpiler
6. `src/test/vb6Transpiler.test.ts` — Update tests

**Steps**:
1. Read `VB6UnifiedASTTranspiler.ts` and `VB6JSGenerator.ts`
2. Choose the best implementation as the primary transpiler
3. Ensure it handles all VB6 constructs (variables, control flow, functions, error handling, operators)
4. Wire in `VB6Compiler.ts` with fallback
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] AST transpiler generates valid JavaScript
- [ ] All existing transpiler tests pass
- [ ] Fallback to regex transpiler on failure
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/vb6Transpiler.test.ts`

**Proof**: Transpiler tests pass with AST-based generation.

---

### Iteration 25: Wire End-to-End Compiler Pipeline

**Objective**: Connect all compiler stages into a unified pipeline: Lexer -> Parser -> Semantic -> Transpiler.

**Files to modify (max 10)**:
1. `src/services/VB6Compiler.ts` — Unified pipeline orchestration
2. `src/compiler/index.ts` — Export unified pipeline
3. `src/compiler/VB6CompilerCore.ts` — Reference for pipeline design
4. `src/context/VB6Context.tsx` — Update code evaluation to use new pipeline
5. `src/test/integration/VB6CompilerIntegration.test.ts` — Integration tests

**Steps**:
1. Create a clean pipeline in `VB6Compiler.ts`:
   ```typescript
   class VB6Compiler {
     compile(source: string): CompilationResult {
       const tokens = this.lexer.tokenize(source);
       const ast = this.parser.parse(tokens);
       const diagnostics = this.semanticAnalyzer.analyze(ast);
       if (diagnostics.errors.length > 0) return { errors: diagnostics.errors };
       const javascript = this.transpiler.generate(ast);
       return { javascript, warnings: diagnostics.warnings };
     }
   }
   ```
2. Add proper error handling at each stage
3. Update `VB6Context.tsx` to use the new compile method
4. Write integration tests that compile real VB6 programs
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] Full pipeline: source -> tokens -> AST -> analysis -> JavaScript
- [ ] Error reporting at each stage
- [ ] Integration test compiles and runs a VB6 Hello World
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/integration/VB6CompilerIntegration.test.ts`

**Proof**: Integration test compiles and executes VB6 code end-to-end.

---

### Iteration 26: Compiler Error Reporting & Diagnostics

**Objective**: Implement structured error reporting with line numbers, severity levels, and fix suggestions.

**Files to modify (max 10)**:
1. `src/compiler/VB6AdvancedErrorHandling.ts` — Reference/enhance
2. `src/services/VB6Compiler.ts` — Add diagnostic reporting
3. `src/compiler/index.ts` — Export diagnostic types
4. `src/components/Editor/MonacoCodeEditor.tsx` — Display diagnostics as squiggles
5. `src/components/ErrorList/` — Update error list panel (if exists)

**Steps**:
1. Define diagnostic types:
   ```typescript
   interface Diagnostic {
     severity: 'error' | 'warning' | 'info';
     message: string;
     line: number;
     column: number;
     code: string; // e.g., "VB6001"
     suggestion?: string;
   }
   ```
2. Update lexer, parser, and semantic analyzer to produce diagnostics
3. Wire diagnostics to Monaco editor markers
4. Run the feedback loop

**Acceptance Criteria**:
- [ ] Compiler produces structured diagnostics
- [ ] Diagnostics include line/column numbers
- [ ] Monaco editor shows error squiggles
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/compiler/ && npm run type-check`

**Proof**: Compiler errors show as Monaco squiggles with accurate positions.

---

### Iteration 27: Runtime Lazy Loading & Optimization

**Objective**: Lazy-load the VB6 runtime library to reduce initial bundle size.

**Files to modify (max 10)**:
1. `src/runtime/index.ts` — Create lazy-loadable entry point
2. `src/runtime/VB6RuntimeLoader.ts` — CREATE (lazy loader)
3. `src/services/VB6Compiler.ts` — Use lazy runtime
4. `src/context/VB6Context.tsx` — Use lazy runtime
5. `vite.config.ts` — Ensure runtime is in separate chunk

**Steps**:
1. Create `VB6RuntimeLoader.ts` with on-demand loading
2. Update `vite.config.ts` manual chunks to isolate runtime
3. Update VB6Compiler and VB6Context to await runtime loading
4. Run the feedback loop

**Acceptance Criteria**:
- [ ] Runtime loads on demand, not at startup
- [ ] Runtime is in a separate chunk
- [ ] Build output shows reduced main chunk size
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run build && npm run type-check`

**Proof**: `npm run build` output shows runtime in separate chunk.

---

### Iteration 28: Clean Up Old Compiler Files

**Objective**: Remove compiler files from `src/compiler/` that have been superseded by the new pipeline.

**Files to modify (max 10)**:
1. `src/compiler/` — Identify and delete superseded files
2. `src/compiler/index.ts` — Update exports to only include active files
3. `src/services/VB6Compiler.ts` — Verify no references to deleted files

**Steps**:
1. List all 48 files in `src/compiler/`
2. For each file, check if it's imported anywhere:
   ```bash
   grep -r "from.*compiler/FileName" src/ --include="*.ts" --include="*.tsx"
   ```
3. Categorize files: KEEP (used by new pipeline), DELETE (not imported)
4. Delete unused files
5. Target: reduce from 48 to ~15 active files
6. Run the feedback loop

**Acceptance Criteria**:
- [ ] `src/compiler/` has at most 20 files
- [ ] All remaining files are imported and used
- [ ] `index.ts` exports only active modules
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `ls src/compiler/ | wc -l` shows <= 20. Build succeeds.

---

## Phase 6: Testing & Quality (Iterations 29-32)

**Goal**: Increase test coverage, add accessibility, enforce performance budgets, reduce type safety debt.

**Parallelism**: All 4 iterations can run in parallel (independent concerns).

**Pre-requisite**: All previous phases complete.

---

### Iteration 29: Add Component Tests for Core UI

**Objective**: Add React Testing Library tests for the core components modified in Phases 1-4.

**Files to modify (max 10)**:
1. `src/test/components/DialogManager.test.tsx` — CREATE
2. `src/test/components/WindowManager.test.tsx` — CREATE
3. `src/test/components/Toolbar.test.tsx` — CREATE
4. `src/test/components/Toolbox.test.tsx` — CREATE
5. `src/test/components/DebugPanel.test.tsx` — CREATE or UPDATE
6. `src/test/components/FormDesigner.test.tsx` — UPDATE with new tests

**Steps**:
1. For each new/modified component, write tests covering rendering, interaction, state changes, and error boundary behavior
2. Aim for 80%+ coverage on modified components
3. Run the feedback loop

**Acceptance Criteria**:
- [ ] At least 5 new test files created
- [ ] Each tests rendering, interaction, and error states
- [ ] All tests pass
- [ ] All 5 feedback loop checks pass

**Test Command**: `npx vitest run src/test/components/`

**Proof**: Component test suite passes with new tests.

---

### Iteration 30: Add Accessibility (a11y) Coverage

**Objective**: Increase aria-* attribute coverage from 25 occurrences to 150+ across interactive components.

**Files to modify (max 10)**:
1. `src/components/Layout/Toolbar.tsx` — Add aria labels, roles
2. `src/components/Panels/Toolbox/Toolbox.tsx` — Add aria labels
3. `src/components/Panels/PropertiesWindow.tsx` — Add aria for form controls
4. `src/components/Designer/DesignerCanvas.tsx` — Add aria for drag targets
5. `src/components/Editor/MonacoCodeEditor.tsx` — Add aria labels
6. `src/components/Debug/DebugPanel.tsx` — Add aria for debug controls
7. `src/components/Dialogs/DialogManager.tsx` — Add aria-modal, roles
8. `src/components/Layout/MenuBar.tsx` — Add aria-menu roles (if exists)

**Steps**:
1. For each component, add appropriate ARIA attributes:
   - `role` for semantic meaning
   - `aria-label` for non-text interactive elements
   - `aria-expanded` for collapsible sections
   - `aria-selected` for selectable items
   - `aria-modal` for dialogs
   - `tabIndex` for keyboard navigation
2. Ensure keyboard navigation works
3. Run the feedback loop

**Acceptance Criteria**:
- [ ] At least 125 new aria-* attributes added
- [ ] All interactive elements have aria labels
- [ ] Dialogs have aria-modal and role="dialog"
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check && npm run build`

**Proof**: `grep -rc "aria-" src/components/ --include="*.tsx" | awk -F: '{sum+=$2} END {print sum}'` shows 150+.

---

### Iteration 31: Performance Benchmarks & Budgets

**Objective**: Establish and enforce performance budgets for bundle size and runtime.

**Files to modify (max 10)**:
1. `vite.config.ts` — Configure chunk size warnings
2. `package.json` — Add budget check scripts
3. `src/test/performance/BundleBudget.test.ts` — CREATE
4. `src/test/performance/RuntimePerformance.test.ts` — CREATE
5. `scripts/check-bundle-budget.ts` — CREATE (or update existing)

**Steps**:
1. Define budgets based on current baseline:
   - Main chunk: < 500 KB (currently 526 KB)
   - Total JS (excluding monaco): < 2.5 MB
2. Create bundle budget test
3. Add `chunkSizeWarningLimit` to vite config
4. Create runtime performance test measuring render time
5. Run the feedback loop

**Acceptance Criteria**:
- [ ] Bundle budgets defined and checked
- [ ] At least 2 performance test files created
- [ ] Budget check can run in CI
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run build && npm run type-check`

**Proof**: Build output shows chunk sizes within budget.

---

### Iteration 32: Type Safety Sweep (Reduce `as any`)

**Objective**: Reduce `as any` count from 731 to under 400 by adding proper types.

**Files to modify (max 10 per pass — multiple passes expected)**:

**Pass 1 — Highest-impact files**:
1. `src/stores/vb6Store.ts` — Replace `as any` with proper types
2. `src/context/VB6Context.tsx` — Replace `as any` with proper types
3. `src/ModernApp.tsx` — Replace `as any` with proper types
4. `src/services/VB6Compiler.ts` — Replace `as any` with proper types
5. `src/hooks/useControlManipulation.ts` — Replace `as any` with proper types

**Strategy**:
- **Category 1 (easy wins)**: `as any` on event handlers → use proper React event types
- **Category 2 (type narrowing)**: `as any` for type narrowing → use type guards
- **Category 3 (external libs)**: `as any` for untyped libraries → create `.d.ts` declarations
- **Category 4 (complex)**: `as any` in generics → proper generic constraints

**Acceptance Criteria**:
- [ ] `as any` count reduced to under 400 (from 731)
- [ ] No new `as any` introduced
- [ ] Type-check still passes
- [ ] All 5 feedback loop checks pass

**Test Command**: `npm run type-check`

**Proof**: `grep -rc "as any" src/ --include="*.ts" --include="*.tsx" | awk -F: '{sum+=$2} END {print sum}'` shows < 400.

---

## Appendix A: File Impact Map

### High-Risk Files (touched in 3+ iterations)

| File | Iterations | Risk Level |
|------|-----------|------------|
| `src/ModernApp.tsx` | 4, 5, 6, 7, 8, 11, 14, 29, 32 | **CRITICAL** |
| `src/stores/vb6Store.ts` | 5, 6, 13, 14, 15, 32 | **CRITICAL** |
| `src/services/VB6Compiler.ts` | 3, 5, 22, 24, 25, 26, 27, 32 | **HIGH** |
| `src/components/Layout/MainContent.tsx` | 4, 5, 6, 7, 8, 12, 13 | **HIGH** |
| `src/context/VB6Context.tsx` | 3, 5, 14, 16, 25, 32 | **HIGH** |
| `src/hooks/useControlManipulation.ts` | 3, 15, 17, 18, 32 | **HIGH** |
| `src/context/types.ts` | 14, 15, 16 | **MEDIUM** |
| `src/compiler/index.ts` | 22, 23, 24, 25, 26, 28 | **MEDIUM** |

### Coordination Rules

1. **Never work on two iterations that share a CRITICAL file simultaneously**
2. **Always rebase before starting an iteration that touches a CRITICAL file**
3. **ModernApp.tsx changes**: Only one agent at a time, always rebase first
4. **vb6Store.ts changes**: Coordinate with other agents working on store state

---

## Appendix B: Metrics Tracking

Track these metrics after each phase completion:

| Metric | Baseline | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|--------|----------|---------|---------|---------|---------|---------|---------|
| .ts/.tsx file count | 743 | | | | | | |
| Component file count | 278 | | | | | | |
| `as any` count | 731 | | | | | | |
| `console.log` count | 1,719 | | | | | | |
| `aria-*` count | 25 | | | | | | |
| Build size (JS total) | 5.12 MB | | | | | | |
| index chunk (gzip) | 144 KB | | | | | | |
| Test file count | 80 | | | | | | |
| Type-check | PASS | | | | | | |
| Build | PASS | | | | | | |
| ModernApp.tsx LOC | 655 | | | | | | |
| vb6Store.ts LOC | 1,580 | | | | | | |
| useControlManipulation LOC | 576 | | | | | | |
| compiler/ file count | 48 | | | | | | |

---

## Appendix C: History from COLAB v2.0

### Completed Tasks (from v2.0, Jan 7 - Jan 20, 2026)

| Task ID | Description | Status | Date |
|---------|-------------|--------|------|
| TASK-001 | eval() secured (VB6CrystalReportsEngine, VB6COMActiveXBridge) | DONE | 2026-01-07 |
| TASK-004 | dangerouslySetInnerHTML secured with DOMPurify | DONE | 2026-01-07 |
| TASK-006 | LoggingService created (41 tests) | DONE | 2026-01-09 |
| TASK-007/008 | console.* migrated (190+ calls) | DONE | 2026-01-09 |
| TASK-009 | stores/ typed (38 any → 0) | DONE | 2026-01-10 |
| TASK-010 | context/ typed (25 any → 0) | DONE | 2026-01-10 |
| TASK-011 | hooks/ typed (28 any → 0) | DONE | 2026-01-10 |
| TASK-012/013 | services/ partially typed | DONE | 2026-01-13 |
| TASK-014 | .bak files deleted | DONE | 2026-01-13 |
| TASK-P1-001 | OptimizedVB6Store removed | DONE | 2026-01-20 |
| TASK-P1-002 | VB6COMActiveXBridge & VB6Debugger archived | DONE | 2026-01-20 |

### Audit Summary (Jan 20, 2026)

- 741 TypeScript files analyzed
- 286 React components (97% without tests, 45 > 500 LOC)
- 61 services (22% dead code = ~9,900 LOC)
- 298 `any` types remaining in services/
- 7 stores with critical state overlap
- 477 compiler tests passing, 1 test failing (modulePatches)

---

## Change Log

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-01-07 | 1.0 | Claude | Initial creation |
| 2026-01-20 | 2.0 | Claude Opus 4.5 | Full audit with 6 parallel agents, restructured 30 tasks |
| 2026-02-06 | 3.0 | Claude Opus 4.6 | Complete rewrite: 32 iterations in 6 phases, updated baseline metrics, collaboration protocol, file impact map |
