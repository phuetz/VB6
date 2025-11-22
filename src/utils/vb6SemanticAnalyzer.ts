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
// VB6SemanticAnalyzer class wrapper for compatibility
export class VB6SemanticAnalyzer {
  constructor() {}
  
  analyze(code: string): SemanticIssue[] {
    return analyzeVBSemantics(code);
  }
}

export function analyzeVBSemantics(code: string): SemanticIssue[] {
  // PARSER EDGE CASE FIX: Add input validation
  if (typeof code !== 'string') {
    return [{ line: 0, message: 'Invalid code input', code: 'SEM_ERR' }];
  }
  if (code.length > 1000000) {
    return [{ line: 0, message: 'Code too large to analyze', code: 'SEM_ERR' }];
  }
  
  let ast;
  try {
    ast = parseVB6Module(code, 'Module1');
  } catch (error) {
    return [{ line: 0, message: `Parse error: ${error}`, code: 'SEM_PARSE' }];
  }
  
  // PARSER EDGE CASE FIX: Validate AST structure
  if (!ast || !ast.variables || !ast.procedures) {
    return [{ line: 0, message: 'Invalid AST structure', code: 'SEM_AST' }];
  }
  
  const issues: SemanticIssue[] = [];
  const moduleVars = new Set(ast.variables.map(v => v.name.toLowerCase()));

  // PARSER EDGE CASE FIX: Add bounds for procedures
  const maxProcedures = Math.min(ast.procedures.length, 1000);
  for (let i = 0; i < maxProcedures; i++) {
    const proc = ast.procedures[i];
    // Start scope with module variables and parameters
    const scope = new Set<string>(moduleVars);
    // PARSER EDGE CASE FIX: Validate parameters
    if (proc.parameters && Array.isArray(proc.parameters)) {
      proc.parameters.forEach(p => {
        if (p && p.name && typeof p.name === 'string') {
          scope.add(p.name.toLowerCase());
        }
      });
    }

    const lines = proc.body.split(/\r?\n/);
    // PARSER EDGE CASE FIX: Limit lines to prevent DoS
    const maxLines = Math.min(lines.length, 10000);
    for (let idx = 0; idx < maxLines; idx++) {
      const line = lines[idx];
      // PARSER EDGE CASE FIX: Use safer regex with bounds
      const dimMatch = line.match(/\bDim\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})/i);
      if (dimMatch) {
        scope.add(dimMatch[1].toLowerCase());
      }
      // PARSER EDGE CASE FIX: Limit token length and count
      const tokenMatches = line.match(/\b[A-Za-z_][A-Za-z0-9_]{0,63}\b/g) || [];
      const tokens = tokenMatches.slice(0, 100); // Limit tokens per line
      tokens.forEach(tok => {
        const lower = tok.toLowerCase();
        if (!scope.has(lower) && !BUILTINS.has(lower)) {
          // PARSER EDGE CASE FIX: Validate line number
          const lineNumber = (proc.line || 0) + idx + 1;
          if (lineNumber > 0 && lineNumber < 1000000) {
            issues.push({
              line: lineNumber,
              message: `Variable '${tok}' is not declared`,
              code: 'SEM001',
            });
          }
        }
      });
      
      // PARSER EDGE CASE FIX: Limit total issues to prevent memory exhaustion
      if (issues.length >= 10000) {
        issues.push({
          line: 0,
          message: 'Too many issues found, analysis stopped',
          code: 'SEM_LIMIT'
        });
        return issues;
      }
    }
  }

  return issues;
}
