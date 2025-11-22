/**
 * IntelliSense Engine - Complete VB6 IntelliSense Implementation
 * Provides auto-completion, syntax highlighting, parameter hints, and code assistance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EventEmitter } from 'events';

// IntelliSense Constants
export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
  Folder = 19,
  EnumMember = 20,
  Constant = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4
}

// IntelliSense Interfaces
export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  sortText?: string;
  filterText?: string;
  insertText?: string;
  parameters?: ParameterInfo[];
  returnType?: string;
  scope?: string;
}

export interface ParameterInfo {
  label: string;
  documentation?: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface SignatureHelp {
  signatures: SignatureInformation[];
  activeSignature: number;
  activeParameter: number;
}

export interface SignatureInformation {
  label: string;
  documentation?: string;
  parameters: ParameterInfo[];
}

export interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  message: string;
  code?: string;
  source?: string;
}

export interface Hover {
  contents: string[];
  range?: Range;
}

export interface Definition {
  uri: string;
  range: Range;
}

export interface Symbol {
  name: string;
  kind: CompletionItemKind;
  location: Definition;
  containerName?: string;
}

// VB6 Language Database
export class VB6LanguageDatabase {
  private _keywords: Set<string> = new Set();
  private _functions: Map<string, CompletionItem> = new Map();
  private _objects: Map<string, CompletionItem> = new Map();
  private _constants: Map<string, CompletionItem> = new Map();
  private _types: Map<string, CompletionItem> = new Map();
  private _controls: Map<string, CompletionItem> = new Map();
  private _events: Map<string, CompletionItem> = new Map();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // VB6 Keywords
    const keywords = [
      'And', 'As', 'Boolean', 'ByRef', 'Byte', 'ByVal', 'Call', 'Case', 'Class', 'Const',
      'Currency', 'Date', 'Declare', 'Dim', 'Do', 'Double', 'Each', 'Else', 'ElseIf', 'End',
      'Enum', 'Eqv', 'Error', 'Exit', 'False', 'For', 'Function', 'Get', 'Global', 'GoSub',
      'GoTo', 'If', 'Imp', 'In', 'Integer', 'Is', 'Let', 'Like', 'Long', 'Loop', 'Mod',
      'New', 'Next', 'Not', 'Nothing', 'Object', 'On', 'Option', 'Or', 'ParamArray',
      'Preserve', 'Private', 'Property', 'Public', 'ReDim', 'Resume', 'Return', 'Select',
      'Set', 'Single', 'Static', 'Step', 'Stop', 'String', 'Sub', 'Then', 'To', 'True',
      'Type', 'Until', 'Variant', 'Wend', 'While', 'With', 'Xor'
    ];

    keywords.forEach(keyword => {
      this._keywords.add(keyword.toLowerCase());
    });

    // VB6 Built-in Functions
    this.addFunction('Abs', 'Returns the absolute value of a number', 'Number', [
      { label: 'number', type: 'Variant', documentation: 'Any valid numeric expression' }
    ]);

    this.addFunction('Array', 'Returns a Variant containing an array', 'Variant', [
      { label: 'arglist', type: 'Variant', documentation: 'Delimited list of values' }
    ]);

    this.addFunction('Asc', 'Returns the character code of the first letter in a string', 'Integer', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('Chr', 'Returns the character associated with the specified character code', 'String', [
      { label: 'charcode', type: 'Long', documentation: 'A Long that identifies a character' }
    ]);

    this.addFunction('CInt', 'Converts an expression to an Integer', 'Integer', [
      { label: 'expression', type: 'Variant', documentation: 'Any valid string or numeric expression' }
    ]);

    this.addFunction('CLng', 'Converts an expression to a Long', 'Long', [
      { label: 'expression', type: 'Variant', documentation: 'Any valid string or numeric expression' }
    ]);

    this.addFunction('CStr', 'Converts an expression to a String', 'String', [
      { label: 'expression', type: 'Variant', documentation: 'Any valid string or numeric expression' }
    ]);

    this.addFunction('Date', 'Returns the current system date', 'Variant', []);

    this.addFunction('DateAdd', 'Returns a date to which a specified time interval has been added', 'Variant', [
      { label: 'interval', type: 'String', documentation: 'String expression that is the interval you want to add' },
      { label: 'number', type: 'Double', documentation: 'Number of intervals you want to add' },
      { label: 'date', type: 'Variant', documentation: 'Date to which interval is added' }
    ]);

    this.addFunction('DateDiff', 'Returns the number of time intervals between two dates', 'Long', [
      { label: 'interval', type: 'String', documentation: 'String expression that is the interval you want to use' },
      { label: 'date1', type: 'Variant', documentation: 'First date' },
      { label: 'date2', type: 'Variant', documentation: 'Second date' }
    ]);

    this.addFunction('DatePart', 'Returns the specified part of a given date', 'Integer', [
      { label: 'interval', type: 'String', documentation: 'String expression that is the interval you want to return' },
      { label: 'date', type: 'Variant', documentation: 'Date you want to evaluate' }
    ]);

    this.addFunction('Dir', 'Returns a string representing the name of a file, directory, or folder', 'String', [
      { label: 'pathname', type: 'String', documentation: 'String expression that specifies a file name', optional: true },
      { label: 'attributes', type: 'VbFileAttribute', documentation: 'Constant or numeric expression', optional: true }
    ]);

    this.addFunction('Format', 'Returns a string formatted according to instructions in a format expression', 'String', [
      { label: 'expression', type: 'Variant', documentation: 'Any valid expression' },
      { label: 'format', type: 'String', documentation: 'A valid named or user-defined format expression', optional: true }
    ]);

    this.addFunction('InStr', 'Returns the position of the first occurrence of one string within another', 'Long', [
      { label: 'start', type: 'Long', documentation: 'Starting position for each search', optional: true },
      { label: 'string1', type: 'String', documentation: 'String being searched' },
      { label: 'string2', type: 'String', documentation: 'String being searched for' },
      { label: 'compare', type: 'VbCompareMethod', documentation: 'Comparison method', optional: true }
    ]);

    this.addFunction('LCase', 'Returns a string that has been converted to lowercase', 'String', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('Left', 'Returns a specified number of characters from the left side of a string', 'String', [
      { label: 'string', type: 'String', documentation: 'String expression from which the leftmost characters are returned' },
      { label: 'length', type: 'Long', documentation: 'Number of characters to return' }
    ]);

    this.addFunction('Len', 'Returns the number of characters in a string', 'Long', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('LTrim', 'Returns a string without leading spaces', 'String', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('Mid', 'Returns a specified number of characters from a string', 'String', [
      { label: 'string', type: 'String', documentation: 'String expression from which characters are returned' },
      { label: 'start', type: 'Long', documentation: 'Starting position of characters to return' },
      { label: 'length', type: 'Long', documentation: 'Number of characters to return', optional: true }
    ]);

    this.addFunction('MsgBox', 'Displays a message in a dialog box', 'VbMsgBoxResult', [
      { label: 'prompt', type: 'String', documentation: 'String expression displayed as the message' },
      { label: 'buttons', type: 'VbMsgBoxStyle', documentation: 'Sum of values that specify buttons and icon', optional: true },
      { label: 'title', type: 'String', documentation: 'String expression displayed in title bar', optional: true },
      { label: 'helpfile', type: 'String', documentation: 'String expression identifying Help file', optional: true },
      { label: 'context', type: 'Long', documentation: 'Help context number', optional: true }
    ]);

    this.addFunction('Now', 'Returns the current date and time according to the setting of your system', 'Variant', []);

    this.addFunction('Replace', 'Returns a string in which a specified substring has been replaced', 'String', [
      { label: 'expression', type: 'String', documentation: 'String expression containing substring to replace' },
      { label: 'find', type: 'String', documentation: 'Substring being searched for' },
      { label: 'replace', type: 'String', documentation: 'Replacement substring' },
      { label: 'start', type: 'Long', documentation: 'Position to begin search', optional: true },
      { label: 'count', type: 'Long', documentation: 'Number of substitutions to perform', optional: true },
      { label: 'compare', type: 'VbCompareMethod', documentation: 'Comparison method', optional: true }
    ]);

    this.addFunction('Right', 'Returns a specified number of characters from the right side of a string', 'String', [
      { label: 'string', type: 'String', documentation: 'String expression from which the rightmost characters are returned' },
      { label: 'length', type: 'Long', documentation: 'Number of characters to return' }
    ]);

    this.addFunction('RTrim', 'Returns a string without trailing spaces', 'String', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('Space', 'Returns a string consisting of the specified number of spaces', 'String', [
      { label: 'number', type: 'Long', documentation: 'Number of spaces you want in the string' }
    ]);

    this.addFunction('Split', 'Returns a zero-based, one-dimensional array containing a specified number of substrings', 'String()', [
      { label: 'expression', type: 'String', documentation: 'String expression containing substrings and delimiters' },
      { label: 'delimiter', type: 'String', documentation: 'String character used to identify substring limits', optional: true },
      { label: 'limit', type: 'Long', documentation: 'Number of substrings to be returned', optional: true },
      { label: 'compare', type: 'VbCompareMethod', documentation: 'Comparison method', optional: true }
    ]);

    this.addFunction('Str', 'Returns a string representation of a number', 'String', [
      { label: 'number', type: 'Variant', documentation: 'Any valid numeric expression' }
    ]);

    this.addFunction('String', 'Returns a repeating character string of the length specified', 'String', [
      { label: 'number', type: 'Long', documentation: 'Length of the returned string' },
      { label: 'character', type: 'Variant', documentation: 'Character code or string expression' }
    ]);

    this.addFunction('Time', 'Returns the current system time', 'Variant', []);

    this.addFunction('Trim', 'Returns a string without leading and trailing spaces', 'String', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('UCase', 'Returns a string that has been converted to uppercase', 'String', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    this.addFunction('Val', 'Returns the numbers contained in a string as a numeric value', 'Double', [
      { label: 'string', type: 'String', documentation: 'Any valid string expression' }
    ]);

    // VB6 Objects
    this.addObject('App', 'Application object', [
      { name: 'Comments', type: 'String', documentation: 'Comments about the application' },
      { name: 'CompanyName', type: 'String', documentation: 'Company name' },
      { name: 'EXEName', type: 'String', documentation: 'Name of the executable file' },
      { name: 'FileDescription', type: 'String', documentation: 'Description of the file' },
      { name: 'HelpFile', type: 'String', documentation: 'Path to the help file' },
      { name: 'LegalCopyright', type: 'String', documentation: 'Copyright information' },
      { name: 'LegalTrademarks', type: 'String', documentation: 'Trademark information' },
      { name: 'Major', type: 'Integer', documentation: 'Major version number' },
      { name: 'Minor', type: 'Integer', documentation: 'Minor version number' },
      { name: 'Path', type: 'String', documentation: 'Path where the application is located' },
      { name: 'ProductName', type: 'String', documentation: 'Name of the product' },
      { name: 'Revision', type: 'Integer', documentation: 'Revision number' },
      { name: 'Title', type: 'String', documentation: 'Title of the application' }
    ]);

    this.addObject('Screen', 'Screen object', [
      { name: 'ActiveControl', type: 'Control', documentation: 'Currently active control' },
      { name: 'ActiveForm', type: 'Form', documentation: 'Currently active form' },
      { name: 'Height', type: 'Single', documentation: 'Height of the screen in twips' },
      { name: 'Width', type: 'Single', documentation: 'Width of the screen in twips' },
      { name: 'TwipsPerPixelX', type: 'Single', documentation: 'Number of twips per pixel horizontally' },
      { name: 'TwipsPerPixelY', type: 'Single', documentation: 'Number of twips per pixel vertically' }
    ]);

    this.addObject('Printer', 'Printer object', [
      { name: 'DeviceName', type: 'String', documentation: 'Name of the printer device' },
      { name: 'DriverName', type: 'String', documentation: 'Name of the printer driver' },
      { name: 'Height', type: 'Single', documentation: 'Height of the printable area' },
      { name: 'Width', type: 'Single', documentation: 'Width of the printable area' },
      { name: 'Orientation', type: 'Integer', documentation: 'Orientation of the paper' },
      { name: 'PaperSize', type: 'Integer', documentation: 'Size of the paper' },
      { name: 'ColorMode', type: 'Integer', documentation: 'Color mode of the printer' },
      { name: 'Copies', type: 'Integer', documentation: 'Number of copies to print' }
    ]);

    // VB6 Constants
    this.addConstant('vbOK', '1', 'OK button was clicked');
    this.addConstant('vbCancel', '2', 'Cancel button was clicked');
    this.addConstant('vbAbort', '3', 'Abort button was clicked');
    this.addConstant('vbRetry', '4', 'Retry button was clicked');
    this.addConstant('vbIgnore', '5', 'Ignore button was clicked');
    this.addConstant('vbYes', '6', 'Yes button was clicked');
    this.addConstant('vbNo', '7', 'No button was clicked');

    this.addConstant('vbCritical', '16', 'Critical message icon');
    this.addConstant('vbQuestion', '32', 'Warning query icon');
    this.addConstant('vbExclamation', '48', 'Warning message icon');
    this.addConstant('vbInformation', '64', 'Information message icon');

    this.addConstant('vbCrLf', 'Chr(13) + Chr(10)', 'Carriage return and line feed');
    this.addConstant('vbCr', 'Chr(13)', 'Carriage return');
    this.addConstant('vbLf', 'Chr(10)', 'Line feed');
    this.addConstant('vbTab', 'Chr(9)', 'Tab character');
    this.addConstant('vbNullString', '""', 'Empty string');

    // VB6 Controls
    this.addControl('TextBox', 'Text input control', [
      { name: 'Text', type: 'String', documentation: 'The text displayed in the control' },
      { name: 'MaxLength', type: 'Integer', documentation: 'Maximum number of characters' },
      { name: 'PasswordChar', type: 'String', documentation: 'Character to display for passwords' },
      { name: 'MultiLine', type: 'Boolean', documentation: 'Allow multiple lines' },
      { name: 'ScrollBars', type: 'Integer', documentation: 'Scroll bar options' },
      { name: 'Alignment', type: 'Integer', documentation: 'Text alignment' },
      { name: 'Locked', type: 'Boolean', documentation: 'Prevent user input' },
      { name: 'SelStart', type: 'Long', documentation: 'Starting position of selected text' },
      { name: 'SelLength', type: 'Long', documentation: 'Length of selected text' },
      { name: 'SelText', type: 'String', documentation: 'Selected text' }
    ]);

    this.addControl('Label', 'Text display control', [
      { name: 'Caption', type: 'String', documentation: 'The text displayed on the label' },
      { name: 'Alignment', type: 'Integer', documentation: 'Text alignment' },
      { name: 'AutoSize', type: 'Boolean', documentation: 'Automatically resize to fit content' },
      { name: 'WordWrap', type: 'Boolean', documentation: 'Wrap text to multiple lines' },
      { name: 'UseMnemonic', type: 'Boolean', documentation: 'Use ampersand for access keys' }
    ]);

    this.addControl('CommandButton', 'Button control', [
      { name: 'Caption', type: 'String', documentation: 'The text displayed on the button' },
      { name: 'Default', type: 'Boolean', documentation: 'Default button for the form' },
      { name: 'Cancel', type: 'Boolean', documentation: 'Cancel button for the form' },
      { name: 'Style', type: 'Integer', documentation: 'Button style (standard or graphical)' },
      { name: 'Picture', type: 'StdPicture', documentation: 'Picture displayed on the button' },
      { name: 'DisabledPicture', type: 'StdPicture', documentation: 'Picture when disabled' },
      { name: 'DownPicture', type: 'StdPicture', documentation: 'Picture when pressed' }
    ]);

    this.addControl('ListBox', 'List selection control', [
      { name: 'List', type: 'String', documentation: 'Array of list items' },
      { name: 'ListCount', type: 'Integer', documentation: 'Number of items in the list' },
      { name: 'ListIndex', type: 'Integer', documentation: 'Index of selected item' },
      { name: 'Selected', type: 'Boolean', documentation: 'Selection state of items' },
      { name: 'MultiSelect', type: 'Integer', documentation: 'Multiple selection mode' },
      { name: 'Sorted', type: 'Boolean', documentation: 'Sort items alphabetically' },
      { name: 'Style', type: 'Integer', documentation: 'List box style' },
      { name: 'TopIndex', type: 'Integer', documentation: 'Index of topmost visible item' }
    ]);

    this.addControl('ComboBox', 'Combo box control', [
      { name: 'Text', type: 'String', documentation: 'Text in the edit portion' },
      { name: 'List', type: 'String', documentation: 'Array of list items' },
      { name: 'ListCount', type: 'Integer', documentation: 'Number of items in the list' },
      { name: 'ListIndex', type: 'Integer', documentation: 'Index of selected item' },
      { name: 'Style', type: 'Integer', documentation: 'Combo box style' },
      { name: 'Sorted', type: 'Boolean', documentation: 'Sort items alphabetically' }
    ]);

    // VB6 Events
    this.addEvent('Click', 'Occurs when the user clicks the control');
    this.addEvent('DblClick', 'Occurs when the user double-clicks the control');
    this.addEvent('MouseDown', 'Occurs when the user presses a mouse button');
    this.addEvent('MouseUp', 'Occurs when the user releases a mouse button');
    this.addEvent('MouseMove', 'Occurs when the user moves the mouse');
    this.addEvent('KeyDown', 'Occurs when the user presses a key');
    this.addEvent('KeyUp', 'Occurs when the user releases a key');
    this.addEvent('KeyPress', 'Occurs when the user presses and releases a key');
    this.addEvent('GotFocus', 'Occurs when the control receives focus');
    this.addEvent('LostFocus', 'Occurs when the control loses focus');
    this.addEvent('Change', 'Occurs when the content of the control changes');
    this.addEvent('Load', 'Occurs when a form is loaded');
    this.addEvent('Unload', 'Occurs when a form is unloaded');
    this.addEvent('Resize', 'Occurs when a form or control is resized');
  }

  private addFunction(name: string, documentation: string, returnType: string, parameters: ParameterInfo[] = []): void {
    this._functions.set(name.toLowerCase(), {
      label: name,
      kind: CompletionItemKind.Function,
      detail: `Function ${name}${parameters.length > 0 ? '(' + parameters.map(p => `${p.label}${p.optional ? '?' : ''}: ${p.type}`).join(', ') + ')' : '()'}: ${returnType}`,
      documentation,
      parameters,
      returnType,
      insertText: `${name}(${parameters.map((p, i) => `\${${i + 1}:${p.label}}`).join(', ')})`
    });
  }

  private addObject(name: string, documentation: string, members: Array<{ name: string; type: string; documentation: string }>): void {
    this._objects.set(name.toLowerCase(), {
      label: name,
      kind: CompletionItemKind.Class,
      detail: `Object ${name}`,
      documentation,
      insertText: name
    });

    // Add object members
    members.forEach(member => {
      this._objects.set(`${name.toLowerCase()}.${member.name.toLowerCase()}`, {
        label: member.name,
        kind: CompletionItemKind.Property,
        detail: `Property ${member.name}: ${member.type}`,
        documentation: member.documentation,
        insertText: member.name
      });
    });
  }

  private addConstant(name: string, value: string, documentation: string): void {
    this._constants.set(name.toLowerCase(), {
      label: name,
      kind: CompletionItemKind.Constant,
      detail: `Const ${name} = ${value}`,
      documentation,
      insertText: name
    });
  }

  private addControl(name: string, documentation: string, properties: Array<{ name: string; type: string; documentation: string }>): void {
    this._controls.set(name.toLowerCase(), {
      label: name,
      kind: CompletionItemKind.Class,
      detail: `Control ${name}`,
      documentation,
      insertText: name
    });

    // Add control properties
    properties.forEach(prop => {
      this._controls.set(`${name.toLowerCase()}.${prop.name.toLowerCase()}`, {
        label: prop.name,
        kind: CompletionItemKind.Property,
        detail: `Property ${prop.name}: ${prop.type}`,
        documentation: prop.documentation,
        insertText: prop.name
      });
    });
  }

  private addEvent(name: string, documentation: string): void {
    this._events.set(name.toLowerCase(), {
      label: name,
      kind: CompletionItemKind.Event,
      detail: `Event ${name}`,
      documentation,
      insertText: name
    });
  }

  // Public methods for retrieving completions
  getKeywords(): CompletionItem[] {
    return Array.from(this._keywords).map(keyword => ({
      label: keyword,
      kind: CompletionItemKind.Keyword,
      detail: `Keyword ${keyword}`,
      insertText: keyword
    }));
  }

  getFunctions(): CompletionItem[] {
    return Array.from(this._functions.values());
  }

  getObjects(): CompletionItem[] {
    return Array.from(this._objects.values());
  }

  getConstants(): CompletionItem[] {
    return Array.from(this._constants.values());
  }

  getControls(): CompletionItem[] {
    return Array.from(this._controls.values());
  }

  getEvents(): CompletionItem[] {
    return Array.from(this._events.values());
  }

  getAllCompletions(): CompletionItem[] {
    return [
      ...this.getKeywords(),
      ...this.getFunctions(),
      ...this.getObjects(),
      ...this.getConstants(),
      ...this.getControls(),
      ...this.getEvents()
    ];
  }

  findCompletion(name: string): CompletionItem | undefined {
    const lowerName = name.toLowerCase();
    return this._functions.get(lowerName) ||
           this._objects.get(lowerName) ||
           this._constants.get(lowerName) ||
           this._controls.get(lowerName) ||
           this._events.get(lowerName);
  }

  getObjectMembers(objectName: string): CompletionItem[] {
    const prefix = objectName.toLowerCase() + '.';
    const members: CompletionItem[] = [];
    
    for (const [key, item] of this._objects) {
      if (key.startsWith(prefix) && key.indexOf('.', prefix.length) === -1) {
        members.push(item);
      }
    }
    
    for (const [key, item] of this._controls) {
      if (key.startsWith(prefix) && key.indexOf('.', prefix.length) === -1) {
        members.push(item);
      }
    }
    
    return members;
  }
}

// IntelliSense Engine
export class IntelliSenseEngine extends EventEmitter {
  private _database: VB6LanguageDatabase;
  private _userSymbols: Map<string, CompletionItem> = new Map();
  private _currentDocument: string = '';
  private _diagnostics: Diagnostic[] = [];

  constructor() {
    super();
    this._database = new VB6LanguageDatabase();
  }

  setDocument(content: string): void {
    this._currentDocument = content;
    this.parseDocument(content);
    this.emit('documentChanged', content);
  }

  private parseDocument(content: string): void {
    const lines = content.split('\n');
    this._userSymbols.clear();
    this._diagnostics = [];

    lines.forEach((line, lineIndex) => {
      this.parseLine(line, lineIndex);
    });

    this.emit('diagnosticsChanged', this._diagnostics);
  }

  private parseLine(line: string, lineIndex: number): void {
    const trimmedLine = line.trim();
    
    // Parse variable declarations
    const dimMatch = trimmedLine.match(/^\s*Dim\s+(\w+)\s+As\s+(\w+)/i);
    if (dimMatch) {
      const [, varName, varType] = dimMatch;
      this._userSymbols.set(varName.toLowerCase(), {
        label: varName,
        kind: CompletionItemKind.Variable,
        detail: `Dim ${varName} As ${varType}`,
        documentation: `User-defined variable of type ${varType}`,
        insertText: varName
      });
    }

    // Parse function declarations
    const funcMatch = trimmedLine.match(/^\s*(Private\s+|Public\s+)?Function\s+(\w+)\s*\([^)]*\)\s+As\s+(\w+)/i);
    if (funcMatch) {
      const [, scope, funcName, returnType] = funcMatch;
      this._userSymbols.set(funcName.toLowerCase(), {
        label: funcName,
        kind: CompletionItemKind.Function,
        detail: `${scope || ''}Function ${funcName}() As ${returnType}`,
        documentation: 'User-defined function',
        insertText: funcName,
        scope: scope ? scope.trim() : 'Public'
      });
    }

    // Parse subroutine declarations
    const subMatch = trimmedLine.match(/^\s*(Private\s+|Public\s+)?Sub\s+(\w+)\s*\(/i);
    if (subMatch) {
      const [, scope, subName] = subMatch;
      this._userSymbols.set(subName.toLowerCase(), {
        label: subName,
        kind: CompletionItemKind.Method,
        detail: `${scope || ''}Sub ${subName}()`,
        documentation: 'User-defined subroutine',
        insertText: subName,
        scope: scope ? scope.trim() : 'Public'
      });
    }

    // Parse constant declarations
    const constMatch = trimmedLine.match(/^\s*(Private\s+|Public\s+)?Const\s+(\w+)\s*=\s*(.+)/i);
    if (constMatch) {
      const [, scope, constName, value] = constMatch;
      this._userSymbols.set(constName.toLowerCase(), {
        label: constName,
        kind: CompletionItemKind.Constant,
        detail: `${scope || ''}Const ${constName} = ${value}`,
        documentation: 'User-defined constant',
        insertText: constName,
        scope: scope ? scope.trim() : 'Public'
      });
    }

    // Simple syntax checking
    if (trimmedLine && !trimmedLine.startsWith("'")) {
      // Check for unmatched parentheses
      const openParens = (trimmedLine.match(/\(/g) || []).length;
      const closeParens = (trimmedLine.match(/\)/g) || []).length;
      
      if (openParens !== closeParens) {
        this._diagnostics.push({
          range: {
            start: { line: lineIndex, character: 0 },
            end: { line: lineIndex, character: line.length }
          },
          severity: DiagnosticSeverity.Error,
          message: 'Unmatched parentheses',
          code: 'E001',
          source: 'VB6 IntelliSense'
        });
      }

      // Check for unknown identifiers (simplified)
      const words = trimmedLine.match(/\b[a-zA-Z_]\w*\b/g) || [];
      words.forEach(word => {
        if (!this.isKnownIdentifier(word)) {
          // Only warn for capitalized words (likely intended as identifiers)
          if (/^[A-Z]/.test(word)) {
            this._diagnostics.push({
              range: {
                start: { line: lineIndex, character: line.indexOf(word) },
                end: { line: lineIndex, character: line.indexOf(word) + word.length }
              },
              severity: DiagnosticSeverity.Warning,
              message: `Unknown identifier: ${word}`,
              code: 'W001',
              source: 'VB6 IntelliSense'
            });
          }
        }
      });
    }
  }

  private isKnownIdentifier(identifier: string): boolean {
    const lower = identifier.toLowerCase();
    return this._database.findCompletion(lower) !== undefined ||
           this._userSymbols.has(lower) ||
           this._database.getKeywords().some(k => k.label.toLowerCase() === lower);
  }

  getCompletions(position: Position, context?: string): CompletionItem[] {
    const completions: CompletionItem[] = [];
    
    // Add built-in completions
    completions.push(...this._database.getAllCompletions());
    
    // Add user-defined symbols
    completions.push(...Array.from(this._userSymbols.values()));
    
    // Context-specific completions
    if (context) {
      const contextLower = context.toLowerCase();
      
      // Object member access (e.g., "App." should show App properties)
      if (contextLower.endsWith('.')) {
        const objectName = contextLower.slice(0, -1);
        const members = this._database.getObjectMembers(objectName);
        return members;
      }
      
      // Filter completions based on context
      return completions.filter(item => 
        item.label.toLowerCase().startsWith(contextLower) ||
        item.filterText?.toLowerCase().startsWith(contextLower)
      );
    }
    
    return completions;
  }

  getSignatureHelp(position: Position, context: string): SignatureHelp | null {
    // Find function call context
    const funcMatch = context.match(/(\w+)\s*\(\s*([^)]*)$/);
    if (!funcMatch) return null;
    
    const [, funcName, params] = funcMatch;
    const completion = this._database.findCompletion(funcName) || this._userSymbols.get(funcName.toLowerCase());
    
    if (!completion || !completion.parameters) return null;
    
    // Count current parameter based on commas
    const paramCount = params ? params.split(',').length - 1 : 0;
    
    return {
      signatures: [{
        label: `${funcName}(${completion.parameters.map(p => `${p.label}: ${p.type}`).join(', ')})`,
        documentation: completion.documentation,
        parameters: completion.parameters
      }],
      activeSignature: 0,
      activeParameter: Math.min(paramCount, completion.parameters.length - 1)
    };
  }

  getHover(position: Position, word: string): Hover | null {
    const completion = this._database.findCompletion(word) || this._userSymbols.get(word.toLowerCase());
    
    if (!completion) return null;
    
    const contents = [
      completion.detail || completion.label,
      completion.documentation || ''
    ].filter(Boolean);
    
    return {
      contents,
      range: {
        start: { line: position.line, character: position.character - word.length },
        end: { line: position.line, character: position.character }
      }
    };
  }

  getDiagnostics(): Diagnostic[] {
    return this._diagnostics;
  }

  findDefinition(position: Position, word: string): Definition | null {
    // For built-in items, we don't have source locations
    const completion = this._userSymbols.get(word.toLowerCase());
    if (!completion) return null;
    
    // In a real implementation, we would track where symbols were defined
    return {
      uri: 'current-document',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: word.length }
      }
    };
  }

  getDocumentSymbols(): Symbol[] {
    return Array.from(this._userSymbols.values()).map(item => ({
      name: item.label,
      kind: item.kind,
      location: {
        uri: 'current-document',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: item.label.length }
        }
      },
      containerName: item.scope
    }));
  }

  formatDocument(content: string): string {
    const lines = content.split('\n');
    const formatted: string[] = [];
    let indentLevel = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Decrease indent for End statements
      if (/^\s*End\s+(If|Function|Sub|With|Select|For|Do|While)\b/i.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Decrease indent for Else, ElseIf, Case
      if (/^\s*(Else|ElseIf|Case)\b/i.test(trimmed)) {
        formatted.push('    '.repeat(Math.max(0, indentLevel - 1)) + trimmed);
      } else {
        formatted.push('    '.repeat(indentLevel) + trimmed);
      }
      
      // Increase indent for certain statements
      if (/^\s*(If\b.*Then\s*$|Function\b|Sub\b|With\b|Select\s+Case\b|For\b|Do\b|While\b)/i.test(trimmed)) {
        indentLevel++;
      }
      
      // Increase indent for Else
      if (/^\s*Else\s*$/i.test(trimmed)) {
        indentLevel++;
      }
    });
    
    return formatted.join('\n');
  }

  get Database(): VB6LanguageDatabase {
    return this._database;
  }

  get UserSymbols(): Map<string, CompletionItem> {
    return this._userSymbols;
  }
}

// IntelliSense UI Component
export interface IntelliSenseUIProps {
  engine: IntelliSenseEngine;
  onInsertCompletion?: (completion: CompletionItem) => void;
  position?: { x: number; y: number };
  visible?: boolean;
  completions?: CompletionItem[];
  selectedIndex?: number;
}

export const IntelliSenseUI: React.FC<IntelliSenseUIProps> = ({
  engine,
  onInsertCompletion,
  position = { x: 0, y: 0 },
  visible = false,
  completions = [],
  selectedIndex = 0
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && visible) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, visible]);

  const handleItemClick = (completion: CompletionItem) => {
    onInsertCompletion?.(completion);
  };

  const getKindIcon = (kind: CompletionItemKind): string => {
    switch (kind) {
      case CompletionItemKind.Function: return '𝑓';
      case CompletionItemKind.Method: return '⚡';
      case CompletionItemKind.Property: return '🔧';
      case CompletionItemKind.Variable: return '📊';
      case CompletionItemKind.Constant: return '🔒';
      case CompletionItemKind.Keyword: return '🔑';
      case CompletionItemKind.Class: return '📦';
      case CompletionItemKind.Event: return '⚡';
      default: return '📄';
    }
  };

  if (!visible || completions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '400px',
        maxHeight: '300px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        overflow: 'hidden',
        fontFamily: 'Consolas, Monaco, monospace',
        fontSize: '12px'
      }}
    >
      <div
        ref={listRef}
        style={{
          maxHeight: '300px',
          overflowY: 'auto'
        }}
      >
        {completions.map((completion, index) => (
          <div
            key={`${completion.label}-${index}`}
            style={{
              padding: '4px 8px',
              cursor: 'pointer',
              backgroundColor: index === selectedIndex ? '#e6f3ff' : 'transparent',
              borderLeft: index === selectedIndex ? '3px solid #007acc' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => handleItemClick(completion)}
            onMouseEnter={() => {
              // Handle mouse hover if needed
            }}
          >
            <span style={{ width: '16px', textAlign: 'center' }}>
              {getKindIcon(completion.kind)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>
                {completion.label}
              </div>
              {completion.detail && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '1px' }}>
                  {completion.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {completions.length > 0 && (
        <div
          style={{
            padding: '4px 8px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f8f8f8',
            fontSize: '10px',
            color: '#666'
          }}
        >
          {completions.length} items
        </div>
      )}
    </div>
  );
};

export default IntelliSenseEngine;