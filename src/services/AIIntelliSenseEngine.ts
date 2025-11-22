// Ultra-Think AI-Powered IntelliSense Engine
// 🧠 Système révolutionnaire d'autocomplétion contextuelle avec ML intégré

import { VB6Parser } from '../utils/vb6Parser';
import { VB6SemanticAnalyzer } from '../utils/vb6SemanticAnalyzer';
import { Control } from '../context/types';

// Types pour le système IntelliSense
export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText: string;
  insertTextRules?: InsertTextRule[];
  sortText?: string;
  filterText?: string;
  preselect?: boolean;
  score: number; // AI confidence score
  source: 'builtin' | 'user' | 'ai' | 'snippet' | 'api';
  tags?: CompletionItemTag[];
  commitCharacters?: string[];
  additionalTextEdits?: TextEdit[];
  command?: Command;
}

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
  TypeParameter = 25,
  AIGenerated = 26
}

export enum CompletionItemTag {
  Deprecated = 1,
  AIGenerated = 2,
  Popular = 3,
  Recent = 4,
  Optimized = 5
}

export interface InsertTextRule {
  type: 'replace' | 'insert' | 'snippet';
  range?: { start: number; end: number };
}

export interface TextEdit {
  range: { start: Position; end: Position };
  newText: string;
}

export interface Position {
  line: number;
  character: number;
}

export interface Command {
  title: string;
  command: string;
  arguments?: any[];
}

// Context pour suggestions intelligentes
export interface CompletionContext {
  code: string;
  position: Position;
  triggerCharacter?: string;
  activeForm?: string;
  controls: Control[];
  recentCompletions: string[];
  userPatterns: Map<string, number>; // Pattern -> usage count
  projectType?: 'desktop' | 'web' | 'database' | 'game';
}

// Configuration ML
interface MLConfig {
  enableAI: boolean;
  personalizedSuggestions: boolean;
  contextWindow: number;
  maxSuggestions: number;
  confidenceThreshold: number;
  learningRate: number;
}

// Pattern recognition pour apprentissage
interface CodePattern {
  id: string;
  pattern: RegExp;
  context: string;
  frequency: number;
  lastUsed: Date;
  suggestions: string[];
  category: 'control' | 'event' | 'method' | 'property' | 'pattern';
}

export class AIIntelliSenseEngine {
  private static instance: AIIntelliSenseEngine;
  
  // Core components
  private parser: VB6Parser;
  private analyzer: VB6SemanticAnalyzer;
  
  // AI/ML components
  private userPatterns: Map<string, CodePattern> = new Map();
  private suggestionCache: Map<string, CompletionItem[]> = new Map();
  private contextHistory: CompletionContext[] = [];
  private popularityScores: Map<string, number> = new Map();
  
  // Configuration
  private config: MLConfig = {
    enableAI: true,
    personalizedSuggestions: true,
    contextWindow: 1000, // Characters around cursor
    maxSuggestions: 100,
    confidenceThreshold: 0.3,
    learningRate: 0.1
  };
  
  // VB6 Knowledge base
  private readonly VB6_KEYWORDS = [
    'Dim', 'As', 'Private', 'Public', 'Sub', 'Function', 'End', 'If', 'Then',
    'Else', 'ElseIf', 'For', 'To', 'Next', 'While', 'Wend', 'Do', 'Loop',
    'Select', 'Case', 'Exit', 'Return', 'Call', 'Set', 'Let', 'With', 'ReDim',
    'Const', 'Static', 'Type', 'Enum', 'Property', 'Get', 'Let', 'Set',
    'Class', 'Module', 'Implements', 'Option', 'Explicit', 'Base', 'Compare',
    'Private', 'Public', 'Friend', 'Global', 'Dim', 'ReDim', 'Preserve'
  ];
  
  private readonly VB6_TYPES = [
    'Integer', 'Long', 'Single', 'Double', 'Currency', 'String', 'Boolean',
    'Byte', 'Date', 'Object', 'Variant', 'Collection', 'Dictionary'
  ];
  
  private readonly VB6_FUNCTIONS = [
    'MsgBox', 'InputBox', 'Len', 'Left', 'Right', 'Mid', 'InStr', 'Replace',
    'Trim', 'LTrim', 'RTrim', 'UCase', 'LCase', 'Format', 'CStr', 'CInt',
    'CLng', 'CDbl', 'CDate', 'IsNumeric', 'IsDate', 'IsEmpty', 'IsNull',
    'IsMissing', 'IsArray', 'IsObject', 'TypeName', 'VarType', 'Array',
    'Split', 'Join', 'Filter', 'UBound', 'LBound', 'Abs', 'Round', 'Int',
    'Fix', 'Sgn', 'Sqr', 'Exp', 'Log', 'Sin', 'Cos', 'Tan', 'Atn', 'Rnd',
    'Timer', 'Now', 'Date', 'Time', 'DateAdd', 'DateDiff', 'DatePart'
  ];
  
  // Common control properties and methods
  private readonly CONTROL_PROPERTIES = {
    common: ['Name', 'Left', 'Top', 'Width', 'Height', 'Visible', 'Enabled',
             'TabIndex', 'TabStop', 'Tag', 'ToolTipText', 'Font', 'BackColor',
             'ForeColor', 'BorderStyle', 'Appearance'],
    TextBox: ['Text', 'MaxLength', 'MultiLine', 'ScrollBars', 'PasswordChar',
              'Locked', 'Alignment', 'SelStart', 'SelLength', 'SelText'],
    CommandButton: ['Caption', 'Default', 'Cancel', 'Picture', 'Style',
                    'DisabledPicture', 'DownPicture', 'MaskColor'],
    Label: ['Caption', 'AutoSize', 'WordWrap', 'Alignment', 'BackStyle'],
    ListBox: ['List', 'ListCount', 'ListIndex', 'Selected', 'Sorted',
              'MultiSelect', 'Columns', 'ItemData', 'NewIndex'],
    ComboBox: ['Text', 'List', 'ListCount', 'ListIndex', 'Sorted', 'Style',
               'ItemData', 'NewIndex', 'SelStart', 'SelLength']
  };
  
  private readonly CONTROL_METHODS = {
    common: ['Move', 'Refresh', 'SetFocus', 'ZOrder'],
    TextBox: ['Copy', 'Cut', 'Paste', 'Clear', 'SelAll'],
    ListBox: ['AddItem', 'RemoveItem', 'Clear'],
    ComboBox: ['AddItem', 'RemoveItem', 'Clear']
  };
  
  private readonly CONTROL_EVENTS = {
    common: ['Click', 'DblClick', 'MouseDown', 'MouseUp', 'MouseMove',
             'KeyDown', 'KeyUp', 'KeyPress', 'GotFocus', 'LostFocus'],
    TextBox: ['Change', 'Validate'],
    CommandButton: [],
    ListBox: ['ItemCheck', 'Scroll'],
    ComboBox: ['Change', 'DropDown']
  };

  static getInstance(): AIIntelliSenseEngine {
    if (!AIIntelliSenseEngine.instance) {
      AIIntelliSenseEngine.instance = new AIIntelliSenseEngine();
    }
    return AIIntelliSenseEngine.instance;
  }

  constructor() {
    this.parser = new VB6Parser();
    this.analyzer = new VB6SemanticAnalyzer();
    this.initializePatterns();
    this.loadUserPreferences();
  }

  // 🎯 Main completion method - Ultra-intelligent suggestions
  public async getCompletions(context: CompletionContext): Promise<CompletionItem[]> {
    const startTime = performance.now();
    
    // Update context history for ML
    this.updateContextHistory(context);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(context);
    const cached = this.suggestionCache.get(cacheKey);
    if (cached && this.config.enableAI) {
      return this.reorderByMLScore(cached, context);
    }
    
    // Parse current context
    const parseResult = this.parseContext(context);
    
    // Generate suggestions from multiple sources
    const suggestions: CompletionItem[] = [];
    
    // 1. Keywords suggestions
    suggestions.push(...this.getKeywordSuggestions(parseResult, context));
    
    // 2. Type suggestions
    suggestions.push(...this.getTypeSuggestions(parseResult, context));
    
    // 3. Function suggestions
    suggestions.push(...this.getFunctionSuggestions(parseResult, context));
    
    // 4. Control-based suggestions
    suggestions.push(...this.getControlSuggestions(parseResult, context));
    
    // 5. User-defined suggestions (variables, functions, etc.)
    suggestions.push(...this.getUserDefinedSuggestions(parseResult, context));
    
    // 6. AI-generated suggestions based on patterns
    if (this.config.enableAI) {
      suggestions.push(...await this.getAISuggestions(parseResult, context));
    }
    
    // 7. Snippet suggestions
    suggestions.push(...this.getSnippetSuggestions(parseResult, context));
    
    // Apply ML scoring and filtering
    const scored = this.applyMLScoring(suggestions, context);
    const filtered = this.filterSuggestions(scored, context);
    const sorted = this.sortSuggestions(filtered);
    
    // Cache results
    this.suggestionCache.set(cacheKey, sorted);
    
    // Update learning data
    this.updateLearningData(context, sorted);
    
    console.log(`IntelliSense completed in ${(performance.now() - startTime).toFixed(1)}ms`);
    
    return sorted.slice(0, this.config.maxSuggestions);
  }

  // 🧪 Parse current code context
  private parseContext(context: CompletionContext): any {
    const { code, position } = context;
    
    // Get relevant code window
    const startOffset = Math.max(0, this.getOffset(code, position) - this.config.contextWindow);
    const endOffset = Math.min(code.length, this.getOffset(code, position) + this.config.contextWindow);
    const codeWindow = code.substring(startOffset, endOffset);
    
    // Parse AST
    const ast = this.parser.parse(codeWindow);
    
    // Get current scope information
    const currentLine = code.split('\n')[position.line];
    const beforeCursor = currentLine.substring(0, position.character);
    const afterCursor = currentLine.substring(position.character);
    
    // Detect context type
    const contextType = this.detectContextType(beforeCursor, afterCursor, ast);
    
    return {
      ast,
      currentLine,
      beforeCursor,
      afterCursor,
      contextType,
      codeWindow
    };
  }

  // 🎨 Generate keyword suggestions
  private getKeywordSuggestions(parseResult: any, context: CompletionContext): CompletionItem[] {
    const { beforeCursor, contextType } = parseResult;
    const suggestions: CompletionItem[] = [];
    
    // Filter keywords based on context
    const applicableKeywords = this.VB6_KEYWORDS.filter(keyword => {
      // Context-aware filtering
      if (contextType === 'declaration' && !['Dim', 'Private', 'Public', 'Const'].includes(keyword)) {
        return false;
      }
      if (contextType === 'type' && !this.VB6_TYPES.includes(keyword)) {
        return false;
      }
      
      // Prefix matching
      const lastWord = this.getLastWord(beforeCursor);
      return keyword.toLowerCase().startsWith(lastWord.toLowerCase());
    });
    
    // Create completion items
    applicableKeywords.forEach(keyword => {
      suggestions.push({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        detail: 'VB6 Keyword',
        documentation: this.getKeywordDocumentation(keyword),
        insertText: keyword,
        score: this.getPopularityScore(keyword),
        source: 'builtin',
        tags: this.isDeprecated(keyword) ? [CompletionItemTag.Deprecated] : []
      });
    });
    
    return suggestions;
  }

  // 🔧 Generate function suggestions
  private getFunctionSuggestions(parseResult: any, context: CompletionContext): CompletionItem[] {
    const { beforeCursor } = parseResult;
    const suggestions: CompletionItem[] = [];
    const lastWord = this.getLastWord(beforeCursor);
    
    this.VB6_FUNCTIONS
      .filter(func => func.toLowerCase().startsWith(lastWord.toLowerCase()))
      .forEach(func => {
        const signature = this.getFunctionSignature(func);
        suggestions.push({
          label: func,
          kind: CompletionItemKind.Function,
          detail: signature,
          documentation: this.getFunctionDocumentation(func),
          insertText: `${func}($1)`,
          insertTextRules: [{ type: 'snippet' }],
          score: this.getPopularityScore(func) * 1.2, // Boost functions
          source: 'builtin',
          commitCharacters: ['(']
        });
      });
    
    return suggestions;
  }

  // 🎮 Generate control-based suggestions
  private getControlSuggestions(parseResult: any, context: CompletionContext): CompletionItem[] {
    const { beforeCursor, afterCursor } = parseResult;
    const suggestions: CompletionItem[] = [];
    
    // Detect if we're after a control reference (e.g., "TextBox1.")
    const controlMatch = beforeCursor.match(/(\w+)\.$/);
    if (controlMatch) {
      const controlName = controlMatch[1];
      const control = context.controls.find(c => c.name === controlName);
      
      if (control) {
        // Add properties
        const properties = [
          ...this.CONTROL_PROPERTIES.common,
          ...(this.CONTROL_PROPERTIES[control.type as keyof typeof this.CONTROL_PROPERTIES] || [])
        ];
        
        properties.forEach(prop => {
          suggestions.push({
            label: prop,
            kind: CompletionItemKind.Property,
            detail: `${control.type}.${prop}`,
            documentation: this.getPropertyDocumentation(control.type, prop),
            insertText: prop,
            score: this.getPropertyScore(control.type, prop),
            source: 'builtin',
            tags: this.isPopularProperty(prop) ? [CompletionItemTag.Popular] : []
          });
        });
        
        // Add methods
        const methods = [
          ...this.CONTROL_METHODS.common,
          ...(this.CONTROL_METHODS[control.type as keyof typeof this.CONTROL_METHODS] || [])
        ];
        
        methods.forEach(method => {
          suggestions.push({
            label: method,
            kind: CompletionItemKind.Method,
            detail: `${control.type}.${method}()`,
            documentation: this.getMethodDocumentation(control.type, method),
            insertText: `${method}($1)`,
            insertTextRules: [{ type: 'snippet' }],
            score: this.getMethodScore(control.type, method),
            source: 'builtin',
            commitCharacters: ['(']
          });
        });
      }
    }
    
    // Suggest control names
    const lastWord = this.getLastWord(beforeCursor);
    context.controls
      .filter(c => c.name.toLowerCase().startsWith(lastWord.toLowerCase()))
      .forEach(control => {
        suggestions.push({
          label: control.name,
          kind: CompletionItemKind.Variable,
          detail: control.type,
          documentation: `${control.type} control`,
          insertText: control.name,
          score: 0.8,
          source: 'user'
        });
      });
    
    return suggestions;
  }

