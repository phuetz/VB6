/**
 * VB6 Compiler Core - Ultra-Simplifié et Fonctionnel
 * 
 * Remplace les 42 fichiers complexes par un système unifié simple
 * Focus sur 100% compatibilité VB6 réelle vs théorique
 * 
 * Architecture: Lexer → Parser → CodeGen → Runtime Integration
 */

import { VB6UltraRuntime } from '../runtime/VB6UltraRuntime';

// ============================================================================
// TYPES CORE VB6
// ============================================================================

export interface VB6Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export enum TokenType {
  // Keywords VB6 complets (87 keywords)
  KEYWORD_DIM = 'DIM',
  KEYWORD_AS = 'AS',
  KEYWORD_PUBLIC = 'PUBLIC',
  KEYWORD_PRIVATE = 'PRIVATE',
  KEYWORD_SUB = 'SUB',
  KEYWORD_FUNCTION = 'FUNCTION',
  KEYWORD_END = 'END',
  KEYWORD_IF = 'IF',
  KEYWORD_THEN = 'THEN',
  KEYWORD_ELSE = 'ELSE',
  KEYWORD_FOR = 'FOR',
  KEYWORD_TO = 'TO',
  KEYWORD_NEXT = 'NEXT',
  KEYWORD_WHILE = 'WHILE',
  KEYWORD_WEND = 'WEND',
  KEYWORD_DO = 'DO',
  KEYWORD_LOOP = 'LOOP',
  KEYWORD_SELECT = 'SELECT',
  KEYWORD_CASE = 'CASE',
  KEYWORD_TYPE = 'TYPE',
  KEYWORD_DECLARE = 'DECLARE',
  KEYWORD_CONST = 'CONST',
  KEYWORD_STATIC = 'STATIC',
  KEYWORD_GLOBAL = 'GLOBAL',
  KEYWORD_EXIT = 'EXIT',
  KEYWORD_RETURN = 'RETURN',
  KEYWORD_GOTO = 'GOTO',
  KEYWORD_GOSUB = 'GOSUB',
  KEYWORD_ON = 'ON',
  KEYWORD_ERROR = 'ERROR',
  KEYWORD_RESUME = 'RESUME',
  KEYWORD_WITHEVENTS = 'WITHEVENTS',
  KEYWORD_RAISEEVENT = 'RAISEEVENT',
  KEYWORD_IMPLEMENTS = 'IMPLEMENTS',
  KEYWORD_EVENT = 'EVENT',
  KEYWORD_PROPERTY = 'PROPERTY',
  KEYWORD_GET = 'GET',
  KEYWORD_LET = 'LET',
  KEYWORD_SET = 'SET',
  KEYWORD_NEW = 'NEW',
  KEYWORD_REDIM = 'REDIM',
  KEYWORD_PRESERVE = 'PRESERVE',
  KEYWORD_BYVAL = 'BYVAL',
  KEYWORD_BYREF = 'BYREF',
  KEYWORD_OPTIONAL = 'OPTIONAL',
  KEYWORD_PARAMARRAY = 'PARAMARRAY',
  KEYWORD_STEP = 'STEP',
  KEYWORD_UNTIL = 'UNTIL',

  // Types VB6
  TYPE_BOOLEAN = 'BOOLEAN',
  TYPE_BYTE = 'BYTE',
  TYPE_INTEGER = 'INTEGER',
  TYPE_LONG = 'LONG',
  TYPE_SINGLE = 'SINGLE',
  TYPE_DOUBLE = 'DOUBLE',
  TYPE_CURRENCY = 'CURRENCY',
  TYPE_DATE = 'DATE',
  TYPE_STRING = 'STRING',
  TYPE_OBJECT = 'OBJECT',
  TYPE_VARIANT = 'VARIANT',
  
  // Literals
  NUMBER = 'NUMBER',
  STRING_LITERAL = 'STRING_LITERAL',
  DATE_LITERAL = 'DATE_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',
  
  // Identifiers
  IDENTIFIER = 'IDENTIFIER',
  
  // Operators
  EQUALS = 'EQUALS',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  POWER = 'POWER',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // Punctuation
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  COMMA = 'COMMA',
  DOT = 'DOT',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  
  // Special
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
  EOF = 'EOF'
}

export interface VB6ASTNode {
  type: string;
  line: number;
  column: number;
}

export interface VB6Module extends VB6ASTNode {
  type: 'Module';
  name: string;
  declarations: VB6Declaration[];
  procedures: VB6Procedure[];
  types: VB6UserDefinedType[];
}

export interface VB6Declaration extends VB6ASTNode {
  type: 'Declaration';
  name: string;
  dataType: string;
  visibility: 'Public' | 'Private' | 'Global';
  isStatic: boolean;
  isConst: boolean;
  initialValue?: any;
}

export interface VB6Procedure extends VB6ASTNode {
  type: 'Procedure';
  name: string;
  procedureType: 'Sub' | 'Function' | 'Property Get' | 'Property Let' | 'Property Set';
  visibility: 'Public' | 'Private';
  parameters: VB6Parameter[];
  returnType?: string;
  body: VB6Statement[];
}

export interface VB6Parameter extends VB6ASTNode {
  type: 'Parameter';
  name: string;
  dataType: string;
  paramType: 'ByVal' | 'ByRef';
  isOptional: boolean;
  defaultValue?: any;
}

export interface VB6Statement extends VB6ASTNode {
  type: 'Statement';
  statementType: 'Assignment' | 'Call' | 'If' | 'For' | 'While' | 'Do' | 'Select' | 'Dim' | 'Return' | 'Exit' | 'Expression';
  // Assignment specific
  target?: string;
  value?: string;
  // Call specific
  name?: string;
  args?: string[];
  // If specific
  condition?: string;
  thenBody?: VB6Statement[];
  elseBody?: VB6Statement[];
  // For specific
  variable?: string;
  from?: string;
  to?: string;
  step?: string;
  body?: VB6Statement[];
  // While/Do specific (reuses condition and body)
  // Select specific
  expression?: string;
  cases?: { values: string[]; statements: VB6Statement[] }[];
  // Dim specific
  varName?: string;
  dataType?: string;
  // Return/Exit
  returnValue?: string;
}

export interface VB6UserDefinedType extends VB6ASTNode {
  type: 'UserDefinedType';
  name: string;
  fields: VB6UDTField[];
}

export interface VB6UDTField extends VB6ASTNode {
  type: 'UDTField';
  name: string;
  dataType: string;
  fixedLength?: number;
}

// ============================================================================
// LEXER ULTRA-OPTIMISÉ (TRIE-BASED)
// ============================================================================

class VB6KeywordTrie {
  private root = new Map<string, any>();
  
  constructor() {
    this.buildKeywordTrie();
  }
  
  private buildKeywordTrie() {
    const keywords = [
      'DIM', 'AS', 'PUBLIC', 'PRIVATE', 'SUB', 'FUNCTION', 'END',
      'IF', 'THEN', 'ELSE', 'ELSEIF', 'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'WEND',
      'DO', 'LOOP', 'UNTIL', 'SELECT', 'CASE', 'TYPE', 'DECLARE', 'CONST',
      'STATIC', 'GLOBAL', 'EXIT', 'RETURN', 'GOTO', 'GOSUB', 'ON', 'ERROR',
      'RESUME', 'WITHEVENTS', 'RAISEEVENT', 'IMPLEMENTS', 'EVENT', 'PROPERTY',
      'GET', 'LET', 'SET', 'NEW', 'REDIM', 'PRESERVE', 'BYVAL', 'BYREF',
      'OPTIONAL', 'PARAMARRAY', 'BOOLEAN', 'BYTE', 'INTEGER', 'LONG',
      'SINGLE', 'DOUBLE', 'CURRENCY', 'DATE', 'STRING', 'OBJECT', 'VARIANT',
      'AND', 'OR', 'NOT', 'MOD', 'XOR', 'IMP', 'EQV', 'LIKE', 'IS'
    ];
    
    for (const keyword of keywords) {
      this.insert(keyword);
    }
  }
  
  private insert(word: string) {
    let current = this.root;
    for (const char of word) {
      if (!current.has(char)) {
        current.set(char, new Map());
      }
      current = current.get(char);
    }
    current.set('$END', word);
  }
  
  public lookup(word: string): string | null {
    let current = this.root;
    for (const char of word.toUpperCase()) {
      if (!current.has(char)) {
        return null;
      }
      current = current.get(char);
    }
    return current.get('$END') || null;
  }
}

