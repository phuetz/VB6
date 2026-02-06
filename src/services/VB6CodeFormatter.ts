import { EventEmitter } from 'events';

// Formatter Options
export interface VB6FormatterOptions {
  // Indentation
  indentStyle: 'spaces' | 'tabs';
  indentSize: number;

  // Spacing
  spacingAroundOperators: boolean;
  spacingAfterComma: boolean;
  spacingAfterColon: boolean;
  spacingInsideParentheses: boolean;
  spacingInsideBrackets: boolean;

  // Line breaks
  maxLineLength: number;
  breakLongLines: boolean;
  blankLinesBetweenProcedures: number;
  blankLinesAfterDeclarations: number;

  // Alignment
  alignDeclarations: boolean;
  alignAssignments: boolean;
  alignComments: boolean;

  // Casing
  keywordCasing: 'upper' | 'lower' | 'proper' | 'preserve';
  procedureCasing: 'preserve' | 'proper' | 'camel' | 'pascal';
  variableCasing: 'preserve' | 'camel' | 'pascal' | 'hungarian';

  // Comments
  convertRemToApostrophe: boolean;
  alignTrailingComments: boolean;
  commentColumn: number;

  // Other
  removeTrailingWhitespace: boolean;
  ensureFinalNewline: boolean;
  sortProcedures: boolean;
  groupByType: boolean;
}

// Default formatter options
export const DEFAULT_FORMATTER_OPTIONS: VB6FormatterOptions = {
  indentStyle: 'spaces',
  indentSize: 4,
  spacingAroundOperators: true,
  spacingAfterComma: true,
  spacingAfterColon: true,
  spacingInsideParentheses: false,
  spacingInsideBrackets: false,
  maxLineLength: 120,
  breakLongLines: true,
  blankLinesBetweenProcedures: 1,
  blankLinesAfterDeclarations: 1,
  alignDeclarations: true,
  alignAssignments: false,
  alignComments: true,
  keywordCasing: 'proper',
  procedureCasing: 'preserve',
  variableCasing: 'preserve',
  convertRemToApostrophe: true,
  alignTrailingComments: true,
  commentColumn: 40,
  removeTrailingWhitespace: true,
  ensureFinalNewline: true,
  sortProcedures: false,
  groupByType: false,
};

// VB6 Keywords
const VB6_KEYWORDS = [
  'And',
  'As',
  'Boolean',
  'ByRef',
  'Byte',
  'ByVal',
  'Call',
  'Case',
  'Class',
  'Const',
  'Currency',
  'Debug',
  'Dim',
  'Do',
  'Double',
  'Each',
  'Else',
  'ElseIf',
  'Empty',
  'End',
  'Enum',
  'Erase',
  'Error',
  'Event',
  'Exit',
  'False',
  'For',
  'Friend',
  'Function',
  'Get',
  'GoSub',
  'Goto',
  'If',
  'Implements',
  'In',
  'Integer',
  'Is',
  'Let',
  'Like',
  'Long',
  'Loop',
  'Me',
  'Mod',
  'New',
  'Next',
  'Not',
  'Nothing',
  'Null',
  'On',
  'Option',
  'Optional',
  'Or',
  'ParamArray',
  'Preserve',
  'Private',
  'Property',
  'Public',
  'RaiseEvent',
  'ReDim',
  'Rem',
  'Resume',
  'Return',
  'Select',
  'Set',
  'Single',
  'Static',
  'Step',
  'Stop',
  'String',
  'Sub',
  'Then',
  'To',
  'True',
  'Type',
  'TypeOf',
  'Until',
  'Variant',
  'Wend',
  'While',
  'With',
  'Xor',
];

// Block start keywords
const BLOCK_START_KEYWORDS = [
  'Sub',
  'Function',
  'Property',
  'If',
  'Select',
  'For',
  'Do',
  'While',
  'With',
  'Type',
  'Enum',
];

// Block end keywords
const BLOCK_END_KEYWORDS = [
  'End Sub',
  'End Function',
  'End Property',
  'End If',
  'End Select',
  'Next',
  'Loop',
  'Wend',
  'End With',
  'End Type',
  'End Enum',
];

// Code Line Type
enum LineType {
  Empty,
  Comment,
  Declaration,
  Assignment,
  ControlFlow,
  ProcedureStart,
  ProcedureEnd,
  Label,
  Other,
}

// Code Line
interface CodeLine {
  text: string;
  type: LineType;
  indent: number;
  hasTrailingComment: boolean;
  trailingComment?: string;
  originalLineNumber: number;
}

