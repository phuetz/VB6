/**
 * Intégration du Parser Récursif avec le Transpiler VB6 - Phase 1 Critique
 * 
 * Ce fichier assure l'intégration du nouveau parser récursif descendant
 * avec le transpiler existant, en maintenant la compatibilité totale.
 * 
 * Fonctionnalités:
 * - Adaptateur AST entre ancien et nouveau format
 * - Intégration transparente avec le transpiler existant
 * - Migration progressive avec fallback automatique
 * - Validation et debugging intégrés
 */

import {
  VB6RecursiveDescentParser,
  VB6ModuleNode,
  VB6ProcedureNode,
  VB6DeclarationNode,
  VB6ParameterNode,
  parseVB6Code
} from './VB6RecursiveDescentParser';

import { tokenizeVB6 } from './VB6AdvancedLexer';
import { VB6ModuleAST, VB6Procedure, VB6Variable, VB6Event, VB6Property, VB6Parameter } from '../utils/vb6Parser';

/**
 * Configuration de l'intégration
 */
interface TranspilerIntegrationConfig {
  useNewParser: boolean;
  enableFallback: boolean;
  validateResults: boolean;
  debugMode: boolean;
}

/**
 * Résultat de la transpilation
 */
interface TranspilerResult {
  ast: VB6ModuleAST | null;
  success: boolean;
  errors: string[];
  warnings: string[];
  parserUsed: 'legacy' | 'recursive';
  processingTime: number;
}

/**
 * Adaptateur AST pour convertir le nouveau format vers l'ancien
 */
export class VB6ASTAdapter {
  /**
   * Convertir le nouveau AST vers l'ancien format pour compatibilité
   */
  static adaptModuleNode(newAST: VB6ModuleNode): VB6ModuleAST {
    // Filter out property procedures - they'll be combined into properties
    const regularProcedures = newAST.procedures.filter(
      proc => !['PropertyGet', 'PropertyLet', 'PropertySet'].includes(proc.procedureType)
    );

    const adaptedAST: VB6ModuleAST = {
      name: newAST.name,
      variables: this.adaptVariables(newAST.declarations),
      procedures: this.adaptProcedures(regularProcedures),
      properties: this.adaptProperties(newAST.procedures),
      events: this.adaptEvents(newAST.declarations)
    };

    return adaptedAST;
  }

  /**
   * Adapter les déclarations de variables
   */
  private static adaptVariables(declarations: VB6DeclarationNode[]): VB6Variable[] {
    return declarations
      .filter(decl => decl.declarationType === 'Variable')
      .map(decl => ({
        name: decl.name,
        varType: decl.dataType?.typeName || 'Variant'
      }));
  }

  /**
   * Adapter les procédures
   */
  private static adaptProcedures(procedures: VB6ProcedureNode[]): VB6Procedure[] {
    return procedures.map(proc => ({
      name: proc.name,
      type: this.mapProcedureType(proc.procedureType),
      parameters: proc.parameters.map(param => ({
        name: param.name,
        type: param.dataType?.typeName || 'Variant',
        isOptional: param.parameterType === 'Optional',
        isByRef: param.parameterType === 'ByRef',
        defaultValue: param.defaultValue ? this.extractLiteralValue(param.defaultValue) : undefined
      })),
      returnType: proc.returnType?.typeName || null,
      visibility: proc.visibility?.toLowerCase() as any || 'public',
      body: this.extractProcedureBody(proc)
    }));
  }

  /**
   * Mapper les types de procédures
   */
  private static mapProcedureType(procedureType: string): 'sub' | 'function' | 'propertyGet' | 'propertyLet' | 'propertySet' {
    switch (procedureType) {
      case 'Sub': return 'sub';
      case 'Function': return 'function';
      case 'PropertyGet': return 'propertyGet';
      case 'PropertyLet': return 'propertyLet';
      case 'PropertySet': return 'propertySet';
      default: return 'sub';
    }
  }

  /**
   * Extraire le corps d'une procédure depuis l'AST et générer le JavaScript
   */
  private static extractProcedureBody(proc: VB6ProcedureNode): string {
    if (!proc.body || proc.body.length === 0) {
      return '';
    }

    return proc.body.map(stmt => this.generateStatement(stmt, 1)).join('');
  }

  /**
   * Générer le JavaScript pour un statement AST
   */
  private static generateStatement(stmt: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);

    switch (stmt.statementType) {
      case 'Assignment':
        return indent + `${this.generateExpression(stmt.target)} = ${this.generateExpression(stmt.value)};\n`;

      case 'Call':
        const args = (stmt.arguments || []).map((arg: any) =>
          this.generateExpression(arg.value || arg)
        ).join(', ');
        const callTarget = stmt.procedureName || stmt.name || this.generateExpression(stmt.target);
        return indent + `${callTarget}(${args});\n`;

      case 'If':
        let ifCode = indent + `if (${this.generateExpression(stmt.condition)}) {\n`;
        ifCode += (stmt.thenStatements || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
        ifCode += indent + '}';
        for (const elseIf of stmt.elseIfClauses || []) {
          ifCode += ` else if (${this.generateExpression(elseIf.condition)}) {\n`;
          ifCode += (elseIf.statements || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
          ifCode += indent + '}';
        }
        if (stmt.elseStatements && stmt.elseStatements.length > 0) {
          ifCode += ` else {\n`;
          ifCode += stmt.elseStatements.map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
          ifCode += indent + '}';
        }
        return ifCode + '\n';

      case 'For':
        const step = stmt.stepValue ? this.generateExpression(stmt.stepValue) : '1';
        let forCode = indent + `for (let ${stmt.variable} = ${this.generateExpression(stmt.startValue)}; `;
        forCode += `${stmt.variable} <= ${this.generateExpression(stmt.endValue)}; `;
        forCode += `${stmt.variable} += ${step}) {\n`;
        forCode += (stmt.body || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
        forCode += indent + '}\n';
        return forCode;

      case 'ForEach':
        let forEachCode = indent + `for (const ${stmt.variable} of ${this.generateExpression(stmt.collection)}) {\n`;
        forEachCode += (stmt.body || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
        forEachCode += indent + '}\n';
        return forEachCode;

      case 'While':
        let whileCode = indent + `while (${this.generateExpression(stmt.condition)}) {\n`;
        whileCode += (stmt.body || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
        whileCode += indent + '}\n';
        return whileCode;

      case 'Do':
        return this.generateDoLoop(stmt, indent, indentLevel);

      case 'Select':
        return this.generateSelectCase(stmt, indent, indentLevel);

      case 'Exit':
        const exitType = (stmt.exitType || 'Sub').toLowerCase();
        if (exitType === 'for' || exitType === 'do' || exitType === 'while') {
          return indent + 'break;\n';
        }
        return indent + 'return;\n';

      case 'Return':
        return indent + 'return;\n';

      case 'Set':
        return indent + `${this.generateExpression(stmt.target)} = ${this.generateExpression(stmt.value)};\n`;

      case 'LocalVariable':
        const varValue = stmt.initialValue ? ` = ${this.generateExpression(stmt.initialValue)}` : '';
        return indent + `let ${stmt.name}${varValue};\n`;

      case 'ReDim':
        const preserve = stmt.preserve ? 'VB6.reDimPreserve' : 'VB6.reDim';
        const dims = (stmt.dimensions || []).map((d: any) => this.generateExpression(d)).join(', ');
        return indent + `${stmt.variable} = ${preserve}(${stmt.variable}, [${dims}]);\n`;

      case 'Debug':
        const debugArgs = (stmt.arguments || []).map((a: any) => this.generateExpression(a)).join(', ');
        return indent + `console.log(${debugArgs});\n`;

      case 'Print':
        const printArgs = (stmt.expressions || stmt.items || []).map((a: any) => this.generateExpression(a)).join(', ');
        if (stmt.fileNumber) {
          return indent + `VB6.print(${this.generateExpression(stmt.fileNumber)}, ${printArgs});\n`;
        }
        return indent + `console.log(${printArgs});\n`;

      case 'OnError':
        if (stmt.errorAction === 'ResumeNext') {
          return indent + 'VB6.setErrorMode("resumeNext");\n';
        } else if (stmt.errorAction === 'GoTo0') {
          return indent + 'VB6.clearErrorHandler();\n';
        } else if (stmt.label) {
          return indent + `VB6.setErrorHandler("${stmt.label}");\n`;
        }
        return indent + '// Error handling\n';

      case 'With':
        let withCode = indent + `{ const __with__ = ${this.generateExpression(stmt.expression)};\n`;
        withCode += (stmt.body || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
        withCode += indent + '}\n';
        return withCode;

      case 'FunctionCall':
      case 'Expression':
        return indent + this.generateExpression(stmt.expression || stmt) + ';\n';

      default:
        return indent + `// Unsupported statement: ${stmt.statementType}\n`;
    }
  }

  /**
   * Générer un Do...Loop
   */
  private static generateDoLoop(stmt: any, indent: string, indentLevel: number): string {
    const condType = stmt.conditionType?.toLowerCase() || '';
    let code = '';

    if (stmt.conditionAtEnd) {
      code += indent + 'do {\n';
      code += (stmt.body || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
      if (condType === 'while' && stmt.condition) {
        code += indent + `} while (${this.generateExpression(stmt.condition)});\n`;
      } else if (condType === 'until' && stmt.condition) {
        code += indent + `} while (!(${this.generateExpression(stmt.condition)}));\n`;
      } else {
        code += indent + '} while (true);\n';
      }
    } else {
      if (condType === 'while' && stmt.condition) {
        code += indent + `while (${this.generateExpression(stmt.condition)}) {\n`;
      } else if (condType === 'until' && stmt.condition) {
        code += indent + `while (!(${this.generateExpression(stmt.condition)})) {\n`;
      } else {
        code += indent + 'while (true) {\n';
      }
      code += (stmt.body || []).map((s: any) => this.generateStatement(s, indentLevel + 1)).join('');
      code += indent + '}\n';
    }

    return code;
  }

  /**
   * Générer un Select Case
   */
  private static generateSelectCase(stmt: any, indent: string, indentLevel: number): string {
    const expr = this.generateExpression(stmt.expression);
    let code = indent + `switch (${expr}) {\n`;

    for (const caseClause of stmt.cases || []) {
      if (caseClause.isElse) {
        code += indent + '  default:\n';
      } else {
        for (const value of caseClause.values || []) {
          code += indent + `  case ${this.generateExpression(value)}:\n`;
        }
      }
      code += (caseClause.statements || []).map((s: any) => this.generateStatement(s, indentLevel + 2)).join('');
      code += indent + '    break;\n';
    }

    code += indent + '}\n';
    return code;
  }

  /**
   * Générer une expression en JavaScript
   */
  private static generateExpression(expr: any): string {
    if (!expr) return 'undefined';
    if (typeof expr === 'string') return expr;
    if (typeof expr === 'number') return String(expr);
    if (typeof expr === 'boolean') return String(expr);

    switch (expr.expressionType) {
      case 'Literal':
        if (typeof expr.value === 'string') {
          return `"${expr.value.replace(/"/g, '\\"')}"`;
        }
        return String(expr.value);

      case 'Identifier':
        return expr.name || expr.value || 'unknown';

      case 'MemberAccess':
        return `${this.generateExpression(expr.object)}.${expr.member || expr.property}`;

      case 'ArrayAccess':
        const indices = (expr.indices || []).map((idx: any) => `[${this.generateExpression(idx)}]`).join('');
        return `${this.generateExpression(expr.array)}${indices}`;

      case 'FunctionCall':
        const funcArgs = (expr.arguments || []).map((arg: any) =>
          this.generateExpression(arg.value || arg)
        ).join(', ');
        return `${expr.name}(${funcArgs})`;

      case 'BinaryOp':
        const left = this.generateExpression(expr.left);
        const right = this.generateExpression(expr.right);
        const op = this.mapOperator(expr.operator);
        return `(${left} ${op} ${right})`;

      case 'UnaryOp':
        const operand = this.generateExpression(expr.operand);
        if (expr.operator.toLowerCase() === 'not') {
          return `!(${operand})`;
        } else if (expr.operator === '-') {
          return `-(${operand})`;
        }
        return operand;

      case 'Parenthesized':
        return `(${this.generateExpression(expr.expression)})`;

      case 'New':
        return `new ${expr.className}()`;

      case 'Nothing':
        return 'null';

      case 'Me':
        return 'this';

      default:
        if (expr.name) return expr.name;
        if (expr.value !== undefined) return String(expr.value);
        return 'undefined';
    }
  }

  /**
   * Mapper les opérateurs VB6 vers JavaScript
   */
  private static mapOperator(op: string): string {
    const operators: Record<string, string> = {
      'and': '&&',
      'or': '||',
      'not': '!',
      'mod': '%',
      '=': '===',
      '<>': '!==',
      '&': '+',
      'like': '.match', // simplified
      'is': '===',
      '\\': 'Math.floor(/) ', // integer division
    };
    return operators[op.toLowerCase()] || op;
  }

  /**
   * Extraire la valeur littérale d'une expression
   */
  private static extractLiteralValue(expression: any): any {
    if (expression.expressionType === 'Literal') {
      return expression.value;
    }
    return undefined;
  }

  /**
   * Adapter les événements depuis les déclarations
   */
  private static adaptEvents(declarations: VB6DeclarationNode[]): VB6Event[] {
    return declarations
      .filter(decl => decl.declarationType === 'Event')
      .map(decl => ({
        name: decl.name,
        parameters: this.adaptParameters(decl.parameters || []),
        visibility: (decl.visibility?.toLowerCase() as 'public' | 'private') || 'public'
      }));
  }

  /**
   * Adapter les propriétés depuis les procédures PropertyGet/Let/Set
   */
  private static adaptProperties(procedures: VB6ProcedureNode[]): VB6Property[] {
    const propertyMap = new Map<string, VB6Property>();

    // Group property procedures by name
    procedures
      .filter(proc => ['PropertyGet', 'PropertyLet', 'PropertySet'].includes(proc.procedureType))
      .forEach(proc => {
        const existing = propertyMap.get(proc.name) || {
          name: proc.name,
          visibility: (proc.visibility?.toLowerCase() as 'public' | 'private') || 'public',
          parameters: [],
          getter: undefined,
          setter: undefined
        };

        const adaptedProc: VB6Procedure = {
          name: proc.name,
          type: this.mapProcedureType(proc.procedureType),
          parameters: proc.parameters.map(param => ({
            name: param.name,
            type: param.dataType?.typeName || 'Variant',
            isOptional: param.parameterType === 'Optional',
            isByRef: param.parameterType === 'ByRef',
            defaultValue: param.defaultValue ? this.extractLiteralValue(param.defaultValue) : undefined
          })),
          returnType: proc.returnType?.typeName || null,
          visibility: (proc.visibility?.toLowerCase() as 'public' | 'private') || 'public',
          body: this.extractProcedureBody(proc)
        };

        if (proc.procedureType === 'PropertyGet') {
          existing.getter = adaptedProc;
          // PropertyGet parameters become the property's parameters (excluding return value param)
          existing.parameters = adaptedProc.parameters;
        } else {
          // PropertyLet/PropertySet - the last param is the value being set
          existing.setter = adaptedProc;
          // Exclude the last parameter (the value) from property parameters
          if (existing.parameters.length === 0 && adaptedProc.parameters.length > 1) {
            existing.parameters = adaptedProc.parameters.slice(0, -1);
          }
        }

        propertyMap.set(proc.name, existing);
      });

    return Array.from(propertyMap.values());
  }

  /**
   * Adapter les paramètres du nouveau format vers l'ancien
   */
  private static adaptParameters(params: VB6ParameterNode[]): VB6Parameter[] {
    return params.map(param => ({
      name: param.name,
      type: param.dataType?.typeName || null
    }));
  }
}

/**
 * Classe principale d'intégration du transpiler
 */
export class VB6TranspilerIntegration {
  private config: TranspilerIntegrationConfig;
  
  constructor(config?: Partial<TranspilerIntegrationConfig>) {
    this.config = {
      useNewParser: true,
      enableFallback: true,
      validateResults: true,
      debugMode: false,
      ...config
    };
  }

  /**
   * Parser le code VB6 avec le nouveau système
   */
  async parseCode(code: string, fileName?: string): Promise<TranspilerResult> {
    const startTime = performance.now();
    let result: TranspilerResult = {
      ast: null,
      success: false,
      errors: [],
      warnings: [],
      parserUsed: 'legacy',
      processingTime: 0
    };

    try {
      if (this.config.useNewParser) {
        result = await this.parseWithRecursiveParser(code, fileName);
      } else {
        result = await this.parseWithLegacyParser(code, fileName);
      }

      result.processingTime = performance.now() - startTime;

      if (this.config.debugMode) {
        this.logParsingResult(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.config.enableFallback && this.config.useNewParser) {
        console.warn('Recursive parser failed, falling back to legacy:', errorMessage);
        return this.parseWithLegacyParser(code, fileName);
      }

      result.errors.push(`Parsing failed: ${errorMessage}`);
      result.processingTime = performance.now() - startTime;
      return result;
    }
  }

  /**
   * Parser avec le nouveau parser récursif
   */
  private async parseWithRecursiveParser(code: string, fileName?: string): Promise<TranspilerResult> {
    try {
      // Étape 1: Tokenisation
      const tokens = tokenizeVB6(code);
      
      // Étape 2: Parsing récursif
      const parser = new VB6RecursiveDescentParser(tokens);
      const { ast: newAST, errors } = parser.parseModule();

      if (!newAST) {
        throw new Error('Failed to generate AST');
      }

      // Étape 3: Adaptation vers l'ancien format
      const adaptedAST = VB6ASTAdapter.adaptModuleNode(newAST);

      // Étape 4: Validation si activée
      if (this.config.validateResults) {
        this.validateAST(adaptedAST);
      }

      return {
        ast: adaptedAST,
        success: true,
        errors: errors.map(e => e.message),
        warnings: errors.length > 0 ? ['Parse errors detected but processing continued'] : [],
        parserUsed: 'recursive',
        processingTime: 0 // Will be set by caller
      };

    } catch (error) {
      throw new Error(`Recursive parser error: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Parser avec l'ancien parser (fallback)
   */
  private async parseWithLegacyParser(code: string, fileName?: string): Promise<TranspilerResult> {
    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { parseVB6Module } = await import('../utils/vb6Parser');
      const ast = parseVB6Module(code, fileName || 'Module1');

      return {
        ast,
        success: true,
        errors: [],
        warnings: this.config.useNewParser ? ['Used legacy parser as fallback'] : [],
        parserUsed: 'legacy',
        processingTime: 0 // Will be set by caller
      };

    } catch (error) {
      throw new Error(`Legacy parser error: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Valider l'AST généré
   */
  private validateAST(ast: VB6ModuleAST): void {
    if (!ast.name || ast.name.trim() === '') {
      throw new Error('Invalid AST: Module name is required');
    }

    if (!Array.isArray(ast.variables)) {
      throw new Error('Invalid AST: Variables must be an array');
    }

    if (!Array.isArray(ast.procedures)) {
      throw new Error('Invalid AST: Procedures must be an array');
    }

    // Validation des procédures
    ast.procedures.forEach((proc, index) => {
      if (!proc.name || proc.name.trim() === '') {
        throw new Error(`Invalid AST: Procedure at index ${index} has no name`);
      }

      if (!['sub', 'function', 'propertyGet', 'propertyLet', 'propertySet'].includes(proc.type)) {
        throw new Error(`Invalid AST: Procedure ${proc.name} has invalid type: ${proc.type}`);
      }

      if (!Array.isArray(proc.parameters)) {
        throw new Error(`Invalid AST: Procedure ${proc.name} parameters must be an array`);
      }
    });

    // Validation des variables
    ast.variables.forEach((variable, index) => {
      if (!variable.name || variable.name.trim() === '') {
        throw new Error(`Invalid AST: Variable at index ${index} has no name`);
      }
    });
  }

  /**
   * Logger le résultat du parsing
   */
  private logParsingResult(result: TranspilerResult): void {
    console.log('🔍 VB6 Parser Integration Debug:');
    console.log(`  ✅ Success: ${result.success}`);
    console.log(`  🔧 Parser Used: ${result.parserUsed}`);
    console.log(`  ⏱️  Processing Time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  ❌ Errors: ${result.errors.length}`);
    console.log(`  ⚠️  Warnings: ${result.warnings.length}`);
    
    if (result.ast) {
      console.log(`  📄 Module: ${result.ast.name}`);
      console.log(`  🔢 Variables: ${result.ast.variables.length}`);
      console.log(`  ⚙️  Procedures: ${result.ast.procedures.length}`);
    }

    if (result.errors.length > 0) {
      console.log('  🔴 Errors:');
      result.errors.forEach((error, index) => {
        console.log(`    ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('  🟡 Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`    ${index + 1}. ${warning}`);
      });
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  getStats(): {
    recursiveParserCalls: number;
    legacyParserCalls: number;
    successfulParses: number;
    failedParses: number;
  } {
    // TODO: implémenter le tracking des statistiques
    return {
      recursiveParserCalls: 0,
      legacyParserCalls: 0,
      successfulParses: 0,
      failedParses: 0
    };
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(newConfig: Partial<TranspilerIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): TranspilerIntegrationConfig {
    return { ...this.config };
  }
}

/**
 * Instance singleton de l'intégration
 */
export const vb6TranspilerIntegration = new VB6TranspilerIntegration();

/**
 * Fonction de convenance pour parser du code VB6
 */
export async function parseVB6WithIntegration(
  code: string, 
  fileName?: string,
  config?: Partial<TranspilerIntegrationConfig>
): Promise<VB6ModuleAST | null> {
  const integration = config ? new VB6TranspilerIntegration(config) : vb6TranspilerIntegration;
  const result = await integration.parseCode(code, fileName);
  
  if (!result.success) {
    console.error('Failed to parse VB6 code:', result.errors);
    return null;
  }
  
  return result.ast;
}

/**
 * Fonction utilitaire pour migration progressive
 */
export function createTranspilerAdapter(useNewParser: boolean = true) {
  return new VB6TranspilerIntegration({
    useNewParser,
    enableFallback: true,
    validateResults: true,
    debugMode: false
  });
}

/**
 * Export par défaut
 */
export default VB6TranspilerIntegration;