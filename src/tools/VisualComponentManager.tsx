import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Component Types
export enum ComponentType {
  ActiveXControl = 'ActiveX Control',
  CodeSnippet = 'Code Snippet',
  ClassModule = 'Class Module',
  FormTemplate = 'Form Template',
  UserControl = 'User Control',
  PropertyPage = 'Property Page',
  Document = 'Document',
  Designer = 'Designer',
  AddIn = 'Add-In',
  TypeLibrary = 'Type Library',
  Interface = 'Interface',
  Enumeration = 'Enumeration',
  Module = 'Module',
  Resource = 'Resource',
}

export enum ComponentCategory {
  UserInterface = 'User Interface',
  DataAccess = 'Data Access',
  Multimedia = 'Multimedia',
  Communications = 'Communications',
  FileSystem = 'File System',
  Graphics = 'Graphics',
  System = 'System',
  Utility = 'Utility',
  Internet = 'Internet',
  Database = 'Database',
  Business = 'Business Logic',
  Security = 'Security',
  Custom = 'Custom',
}

export enum ComponentStatus {
  Available = 'Available',
  InUse = 'In Use',
  Deprecated = 'Deprecated',
  Beta = 'Beta',
  Experimental = 'Experimental',
}

// Component Information
export interface ComponentInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  type: ComponentType;
  category: ComponentCategory;
  status: ComponentStatus;
  version: string;
  author: string;
  company: string;
  copyright: string;
  created: Date;
  modified: Date;
  size: number;
  filename: string;
  path: string;
  icon?: string;
  preview?: string;
  documentation?: string;
  keywords: string[];
  dependencies: string[];
  interfaces: string[];
  properties: Array<{
    name: string;
    type: string;
    description: string;
    defaultValue?: any;
  }>;
  methods: Array<{
    name: string;
    parameters: Array<{
      name: string;
      type: string;
      optional: boolean;
    }>;
    returnType?: string;
    description: string;
  }>;
  events: Array<{
    name: string;
    parameters: Array<{
      name: string;
      type: string;
    }>;
    description: string;
  }>;
  examples: Array<{
    title: string;
    code: string;
    description: string;
  }>;
  rating: number;
  downloads: number;
  favorites: number;
  reviews: Array<{
    user: string;
    rating: number;
    comment: string;
    date: Date;
  }>;
}

// Component Repository
export interface ComponentRepository {
  id: string;
  name: string;
  url: string;
  description: string;
  isOnline: boolean;
  isDefault: boolean;
  components: ComponentInfo[];
  lastSync: Date;
}

// Component Collection
export interface ComponentCollection {
  id: string;
  name: string;
  description: string;
  components: string[];
  isPublic: boolean;
  created: Date;
  modified: Date;
}

interface VisualComponentManagerProps {
  onComponentSelect?: (component: ComponentInfo) => void;
  onComponentInstall?: (component: ComponentInfo) => void;
  onComponentPublish?: (component: ComponentInfo) => void;
  onCodeInsert?: (code: string) => void;
}

