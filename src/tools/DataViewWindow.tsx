import React, { useState, useEffect, useMemo } from 'react';
import { X, Database, Search, Filter, Plus, Trash2, Edit3, Save, RefreshCw, Download, Upload, Copy, Settings, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff, MoreHorizontal, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Types
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  BINARY = 'binary',
  JSON = 'json',
  XML = 'xml',
  GUID = 'guid'
}

export enum FilterOperator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  BETWEEN = 'BETWEEN'
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

export enum RowStatus {
  UNCHANGED = 'unchanged',
  MODIFIED = 'modified',
  INSERTED = 'inserted',
  DELETED = 'deleted'
}

export interface DataColumn {
  id: string;
  name: string;
  displayName: string;
  dataType: DataType;
  width: number;
  visible: boolean;
  readOnly: boolean;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyTable?: string;
  foreignKeyColumn?: string;
  format?: string;
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customValidator?: string;
  };
}

export interface DataFilter {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For BETWEEN operator
  enabled: boolean;
}

export interface DataSort {
  columnId: string;
  direction: SortDirection;
  priority: number;
}

export interface DataRow {
  id: string;
  status: RowStatus;
  data: Record<string, any>;
  originalData: Record<string, any>;
  errors: Record<string, string>;
  isSelected: boolean;
  isEditing: boolean;
}

export interface DataViewConfig {
  tableName: string;
  schema: string;
  pageSize: number;
  allowEdit: boolean;
  allowInsert: boolean;
  allowDelete: boolean;
  showRowNumbers: boolean;
  showStatusColumn: boolean;
  enablePaging: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
  enableGrouping: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
}

export interface DataConnection {
  id: string;
  name: string;
  type: 'sql-server' | 'mysql' | 'postgresql' | 'oracle' | 'sqlite';
  connectionString: string;
  isConnected: boolean;
}

interface DataViewWindowProps {
  isOpen: boolean;
  onClose: () => void;
  connection?: DataConnection;
  tableName?: string;
  schema?: string;
}

