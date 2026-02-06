# Repository Guidelines

## Project Structure & Module Organization

- `src/`: React + TypeScript app (compiler, runtime, components, stores, hooks, utils). Key folders: `src/compiler/`, `src/runtime/`, `src/components/`, `src/stores/`, `src/test/`.
- `server/` and `src/server/`: Node helpers and dev utilities.
- `dist/`: build output (ignored by lint).
- `config/`, `docs/`, `scripts/`, `test-programs/`: configuration, documentation, helper scripts, and sample VB6 programs.

## Build, Test, and Development Commands

- `npm run dev`: start Vite dev server.
- `npm run build`: production build to `dist/`.
- `npm run preview`: preview built app locally.
- `npm run test`: run Vitest in watch/UI as configured.
- `npm run test:run`: run tests once in CI mode.
- `npm run test:coverage`: run tests with coverage.
- `npm run test:startup`: focused startup/integration suite.
- `npm run lint`: ESLint across the repo.
- `npm run format` / `format:check`: Prettier write/check.

## Coding Style & Naming Conventions

- Language: TypeScript + React 18.
- Formatting (Prettier): 2 spaces, semicolons, single quotes, width 100, LF, trailing commas (es5).
- Linting (ESLint): TS + React Hooks + React Refresh; `dist/` ignored; some TS strict rules relaxed (`no-explicit-any`, `no-unused-vars`).
- Naming: React components in `PascalCase` (e.g., `ModernApp.tsx`); utilities and scripts in `kebab-case` (e.g., `fix-infinite-loop.ts`).
- Imports: prefer relative within feature folders; group types last.

## Testing Guidelines

- Framework: Vitest + @testing-library.
- Location: `src/test/**` with domain subfolders.
- Naming: `*.test.ts` / `*.test.tsx` (unit), integration under `src/test/integration/`.
- Setup: see `src/test/setup.ts` for global config.
- Coverage: keep changes covered; verify with `npm run test:coverage`.

## Commit & Pull Request Guidelines

- Conventional Commits: `feat:`, `fix:`, `docs:`, etc. Use imperative mood; scope optional (e.g., `feat(runtime): ...`).
- PRs: clear description, link issues (`Closes #123`), include screenshots/GIFs for UI, note risks and rollbacks.
- Quality gates: ensure `lint`, `test:run`, and `build` pass locally.
- Docs: update relevant guides when behavior changes (e.g., `README.md`, `SECURITY_CONFIG_GUIDE.md`).

## Security & Configuration Tips

- Env: copy `.env.example` to `.env`; never commit secrets.
- Review `SECURITY_CONFIG_GUIDE.md` and Docker files for hardened setups.
- Validate large changes with `semantic_validation_test.cjs` or `validation_finale.cjs` when relevant.