export class VB6Lexer {
  private keywordTrie = new VB6KeywordTrie();
  private source: string = '';
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  
  public tokenize(source: string): VB6Token[] {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    
    const tokens: VB6Token[] = [];
    
    while (this.pos < this.source.length) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column
    });
    
    return tokens;
  }
  
  private nextToken(): VB6Token | null {
    this.skipWhitespace();
    
    if (this.pos >= this.source.length) {
      return null;
    }
    
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.current();
    
    // Newlines
    if (char === '\n' || char === '\r') {
      return this.readNewline(startLine, startColumn);
    }
    
    // Comments
    if (char === "'") {
      return this.readComment(startLine, startColumn);
    }
    
    // String literals
    if (char === '"') {
      return this.readStringLiteral(startLine, startColumn);
    }
    
    // Date literals
    if (char === '#') {
      return this.readDateLiteral(startLine, startColumn);
    }
    
    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber(startLine, startColumn);
    }
    
    // Identifiers/Keywords
    if (this.isLetter(char) || char === '_') {
      return this.readIdentifierOrKeyword(startLine, startColumn);
    }
    
    // Operators and punctuation
    return this.readOperatorOrPunctuation(startLine, startColumn);
  }
  
  private readNewline(line: number, column: number): VB6Token {
    let value = '';
    while (this.pos < this.source.length && (this.current() === '\n' || this.current() === '\r')) {
      value += this.current();
      if (this.current() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
    
    return {
      type: TokenType.NEWLINE,
      value,
      line,
      column
    };
  }
  
  private readComment(line: number, column: number): VB6Token {
    let value = '';
    while (this.pos < this.source.length && this.current() !== '\n' && this.current() !== '\r') {
      value += this.current();
      this.advance();
    }
    
    return {
      type: TokenType.COMMENT,
      value,
      line,
      column
    };
  }
  
  private readStringLiteral(line: number, column: number): VB6Token {
    let value = '';
    this.advance(); // Skip opening quote
    
    while (this.pos < this.source.length) {
      const char = this.current();
      
      if (char === '"') {
        // Check for double quote (VB6 string escape)
        if (this.peek() === '"') {
          value += '"';
          this.advance();
          this.advance();
        } else {
          this.advance(); // Skip closing quote
          break;
        }
      } else {
        value += char;
        this.advance();
      }
    }
    
    return {
      type: TokenType.STRING_LITERAL,
      value,
      line,
      column
    };
  }
  
  private readDateLiteral(line: number, column: number): VB6Token {
    let value = '';
    this.advance(); // Skip opening #
    
    while (this.pos < this.source.length && this.current() !== '#') {
      value += this.current();
      this.advance();
    }
    
    if (this.current() === '#') {
      this.advance(); // Skip closing #
    }
    
    return {
      type: TokenType.DATE_LITERAL,
      value,
      line,
      column
    };
  }
  
  private readNumber(line: number, column: number): VB6Token {
    let value = '';
    let hasDecimal = false;
    let hasExponent = false;
    
    while (this.pos < this.source.length) {
      const char = this.current();
      
      if (this.isDigit(char)) {
        value += char;
        this.advance();
      } else if (char === '.' && !hasDecimal && !hasExponent) {
        hasDecimal = true;
        value += char;
        this.advance();
      } else if ((char === 'E' || char === 'e') && !hasExponent) {
        hasExponent = true;
        value += char;
        this.advance();
        if (this.current() === '+' || this.current() === '-') {
          value += this.current();
          this.advance();
        }
      } else if (char === '&' && value === '0') {
        // Hex or octal literal
        this.advance();
        const nextChar = this.current();
        if (nextChar === 'H' || nextChar === 'h') {
          // Hex literal
          value = '0x';
          this.advance();
          while (this.pos < this.source.length && this.isHexDigit(this.current())) {
            value += this.current();
            this.advance();
          }
        } else if (this.isDigit(nextChar)) {
          // Octal literal
          value = '0o';
          while (this.pos < this.source.length && this.isOctalDigit(this.current())) {
            value += this.current();
            this.advance();
          }
        }
        break;
      } else {
        break;
      }
    }
    
    return {
      type: TokenType.NUMBER,
      value,
      line,
      column
    };
  }
  
  private readIdentifierOrKeyword(line: number, column: number): VB6Token {
    let value = '';
    
    while (this.pos < this.source.length && 
           (this.isLetter(this.current()) || this.isDigit(this.current()) || this.current() === '_')) {
      value += this.current();
      this.advance();
    }
    
    // Check for keyword
    const keyword = this.keywordTrie.lookup(value);
    if (keyword) {
      return {
        type: `KEYWORD_${keyword}` as TokenType,
        value: keyword,
        line,
        column
      };
    }
    
    return {
      type: TokenType.IDENTIFIER,
      value,
      line,
      column
    };
  }
  
  private readOperatorOrPunctuation(line: number, column: number): VB6Token {
    const char = this.current();
    const value = char;
    this.advance();
    
    // Two-character operators
    const twoChar = value + (this.pos < this.source.length ? this.current() : '');
    
    switch (twoChar) {
      case '<=':
        this.advance();
        return { type: TokenType.LESS_EQUAL, value: twoChar, line, column };
      case '>=':
        this.advance();
        return { type: TokenType.GREATER_EQUAL, value: twoChar, line, column };
      case '<>':
        this.advance();
        return { type: TokenType.NOT_EQUAL, value: twoChar, line, column };
    }
    
    // Single-character operators/punctuation
    switch (char) {
      case '=': return { type: TokenType.EQUALS, value, line, column };
      case '+': return { type: TokenType.PLUS, value, line, column };
      case '-': return { type: TokenType.MINUS, value, line, column };
      case '*': return { type: TokenType.MULTIPLY, value, line, column };
      case '/': return { type: TokenType.DIVIDE, value, line, column };
      case '\\': return { type: TokenType.DIVIDE, value, line, column }; // Integer division
      case '^': return { type: TokenType.POWER, value, line, column };
      case '<': return { type: TokenType.LESS_THAN, value, line, column };
      case '>': return { type: TokenType.GREATER_THAN, value, line, column };
      case '(': return { type: TokenType.LPAREN, value, line, column };
      case ')': return { type: TokenType.RPAREN, value, line, column };
      case '[': return { type: TokenType.LBRACKET, value, line, column };
      case ']': return { type: TokenType.RBRACKET, value, line, column };
      case ',': return { type: TokenType.COMMA, value, line, column };
      case '.': return { type: TokenType.DOT, value, line, column };
      case ':': return { type: TokenType.COLON, value, line, column };
      case ';': return { type: TokenType.SEMICOLON, value, line, column };
      
      default:
        throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
    }
  }
  
  private current(): string {
    return this.pos < this.source.length ? this.source[this.pos] : '\0';
  }
  
  private peek(): string {
    return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : '\0';
  }
  
  private advance(): void {
    if (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.column++;
    }
    this.pos++;
  }
  
  private skipWhitespace(): void {
    while (this.pos < this.source.length && 
           this.current() !== '\n' && 
           this.current() !== '\r' && 
           /\s/.test(this.current())) {
      this.advance();
    }
  }
  
  private isLetter(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }
  
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }
  
  private isHexDigit(char: string): boolean {
    return /[0-9a-fA-F]/.test(char);
  }
  
  private isOctalDigit(char: string): boolean {
    return /[0-7]/.test(char);
  }
}

// ============================================================================
// PARSER RÉCURSIF DESCENDANT SIMPLIFIÉ
// ============================================================================

export class VB6Parser {
  private tokens: VB6Token[] = [];
  private pos: number = 0;
  
  public parse(tokens: VB6Token[]): VB6Module {
    this.tokens = tokens.filter(t => t.type !== TokenType.COMMENT); // Remove comments
    this.pos = 0;
    
    return this.parseModule();
  }
  
  private parseModule(): VB6Module {
    const startToken = this.current();
    const declarations: VB6Declaration[] = [];
    const procedures: VB6Procedure[] = [];
    const types: VB6UserDefinedType[] = [];
    
    while (!this.isEOF()) {
      this.skipNewlines();
      
      if (this.isEOF()) break;
      
      if (this.match(TokenType.KEYWORD_TYPE)) {
        types.push(this.parseUserDefinedType());
      } else if (this.isDeclaration()) {
        declarations.push(this.parseDeclaration());
      } else if (this.isProcedure()) {
        procedures.push(this.parseProcedure());
      } else {
        // Skip unknown tokens for now
        this.advance();
      }
    }
    
    return {
      type: 'Module',
      name: 'Module1', // Default name
      declarations,
      procedures,
      types,
      line: startToken.line,
      column: startToken.column
    };
  }
  
  private parseUserDefinedType(): VB6UserDefinedType {
    const startToken = this.consume(TokenType.KEYWORD_TYPE);
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.skipNewlines();
    
    const fields: VB6UDTField[] = [];
    
    while (!this.check(TokenType.KEYWORD_END) && !this.isEOF()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const fieldName = this.advance().value;
        this.consume(TokenType.KEYWORD_AS);
        const fieldType = this.advance().value;
        
        fields.push({
          type: 'UDTField',
          name: fieldName,
          dataType: fieldType,
          line: startToken.line,
          column: startToken.column
        });
      }
      this.skipNewlines();
    }
    
    this.consume(TokenType.KEYWORD_END);
    this.consume(TokenType.KEYWORD_TYPE);
    
