import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Book, 
  Package, 
  FileText, 
  Code, 
  Settings, 
  Copy,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Folder,
  FolderOpen,
  Function,
  Variable,
  Class
} from 'lucide-react';
import { vb6TypeSystem } from '../../services/VB6TypeSystem';

interface ObjectBrowserProps {
  visible: boolean;
  onClose: () => void;
}

interface ObjectBrowserItem {
  id: string;
  name: string;
  type: 'library' | 'class' | 'module' | 'interface' | 'enum' | 'udt' | 'function' | 'property' | 'variable' | 'constant' | 'event';
  parent?: string;
  children?: ObjectBrowserItem[];
  description?: string;
  syntax?: string;
  value?: any;
  access: 'public' | 'private' | 'friend';
  static?: boolean;
  readonly?: boolean;
  library?: string;
}

const ObjectBrowser: React.FC<ObjectBrowserProps> = ({ visible, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState('VB6 Runtime');
  const [selectedItem, setSelectedItem] = useState<ObjectBrowserItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['vb6-runtime', 'project']));
  const [showDetails, setShowDetails] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showInherited, setShowInherited] = useState(false);
  const [memberFilter, setMemberFilter] = useState<'all' | 'methods' | 'properties' | 'events' | 'constants'>('all');
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'type'>('alphabetical');

  const treeRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Generate object browser data
  const objectBrowserData = useMemo(() => {
    const data: ObjectBrowserItem[] = [];

    // VB6 Runtime Library
    const vb6Runtime: ObjectBrowserItem = {
      id: 'vb6-runtime',
      name: 'VB6 Runtime',
      type: 'library',
      access: 'public',
      description: 'Visual Basic 6.0 Runtime Library',
      children: []
    };

    // Built-in objects and functions
    const builtInObjects = [
      {
        id: 'app',
        name: 'App',
        type: 'class' as const,
        access: 'public' as const,
        description: 'Returns information about the current application',
        children: [
          { id: 'app-title', name: 'Title', type: 'property' as const, access: 'public' as const, description: 'Application title' },
          { id: 'app-path', name: 'Path', type: 'property' as const, access: 'public' as const, description: 'Application path' },
          { id: 'app-exename', name: 'EXEName', type: 'property' as const, access: 'public' as const, description: 'Executable name' },
          { id: 'app-major', name: 'Major', type: 'property' as const, access: 'public' as const, description: 'Major version number' },
          { id: 'app-minor', name: 'Minor', type: 'property' as const, access: 'public' as const, description: 'Minor version number' }
        ]
      },
      {
        id: 'debug',
        name: 'Debug',
        type: 'class' as const,
        access: 'public' as const,
        description: 'Provides debugging output capabilities',
        children: [
          { id: 'debug-print', name: 'Print', type: 'function' as const, access: 'public' as const, syntax: 'Debug.Print [outputlist]', description: 'Prints text to the Debug window' },
          { id: 'debug-assert', name: 'Assert', type: 'function' as const, access: 'public' as const, syntax: 'Debug.Assert booleanexpression', description: 'Conditionally suspends execution' }
        ]
      },
      {
        id: 'err',
        name: 'Err',
        type: 'class' as const,
        access: 'public' as const,
        description: 'Contains information about run-time errors',
        children: [
          { id: 'err-number', name: 'Number', type: 'property' as const, access: 'public' as const, description: 'Error number' },
          { id: 'err-description', name: 'Description', type: 'property' as const, access: 'public' as const, description: 'Error description' },
          { id: 'err-source', name: 'Source', type: 'property' as const, access: 'public' as const, description: 'Source of error' },
          { id: 'err-clear', name: 'Clear', type: 'function' as const, access: 'public' as const, syntax: 'Err.Clear', description: 'Clears error information' },
          { id: 'err-raise', name: 'Raise', type: 'function' as const, access: 'public' as const, syntax: 'Err.Raise number, [source], [description]', description: 'Raises an error' }
        ]
      },
      {
        id: 'screen',
        name: 'Screen',
        type: 'class' as const,
        access: 'public' as const,
        description: 'Provides information about screen dimensions and active controls',
        children: [
          { id: 'screen-width', name: 'Width', type: 'property' as const, access: 'public' as const, description: 'Screen width in twips' },
          { id: 'screen-height', name: 'Height', type: 'property' as const, access: 'public' as const, description: 'Screen height in twips' },
          { id: 'screen-activeform', name: 'ActiveForm', type: 'property' as const, access: 'public' as const, description: 'Currently active form' },
          { id: 'screen-activecontrol', name: 'ActiveControl', type: 'property' as const, access: 'public' as const, description: 'Currently active control' }
        ]
      }
    ];

    vb6Runtime.children!.push(...builtInObjects);

    // Built-in functions
    const builtInFunctions: ObjectBrowserItem = {
      id: 'builtin-functions',
      name: 'Built-in Functions',
      type: 'module',
      access: 'public',
      description: 'VB6 Built-in Functions',
      children: [
        // String functions
        { id: 'len', name: 'Len', type: 'function', access: 'public', syntax: 'Len(string)', description: 'Returns the length of a string' },
        { id: 'left', name: 'Left', type: 'function', access: 'public', syntax: 'Left(string, length)', description: 'Returns leftmost characters' },
        { id: 'right', name: 'Right', type: 'function', access: 'public', syntax: 'Right(string, length)', description: 'Returns rightmost characters' },
        { id: 'mid', name: 'Mid', type: 'function', access: 'public', syntax: 'Mid(string, start, [length])', description: 'Returns substring' },
        { id: 'ucase', name: 'UCase', type: 'function', access: 'public', syntax: 'UCase(string)', description: 'Converts to uppercase' },
        { id: 'lcase', name: 'LCase', type: 'function', access: 'public', syntax: 'LCase(string)', description: 'Converts to lowercase' },
        { id: 'trim', name: 'Trim', type: 'function', access: 'public', syntax: 'Trim(string)', description: 'Removes leading and trailing spaces' },
        { id: 'ltrim', name: 'LTrim', type: 'function', access: 'public', syntax: 'LTrim(string)', description: 'Removes leading spaces' },
        { id: 'rtrim', name: 'RTrim', type: 'function', access: 'public', syntax: 'RTrim(string)', description: 'Removes trailing spaces' },
        { id: 'instr', name: 'InStr', type: 'function', access: 'public', syntax: 'InStr([start,] string1, string2)', description: 'Finds substring position' },
        { id: 'replace', name: 'Replace', type: 'function', access: 'public', syntax: 'Replace(expression, find, replacewith)', description: 'Replaces substring' },
        { id: 'strcomp', name: 'StrComp', type: 'function', access: 'public', syntax: 'StrComp(string1, string2, [compare])', description: 'Compares strings' },
        
        // Math functions
        { id: 'abs', name: 'Abs', type: 'function', access: 'public', syntax: 'Abs(number)', description: 'Returns absolute value' },
        { id: 'int', name: 'Int', type: 'function', access: 'public', syntax: 'Int(number)', description: 'Returns integer portion' },
        { id: 'fix', name: 'Fix', type: 'function', access: 'public', syntax: 'Fix(number)', description: 'Returns integer portion (truncates)' },
        { id: 'round', name: 'Round', type: 'function', access: 'public', syntax: 'Round(number, [decimals])', description: 'Rounds to specified decimals' },
        { id: 'sqr', name: 'Sqr', type: 'function', access: 'public', syntax: 'Sqr(number)', description: 'Returns square root' },
        { id: 'sin', name: 'Sin', type: 'function', access: 'public', syntax: 'Sin(number)', description: 'Returns sine' },
        { id: 'cos', name: 'Cos', type: 'function', access: 'public', syntax: 'Cos(number)', description: 'Returns cosine' },
        { id: 'tan', name: 'Tan', type: 'function', access: 'public', syntax: 'Tan(number)', description: 'Returns tangent' },
        { id: 'atn', name: 'Atn', type: 'function', access: 'public', syntax: 'Atn(number)', description: 'Returns arctangent' },
        { id: 'exp', name: 'Exp', type: 'function', access: 'public', syntax: 'Exp(number)', description: 'Returns e raised to power' },
        { id: 'log', name: 'Log', type: 'function', access: 'public', syntax: 'Log(number)', description: 'Returns natural logarithm' },
        { id: 'rnd', name: 'Rnd', type: 'function', access: 'public', syntax: 'Rnd([number])', description: 'Returns random number' },
        
        // Date/Time functions
        { id: 'now', name: 'Now', type: 'function', access: 'public', syntax: 'Now', description: 'Returns current date and time' },
        { id: 'date', name: 'Date', type: 'function', access: 'public', syntax: 'Date', description: 'Returns current date' },
        { id: 'time', name: 'Time', type: 'function', access: 'public', syntax: 'Time', description: 'Returns current time' },
        { id: 'dateadd', name: 'DateAdd', type: 'function', access: 'public', syntax: 'DateAdd(interval, number, date)', description: 'Adds time interval to date' },
        { id: 'datediff', name: 'DateDiff', type: 'function', access: 'public', syntax: 'DateDiff(interval, date1, date2)', description: 'Returns difference between dates' },
        { id: 'datepart', name: 'DatePart', type: 'function', access: 'public', syntax: 'DatePart(interval, date)', description: 'Returns part of date' },
        { id: 'year', name: 'Year', type: 'function', access: 'public', syntax: 'Year(date)', description: 'Returns year' },
        { id: 'month', name: 'Month', type: 'function', access: 'public', syntax: 'Month(date)', description: 'Returns month' },
        { id: 'day', name: 'Day', type: 'function', access: 'public', syntax: 'Day(date)', description: 'Returns day' },
        
        // Type conversion functions
        { id: 'cstr', name: 'CStr', type: 'function', access: 'public', syntax: 'CStr(expression)', description: 'Converts to String' },
        { id: 'cint', name: 'CInt', type: 'function', access: 'public', syntax: 'CInt(expression)', description: 'Converts to Integer' },
        { id: 'clng', name: 'CLng', type: 'function', access: 'public', syntax: 'CLng(expression)', description: 'Converts to Long' },
        { id: 'csng', name: 'CSng', type: 'function', access: 'public', syntax: 'CSng(expression)', description: 'Converts to Single' },
        { id: 'cdbl', name: 'CDbl', type: 'function', access: 'public', syntax: 'CDbl(expression)', description: 'Converts to Double' },
        { id: 'cbool', name: 'CBool', type: 'function', access: 'public', syntax: 'CBool(expression)', description: 'Converts to Boolean' },
        { id: 'cdate', name: 'CDate', type: 'function', access: 'public', syntax: 'CDate(expression)', description: 'Converts to Date' },
        { id: 'cvar', name: 'CVar', type: 'function', access: 'public', syntax: 'CVar(expression)', description: 'Converts to Variant' },
        
        // File functions
        { id: 'dir', name: 'Dir', type: 'function', access: 'public', syntax: 'Dir(pathname, [attributes])', description: 'Returns filename matching pattern' },
        { id: 'filelen', name: 'FileLen', type: 'function', access: 'public', syntax: 'FileLen(pathname)', description: 'Returns file length' },
        { id: 'filedatetime', name: 'FileDateTime', type: 'function', access: 'public', syntax: 'FileDateTime(pathname)', description: 'Returns file modification date' },
        { id: 'getattr', name: 'GetAttr', type: 'function', access: 'public', syntax: 'GetAttr(pathname)', description: 'Returns file attributes' },
        
        // Input/Output functions
        { id: 'inputbox', name: 'InputBox', type: 'function', access: 'public', syntax: 'InputBox(prompt, [title], [default])', description: 'Displays input dialog' },
        { id: 'msgbox', name: 'MsgBox', type: 'function', access: 'public', syntax: 'MsgBox(prompt, [buttons], [title])', description: 'Displays message box' }
      ]
    };

    vb6Runtime.children!.push(builtInFunctions);

    // Constants
    const constants: ObjectBrowserItem = {
      id: 'constants',
      name: 'Constants',
      type: 'module',
      access: 'public',
      description: 'VB6 Built-in Constants',
      children: [
        { id: 'vbtrue', name: 'vbTrue', type: 'constant', access: 'public', value: -1, description: 'Boolean True value' },
        { id: 'vbfalse', name: 'vbFalse', type: 'constant', access: 'public', value: 0, description: 'Boolean False value' },
        { id: 'vbcrlf', name: 'vbCrLf', type: 'constant', access: 'public', value: '\r\n', description: 'Carriage return + line feed' },
        { id: 'vbcr', name: 'vbCr', type: 'constant', access: 'public', value: '\r', description: 'Carriage return' },
        { id: 'vblf', name: 'vbLf', type: 'constant', access: 'public', value: '\n', description: 'Line feed' },
        { id: 'vbtab', name: 'vbTab', type: 'constant', access: 'public', value: '\t', description: 'Tab character' }
      ]
    };

    vb6Runtime.children!.push(constants);

    data.push(vb6Runtime);

    // Current Project
    const currentProject: ObjectBrowserItem = {
      id: 'project',
      name: 'Current Project',
      type: 'library',
      access: 'public',
      description: 'Current VB6 Project',
      children: []
    };

    // Add UDTs from type system
    const udts = vb6TypeSystem.getAllUDTs();
    if (udts.length > 0) {
      const udtModule: ObjectBrowserItem = {
        id: 'project-udts',
        name: 'User Defined Types',
        type: 'module',
        access: 'public',
        description: 'User Defined Types in current project',
        children: udts.map(udt => ({
          id: `udt-${udt.name}`,
          name: udt.name,
          type: 'udt' as const,
          access: udt.visibility,
          description: `User Defined Type: ${udt.name}`,
          children: udt.fields.map(field => ({
            id: `udt-${udt.name}-${field.name}`,
            name: field.name,
            type: 'variable' as const,
            access: 'public' as const,
            description: `${field.name} As ${field.type}${field.isArray ? '()' : ''}${field.isFixedString ? ` * ${field.fixedStringLength}` : ''}`
          }))
        }))
      };
      currentProject.children!.push(udtModule);
    }

    // Add Enums from type system
    const enums = vb6TypeSystem.getAllEnums();
    if (enums.length > 0) {
      const enumModule: ObjectBrowserItem = {
        id: 'project-enums',
        name: 'Enumerations',
        type: 'module',
        access: 'public',
        description: 'Enumerations in current project',
        children: enums.map(enumDef => ({
          id: `enum-${enumDef.name}`,
          name: enumDef.name,
          type: 'enum' as const,
          access: enumDef.visibility,
          description: `Enumeration: ${enumDef.name}`,
          children: enumDef.values.map(value => ({
            id: `enum-${enumDef.name}-${value.name}`,
            name: value.name,
            type: 'constant' as const,
            access: 'public' as const,
            value: value.value,
            description: `${value.name} = ${value.value}`
          }))
        }))
      };
      currentProject.children!.push(enumModule);
    }

    // Add Constants from type system
    const projectConstants = vb6TypeSystem.getAllConstants().filter(c => c.name !== 'vbTrue' && c.name !== 'vbFalse'); // Exclude built-ins
    if (projectConstants.length > 0) {
      const constModule: ObjectBrowserItem = {
        id: 'project-constants',
        name: 'Constants',
        type: 'module',
        access: 'public',
        description: 'Constants in current project',
        children: projectConstants.map(constant => ({
          id: `const-${constant.name}`,
          name: constant.name,
          type: 'constant' as const,
          access: constant.visibility,
          value: constant.value,
          description: `${constant.name}${constant.type ? ` As ${constant.type}` : ''} = ${constant.value}`
        }))
      };
      currentProject.children!.push(constModule);
    }

    data.push(currentProject);

    return data;
  }, []);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm) return objectBrowserData;

    const filterRecursive = (items: ObjectBrowserItem[]): ObjectBrowserItem[] => {
      return items.reduce((acc: ObjectBrowserItem[], item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

        if (matchesSearch) {
          acc.push(item);
        } else if (item.children) {
          const filteredChildren = filterRecursive(item.children);
          if (filteredChildren.length > 0) {
            acc.push({
              ...item,
              children: filteredChildren
            });
          }
        }

        return acc;
      }, []);
    };

    return filterRecursive(objectBrowserData);
  }, [objectBrowserData, searchTerm]);

  // Handle item selection
  const handleItemSelect = useCallback((item: ObjectBrowserItem) => {
    setSelectedItem(item);
  }, []);

  // Handle item expansion
  const handleItemToggle = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Render tree item
  const renderTreeItem = useCallback((item: ObjectBrowserItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isSelected = selectedItem?.id === item.id;

    const getItemIcon = (type: string) => {
      switch (type) {
        case 'library': return <Book size={16} className="text-blue-600" />;
        case 'class': return <Class size={16} className="text-green-600" />;
        case 'module': return hasChildren ? (isExpanded ? <FolderOpen size={16} className="text-yellow-600" /> : <Folder size={16} className="text-yellow-600" />) : <FileText size={16} className="text-gray-600" />;
        case 'function': return <Function size={16} className="text-purple-600" />;
        case 'property': return <Settings size={16} className="text-blue-500" />;
        case 'variable': return <Variable size={16} className="text-orange-600" />;
        case 'constant': return <span className="text-red-600 font-bold text-xs">C</span>;
        case 'enum': return <span className="text-indigo-600 font-bold text-xs">E</span>;
        case 'udt': return <span className="text-teal-600 font-bold text-xs">T</span>;
        case 'event': return <span className="text-pink-600 font-bold text-xs">⚡</span>;
        default: return <Code size={16} className="text-gray-500" />;
      }
    };

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 border-l-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleItemSelect(item)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleItemToggle(item.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getItemIcon(item.type)}
            <span className="text-sm truncate font-mono">{item.name}</span>
            {item.access === 'private' && <span className="text-xs text-gray-500">Private</span>}
            {item.static && <span className="text-xs text-blue-500">Static</span>}
            {item.readonly && <span className="text-xs text-orange-500">ReadOnly</span>}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedItems, selectedItem, handleItemSelect, handleItemToggle]);

  // Copy item details to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      if (process.env.NODE_ENV === 'development') {
        console.log('Copied to clipboard:', text);
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Title Bar */}
        <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
          <h2 className="font-bold">Object Browser</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 px-2 py-1 rounded"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="border-b bg-gray-50 px-4 py-2 flex items-center gap-4">
          {/* Library Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Library:</label>
            <select
              value={selectedLibrary}
              onChange={(e) => setSelectedLibrary(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="VB6 Runtime">VB6 Runtime</option>
              <option value="Current Project">Current Project</option>
              <option value="All Libraries">All Libraries</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search for objects, methods, properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>

          {/* View Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`p-1 rounded hover:bg-gray-200 ${showDetails ? 'bg-gray-200' : ''}`}
              title="Show/Hide Details"
            >
              {showDetails ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-1 rounded hover:bg-gray-200 ${showMembers ? 'bg-gray-200' : ''}`}
              title="Show/Hide Members"
            >
              <Filter size={16} />
            </button>

            <button
              onClick={() => {/* Refresh data */ }}
              className="p-1 rounded hover:bg-gray-200"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Tree View */}
          <div className="w-1/3 border-r bg-white overflow-auto">
            <div ref={treeRef} className="p-2">
              {filteredItems.map(item => renderTreeItem(item))}
            </div>
          </div>

          {/* Members List */}
          {showMembers && (
            <div className="w-1/3 border-r bg-gray-50 overflow-auto">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <h3 className="font-medium text-sm">Members</h3>
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value as any)}
                    className="text-xs border border-gray-300 rounded px-1 py-0.5"
                  >
                    <option value="all">All Members</option>
                    <option value="methods">Methods</option>
                    <option value="properties">Properties</option>
                    <option value="events">Events</option>
                    <option value="constants">Constants</option>
                  </select>
                </div>

                {selectedItem?.children && (
                  <div className="space-y-1">
                    {selectedItem.children
                      .filter(child => {
                        if (memberFilter === 'all') return true;
                        if (memberFilter === 'methods') return child.type === 'function';
                        if (memberFilter === 'properties') return child.type === 'property';
                        if (memberFilter === 'events') return child.type === 'event';
                        if (memberFilter === 'constants') return child.type === 'constant';
                        return true;
                      })
                      .sort((a, b) => {
                        if (sortOrder === 'alphabetical') {
                          return a.name.localeCompare(b.name);
                        } else {
                          return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
                        }
                      })
                      .map(member => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-100 rounded text-sm"
                          onClick={() => handleItemSelect(member)}
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            {member.type === 'function' && <Function size={12} className="text-purple-600" />}
                            {member.type === 'property' && <Settings size={12} className="text-blue-500" />}
                            {member.type === 'variable' && <Variable size={12} className="text-orange-600" />}
                            {member.type === 'constant' && <span className="text-red-600 font-bold text-xs">C</span>}
                            {member.type === 'event' && <span className="text-pink-600 font-bold text-xs">⚡</span>}
                          </div>
                          <span className="font-mono">{member.name}</span>
                          {member.access === 'private' && <span className="text-xs text-gray-500">Private</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Panel */}
          {showDetails && (
            <div className="flex-1 bg-white overflow-auto">
              <div ref={detailsRef} className="p-4">
                {selectedItem ? (
                  <div className="space-y-4">
                    {/* Item Header */}
                    <div className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold font-mono">{selectedItem.name}</h3>
                        <button
                          onClick={() => copyToClipboard(selectedItem.name)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copy to Clipboard"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {selectedItem.access.charAt(0).toUpperCase() + selectedItem.access.slice(1)}
                        </span>
                        {selectedItem.static && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            Static
                          </span>
                        )}
                        {selectedItem.readonly && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                            ReadOnly
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {selectedItem.description && (
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-gray-700 text-sm">{selectedItem.description}</p>
                      </div>
                    )}

                    {/* Syntax */}
                    {selectedItem.syntax && (
                      <div>
                        <h4 className="font-medium mb-2">Syntax</h4>
                        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                          {selectedItem.syntax}
                        </div>
                        <button
                          onClick={() => copyToClipboard(selectedItem.syntax)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Copy Syntax
                        </button>
                      </div>
                    )}

                    {/* Value (for constants) */}
                    {selectedItem.value !== undefined && (
                      <div>
                        <h4 className="font-medium mb-2">Value</h4>
                        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                          {typeof selectedItem.value === 'string' 
                            ? `"${selectedItem.value}"` 
                            : Object.prototype.toString.call(selectedItem.value)}
                        </div>
                      </div>
                    )}

                    {/* Library Information */}
                    {selectedItem.library && (
                      <div>
                        <h4 className="font-medium mb-2">Library</h4>
                        <p className="text-gray-700 text-sm">{selectedItem.library}</p>
                      </div>
                    )}

                    {/* Usage Example */}
                    {selectedItem.type === 'function' && (
                      <div>
                        <h4 className="font-medium mb-2">Example</h4>
                        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                          {/* Generate simple usage example */}
                          {selectedItem.name === 'Len' && 'result = Len("Hello World")'}
                          {selectedItem.name === 'MsgBox' && 'MsgBox "Hello World", vbInformation, "Title"'}
                          {selectedItem.name === 'InputBox' && 'result = InputBox("Enter your name:", "Input")'}
                          {!['Len', 'MsgBox', 'InputBox'].includes(selectedItem.name) && 
                            `' Usage example for ${selectedItem.name}\n${selectedItem.syntax || selectedItem.name}`}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <Book size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select an item from the object tree to view its details.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="border-t bg-gray-100 px-4 py-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>
              {filteredItems.length} items shown
              {searchTerm && ` (filtered by "${searchTerm}")`}
            </span>
            <span>
              {selectedItem && `Selected: ${selectedItem.name} (${selectedItem.type})`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectBrowser;