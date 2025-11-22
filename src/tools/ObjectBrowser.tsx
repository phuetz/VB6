/**
 * Object Browser - Complete VB6 Object Browser Implementation
 * Provides browsing and searching of objects, methods, properties, constants, and libraries
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { IntelliSenseEngine, CompletionItemKind, CompletionItem } from './IntelliSenseEngine';

// Object Browser Constants
export enum ObjectKind {
  Library = 'Library',
  Module = 'Module',
  Class = 'Class',
  Interface = 'Interface',
  Enum = 'Enum',
  Constant = 'Constant',
  Function = 'Function',
  Subroutine = 'Subroutine',
  Property = 'Property',
  Event = 'Event',
  Variable = 'Variable',
  Type = 'Type'
}

export enum MemberType {
  Method = 'Method',
  Property = 'Property',
  Event = 'Event',
  Constant = 'Constant',
  Field = 'Field'
}

export enum AccessModifier {
  Public = 'Public',
  Private = 'Private',
  Friend = 'Friend',
  Protected = 'Protected'
}

// Object Browser Interfaces
export interface LibraryInfo {
  name: string;
  version: string;
  description: string;
  path: string;
  guid: string;
  helpFile?: string;
  modules: ModuleInfo[];
}

export interface ModuleInfo {
  name: string;
  kind: ObjectKind;
  description: string;
  library: string;
  classes: ClassInfo[];
  functions: FunctionInfo[];
  constants: ConstantInfo[];
  types: TypeInfo[];
}

export interface ClassInfo {
  name: string;
  fullName: string;
  description: string;
  library: string;
  module: string;
  baseClass?: string;
  interfaces: string[];
  access: AccessModifier;
  isAbstract: boolean;
  isSealed: boolean;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  events: EventInfo[];
  constants: ConstantInfo[];
  helpKeyword?: string;
}

export interface PropertyInfo {
  name: string;
  type: string;
  description: string;
  access: AccessModifier;
  isReadOnly: boolean;
  isStatic: boolean;
  defaultValue?: string;
  parameters?: ParameterInfo[];
  helpKeyword?: string;
}

export interface MethodInfo {
  name: string;
  returnType: string;
  description: string;
  access: AccessModifier;
  isStatic: boolean;
  parameters: ParameterInfo[];
  helpKeyword?: string;
}

export interface EventInfo {
  name: string;
  description: string;
  parameters: ParameterInfo[];
  helpKeyword?: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  description: string;
  isOptional: boolean;
  defaultValue?: string;
  direction: 'In' | 'Out' | 'InOut' | 'Return';
}

export interface ConstantInfo {
  name: string;
  type: string;
  value: string;
  description: string;
  access: AccessModifier;
  helpKeyword?: string;
}

export interface FunctionInfo {
  name: string;
  returnType: string;
  description: string;
  access: AccessModifier;
  parameters: ParameterInfo[];
  helpKeyword?: string;
}

export interface TypeInfo {
  name: string;
  kind: 'Type' | 'Enum';
  description: string;
  access: AccessModifier;
  members: TypeMemberInfo[];
  helpKeyword?: string;
}

export interface TypeMemberInfo {
  name: string;
  type: string;
  description: string;
  value?: string;
}

export interface SearchResult {
  item: any;
  kind: ObjectKind;
  library: string;
  module: string;
  path: string;
  description: string;
  matchType: 'exact' | 'startsWith' | 'contains';
}

// Object Browser Engine
export class ObjectBrowserEngine {
  private _libraries: Map<string, LibraryInfo> = new Map();
  private _intelliSenseEngine: IntelliSenseEngine;

  constructor(intelliSenseEngine: IntelliSenseEngine) {
    this._intelliSenseEngine = intelliSenseEngine;
    this.initializeBuiltinLibraries();
  }

  private initializeBuiltinLibraries(): void {
    // VB6 Runtime Library
    const vb6Runtime: LibraryInfo = {
      name: 'VB6 Runtime',
      version: '6.0',
      description: 'Visual Basic 6.0 Runtime Library',
      path: 'VB6RT.DLL',
      guid: '{EA544A21-C82D-11D1-A3E4-00A0C90AEA82}',
      helpFile: 'VB6.HLP',
      modules: [
        {
          name: 'Strings',
          kind: ObjectKind.Module,
          description: 'String manipulation functions',
          library: 'VB6 Runtime',
          classes: [],
          functions: [
            {
              name: 'Left',
              returnType: 'String',
              description: 'Returns a specified number of characters from the left side of a string',
              access: AccessModifier.Public,
              parameters: [
                { name: 'string', type: 'String', description: 'Source string', isOptional: false, direction: 'In' },
                { name: 'length', type: 'Long', description: 'Number of characters', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Left Function'
            },
            {
              name: 'Right',
              returnType: 'String',
              description: 'Returns a specified number of characters from the right side of a string',
              access: AccessModifier.Public,
              parameters: [
                { name: 'string', type: 'String', description: 'Source string', isOptional: false, direction: 'In' },
                { name: 'length', type: 'Long', description: 'Number of characters', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Right Function'
            },
            {
              name: 'Mid',
              returnType: 'String',
              description: 'Returns a specified number of characters from a string',
              access: AccessModifier.Public,
              parameters: [
                { name: 'string', type: 'String', description: 'Source string', isOptional: false, direction: 'In' },
                { name: 'start', type: 'Long', description: 'Starting position', isOptional: false, direction: 'In' },
                { name: 'length', type: 'Long', description: 'Number of characters', isOptional: true, direction: 'In' }
              ],
              helpKeyword: 'Mid Function'
            },
            {
              name: 'Len',
              returnType: 'Long',
              description: 'Returns the number of characters in a string',
              access: AccessModifier.Public,
              parameters: [
                { name: 'string', type: 'String', description: 'Source string', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Len Function'
            },
            {
              name: 'UCase',
              returnType: 'String',
              description: 'Returns a string converted to uppercase',
              access: AccessModifier.Public,
              parameters: [
                { name: 'string', type: 'String', description: 'Source string', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'UCase Function'
            },
            {
              name: 'LCase',
              returnType: 'String',
              description: 'Returns a string converted to lowercase',
              access: AccessModifier.Public,
              parameters: [
                { name: 'string', type: 'String', description: 'Source string', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'LCase Function'
            }
          ],
          constants: [
            {
              name: 'vbCrLf',
              type: 'String',
              value: 'Chr(13) + Chr(10)',
              description: 'Carriage return and line feed',
              access: AccessModifier.Public,
              helpKeyword: 'vbCrLf Constant'
            },
            {
              name: 'vbTab',
              type: 'String',
              value: 'Chr(9)',
              description: 'Tab character',
              access: AccessModifier.Public,
              helpKeyword: 'vbTab Constant'
            }
          ],
          types: []
        },
        {
          name: 'Math',
          kind: ObjectKind.Module,
          description: 'Mathematical functions',
          library: 'VB6 Runtime',
          classes: [],
          functions: [
            {
              name: 'Abs',
              returnType: 'Variant',
              description: 'Returns the absolute value of a number',
              access: AccessModifier.Public,
              parameters: [
                { name: 'number', type: 'Variant', description: 'Any valid numeric expression', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Abs Function'
            },
            {
              name: 'Sqr',
              returnType: 'Double',
              description: 'Returns the square root of a number',
              access: AccessModifier.Public,
              parameters: [
                { name: 'number', type: 'Double', description: 'Any valid numeric expression >= 0', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Sqr Function'
            },
            {
              name: 'Sin',
              returnType: 'Double',
              description: 'Returns the sine of an angle',
              access: AccessModifier.Public,
              parameters: [
                { name: 'number', type: 'Double', description: 'Angle in radians', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Sin Function'
            },
            {
              name: 'Cos',
              returnType: 'Double',
              description: 'Returns the cosine of an angle',
              access: AccessModifier.Public,
              parameters: [
                { name: 'number', type: 'Double', description: 'Angle in radians', isOptional: false, direction: 'In' }
              ],
              helpKeyword: 'Cos Function'
            }
          ],
          constants: [],
          types: []
        },
        {
          name: 'Interaction',
          kind: ObjectKind.Module,
          description: 'User interaction functions',
          library: 'VB6 Runtime',
          classes: [],
          functions: [
            {
              name: 'MsgBox',
              returnType: 'VbMsgBoxResult',
              description: 'Displays a message in a dialog box',
              access: AccessModifier.Public,
              parameters: [
                { name: 'prompt', type: 'String', description: 'Message to display', isOptional: false, direction: 'In' },
                { name: 'buttons', type: 'VbMsgBoxStyle', description: 'Buttons and icon to display', isOptional: true, direction: 'In' },
                { name: 'title', type: 'String', description: 'Dialog box title', isOptional: true, direction: 'In' }
              ],
              helpKeyword: 'MsgBox Function'
            },
            {
              name: 'InputBox',
              returnType: 'String',
              description: 'Displays a prompt in a dialog box and returns user input',
              access: AccessModifier.Public,
              parameters: [
                { name: 'prompt', type: 'String', description: 'Message to display', isOptional: false, direction: 'In' },
                { name: 'title', type: 'String', description: 'Dialog box title', isOptional: true, direction: 'In' },
                { name: 'default', type: 'String', description: 'Default response', isOptional: true, direction: 'In' }
              ],
              helpKeyword: 'InputBox Function'
            }
          ],
          constants: [
            {
              name: 'vbOK',
              type: 'Integer',
              value: '1',
              description: 'OK button was clicked',
              access: AccessModifier.Public
            },
            {
              name: 'vbCancel',
              type: 'Integer',
              value: '2',
              description: 'Cancel button was clicked',
              access: AccessModifier.Public
            }
          ],
          types: []
        }
      ]
    };

    // VB6 Forms Library
    const vb6Forms: LibraryInfo = {
      name: 'VB6 Forms',
      version: '6.0',
      description: 'Visual Basic 6.0 Forms and Controls',
      path: 'MSVBVM60.DLL',
      guid: '{EA544A21-C82D-11D1-A3E4-00A0C90AEA83}',
      helpFile: 'VB6.HLP',
      modules: [
        {
          name: 'Forms',
          kind: ObjectKind.Module,
          description: 'Form classes and controls',
          library: 'VB6 Forms',
          classes: [
            {
              name: 'Form',
              fullName: 'VB.Form',
              description: 'Represents a window or dialog box',
              library: 'VB6 Forms',
              module: 'Forms',
              interfaces: [],
              access: AccessModifier.Public,
              isAbstract: false,
              isSealed: false,
              properties: [
                {
                  name: 'Caption',
                  type: 'String',
                  description: 'The text displayed in the title bar',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'Width',
                  type: 'Single',
                  description: 'Width of the form in twips',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'Height',
                  type: 'Single',
                  description: 'Height of the form in twips',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'Left',
                  type: 'Single',
                  description: 'Left position of the form',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'Top',
                  type: 'Single',
                  description: 'Top position of the form',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'Visible',
                  type: 'Boolean',
                  description: 'Determines if the form is visible',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                }
              ],
              methods: [
                {
                  name: 'Show',
                  returnType: 'void',
                  description: 'Displays the form',
                  access: AccessModifier.Public,
                  isStatic: false,
                  parameters: [
                    { name: 'Modal', type: 'Boolean', description: 'Show as modal dialog', isOptional: true, direction: 'In' }
                  ]
                },
                {
                  name: 'Hide',
                  returnType: 'void',
                  description: 'Hides the form',
                  access: AccessModifier.Public,
                  isStatic: false,
                  parameters: []
                },
                {
                  name: 'Move',
                  returnType: 'void',
                  description: 'Moves and resizes the form',
                  access: AccessModifier.Public,
                  isStatic: false,
                  parameters: [
                    { name: 'Left', type: 'Single', description: 'New left position', isOptional: false, direction: 'In' },
                    { name: 'Top', type: 'Single', description: 'New top position', isOptional: true, direction: 'In' },
                    { name: 'Width', type: 'Single', description: 'New width', isOptional: true, direction: 'In' },
                    { name: 'Height', type: 'Single', description: 'New height', isOptional: true, direction: 'In' }
                  ]
                }
              ],
              events: [
                {
                  name: 'Load',
                  description: 'Occurs when the form is loaded',
                  parameters: []
                },
                {
                  name: 'Unload',
                  description: 'Occurs when the form is unloaded',
                  parameters: [
                    { name: 'Cancel', type: 'Integer', description: 'Set to True to cancel unload', isOptional: false, direction: 'InOut' }
                  ]
                },
                {
                  name: 'Resize',
                  description: 'Occurs when the form is resized',
                  parameters: []
                }
              ],
              constants: []
            },
            {
              name: 'TextBox',
              fullName: 'VB.TextBox',
              description: 'Text input control',
              library: 'VB6 Forms',
              module: 'Forms',
              interfaces: [],
              access: AccessModifier.Public,
              isAbstract: false,
              isSealed: false,
              properties: [
                {
                  name: 'Text',
                  type: 'String',
                  description: 'The text displayed in the control',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'MaxLength',
                  type: 'Integer',
                  description: 'Maximum number of characters',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                },
                {
                  name: 'MultiLine',
                  type: 'Boolean',
                  description: 'Allow multiple lines',
                  access: AccessModifier.Public,
                  isReadOnly: false,
                  isStatic: false
                }
              ],
              methods: [
                {
                  name: 'SetFocus',
                  returnType: 'void',
                  description: 'Sets focus to the control',
                  access: AccessModifier.Public,
                  isStatic: false,
                  parameters: []
                }
              ],
              events: [
                {
                  name: 'Change',
                  description: 'Occurs when the text changes',
                  parameters: []
                },
                {
                  name: 'KeyPress',
                  description: 'Occurs when a key is pressed',
                  parameters: [
                    { name: 'KeyAscii', type: 'Integer', description: 'ASCII code of the key', isOptional: false, direction: 'InOut' }
                  ]
                }
              ],
              constants: []
            }
          ],
          functions: [],
          constants: [],
          types: []
        }
      ]
    };

    this._libraries.set('VB6 Runtime', vb6Runtime);
    this._libraries.set('VB6 Forms', vb6Forms);
  }

  getLibraries(): LibraryInfo[] {
    return Array.from(this._libraries.values());
  }

  getLibrary(name: string): LibraryInfo | undefined {
    return this._libraries.get(name);
  }

  search(query: string, filter?: ObjectKind[]): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const library of this._libraries.values()) {
      for (const module of library.modules) {
        // Search functions
        if (!filter || filter.includes(ObjectKind.Function)) {
          for (const func of module.functions) {
            const matchType = this.getMatchType(func.name, lowerQuery);
            if (matchType) {
              results.push({
                item: func,
                kind: ObjectKind.Function,
                library: library.name,
                module: module.name,
                path: `${library.name}.${module.name}.${func.name}`,
                description: func.description,
                matchType
              });
            }
          }
        }

        // Search constants
        if (!filter || filter.includes(ObjectKind.Constant)) {
          for (const constant of module.constants) {
            const matchType = this.getMatchType(constant.name, lowerQuery);
            if (matchType) {
              results.push({
                item: constant,
                kind: ObjectKind.Constant,
                library: library.name,
                module: module.name,
                path: `${library.name}.${module.name}.${constant.name}`,
                description: constant.description,
                matchType
              });
            }
          }
        }

        // Search classes
        if (!filter || filter.includes(ObjectKind.Class)) {
          for (const cls of module.classes) {
            const matchType = this.getMatchType(cls.name, lowerQuery);
            if (matchType) {
              results.push({
                item: cls,
                kind: ObjectKind.Class,
                library: library.name,
                module: module.name,
                path: `${library.name}.${module.name}.${cls.name}`,
                description: cls.description,
                matchType
              });
            }

            // Search class members
            if (!filter || filter.includes(ObjectKind.Property)) {
              for (const prop of cls.properties) {
                const propMatchType = this.getMatchType(prop.name, lowerQuery);
                if (propMatchType) {
                  results.push({
                    item: prop,
                    kind: ObjectKind.Property,
                    library: library.name,
                    module: module.name,
                    path: `${library.name}.${module.name}.${cls.name}.${prop.name}`,
                    description: prop.description,
                    matchType: propMatchType
                  });
                }
              }
            }

            if (!filter || filter.includes(ObjectKind.Function)) {
              for (const method of cls.methods) {
                const methodMatchType = this.getMatchType(method.name, lowerQuery);
                if (methodMatchType) {
                  results.push({
                    item: method,
                    kind: ObjectKind.Function,
                    library: library.name,
                    module: module.name,
                    path: `${library.name}.${module.name}.${cls.name}.${method.name}`,
                    description: method.description,
                    matchType: methodMatchType
                  });
                }
              }
            }

            if (!filter || filter.includes(ObjectKind.Event)) {
              for (const event of cls.events) {
                const eventMatchType = this.getMatchType(event.name, lowerQuery);
                if (eventMatchType) {
                  results.push({
                    item: event,
                    kind: ObjectKind.Event,
                    library: library.name,
                    module: module.name,
                    path: `${library.name}.${module.name}.${cls.name}.${event.name}`,
                    description: event.description,
                    matchType: eventMatchType
                  });
                }
              }
            }
          }
        }
      }
    }

    // Sort results by match type and name
    results.sort((a, b) => {
      const matchOrder = { exact: 0, startsWith: 1, contains: 2 };
      const matchDiff = matchOrder[a.matchType] - matchOrder[b.matchType];
      if (matchDiff !== 0) return matchDiff;
      return a.item.name.localeCompare(b.item.name);
    });

    return results;
  }

  private getMatchType(name: string, query: string): 'exact' | 'startsWith' | 'contains' | null {
    const lowerName = name.toLowerCase();
    if (lowerName === query) return 'exact';
    if (lowerName.startsWith(query)) return 'startsWith';
    if (lowerName.includes(query)) return 'contains';
    return null;
  }

  addLibrary(library: LibraryInfo): void {
    this._libraries.set(library.name, library);
  }

  removeLibrary(name: string): boolean {
    return this._libraries.delete(name);
  }

  getClassInfo(libraryName: string, moduleName: string, className: string): ClassInfo | undefined {
    const library = this._libraries.get(libraryName);
    if (!library) return undefined;

    const module = library.modules.find(m => m.name === moduleName);
    if (!module) return undefined;

    return module.classes.find(c => c.name === className);
  }

  getAllClasses(): ClassInfo[] {
    const classes: ClassInfo[] = [];
    for (const library of this._libraries.values()) {
      for (const module of library.modules) {
        classes.push(...module.classes);
      }
    }
    return classes;
  }

  getAllFunctions(): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    for (const library of this._libraries.values()) {
      for (const module of library.modules) {
        functions.push(...module.functions);
        for (const cls of module.classes) {
          functions.push(...cls.methods);
        }
      }
    }
    return functions;
  }

  getAllConstants(): ConstantInfo[] {
    const constants: ConstantInfo[] = [];
    for (const library of this._libraries.values()) {
      for (const module of library.modules) {
        constants.push(...module.constants);
        for (const cls of module.classes) {
          constants.push(...cls.constants);
        }
      }
    }
    return constants;
  }
}

// Object Browser Component
export interface ObjectBrowserProps {
  intelliSenseEngine?: IntelliSenseEngine;
  onItemSelected?: (item: any, kind: ObjectKind) => void;
  onShowHelp?: (helpKeyword: string) => void;
  onCopyDeclaration?: (declaration: string) => void;
}

export const ObjectBrowser: React.FC<ObjectBrowserProps> = ({
  intelliSenseEngine,
  onItemSelected,
  onShowHelp,
  onCopyDeclaration
}) => {
  const [engine] = useState(() => new ObjectBrowserEngine(intelliSenseEngine || new IntelliSenseEngine()));
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemKind, setSelectedItemKind] = useState<ObjectKind | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filter, setFilter] = useState<ObjectKind[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const libraries = useMemo(() => engine.getLibraries(), [engine]);
  const selectedLibraryData = useMemo(() => 
    selectedLibrary ? engine.getLibrary(selectedLibrary) : null, 
    [engine, selectedLibrary]
  );

  const selectedModuleData = useMemo(() => 
    selectedLibraryData?.modules.find(m => m.name === selectedModule), 
    [selectedLibraryData, selectedModule]
  );

  const selectedClassData = useMemo(() => 
    selectedModuleData?.classes.find(c => c.name === selectedClass), 
    [selectedModuleData, selectedClass]
  );

  // Initialize with first library selected
  useEffect(() => {
    if (libraries.length > 0 && !selectedLibrary) {
      setSelectedLibrary(libraries[0].name);
    }
  }, [libraries, selectedLibrary]);

  // Initialize with first module selected
  useEffect(() => {
    if (selectedLibraryData?.modules.length && !selectedModule) {
      setSelectedModule(selectedLibraryData.modules[0].name);
    }
  }, [selectedLibraryData, selectedModule]);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      const results = engine.search(query, filter.length > 0 ? filter : undefined);
      setSearchResults(results);
      setIsSearchMode(true);
    } else {
      setSearchResults([]);
      setIsSearchMode(false);
    }
  }, [engine, filter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleItemClick = (item: any, kind: ObjectKind) => {
    setSelectedItem(item);
    setSelectedItemKind(kind);
    onItemSelected?.(item, kind);
  };

  const getKindIcon = (kind: ObjectKind): string => {
    switch (kind) {
      case ObjectKind.Library: return '📚';
      case ObjectKind.Module: return '📁';
      case ObjectKind.Class: return '📦';
      case ObjectKind.Interface: return '🔌';
      case ObjectKind.Function: return '🔧';
      case ObjectKind.Subroutine: return '⚡';
      case ObjectKind.Property: return '🏷️';
      case ObjectKind.Event: return '⚡';
      case ObjectKind.Constant: return '🔒';
      case ObjectKind.Variable: return '📊';
      case ObjectKind.Type: return '📋';
      case ObjectKind.Enum: return '📝';
      default: return '📄';
    }
  };

  const getAccessIcon = (access: AccessModifier): string => {
    switch (access) {
      case AccessModifier.Public: return '🌐';
      case AccessModifier.Private: return '🔒';
      case AccessModifier.Friend: return '👥';
      case AccessModifier.Protected: return '🛡️';
      default: return '';
    }
  };

  const formatParameters = (parameters: ParameterInfo[]): string => {
    return parameters.map(p => {
      let param = p.name;
      if (p.isOptional) param = `[${param}]`;
      param += `: ${p.type}`;
      if (p.defaultValue) param += ` = ${p.defaultValue}`;
      return param;
    }).join(', ');
  };

  const copyDeclaration = (item: any, kind: ObjectKind) => {
    let declaration = '';
    
    switch (kind) {
      case ObjectKind.Function: {
        const func = item as FunctionInfo;
        declaration = `${func.access} Function ${func.name}(${formatParameters(func.parameters)}) As ${func.returnType}`;
        break;
      }
      case ObjectKind.Property: {
        const prop = item as PropertyInfo;
        declaration = `${prop.access} Property ${prop.name} As ${prop.type}`;
        break;
      }
      case ObjectKind.Constant: {
        const constant = item as ConstantInfo;
        declaration = `${constant.access} Const ${constant.name} As ${constant.type} = ${constant.value}`;
        break;
      }
      case ObjectKind.Class: {
        const cls = item as ClassInfo;
        declaration = `${cls.access} Class ${cls.name}`;
        if (cls.baseClass) declaration += ` Inherits ${cls.baseClass}`;
        break;
      }
      default:
        declaration = item.name || '';
    }
    
    onCopyDeclaration?.(declaration);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize: '12px',
      backgroundColor: '#f0f0f0'
    }}>
      {/* Toolbar */}
      <div style={{ 
        padding: '8px', 
        borderBottom: '1px solid #ccc',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search objects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '2px'
          }}
        />
        
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'tree' | 'list')}
          style={{ padding: '4px', border: '1px solid #ccc' }}
        >
          <option value="tree">Tree View</option>
          <option value="list">List View</option>
        </select>
        
        <button
          onClick={() => {
            setSearchQuery('');
            setIsSearchMode(false);
            searchInputRef.current?.focus();
          }}
          style={{ 
            padding: '4px 8px', 
            border: '1px solid #ccc',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        padding: '4px 8px',
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f8f8f8',
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }}>
        {Object.values(ObjectKind).map(kind => (
          <label key={kind} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
            <input
              type="checkbox"
              checked={filter.includes(kind)}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilter(prev => [...prev, kind]);
                } else {
                  setFilter(prev => prev.filter(f => f !== kind));
                }
              }}
            />
            {getKindIcon(kind)} {kind}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Navigation Pane */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #ccc', 
          backgroundColor: 'white',
          overflow: 'auto'
        }}>
          {isSearchMode ? (
            /* Search Results */
            <div style={{ padding: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((result, index) => (
                <div
                  key={`${result.path}-${index}`}
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer',
                    backgroundColor: selectedItem === result.item ? '#e6f3ff' : 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '2px',
                    marginBottom: '2px'
                  }}
                  onClick={() => handleItemClick(result.item, result.kind)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                  onMouseLeave={(e) => {
                    if (selectedItem !== result.item) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{getKindIcon(result.kind)}</span>
                    <span style={{ fontWeight: 'bold' }}>{result.item.name}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginLeft: '20px' }}>
                    {result.path}
                  </div>
                  <div style={{ fontSize: '10px', color: '#999', marginLeft: '20px' }}>
                    {result.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tree View */
            <div style={{ padding: '8px' }}>
              {/* Libraries */}
              {libraries.map(library => (
                <div key={library.name} style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      padding: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      backgroundColor: selectedLibrary === library.name ? '#e6f3ff' : 'transparent',
                      borderRadius: '2px'
                    }}
                    onClick={() => {
                      setSelectedLibrary(library.name);
                      setSelectedModule('');
                      setSelectedClass('');
                    }}
                  >
                    <span>{getKindIcon(ObjectKind.Library)}</span> {library.name}
                  </div>
                  
                  {/* Modules */}
                  {selectedLibrary === library.name && library.modules.map(module => (
                    <div key={module.name} style={{ marginLeft: '16px', marginTop: '4px' }}>
                      <div
                        style={{
                          padding: '2px 4px',
                          cursor: 'pointer',
                          backgroundColor: selectedModule === module.name ? '#e6f3ff' : 'transparent',
                          borderRadius: '2px'
                        }}
                        onClick={() => {
                          setSelectedModule(module.name);
                          setSelectedClass('');
                        }}
                      >
                        <span>{getKindIcon(module.kind)}</span> {module.name}
                      </div>
                      
                      {/* Classes */}
                      {selectedModule === module.name && module.classes.map(cls => (
                        <div key={cls.name} style={{ marginLeft: '16px', marginTop: '2px' }}>
                          <div
                            style={{
                              padding: '2px 4px',
                              cursor: 'pointer',
                              backgroundColor: selectedClass === cls.name ? '#e6f3ff' : 'transparent',
                              borderRadius: '2px'
                            }}
                            onClick={() => {
                              setSelectedClass(cls.name);
                              handleItemClick(cls, ObjectKind.Class);
                            }}
                          >
                            <span>{getKindIcon(ObjectKind.Class)}</span> {cls.name}
                          </div>
                          
                          {/* Class Members */}
                          {selectedClass === cls.name && (
                            <div style={{ marginLeft: '16px' }}>
                              {/* Properties */}
                              {cls.properties.map(prop => (
                                <div
                                  key={`prop-${prop.name}`}
                                  style={{
                                    padding: '1px 4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    backgroundColor: selectedItem === prop ? '#e6f3ff' : 'transparent'
                                  }}
                                  onClick={() => handleItemClick(prop, ObjectKind.Property)}
                                >
                                  <span>{getAccessIcon(prop.access)}</span>
                                  <span>{getKindIcon(ObjectKind.Property)}</span> {prop.name}
                                </div>
                              ))}
                              
                              {/* Methods */}
                              {cls.methods.map(method => (
                                <div
                                  key={`method-${method.name}`}
                                  style={{
                                    padding: '1px 4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    backgroundColor: selectedItem === method ? '#e6f3ff' : 'transparent'
                                  }}
                                  onClick={() => handleItemClick(method, ObjectKind.Function)}
                                >
                                  <span>{getAccessIcon(method.access)}</span>
                                  <span>{getKindIcon(ObjectKind.Function)}</span> {method.name}
                                </div>
                              ))}
                              
                              {/* Events */}
                              {cls.events.map(event => (
                                <div
                                  key={`event-${event.name}`}
                                  style={{
                                    padding: '1px 4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    backgroundColor: selectedItem === event ? '#e6f3ff' : 'transparent'
                                  }}
                                  onClick={() => handleItemClick(event, ObjectKind.Event)}
                                >
                                  <span>{getKindIcon(ObjectKind.Event)}</span> {event.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Module Functions */}
                      {selectedModule === module.name && module.functions.map(func => (
                        <div
                          key={`func-${func.name}`}
                          style={{
                            padding: '2px 4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            marginLeft: '16px',
                            backgroundColor: selectedItem === func ? '#e6f3ff' : 'transparent'
                          }}
                          onClick={() => handleItemClick(func, ObjectKind.Function)}
                        >
                          <span>{getAccessIcon(func.access)}</span>
                          <span>{getKindIcon(ObjectKind.Function)}</span> {func.name}
                        </div>
                      ))}
                      
                      {/* Module Constants */}
                      {selectedModule === module.name && module.constants.map(constant => (
                        <div
                          key={`const-${constant.name}`}
                          style={{
                            padding: '2px 4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            marginLeft: '16px',
                            backgroundColor: selectedItem === constant ? '#e6f3ff' : 'transparent'
                          }}
                          onClick={() => handleItemClick(constant, ObjectKind.Constant)}
                        >
                          <span>{getAccessIcon(constant.access)}</span>
                          <span>{getKindIcon(ObjectKind.Constant)}</span> {constant.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Pane */}
        <div style={{ 
          flex: 1, 
          padding: '16px', 
          backgroundColor: 'white', 
          overflow: 'auto' 
        }}>
          {selectedItem && selectedItemKind ? (
            <div>
              {/* Header */}
              <div style={{ 
                borderBottom: '2px solid #ccc', 
                paddingBottom: '8px', 
                marginBottom: '16px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '16px', 
                  fontWeight: 'bold' 
                }}>
                  <span>{getKindIcon(selectedItemKind)}</span>
                  <span>{selectedItem.name}</span>
                  {selectedItem.access && (
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      ({selectedItem.access})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {selectedItemKind} in {selectedLibrary}.{selectedModule}
                  {selectedClass && `.${selectedClass}`}
                </div>
              </div>

              {/* Description */}
              {selectedItem.description && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Description</h4>
                  <p style={{ margin: 0, lineHeight: '1.4' }}>{selectedItem.description}</p>
                </div>
              )}

              {/* Syntax/Declaration */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Declaration</h4>
                <div style={{
                  backgroundColor: '#f8f8f8',
                  border: '1px solid #ddd',
                  padding: '8px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedItemKind === ObjectKind.Function && (() => {
                    const func = selectedItem as FunctionInfo;
                    return `${func.access} Function ${func.name}(${formatParameters(func.parameters)}) As ${func.returnType}`;
                  })()}
                  
                  {selectedItemKind === ObjectKind.Property && (() => {
                    const prop = selectedItem as PropertyInfo;
                    return `${prop.access} Property ${prop.name} As ${prop.type}${prop.isReadOnly ? ' (ReadOnly)' : ''}`;
                  })()}
                  
                  {selectedItemKind === ObjectKind.Constant && (() => {
                    const constant = selectedItem as ConstantInfo;
                    return `${constant.access} Const ${constant.name} As ${constant.type} = ${constant.value}`;
                  })()}
                  
                  {selectedItemKind === ObjectKind.Event && (() => {
                    const event = selectedItem as EventInfo;
                    return `Event ${event.name}(${formatParameters(event.parameters)})`;
                  })()}
                  
                  {selectedItemKind === ObjectKind.Class && (() => {
                    const cls = selectedItem as ClassInfo;
                    let decl = `${cls.access} Class ${cls.name}`;
                    if (cls.baseClass) decl += `\n    Inherits ${cls.baseClass}`;
                    if (cls.interfaces.length > 0) {
                      decl += `\n    Implements ${cls.interfaces.join(', ')}`;
                    }
                    return decl;
                  })()}
                </div>
              </div>

              {/* Parameters */}
              {selectedItem.parameters && selectedItem.parameters.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Parameters</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>Name</th>
                        <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>Type</th>
                        <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>Direction</th>
                        <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.parameters.map((param: ParameterInfo, index: number) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #ddd', padding: '4px' }}>
                            {param.name}{param.isOptional && ' (Optional)'}
                            {param.defaultValue && ` = ${param.defaultValue}`}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '4px' }}>{param.type}</td>
                          <td style={{ border: '1px solid #ddd', padding: '4px' }}>{param.direction}</td>
                          <td style={{ border: '1px solid #ddd', padding: '4px' }}>{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Class Members Summary */}
              {selectedItemKind === ObjectKind.Class && (() => {
                const cls = selectedItem as ClassInfo;
                return (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Members Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <h5 style={{ margin: '0 0 4px 0' }}>Properties ({cls.properties.length})</h5>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px' }}>
                          {cls.properties.slice(0, 5).map(prop => (
                            <li key={prop.name}>{prop.name}: {prop.type}</li>
                          ))}
                          {cls.properties.length > 5 && <li>... and {cls.properties.length - 5} more</li>}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 style={{ margin: '0 0 4px 0' }}>Methods ({cls.methods.length})</h5>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px' }}>
                          {cls.methods.slice(0, 5).map(method => (
                            <li key={method.name}>{method.name}(): {method.returnType}</li>
                          ))}
                          {cls.methods.length > 5 && <li>... and {cls.methods.length - 5} more</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div style={{ 
                borderTop: '1px solid #eee', 
                paddingTop: '8px', 
                display: 'flex', 
                gap: '8px' 
              }}>
                <button
                  onClick={() => copyDeclaration(selectedItem, selectedItemKind)}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Copy Declaration
                </button>
                
                {selectedItem.helpKeyword && (
                  <button
                    onClick={() => onShowHelp?.(selectedItem.helpKeyword)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Show Help
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#999', 
              marginTop: '50px',
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div>Select an item from the navigation pane to view details</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Use the search box to find specific objects, methods, or properties
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectBrowser;