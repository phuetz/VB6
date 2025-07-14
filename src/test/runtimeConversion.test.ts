import { describe, it, expect } from 'vitest';
import { basicTranspile } from '../components/Runtime/VB6Runtime';

describe('basicTranspile', () => {
  it('handles Select Case blocks', () => {
    const vb = `Select Case x\nCase 1\nPrint "one"\nCase Else\nPrint "other"\nEnd Select`;
    const js = basicTranspile(vb);
    expect(js).toContain('switch');
    expect(js).toContain('case 1:');
    expect(js).toContain('default:');
  });

  it('handles Do While loops', () => {
    const vb = `Do While i < 5\nPrint i\nLoop`;
    const js = basicTranspile(vb);
    expect(js).toContain('while (i < 5) {');
    expect(js).toContain('Print(i);');
  });

  it('handles Do Until loops', () => {
    const vb = `Do Until x > 10\nPrint x\nLoop`;
    const js = basicTranspile(vb);
    expect(js).toContain('while (!(x > 10)) {');
  });
});
