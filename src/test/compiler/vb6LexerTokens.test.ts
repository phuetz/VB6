/**
 * VB6 Lexer Token Tests
 * Tests the enhanced token types: DateLiteral, HexLiteral, OctalLiteral,
 * FloatLiteral, LineContinuation, PreprocessorDirective, TypeSuffix, EOF
 */

import { describe, it, expect } from 'vitest';
import { lexVB6, TokenType } from '../../utils/vb6Lexer';

// Helper to get non-whitespace tokens
const significantTokens = (code: string) =>
  lexVB6(code).filter(t => t.type !== TokenType.Whitespace && t.type !== TokenType.NewLine);

describe('VB6 Enhanced Lexer Tokens', () => {
  describe('HexLiteral', () => {
    it('should tokenize &HFF as HexLiteral', () => {
      const tokens = significantTokens('&HFF');
      expect(tokens[0].type).toBe(TokenType.HexLiteral);
      expect(tokens[0].value).toBe('&HFF');
    });

    it('should tokenize &h0A as HexLiteral (lowercase)', () => {
      const tokens = significantTokens('&h0A');
      expect(tokens[0].type).toBe(TokenType.HexLiteral);
      expect(tokens[0].value).toBe('&h0A');
    });

    it('should tokenize &HFF& as HexLiteral with Long suffix', () => {
      const tokens = significantTokens('&HFF&');
      expect(tokens[0].type).toBe(TokenType.HexLiteral);
      expect(tokens[0].value).toBe('&HFF&');
    });
  });

  describe('OctalLiteral', () => {
    it('should tokenize &O77 as OctalLiteral', () => {
      const tokens = significantTokens('&O77');
      expect(tokens[0].type).toBe(TokenType.OctalLiteral);
      expect(tokens[0].value).toBe('&O77');
    });
  });

  describe('FloatLiteral', () => {
    it('should tokenize 3.14 as FloatLiteral', () => {
      const tokens = significantTokens('3.14');
      expect(tokens[0].type).toBe(TokenType.FloatLiteral);
      expect(tokens[0].value).toBe('3.14');
    });

    it('should tokenize 1.5E10 as FloatLiteral', () => {
      const tokens = significantTokens('1.5E10');
      expect(tokens[0].type).toBe(TokenType.FloatLiteral);
      expect(tokens[0].value).toBe('1.5E10');
    });

    it('should tokenize 2E-5 as FloatLiteral', () => {
      const tokens = significantTokens('2E-5');
      expect(tokens[0].type).toBe(TokenType.FloatLiteral);
      expect(tokens[0].value).toBe('2E-5');
    });

    it('should tokenize integers as NumberLiteral', () => {
      const tokens = significantTokens('42');
      expect(tokens[0].type).toBe(TokenType.NumberLiteral);
      expect(tokens[0].value).toBe('42');
    });
  });

  describe('DateLiteral', () => {
    it('should tokenize #12/31/2023# as DateLiteral', () => {
      const tokens = significantTokens('#12/31/2023#');
      expect(tokens[0].type).toBe(TokenType.DateLiteral);
      expect(tokens[0].value).toBe('#12/31/2023#');
    });

    it('should tokenize #1:30:00 PM# as DateLiteral', () => {
      const tokens = significantTokens('#1:30:00 PM#');
      expect(tokens[0].type).toBe(TokenType.DateLiteral);
      expect(tokens[0].value).toBe('#1:30:00 PM#');
    });
  });

  describe('PreprocessorDirective', () => {
    it('should tokenize #If at start of line as PreprocessorDirective', () => {
      const tokens = significantTokens('#If DEBUG Then');
      expect(tokens[0].type).toBe(TokenType.PreprocessorDirective);
      expect(tokens[0].value).toBe('#If DEBUG Then');
    });

    it('should tokenize #Const as PreprocessorDirective', () => {
      const tokens = significantTokens('#Const DEBUG = 1');
      expect(tokens[0].type).toBe(TokenType.PreprocessorDirective);
    });
  });

  describe('LineContinuation', () => {
    it('should tokenize _ at end of line as LineContinuation', () => {
      const tokens = lexVB6('result = a + _\n  b');
      const continuation = tokens.find(t => t.type === TokenType.LineContinuation);
      expect(continuation).toBeDefined();
      expect(continuation?.value).toBe('_');
    });

    it('should NOT tokenize _ in identifiers as LineContinuation', () => {
      const tokens = significantTokens('my_var');
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('my_var');
    });
  });

  describe('TypeSuffix', () => {
    it('should tokenize $ after identifier as TypeSuffix', () => {
      const tokens = significantTokens('myVar$');
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('myVar');
      expect(tokens[1].type).toBe(TokenType.TypeSuffix);
      expect(tokens[1].value).toBe('$');
    });

    it('should tokenize % after identifier as TypeSuffix', () => {
      const tokens = significantTokens('count%');
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[1].type).toBe(TokenType.TypeSuffix);
      expect(tokens[1].value).toBe('%');
    });

    it('should tokenize & after number as TypeSuffix', () => {
      const tokens = significantTokens('42&');
      expect(tokens[0].type).toBe(TokenType.NumberLiteral);
      expect(tokens[1].type).toBe(TokenType.TypeSuffix);
      expect(tokens[1].value).toBe('&');
    });
  });

  describe('EOF', () => {
    it('should add EOF token at end', () => {
      const tokens = lexVB6('x');
      const last = tokens[tokens.length - 1];
      expect(last.type).toBe(TokenType.EOF);
    });

    it('should add EOF for empty input', () => {
      const tokens = lexVB6('');
      expect(tokens.length).toBe(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });
  });

  describe('New keywords', () => {
    it('should recognize Friend as keyword', () => {
      const tokens = significantTokens('Friend Sub MySub()');
      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[0].value).toBe('Friend');
    });

    it('should recognize WithEvents as keyword', () => {
      const tokens = significantTokens('WithEvents obj As Object');
      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[0].value).toBe('WithEvents');
    });

    it('should recognize Implements as keyword', () => {
      const tokens = significantTokens('Implements IMyInterface');
      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[0].value).toBe('Implements');
    });

    it('should recognize ParamArray as keyword', () => {
      const tokens = significantTokens('ParamArray args() As Variant');
      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[0].value).toBe('ParamArray');
    });

    it('should recognize Declare as keyword', () => {
      const tokens = significantTokens('Declare Function GetTickCount Lib "kernel32"');
      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[0].value).toBe('Declare');
    });

    it('should recognize RaiseEvent as keyword', () => {
      const tokens = significantTokens('RaiseEvent Click');
      expect(tokens[0].type).toBe(TokenType.Keyword);
      expect(tokens[0].value).toBe('RaiseEvent');
    });
  });

  describe('Rem comments', () => {
    it('should tokenize Rem as comment', () => {
      const tokens = significantTokens('Rem This is a comment');
      expect(tokens[0].type).toBe(TokenType.Comment);
      expect(tokens[0].value).toBe('Rem This is a comment');
    });
  });

  describe('Backward compatibility', () => {
    it('should still tokenize basic VB6 code correctly', () => {
      const tokens = significantTokens('Dim x As Integer');
      expect(tokens[0]).toMatchObject({ type: TokenType.Keyword, value: 'Dim' });
      expect(tokens[1]).toMatchObject({ type: TokenType.Identifier, value: 'x' });
      expect(tokens[2]).toMatchObject({ type: TokenType.Keyword, value: 'As' });
      expect(tokens[3]).toMatchObject({ type: TokenType.Keyword, value: 'Integer' });
    });

    it('should tokenize string literals correctly', () => {
      const tokens = significantTokens('"Hello World"');
      expect(tokens[0]).toMatchObject({ type: TokenType.StringLiteral, value: 'Hello World' });
    });

    it('should tokenize operators correctly', () => {
      const tokens = significantTokens('x >= 10');
      expect(tokens[1]).toMatchObject({ type: TokenType.Operator, value: '>=' });
    });

    it('should tokenize & as operator when not hex/octal', () => {
      const tokens = significantTokens('"Hello" & " World"');
      expect(tokens[1]).toMatchObject({ type: TokenType.Operator, value: '&' });
    });
  });
});