  // 🤖 AI-powered suggestions based on patterns
  private async getAISuggestions(parseResult: any, context: CompletionContext): Promise<CompletionItem[]> {
    const suggestions: CompletionItem[] = [];
    
    // Analyze code patterns
    const patterns = this.analyzeCodePatterns(parseResult.codeWindow);
    
    // Match against learned patterns
    for (const [patternId, pattern] of this.userPatterns) {
      if (this.matchesPattern(parseResult.beforeCursor, pattern)) {
        pattern.suggestions.forEach((suggestion, index) => {
          suggestions.push({
            label: suggestion,
            kind: CompletionItemKind.AIGenerated,
            detail: 'AI suggestion based on your patterns',
            documentation: `Suggested because you often use this after "${pattern.context}"`,
            insertText: suggestion,
            score: pattern.frequency * 0.01 * (1 - index * 0.1), // Decay by position
            source: 'ai',
            tags: [CompletionItemTag.AIGenerated],
            preselect: index === 0 && pattern.frequency > 10
          });
        });
      }
    }
    
    // Context-aware suggestions
    if (parseResult.contextType === 'event_handler') {
      suggestions.push(...this.generateEventHandlerSuggestions(parseResult, context));
    }
    
    if (parseResult.contextType === 'property_assignment') {
      suggestions.push(...this.generatePropertyValueSuggestions(parseResult, context));
    }
    
    return suggestions;
  }

  // 📝 Generate snippet suggestions
  private getSnippetSuggestions(parseResult: any, context: CompletionContext): CompletionItem[] {
    const snippets: CompletionItem[] = [];
    const lastWord = this.getLastWord(parseResult.beforeCursor);
    
    // Common VB6 snippets
    const vb6Snippets = [
      {
        prefix: 'sub',
        body: 'Sub ${1:SubName}()\n\t$0\nEnd Sub',
        description: 'Sub procedure'
      },
      {
        prefix: 'func',
        body: 'Function ${1:FunctionName}() As ${2:Variant}\n\t$0\nEnd Function',
        description: 'Function procedure'
      },
      {
        prefix: 'for',
        body: 'For ${1:i} = ${2:0} To ${3:10}\n\t$0\nNext ${1:i}',
        description: 'For loop'
      },
      {
        prefix: 'foreach',
        body: 'For Each ${1:item} In ${2:collection}\n\t$0\nNext ${1:item}',
        description: 'For Each loop'
      },
      {
        prefix: 'if',
        body: 'If ${1:condition} Then\n\t$0\nEnd If',
        description: 'If statement'
      },
      {
        prefix: 'select',
        body: 'Select Case ${1:expression}\n\tCase ${2:value1}\n\t\t$0\n\tCase Else\n\t\t\nEnd Select',
        description: 'Select Case statement'
      },
      {
        prefix: 'try',
        body: 'On Error GoTo ${1:ErrorHandler}\n\t$0\nExit ${2:Sub}\n${1:ErrorHandler}:\n\tMsgBox Err.Description',
        description: 'Error handling'
      },
      {
        prefix: 'prop',
        body: 'Property Get ${1:PropertyName}() As ${2:Variant}\n\t${1:PropertyName} = m_${1:PropertyName}\nEnd Property\n\nProperty Let ${1:PropertyName}(ByVal vNewValue As ${2:Variant})\n\tm_${1:PropertyName} = vNewValue\nEnd Property',
        description: 'Property procedures'
      }
    ];
    
    // Filter and create snippet items
    vb6Snippets
      .filter(snippet => snippet.prefix.startsWith(lastWord.toLowerCase()))
      .forEach(snippet => {
        snippets.push({
          label: snippet.prefix,
          kind: CompletionItemKind.Snippet,
          detail: 'Code snippet',
          documentation: snippet.description,
          insertText: snippet.body,
          insertTextRules: [{ type: 'snippet' }],
          score: 0.7,
          source: 'snippet',
          filterText: snippet.prefix
        });
      });
    
    return snippets;
  }

  // 🎯 Apply machine learning scoring
  private applyMLScoring(suggestions: CompletionItem[], context: CompletionContext): CompletionItem[] {
    return suggestions.map(suggestion => {
      let score = suggestion.score;
      
      // Boost recently used items
      const recentIndex = context.recentCompletions.indexOf(suggestion.label);
      if (recentIndex >= 0) {
        score *= 1.5 - (recentIndex * 0.1); // Decay by position
      }
      
      // Boost based on user patterns
      const patternScore = context.userPatterns.get(suggestion.label) || 0;
      score *= 1 + (patternScore * 0.01);
      
      // Context-specific boosting
      if (context.projectType === 'database' && this.isDatabaseRelated(suggestion.label)) {
        score *= 1.3;
      }
      
      // Time-based scoring (boost morning patterns vs evening)
      const hour = new Date().getHours();
      const timePattern = this.getTimePattern(suggestion.label, hour);
      score *= timePattern;
      
      return { ...suggestion, score };
    });
  }

  // 🔍 Filter suggestions based on context
  private filterSuggestions(suggestions: CompletionItem[], context: CompletionContext): CompletionItem[] {
    return suggestions.filter(suggestion => {
      // Remove low confidence suggestions
      if (suggestion.score < this.config.confidenceThreshold) {
        return false;
      }
      
      // Remove duplicates (keep highest score)
      const duplicates = suggestions.filter(s => s.label === suggestion.label);
      if (duplicates.length > 1) {
        return suggestion === duplicates.reduce((a, b) => a.score > b.score ? a : b);
      }
      
      return true;
    });
  }

  // 📊 Sort suggestions by relevance
  private sortSuggestions(suggestions: CompletionItem[]): CompletionItem[] {
    return suggestions.sort((a, b) => {
      // Primary sort by score
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }
      
      // Secondary sort by kind priority
      const kindPriority = {
        [CompletionItemKind.Variable]: 1,
        [CompletionItemKind.Property]: 2,
        [CompletionItemKind.Method]: 3,
        [CompletionItemKind.Function]: 4,
        [CompletionItemKind.Keyword]: 5,
        [CompletionItemKind.Snippet]: 6,
        [CompletionItemKind.AIGenerated]: 7
      };
      
      const aPriority = kindPriority[a.kind] || 99;
      const bPriority = kindPriority[b.kind] || 99;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Tertiary sort alphabetically
      return a.label.localeCompare(b.label);
    });
  }

  // 🧠 Learning and pattern recognition
  private updateLearningData(context: CompletionContext, suggestions: CompletionItem[]): void {
    // This would be called when user selects a suggestion
    // For now, we'll just update the pattern database
    
    const contextKey = this.getContextKey(context);
    const pattern = this.userPatterns.get(contextKey) || {
      id: contextKey,
      pattern: new RegExp(this.escapeRegex(context.code.slice(-50)), 'i'),
      context: context.code.slice(-50),
      frequency: 0,
      lastUsed: new Date(),
      suggestions: [],
      category: 'pattern'
    };
    
    pattern.frequency++;
    pattern.lastUsed = new Date();
    
    this.userPatterns.set(contextKey, pattern);
    this.saveUserPreferences();
  }

  // Helper methods
  private getOffset(code: string, position: Position): number {
    const lines = code.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    return offset + position.character;
  }

  private getLastWord(text: string): string {
    const match = text.match(/(\w+)$/);
    return match ? match[1] : '';
  }

  private detectContextType(before: string, after: string, ast: any): string {
    if (/\bDim\s+\w*$/.test(before)) return 'declaration';
    if (/\bAs\s+\w*$/.test(before)) return 'type';
    if (/\w+\.$/.test(before)) return 'member_access';
    if (/\w+\s*\(\s*$/.test(before)) return 'function_call';
    if (/^\s*Private\s+Sub\s+\w+_/.test(before)) return 'event_handler';
    if (/\w+\s*=\s*$/.test(before)) return 'property_assignment';
    return 'general';
  }

  private generateCacheKey(context: CompletionContext): string {
    const { code, position } = context;
    const line = code.split('\n')[position.line];
    return `${line}_${position.character}_${context.controls.length}`;
  }

  private getContextKey(context: CompletionContext): string {
    return context.code.slice(-50).replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private matchesPattern(text: string, pattern: CodePattern): boolean {
    return pattern.pattern.test(text);
  }

  private initializePatterns(): void {
    // Initialize with common VB6 patterns
    // This would be loaded from a knowledge base in production
  }

  private loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('vb6-intellisense-patterns');
      if (saved) {
        const data = JSON.parse(saved);
        data.forEach((item: any) => {
          this.userPatterns.set(item.id, {
            ...item,
            pattern: new RegExp(item.pattern, 'i'),
            lastUsed: new Date(item.lastUsed)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load IntelliSense preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      const data = Array.from(this.userPatterns.values()).map(pattern => ({
        ...pattern,
        pattern: pattern.pattern.source
      }));
      localStorage.setItem('vb6-intellisense-patterns', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save IntelliSense preferences:', error);
    }
  }

  // Documentation providers
  private getKeywordDocumentation(keyword: string): string {
    const docs: Record<string, string> = {
      'Dim': 'Declares variables and allocates storage space.',
      'Private': 'Declares private procedures or variables.',
      'Public': 'Declares public procedures or variables.',
      'Sub': 'Declares a Sub procedure.',
      'Function': 'Declares a Function procedure that returns a value.',
      'If': 'Conditionally executes a group of statements.',
      'For': 'Repeats a group of statements a specified number of times.',
      'Select': 'Executes one of several groups of statements.'
    };
    return docs[keyword] || `VB6 ${keyword} keyword`;
  }

  private getFunctionDocumentation(func: string): string {
    const docs: Record<string, string> = {
      'MsgBox': 'Displays a message in a dialog box and returns user response.',
      'InputBox': 'Displays a prompt in a dialog box and returns user input.',
      'Len': 'Returns the number of characters in a string.',
      'Format': 'Formats a value according to a format expression.'
    };
    return docs[func] || `VB6 ${func} function`;
  }

  private getFunctionSignature(func: string): string {
    const signatures: Record<string, string> = {
      'MsgBox': 'MsgBox(Prompt, [Buttons], [Title])',
      'InputBox': 'InputBox(Prompt, [Title], [Default])',
      'Len': 'Len(String)',
      'Format': 'Format(Expression, [Format])'
    };
    return signatures[func] || `${func}()`;
  }

  private getPropertyDocumentation(controlType: string, property: string): string {
    return `${controlType}.${property} property`;
  }

  private getMethodDocumentation(controlType: string, method: string): string {
    return `${controlType}.${method} method`;
  }

  // Scoring helpers
  private getPopularityScore(item: string): number {
    return this.popularityScores.get(item) || 0.5;
  }

  private getPropertyScore(controlType: string, property: string): number {
    const common = ['Text', 'Caption', 'Visible', 'Enabled', 'Value'];
    return common.includes(property) ? 0.9 : 0.6;
  }

  private getMethodScore(controlType: string, method: string): number {
    const common = ['SetFocus', 'Refresh', 'Clear', 'AddItem'];
    return common.includes(method) ? 0.8 : 0.5;
  }

  private isDeprecated(keyword: string): boolean {
    const deprecated = ['GoSub', 'Return', 'Let'];
    return deprecated.includes(keyword);
  }

  private isPopularProperty(property: string): boolean {
    const popular = ['Text', 'Caption', 'Visible', 'Enabled', 'Value', 'Name'];
    return popular.includes(property);
  }

  private isDatabaseRelated(item: string): boolean {
    const dbKeywords = ['Recordset', 'Database', 'Connection', 'Query', 'SQL', 'Table', 'Field'];
    return dbKeywords.some(keyword => item.toLowerCase().includes(keyword.toLowerCase()));
  }

  private getTimePattern(item: string, hour: number): number {
    // Simple time-based pattern recognition
    // Morning: debugging features, Evening: UI features
    if (hour < 12 && ['Debug', 'Print', 'Log'].some(d => item.includes(d))) {
      return 1.2;
    }
    if (hour > 17 && ['Form', 'Control', 'UI'].some(u => item.includes(u))) {
      return 1.2;
    }
    return 1.0;
  }

  private reorderByMLScore(suggestions: CompletionItem[], context: CompletionContext): CompletionItem[] {
    // Re-score based on current context
    return this.applyMLScoring(suggestions, context);
  }

  private updateContextHistory(context: CompletionContext): void {
    this.contextHistory.push(context);
    if (this.contextHistory.length > 100) {
      this.contextHistory.shift();
    }
  }

  private generateEventHandlerSuggestions(parseResult: any, context: CompletionContext): CompletionItem[] {
    const suggestions: CompletionItem[] = [];
    
    // Detect control type from event handler name
    const match = parseResult.beforeCursor.match(/Private\s+Sub\s+(\w+)_/);
    if (match) {
      const controlName = match[1];
      const control = context.controls.find(c => c.name === controlName);
      
      if (control) {
        const events = [
          ...this.CONTROL_EVENTS.common,
          ...(this.CONTROL_EVENTS[control.type as keyof typeof this.CONTROL_EVENTS] || [])
        ];
        
        events.forEach(event => {
          suggestions.push({
            label: event,
            kind: CompletionItemKind.Event,
            detail: `${control.type}_${event} event`,
            documentation: `Handles the ${event} event for ${controlName}`,
            insertText: `${event}()\n\t$0\nEnd Sub`,
            insertTextRules: [{ type: 'snippet' }],
            score: 0.9,
            source: 'ai',
            tags: [CompletionItemTag.AIGenerated]
          });
        });
      }
    }
    
    return suggestions;
  }

  private generatePropertyValueSuggestions(parseResult: any, context: CompletionContext): CompletionItem[] {
    const suggestions: CompletionItem[] = [];
    
    // Detect property being assigned
    const match = parseResult.beforeCursor.match(/(\w+)\.(\w+)\s*=\s*$/);
    if (match) {
      const controlName = match[1];
      const propertyName = match[2];
      
      // Suggest common values based on property type
      switch (propertyName.toLowerCase()) {
        case 'visible':
        case 'enabled':
          suggestions.push(
            { label: 'True', kind: CompletionItemKind.Value, insertText: 'True', score: 0.9, source: 'ai' },
            { label: 'False', kind: CompletionItemKind.Value, insertText: 'False', score: 0.9, source: 'ai' }
          );
          break;
        case 'alignment':
          suggestions.push(
            { label: '0 - Left Justify', kind: CompletionItemKind.Value, insertText: '0', score: 0.8, source: 'ai' },
            { label: '1 - Right Justify', kind: CompletionItemKind.Value, insertText: '1', score: 0.8, source: 'ai' },
            { label: '2 - Center', kind: CompletionItemKind.Value, insertText: '2', score: 0.9, source: 'ai' }
          );
          break;
      }
    }
    
    return suggestions;
  }

  // Public API for learning from user selections
  public recordSelection(item: CompletionItem, context: CompletionContext): void {
    // Update popularity scores
    const currentScore = this.popularityScores.get(item.label) || 0.5;
    this.popularityScores.set(item.label, currentScore + this.config.learningRate);
    
    // Update user patterns
    const pattern = context.userPatterns.get(item.label) || 0;
    context.userPatterns.set(item.label, pattern + 1);
    
    // Add to recent completions
    context.recentCompletions.unshift(item.label);
    if (context.recentCompletions.length > 20) {
      context.recentCompletions.pop();
    }
    
    // Update pattern database
    this.updateLearningData(context, [item]);
  }

  // Configuration methods
  public updateConfig(updates: Partial<MLConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public clearCache(): void {
    this.suggestionCache.clear();
  }

  public resetLearning(): void {
    this.userPatterns.clear();
    this.popularityScores.clear();
    this.contextHistory = [];
    localStorage.removeItem('vb6-intellisense-patterns');
  }
}

// Export singleton instance
export const aiIntelliSenseEngine = AIIntelliSenseEngine.getInstance();