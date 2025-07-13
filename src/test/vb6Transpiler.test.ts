import { describe, it, expect } from 'vitest';
import { parseVB6Module } from '../utils/vb6Parser';
import { transpileModuleToJS } from '../utils/vb6Transpiler';

const code = `Public Function Add(a As Integer, b As Integer) As Integer
  Add = a + b
End Function`;

describe('transpileModuleToJS', () => {
  it('converts VB6 function to JavaScript', () => {
    const ast = parseVB6Module(code, 'Module1');
    const js = transpileModuleToJS(ast);
    expect(js).toContain('function Add(a, b)');
    expect(js).toContain('a + b');
  });
});
