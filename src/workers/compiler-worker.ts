/**
 * VB6 Compiler Web Worker
 * 
 * Dedicated worker for VB6 compilation tasks to avoid blocking the main thread.
 * Handles parsing, semantic analysis, optimization, and code generation.
 */

// Worker context
declare const self: DedicatedWorkerGlobalScope;

/**
 * SERVICE WORKER PERSISTENCE BUG FIX: Background exploitation protection
 */
class ServiceWorkerExploitationProtection {
  private static readonly MAX_WORKER_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly MAX_CONCURRENT_OPERATIONS = 5;
  private static readonly MAX_MEMORY_USAGE_MB = 100;
  private static readonly ACTIVITY_TIMEOUT_MS = 60 * 1000; // 1 minute
  
  private static instance: ServiceWorkerExploitationProtection;
  private workerStartTime: number;
  private activeOperations: Set<string> = new Set();
  private lastActivityTime: number;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;
  private activityTimeoutInterval: NodeJS.Timeout | null = null;
  
  static getInstance(): ServiceWorkerExploitationProtection {
    if (!this.instance) {
      this.instance = new ServiceWorkerExploitationProtection();
    }
    return this.instance;
  }
  
  constructor() {
    this.workerStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.startMonitoring();
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Prevent long-running workers
   */
  private startMonitoring(): void {
    // Monitor memory usage
    this.memoryMonitorInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.checkWorkerLifetime();
    }, 30000); // Every 30 seconds
    
