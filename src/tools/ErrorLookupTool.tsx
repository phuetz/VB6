import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Error Categories
export enum ErrorCategory {
  Runtime = 'Runtime Errors',
  Compiler = 'Compiler Errors',
  Windows = 'Windows System Errors',
  COM = 'COM/ActiveX Errors',
  Database = 'Database Errors',
  Network = 'Network Errors',
  Custom = 'Custom Application Errors',
}

// Error Source
export enum ErrorSource {
  VB6 = 'Visual Basic 6.0',
  Windows = 'Windows API',
  COM = 'COM/OLE',
  ADO = 'ADO/Database',
  Winsock = 'Winsock',
  Custom = 'Custom',
}

// Error Information
export interface ErrorInfo {
  code: number;
  hexCode: string;
  name: string;
  description: string;
  category: ErrorCategory;
  source: ErrorSource;
  commonCauses: string[];
  solutions: string[];
  relatedErrors: number[];
  example?: string;
  notes?: string;
  msdn?: string;
}

// Search Result
export interface SearchResult {
  error: ErrorInfo;
  relevance: number;
  matchType: 'exact' | 'partial' | 'related';
}

// Error History Entry
export interface ErrorHistoryEntry {
  timestamp: Date;
  error: ErrorInfo;
  searchTerm: string;
  notes?: string;
}

interface ErrorLookupToolProps {
  onErrorSelect?: (error: ErrorInfo) => void;
  onExport?: (errors: ErrorInfo[]) => void;
}

