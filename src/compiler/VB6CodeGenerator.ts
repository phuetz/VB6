/**
 * Advanced JavaScript Code Generator for VB6
 * 
 * Generates highly optimized JavaScript code with:
 * - Minimal overhead and runtime checks
 * - Inlined operations where possible
 * - Optimized data structures
 * - Fast property access patterns
 * - Minimal garbage collection pressure
 * - JIT-friendly code patterns
 */

interface CodeGenOptions {
  targetES: 'ES5' | 'ES6' | 'ES2020' | 'ESNext';
  minify: boolean;
  inline: boolean;
  fastMath: boolean;
  unsafeOptimizations: boolean;
  hoistConstants: boolean;
  precomputeExpressions: boolean;
  useTypedArrays: boolean;
  simdHints: boolean;
}

interface OptimizationHints {
  hotFunctions: Set<string>;
  monomorphicCalls: Map<string, string>;
  constantValues: Map<string, any>;
  arrayLengths: Map<string, number>;
  loopBounds: Map<string, { min: number; max: number }>;
}

export class VB6CodeGenerator {
  private indentLevel: number = 0;
  private output: string[] = [];
  private tempVarCounter: number = 0;
  private labelCounter: number = 0;
  private options: CodeGenOptions;
  private hints: OptimizationHints;
  private inlinedFunctions: Map<string, string> = new Map();
  private constantPool: Map<any, string> = new Map();
  
  constructor(options: CodeGenOptions, hints: OptimizationHints) {
    this.options = options;
    this.hints = hints;
  }
  
  /**
   * Generate optimized JavaScript from VB6 AST
   */
  generate(ast: any): string {
    this.output = [];
    this.generatePrelude();
    this.generateProgram(ast);
    this.generateEpilogue();
    
    let code = this.output.join('\n');
    
    if (this.options.minify) {
      code = this.minifyCode(code);
    }
    
    return code;
  }
  
  private generatePrelude(): void {
    // Use strict mode for better optimization
    this.emit('"use strict";');
    this.emit('');
    
    // Fast runtime helpers
    this.emit('// VB6 Runtime Helpers (Optimized)');
    
    if (this.options.fastMath) {
      this.emit('const _abs = Math.abs;');
      this.emit('const _floor = Math.floor;');
      this.emit('const _ceil = Math.ceil;');
      this.emit('const _round = Math.round;');
      this.emit('const _sqrt = Math.sqrt;');
      this.emit('const _pow = Math.pow;');
      this.emit('const _min = Math.min;');
      this.emit('const _max = Math.max;');
    }
    
    // Optimized VB6 runtime functions
    this.emit(`
// Fast string operations
const _mid = (s, start, len) => s.substr(start - 1, len);
const _left = (s, n) => s.substr(0, n);
const _right = (s, n) => s.substr(-n);
const _len = s => s.length;
const _trim = s => s.trim();
const _ltrim = s => s.trimStart();
const _rtrim = s => s.trimEnd();
const _ucase = s => s.toUpperCase();
const _lcase = s => s.toLowerCase();

// Fast array operations
const _redim = (arr, size) => {
  if (arr.length === size) return arr;
  if (arr.length > size) {
    arr.length = size;
    return arr;
  }
  while (arr.length < size) arr.push(undefined);
  return arr;
};

// Fast type conversions
const _cint = v => v | 0;
const _clng = v => Math.trunc(v);
const _csng = v => +v;
const _cdbl = v => +v;
const _cstr = v => String(v);
const _cbool = v => !!v;

// Fast variant type
class Variant {
  constructor(value) {
    this.v = value;
    this.t = typeof value;
  }
  
  get value() { return this.v; }
  set value(v) { this.v = v; this.t = typeof v; }
  
  valueOf() { return this.v; }
  toString() { return String(this.v); }
}
`);
    
    if (this.options.useTypedArrays) {
      this.emit(`
// Typed array support for numeric arrays
const _createIntArray = size => new Int32Array(size);
const _createFloatArray = size => new Float64Array(size);
const _createByteArray = size => new Uint8Array(size);
`);
    }
    
    // Constant pool
    if (this.constantPool.size > 0) {
      this.emit('// Constant pool');
      for (const [value, name] of this.constantPool) {
        this.emit(`const ${name} = ${JSON.stringify(value)};`);
      }
      this.emit('');
    }
  }
  