export class VB6CodeFormatter extends EventEmitter {
  private static instance: VB6CodeFormatter;
  private options: VB6FormatterOptions;

  constructor(options: Partial<VB6FormatterOptions> = {}) {
    super();
    this.options = { ...DEFAULT_FORMATTER_OPTIONS, ...options };
  }

  public static getInstance(options?: Partial<VB6FormatterOptions>): VB6CodeFormatter {
    if (!VB6CodeFormatter.instance) {
      VB6CodeFormatter.instance = new VB6CodeFormatter(options);
    } else if (options) {
      VB6CodeFormatter.instance.updateOptions(options);
    }
    return VB6CodeFormatter.instance;
  }

  public updateOptions(options: Partial<VB6FormatterOptions>): void {
    this.options = { ...this.options, ...options };
    this.emit('optionsUpdated', this.options);
  }

  public formatCode(code: string): string {
    try {
      const lines = this.parseCode(code);
      const formattedLines = this.applyFormatting(lines);
      const result = this.assembleCode(formattedLines);

      this.emit('formatCompleted', { original: code, formatted: result });
      return result;
    } catch (error) {
      this.emit('formatError', error);
      throw error;
    }
  }

  private parseCode(code: string): CodeLine[] {
    const rawLines = code.split(/\r?\n/);
    const parsedLines: CodeLine[] = [];
    let currentIndent = 0;

    rawLines.forEach((line, index) => {
      const trimmed = line.trim();

      // Handle empty lines
      if (!trimmed) {
        parsedLines.push({
          text: '',
          type: LineType.Empty,
          indent: 0,
          hasTrailingComment: false,
          originalLineNumber: index + 1,
        });
        return;
      }

      // Extract trailing comment
      let mainCode = trimmed;
      let trailingComment: string | undefined;
      const commentMatch = this.extractTrailingComment(trimmed);
      if (commentMatch) {
        mainCode = commentMatch.code;
        trailingComment = commentMatch.comment;
      }

      // Determine line type
      const lineType = this.getLineType(mainCode);

      // Calculate indentation
      if (this.isBlockEnd(mainCode)) {
        currentIndent = Math.max(0, currentIndent - 1);
      }

      parsedLines.push({
        text: mainCode,
        type: lineType,
        indent: currentIndent,
        hasTrailingComment: !!trailingComment,
        trailingComment,
        originalLineNumber: index + 1,
      });

      // Adjust indent for next line
      if (this.isBlockStart(mainCode)) {
        currentIndent++;
      } else if (mainCode.toLowerCase() === 'else' || mainCode.toLowerCase() === 'elseif') {
        // Temporarily dedent for Else/ElseIf
        if (parsedLines.length > 0) {
          parsedLines[parsedLines.length - 1].indent = Math.max(0, currentIndent - 1);
        }
      }
    });

    return parsedLines;
  }

  private extractTrailingComment(line: string): { code: string; comment: string } | null {
    // Look for apostrophe comment not inside quotes
    let inString = false;
    let commentStart = -1;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inString = !inString;
      } else if (!inString && char === "'") {
        commentStart = i;
        break;
      }
    }

    if (commentStart >= 0) {
      return {
        code: line.substring(0, commentStart).trim(),
        comment: line.substring(commentStart).trim(),
      };
    }

    // Check for REM comment
    const remMatch = line.match(/^(.*?)\s+(REM\s+.*)$/i);
    if (remMatch) {
      return {
        code: remMatch[1].trim(),
        comment: remMatch[2].trim(),
      };
    }

    return null;
  }

  private getLineType(line: string): LineType {
    const lower = line.toLowerCase();

    if (lower.startsWith("'") || lower.startsWith('rem ')) {
      return LineType.Comment;
    }

    if (lower.endsWith(':')) {
      return LineType.Label;
    }

    if (
      lower.startsWith('dim ') ||
      lower.startsWith('private ') ||
      lower.startsWith('public ') ||
      lower.startsWith('const ') ||
      lower.startsWith('static ') ||
      lower.startsWith('global ')
    ) {
      return LineType.Declaration;
    }

    if (
      lower.startsWith('sub ') ||
      lower.startsWith('function ') ||
      lower.startsWith('property ')
    ) {
      return LineType.ProcedureStart;
    }

    if (
      lower.startsWith('end sub') ||
      lower.startsWith('end function') ||
      lower.startsWith('end property')
    ) {
      return LineType.ProcedureEnd;
    }

    if (
      lower.startsWith('if ') ||
      lower.startsWith('select ') ||
      lower.startsWith('for ') ||
      lower.startsWith('do ') ||
      lower.startsWith('while ') ||
      lower.startsWith('with ')
    ) {
      return LineType.ControlFlow;
    }

    if (line.includes('=') && !line.includes('==')) {
      return LineType.Assignment;
    }

    return LineType.Other;
  }

  private isBlockStart(line: string): boolean {
    const lower = line.toLowerCase();
    return BLOCK_START_KEYWORDS.some(
      keyword => lower.startsWith(keyword.toLowerCase() + ' ') || lower === keyword.toLowerCase()
    );
  }

  private isBlockEnd(line: string): boolean {
    const lower = line.toLowerCase();
    return BLOCK_END_KEYWORDS.some(
      keyword => lower.startsWith(keyword.toLowerCase()) || lower === keyword.toLowerCase()
    );
  }

  private applyFormatting(lines: CodeLine[]): CodeLine[] {
    let formattedLines = [...lines];

    // Apply casing
    formattedLines = this.applyCasing(formattedLines);

    // Apply spacing
    formattedLines = this.applySpacing(formattedLines);

    // Apply alignment
    if (this.options.alignDeclarations || this.options.alignAssignments) {
      formattedLines = this.applyAlignment(formattedLines);
    }

    // Convert REM to apostrophe if requested
    if (this.options.convertRemToApostrophe) {
      formattedLines = this.convertRemComments(formattedLines);
    }

    // Sort procedures if requested
    if (this.options.sortProcedures) {
      formattedLines = this.sortProcedures(formattedLines);
    }

    // Group by type if requested
    if (this.options.groupByType) {
      formattedLines = this.groupByType(formattedLines);
    }

    return formattedLines;
  }

  private applyCasing(lines: CodeLine[]): CodeLine[] {
    return lines.map(line => {
      if (line.type === LineType.Empty || line.type === LineType.Comment) {
        return line;
      }

      let text = line.text;

      // Apply keyword casing
      if (this.options.keywordCasing !== 'preserve') {
        text = this.applyKeywordCasing(text);
      }

      // Apply procedure casing
      if (this.options.procedureCasing !== 'preserve' && line.type === LineType.ProcedureStart) {
        text = this.applyProcedureCasing(text);
      }

      return { ...line, text };
    });
  }

  private applyKeywordCasing(text: string): string {
    let result = text;

    VB6_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, match => {
        switch (this.options.keywordCasing) {
          case 'upper':
            return match.toUpperCase();
          case 'lower':
            return match.toLowerCase();
          case 'proper':
            return keyword; // Use the properly cased keyword from our list
          default:
            return match;
        }
      });
    });

    return result;
  }

  private applyProcedureCasing(text: string): string {
    const match = text.match(/^(Sub|Function|Property\s+\w+)\s+(\w+)/i);
    if (!match) return text;

    const [, prefix, name] = match;
    let formattedName = name;

    switch (this.options.procedureCasing) {
      case 'proper':
        formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      case 'camel':
        formattedName = name.charAt(0).toLowerCase() + name.slice(1);
        break;
      case 'pascal':
        formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        break;
    }

    return text.replace(name, formattedName);
  }

  private applySpacing(lines: CodeLine[]): CodeLine[] {
    return lines.map(line => {
      if (line.type === LineType.Empty || line.type === LineType.Comment) {
        return line;
      }

      let text = line.text;

      // Spacing around operators
      if (this.options.spacingAroundOperators) {
        text = text.replace(/([+-*/<>=&])/g, ' $1 ');
        text = text.replace(/\s+/g, ' '); // Clean up multiple spaces
      }

      // Spacing after comma
      if (this.options.spacingAfterComma) {
        text = text.replace(/,(?!\s)/g, ', ');
      }

      // Spacing after colon
      if (this.options.spacingAfterColon) {
        text = text.replace(/:(?!\s)/g, ': ');
      }

      // Spacing inside parentheses
      if (this.options.spacingInsideParentheses) {
        text = text.replace(/\((?!\s)/g, '( ');
        text = text.replace(/(?<!\s)\)/g, ' )');
      }

      // Spacing inside brackets
      if (this.options.spacingInsideBrackets) {
        text = text.replace(/\[(?!\s)/g, '[ ');
        text = text.replace(/(?<!\s)\]/g, ' ]');
      }

      return { ...line, text: text.trim() };
    });
  }

  private applyAlignment(lines: CodeLine[]): CodeLine[] {
    const groups = this.groupConsecutiveLines(lines);

    return groups.flatMap(group => {
      if (group.length <= 1) return group;

      // Align declarations
      if (this.options.alignDeclarations && group.every(l => l.type === LineType.Declaration)) {
        return this.alignGroup(group, /^(\w+\s+)(\w+)(\s*)(.*)/);
      }

      // Align assignments
      if (this.options.alignAssignments && group.every(l => l.type === LineType.Assignment)) {
        return this.alignGroup(group, /^([^=]+)(=)(.*)/);
      }

      return group;
    });
  }

  private groupConsecutiveLines(lines: CodeLine[]): CodeLine[][] {
    const groups: CodeLine[][] = [];
    let currentGroup: CodeLine[] = [];
    let lastType: LineType | null = null;

    lines.forEach(line => {
      if (line.type === lastType && line.type !== LineType.Empty) {
        currentGroup.push(line);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [line];
        lastType = line.type;
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private alignGroup(group: CodeLine[], pattern: RegExp): CodeLine[] {
    const matches = group.map(line => line.text.match(pattern));
    if (matches.some(m => !m)) return group;

    const maxLengths = matches.reduce((acc, match) => {
      if (!match) return acc;
      return match.slice(1).map((part, i) => Math.max(acc[i] || 0, part.trim().length));
    }, [] as number[]);

    return group.map((line, i) => {
      const match = matches[i];
      if (!match) return line;

      const aligned = match
        .slice(1)
        .map((part, j) => {
          if (j === match.length - 2) return part; // Don't pad the last part
          return part.trim().padEnd(maxLengths[j]);
        })
        .join(' ');

      return { ...line, text: aligned.trim() };
    });
  }

  private convertRemComments(lines: CodeLine[]): CodeLine[] {
    return lines.map(line => {
      let text = line.text;
      if (line.type === LineType.Comment && text.toLowerCase().startsWith('rem ')) {
        text = "'" + text.substring(4);
      }

      if (line.trailingComment && line.trailingComment.toLowerCase().startsWith('rem ')) {
        line.trailingComment = "'" + line.trailingComment.substring(4);
      }

      return { ...line, text };
    });
  }

  private sortProcedures(lines: CodeLine[]): CodeLine[] {
    const procedures: Array<{ start: number; end: number; name: string; lines: CodeLine[] }> = [];
    let currentProc: { start: number; name: string } | null = null;

    lines.forEach((line, index) => {
      if (line.type === LineType.ProcedureStart) {
        currentProc = { start: index, name: this.extractProcedureName(line.text) };
      } else if (line.type === LineType.ProcedureEnd && currentProc) {
        procedures.push({
          start: currentProc.start,
          end: index,
          name: currentProc.name,
          lines: lines.slice(currentProc.start, index + 1),
        });
        currentProc = null;
      }
    });

    // Sort procedures by name
    procedures.sort((a, b) => a.name.localeCompare(b.name));

    // Reconstruct the code
    const result: CodeLine[] = [];
    let lastEnd = 0;

    // Add declarations and other code before procedures
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].type !== LineType.ProcedureStart) {
        result.push(lines[i]);
      } else {
        break;
      }
      lastEnd = i + 1;
    }

    // Add sorted procedures
    procedures.forEach((proc, index) => {
      if (index > 0 && this.options.blankLinesBetweenProcedures > 0) {
        for (let i = 0; i < this.options.blankLinesBetweenProcedures; i++) {
          result.push({
            text: '',
            type: LineType.Empty,
            indent: 0,
            hasTrailingComment: false,
            originalLineNumber: -1,
          });
        }
      }
      result.push(...proc.lines);
    });

    return result;
  }

  private extractProcedureName(text: string): string {
    const match = text.match(/^(?:Sub|Function|Property\s+\w+)\s+(\w+)/i);
    return match ? match[1] : '';
  }

  private groupByType(lines: CodeLine[]): CodeLine[] {
    const groups: { [key: string]: CodeLine[] } = {
      options: [],
      declarations: [],
      types: [],
      procedures: [],
      other: [],
    };

    let currentGroup: CodeLine[] | null = null;

    lines.forEach(line => {
      if (line.text.toLowerCase().startsWith('option ')) {
        groups.options.push(line);
      } else if (line.type === LineType.Declaration) {
        groups.declarations.push(line);
      } else if (
        line.text.toLowerCase().startsWith('type ') ||
        line.text.toLowerCase().startsWith('enum ')
      ) {
        currentGroup = groups.types;
        currentGroup.push(line);
      } else if (line.type === LineType.ProcedureStart) {
        currentGroup = groups.procedures;
        currentGroup.push(line);
      } else if (currentGroup) {
        currentGroup.push(line);
        if (
          line.type === LineType.ProcedureEnd ||
          line.text.toLowerCase().startsWith('end type') ||
          line.text.toLowerCase().startsWith('end enum')
        ) {
          currentGroup = null;
        }
      } else {
        groups.other.push(line);
      }
    });

    // Reconstruct in order
    const result: CodeLine[] = [];

    // Add groups in order
    const order = ['options', 'declarations', 'types', 'procedures', 'other'];
    let lastGroupHadContent = false;

    order.forEach(groupName => {
      const group = groups[groupName];
      if (group.length > 0) {
        if (lastGroupHadContent && this.options.blankLinesAfterDeclarations > 0) {
          for (let i = 0; i < this.options.blankLinesAfterDeclarations; i++) {
            result.push({
              text: '',
              type: LineType.Empty,
              indent: 0,
              hasTrailingComment: false,
              originalLineNumber: -1,
            });
          }
        }
        result.push(...group);
        lastGroupHadContent = true;
      }
    });

    return result;
  }

  private assembleCode(lines: CodeLine[]): string {
    const indentChar = this.options.indentStyle === 'tabs' ? '\t' : ' ';
    const indentString = indentChar.repeat(this.options.indentSize);

    const assembledLines = lines.map(line => {
      if (line.type === LineType.Empty) {
        return '';
      }

      const indent = indentString.repeat(line.indent);
      let fullLine = indent + line.text;

      // Add trailing comment
      if (line.hasTrailingComment && line.trailingComment) {
        if (this.options.alignTrailingComments) {
          const padding = Math.max(1, this.options.commentColumn - fullLine.length);
          fullLine += ' '.repeat(padding) + line.trailingComment;
        } else {
          fullLine += '  ' + line.trailingComment;
        }
      }

      // Remove trailing whitespace
      if (this.options.removeTrailingWhitespace) {
        fullLine = fullLine.trimEnd();
      }

      return fullLine;
    });

    let result = assembledLines.join('\n');

    // Ensure final newline
    if (this.options.ensureFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }

    return result;
  }

  public formatSelection(code: string, startLine: number, endLine: number): string {
    const lines = code.split(/\r?\n/);
    const beforeSelection = lines.slice(0, startLine - 1);
    const selection = lines.slice(startLine - 1, endLine);
    const afterSelection = lines.slice(endLine);

    // Format only the selection
    const formattedSelection = this.formatCode(selection.join('\n')).split(/\r?\n/);

    // Reassemble
    return [...beforeSelection, ...formattedSelection, ...afterSelection].join('\n');
  }

  public getFormattingDiagnostics(
    code: string
  ): Array<{ line: number; message: string; severity: 'info' | 'warning' | 'error' }> {
    const diagnostics: Array<{
      line: number;
      message: string;
      severity: 'info' | 'warning' | 'error';
    }> = [];
    const lines = code.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check line length
      if (line.length > this.options.maxLineLength) {
        diagnostics.push({
          line: lineNum,
          message: `Line exceeds maximum length of ${this.options.maxLineLength} characters`,
          severity: 'warning',
        });
      }

      // Check for tabs vs spaces
      if (this.options.indentStyle === 'spaces' && line.includes('\t')) {
        diagnostics.push({
          line: lineNum,
          message: 'Line contains tabs but spaces are configured',
          severity: 'warning',
        });
      } else if (this.options.indentStyle === 'tabs' && /^ +/.test(line)) {
        diagnostics.push({
          line: lineNum,
          message: 'Line contains spaces for indentation but tabs are configured',
          severity: 'warning',
        });
      }

      // Check for trailing whitespace
      if (/\s+$/.test(line)) {
        diagnostics.push({
          line: lineNum,
          message: 'Line has trailing whitespace',
          severity: 'info',
        });
      }

      // Check for multiple consecutive blank lines
      if (index > 0 && !line.trim() && !lines[index - 1].trim()) {
        diagnostics.push({
          line: lineNum,
          message: 'Multiple consecutive blank lines',
          severity: 'info',
        });
      }
    });

    return diagnostics;
  }
}

export default VB6CodeFormatter;