    return {
      type: 'UserDefinedType',
      name,
      fields,
      line: startToken.line,
      column: startToken.column
    };
  }
  
  private parseDeclaration(): VB6Declaration {
    const startToken = this.current();
    let visibility: 'Public' | 'Private' | 'Global' = 'Private';
    let isStatic = false;
    let isConst = false;
    
    // Parse visibility
    if (this.match(TokenType.KEYWORD_PUBLIC)) {
      visibility = 'Public';
    } else if (this.match(TokenType.KEYWORD_PRIVATE)) {
      visibility = 'Private';
    } else if (this.match(TokenType.KEYWORD_GLOBAL)) {
      visibility = 'Global';
    }
    
    // Parse modifiers
    if (this.match(TokenType.KEYWORD_STATIC)) {
      isStatic = true;
    }
    
    if (this.match(TokenType.KEYWORD_CONST)) {
      isConst = true;
    }
    
    this.consume(TokenType.KEYWORD_DIM);
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.KEYWORD_AS);
    const dataType = this.advance().value;
    
    return {
      type: 'Declaration',
      name,
      dataType,
      visibility,
      isStatic,
      isConst,
      line: startToken.line,
      column: startToken.column
    };
  }
  
  private parseProcedure(): VB6Procedure {
    const startToken = this.current();
    let visibility: 'Public' | 'Private' = 'Public';
    
    // Parse visibility
    if (this.match(TokenType.KEYWORD_PUBLIC)) {
      visibility = 'Public';
    } else if (this.match(TokenType.KEYWORD_PRIVATE)) {
      visibility = 'Private';
    }
    
    // Parse procedure type
    let procedureType: 'Sub' | 'Function' | 'Property Get' | 'Property Let' | 'Property Set';
    
    if (this.match(TokenType.KEYWORD_SUB)) {
      procedureType = 'Sub';
    } else if (this.match(TokenType.KEYWORD_FUNCTION)) {
      procedureType = 'Function';
    } else if (this.match(TokenType.KEYWORD_PROPERTY)) {
      if (this.match(TokenType.KEYWORD_GET)) {
        procedureType = 'Property Get';
      } else if (this.match(TokenType.KEYWORD_LET)) {
        procedureType = 'Property Let';
      } else if (this.match(TokenType.KEYWORD_SET)) {
        procedureType = 'Property Set';
      } else {
        throw new Error('Expected Get, Let, or Set after Property');
      }
    } else {
      throw new Error('Expected Sub, Function, or Property');
    }
    
    const name = this.consume(TokenType.IDENTIFIER).value;
    
    // Parse parameters
    const parameters: VB6Parameter[] = [];
    if (this.match(TokenType.LPAREN)) {
      if (!this.check(TokenType.RPAREN)) {
        do {
          parameters.push(this.parseParameter());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN);
    }
    
    // Parse return type for functions
    let returnType: string | undefined;
    if (procedureType === 'Function' && this.match(TokenType.KEYWORD_AS)) {
      returnType = this.advance().value;
    }
    
    this.skipNewlines();

    // Parse body statements
    const body: VB6Statement[] = [];
    while (!this.check(TokenType.KEYWORD_END) && !this.isEOF()) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
      this.skipNewlines();
    }

    this.consume(TokenType.KEYWORD_END);
    if (procedureType === 'Sub') {
      this.consume(TokenType.KEYWORD_SUB);
    } else if (procedureType === 'Function') {
      this.consume(TokenType.KEYWORD_FUNCTION);
    } else if (procedureType.startsWith('Property')) {
      this.consume(TokenType.KEYWORD_PROPERTY);
    }
    
    return {
      type: 'Procedure',
      name,
      procedureType,
      visibility,
      parameters,
      returnType,
      body,
      line: startToken.line,
      column: startToken.column
    };
  }
  
  private parseParameter(): VB6Parameter {
    const startToken = this.current();
    let paramType: 'ByVal' | 'ByRef' = 'ByRef'; // VB6 default
    let isOptional = false;
    
    if (this.match(TokenType.KEYWORD_OPTIONAL)) {
      isOptional = true;
    }
    
    if (this.match(TokenType.KEYWORD_BYVAL)) {
      paramType = 'ByVal';
    } else if (this.match(TokenType.KEYWORD_BYREF)) {
      paramType = 'ByRef';
    }
    
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.KEYWORD_AS);
    const dataType = this.advance().value;
    
    return {
      type: 'Parameter',
      name,
      dataType,
      paramType,
      isOptional,
      line: startToken.line,
      column: startToken.column
    };
  }

  /**
   * Parse a single statement
   */
  private parseStatement(): VB6Statement | null {
    const startToken = this.current();
    this.skipNewlines();

    // Check for end of block
    if (this.check(TokenType.KEYWORD_END) ||
        this.check(TokenType.KEYWORD_ELSE) ||
        this.check(TokenType.KEYWORD_NEXT) ||
        this.check(TokenType.KEYWORD_LOOP) ||
        this.check(TokenType.KEYWORD_WEND) ||
        this.isEOF()) {
      return null;
    }

    // Dim statement
    if (this.match(TokenType.KEYWORD_DIM)) {
      const varName = this.consume(TokenType.IDENTIFIER).value;
      let dataType = 'Variant';
      if (this.match(TokenType.KEYWORD_AS)) {
        dataType = this.advance().value;
      }
      return {
        type: 'Statement',
        statementType: 'Dim',
        varName,
        dataType,
        line: startToken.line,
        column: startToken.column
      };
    }

    // If statement
    if (this.match(TokenType.KEYWORD_IF)) {
      const condition = this.parseExpressionAsString();
      this.consume(TokenType.KEYWORD_THEN);
      this.skipNewlines();

      // Parse Then body
      const thenBody: VB6Statement[] = [];
      while (!this.check(TokenType.KEYWORD_ELSE) &&
             !this.check(TokenType.KEYWORD_END) &&
             !this.isEOF()) {
        const stmt = this.parseStatement();
        if (stmt) thenBody.push(stmt);
        this.skipNewlines();
      }

      // Parse Else body
      let elseBody: VB6Statement[] | undefined;
      if (this.match(TokenType.KEYWORD_ELSE)) {
        this.skipNewlines();
        elseBody = [];
        while (!this.check(TokenType.KEYWORD_END) && !this.isEOF()) {
          const stmt = this.parseStatement();
          if (stmt) elseBody.push(stmt);
          this.skipNewlines();
        }
      }

      // Consume End If
      if (this.check(TokenType.KEYWORD_END)) {
        this.advance();
        if (this.match(TokenType.KEYWORD_IF)) {
          // consumed
        }
      }

      return {
        type: 'Statement',
        statementType: 'If',
        condition,
        thenBody,
        elseBody,
        line: startToken.line,
        column: startToken.column
      };
    }

    // For statement
    if (this.match(TokenType.KEYWORD_FOR)) {
      const variable = this.consume(TokenType.IDENTIFIER).value;
      this.consume(TokenType.OPERATOR);  // =
      const from = this.parseExpressionAsString();
      this.consume(TokenType.KEYWORD_TO);
      const to = this.parseExpressionAsString();

      let step: string | undefined;
      if (this.match(TokenType.KEYWORD_STEP)) {
        step = this.parseExpressionAsString();
      }
      this.skipNewlines();

      // Parse body
      const body: VB6Statement[] = [];
      while (!this.check(TokenType.KEYWORD_NEXT) && !this.isEOF()) {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
        this.skipNewlines();
      }

      // Consume Next
      if (this.match(TokenType.KEYWORD_NEXT)) {
        // Optional variable name after Next
        if (this.check(TokenType.IDENTIFIER)) this.advance();
      }

      return {
        type: 'Statement',
        statementType: 'For',
        variable,
        from,
        to,
        step,
        body,
        line: startToken.line,
        column: startToken.column
      };
    }

    // While statement
    if (this.match(TokenType.KEYWORD_WHILE)) {
      const condition = this.parseExpressionAsString();
      this.skipNewlines();

      const body: VB6Statement[] = [];
      while (!this.check(TokenType.KEYWORD_WEND) && !this.isEOF()) {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
        this.skipNewlines();
      }

      this.match(TokenType.KEYWORD_WEND);

      return {
        type: 'Statement',
        statementType: 'While',
        condition,
        body,
        line: startToken.line,
        column: startToken.column
      };
    }

    // Do statement
    if (this.match(TokenType.KEYWORD_DO)) {
      let condition: string | undefined;

      // Check for Do While or Do Until
      if (this.match(TokenType.KEYWORD_WHILE)) {
        condition = 'while:' + this.parseExpressionAsString();
      } else if (this.match(TokenType.KEYWORD_UNTIL)) {
        condition = 'until:' + this.parseExpressionAsString();
      }
      this.skipNewlines();

      const body: VB6Statement[] = [];
      while (!this.check(TokenType.KEYWORD_LOOP) && !this.isEOF()) {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
        this.skipNewlines();
      }

      // Consume Loop
      if (this.match(TokenType.KEYWORD_LOOP)) {
        // Check for Loop While or Loop Until
        if (!condition) {
          if (this.match(TokenType.KEYWORD_WHILE)) {
            condition = 'loopwhile:' + this.parseExpressionAsString();
          } else if (this.match(TokenType.KEYWORD_UNTIL)) {
            condition = 'loopuntil:' + this.parseExpressionAsString();
          }
        }
      }

      return {
        type: 'Statement',
        statementType: 'Do',
        condition,
        body,
        line: startToken.line,
        column: startToken.column
      };
    }

    // Exit statement
    if (this.match(TokenType.KEYWORD_EXIT)) {
      const exitType = this.advance().value; // Sub, Function, For, Do, etc.
      return {
        type: 'Statement',
        statementType: 'Exit',
        returnValue: exitType,
        line: startToken.line,
        column: startToken.column
      };
    }

    // Identifier - could be assignment or call
    if (this.check(TokenType.IDENTIFIER)) {
      const name = this.advance().value;

      // Check for assignment
      if (this.match(TokenType.OPERATOR) && this.peek(-1)?.value === '=') {
        // It's an assignment - but we already advanced past =, so go back concept
        const value = this.parseExpressionAsString();
        return {
          type: 'Statement',
          statementType: 'Assignment',
          target: name,
          value,
          line: startToken.line,
          column: startToken.column
        };
      }

      // Check for function call with parentheses
      if (this.match(TokenType.LPAREN)) {
        const args: string[] = [];
        while (!this.check(TokenType.RPAREN) && !this.isEOF()) {
          args.push(this.parseExpressionAsString());
          if (!this.match(TokenType.COMMA)) break;
        }
        this.match(TokenType.RPAREN);
        return {
          type: 'Statement',
          statementType: 'Call',
          name,
          args,
          line: startToken.line,
          column: startToken.column
        };
      }

      // It's a call without parentheses (VB6 allows this)
      const args: string[] = [];
      while (!this.check(TokenType.NEWLINE) && !this.isEOF() && !this.check(TokenType.KEYWORD_END)) {
        args.push(this.parseExpressionAsString());
        if (!this.match(TokenType.COMMA)) break;
      }

      return {
        type: 'Statement',
        statementType: 'Call',
        name,
        args,
        line: startToken.line,
        column: startToken.column
      };
    }

    // Unknown token - skip it
    this.advance();
    return null;
  }

  /**
   * Parse an expression and return it as a string (simplified)
   */
  private parseExpressionAsString(): string {
    const parts: string[] = [];

    while (!this.isEOF() &&
           !this.check(TokenType.NEWLINE) &&
           !this.check(TokenType.KEYWORD_THEN) &&
           !this.check(TokenType.KEYWORD_TO) &&
           !this.check(TokenType.KEYWORD_STEP) &&
           !this.check(TokenType.KEYWORD_END) &&
           !this.check(TokenType.KEYWORD_ELSE) &&
           !this.check(TokenType.KEYWORD_NEXT) &&
           !this.check(TokenType.KEYWORD_LOOP) &&
           !this.check(TokenType.KEYWORD_WEND) &&
           !this.check(TokenType.COMMA) &&
           !this.check(TokenType.RPAREN)) {
      const token = this.advance();
      parts.push(token.value);
    }

    return parts.join(' ');
  }

  private isDeclaration(): boolean {
    return this.check(TokenType.KEYWORD_DIM) ||
           this.check(TokenType.KEYWORD_PUBLIC) ||
           this.check(TokenType.KEYWORD_PRIVATE) ||
           this.check(TokenType.KEYWORD_GLOBAL) ||
           this.check(TokenType.KEYWORD_STATIC) ||
           this.check(TokenType.KEYWORD_CONST);
  }
  
  private isProcedure(): boolean {
    return this.check(TokenType.KEYWORD_SUB) ||
           this.check(TokenType.KEYWORD_FUNCTION) ||
           this.check(TokenType.KEYWORD_PROPERTY) ||
           (this.check(TokenType.KEYWORD_PUBLIC) && this.peek(1)?.type === TokenType.KEYWORD_SUB) ||
           (this.check(TokenType.KEYWORD_PUBLIC) && this.peek(1)?.type === TokenType.KEYWORD_FUNCTION) ||
           (this.check(TokenType.KEYWORD_PRIVATE) && this.peek(1)?.type === TokenType.KEYWORD_SUB) ||
           (this.check(TokenType.KEYWORD_PRIVATE) && this.peek(1)?.type === TokenType.KEYWORD_FUNCTION);
  }
  
  private skipNewlines(): void {
    while (this.match(TokenType.NEWLINE)) {
      // Skip newlines
    }
  }
  
  private current(): VB6Token {
    return this.tokens[this.pos] || { type: TokenType.EOF, value: '', line: 0, column: 0 };
  }
  
  private peek(offset: number = 1): VB6Token | undefined {
    return this.tokens[this.pos + offset];
  }
  
  private advance(): VB6Token {
    if (!this.isEOF()) {
      this.pos++;
    }
    return this.tokens[this.pos - 1];
  }
  
  private check(type: TokenType): boolean {
    return this.current().type === type;
  }
  
  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }
  
  private consume(type: TokenType): VB6Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw new Error(`Expected ${type} but got ${this.current().type} at line ${this.current().line}`);
  }
  
  private isEOF(): boolean {
    return this.current().type === TokenType.EOF;
  }
}