  private generateProgram(ast: any): void {
    // Generate module-level code
    for (const node of ast.body) {
      this.generateNode(node);
    }
  }
  
  private generateNode(node: any): void {
    switch (node.type) {
      case 'Module':
        this.generateModule(node);
        break;
      
      case 'Class':
        this.generateClass(node);
        break;
      
      case 'Form':
        this.generateForm(node);
        break;
      
      case 'Function':
      case 'Sub':
        this.generateFunction(node);
        break;
      
      case 'Property':
        this.generateProperty(node);
        break;
      
      case 'VariableDeclaration':
        this.generateVariableDeclaration(node);
        break;
      
      case 'Assignment':
        this.generateAssignment(node);
        break;
      
      case 'If':
        this.generateIf(node);
        break;
      
      case 'For':
        this.generateFor(node);
        break;
      
      case 'While':
        this.generateWhile(node);
        break;
      
      case 'DoWhile':
        this.generateDoWhile(node);
        break;
      
      case 'Select':
        this.generateSelect(node);
        break;
      
      case 'Call':
        this.generateCall(node);
        break;
      
      case 'Return':
        this.generateReturn(node);
        break;
      
      case 'Exit':
        this.generateExit(node);
        break;
        
      default:
        this.generateExpression(node);
    }
  }
  
  private generateModule(node: any): void {
    this.emit(`// Module: ${node.name}`);
    
    if (this.options.targetES === 'ES6' || this.options.targetES === 'ES2020' || this.options.targetES === 'ESNext') {
      this.emit(`export class ${node.name} {`);
    } else {
      this.emit(`var ${node.name} = (function() {`);
    }
    
    this.indent();
    
    // Generate static members
    for (const member of node.members) {
      this.generateNode(member);
    }
    
    this.dedent();
    
    if (this.options.targetES === 'ES6' || this.options.targetES === 'ES2020' || this.options.targetES === 'ESNext') {
      this.emit('}');
    } else {
      this.emit('  return {');
      // Export public members
      const publicMembers = node.members.filter((m: any) => m.visibility === 'public');
      for (let i = 0; i < publicMembers.length; i++) {
        const member = publicMembers[i];
        this.emit(`    ${member.name}: ${member.name}${i < publicMembers.length - 1 ? ',' : ''}`);
      }
      this.emit('  };');
      this.emit('})();');
    }
  }
  
  private generateFunction(node: any): void {
    const isHot = this.hints.hotFunctions.has(node.name);
    const shouldInline = this.options.inline && node.body.length < 5;
    
    // Generate optimized function
    const params = node.params.map((p: any) => p.name).join(', ');
    
    if (shouldInline) {
      // Store for inlining
      const body = this.generateFunctionBody(node.body, true);
      this.inlinedFunctions.set(node.name, body);
    }
    
    if (isHot) {
      // Add optimization hints for JIT
      this.emit(`// HOT FUNCTION - Optimized for performance`);
      this.emit(`// @inline`);
      this.emit(`// @optimize`);
    }
    
    if (this.options.targetES === 'ES6' || this.options.targetES === 'ES2020' || this.options.targetES === 'ESNext') {
      this.emit(`static ${node.name}(${params}) {`);
    } else {
      this.emit(`function ${node.name}(${params}) {`);
    }
    
    this.indent();
    
    // Parameter type hints for optimization
    if (this.options.unsafeOptimizations) {
      for (const param of node.params) {
        if (param.type === 'Integer' || param.type === 'Long') {
          this.emit(`${param.name} = ${param.name} | 0; // Force integer`);
        } else if (param.type === 'Single' || param.type === 'Double') {
          this.emit(`${param.name} = +${param.name}; // Force number`);
        }
      }
    }
    
    // Generate function body
    this.generateFunctionBody(node.body);
    
    this.dedent();
    this.emit('}');
  }
  
  private generateFunctionBody(statements: any[], forInline: boolean = false): string {
    if (forInline) {
      const saved = this.output;
      this.output = [];
      
      for (const stmt of statements) {
        this.generateNode(stmt);
      }
      
      const body = this.output.join('; ');
      this.output = saved;
      return body;
    }
    
    for (const stmt of statements) {
      this.generateNode(stmt);
    }
    
    return '';
  }
  
