/**
 * Runtime Performance Tests
 *
 * Validates that core operations complete within acceptable time budgets.
 * These are lightweight smoke tests — not micro-benchmarks.
 */
import { describe, it, expect } from 'vitest';

// Budget in milliseconds
const BUDGETS = {
  lexerTokenize: 100, // Tokenize 1000 lines
  parserParse: 200, // Parse 1000 lines
  transpilerTranspile: 300, // Transpile 500 lines
};

function generateVB6Code(lines: number): string {
  const code: string[] = ['Option Explicit', '', 'Private Sub Form_Load()'];
  for (let i = 0; i < lines - 6; i++) {
    code.push(`  Dim var${i} As String`);
  }
  code.push('End Sub');
  code.push('');
  code.push("' End of module");
  return code.join('\n');
}

function measure(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

describe('Lexer Performance', () => {
  it('tokenizes 1000 lines within budget', async () => {
    const { tokenizeVB6 } = await import('../../compiler/VB6AdvancedLexer');
    const code = generateVB6Code(1000);

    // Warm up
    tokenizeVB6(code);

    const elapsed = measure(() => {
      tokenizeVB6(code);
    });

    expect(elapsed).toBeLessThan(BUDGETS.lexerTokenize);
  });
});

describe('Parser Performance', () => {
  it('parses 1000 lines within budget', async () => {
    const { parseVB6Code } = await import('../../compiler/VB6RecursiveDescentParser');
    const { adaptTokens } = await import('../../compiler/tokenAdapter');
    const { tokenizeVB6 } = await import('../../compiler/VB6AdvancedLexer');
    const code = generateVB6Code(1000);
    const tokens = tokenizeVB6(code);
    const adapted = adaptTokens(tokens);

    // Warm up
    parseVB6Code(adapted, code);

    const elapsed = measure(() => {
      parseVB6Code(adapted, code);
    });

    expect(elapsed).toBeLessThan(BUDGETS.parserParse);
  });
});

describe('Transpiler Performance', () => {
  it('transpiles 500 lines within budget', async () => {
    const { transpileVB6 } = await import('../../utils/vb6Transpiler');
    const code = generateVB6Code(500);

    // Warm up
    transpileVB6(code);

    const elapsed = measure(() => {
      transpileVB6(code);
    });

    expect(elapsed).toBeLessThan(BUDGETS.transpilerTranspile);
  });
});
