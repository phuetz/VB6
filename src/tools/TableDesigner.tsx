import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Key, Link, Database, AlertTriangle, FileCode, Copy, Upload, Download, CheckSquare, Shield, Clock, Zap } from 'lucide-react';

// Types
export enum DataType {
  // Numeric types
  BIT = 'bit',
  TINYINT = 'tinyint',
  SMALLINT = 'smallint',
  INT = 'int',
  BIGINT = 'bigint',
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  MONEY = 'money',
  SMALLMONEY = 'smallmoney',
  FLOAT = 'float',
  REAL = 'real',
  
  // Character types
  CHAR = 'char',
  VARCHAR = 'varchar',
  TEXT = 'text',
  NCHAR = 'nchar',
  NVARCHAR = 'nvarchar',
  NTEXT = 'ntext',
  
  // Date/Time types
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DATETIME2 = 'datetime2',
  SMALLDATETIME = 'smalldatetime',
  DATETIMEOFFSET = 'datetimeoffset',
  TIMESTAMP = 'timestamp',
  
  // Binary types
  BINARY = 'binary',
  VARBINARY = 'varbinary',
  IMAGE = 'image',
  
  // Other types
  UNIQUEIDENTIFIER = 'uniqueidentifier',
  XML = 'xml',
  JSON = 'json',
  HIERARCHYID = 'hierarchyid',
  GEOGRAPHY = 'geography',
  GEOMETRY = 'geometry',
  SQL_VARIANT = 'sql_variant'
}

export enum ConstraintType {
  PRIMARY_KEY = 'PRIMARY KEY',
  FOREIGN_KEY = 'FOREIGN KEY',
  UNIQUE = 'UNIQUE',
  CHECK = 'CHECK',
  DEFAULT = 'DEFAULT',
  NOT_NULL = 'NOT NULL'
}

export enum IndexType {
  CLUSTERED = 'CLUSTERED',
  NONCLUSTERED = 'NONCLUSTERED',
  UNIQUE_CLUSTERED = 'UNIQUE CLUSTERED',
  UNIQUE_NONCLUSTERED = 'UNIQUE NONCLUSTERED',
  COLUMNSTORE = 'COLUMNSTORE',
  COLUMNSTORE_CLUSTERED = 'CLUSTERED COLUMNSTORE',
  FULLTEXT = 'FULLTEXT',
  SPATIAL = 'SPATIAL',
  XML = 'XML'
}

export enum TriggerType {
  AFTER_INSERT = 'AFTER INSERT',
  AFTER_UPDATE = 'AFTER UPDATE',
  AFTER_DELETE = 'AFTER DELETE',
  INSTEAD_OF_INSERT = 'INSTEAD OF INSERT',
  INSTEAD_OF_UPDATE = 'INSTEAD OF UPDATE',
  INSTEAD_OF_DELETE = 'INSTEAD OF DELETE'
}

export interface TableColumn {
  id: string;
  name: string;
  dataType: DataType;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  defaultValue?: string;
  identity?: {
    seed: number;
    increment: number;
  };
  computed?: {
    expression: string;
    persisted: boolean;
  };
  description?: string;
}

export interface TableConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  columns: string[];
  definition?: string; // For CHECK constraints
  referencedTable?: string; // For FOREIGN KEY
  referencedColumns?: string[]; // For FOREIGN KEY
  onDelete?: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  onUpdate?: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
}

export interface TableIndex {
  id: string;
  name: string;
  type: IndexType;
  columns: Array<{
    name: string;
    descending: boolean;
  }>;
  includedColumns?: string[];
  filter?: string;
  fillFactor?: number;
  padIndex?: boolean;
  sortInTempdb?: boolean;
  ignoreNulls?: boolean;
  online?: boolean;
}

export interface TableTrigger {
  id: string;
  name: string;
  type: TriggerType;
  enabled: boolean;
  forReplication: boolean;
  notForReplication: boolean;
  body: string;
}

export interface TablePermission {
  id: string;
  principal: string;
  principalType: 'USER' | 'ROLE' | 'GROUP';
  permission: string;
  grantOption: boolean;
  columns?: string[];
}

export interface Table {
  id: string;
  name: string;
  schema: string;
  columns: TableColumn[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  triggers: TableTrigger[];
  permissions: TablePermission[];
  filegroup?: string;
  textImageFilegroup?: string;
  description?: string;
  lastModified?: Date;
}

interface TableDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  table?: Table;
  onSave?: (table: Table) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({
  isOpen,
  onClose,
  table,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'constraints' | 'indexes' | 'triggers' | 'permissions' | 'sql'>('columns');
  const [editedTable, setEditedTable] = useState<Table>(() => table || {
    id: `table-${Date.now()}`,
    name: 'NewTable',
    schema: 'dbo',
    columns: [],
    constraints: [],
    indexes: [],
    triggers: [],
    permissions: []
  });
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [showDataTypeHelp, setShowDataTypeHelp] = useState(false);

  useEffect(() => {
    if (table) {
      setEditedTable(table);
    }
  }, [table]);

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: `col-${Date.now()}`,
      name: `Column${editedTable.columns.length + 1}`,
      dataType: DataType.VARCHAR,
      length: 50,
      nullable: true
    };
    
    setEditedTable({
      ...editedTable,
      columns: [...editedTable.columns, newColumn]
    });
    setSelectedColumn(newColumn.id);
  };

  const updateColumn = (columnId: string, updates: Partial<TableColumn>) => {
    setEditedTable({
      ...editedTable,
      columns: editedTable.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      )
    });
  };

  const deleteColumn = (columnId: string) => {
    const column = editedTable.columns.find(c => c.id === columnId);
    if (!column) return;

    // Remove column and update constraints/indexes that reference it
    setEditedTable({
      ...editedTable,
      columns: editedTable.columns.filter(c => c.id !== columnId),
      constraints: editedTable.constraints.filter(c => !c.columns.includes(column.name)),
      indexes: editedTable.indexes.map(idx => ({
        ...idx,
        columns: idx.columns.filter(c => c.name !== column.name),
        includedColumns: idx.includedColumns?.filter(c => c !== column.name)
      })).filter(idx => idx.columns.length > 0)
    });
    
    if (selectedColumn === columnId) {
      setSelectedColumn(null);
    }
  };

  const addConstraint = (type: ConstraintType) => {
    const newConstraint: TableConstraint = {
      id: `const-${Date.now()}`,
      name: `${type.replace(' ', '_')}_${editedTable.name}_${Date.now()}`,
      type,
      columns: []
    };
    
    setEditedTable({
      ...editedTable,
      constraints: [...editedTable.constraints, newConstraint]
    });
  };

  const addIndex = () => {
    const newIndex: TableIndex = {
      id: `idx-${Date.now()}`,
      name: `IX_${editedTable.name}_${Date.now()}`,
      type: IndexType.NONCLUSTERED,
      columns: []
    };
    
    setEditedTable({
      ...editedTable,
      indexes: [...editedTable.indexes, newIndex]
    });
  };

  const addTrigger = () => {
    const newTrigger: TableTrigger = {
      id: `trig-${Date.now()}`,
      name: `TR_${editedTable.name}_${Date.now()}`,
      type: TriggerType.AFTER_INSERT,
      enabled: true,
      forReplication: false,
      notForReplication: false,
      body: `-- Trigger body\nBEGIN\n    -- Your trigger logic here\nEND`
    };
    
    setEditedTable({
      ...editedTable,
      triggers: [...editedTable.triggers, newTrigger]
    });
  };

  const generateSQL = (): string => {
    let sql = `-- Create table ${editedTable.schema}.${editedTable.name}\n`;
    sql += `CREATE TABLE [${editedTable.schema}].[${editedTable.name}] (\n`;
    
    // Columns
    const columnDefs = editedTable.columns.map(col => {
      let def = `    [${col.name}] ${col.dataType.toUpperCase()}`;
      
      if (col.length) def += `(${col.length})`;
      else if (col.precision) {
        def += `(${col.precision}`;
        if (col.scale) def += `, ${col.scale}`;
        def += ')';
      }
      
      if (col.identity) {
        def += ` IDENTITY(${col.identity.seed}, ${col.identity.increment})`;
      }
      
      def += col.nullable ? ' NULL' : ' NOT NULL';
      
      if (col.defaultValue) {
        def += ` DEFAULT ${col.defaultValue}`;
      }
      
      if (col.computed) {
        def = `    [${col.name}] AS ${col.computed.expression}`;
        if (col.computed.persisted) def += ' PERSISTED';
      }
      
      return def;
    });
    
    sql += columnDefs.join(',\n');
    
    // Inline constraints
    const pkConstraint = editedTable.constraints.find(c => c.type === ConstraintType.PRIMARY_KEY);
    if (pkConstraint) {
      sql += `,\n    CONSTRAINT [${pkConstraint.name}] PRIMARY KEY (${pkConstraint.columns.map(c => `[${c}]`).join(', ')})`;
    }
    
    sql += '\n);\n\n';
    
    // Foreign keys
    editedTable.constraints
      .filter(c => c.type === ConstraintType.FOREIGN_KEY)
      .forEach(fk => {
        sql += `ALTER TABLE [${editedTable.schema}].[${editedTable.name}]\n`;
        sql += `    ADD CONSTRAINT [${fk.name}] FOREIGN KEY (${fk.columns.map(c => `[${c}]`).join(', ')})\n`;
        sql += `    REFERENCES [${fk.referencedTable}] (${fk.referencedColumns?.map(c => `[${c}]`).join(', ')})\n`;
        if (fk.onDelete) sql += `    ON DELETE ${fk.onDelete}\n`;
        if (fk.onUpdate) sql += `    ON UPDATE ${fk.onUpdate}`;
        sql += ';\n\n';
      });
    
    // Indexes
    editedTable.indexes.forEach(idx => {
      sql += `CREATE ${idx.type} INDEX [${idx.name}]\n`;
      sql += `    ON [${editedTable.schema}].[${editedTable.name}] (${idx.columns.map(c => `[${c.name}]${c.descending ? ' DESC' : ''}`).join(', ')})\n`;
      if (idx.includedColumns?.length) {
        sql += `    INCLUDE (${idx.includedColumns.map(c => `[${c}]`).join(', ')})\n`;
      }
      if (idx.filter) {
        sql += `    WHERE ${idx.filter}\n`;
      }
      sql += ';\n\n';
    });
    
    // Triggers
    editedTable.triggers.forEach(trig => {
      sql += `CREATE TRIGGER [${trig.name}]\n`;
      sql += `    ON [${editedTable.schema}].[${editedTable.name}]\n`;
      sql += `    ${trig.type}\n`;
      sql += `AS\n${trig.body}\n;\n\n`;
    });
    
    return sql;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedTable);
    }
    onClose();
  };

  const renderColumnsTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={addColumn}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </button>
        <button
          onClick={() => setShowDataTypeHelp(!showDataTypeHelp)}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center gap-1"
        >
          <AlertTriangle className="w-4 h-4" />
          Data Type Help
        </button>
      </div>

      {showDataTypeHelp && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <h4 className="font-semibold mb-2">Common Data Types:</h4>
          <ul className="space-y-1 text-xs">
            <li><strong>INT:</strong> Whole numbers (-2^31 to 2^31-1)</li>
            <li><strong>VARCHAR(n):</strong> Variable-length text up to n characters</li>
            <li><strong>DATETIME:</strong> Date and time values</li>
            <li><strong>DECIMAL(p,s):</strong> Fixed precision numbers</li>
            <li><strong>BIT:</strong> Boolean values (0 or 1)</li>
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-sm">Name</th>
              <th className="border px-2 py-1 text-left text-sm">Data Type</th>
              <th className="border px-2 py-1 text-left text-sm">Length</th>
              <th className="border px-2 py-1 text-left text-sm">Nullable</th>
              <th className="border px-2 py-1 text-left text-sm">Default</th>
              <th className="border px-2 py-1 text-left text-sm">Identity</th>
              <th className="border px-2 py-1 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editedTable.columns.map(column => (
              <tr
                key={column.id}
                className={`hover:bg-gray-50 cursor-pointer ${selectedColumn === column.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedColumn(column.id)}
              >
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={column.dataType}
                    onChange={(e) => updateColumn(column.id, { dataType: e.target.value as DataType })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <optgroup label="Numeric">
                      <option value={DataType.BIT}>bit</option>
                      <option value={DataType.TINYINT}>tinyint</option>
                      <option value={DataType.SMALLINT}>smallint</option>
                      <option value={DataType.INT}>int</option>
                      <option value={DataType.BIGINT}>bigint</option>
                      <option value={DataType.DECIMAL}>decimal</option>
                      <option value={DataType.MONEY}>money</option>
                      <option value={DataType.FLOAT}>float</option>
                    </optgroup>
                    <optgroup label="Character">
                      <option value={DataType.CHAR}>char</option>
                      <option value={DataType.VARCHAR}>varchar</option>
                      <option value={DataType.TEXT}>text</option>
                      <option value={DataType.NVARCHAR}>nvarchar</option>
                    </optgroup>
                    <optgroup label="Date/Time">
                      <option value={DataType.DATE}>date</option>
                      <option value={DataType.TIME}>time</option>
                      <option value={DataType.DATETIME}>datetime</option>
                      <option value={DataType.DATETIME2}>datetime2</option>
                    </optgroup>
                    <optgroup label="Binary">
                      <option value={DataType.BINARY}>binary</option>
                      <option value={DataType.VARBINARY}>varbinary</option>
                      <option value={DataType.IMAGE}>image</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value={DataType.UNIQUEIDENTIFIER}>uniqueidentifier</option>
                      <option value={DataType.XML}>xml</option>
                      <option value={DataType.JSON}>json</option>
                    </optgroup>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  {(column.dataType === DataType.VARCHAR || column.dataType === DataType.CHAR || 
                    column.dataType === DataType.NVARCHAR || column.dataType === DataType.NCHAR ||
                    column.dataType === DataType.BINARY || column.dataType === DataType.VARBINARY) && (
                    <input
                      type="number"
                      value={column.length || ''}
                      onChange={(e) => updateColumn(column.id, { length: parseInt(e.target.value) || undefined })}
                      className="w-full px-1 py-0.5 border-0 bg-transparent"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {(column.dataType === DataType.DECIMAL || column.dataType === DataType.NUMERIC) && (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={column.precision || ''}
                        onChange={(e) => updateColumn(column.id, { precision: parseInt(e.target.value) || undefined })}
                        className="w-12 px-1 py-0.5 border-0 bg-transparent"
                        placeholder="p"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>,</span>
                      <input
                        type="number"
                        value={column.scale || ''}
                        onChange={(e) => updateColumn(column.id, { scale: parseInt(e.target.value) || undefined })}
                        className="w-12 px-1 py-0.5 border-0 bg-transparent"
                        placeholder="s"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={column.nullable}
                    onChange={(e) => updateColumn(column.id, { nullable: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={column.defaultValue || ''}
                    onChange={(e) => updateColumn(column.id, { defaultValue: e.target.value || undefined })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent text-sm"
                    placeholder="NULL"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={!!column.identity}
                    onChange={(e) => updateColumn(column.id, { 
                      identity: e.target.checked ? { seed: 1, increment: 1 } : undefined 
                    })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteColumn(column.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedColumn && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-2">Column Properties</h4>
          {(() => {
            const column = editedTable.columns.find(c => c.id === selectedColumn);
            if (!column) return null;
            
            return (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block mb-1">Description</label>
                  <input
                    type="text"
                    value={column.description || ''}
                    onChange={(e) => updateColumn(column.id, { description: e.target.value || undefined })}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Column description..."
                  />
                </div>
                {column.identity && (
                  <div className="flex gap-2">
                    <div>
                      <label className="block mb-1">Identity Seed</label>
                      <input
                        type="number"
                        value={column.identity.seed}
                        onChange={(e) => updateColumn(column.id, { 
                          identity: { ...column.identity!, seed: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Identity Increment</label>
                      <input
                        type="number"
                        value={column.identity.increment}
                        onChange={(e) => updateColumn(column.id, { 
                          identity: { ...column.identity!, increment: parseInt(e.target.value) || 1 }
                        })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!column.computed}
                      onChange={(e) => updateColumn(column.id, {
                        computed: e.target.checked ? { expression: '', persisted: false } : undefined
                      })}
                    />
                    Computed Column
                  </label>
                  {column.computed && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={column.computed.expression}
                        onChange={(e) => updateColumn(column.id, {
                          computed: { ...column.computed!, expression: e.target.value }
                        })}
                        className="w-full px-2 py-1 border rounded font-mono text-xs"
                        rows={3}
                        placeholder="([FirstName] + ' ' + [LastName])"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={column.computed.persisted}
                          onChange={(e) => updateColumn(column.id, {
                            computed: { ...column.computed!, persisted: e.target.checked }
                          })}
                        />
                        Persisted
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderConstraintsTab = () => (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => addConstraint(ConstraintType.PRIMARY_KEY)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Key className="w-4 h-4" />
          Primary Key
        </button>
        <button
          onClick={() => addConstraint(ConstraintType.FOREIGN_KEY)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Link className="w-4 h-4" />
          Foreign Key
        </button>
        <button
          onClick={() => addConstraint(ConstraintType.UNIQUE)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Unique
        </button>
        <button
          onClick={() => addConstraint(ConstraintType.CHECK)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Check
        </button>
      </div>

      <div className="space-y-3">
        {editedTable.constraints.map(constraint => (
          <div key={constraint.id} className="p-3 border rounded">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {constraint.type === ConstraintType.PRIMARY_KEY && <Key className="w-4 h-4 text-yellow-600" />}
                {constraint.type === ConstraintType.FOREIGN_KEY && <Link className="w-4 h-4 text-blue-600" />}
                <span className="font-semibold text-sm">{constraint.type}</span>
              </div>
              <button
                onClick={() => setEditedTable({
                  ...editedTable,
                  constraints: editedTable.constraints.filter(c => c.id !== constraint.id)
                })}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  value={constraint.name}
                  onChange={(e) => setEditedTable({
                    ...editedTable,
                    constraints: editedTable.constraints.map(c =>
                      c.id === constraint.id ? { ...c, name: e.target.value } : c
                    )
                  })}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              
              <div>
                <label className="block mb-1">Columns</label>
                <select
                  multiple
                  value={constraint.columns}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setEditedTable({
                      ...editedTable,
                      constraints: editedTable.constraints.map(c =>
                        c.id === constraint.id ? { ...c, columns: selected } : c
                      )
                    });
                  }}
                  className="w-full px-2 py-1 border rounded"
                  size={3}
                >
                  {editedTable.columns.map(col => (
                    <option key={col.id} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>
              
              {constraint.type === ConstraintType.FOREIGN_KEY && (
                <>
                  <div>
                    <label className="block mb-1">Referenced Table</label>
                    <input
                      type="text"
                      value={constraint.referencedTable || ''}
                      onChange={(e) => setEditedTable({
                        ...editedTable,
                        constraints: editedTable.constraints.map(c =>
                          c.id === constraint.id ? { ...c, referencedTable: e.target.value } : c
                        )
                      })}
                      className="w-full px-2 py-1 border rounded"
                      placeholder="dbo.OtherTable"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1">On Delete</label>
                      <select
                        value={constraint.onDelete || 'NO ACTION'}
                        onChange={(e) => setEditedTable({
                          ...editedTable,
                          constraints: editedTable.constraints.map(c =>
                            c.id === constraint.id ? { ...c, onDelete: e.target.value as any } : c
                          )
                        })}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option>NO ACTION</option>
                        <option>CASCADE</option>
                        <option>SET NULL</option>
                        <option>SET DEFAULT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">On Update</label>
                      <select
                        value={constraint.onUpdate || 'NO ACTION'}
                        onChange={(e) => setEditedTable({
                          ...editedTable,
                          constraints: editedTable.constraints.map(c =>
                            c.id === constraint.id ? { ...c, onUpdate: e.target.value as any } : c
                          )
                        })}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option>NO ACTION</option>
                        <option>CASCADE</option>
                        <option>SET NULL</option>
                        <option>SET DEFAULT</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              {constraint.type === ConstraintType.CHECK && (
                <div>
                  <label className="block mb-1">Expression</label>
                  <textarea
                    value={constraint.definition || ''}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      constraints: editedTable.constraints.map(c =>
                        c.id === constraint.id ? { ...c, definition: e.target.value } : c
                      )
                    })}
                    className="w-full px-2 py-1 border rounded font-mono text-xs"
                    rows={2}
                    placeholder="([Age] >= 18)"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIndexesTab = () => (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={addIndex}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Database className="w-4 h-4" />
          Add Index
        </button>
      </div>

      <div className="space-y-3">
        {editedTable.indexes.map(index => (
          <div key={index.id} className="p-3 border rounded">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">{index.name}</span>
              <button
                onClick={() => setEditedTable({
                  ...editedTable,
                  indexes: editedTable.indexes.filter(i => i.id !== index.id)
                })}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    value={index.name}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      indexes: editedTable.indexes.map(i =>
                        i.id === index.id ? { ...i, name: e.target.value } : i
                      )
                    })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1">Type</label>
                  <select
                    value={index.type}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      indexes: editedTable.indexes.map(i =>
                        i.id === index.id ? { ...i, type: e.target.value as IndexType } : i
                      )
                    })}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value={IndexType.CLUSTERED}>Clustered</option>
                    <option value={IndexType.NONCLUSTERED}>Nonclustered</option>
                    <option value={IndexType.UNIQUE_CLUSTERED}>Unique Clustered</option>
                    <option value={IndexType.UNIQUE_NONCLUSTERED}>Unique Nonclustered</option>
                    <option value={IndexType.COLUMNSTORE}>Columnstore</option>
                    <option value={IndexType.FULLTEXT}>Full-Text</option>
                    <option value={IndexType.SPATIAL}>Spatial</option>
                    <option value={IndexType.XML}>XML</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block mb-1">Index Columns</label>
                <div className="space-y-1">
                  {index.columns.map((col, colIdx) => (
                    <div key={colIdx} className="flex gap-2">
                      <select
                        value={col.name}
                        onChange={(e) => {
                          const newColumns = [...index.columns];
                          newColumns[colIdx] = { ...col, name: e.target.value };
                          setEditedTable({
                            ...editedTable,
                            indexes: editedTable.indexes.map(i =>
                              i.id === index.id ? { ...i, columns: newColumns } : i
                            )
                          });
                        }}
                        className="flex-1 px-2 py-1 border rounded"
                      >
                        <option value="">Select column...</option>
                        {editedTable.columns.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={col.descending}
                          onChange={(e) => {
                            const newColumns = [...index.columns];
                            newColumns[colIdx] = { ...col, descending: e.target.checked };
                            setEditedTable({
                              ...editedTable,
                              indexes: editedTable.indexes.map(i =>
                                i.id === index.id ? { ...i, columns: newColumns } : i
                              )
                            });
                          }}
                        />
                        DESC
                      </label>
                      <button
                        onClick={() => {
                          const newColumns = index.columns.filter((_, i) => i !== colIdx);
                          setEditedTable({
                            ...editedTable,
                            indexes: editedTable.indexes.map(i =>
                              i.id === index.id ? { ...i, columns: newColumns } : i
                            )
                          });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newColumns = [...index.columns, { name: '', descending: false }];
                      setEditedTable({
                        ...editedTable,
                        indexes: editedTable.indexes.map(i =>
                          i.id === index.id ? { ...i, columns: newColumns } : i
                        )
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    + Add column
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block mb-1">Filter</label>
                <input
                  type="text"
                  value={index.filter || ''}
                  onChange={(e) => setEditedTable({
                    ...editedTable,
                    indexes: editedTable.indexes.map(i =>
                      i.id === index.id ? { ...i, filter: e.target.value || undefined } : i
                    )
                  })}
                  className="w-full px-2 py-1 border rounded font-mono text-xs"
                  placeholder="([IsActive] = 1)"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTriggersTab = () => (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={addTrigger}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Zap className="w-4 h-4" />
          Add Trigger
        </button>
      </div>

      <div className="space-y-3">
        {editedTable.triggers.map(trigger => (
          <div key={trigger.id} className="p-3 border rounded">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-sm">{trigger.name}</span>
              </div>
              <button
                onClick={() => setEditedTable({
                  ...editedTable,
                  triggers: editedTable.triggers.filter(t => t.id !== trigger.id)
                })}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    value={trigger.name}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      triggers: editedTable.triggers.map(t =>
                        t.id === trigger.id ? { ...t, name: e.target.value } : t
                      )
                    })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1">Type</label>
                  <select
                    value={trigger.type}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      triggers: editedTable.triggers.map(t =>
                        t.id === trigger.id ? { ...t, type: e.target.value as TriggerType } : t
                      )
                    })}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value={TriggerType.AFTER_INSERT}>After Insert</option>
                    <option value={TriggerType.AFTER_UPDATE}>After Update</option>
                    <option value={TriggerType.AFTER_DELETE}>After Delete</option>
                    <option value={TriggerType.INSTEAD_OF_INSERT}>Instead Of Insert</option>
                    <option value={TriggerType.INSTEAD_OF_UPDATE}>Instead Of Update</option>
                    <option value={TriggerType.INSTEAD_OF_DELETE}>Instead Of Delete</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={trigger.enabled}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      triggers: editedTable.triggers.map(t =>
                        t.id === trigger.id ? { ...t, enabled: e.target.checked } : t
                      )
                    })}
                  />
                  Enabled
                </label>
              </div>
              
              <div>
                <label className="block mb-1">Trigger Body</label>
                <textarea
                  value={trigger.body}
                  onChange={(e) => setEditedTable({
                    ...editedTable,
                    triggers: editedTable.triggers.map(t =>
                      t.id === trigger.id ? { ...t, body: e.target.value } : t
                    )
                  })}
                  className="w-full px-2 py-1 border rounded font-mono text-xs"
                  rows={6}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => {
            const newPermission: TablePermission = {
              id: `perm-${Date.now()}`,
              principal: '',
              principalType: 'USER',
              permission: 'SELECT',
              grantOption: false
            };
            setEditedTable({
              ...editedTable,
              permissions: [...editedTable.permissions, newPermission]
            });
          }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Shield className="w-4 h-4" />
          Add Permission
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left text-sm">Principal</th>
              <th className="border px-2 py-1 text-left text-sm">Type</th>
              <th className="border px-2 py-1 text-left text-sm">Permission</th>
              <th className="border px-2 py-1 text-left text-sm">Grant Option</th>
              <th className="border px-2 py-1 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editedTable.permissions.map(perm => (
              <tr key={perm.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    value={perm.principal}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      permissions: editedTable.permissions.map(p =>
                        p.id === perm.id ? { ...p, principal: e.target.value } : p
                      )
                    })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent"
                    placeholder="username or role"
                  />
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={perm.principalType}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      permissions: editedTable.permissions.map(p =>
                        p.id === perm.id ? { ...p, principalType: e.target.value as any } : p
                      )
                    })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent"
                  >
                    <option value="USER">User</option>
                    <option value="ROLE">Role</option>
                    <option value="GROUP">Group</option>
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <select
                    value={perm.permission}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      permissions: editedTable.permissions.map(p =>
                        p.id === perm.id ? { ...p, permission: e.target.value } : p
                      )
                    })}
                    className="w-full px-1 py-0.5 border-0 bg-transparent"
                  >
                    <option value="SELECT">SELECT</option>
                    <option value="INSERT">INSERT</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="REFERENCES">REFERENCES</option>
                    <option value="ALTER">ALTER</option>
                    <option value="CONTROL">CONTROL</option>
                  </select>
                </td>
                <td className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={perm.grantOption}
                    onChange={(e) => setEditedTable({
                      ...editedTable,
                      permissions: editedTable.permissions.map(p =>
                        p.id === perm.id ? { ...p, grantOption: e.target.checked } : p
                      )
                    })}
                  />
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => setEditedTable({
                      ...editedTable,
                      permissions: editedTable.permissions.filter(p => p.id !== perm.id)
                    })}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSQLTab = () => (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold">Generated SQL Script</h3>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(generateSQL())}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={() => {
              const blob = new Blob([generateSQL()], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${editedTable.name}.sql`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
        <pre className="text-xs font-mono whitespace-pre">{generateSQL()}</pre>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95%] h-[90%] max-w-7xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Table Designer</h2>
            <input
              type="text"
              value={editedTable.name}
              onChange={(e) => setEditedTable({ ...editedTable, name: e.target.value })}
              className="px-2 py-1 border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="w-full">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('columns')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'columns'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Columns
              </button>
              <button
                onClick={() => setActiveTab('constraints')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'constraints'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Constraints
              </button>
              <button
                onClick={() => setActiveTab('indexes')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'indexes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Indexes
              </button>
              <button
                onClick={() => setActiveTab('triggers')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'triggers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Triggers
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'permissions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Permissions
              </button>
              <button
                onClick={() => setActiveTab('sql')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sql'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileCode className="w-4 h-4 inline mr-1" />
                SQL
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === 'columns' && renderColumnsTab()}
              {activeTab === 'constraints' && renderConstraintsTab()}
              {activeTab === 'indexes' && renderIndexesTab()}
              {activeTab === 'triggers' && renderTriggersTab()}
              {activeTab === 'permissions' && renderPermissionsTab()}
              {activeTab === 'sql' && renderSQLTab()}
            </div>
          </div>
        </div>

        <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>Schema: {editedTable.schema}</span>
            {editedTable.lastModified && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Modified: {editedTable.lastModified.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>{editedTable.columns.length} columns</span>
            <span>{editedTable.constraints.length} constraints</span>
            <span>{editedTable.indexes.length} indexes</span>
          </div>
        </div>
      </div>
    </div>
  );
};