  private generateFor(node: any): void {
    const loopVar = node.variable;
    const start = this.generateExpressionCode(node.start);
    const end = this.generateExpressionCode(node.end);
    const step = node.step ? this.generateExpressionCode(node.step) : '1';
    
    // Check for optimization opportunities
    const bounds = this.hints.loopBounds.get(node.id);
    const isCountingUp = !node.step || node.step.value > 0;
    
    if (this.options.unsafeOptimizations && bounds) {
      // Unroll small loops
      if (bounds.max - bounds.min <= 4) {
        this.emit('// Unrolled loop');
        for (let i = bounds.min; i <= bounds.max; i++) {
          this.emit(`{ const ${loopVar} = ${i};`);
          this.indent();
          for (const stmt of node.body) {
            this.generateNode(stmt);
          }
          this.dedent();
          this.emit('}');
        }
        return;
      }
    }
    
    // Generate optimized loop
    if (isCountingUp && step === '1') {
      // Optimized counting loop
      this.emit(`for (let ${loopVar} = ${start}; ${loopVar} <= ${end}; ${loopVar}++) {`);
    } else if (!isCountingUp && step === '-1') {
      // Optimized countdown loop
      this.emit(`for (let ${loopVar} = ${start}; ${loopVar} >= ${end}; ${loopVar}--) {`);
    } else {
      // General loop
      const op = isCountingUp ? '<=' : '>=';
      this.emit(`for (let ${loopVar} = ${start}; ${loopVar} ${op} ${end}; ${loopVar} += ${step}) {`);
    }
    
    this.indent();
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    this.dedent();
    this.emit('}');
  }
  
  private generateWhile(node: any): void {
    const condition = this.generateExpressionCode(node.condition);
    
    this.emit(`while (${condition}) {`);
    this.indent();
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    this.dedent();
    this.emit('}');
  }
  
  private generateIf(node: any): void {
    const condition = this.generateExpressionCode(node.condition);
    
    // Check for constant conditions
    if (this.options.precomputeExpressions) {
      const constValue = this.evaluateConstant(node.condition);
      if (constValue !== undefined) {
        // Eliminate dead branch
        if (constValue) {
          for (const stmt of node.then) {
            this.generateNode(stmt);
          }
        } else if (node.else) {
          for (const stmt of node.else) {
            this.generateNode(stmt);
          }
        }
        return;
      }
    }
    
    this.emit(`if (${condition}) {`);
    this.indent();
    for (const stmt of node.then) {
      this.generateNode(stmt);
    }
    this.dedent();
    
    if (node.else) {
      this.emit('} else {');
      this.indent();
      for (const stmt of node.else) {
        this.generateNode(stmt);
      }
      this.dedent();
    }
    
    this.emit('}');
  }
  
  private generateSelect(node: any): void {
    const expr = this.generateExpressionCode(node.expression);
    const tempVar = this.getTempVar();
    
    this.emit(`const ${tempVar} = ${expr};`);
    
    let first = true;
    for (const caseNode of node.cases) {
      const prefix = first ? 'if' : '} else if';
      first = false;
      
      if (caseNode.values) {
        const conditions = caseNode.values.map((v: any) => 
          `${tempVar} === ${this.generateExpressionCode(v)}`
        ).join(' || ');
        
        this.emit(`${prefix} (${conditions}) {`);
      } else {
        // Case Else
        this.emit('} else {');
      }
      
      this.indent();
      for (const stmt of caseNode.body) {
        this.generateNode(stmt);
      }
      this.dedent();
    }
    
    this.emit('}');
  }
  
  private generateCall(node: any): void {
    const funcName = node.name;
    
    // Check for inlining opportunity
    if (this.options.inline && this.inlinedFunctions.has(funcName)) {
      this.emit(`// Inlined: ${funcName}`);
      const inlinedCode = this.inlinedFunctions.get(funcName)!;
      // Parameter substitution would go here
      this.emit(inlinedCode);
      return;
    }
    
    // Check for built-in function optimization
    const optimized = this.optimizeBuiltInCall(node);
    if (optimized) {
      this.emit(optimized + ';');
      return;
    }
    
    // Regular function call
    const args = node.arguments.map((arg: any) => 
      this.generateExpressionCode(arg)
    ).join(', ');
    
    this.emit(`${funcName}(${args});`);
  }
  
