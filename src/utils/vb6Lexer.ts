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
  DateLiteral = 'DateLiteral',
  HexLiteral = 'HexLiteral',
  OctalLiteral = 'OctalLiteral',
  FloatLiteral = 'FloatLiteral',
  LineContinuation = 'LineContinuation',
  PreprocessorDirective = 'PreprocessorDirective',
  TypeSuffix = 'TypeSuffix',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  'and',
  'addressof',
  'alias',
  'as',
  'boolean',
  'byref',
  'byte',
  'byval',
  'call',
  'case',
  'class',
  'const',
  'currency',
  'date',
  'debug',
  'declare',
  'dim',
  'do',
  'double',
  'each',
  'else',
  'elseif',
  'end',
  'enum',
  'eqv',
  'erase',
  'error',
  'event',
  'exit',
  'false',
  'for',
  'friend',
  'function',
  'get',
  'global',
  'gosub',
  'goto',
  'if',
  'imp',
  'implements',
  'in',
  'integer',
  'is',
  'let',
  'lib',
  'like',
  'long',
  'loop',
  'me',
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
  'paramarray',
  'preserve',
  'print',
  'private',
  'property',
  'public',
  'raiseevent',
  'redim',
  'rem',
  'resume',
  'return',
  'select',
  'set',
  'single',
  'static',
  'step',
  'stop',
  'string',
  'sub',
  'then',
  'to',
  'true',
  'type',
  'typeof',
  'until',
  'variant',
  'wend',
  'while',
  'with',
  'withevents',
  'xor',
]);

const OPERATORS = ['>=', '<=', '<>', ':=', '\\', '=', '>', '<', '+', '-', '*', '/', '^', '&'];
const PUNCTUATIONS = ['(', ')', ',', '.', ':', ';', '!'];
const TYPE_SUFFIXES = new Set(['%', '&', '!', '#', '@', '$']);

