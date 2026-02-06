/**
 * Index principal du système de compilation VB6
 *
 * Ce fichier centralise tous les exports du système de compilation.
 */

// ============================================================================
// SYSTÈME DE TYPES VB6
// ============================================================================

export { VB6TypeSystem, vb6TypeSystem } from '../services/VB6TypeSystem';

export type { VB6UDT, VB6Enum, VB6Const, VB6DeclareFunction } from '../utils/vb6ParserExtended';

// ============================================================================
// LEXER UNIFIÉ
// ============================================================================

export {
  UnifiedLexer,
  unifiedLexer,
  tokenizeUnified,
  lexVB6Unified,
  LexerFactory,
} from './UnifiedLexer';

export type {
  UnifiedToken,
  UnifiedLexerConfig,
  LexerStats,
  LegacyToken,
  LegacyTokenType,
  AdvancedToken,
  AdvancedTokenType,
} from './UnifiedLexer';

// ============================================================================
// LEXER AVANCÉ
// ============================================================================

export {
  VB6AdvancedLexer,
  tokenizeVB6,
  VB6Keywords,
  VB6Operators,
  VB6TypeSuffixes,
  VB6Punctuation,
} from './VB6AdvancedLexer';

export { VB6TokenType, type VB6Token } from './VB6AdvancedLexer';

// ============================================================================
// PARSER RÉCURSIF DESCENDANT
// ============================================================================

export { VB6RecursiveDescentParser, parseVB6Code } from './VB6RecursiveDescentParser';
export { adaptToken, adaptTokens } from './tokenAdapter';

export type {
  VB6ASTNode,
  VB6ModuleNode,
  VB6ProcedureNode,
  VB6DeclarationNode,
  VB6StatementNode,
  VB6ExpressionNode,
  VB6ParameterNode,
  VB6TypeNode,
  VB6ParseError,
  VB6AttributeNode,
  VB6AssignmentNode,
  VB6IfNode,
  VB6ForNode,
  VB6ForEachNode,
  VB6SelectNode,
  VB6WithNode,
  VB6ErrorHandlingNode,
  VB6BinaryOpNode,
  VB6UnaryOpNode,
  VB6FunctionCallNode,
  VB6MemberAccessNode,
  VB6LiteralNode,
  VB6IdentifierNode,
  VB6ArgumentNode,
  VB6CaseNode,
} from './VB6RecursiveDescentParser';

// ============================================================================
// ANALYSEUR SÉMANTIQUE AVANCÉ
// ============================================================================

export {
  VB6AdvancedSemanticAnalyzer,
  vb6AdvancedSemanticAnalyzer,
} from './VB6AdvancedSemanticAnalyzer';

export type {
  SymbolInfo,
  SemanticError,
  TypeCompatibility,
  ControlFlowNode,
  SemanticAnalysisResult,
} from './VB6AdvancedSemanticAnalyzer';

// ============================================================================
// INTÉGRATION TRANSPILER
// ============================================================================

export {
  VB6TranspilerIntegration,
  VB6ASTAdapter,
  vb6TranspilerIntegration,
  parseVB6WithIntegration,
  createTranspilerAdapter,
} from './VB6TranspilerIntegration';

export type { TranspilerIntegrationConfig, TranspilerResult } from './VB6TranspilerIntegration';

// ============================================================================
// COMPILATION AVANCÉE
// ============================================================================

export { VB6AdvancedCompiler } from './VB6AdvancedCompiler';

export { VB6IncrementalCache } from './VB6IncrementalCache';

export { VB6UltraJIT } from './VB6UltraJIT';

export { VB6ProfileGuidedOptimizer } from './VB6ProfileGuidedOptimizer';

// ============================================================================
// COMPILATEUR NATIF
// ============================================================================

export { VB6NativeCompiler } from './VB6NativeCompiler';

export { VB6Linker } from './VB6Linker';

// ============================================================================
// FONCTIONNALITÉS DE LANGAGE AVANCÉES
// ============================================================================

export { VB6AdvancedLanguageFeatures } from './VB6AdvancedLanguageFeatures';

export { VB6UDTSupport } from './VB6UDTSupport';

export { VB6EnumSupport } from './VB6EnumSupport';

export { VB6InterfaceSupport } from './VB6InterfaceSupport';

export { VB6PropertySupport } from './VB6PropertySupport';

export { VB6WithEventsSupport } from './VB6WithEventsSupport';

export { VB6CustomEventsSupport } from './VB6CustomEventsSupport';

export { VB6DeclareSupport } from './VB6DeclareSupport';

// ============================================================================
// CONSTANTS ET UTILITIES
// ============================================================================

