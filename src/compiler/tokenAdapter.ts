/**
 * Token Adapter - Converts main lexer tokens to VB6AdvancedLexer format
 * Bridges src/utils/vb6Lexer.ts output → VB6RecursiveDescentParser input
 */

import { Token, TokenType } from '../utils/vb6Lexer';
import { VB6Token, VB6TokenType } from './VB6AdvancedLexer';

// The enum string values are identical between TokenType and VB6TokenType
const TOKEN_TYPE_MAP: Record<string, VB6TokenType> = {
  [TokenType.Keyword]: VB6TokenType.Keyword,
  [TokenType.Identifier]: VB6TokenType.Identifier,
  [TokenType.NumberLiteral]: VB6TokenType.NumberLiteral,
  [TokenType.StringLiteral]: VB6TokenType.StringLiteral,
  [TokenType.Operator]: VB6TokenType.Operator,
  [TokenType.Punctuation]: VB6TokenType.Punctuation,
  [TokenType.Comment]: VB6TokenType.Comment,
  [TokenType.NewLine]: VB6TokenType.NewLine,
  [TokenType.Whitespace]: VB6TokenType.Whitespace,
  [TokenType.DateLiteral]: VB6TokenType.DateLiteral,
  [TokenType.HexLiteral]: VB6TokenType.HexLiteral,
  [TokenType.OctalLiteral]: VB6TokenType.OctalLiteral,
  [TokenType.FloatLiteral]: VB6TokenType.FloatLiteral,
  [TokenType.LineContinuation]: VB6TokenType.LineContinuation,
  [TokenType.PreprocessorDirective]: VB6TokenType.PreprocessorDirective,
  [TokenType.TypeSuffix]: VB6TokenType.TypeSuffix,
  [TokenType.EOF]: VB6TokenType.EOF,
};

/**
 * Convert a single Token from the main lexer to VB6Token format.
 */
export function adaptToken(token: Token): VB6Token {
  return {
    type: TOKEN_TYPE_MAP[token.type] || VB6TokenType.Identifier,
    value: token.value,
    line: token.line,
    column: token.column,
    length: token.value.length,
  };
}

/**
 * Convert an array of Tokens from the main lexer to VB6Token[] format
 * for use with VB6RecursiveDescentParser.
 */
export function adaptTokens(tokens: Token[]): VB6Token[] {
  return tokens.map(adaptToken);
}
