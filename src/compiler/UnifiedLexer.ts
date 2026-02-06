/**
 * VB6 Unified Lexer - Migration transparente vers le lexer avancé
 * Ce module unifie l'interface entre l'ancien et le nouveau lexer
 * Permet une migration progressive sans casser le code existant
 */

import { VB6AdvancedLexer, VB6Token, VB6TokenType } from './VB6AdvancedLexer';
import { Token, TokenType, lexVB6 } from '../utils/vb6Lexer';

export interface UnifiedToken {
  type: string;
  value: string;
  line: number;
  column: number;
  length?: number;
  raw?: string;
}

export interface UnifiedLexerOptions {
  useAdvanced?: boolean;
  fallbackToBasic?: boolean;
  supportPreprocessor?: boolean;
  supportLineContinuation?: boolean;
  supportDateLiterals?: boolean;
  supportHexLiterals?: boolean;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Lexer unifié qui peut utiliser soit le lexer basique soit l'avancé
 * avec migration transparente et compatibilité arrière
 */
export class UnifiedLexer {
  private advancedLexer: VB6AdvancedLexer;
  private options: UnifiedLexerOptions;
  private performanceMetrics: {
    totalTokenized: number;
    totalTime: number;
    errors: number;
    fallbacks: number;
  };

  constructor(options: UnifiedLexerOptions = {}) {
    this.options = {
      useAdvanced: true,
      fallbackToBasic: true,
      supportPreprocessor: true,
      supportLineContinuation: true,
      supportDateLiterals: true,
      supportHexLiterals: true,
      maxTokens: 1000000,
      timeout: 5000,
      ...options,
    };

    this.advancedLexer = new VB6AdvancedLexer();

    this.performanceMetrics = {
      totalTokenized: 0,
      totalTime: 0,
      errors: 0,
      fallbacks: 0,
    };
  }

  /**
   * Tokenize VB6 code avec le meilleur lexer disponible
   */
  public tokenize(code: string): UnifiedToken[] {
    if (!code || typeof code !== 'string') {
      return [];
    }

    const startTime = performance.now();
    let tokens: UnifiedToken[] = [];

    try {
      if (this.options.useAdvanced) {
        tokens = this.tokenizeWithAdvanced(code);
      } else {
        tokens = this.tokenizeWithBasic(code);
      }
    } catch (error) {
      this.performanceMetrics.errors++;

      if (this.options.fallbackToBasic) {
        console.warn('Advanced lexer failed, falling back to basic lexer:', error);
        this.performanceMetrics.fallbacks++;

        try {
          tokens = this.tokenizeWithBasic(code);
        } catch (basicError) {
          console.error('Both lexers failed:', basicError);
          throw new Error('Failed to tokenize VB6 code');
        }
      } else {
        throw error;
      }
    }

    const endTime = performance.now();
    this.performanceMetrics.totalTime += endTime - startTime;
    this.performanceMetrics.totalTokenized += tokens.length;

    return tokens;
  }

  /**
   * Tokenize avec le lexer avancé
   */
  private tokenizeWithAdvanced(code: string): UnifiedToken[] {
    const tokens = this.advancedLexer.tokenize(code);
    return this.convertAdvancedTokens(tokens);
  }

  /**
   * Tokenize avec le lexer basique (fallback)
   */
  private tokenizeWithBasic(code: string): UnifiedToken[] {
    const tokens = lexVB6(code);
    return this.convertBasicTokens(tokens);
  }

  /**
   * Convertir tokens avancés vers format unifié
   */
  private convertAdvancedTokens(tokens: VB6Token[]): UnifiedToken[] {
    return tokens.map(token => ({
      type: this.mapAdvancedType(token.type),
      value: token.value,
      line: token.line,
      column: token.column,
      length: token.length,
      raw: token.raw,
    }));
  }

  /**
   * Convertir tokens basiques vers format unifié
   */
  private convertBasicTokens(tokens: Token[]): UnifiedToken[] {
    return tokens.map(token => ({
      type: this.mapBasicType(token.type),
      value: token.value,
      line: token.line,
      column: token.column,
      length: token.value.length,
    }));
  }