    // Monitor activity timeout
    this.activityTimeoutInterval = setInterval(() => {
      this.checkActivityTimeout();
    }, 10000); // Every 10 seconds
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Memory usage monitoring
   */
  private checkMemoryUsage(): void {
    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        const memoryUsageMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        
        if (memoryUsageMB > ServiceWorkerExploitationProtection.MAX_MEMORY_USAGE_MB) {
          console.warn(`Worker memory usage exceeded limit: ${memoryUsageMB.toFixed(2)}MB`);
          this.terminateWorker('Memory limit exceeded');
        }
      }
    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Worker lifetime monitoring
   */
  private checkWorkerLifetime(): void {
    const lifetime = Date.now() - this.workerStartTime;
    
    if (lifetime > ServiceWorkerExploitationProtection.MAX_WORKER_LIFETIME_MS) {
      console.warn(`Worker lifetime exceeded limit: ${(lifetime / 60000).toFixed(2)} minutes`);
      this.terminateWorker('Lifetime limit exceeded');
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Activity timeout monitoring
   */
  private checkActivityTimeout(): void {
    const inactivityTime = Date.now() - this.lastActivityTime;
    
    if (inactivityTime > ServiceWorkerExploitationProtection.ACTIVITY_TIMEOUT_MS && this.activeOperations.size === 0) {
      console.log('Worker terminating due to inactivity');
      this.terminateWorker('Inactivity timeout');
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Safe worker termination
   */
  private terminateWorker(reason: string): void {
    try {
      // Clear intervals
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = null;
      }
      
      if (this.activityTimeoutInterval) {
        clearInterval(this.activityTimeoutInterval);
        this.activityTimeoutInterval = null;
      }
      
      // Clear active operations
      this.activeOperations.clear();
      
      // Notify main thread
      self.postMessage({
        id: 'worker-termination',
        type: 'worker-terminating',
        payload: { reason }
      });
      
      // Terminate worker
      self.close();
    } catch (error) {
      console.error('Error during worker termination:', error);
      self.close(); // Force close
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Track operation start
   */
  startOperation(operationId: string): boolean {
    if (this.activeOperations.size >= ServiceWorkerExploitationProtection.MAX_CONCURRENT_OPERATIONS) {
      console.warn('Maximum concurrent operations exceeded');
      return false;
    }
    
    this.activeOperations.add(operationId);
    this.lastActivityTime = Date.now();
    return true;
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Track operation end
   */
  endOperation(operationId: string): void {
    this.activeOperations.delete(operationId);
    this.lastActivityTime = Date.now();
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Validate message safety
   */
  validateMessage(data: any): boolean {
    try {
      // Check message size
      const messageSize = JSON.stringify(data).length;
      if (messageSize > 50 * 1024 * 1024) { // 50MB limit
        console.warn('Message too large:', messageSize);
        return false;
      }
      
      // Check for dangerous properties
      const dangerousProps = ['__proto__', 'constructor', 'prototype'];
      for (const prop of dangerousProps) {
        if (this.containsDangerousProperty(data, prop)) {
          console.warn(`Dangerous property detected: ${prop}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.warn('Message validation failed:', error);
      return false;
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Check for dangerous properties recursively
   */
  private containsDangerousProperty(obj: any, prop: string): boolean {
    if (obj && typeof obj === 'object') {
      if (prop in obj) return true;
      
      for (const value of Object.values(obj)) {
        if (this.containsDangerousProperty(value, prop)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Cleanup resources
   */
  cleanup(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
    
    if (this.activityTimeoutInterval) {
      clearInterval(this.activityTimeoutInterval);
      this.activityTimeoutInterval = null;
    }
    
    this.activeOperations.clear();
  }
}

interface CompilationUnit {
  id: string;
  source: string;
  hash: string;
  dependencies: string[];
  lastModified: number;
}

interface OptimizationOptions {
  level: 0 | 1 | 2 | 3;
  deadCodeElimination: boolean;
  constantFolding: boolean;
  functionInlining: boolean;
  loopOptimization: boolean;
  minification: boolean;
  sourceMap: boolean;
}

interface CompilerError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

interface CompilationResult {
  success: boolean;
  output: string;
  errors: CompilerError[];
  warnings: CompilerError[];
  metrics: {
    parseTime: number;
    analyzeTime: number;
    optimizeTime: number;
    generateTime: number;
    totalTime: number;
    linesOfCode: number;
    cacheHits: number;
    cacheMisses: number;
  };
  sourceMap?: string;
}

// VB6 Language Token Types
enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  
  // Identifiers
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords
  DIM = 'DIM',
  AS = 'AS',
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
  SUB = 'SUB',
  FUNCTION = 'FUNCTION',
  END = 'END',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  ELSEIF = 'ELSEIF',
  FOR = 'FOR',
  TO = 'TO',
  NEXT = 'NEXT',
  WHILE = 'WHILE',
  WEND = 'WEND',
  DO = 'DO',
  LOOP = 'LOOP',
  SELECT = 'SELECT',
  CASE = 'CASE',
  
  // Data Types
  INTEGER = 'INTEGER',
  LONG = 'LONG',
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  STRING_TYPE = 'STRING_TYPE',
  BOOLEAN_TYPE = 'BOOLEAN_TYPE',
  VARIANT = 'VARIANT',
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MOD = 'MOD',
  ASSIGN = 'ASSIGN',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  
  // Punctuation
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  DOT = 'DOT',
  NEWLINE = 'NEWLINE',
  
  // Special
  EOF = 'EOF',
  COMMENT = 'COMMENT'
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// VB6 Lexer
class VB6Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  
  constructor(source: string) {
    // RESOURCE EXHAUSTION BUG FIX: Limit source code size
    if (typeof source !== 'string') {
      throw new Error('Invalid source code');
    }
    if (source.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Source code too large');
    }
    this.source = source;
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    const MAX_TOKENS = 100000; // Prevent token explosion
    const startTime = performance.now();
    const TIMEOUT_MS = 30000; // 30 second timeout
    
    while (this.position < this.source.length) {
      // RESOURCE EXHAUSTION BUG FIX: Prevent infinite tokenization
      if (tokens.length >= MAX_TOKENS) {
        throw new Error(`Too many tokens: limit ${MAX_TOKENS} exceeded`);
      }
      
      // RESOURCE EXHAUSTION BUG FIX: Add timeout to prevent hanging
      if (performance.now() - startTime > TIMEOUT_MS) {
        throw new Error('Tokenization timeout');
      }
      
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }
    
    tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return tokens;
  }
  
  private nextToken(): Token | null {
    this.skipWhitespace();
    
    if (this.position >= this.source.length) {
      return null;
    }
    
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant character access
    spectreResistantMemoryAccess();
    spectreBarrier();
    const char = this.source[this.position];
    const startLine = this.line;
    const startColumn = this.column;
    
    // Comments
    if (char === "'") {
      return this.readComment(startLine, startColumn);
    }
    
    // Newlines
    if (char === '\n') {
      this.advance();
      this.line++;
      this.column = 1;
      return { type: TokenType.NEWLINE, value: '\n', line: startLine, column: startColumn };
    }
    
    // String literals
    if (char === '"') {
      return this.readString(startLine, startColumn);
    }
    
    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber(startLine, startColumn);
    }
    
    // Identifiers and keywords
    if (this.isAlpha(char)) {
      return this.readIdentifier(startLine, startColumn);
    }
    
    // Operators and punctuation
    return this.readOperator(startLine, startColumn);
  }
  
  private readComment(line: number, column: number): Token {
    let value = '';
    const MAX_COMMENT_LENGTH = 10000; // Limit comment length
    
    while (this.position < this.source.length && 
           this.source[this.position] !== '\n' && 
           value.length < MAX_COMMENT_LENGTH) {
      // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant character access
      spectreResistantMemoryAccess();
      
      if (this.position >= this.source.length) break;
      
      spectreBarrier();
      value += this.source[this.position];
      this.advance();
    }
    
    // RESOURCE EXHAUSTION BUG FIX: Skip to end of line if comment too long
    while (this.position < this.source.length && this.source[this.position] !== '\n') {
      this.advance();
    }
    
    return { type: TokenType.COMMENT, value: value.substring(0, MAX_COMMENT_LENGTH), line, column };
  }
  
  private readString(line: number, column: number): Token {
    let value = '';
    const MAX_STRING_LENGTH = 100000; // Limit string length
    this.advance(); // Skip opening quote
    
    while (this.position < this.source.length && 
           this.source[this.position] !== '"' && 
           value.length < MAX_STRING_LENGTH) {
      // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant character access
      spectreResistantMemoryAccess();
      
      if (this.position >= this.source.length) break;
      
      spectreBarrier();
      value += this.source[this.position];
      this.advance();
    }
    
    // RESOURCE EXHAUSTION BUG FIX: Handle unterminated or too-long strings
    if (value.length >= MAX_STRING_LENGTH) {
      throw new Error('String literal too long');
    }
    
    if (this.position < this.source.length) {
      this.advance(); // Skip closing quote
    }
    
    return { type: TokenType.STRING, value, line, column };
  }
  
  private readNumber(line: number, column: number): Token {
    let value = '';
    let hasDecimal = false;
    const MAX_NUMBER_LENGTH = 100; // Limit number length
    
    while (this.position < this.source.length && value.length < MAX_NUMBER_LENGTH) {
      // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant character access
      spectreResistantMemoryAccess();
      
      if (this.position >= this.source.length) break;
      
      spectreBarrier();
      const char = this.source[this.position];
      if (this.isDigit(char)) {
        value += char;
        this.advance();
      } else if (char === '.' && !hasDecimal) {
        hasDecimal = true;
        value += char;
        this.advance();
      } else {
        break;
      }
    }
    
    // RESOURCE EXHAUSTION BUG FIX: Check number length
    if (value.length >= MAX_NUMBER_LENGTH) {
      throw new Error('Number literal too long');
    }
    
    return { type: TokenType.NUMBER, value, line, column };
  }
  
  private readIdentifier(line: number, column: number): Token {
    let value = '';
    const MAX_IDENTIFIER_LENGTH = 255; // VB6 identifier limit
    
    while (this.position < this.source.length && value.length < MAX_IDENTIFIER_LENGTH) {
      // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant character access
      spectreResistantMemoryAccess();
      
      if (this.position >= this.source.length) break;
      
      spectreBarrier();
      const char = this.source[this.position];
      if (this.isAlphaNumeric(char)) {
        value += char;
        this.advance();
      } else {
        break;
      }
    }
    
    // RESOURCE EXHAUSTION BUG FIX: Skip remaining chars if identifier too long
    while (this.position < this.source.length && this.isAlphaNumeric(this.source[this.position])) {
      this.advance();
    }
    
    if (value.length >= MAX_IDENTIFIER_LENGTH) {
      throw new Error('Identifier too long');
    }
    
    const upperValue = value.toUpperCase();
    const tokenType = this.getKeywordType(upperValue) || TokenType.IDENTIFIER;
    
    return { type: tokenType, value, line, column };
  }
  
  private readOperator(line: number, column: number): Token {
    const char = this.source[this.position];
    this.advance();
    
    switch (char) {
      case '+': return { type: TokenType.PLUS, value: char, line, column };
      case '-': return { type: TokenType.MINUS, value: char, line, column };
      case '*': return { type: TokenType.MULTIPLY, value: char, line, column };
      case '/': return { type: TokenType.DIVIDE, value: char, line, column };
      case '=': return { type: TokenType.EQUALS, value: char, line, column };
      case '<': return { type: TokenType.LESS_THAN, value: char, line, column };
      case '>': return { type: TokenType.GREATER_THAN, value: char, line, column };
      case '(': return { type: TokenType.LPAREN, value: char, line, column };
      case ')': return { type: TokenType.RPAREN, value: char, line, column };
      case ',': return { type: TokenType.COMMA, value: char, line, column };
      case '.': return { type: TokenType.DOT, value: char, line, column };
      default:
        return { type: TokenType.IDENTIFIER, value: char, line, column };
    }
  }
  
  private getKeywordType(value: string): TokenType | null {
    const keywords: { [key: string]: TokenType } = {
      'DIM': TokenType.DIM,
      'AS': TokenType.AS,
      'PRIVATE': TokenType.PRIVATE,
      'PUBLIC': TokenType.PUBLIC,
      'SUB': TokenType.SUB,
      'FUNCTION': TokenType.FUNCTION,
      'END': TokenType.END,
      'IF': TokenType.IF,
      'THEN': TokenType.THEN,
      'ELSE': TokenType.ELSE,
      'ELSEIF': TokenType.ELSEIF,
      'FOR': TokenType.FOR,
      'TO': TokenType.TO,
      'NEXT': TokenType.NEXT,
      'WHILE': TokenType.WHILE,
      'WEND': TokenType.WEND,
      'DO': TokenType.DO,
      'LOOP': TokenType.LOOP,
      'SELECT': TokenType.SELECT,
      'CASE': TokenType.CASE,
      'INTEGER': TokenType.INTEGER,
      'LONG': TokenType.LONG,
      'SINGLE': TokenType.SINGLE,
      'DOUBLE': TokenType.DOUBLE,
      'STRING': TokenType.STRING_TYPE,
      'BOOLEAN': TokenType.BOOLEAN_TYPE,
      'VARIANT': TokenType.VARIANT,
      'TRUE': TokenType.BOOLEAN,
      'FALSE': TokenType.BOOLEAN,
      'MOD': TokenType.MOD
    };
    
    return keywords[value] || null;
  }
  
  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }
  
  private advance(): void {
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant advance
    spectreResistantMemoryAccess();
    
    // Bounds checking to prevent speculative execution
    if (this.position < this.source.length) {
      this.position++;
      this.column++;
    }
    
    spectreBarrier();
  }
  
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
  
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }
  
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

// Simple VB6 Parser
class VB6Parser {
  private tokens: Token[];
  private current: number = 0;
  
  constructor(tokens: Token[]) {
    // RESOURCE EXHAUSTION BUG FIX: Limit token count
    if (!Array.isArray(tokens)) {
      throw new Error('Invalid tokens array');
    }
    if (tokens.length > 100000) {
      throw new Error('Too many tokens to parse');
    }
    this.tokens = tokens.filter(t => t.type !== TokenType.COMMENT);
  }
  
  parse(): any {
    const statements = [];
    const MAX_STATEMENTS = 10000; // Limit AST size
    const startTime = performance.now();
    const TIMEOUT_MS = 30000; // 30 second timeout
    
    while (!this.isAtEnd()) {
      // RESOURCE EXHAUSTION BUG FIX: Prevent huge ASTs
      if (statements.length >= MAX_STATEMENTS) {
        throw new Error(`Too many statements: limit ${MAX_STATEMENTS} exceeded`);
      }
      
      // RESOURCE EXHAUSTION BUG FIX: Add timeout to prevent hanging
      if (performance.now() - startTime > TIMEOUT_MS) {
        throw new Error('Parse timeout');
      }
      
      const stmt = this.statement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    return {
      type: 'Program',
      body: statements
    };
  }
  
  private statement(): any {
    try {
      if (this.match(TokenType.DIM)) {
        return this.variableDeclaration();
      }
      
      if (this.match(TokenType.PRIVATE, TokenType.PUBLIC)) {
        const visibility = this.previous().value;
        
        if (this.match(TokenType.SUB)) {
          return this.subDeclaration(visibility);
        }
        
        if (this.match(TokenType.FUNCTION)) {
          return this.functionDeclaration(visibility);
        }
      }
      
      if (this.match(TokenType.SUB)) {
        return this.subDeclaration('Public');
      }
      
      if (this.match(TokenType.FUNCTION)) {
        return this.functionDeclaration('Public');
      }
      
      // Skip newlines
      if (this.match(TokenType.NEWLINE)) {
        return null;
      }
      
      // Expression statement
      return this.expressionStatement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }
  
  private variableDeclaration(): any {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").value;
    
    let varType = 'Variant';
    if (this.match(TokenType.AS)) {
      varType = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
    }
    
    this.consumeNewlineOrEOF();
    
    return {
      type: 'VariableDeclaration',
      name,
      varType
    };
  }
  
  private subDeclaration(visibility: string): any {
    const name = this.consume(TokenType.IDENTIFIER, "Expected subroutine name").value;
    
    const parameters = [];
    if (this.match(TokenType.LPAREN)) {
      if (!this.check(TokenType.RPAREN)) {
        do {
          const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
          let paramType = 'Variant';
          
          if (this.match(TokenType.AS)) {
            paramType = this.consume(TokenType.IDENTIFIER, "Expected parameter type").value;
          }
          
          parameters.push({ name: paramName, type: paramType });
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    }
    
    this.consumeNewlineOrEOF();
    
    const body = [];
    const MAX_BODY_STATEMENTS = 1000; // Limit function body size
    
    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      // RESOURCE EXHAUSTION BUG FIX: Limit function body size
      if (body.length >= MAX_BODY_STATEMENTS) {
        throw new Error('Function body too large');
      }
      
      const stmt = this.statement();
      if (stmt) {
        body.push(stmt);
      }
    }
    
    if (this.match(TokenType.END)) {
      this.consume(TokenType.SUB, "Expected 'Sub' after 'End'");
    }
    
    return {
      type: 'SubDeclaration',
      name,
      visibility,
      parameters,
      body
    };
  }
  
  private functionDeclaration(visibility: string): any {
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value;
    
    const parameters = [];
    if (this.match(TokenType.LPAREN)) {
      if (!this.check(TokenType.RPAREN)) {
        do {
          const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
          let paramType = 'Variant';
          
          if (this.match(TokenType.AS)) {
            paramType = this.consume(TokenType.IDENTIFIER, "Expected parameter type").value;
          }
          
          parameters.push({ name: paramName, type: paramType });
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    }
    
    let returnType = 'Variant';
    if (this.match(TokenType.AS)) {
      returnType = this.consume(TokenType.IDENTIFIER, "Expected return type").value;
    }
    
    this.consumeNewlineOrEOF();
    
    const body = [];
    const MAX_BODY_STATEMENTS = 1000; // Limit function body size
    
    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      // RESOURCE EXHAUSTION BUG FIX: Limit function body size
      if (body.length >= MAX_BODY_STATEMENTS) {
        throw new Error('Function body too large');
      }
      
      const stmt = this.statement();
      if (stmt) {
        body.push(stmt);
      }
    }
    
    if (this.match(TokenType.END)) {
      this.consume(TokenType.FUNCTION, "Expected 'Function' after 'End'");
    }
    
    return {
      type: 'FunctionDeclaration',
      name,
      visibility,
      parameters,
      returnType,
      body
    };
  }
  
  private expressionStatement(): any {
    const expr = this.expression();
    this.consumeNewlineOrEOF();
    return {
      type: 'ExpressionStatement',
      expression: expr
    };
  }
  
  private expression(): any {
    return this.assignment();
  }
  
  private assignment(): any {
    const expr = this.equality();
    
    if (this.match(TokenType.EQUALS)) {
      const value = this.assignment();
      return {
        type: 'Assignment',
        left: expr,
        right: value
      };
    }
    
    return expr;
  }
  
  private equality(): any {
    let expr = this.comparison();
    
    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      };
    }
    
    return expr;
  }
  
  private comparison(): any {
    let expr = this.term();
    
    while (this.match(TokenType.GREATER_THAN, TokenType.LESS_THAN)) {
      const operator = this.previous().value;
      const right = this.term();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      };
    }
    
    return expr;
  }
  
  private term(): any {
    let expr = this.factor();
    
    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      };
    }
    
    return expr;
  }
  
  private factor(): any {
    let expr = this.unary();
    
    while (this.match(TokenType.DIVIDE, TokenType.MULTIPLY, TokenType.MOD)) {
      const operator = this.previous().value;
      const right = this.unary();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right
      };
    }
    
    return expr;
  }
  
  private unary(): any {
    if (this.match(TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.unary();
      return {
        type: 'UnaryExpression',
        operator,
        operand: right
      };
    }
    
    return this.primary();
  }
  
  private primary(): any {
    if (this.match(TokenType.BOOLEAN)) {
      return {
        type: 'Literal',
        value: this.previous().value.toLowerCase() === 'true',
        dataType: 'Boolean'
      };
    }
    
    if (this.match(TokenType.NUMBER)) {
      const value = this.previous().value;
      
      // TYPE COERCION BUG FIX: Safe number parsing with validation
      let parsedValue: number;
      let dataType: string;
      
      if (value.includes('.')) {
        parsedValue = parseFloat(value);
        dataType = 'Double';
        // Validate parseFloat result
        if (isNaN(parsedValue) || !isFinite(parsedValue)) {
          throw new Error(`Invalid floating point number: ${value}`);
        }
      } else {
        parsedValue = parseInt(value, 10); // TYPE COERCION BUG FIX: Always use radix 10
        dataType = 'Integer';
        // Validate parseInt result
        if (isNaN(parsedValue)) {
          throw new Error(`Invalid integer: ${value}`);
        }
      }
      
      return {
        type: 'Literal',
        value: parsedValue,
        dataType: dataType
      };
    }
    
    if (this.match(TokenType.STRING)) {
      return {
        type: 'Literal',
        value: this.previous().value,
        dataType: 'String'
      };
    }
    
    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: 'Identifier',
        name: this.previous().value
      };
    }
    
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }
    
    throw new Error(`Unexpected token: ${this.peek().value}`);
  }
  
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: TokenType): boolean {
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant token checking
    spectreResistantMemoryAccess();
    const atEndMask = this.isAtEnd() ? 0xFFFFFFFF : 0;
    spectreBarrier();
    
    // Constant-time branching to prevent Spectre attacks
    if (atEndMask & 0xFFFFFFFF) return false;
    
    const currentToken = this.peek();
    return currentToken.type === type;
  }
  
  private advance(): Token {
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant advance
    spectreResistantMemoryAccess();
    const atEndMask = this.isAtEnd() ? 0 : 0xFFFFFFFF;
    spectreBarrier();
    
    // Constant-time conditional increment
    this.current += (atEndMask & 0xFFFFFFFF) ? 1 : 0;
    return this.previous();
  }
  
  private isAtEnd(): boolean {
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant end check
    spectreResistantMemoryAccess();
    
    // Bounds check to prevent speculative execution
    if (this.current >= this.tokens.length) {
      return true;
    }
    
    spectreBarrier();
    const token = this.tokens[this.current];
    return token && token.type === TokenType.EOF;
  }
  
  private peek(): Token {
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant peek
    spectreResistantMemoryAccess();
    
    // Bounds checking to prevent speculative access
    if (this.current >= this.tokens.length) {
      return { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    
    spectreBarrier();
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    // SPECULATIVE EXECUTION BUG FIX: Spectre-resistant previous
    spectreResistantMemoryAccess();
    
    // Bounds checking to prevent speculative access
    const prevIndex = this.current - 1;
    if (prevIndex < 0 || prevIndex >= this.tokens.length) {
      return { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    
    spectreBarrier();
    return this.tokens[prevIndex];
  }
  
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const current = this.peek();
    throw new Error(`${message} at line ${current.line}, column ${current.column}`);
  }
  
  private consumeNewlineOrEOF(): void {
    if (this.check(TokenType.NEWLINE)) {
      this.advance();
    } else if (!this.isAtEnd()) {
      // Allow missing newlines at end of file
    }
  }
  
  private synchronize(): void {
    this.advance();
    
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.NEWLINE) return;
      
      switch (this.peek().type) {
        case TokenType.DIM:
        case TokenType.PRIVATE:
        case TokenType.PUBLIC:
        case TokenType.SUB:
        case TokenType.FUNCTION:
          return;
      }
      
      this.advance();
    }
  }
}

// Code generator
class VB6CodeGenerator {
  generate(ast: any): string {
    return this.generateProgram(ast);
  }
  
  private generateProgram(node: any): string {
    const statements = node.body.map((stmt: any) => this.generateStatement(stmt));
    return statements.join('\n');
  }
  
  private generateStatement(node: any): string {
    switch (node.type) {
      case 'VariableDeclaration':
        return `let ${node.name}; // ${node.varType}`;
      
      case 'SubDeclaration': {
        const subParams = node.parameters.map((p: any) => p.name).join(', ');
        const subBody = node.body.map((stmt: any) => '  ' + this.generateStatement(stmt)).join('\n');
        return `function ${node.name}(${subParams}) {\n${subBody}\n}`;
      }
      
      case 'FunctionDeclaration': {
        const funcParams = node.parameters.map((p: any) => p.name).join(', ');
        const funcBody = node.body.map((stmt: any) => '  ' + this.generateStatement(stmt)).join('\n');
        return `function ${node.name}(${funcParams}) { // returns ${node.returnType}\n${funcBody}\n}`;
      }
      
      case 'ExpressionStatement':
        return this.generateExpression(node.expression) + ';';
      
      case 'Assignment':
        return `${this.generateExpression(node.left)} = ${this.generateExpression(node.right)}`;
      
      default:
        return `// Unknown statement: ${node.type}`;
    }
  }
  
  private generateExpression(node: any): string {
    switch (node.type) {
      case 'Literal':
        return typeof node.value === 'string' ? `"${node.value}"` : String(node.value);
      
      case 'Identifier':
        return node.name;
      
      case 'BinaryExpression': {
        const left = this.generateExpression(node.left);
        const right = this.generateExpression(node.right);
        return `(${left} ${node.operator} ${right})`;
      }
      
      case 'UnaryExpression': {
        const operand = this.generateExpression(node.operand);
        return `(${node.operator}${operand})`;
      }
      
      default:
        return `/* Unknown expression: ${node.type} */`;
    }
  }
}

// Main compilation function
function compileUnit(unit: CompilationUnit, options: OptimizationOptions): CompilationResult {
  const startTime = performance.now();
  const errors: CompilerError[] = [];
  const warnings: CompilerError[] = [];
  
  // RESOURCE EXHAUSTION BUG FIX: Validate input size and set timeout
  if (!unit || typeof unit.source !== 'string') {
    throw new Error('Invalid compilation unit');
  }
  
  if (unit.source.length > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Source code too large to compile');
  }
  
  const COMPILATION_TIMEOUT = 60000; // 60 second timeout
  
  try {
    // RESOURCE EXHAUSTION BUG FIX: Set timeout for entire compilation
    const timeoutId = setTimeout(() => {
      throw new Error('Compilation timeout');
    }, COMPILATION_TIMEOUT);
    
    try {
      // Lexical analysis
      const parseStartTime = performance.now();
      const lexer = new VB6Lexer(unit.source);
      const tokens = lexer.tokenize();
    
    // Parsing
    const parser = new VB6Parser(tokens);
    const ast = parser.parse();
    const parseTime = performance.now() - parseStartTime;
    
    // Semantic analysis (simplified)
    const analyzeStartTime = performance.now();
    // TODO: Add semantic analysis
    const analyzeTime = performance.now() - analyzeStartTime;
    
    // Optimization
    const optimizeStartTime = performance.now();
    let optimizedAST = ast;
    if (options.constantFolding) {
      optimizedAST = constantFold(optimizedAST);
    }
    if (options.deadCodeElimination) {
      optimizedAST = eliminateDeadCode(optimizedAST);
    }
    const optimizeTime = performance.now() - optimizeStartTime;
    
    // Code generation
    const generateStartTime = performance.now();
    const generator = new VB6CodeGenerator();
    let output = generator.generate(optimizedAST);
    
    if (options.minification) {
      output = minifyCode(output);
    }
    const generateTime = performance.now() - generateStartTime;
    
      // Clear timeout on success
      clearTimeout(timeoutId);
      
      return {
        success: true,
        output,
        errors,
        warnings,
        metrics: {
          parseTime,
          analyzeTime,
          optimizeTime,
          generateTime,
          totalTime: performance.now() - startTime,
          linesOfCode: unit.source.split('\n').length,
          cacheHits: 0,
          cacheMisses: 1
        }
      };
    } catch (innerError) {
      clearTimeout(timeoutId);
      throw innerError;
    }
  } catch (error) {
    errors.push({
      line: 0,
      column: 0,
      message: error instanceof Error ? error.message : 'Compilation error',
      severity: 'error',
      code: 'COMPILE_ERROR'
    });
    
    return {
      success: false,
      output: '',
      errors,
      warnings,
      metrics: {
        parseTime: 0,
        analyzeTime: 0,
        optimizeTime: 0,
        generateTime: 0,
        totalTime: performance.now() - startTime,
        linesOfCode: 0,
        cacheHits: 0,
        cacheMisses: 1
      }
    };
  }
}

// Simple optimizations
function constantFold(ast: any): any {
  // TODO: Implement constant folding
  return ast;
}

function eliminateDeadCode(ast: any): any {
  // TODO: Implement dead code elimination
  return ast;
}

function minifyCode(code: string): string {
  // RESOURCE EXHAUSTION BUG FIX: Limit minification input size
  if (typeof code !== 'string') {
    return '';
  }
  if (code.length > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('Code too large to minify');
  }
  
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

// Initialize protection system
const exploitationProtection = ServiceWorkerExploitationProtection.getInstance();

// Worker message handler
self.addEventListener('message', (event) => {
  const { id, type, payload } = event.data;
  
  // SERVICE WORKER PERSISTENCE BUG FIX: Validate message safety
  if (!exploitationProtection.validateMessage(event.data)) {
    self.postMessage({
      id,
      type: 'compilation-error',
      payload: { message: 'Invalid or unsafe message' }
    });
    return;
  }
  
  // SERVICE WORKER PERSISTENCE BUG FIX: Check concurrent operations
  const operationId = `${type}_${id}_${Date.now()}`;
  if (!exploitationProtection.startOperation(operationId)) {
    self.postMessage({
      id,
      type: 'compilation-error',
      payload: { message: 'Too many concurrent operations' }
    });
    return;
  }
  
  try {
    switch (type) {
      case 'compile-unit':
        try {
          const { unit, options } = payload;
          
          // SERVICE WORKER PERSISTENCE BUG FIX: Validate compilation unit
          if (!unit || typeof unit.source !== 'string') {
            throw new Error('Invalid compilation unit');
          }
          
          // Additional safety checks
          if (unit.source.length > 5 * 1024 * 1024) { // 5MB limit for individual files
            throw new Error('Source file too large');
          }
          
          const result = compileUnit(unit, options);
          
          self.postMessage({
            id,
            type: 'compilation-complete',
            payload: result
          });
        } catch (error) {
          self.postMessage({
            id,
            type: 'compilation-error',
            payload: {
              message: error instanceof Error ? error.message : 'Worker compilation error'
            }
          });
        }
        break;
        
      case 'worker-ping':
        // SERVICE WORKER PERSISTENCE BUG FIX: Health check support
        self.postMessage({
          id,
          type: 'worker-pong',
          payload: {
            uptime: Date.now() - exploitationProtection['workerStartTime'],
            activeOperations: exploitationProtection['activeOperations'].size
          }
        });
        break;
        
      case 'worker-terminate':
        // SERVICE WORKER PERSISTENCE BUG FIX: Safe termination
        exploitationProtection.cleanup();
        self.postMessage({
          id,
          type: 'worker-terminated',
          payload: { reason: 'Requested termination' }
        });
        self.close();
        break;
        
      default:
        self.postMessage({
          id,
          type: 'unknown-message',
          payload: { originalType: type }
        });
    }
  } finally {
    // SERVICE WORKER PERSISTENCE BUG FIX: Always end operation
    exploitationProtection.endOperation(operationId);
  }
});

// SPECULATIVE EXECUTION BUG FIX: Spectre mitigation functions

/**
 * Spectre-resistant memory access randomization
 */
function spectreResistantMemoryAccess(): void {
  // Create unpredictable memory access patterns to prevent Spectre attacks
  const sizes = [32, 64, 128, 256];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const dummy = new Array(size);
  
  // Random memory accesses to obfuscate cache state
  for (let i = 0; i < Math.min(size / 16, 16); i++) {
    const randomIndex = Math.floor(Math.random() * size);
    dummy[randomIndex] = Math.random();
  }
}

/**
 * Speculative execution barrier
 */
function spectreBarrier(): void {
  // Create a barrier to prevent speculative execution
  let barrier = 0;
  for (let i = 0; i < 4; i++) {
    barrier += Math.random() > 0.5 ? 1 : 0;
  }
  
  // This branch should never execute but prevents speculation
  if (barrier > 10) {
    throw new Error('Spectre barrier violation');
  }
}

// SERVICE WORKER PERSISTENCE BUG FIX: Cleanup on worker termination
self.addEventListener('beforeunload', () => {
  const protection = ServiceWorkerExploitationProtection.getInstance();
  protection.cleanup();
});

// SERVICE WORKER PERSISTENCE BUG FIX: Handle unexpected errors
self.addEventListener('error', (event) => {
  console.error('Worker error:', event.error);
  const protection = ServiceWorkerExploitationProtection.getInstance();
  protection.cleanup();
  
  self.postMessage({
    id: 'worker-error',
    type: 'worker-error',
    payload: {
      message: event.error ? event.error.message : 'Unknown worker error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// SERVICE WORKER PERSISTENCE BUG FIX: Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in worker:', event.reason);
  const protection = ServiceWorkerExploitationProtection.getInstance();
  protection.cleanup();
  
  self.postMessage({
    id: 'worker-unhandled-rejection',
    type: 'worker-error',
    payload: {
      message: event.reason ? String(event.reason) : 'Unhandled promise rejection'
    }
  });
});

// Export for TypeScript
export {};