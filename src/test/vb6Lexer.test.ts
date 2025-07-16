import { describe, it, expect } from 'vitest';
import { lexVB6, TokenType } from '../utils/vb6Lexer';

const sample = `Option Explicit
Dim x As Integer
x = 10 'comment
If x >= 5 Then
  MsgBox "Hi"
End If`;

describe('lexVB6', () => {
  it('tokenizes VB6 code', () => {
    const tokens = lexVB6(sample);
    expect(tokens.some(t => t.type === TokenType.Keyword && t.value.toLowerCase() === 'if')).toBe(
      true
    );
    expect(tokens.some(t => t.type === TokenType.StringLiteral && t.value === 'Hi')).toBe(true);
    expect(tokens.some(t => t.type === TokenType.Comment)).toBe(true);
    expect(tokens.some(t => t.type === TokenType.NumberLiteral && t.value === '10')).toBe(true);
  });
});
