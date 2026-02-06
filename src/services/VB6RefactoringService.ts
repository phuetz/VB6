/**
 * VB6 Refactoring Service
 *
 * Provides automated code refactoring capabilities
 */

import * as monaco from 'monaco-editor';
import { parseVB6Module } from '../utils/vb6Parser';
import { analyzeVBSemantics, SemanticIssue } from '../utils/vb6SemanticAnalyzer';

export interface RefactoringAction {
  id: string;
  title: string;
  description: string;
  kind: string;
  apply: () => monaco.editor.IIdentifiedSingleEditOperation[];
}

export interface RenameInfo {
  oldName: string;
  newName: string;
  locations: Array<{
    uri: string;
    range: monaco.Range;
  }>;
}

export interface ExtractMethodInfo {
  code: string;
  parameters: Array<{
    name: string;
    type: string;
    byRef: boolean;
  }>;
  returnType?: string;
  methodName: string;
  startLine: number;
  endLine: number;
}

export class VB6RefactoringService {
  constructor() {
    // Service uses functional APIs
  }

  /**
   * Get available refactoring actions for current selection
   */
  getRefactoringActions(
    model: monaco.editor.ITextModel,
    selection: monaco.Selection
  ): RefactoringAction[] {
    const actions: RefactoringAction[] = [];
    const selectedText = model.getValueInRange(selection);
    const wordAtPosition = selection.isEmpty()
      ? model.getWordAtPosition(selection.getPosition())
      : null;

    // Rename Symbol
    if (wordAtPosition) {
      actions.push({
        id: 'rename',
        title: 'Rename Symbol',
        description: `Rename '${wordAtPosition.word}' and all its references`,
        kind: 'refactor.rename',
        apply: () => [],
      });
    }

    // Extract Method
    if (!selection.isEmpty() && selection.endLineNumber > selection.startLineNumber) {
      actions.push({
        id: 'extractMethod',
        title: 'Extract Method',
        description: 'Extract selected code into a new method',
        kind: 'refactor.extract.method',
        apply: () => this.extractMethod(model, selection),
      });
    }

    // Extract Variable
    if (!selection.isEmpty() && selectedText && !selectedText.includes('\n')) {
      actions.push({
        id: 'extractVariable',
        title: 'Extract Variable',
        description: 'Extract expression into a new variable',
        kind: 'refactor.extract.variable',
        apply: () => this.extractVariable(model, selection),
      });
    }

    // Inline Variable
    if (wordAtPosition && this.isVariable(model, selection.getPosition())) {
      actions.push({
        id: 'inlineVariable',
        title: 'Inline Variable',
        description: `Inline all occurrences of '${wordAtPosition.word}'`,
        kind: 'refactor.inline',
        apply: () => this.inlineVariable(model, selection.getPosition()),
      });
    }

    // Convert to Property
    if (this.isPublicVariable(model, selection.getPosition())) {
      actions.push({
        id: 'convertToProperty',
        title: 'Convert to Property',
        description: 'Convert public variable to property procedures',
        kind: 'refactor.convert',
        apply: () => this.convertToProperty(model, selection.getPosition()),
      });
    }

    // Add Error Handling
    if (this.isInsideProcedure(model, selection.getPosition())) {
      actions.push({
        id: 'addErrorHandling',
        title: 'Add Error Handling',
        description: 'Add error handling to current procedure',
        kind: 'refactor.add',
        apply: () => this.addErrorHandling(model, selection.getPosition()),
      });
    }

    // Optimize Imports
    actions.push({
      id: 'optimizeImports',
      title: 'Optimize Imports',
      description: 'Remove unused imports and sort remaining',
      kind: 'source.organizeImports',
      apply: () => this.optimizeImports(model),
    });

    return actions;
  }

  /**
   * Rename symbol and all references
   */
  async renameSymbol(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    newName: string
  ): Promise<monaco.editor.IIdentifiedSingleEditOperation[]> {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo) return [];

    const oldName = wordInfo.word;
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Find all references
    const references = await this.findAllReferences(model, oldName);

    // Create edits for each reference
    references.forEach((ref, index) => {
      edits.push({
        range: ref.range,
        text: newName,
        forceMoveMarkers: true,
      });
    });

    return edits;
  }

  /**
   * Extract selected code into a method
   */
  private extractMethod(
    model: monaco.editor.ITextModel,
    selection: monaco.Selection
  ): monaco.editor.IIdentifiedSingleEditOperation[] {
    const selectedCode = model.getValueInRange(selection);
    const methodInfo = this.analyzeCodeForExtraction(selectedCode);

    // Generate method signature
    const params = methodInfo.parameters
      .map(p => `${p.byRef ? 'ByRef' : 'ByVal'} ${p.name} As ${p.type}`)
      .join(', ');

    const methodSignature = methodInfo.returnType
      ? `Private Function ${methodInfo.methodName}(${params}) As ${methodInfo.returnType}`
      : `Private Sub ${methodInfo.methodName}(${params})`;

    // Generate method body
    const methodBody = [
      methodSignature,
      `    ' Extracted from lines ${selection.startLineNumber}-${selection.endLineNumber}`,
      ...selectedCode.split('\n').map(line => `    ${line}`),
      methodInfo.returnType ? 'End Function' : 'End Sub',
    ].join('\n');

    // Generate method call
    const args = methodInfo.parameters.map(p => p.name).join(', ');
    const methodCall = methodInfo.returnType
      ? `result = ${methodInfo.methodName}(${args})`
      : `${methodInfo.methodName} ${args}`;

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Replace selection with method call
    edits.push({
      range: selection,
      text: methodCall,
      forceMoveMarkers: true,
    });

    // Add method at end of current module
    const lastLine = model.getLineCount();
    edits.push({
      range: new monaco.Range(lastLine, 1, lastLine, 1),
      text: '\n\n' + methodBody,
      forceMoveMarkers: true,
    });

    return edits;
  }

  /**
   * Extract expression into a variable
   */
  private extractVariable(
    model: monaco.editor.ITextModel,
    selection: monaco.Selection
  ): monaco.editor.IIdentifiedSingleEditOperation[] {
    const expression = model.getValueInRange(selection);
    const varName = this.suggestVariableName(expression);
    const varType = this.inferType(expression);

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Find the start of the current statement
    const currentLine = selection.startLineNumber;
    let insertLine = currentLine;

    // Look for the beginning of the current procedure
    for (let i = currentLine - 1; i >= 1; i--) {
      const lineContent = model.getLineContent(i).trim();
      if (lineContent.match(/^(Dim|Private|Public|Const)/i)) {
        insertLine = i + 1;
        break;
      }
      if (lineContent.match(/^(Sub|Function|Property)/i)) {
        insertLine = i + 1;
        break;
      }
    }

    // Add variable declaration
    edits.push({
      range: new monaco.Range(insertLine, 1, insertLine, 1),
      text: `    Dim ${varName} As ${varType}\n    ${varName} = ${expression}\n`,
      forceMoveMarkers: true,
    });

    // Replace expression with variable
    edits.push({
      range: selection,
      text: varName,
      forceMoveMarkers: true,
    });

    return edits;
  }

  /**
   * Inline variable occurrences
   */
  private inlineVariable(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.editor.IIdentifiedSingleEditOperation[] {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo) return [];

    const varName = wordInfo.word;
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Find variable declaration and its value
    const declarationInfo = this.findVariableDeclaration(model, varName);
    if (!declarationInfo) return [];

    // Find all uses of the variable
    const uses = this.findVariableUses(model, varName);

    // Replace each use with the value
    uses.forEach(use => {
      edits.push({
        range: use.range,
        text: declarationInfo.value,
        forceMoveMarkers: true,
      });
    });

    // Remove the declaration
    edits.push({
      range: declarationInfo.range,
      text: '',
      forceMoveMarkers: true,
    });

    return edits;
  }

  /**
   * Convert public variable to property
   */
  private convertToProperty(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.editor.IIdentifiedSingleEditOperation[] {
    const lineContent = model.getLineContent(position.lineNumber);
    const match = lineContent.match(/Public\s+(\w+)\s+As\s+(\w+)/i);

    if (!match) return [];

    const varName = match[1];
    const varType = match[2];
    const privateName = `m_${varName}`;

    // Generate property procedures
    const propertyCode = [
      `Private ${privateName} As ${varType}`,
      '',
      `Public Property Get ${varName}() As ${varType}`,
      `    ${varName} = ${privateName}`,
      `End Property`,
      '',
      `Public Property Let ${varName}(ByVal Value As ${varType})`,
      `    ${privateName} = Value`,
      `End Property`,
    ].join('\n');

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Replace public variable with property
    edits.push({
      range: new monaco.Range(position.lineNumber, 1, position.lineNumber + 1, 1),
      text: propertyCode + '\n',
      forceMoveMarkers: true,
    });

    return edits;
  }

  /**
   * Add error handling to procedure
   */
  private addErrorHandling(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.editor.IIdentifiedSingleEditOperation[] {
    const procedureInfo = this.findProcedure(model, position);
    if (!procedureInfo) return [];

    const errorHandler = [
      `    On Error GoTo ${procedureInfo.name}_Error`,
      '',
      `    ' Existing code here`,
      '',
      `    Exit ${procedureInfo.type}`,
      '',
      `${procedureInfo.name}_Error:`,
      `    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical, "${procedureInfo.name}"`,
      `    Resume Next`,
    ];

    // Check if error handling already exists
    const procedureContent = model.getValueInRange(procedureInfo.range);
    if (procedureContent.includes('On Error')) {
      return [];
    }

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Insert error handling at the beginning of the procedure
    const insertLine = procedureInfo.range.startLineNumber + 1;
    edits.push({
      range: new monaco.Range(insertLine, 1, insertLine, 1),
      text: `    On Error GoTo ${procedureInfo.name}_Error\n`,
      forceMoveMarkers: true,
    });

    // Add error handler before End Sub/Function
    const endLine = procedureInfo.range.endLineNumber;
    edits.push({
      range: new monaco.Range(endLine, 1, endLine, 1),
      text: [
        `    Exit ${procedureInfo.type}`,
        '',
        `${procedureInfo.name}_Error:`,
        `    MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical, "${procedureInfo.name}"`,
        `    Resume Next`,
        '',
      ].join('\n'),
      forceMoveMarkers: true,
    });

    return edits;
  }

  /**
   * Optimize imports
   */
  private optimizeImports(
    model: monaco.editor.ITextModel
  ): monaco.editor.IIdentifiedSingleEditOperation[] {
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
    const imports: Array<{ line: number; text: string }> = [];
    const usedTypes = new Set<string>();

    // Collect all imports
    for (let i = 1; i <= model.getLineCount(); i++) {
      const line = model.getLineContent(i);
      const match = line.match(/^(Option\s+Explicit|Imports\s+|References\s+)/i);
      if (match) {
        imports.push({ line: i, text: line });
      }
    }

    // Analyze code to find used types
    const code = model.getValue();
    const ast = this.parser.parse(code);
    this.collectUsedTypes(ast, usedTypes);

    // Sort imports
    imports.sort((a, b) => {
      // Option Explicit first
      if (a.text.startsWith('Option')) return -1;
      if (b.text.startsWith('Option')) return 1;
      return a.text.localeCompare(b.text);
    });

    // Replace imports with sorted version
    if (imports.length > 0) {
      const firstLine = imports[0].line;
      const lastLine = imports[imports.length - 1].line;

      edits.push({
        range: new monaco.Range(firstLine, 1, lastLine + 1, 1),
        text: imports.map(imp => imp.text).join('\n') + '\n',
        forceMoveMarkers: true,
      });
    }

    return edits;
  }

  // Helper methods

  private isVariable(model: monaco.editor.ITextModel, position: monaco.Position): boolean {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo) return false;

    // Simple check - look for Dim/Private/Public declaration
    const text = model.getValue();
    const regex = new RegExp(`\\b(Dim|Private|Public)\\s+${wordInfo.word}\\b`, 'i');
    return regex.test(text);
  }

  private isPublicVariable(model: monaco.editor.ITextModel, position: monaco.Position): boolean {
    const line = model.getLineContent(position.lineNumber);
    return /^Public\s+\w+\s+As\s+\w+/i.test(line.trim());
  }

  private isInsideProcedure(model: monaco.editor.ITextModel, position: monaco.Position): boolean {
    // Look backwards for procedure start
    for (let i = position.lineNumber; i >= 1; i--) {
      const line = model.getLineContent(i).trim();
      if (line.match(/^(Private|Public)?\s*(Sub|Function|Property)/i)) {
        return true;
      }
      if (line.match(/^End\s+(Sub|Function|Property)/i)) {
        return false;
      }
    }
    return false;
  }

  private findProcedure(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): { name: string; type: string; range: monaco.Range } | null {
    let startLine = -1;
    let endLine = -1;
    let name = '';
    let type = '';

    // Find procedure start
    for (let i = position.lineNumber; i >= 1; i--) {
      const line = model.getLineContent(i).trim();
      const match = line.match(/^(?:Private|Public)?\s*(Sub|Function|Property)\s+(\w+)/i);
      if (match) {
        startLine = i;
        type = match[1];
        name = match[2];
        break;
      }
    }

    if (startLine === -1) return null;

    // Find procedure end
    for (let i = startLine + 1; i <= model.getLineCount(); i++) {
      const line = model.getLineContent(i).trim();
      if (line.match(new RegExp(`^End\\s+${type}\\b`, 'i'))) {
        endLine = i;
        break;
      }
    }

    if (endLine === -1) return null;

    return {
      name,
      type,
      range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
    };
  }

  private async findAllReferences(
    model: monaco.editor.ITextModel,
    symbolName: string
  ): Promise<Array<{ uri: string; range: monaco.Range }>> {
    const references: Array<{ uri: string; range: monaco.Range }> = [];
    const regex = new RegExp(`\\b${symbolName}\\b`, 'gi');

    for (let i = 1; i <= model.getLineCount(); i++) {
      const line = model.getLineContent(i);
      let match;

      while ((match = regex.exec(line)) !== null) {
        references.push({
          uri: model.uri.toString(),
          range: new monaco.Range(i, match.index + 1, i, match.index + match[0].length + 1),
        });
      }
    }

    return references;
  }

  private analyzeCodeForExtraction(code: string): ExtractMethodInfo {
    // Analyze variables used in the code
    const variables = new Set<string>();
    const assignments = new Set<string>();

    // Simple regex-based analysis
    const varRegex = /\b([a-zA-Z_]\w*)\b/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      const word = match[1];
      // Skip VB6 keywords
      if (!this.isVB6Keyword(word)) {
        variables.add(word);
      }
    }

    // Check for assignments
    const assignRegex = /\b(\w+)\s*=/g;
    while ((match = assignRegex.exec(code)) !== null) {
      assignments.add(match[1]);
    }

    // Generate parameters
    const parameters = Array.from(variables)
      .filter(v => !assignments.has(v))
      .map(v => ({
        name: v,
        type: 'Variant', // Default type
        byRef: assignments.has(v),
      }));

    // Check if code returns a value
    const hasReturn = code.includes(' = ') && !code.trim().startsWith('Call');

    return {
      code,
      parameters,
      returnType: hasReturn ? 'Variant' : undefined,
      methodName: 'ExtractedMethod',
      startLine: 0,
      endLine: 0,
    };
  }

  private suggestVariableName(expression: string): string {
    // Simple name suggestion based on expression
    if (expression.includes('"')) {
      return 'strTemp';
    } else if (expression.match(/^\d+$/)) {
      return 'intTemp';
    } else if (expression.includes('.')) {
      const parts = expression.split('.');
      return `obj${parts[0]}`;
    }
    return 'varTemp';
  }

  private inferType(expression: string): string {
    // Simple type inference
    if (expression.includes('"')) {
      return 'String';
    } else if (expression.match(/^\d+$/)) {
      return 'Integer';
    } else if (expression.match(/^\d+\.\d+$/)) {
      return 'Double';
    } else if (expression.match(/^(True|False)$/i)) {
      return 'Boolean';
    }
    return 'Variant';
  }

  private findVariableDeclaration(
    model: monaco.editor.ITextModel,
    varName: string
  ): { value: string; range: monaco.Range } | null {
    const regex = new RegExp(`\\b${varName}\\s*=\\s*(.+)`, 'i');

    for (let i = 1; i <= model.getLineCount(); i++) {
      const line = model.getLineContent(i);
      const match = line.match(regex);

      if (match) {
        return {
          value: match[1].trim(),
          range: new monaco.Range(i, 1, i + 1, 1),
        };
      }
    }

    return null;
  }

  private findVariableUses(
    model: monaco.editor.ITextModel,
    varName: string
  ): Array<{ range: monaco.Range }> {
    const uses: Array<{ range: monaco.Range }> = [];
    const regex = new RegExp(`\\b${varName}\\b`, 'gi');

    for (let i = 1; i <= model.getLineCount(); i++) {
      const line = model.getLineContent(i);
      let match;

      while ((match = regex.exec(line)) !== null) {
        // Skip the declaration line
        if (!line.includes(`${varName} =`)) {
          uses.push({
            range: new monaco.Range(i, match.index + 1, i, match.index + match[0].length + 1),
          });
        }
      }
    }

    return uses;
  }

  private collectUsedTypes(ast: any, usedTypes: Set<string>): void {
    // Traverse AST and collect type references
    // This is a simplified version
    if (ast.type === 'VariableDeclaration' && ast.dataType) {
      usedTypes.add(ast.dataType);
    }

    if (ast.children) {
      for (const child of ast.children) {
        this.collectUsedTypes(child, usedTypes);
      }
    }
  }

  private isVB6Keyword(word: string): boolean {
    const keywords = [
      'And',
      'As',
      'Boolean',
      'ByRef',
      'Byte',
      'ByVal',
      'Call',
      'Case',
      'Const',
      'Date',
      'Declare',
      'Dim',
      'Do',
      'Double',
      'Each',
      'Else',
      'ElseIf',
      'End',
      'Enum',
      'Event',
      'Exit',
      'False',
      'For',
      'Function',
      'Get',
      'GoTo',
      'If',
      'Integer',
      'Let',
      'Long',
      'Loop',
      'Me',
      'New',
      'Next',
      'Not',
      'Nothing',
      'Object',
      'On',
      'Option',
      'Or',
      'Private',
      'Property',
      'Public',
      'ReDim',
      'Resume',
      'Return',
      'Select',
      'Set',
      'Single',
      'Static',
      'String',
      'Sub',
      'Then',
      'To',
      'True',
      'Type',
      'Until',
      'Variant',
      'While',
      'With',
    ];

    return keywords.some(k => k.toLowerCase() === word.toLowerCase());
  }
}
