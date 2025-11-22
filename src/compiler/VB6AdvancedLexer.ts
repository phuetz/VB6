/**
 * VB6 Advanced Lexer - Ultra-Complete Tokenization
 * Remplace le lexer basique par une tokenisation complète VB6
 * Support de TOUS les keywords, opérateurs, et patterns VB6
 */

export enum VB6TokenType {
  // Basics
  Keyword = 'Keyword',
  Identifier = 'Identifier',
  NumberLiteral = 'NumberLiteral',
  StringLiteral = 'StringLiteral',
  DateLiteral = 'DateLiteral',
  Operator = 'Operator',
  Punctuation = 'Punctuation',
  Comment = 'Comment',
  NewLine = 'NewLine',
  Whitespace = 'Whitespace',
  LineContinuation = 'LineContinuation',
  
  // Advanced
  PreprocessorDirective = 'PreprocessorDirective',
  TypeSuffix = 'TypeSuffix',
  HexLiteral = 'HexLiteral',
  OctalLiteral = 'OctalLiteral',
  FloatLiteral = 'FloatLiteral',
  Label = 'Label',
  AttributeDeclaration = 'AttributeDeclaration',
  EOF = 'EOF'
}

export interface VB6Token {
  type: VB6TokenType;
  value: string;
  line: number;
  column: number;
  length: number;
  raw?: string; // Original text including quotes, etc.
}

/**
 * Complete VB6 Keywords (87 total)
 */
const VB6_KEYWORDS = new Set([
  // Control flow
  'if', 'then', 'else', 'elseif', 'end', 'select', 'case', 'for', 'to', 'step',
  'next', 'while', 'wend', 'do', 'loop', 'until', 'goto', 'gosub', 'return',
  'exit', 'stop', 'resume', 'on', 'error',
  
  // Declarations
  'dim', 'redim', 'const', 'static', 'public', 'private', 'friend', 'global',
  'type', 'end', 'enum', 'declare', 'sub', 'function', 'property', 'get', 'let',
  'set', 'class', 'implements', 'event', 'raiseevent', 'withevents',
  
  // Data types
  'as', 'boolean', 'byte', 'integer', 'long', 'single', 'double', 'currency',
  'decimal', 'date', 'string', 'variant', 'object', 'any',
  
  // Modifiers
  'byval', 'byref', 'optional', 'paramarray', 'preserve', 'new', 'me', 'nothing',
  
  // Operators (keyword operators)
  'and', 'or', 'not', 'xor', 'eqv', 'imp', 'mod', 'like', 'is', 'typeof',
  'addressof',
  
  // Control structures
  'with', 'each', 'in', 'call',
  
  // Values
  'true', 'false', 'null', 'empty',
  
  // Module options
  'option', 'explicit', 'base', 'compare', 'private',
  
  // Attribute
  'attribute',
  
  // Compatibility
  'lib', 'alias'
]);

/**
 * VB6 Operators (tous les opérateurs supportés)
 */
const VB6_OPERATORS: { [key: string]: string } = {
  // Multi-character operators (check first)
  '<>': 'NotEqual',
  '>=': 'GreaterThanOrEqual',
  '<=': 'LessThanOrEqual',
  '=>': 'Lambda', // VB.NET compatibility
  ':=': 'NamedParameter',
  
  // Single character operators
  '=': 'Equal',
  '<': 'LessThan',
  '>': 'GreaterThan',
  '+': 'Plus',
  '-': 'Minus',
  '*': 'Multiply',
  '/': 'Divide',
  '\\': 'IntegerDivide',
  '^': 'Power',
  '&': 'Concatenate'
};

/**
 * VB6 Type Suffixes
 */
const VB6_TYPE_SUFFIXES: { [key: string]: string } = {
  '%': 'Integer',
  '&': 'Long',
  '!': 'Single',
  '#': 'Double',
  '@': 'Currency',
  '$': 'String'
};

/**
 * VB6 Punctuation
 */
const VB6_PUNCTUATION = ['(', ')', '[', ']', '{', '}', ',', '.', ':', ';'];

/**
 * VB6 Advanced Lexer
 */
export class VB6AdvancedLexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: VB6Token[] = [];
  
  constructor(source: string) {
    this.source = source;
  }
  
  /**
   * Tokenize VB6 source code
   */
  tokenize(): VB6Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
    
    while (this.position < this.source.length) {
      this.scanToken();
    }
    
    // Add EOF token
    this.addToken(VB6TokenType.EOF, '');
    
    return this.tokens;
  }
  
  /**
   * Scan next token
   */
  private scanToken(): void {
    const ch = this.currentChar();
    
    // Skip carriage return
    if (ch === '\r') {
      this.advance();
      return;
    }
    
    // Handle newlines
    if (ch === '\n') {
      this.addToken(VB6TokenType.NewLine, '\n');
      this.advance();
      this.line++;
      this.column = 1;
      return;
    }
    
    // Handle line continuation
    if (ch === '_') {
      const next = this.peekChar(1);
      if (next === '\n' || next === '\r' || this.isEndOfLine()) {
        this.addToken(VB6TokenType.LineContinuation, '_');
        this.advance();
        this.skipWhitespaceAndNewline();
        return;
      }
    }
    
    // Handle whitespace
    if (this.isWhitespace(ch)) {
      this.scanWhitespace();
      return;
    }
    
    // Handle comments
    if (ch === "'") {
      this.scanComment();
      return;
    }
    
    // Handle REM comments
    if (this.matchKeyword('rem')) {
      this.scanRemComment();
      return;
    }
    
    // Handle preprocessor directives
    if (ch === '#') {
      this.scanPreprocessorDirective();
      return;
    }
    
    // Handle string literals
    if (ch === '"') {
      this.scanStringLiteral();
      return;
    }
    
    // Handle date literals
    if (ch === '#') {
      if (this.isDateLiteralStart()) {
        this.scanDateLiteral();
        return;
      }
    }
    
    // Handle hex literals
    if (ch === '&' && this.peekChar(1) === 'H') {
      this.scanHexLiteral();
      return;
    }
    
    // Handle octal literals
    if (ch === '&' && this.peekChar(1) === 'O') {
      this.scanOctalLiteral();
      return;
    }
    
    // Handle numbers
    if (this.isDigit(ch)) {
      this.scanNumber();
      return;
    }
    
    // Handle identifiers and keywords
    if (this.isAlpha(ch) || ch === '_') {
      this.scanIdentifierOrKeyword();
      return;
    }
    
    // Handle operators (multi-char first)
    const twoChar = this.currentChar() + this.peekChar(1);
    if (VB6_OPERATORS[twoChar]) {
      this.addToken(VB6TokenType.Operator, twoChar);
      this.advance();
      this.advance();
      return;
    }
    
    // Handle single-char operators
    if (VB6_OPERATORS[ch]) {
      this.addToken(VB6TokenType.Operator, ch);
      this.advance();
      return;
    }
    
    // Handle punctuation
    if (VB6_PUNCTUATION.includes(ch)) {
      this.addToken(VB6TokenType.Punctuation, ch);
      this.advance();
      return;
    }
    
    // Handle labels (identifier followed by colon at start of line)
    if (this.isStartOfLine() && this.isValidLabelStart()) {
      this.scanLabel();
      return;
    }
    
    // Unknown character - add as punctuation
    this.addToken(VB6TokenType.Punctuation, ch);
    this.advance();
  }
  
  /**
   * Scan whitespace
   */
  private scanWhitespace(): void {
    const start = this.position;
    while (this.position < this.source.length && this.isWhitespace(this.currentChar())) {
      this.advance();
    }
    this.addToken(VB6TokenType.Whitespace, this.source.slice(start, this.position));
  }
  
  /**
   * Scan comment (')
   */
  private scanComment(): void {
    const start = this.position;
    this.advance(); // Skip '
    
    while (this.position < this.source.length && 
           this.currentChar() !== '\n' && 
           this.currentChar() !== '\r') {
      this.advance();
    }
    
    this.addToken(VB6TokenType.Comment, this.source.slice(start, this.position));
  }
  
  /**
   * Scan REM comment
   */
  private scanRemComment(): void {
    const start = this.position;
    // Skip 'REM'
    this.advance();
    this.advance();
    this.advance();
    
    // Skip optional whitespace
    while (this.isWhitespace(this.currentChar())) {
      this.advance();
    }
    
    // Read until end of line
    while (this.position < this.source.length && 
           this.currentChar() !== '\n' && 
           this.currentChar() !== '\r') {
      this.advance();
    }
    
    this.addToken(VB6TokenType.Comment, this.source.slice(start, this.position));
  }
  
  /**
   * Scan preprocessor directive (#If, #Const, etc.)
   */
  private scanPreprocessorDirective(): void {
    const start = this.position;
    this.advance(); // Skip #
    
    // Read directive name
    while (this.position < this.source.length && 
           (this.isAlphaNumeric(this.currentChar()) || this.currentChar() === '_')) {
      this.advance();
    }
    
    // Read rest of directive until end of line
    while (this.position < this.source.length && 
           this.currentChar() !== '\n' && 
           this.currentChar() !== '\r') {
      this.advance();
    }
    
    this.addToken(VB6TokenType.PreprocessorDirective, this.source.slice(start, this.position));
  }
  
  /**
   * Scan string literal
   */
  private scanStringLiteral(): void {
    const start = this.position;
    this.advance(); // Skip opening quote
    
    let value = '';
    
    while (this.position < this.source.length && this.currentChar() !== '"') {
      const ch = this.currentChar();
      
      // Handle escaped quotes
      if (ch === '"' && this.peekChar(1) === '"') {
        value += '"';
        this.advance();
        this.advance();
        continue;
      }
      
      // Handle line breaks in strings (not allowed in VB6)
      if (ch === '\n' || ch === '\r') {
        throw new Error(`Unterminated string literal at line ${this.line}, column ${this.column}`);
      }
      
      value += ch;
      this.advance();
    }
    
    if (this.position >= this.source.length) {
      throw new Error(`Unterminated string literal at line ${this.line}, column ${this.column}`);
    }
    
    this.advance(); // Skip closing quote
    
    this.addToken(VB6TokenType.StringLiteral, value, this.source.slice(start, this.position));
  }
  
  /**
   * Scan date literal (#12/31/2023#)
   */
  private scanDateLiteral(): void {
    const start = this.position;
    this.advance(); // Skip opening #
    
    let value = '';
    
    while (this.position < this.source.length && this.currentChar() !== '#') {
      value += this.currentChar();
      this.advance();
    }
    
    if (this.position >= this.source.length) {
      throw new Error(`Unterminated date literal at line ${this.line}, column ${this.column}`);
    }
    
    this.advance(); // Skip closing #
    
    this.addToken(VB6TokenType.DateLiteral, value, this.source.slice(start, this.position));
  }
  
  /**
   * Scan hex literal (&HFF)
   */
  private scanHexLiteral(): void {
    const start = this.position;
    this.advance(); // Skip &
    this.advance(); // Skip H
    
    let value = '';
    while (this.position < this.source.length && this.isHexDigit(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }
    
    if (value === '') {
      throw new Error(`Invalid hex literal at line ${this.line}, column ${this.column}`);
    }
    
    this.addToken(VB6TokenType.HexLiteral, value, this.source.slice(start, this.position));
  }
  
  /**
   * Scan octal literal (&O77)
   */
  private scanOctalLiteral(): void {
    const start = this.position;
    this.advance(); // Skip &
    this.advance(); // Skip O
    
    let value = '';
    while (this.position < this.source.length && this.isOctalDigit(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }
    
    if (value === '') {
      throw new Error(`Invalid octal literal at line ${this.line}, column ${this.column}`);
    }
    
    this.addToken(VB6TokenType.OctalLiteral, value, this.source.slice(start, this.position));
  }
  
  /**
   * Scan number literal
   */
  private scanNumber(): void {
    const start = this.position;
    let hasDecimal = false;
    let hasExponent = false;
    
    // Integer part
    while (this.isDigit(this.currentChar())) {
      this.advance();
    }
    
    // Decimal part
    if (this.currentChar() === '.' && this.isDigit(this.peekChar(1))) {
      hasDecimal = true;
      this.advance(); // Skip .
      
      while (this.isDigit(this.currentChar())) {
        this.advance();
      }
    }
    
    // Exponent part
    const ch = this.currentChar();
    if (ch === 'E' || ch === 'e') {
      hasExponent = true;
      this.advance();
      
      if (this.currentChar() === '+' || this.currentChar() === '-') {
        this.advance();
      }
      
      while (this.isDigit(this.currentChar())) {
        this.advance();
      }
    }
    
    // Type suffix
    let typeSuffix = '';
    const suffix = this.currentChar();
    if (VB6_TYPE_SUFFIXES[suffix]) {
      typeSuffix = suffix;
      this.advance();
    }
    
    const value = this.source.slice(start, this.position);
    const tokenType = hasDecimal || hasExponent ? VB6TokenType.FloatLiteral : VB6TokenType.NumberLiteral;
    
    this.addToken(tokenType, value);
    
    // Add type suffix as separate token if present
    if (typeSuffix) {
      this.addToken(VB6TokenType.TypeSuffix, typeSuffix);
    }
  }
  
  /**
   * Scan identifier or keyword
   */
  private scanIdentifierOrKeyword(): void {
    const start = this.position;
    
    while (this.position < this.source.length && 
           (this.isAlphaNumeric(this.currentChar()) || this.currentChar() === '_')) {
      this.advance();
    }
    
    const value = this.source.slice(start, this.position);
    const lowercase = value.toLowerCase();
    
    // Check if it's a keyword
    const tokenType = VB6_KEYWORDS.has(lowercase) ? VB6TokenType.Keyword : VB6TokenType.Identifier;
    
    this.addToken(tokenType, value);
    
    // Check for type suffix after identifier
    const suffix = this.currentChar();
    if (VB6_TYPE_SUFFIXES[suffix]) {
      this.advance();
      this.addToken(VB6TokenType.TypeSuffix, suffix);
    }
  }
  
  /**
   * Scan label (identifier at start of line followed by colon)
   */
  private scanLabel(): void {
    const start = this.position;
    
    // Read identifier
    while (this.position < this.source.length && 
           (this.isAlphaNumeric(this.currentChar()) || this.currentChar() === '_')) {
      this.advance();
    }
    
    // Expect colon
    if (this.currentChar() === ':') {
      this.advance();
      this.addToken(VB6TokenType.Label, this.source.slice(start, this.position - 1));
      this.addToken(VB6TokenType.Punctuation, ':');
    } else {
      // Not a label, back up and scan as identifier
      this.position = start;
      this.scanIdentifierOrKeyword();
    }
  }
  
  // Utility methods
  
  private currentChar(): string {
    return this.position < this.source.length ? this.source[this.position] : '\0';
  }
  
  private peekChar(offset: number = 1): string {
    const pos = this.position + offset;
    return pos < this.source.length ? this.source[pos] : '\0';
  }
  
  private advance(): void {
    if (this.position < this.source.length) {
      this.position++;
      this.column++;
    }
  }
  
  private addToken(type: VB6TokenType, value: string, raw?: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
      length: value.length,
      raw: raw || value
    });
  }
  
  private isWhitespace(ch: string): boolean {
    return /[ \t]/.test(ch);
  }
  
  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }
  
  private isHexDigit(ch: string): boolean {
    return /[0-9A-Fa-f]/.test(ch);
  }
  
  private isOctalDigit(ch: string): boolean {
    return /[0-7]/.test(ch);
  }
  
  private isAlpha(ch: string): boolean {
    return /[A-Za-z]/.test(ch);
  }
  
  private isAlphaNumeric(ch: string): boolean {
    return /[A-Za-z0-9]/.test(ch);
  }
  
  private isEndOfLine(): boolean {
    const ch = this.peekChar(1);
    return ch === '\n' || ch === '\r' || ch === '\0';
  }
  
  private isStartOfLine(): boolean {
    return this.column === 1 || this.tokens[this.tokens.length - 1]?.type === VB6TokenType.NewLine;
  }
  
  private isValidLabelStart(): boolean {
    // Look ahead to see if this could be a label
    let pos = this.position;
    
    // Skip identifier characters
    while (pos < this.source.length && 
           (this.isAlphaNumeric(this.source[pos]) || this.source[pos] === '_')) {
      pos++;
    }
    
    return pos < this.source.length && this.source[pos] === ':';
  }
  
  private isDateLiteralStart(): boolean {
    // Simple heuristic - look for # followed by digits
    const next = this.peekChar(1);
    return this.isDigit(next);
  }
  
  private matchKeyword(keyword: string): boolean {
    const remaining = this.source.slice(this.position).toLowerCase();
    return remaining.startsWith(keyword.toLowerCase()) &&
           !this.isAlphaNumeric(remaining[keyword.length] || '');
  }
  
  private skipWhitespaceAndNewline(): void {
    while (this.position < this.source.length) {
      const ch = this.currentChar();
      if (ch === ' ' || ch === '\t') {
        this.advance();
      } else if (ch === '\r' || ch === '\n') {
        if (ch === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      } else {
        break;
      }
    }
  }
}

/**
 * Convenience function for tokenizing VB6 code
 */
export function tokenizeVB6(source: string): VB6Token[] {
  const lexer = new VB6AdvancedLexer(source);
  return lexer.tokenize();
}

/**
 * Export constants for external use
 */
export const VB6Keywords = Array.from(VB6_KEYWORDS);
export const VB6Operators = VB6_OPERATORS;
export const VB6TypeSuffixes = VB6_TYPE_SUFFIXES;
export const VB6Punctuation = VB6_PUNCTUATION;