export const ErrorLookupTool: React.FC<ErrorLookupToolProps> = ({ onErrorSelect, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | 'All'>('All');
  const [selectedSource, setSelectedSource] = useState<ErrorSource | 'All'>('All');
  const [history, setHistory] = useState<ErrorHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [customErrors, setCustomErrors] = useState<ErrorInfo[]>([]);
  const [showAddErrorDialog, setShowAddErrorDialog] = useState(false);
  const [errorForm, setErrorForm] = useState({
    code: 0,
    name: '',
    description: '',
    category: ErrorCategory.Custom,
    source: ErrorSource.Custom,
    commonCauses: '',
    solutions: '',
  });

  const eventEmitter = useRef(new EventEmitter());

  // Common VB6 and Windows errors database
  const errorDatabase: ErrorInfo[] = [
    // VB6 Runtime Errors
    {
      code: 5,
      hexCode: '0x00000005',
      name: 'Invalid procedure call or argument',
      description: 'A procedure was called with an invalid argument or in an invalid context.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Passing invalid parameters to a function',
        'Calling a method on a null object',
        'Invalid property values',
        'API calls with incorrect parameters',
      ],
      solutions: [
        'Check all parameters passed to the procedure',
        'Verify object is properly initialized',
        'Validate input data before processing',
        'Review API documentation for correct usage',
      ],
      relatedErrors: [13, 91, 424],
      example: 'Left("Hello", -1) \' Negative length parameter',
    },
    {
      code: 6,
      hexCode: '0x00000006',
      name: 'Overflow',
      description: 'An arithmetic operation resulted in a value too large for the variable type.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Integer division by zero',
        'Calculation exceeds data type limits',
        'Type conversion with incompatible values',
        'Loop counter overflow',
      ],
      solutions: [
        'Use larger data types (Long instead of Integer)',
        'Add overflow checking',
        'Implement error handling for calculations',
        'Use Decimal type for large numbers',
      ],
      relatedErrors: [11, 7],
      example: "Dim i As Integer\ni = 40000 ' Exceeds Integer range",
    },
    {
      code: 7,
      hexCode: '0x00000007',
      name: 'Out of memory',
      description: 'The system cannot allocate the required memory.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Large arrays or collections',
        'Memory leaks from unreleased objects',
        'Recursive calls without exit condition',
        'Loading large files into memory',
      ],
      solutions: [
        'Release objects with Set obj = Nothing',
        'Process data in chunks',
        'Clear collections when done',
        'Increase virtual memory',
        'Use streaming for large files',
      ],
      relatedErrors: [14, 31001],
      notes: 'Common in applications processing large datasets',
    },
    {
      code: 9,
      hexCode: '0x00000009',
      name: 'Subscript out of range',
      description: 'Array index or collection key does not exist.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Accessing array element beyond bounds',
        'Using non-existent collection key',
        'Zero-based vs one-based indexing confusion',
        'Dynamic array not initialized',
      ],
      solutions: [
        'Check array bounds with UBound/LBound',
        'Verify collection keys exist',
        'Initialize arrays before use',
        'Use error handling when accessing collections',
      ],
      relatedErrors: [5, 13],
      example: "Dim arr(5) As Integer\nDebug.Print arr(10) ' Index 10 out of range",
    },
    {
      code: 13,
      hexCode: '0x0000000D',
      name: 'Type mismatch',
      description: 'Data type of a variable or expression is incompatible with the expected type.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Assigning incompatible data types',
        'Invalid type conversion',
        'Passing wrong parameter types',
        'Variant type conflicts',
      ],
      solutions: [
        'Use explicit type conversion functions',
        'Validate data types before operations',
        'Declare variables with specific types',
        'Use IsNumeric, IsDate for validation',
      ],
      relatedErrors: [5, 94],
      example: 'Dim i As Integer\ni = "Hello" \' String cannot convert to Integer',
    },
    {
      code: 53,
      hexCode: '0x00000035',
      name: 'File not found',
      description: 'The specified file does not exist at the given path.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Incorrect file path',
        'File deleted or moved',
        'Missing file extension',
        'Case sensitivity on some systems',
      ],
      solutions: [
        'Verify file exists with Dir() function',
        'Use absolute paths',
        'Check file permissions',
        'Handle missing files gracefully',
      ],
      relatedErrors: [76, 75, 52],
      example: 'Open "C:\\NonExistent.txt" For Input As #1',
    },
    {
      code: 70,
      hexCode: '0x00000046',
      name: 'Permission denied',
      description: 'Access to the file or resource is denied.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'File in use by another process',
        'Insufficient user permissions',
        'Read-only file attributes',
        'Network share permissions',
      ],
      solutions: [
        'Close file in other applications',
        'Run as administrator',
        'Check file attributes',
        'Verify network permissions',
      ],
      relatedErrors: [75, 76],
      notes: 'Common when accessing system files or locked resources',
    },
    {
      code: 91,
      hexCode: '0x0000005B',
      name: 'Object variable or With block variable not set',
      description: 'Attempting to use an object variable that has not been initialized.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Using object before Set statement',
        'Object destroyed but still referenced',
        'Failed object creation',
        'Null object from function return',
      ],
      solutions: [
        'Initialize objects with Set statement',
        'Check if object Is Nothing',
        'Verify CreateObject success',
        'Handle null returns from functions',
      ],
      relatedErrors: [424, 429],
      example: "Dim obj As Object\nobj.Method ' obj not initialized",
    },
    {
      code: 424,
      hexCode: '0x000001A8',
      name: 'Object required',
      description: 'An object is required but a non-object value was provided.',
      category: ErrorCategory.Runtime,
      source: ErrorSource.VB6,
      commonCauses: [
        'Missing Set keyword for object assignment',
        'Using non-object where object expected',
        'Property returns non-object',
        'Control not properly referenced',
      ],
      solutions: [
        'Use Set for object assignments',
        'Verify variable is object type',
        'Check property return types',
        'Ensure controls exist on form',
      ],
      relatedErrors: [91, 438],
      example: 'Dim obj As Object\nobj = CreateObject("...") \' Missing Set',
    },
    {
      code: 429,
      hexCode: '0x000001AD',
      name: "ActiveX component can't create object",
      description: 'The ActiveX component is not properly registered or cannot be instantiated.',
      category: ErrorCategory.COM,
      source: ErrorSource.COM,
      commonCauses: [
        'Component not registered',
        'Missing dependency DLLs',
        'Incorrect ProgID',
        '32/64-bit compatibility issues',
      ],
      solutions: [
        'Register component with regsvr32',
        'Install required dependencies',
        'Verify correct ProgID',
        'Check platform compatibility',
      ],
      relatedErrors: [430, 432],
      msdn: 'https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/activex-component-cant-create-object-error-429',
    },
    {
      code: 3021,
      hexCode: '0x00000BCD',
      name: 'No current record',
      description: 'Attempting to access a record when the recordset is at BOF or EOF.',
      category: ErrorCategory.Database,
      source: ErrorSource.ADO,
      commonCauses: [
        'Recordset is empty',
        'Moved past last record',
        'Moved before first record',
        'Record deleted by another user',
      ],
      solutions: [
        'Check EOF and BOF properties',
        'Verify recordset has records',
        'Use MoveFirst after opening',
        'Handle empty recordsets',
      ],
      relatedErrors: [3219, 3251],
      example: "rs.MoveNext\nDebug.Print rs!Field ' If rs.EOF = True",
    },
    {
      code: 3704,
      hexCode: '0x00000E78',
      name: 'Operation is not allowed when the object is closed',
      description: 'Attempting to use a closed ADO object.',
      category: ErrorCategory.Database,
      source: ErrorSource.ADO,
      commonCauses: [
        'Connection or recordset closed',
        'Object not opened properly',
        'Connection lost',
        'Timeout occurred',
      ],
      solutions: [
        'Check State property before use',
        'Reopen connection if needed',
        'Implement connection pooling',
        'Handle connection timeouts',
      ],
      relatedErrors: [3705, 3709],
      example: 'conn.Close\nrs.Open "SELECT...", conn \' conn is closed',
    },
    // Windows System Errors
    {
      code: 2,
      hexCode: '0x00000002',
      name: 'ERROR_FILE_NOT_FOUND',
      description: 'The system cannot find the file specified.',
      category: ErrorCategory.Windows,
      source: ErrorSource.Windows,
      commonCauses: [
        'Invalid file path',
        'File does not exist',
        'Incorrect working directory',
        'Path too long',
      ],
      solutions: [
        'Verify file path',
        'Check working directory',
        'Use short path names',
        'Create file if missing',
      ],
      relatedErrors: [3, 5],
      notes: 'Common Windows API error',
    },
    {
      code: 5,
      hexCode: '0x00000005',
      name: 'ERROR_ACCESS_DENIED',
      description: 'Access is denied to the requested resource.',
      category: ErrorCategory.Windows,
      source: ErrorSource.Windows,
      commonCauses: [
        'Insufficient permissions',
        'File locked by another process',
        'UAC restrictions',
        'Network share permissions',
      ],
      solutions: [
        'Run as administrator',
        'Check file permissions',
        'Close other applications',
        'Verify user rights',
      ],
      relatedErrors: [32, 1326],
    },
    // Winsock Errors
    {
      code: 10061,
      hexCode: '0x0000274D',
      name: 'WSAECONNREFUSED',
      description: 'Connection refused by the target machine.',
      category: ErrorCategory.Network,
      source: ErrorSource.Winsock,
      commonCauses: [
        'Server not running',
        'Wrong port number',
        'Firewall blocking connection',
        'Server rejecting connections',
      ],
      solutions: [
        'Verify server is running',
        'Check port number',
        'Configure firewall',
        'Check server logs',
      ],
      relatedErrors: [10060, 10065],
    },
  ];

  // Search errors
  const searchErrors = useCallback(
    (term: string) => {
      if (!term) {
        setSearchResults([]);
        return;
      }

      const results: SearchResult[] = [];
      const searchLower = term.toLowerCase();
      const allErrors = [...errorDatabase, ...customErrors];

      // Try to parse as number for error code search
      const errorCode = parseInt(term);
      const isNumericSearch = !isNaN(errorCode);

      allErrors.forEach(error => {
        // Filter by category and source
        if (selectedCategory !== 'All' && error.category !== selectedCategory) return;
        if (selectedSource !== 'All' && error.source !== selectedSource) return;

        // Exact code match
        if (isNumericSearch && error.code === errorCode) {
          results.push({ error, relevance: 100, matchType: 'exact' });
          return;
        }

        // Hex code match
        if (error.hexCode.toLowerCase().includes(searchLower)) {
          results.push({ error, relevance: 90, matchType: 'exact' });
          return;
        }

        // Name match
        if (error.name.toLowerCase().includes(searchLower)) {
          results.push({ error, relevance: 80, matchType: 'partial' });
          return;
        }

        // Description match
        if (error.description.toLowerCase().includes(searchLower)) {
          results.push({ error, relevance: 70, matchType: 'partial' });
          return;
        }

        // Common causes match
        const causeMatch = error.commonCauses.some(cause =>
          cause.toLowerCase().includes(searchLower)
        );
        if (causeMatch) {
          results.push({ error, relevance: 60, matchType: 'partial' });
          return;
        }

        // Solutions match
        const solutionMatch = error.solutions.some(solution =>
          solution.toLowerCase().includes(searchLower)
        );
        if (solutionMatch) {
          results.push({ error, relevance: 50, matchType: 'partial' });
          return;
        }

        // Related errors
        if (isNumericSearch && error.relatedErrors.includes(errorCode)) {
          results.push({ error, relevance: 40, matchType: 'related' });
        }
      });

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);
      setSearchResults(results);

      eventEmitter.current.emit('search', term, results);
    },
    [selectedCategory, selectedSource, customErrors]
  );

  // Select error
  const selectError = useCallback(
    (error: ErrorInfo) => {
      setSelectedError(error);

      // Add to history
      const historyEntry: ErrorHistoryEntry = {
        timestamp: new Date(),
        error: error,
        searchTerm: searchTerm,
      };
      setHistory(prev => [historyEntry, ...prev].slice(0, 50));

      onErrorSelect?.(error);
      eventEmitter.current.emit('errorSelected', error);
    },
    [searchTerm, onErrorSelect]
  );

  // Add custom error
  const addCustomError = useCallback(() => {
    if (!errorForm.name || !errorForm.description) return;

    const newError: ErrorInfo = {
      code: errorForm.code,
      hexCode: `0x${errorForm.code.toString(16).padStart(8, '0').toUpperCase()}`,
      name: errorForm.name,
      description: errorForm.description,
      category: errorForm.category,
      source: errorForm.source,
      commonCauses: errorForm.commonCauses.split('\n').filter(c => c.trim()),
      solutions: errorForm.solutions.split('\n').filter(s => s.trim()),
      relatedErrors: [],
    };

    setCustomErrors(prev => [...prev, newError]);
    setShowAddErrorDialog(false);
    setErrorForm({
      code: 0,
      name: '',
      description: '',
      category: ErrorCategory.Custom,
      source: ErrorSource.Custom,
      commonCauses: '',
      solutions: '',
    });

    eventEmitter.current.emit('customErrorAdded', newError);
  }, [errorForm]);

  // Toggle favorite
  const toggleFavorite = useCallback((errorCode: number) => {
    setFavorites(prev => {
      if (prev.includes(errorCode)) {
        return prev.filter(c => c !== errorCode);
      } else {
        return [...prev, errorCode];
      }
    });
  }, []);

  // Export errors
  const exportErrors = useCallback(() => {
    const errors =
      searchResults.length > 0
        ? searchResults.map(r => r.error)
        : [...errorDatabase, ...customErrors];

    onExport?.(errors);
    eventEmitter.current.emit('export', errors);
  }, [searchResults, customErrors, onExport]);

  // Copy error info
  const copyErrorInfo = useCallback((error: ErrorInfo) => {
    const info = `Error ${error.code} (${error.hexCode}): ${error.name}
${error.description}

Common Causes:
${error.commonCauses.map(c => `- ${c}`).join('\n')}

Solutions:
${error.solutions.map(s => `- ${s}`).join('\n')}`;

    navigator.clipboard.writeText(info);
    eventEmitter.current.emit('copied', error);
  }, []);

  // Auto-search on mount if error code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');
    if (errorCode) {
      setSearchTerm(errorCode);
      searchErrors(errorCode);
    }
  }, [searchErrors]);

  // Auto-search on term change
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchErrors(searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, searchErrors]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Error Lookup Tool</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddErrorDialog(true)}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Custom Error
            </button>
            <button
              onClick={exportErrors}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Enter error code, hex code, or description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
          >
            Advanced
          </button>
        </div>

        {showAdvancedSearch && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="All">All Categories</option>
                  {Object.values(ErrorCategory).map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={selectedSource}
                  onChange={e => setSelectedSource(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="All">All Sources</option>
                  {Object.values(ErrorSource).map(src => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Search Results */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              {searchResults.length > 0
                ? `Found ${searchResults.length} result(s)`
                : searchTerm
                  ? 'No results found'
                  : 'Enter a search term'}
            </div>
          </div>

          <div className="p-2">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 mb-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 ${
                  selectedError?.code === result.error.code ? 'bg-blue-50 border-blue-300' : ''
                }`}
                onClick={() => selectError(result.error)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">{result.error.code}</span>
                      <span className="text-xs text-gray-500">{result.error.hexCode}</span>
                      {result.matchType === 'related' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                          Related
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-sm mt-1">{result.error.name}</div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {result.error.description}
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(result.error.code);
                    }}
                    className="ml-2 text-gray-400 hover:text-yellow-500"
                  >
                    {favorites.includes(result.error.code) ? '★' : '☆'}
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{result.error.category}</span>
                  <span>{result.error.source}</span>
                  <span className="ml-auto">{result.relevance}% match</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedError ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-mono font-bold text-blue-600">
                      {selectedError.code}
                    </span>
                    <span className="text-lg text-gray-500">{selectedError.hexCode}</span>
                    <button
                      onClick={() => toggleFavorite(selectedError.code)}
                      className="text-2xl text-gray-400 hover:text-yellow-500"
                    >
                      {favorites.includes(selectedError.code) ? '★' : '☆'}
                    </button>
                  </div>
                  <h2 className="text-xl font-medium text-gray-800">{selectedError.name}</h2>
                </div>
                <button
                  onClick={() => copyErrorInfo(selectedError)}
                  className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                >
                  Copy Info
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedError.description}</p>
                </div>

                {/* Category and Source */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {selectedError.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Source:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      {selectedError.source}
                    </span>
                  </div>
                </div>

                {/* Common Causes */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Common Causes</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedError.commonCauses.map((cause, index) => (
                      <li key={index} className="text-gray-600">
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Solutions */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Solutions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedError.solutions.map((solution, index) => (
                      <li key={index} className="text-gray-600">
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Example */}
                {selectedError.example && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Example</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
                      {selectedError.example}
                    </pre>
                  </div>
                )}

                {/* Related Errors */}
                {selectedError.relatedErrors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Related Errors</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedError.relatedErrors.map(code => (
                        <button
                          key={code}
                          onClick={() => {
                            setSearchTerm(code.toString());
                            searchErrors(code.toString());
                          }}
                          className="px-3 py-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 text-sm"
                        >
                          Error {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedError.notes && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Additional Notes</h3>
                    <p className="text-gray-600 italic">{selectedError.notes}</p>
                  </div>
                )}

                {/* MSDN Link */}
                {selectedError.msdn && (
                  <div>
                    <a
                      href={selectedError.msdn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View on Microsoft Docs →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg">Search for an error code to view details</p>
                <p className="text-sm mt-2">Enter a numeric code, hex code, or description</p>
              </div>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="w-64 border-l border-gray-200 bg-gray-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Recent Searches</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-96">
            {history.map((entry, index) => (
              <div
                key={index}
                className="p-2 mb-1 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 text-sm"
                onClick={() => selectError(entry.error)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium">{entry.error.code}</span>
                  <span className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 truncate">{entry.error.name}</div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">No recent searches</p>
            )}
          </div>

          <div className="p-3 border-t border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Favorites</h3>
          </div>
          <div className="p-2 overflow-y-auto max-h-96">
            {favorites.map(code => {
              const error = [...errorDatabase, ...customErrors].find(e => e.code === code);
              if (!error) return null;
              return (
                <div
                  key={code}
                  className="p-2 mb-1 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 text-sm"
                  onClick={() => selectError(error)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{error.code}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(code);
                      }}
                      className="text-yellow-500 hover:text-gray-400"
                    >
                      ★
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 truncate">{error.name}</div>
                </div>
              );
            })}
            {favorites.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">No favorites yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Error Dialog */}
      {showAddErrorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">Add Custom Error</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Code</label>
                  <input
                    type="number"
                    value={errorForm.code}
                    onChange={e =>
                      setErrorForm(prev => ({ ...prev, code: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={errorForm.category}
                    onChange={e =>
                      setErrorForm(prev => ({ ...prev, category: e.target.value as ErrorCategory }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(ErrorCategory).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Name</label>
                <input
                  type="text"
                  value={errorForm.name}
                  onChange={e => setErrorForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="e.g., Custom Application Error"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={errorForm.description}
                  onChange={e => setErrorForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Detailed description of the error"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Common Causes (one per line)
                </label>
                <textarea
                  value={errorForm.commonCauses}
                  onChange={e => setErrorForm(prev => ({ ...prev, commonCauses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="List common causes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solutions (one per line)
                </label>
                <textarea
                  value={errorForm.solutions}
                  onChange={e => setErrorForm(prev => ({ ...prev, solutions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="List possible solutions..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddErrorDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addCustomError}
                disabled={!errorForm.name || !errorForm.description}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Error
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLookupTool;
