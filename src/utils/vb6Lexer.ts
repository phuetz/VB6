export enum TokenType {
  Keyword = 'Keyword',
  Identifier = 'Identifier',
  NumberLiteral = 'NumberLiteral',
  StringLiteral = 'StringLiteral',
  Operator = 'Operator',
  Punctuation = 'Punctuation',
  Comment = 'Comment',
  NewLine = 'NewLine',
  Whitespace = 'Whitespace',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  'and',
  'as',
  'boolean',
  'byref',
  'byte',
  'byval',
  'call',
  'case',
  'const',
  'currency',
  'dim',
  'do',
  'double',
  'each',
  'else',
  'elseif',
  'end',
  'enum',
  'exit',
  'false',
  'for',
  'function',
  'get',
  'goto',
  'if',
  'in',
  'integer',
  'is',
  'let',
  'long',
  'loop',
  'mod',
  'new',
  'next',
  'not',
  'nothing',
  'object',
  'on',
  'option',
  'optional',
  'or',
  'private',
  'property',
  'public',
  'resume',
  'select',
  'set',
  'single',
  'static',
  'string',
  'sub',
  'then',
  'to',
  'true',
  'type',
  'until',
  'variant',
  'wend',
  'while',
  'with',
  'xor',
]);

const OPERATORS = ['>=', '<=', '<>', '\\', '=', '>', '<', '+', '-', '*', '/', '^', '&'];
const PUNCTUATIONS = ['(', ')', ',', '.', ':'];

export function lexVB6(code: string): Token[] {
  // LEXER BUG FIX: Add input validation and size limits
  if (typeof code !== 'string') {
    throw new Error('Invalid code input');
  }
  if (code.length > 1000000) { // 1MB limit
    throw new Error('Code too large to lex');
  }
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const addToken = (type: TokenType, value: string, l = line, c = column) => {
    // LEXER BUG FIX: Limit token array size to prevent memory exhaustion
    if (tokens.length >= 1000000) {
      throw new Error('Too many tokens');
    }
    tokens.push({ type, value, line: l, column: c });
  };

  while (i < code.length) {
    const ch = code[i];

    if (ch === '\r') {
      i++; // ignore
      continue;
    }

    if (ch === '\n') {
      addToken(TokenType.NewLine, '\n');
      i++;
      line++;
      column = 1;
      continue;
    }

    if (/\s/.test(ch)) {
      const start = i;
      const startCol = column;
      // LEXER BUG FIX: Add bounds checking to prevent infinite loops
      const maxWhitespace = Math.min(i + 10000, code.length);
      while (i < maxWhitespace && /\s/.test(code[i]) && code[i] !== '\n') {
        i++;
        column++;
      }
      addToken(TokenType.Whitespace, code.slice(start, i), line, startCol);
      continue;
    }

    if (ch === "'") {
      const start = i;
      const startCol = column;
      // LEXER BUG FIX: Limit comment length
      const maxComment = Math.min(i + 10000, code.length);
      while (i < maxComment && code[i] !== '\n') {
        i++;
        column++;
      }
      addToken(TokenType.Comment, code.slice(start, i), line, startCol);
      continue;
    }

    if (ch === '"') {
      const startCol = column;
      i++;
      column++;
      let value = '';
      // LEXER BUG FIX: Limit string literal length
      const maxString = Math.min(i + 100000, code.length);
      while (i < maxString) {
        if (code[i] === '"') {
          if (code[i + 1] === '"') {
            value += '"';
            i += 2;
            column += 2;
            continue;
          }
          break;
        }
        value += code[i];
        i++;
        column++;
      }
      // LEXER BUG FIX: Check if we hit the limit without finding closing quote
      if (i >= maxString) {
        throw new Error('Unterminated string literal');
      }
      i++;
      column++; // consume closing quote
      addToken(TokenType.StringLiteral, value, line, startCol);
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      const startCol = column;
      // LEXER BUG FIX: Limit number literal length
      const maxNumber = Math.min(i + 100, code.length);
      while (i < maxNumber && /[0-9A-Fa-fxX&.]/.test(code[i])) {
        i++;
        column++;
      }
      addToken(TokenType.NumberLiteral, code.slice(start, i), line, startCol);
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      const startCol = column;
      // LEXER BUG FIX: Limit identifier length
      const maxIdentifier = Math.min(i + 256, code.length);
      while (i < maxIdentifier && /[A-Za-z0-9_]/.test(code[i])) {
        i++;
        column++;
      }
      const value = code.slice(start, i);
      const lower = value.toLowerCase();
      addToken(
        KEYWORDS.has(lower) ? TokenType.Keyword : TokenType.Identifier,
        value,
        line,
        startCol
      );
      continue;
    }

    const two = code.slice(i, i + 2);
    if (OPERATORS.includes(two)) {
      addToken(TokenType.Operator, two);
      i += 2;
      column += 2;
      continue;
    }
    if (OPERATORS.includes(ch)) {
      addToken(TokenType.Operator, ch);
      i++;
      column++;
      continue;
    }

    if (PUNCTUATIONS.includes(ch)) {
      addToken(TokenType.Punctuation, ch);
      i++;
      column++;
      continue;
    }

    // Unknown character
    addToken(TokenType.Punctuation, ch);
    i++;
    column++;
  }

  return tokens;
}