export const DataViewWindow: React.FC<DataViewWindowProps> = ({
  isOpen,
  onClose,
  connection,
  tableName = 'Users',
  schema = 'dbo'
}) => {
  const [config, setConfig] = useState<DataViewConfig>({
    tableName,
    schema,
    pageSize: 50,
    allowEdit: true,
    allowInsert: true,
    allowDelete: true,
    showRowNumbers: true,
    showStatusColumn: true,
    enablePaging: true,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: false,
    autoRefresh: false,
    refreshInterval: 30
  });

  const [columns, setColumns] = useState<DataColumn[]>([
    {
      id: 'id',
      name: 'ID',
      displayName: 'ID',
      dataType: DataType.NUMBER,
      width: 80,
      visible: true,
      readOnly: true,
      nullable: false,
      isPrimaryKey: true,
      isForeignKey: false
    },
    {
      id: 'name',
      name: 'Name',
      displayName: 'Full Name',
      dataType: DataType.STRING,
      width: 200,
      visible: true,
      readOnly: false,
      nullable: false,
      isPrimaryKey: false,
      isForeignKey: false,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100
      }
    },
    {
      id: 'email',
      name: 'Email',
      displayName: 'Email Address',
      dataType: DataType.STRING,
      width: 250,
      visible: true,
      readOnly: false,
      nullable: false,
      isPrimaryKey: false,
      isForeignKey: false,
      validation: {
        required: true,
        pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
      }
    },
    {
      id: 'age',
      name: 'Age',
      displayName: 'Age',
      dataType: DataType.NUMBER,
      width: 80,
      visible: true,
      readOnly: false,
      nullable: true,
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      id: 'isActive',
      name: 'IsActive',
      displayName: 'Active',
      dataType: DataType.BOOLEAN,
      width: 80,
      visible: true,
      readOnly: false,
      nullable: false,
      isPrimaryKey: false,
      isForeignKey: false
    },
    {
      id: 'createdDate',
      name: 'CreatedDate',
      displayName: 'Created',
      dataType: DataType.DATETIME,
      width: 150,
      visible: true,
      readOnly: true,
      nullable: false,
      isPrimaryKey: false,
      isForeignKey: false,
      format: 'yyyy-MM-dd HH:mm:ss'
    },
    {
      id: 'departmentId',
      name: 'DepartmentId',
      displayName: 'Department',
      dataType: DataType.NUMBER,
      width: 120,
      visible: true,
      readOnly: false,
      nullable: true,
      isPrimaryKey: false,
      isForeignKey: true,
      foreignKeyTable: 'Departments',
      foreignKeyColumn: 'ID'
    }
  ]);

  const [rows, setRows] = useState<DataRow[]>([
    {
      id: '1',
      status: RowStatus.UNCHANGED,
      data: { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, isActive: true, createdDate: '2024-01-15 10:30:00', departmentId: 1 },
      originalData: { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, isActive: true, createdDate: '2024-01-15 10:30:00', departmentId: 1 },
      errors: {},
      isSelected: false,
      isEditing: false
    },
    {
      id: '2',
      status: RowStatus.UNCHANGED,
      data: { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 28, isActive: true, createdDate: '2024-01-16 14:20:00', departmentId: 2 },
      originalData: { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 28, isActive: true, createdDate: '2024-01-16 14:20:00', departmentId: 2 },
      errors: {},
      isSelected: false,
      isEditing: false
    },
    {
      id: '3',
      status: RowStatus.UNCHANGED,
      data: { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, isActive: false, createdDate: '2024-01-17 09:15:00', departmentId: 1 },
      originalData: { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, isActive: false, createdDate: '2024-01-17 09:15:00', departmentId: 1 },
      errors: {},
      isSelected: false,
      isEditing: false
    }
  ]);

  const [filters, setFilters] = useState<DataFilter[]>([]);
  const [sorts, setSorts] = useState<DataSort[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);
  
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Apply search
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row.data).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    filters.forEach(filter => {
      if (!filter.enabled) return;
      
      const column = columns.find(c => c.id === filter.columnId);
      if (!column) return;

      result = result.filter(row => {
        const value = row.data[filter.columnId];
        
        switch (filter.operator) {
          case FilterOperator.EQUALS:
            return value === filter.value;
          case FilterOperator.NOT_EQUALS:
            return value !== filter.value;
          case FilterOperator.GREATER_THAN:
            return value > filter.value;
          case FilterOperator.GREATER_THAN_OR_EQUAL:
            return value >= filter.value;
          case FilterOperator.LESS_THAN:
            return value < filter.value;
          case FilterOperator.LESS_THAN_OR_EQUAL:
            return value <= filter.value;
          case FilterOperator.CONTAINS:
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case FilterOperator.STARTS_WITH:
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case FilterOperator.ENDS_WITH:
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case FilterOperator.IS_NULL:
            return value === null || value === undefined || value === '';
          case FilterOperator.IS_NOT_NULL:
            return value !== null && value !== undefined && value !== '';
          case FilterOperator.BETWEEN:
            return value >= filter.value && value <= filter.value2;
          default:
            return true;
        }
      });
    });

    // Apply sorts
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts.sort((x, y) => x.priority - y.priority)) {
          const aValue = a.data[sort.columnId];
          const bValue = b.data[sort.columnId];
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === SortDirection.ASC ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [rows, searchTerm, filters, sorts, columns]);

  const paginatedRows = useMemo(() => {
    if (!config.enablePaging) return filteredAndSortedRows;
    
    const startIndex = (currentPage - 1) * config.pageSize;
    return filteredAndSortedRows.slice(startIndex, startIndex + config.pageSize);
  }, [filteredAndSortedRows, currentPage, config.pageSize, config.enablePaging]);

  const totalPages = Math.ceil(filteredAndSortedRows.length / config.pageSize);

  const addFilter = () => {
    const newFilter: DataFilter = {
      id: `filter-${Date.now()}`,
      columnId: columns[0]?.id || '',
      operator: FilterOperator.EQUALS,
      value: '',
      enabled: true
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (filterId: string, updates: Partial<DataFilter>) => {
    setFilters(filters.map(filter =>
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(filter => filter.id !== filterId));
  };

  const toggleSort = (columnId: string) => {
    const existingSort = sorts.find(s => s.columnId === columnId);
    
    if (!existingSort) {
      setSorts([...sorts, { columnId, direction: SortDirection.ASC, priority: sorts.length }]);
    } else if (existingSort.direction === SortDirection.ASC) {
      setSorts(sorts.map(s =>
        s.columnId === columnId ? { ...s, direction: SortDirection.DESC } : s
      ));
    } else {
      setSorts(sorts.filter(s => s.columnId !== columnId));
    }
  };

  const startEditing = (rowId: string, columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (column?.readOnly) return;
    
    setEditingCell({ rowId, columnId });
    setRows(rows.map(row =>
      row.id === rowId ? { ...row, isEditing: true } : row
    ));
  };

  const saveCell = (rowId: string, columnId: string, value: any) => {
    setRows(rows.map(row => {
      if (row.id !== rowId) return row;
      
      const newData = { ...row.data, [columnId]: value };
      const hasChanges = JSON.stringify(newData) !== JSON.stringify(row.originalData);
      
      return {
        ...row,
        data: newData,
        status: row.status === RowStatus.INSERTED ? RowStatus.INSERTED : 
                hasChanges ? RowStatus.MODIFIED : RowStatus.UNCHANGED,
        isEditing: false
      };
    }));
    
    setEditingCell(null);
  };

  const cancelEdit = (rowId: string) => {
    setRows(rows.map(row =>
      row.id === rowId ? { ...row, isEditing: false } : row
    ));
    setEditingCell(null);
  };

  const addNewRow = () => {
    const newRow: DataRow = {
      id: `new-${Date.now()}`,
      status: RowStatus.INSERTED,
      data: columns.reduce((acc, col) => {
        acc[col.id] = col.dataType === DataType.BOOLEAN ? false :
                     col.dataType === DataType.NUMBER ? 0 :
                     col.dataType === DataType.DATE || col.dataType === DataType.DATETIME ? new Date().toISOString() :
                     '';
        return acc;
      }, {} as Record<string, any>),
      originalData: {},
      errors: {},
      isSelected: false,
      isEditing: true
    };
    
    setRows([newRow, ...rows]);
  };

  const deleteRows = (rowIds: string[]) => {
    setRows(rows.map(row =>
      rowIds.includes(row.id) ? { ...row, status: RowStatus.DELETED } : row
    ));
    setSelectedRows(new Set());
  };

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const exportData = () => {
    const csvContent = [
      visibleColumns.map(col => col.displayName).join(','),
      ...filteredAndSortedRows
        .filter(row => row.status !== RowStatus.DELETED)
        .map(row =>
          visibleColumns.map(col => {
            const value = row.data[col.id];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.tableName}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: RowStatus) => {
    switch (status) {
      case RowStatus.MODIFIED:
        return <Edit3 className="w-3 h-3 text-orange-600" />;
      case RowStatus.INSERTED:
        return <Plus className="w-3 h-3 text-green-600" />;
      case RowStatus.DELETED:
        return <Trash2 className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  const renderCell = (row: DataRow, column: DataColumn) => {
    const value = row.data[column.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
    
    if (isEditing) {
      return (
        <CellEditor
          value={value}
          column={column}
          onSave={(newValue) => saveCell(row.id, column.id, newValue)}
          onCancel={() => cancelEdit(row.id)}
        />
      );
    }
    
    if (row.status === RowStatus.DELETED) {
      return <span className="text-gray-400 line-through">{formatCellValue(value, column)}</span>;
    }
    
    return (
      <div
        className={`cursor-pointer hover:bg-gray-100 p-1 ${column.readOnly ? 'text-gray-600' : ''}`}
        onClick={() => startEditing(row.id, column.id)}
      >
        {formatCellValue(value, column)}
      </div>
    );
  };

  const formatCellValue = (value: any, column: DataColumn) => {
    if (value === null || value === undefined) return '';
    
    switch (column.dataType) {
      case DataType.BOOLEAN:
        return value ? '✓' : '✗';
      case DataType.DATE:
        return new Date(value).toLocaleDateString();
      case DataType.DATETIME:
        return new Date(value).toLocaleString();
      case DataType.NUMBER:
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return String(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95%] h-[90%] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Data View</h2>
            <span className="text-sm text-gray-600">
              {config.schema}.{config.tableName}
            </span>
            {connection && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {connection.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Column Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={exportData}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border rounded text-sm w-64"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded text-sm flex items-center gap-1 ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters ({filters.filter(f => f.enabled).length})
            </button>
            {config.allowInsert && (
              <button
                onClick={addNewRow}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                New Row
              </button>
            )}
            {config.allowDelete && selectedRows.size > 0 && (
              <button
                onClick={() => deleteRows(Array.from(selectedRows))}
                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedRows.size})
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              {filteredAndSortedRows.filter(r => r.status !== RowStatus.DELETED).length} rows
              {filteredAndSortedRows.length !== rows.length && ` of ${rows.length}`}
            </span>
            {config.enablePaging && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <select
                  value={config.pageSize}
                  onChange={(e) => setConfig({ ...config, pageSize: parseInt(e.target.value) })}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-3 border-b bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Filters</h4>
              <button
                onClick={addFilter}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add Filter
              </button>
            </div>
            <div className="space-y-2">
              {filters.map(filter => (
                <div key={filter.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filter.enabled}
                    onChange={(e) => updateFilter(filter.id, { enabled: e.target.checked })}
                  />
                  <select
                    value={filter.columnId}
                    onChange={(e) => updateFilter(filter.id, { columnId: e.target.value })}
                    className="px-2 py-1 border rounded"
                  >
                    {columns.map(col => (
                      <option key={col.id} value={col.id}>{col.displayName}</option>
                    ))}
                  </select>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                    className="px-2 py-1 border rounded"
                  >
                    <option value={FilterOperator.EQUALS}>Equals</option>
                    <option value={FilterOperator.NOT_EQUALS}>Not Equals</option>
                    <option value={FilterOperator.CONTAINS}>Contains</option>
                    <option value={FilterOperator.STARTS_WITH}>Starts With</option>
                    <option value={FilterOperator.ENDS_WITH}>Ends With</option>
                    <option value={FilterOperator.GREATER_THAN}>Greater Than</option>
                    <option value={FilterOperator.LESS_THAN}>Less Than</option>
                    <option value={FilterOperator.IS_NULL}>Is Null</option>
                    <option value={FilterOperator.IS_NOT_NULL}>Is Not Null</option>
                  </select>
                  {filter.operator !== FilterOperator.IS_NULL && filter.operator !== FilterOperator.IS_NOT_NULL && (
                    <input
                      type="text"
                      value={filter.value || ''}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      placeholder="Value..."
                      className="px-2 py-1 border rounded"
                    />
                  )}
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Grid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="w-8 p-2 border-r">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedRows.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(paginatedRows.map(r => r.id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                {config.showRowNumbers && (
                  <th className="w-12 p-2 border-r text-xs text-gray-600">#</th>
                )}
                {config.showStatusColumn && (
                  <th className="w-8 p-2 border-r text-xs text-gray-600">
                    <MoreHorizontal className="w-3 h-3" />
                  </th>
                )}
                {visibleColumns.map(column => (
                  <th
                    key={column.id}
                    className="p-2 border-r text-left text-sm font-medium cursor-pointer hover:bg-gray-200"
                    style={{ width: column.width }}
                    onClick={() => config.enableSorting && toggleSort(column.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.displayName}</span>
                      {config.enableSorting && (
                        <div className="flex flex-col">
                          {sorts.find(s => s.columnId === column.id)?.direction === SortDirection.ASC && (
                            <ChevronUp className="w-3 h-3 text-blue-600" />
                          )}
                          {sorts.find(s => s.columnId === column.id)?.direction === SortDirection.DESC && (
                            <ChevronDown className="w-3 h-3 text-blue-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${row.isSelected ? 'bg-blue-50' : ''} ${
                    row.status === RowStatus.DELETED ? 'opacity-50' : ''
                  } ${row.status === RowStatus.MODIFIED ? 'bg-orange-50' : ''} ${
                    row.status === RowStatus.INSERTED ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="p-2 border-r text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(row.id);
                        } else {
                          newSelected.delete(row.id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </td>
                  {config.showRowNumbers && (
                    <td className="p-2 border-r text-xs text-gray-600 text-center">
                      {(currentPage - 1) * config.pageSize + index + 1}
                    </td>
                  )}
                  {config.showStatusColumn && (
                    <td className="p-2 border-r text-center">
                      {getStatusIcon(row.status)}
                    </td>
                  )}
                  {visibleColumns.map(column => (
                    <td key={column.id} className="p-0 border-r" style={{ width: column.width }}>
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status Bar */}
        <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              {rows.filter(r => r.status === RowStatus.MODIFIED).length} modified,
              {rows.filter(r => r.status === RowStatus.INSERTED).length} new,
              {rows.filter(r => r.status === RowStatus.DELETED).length} deleted
            </span>
            {selectedRows.size > 0 && (
              <span>{selectedRows.size} selected</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {config.autoRefresh && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Auto-refresh: {config.refreshInterval}s
              </span>
            )}
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Column Settings Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80%] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Column Settings</h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3">
                {columns.map(column => (
                  <div key={column.id} className="flex items-center gap-3 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={(e) => {
                        setColumns(columns.map(c =>
                          c.id === column.id ? { ...c, visible: e.target.checked } : c
                        ));
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{column.displayName}</div>
                      <div className="text-xs text-gray-600">{column.dataType}</div>
                    </div>
                    <input
                      type="number"
                      value={column.width}
                      onChange={(e) => {
                        setColumns(columns.map(c =>
                          c.id === column.id ? { ...c, width: parseInt(e.target.value) || 100 } : c
                        ));
                      }}
                      className="w-16 px-2 py-1 border rounded text-xs"
                      min="50"
                      max="500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Cell Editor Component
interface CellEditorProps {
  value: any;
  column: DataColumn;
  onSave: (value: any) => void;
  onCancel: () => void;
}

const CellEditor: React.FC<CellEditorProps> = ({ value, column, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState(value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  useEffect(() => {
    // Auto-focus and select text
    const input = document.querySelector('[data-cell-editor]') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  switch (column.dataType) {
    case DataType.BOOLEAN:
      return (
        <select
          data-cell-editor
          value={editValue ? 'true' : 'false'}
          onChange={(e) => {
            const newValue = e.target.value === 'true';
            setEditValue(newValue);
            onSave(newValue);
          }}
          onBlur={() => onCancel()}
          className="w-full p-1 border rounded"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    
    case DataType.NUMBER:
      return (
        <input
          data-cell-editor
          type="number"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value ? parseFloat(e.target.value) : '')}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancel()}
          className="w-full p-1 border rounded"
        />
      );
    
    case DataType.DATE:
      return (
        <input
          data-cell-editor
          type="date"
          value={editValue ? new Date(editValue).toISOString().split('T')[0] : ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancel()}
          className="w-full p-1 border rounded"
        />
      );
    
    case DataType.DATETIME:
      return (
        <input
          data-cell-editor
          type="datetime-local"
          value={editValue ? new Date(editValue).toISOString().slice(0, 16) : ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancel()}
          className="w-full p-1 border rounded"
        />
      );
    
    default:
      return (
        <input
          data-cell-editor
          type="text"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancel()}
          className="w-full p-1 border rounded"
        />
      );
  }
};