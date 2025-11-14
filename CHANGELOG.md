# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Logging System**: Centralized logger utility with log levels and remote logging support (`src/utils/logger.ts`)
- **GitHub Actions CI/CD**: Automated testing, linting, and deployment pipelines
  - CI workflow for testing, linting, type-checking, and builds
  - Deployment workflow for GitHub Pages
- **Test Coverage Reporting**: Vitest coverage configuration with v8 provider
  - Coverage reports in text, JSON, HTML, and LCOV formats
  - 60% coverage thresholds for lines, functions, branches, and statements
- **Code Splitting**: Lazy loading for Monaco Editor to reduce initial bundle size
  - `LazyMonacoEditor` component with Suspense boundary
  - Reduces initial bundle by ~10MB
- **Web Vitals Tracking**: Automatic performance monitoring
  - Tracks CLS, FID, FCP, LCP, TTFB, INP metrics
  - Development console logging with performance ratings
  - LocalStorage persistence for debugging
  - Google Analytics 4 integration support
- **Bundle Analyzer**: Rollup visualizer plugin for bundle size analysis
  - Generates interactive stats.html report
  - Shows gzip and brotli sizes
- **Vite Build Optimization**:
  - Manual chunk splitting for better caching
  - Separate bundles for React, Monaco, Zustand, and UI libraries
  - Source maps enabled for production debugging
  - Increased chunk size warning limit for monaco-editor
- **Development Tools**:
  - `.nvmrc` file for Node version management (20.18.0)
  - `.editorconfig` for consistent code formatting across editors
  - `.env.example`, `.env.development`, `.env.production` for environment configuration
  - TypeScript environment variable type definitions
- **Git Hooks**: Husky and lint-staged for pre-commit quality checks
  - Automatic ESLint fixing on staged files
  - Automatic Prettier formatting on staged files
- **Documentation**:
  - Comprehensive README.md with badges, features, and setup instructions
  - CONTRIBUTING.md with TypeScript best practices and guidelines
  - Environment variable documentation

### Changed

- **Monaco Editor**: Now lazy-loaded with React.lazy() and Suspense
- **Vite Configuration**: Enhanced with bundle analyzer and optimized chunk splitting
- **Vitest Configuration**: Added coverage provider and reporters
- **Package.json**: Added new scripts for coverage testing

### Fixed

- Infinite re-render loops by using shallow selectors in Zustand (previous commits)
- Maximum update depth exceeded errors (previous commits)

### Developer Experience

- Pre-commit hooks ensure code quality before commits
- Bundle analysis helps identify optimization opportunities
- Web Vitals tracking provides performance insights
- Comprehensive documentation improves onboarding

## [Previous Versions]

### Recent Commits (Before This Update)

- Fixed infinite re-render loops with shallow selectors
- Fixed maximum update depth exceeded errors
- Implemented drag-drop improvements
- Various bug fixes and enhancements

---

For a complete history, see the [commit history](https://github.com/phuetz/VB6/commits/main).