  private generateExpression(node: any): any {
    const code = this.generateExpressionCode(node);
    this.emit(code + ';');
  }
  
  private generateExpressionCode(node: any): string {
    if (!node) return 'undefined';
    
    switch (node.type) {
      case 'Literal':
        return this.generateLiteral(node);
      
      case 'Identifier':
        return node.name;
      
      case 'BinaryExpression':
        return this.generateBinaryExpression(node);
      
      case 'UnaryExpression':
        return this.generateUnaryExpression(node);
      
      case 'CallExpression':
        return this.generateCallExpression(node);
      
      case 'MemberExpression':
        return this.generateMemberExpression(node);
      
      case 'ArrayExpression':
        return this.generateArrayExpression(node);
      
      default:
        return '/* Unknown expression type */';
    }
  }
  
  private generateBinaryExpression(node: any): string {
    const left = this.generateExpressionCode(node.left);
    const right = this.generateExpressionCode(node.right);
    
    // Optimize operations
    if (this.options.precomputeExpressions) {
      const leftConst = this.evaluateConstant(node.left);
      const rightConst = this.evaluateConstant(node.right);
      
      if (leftConst !== undefined && rightConst !== undefined) {
        // Precompute constant expression
        const result = this.evaluateBinaryOp(node.operator, leftConst, rightConst);
        if (result !== undefined) {
          return this.generateLiteral({ type: 'Literal', value: result });
        }
      }
    }
    
    // Special optimizations
    switch (node.operator) {
      case '&': // VB6 string concatenation
        return `${left} + ${right}`;
      
      case '\\': // Integer division
        return `(${left} / ${right}) | 0`;
      
      case '^': // Power
        return this.options.fastMath ? `_pow(${left}, ${right})` : `Math.pow(${left}, ${right})`;
      
      case 'Mod':
        return `${left} % ${right}`;
      
      case 'And':
        return `${left} && ${right}`;
      
      case 'Or':
        return `${left} || ${right}`;
      
      case 'Xor':
        return `!!(${left}) !== !!(${right})`;
      
      case '=': // VB6 equality
        return `${left} === ${right}`;
      
      case '<>': // VB6 inequality
        return `${left} !== ${right}`;
      
      default:
        return `${left} ${node.operator} ${right}`;
    }
  }
  
  private generateLiteral(node: any): string {
    if (typeof node.value === 'string') {
      // Check if we can use constant pool
      if (this.options.hoistConstants && node.value.length > 20) {
        let constName = this.constantPool.get(node.value);
        if (!constName) {
          constName = `_const${this.constantPool.size}`;
          this.constantPool.set(node.value, constName);
        }
        return constName;
      }
      return JSON.stringify(node.value);
    }
    
    return String(node.value);
  }
  
  private optimizeBuiltInCall(node: any): string | null {
    const func = node.name.toLowerCase();
    const args = node.arguments;
    
    // Optimize common VB6 functions
    switch (func) {
      case 'mid':
      case 'mid$':
        if (args.length === 3) {
          return `_mid(${this.generateExpressionCode(args[0])}, ${
            this.generateExpressionCode(args[1])}, ${
            this.generateExpressionCode(args[2])})`;
        }
        break;
      
      case 'left':
      case 'left$':
        return `_left(${this.generateExpressionCode(args[0])}, ${
          this.generateExpressionCode(args[1])})`;
      
      case 'right':
      case 'right$':
        return `_right(${this.generateExpressionCode(args[0])}, ${
          this.generateExpressionCode(args[1])})`;
      
      case 'len':
        return `_len(${this.generateExpressionCode(args[0])})`;
      
      case 'abs':
        return this.options.fastMath ? 
          `_abs(${this.generateExpressionCode(args[0])})` :
          `Math.abs(${this.generateExpressionCode(args[0])})`;
      
      case 'int':
        return `_floor(${this.generateExpressionCode(args[0])})`;
      
      case 'fix':
        return `_cint(${this.generateExpressionCode(args[0])})`;
      
      case 'sqr':
        return this.options.fastMath ?
          `_sqrt(${this.generateExpressionCode(args[0])})` :
          `Math.sqrt(${this.generateExpressionCode(args[0])})`;
    }
    
    return null;
  }
  
  private generateVariableDeclaration(node: any): void {
    const varKeyword = this.options.targetES === 'ES5' ? 'var' : 'let';
    
    for (const variable of node.variables) {
      let initializer = '';
      
      // Type-specific initialization
      if (variable.type) {
        switch (variable.type) {
          case 'Integer':
          case 'Long':
            initializer = ' = 0';
            break;
          case 'Single':
          case 'Double':
          case 'Currency':
            initializer = ' = 0.0';
            break;
          case 'String':
            initializer = ' = ""';
            break;
          case 'Boolean':
            initializer = ' = false';
            break;
          case 'Date':
            initializer = ' = new Date(0)';
            break;
          default:
            if (variable.isArray) {
              const size = variable.dimensions?.[0] || 0;
              if (this.options.useTypedArrays && 
                  (variable.type === 'Integer' || variable.type === 'Long')) {
                initializer = ` = _createIntArray(${size})`;
              } else if (this.options.useTypedArrays && 
                         (variable.type === 'Single' || variable.type === 'Double')) {
                initializer = ` = _createFloatArray(${size})`;
              } else {
                initializer = ` = new Array(${size})`;
              }
            } else {
              initializer = ' = null';
            }
        }
      }
      
      if (variable.initializer) {
        initializer = ` = ${this.generateExpressionCode(variable.initializer)}`;
      }
      
      this.emit(`${varKeyword} ${variable.name}${initializer};`);
    }
  }
  
  private generateAssignment(node: any): void {
    const target = this.generateExpressionCode(node.left);
    const value = this.generateExpressionCode(node.right);
    
    this.emit(`${target} = ${value};`);
  }
  
  private generateReturn(node: any): void {
    if (node.value) {
      this.emit(`return ${this.generateExpressionCode(node.value)};`);
    } else {
      this.emit('return;');
    }
  }
  
  private generateExit(node: any): void {
    switch (node.exitType) {
      case 'Sub':
      case 'Function':
        this.emit('return;');
        break;
      case 'For':
      case 'Do':
      case 'While':
        this.emit('break;');
        break;
    }
  }
  
  private generateEpilogue(): void {
    // Any cleanup or final exports
    if (this.options.targetES === 'ES6' || this.options.targetES === 'ES2020' || this.options.targetES === 'ESNext') {
      this.emit('');
      this.emit('// Module exports handled by ES6 syntax');
    }
  }
  
  // Helper methods
  
  private emit(code: string): void {
    if (code) {
      const indent = '  '.repeat(this.indentLevel);
      this.output.push(indent + code);
    } else {
      this.output.push('');
    }
  }
  
  private indent(): void {
    this.indentLevel++;
  }
  
  private dedent(): void {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
  
  private getTempVar(): string {
    return `_t${this.tempVarCounter++}`;
  }
  
  private getLabel(): string {
    return `_L${this.labelCounter++}`;
  }
  
  private evaluateConstant(node: any): any {
    if (node.type === 'Literal') {
      return node.value;
    }
    
    if (node.type === 'Identifier') {
      return this.hints.constantValues.get(node.name);
    }
    
    if (node.type === 'BinaryExpression') {
      const left = this.evaluateConstant(node.left);
      const right = this.evaluateConstant(node.right);
      
      if (left !== undefined && right !== undefined) {
        return this.evaluateBinaryOp(node.operator, left, right);
      }
    }
    
    return undefined;
  }
  
  private evaluateBinaryOp(op: string, left: any, right: any): any {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '\\': return Math.floor(left / right);
      case 'Mod': return left % right;
      case '^': return Math.pow(left, right);
      case '&': return String(left) + String(right);
      case '=': return left === right;
      case '<>': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case 'And': return left && right;
      case 'Or': return left || right;
      case 'Xor': return !!(left) !== !!(right);
    }
    
    return undefined;
  }
  