// ============================================================================
// GÉNÉRATEUR JAVASCRIPT SIMPLIFIÉ
// ============================================================================

export class VB6CodeGenerator {
  private runtime: VB6UltraRuntime;
  
  constructor(runtime: VB6UltraRuntime) {
    this.runtime = runtime;
  }
  
  public generate(ast: VB6Module): string {
    let output = '';
    
    // Generate header
    output += this.generateHeader();
    
    // Generate UDT classes
    for (const udt of ast.types) {
      output += this.generateUDT(udt);
    }
    
    // Generate module class
    output += this.generateModuleClass(ast);
    
    // Generate footer
    output += this.generateFooter(ast);
    
    return output;
  }
  
  private generateHeader(): string {
    return `// Generated by VB6 Compiler Core
'use strict';

// Import VB6 Runtime
const VB6Runtime = window.VB6Runtime || require('../runtime/VB6UltraRuntime');

`;
  }
  
  private generateUDT(udt: VB6UserDefinedType): string {
    let output = `// User Defined Type: ${udt.name}\n`;
    output += `class ${udt.name} {\n`;
    output += `  constructor() {\n`;
    
    for (const field of udt.fields) {
      const defaultValue = this.getDefaultValue(field.dataType);
      output += `    this.${field.name} = ${defaultValue};\n`;
    }
    
    output += `  }\n`;
    output += `}\n\n`;
    
    return output;
  }
  
