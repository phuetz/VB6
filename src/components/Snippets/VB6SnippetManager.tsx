import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Code,
  FileText,
  Repeat,
  GitBranch,
  AlertCircle,
  Database,
  Wrench,
  Copy,
  ChevronRight,
} from 'lucide-react';
import {
  vb6Snippets,
  VB6Snippet,
  getSnippetsByCategory,
  searchSnippets,
} from '../../data/vb6Snippets';

interface SnippetManagerProps {
  visible: boolean;
  onClose: () => void;
  onInsertSnippet: (snippet: VB6Snippet) => void;
}

const categoryIcons = {
  declaration: <Code size={16} className="text-blue-500" />,
  control: <FileText size={16} className="text-green-500" />,
  loop: <Repeat size={16} className="text-purple-500" />,
  condition: <GitBranch size={16} className="text-orange-500" />,
  function: <Wrench size={16} className="text-red-500" />,
  error: <AlertCircle size={16} className="text-yellow-500" />,
  file: <FileText size={16} className="text-indigo-500" />,
  database: <Database size={16} className="text-teal-500" />,
  api: <Code size={16} className="text-pink-500" />,
};

const categoryNames = {
  declaration: 'Declarations',
  control: 'Controls & UI',
  loop: 'Loops',
  condition: 'Conditions',
  function: 'Functions',
  error: 'Error Handling',
  file: 'File Operations',
  database: 'Database',
  api: 'Windows API',
};

export const VB6SnippetManager: React.FC<SnippetManagerProps> = ({
  visible,
  onClose,
  onInsertSnippet,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<VB6Snippet | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const filteredSnippets = useMemo(() => {
    let snippets = [...vb6Snippets];

    if (selectedCategory !== 'all') {
      snippets = getSnippetsByCategory(selectedCategory);
    }

    if (searchQuery) {
      snippets = snippets.filter(s => searchSnippets(searchQuery).includes(s));
    }

    return snippets;
  }, [selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    vb6Snippets.forEach(s => cats.add(s.category));
    return Array.from(cats);
  }, []);

  const handleCopySnippet = (snippet: VB6Snippet) => {
    navigator.clipboard.writeText(snippet.body);
    setCopiedSnippetId(snippet.id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleInsertSnippet = () => {
    if (selectedSnippet) {
      onInsertSnippet(selectedSnippet);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[900px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="text-pink-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Code Snippets</h2>
            <span className="text-sm text-gray-500">({vb6Snippets.length} snippets)</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search snippets..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 pb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === 'all' ? 'bg-pink-100 text-pink-700' : 'hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === category
                        ? 'bg-pink-100 text-pink-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {categoryIcons[category as keyof typeof categoryIcons]}
                    <span>{categoryNames[category as keyof typeof categoryNames]}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {getSnippetsByCategory(category).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Snippet List */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              {filteredSnippets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Code size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No snippets found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredSnippets.map(snippet => (
                    <div
                      key={snippet.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSnippet?.id === snippet.id ? 'bg-pink-50' : ''
                      }`}
                      onClick={() => setSelectedSnippet(snippet)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {categoryIcons[snippet.category as keyof typeof categoryIcons]}
                            <h4 className="font-semibold text-gray-800">{snippet.name}</h4>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-pink-600">
                              {snippet.prefix}
                            </code>
                          </div>
                          <p className="text-sm text-gray-600">{snippet.description}</p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleCopySnippet(snippet);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy snippet"
                        >
                          {copiedSnippetId === snippet.id ? (
                            <span className="text-xs text-green-600">Copied!</span>
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Snippet Preview */}
            <div className="flex-1 p-6 bg-gray-50">
              {selectedSnippet ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {selectedSnippet.name}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedSnippet.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">Trigger</h4>
                      <code className="text-sm bg-pink-100 px-2 py-1 rounded text-pink-700">
                        {selectedSnippet.prefix}
                      </code>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">Code Preview</h4>
                      <button
                        onClick={() => handleCopySnippet(selectedSnippet)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{selectedSnippet.body}</code>
                    </pre>
                  </div>

                  {selectedSnippet.placeholders && selectedSnippet.placeholders.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Tab Stops</h4>
                      <div className="space-y-1">
                        {selectedSnippet.placeholders.map((placeholder, index) => (
                          <div key={placeholder.id} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">{index + 1}.</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded">
                              {placeholder.label}
                            </code>
                            <ChevronRight size={14} className="text-gray-400" />
                            <span className="text-gray-600">{placeholder.defaultValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      <strong>How to use:</strong> Type{' '}
                      <code className="bg-gray-100 px-1">{selectedSnippet.prefix}</code> in the code
                      editor and press Tab or select from IntelliSense.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Code size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select a snippet to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedSnippet ? (
              <span>
                Selected: <strong>{selectedSnippet.name}</strong>
              </span>
            ) : (
              <span>Select a snippet to insert</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertSnippet}
              disabled={!selectedSnippet}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedSnippet
                  ? 'bg-pink-500 text-white hover:bg-pink-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Insert Snippet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VB6SnippetManager;
