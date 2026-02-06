import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// Type Library Browser Types
export enum TypeKind {
  Enum = 'Enum',
  Record = 'Record',
  Module = 'Module',
  Interface = 'Interface',
  Dispatch = 'Dispatch',
  CoClass = 'CoClass',
  Alias = 'Alias',
  Union = 'Union',
}

export enum MemberKind {
  Property = 'Property',
  Method = 'Method',
  Event = 'Event',
  Constant = 'Constant',
  Variable = 'Variable',
}

export enum ParameterDirection {
  In = 'In',
  Out = 'Out',
  InOut = 'InOut',
  RetVal = 'RetVal',
}

export enum VariantType {
  Empty = 'Empty',
  Null = 'Null',
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  Date = 'Date',
  String = 'String',
  Object = 'Object',
  Error = 'Error',
  Boolean = 'Boolean',
  Variant = 'Variant',
  Unknown = 'Unknown',
  Decimal = 'Decimal',
  Byte = 'Byte',
  Array = 'Array',
  ByRef = 'ByRef',
}

export interface TypeLibraryInfo {
  name: string;
  description: string;
  version: string;
  guid: string;
  fileName: string;
  helpFile?: string;
  helpContext?: number;
  majorVersion: number;
  minorVersion: number;
  lcid: number;
  flags: number;
}

export interface TypeParameter {
  name: string;
  type: VariantType;
  direction: ParameterDirection;
  optional: boolean;
  defaultValue?: any;
  description?: string;
}

export interface TypeMember {
  id: string;
  name: string;
  kind: MemberKind;
  type: VariantType;
  returnType?: VariantType;
  parameters: TypeParameter[];
  description?: string;
  helpContext?: number;
  dispId?: number;
  flags: number;
  isRestricted: boolean;
  isHidden: boolean;
  isSource: boolean;
  isDefaultMember: boolean;
  value?: any;
}

export interface TypeInfo {
  id: string;
  name: string;
  kind: TypeKind;
  guid: string;
  description?: string;
  helpFile?: string;
  helpContext?: number;
  flags: number;
  members: TypeMember[];
  implementedInterfaces: string[];
  baseInterface?: string;
  defaultInterface?: string;
  sourceInterface?: string;
  version: number;
  attributes: Record<string, any>;
}

export interface TypeLibrary {
  info: TypeLibraryInfo;
  types: TypeInfo[];
  constants: Array<{
    name: string;
    value: any;
    type: VariantType;
    description?: string;
  }>;
  modules: Array<{
    name: string;
    members: TypeMember[];
    description?: string;
  }>;
}

export interface BrowseFilter {
  showInterfaces: boolean;
  showCoClasses: boolean;
  showEnums: boolean;
  showModules: boolean;
  showRecords: boolean;
  showAliases: boolean;
  showHidden: boolean;
  showRestricted: boolean;
  searchText: string;
  typeFilter: TypeKind | 'All';
}

interface TypeLibraryBrowserProps {
  onLoadTypeLibrary?: (fileName: string) => Promise<TypeLibrary>;
  onGenerateCode?: (typeInfo: TypeInfo, language: 'VB6' | 'C++' | 'IDL') => string;
  onAddReference?: (typeLibrary: TypeLibrary) => void;
  onRemoveReference?: (guid: string) => void;
  onShowHelp?: (helpFile: string, context: number) => void;
}

export const TypeLibraryBrowser: React.FC<TypeLibraryBrowserProps> = ({
  onLoadTypeLibrary,
  onGenerateCode,
  onAddReference,
  onRemoveReference,
  onShowHelp,
}) => {
  const [typeLibraries, setTypeLibraries] = useState<TypeLibrary[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<TypeLibrary | null>(null);
  const [selectedType, setSelectedType] = useState<TypeInfo | null>(null);
  const [selectedMember, setSelectedMember] = useState<TypeMember | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<BrowseFilter>({
    showInterfaces: true,
    showCoClasses: true,
    showEnums: true,
    showModules: true,
    showRecords: true,
    showAliases: true,
    showHidden: false,
    showRestricted: false,
    searchText: '',
    typeFilter: 'All',
  });
  const [activeTab, setActiveTab] = useState<'types' | 'members' | 'details' | 'code'>('types');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState<'VB6' | 'C++' | 'IDL'>('VB6');

  const eventEmitter = useRef(new EventEmitter());

  // Initialize with common type libraries
  useEffect(() => {
    const commonLibraries: TypeLibrary[] = [
      {
        info: {
          name: 'stdole',
          description: 'OLE Automation',
          version: '2.0',
          guid: '{00020430-0000-0000-C000-000000000046}',
          fileName: 'stdole2.tlb',
          majorVersion: 2,
          minorVersion: 0,
          lcid: 0,
          flags: 0,
        },
        types: [
          {
            id: 'IUnknown',
            name: 'IUnknown',
            kind: TypeKind.Interface,
            guid: '{00000000-0000-0000-C000-000000000046}',
            description: 'Base interface for all COM objects',
            flags: 0,
            members: [
              {
                id: 'QueryInterface',
                name: 'QueryInterface',
                kind: MemberKind.Method,
                type: VariantType.Long,
                returnType: VariantType.Long,
                parameters: [
                  {
                    name: 'riid',
                    type: VariantType.ByRef,
                    direction: ParameterDirection.In,
                    optional: false,
                  },
                  {
                    name: 'ppvObject',
                    type: VariantType.ByRef,
                    direction: ParameterDirection.Out,
                    optional: false,
                  },
                ],
                description: 'Queries the object for a specific interface',
                dispId: -1,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
              {
                id: 'AddRef',
                name: 'AddRef',
                kind: MemberKind.Method,
                type: VariantType.Long,
                returnType: VariantType.Long,
                parameters: [],
                description: 'Increments the reference count',
                dispId: -1,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
              {
                id: 'Release',
                name: 'Release',
                kind: MemberKind.Method,
                type: VariantType.Long,
                returnType: VariantType.Long,
                parameters: [],
                description: 'Decrements the reference count',
                dispId: -1,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
            ],
            implementedInterfaces: [],
            version: 1,
            attributes: {},
          },
          {
            id: 'IDispatch',
            name: 'IDispatch',
            kind: TypeKind.Dispatch,
            guid: '{00020400-0000-0000-C000-000000000046}',
            description: 'Automation interface',
            baseInterface: 'IUnknown',
            flags: 0,
            members: [
              {
                id: 'GetTypeInfoCount',
                name: 'GetTypeInfoCount',
                kind: MemberKind.Method,
                type: VariantType.Long,
                returnType: VariantType.Long,
                parameters: [
                  {
                    name: 'pctinfo',
                    type: VariantType.ByRef,
                    direction: ParameterDirection.Out,
                    optional: false,
                  },
                ],
                description: 'Gets the number of type information interfaces',
                dispId: -1,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
              {
                id: 'GetTypeInfo',
                name: 'GetTypeInfo',
                kind: MemberKind.Method,
                type: VariantType.Long,
                returnType: VariantType.Long,
                parameters: [
                  {
                    name: 'iTInfo',
                    type: VariantType.Integer,
                    direction: ParameterDirection.In,
                    optional: false,
                  },
                  {
                    name: 'lcid',
                    type: VariantType.Long,
                    direction: ParameterDirection.In,
                    optional: false,
                  },
                  {
                    name: 'ppTInfo',
                    type: VariantType.ByRef,
                    direction: ParameterDirection.Out,
                    optional: false,
                  },
                ],
                description: 'Gets type information for an object',
                dispId: -1,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
            ],
            implementedInterfaces: ['IUnknown'],
            version: 1,
            attributes: {},
          },
        ],
        constants: [
          {
            name: 'vbTrue',
            value: -1,
            type: VariantType.Boolean,
            description: 'Boolean True value',
          },
          {
            name: 'vbFalse',
            value: 0,
            type: VariantType.Boolean,
            description: 'Boolean False value',
          },
          {
            name: 'vbNullString',
            value: '',
            type: VariantType.String,
            description: 'Null string constant',
          },
        ],
        modules: [],
      },
      {
        info: {
          name: 'ADODB',
          description: 'Microsoft ActiveX Data Objects 2.8 Library',
          version: '2.8',
          guid: '{2A75196C-D9EB-4129-B803-931327F72D5C}',
          fileName: 'msado15.dll',
          majorVersion: 2,
          minorVersion: 8,
          lcid: 0,
          flags: 0,
        },
        types: [
          {
            id: 'Connection',
            name: 'Connection',
            kind: TypeKind.CoClass,
            guid: '{00000514-0000-0010-8000-00AA006D2EA4}',
            description: 'Connection Object',
            defaultInterface: '_Connection',
            flags: 0,
            members: [],
            implementedInterfaces: ['_Connection', 'ConnectionEvents'],
            version: 1,
            attributes: {},
          },
          {
            id: '_Connection',
            name: '_Connection',
            kind: TypeKind.Dispatch,
            guid: '{00000550-0000-0010-8000-00AA006D2EA4}',
            description: 'Connection Object Interface',
            baseInterface: 'IDispatch',
            flags: 0,
            members: [
              {
                id: 'ConnectionString',
                name: 'ConnectionString',
                kind: MemberKind.Property,
                type: VariantType.String,
                parameters: [],
                description: 'Information used to establish a connection to a data source',
                dispId: 0,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
              {
                id: 'Open',
                name: 'Open',
                kind: MemberKind.Method,
                type: VariantType.Empty,
                parameters: [
                  {
                    name: 'ConnectionString',
                    type: VariantType.String,
                    direction: ParameterDirection.In,
                    optional: true,
                  },
                  {
                    name: 'UserID',
                    type: VariantType.String,
                    direction: ParameterDirection.In,
                    optional: true,
                  },
                  {
                    name: 'Password',
                    type: VariantType.String,
                    direction: ParameterDirection.In,
                    optional: true,
                  },
                  {
                    name: 'Options',
                    type: VariantType.Long,
                    direction: ParameterDirection.In,
                    optional: true,
                    defaultValue: -1,
                  },
                ],
                description: 'Opens a connection to a data source',
                dispId: 1,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
              {
                id: 'Close',
                name: 'Close',
                kind: MemberKind.Method,
                type: VariantType.Empty,
                parameters: [],
                description: 'Closes an open connection',
                dispId: 2,
                flags: 0,
                isRestricted: false,
                isHidden: false,
                isSource: false,
                isDefaultMember: false,
              },
            ],
            implementedInterfaces: ['IDispatch'],
            version: 1,
            attributes: {},
          },
        ],
        constants: [],
        modules: [],
      },
    ];

    setTypeLibraries(commonLibraries);
    setSelectedLibrary(commonLibraries[0]);
  }, []);

  // Filter types based on current filter settings
  const filteredTypes = useMemo(() => {
    if (!selectedLibrary) return [];

    return selectedLibrary.types.filter(type => {
      // Type kind filter
      if (filter.typeFilter !== 'All' && type.kind !== filter.typeFilter) return false;

      // Visibility filters
      if (!filter.showInterfaces && type.kind === TypeKind.Interface) return false;
      if (!filter.showCoClasses && type.kind === TypeKind.CoClass) return false;
      if (!filter.showEnums && type.kind === TypeKind.Enum) return false;
      if (!filter.showModules && type.kind === TypeKind.Module) return false;
      if (!filter.showRecords && type.kind === TypeKind.Record) return false;
      if (!filter.showAliases && type.kind === TypeKind.Alias) return false;

      // Hidden/Restricted filters
      if (!filter.showHidden && (type.flags & 0x10) !== 0) return false;
      if (!filter.showRestricted && (type.flags & 0x01) !== 0) return false;

      // Search filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        return (
          type.name.toLowerCase().includes(searchLower) ||
          (type.description && type.description.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [selectedLibrary, filter]);

  // Filter members based on current filter settings
  const filteredMembers = useMemo(() => {
    if (!selectedType) return [];

    return selectedType.members.filter(member => {
      // Hidden/Restricted filters
      if (!filter.showHidden && member.isHidden) return false;
      if (!filter.showRestricted && member.isRestricted) return false;

      // Search filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        return (
          member.name.toLowerCase().includes(searchLower) ||
          (member.description && member.description.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [selectedType, filter]);

  // Toggle node expansion
  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Load type library
  const loadTypeLibrary = useCallback(
    async (fileName: string) => {
      if (!onLoadTypeLibrary) return;

      try {
        const typeLibrary = await onLoadTypeLibrary(fileName);
        setTypeLibraries(prev => [...prev, typeLibrary]);
        setSelectedLibrary(typeLibrary);
      } catch (error) {
        console.error('Failed to load type library:', error);
      }
    },
    [onLoadTypeLibrary]
  );

  // Generate code for selected type
  const generateCode = useCallback(() => {
    if (!selectedType || !onGenerateCode) return;

    const code = onGenerateCode(selectedType, codeLanguage);
    setGeneratedCode(code);
    setActiveTab('code');
  }, [selectedType, codeLanguage, onGenerateCode]);

  // Get type kind icon
  const getTypeKindIcon = (kind: TypeKind): string => {
    switch (kind) {
      case TypeKind.Interface:
        return '🔌';
      case TypeKind.CoClass:
        return '🏭';
      case TypeKind.Enum:
        return '📝';
      case TypeKind.Record:
        return '📄';
      case TypeKind.Module:
        return '📦';
      case TypeKind.Dispatch:
        return '⚡';
      case TypeKind.Alias:
        return '🔗';
      case TypeKind.Union:
        return '🔀';
      default:
        return '❓';
    }
  };

  // Get member kind icon
  const getMemberKindIcon = (kind: MemberKind): string => {
    switch (kind) {
      case MemberKind.Property:
        return '🏷️';
      case MemberKind.Method:
        return '🔧';
      case MemberKind.Event:
        return '⚡';
      case MemberKind.Constant:
        return '📌';
      case MemberKind.Variable:
        return '📦';
      default:
        return '❓';
    }
  };

  // Format parameter signature
  const formatParameterSignature = (parameters: TypeParameter[]): string => {
    return parameters
      .map(param => {
        let sig = '';
        if (param.direction === ParameterDirection.Out) sig += 'ByRef ';
        if (param.optional) sig += 'Optional ';
        sig += `${param.name} As ${param.type}`;
        if (param.defaultValue !== undefined) sig += ` = ${param.defaultValue}`;
        return sig;
      })
      .join(', ');
  };

  // Format member signature
  const formatMemberSignature = (member: TypeMember): string => {
    let sig = '';

    switch (member.kind) {
      case MemberKind.Method:
        if (member.returnType && member.returnType !== VariantType.Empty) {
          sig = `Function ${member.name}(${formatParameterSignature(member.parameters)}) As ${member.returnType}`;
        } else {
          sig = `Sub ${member.name}(${formatParameterSignature(member.parameters)})`;
        }
        break;
      case MemberKind.Property:
        sig = `Property ${member.name} As ${member.type}`;
        break;
      case MemberKind.Event:
        sig = `Event ${member.name}(${formatParameterSignature(member.parameters)})`;
        break;
      case MemberKind.Constant:
        sig = `Const ${member.name} As ${member.type} = ${member.value}`;
        break;
      case MemberKind.Variable:
        sig = `Dim ${member.name} As ${member.type}`;
        break;
    }

    return sig;
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-800">Type Library Browser</h3>
          {selectedLibrary && (
            <span className="text-xs text-gray-500">
              ({selectedLibrary.info.name} v{selectedLibrary.info.version})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLoadDialog(true)}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Load Type Library"
          >
            📂
          </button>

          <button
            onClick={() => selectedLibrary && onAddReference?.(selectedLibrary)}
            disabled={!selectedLibrary}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            title="Add Reference"
          >
            ➕
          </button>

          <button
            onClick={generateCode}
            disabled={!selectedType}
            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            title="Generate Code"
          >
            💻
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <select
          value={selectedLibrary?.info.guid || ''}
          onChange={e => {
            const library = typeLibraries.find(lib => lib.info.guid === e.target.value);
            setSelectedLibrary(library || null);
            setSelectedType(null);
            setSelectedMember(null);
          }}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="">Select Type Library...</option>
          {typeLibraries.map(lib => (
            <option key={lib.info.guid} value={lib.info.guid}>
              {lib.info.name} v{lib.info.version}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={filter.searchText}
          onChange={e => setFilter(prev => ({ ...prev, searchText: e.target.value }))}
          className="px-2 py-1 text-xs border border-gray-300 rounded w-32"
        />

        <select
          value={filter.typeFilter}
          onChange={e =>
            setFilter(prev => ({ ...prev, typeFilter: e.target.value as TypeKind | 'All' }))
          }
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="All">All Types</option>
          {Object.values(TypeKind).map(kind => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filter.showInterfaces}
                onChange={e => setFilter(prev => ({ ...prev, showInterfaces: e.target.checked }))}
              />
              Interfaces
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filter.showCoClasses}
                onChange={e => setFilter(prev => ({ ...prev, showCoClasses: e.target.checked }))}
              />
              CoClasses
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filter.showEnums}
                onChange={e => setFilter(prev => ({ ...prev, showEnums: e.target.checked }))}
              />
              Enums
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filter.showModules}
                onChange={e => setFilter(prev => ({ ...prev, showModules: e.target.checked }))}
              />
              Modules
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filter.showHidden}
                onChange={e => setFilter(prev => ({ ...prev, showHidden: e.target.checked }))}
              />
              Hidden
            </label>

            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filter.showRestricted}
                onChange={e => setFilter(prev => ({ ...prev, showRestricted: e.target.checked }))}
              />
              Restricted
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-300">
        {[
          { key: 'types', label: 'Types', icon: '📋' },
          { key: 'members', label: 'Members', icon: '🔧' },
          { key: 'details', label: 'Details', icon: 'ℹ️' },
          { key: 'code', label: 'Code', icon: '💻' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm ${
              activeTab === tab.key
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Types Tab */}
        {activeTab === 'types' && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-2">
              {selectedLibrary ? (
                <div className="space-y-1">
                  {filteredTypes.map(type => {
                    const isSelected = selectedType?.id === type.id;
                    const isExpanded = expandedNodes.has(type.id);

                    return (
                      <div key={type.id}>
                        <div
                          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
                            isSelected ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => {
                            setSelectedType(type);
                            setSelectedMember(null);
                          }}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleExpanded(type.id);
                            }}
                            className="w-4 text-center text-gray-600"
                          >
                            {type.members.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
                          </button>

                          <span className="text-lg">{getTypeKindIcon(type.kind)}</span>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{type.name}</div>
                            {type.description && (
                              <div className="text-xs text-gray-600 truncate">
                                {type.description}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-gray-500">{type.kind}</div>
                        </div>

                        {/* Type Members */}
                        {isExpanded && (
                          <div className="ml-6 border-l border-gray-200 pl-2">
                            {type.members.map(member => (
                              <div
                                key={member.id}
                                className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
                                  selectedMember?.id === member.id ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => setSelectedMember(member)}
                              >
                                <span>{getMemberKindIcon(member.kind)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm truncate">{member.name}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {member.kind} - {member.type}
                                  </div>
                                </div>
                                {member.isHidden && <span className="text-red-600 text-xs">H</span>}
                                {member.isRestricted && (
                                  <span className="text-orange-600 text-xs">R</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <p className="text-lg">No Type Library Selected</p>
                    <p className="text-sm mt-2">Select a type library to browse its types</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-2">
              {selectedType ? (
                <div className="space-y-1">
                  {filteredMembers.map(member => (
                    <div
                      key={member.id}
                      className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedMember?.id === member.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span>{getMemberKindIcon(member.kind)}</span>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-gray-500">({member.kind})</div>
                        {member.isHidden && <span className="text-red-600 text-xs">Hidden</span>}
                        {member.isRestricted && (
                          <span className="text-orange-600 text-xs">Restricted</span>
                        )}
                        {member.isDefaultMember && (
                          <span className="text-green-600 text-xs">Default</span>
                        )}
                      </div>

                      <div className="text-sm font-mono text-gray-700 bg-gray-100 p-2 rounded">
                        {formatMemberSignature(member)}
                      </div>

                      {member.description && (
                        <div className="text-xs text-gray-600 mt-2">{member.description}</div>
                      )}

                      {member.dispId !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">DispID: {member.dispId}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔧</div>
                    <p className="text-lg">No Type Selected</p>
                    <p className="text-sm mt-2">Select a type to view its members</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              {selectedType ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg mb-2">{selectedType.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Type:</label>
                        <div>{selectedType.kind}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">GUID:</label>
                        <div className="font-mono text-xs">{selectedType.guid}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Version:</label>
                        <div>{selectedType.version}</div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Flags:</label>
                        <div>0x{selectedType.flags.toString(16).toUpperCase()}</div>
                      </div>
                    </div>
                  </div>

                  {selectedType.description && (
                    <div>
                      <label className="font-medium text-gray-700">Description:</label>
                      <div className="text-sm mt-1">{selectedType.description}</div>
                    </div>
                  )}

                  {selectedType.baseInterface && (
                    <div>
                      <label className="font-medium text-gray-700">Base Interface:</label>
                      <div className="text-sm mt-1">{selectedType.baseInterface}</div>
                    </div>
                  )}

                  {selectedType.implementedInterfaces.length > 0 && (
                    <div>
                      <label className="font-medium text-gray-700">Implemented Interfaces:</label>
                      <div className="text-sm mt-1">
                        {selectedType.implementedInterfaces.map(iface => (
                          <div key={iface} className="py-1">
                            {iface}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedType.helpFile && (
                    <div>
                      <label className="font-medium text-gray-700">Help File:</label>
                      <div className="text-sm mt-1">
                        {selectedType.helpFile}
                        {selectedType.helpContext && (
                          <span className="ml-2 text-gray-500">
                            (Context: {selectedType.helpContext})
                          </span>
                        )}
                        <button
                          onClick={() =>
                            selectedType.helpFile &&
                            selectedType.helpContext &&
                            onShowHelp?.(selectedType.helpFile, selectedType.helpContext)
                          }
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          View Help
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-medium text-gray-700">Member Count:</label>
                    <div className="text-sm mt-1">{selectedType.members.length}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">ℹ️</div>
                    <p className="text-lg">No Type Selected</p>
                    <p className="text-sm mt-2">Select a type to view detailed information</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <div className="flex-1 overflow-hidden">
            <div className="p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Language:</label>
                <select
                  value={codeLanguage}
                  onChange={e => setCodeLanguage(e.target.value as 'VB6' | 'C++' | 'IDL')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="VB6">Visual Basic 6</option>
                  <option value="C++">C++</option>
                  <option value="IDL">IDL</option>
                </select>
                <button
                  onClick={generateCode}
                  disabled={!selectedType}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {generatedCode ? (
                <pre className="text-sm font-mono bg-gray-100 p-4 rounded border overflow-x-auto">
                  {generatedCode}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💻</div>
                    <p className="text-lg">No Code Generated</p>
                    <p className="text-sm mt-2">Select a type and click Generate to create code</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Libraries: {typeLibraries.length}</span>
          {selectedLibrary && (
            <>
              <span>
                Types: {filteredTypes.length}/{selectedLibrary.types.length}
              </span>
              <span>Constants: {selectedLibrary.constants.length}</span>
            </>
          )}
          {selectedType && (
            <span>
              Members: {filteredMembers.length}/{selectedType.members.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedLibrary && <span>GUID: {selectedLibrary.info.guid}</span>}
        </div>
      </div>
    </div>
  );
};

export default TypeLibraryBrowser;