export const VisualComponentManager: React.FC<VisualComponentManagerProps> = ({
  onComponentSelect,
  onComponentInstall,
  onComponentPublish,
  onCodeInsert,
}) => {
  const [selectedTab, setSelectedTab] = useState<'browse' | 'collections' | 'publish' | 'settings'>(
    'browse'
  );
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'All'>('All');
  const [selectedType, setSelectedType] = useState<ComponentType | 'All'>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [repositories, setRepositories] = useState<ComponentRepository[]>([]);
  const [collections, setCollections] = useState<ComponentCollection[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating' | 'downloads'>('name');
  const [showDetails, setShowDetails] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishForm, setPublishForm] = useState<Partial<ComponentInfo>>({
    type: ComponentType.CodeSnippet,
    category: ComponentCategory.Utility,
    status: ComponentStatus.Available,
    keywords: [],
    dependencies: [],
    properties: [],
    methods: [],
    events: [],
    examples: [],
  });

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `comp_${nextId.current++}`, []);

  // Sample components data
  const sampleComponents: ComponentInfo[] = [
    {
      id: 'comp_1',
      name: 'EnhancedTextBox',
      title: 'Enhanced TextBox Control',
      description:
        'A powerful TextBox control with built-in validation, formatting, and autocomplete features.',
      type: ComponentType.UserControl,
      category: ComponentCategory.UserInterface,
      status: ComponentStatus.Available,
      version: '2.1.0',
      author: 'John Developer',
      company: 'DevTools Inc.',
      copyright: '© 2023 DevTools Inc.',
      created: new Date('2023-01-15'),
      modified: new Date('2023-06-20'),
      size: 65536,
      filename: 'EnhancedTextBox.ocx',
      path: 'C:\\Components\\EnhancedTextBox.ocx',
      keywords: ['textbox', 'validation', 'input', 'format'],
      dependencies: ['msvbvm60.dll', 'oleaut32.dll'],
      interfaces: ['IEnhancedTextBox', 'IValidation'],
      properties: [
        {
          name: 'ValidationPattern',
          type: 'String',
          description: 'Regular expression for validation',
          defaultValue: '',
        },
        {
          name: 'AutoComplete',
          type: 'Boolean',
          description: 'Enable autocomplete feature',
          defaultValue: true,
        },
        { name: 'FormatMask', type: 'String', description: 'Input format mask', defaultValue: '' },
      ],
      methods: [
        {
          name: 'Validate',
          parameters: [],
          returnType: 'Boolean',
          description: 'Validates the current text against the pattern',
        },
        {
          name: 'ClearHistory',
          parameters: [],
          description: 'Clears the autocomplete history',
        },
      ],
      events: [
        {
          name: 'ValidationError',
          parameters: [{ name: 'ErrorMessage', type: 'String' }],
          description: 'Fired when validation fails',
        },
      ],
      examples: [
        {
          title: 'Email Validation',
          code: 'EnhancedTextBox1.ValidationPattern = "^[\\w\\._%+-]+@[\\w\\.-]+\\.[A-Za-z]{2,}$"',
          description: 'Set up email validation pattern',
        },
      ],
      rating: 4.5,
      downloads: 1250,
      favorites: 89,
      reviews: [
        {
          user: 'Developer123',
          rating: 5,
          comment: 'Excellent control! Saved me hours of work.',
          date: new Date('2023-05-10'),
        },
      ],
    },
    {
      id: 'comp_2',
      name: 'DatabaseHelper',
      title: 'Database Helper Class',
      description:
        'A comprehensive class for database operations with connection pooling and error handling.',
      type: ComponentType.ClassModule,
      category: ComponentCategory.DataAccess,
      status: ComponentStatus.Available,
      version: '1.5.2',
      author: 'Sarah DataDev',
      company: 'DB Solutions',
      copyright: '© 2023 DB Solutions',
      created: new Date('2023-03-10'),
      modified: new Date('2023-07-15'),
      size: 32768,
      filename: 'DatabaseHelper.cls',
      path: 'C:\\Components\\DatabaseHelper.cls',
      keywords: ['database', 'sql', 'ado', 'connection'],
      dependencies: ['adodb.dll', 'msado15.dll'],
      interfaces: ['IDatabaseHelper'],
      properties: [
        { name: 'ConnectionString', type: 'String', description: 'Database connection string' },
        {
          name: 'CommandTimeout',
          type: 'Long',
          description: 'Command timeout in seconds',
          defaultValue: 30,
        },
      ],
      methods: [
        {
          name: 'ExecuteQuery',
          parameters: [
            { name: 'SQL', type: 'String', optional: false },
            { name: 'Parameters', type: 'Variant', optional: true },
          ],
          returnType: 'ADODB.Recordset',
          description: 'Executes a SELECT query and returns a recordset',
        },
        {
          name: 'ExecuteNonQuery',
          parameters: [
            { name: 'SQL', type: 'String', optional: false },
            { name: 'Parameters', type: 'Variant', optional: true },
          ],
          returnType: 'Long',
          description: 'Executes an INSERT/UPDATE/DELETE query',
        },
      ],
      events: [
        {
          name: 'QueryExecuted',
          parameters: [
            { name: 'SQL', type: 'String' },
            { name: 'RecordsAffected', type: 'Long' },
          ],
          description: 'Fired after a query is executed',
        },
      ],
      examples: [
        {
          title: 'Simple Query',
          code: 'Dim rs As ADODB.Recordset\nSet rs = dbHelper.ExecuteQuery("SELECT * FROM Users WHERE Active = ?", Array(True))',
          description: 'Execute a parameterized query',
        },
      ],
      rating: 4.8,
      downloads: 2100,
      favorites: 156,
      reviews: [],
    },
    {
      id: 'comp_3',
      name: 'Logger',
      title: 'Application Logger',
      description:
        'A flexible logging system with multiple output targets and configurable log levels.',
      type: ComponentType.Module,
      category: ComponentCategory.Utility,
      status: ComponentStatus.Available,
      version: '1.0.0',
      author: 'Mike Utils',
      company: 'Utility Corp',
      copyright: '© 2023 Utility Corp',
      created: new Date('2023-02-01'),
      modified: new Date('2023-04-30'),
      size: 16384,
      filename: 'Logger.bas',
      path: 'C:\\Components\\Logger.bas',
      keywords: ['logging', 'debug', 'trace', 'file'],
      dependencies: [],
      interfaces: [],
      properties: [],
      methods: [
        {
          name: 'LogInfo',
          parameters: [{ name: 'Message', type: 'String', optional: false }],
          description: 'Logs an informational message',
        },
        {
          name: 'LogError',
          parameters: [
            { name: 'Message', type: 'String', optional: false },
            { name: 'ErrorNumber', type: 'Long', optional: true },
          ],
          description: 'Logs an error message',
        },
      ],
      events: [],
      examples: [
        {
          title: 'Basic Logging',
          code: 'Call LogInfo("Application started")\nCall LogError("Failed to connect to database", Err.Number)',
          description: 'Basic logging examples',
        },
      ],
      rating: 4.2,
      downloads: 850,
      favorites: 45,
      reviews: [],
    },
  ];

  // Initialize components
  useEffect(() => {
    setComponents(sampleComponents);
  }, []);

  // Filter components
  const filteredComponents = components.filter(comp => {
    const matchesSearch =
      !searchFilter ||
      comp.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      comp.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      comp.keywords.some(k => k.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || comp.category === selectedCategory;
    const matchesType = selectedType === 'All' || comp.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Sort components
  const sortedComponents = [...filteredComponents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return b.modified.getTime() - a.modified.getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'downloads':
        return b.downloads - a.downloads;
      default:
        return 0;
    }
  });

  // Toggle favorite
  const toggleFavorite = useCallback((componentId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  }, []);

  // Install component
  const installComponent = useCallback(
    (component: ComponentInfo) => {
      onComponentInstall?.(component);
      // Update download count
      setComponents(prev =>
        prev.map(c => (c.id === component.id ? { ...c, downloads: c.downloads + 1 } : c))
      );
    },
    [onComponentInstall]
  );

  // Insert code
  const insertCode = useCallback(
    (code: string) => {
      onCodeInsert?.(code);
    },
    [onCodeInsert]
  );

  // Publish component
  const publishComponent = useCallback(() => {
    if (!publishForm.name || !publishForm.title) return;

    const newComponent: ComponentInfo = {
      id: generateId(),
      name: publishForm.name,
      title: publishForm.title,
      description: publishForm.description || '',
      type: publishForm.type || ComponentType.CodeSnippet,
      category: publishForm.category || ComponentCategory.Utility,
      status: publishForm.status || ComponentStatus.Available,
      version: publishForm.version || '1.0.0',
      author: publishForm.author || 'Anonymous',
      company: publishForm.company || '',
      copyright: publishForm.copyright || '',
      created: new Date(),
      modified: new Date(),
      size: publishForm.size || 0,
      filename: publishForm.filename || '',
      path: publishForm.path || '',
      keywords: publishForm.keywords || [],
      dependencies: publishForm.dependencies || [],
      interfaces: publishForm.interfaces || [],
      properties: publishForm.properties || [],
      methods: publishForm.methods || [],
      events: publishForm.events || [],
      examples: publishForm.examples || [],
      rating: 0,
      downloads: 0,
      favorites: 0,
      reviews: [],
    };

    setComponents(prev => [...prev, newComponent]);
    onComponentPublish?.(newComponent);
    setShowPublishDialog(false);
    setPublishForm({
      type: ComponentType.CodeSnippet,
      category: ComponentCategory.Utility,
      status: ComponentStatus.Available,
      keywords: [],
      dependencies: [],
      properties: [],
      methods: [],
      events: [],
      examples: [],
    });
  }, [publishForm, generateId, onComponentPublish]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Visual Component Manager</h1>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search components..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded w-64"
              />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as ComponentCategory | 'All')}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="All">All Categories</option>
                {Object.values(ComponentCategory).map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as ComponentType | 'All')}
                className="px-2 py-1 border border-gray-300 rounded"
              >
                <option value="All">All Types</option>
                {Object.values(ComponentType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="downloads">Sort by Downloads</option>
            </select>
            <div className="flex border border-gray-300 rounded">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
              >
                List
              </button>
            </div>
            <button
              onClick={() => setShowPublishDialog(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'browse', label: 'Browse Components', count: components.length },
            { key: 'collections', label: 'Collections', count: collections.length },
            { key: 'publish', label: 'Publish', count: 0 },
            { key: 'settings', label: 'Settings', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {selectedTab === 'browse' && (
          <>
            {/* Components List */}
            <div className={`${showDetails ? 'w-1/2' : 'flex-1'} overflow-y-auto p-4`}>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedComponents.map(component => (
                    <div
                      key={component.id}
                      className="border border-gray-300 rounded-lg p-4 hover:shadow-md cursor-pointer"
                      onClick={() => {
                        setSelectedComponent(component);
                        setShowDetails(true);
                        onComponentSelect?.(component);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getComponentIcon(component.type)}</span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleFavorite(component.id);
                            }}
                            className={`text-sm ${favorites.has(component.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                          >
                            ★
                          </button>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(component.status)}`}
                        >
                          {component.status}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm mb-1 truncate">{component.title}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {component.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{component.category}</span>
                        <span>v{component.version}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span>⭐ {component.rating.toFixed(1)}</span>
                          <span>📥 {component.downloads}</span>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            installComponent(component);
                          }}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Install
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedComponents.map(component => (
                    <div
                      key={component.id}
                      className="flex items-center gap-4 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedComponent(component);
                        setShowDetails(true);
                        onComponentSelect?.(component);
                      }}
                    >
                      <span className="text-2xl">{getComponentIcon(component.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{component.title}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(component.status)}`}
                          >
                            {component.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{component.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{component.category}</span>
                          <span>v{component.version}</span>
                          <span>⭐ {component.rating.toFixed(1)}</span>
                          <span>📥 {component.downloads}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(component.id);
                          }}
                          className={`text-lg ${favorites.has(component.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                        >
                          ★
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            installComponent(component);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Install
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sortedComponents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-lg">No components found</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Component Details */}
            {showDetails && selectedComponent && (
              <div className="w-1/2 border-l border-gray-200 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getComponentIcon(selectedComponent.type)}</span>
                      <div>
                        <h2 className="text-xl font-bold">{selectedComponent.title}</h2>
                        <p className="text-sm text-gray-600">by {selectedComponent.author}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-gray-700">{selectedComponent.description}</p>
                    </div>

                    {/* Properties */}
                    {selectedComponent.properties.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Properties</h3>
                        <div className="border border-gray-300 rounded">
                          {selectedComponent.properties.map((prop, index) => (
                            <div
                              key={index}
                              className="p-3 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-sm">{prop.name}</span>
                                <span className="text-sm text-blue-600">{prop.type}</span>
                              </div>
                              <p className="text-xs text-gray-600">{prop.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Methods */}
                    {selectedComponent.methods.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Methods</h3>
                        <div className="border border-gray-300 rounded">
                          {selectedComponent.methods.map((method, index) => (
                            <div
                              key={index}
                              className="p-3 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="mb-1">
                                <span className="font-mono text-sm">{method.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')})
                                </span>
                                {method.returnType && (
                                  <span className="text-sm text-blue-600 ml-2">
                                    → {method.returnType}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{method.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {selectedComponent.examples.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Examples</h3>
                        {selectedComponent.examples.map((example, index) => (
                          <div key={index} className="mb-4">
                            <h4 className="font-medium text-sm mb-1">{example.title}</h4>
                            <p className="text-xs text-gray-600 mb-2">{example.description}</p>
                            <div className="bg-gray-100 p-3 rounded">
                              <pre className="text-xs font-mono">{example.code}</pre>
                              <button
                                onClick={() => insertCode(example.code)}
                                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                              >
                                Insert Code
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div>
                      <h3 className="font-medium mb-2">Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Version:</strong> {selectedComponent.version}
                        </div>
                        <div>
                          <strong>Type:</strong> {selectedComponent.type}
                        </div>
                        <div>
                          <strong>Category:</strong> {selectedComponent.category}
                        </div>
                        <div>
                          <strong>Status:</strong> {selectedComponent.status}
                        </div>
                        <div>
                          <strong>File Size:</strong> {(selectedComponent.size / 1024).toFixed(1)}{' '}
                          KB
                        </div>
                        <div>
                          <strong>Downloads:</strong> {selectedComponent.downloads}
                        </div>
                        <div>
                          <strong>Rating:</strong> ⭐ {selectedComponent.rating.toFixed(1)}
                        </div>
                        <div>
                          <strong>Modified:</strong>{' '}
                          {selectedComponent.modified.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Install Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => installComponent(selectedComponent)}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
                      >
                        Install Component
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {selectedTab === 'collections' && (
          <div className="flex-1 p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-lg">Component Collections</p>
              <p className="text-sm mt-2">
                Organize your components into collections for easy access
              </p>
            </div>
          </div>
        )}

        {selectedTab === 'publish' && (
          <div className="flex-1 p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📤</div>
              <p className="text-lg">Publish Components</p>
              <p className="text-sm mt-2">Share your components with the community</p>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="flex-1 p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">⚙️</div>
              <p className="text-lg">Component Manager Settings</p>
              <p className="text-sm mt-2">
                Configure repositories, preferences, and update settings
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Publish Component</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={publishForm.name || ''}
                    onChange={e => setPublishForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={publishForm.version || ''}
                    onChange={e => setPublishForm(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={publishForm.title || ''}
                  onChange={e => setPublishForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={publishForm.description || ''}
                  onChange={e => setPublishForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={publishForm.type}
                    onChange={e =>
                      setPublishForm(prev => ({ ...prev, type: e.target.value as ComponentType }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(ComponentType).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={publishForm.category}
                    onChange={e =>
                      setPublishForm(prev => ({
                        ...prev,
                        category: e.target.value as ComponentCategory,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(ComponentCategory).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPublishDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={publishComponent}
                disabled={!publishForm.name || !publishForm.title}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getComponentIcon(type: ComponentType): string {
    switch (type) {
      case ComponentType.ActiveXControl:
        return '🎛️';
      case ComponentType.CodeSnippet:
        return '📝';
      case ComponentType.ClassModule:
        return '🏛️';
      case ComponentType.FormTemplate:
        return '📋';
      case ComponentType.UserControl:
        return '🎨';
      case ComponentType.PropertyPage:
        return '⚙️';
      case ComponentType.Document:
        return '📄';
      case ComponentType.Designer:
        return '🎯';
      case ComponentType.AddIn:
        return '🔌';
      case ComponentType.TypeLibrary:
        return '📚';
      case ComponentType.Interface:
        return '🔗';
      case ComponentType.Enumeration:
        return '📋';
      case ComponentType.Module:
        return '📦';
      case ComponentType.Resource:
        return '🎪';
      default:
        return '📦';
    }
  }

  function getStatusColor(status: ComponentStatus): string {
    switch (status) {
      case ComponentStatus.Available:
        return 'bg-green-100 text-green-800';
      case ComponentStatus.InUse:
        return 'bg-blue-100 text-blue-800';
      case ComponentStatus.Deprecated:
        return 'bg-red-100 text-red-800';
      case ComponentStatus.Beta:
        return 'bg-yellow-100 text-yellow-800';
      case ComponentStatus.Experimental:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
};

export default VisualComponentManager;
