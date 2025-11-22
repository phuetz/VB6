import React, { useState, useEffect } from 'react';
import { X, Play, Save, Download, Upload, Plus, Minus, Database, Table, Eye, Code } from 'lucide-react';
import { vb6DatabaseService, ADOConnection } from '../../services/VB6DatabaseService';

interface QueryField {
  table: string;
  field: string;
  alias?: string;
  sort?: 'ASC' | 'DESC' | '';
  show: boolean;
  criteria?: string;
}

interface QueryJoin {
  leftTable: string;
  rightTable: string;
  leftField: string;
  rightField: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

interface DatabaseQueryBuilderProps {
  visible: boolean;
  onClose: () => void;
  connection?: ADOConnection;
  onQueryResult?: (sql: string, results: any[]) => void;
  initialSQL?: string;
}

export const DatabaseQueryBuilder: React.FC<DatabaseQueryBuilderProps> = ({
  visible,
  onClose,
  connection,
  onQueryResult,
  initialSQL = ''
}) => {
  const [mode, setMode] = useState<'visual' | 'sql'>('visual');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [tableSchemas, setTableSchemas] = useState<{ [table: string]: { [field: string]: string } }>({});
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [queryFields, setQueryFields] = useState<QueryField[]>([]);
  const [joins, setJoins] = useState<QueryJoin[]>([]);
  const [whereConditions, setWhereConditions] = useState<string>('');
  const [groupByFields, setGroupByFields] = useState<string[]>([]);
  const [havingConditions, setHavingConditions] = useState<string>('');
  const [orderByFields, setOrderByFields] = useState<{ field: string; direction: 'ASC' | 'DESC' }[]>([]);
  const [sqlQuery, setSqlQuery] = useState(initialSQL);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Load available tables when component mounts
  useEffect(() => {
    if (visible) {
      loadAvailableTables();
      if (initialSQL) {
        setSqlQuery(initialSQL);
        setMode('sql');
      }
    }
  }, [visible, initialSQL]);

  // Generate SQL when visual query changes
  useEffect(() => {
    if (mode === 'visual') {
      generateSQL();
    }
  }, [queryFields, joins, whereConditions, groupByFields, havingConditions, orderByFields, mode]);

  const loadAvailableTables = () => {
    try {
      const tables = vb6DatabaseService.getAvailableTables();
      setAvailableTables(tables);
      
      // Load schemas for all tables
      const schemas: { [table: string]: { [field: string]: string } } = {};
      tables.forEach(table => {
        schemas[table] = vb6DatabaseService.getTableSchema(table);
      });
      setTableSchemas(schemas);
    } catch (err: any) {
      setError(`Failed to load tables: ${err.message}`);
    }
  };

  const addTable = (tableName: string) => {
    if (!selectedTables.includes(tableName)) {
      setSelectedTables([...selectedTables, tableName]);
      
      // Add all fields from the table to query fields
      const schema = tableSchemas[tableName];
      if (schema) {
        const newFields = Object.keys(schema).map(field => ({
          table: tableName,
          field,
          show: false,
          sort: '' as any
        }));
        setQueryFields([...queryFields, ...newFields]);
      }
    }
  };

  const removeTable = (tableName: string) => {
    setSelectedTables(selectedTables.filter(t => t !== tableName));
    setQueryFields(queryFields.filter(f => f.table !== tableName));
    setJoins(joins.filter(j => j.leftTable !== tableName && j.rightTable !== tableName));
  };

  const updateQueryField = (index: number, updates: Partial<QueryField>) => {
    const updated = [...queryFields];
    updated[index] = { ...updated[index], ...updates };
    setQueryFields(updated);
  };

  const addJoin = () => {
    if (selectedTables.length >= 2) {
      const newJoin: QueryJoin = {
        leftTable: selectedTables[0],
        rightTable: selectedTables[1],
        leftField: Object.keys(tableSchemas[selectedTables[0]] || {})[0] || '',
        rightField: Object.keys(tableSchemas[selectedTables[1]] || {})[0] || '',
        joinType: 'INNER'
      };
      setJoins([...joins, newJoin]);
    }
  };

  const updateJoin = (index: number, updates: Partial<QueryJoin>) => {
    const updated = [...joins];
    updated[index] = { ...updated[index], ...updates };
    setJoins(updated);
  };

  const removeJoin = (index: number) => {
    setJoins(joins.filter((_, i) => i !== index));
  };

  const generateSQL = () => {
    if (queryFields.length === 0) {
      setSqlQuery('');
      return;
    }

    let sql = 'SELECT ';
    
    // SELECT clause
    const selectFields = queryFields
      .filter(f => f.show)
      .map(f => {
        let fieldExpr = `${f.table}.${f.field}`;
        if (f.alias) {
          fieldExpr += ` AS ${f.alias}`;
        }
        return fieldExpr;
      });
    
    if (selectFields.length === 0) {
      selectFields.push('*');
    }
    
    sql += selectFields.join(', ');
    
    // FROM clause
    if (selectedTables.length > 0) {
      sql += `\nFROM ${selectedTables[0]}`;
      
      // JOINs
      joins.forEach(join => {
        sql += `\n${join.joinType} JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftField} = ${join.rightTable}.${join.rightField}`;
      });
    }
    
    // WHERE clause
    if (whereConditions.trim()) {
      sql += `\nWHERE ${whereConditions}`;
    }
    
    // GROUP BY clause
    if (groupByFields.length > 0) {
      sql += `\nGROUP BY ${groupByFields.join(', ')}`;
    }
    
    // HAVING clause
    if (havingConditions.trim()) {
      sql += `\nHAVING ${havingConditions}`;
    }
    
    // ORDER BY clause
    if (orderByFields.length > 0) {
      const orderBy = orderByFields.map(f => `${f.field} ${f.direction}`).join(', ');
      sql += `\nORDER BY ${orderBy}`;
    }
    
    setSqlQuery(sql);
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setQueryResults([]);

    try {
      const results = await vb6DatabaseService.executeSQL('', sqlQuery);
      setQueryResults(results);
      setShowResults(true);
      onQueryResult?.(sqlQuery, results);
    } catch (err: any) {
      setError(`Query execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const exportQuery = () => {
    const blob = new Blob([sqlQuery], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSqlQuery(content);
        setMode('sql');
      };
      reader.readAsText(file);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-[1000px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="text-purple-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Query Builder</h2>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setMode('visual')}
                className={`px-3 py-1 text-sm rounded ${
                  mode === 'visual' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye size={14} className="inline mr-1" />
                Visual
              </button>
              <button
                onClick={() => setMode('sql')}
                className={`px-3 py-1 text-sm rounded ${
                  mode === 'sql' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Code size={14} className="inline mr-1" />
                SQL
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={executeQuery}
              disabled={isExecuting || !sqlQuery.trim()}
              className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              {isExecuting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Play size={14} />
              )}
              Execute
            </button>
            <button
              onClick={exportQuery}
              disabled={!sqlQuery.trim()}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              <Download size={14} />
              Export
            </button>
            <label className="flex items-center gap-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer text-sm">
              <Upload size={14} />
              Import
              <input
                type="file"
                accept=".sql,.txt"
                onChange={importQuery}
                className="hidden"
              />
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {mode === 'visual' ? (
            <>
              {/* Left Panel - Tables */}
              <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Tables</h3>
                  <div className="space-y-2">
                    {availableTables.map(table => (
                      <div key={table} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{table}</span>
                        <button
                          onClick={() => addTable(table)}
                          disabled={selectedTables.includes(table)}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedTables.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-700 mt-6 mb-3">Selected Tables</h3>
                      <div className="space-y-2">
                        {selectedTables.map(table => (
                          <div key={table} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm font-medium">{table}</span>
                            <button
                              onClick={() => removeTable(table)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {selectedTables.length >= 2 && (
                        <button
                          onClick={addJoin}
                          className="w-full mt-4 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                        >
                          Add Join
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Main Panel - Query Builder */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Fields */}
                {queryFields.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Fields</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Show</th>
                            <th className="px-3 py-2 text-left">Table</th>
                            <th className="px-3 py-2 text-left">Field</th>
                            <th className="px-3 py-2 text-left">Alias</th>
                            <th className="px-3 py-2 text-left">Sort</th>
                            <th className="px-3 py-2 text-left">Criteria</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queryFields.map((field, index) => (
                            <tr key={`${field.table}.${field.field}`} className="border-t border-gray-200">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={field.show}
                                  onChange={(e) => updateQueryField(index, { show: e.target.checked })}
                                />
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">{field.table}</td>
                              <td className="px-3 py-2 font-mono text-xs">{field.field}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={field.alias || ''}
                                  onChange={(e) => updateQueryField(index, { alias: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                  placeholder="Alias"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={field.sort || ''}
                                  onChange={(e) => updateQueryField(index, { sort: e.target.value as any })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                >
                                  <option value="">None</option>
                                  <option value="ASC">ASC</option>
                                  <option value="DESC">DESC</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={field.criteria || ''}
                                  onChange={(e) => updateQueryField(index, { criteria: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                  placeholder="= 'value'"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Joins */}
                {joins.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Joins</h3>
                    <div className="space-y-3">
                      {joins.map((join, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <select
                              value={join.joinType}
                              onChange={(e) => updateJoin(index, { joinType: e.target.value as any })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="INNER">INNER JOIN</option>
                              <option value="LEFT">LEFT JOIN</option>
                              <option value="RIGHT">RIGHT JOIN</option>
                              <option value="FULL">FULL JOIN</option>
                            </select>
                            
                            <select
                              value={join.leftTable}
                              onChange={(e) => updateJoin(index, { leftTable: e.target.value })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              {selectedTables.map(table => (
                                <option key={table} value={table}>{table}</option>
                              ))}
                            </select>
                            
                            <span className="text-xs text-gray-500">ON</span>
                            
                            <select
                              value={join.leftField}
                              onChange={(e) => updateJoin(index, { leftField: e.target.value })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              {Object.keys(tableSchemas[join.leftTable] || {}).map(field => (
                                <option key={field} value={field}>{field}</option>
                              ))}
                            </select>
                            
                            <span className="text-xs text-gray-500">=</span>
                            
                            <select
                              value={join.rightField}
                              onChange={(e) => updateJoin(index, { rightField: e.target.value })}
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              {Object.keys(tableSchemas[join.rightTable] || {}).map(field => (
                                <option key={field} value={field}>{field}</option>
                              ))}
                            </select>
                            
                            <button
                              onClick={() => removeJoin(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WHERE Conditions */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WHERE Conditions
                  </label>
                  <textarea
                    value={whereConditions}
                    onChange={(e) => setWhereConditions(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                    rows={3}
                    placeholder="Enter WHERE conditions (e.g., Products.Price > 20 AND Products.CategoryID = 1)"
                  />
                </div>
              </div>
            </>
          ) : (
            /* SQL Mode */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono resize-none"
                  placeholder="Enter your SQL query here..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Generated SQL Preview */}
        {mode === 'visual' && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Generated SQL</h3>
            <pre className="text-xs font-mono text-gray-600 bg-white p-3 border border-gray-200 rounded overflow-x-auto">
              {sqlQuery || 'No query generated'}
            </pre>
          </div>
        )}

        {/* Results */}
        {showResults && queryResults.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-40 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Query Results ({queryResults.length} rows)
            </h3>
            <div className="text-xs">
              <pre className="whitespace-pre-wrap text-gray-600">
                {JSON.stringify(queryResults.slice(0, 5), null, 2)}
                {queryResults.length > 5 && '\n... and ' + (queryResults.length - 5) + ' more rows'}
              </pre>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="border-t border-gray-200 bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseQueryBuilder;