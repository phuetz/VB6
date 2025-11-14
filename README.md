# 🚀 Visual Basic 6 IDE Clone - Web Edition

[![CI](https://github.com/phuetz/VB6/actions/workflows/ci.yml/badge.svg)](https://github.com/phuetz/VB6/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, web-based recreation of the classic Visual Basic 6 IDE built with React, TypeScript, and Vite. Experience the nostalgia of VB6 development with modern web technologies.

## ✨ Features

### 🎨 Form Designer

- **Drag & Drop Canvas**: Intuitive visual form designer with 35+ VB6 controls
- **Advanced Layout Tools**: Multi-select, alignment, distribution, and snap-to-grid
- **Zoom Support**: 25% to 400% zoom levels with grid alignment
- **Undo/Redo**: Full history tracking for all design operations
- **Control Tree**: Hierarchical view of all form controls

### 📝 Code Editor

- **Monaco Editor Integration**: VS Code's powerful editor with lazy loading
- **VB6 Syntax Highlighting**: Complete VB6 language support
- **IntelliSense**: Auto-completion for VB6 keywords and functions
- **Code Snippets**: Built-in snippets for common VB6 patterns
- **Event Handlers**: Direct editing of control event procedures

### 🔧 VB6 Language Support

- **Lexer**: Full VB6 tokenization
- **Parser**: AST generation for VB6 code
- **Semantic Analyzer**: Type checking and validation
- **Transpiler**: VB6 to JavaScript conversion
- **Runtime**: VB6 function implementations (MsgBox, InputBox, etc.)

### 🛠️ Developer Tools

- **Project Explorer**: Manage forms and modules
- **Properties Window**: Edit control properties in real-time
- **Immediate Window**: Interactive REPL for VB6 code
- **Error List**: Track syntax and runtime errors
- **Code Analyzer**: Static analysis and suggestions
- **Refactoring Tools**: Rename, extract, and reorganize code
- **Breakpoint Manager**: Visual debugging support
- **Performance Monitor**: Track IDE and runtime performance

### 📦 35+ VB6 Controls

**General Controls**: CommandButton, Label, TextBox, Frame, CheckBox, OptionButton, ComboBox, ListBox, HScrollBar, VScrollBar, Timer, DriveListBox, DirListBox, FileListBox, Shape, Line, Image, Data, OLE

**ActiveX Controls**: PictureBox, ImageList, Toolbar, StatusBar, ProgressBar, TreeView, ListView, TabStrip, Slider, ImageCombo, Animation, UpDown, MonthView, DateTimePicker, FlatScrollBar, CoolBar, RichTextBox

## 🚀 Quick Start

### Prerequisites

- Node.js 20.18.0 or higher (use `.nvmrc` for version management)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/phuetz/VB6.git
   cd VB6
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📜 Available Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start development server with hot reload |
| `npm run build`         | Build for production with optimizations  |
| `npm run preview`       | Preview production build locally         |
| `npm test`              | Run tests in watch mode                  |
| `npm run test:ui`       | Open interactive test UI                 |
| `npm run test:coverage` | Generate test coverage report            |
| `npm run lint`          | Check code quality with ESLint           |
| `npm run format`        | Format code with Prettier                |
| `npm run format:check`  | Check code formatting                    |

## 🏗️ Architecture

### Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **State Management**: Zustand 5.0.6
- **Styling**: Tailwind CSS 3.4.1
- **Code Editor**: Monaco Editor 0.45.0
- **Drag & Drop**: @dnd-kit/core 6.3.1
- **Testing**: Vitest 1.6.1 with React Testing Library
- **Linting**: ESLint 9.9.1 with TypeScript ESLint
- **Formatting**: Prettier with EditorConfig

### Project Structure

```
VB6/
├── .github/workflows/    # CI/CD pipelines
├── .husky/              # Git hooks
├── docs/                # Documentation (French)
├── src/
│   ├── components/      # React components
│   │   ├── Designer/    # Form designer
│   │   ├── Editor/      # Code editor
│   │   ├── Layout/      # Menu, toolbar, status bar
│   │   ├── Panels/      # Toolbox, properties, explorer
│   │   └── ...
│   ├── context/         # React context providers
│   ├── stores/          # Zustand state management
│   ├── services/        # Compiler, debugger, file manager
│   ├── utils/           # Lexer, parser, transpiler, logger
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── test/            # Test suites
├── vite.config.ts       # Vite configuration with optimizations
├── vitest.config.ts     # Test configuration with coverage
└── package.json         # Dependencies and scripts
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Generate coverage report:

```bash
npm run test:coverage
```

View interactive test UI:

```bash
npm run test:ui
```

Coverage reports are generated in `./coverage/` directory.

## 🔍 Code Quality

This project uses multiple tools to ensure code quality:

- **ESLint**: Static code analysis
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting

Pre-commit hooks automatically run linting and formatting on staged files.

## 📊 Performance Optimization

### Code Splitting

- Monaco Editor is lazy-loaded to reduce initial bundle size
- Manual chunk splitting for better caching
- Vendor bundles separated by dependency

### Web Vitals Tracking

- Automatic tracking of Core Web Vitals (CLS, FID, FCP, LCP, TTFB, INP)
- Performance metrics stored in localStorage for debugging
- Development console logging with performance ratings

### Bundle Analysis

After building, view bundle stats:

```bash
npm run build
# Open dist/stats.html in your browser
```

## 🌍 Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
VITE_ENABLE_WEB_VITALS=true

# Debug Settings
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

## 🚢 Deployment

### GitHub Pages

Automatic deployment is configured via GitHub Actions. Push to `main` branch to trigger deployment.

### Manual Deployment

```bash
npm run build
# Deploy the dist/ directory to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

- Follow the EditorConfig settings
- Ensure tests pass before committing
- Lint and format your code
- Write meaningful commit messages

## 📝 Documentation

Additional documentation is available in the `docs/` directory:

- [Form Designer Guide](docs/designer-guide.md)
- [French Documentation](docs/) (Various guides in French)

## 🐛 Known Issues

- Some VB6 features are not fully implemented (see transpiler limitations)
- Monaco Editor bundle is large (~10MB) - lazy loading helps but initial load on code editor is slow
- npm audit shows some moderate vulnerabilities in dev dependencies

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Monaco Editor team for the excellent code editor
- Visual Basic 6 for the inspiration
- React and Vite communities for amazing tools

## 📮 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/phuetz/VB6/issues)
- **Discussions**: [GitHub Discussions](https://github.com/phuetz/VB6/discussions)

---

Made with ❤️ using React and TypeScript