export function lexVB6(code: string): Token[] {
  // LEXER BUG FIX: Add input validation and size limits
  if (typeof code !== 'string') {
    throw new Error('Invalid code input');
  }
  if (code.length > 1000000) {
    // 1MB limit
    throw new Error('Code too large to lex');
  }
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let column = 1;
  let isLineStart = true;

  const addToken = (type: TokenType, value: string, l = line, c = column) => {
    if (tokens.length >= 1000000) {
      throw new Error('Too many tokens');
    }
    tokens.push({ type, value, line: l, column: c });
    if (type !== TokenType.Whitespace && type !== TokenType.NewLine) {
      isLineStart = false;
    }
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
      isLineStart = true;
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

    // Preprocessor directives and date literals
    if (ch === '#') {
      const startCol = column;
      // Check for preprocessor directive: #If, #Else, #ElseIf, #End, #Const
      if (isLineStart) {
        const restOfLine = code.slice(i + 1).match(/^\s*(If|Else|ElseIf|End|Const)\b/i);
        if (restOfLine) {
          const start = i;
          while (i < code.length && code[i] !== '\n') {
            i++;
            column++;
          }
          addToken(TokenType.PreprocessorDirective, code.slice(start, i), line, startCol);
          continue;
        }
      }
      // Date literal: #12/31/2023# or #1:30 PM#
      const start = i;
      i++;
      column++;
      while (i < code.length && code[i] !== '#' && code[i] !== '\n') {
        i++;
        column++;
      }
      if (i < code.length && code[i] === '#') {
        i++;
        column++;
        addToken(TokenType.DateLiteral, code.slice(start, i), line, startCol);
      } else {
        // Not a date literal, emit as punctuation
        addToken(TokenType.Punctuation, '#', line, startCol);
        i = start + 1;
        column = startCol + 1;
      }
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
      let hasDecimal = false;
      let hasExponent = false;
      const maxNumber = Math.min(i + 100, code.length);
      while (i < maxNumber && /[0-9]/.test(code[i])) {
        i++;
        column++;
      }
      // Decimal part
      if (i < maxNumber && code[i] === '.' && /[0-9]/.test(code[i + 1] || '')) {
        hasDecimal = true;
        i++;
        column++;
        while (i < maxNumber && /[0-9]/.test(code[i])) {
          i++;
          column++;
        }
      }
      // Exponent part (E/e/D/d for VB6)
      if (i < maxNumber && /[eEdD]/.test(code[i])) {
        hasExponent = true;
        i++;
        column++;
        if (i < maxNumber && /[+-]/.test(code[i])) {
          i++;
          column++;
        }
        while (i < maxNumber && /[0-9]/.test(code[i])) {
          i++;
          column++;
        }
      }
      const numValue = code.slice(start, i);
      const numType = hasDecimal || hasExponent ? TokenType.FloatLiteral : TokenType.NumberLiteral;
      addToken(numType, numValue, line, startCol);
      // Check for type suffix after number
      if (i < code.length && TYPE_SUFFIXES.has(code[i])) {
        addToken(TokenType.TypeSuffix, code[i], line, column);
        i++;
        column++;
      }
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      const startCol = column;
      const maxIdentifier = Math.min(i + 256, code.length);
      while (i < maxIdentifier && /[A-Za-z0-9_]/.test(code[i])) {
        i++;
        column++;
      }
      const value = code.slice(start, i);
      const lower = value.toLowerCase();

      // Line continuation: standalone _ at end of line
      if (value === '_') {
        let j = i;
        while (j < code.length && (code[j] === ' ' || code[j] === '\t')) j++;
        if (j >= code.length || code[j] === '\n' || code[j] === '\r') {
          addToken(TokenType.LineContinuation, '_', line, startCol);
          // Skip trailing whitespace (newline handled by next iteration)
          i = j;
          column += j - start - 1;
          continue;
        }
      }

      // Rem comment: consumes rest of line
      if (lower === 'rem') {
        const commentStart = start;
        while (i < code.length && code[i] !== '\n') {
          i++;
          column++;
        }
        addToken(TokenType.Comment, code.slice(commentStart, i), line, startCol);
        continue;
      }

      const tokenType = KEYWORDS.has(lower) ? TokenType.Keyword : TokenType.Identifier;
      addToken(tokenType, value, line, startCol);
      // Check for type suffix after identifier
      if (tokenType === TokenType.Identifier && i < code.length && TYPE_SUFFIXES.has(code[i])) {
        addToken(TokenType.TypeSuffix, code[i], line, column);
        i++;
        column++;
      }
      continue;
    }

    // Hex and octal literals: &H... and &O...
    if (ch === '&' && i + 1 < code.length) {
      const next = code[i + 1];
      if (next === 'H' || next === 'h') {
        const start = i;
        const startCol = column;
        i += 2;
        column += 2;
        while (i < code.length && /[0-9A-Fa-f]/.test(code[i])) {
          i++;
          column++;
        }
        // Optional trailing & for Long type
        if (i < code.length && code[i] === '&') {
          i++;
          column++;
        }
        addToken(TokenType.HexLiteral, code.slice(start, i), line, startCol);
        continue;
      }
      if (next === 'O' || next === 'o') {
        const start = i;
        const startCol = column;
        i += 2;
        column += 2;
        while (i < code.length && /[0-7]/.test(code[i])) {
          i++;
          column++;
        }
        addToken(TokenType.OctalLiteral, code.slice(start, i), line, startCol);
        continue;
      }
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

    // Type suffix characters in standalone position
    if (TYPE_SUFFIXES.has(ch)) {
      addToken(TokenType.TypeSuffix, ch);
      i++;
      column++;
      continue;
    }

    // Unknown character
    addToken(TokenType.Punctuation, ch);
    i++;
    column++;
  }

  addToken(TokenType.EOF, '', line, column);
  return tokens;
}
