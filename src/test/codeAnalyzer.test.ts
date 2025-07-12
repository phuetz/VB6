import { describe, it, expect } from 'vitest';
import { analyzeVB6Code } from '../utils/codeAnalyzer';

describe('analyzeVB6Code', () => {
  it('detects GoTo statements and computes metrics', () => {
    const code = `Option Explicit
Sub Test()
  Dim i As Integer
  For i = 1 To 10
    If i = 5 Then GoTo Skip
  Next i
Skip:
End Sub`;

    const result = analyzeVB6Code(code);
    expect(result.metrics.linesOfCode).toBe(8);
    expect(result.metrics.complexity).toBeGreaterThan(0);
    expect(result.issues.some(i => i.code === 'VB005')).toBe(true);
  });
});