  private minifyCode(code: string): string {
    // Simple minification (in production, use a proper minifier)
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}();,:])\s*/g, '$1') // Remove space around syntax
      .trim();
  }
  
  private generateClass(node: any): void {
    // ES6 class generation
    if (this.options.targetES === 'ES6' || this.options.targetES === 'ES2020' || this.options.targetES === 'ESNext') {
      this.emit(`export class ${node.name} {`);
      this.indent();
      
      // Constructor
      this.emit('constructor() {');
      this.indent();
      // Initialize instance variables
      for (const member of node.members) {
        if (member.type === 'Variable') {
          this.emit(`this.${member.name} = ${this.getDefaultValue(member.dataType)};`);
        }
      }
      this.dedent();
      this.emit('}');
      
      // Methods and properties
      for (const member of node.members) {
        if (member.type !== 'Variable') {
          this.generateNode(member);
        }
      }
      
      this.dedent();
      this.emit('}');
    } else {
      // ES5 constructor function
      this.emit(`function ${node.name}() {`);
      this.indent();
      
      for (const member of node.members) {
        if (member.type === 'Variable') {
          this.emit(`this.${member.name} = ${this.getDefaultValue(member.dataType)};`);
        }
      }
      
      this.dedent();
      this.emit('}');
      
      // Prototype methods
      for (const member of node.members) {
        if (member.type === 'Function' || member.type === 'Sub') {
          const params = member.params.map((p: any) => p.name).join(', ');
          this.emit(`${node.name}.prototype.${member.name} = function(${params}) {`);
          this.indent();
          this.generateFunctionBody(member.body);
          this.dedent();
          this.emit('};');
        }
      }
    }
  }
  
  private generateForm(node: any): void {
    // Forms are treated as special classes
    this.generateClass({
      ...node,
      type: 'Class'
    });
  }
  
  private generateProperty(node: any): void {
    // ES6 getter/setter
    if (this.options.targetES === 'ES6' || this.options.targetES === 'ES2020' || this.options.targetES === 'ESNext') {
      if (node.getter) {
        this.emit(`get ${node.name}() {`);
        this.indent();
        this.generateFunctionBody(node.getter.body);
        this.dedent();
        this.emit('}');
      }
      
      if (node.setter) {
        this.emit(`set ${node.name}(value) {`);
        this.indent();
        this.generateFunctionBody(node.setter.body);
        this.dedent();
        this.emit('}');
      }
    }
  }
  
  private generateMemberExpression(node: any): string {
    const object = this.generateExpressionCode(node.object);
    const property = node.computed ? 
      `[${this.generateExpressionCode(node.property)}]` :
      `.${node.property.name}`;
    
    return `${object}${property}`;
  }
  
  private generateArrayExpression(node: any): string {
    const elements = node.elements.map((el: any) => 
      this.generateExpressionCode(el)
    ).join(', ');
    
    return `[${elements}]`;
  }
  
  private generateUnaryExpression(node: any): string {
    const operand = this.generateExpressionCode(node.operand);
    
    switch (node.operator) {
      case 'Not':
        return `!${operand}`;
      case '-':
        return `-${operand}`;
      case '+':
        return `+${operand}`;
      default:
        return `${node.operator} ${operand}`;
    }
  }
  
  private generateCallExpression(node: any): string {
    const callee = this.generateExpressionCode(node.callee);
    const args = node.arguments.map((arg: any) => 
      this.generateExpressionCode(arg)
    ).join(', ');
    
    // Check for optimization
    const optimized = this.optimizeBuiltInCall({
      name: callee,
      arguments: node.arguments
    });
    
    if (optimized) {
      return optimized;
    }
    
    return `${callee}(${args})`;
  }
  
  private generateDoWhile(node: any): void {
    const condition = this.generateExpressionCode(node.condition);
    
    this.emit('do {');
    this.indent();
    for (const stmt of node.body) {
      this.generateNode(stmt);
    }
    this.dedent();
    this.emit(`} while (${condition});`);
  }
  
  private getDefaultValue(type: string): string {
    switch (type) {
      case 'Integer':
      case 'Long':
        return '0';
      case 'Single':
      case 'Double':
      case 'Currency':
        return '0.0';
      case 'String':
        return '""';
      case 'Boolean':
        return 'false';
      case 'Date':
        return 'new Date(0)';
      default:
        return 'null';
    }
  }
}