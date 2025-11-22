/**
 * VB6 Code Formatter
 * Utility for formatting and beautifying VB6 code according to style guidelines
 */

export interface FormattingOptions {
  indentSize: number;
  useTabs: boolean;
  alignComments: boolean;
  alignDeclarations: boolean;
  insertSpaceAfterKeyword: boolean;
  capitalizeKeywords: boolean;
  alignContinuations: boolean;
  preserveEmptyLines: boolean;
  maxEmptyLines: number;
  removeTrailingSpaces: boolean;
  sortImports: boolean;
}

export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
  indentSize: 4,
  useTabs: false,
  alignComments: true,
  alignDeclarations: true,
  insertSpaceAfterKeyword: true,
  capitalizeKeywords: true,
  alignContinuations: true,
  preserveEmptyLines: true,
  maxEmptyLines: 2,
  removeTrailingSpaces: true,
  sortImports: false,
};

// VB6 keywords for capitalization
const VB6_KEYWORDS = [
  'Dim',
  'As',
  'Set',
  'Let',
  'Sub',
  'Function',
  'End',
  'If',
  'Then',
  'Else',
  'ElseIf',
  'For',
  'To',
  'Next',
  'While',
  'Wend',
  'Do',
  'Loop',
  'Until',
  'Select',
  'Case',
  'Private',
  'Public',
  'Friend',
  'Static',
  'Const',
  'Type',
  'Enum',
  'Property',
  'Get',
  'Let',
  'Set',
  'WithEvents',
  'New',
  'Nothing',
  'True',
  'False',
  'And',
  'Or',
  'Not',
  'Xor',
  'Eqv',
  'Imp',
  'Is',
  'Mod',
  'Call',
  'Option',
  'Explicit',
  'On',
  'Error',
  'Resume',
  'GoTo',
  'GoSub',
  'Return',
  'Exit',
  'Declare',
  'ReDim',
  'Preserve',
  'Integer',
  'Long',
  'Single',
  'Double',
  'String',
  'Currency',
  'Date',
  'Boolean',
  'Byte',
  'Object',
  'Variant',
  'With',
  'In',
  'Each',
  'Print',
  'Debug',
];

/**
 * Format VB6 code according to the specified options
 */
export function formatVB6Code(code: string, options: Partial<FormattingOptions> = {}): string {
  // Merge options with defaults
  const opts: FormattingOptions = {
    ...DEFAULT_FORMATTING_OPTIONS,
    ...options,
  };

  // Split code into lines for processing
  let lines = code.split('\n');

  // Remove trailing spaces if configured
  if (opts.removeTrailingSpaces) {
    lines = lines.map(line => line.trimRight());
  }

  // Process empty lines
  if (!opts.preserveEmptyLines) {
    lines = lines.filter(line => line.trim() !== '');
  } else if (opts.maxEmptyLines > 0) {
    // Limit consecutive empty lines
    let emptyLineCount = 0;
    lines = lines.filter(line => {
      if (line.trim() === '') {
        emptyLineCount++;
        return emptyLineCount <= opts.maxEmptyLines;
      } else {
        emptyLineCount = 0;
        return true;
      }
    });
  }

  // Calculate proper indentation
  lines = applyIndentation(lines, opts);

  // Capitalize keywords if configured
  if (opts.capitalizeKeywords) {
    lines = capitalizeKeywords(lines, VB6_KEYWORDS);
  }

  // Add space after keywords if configured
  if (opts.insertSpaceAfterKeyword) {
    lines = addSpaceAfterKeywords(lines, VB6_KEYWORDS);
  }

  // Align declarations if configured
  if (opts.alignDeclarations) {
    lines = alignDeclarations(lines);
  }

  // Align comments if configured
  if (opts.alignComments) {
    lines = alignComments(lines);
  }

  // Align line continuations if configured
  if (opts.alignContinuations) {
    lines = alignLineContinuations(lines, opts);
  }

  // Sort imports if configured
  if (opts.sortImports) {
    lines = sortImportStatements(lines);
  }

  return lines.join('\n');
}

/**
 * Apply proper indentation to VB6 code
 */
