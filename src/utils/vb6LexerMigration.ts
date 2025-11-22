/**
 * Migration du Lexer VB6 - Phase 1 Critique
 * 
 * Ce fichier assure la compatibilité entre l'ancien lexer et le nouveau système unifié.
 * Il permet une migration progressive sans casser l'existant.
 * 
 * IMPORTANT: Ce fichier doit être utilisé temporairement pendant la migration.
 * Une fois tous les imports migrés, il peut être supprimé.
 */

// Import du nouveau système unifié
import { 
  UnifiedLexer, 
  UnifiedToken, 
  tokenizeUnified, 
  lexVB6Unified,
  LegacyTokenType,
  LegacyToken,
  LexerFactory
} from '../compiler/UnifiedLexer';

// Import de l'ancien système pour compatibilité
import { 
  Token as OriginalToken, 
  TokenType as OriginalTokenType, 
  lexVB6 as originalLexVB6 
} from './vb6Lexer';

/**
 * Configuration de migration
 */
interface MigrationConfig {
  enableAdvancedLexer: boolean;
  enableFallback: boolean;
  logMigrationWarnings: boolean;
  validateResults: boolean;
}

const defaultMigrationConfig: MigrationConfig = {
  enableAdvancedLexer: true,
  enableFallback: true,
  logMigrationWarnings: false,
  validateResults: false
};

/**
 * Wrapper de migration pour lexVB6
 * Remplace progressivement l'ancien lexer par le nouveau
 */
export function lexVB6(code: string, config?: Partial<MigrationConfig>): OriginalToken[] {
  const migrationConfig = { ...defaultMigrationConfig, ...config };
  
  try {
    if (migrationConfig.enableAdvancedLexer) {
      // Utiliser le nouveau lexer unifié
      const unifiedTokens = lexVB6Unified(code);
      
      if (migrationConfig.logMigrationWarnings) {
        console.warn('🔄 Migration: Using unified lexer for lexVB6 call');
      }
      
      // Validation optionnelle
      if (migrationConfig.validateResults) {
        validateMigrationResults(code, unifiedTokens, originalLexVB6(code));
      }
      
      return unifiedTokens;
    } else {
      // Utiliser l'ancien lexer
      return originalLexVB6(code);
    }
  } catch (error) {
    if (migrationConfig.enableFallback) {
      console.error('Unified lexer failed, falling back to original:', error);
      return originalLexVB6(code);
    }
    throw error;
  }
}

/**
 * Export des types pour compatibilité
 */
export { OriginalToken as Token, OriginalTokenType as TokenType };

/**
 * Factory pour créer des lexers configurés selon le contexte
 */
export class VB6LexerMigrationManager {
  private migrationStats: {
    unifiedCalls: number;
    fallbackCalls: number;
    errors: number;
    lastError?: string;
  } = {
    unifiedCalls: 0,
    fallbackCalls: 0,
    errors: 0
  };

  /**
   * Tokeniser avec le système le plus approprié selon le contexte
   */
  tokenize(code: string, context: 'compiler' | 'semantic' | 'transpiler' | 'test' = 'compiler'): OriginalToken[] {
    try {
      switch (context) {
        case 'compiler':
          // Pour le compilateur, utiliser le lexer avancé avec toutes les fonctionnalités
          return this.tokenizeAdvanced(code);
        
        case 'semantic':
          // Pour l'analyseur sémantique, utiliser le lexer optimisé pour l'analyse
          return this.tokenizeSemantic(code);
        
        case 'transpiler':
          // Pour le transpiler, compatibilité maximale requise
          return this.tokenizeCompatible(code);
        
        case 'test':
          // Pour les tests, validation stricte
          return this.tokenizeWithValidation(code);
        
        default:
          return this.tokenizeAdvanced(code);
      }
    } catch (error) {
      this.migrationStats.errors++;
      this.migrationStats.lastError = error instanceof Error ? error.message : String(error);
      
      // Fallback vers l'ancien lexer
      console.warn(`Migration failed for context ${context}, using fallback:`, error);
      this.migrationStats.fallbackCalls++;
      return originalLexVB6(code);
    }
  }

  /**
   * Tokeniser avec le lexer avancé (performances optimales)
   */
  private tokenizeAdvanced(code: string): OriginalToken[] {
    const advancedLexer = LexerFactory.createAdvancedLexer({
      enableDebugging: false,
      validateTokens: false,
      preserveWhitespace: false,
      preserveComments: true
    });
    
    const tokens = advancedLexer.tokenize(code);
    this.migrationStats.unifiedCalls++;
    
    return this.convertToLegacyFormat(tokens);
  }

  /**
   * Tokeniser pour l'analyseur sémantique (validation maximale)
   */
  private tokenizeSemantic(code: string): OriginalToken[] {
    const semanticLexer = LexerFactory.createHybridLexer({
      enableDebugging: false,
      validateTokens: true,
      preserveWhitespace: false,
      preserveComments: false
    });
    
    const tokens = semanticLexer.tokenize(code);
    this.migrationStats.unifiedCalls++;
    
    return this.convertToLegacyFormat(tokens);
  }

