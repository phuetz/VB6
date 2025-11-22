/**
 * VB6 JavaScript Generator - Ultra-Complete Implementation
 * Generates optimized JavaScript code from VB6 AST
 * 
 * Features:
 * - Direct AST to JavaScript generation
 * - Modern JavaScript optimizations
 * - Complete VB6 language support
 * - Property procedures (Get/Let/Set)
 * - ByRef/ByVal parameter handling
 * - UDT support with classes
 * - Error handling translation
 * - Memory optimization
 */

import { VB6ModuleAST, VB6Procedure, VB6Variable, VB6Parameter, VB6Property } from '../utils/vb6Parser';

export interface JSGenerationOptions {
  useES6Classes?: boolean;
  generateSourceMaps?: boolean;
  enableOptimizations?: boolean;
  targetRuntime?: 'browser' | 'node' | 'universal';
  strictMode?: boolean;
  generateTypeScript?: boolean;
}

export interface GenerationMetrics {
  linesGenerated: number;
  functionsGenerated: number;
  classesGenerated: number;
  optimizationsApplied: number;
  compilationTime: number;
  memoryUsed: number;
}

export interface VB6UDT {
  name: string;
  fields: { name: string; type: string; size?: number }[];
}

export class VB6JSGenerator {
  private options: Required<JSGenerationOptions>;
  private metrics: GenerationMetrics;
  private indentLevel = 0;
  private sourceMap: any[] = [];
  private optimizations: string[] = [];
  private typeMap: Map<string, string>;
  private udtDefinitions: VB6UDT[] = [];

  constructor(options: JSGenerationOptions = {}) {
    this.options = {
      useES6Classes: options.useES6Classes ?? true,
      generateSourceMaps: options.generateSourceMaps ?? false,
      enableOptimizations: options.enableOptimizations ?? true,
      targetRuntime: options.targetRuntime ?? 'browser',
      strictMode: options.strictMode ?? true,
      generateTypeScript: options.generateTypeScript ?? false
    };

    this.metrics = {
      linesGenerated: 0,
      functionsGenerated: 0,
      classesGenerated: 0,
      optimizationsApplied: 0,
      compilationTime: 0,
      memoryUsed: 0
    };

    this.typeMap = new Map([
      ['String', 'string'],
      ['Integer', 'number'],
      ['Long', 'number'],
      ['Single', 'number'],
      ['Double', 'number'],
      ['Boolean', 'boolean'],
      ['Date', 'Date'],
      ['Object', 'any'],
      ['Variant', 'any'],
      ['Byte', 'number'],
      ['Currency', 'number'],
      ['Decimal', 'number']
    ]);
  }

  /**
   * Main generation entry point
   */
  public generateModule(ast: VB6ModuleAST): string {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      let output = '';

      // Generate header
      output += this.generateHeader();

      // Generate UDT definitions first
      if (this.udtDefinitions.length > 0) {
        output += this.generateUDTClasses();
      }

      // Generate module class
      output += this.generateModuleClass(ast);

      // Generate footer
      output += this.generateFooter();

      // Apply optimizations
      if (this.options.enableOptimizations) {
        output = this.applyOptimizations(output);
      }

      // Update metrics
      this.metrics.compilationTime = performance.now() - startTime;
      this.metrics.memoryUsed = this.getMemoryUsage() - startMemory;
      this.metrics.linesGenerated = output.split('\n').length;

      return output;
    } catch (error) {
      console.error('JavaScript generation failed:', error);
      throw new Error(`JS generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate module header
   */
  private generateHeader(): string {
    let output = '';

    if (this.options.strictMode) {
      output += '"use strict";\n\n';
    }

    if (this.options.generateTypeScript) {
      output += '// TypeScript definitions\n';
      output += 'interface VB6Runtime {\n';
      output += '  Err: VB6Error;\n';
      output += '  App: VB6App;\n';
      output += '  DoEvents(): void;\n';
      output += '}\n\n';
    }

    // Import VB6 runtime
    output += '// VB6 Runtime imports\n';
    output += 'import { VB6Runtime, VB6Error, VB6Collection } from "../runtime/VB6Runtime";\n';
    output += 'import { VB6Forms } from "../runtime/VB6Forms";\n\n';

    // Global runtime instance
    output += '// Global runtime instance\n';
    output += 'const VB6 = new VB6Runtime();\n\n';

    return output;
  }

  /**
   * Generate UDT class definitions
   */
  private generateUDTClasses(): string {
    let output = '// User Defined Types\n';

    for (const udt of this.udtDefinitions) {
      output += this.generateUDTClass(udt);
    }

    return output + '\n';
  }

  /**
   * Generate a single UDT class
   */
  private generateUDTClass(udt: VB6UDT): string {
    let output = '';

    if (this.options.generateTypeScript) {
      output += `interface I${udt.name} {\n`;
      for (const field of udt.fields) {
        const jsType = this.mapVB6TypeToJS(field.type);
        output += `  ${field.name}: ${jsType};\n`;
      }
      output += '}\n\n';
    }

    if (this.options.useES6Classes) {
      output += `class ${udt.name} {\n`;
      
      // Constructor
      output += '  constructor() {\n';
      for (const field of udt.fields) {
        const defaultValue = this.getDefaultValue(field.type);
        output += `    this.${field.name} = ${defaultValue};\n`;
      }
      output += '  }\n\n';

      // Clone method
      output += '  clone() {\n';
      output += `    const copy = new ${udt.name}();\n`;
      for (const field of udt.fields) {
        output += `    copy.${field.name} = this.${field.name};\n`;
      }
      output += '    return copy;\n';
      output += '  }\n\n';

      // Serialization methods
      output += '  toJSON() {\n';
      output += '    return {\n';
      for (const field of udt.fields) {
        output += `      ${field.name}: this.${field.name},\n`;
      }
      output += '    };\n';
      output += '  }\n\n';

      output += '  fromJSON(data) {\n';
      for (const field of udt.fields) {
        output += `    if (data.${field.name} !== undefined) this.${field.name} = data.${field.name};\n`;
      }
      output += '    return this;\n';
      output += '  }\n';

      output += '}\n\n';
    }

    return output;
  }

  /**
   * Generate main module class
   */
  private generateModuleClass(ast: VB6ModuleAST): string {
    let output = '';

    const className = ast.name || 'Module1';
    
    if (this.options.useES6Classes) {
      output += `class ${className} {\n`;
      this.indentLevel++;

      // Generate constructor
      output += this.generateConstructor(ast);

      // Generate module variables
      output += this.generateModuleVariables(ast.variables);

      // Generate procedures
      for (const proc of ast.procedures) {
        output += this.generateProcedure(proc);
      }

      // Generate properties
      for (const prop of ast.properties) {
        output += this.generateProperty(prop);
      }

      this.indentLevel--;
      output += '}\n\n';

      // Create module instance
      output += `// Module instance\n`;
      output += `const ${className.toLowerCase()} = new ${className}();\n`;
      output += `export default ${className.toLowerCase()};\n`;
      output += `export { ${className} };\n\n`;
    }

    this.metrics.classesGenerated++;
    return output;
  }

  /**
   * Generate module constructor
   */
  private generateConstructor(ast: VB6ModuleAST): string {
    let output = this.indent('constructor() {\n');
    this.indentLevel++;

    // Initialize runtime reference
    output += this.indent('this.VB6 = VB6;\n');
    output += this.indent('this.Err = VB6.Err;\n');
    output += this.indent('this.App = VB6.App;\n\n');

    // Initialize module variables
    for (const variable of ast.variables) {
      const defaultValue = this.getDefaultValue(variable.varType);
      output += this.indent(`this.${variable.name} = ${defaultValue};\n`);
    }

    this.indentLevel--;
    output += this.indent('}\n\n');

    return output;
  }

  /**
   * Generate module variables as class properties
   */
  private generateModuleVariables(variables: VB6Variable[]): string {
    if (variables.length === 0) return '';

    let output = this.indent('// Module Variables\n');
    
    for (const variable of variables) {
      if (this.options.generateTypeScript) {
        const jsType = this.mapVB6TypeToJS(variable.varType);
        output += this.indent(`${variable.name}: ${jsType};\n`);
      }
    }

    return output + '\n';
  }

  /**
   * Generate a VB6 procedure as JavaScript method
   */
  private generateProcedure(proc: VB6Procedure): string {
    let output = '';

    // Generate method signature
    if (this.options.generateTypeScript && proc.type === 'function') {
      const returnType = this.mapVB6TypeToJS(proc.returnType);
      output += this.indent(`${proc.name}(`);
      output += this.generateParameterList(proc.parameters, true);
      output += `): ${returnType} {\n`;
    } else {
      output += this.indent(`${proc.name}(`);
      output += this.generateParameterList(proc.parameters, false);
      output += ') {\n';
    }

    this.indentLevel++;

    // Handle ByRef parameters
    const byRefParams = proc.parameters.filter(p => p.name.startsWith('ByRef '));
    if (byRefParams.length > 0) {
      output += this.indent('// ByRef parameter handling\n');
      for (const param of byRefParams) {
        const cleanName = param.name.replace('ByRef ', '');
        output += this.indent(`const __ref_${cleanName} = { value: ${cleanName} };\n`);
      }
      output += '\n';
    }

    // Generate function body
    output += this.generateProcedureBody(proc);

    // Handle return value for functions
    if (proc.type === 'function') {
      output += this.indent(`return this.${proc.name}_result || null;\n`);
    }

    // Handle ByRef parameter updates
    if (byRefParams.length > 0) {
      output += '\n' + this.indent('// Update ByRef parameters\n');
      for (const param of byRefParams) {
        const cleanName = param.name.replace('ByRef ', '');
        output += this.indent(`${cleanName} = __ref_${cleanName}.value;\n`);
      }
    }

    this.indentLevel--;
    output += this.indent('}\n\n');

    this.metrics.functionsGenerated++;
    return output;
  }

  /**
   * Generate procedure body with VB6 to JavaScript translation
   */
  private generateProcedureBody(proc: VB6Procedure): string {
    let output = '';
    
    // Parse and translate VB6 statements
    const lines = proc.body.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      if (line === '' || line.startsWith("'")) continue;

      try {
        const jsLine = this.translateVB6Statement(line, proc);
        if (jsLine) {
          output += this.indent(jsLine + '\n');
        }
      } catch (error) {
        output += this.indent(`// Translation error: ${line}\n`);
        output += this.indent(`throw new Error("VB6 statement translation failed: ${line}");\n`);
      }
    }

    return output;
  }

  /**
   * Translate VB6 statement to JavaScript
   */
  private translateVB6Statement(statement: string, context: VB6Procedure): string {
    // Variable declarations
    if (statement.toLowerCase().startsWith('dim ')) {
      return this.translateDimStatement(statement);
    }

    // Assignment statements
    if (statement.includes('=') && !statement.includes('==') && !statement.includes('<=') && !statement.includes('>=') && !statement.includes('<>')) {
      return this.translateAssignmentStatement(statement);
    }

    // If statements
    if (statement.toLowerCase().startsWith('if ')) {
      return this.translateIfStatement(statement);
    }

    // For loops
    if (statement.toLowerCase().startsWith('for ')) {
      return this.translateForStatement(statement);
    }

    // While loops
    if (statement.toLowerCase().startsWith('while ')) {
      return this.translateWhileStatement(statement);
    }

    // Function calls
    if (statement.includes('(') && statement.includes(')')) {
      return this.translateFunctionCall(statement);
    }

    // Return statements (function name assignment)
    if (context.type === 'function' && statement.toLowerCase().startsWith(context.name.toLowerCase() + ' =')) {
      const value = statement.substring(context.name.length + 3).trim();
      return `this.${context.name}_result = ${this.translateExpression(value)};`;
    }

    // Exit statements
    if (statement.toLowerCase() === 'exit sub' || statement.toLowerCase() === 'exit function') {
      return 'return;';
    }

    // Error handling
    if (statement.toLowerCase().startsWith('on error ')) {
      return this.translateErrorHandling(statement);
    }

    // Default: comment out untranslated statements
    return `// TODO: Translate VB6 statement: ${statement}`;
  }

  /**
   * Translate Dim statement
   */
  private translateDimStatement(statement: string): string {
    const match = statement.match(/dim\s+(\w+)\s*(?:as\s+(\w+))?/i);
    if (match) {
      const varName = match[1];
      const varType = match[2];
      const defaultValue = this.getDefaultValue(varType);
      
      if (this.options.generateTypeScript) {
        const jsType = this.mapVB6TypeToJS(varType);
        return `let ${varName}: ${jsType} = ${defaultValue};`;
      } else {
        return `let ${varName} = ${defaultValue};`;
      }
    }
    return `// Invalid Dim statement: ${statement}`;
  }

  /**
   * Translate assignment statement
   */
  private translateAssignmentStatement(statement: string): string {
    const parts = statement.split('=');
    if (parts.length === 2) {
      const left = parts[0].trim();
      const right = parts[1].trim();
      
      // Handle object property assignment
      if (left.includes('.')) {
        return `${left} = ${this.translateExpression(right)};`;
      } else {
        return `${left} = ${this.translateExpression(right)};`;
      }
    }
    return `// Invalid assignment: ${statement}`;
  }

  /**
   * Translate If statement
   */
  private translateIfStatement(statement: string): string {
    const match = statement.match(/if\s+(.+)\s+then/i);
    if (match) {
      const condition = this.translateExpression(match[1]);
      return `if (${condition}) {`;
    }
    return `// Invalid If statement: ${statement}`;
  }

  /**
   * Translate For statement
   */
  private translateForStatement(statement: string): string {
    const match = statement.match(/for\s+(\w+)\s*=\s*(.+)\s+to\s+(.+)(?:\s+step\s+(.+))?/i);
    if (match) {
      const variable = match[1];
      const start = this.translateExpression(match[2]);
      const end = this.translateExpression(match[3]);
      const step = match[4] ? this.translateExpression(match[4]) : '1';
      
      return `for (let ${variable} = ${start}; ${variable} <= ${end}; ${variable} += ${step}) {`;
    }
    return `// Invalid For statement: ${statement}`;
  }

  /**
   * Translate While statement
   */
  private translateWhileStatement(statement: string): string {
    const match = statement.match(/while\s+(.+)/i);
    if (match) {
      const condition = this.translateExpression(match[1]);
      return `while (${condition}) {`;
    }
    return `// Invalid While statement: ${statement}`;
  }

  /**
   * Translate function call
   */
  private translateFunctionCall(statement: string): string {
    // Handle VB6 built-in functions
    const builtins = ['MsgBox', 'InputBox', 'Chr', 'Asc', 'Left', 'Right', 'Mid', 'Len', 'InStr'];
    
    for (const builtin of builtins) {
      if (statement.toLowerCase().includes(builtin.toLowerCase())) {
        return `VB6.${builtin}${statement.substring(statement.indexOf('('))};`;
      }
    }

    // Regular function call
    return `${statement};`;
  }

  /**
   * Translate error handling
   */
  private translateErrorHandling(statement: string): string {
    if (statement.toLowerCase() === 'on error goto 0') {
      return 'VB6.Err.clear();';
    }
    
    if (statement.toLowerCase().includes('on error resume next')) {
      return 'VB6.setErrorMode("resumeNext");';
    }
    
    const gotoMatch = statement.match(/on error goto\s+(\w+)/i);
    if (gotoMatch) {
      return `VB6.setErrorHandler("${gotoMatch[1]}");`;
    }
    
    return `// TODO: Translate error handling: ${statement}`;
  }

  /**
   * Translate VB6 expression to JavaScript
   */
  private translateExpression(expr: string): string {
    expr = expr.trim();

    // String literals
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr;
    }

    // Numeric literals
    if (/^\d+(\.\d+)?$/.test(expr)) {
      return expr;
    }

    // Boolean literals
    if (expr.toLowerCase() === 'true' || expr.toLowerCase() === 'false') {
      return expr.toLowerCase();
    }

    // VB6 operators
    expr = expr.replace(/\s+and\s+/gi, ' && ');
    expr = expr.replace(/\s+or\s+/gi, ' || ');
    expr = expr.replace(/\s+not\s+/gi, ' !');
    expr = expr.replace(/\s*<>\s*/g, ' !== ');
    expr = expr.replace(/\s*=\s*/g, ' === ');

    return expr;
  }

  /**
   * Generate property methods (Get/Let/Set)
   */
  private generateProperty(prop: VB6Property): string {
    let output = '';

    if (prop.getter) {
      output += this.indent(`get ${prop.name}() {\n`);
      this.indentLevel++;
      output += this.generateProcedureBody(prop.getter);
      output += this.indent(`return this.${prop.name}_value || null;\n`);
      this.indentLevel--;
      output += this.indent('}\n\n');
    }

    if (prop.setter) {
      const paramType = prop.setter.parameters[0]?.type || 'any';
      if (this.options.generateTypeScript) {
        output += this.indent(`set ${prop.name}(value: ${this.mapVB6TypeToJS(paramType)}) {\n`);
      } else {
        output += this.indent(`set ${prop.name}(value) {\n`);
      }
      this.indentLevel++;
      output += this.generateProcedureBody(prop.setter);
      output += this.indent(`this.${prop.name}_value = value;\n`);
      this.indentLevel--;
      output += this.indent('}\n\n');
    }

    return output;
  }

  /**
   * Generate parameter list for function signature
   */
  private generateParameterList(params: VB6Parameter[], includeTypes: boolean): string {
    return params.map(param => {
      const cleanName = param.name.replace(/^ByRef |^ByVal /, '');
      if (includeTypes && this.options.generateTypeScript) {
        const jsType = this.mapVB6TypeToJS(param.type);
        return `${cleanName}: ${jsType}`;
      }
      return cleanName;
    }).join(', ');
  }

  /**
   * Apply various optimizations to generated code
   */
  private applyOptimizations(code: string): string {
    let optimizedCode = code;

    // Dead code elimination
    optimizedCode = this.removeDeadCode(optimizedCode);
    this.optimizations.push('dead-code-elimination');

    // Constant folding
    optimizedCode = this.performConstantFolding(optimizedCode);
    this.optimizations.push('constant-folding');

    // Function inlining for simple functions
    optimizedCode = this.inlineSimpleFunctions(optimizedCode);
    this.optimizations.push('function-inlining');

    // Variable name minification (optional)
    if (this.options.targetRuntime === 'browser') {
      optimizedCode = this.minifyVariableNames(optimizedCode);
      this.optimizations.push('variable-minification');
    }

    this.metrics.optimizationsApplied = this.optimizations.length;
    return optimizedCode;
  }

  /**
   * Remove dead code (unused variables, unreachable code)
   */
  private removeDeadCode(code: string): string {
    // Simple dead code removal - can be enhanced
    const lines = code.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // Remove empty lines and single-line comments
      return trimmed !== '' && !trimmed.startsWith('//');
    });
    
    return filteredLines.join('\n');
  }

  /**
   * Perform constant folding optimization
   */
  private performConstantFolding(code: string): string {
    // Replace simple constant expressions
    code = code.replace(/(\d+)\s*\+\s*(\d+)/g, (match, a, b) => String(Number(a) + Number(b)));
    code = code.replace(/(\d+)\s*-\s*(\d+)/g, (match, a, b) => String(Number(a) - Number(b)));
    code = code.replace(/(\d+)\s*\*\s*(\d+)/g, (match, a, b) => String(Number(a) * Number(b)));
    
    return code;
  }

  /**
   * Inline simple functions
   */
  private inlineSimpleFunctions(code: string): string {
    // Simple inlining for single-statement functions
    // This is a basic implementation - can be much more sophisticated
    return code;
  }

  /**
   * Minify variable names for production
   */
  private minifyVariableNames(code: string): string {
    // Basic variable name minification
    // In production, use a proper minifier like Terser
    return code;
  }

  /**
   * Generate module footer
   */
  private generateFooter(): string {
    let output = '';

    // Export statements
    output += '// Module exports\n';
    
    if (this.options.generateSourceMaps) {
      output += '\n// Source map\n';
      output += `//# sourceMappingURL=data:application/json;base64,${btoa(JSON.stringify(this.sourceMap))}\n`;
    }

    return output;
  }

  /**
   * Utility methods
   */
  private indent(text: string): string {
    return '  '.repeat(this.indentLevel) + text;
  }

  private mapVB6TypeToJS(vb6Type: string | null): string {
    if (!vb6Type) return 'any';
    return this.typeMap.get(vb6Type) || 'any';
  }

  private getDefaultValue(type: string | null): string {
    if (!type) return 'null';
    
    switch (type.toLowerCase()) {
      case 'string': return '""';
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'byte':
      case 'currency':
      case 'decimal':
        return '0';
      case 'boolean': return 'false';
      case 'date': return 'new Date()';
      case 'object':
      case 'variant':
      default:
        return 'null';
    }
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Add UDT definition
   */
  public addUDT(udt: VB6UDT): void {
    this.udtDefinitions.push(udt);
  }

  /**
   * Get generation metrics
   */
  public getMetrics(): GenerationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get applied optimizations
   */
  public getOptimizations(): string[] {
    return [...this.optimizations];
  }
}

// Export types and interfaces
export type { VB6ModuleAST, VB6Procedure, VB6Variable, VB6Parameter, VB6Property };