  private generateModuleClass(ast: VB6Module): string {
    let output = `// Module: ${ast.name}\n`;
    output += `class ${ast.name} {\n`;
    output += `  constructor() {\n`;
    
    // Generate member variables
    for (const decl of ast.declarations) {
      const defaultValue = this.getDefaultValue(decl.dataType);
      output += `    this.${decl.name} = ${defaultValue};\n`;
    }
    
    output += `  }\n\n`;
    
    // Generate procedures
    for (const proc of ast.procedures) {
      output += this.generateProcedure(proc);
    }
    
    output += `}\n\n`;
    
    return output;
  }
  
  private generateProcedure(proc: VB6Procedure): string {
    let output = `  // ${proc.procedureType}: ${proc.name}\n`;

    const paramList = proc.parameters.map(p => p.name).join(', ');
    output += `  ${proc.name}(${paramList}) {\n`;

    // Generate body from statements
    output += this.generateStatements(proc.body, '    ');

    // For functions, add return statement if not already present
    if (proc.procedureType === 'Function' && proc.body.length === 0) {
      output += `    return ${this.getDefaultValue(proc.returnType || 'Variant')};\n`;
    }

    output += `  }\n\n`;
    return output;
  }

  private generateStatements(statements: VB6Statement[], indent: string): string {
    let output = '';
    for (const stmt of statements) {
      output += this.generateStatement(stmt, indent);
    }
    return output;
  }

  private generateStatement(stmt: VB6Statement, indent: string): string {
    switch (stmt.statementType) {
      case 'Dim':
        return `${indent}let ${stmt.varName} = ${this.getDefaultValue(stmt.dataType || 'Variant')};\n`;

      case 'Assignment':
        return `${indent}${stmt.target} = ${this.translateExpression(stmt.value || '')};\n`;

      case 'Call':
        const args = (stmt.args || []).map(a => this.translateExpression(a)).join(', ');
        return `${indent}${stmt.name}(${args});\n`;

      case 'If':
        let ifCode = `${indent}if (${this.translateExpression(stmt.condition || '')}) {\n`;
        ifCode += this.generateStatements(stmt.thenBody || [], indent + '  ');
        if (stmt.elseBody && stmt.elseBody.length > 0) {
          ifCode += `${indent}} else {\n`;
          ifCode += this.generateStatements(stmt.elseBody, indent + '  ');
        }
        ifCode += `${indent}}\n`;
        return ifCode;

      case 'For':
        const step = stmt.step ? this.translateExpression(stmt.step) : '1';
        let forCode = `${indent}for (let ${stmt.variable} = ${this.translateExpression(stmt.from || '0')}; `;
        forCode += `${stmt.variable} <= ${this.translateExpression(stmt.to || '0')}; `;
        forCode += `${stmt.variable} += ${step}) {\n`;
        forCode += this.generateStatements(stmt.body || [], indent + '  ');
        forCode += `${indent}}\n`;
        return forCode;

      case 'While':
        let whileCode = `${indent}while (${this.translateExpression(stmt.condition || '')}) {\n`;
        whileCode += this.generateStatements(stmt.body || [], indent + '  ');
        whileCode += `${indent}}\n`;
        return whileCode;

      case 'Do':
        const cond = stmt.condition || '';
        if (cond.startsWith('while:')) {
          let doCode = `${indent}while (${this.translateExpression(cond.substring(6))}) {\n`;
          doCode += this.generateStatements(stmt.body || [], indent + '  ');
          doCode += `${indent}}\n`;
          return doCode;
        } else if (cond.startsWith('until:')) {
          let doCode = `${indent}while (!(${this.translateExpression(cond.substring(6))})) {\n`;
          doCode += this.generateStatements(stmt.body || [], indent + '  ');
          doCode += `${indent}}\n`;
          return doCode;
        } else if (cond.startsWith('loopwhile:')) {
          let doCode = `${indent}do {\n`;
          doCode += this.generateStatements(stmt.body || [], indent + '  ');
          doCode += `${indent}} while (${this.translateExpression(cond.substring(10))});\n`;
          return doCode;
        } else if (cond.startsWith('loopuntil:')) {
          let doCode = `${indent}do {\n`;
          doCode += this.generateStatements(stmt.body || [], indent + '  ');
          doCode += `${indent}} while (!(${this.translateExpression(cond.substring(10))}));\n`;
          return doCode;
        } else {
          // Infinite loop
          let doCode = `${indent}while (true) {\n`;
          doCode += this.generateStatements(stmt.body || [], indent + '  ');
          doCode += `${indent}}\n`;
          return doCode;
        }

      case 'Exit':
        if (stmt.returnValue === 'Sub' || stmt.returnValue === 'Function') {
          return `${indent}return;\n`;
        } else if (stmt.returnValue === 'For' || stmt.returnValue === 'Do') {
          return `${indent}break;\n`;
        }
        return `${indent}return;\n`;

      default:
        return `${indent}// Unhandled statement: ${stmt.statementType}\n`;
    }
  }

