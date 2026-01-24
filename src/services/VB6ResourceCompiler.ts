/**
 * VB6 Resource Compiler - RC Script to RES File Compiler
 * Compiles resource script files (.rc) into binary resource files (.res)
 * Compatible with VB6 resource compilation workflow
 */

import { 
  VB6ResourceManagerInstance,
  VB6ResourceType,
  VB6LanguageID,
  VB6MenuItem,
  VB6DialogResource,
  VB6DialogControl,
  VB6VersionResource
} from './VB6ResourceManager';

// Resource Compiler Constants
export const RC_CONSTANTS = {
  // Standard Windows Constants
  WS_OVERLAPPED: 0x00000000,
  WS_POPUP: 0x80000000,
  WS_CHILD: 0x40000000,
  WS_MINIMIZE: 0x20000000,
  WS_VISIBLE: 0x10000000,
  WS_DISABLED: 0x08000000,
  WS_CLIPSIBLINGS: 0x04000000,
  WS_CLIPCHILDREN: 0x02000000,
  WS_MAXIMIZE: 0x01000000,
  WS_CAPTION: 0x00C00000,
  WS_BORDER: 0x00800000,
  WS_DLGFRAME: 0x00400000,
  WS_VSCROLL: 0x00200000,
  WS_HSCROLL: 0x00100000,
  WS_SYSMENU: 0x00080000,
  WS_THICKFRAME: 0x00040000,
  WS_GROUP: 0x00020000,
  WS_TABSTOP: 0x00010000,
  WS_MINIMIZEBOX: 0x00020000,
  WS_MAXIMIZEBOX: 0x00010000,

  // Dialog Styles
  DS_ABSALIGN: 0x01,
  DS_SYSMODAL: 0x02,
  DS_LOCALEDIT: 0x20,
  DS_SETFONT: 0x40,
  DS_MODALFRAME: 0x80,
  DS_NOIDLEMSG: 0x100,
  DS_SETFOREGROUND: 0x200,
  DS_3DLOOK: 0x04,
  DS_FIXEDSYS: 0x08,
  DS_NOFAILCREATE: 0x10,
  DS_CONTROL: 0x0400,
  DS_CENTER: 0x0800,
  DS_CENTERMOUSE: 0x1000,
  DS_CONTEXTHELP: 0x2000,

  // Extended Styles
  WS_EX_DLGMODALFRAME: 0x00000001,
  WS_EX_NOPARENTNOTIFY: 0x00000004,
  WS_EX_TOPMOST: 0x00000008,
  WS_EX_ACCEPTFILES: 0x00000010,
  WS_EX_TRANSPARENT: 0x00000020,
  WS_EX_MDICHILD: 0x00000040,
  WS_EX_TOOLWINDOW: 0x00000080,
  WS_EX_WINDOWEDGE: 0x00000100,
  WS_EX_CLIENTEDGE: 0x00000200,
  WS_EX_CONTEXTHELP: 0x00000400,
  WS_EX_RIGHT: 0x00001000,
  WS_EX_LEFT: 0x00000000,
  WS_EX_RTLREADING: 0x00002000,
  WS_EX_LTRREADING: 0x00000000,
  WS_EX_LEFTSCROLLBAR: 0x00004000,
  WS_EX_RIGHTSCROLLBAR: 0x00000000,
  WS_EX_CONTROLPARENT: 0x00010000,
  WS_EX_STATICEDGE: 0x00020000,
  WS_EX_APPWINDOW: 0x00040000
};

// Resource Compilation Context
interface CompilationContext {
  includes: string[];
  defines: Map<string, string>;
  currentFile: string;
  lineNumber: number;
  errors: CompilationError[];
  warnings: CompilationWarning[];
}

interface CompilationError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

interface CompilationWarning extends CompilationError {
  severity: 'warning';
}

// Resource Parser Token Types
enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  EQUALS = 'EQUALS',
  PIPE = 'PIPE',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
  KEYWORD = 'KEYWORD'
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class VB6ResourceCompiler {
  private static instance: VB6ResourceCompiler;
  private context: CompilationContext;

  constructor() {
    this.context = {
      includes: [],
      defines: new Map(),
      currentFile: '',
      lineNumber: 1,
      errors: [],
      warnings: []
    };

    // Add standard defines
    this.context.defines.set('WINVER', '0x0400');
    this.context.defines.set('_WIN32_WINNT', '0x0400');
    this.context.defines.set('_WIN32_IE', '0x0400');
  }

  static getInstance(): VB6ResourceCompiler {
    if (!VB6ResourceCompiler.instance) {
      VB6ResourceCompiler.instance = new VB6ResourceCompiler();
    }
    return VB6ResourceCompiler.instance;
  }

  // Main compilation entry point
  async compileResourceScript(rcContent: string, filename: string = 'resources.rc'): Promise<{ success: boolean; errors: CompilationError[]; data?: ArrayBuffer }> {
    this.context.currentFile = filename;
    this.context.lineNumber = 1;
    this.context.errors = [];
    this.context.warnings = [];

    try {
      // Clear existing resources
      VB6ResourceManagerInstance.clearAllResources();

      // Tokenize the input
      const tokens = this.tokenize(rcContent);
      
      // Parse tokens into resource definitions
      await this.parseTokens(tokens);

      // Generate binary resource data
      if (this.context.errors.length === 0) {
        const data = await VB6ResourceManagerInstance.saveResourceFile();
        return {
          success: true,
          errors: this.context.errors,
          data
        };
      } else {
        return {
          success: false,
          errors: this.context.errors
        };
      }
    } catch (error) {
      this.context.errors.push({
        file: filename,
        line: this.context.lineNumber,
        column: 0,
        message: `Compilation failed: ${error}`,
        severity: 'error'
      });

      return {
        success: false,
        errors: this.context.errors
      };
    }
  }

  // Tokenizer
  private tokenize(content: string): Token[] {
    const tokens: Token[] = [];
    let line = 1;
    let column = 1;
    let i = 0;

    const keywords = new Set([
      'STRINGTABLE', 'MENU', 'DIALOG', 'DIALOGEX', 'ICON', 'CURSOR', 'BITMAP',
      'ACCELERATORS', 'RCDATA', 'VERSIONINFO', 'POPUP', 'MENUITEM', 'SEPARATOR',
      'CONTROL', 'DEFPUSHBUTTON', 'PUSHBUTTON', 'LTEXT', 'RTEXT', 'CTEXT',
      'EDITTEXT', 'LISTBOX', 'COMBOBOX', 'SCROLLBAR', 'GROUPBOX', 'CHECKBOX',
      'RADIOBUTTON', 'LANGUAGE', 'SUBLANGUAGE', 'BEGIN', 'END', 'FILEVERSION',
      'PRODUCTVERSION', 'FILEFLAGSMASK', 'FILEFLAGS', 'FILEOS', 'FILETYPE',
      'FILESUBTYPE', 'BLOCK', 'VALUE', 'STYLE', 'EXSTYLE', 'CAPTION', 'FONT',
      'CLASS', 'PRELOAD', 'LOADONCALL', 'FIXED', 'MOVEABLE', 'DISCARDABLE',
      'PURE', 'IMPURE', 'SHARED', 'NONSHARED', 'AUTO3DFACE', 'INACTIVE',
      'GRAYED', 'CHECKED', 'MENUBARBREAK', 'MENUBREAK', 'HELP'
    ]);

    while (i < content.length) {
      const char = content[i];

      // Skip whitespace (except newlines)
      if (char === ' ' || char === '\t' || char === '\r') {
        column++;
        i++;
        continue;
      }

      // Handle newlines
      if (char === '\n') {
        tokens.push({ type: TokenType.NEWLINE, value: '\n', line, column });
        line++;
        column = 1;
        i++;
        continue;
      }

      // Handle comments
      if (char === '/' && i + 1 < content.length) {
        if (content[i + 1] === '/') {
          // Single-line comment
          let comment = '';
          i += 2;
          while (i < content.length && content[i] !== '\n') {
            comment += content[i];
            i++;
          }
          tokens.push({ type: TokenType.COMMENT, value: comment, line, column });
          column += comment.length + 2;
          continue;
        } else if (content[i + 1] === '*') {
          // Multi-line comment
          let comment = '';
          i += 2;
          column += 2;
          while (i + 1 < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
            if (content[i] === '\n') {
              line++;
              column = 1;
            } else {
              column++;
            }
            comment += content[i];
            i++;
          }
          if (i + 1 < content.length) {
            i += 2; // Skip */
            column += 2;
          }
          tokens.push({ type: TokenType.COMMENT, value: comment, line, column });
          continue;
        }
      }

      // Handle preprocessor directives
      if (char === '#') {
        let directive = '';
        while (i < content.length && content[i] !== '\n') {
          directive += content[i];
          i++;
        }
        this.handlePreprocessorDirective(directive, line);
        column += directive.length;
        continue;
      }

      // Handle strings
      if (char === '"') {
        let str = '';
        i++; // Skip opening quote
        column++;
        while (i < content.length && content[i] !== '"') {
          if (content[i] === '\\' && i + 1 < content.length) {
            // Handle escape sequences
            i++;
            const escaped = content[i];
            switch (escaped) {
              case 'n': str += '\n'; break;
              case 'r': str += '\r'; break;
              case 't': str += '\t'; break;
              case '\\': str += '\\'; break;
              case '"': str += '"'; break;
              default: str += escaped; break;
            }
          } else {
            str += content[i];
          }
          i++;
          column++;
        }
        if (i < content.length) {
          i++; // Skip closing quote
          column++;
        }
        tokens.push({ type: TokenType.STRING, value: str, line, column: column - str.length - 2 });
        continue;
      }

      // Handle numbers
      if (char >= '0' && char <= '9') {
        let num = '';
        const startColumn = column;
        
        // Handle hex numbers
        if (char === '0' && i + 1 < content.length && (content[i + 1] === 'x' || content[i + 1] === 'X')) {
          num += content[i] + content[i + 1];
          i += 2;
          column += 2;
          while (i < content.length && /[0-9a-fA-F]/.test(content[i])) {
            num += content[i];
            i++;
            column++;
          }
        } else {
          // Handle decimal numbers
          while (i < content.length && /[0-9]/.test(content[i])) {
            num += content[i];
            i++;
            column++;
          }
        }
        
        tokens.push({ type: TokenType.NUMBER, value: num, line, column: startColumn });
        continue;
      }

      // Handle identifiers and keywords
      if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
        let identifier = '';
        const startColumn = column;
        while (i < content.length && (/[a-zA-Z0-9_]/.test(content[i]))) {
          identifier += content[i];
          i++;
          column++;
        }
        
        const tokenType = keywords.has(identifier.toUpperCase()) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
        tokens.push({ type: tokenType, value: identifier, line, column: startColumn });
        continue;
      }

      // Handle single-character tokens
      let tokenType: TokenType | null = null;
      switch (char) {
        case '{': tokenType = TokenType.LBRACE; break;
        case '}': tokenType = TokenType.RBRACE; break;
        case '(': tokenType = TokenType.LPAREN; break;
        case ')': tokenType = TokenType.RPAREN; break;
        case ',': tokenType = TokenType.COMMA; break;
        case ';': tokenType = TokenType.SEMICOLON; break;
        case '=': tokenType = TokenType.EQUALS; break;
        case '|': tokenType = TokenType.PIPE; break;
      }

      if (tokenType) {
        tokens.push({ type: tokenType, value: char, line, column });
        i++;
        column++;
        continue;
      }

      // Unknown character - skip with warning
      this.context.warnings.push({
        file: this.context.currentFile,
        line,
        column,
        message: `Unknown character: '${char}'`,
        severity: 'warning'
      });
      i++;
      column++;
    }

    tokens.push({ type: TokenType.EOF, value: '', line, column });
    return tokens;
  }

  // Token parser
  private async parseTokens(tokens: Token[]): Promise<void> {
    let i = 0;

    const peek = (offset: number = 0): Token => {
      const index = i + offset;
      return index < tokens.length ? tokens[index] : tokens[tokens.length - 1];
    };

    const consume = (expectedType?: TokenType): Token => {
      const token = tokens[i];
      if (expectedType && token.type !== expectedType) {
        this.addError(`Expected ${expectedType}, got ${token.type}`, token.line, token.column);
      }
      i++;
      return token;
    };

    const skipNewlines = () => {
      while (peek().type === TokenType.NEWLINE || peek().type === TokenType.COMMENT) {
        i++;
      }
    };

    while (i < tokens.length && peek().type !== TokenType.EOF) {
      skipNewlines();
      
      const token = peek();
      if (token.type === TokenType.EOF) break;

      // Handle resource definitions
      if (token.type === TokenType.IDENTIFIER || token.type === TokenType.NUMBER) {
        const resourceId = consume();
        skipNewlines();
        
        const resourceType = consume(TokenType.KEYWORD);
        skipNewlines();

        switch (resourceType.value.toUpperCase()) {
          case 'STRINGTABLE':
            await this.parseStringTable(tokens, i, peek, consume, skipNewlines);
            break;
          case 'MENU':
            await this.parseMenu(resourceId, tokens, i, peek, consume, skipNewlines);
            break;
          case 'DIALOG':
          case 'DIALOGEX':
            await this.parseDialog(resourceId, tokens, i, peek, consume, skipNewlines);
            break;
          case 'ICON':
            await this.parseIcon(resourceId, tokens, i, peek, consume, skipNewlines);
            break;
          case 'CURSOR':
            await this.parseCursor(resourceId, tokens, i, peek, consume, skipNewlines);
            break;
          case 'VERSIONINFO':
            await this.parseVersionInfo(tokens, i, peek, consume, skipNewlines);
            break;
          case 'RCDATA':
            await this.parseRCData(resourceId, tokens, i, peek, consume, skipNewlines);
            break;
          default:
            this.addError(`Unknown resource type: ${resourceType.value}`, resourceType.line, resourceType.column);
            // Skip to next resource
            while (peek().type !== TokenType.EOF && peek().type !== TokenType.IDENTIFIER && peek().type !== TokenType.NUMBER) {
              i++;
            }
            break;
        }
      } else {
        this.addError(`Unexpected token: ${token.value}`, token.line, token.column);
        i++;
      }
    }
  }

  // Parse string table
  private async parseStringTable(tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    skipNewlines();
    
    // Optional LANGUAGE clause
    if (peek().value.toUpperCase() === 'LANGUAGE') {
      consume();
      const langId = consume(TokenType.IDENTIFIER);
      skipNewlines();
      // TODO: Handle language ID
    }

    consume(TokenType.LBRACE);
    skipNewlines();

    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const stringId = consume(TokenType.NUMBER);
      skipNewlines();
      
      consume(TokenType.COMMA);
      skipNewlines();
      
      const stringValue = consume(TokenType.STRING);
      skipNewlines();

      // Add string resource
      VB6ResourceManagerInstance.addStringResource(
        parseInt(stringId.value),
        stringValue.value,
        VB6LanguageID.LANG_NEUTRAL,
        `String ${stringId.value}`
      );
    }

    consume(TokenType.RBRACE);
  }

  // Parse menu
  private async parseMenu(resourceId: Token, tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    const menuItems: VB6MenuItem[] = [];
    
    skipNewlines();
    consume(TokenType.LBRACE);
    skipNewlines();

    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const item = await this.parseMenuItem(tokens, currentIndex, peek, consume, skipNewlines);
      if (item) {
        menuItems.push(item);
      }
    }

    consume(TokenType.RBRACE);

    // Add menu resource
    VB6ResourceManagerInstance.addMenuResource(
      typeof resourceId.value === 'string' ? parseInt(resourceId.value) : parseInt(resourceId.value),
      menuItems,
      VB6LanguageID.LANG_NEUTRAL
    );
  }

  // Parse menu item
  private async parseMenuItem(tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<VB6MenuItem | null> {
    const token = peek();
    
    if (token.value.toUpperCase() === 'POPUP') {
      consume();
      const text = consume(TokenType.STRING);
      skipNewlines();
      
      consume(TokenType.LBRACE);
      skipNewlines();
      
      const children: VB6MenuItem[] = [];
      while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
        const child = await this.parseMenuItem(tokens, currentIndex, peek, consume, skipNewlines);
        if (child) {
          children.push(child);
        }
      }
      
      consume(TokenType.RBRACE);
      
      return {
        id: 0,
        text: text.value,
        enabled: true,
        checked: false,
        separator: false,
        popup: true,
        children
      };
    } else if (token.value.toUpperCase() === 'MENUITEM') {
      consume();
      
      if (peek().value.toUpperCase() === 'SEPARATOR') {
        consume();
        return {
          id: 0,
          text: '',
          enabled: false,
          checked: false,
          separator: true,
          popup: false
        };
      } else {
        const text = consume(TokenType.STRING);
        skipNewlines();
        
        consume(TokenType.COMMA);
        skipNewlines();
        
        const id = consume(TokenType.NUMBER);
        skipNewlines();
        
        return {
          id: parseInt(id.value),
          text: text.value,
          enabled: true,
          checked: false,
          separator: false,
          popup: false
        };
      }
    }
    
    return null;
  }

  // Parse dialog
  private async parseDialog(resourceId: Token, tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    // Parse dialog coordinates
    const x = consume(TokenType.NUMBER);
    consume(TokenType.COMMA);
    const y = consume(TokenType.NUMBER);
    consume(TokenType.COMMA);
    const width = consume(TokenType.NUMBER);
    consume(TokenType.COMMA);
    const height = consume(TokenType.NUMBER);
    skipNewlines();

    const dialog: VB6DialogResource = {
      id: parseInt(resourceId.value),
      title: '',
      x: parseInt(x.value),
      y: parseInt(y.value),
      width: parseInt(width.value),
      height: parseInt(height.value),
      style: RC_CONSTANTS.WS_POPUP | RC_CONSTANTS.WS_CAPTION | RC_CONSTANTS.WS_SYSMENU,
      exStyle: 0,
      controls: [],
      languageId: VB6LanguageID.LANG_NEUTRAL
    };

    // Parse optional clauses
    while (peek().type === TokenType.KEYWORD) {
      const keyword = consume().value.toUpperCase();
      
      switch (keyword) {
        case 'STYLE': {
          // Parse style value
          const styleToken = consume();
          dialog.style = this.parseStyleValue(styleToken.value);
          break;
        }
        case 'EXSTYLE': {
          const exStyleToken = consume();
          dialog.exStyle = this.parseStyleValue(exStyleToken.value);
          break;
        }
        case 'CAPTION': {
          const caption = consume(TokenType.STRING);
          dialog.title = caption.value;
          break;
        }
        case 'FONT': {
          const fontSize = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const fontName = consume(TokenType.STRING);
          dialog.font = {
            name: fontName.value,
            size: parseInt(fontSize.value),
            weight: 400,
            italic: false,
            charset: 0
          };
          break;
        }
      }
      skipNewlines();
    }

    consume(TokenType.LBRACE);
    skipNewlines();

    // Parse controls
    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const control = await this.parseDialogControl(tokens, currentIndex, peek, consume, skipNewlines);
      if (control) {
        dialog.controls.push(control);
      }
    }

    consume(TokenType.RBRACE);

    VB6ResourceManagerInstance.addDialogResource(dialog);
  }

  // Parse dialog control
  private async parseDialogControl(tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<VB6DialogControl | null> {
    const controlType = consume(TokenType.KEYWORD).value.toUpperCase();
    
    const text = consume(TokenType.STRING);
    consume(TokenType.COMMA);
    const id = consume(TokenType.NUMBER);
    consume(TokenType.COMMA);
    
    let className = '';
    let x = 0, y = 0, width = 0, height = 0;
    let style = 0;
    const exStyle = 0;

    if (controlType === 'CONTROL') {
      // Generic control
      className = consume(TokenType.STRING).value;
      consume(TokenType.COMMA);
      style = this.parseStyleValue(consume().value);
      consume(TokenType.COMMA);
      x = parseInt(consume(TokenType.NUMBER).value);
      consume(TokenType.COMMA);
      y = parseInt(consume(TokenType.NUMBER).value);
      consume(TokenType.COMMA);
      width = parseInt(consume(TokenType.NUMBER).value);
      consume(TokenType.COMMA);
      height = parseInt(consume(TokenType.NUMBER).value);
    } else {
      // Specific control type
      className = this.getControlClassName(controlType);
      style = this.getDefaultControlStyle(controlType);
      
      // Parse coordinates
      x = parseInt(consume(TokenType.NUMBER).value);
      consume(TokenType.COMMA);
      y = parseInt(consume(TokenType.NUMBER).value);
      consume(TokenType.COMMA);
      width = parseInt(consume(TokenType.NUMBER).value);
      consume(TokenType.COMMA);
      height = parseInt(consume(TokenType.NUMBER).value);
    }

    skipNewlines();

    return {
      id: parseInt(id.value),
      className,
      text: text.value,
      x,
      y,
      width,
      height,
      style,
      exStyle
    };
  }

  // Parse icon resource
  private async parseIcon(resourceId: Token, tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    const filename = consume(TokenType.STRING);
    
    // In a real implementation, would load the icon file
    // For now, create a placeholder
    const iconData = new ArrayBuffer(1024); // Placeholder
    
    VB6ResourceManagerInstance.addIconResource(
      parseInt(resourceId.value),
      iconData,
      32, 32, 32, false
    );
  }

  // Parse cursor resource
  private async parseCursor(resourceId: Token, tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    const filename = consume(TokenType.STRING);
    
    // In a real implementation, would load the cursor file
    const cursorData = new ArrayBuffer(1024); // Placeholder
    
    VB6ResourceManagerInstance.addIconResource(
      parseInt(resourceId.value),
      cursorData,
      32, 32, 32, true, 16, 16
    );
  }

  // Parse version info
  private async parseVersionInfo(tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    skipNewlines();
    
    const version: VB6VersionResource = {
      fileVersion: { major: 1, minor: 0, build: 0, revision: 0 },
      productVersion: { major: 1, minor: 0, build: 0, revision: 0 },
      fileFlagsMask: 0,
      fileFlags: 0,
      fileOS: 0x40004,
      fileType: 0x1,
      fileSubtype: 0,
      stringInfo: {}
    };

    consume(TokenType.LBRACE);
    skipNewlines();

    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const keyword = consume(TokenType.KEYWORD).value.toUpperCase();
      
      switch (keyword) {
        case 'FILEVERSION': {
          const fv1 = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const fv2 = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const fv3 = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const fv4 = consume(TokenType.NUMBER);
          
          version.fileVersion = {
            major: parseInt(fv1.value),
            minor: parseInt(fv2.value),
            build: parseInt(fv3.value),
            revision: parseInt(fv4.value)
          };
          break;
        }
          
        case 'PRODUCTVERSION': {
          const pv1 = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const pv2 = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const pv3 = consume(TokenType.NUMBER);
          consume(TokenType.COMMA);
          const pv4 = consume(TokenType.NUMBER);
          
          version.productVersion = {
            major: parseInt(pv1.value),
            minor: parseInt(pv2.value),
            build: parseInt(pv3.value),
            revision: parseInt(pv4.value)
          };
          break;
        }
          
        case 'BLOCK': {
          const blockName = consume(TokenType.STRING);
          skipNewlines();
          consume(TokenType.LBRACE);
          skipNewlines();
          
          while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
            if (peek().value.toUpperCase() === 'VALUE') {
              consume();
              const key = consume(TokenType.STRING);
              consume(TokenType.COMMA);
              const value = consume(TokenType.STRING);
              version.stringInfo[key.value] = value.value;
            } else {
              i++;
            }
            skipNewlines();
          }
          
          consume(TokenType.RBRACE);
          break;
        }
          
        default:
          // Skip unknown version info elements
          while (peek().type !== TokenType.NEWLINE && peek().type !== TokenType.EOF) {
            i++;
          }
      }
      
      skipNewlines();
    }

    consume(TokenType.RBRACE);
    
    VB6ResourceManagerInstance.setVersionResource(version);
  }

  // Parse RCDATA
  private async parseRCData(resourceId: Token, tokens: Token[], currentIndex: number, peek: () => Token, consume: (type?: TokenType) => Token, skipNewlines: () => void): Promise<void> {
    skipNewlines();
    
    // Simple RCDATA parsing - collect data until end
    const data: number[] = [];
    
    consume(TokenType.LBRACE);
    skipNewlines();
    
    while (peek().type !== TokenType.RBRACE && peek().type !== TokenType.EOF) {
      const token = consume();
      if (token.type === TokenType.NUMBER) {
        data.push(parseInt(token.value));
      } else if (token.type === TokenType.STRING) {
        // Convert string to bytes
        for (let i = 0; i < token.value.length; i++) {
          data.push(token.value.charCodeAt(i));
        }
      }
      
      if (peek().type === TokenType.COMMA) {
        consume(TokenType.COMMA);
      }
      skipNewlines();
    }
    
    consume(TokenType.RBRACE);
    
    // Create ArrayBuffer from data
    const buffer = new ArrayBuffer(data.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < data.length; i++) {
      view[i] = data[i];
    }
    
    VB6ResourceManagerInstance.addCustomResource(
      parseInt(resourceId.value),
      `RCDATA ${resourceId.value}`,
      buffer,
      VB6ResourceType.RT_RCDATA
    );
  }

  // Helper methods
  private handlePreprocessorDirective(directive: string, line: number): void {
    const trimmed = directive.trim();
    
    if (trimmed.startsWith('#include')) {
      const match = trimmed.match(/#include\s*[<"]([^>"]+)[>"]/) ;
      if (match) {
        this.context.includes.push(match[1]);
      }
    } else if (trimmed.startsWith('#define')) {
      const match = trimmed.match(/#define\s+(\w+)\s+(.+)/);
      if (match) {
        this.context.defines.set(match[1], match[2]);
      }
    }
  }

  private parseStyleValue(value: string): number {
    // Handle hex values
    if (value.startsWith('0x') || value.startsWith('0X')) {
      return parseInt(value, 16);
    }
    
    // Handle decimal values
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    // Handle symbolic constants
    const constantValue = (RC_CONSTANTS as any)[value];
    if (constantValue !== undefined) {
      return constantValue;
    }
    
    // Handle OR'd constants
    if (value.includes('|')) {
      return value.split('|')
        .map(part => this.parseStyleValue(part.trim()))
        .reduce((acc, val) => acc | val, 0);
    }
    
    return 0;
  }

  private getControlClassName(controlType: string): string {
    switch (controlType.toUpperCase()) {
      case 'PUSHBUTTON':
      case 'DEFPUSHBUTTON':
        return 'Button';
      case 'CHECKBOX':
      case 'RADIOBUTTON':
        return 'Button';
      case 'EDITTEXT':
        return 'Edit';
      case 'LTEXT':
      case 'RTEXT':
      case 'CTEXT':
        return 'Static';
      case 'LISTBOX':
        return 'ListBox';
      case 'COMBOBOX':
        return 'ComboBox';
      case 'SCROLLBAR':
        return 'ScrollBar';
      case 'GROUPBOX':
        return 'Button';
      default:
        return 'Static';
    }
  }

  private getDefaultControlStyle(controlType: string): number {
    switch (controlType.toUpperCase()) {
      case 'PUSHBUTTON':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_TABSTOP;
      case 'DEFPUSHBUTTON':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_TABSTOP;
      case 'CHECKBOX':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_TABSTOP;
      case 'RADIOBUTTON':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_TABSTOP;
      case 'EDITTEXT':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_BORDER | RC_CONSTANTS.WS_TABSTOP;
      case 'LTEXT':
      case 'RTEXT':
      case 'CTEXT':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE;
      case 'LISTBOX':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_BORDER | RC_CONSTANTS.WS_VSCROLL | RC_CONSTANTS.WS_TABSTOP;
      case 'COMBOBOX':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE | RC_CONSTANTS.WS_BORDER | RC_CONSTANTS.WS_VSCROLL | RC_CONSTANTS.WS_TABSTOP;
      case 'GROUPBOX':
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE;
      default:
        return RC_CONSTANTS.WS_CHILD | RC_CONSTANTS.WS_VISIBLE;
    }
  }

  private addError(message: string, line: number, column: number): void {
    this.context.errors.push({
      file: this.context.currentFile,
      line,
      column,
      message,
      severity: 'error'
    });
  }

  // Export compiled resources to various formats
  exportToVB6Project(): string {
    const resources = VB6ResourceManagerInstance.getAllResources();
    let output = '';
    
    // Generate resource references for VB6 project file
    if (resources.length > 0) {
      output += 'ResFile32="resources.res"\n';
    }
    
    // Add icon reference if exists
    const iconResource = resources.find(r => r.type === VB6ResourceType.RT_ICON);
    if (iconResource) {
      output += `IconForm="ICON:${iconResource.id}:0"\n`;
    }
    
    return output;
  }
}

// Global instance
export const VB6ResourceCompilerInstance = VB6ResourceCompiler.getInstance();

// VB6 Resource Compiler initialization logged by LoggingService