function applyIndentation(lines: string[], options: FormattingOptions): string[] {
  const indentChar = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
  let indentLevel = 0;

  return lines.map(line => {
    const trimmedLine = line.trim();

    // Check if line should decrease indent first (before indenting)
    if (isEndStatement(trimmedLine)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Apply current indentation
    const indentedLine = trimmedLine ? indentChar.repeat(indentLevel) + trimmedLine : trimmedLine;

    // Check if next line should be indented more
    if (isStartStatement(trimmedLine) && !isCompleteBlockInOneLine(trimmedLine)) {
      indentLevel++;
    }

    return indentedLine;
  });
}

/**
 * Check if line contains a statement that should decrease indentation
 */
function isEndStatement(line: string): boolean {
  return /^\s*(End\s+(Sub|Function|If|Property|With|Type|Select|Enum)|Next(\s+\w+)?|Loop|Wend)\b/i.test(
    line
  );
}

/**
 * Check if line contains a statement that should increase indentation
 */
function isStartStatement(line: string): boolean {
  if (/^\s*(Sub|Function|Property\s+(Get|Let|Set))\b/i.test(line)) {
    return true;
  }

  if (
    /^\s*If\s+.*\s+Then\s*(?!.*\s+End\s+If)/i.test(line) &&
    !/^\s*If\s+.*\s+Then\s*.*\s+Else\s*/i.test(line)
  ) {
    return true;
  }

  if (
    /^\s*(For\s+|Do\s+While\s+|Do\s+Until\s+|Do\s*$|With\s+|Select\s+Case\s+|Type\s+|Enum\s+)\b/i.test(
      line
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Check if a block statement is complete in a single line (e.g., If...Then...End If)
 */
function isCompleteBlockInOneLine(line: string): boolean {
  return /^\s*If\s+.*\s+Then\s+.*\s+End\s+If\b/i.test(line);
}

/**
 * Capitalize VB6 keywords in code
 */
function capitalizeKeywords(lines: string[], keywords: string[]): string[] {
  // Create a regex pattern that matches whole words only
  const keywordRegex = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'gi');

  return lines.map(line => {
    // Skip comment lines
    if (line.trim().startsWith("'")) {
      return line;
    }

    // Replace keywords with capitalized versions
    return line.replace(keywordRegex, match => {
      // Find the actual keyword regardless of case
      const keyword = keywords.find(k => k.toLowerCase() === match.toLowerCase());
      return keyword || match; // Return the properly cased keyword
    });
  });
}

/**
 * Add space after keywords where appropriate
 */
function addSpaceAfterKeywords(lines: string[], keywords: string[]): string[] {
  // We only want to add spaces after certain keywords that should have space
  const keywordsRequiringSpace = keywords.filter(
    k => !['As', 'To', 'Is', 'New', 'Nothing', 'Then', 'And', 'Or', 'Not', 'Xor'].includes(k)
  );

  // Create a regex that matches keywords not followed by a space or line end
  const keywordRegex = new RegExp(
    '\\b(' + keywordsRequiringSpace.join('|') + ')\\b(?![ \\t\\r\\n])',
    'g'
  );

  return lines.map(line => {
    // Skip comment lines
    if (line.trim().startsWith("'")) {
      return line;
    }

    return line.replace(keywordRegex, '$1 ');
  });
}

/**
 * Align variable declarations for better readability
 */
function alignDeclarations(lines: string[]): string[] {
  // Find all declaration lines
  const declarationLines: number[] = [];
  const dimPositions: number[] = [];
  const asPositions: number[] = [];

  lines.forEach((line, index) => {
    // Check if line contains a variable declaration
    if (/^\s*(Dim|Private|Public|Static|Const)\s+\w+\s+As\s+/i.test(line)) {
      declarationLines.push(index);

      // Find positions of 'Dim' and 'As' keywords
      const dimMatch = line.match(/^\s*(Dim|Private|Public|Static|Const)/i);
      const asMatch = line.match(/\bAs\b/i);

      if (dimMatch && asMatch) {
        dimPositions.push(dimMatch.index! + dimMatch[0].length);
        asPositions.push(asMatch.index!);
      }
    }
  });

  // No declarations found or only one (no need to align)
  if (declarationLines.length <= 1) {
    return lines;
  }

  // Find the maximum positions for alignment
  // BUFFER OVERFLOW FIX: Avoid spread operator with large arrays that could cause stack overflow
  const maxDimPos = dimPositions.length > 0 ? dimPositions.reduce((max, pos) => Math.max(max, pos), 0) : 0;
  const maxAsPos = asPositions.length > 0 ? asPositions.reduce((max, pos) => Math.max(max, pos), 0) : 0;

  // Apply alignment to declaration lines
  declarationLines.forEach((lineIndex, i) => {
    const line = lines[lineIndex];
    const dimPos = dimPositions[i];
    const asPos = asPositions[i];

    // Split the line at these positions
    const dimPart = line.substring(0, dimPos);
    const variablePart = line.substring(dimPos, asPos).trimRight();
    const asPart = line.substring(asPos);

    // Rebuild with proper spacing
    const dimPadding = ' '.repeat(Math.max(0, maxDimPos - dimPos));
    const varPadding = ' '.repeat(Math.max(0, maxAsPos - dimPos - variablePart.length));

    lines[lineIndex] = dimPart + dimPadding + variablePart + varPadding + asPart;
  });

  return lines;
}

/**
 * Align inline comments for better readability
 */
function alignComments(lines: string[]): string[] {
  // Find all lines with inline comments (not full-line comments)
  const commentLines: number[] = [];
  const codeEndPositions: number[] = [];

  lines.forEach((line, index) => {
    // Find position of inline comment
    const commentMatch = line.match(/(?<!')(?<!\S')\s*'(?!\s*@VB)/);
    if (commentMatch && commentMatch.index! > 0) {
      commentLines.push(index);
      codeEndPositions.push(commentMatch.index!);
    }
  });

  // No inline comments found or only one (no need to align)
  if (commentLines.length <= 1) {
    return lines;
  }

  // Find the maximum position for alignment
  // BUFFER OVERFLOW FIX: Avoid spread operator with large arrays that could cause stack overflow\n  const maxCodeEndPos = codeEndPositions.length > 0 ? \n    codeEndPositions.reduce((max, pos) => Math.max(max, pos), 0) : 0;

  // Apply alignment to comment lines
  commentLines.forEach((lineIndex, i) => {
    const line = lines[lineIndex];
    const commentPos = codeEndPositions[i];

    // Split the line at the comment position
    const codePart = line.substring(0, commentPos).trimRight();
    const commentPart = line.substring(commentPos);

    // Rebuild with proper spacing
    const padding = ' '.repeat(Math.max(0, maxCodeEndPos - codePart.length));
    lines[lineIndex] = codePart + padding + commentPart;
  });

  return lines;
}

/**
 * Align line continuations (_) for better readability
 */
function alignLineContinuations(lines: string[], options: FormattingOptions): string[] {
  // Find all lines with line continuations
  const continuationLines: number[] = [];

  lines.forEach((line, index) => {
    if (line.trim().endsWith('_')) {
      continuationLines.push(index);
    }
  });

  // Process continuation lines
  for (let i = 0; i < continuationLines.length; i++) {
    const lineIndex = continuationLines[i];
    const nextLineIndex = lineIndex + 1;

    if (nextLineIndex < lines.length) {
      // Determine the base indentation of the current line
      const baseIndentMatch = lines[lineIndex].match(/^\s*/);
      const baseIndent = baseIndentMatch ? baseIndentMatch[0] : '';

      // Apply continuation indentation to the next line
      const indentChar = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
      lines[nextLineIndex] = baseIndent + indentChar + lines[nextLineIndex].trim();
    }
  }

  return lines;
}

/**
 * Sort and group import statements
 */
function sortImportStatements(lines: string[]): string[] {
  // Identify import statements (references in VB6)
  const importLines: number[] = [];
  const imports: string[] = [];

  lines.forEach((line, index) => {
    // Basic detection - would need refinement for real VB6 references
    if (/^\s*'?\s*Reference\s*=.*$/i.test(line)) {
      importLines.push(index);
      imports.push(line.trim());
    }
  });

  // No imports or only one (no need to sort)
  if (importLines.length <= 1) {
    return lines;
  }

  // Sort imports
  const sortedImports = [...imports].sort();

  // Replace the original lines with sorted ones
  importLines.forEach((lineIndex, i) => {
    lines[lineIndex] = sortedImports[i];
  });

  return lines;
}
