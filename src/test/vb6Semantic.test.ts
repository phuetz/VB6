import { describe, it, expect } from 'vitest';
import { analyzeVBSemantics } from '../utils/vb6SemanticAnalyzer';

const badCode = `Option Explicit
Sub Test()
  x = 5
End Sub`;

const goodCode = `Option Explicit
Dim x As Integer
Sub Test()
  x = 5
End Sub`;

describe('analyzeVBSemantics', () => {
  it('detects undeclared variables', () => {
    const issues = analyzeVBSemantics(badCode);
    expect(issues.some(i => i.code === 'SEM001')).toBe(true);
  });

  it('does not report declared variables', () => {
    const issues = analyzeVBSemantics(goodCode);
    expect(issues.length).toBe(0);
  });
});
