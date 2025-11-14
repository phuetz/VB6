# 🚀 Quick Reference Guide

Essential commands and information for working with the VB6 IDE Clone project.

---

## 📦 Essential Commands

### Development

```bash
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
```

### Testing

```bash
npm test                 # Run tests (watch mode)
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage report
```

### Code Quality

```bash
npm run lint             # Check with ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

---

## 🔧 Quick Setup

### First Time Setup

```bash
# 1. Clone and install
git clone https://github.com/phuetz/VB6.git
cd VB6
npm install

# 2. Set up environment
cp .env.example .env.local

# 3. Start developing
npm run dev
```

### Using Correct Node Version

```bash
nvm use  # Uses version from .nvmrc (20.18.0)
```

---

## 📊 New Features Quick Guide

### Logger Utility

```typescript
import { logger } from '@/utils/logger';

logger.debug('Debug info');
logger.info('General info');
logger.warn('Warning');
logger.error('Error message', error);
```

### Web Vitals

```typescript
// View stored metrics in browser console
localStorage.getItem('web-vitals');
```

### Bundle Analysis

```bash
npm run build
# Then open: dist/stats.html
```

---

## 📁 Important Files

| File                                         | Purpose                        |
| -------------------------------------------- | ------------------------------ |
| `src/utils/logger.ts`                        | Centralized logging            |
| `src/utils/reportWebVitals.ts`               | Performance tracking           |
| `src/components/Editor/LazyMonacoEditor.tsx` | Lazy-loaded editor             |
| `.env.example`                               | Environment variables template |
| `CONTRIBUTING.md`                            | Development guidelines         |
| `IMPROVEMENTS.md`                            | Detailed improvements doc      |

---

## 🎯 Pre-commit Hooks

Automatic on every commit:

- ✅ ESLint auto-fix
- ✅ Prettier formatting
- ⚠️ Commit fails if errors

To skip (not recommended):

```bash
git commit --no-verify
```

---

## 🌍 Environment Variables

### Development (.env.local)

```bash
VITE_ENABLE_WEB_VITALS=true
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Production

```bash
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_LOG_LEVEL=warn
```

---

## 📈 Performance Tips

### Bundle Size

- Main bundle: ~434 KB
- Monaco Editor: ~3.1 MB (lazy loaded)
- Total on code editor open: ~3.5 MB

### Optimization

- Monaco loads only when code editor opens
- Chunks split by vendor (React, UI libs, etc.)
- Source maps available for debugging

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Tests Fail

```bash
# Update snapshots
npm test -- -u
```

### Linter Errors

```bash
# Auto-fix most issues
npm run lint -- --fix
npm run format
```

### Pre-commit Hook Issues

```bash
# Reinstall husky
npm run prepare
```

---

## 🔗 Useful Links

- **CI/CD**: `.github/workflows/ci.yml`
- **Deploy**: `.github/workflows/deploy.yml`
- **Coverage**: `coverage/index.html` (after running tests)
- **Bundle Stats**: `dist/stats.html` (after building)

---

## 📞 Getting Help

1. Check `README.md` for detailed setup
2. Check `CONTRIBUTING.md` for dev guidelines
3. Check `IMPROVEMENTS.md` for feature details
4. Open GitHub issue for bugs
5. Open GitHub discussion for questions

---

## ✅ Quick Checklist

Before committing:

- [ ] Code linted (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Tests passing (`npm test`)
- [ ] Build successful (`npm run build`)

Before pushing:

- [ ] All commits have good messages
- [ ] Branch is up to date
- [ ] No sensitive data in commits

Before PR:

- [ ] All tests passing
- [ ] Coverage meets threshold (60%)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

---

**Happy Coding!** 🎉