  /**
   * Mapper types de tokens avancés vers types unifiés
   */
  private mapAdvancedType(type: VB6TokenType): string {
    const mapping: Record<VB6TokenType, string> = {
      [VB6TokenType.Keyword]: 'Keyword',
      [VB6TokenType.Identifier]: 'Identifier',
      [VB6TokenType.NumberLiteral]: 'Number',
      [VB6TokenType.StringLiteral]: 'String',
      [VB6TokenType.DateLiteral]: 'Date',
      [VB6TokenType.Operator]: 'Operator',
      [VB6TokenType.Punctuation]: 'Punctuation',
      [VB6TokenType.Comment]: 'Comment',
      [VB6TokenType.NewLine]: 'NewLine',
      [VB6TokenType.Whitespace]: 'Whitespace',
      [VB6TokenType.LineContinuation]: 'LineContinuation',
      [VB6TokenType.PreprocessorDirective]: 'Preprocessor',
      [VB6TokenType.TypeSuffix]: 'TypeSuffix',
      [VB6TokenType.HexLiteral]: 'HexNumber',
      [VB6TokenType.OctalLiteral]: 'OctalNumber',
      [VB6TokenType.FloatLiteral]: 'Float',
      [VB6TokenType.Label]: 'Label',
      [VB6TokenType.AttributeDeclaration]: 'Attribute',
      [VB6TokenType.EOF]: 'EOF',
    };
    return mapping[type] || 'Unknown';
  }

  /**
   * Mapper types de tokens basiques vers types unifiés
   */
  private mapBasicType(type: TokenType): string {
    const mapping: Record<TokenType, string> = {
      [TokenType.Keyword]: 'Keyword',
      [TokenType.Identifier]: 'Identifier',
      [TokenType.NumberLiteral]: 'Number',
      [TokenType.StringLiteral]: 'String',
      [TokenType.Operator]: 'Operator',
      [TokenType.Punctuation]: 'Punctuation',
      [TokenType.Comment]: 'Comment',
      [TokenType.NewLine]: 'NewLine',
      [TokenType.Whitespace]: 'Whitespace',
    };
    return mapping[type] || 'Unknown';
  }

  /**
   * Obtenir métriques de performance
   */
  public getMetrics() {
    return {
      ...this.performanceMetrics,
      averageTokensPerMs:
        this.performanceMetrics.totalTime > 0
          ? this.performanceMetrics.totalTokenized / this.performanceMetrics.totalTime
          : 0,
      fallbackRate:
        this.performanceMetrics.totalTokenized > 0
          ? this.performanceMetrics.fallbacks / (this.performanceMetrics.errors || 1)
          : 0,
    };
  }

  /**
   * Réinitialiser les métriques
   */
  public resetMetrics() {
    this.performanceMetrics = {
      totalTokenized: 0,
      totalTime: 0,
      errors: 0,
      fallbacks: 0,
    };
  }

  /**
   * Validation croisée entre les deux lexers (pour tests)
   */
  public validateCrossLexer(code: string): {
    match: boolean;
    differences: string[];
  } {
    try {
      const advancedTokens = this.tokenizeWithAdvanced(code);
      const basicTokens = this.tokenizeWithBasic(code);

      const differences: string[] = [];

      // Comparer le nombre de tokens (en ignorant whitespace)
      const advancedFiltered = advancedTokens.filter(
        t => t.type !== 'Whitespace' && t.type !== 'NewLine'
      );
      const basicFiltered = basicTokens.filter(
        t => t.type !== 'Whitespace' && t.type !== 'NewLine'
      );

      if (advancedFiltered.length !== basicFiltered.length) {
        differences.push(
          `Token count mismatch: ${advancedFiltered.length} vs ${basicFiltered.length}`
        );
      }

      // Comparer token par token
      const minLength = Math.min(advancedFiltered.length, basicFiltered.length);
      for (let i = 0; i < minLength; i++) {
        const adv = advancedFiltered[i];
        const basic = basicFiltered[i];

        if (adv.type !== basic.type || adv.value !== basic.value) {
          differences.push(
            `Token ${i}: [${adv.type}:${adv.value}] vs [${basic.type}:${basic.value}]`
          );
        }
      }

      return {
        match: differences.length === 0,
        differences,
      };
    } catch (error) {
      return {
        match: false,
        differences: [`Validation error: ${error}`],
      };
    }
  }
}

/**
 * Export fonction compatible avec l'ancienne API
 */
export function lexVB6Unified(code: string, options?: UnifiedLexerOptions): UnifiedToken[] {
  const lexer = new UnifiedLexer(options);
  return lexer.tokenize(code);
}

/**
 * Export singleton par défaut
 */
export const defaultUnifiedLexer = new UnifiedLexer();

/**
 * Adapter pour compatibilité avec l'ancien code
 */
export function createLegacyAdapter() {
  return {
    lexVB6: (code: string) => {
      const tokens = defaultUnifiedLexer.tokenize(code);
      // Convertir vers l'ancien format si nécessaire
      return tokens.map(t => ({
        type: t.type as any,
        value: t.value,
        line: t.line,
        column: t.column,
      }));
    },
  };
}

export default UnifiedLexer;
