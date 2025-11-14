# Contributing to VB6 IDE Clone

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/VB6.git
   cd VB6
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📝 Development Guidelines

### TypeScript Best Practices

This project uses TypeScript with strict mode enabled. Follow these guidelines:

#### 1. Type Safety

- **Avoid `any`**: Use proper types instead of `any`

  ```typescript
  // ❌ Bad
  function process(data: any) {}

  // ✅ Good
  function process(data: Control[]) {}
  ```

- **Use type guards** for runtime checks:

  ```typescript
  function isControl(obj: unknown): obj is Control {
    return typeof obj === 'object' && obj !== null && 'type' in obj;
  }
  ```

- **Prefer interfaces over types** for object shapes:
  ```typescript
  // ✅ Good
  interface ControlProperties {
    name: string;
    type: string;
    x: number;
    y: number;
  }
  ```

#### 2. JSDoc Comments

Document all public functions, classes, and complex logic:

````typescript
/**
 * Creates a new control on the form designer
 *
 * @param type - The type of control to create (e.g., 'CommandButton')
 * @param position - The x,y coordinates for the control
 * @returns The newly created control instance
 *
 * @example
 * ```typescript
 * const button = createControl('CommandButton', { x: 100, y: 50 });
 * ```
 */
function createControl(type: ControlType, position: Position): Control {
  // Implementation
}
````

#### 3. Naming Conventions

- **PascalCase** for types, interfaces, classes, and React components

  ```typescript
  interface ControlProperties {}
  class VB6Compiler {}
  const MonacoEditor: React.FC = () => {};
  ```

- **camelCase** for variables, functions, and methods

  ```typescript
  const controlList = [];
  function updateControl() {}
  ```

- **UPPER_SNAKE_CASE** for constants
  ```typescript
  const MAX_ZOOM_LEVEL = 400;
  const DEFAULT_GRID_SIZE = 8;
  ```

#### 4. React Component Patterns

- Use **functional components** with hooks
- Type component props explicitly
- Use `React.FC` for components without children, or explicit props typing

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

#### 5. State Management

- Use Zustand selectors with shallow comparison:

  ```typescript
  import { shallow } from 'zustand/shallow';

  const { controls, selectedControls } = useVB6Store(
    state => ({
      controls: state.controls,
      selectedControls: state.selectedControls,
    }),
    shallow
  );
  ```

#### 6. Error Handling

- Use the logger utility instead of console.log:

  ```typescript
  import { logger } from '@/utils/logger';

  try {
    // Operation
  } catch (error) {
    logger.error('Failed to perform operation', error);
  }
  ```

### Code Style

- **Use EditorConfig**: The project includes `.editorconfig` for consistent formatting
- **Prettier**: Code is formatted with Prettier (runs on pre-commit)
- **ESLint**: Follow ESLint rules (runs on pre-commit)
- **Line Length**: Aim for max 100 characters per line
- **Indentation**: 2 spaces (configured in EditorConfig)

### Testing

- Write tests for new features
- Aim for at least 60% code coverage
- Use Vitest and React Testing Library

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(editor): add VB6 syntax highlighting
fix(designer): resolve control alignment issue
docs(readme): update installation instructions
```

## 🔄 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `npm test`
4. **Lint your code**: `npm run lint`
5. **Format your code**: `npm run format`
6. **Update README.md** with details of changes if applicable
7. **Create a Pull Request** with a clear description

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] TypeScript types are properly defined
```

## 🐛 Reporting Bugs

Use GitHub Issues with the following information:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Step-by-step guide
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**: Browser, OS, Node version

## 💡 Feature Requests

Use GitHub Issues with:

- **Use Case**: Why is this feature needed?
- **Description**: Detailed description
- **Examples**: Code examples or mockups
- **Alternatives**: Alternative solutions considered

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 📞 Questions?

- Open a GitHub Discussion
- Tag maintainers in issues
- Check existing documentation

Thank you for contributing! 🎉
