/**
 * VB6 IntelliSense Service
 *
 * Provides advanced code completion, parameter hints, and intelligent suggestions
 */

import * as monaco from 'monaco-editor';
import { Control } from '../types/control';
import { vb6Snippets, VB6Snippet, expandSnippet } from '../data/vb6Snippets';
import { vb6Keywords, vb6Functions, vb6Constants } from '../data/vb6Syntax';

// IntelliSense types
export interface VB6Function {
  name: string;
  signature: string;
  parameters: VB6Parameter[];
  returnType: string;
  description: string;
  example?: string;
  category: string;
}

export interface VB6Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description: string;
}

export interface VB6Property {
  name: string;
  type: string;
  readOnly: boolean;
  description: string;
  values?: string[];
}

export interface VB6Event {
  name: string;
  parameters: VB6Parameter[];
  description: string;
}

export interface VB6Constant {
  name: string;
  value: string | number;
  description: string;
  category: string;
}

export interface VB6Type {
  name: string;
  members: VB6Property[];
  methods: VB6Function[];
  description: string;
}

export class VB6IntelliSenseService {
  private static instance: VB6IntelliSenseService;
  private controls: Control[] = [];
  private userVariables: Map<string, string> = new Map();
  private userFunctions: Map<string, VB6Function> = new Map();
  private userTypes: Map<string, VB6Type> = new Map();

  private constructor() {
    this.initializeBuiltIns();
  }

  static getInstance(): VB6IntelliSenseService {
    if (!VB6IntelliSenseService.instance) {
      VB6IntelliSenseService.instance = new VB6IntelliSenseService();
    }
    return VB6IntelliSenseService.instance;
  }

  // Update controls for IntelliSense
  updateControls(controls: Control[]) {
    this.controls = controls;
  }

  // Parse code to extract user-defined variables, functions, and types
  parseCode(code: string) {
    this.parseVariables(code);
    this.parseFunctions(code);
    this.parseTypes(code);
  }

  private parseVariables(code: string) {
    this.userVariables.clear();

    // Parse Dim statements
    const dimRegex = /^\s*(Dim|Private|Public|Global)\s+(\w+)(?:\s+As\s+(\w+))?/gim;
    let match;
    while ((match = dimRegex.exec(code)) !== null) {
      const varName = match[2];
      const varType = match[3] || 'Variant';
      this.userVariables.set(varName, varType);
    }

    // Parse Const statements
    const constRegex =
      /^\s*(Const|Private\s+Const|Public\s+Const)\s+(\w+)(?:\s+As\s+(\w+))?\s*=\s*(.+)$/gim;
    while ((match = constRegex.exec(code)) !== null) {
      const constName = match[2];
      const constType = match[3] || 'Variant';
      this.userVariables.set(constName, constType);
    }
  }

  private parseFunctions(code: string) {
    this.userFunctions.clear();

    // Parse Sub and Function declarations
    const funcRegex =
      /^\s*(Private|Public)?\s*(Sub|Function)\s+(\w+)\s*\(([^)]*)\)(?:\s+As\s+(\w+))?/gim;
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
      const funcName = match[3];
      const funcType = match[2];
      const params = match[4];
      const returnType = match[5] || (funcType === 'Function' ? 'Variant' : 'Void');

      const parameters = this.parseParameters(params);

      this.userFunctions.set(funcName, {
        name: funcName,
        signature: `${funcType} ${funcName}(${params})${returnType !== 'Void' ? ' As ' + returnType : ''}`,
        parameters,
        returnType,
        description: `User-defined ${funcType.toLowerCase()}`,
        category: 'User',
      });
    }
  }

  private parseParameters(paramString: string): VB6Parameter[] {
    if (!paramString.trim()) return [];

    const params: VB6Parameter[] = [];
    const paramParts = paramString.split(',');

    for (const part of paramParts) {
      const paramRegex =
        /^\s*(?:(Optional)\s+)?(?:(ByVal|ByRef)\s+)?(\w+)(?:\s+As\s+(\w+))?(?:\s*=\s*(.+))?\s*$/i;
      const match = part.match(paramRegex);

      if (match) {
        params.push({
          name: match[3],
          type: match[4] || 'Variant',
          optional: !!match[1],
          defaultValue: match[5],
          description: '',
        });
      }
    }

    return params;
  }

  private parseTypes(code: string) {
    this.userTypes.clear();

    // Parse Type declarations
    const typeRegex = /Type\s+(\w+)([\s\S]*?)End\s+Type/gi;
    let match;
    while ((match = typeRegex.exec(code)) !== null) {
      const typeName = match[1];
      const typeBody = match[2];

      const members: VB6Property[] = [];
      const memberRegex = /^\s*(\w+)\s+As\s+(\w+)/gim;
      let memberMatch;

      while ((memberMatch = memberRegex.exec(typeBody)) !== null) {
        members.push({
          name: memberMatch[1],
          type: memberMatch[2],
          readOnly: false,
          description: '',
        });
      }

      this.userTypes.set(typeName, {
        name: typeName,
        members,
        methods: [],
        description: 'User-defined type',
      });
    }
  }

  // Get completion items
  getCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.CompletionItem[] {
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    const lineContent = model.getLineContent(position.lineNumber);
    const textUntilPosition = lineContent.substring(0, position.column - 1);

    const suggestions: monaco.languages.CompletionItem[] = [];

    // Check context
    if (textUntilPosition.match(/\.\s*$/)) {
      // Member access - provide object members
      const objectMatch = textUntilPosition.match(/(\w+)\.\s*$/);
      if (objectMatch) {
        const objectName = objectMatch[1];
        suggestions.push(...this.getObjectMembers(objectName, range));
      }
    } else if (textUntilPosition.match(/\bAs\s+$/i)) {
      // Type declaration - provide types
      suggestions.push(...this.getTypeCompletions(range));
    } else if (textUntilPosition.match(/\(\s*$/) || textUntilPosition.includes('(')) {
      // Function call - provide parameter hints
      suggestions.push(...this.getParameterHints(textUntilPosition, range));
    } else {
      // General context - provide everything
      suggestions.push(...this.getGeneralCompletions(range));
    }

    return suggestions;
  }

  private getObjectMembers(objectName: string, range: any): monaco.languages.CompletionItem[] {
    const suggestions: monaco.languages.CompletionItem[] = [];

    // Check if it's a control
    const control = this.controls.find(c => c.name === objectName);
    if (control) {
      suggestions.push(...this.getControlProperties(control.type, range));
      suggestions.push(...this.getControlMethods(control.type, range));
    }

    // Check if it's a known object type
    const objectType = this.userVariables.get(objectName);
    if (objectType) {
      const type = this.userTypes.get(objectType);
      if (type) {
        type.members.forEach(member => {
          suggestions.push({
            label: member.name,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: member.name,
            detail: `${member.type} property`,
            documentation: member.description,
            range,
          });
        });
      }
    }

    // Add common object members
    if (objectName.toLowerCase() === 'me' || objectName.toLowerCase() === 'form') {
      suggestions.push(...this.getFormMembers(range));
    }

    return suggestions;
  }

  private getControlProperties(controlType: string, range: any): monaco.languages.CompletionItem[] {
    const properties = this.controlProperties[controlType] || this.controlProperties['Common'];
    return properties.map(prop => ({
      label: prop.name,
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: prop.name,
      detail: `${prop.type} property`,
      documentation: prop.description,
      range,
    }));
  }

  private getControlMethods(controlType: string, range: any): monaco.languages.CompletionItem[] {
    const methods = this.controlMethods[controlType] || [];
    return methods.map(method => ({
      label: method.name,
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: method.name + '${1}',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: method.signature,
      documentation: method.description,
      range,
    }));
  }

  private getFormMembers(range: any): monaco.languages.CompletionItem[] {
    const suggestions: monaco.languages.CompletionItem[] = [];

    // Form properties
    this.formProperties.forEach(prop => {
      suggestions.push({
        label: prop.name,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: prop.name,
        detail: `${prop.type} property`,
        documentation: prop.description,
        range,
      });
    });

    // Form methods
    this.formMethods.forEach(method => {
      suggestions.push({
        label: method.name,
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: method.name + '${1}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: method.signature,
        documentation: method.description,
        range,
      });
    });

    // Add controls as form members
    this.controls.forEach(control => {
      suggestions.push({
        label: control.name,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: control.name,
        detail: `${control.type} control`,
        documentation: `Access the ${control.name} control`,
        range,
      });
    });

    return suggestions;
  }

  private getTypeCompletions(range: any): monaco.languages.CompletionItem[] {
    const suggestions: monaco.languages.CompletionItem[] = [];

    // Built-in types
    this.builtInTypes.forEach(type => {
      suggestions.push({
        label: type,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: type,
        detail: 'Built-in type',
        range,
      });
    });

    // User-defined types
    this.userTypes.forEach(type => {
      suggestions.push({
        label: type.name,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: type.name,
        detail: 'User-defined type',
        documentation: type.description,
        range,
      });
    });

    return suggestions;
  }

  private getParameterHints(
    textUntilPosition: string,
    range: any
  ): monaco.languages.CompletionItem[] {
    // Extract function name
    const funcMatch = textUntilPosition.match(/(\w+)\s*\(/);
    if (!funcMatch) return [];

    const funcName = funcMatch[1];
    const func = this.builtInFunctions.get(funcName) || this.userFunctions.get(funcName);

    if (!func) return [];

    // Create parameter hints
    return func.parameters.map((param, index) => ({
      label: param.name,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: param.defaultValue || param.name,
      detail: `${param.type} parameter`,
      documentation: param.description,
      sortText: String(index).padStart(2, '0'),
      range,
    }));
  }

  private getGeneralCompletions(range: any): monaco.languages.CompletionItem[] {
    const suggestions: monaco.languages.CompletionItem[] = [];

    // Add snippets first (highest priority)
    vb6Snippets.forEach(snippet => {
      suggestions.push({
        label: snippet.prefix,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: snippet.body,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: snippet.name,
        documentation: {
          value: `${snippet.description}\n\n**Category:** ${snippet.category}`,
          isTrusted: true,
        },
        sortText: '0' + snippet.prefix, // Ensure snippets appear first
        range,
      });
    });

    // Keywords
    this.keywords.forEach(keyword => {
      suggestions.push({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        detail: 'VB6 keyword',
        range,
      });
    });

    // Built-in functions
    this.builtInFunctions.forEach(func => {
      suggestions.push({
        label: func.name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: func.name + '(${1})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: func.signature,
        documentation: func.description + (func.example ? `\n\nExample:\n${func.example}` : ''),
        range,
      });
    });

    // Constants
    this.constants.forEach(constant => {
      suggestions.push({
        label: constant.name,
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: constant.name,
        detail: `${constant.category} constant = ${constant.value}`,
        documentation: constant.description,
        range,
      });
    });

    // User variables
    this.userVariables.forEach((type, name) => {
      suggestions.push({
        label: name,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: name,
        detail: `${type} variable`,
        range,
      });
    });

    // User functions
    this.userFunctions.forEach(func => {
      suggestions.push({
        label: func.name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: func.name + '(${1})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: func.signature,
        documentation: func.description,
        range,
      });
    });

    // Snippets
    this.snippets.forEach(snippet => {
      suggestions.push({
        label: snippet.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: snippet.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: snippet.detail,
        documentation: snippet.documentation,
        range,
      });
    });

    // Controls
    this.controls.forEach(control => {
      suggestions.push({
        label: control.name,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: control.name,
        detail: `${control.type} control`,
        range,
      });
    });

    return suggestions;
  }

  // Get hover information
  getHoverInfo(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.Hover | null {
    const word = model.getWordAtPosition(position);
    if (!word) return null;

    const wordText = word.word;

    // Check built-in functions
    const func = this.builtInFunctions.get(wordText) || this.userFunctions.get(wordText);
    if (func) {
      return {
        contents: [
          { value: `**${func.signature}**` },
          { value: func.description },
          func.example ? { value: `Example:\n\`\`\`vb\n${func.example}\n\`\`\`` } : null,
        ].filter(Boolean) as monaco.IMarkdownString[],
      };
    }

    // Check constants
    const constant = this.constants.find(c => c.name === wordText);
    if (constant) {
      return {
        contents: [
          { value: `**${constant.name}** = ${constant.value}` },
          { value: constant.description },
        ],
      };
    }

    // Check user variables
    const varType = this.userVariables.get(wordText);
    if (varType) {
      return {
        contents: [{ value: `**${wordText}** As ${varType}` }, { value: 'User-defined variable' }],
      };
    }

    // Check controls
    const control = this.controls.find(c => c.name === wordText);
    if (control) {
      return {
        contents: [
          { value: `**${control.name}**` },
          { value: `${control.type} control` },
          { value: `Position: (${control.left}, ${control.top})` },
          { value: `Size: ${control.width} x ${control.height}` },
        ],
      };
    }

    return null;
  }

  // Get signature help
  getSignatureHelp(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.SignatureHelpResult | null {
    const lineContent = model.getLineContent(position.lineNumber);
    const textUntilPosition = lineContent.substring(0, position.column - 1);

    // Find the function being called
    const funcMatch = textUntilPosition.match(/(\w+)\s*\(([^)]*)$/);
    if (!funcMatch) return null;

    const funcName = funcMatch[1];
    const func = this.builtInFunctions.get(funcName) || this.userFunctions.get(funcName);

    if (!func) return null;

    // Count commas to determine active parameter
    const paramText = funcMatch[2];
    const commaCount = (paramText.match(/,/g) || []).length;

    const signatures: monaco.languages.SignatureInformation[] = [
      {
        label: func.signature,
        documentation: func.description,
        parameters: func.parameters.map(param => ({
          label: param.name,
          documentation: `${param.type}${param.optional ? ' (Optional)' : ''}${param.defaultValue ? ` = ${param.defaultValue}` : ''} - ${param.description}`,
        })),
      },
    ];

    return {
      dispose: () => {},
      value: {
        signatures,
        activeSignature: 0,
        activeParameter: Math.min(commaCount, func.parameters.length - 1),
      },
    };
  }

  // Initialize built-in data
  private initializeBuiltIns() {
    // Initialize all built-in data here
    this.initializeKeywords();
    this.initializeBuiltInFunctions();
    this.initializeConstants();
    this.initializeControlData();
    // Snippets are now loaded from vb6Snippets directly
  }

  private keywords = [
    'And',
    'As',
    'Boolean',
    'ByRef',
    'Byte',
    'ByVal',
    'Call',
    'Case',
    'Const',
    'Currency',
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
    'Error',
    'Exit',
    'False',
    'For',
    'Friend',
    'Function',
    'Get',
    'Global',
    'GoTo',
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
    'Object',
    'On',
    'Option',
    'Optional',
    'Or',
    'ParamArray',
    'Preserve',
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
    'WithEvents',
    'Xor',
  ];

  private builtInTypes = [
    'Boolean',
    'Byte',
    'Integer',
    'Long',
    'Single',
    'Double',
    'Currency',
    'Date',
    'String',
    'Object',
    'Variant',
    'Collection',
    'Dictionary',
    'FileSystemObject',
    'TextStream',
    'Recordset',
    'Connection',
    'Command',
  ];

  private builtInFunctions = new Map<string, VB6Function>();
  private constants: VB6Constant[] = [];
  private controlProperties: { [key: string]: VB6Property[] } = {};
  private controlMethods: { [key: string]: VB6Function[] } = {};
  private formProperties: VB6Property[] = [];
  private formMethods: VB6Function[] = [];
  private snippets: any[] = [];

  private initializeKeywords() {
    // Keywords are already defined above
  }

  private initializeBuiltInFunctions() {
    // String functions
    this.addFunction({
      name: 'Len',
      signature: 'Len(String) As Long',
      parameters: [
        {
          name: 'String',
          type: 'String',
          optional: false,
          description: 'The string to measure',
        },
      ],
      returnType: 'Long',
      description: 'Returns the number of characters in a string',
      example: 'Dim length As Long\nlength = Len("Hello") \'Returns 5',
      category: 'String',
    });

    this.addFunction({
      name: 'Left',
      signature: 'Left(String, Length As Long) As String',
      parameters: [
        { name: 'String', type: 'String', optional: false, description: 'The source string' },
        {
          name: 'Length',
          type: 'Long',
          optional: false,
          description: 'Number of characters to return',
        },
      ],
      returnType: 'String',
      description: 'Returns a specified number of characters from the left side of a string',
      example: 'Dim result As String\nresult = Left("Hello World", 5) \'Returns "Hello"',
      category: 'String',
    });

    this.addFunction({
      name: 'Right',
      signature: 'Right(String, Length As Long) As String',
      parameters: [
        { name: 'String', type: 'String', optional: false, description: 'The source string' },
        {
          name: 'Length',
          type: 'Long',
          optional: false,
          description: 'Number of characters to return',
        },
      ],
      returnType: 'String',
      description: 'Returns a specified number of characters from the right side of a string',
      example: 'Dim result As String\nresult = Right("Hello World", 5) \'Returns "World"',
      category: 'String',
    });

    this.addFunction({
      name: 'Mid',
      signature: 'Mid(String, Start As Long, [Length]) As String',
      parameters: [
        { name: 'String', type: 'String', optional: false, description: 'The source string' },
        {
          name: 'Start',
          type: 'Long',
          optional: false,
          description: 'Starting position (1-based)',
        },
        {
          name: 'Length',
          type: 'Long',
          optional: true,
          description: 'Number of characters to return',
        },
      ],
      returnType: 'String',
      description: 'Returns a substring from a string',
      example: 'Dim result As String\nresult = Mid("Hello World", 7, 5) \'Returns "World"',
      category: 'String',
    });

    this.addFunction({
      name: 'InStr',
      signature: 'InStr([Start], String1, String2, [Compare]) As Long',
      parameters: [
        {
          name: 'Start',
          type: 'Long',
          optional: true,
          defaultValue: '1',
          description: 'Starting position',
        },
        { name: 'String1', type: 'String', optional: false, description: 'String to search in' },
        { name: 'String2', type: 'String', optional: false, description: 'String to search for' },
        {
          name: 'Compare',
          type: 'VbCompareMethod',
          optional: true,
          defaultValue: 'vbBinaryCompare',
          description: 'Comparison method',
        },
      ],
      returnType: 'Long',
      description: 'Returns the position of the first occurrence of one string within another',
      example: 'Dim pos As Long\npos = InStr("Hello World", "World") \'Returns 7',
      category: 'String',
    });

    this.addFunction({
      name: 'Replace',
      signature: 'Replace(Expression, Find, Replace, [Start], [Count], [Compare]) As String',
      parameters: [
        {
          name: 'Expression',
          type: 'String',
          optional: false,
          description: 'String containing substring to replace',
        },
        {
          name: 'Find',
          type: 'String',
          optional: false,
          description: 'Substring being searched for',
        },
        { name: 'Replace', type: 'String', optional: false, description: 'Replacement substring' },
        {
          name: 'Start',
          type: 'Long',
          optional: true,
          defaultValue: '1',
          description: 'Starting position',
        },
        {
          name: 'Count',
          type: 'Long',
          optional: true,
          defaultValue: '-1',
          description: 'Number of replacements',
        },
        {
          name: 'Compare',
          type: 'VbCompareMethod',
          optional: true,
          defaultValue: 'vbBinaryCompare',
          description: 'Comparison method',
        },
      ],
      returnType: 'String',
      description: 'Returns a string in which a specified substring has been replaced',
      example:
        'Dim result As String\nresult = Replace("Hello World", "World", "VB6") \'Returns "Hello VB6"',
      category: 'String',
    });

    // Math functions
    this.addFunction({
      name: 'Abs',
      signature: 'Abs(Number) As Number',
      parameters: [
        {
          name: 'Number',
          type: 'Number',
          optional: false,
          description: 'The number to get the absolute value of',
        },
      ],
      returnType: 'Number',
      description: 'Returns the absolute value of a number',
      example: "Dim result As Double\nresult = Abs(-5.5) 'Returns 5.5",
      category: 'Math',
    });

    this.addFunction({
      name: 'Round',
      signature: 'Round(Expression, [NumDigitsAfterDecimal]) As Number',
      parameters: [
        { name: 'Expression', type: 'Number', optional: false, description: 'The number to round' },
        {
          name: 'NumDigitsAfterDecimal',
          type: 'Long',
          optional: true,
          defaultValue: '0',
          description: 'Number of decimal places',
        },
      ],
      returnType: 'Number',
      description: 'Returns a number rounded to a specified number of decimal places',
      example: "Dim result As Double\nresult = Round(3.14159, 2) 'Returns 3.14",
      category: 'Math',
    });

    this.addFunction({
      name: 'Int',
      signature: 'Int(Number) As Long',
      parameters: [
        {
          name: 'Number',
          type: 'Number',
          optional: false,
          description: 'The number to truncate',
        },
      ],
      returnType: 'Long',
      description: 'Returns the integer portion of a number',
      example: "Dim result As Long\nresult = Int(3.14) 'Returns 3",
      category: 'Math',
    });

    this.addFunction({
      name: 'Sqr',
      signature: 'Sqr(Number) As Double',
      parameters: [
        {
          name: 'Number',
          type: 'Number',
          optional: false,
          description: 'The number to get the square root of',
        },
      ],
      returnType: 'Double',
      description: 'Returns the square root of a number',
      example: "Dim result As Double\nresult = Sqr(16) 'Returns 4",
      category: 'Math',
    });

    // Date/Time functions
    this.addFunction({
      name: 'Now',
      signature: 'Now() As Date',
      parameters: [],
      returnType: 'Date',
      description: 'Returns the current date and time',
      example: 'Dim currentDateTime As Date\ncurrentDateTime = Now()',
      category: 'DateTime',
    });

    this.addFunction({
      name: 'Date',
      signature: 'Date() As Date',
      parameters: [],
      returnType: 'Date',
      description: 'Returns the current date',
      example: 'Dim currentDate As Date\ncurrentDate = Date()',
      category: 'DateTime',
    });

    this.addFunction({
      name: 'Time',
      signature: 'Time() As Date',
      parameters: [],
      returnType: 'Date',
      description: 'Returns the current time',
      example: 'Dim currentTime As Date\ncurrentTime = Time()',
      category: 'DateTime',
    });

    this.addFunction({
      name: 'DateAdd',
      signature: 'DateAdd(Interval As String, Number As Long, Date) As Date',
      parameters: [
        {
          name: 'Interval',
          type: 'String',
          optional: false,
          description: 'Time interval to add ("d", "m", "yyyy", etc.)',
        },
        {
          name: 'Number',
          type: 'Long',
          optional: false,
          description: 'Number of intervals to add',
        },
        { name: 'Date', type: 'Date', optional: false, description: 'Date to add to' },
      ],
      returnType: 'Date',
      description: 'Returns a date to which a specified time interval has been added',
      example: 'Dim futureDate As Date\nfutureDate = DateAdd("d", 7, Now()) \'Adds 7 days',
      category: 'DateTime',
    });

    this.addFunction({
      name: 'DateDiff',
      signature:
        'DateDiff(Interval As String, Date1, Date2, [FirstDayOfWeek], [FirstWeekOfYear]) As Long',
      parameters: [
        {
          name: 'Interval',
          type: 'String',
          optional: false,
          description: 'Time interval to calculate',
        },
        { name: 'Date1', type: 'Date', optional: false, description: 'First date' },
        { name: 'Date2', type: 'Date', optional: false, description: 'Second date' },
        {
          name: 'FirstDayOfWeek',
          type: 'VbDayOfWeek',
          optional: true,
          defaultValue: 'vbSunday',
          description: 'First day of week',
        },
        {
          name: 'FirstWeekOfYear',
          type: 'VbFirstWeekOfYear',
          optional: true,
          defaultValue: 'vbFirstJan1',
          description: 'First week of year',
        },
      ],
      returnType: 'Long',
      description: 'Returns the number of time intervals between two dates',
      example: 'Dim days As Long\ndays = DateDiff("d", #1/1/2024#, #1/31/2024#) \'Returns 30',
      category: 'DateTime',
    });

    this.addFunction({
      name: 'Format',
      signature: 'Format(Expression, [Format], [FirstDayOfWeek], [FirstWeekOfYear]) As String',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to format',
        },
        { name: 'Format', type: 'String', optional: true, description: 'Format string' },
        {
          name: 'FirstDayOfWeek',
          type: 'VbDayOfWeek',
          optional: true,
          defaultValue: 'vbSunday',
          description: 'First day of week',
        },
        {
          name: 'FirstWeekOfYear',
          type: 'VbFirstWeekOfYear',
          optional: true,
          defaultValue: 'vbFirstJan1',
          description: 'First week of year',
        },
      ],
      returnType: 'String',
      description: 'Returns a formatted string',
      example:
        'Dim formatted As String\nformatted = Format(Now(), "yyyy-mm-dd") \'Returns "2024-01-30"',
      category: 'Conversion',
    });

    // Array functions
    this.addFunction({
      name: 'UBound',
      signature: 'UBound(ArrayName, [Dimension]) As Long',
      parameters: [
        { name: 'ArrayName', type: 'Array', optional: false, description: 'The array to check' },
        {
          name: 'Dimension',
          type: 'Long',
          optional: true,
          defaultValue: '1',
          description: 'Array dimension',
        },
      ],
      returnType: 'Long',
      description:
        'Returns the largest available subscript for the indicated dimension of an array',
      example: "Dim arr(10) As Integer\nDim upper As Long\nupper = UBound(arr) 'Returns 10",
      category: 'Array',
    });

    this.addFunction({
      name: 'LBound',
      signature: 'LBound(ArrayName, [Dimension]) As Long',
      parameters: [
        { name: 'ArrayName', type: 'Array', optional: false, description: 'The array to check' },
        {
          name: 'Dimension',
          type: 'Long',
          optional: true,
          defaultValue: '1',
          description: 'Array dimension',
        },
      ],
      returnType: 'Long',
      description:
        'Returns the smallest available subscript for the indicated dimension of an array',
      example: "Dim arr(1 To 10) As Integer\nDim lower As Long\nlower = LBound(arr) 'Returns 1",
      category: 'Array',
    });

    this.addFunction({
      name: 'Array',
      signature: 'Array(ArgList) As Variant',
      parameters: [
        {
          name: 'ArgList',
          type: 'Variant',
          optional: false,
          description: 'Comma-delimited list of values',
        },
      ],
      returnType: 'Variant',
      description: 'Returns a Variant containing an array',
      example: 'Dim myArray As Variant\nmyArray = Array("Apple", "Banana", "Orange")',
      category: 'Array',
    });

    this.addFunction({
      name: 'Split',
      signature: 'Split(Expression, [Delimiter], [Limit], [Compare]) As String()',
      parameters: [
        { name: 'Expression', type: 'String', optional: false, description: 'String to split' },
        {
          name: 'Delimiter',
          type: 'String',
          optional: true,
          defaultValue: '" "',
          description: 'String delimiter',
        },
        {
          name: 'Limit',
          type: 'Long',
          optional: true,
          defaultValue: '-1',
          description: 'Number of substrings to return',
        },
        {
          name: 'Compare',
          type: 'VbCompareMethod',
          optional: true,
          defaultValue: 'vbBinaryCompare',
          description: 'Comparison method',
        },
      ],
      returnType: 'String()',
      description: 'Returns a zero-based, one-dimensional array containing substrings',
      example:
        'Dim parts() As String\nparts = Split("Hello,World,VB6", ",") \'Returns array with 3 elements',
      category: 'Array',
    });

    this.addFunction({
      name: 'Join',
      signature: 'Join(SourceArray, [Delimiter]) As String',
      parameters: [
        {
          name: 'SourceArray',
          type: 'String()',
          optional: false,
          description: 'Array of strings to join',
        },
        {
          name: 'Delimiter',
          type: 'String',
          optional: true,
          defaultValue: '" "',
          description: 'String delimiter',
        },
      ],
      returnType: 'String',
      description: 'Returns a string created by joining substrings contained in an array',
      example:
        'Dim arr() As String\narr = Array("Hello", "World")\nDim result As String\nresult = Join(arr, " ") \'Returns "Hello World"',
      category: 'Array',
    });

    // Type checking functions
    this.addFunction({
      name: 'IsArray',
      signature: 'IsArray(VarName) As Boolean',
      parameters: [
        {
          name: 'VarName',
          type: 'Variant',
          optional: false,
          description: 'Variable to check',
        },
      ],
      returnType: 'Boolean',
      description: 'Returns True if the variable is an array',
      example: "Dim arr(10) As Integer\nIf IsArray(arr) Then 'Returns True",
      category: 'Information',
    });

    this.addFunction({
      name: 'IsDate',
      signature: 'IsDate(Expression) As Boolean',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to check',
        },
      ],
      returnType: 'Boolean',
      description: 'Returns True if the expression can be converted to a date',
      example: 'If IsDate("1/30/2024") Then \'Returns True',
      category: 'Information',
    });

    this.addFunction({
      name: 'IsNumeric',
      signature: 'IsNumeric(Expression) As Boolean',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to check',
        },
      ],
      returnType: 'Boolean',
      description: 'Returns True if the expression can be evaluated as a number',
      example: 'If IsNumeric("123.45") Then \'Returns True',
      category: 'Information',
    });

    this.addFunction({
      name: 'IsNull',
      signature: 'IsNull(Expression) As Boolean',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to check',
        },
      ],
      returnType: 'Boolean',
      description: 'Returns True if the expression is Null',
      example: "Dim v As Variant\nv = Null\nIf IsNull(v) Then 'Returns True",
      category: 'Information',
    });

    this.addFunction({
      name: 'IsEmpty',
      signature: 'IsEmpty(Expression) As Boolean',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to check',
        },
      ],
      returnType: 'Boolean',
      description: 'Returns True if the variable is uninitialized',
      example: "Dim v As Variant\nIf IsEmpty(v) Then 'Returns True",
      category: 'Information',
    });

    // File I/O functions
    this.addFunction({
      name: 'Open',
      signature: 'Open Pathname For Mode [Access] [Lock] As [#]FileNumber [Len=RecLength]',
      parameters: [
        { name: 'Pathname', type: 'String', optional: false, description: 'File path' },
        {
          name: 'Mode',
          type: 'FileMode',
          optional: false,
          description: 'File mode (Input, Output, Append, Random, Binary)',
        },
        {
          name: 'Access',
          type: 'FileAccess',
          optional: true,
          description: 'Access type (Read, Write, Read Write)',
        },
        {
          name: 'Lock',
          type: 'FileLock',
          optional: true,
          description: 'Lock type (Shared, Lock Read, Lock Write, Lock Read Write)',
        },
        { name: 'FileNumber', type: 'Integer', optional: false, description: 'File number' },
        {
          name: 'RecLength',
          type: 'Long',
          optional: true,
          description: 'Record length for Random access',
        },
      ],
      returnType: 'Void',
      description: 'Opens a file for input/output',
      example: 'Open "C:\\test.txt" For Output As #1',
      category: 'FileIO',
    });

    this.addFunction({
      name: 'Close',
      signature: 'Close [FileNumberList]',
      parameters: [
        {
          name: 'FileNumberList',
          type: 'Integer',
          optional: true,
          description: 'File numbers to close',
        },
      ],
      returnType: 'Void',
      description: 'Closes open files',
      example: 'Close #1',
      category: 'FileIO',
    });

    this.addFunction({
      name: 'Input',
      signature: 'Input(Number, [#]FileNumber) As String',
      parameters: [
        {
          name: 'Number',
          type: 'Long',
          optional: false,
          description: 'Number of characters to read',
        },
        { name: 'FileNumber', type: 'Integer', optional: false, description: 'File number' },
      ],
      returnType: 'String',
      description: 'Returns a string containing characters from a file',
      example: 'Dim data As String\ndata = Input(100, #1)',
      category: 'FileIO',
    });

    this.addFunction({
      name: 'Print',
      signature: 'Print #FileNumber, [OutputList]',
      parameters: [
        { name: 'FileNumber', type: 'Integer', optional: false, description: 'File number' },
        {
          name: 'OutputList',
          type: 'Variant',
          optional: true,
          description: 'Expression(s) to write',
        },
      ],
      returnType: 'Void',
      description: 'Writes display-formatted data to a sequential file',
      example: 'Print #1, "Hello World"',
      category: 'FileIO',
    });

    this.addFunction({
      name: 'EOF',
      signature: 'EOF(FileNumber) As Boolean',
      parameters: [
        {
          name: 'FileNumber',
          type: 'Integer',
          optional: false,
          description: 'File number',
        },
      ],
      returnType: 'Boolean',
      description: 'Returns True if the end of file has been reached',
      example: 'Do While Not EOF(1)\n    Line Input #1, textLine\nLoop',
      category: 'FileIO',
    });

    // Message functions
    this.addFunction({
      name: 'MsgBox',
      signature: 'MsgBox(Prompt, [Buttons], [Title], [HelpFile], [Context]) As VbMsgBoxResult',
      parameters: [
        { name: 'Prompt', type: 'String', optional: false, description: 'Message to display' },
        {
          name: 'Buttons',
          type: 'VbMsgBoxStyle',
          optional: true,
          defaultValue: 'vbOKOnly',
          description: 'Buttons and icon to display',
        },
        { name: 'Title', type: 'String', optional: true, description: 'Dialog box title' },
        { name: 'HelpFile', type: 'String', optional: true, description: 'Help file path' },
        { name: 'Context', type: 'Long', optional: true, description: 'Help context ID' },
      ],
      returnType: 'VbMsgBoxResult',
      description: 'Displays a message in a dialog box',
      example: 'Dim result As VbMsgBoxResult\nresult = MsgBox("Continue?", vbYesNo + vbQuestion)',
      category: 'UserInterface',
    });

    this.addFunction({
      name: 'InputBox',
      signature:
        'InputBox(Prompt, [Title], [Default], [XPos], [YPos], [HelpFile], [Context]) As String',
      parameters: [
        { name: 'Prompt', type: 'String', optional: false, description: 'Message to display' },
        { name: 'Title', type: 'String', optional: true, description: 'Dialog box title' },
        { name: 'Default', type: 'String', optional: true, description: 'Default response' },
        { name: 'XPos', type: 'Single', optional: true, description: 'X position' },
        { name: 'YPos', type: 'Single', optional: true, description: 'Y position' },
        { name: 'HelpFile', type: 'String', optional: true, description: 'Help file path' },
        { name: 'Context', type: 'Long', optional: true, description: 'Help context ID' },
      ],
      returnType: 'String',
      description: 'Displays a prompt in a dialog box',
      example: 'Dim userName As String\nuserName = InputBox("Enter your name:", "User Name")',
      category: 'UserInterface',
    });

    // Conversion functions
    this.addFunction({
      name: 'CStr',
      signature: 'CStr(Expression) As String',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to convert',
        },
      ],
      returnType: 'String',
      description: 'Converts an expression to String',
      example: 'Dim s As String\ns = CStr(123) \'Returns "123"',
      category: 'Conversion',
    });

    this.addFunction({
      name: 'CInt',
      signature: 'CInt(Expression) As Integer',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to convert',
        },
      ],
      returnType: 'Integer',
      description: 'Converts an expression to Integer',
      example: 'Dim i As Integer\ni = CInt("123") \'Returns 123',
      category: 'Conversion',
    });

    this.addFunction({
      name: 'CLng',
      signature: 'CLng(Expression) As Long',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to convert',
        },
      ],
      returnType: 'Long',
      description: 'Converts an expression to Long',
      example: 'Dim l As Long\nl = CLng("12345") \'Returns 12345',
      category: 'Conversion',
    });

    this.addFunction({
      name: 'CDbl',
      signature: 'CDbl(Expression) As Double',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to convert',
        },
      ],
      returnType: 'Double',
      description: 'Converts an expression to Double',
      example: 'Dim d As Double\nd = CDbl("123.45") \'Returns 123.45',
      category: 'Conversion',
    });

    this.addFunction({
      name: 'CBool',
      signature: 'CBool(Expression) As Boolean',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to convert',
        },
      ],
      returnType: 'Boolean',
      description: 'Converts an expression to Boolean',
      example: "Dim b As Boolean\nb = CBool(1) 'Returns True",
      category: 'Conversion',
    });

    this.addFunction({
      name: 'CDate',
      signature: 'CDate(Expression) As Date',
      parameters: [
        {
          name: 'Expression',
          type: 'Variant',
          optional: false,
          description: 'Expression to convert',
        },
      ],
      returnType: 'Date',
      description: 'Converts an expression to Date',
      example: 'Dim d As Date\nd = CDate("1/30/2024") \'Returns #1/30/2024#',
      category: 'Conversion',
    });

    this.addFunction({
      name: 'Val',
      signature: 'Val(String) As Double',
      parameters: [
        {
          name: 'String',
          type: 'String',
          optional: false,
          description: 'String to convert',
        },
      ],
      returnType: 'Double',
      description: 'Returns the numbers contained in a string',
      example: 'Dim num As Double\nnum = Val("123.45 meters") \'Returns 123.45',
      category: 'Conversion',
    });

    // Error handling functions
    this.addFunction({
      name: 'Err.Raise',
      signature: 'Err.Raise Number, [Source], [Description], [HelpFile], [HelpContext]',
      parameters: [
        { name: 'Number', type: 'Long', optional: false, description: 'Error number' },
        { name: 'Source', type: 'String', optional: true, description: 'Source of error' },
        { name: 'Description', type: 'String', optional: true, description: 'Error description' },
        { name: 'HelpFile', type: 'String', optional: true, description: 'Help file path' },
        { name: 'HelpContext', type: 'Long', optional: true, description: 'Help context ID' },
      ],
      returnType: 'Void',
      description: 'Generates a run-time error',
      example: 'Err.Raise 9999, "MyApp", "Custom error occurred"',
      category: 'ErrorHandling',
    });

    this.addFunction({
      name: 'Err.Clear',
      signature: 'Err.Clear',
      parameters: [],
      returnType: 'Void',
      description: 'Clears all property settings of the Err object',
      example: "On Error Resume Next\n'... some code\nErr.Clear",
      category: 'ErrorHandling',
    });
  }

  private addFunction(func: VB6Function) {
    this.builtInFunctions.set(func.name, func);
  }

  private initializeConstants() {
    // Message box constants
    this.constants.push(
      { name: 'vbOKOnly', value: 0, description: 'OK button only', category: 'MsgBox' },
      { name: 'vbOKCancel', value: 1, description: 'OK and Cancel buttons', category: 'MsgBox' },
      {
        name: 'vbAbortRetryIgnore',
        value: 2,
        description: 'Abort, Retry, and Ignore buttons',
        category: 'MsgBox',
      },
      {
        name: 'vbYesNoCancel',
        value: 3,
        description: 'Yes, No, and Cancel buttons',
        category: 'MsgBox',
      },
      { name: 'vbYesNo', value: 4, description: 'Yes and No buttons', category: 'MsgBox' },
      {
        name: 'vbRetryCancel',
        value: 5,
        description: 'Retry and Cancel buttons',
        category: 'MsgBox',
      },
      { name: 'vbCritical', value: 16, description: 'Critical message icon', category: 'MsgBox' },
      { name: 'vbQuestion', value: 32, description: 'Question icon', category: 'MsgBox' },
      { name: 'vbExclamation', value: 48, description: 'Warning message icon', category: 'MsgBox' },
      {
        name: 'vbInformation',
        value: 64,
        description: 'Information message icon',
        category: 'MsgBox',
      }
    );

    // Message box results
    this.constants.push(
      { name: 'vbOK', value: 1, description: 'OK button pressed', category: 'MsgBoxResult' },
      {
        name: 'vbCancel',
        value: 2,
        description: 'Cancel button pressed',
        category: 'MsgBoxResult',
      },
      { name: 'vbAbort', value: 3, description: 'Abort button pressed', category: 'MsgBoxResult' },
      { name: 'vbRetry', value: 4, description: 'Retry button pressed', category: 'MsgBoxResult' },
      {
        name: 'vbIgnore',
        value: 5,
        description: 'Ignore button pressed',
        category: 'MsgBoxResult',
      },
      { name: 'vbYes', value: 6, description: 'Yes button pressed', category: 'MsgBoxResult' },
      { name: 'vbNo', value: 7, description: 'No button pressed', category: 'MsgBoxResult' }
    );

    // Color constants
    this.constants.push(
      { name: 'vbBlack', value: 0x000000, description: 'Black color', category: 'Colors' },
      { name: 'vbRed', value: 0x0000ff, description: 'Red color', category: 'Colors' },
      { name: 'vbGreen', value: 0x00ff00, description: 'Green color', category: 'Colors' },
      { name: 'vbYellow', value: 0x00ffff, description: 'Yellow color', category: 'Colors' },
      { name: 'vbBlue', value: 0xff0000, description: 'Blue color', category: 'Colors' },
      { name: 'vbMagenta', value: 0xff00ff, description: 'Magenta color', category: 'Colors' },
      { name: 'vbCyan', value: 0xffff00, description: 'Cyan color', category: 'Colors' },
      { name: 'vbWhite', value: 0xffffff, description: 'White color', category: 'Colors' }
    );

    // Key constants
    this.constants.push(
      { name: 'vbKeyBack', value: 8, description: 'Backspace key', category: 'Keys' },
      { name: 'vbKeyTab', value: 9, description: 'Tab key', category: 'Keys' },
      { name: 'vbKeyReturn', value: 13, description: 'Enter key', category: 'Keys' },
      { name: 'vbKeyShift', value: 16, description: 'Shift key', category: 'Keys' },
      { name: 'vbKeyControl', value: 17, description: 'Ctrl key', category: 'Keys' },
      { name: 'vbKeyEscape', value: 27, description: 'Esc key', category: 'Keys' },
      { name: 'vbKeySpace', value: 32, description: 'Spacebar', category: 'Keys' },
      { name: 'vbKeyDelete', value: 46, description: 'Delete key', category: 'Keys' }
    );

    // File constants
    this.constants.push(
      { name: 'vbNormal', value: 0, description: 'Normal file', category: 'FileAttributes' },
      { name: 'vbReadOnly', value: 1, description: 'Read-only file', category: 'FileAttributes' },
      { name: 'vbHidden', value: 2, description: 'Hidden file', category: 'FileAttributes' },
      { name: 'vbSystem', value: 4, description: 'System file', category: 'FileAttributes' },
      { name: 'vbDirectory', value: 16, description: 'Directory', category: 'FileAttributes' },
      { name: 'vbArchive', value: 32, description: 'Archive file', category: 'FileAttributes' }
    );

    // Comparison constants
    this.constants.push(
      { name: 'vbBinaryCompare', value: 0, description: 'Binary comparison', category: 'Compare' },
      { name: 'vbTextCompare', value: 1, description: 'Textual comparison', category: 'Compare' },
      {
        name: 'vbDatabaseCompare',
        value: 2,
        description: 'Database comparison',
        category: 'Compare',
      }
    );

    // Date constants
    this.constants.push(
      { name: 'vbSunday', value: 1, description: 'Sunday', category: 'Weekdays' },
      { name: 'vbMonday', value: 2, description: 'Monday', category: 'Weekdays' },
      { name: 'vbTuesday', value: 3, description: 'Tuesday', category: 'Weekdays' },
      { name: 'vbWednesday', value: 4, description: 'Wednesday', category: 'Weekdays' },
      { name: 'vbThursday', value: 5, description: 'Thursday', category: 'Weekdays' },
      { name: 'vbFriday', value: 6, description: 'Friday', category: 'Weekdays' },
      { name: 'vbSaturday', value: 7, description: 'Saturday', category: 'Weekdays' }
    );

    // Boolean constants
    this.constants.push(
      { name: 'True', value: -1, description: 'Boolean True value', category: 'Boolean' },
      { name: 'False', value: 0, description: 'Boolean False value', category: 'Boolean' }
    );

    // Null/Empty constants
    this.constants.push(
      { name: 'Null', value: 'null', description: 'Null value', category: 'Special' },
      { name: 'Empty', value: '', description: 'Empty value', category: 'Special' },
      {
        name: 'Nothing',
        value: 'null',
        description: 'Nothing object reference',
        category: 'Special',
      }
    );

    // VarType constants
    this.constants.push(
      { name: 'vbEmpty', value: 0, description: 'Empty (uninitialized)', category: 'VarType' },
      { name: 'vbNull', value: 1, description: 'Null (no valid data)', category: 'VarType' },
      { name: 'vbInteger', value: 2, description: 'Integer', category: 'VarType' },
      { name: 'vbLong', value: 3, description: 'Long integer', category: 'VarType' },
      {
        name: 'vbSingle',
        value: 4,
        description: 'Single-precision floating-point',
        category: 'VarType',
      },
      {
        name: 'vbDouble',
        value: 5,
        description: 'Double-precision floating-point',
        category: 'VarType',
      },
      { name: 'vbCurrency', value: 6, description: 'Currency', category: 'VarType' },
      { name: 'vbDate', value: 7, description: 'Date', category: 'VarType' },
      { name: 'vbString', value: 8, description: 'String', category: 'VarType' },
      { name: 'vbObject', value: 9, description: 'Object', category: 'VarType' },
      { name: 'vbError', value: 10, description: 'Error', category: 'VarType' },
      { name: 'vbBoolean', value: 11, description: 'Boolean', category: 'VarType' },
      { name: 'vbVariant', value: 12, description: 'Variant', category: 'VarType' },
      { name: 'vbArray', value: 8192, description: 'Array', category: 'VarType' }
    );
  }

  private initializeControlData() {
    // Common control properties
    this.controlProperties['Common'] = [
      { name: 'Name', type: 'String', readOnly: false, description: 'The name of the control' },
      {
        name: 'Left',
        type: 'Single',
        readOnly: false,
        description: 'Left position of the control',
      },
      { name: 'Top', type: 'Single', readOnly: false, description: 'Top position of the control' },
      { name: 'Width', type: 'Single', readOnly: false, description: 'Width of the control' },
      { name: 'Height', type: 'Single', readOnly: false, description: 'Height of the control' },
      {
        name: 'Visible',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether the control is visible',
      },
      {
        name: 'Enabled',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether the control is enabled',
      },
      {
        name: 'TabIndex',
        type: 'Integer',
        readOnly: false,
        description: 'Tab order of the control',
      },
      { name: 'Tag', type: 'String', readOnly: false, description: 'User-defined tag' },
    ];

    // TextBox properties
    this.controlProperties['TextBox'] = [
      ...this.controlProperties['Common'],
      { name: 'Text', type: 'String', readOnly: false, description: 'The text in the control' },
      {
        name: 'MaxLength',
        type: 'Long',
        readOnly: false,
        description: 'Maximum number of characters',
      },
      {
        name: 'MultiLine',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether text can span multiple lines',
      },
      {
        name: 'ScrollBars',
        type: 'ScrollBarsConstants',
        readOnly: false,
        description: 'Type of scroll bars',
      },
      {
        name: 'PasswordChar',
        type: 'String',
        readOnly: false,
        description: 'Character used for password masking',
      },
      {
        name: 'Locked',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether the text can be edited',
      },
      {
        name: 'SelStart',
        type: 'Long',
        readOnly: false,
        description: 'Starting point of text selection',
      },
      { name: 'SelLength', type: 'Long', readOnly: false, description: 'Length of selected text' },
      { name: 'SelText', type: 'String', readOnly: false, description: 'Selected text' },
    ];

    // Label properties
    this.controlProperties['Label'] = [
      ...this.controlProperties['Common'],
      {
        name: 'Caption',
        type: 'String',
        readOnly: false,
        description: 'The text displayed in the label',
      },
      {
        name: 'AutoSize',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether the label resizes to fit its caption',
      },
      { name: 'BackColor', type: 'Long', readOnly: false, description: 'Background color' },
      { name: 'ForeColor', type: 'Long', readOnly: false, description: 'Text color' },
      { name: 'Font', type: 'StdFont', readOnly: false, description: 'Font settings' },
      {
        name: 'Alignment',
        type: 'AlignmentConstants',
        readOnly: false,
        description: 'Text alignment',
      },
      {
        name: 'BorderStyle',
        type: 'BorderStyleConstants',
        readOnly: false,
        description: 'Border style',
      },
      {
        name: 'WordWrap',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether text wraps to next line',
      },
    ];

    // CommandButton properties
    this.controlProperties['CommandButton'] = [
      ...this.controlProperties['Common'],
      {
        name: 'Caption',
        type: 'String',
        readOnly: false,
        description: 'The text displayed on the button',
      },
      {
        name: 'Default',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether this is the default button',
      },
      {
        name: 'Cancel',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether this is the cancel button',
      },
      {
        name: 'Picture',
        type: 'Picture',
        readOnly: false,
        description: 'Picture displayed on the button',
      },
      { name: 'Style', type: 'ButtonConstants', readOnly: false, description: 'Button style' },
      {
        name: 'DisabledPicture',
        type: 'Picture',
        readOnly: false,
        description: 'Picture when disabled',
      },
      {
        name: 'DownPicture',
        type: 'Picture',
        readOnly: false,
        description: 'Picture when pressed',
      },
    ];

    // ListBox properties
    this.controlProperties['ListBox'] = [
      ...this.controlProperties['Common'],
      { name: 'List', type: 'String()', readOnly: true, description: 'Array of list items' },
      {
        name: 'ListCount',
        type: 'Long',
        readOnly: true,
        description: 'Number of items in the list',
      },
      { name: 'ListIndex', type: 'Long', readOnly: false, description: 'Index of selected item' },
      { name: 'Text', type: 'String', readOnly: true, description: 'Text of selected item' },
      {
        name: 'Selected',
        type: 'Boolean()',
        readOnly: false,
        description: 'Selection state of items',
      },
      { name: 'Sorted', type: 'Boolean', readOnly: false, description: 'Whether list is sorted' },
      {
        name: 'MultiSelect',
        type: 'MultiSelectConstants',
        readOnly: false,
        description: 'Multi-selection mode',
      },
      { name: 'Style', type: 'ListBoxConstants', readOnly: false, description: 'ListBox style' },
    ];

    // ComboBox properties
    this.controlProperties['ComboBox'] = [
      ...this.controlProperties['Common'],
      { name: 'Text', type: 'String', readOnly: false, description: 'The text in the combo box' },
      { name: 'List', type: 'String()', readOnly: true, description: 'Array of list items' },
      {
        name: 'ListCount',
        type: 'Long',
        readOnly: true,
        description: 'Number of items in the list',
      },
      { name: 'ListIndex', type: 'Long', readOnly: false, description: 'Index of selected item' },
      { name: 'Sorted', type: 'Boolean', readOnly: false, description: 'Whether list is sorted' },
      { name: 'Style', type: 'ComboBoxConstants', readOnly: false, description: 'ComboBox style' },
      {
        name: 'Locked',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether text can be edited',
      },
    ];

    // Form properties
    this.formProperties = [
      { name: 'Caption', type: 'String', readOnly: false, description: 'Form title bar text' },
      { name: 'BackColor', type: 'Long', readOnly: false, description: 'Background color' },
      {
        name: 'BorderStyle',
        type: 'FormBorderStyleConstants',
        readOnly: false,
        description: 'Border style',
      },
      {
        name: 'ControlBox',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether control box is displayed',
      },
      { name: 'Enabled', type: 'Boolean', readOnly: false, description: 'Whether form is enabled' },
      { name: 'Font', type: 'StdFont', readOnly: false, description: 'Default font for controls' },
      { name: 'Icon', type: 'Picture', readOnly: false, description: 'Form icon' },
      {
        name: 'KeyPreview',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether form receives key events before controls',
      },
      {
        name: 'MaxButton',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether maximize button is displayed',
      },
      {
        name: 'MinButton',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether minimize button is displayed',
      },
      {
        name: 'Moveable',
        type: 'Boolean',
        readOnly: false,
        description: 'Whether form can be moved',
      },
      { name: 'Picture', type: 'Picture', readOnly: false, description: 'Background picture' },
      { name: 'ScaleHeight', type: 'Single', readOnly: false, description: 'Interior height' },
      { name: 'ScaleWidth', type: 'Single', readOnly: false, description: 'Interior width' },
      {
        name: 'StartUpPosition',
        type: 'StartUpPositionConstants',
        readOnly: false,
        description: 'Initial position',
      },
      { name: 'Visible', type: 'Boolean', readOnly: false, description: 'Whether form is visible' },
      {
        name: 'WindowState',
        type: 'FormWindowStateConstants',
        readOnly: false,
        description: 'Window state',
      },
    ];

    // Control methods
    this.controlMethods['TextBox'] = [
      {
        name: 'SetFocus',
        signature: 'SetFocus()',
        parameters: [],
        returnType: 'Void',
        description: 'Sets focus to the control',
        category: 'Methods',
      },
      {
        name: 'Refresh',
        signature: 'Refresh()',
        parameters: [],
        returnType: 'Void',
        description: 'Forces a complete repaint',
        category: 'Methods',
      },
    ];

    this.controlMethods['ListBox'] = [
      ...this.controlMethods['TextBox'],
      {
        name: 'AddItem',
        signature: 'AddItem(Item As String, [Index])',
        parameters: [
          { name: 'Item', type: 'String', optional: false, description: 'Item to add' },
          { name: 'Index', type: 'Integer', optional: true, description: 'Position to insert' },
        ],
        returnType: 'Void',
        description: 'Adds an item to the list',
        category: 'Methods',
      },
      {
        name: 'RemoveItem',
        signature: 'RemoveItem(Index As Integer)',
        parameters: [
          {
            name: 'Index',
            type: 'Integer',
            optional: false,
            description: 'Index of item to remove',
          },
        ],
        returnType: 'Void',
        description: 'Removes an item from the list',
        category: 'Methods',
      },
      {
        name: 'Clear',
        signature: 'Clear()',
        parameters: [],
        returnType: 'Void',
        description: 'Removes all items from the list',
        category: 'Methods',
      },
    ];

    this.controlMethods['ComboBox'] = [...this.controlMethods['ListBox']];

    // Form methods
    this.formMethods = [
      {
        name: 'Show',
        signature: 'Show([Modal])',
        parameters: [
          {
            name: 'Modal',
            type: 'Integer',
            optional: true,
            defaultValue: 'vbModeless',
            description: 'Modal state',
          },
        ],
        returnType: 'Void',
        description: 'Displays the form',
        category: 'Methods',
      },
      {
        name: 'Hide',
        signature: 'Hide()',
        parameters: [],
        returnType: 'Void',
        description: 'Hides the form',
        category: 'Methods',
      },
      {
        name: 'Move',
        signature: 'Move(Left, [Top], [Width], [Height])',
        parameters: [
          { name: 'Left', type: 'Single', optional: false, description: 'Left position' },
          { name: 'Top', type: 'Single', optional: true, description: 'Top position' },
          { name: 'Width', type: 'Single', optional: true, description: 'Width' },
          { name: 'Height', type: 'Single', optional: true, description: 'Height' },
        ],
        returnType: 'Void',
        description: 'Moves and optionally resizes the form',
        category: 'Methods',
      },
      {
        name: 'SetFocus',
        signature: 'SetFocus()',
        parameters: [],
        returnType: 'Void',
        description: 'Sets focus to the form',
        category: 'Methods',
      },
      {
        name: 'PrintForm',
        signature: 'PrintForm()',
        parameters: [],
        returnType: 'Void',
        description: 'Sends an image of the form to the printer',
        category: 'Methods',
      },
      {
        name: 'Cls',
        signature: 'Cls()',
        parameters: [],
        returnType: 'Void',
        description: 'Clears graphics and text from the form',
        category: 'Methods',
      },
      {
        name: 'Circle',
        signature: 'Circle(Step, X, Y, Radius, [Color], [Start], [End], [Aspect])',
        parameters: [
          { name: 'Step', type: 'Boolean', optional: false, description: 'Relative positioning' },
          { name: 'X', type: 'Single', optional: false, description: 'X coordinate' },
          { name: 'Y', type: 'Single', optional: false, description: 'Y coordinate' },
          { name: 'Radius', type: 'Single', optional: false, description: 'Radius' },
          { name: 'Color', type: 'Long', optional: true, description: 'Color' },
          { name: 'Start', type: 'Single', optional: true, description: 'Start angle' },
          { name: 'End', type: 'Single', optional: true, description: 'End angle' },
          { name: 'Aspect', type: 'Single', optional: true, description: 'Aspect ratio' },
        ],
        returnType: 'Void',
        description: 'Draws a circle, ellipse, or arc',
        category: 'Methods',
      },
      {
        name: 'Line',
        signature: 'Line(Step1, X1, Y1, Step2, X2, Y2, [Color], [B], [F])',
        parameters: [
          {
            name: 'Step1',
            type: 'Boolean',
            optional: false,
            description: 'Relative positioning for start',
          },
          { name: 'X1', type: 'Single', optional: false, description: 'Start X coordinate' },
          { name: 'Y1', type: 'Single', optional: false, description: 'Start Y coordinate' },
          {
            name: 'Step2',
            type: 'Boolean',
            optional: false,
            description: 'Relative positioning for end',
          },
          { name: 'X2', type: 'Single', optional: false, description: 'End X coordinate' },
          { name: 'Y2', type: 'Single', optional: false, description: 'End Y coordinate' },
          { name: 'Color', type: 'Long', optional: true, description: 'Color' },
          { name: 'B', type: 'Boolean', optional: true, description: 'Draw box' },
          { name: 'F', type: 'Boolean', optional: true, description: 'Fill box' },
        ],
        returnType: 'Void',
        description: 'Draws lines and rectangles',
        category: 'Methods',
      },
    ];
  }

  private initializeSnippets() {
    this.snippets = [
      {
        label: 'If...Then...Else',
        insertText: [
          'If ${1:condition} Then',
          "    ${2:'True code}",
          'Else',
          "    ${3:'False code}",
          'End If',
        ].join('\n'),
        detail: 'If-Then-Else statement',
        documentation: 'Conditional execution based on a Boolean expression',
      },
      {
        label: 'For...Next',
        insertText: ['For ${1:i} = ${2:1} To ${3:10}', "    ${4:'Loop code}", 'Next ${1:i}'].join(
          '\n'
        ),
        detail: 'For-Next loop',
        documentation: 'Repeats a block of statements a specified number of times',
      },
      {
        label: 'For Each...Next',
        insertText: [
          'For Each ${1:element} In ${2:collection}',
          "    ${3:'Process element}",
          'Next ${1:element}',
        ].join('\n'),
        detail: 'For Each loop',
        documentation: 'Repeats a block of statements for each element in a collection',
      },
      {
        label: 'Do While...Loop',
        insertText: ['Do While ${1:condition}', "    ${2:'Loop code}", 'Loop'].join('\n'),
        detail: 'Do While loop',
        documentation: 'Repeats a block of statements while a condition is True',
      },
      {
        label: 'Do Until...Loop',
        insertText: ['Do Until ${1:condition}', "    ${2:'Loop code}", 'Loop'].join('\n'),
        detail: 'Do Until loop',
        documentation: 'Repeats a block of statements until a condition becomes True',
      },
      {
        label: 'Select Case',
        insertText: [
          'Select Case ${1:expression}',
          '    Case ${2:value1}',
          "        ${3:'Code for value1}",
          '    Case ${4:value2}',
          "        ${5:'Code for value2}",
          '    Case Else',
          "        ${6:'Default code}",
          'End Select',
        ].join('\n'),
        detail: 'Select Case statement',
        documentation:
          'Executes one of several groups of statements based on the value of an expression',
      },
      {
        label: 'Sub Procedure',
        insertText: [
          'Private Sub ${1:SubName}(${2:parameters})',
          "    ${3:'Sub code}",
          'End Sub',
        ].join('\n'),
        detail: 'Sub procedure declaration',
        documentation: "Declares a Sub procedure that doesn't return a value",
      },
      {
        label: 'Function',
        insertText: [
          'Private Function ${1:FunctionName}(${2:parameters}) As ${3:ReturnType}',
          "    ${4:'Function code}",
          '    ${1:FunctionName} = ${5:returnValue}',
          'End Function',
        ].join('\n'),
        detail: 'Function declaration',
        documentation: 'Declares a Function procedure that returns a value',
      },
      {
        label: 'Error Handler',
        insertText: [
          'On Error GoTo ${1:ErrorHandler}',
          '',
          "${2:'Main code}",
          '',
          'Exit Sub',
          '',
          '${1:ErrorHandler}:',
          '    MsgBox "Error " & Err.Number & ": " & Err.Description',
          '    Resume Next',
        ].join('\n'),
        detail: 'Error handling block',
        documentation: 'Sets up error handling for a procedure',
      },
      {
        label: 'With Statement',
        insertText: [
          'With ${1:object}',
          '    .${2:Property1} = ${3:value1}',
          '    .${4:Property2} = ${5:value2}',
          'End With',
        ].join('\n'),
        detail: 'With statement',
        documentation: 'Executes a series of statements on a single object',
      },
      {
        label: 'Type Declaration',
        insertText: [
          'Private Type ${1:TypeName}',
          '    ${2:Field1} As ${3:DataType1}',
          '    ${4:Field2} As ${5:DataType2}',
          'End Type',
        ].join('\n'),
        detail: 'User-defined type',
        documentation: 'Declares a user-defined data type',
      },
      {
        label: 'Class Module Header',
        insertText: [
          "' Class: ${1:ClassName}",
          "' Description: ${2:Class description}",
          "' Author: ${3:Your name}",
          "' Date: ${4:" + new Date().toLocaleDateString() + '}',
          '',
          'Option Explicit',
          '',
          "' Private variables",
          'Private m_${5:VariableName} As ${6:DataType}',
          '',
          "' Class Initialize",
          'Private Sub Class_Initialize()',
          "    ${7:'Initialization code}",
          'End Sub',
          '',
          "' Class Terminate",
          'Private Sub Class_Terminate()',
          "    ${8:'Cleanup code}",
          'End Sub',
        ].join('\n'),
        detail: 'Class module template',
        documentation: 'Template for a new class module',
      },
      {
        label: 'Property Procedures',
        insertText: [
          "' Property: ${1:PropertyName}",
          'Private m_${1:PropertyName} As ${2:DataType}',
          '',
          'Public Property Get ${1:PropertyName}() As ${2:DataType}',
          '    ${1:PropertyName} = m_${1:PropertyName}',
          'End Property',
          '',
          'Public Property Let ${1:PropertyName}(ByVal vNewValue As ${2:DataType})',
          '    m_${1:PropertyName} = vNewValue',
          'End Property',
        ].join('\n'),
        detail: 'Property Get/Let procedures',
        documentation: 'Property procedures for getting and setting a value',
      },
      {
        label: 'ADO Connection',
        insertText: [
          'Dim conn As ADODB.Connection',
          'Set conn = New ADODB.Connection',
          '',
          'conn.ConnectionString = "${1:Provider=SQLOLEDB;Data Source=server;Initial Catalog=database;User ID=user;Password=pass}"',
          'conn.Open',
          '',
          "' Use connection",
          "${2:'Database operations}",
          '',
          'conn.Close',
          'Set conn = Nothing',
        ].join('\n'),
        detail: 'ADO database connection',
        documentation: 'Template for ADO database connection',
      },
      {
        label: 'File Operations',
        insertText: [
          'Dim fileNum As Integer',
          'fileNum = FreeFile',
          '',
          'Open "${1:filename.txt}" For ${2|Input,Output,Append|} As #fileNum',
          '',
          "${3:'File operations}",
          '',
          'Close #fileNum',
        ].join('\n'),
        detail: 'File I/O operations',
        documentation: 'Template for file input/output operations',
      },
      {
        label: 'API Declaration',
        insertText: [
          'Private Declare Function ${1:APIName} Lib "${2:library.dll}" _',
          '    (${3:parameters}) As ${4:ReturnType}',
        ].join('\n'),
        detail: 'Windows API declaration',
        documentation: 'Declares a Windows API function',
      },
    ];
  }
}

// Export singleton instance
export const vb6IntelliSense = VB6IntelliSenseService.getInstance();
