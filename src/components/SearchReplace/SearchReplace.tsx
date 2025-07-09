import React, { useState, useRef, useCallback } from 'react';
import { X, Search, Replace, Watch as MatchCase, WholeWord, Regex } from 'lucide-react';

interface SearchReplaceProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string, options: SearchOptions) => SearchResult[];
  onReplace: (query: string, replacement: string, options: SearchOptions) => number;
  onReplaceAll: (query: string, replacement: string, options: SearchOptions) => number;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  searchScope: 'current' | 'project' | 'selection';
}

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  match: string;
}

export const SearchReplace: React.FC<SearchReplaceProps> = ({
  visible,
  onClose,
  onSearch,
  onReplace,
  onReplaceAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    searchScope: 'current'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    const searchResults = onSearch(searchQuery, options);
    setResults(searchResults);
    setCurrentResultIndex(0);
  }, [searchQuery, options, onSearch]);

  const handleReplace = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    const replacedCount = onReplace(searchQuery, replaceQuery, options);
    if (replacedCount > 0) {
      handleSearch(); // Refresh results
    }
  }, [searchQuery, replaceQuery, options, onReplace, handleSearch]);

  const handleReplaceAll = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    const replacedCount = onReplaceAll(searchQuery, replaceQuery, options);
    if (replacedCount > 0) {
      handleSearch(); // Refresh results
    }
  }, [searchQuery, replaceQuery, options, onReplaceAll, handleSearch]);

  const navigateToResult = useCallback((index: number) => {
    if (index >= 0 && index < results.length) {
      setCurrentResultIndex(index);
      // Here you would typically navigate to the result in the editor
    }
  }, [results]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Previous result
        navigateToResult(currentResultIndex - 1);
      } else {
        // Next result or search
        if (results.length > 0) {
          navigateToResult(currentResultIndex + 1);
        } else {
          handleSearch();
        }
      }
    } else if (event.key === 'Escape') {
      onClose();
    }
  }, [currentResultIndex, results.length, navigateToResult, handleSearch, onClose]);

  React.useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '500px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <span>{showReplace ? 'Replace' : 'Find'}</span>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 px-2"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          {/* Search input */}
          <div className="mb-3">
            <label className="block text-xs mb-1">Find what:</label>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 border border-gray-400 text-sm"
              placeholder="Enter search text"
            />
          </div>

          {/* Replace input */}
          {showReplace && (
            <div className="mb-3">
              <label className="block text-xs mb-1">Replace with:</label>
              <input
                ref={replaceInputRef}
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 border border-gray-400 text-sm"
                placeholder="Enter replacement text"
              />
            </div>
          )}

          {/* Options */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.caseSensitive}
                  onChange={(e) => setOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                  className="mr-1"
                />
                <MatchCase size={12} className="mr-1" />
                Match case
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.wholeWord}
                  onChange={(e) => setOptions(prev => ({ ...prev, wholeWord: e.target.checked }))}
                  className="mr-1"
                />
                <WholeWord size={12} className="mr-1" />
                Whole word
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.useRegex}
                  onChange={(e) => setOptions(prev => ({ ...prev, useRegex: e.target.checked }))}
                  className="mr-1"
                />
                <Regex size={12} className="mr-1" />
                Use regex
              </label>
            </div>

            <div className="mt-2">
              <label className="block text-xs mb-1">Search scope:</label>
              <select
                value={options.searchScope}
                onChange={(e) => setOptions(prev => ({ ...prev, searchScope: e.target.value as any }))}
                className="px-2 py-1 border border-gray-400 text-xs"
              >
                <option value="current">Current document</option>
                <option value="project">Entire project</option>
                <option value="selection">Selection</option>
              </select>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mb-4">
              <div className="bg-white border border-gray-400 h-32 overflow-y-auto p-2 text-xs">
                <div className="font-bold mb-2">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer hover:bg-gray-100 p-1 ${
                      index === currentResultIndex ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => navigateToResult(index)}
                  >
                    <div className="font-mono">
                      {result.file}:{result.line}:{result.column}
                    </div>
                    <div className="text-gray-600 ml-2">
                      {result.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSearch}
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 flex items-center gap-1"
            >
              <Search size={12} />
              Find Next
            </button>
            
            <button
              onClick={() => setShowReplace(!showReplace)}
              className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
            >
              {showReplace ? 'Hide Replace' : 'Replace...'}
            </button>

            {showReplace && (
              <>
                <button
                  onClick={handleReplace}
                  className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400 flex items-center gap-1"
                >
                  <Replace size={12} />
                  Replace
                </button>
                
                <button
                  onClick={handleReplaceAll}
                  className="px-4 py-1 bg-gray-300 border border-gray-400 text-xs hover:bg-gray-400"
                >
                  Replace All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};