import React, { useState, useEffect } from 'react';
import { Code, Plus, Save, Trash2, Copy, CopyCheck, Edit, Search, FolderPlus, Tag, FileCode, ArrowBigRight } from 'lucide-react';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: 'vb' | 'sql' | 'html' | 'javascript';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  favorite: boolean;
  usageCount: number;
}

interface SnippetManagerProps {
  visible: boolean;
  onClose: () => void;
  onInsertSnippet: (snippet: CodeSnippet) => void;
}

export const SnippetManager: React.FC<SnippetManagerProps> = ({
  visible,
  onClose,
  onInsertSnippet
}) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<CodeSnippet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCopied, setShowCopied] = useState<string | null>(null);

  // Form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLanguage, setEditLanguage] = useState<'vb' | 'sql' | 'html' | 'javascript'>('vb');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');

  // Sample data for demonstration
  useEffect(() => {
    const sampleSnippets: CodeSnippet[] = [
      {
        id: '1',
        title: 'File Open Dialog',
        description: 'Display a file open dialog and get the selected file path',
        code: `Dim fileName As String
fileName = GetOpenFileName("All Files (*.*)|*.*")
If fileName <> "" Then
    MsgBox "Selected file: " & fileName
End If

' Function to show open file dialog
Private Function GetOpenFileName(filter As String) As String
    Dim dlg As CommonDialog
    Set dlg = New CommonDialog
    dlg.Filter = filter
    dlg.ShowOpen
    GetOpenFileName = dlg.FileName
    Set dlg = Nothing
End Function`,
        language: 'vb',
        category: 'Dialogs',
        tags: ['file', 'dialog', 'open'],
        createdAt: new Date(2023, 9, 15),
        updatedAt: new Date(2023, 9, 15),
        favorite: true,
        usageCount: 12
      },
      {
        id: '2',
        title: 'Database Connection',
        description: 'Create an ADO database connection to MS Access',
        code: `Dim conn As ADODB.Connection
Dim connString As String

' Create connection string
connString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\\Path\\To\\Database.mdb;"

' Open connection
Set conn = New ADODB.Connection
conn.Open connString

' Use connection for queries here

' Close connection when done
conn.Close
Set conn = Nothing`,
        language: 'vb',
        category: 'Database',
        tags: ['ado', 'connection', 'access'],
        createdAt: new Date(2023, 8, 22),
        updatedAt: new Date(2023, 9, 5),
        favorite: true,
        usageCount: 27
      },
      {
        id: '3',
        title: 'Error Handler',
        description: 'Basic error handling template',
        code: `Sub MyProcedure()
    On Error GoTo ErrorHandler
    
    ' Your code here
    
    Exit Sub
    
ErrorHandler:
    Select Case Err.Number
        Case 13  ' Type mismatch
            MsgBox "Type mismatch error occurred", vbExclamation, "Error"
        Case 53  ' File not found
            MsgBox "File not found: " & Err.Description, vbExclamation, "Error"
        Case Else
            MsgBox "Error " & Err.Number & ": " & Err.Description, vbCritical, "Error"
    End Select
    Resume Next  ' Or use Resume [label] to go to a specific point
End Sub`,
        language: 'vb',
        category: 'Error Handling',
        tags: ['error', 'handler', 'exception'],
        createdAt: new Date(2023, 7, 10),
        updatedAt: new Date(2023, 9, 18),
        favorite: false,
        usageCount: 19
      },
      {
        id: '4',
        title: 'SQL Select with Parameters',
        description: 'Parameterized SQL query to prevent SQL injection',
        code: `Dim conn As ADODB.Connection
Dim cmd As ADODB.Command
Dim rs As ADODB.Recordset

' Create connection
Set conn = New ADODB.Connection
conn.Open "Your Connection String Here"

' Create command
Set cmd = New ADODB.Command
cmd.ActiveConnection = conn
cmd.CommandText = "SELECT * FROM Customers WHERE CustomerID = ? AND Country = ?"

' Add parameters
cmd.Parameters.Append cmd.CreateParameter("CustomerID", adInteger, adParamInput, , 12345)
cmd.Parameters.Append cmd.CreateParameter("Country", adVarChar, adParamInput, 50, "USA")

' Execute query
Set rs = cmd.Execute()

' Process results
Do Until rs.EOF
    Debug.Print rs!CustomerName
    rs.MoveNext
Loop

' Clean up
rs.Close
conn.Close
Set rs = Nothing
Set cmd = Nothing
Set conn = Nothing`,
        language: 'vb',
        category: 'Database',
        tags: ['sql', 'parameters', 'query'],
        createdAt: new Date(2023, 9, 1),
        updatedAt: new Date(2023, 9, 20),
        favorite: false,
        usageCount: 8
      },
      {
        id: '5',
        title: 'Input Validation',
        description: 'Common input validation functions',
        code: `' Validate numeric input
Function IsNumeric(text As String) As Boolean
    On Error GoTo ErrorHandler
    Dim n As Double
    n = Val(text)
    IsNumeric = True
    Exit Function
ErrorHandler:
    IsNumeric = False
End Function

' Validate email format
Function IsValidEmail(email As String) As Boolean
    Dim regex As Object
    Set regex = CreateObject("VBScript.RegExp")
    regex.Pattern = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
    IsValidEmail = regex.Test(email)
End Function

' Validate date format
Function IsValidDate(dateStr As String) As Boolean
    On Error GoTo ErrorHandler
    Dim d As Date
    d = CDate(dateStr)
    IsValidDate = True
    Exit Function
ErrorHandler:
    IsValidDate = False
End Function`,
        language: 'vb',
        category: 'Validation',
        tags: ['validate', 'input', 'check'],
        createdAt: new Date(2023, 8, 5),
        updatedAt: new Date(2023, 8, 5),
        favorite: true,
        usageCount: 31
      }
    ];

    setSnippets(sampleSnippets);
    setFilteredSnippets(sampleSnippets);
  }, []);

  // Filter snippets when search term or category changes
  useEffect(() => {
    let filtered = snippets;
    
    if (searchTerm) {
      filtered = filtered.filter(snippet => 
        snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        snippet.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(snippet => snippet.category === selectedCategory);
    }
    
    setFilteredSnippets(filtered);
  }, [searchTerm, selectedCategory, snippets]);

  const getUniqueCategories = () => {
    const categories = snippets.map(snippet => snippet.category);
    return ['All', ...Array.from(new Set(categories))];
  };

  const handleCreateNewSnippet = () => {
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      title: '',
      description: '',
      code: '',
      language: 'vb',
      category: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      favorite: false,
      usageCount: 0
    };
    
    setSelectedSnippet(newSnippet);
    setEditTitle('');
    setEditDescription('');
    setEditCode('');
    setEditLanguage('vb');
    setEditCategory('');
    setEditTags('');
    setIsEditing(true);
  };

  const handleEditSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setEditTitle(snippet.title);
    setEditDescription(snippet.description);
    setEditCode(snippet.code);
    setEditLanguage(snippet.language);
    setEditCategory(snippet.category);
    setEditTags(snippet.tags.join(', '));
    setIsEditing(true);
  };

  const handleSaveSnippet = () => {
    if (!selectedSnippet) return;
    
    const updatedSnippet: CodeSnippet = {
      ...selectedSnippet,
      title: editTitle,
      description: editDescription,
      code: editCode,
      language: editLanguage,
      category: editCategory,
      tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      updatedAt: new Date()
    };
    
    // Update or add the snippet
    if (snippets.find(s => s.id === selectedSnippet.id)) {
      setSnippets(snippets.map(s => 
        s.id === selectedSnippet.id ? updatedSnippet : s
      ));
    } else {
      setSnippets([...snippets, updatedSnippet]);
    }
    
    setSelectedSnippet(updatedSnippet);
    setIsEditing(false);
  };

  const handleDeleteSnippet = (id: string) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      setSnippets(snippets.filter(s => s.id !== id));
      if (selectedSnippet?.id === id) {
        setSelectedSnippet(null);
      }
    }
  };

  const toggleFavorite = (id: string) => {
    setSnippets(snippets.map(s => 
      s.id === id ? { ...s, favorite: !s.favorite } : s
    ));
    
    if (selectedSnippet?.id === id) {
      setSelectedSnippet({ ...selectedSnippet, favorite: !selectedSnippet.favorite });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setShowCopied(id);
        setTimeout(() => setShowCopied(null), 1500);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const incrementUsageCount = (id: string) => {
    setSnippets(snippets.map(s => 
      s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-lg" style={{ width: '900px', height: '600px' }}>
        <div className="bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code size={16} />
            <span>Snippet Manager</span>
          </div>
          <button onClick={onClose} className="text-white hover:bg-blue-700 px-2">×</button>
        </div>

        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between mb-4">
            <div className="flex items-center w-80">
              <Search size={16} className="text-gray-400 absolute ml-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search snippets..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleCreateNewSnippet}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Create New Snippet
            </button>
          </div>

          <div className="flex-1 flex gap-4">
            {/* Left sidebar - categories */}
            <div className="w-48">
              <div className="text-sm font-semibold mb-2">Categories</div>
              <div className="bg-white rounded border border-gray-300">
                {getUniqueCategories().map(category => (
                  <div
                    key={category}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      selectedCategory === category 
                        ? 'bg-blue-100 border-l-4 border-blue-600' 
                        : 'border-l-4 border-transparent hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'All' ? 'All Categories' : category}
                  </div>
                ))}
                <div className="px-3 py-2 cursor-pointer text-sm border-t border-gray-200 hover:bg-gray-100 flex items-center gap-2">
                  <FolderPlus size={14} />
                  New Category
                </div>
              </div>
            </div>

            {/* Middle - snippet list */}
            <div className="w-64 flex flex-col">
              <div className="text-sm font-semibold mb-2">Snippets</div>
              {filteredSnippets.length > 0 ? (
                <div className="bg-white rounded border border-gray-300 flex-1 overflow-auto">
                  {filteredSnippets.map(snippet => (
                    <div
                      key={snippet.id}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedSnippet?.id === snippet.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedSnippet(snippet)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileCode size={16} className="text-blue-600" />
                        <div className="flex-1 font-medium text-sm truncate">{snippet.title}</div>
                        {snippet.favorite && (
                          <div className="text-yellow-500">★</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-1 line-clamp-2">{snippet.description}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{snippet.category}</span>
                        <span className="text-gray-500">{formatDate(snippet.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded border border-gray-300 flex-1 flex items-center justify-center p-4">
                  <div className="text-center text-gray-500">
                    <div className="text-sm mb-2">No snippets found</div>
                    <div className="text-xs">Try adjusting your search or category filter</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right - snippet details */}
            <div className="flex-1">
              <div className="text-sm font-semibold mb-2">Details</div>
              <div className="bg-white rounded border border-gray-300 h-full p-4">
                {selectedSnippet ? (
                  isEditing ? (
                    <div className="h-full flex flex-col">
                      <div className="space-y-3 flex-1 overflow-auto">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="Snippet title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold mb-1">Description</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            rows={2}
                            placeholder="Brief description of what this snippet does"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold mb-1">Code</label>
                          <textarea
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                            rows={8}
                            placeholder="Your code snippet here..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1">Language</label>
                            <select
                              value={editLanguage}
                              onChange={(e) => setEditLanguage(e.target.value as any)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="vb">VB</option>
                              <option value="sql">SQL</option>
                              <option value="html">HTML</option>
                              <option value="javascript">JavaScript</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold mb-1">Category</label>
                            <input
                              type="text"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder="e.g. Database, UI, Utility"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold mb-1">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="e.g. dialog, file, open"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-3 border-t border-gray-300 mt-3">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSnippet}
                          disabled={!editTitle.trim() || !editCode.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Save size={16} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{selectedSnippet.title}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(selectedSnippet.id)}
                            className={`p-1 rounded hover:bg-gray-200 ${selectedSnippet.favorite ? 'text-yellow-500' : 'text-gray-400'}`}
                            title={selectedSnippet.favorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            ★
                          </button>
                          <button
                            onClick={() => handleEditSnippet(selectedSnippet)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit snippet"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSnippet(selectedSnippet.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete snippet"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{selectedSnippet.description}</p>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs uppercase">
                            {selectedSnippet.language}
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatDate(selectedSnippet.updatedAt)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Used {selectedSnippet.usageCount} times
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto">
                        <pre className="bg-gray-800 text-gray-200 p-4 rounded overflow-x-auto text-xs font-mono whitespace-pre">
                          {selectedSnippet.code}
                        </pre>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Tag size={14} />
                            {selectedSnippet.tags.map(tag => (
                              <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(selectedSnippet.code, selectedSnippet.id)}
                            className="px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm flex items-center gap-2"
                            title="Copy to clipboard"
                          >
                            {showCopied === selectedSnippet.id ? (
                              <>
                                <CopyCheck size={16} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                Copy
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              incrementUsageCount(selectedSnippet.id);
                              onInsertSnippet(selectedSnippet);
                              onClose();
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                            title="Insert into editor"
                          >
                            <ArrowBigRight size={16} />
                            Insert
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Code size={48} className="mx-auto mb-3 opacity-50" />
                      <div className="text-lg mb-1">No Snippet Selected</div>
                      <div className="text-sm">Select a snippet from the list or create a new one</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};