  /**
   * Tokeniser pour le transpiler (compatibilité maximale)
   */
  private tokenizeCompatible(code: string): OriginalToken[] {
    const compatibleLexer = LexerFactory.createHybridLexer({
      useAdvancedLexer: true,
      fallbackToLegacy: true,
      enableDebugging: false,
      validateTokens: false,
      preserveWhitespace: true,
      preserveComments: true
    });
    
    const tokens = compatibleLexer.tokenize(code);
    this.migrationStats.unifiedCalls++;
    
    return this.convertToLegacyFormat(tokens);
  }

  /**
   * Tokeniser avec validation pour les tests
   */
  private tokenizeWithValidation(code: string): OriginalToken[] {
    const testLexer = LexerFactory.createDebugLexer({
      enableDebugging: false, // Pas de debug dans les tests automatiques
      validateTokens: true,
      maxTokens: 100000 // Limite pour les tests
    });
    
    const tokens = testLexer.tokenize(code);
    this.migrationStats.unifiedCalls++;
    
    const legacyTokens = this.convertToLegacyFormat(tokens);
    
    // Validation croisée pour les tests
    try {
      const originalTokens = originalLexVB6(code);
      this.validateTokenEquivalence(legacyTokens, originalTokens);
    } catch (error) {
      console.warn('Token validation failed in test context:', error);
    }
    
    return legacyTokens;
  }

  /**
   * Convertir les tokens unifiés vers le format legacy
   */
  private convertToLegacyFormat(unifiedTokens: UnifiedToken[]): OriginalToken[] {
    return unifiedTokens.map(token => ({
      type: token.type,
      value: token.value,
      line: token.line,
      column: token.column
    }));
  }

  /**
   * Valider l'équivalence entre deux sets de tokens
   */
  private validateTokenEquivalence(newTokens: OriginalToken[], oldTokens: OriginalToken[]): void {
    if (newTokens.length !== oldTokens.length) {
      throw new Error(`Token count mismatch: ${newTokens.length} vs ${oldTokens.length}`);
    }

    for (let i = 0; i < newTokens.length; i++) {
      const newToken = newTokens[i];
      const oldToken = oldTokens[i];
      
      if (newToken.type !== oldToken.type || newToken.value !== oldToken.value) {
        throw new Error(`Token mismatch at index ${i}: ${JSON.stringify(newToken)} vs ${JSON.stringify(oldToken)}`);
      }
    }
  }

  /**
   * Obtenir les statistiques de migration
   */
  getStats() {
    return { ...this.migrationStats };
  }

  /**
   * Réinitialiser les statistiques
   */
  resetStats() {
    this.migrationStats = {
      unifiedCalls: 0,
      fallbackCalls: 0,
      errors: 0
    };
  }
}

/**
 * Instance singleton du gestionnaire de migration
 */
export const vb6LexerMigration = new VB6LexerMigrationManager();

/**
 * Validation des résultats de migration
 */
function validateMigrationResults(
  code: string, 
  unifiedTokens: OriginalToken[], 
  originalTokens: OriginalToken[]
): void {
  // Comparer les tokens essentiels (ignore les différences mineures de whitespace)
  const essentialUnified = unifiedTokens.filter(t => 
    t.type !== OriginalTokenType.Whitespace && 
    t.type !== OriginalTokenType.Comment
  );
  
  const essentialOriginal = originalTokens.filter(t => 
    t.type !== OriginalTokenType.Whitespace && 
    t.type !== OriginalTokenType.Comment
  );

  if (essentialUnified.length !== essentialOriginal.length) {
    console.warn('Migration validation: Token count difference detected');
    return;
  }

  let differenceCount = 0;
  for (let i = 0; i < essentialUnified.length; i++) {
    const unified = essentialUnified[i];
    const original = essentialOriginal[i];
    
    if (unified.type !== original.type || unified.value !== original.value) {
      differenceCount++;
    }
  }

  if (differenceCount > 0) {
    console.warn(`Migration validation: ${differenceCount} token differences detected`);
  }
}

/**
 * Fonction utilitaire pour migration progressive des imports
 * Remplace: import { lexVB6 } from './vb6Lexer'
 * Par: import { lexVB6 } from './vb6LexerMigration'
 */
export function createMigrationLexer(config?: Partial<MigrationConfig>) {
  const migrationConfig = { ...defaultMigrationConfig, ...config };
  
  return {
    lexVB6: (code: string) => lexVB6(code, migrationConfig),
    TokenType: OriginalTokenType,
    migrationManager: vb6LexerMigration
  };
}

/**
 * Export par défaut pour compatibilité
 */
export default lexVB6;