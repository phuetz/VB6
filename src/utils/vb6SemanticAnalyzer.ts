export interface SemanticIssue {
  line: number;
  message: string;
  code: string;
}

import { parseVB6Module } from './vb6Parser';

const BUILTINS = new Set([
  'msgbox',
  'inputbox',
  'print',
  'len',
  'left',
  'right',
  'mid',
  'ucase',
  'lcase',
  'trim',
  'val',
  'str',
  'now',
  'timer',
  'if',
  'then',
  'else',
  'end',
  'for',
  'to',
  'next',
  'while',
  'wend',
  'do',
  'loop',
  'sub',
  'function',
  'dim',
  'private',
  'public',
  'static',
  'const',
  'true',
  'false',
  'nothing',
]);

/**
 * Very small semantic analyzer checking for undeclared variables within
 * procedures. It uses parseVB6Module to gather module level declarations.
 */
export function analyzeVBSemantics(code: string): SemanticIssue[] {
  const ast = parseVB6Module(code, 'Module1');
  const issues: SemanticIssue[] = [];
  const moduleVars = new Set(ast.variables.map(v => v.name.toLowerCase()));

  ast.procedures.forEach(proc => {
    // Start scope with module variables and parameters
    const scope = new Set<string>(moduleVars);
    proc.parameters.forEach(p => scope.add(p.name.toLowerCase()));

    const lines = proc.body.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const dimMatch = line.match(/\bDim\s+(\w+)/i);
      if (dimMatch) {
        scope.add(dimMatch[1].toLowerCase());
      }
      const tokens = line.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
      tokens.forEach(tok => {
        const lower = tok.toLowerCase();
        if (!scope.has(lower) && !BUILTINS.has(lower)) {
          issues.push({
            line: proc.line + idx + 1,
            message: `Variable '${tok}' is not declared`,
            code: 'SEM001',
          });
        }
      });
    });
  });

  return issues;
}