/**
 * Version du système de compilation
 */
export const VB6_COMPILER_VERSION = '2.0.0-phase1';

/**
 * Configuration par défaut du compilateur
 */
export const DEFAULT_COMPILER_CONFIG = {
  useAdvancedLexer: true,
  useRecursiveParser: true,
  enableSemanticAnalysis: true,
  enableOptimizations: true,
  enableTypeChecking: true,
  enableDeadCodeElimination: true,
  target: 'es2020' as const,
  debug: false,
} as const;

/**
 * Types de fichiers supportés
 */
export const SUPPORTED_FILE_TYPES = {
  MODULE: ['.bas', '.mod'],
  FORM: ['.frm'],
  CLASS: ['.cls'],
  USER_CONTROL: ['.ctl'],
  PROPERTY_PAGE: ['.pag'],
  USER_DOCUMENT: ['.dob'],
} as const;

/**
 * Types VB6 intégrés
 */
export const VB6_BUILTIN_TYPES = [
  'Boolean',
  'Byte',
  'Integer',
  'Long',
  'Single',
  'Double',
  'Currency',
  'Decimal',
  'Date',
  'String',
  'Variant',
  'Object',
  'Any',
] as const;

/**
 * Mots-clés réservés VB6
 */
export const VB6_RESERVED_KEYWORDS = [
  'And',
  'As',
  'Boolean',
  'ByRef',
  'Byte',
  'ByVal',
  'Call',
  'Case',
  'Class',
  'Const',
  'Currency',
  'Declare',
  'Dim',
  'Do',
  'Double',
  'Each',
  'Else',
  'ElseIf',
  'End',
  'Enum',
  'Exit',
  'False',
  'For',
  'Function',
  'Get',
  'GoTo',
  'If',
  'Implements',
  'In',
  'Integer',
  'Is',
  'Let',
  'Like',
  'Long',
  'Loop',
  'Me',
  'Mod',
  'New',
  'Next',
  'Not',
  'Nothing',
  'Object',
  'On',
  'Option',
  'Optional',
  'Or',
  'ParamArray',
  'Preserve',
  'Private',
  'Property',
  'Public',
  'RaiseEvent',
  'Resume',
  'Select',
  'Set',
  'Single',
  'Static',
  'String',
  'Sub',
  'Then',
  'To',
  'True',
  'Type',
  'Until',
  'Variant',
  'Wend',
  'While',
  'With',
  'WithEvents',
  'Xor',
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifier si une chaîne est un mot-clé VB6 réservé
 */
export function isVB6ReservedKeyword(word: string): boolean {
  return (VB6_RESERVED_KEYWORDS as readonly string[]).includes(word);
}

/**
 * Vérifier si un type est un type VB6 intégré
 */
export function isVB6BuiltinType(type: string): boolean {
  return (VB6_BUILTIN_TYPES as readonly string[]).includes(type);
}

/**
 * Obtenir l'extension de fichier appropriée pour un type de module
 */
export function getFileExtensionForModuleType(
  moduleType: keyof typeof SUPPORTED_FILE_TYPES
): string {
  return SUPPORTED_FILE_TYPES[moduleType][0];
}

/**
 * Créer une instance du compilateur avec la configuration par défaut
 */
export function createDefaultVB6Compiler(overrides?: Partial<typeof DEFAULT_COMPILER_CONFIG>) {
  const config = { ...DEFAULT_COMPILER_CONFIG, ...overrides };
  return new VB6AdvancedCompiler(config);
}

/**
 * Créer une instance de l'analyseur sémantique
 */
export function createSemanticAnalyzer(typeSystem?: VB6TypeSystem) {
  return new VB6AdvancedSemanticAnalyzer(typeSystem);
}

/**
 * Créer une instance du lexer unifié avec configuration optimale
 */
export function createOptimalLexer() {
  return LexerFactory.createAdvancedLexer({
    useAdvancedLexer: true,
    fallbackToLegacy: true,
    validateTokens: true,
    preserveComments: true,
    preserveWhitespace: false,
  });
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  // Core compilation
  VB6AdvancedCompiler,
  VB6RecursiveDescentParser,
  VB6AdvancedSemanticAnalyzer,
  UnifiedLexer,

  // Integration
  VB6TranspilerIntegration,

  // Type System
  VB6TypeSystem,

  // Utilities
  createDefaultVB6Compiler,
  createSemanticAnalyzer,
  createOptimalLexer,

  // Constants
  VB6_COMPILER_VERSION,
  DEFAULT_COMPILER_CONFIG,
  VB6_BUILTIN_TYPES,
  VB6_RESERVED_KEYWORDS,
};