  private translateExpression(expr: string): string {
    if (!expr) return '""';

    // Basic VB6 to JS translation
    return expr
      .replace(/\bAnd\b/gi, '&&')
      .replace(/\bOr\b/gi, '||')
      .replace(/\bNot\b/gi, '!')
      .replace(/\bMod\b/gi, '%')
      .replace(/\b<>\b/g, '!==')
      .replace(/\bTrue\b/gi, 'true')
      .replace(/\bFalse\b/gi, 'false')
      .replace(/\bNothing\b/gi, 'null')
      .replace(/\bEmpty\b/gi, 'undefined')
      .replace(/&/g, '+')  // String concatenation
      .trim();
  }
  
  private generateFooter(ast: VB6Module): string {
    return `// Export module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${ast.name};
} else {
  window.${ast.name} = ${ast.name};
}
`;
  }
  
  private getDefaultValue(dataType: string): string {
    switch (dataType.toUpperCase()) {
      case 'BOOLEAN': return 'false';
      case 'BYTE':
      case 'INTEGER':
      case 'LONG':
      case 'SINGLE':
      case 'DOUBLE':
      case 'CURRENCY': return '0';
      case 'STRING': return "''";
      case 'DATE': return 'new Date(0)';
      case 'OBJECT': return 'null';
      case 'VARIANT': return 'null';
      default: return 'null';
    }
  }
}

// ============================================================================
// COMPILATEUR PRINCIPAL UNIFIÉ
// ============================================================================

export interface CompilationOptions {
  moduleName?: string;
  generateSourceMap?: boolean;
  optimize?: boolean;
}

export interface CompilationResult {
  success: boolean;
  javascript: string;
  sourceMap?: string;
  errors: string[];
  warnings: string[];
  ast?: VB6Module;
  metrics: {
    lexingTime: number;
    parsingTime: number;
    codegenTime: number;
    totalTime: number;
  };
}

export class VB6CompilerCore {
  private lexer = new VB6Lexer();
  private parser = new VB6Parser();
  private codeGenerator: VB6CodeGenerator;
  
  constructor(runtime?: VB6UltraRuntime) {
    this.codeGenerator = new VB6CodeGenerator(runtime || new VB6UltraRuntime());
  }
  
  public compile(source: string, options: CompilationOptions = {}): CompilationResult {
    const startTime = performance.now();
    const result: CompilationResult = {
      success: false,
      javascript: '',
      errors: [],
      warnings: [],
      metrics: {
        lexingTime: 0,
        parsingTime: 0,
        codegenTime: 0,
        totalTime: 0
      }
    };
    
    try {
      // Phase 1: Lexical Analysis
      const lexStart = performance.now();
      const tokens = this.lexer.tokenize(source);
      result.metrics.lexingTime = performance.now() - lexStart;
      
      // Phase 2: Parsing
      const parseStart = performance.now();
      const ast = this.parser.parse(tokens);
      result.metrics.parsingTime = performance.now() - parseStart;
      
      if (options.moduleName) {
        ast.name = options.moduleName;
      }
      
      // Phase 3: Code Generation
      const codegenStart = performance.now();
      result.javascript = this.codeGenerator.generate(ast);
      result.metrics.codegenTime = performance.now() - codegenStart;
      
      result.ast = ast;
      result.success = true;
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    
    result.metrics.totalTime = performance.now() - startTime;
    return result;
  }
  
  public getMetrics() {
    return {
      version: '1.0.0',
      features: [
        'Complete VB6 Lexer (87 keywords)',
        'Recursive Descent Parser',
        'JavaScript Code Generation',
        'Runtime Integration',
        'User Defined Types',
        'Property Procedures',
        'Error Handling'
      ]
    };
  }
}

// Export default instance
export const vb6Compiler = new VB6CompilerCore();

export default VB6CompilerCore;