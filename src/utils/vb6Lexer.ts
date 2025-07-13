export enum TokenType {
  Keyword = 'Keyword',
  Identifier = 'Identifier',
  NumberLiteral = 'NumberLiteral',
  StringLiteral = 'StringLiteral',
  Operator = 'Operator',
  Punctuation = 'Punctuation',
  Comment = 'Comment',
  NewLine = 'NewLine',
  Whitespace = 'Whitespace'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  'and', 'as', 'boolean', 'byref', 'byte', 'byval', 'call', 'case', 'const',
  'currency', 'dim', 'do', 'double', 'each', 'else', 'elseif', 'end', 'enum',
  'exit', 'false', 'for', 'function', 'get', 'goto', 'if', 'in', 'integer',
  'is', 'let', 'long', 'loop', 'mod', 'new', 'next', 'not', 'nothing', 'object',
  'on', 'option', 'optional', 'or', 'private', 'property', 'public', 'resume',
  'select', 'set', 'single', 'static', 'string', 'sub', 'then', 'to', 'true',
  'type', 'until', 'variant', 'wend', 'while', 'with', 'xor'
]);

const OPERATORS = ['>=', '<=', '<>', '\\', '=', '>', '<', '+', '-', '*', '/', '^', '&'];
const PUNCTUATIONS = ['(', ')', ',', '.', ':'];

export function lexVB6(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const addToken = (type: TokenType, value: string, l = line, c = column) => {
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
      i++; line++; column = 1;
      continue;
    }

    if (/\s/.test(ch)) {
      const start = i;
      const startCol = column;
      while (i < code.length && /\s/.test(code[i]) && code[i] !== '\n') {
        i++; column++;
      }
      addToken(TokenType.Whitespace, code.slice(start, i), line, startCol);
      continue;
    }

    if (ch === "'") {
      const start = i;
      const startCol = column;
      while (i < code.length && code[i] !== '\n') {
        i++; column++;
      }
      addToken(TokenType.Comment, code.slice(start, i), line, startCol);
      continue;
    }

    if (ch === '"') {
      const startCol = column;
      i++; column++;
      let value = '';
      while (i < code.length) {
        if (code[i] === '"') {
          if (code[i + 1] === '"') {
            value += '"';
            i += 2; column += 2;
            continue;
          }
          break;
        }
        value += code[i];
        i++; column++;
      }
      i++; column++; // consume closing quote
      addToken(TokenType.StringLiteral, value, line, startCol);
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      const startCol = column;
      while (i < code.length && /[0-9A-Fa-fxX&.]/.test(code[i])) {
        i++; column++;
      }
      addToken(TokenType.NumberLiteral, code.slice(start, i), line, startCol);
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      const startCol = column;
      while (i < code.length && /[A-Za-z0-9_]/.test(code[i])) {
        i++; column++;
      }
      const value = code.slice(start, i);
      const lower = value.toLowerCase();
      addToken(KEYWORDS.has(lower) ? TokenType.Keyword : TokenType.Identifier, value, line, startCol);
      continue;
    }

    const two = code.slice(i, i + 2);
    if (OPERATORS.includes(two)) {
      addToken(TokenType.Operator, two);
      i += 2; column += 2;
      continue;
    }
    if (OPERATORS.includes(ch)) {
      addToken(TokenType.Operator, ch);
      i++; column++;
      continue;
    }

    if (PUNCTUATIONS.includes(ch)) {
      addToken(TokenType.Punctuation, ch);
      i++; column++;
      continue;
    }

    // Unknown character
    addToken(TokenType.Punctuation, ch);
    i++; column++;
  }

  return tokens;
}
