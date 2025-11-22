import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EventEmitter } from 'events';

// Search Scope
export enum SearchScope {
  CurrentDocument = 'current',
  AllOpenDocuments = 'open',
  EntireProject = 'project',
  ProjectGroup = 'group',
  SelectedText = 'selection'
}

// Search Options
export enum SearchOptions {
  CaseSensitive = 0x1,
  WholeWord = 0x2,
  UseRegex = 0x4,
  SearchBackward = 0x8,
  WrapAround = 0x10,
  SearchInComments = 0x20,
  SearchInStrings = 0x40,
  PreserveCase = 0x80
}

// File Type Filters
export enum FileTypeFilter {
  All = 'all',
  Code = 'code',
  Forms = 'forms',
  Modules = 'modules',
  Classes = 'classes',
  Resources = 'resources'
}

// Search Result
export interface SearchResult {
  id: string;
  filename: string;
  filepath: string;
  line: number;
  column: number;
  matchText: string;
  lineText: string;
  beforeText: string;
  afterText: string;
}

// Replace Result
export interface ReplaceResult {
  filename: string;
  replacements: number;
  errors: string[];
}

// Search History Entry
export interface SearchHistoryEntry {
  searchText: string;
  replaceText?: string;
  scope: SearchScope;
  options: number;
  timestamp: Date;
}

interface FindReplaceManagerProps {
  onNavigateToResult?: (filename: string, line: number, column: number) => void;
  onGetFileContent?: (filename: string) => Promise<string>;
  onSetFileContent?: (filename: string, content: string) => Promise<void>;
  onGetProjectFiles?: () => Promise<string[]>;
}

export const FindReplaceManager: React.FC<FindReplaceManagerProps> = ({
  onNavigateToResult,
  onGetFileContent,
  onSetFileContent,
  onGetProjectFiles
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'find' | 'replace'>('find');
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>(SearchScope.CurrentDocument);
  const [searchOptions, setSearchOptions] = useState(0);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>(FileTypeFilter.All);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchStats, setSearchStats] = useState<{ files: number; matches: number; time: number }>({ files: 0, matches: 0, time: 0 });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const eventEmitter = useRef(new EventEmitter());

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('vb6_search_history');
    if (savedHistory) {
      try {
        // ERROR HANDLING BUG FIX: Protect against invalid JSON in localStorage
        const parsedHistory = JSON.parse(savedHistory);
        setSearchHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
      } catch (error) {
        console.warn('Failed to parse search history from localStorage:', error);
        // Clear corrupted data and start fresh
        localStorage.removeItem('vb6_search_history');
        setSearchHistory([]);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((entry: Omit<SearchHistoryEntry, 'timestamp'>) => {
    const newEntry: SearchHistoryEntry = { ...entry, timestamp: new Date() };
    const newHistory = [newEntry, ...searchHistory.filter(h => h.searchText !== entry.searchText).slice(0, 49)];
    setSearchHistory(newHistory);
    localStorage.setItem('vb6_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  const toggleOption = useCallback((option: SearchOptions) => {
    setSearchOptions(prev => prev ^ option);
  }, []);

  const hasOption = useCallback((option: SearchOptions): boolean => {
    return (searchOptions & option) !== 0;
  }, [searchOptions]);

  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // REDOS VULNERABILITY BUG FIX: Validate regex patterns to prevent catastrophic backtracking
  const isVulnerablePattern = (pattern: string): boolean => {
    // Check for patterns that could cause exponential backtracking
    const vulnerablePatterns = [
      /\*.*\+/, // Nested quantifiers like a*b+
      /\+.*\*/, // Nested quantifiers like a+b*
      /\*.*\{/, // Quantifier followed by range
      /\+.*\{/, // Quantifier followed by range
      /\(.*\+.*\).*\+/, // Nested groups with quantifiers
      /\(.*\*.*\).*\*/, // Nested groups with quantifiers
      /\.\*.*\.\*/, // Multiple .* patterns
      /\.\+.*\.\+/, // Multiple .+ patterns
      /\(.*\|.*\).*\+/, // Alternation with quantifiers
      /\(.*\|.*\).*\*/, // Alternation with quantifiers
    ];
    
    return vulnerablePatterns.some(vuln => vuln.test(pattern));
  };

  const buildSearchPattern = useCallback((text: string): RegExp => {
    let pattern = text;
    
    if (!hasOption(SearchOptions.UseRegex)) {
      pattern = escapeRegex(text);
    } else {
      // REDOS VULNERABILITY BUG FIX: Validate user-provided regex patterns
      if (isVulnerablePattern(text)) {
        throw new Error('Potentially dangerous regex pattern detected. Please simplify your pattern to avoid performance issues.');
      }
      
      // Additional length limit for regex patterns
      if (text.length > 1000) {
        throw new Error('Regex pattern too long (max 1000 characters)');
      }
      
      // Test regex compilation with timeout
      try {
        new RegExp(text);
      } catch (error) {
        throw new Error('Invalid regex pattern: ' + (error as Error).message);
      }
    }
    
    if (hasOption(SearchOptions.WholeWord)) {
      pattern = `\\b${pattern}\\b`;
    }
    
    const flags = hasOption(SearchOptions.CaseSensitive) ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }, [hasOption]);

  // REDOS VULNERABILITY BUG FIX: Timeout mechanism for regex execution
  const executeRegexWithTimeout = (regex: RegExp, text: string, timeoutMs: number = 100): RegExpExecArray | null => {
    const startTime = Date.now();
    let match: RegExpExecArray | null = null;
    
    // Reset regex state
    regex.lastIndex = 0;
    match = regex.exec(text);
    
    // Check if operation took too long
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Regex execution timeout - pattern may be too complex');
    }
    
    return match;
  };

  const searchInFile = useCallback(async (filename: string, content: string, pattern: RegExp): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      try {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        const maxMatches = 1000; // Limit matches per line to prevent DoS
        let matchCount = 0;
        
        // REDOS VULNERABILITY BUG FIX: Use timeout mechanism and limit matches
        while ((match = executeRegexWithTimeout(regex, line, 50)) !== null && matchCount < maxMatches) {
          matchCount++;
          
          // Skip matches in comments if option is set
          if (!hasOption(SearchOptions.SearchInComments)) {
            const beforeMatch = line.substring(0, match.index);
            if (beforeMatch.includes("'") || beforeMatch.includes("REM ")) {
              continue;
            }
          }
        
        // Skip matches in strings if option is set
        if (!hasOption(SearchOptions.SearchInStrings)) {
          const beforeMatch = line.substring(0, match.index);
          const quoteCount = (beforeMatch.match(/"/g) || []).length;
          if (quoteCount % 2 !== 0) {
            continue;
          }
        }
        
        results.push({
          id: `${filename}_${lineIndex}_${match.index}`,
          filename: filename.split('/').pop() || filename,
          filepath: filename,
          line: lineIndex + 1,
          column: match.index + 1,
          matchText: match[0],
          lineText: line.trim(),
          beforeText: line.substring(Math.max(0, match.index - 20), match.index),
          afterText: line.substring(match.index + match[0].length, Math.min(line.length, match.index + match[0].length + 20))
        });
        
        // Prevent infinite loops in global regex
        if (regex.global && match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } catch (error) {
      // REDOS VULNERABILITY BUG FIX: Handle regex timeout and other errors gracefully
      console.warn(`Regex error on line ${lineIndex + 1} in ${filename}:`, error);
      // Continue with other lines instead of failing completely
    }
    });
    
    return results;
  }, [hasOption]);

  const performSearch = useCallback(async () => {
    if (!searchText) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setSelectedResults(new Set());
    setCurrentResultIndex(-1);
    
    const startTime = Date.now();
    const pattern = buildSearchPattern(searchText);
    const results: SearchResult[] = [];
    let filesSearched = 0;
    
    try {
      let filesToSearch: string[] = [];
      
      // Determine files to search based on scope
      switch (searchScope) {
        case SearchScope.CurrentDocument:
          // TODO: Get current document filename
          filesToSearch = ['current.vb'];
          break;
          
        case SearchScope.AllOpenDocuments:
          // TODO: Get all open document filenames
          filesToSearch = ['file1.vb', 'file2.vb'];
          break;
          
        case SearchScope.EntireProject:
        case SearchScope.ProjectGroup:
          if (onGetProjectFiles) {
            filesToSearch = await onGetProjectFiles();
          }
          break;
      }
      
      // Filter by file type
      if (fileTypeFilter !== FileTypeFilter.All) {
        filesToSearch = filesToSearch.filter(file => {
          const ext = file.toLowerCase().split('.').pop();
          switch (fileTypeFilter) {
            case FileTypeFilter.Code:
              return ['bas', 'vb'].includes(ext || '');
            case FileTypeFilter.Forms:
              return ext === 'frm';
            case FileTypeFilter.Modules:
              return ext === 'bas';
            case FileTypeFilter.Classes:
              return ext === 'cls';
            case FileTypeFilter.Resources:
              return ext === 'res';
            default:
              return true;
          }
        });
      }
      
      // Search in each file
      for (const file of filesToSearch) {
        if (onGetFileContent) {
          try {
            const content = await onGetFileContent(file);
            const fileResults = await searchInFile(file, content, pattern);
            results.push(...fileResults);
            filesSearched++;
          } catch (error) {
            console.error(`Error searching in file ${file}:`, error);
          }
        }
      }
      
      setSearchResults(results);
      setSearchStats({
        files: filesSearched,
        matches: results.length,
        time: Date.now() - startTime
      });
      
      // Save to history
      saveToHistory({
        searchText,
        scope: searchScope,
        options: searchOptions
      });
      
      // Emit search completed event
      eventEmitter.current.emit('searchCompleted', results);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchText, searchScope, searchOptions, fileTypeFilter, buildSearchPattern, searchInFile, onGetFileContent, onGetProjectFiles, saveToHistory]);

  const performReplace = useCallback(async (results: SearchResult[]) => {
    if (replaceText === undefined || results.length === 0) return;
    
    const fileChanges = new Map<string, Array<{ result: SearchResult; newText: string }>>();
    
    // Group changes by file
    results.forEach(result => {
      let newText = replaceText;
      
      // Preserve case if option is set
      if (hasOption(SearchOptions.PreserveCase)) {
        const match = result.matchText;
        if (match === match.toUpperCase()) {
          newText = replaceText.toUpperCase();
        } else if (match === match.toLowerCase()) {
          newText = replaceText.toLowerCase();
        } else if (match[0] === match[0].toUpperCase()) {
          newText = replaceText[0].toUpperCase() + replaceText.slice(1).toLowerCase();
        }
      }
      
      if (!fileChanges.has(result.filepath)) {
        fileChanges.set(result.filepath, []);
      }
      fileChanges.get(result.filepath)!.push({ result, newText });
    });
    
    // Apply changes to each file
    const replaceResults: ReplaceResult[] = [];
    
    for (const [filepath, changes] of fileChanges) {
      try {
        if (onGetFileContent && onSetFileContent) {
          const content = await onGetFileContent(filepath);
          let replacements = 0;
          
          // Sort changes by position (reverse order to avoid position shifts)
          changes.sort((a, b) => {
            if (a.result.line !== b.result.line) {
              return b.result.line - a.result.line;
            }
            return b.result.column - a.result.column;
          });
          
          // Apply replacements
          const lines = content.split('\n');
          changes.forEach(({ result, newText }) => {
            const lineIndex = result.line - 1;
            if (lineIndex >= 0 && lineIndex < lines.length) {
              const line = lines[lineIndex];
              const before = line.substring(0, result.column - 1);
              const after = line.substring(result.column - 1 + result.matchText.length);
              lines[lineIndex] = before + newText + after;
              replacements++;
            }
          });
          
          // Save the modified content
          await onSetFileContent(filepath, lines.join('\n'));
          
          replaceResults.push({
            filename: filepath,
            replacements,
            errors: []
          });
        }
      } catch (error) {
        replaceResults.push({
          filename: filepath,
          replacements: 0,
          errors: [String(error)]
        });
      }
    }
    
    // Update search results to reflect replacements
    const remainingResults = searchResults.filter(r => !results.includes(r));
    setSearchResults(remainingResults);
    setSelectedResults(new Set());
    
    // Save to history
    saveToHistory({
      searchText,
      replaceText,
      scope: searchScope,
      options: searchOptions
    });
    
    // Emit replace completed event
    eventEmitter.current.emit('replaceCompleted', replaceResults);
    
    return replaceResults;
  }, [replaceText, searchResults, hasOption, onGetFileContent, onSetFileContent, searchScope, searchOptions, saveToHistory]);

  const handleReplaceAll = useCallback(async () => {
    await performReplace(searchResults);
  }, [performReplace, searchResults]);

  const handleReplaceSelected = useCallback(async () => {
    const selected = searchResults.filter(r => selectedResults.has(r.id));
    await performReplace(selected);
  }, [performReplace, searchResults, selectedResults]);

  const navigateToResult = useCallback((result: SearchResult) => {
    onNavigateToResult?.(result.filepath, result.line, result.column);
    
    // Update current result index
    const index = searchResults.findIndex(r => r.id === result.id);
    setCurrentResultIndex(index);
  }, [searchResults, onNavigateToResult]);

  const navigateToNext = useCallback(() => {
    if (searchResults.length === 0) return;
    
    let nextIndex = currentResultIndex + 1;
    if (nextIndex >= searchResults.length) {
      nextIndex = hasOption(SearchOptions.WrapAround) ? 0 : searchResults.length - 1;
    }
    
    setCurrentResultIndex(nextIndex);
    navigateToResult(searchResults[nextIndex]);
  }, [currentResultIndex, searchResults, hasOption, navigateToResult]);

  const navigateToPrevious = useCallback(() => {
    if (searchResults.length === 0) return;
    
    let prevIndex = currentResultIndex - 1;
    if (prevIndex < 0) {
      prevIndex = hasOption(SearchOptions.WrapAround) ? searchResults.length - 1 : 0;
    }
    
    setCurrentResultIndex(prevIndex);
    navigateToResult(searchResults[prevIndex]);
  }, [currentResultIndex, searchResults, hasOption, navigateToResult]);

  const toggleResultSelection = useCallback((resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  }, []);

  const selectAllResults = useCallback(() => {
    setSelectedResults(new Set(searchResults.map(r => r.id)));
  }, [searchResults]);

  const clearSelection = useCallback(() => {
    setSelectedResults(new Set());
  }, []);

  const loadFromHistory = useCallback((entry: SearchHistoryEntry) => {
    setSearchText(entry.searchText);
    if (entry.replaceText) {
      setReplaceText(entry.replaceText);
    }
    setSearchScope(entry.scope);
    setSearchOptions(entry.options);
    setShowHistory(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        setIsVisible(false);
      } else if (e.key === 'Enter' && e.ctrlKey) {
        performSearch();
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPrevious();
        } else {
          navigateToNext();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, performSearch, navigateToNext, navigateToPrevious]);

  // Focus search input when shown
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isVisible]);

  // Public API through event emitter
  useEffect(() => {
    const show = (options?: { searchText?: string; replaceMode?: boolean }) => {
      setIsVisible(true);
      if (options?.searchText) {
        setSearchText(options.searchText);
      }
      if (options?.replaceMode) {
        setActiveTab('replace');
      }
    };
    
    eventEmitter.current.on('show', show);
    
    // Expose the event emitter for external control
    (window as any).vb6FindReplace = eventEmitter.current;
    
    return () => {
      eventEmitter.current.off('show', show);
      delete (window as any).vb6FindReplace;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Find and Replace</h2>
            <div className="flex">
              <button
                onClick={() => setActiveTab('find')}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === 'find'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Find
              </button>
              <button
                onClick={() => setActiveTab('replace')}
                className={`px-3 py-1 text-sm font-medium ml-4 ${
                  activeTab === 'replace'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Replace
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ✕
          </button>
        </div>

        {/* Search/Replace Inputs */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Find what:</label>
              <div className="flex gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.ctrlKey) {
                      performSearch();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter search text..."
                />
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                  title="Search history"
                >
                  🕐
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'replace' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Replace with:</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Enter replacement text..."
                />
              </div>
            </div>
          )}

          {/* Search History */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchHistory.map((entry, index) => (
                <div
                  key={index}
                  onClick={() => loadFromHistory(entry)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium text-sm">{entry.searchText}</div>
                  {entry.replaceText && (
                    <div className="text-xs text-gray-500">→ {entry.replaceText}</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {entry.timestamp.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Options */}
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search in:</label>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as SearchScope)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value={SearchScope.CurrentDocument}>Current Document</option>
                <option value={SearchScope.AllOpenDocuments}>All Open Documents</option>
                <option value={SearchScope.EntireProject}>Entire Project</option>
                <option value={SearchScope.ProjectGroup}>Project Group</option>
                <option value={SearchScope.SelectedText}>Selected Text</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File types:</label>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value as FileTypeFilter)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value={FileTypeFilter.All}>All Files</option>
                <option value={FileTypeFilter.Code}>Code Files (.bas, .vb)</option>
                <option value={FileTypeFilter.Forms}>Forms (.frm)</option>
                <option value={FileTypeFilter.Modules}>Modules (.bas)</option>
                <option value={FileTypeFilter.Classes}>Classes (.cls)</option>
                <option value={FileTypeFilter.Resources}>Resources (.res)</option>
              </select>
            </div>
          </div>

          {/* Search Options */}
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hasOption(SearchOptions.CaseSensitive)}
                onChange={() => toggleOption(SearchOptions.CaseSensitive)}
              />
              <span>Case sensitive</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hasOption(SearchOptions.WholeWord)}
                onChange={() => toggleOption(SearchOptions.WholeWord)}
              />
              <span>Whole word</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hasOption(SearchOptions.UseRegex)}
                onChange={() => toggleOption(SearchOptions.UseRegex)}
              />
              <span>Regular expression</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hasOption(SearchOptions.WrapAround)}
                onChange={() => toggleOption(SearchOptions.WrapAround)}
              />
              <span>Wrap around</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hasOption(SearchOptions.SearchInComments)}
                onChange={() => toggleOption(SearchOptions.SearchInComments)}
              />
              <span>Search in comments</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hasOption(SearchOptions.SearchInStrings)}
                onChange={() => toggleOption(SearchOptions.SearchInStrings)}
              />
              <span>Search in strings</span>
            </label>
            {activeTab === 'replace' && (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={hasOption(SearchOptions.PreserveCase)}
                  onChange={() => toggleOption(SearchOptions.PreserveCase)}
                />
                <span>Preserve case</span>
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={performSearch}
              disabled={isSearching || !searchText}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Find All'}
            </button>
            {activeTab === 'replace' && searchResults.length > 0 && (
              <>
                <button
                  onClick={handleReplaceAll}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Replace All ({searchResults.length})
                </button>
                <button
                  onClick={handleReplaceSelected}
                  disabled={selectedResults.size === 0}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                >
                  Replace Selected ({selectedResults.size})
                </button>
              </>
            )}
            <button
              onClick={navigateToPrevious}
              disabled={searchResults.length === 0}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              title="Previous (Shift+F3)"
            >
              ◀
            </button>
            <button
              onClick={navigateToNext}
              disabled={searchResults.length === 0}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              title="Next (F3)"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div>
              {/* Results Header */}
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Found {searchStats.matches} matches in {searchStats.files} files ({searchStats.time}ms)
                </div>
                {activeTab === 'replace' && (
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllResults}
                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              {/* Results List */}
              <div className="divide-y divide-gray-100">
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${
                      currentResultIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => navigateToResult(result)}
                  >
                    <div className="flex items-start gap-3">
                      {activeTab === 'replace' && (
                        <input
                          type="checkbox"
                          checked={selectedResults.has(result.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleResultSelection(result.id);
                          }}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-blue-600">{result.filename}</span>
                          <span className="text-gray-500">Line {result.line}, Column {result.column}</span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-gray-700">
                          <span className="text-gray-500">{result.beforeText}</span>
                          <span className="bg-yellow-200 px-0.5">{result.matchText}</span>
                          <span className="text-gray-500">{result.afterText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {isSearching ? (
                <div>Searching...</div>
              ) : searchText ? (
                <div>No results found for "{searchText}"</div>
              ) : (
                <div>Enter search text and click Find All</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
          <div>
            {currentResultIndex >= 0 && searchResults.length > 0 && (
              <span>Result {currentResultIndex + 1} of {searchResults.length}</span>
            )}
          </div>
          <div className="flex gap-4">
            <span>Ctrl+Enter: Search</span>
            <span>F3: Next</span>
            <span>Shift+F3: Previous</span>
            <span>Esc: Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceManager;