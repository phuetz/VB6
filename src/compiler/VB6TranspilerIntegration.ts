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
  parseVB6Code
} from './VB6RecursiveDescentParser';

import { tokenizeVB6 } from './VB6AdvancedLexer';
import { VB6ModuleAST, VB6Procedure, VB6Variable } from '../utils/vb6Parser';

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
    const adaptedAST: VB6ModuleAST = {
      name: newAST.name,
      variables: this.adaptVariables(newAST.declarations),
      procedures: this.adaptProcedures(newAST.procedures),
      properties: [], // TODO: implémenter l'adaptation des propriétés
      events: []      // TODO: implémenter l'adaptation des événements
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
   * Extraire le corps d'une procédure depuis l'AST
   */
  private static extractProcedureBody(proc: VB6ProcedureNode): string {
    // Pour le moment, retourner un placeholder
    // TODO: implémenter la conversion complète des statements en code
    if (proc.body && proc.body.length > 0) {
      return '// TODO: Generate body from AST statements';
    }
    return '';
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