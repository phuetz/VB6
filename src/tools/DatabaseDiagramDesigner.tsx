import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Table Entity
export interface DiagramTable {
  id: string;
  name: string;
  schema: string;
  x: number;
  y: number;
  width: number;
  height: number;
  columns: TableColumn[];
  indexes: TableIndex[];
  isSelected: boolean;
  isExpanded: boolean;
  color?: string;
}

// Column Definition
export interface TableColumn {
  id: string;
  name: string;
  dataType: string;
  length?: number;
  precision?: number;
  scale?: number;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isIdentity: boolean;
  identitySeed?: number;
  identityIncrement?: number;
  defaultValue?: string;
  description?: string;
}

// Index Definition
export interface TableIndex {
  id: string;
  name: string;
  columns: string[];
  isUnique: boolean;
  isClustered: boolean;
  isPrimaryKey: boolean;
}

// Relationship
export interface TableRelationship {
  id: string;
  name: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipType: RelationshipType;
  onDelete: ReferentialAction;
  onUpdate: ReferentialAction;
  isEnforced: boolean;
}

export enum RelationshipType {
  OneToOne = '1:1',
  OneToMany = '1:N',
  ManyToMany = 'N:N',
}

export enum ReferentialAction {
  NoAction = 'NO ACTION',
  Cascade = 'CASCADE',
  SetNull = 'SET NULL',
  SetDefault = 'SET DEFAULT',
}

// Data Types
export const DataTypes = {
  // Numeric
  bit: { category: 'Numeric', hasLength: false },
  tinyint: { category: 'Numeric', hasLength: false },
  smallint: { category: 'Numeric', hasLength: false },
  int: { category: 'Numeric', hasLength: false },
  bigint: { category: 'Numeric', hasLength: false },
  decimal: { category: 'Numeric', hasPrecisionScale: true },
  numeric: { category: 'Numeric', hasPrecisionScale: true },
  float: { category: 'Numeric', hasLength: true },
  real: { category: 'Numeric', hasLength: false },
  money: { category: 'Numeric', hasLength: false },
  smallmoney: { category: 'Numeric', hasLength: false },

  // String
  char: { category: 'String', hasLength: true },
  varchar: { category: 'String', hasLength: true },
  nchar: { category: 'String', hasLength: true },
  nvarchar: { category: 'String', hasLength: true },
  text: { category: 'String', hasLength: false },
  ntext: { category: 'String', hasLength: false },

  // Date/Time
  date: { category: 'DateTime', hasLength: false },
  time: { category: 'DateTime', hasLength: false },
  datetime: { category: 'DateTime', hasLength: false },
  datetime2: { category: 'DateTime', hasLength: false },
  smalldatetime: { category: 'DateTime', hasLength: false },
  datetimeoffset: { category: 'DateTime', hasLength: false },

  // Binary
  binary: { category: 'Binary', hasLength: true },
  varbinary: { category: 'Binary', hasLength: true },
  image: { category: 'Binary', hasLength: false },

  // Other
  uniqueidentifier: { category: 'Other', hasLength: false },
  xml: { category: 'Other', hasLength: false },
  sql_variant: { category: 'Other', hasLength: false },
};

// Diagram Settings
export interface DiagramSettings {
  showDataTypes: boolean;
  showIndexes: boolean;
  showRelationshipLabels: boolean;
  snapToGrid: boolean;
  gridSize: number;
  zoomLevel: number;
  notation: 'IDEF1X' | "Crow's Foot" | 'UML';
}

interface DatabaseDiagramDesignerProps {
  onTableCreate?: (table: DiagramTable) => void;
  onRelationshipCreate?: (relationship: TableRelationship) => void;
  onDiagramSave?: (tables: DiagramTable[], relationships: TableRelationship[]) => void;
}

export const DatabaseDiagramDesigner: React.FC<DatabaseDiagramDesignerProps> = ({
  onTableCreate,
  onRelationshipCreate,
  onDiagramSave,
}) => {
  const [tables, setTables] = useState<DiagramTable[]>([]);
  const [relationships, setRelationships] = useState<TableRelationship[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiagramTable | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<TableRelationship | null>(null);
  const [draggedTable, setDraggedTable] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [connectingRelationship, setConnectingRelationship] = useState<{
    fromTable: string;
    fromColumn: string;
  } | null>(null);
  const [settings, setSettings] = useState<DiagramSettings>({
    showDataTypes: true,
    showIndexes: false,
    showRelationshipLabels: true,
    snapToGrid: true,
    gridSize: 20,
    zoomLevel: 100,
    notation: "Crow's Foot",
  });
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<TableColumn | null>(null);
  const [tableForm, setTableForm] = useState({
    name: '',
    schema: 'dbo',
  });
  const [columnForm, setColumnForm] = useState<Partial<TableColumn>>({
    name: '',
    dataType: 'int',
    isNullable: true,
    isPrimaryKey: false,
  });
  const [relationshipForm, setRelationshipForm] = useState<Partial<TableRelationship>>({
    name: '',
    relationshipType: RelationshipType.OneToMany,
    onDelete: ReferentialAction.NoAction,
    onUpdate: ReferentialAction.NoAction,
    isEnforced: true,
  });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<SVGSVGElement>(null);
  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `item_${nextId.current++}`, []);

  // Sample tables for demo
  useEffect(() => {
    const sampleTables: DiagramTable[] = [
      {
        id: generateId(),
        name: 'Customers',
        schema: 'dbo',
        x: 100,
        y: 100,
        width: 200,
        height: 180,
        columns: [
          {
            id: generateId(),
            name: 'CustomerID',
            dataType: 'int',
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            isIdentity: true,
            identitySeed: 1,
            identityIncrement: 1,
          },
          {
            id: generateId(),
            name: 'CompanyName',
            dataType: 'nvarchar',
            length: 50,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            isIdentity: false,
          },
          {
            id: generateId(),
            name: 'ContactName',
            dataType: 'nvarchar',
            length: 50,
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            isIdentity: false,
          },
          {
            id: generateId(),
            name: 'Country',
            dataType: 'nvarchar',
            length: 20,
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            isIdentity: false,
          },
        ],
        indexes: [
          {
            id: generateId(),
            name: 'PK_Customers',
            columns: ['CustomerID'],
            isUnique: true,
            isClustered: true,
            isPrimaryKey: true,
          },
        ],
        isSelected: false,
        isExpanded: true,
      },
      {
        id: generateId(),
        name: 'Orders',
        schema: 'dbo',
        x: 400,
        y: 100,
        width: 200,
        height: 200,
        columns: [
          {
            id: generateId(),
            name: 'OrderID',
            dataType: 'int',
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            isIdentity: true,
          },
          {
            id: generateId(),
            name: 'CustomerID',
            dataType: 'int',
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: true,
            isIdentity: false,
          },
          {
            id: generateId(),
            name: 'OrderDate',
            dataType: 'datetime',
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            isIdentity: false,
          },
          {
            id: generateId(),
            name: 'ShipDate',
            dataType: 'datetime',
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            isIdentity: false,
          },
          {
            id: generateId(),
            name: 'Total',
            dataType: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            isPrimaryKey: false,
            isForeignKey: false,
            isIdentity: false,
          },
        ],
        indexes: [
          {
            id: generateId(),
            name: 'PK_Orders',
            columns: ['OrderID'],
            isUnique: true,
            isClustered: true,
            isPrimaryKey: true,
          },
          {
            id: generateId(),
            name: 'IX_Orders_CustomerID',
            columns: ['CustomerID'],
            isUnique: false,
            isClustered: false,
            isPrimaryKey: false,
          },
        ],
        isSelected: false,
        isExpanded: true,
      },
    ];

    const sampleRelationship: TableRelationship = {
      id: generateId(),
      name: 'FK_Orders_Customers',
      fromTable: sampleTables[1].id,
      fromColumn: 'CustomerID',
      toTable: sampleTables[0].id,
      toColumn: 'CustomerID',
      relationshipType: RelationshipType.OneToMany,
      onDelete: ReferentialAction.NoAction,
      onUpdate: ReferentialAction.NoAction,
      isEnforced: true,
    };

    setTables(sampleTables);
    setRelationships([sampleRelationship]);
  }, []);

  // Create new table
  const createTable = useCallback(() => {
    if (!tableForm.name) return;

    const newTable: DiagramTable = {
      id: generateId(),
      name: tableForm.name,
      schema: tableForm.schema,
      x: 100 + tables.length * 50,
      y: 100 + tables.length * 50,
      width: 200,
      height: 100,
      columns: [
        {
          id: generateId(),
          name: `${tableForm.name}ID`,
          dataType: 'int',
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
          isIdentity: true,
          identitySeed: 1,
          identityIncrement: 1,
        },
      ],
      indexes: [
        {
          id: generateId(),
          name: `PK_${tableForm.name}`,
          columns: [`${tableForm.name}ID`],
          isUnique: true,
          isClustered: true,
          isPrimaryKey: true,
        },
      ],
      isSelected: false,
      isExpanded: true,
    };

    setTables(prev => [...prev, newTable]);
    setShowTableDialog(false);
    setTableForm({ name: '', schema: 'dbo' });

    onTableCreate?.(newTable);
    eventEmitter.current.emit('tableCreated', newTable);
  }, [tableForm, tables, generateId, onTableCreate]);

  // Add column to table
  const addColumn = useCallback(() => {
    if (!selectedTable || !columnForm.name) return;

    const newColumn: TableColumn = {
      id: generateId(),
      name: columnForm.name,
      dataType: columnForm.dataType || 'int',
      length: columnForm.length,
      precision: columnForm.precision,
      scale: columnForm.scale,
      isNullable: columnForm.isNullable ?? true,
      isPrimaryKey: columnForm.isPrimaryKey ?? false,
      isForeignKey: false,
      isIdentity: columnForm.isIdentity ?? false,
      identitySeed: columnForm.identitySeed,
      identityIncrement: columnForm.identityIncrement,
      defaultValue: columnForm.defaultValue,
      description: columnForm.description,
    };

    setTables(prev =>
      prev.map(table => {
        if (table.id === selectedTable.id) {
          const updatedTable = {
            ...table,
            columns: [...table.columns, newColumn],
            height: table.height + 25,
          };

          // Add primary key index if needed
          if (newColumn.isPrimaryKey) {
            const pkIndex = table.indexes.find(idx => idx.isPrimaryKey);
            if (pkIndex) {
              updatedTable.indexes = table.indexes.map(idx =>
                idx.isPrimaryKey ? { ...idx, columns: [...idx.columns, newColumn.name] } : idx
              );
            }
          }

          return updatedTable;
        }
        return table;
      })
    );

    setShowColumnDialog(false);
    setColumnForm({
      name: '',
      dataType: 'int',
      isNullable: true,
      isPrimaryKey: false,
    });

    eventEmitter.current.emit('columnAdded', selectedTable, newColumn);
  }, [selectedTable, columnForm, generateId]);

  // Create relationship
  const createRelationship = useCallback(() => {
    if (
      !relationshipForm.fromTable ||
      !relationshipForm.fromColumn ||
      !relationshipForm.toTable ||
      !relationshipForm.toColumn
    )
      return;

    const newRelationship: TableRelationship = {
      id: generateId(),
      name: relationshipForm.name || `FK_${relationshipForm.fromTable}_${relationshipForm.toTable}`,
      fromTable: relationshipForm.fromTable,
      fromColumn: relationshipForm.fromColumn,
      toTable: relationshipForm.toTable,
      toColumn: relationshipForm.toColumn,
      relationshipType: relationshipForm.relationshipType || RelationshipType.OneToMany,
      onDelete: relationshipForm.onDelete || ReferentialAction.NoAction,
      onUpdate: relationshipForm.onUpdate || ReferentialAction.NoAction,
      isEnforced: relationshipForm.isEnforced ?? true,
    };

    setRelationships(prev => [...prev, newRelationship]);
    setShowRelationshipDialog(false);
    setRelationshipForm({
      name: '',
      relationshipType: RelationshipType.OneToMany,
      onDelete: ReferentialAction.NoAction,
      onUpdate: ReferentialAction.NoAction,
      isEnforced: true,
    });

    onRelationshipCreate?.(newRelationship);
    eventEmitter.current.emit('relationshipCreated', newRelationship);
  }, [relationshipForm, generateId, onRelationshipCreate]);

  // Delete table
  const deleteTable = useCallback(
    (tableId: string) => {
      if (!window.confirm('Delete this table and all its relationships?')) return;

      setTables(prev => prev.filter(t => t.id !== tableId));
      setRelationships(prev => prev.filter(r => r.fromTable !== tableId && r.toTable !== tableId));

      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }

      eventEmitter.current.emit('tableDeleted', tableId);
    },
    [selectedTable]
  );

  // Delete relationship
  const deleteRelationship = useCallback(
    (relationshipId: string) => {
      if (!window.confirm('Delete this relationship?')) return;

      setRelationships(prev => prev.filter(r => r.id !== relationshipId));

      if (selectedRelationship?.id === relationshipId) {
        setSelectedRelationship(null);
      }

      eventEmitter.current.emit('relationshipDeleted', relationshipId);
    },
    [selectedRelationship]
  );

  // Handle table drag
  const handleTableMouseDown = useCallback((e: React.MouseEvent, table: DiagramTable) => {
    e.stopPropagation();
    setSelectedTable(table);
    setSelectedRelationship(null);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDraggedTable({
        id: table.id,
        offsetX: e.clientX - rect.left - table.x,
        offsetY: e.clientY - rect.top - table.y,
      });
    }
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedTable && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        let newX = e.clientX - rect.left - draggedTable.offsetX;
        let newY = e.clientY - rect.top - draggedTable.offsetY;

        // Snap to grid
        if (settings.snapToGrid) {
          newX = Math.round(newX / settings.gridSize) * settings.gridSize;
          newY = Math.round(newY / settings.gridSize) * settings.gridSize;
        }

        setTables(prev =>
          prev.map(table => (table.id === draggedTable.id ? { ...table, x: newX, y: newY } : table))
        );
      }

      if (isPanning && canvasRef.current) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        setViewBox(prev => ({
          ...prev,
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        }));

        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [draggedTable, isPanning, panStart, settings]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDraggedTable(null);
    setIsPanning(false);
  }, []);

  // Generate SQL
  const generateSQL = useCallback(() => {
    let sql = '-- Database Diagram Generated SQL\n\n';

    // Generate CREATE TABLE statements
    tables.forEach(table => {
      sql += `CREATE TABLE [${table.schema}].[${table.name}] (\n`;

      const columnDefs = table.columns.map(col => {
        let def = `    [${col.name}] ${col.dataType}`;

        if (col.length) def += `(${col.length})`;
        if (col.precision && col.scale) def += `(${col.precision}, ${col.scale})`;

        if (col.isIdentity) {
          def += ` IDENTITY(${col.identitySeed || 1}, ${col.identityIncrement || 1})`;
        }

        def += col.isNullable ? ' NULL' : ' NOT NULL';

        if (col.defaultValue) {
          def += ` DEFAULT ${col.defaultValue}`;
        }

        return def;
      });

      sql += columnDefs.join(',\n');

      // Add primary key constraint
      const pkIndex = table.indexes.find(idx => idx.isPrimaryKey);
      if (pkIndex) {
        sql += `,\n    CONSTRAINT [${pkIndex.name}] PRIMARY KEY ${pkIndex.isClustered ? 'CLUSTERED' : 'NONCLUSTERED'} (`;
        sql += pkIndex.columns.map(c => `[${c}]`).join(', ');
        sql += ')';
      }

      sql += '\n);\n\n';

      // Add non-PK indexes
      table.indexes
        .filter(idx => !idx.isPrimaryKey)
        .forEach(idx => {
          sql += `CREATE ${idx.isUnique ? 'UNIQUE ' : ''}`;
          sql += `${idx.isClustered ? 'CLUSTERED ' : 'NONCLUSTERED '}`;
          sql += `INDEX [${idx.name}] ON [${table.schema}].[${table.name}] (`;
          sql += idx.columns.map(c => `[${c}]`).join(', ');
          sql += ');\n';
        });

      sql += '\n';
    });

    // Generate foreign key constraints
    relationships.forEach(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTable);
      const toTable = tables.find(t => t.id === rel.toTable);

      if (fromTable && toTable) {
        sql += `ALTER TABLE [${fromTable.schema}].[${fromTable.name}]\n`;
        sql += `ADD CONSTRAINT [${rel.name}] FOREIGN KEY ([${rel.fromColumn}])\n`;
        sql += `REFERENCES [${toTable.schema}].[${toTable.name}] ([${rel.toColumn}])\n`;
        sql += `ON DELETE ${rel.onDelete}\n`;
        sql += `ON UPDATE ${rel.onUpdate};\n\n`;
      }
    });

    return sql;
  }, [tables, relationships]);

  // Calculate table height
  const calculateTableHeight = useCallback(
    (table: DiagramTable): number => {
      const headerHeight = 30;
      const columnHeight = 25;
      const padding = 10;

      if (!table.isExpanded) return headerHeight + padding;

      const columnsHeight = table.columns.length * columnHeight;
      const indexesHeight = settings.showIndexes ? table.indexes.length * 20 : 0;

      return headerHeight + columnsHeight + indexesHeight + padding;
    },
    [settings.showIndexes]
  );

  // Update table heights when needed
  useEffect(() => {
    setTables(prev =>
      prev.map(table => ({
        ...table,
        height: calculateTableHeight(table),
      }))
    );
  }, [settings.showIndexes, calculateTableHeight]);

  // Get relationship path
  const getRelationshipPath = useCallback(
    (rel: TableRelationship): string => {
      const fromTable = tables.find(t => t.id === rel.fromTable);
      const toTable = tables.find(t => t.id === rel.toTable);

      if (!fromTable || !toTable) return '';

      const fromColumnIndex = fromTable.columns.findIndex(c => c.name === rel.fromColumn);
      const toColumnIndex = toTable.columns.findIndex(c => c.name === rel.toColumn);

      const fromY = fromTable.y + 30 + (fromColumnIndex + 0.5) * 25;
      const toY = toTable.y + 30 + (toColumnIndex + 0.5) * 25;

      let fromX, toX;

      if (fromTable.x + fromTable.width < toTable.x) {
        fromX = fromTable.x + fromTable.width;
        toX = toTable.x;
      } else if (toTable.x + toTable.width < fromTable.x) {
        fromX = fromTable.x;
        toX = toTable.x + toTable.width;
      } else {
        fromX = fromTable.x + fromTable.width / 2;
        toX = toTable.x + toTable.width / 2;
      }

      const midX = (fromX + toX) / 2;

      return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
    },
    [tables]
  );

  // Format data type display
  const formatDataType = (col: TableColumn): string => {
    let type = col.dataType;
    if (col.length) type += `(${col.length})`;
    if (col.precision && col.scale) type += `(${col.precision},${col.scale})`;
    return type;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Database Diagram Designer</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Tables: {tables.length} | Relationships: {relationships.length}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => setShowTableDialog(true)}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Table
        </button>
        <button
          onClick={() => setShowRelationshipDialog(true)}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Relationship
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={() => {
            const sql = generateSQL();
            navigator.clipboard.writeText(sql);
          }}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          Generate SQL
        </button>
        <button
          onClick={() => onDiagramSave?.(tables, relationships)}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          Save Diagram
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={() => setShowSettingsDialog(true)}
          className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
        >
          Settings
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom:</span>
          <input
            type="range"
            min="25"
            max="200"
            value={settings.zoomLevel}
            onChange={e => setSettings(prev => ({ ...prev, zoomLevel: parseInt(e.target.value) }))}
            className="w-32"
          />
          <span className="text-sm text-gray-600 w-12">{settings.zoomLevel}%</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <svg
          ref={canvasRef}
          className="w-full h-full cursor-move"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setSelectedTable(null);
              setSelectedRelationship(null);
              setIsPanning(true);
              setPanStart({ x: e.clientX, y: e.clientY });
            }
          }}
          style={{ transform: `scale(${settings.zoomLevel / 100})` }}
        >
          {/* Grid */}
          {settings.snapToGrid && (
            <defs>
              <pattern
                id="grid"
                width={settings.gridSize}
                height={settings.gridSize}
                patternUnits="userSpaceOnUse"
              >
                <circle cx={settings.gridSize / 2} cy={settings.gridSize / 2} r="1" fill="#ddd" />
              </pattern>
            </defs>
          )}
          {settings.snapToGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

          {/* Relationships */}
          {relationships.map(rel => (
            <g key={rel.id}>
              <path
                d={getRelationshipPath(rel)}
                fill="none"
                stroke={selectedRelationship?.id === rel.id ? '#3B82F6' : '#6B7280'}
                strokeWidth={selectedRelationship?.id === rel.id ? 3 : 2}
                className="cursor-pointer hover:stroke-blue-500"
                onClick={() => {
                  setSelectedRelationship(rel);
                  setSelectedTable(null);
                }}
              />
              {settings.showRelationshipLabels && (
                <text
                  x={(tables.find(t => t.id === rel.fromTable)?.x ?? 0) + 100}
                  y={(tables.find(t => t.id === rel.fromTable)?.y ?? 0) - 10}
                  fontSize="12"
                  fill="#6B7280"
                >
                  {rel.name}
                </text>
              )}

              {/* Crow's foot notation */}
              {settings.notation === "Crow's Foot" && (
                <>
                  {/* From side */}
                  <g
                    transform={`translate(${tables.find(t => t.id === rel.fromTable)?.x ?? 0}, ${tables.find(t => t.id === rel.fromTable)?.y ?? 0})`}
                  >
                    {rel.relationshipType === RelationshipType.OneToMany && (
                      <circle
                        cx={tables.find(t => t.id === rel.fromTable)?.width ?? 0}
                        cy="30"
                        r="4"
                        fill="white"
                        stroke="#6B7280"
                        strokeWidth="2"
                      />
                    )}
                  </g>

                  {/* To side */}
                  <g
                    transform={`translate(${tables.find(t => t.id === rel.toTable)?.x ?? 0}, ${tables.find(t => t.id === rel.toTable)?.y ?? 0})`}
                  >
                    {rel.relationshipType !== RelationshipType.OneToOne && (
                      <>
                        <line x1="-15" y1="25" x2="0" y2="30" stroke="#6B7280" strokeWidth="2" />
                        <line x1="-15" y1="35" x2="0" y2="30" stroke="#6B7280" strokeWidth="2" />
                        <line x1="-15" y1="30" x2="0" y2="30" stroke="#6B7280" strokeWidth="2" />
                      </>
                    )}
                  </g>
                </>
              )}
            </g>
          ))}

          {/* Tables */}
          {tables.map(table => (
            <g key={table.id} transform={`translate(${table.x}, ${table.y})`}>
              <rect
                width={table.width}
                height={table.height}
                fill="white"
                stroke={selectedTable?.id === table.id ? '#3B82F6' : '#6B7280'}
                strokeWidth={selectedTable?.id === table.id ? 3 : 1}
                rx="4"
                className="cursor-move"
                onMouseDown={e => handleTableMouseDown(e, table)}
              />

              {/* Table Header */}
              <rect
                width={table.width}
                height="30"
                fill={table.color || '#3B82F6'}
                rx="4"
                className="cursor-move"
                onMouseDown={e => handleTableMouseDown(e, table)}
              />

              <text
                x="10"
                y="20"
                fontSize="14"
                fontWeight="bold"
                fill="white"
                className="pointer-events-none"
              >
                {table.name}
              </text>

              <text
                x={table.width - 20}
                y="20"
                fontSize="12"
                fill="white"
                className="cursor-pointer"
                onClick={() => {
                  setTables(prev =>
                    prev.map(t => (t.id === table.id ? { ...t, isExpanded: !t.isExpanded } : t))
                  );
                }}
              >
                {table.isExpanded ? '−' : '+'}
              </text>

              {/* Columns */}
              {table.isExpanded && (
                <>
                  {table.columns.map((col, index) => (
                    <g key={col.id} transform={`translate(0, ${30 + index * 25})`}>
                      <rect
                        width={table.width}
                        height="25"
                        fill={col.isPrimaryKey ? '#FEF3C7' : 'white'}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        className="cursor-pointer hover:fill-gray-50"
                        onClick={() => {
                          setSelectedTable(table);
                          setSelectedColumn(col);
                        }}
                      />

                      {col.isPrimaryKey && (
                        <text x="5" y="17" fontSize="12" fill="#F59E0B">
                          🔑
                        </text>
                      )}
                      {col.isForeignKey && (
                        <text x={col.isPrimaryKey ? '20' : '5'} y="17" fontSize="12" fill="#6B7280">
                          🔗
                        </text>
                      )}

                      <text
                        x={col.isPrimaryKey || col.isForeignKey ? '35' : '10'}
                        y="17"
                        fontSize="12"
                        fill="#374151"
                      >
                        {col.name}
                      </text>

                      {settings.showDataTypes && (
                        <text
                          x={table.width - 60}
                          y="17"
                          fontSize="11"
                          fill="#6B7280"
                          textAnchor="end"
                        >
                          {formatDataType(col)}
                        </text>
                      )}

                      {!col.isNullable && (
                        <text
                          x={table.width - 10}
                          y="17"
                          fontSize="10"
                          fill="#DC2626"
                          textAnchor="end"
                        >
                          NN
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Indexes */}
                  {settings.showIndexes &&
                    table.indexes.filter(idx => !idx.isPrimaryKey).length > 0 && (
                      <>
                        <line
                          x1="0"
                          y1={30 + table.columns.length * 25}
                          x2={table.width}
                          y2={30 + table.columns.length * 25}
                          stroke="#E5E7EB"
                        />
                        {table.indexes
                          .filter(idx => !idx.isPrimaryKey)
                          .map((idx, index) => (
                            <text
                              key={idx.id}
                              x="10"
                              y={30 + table.columns.length * 25 + 15 + index * 20}
                              fontSize="11"
                              fill="#6B7280"
                            >
                              📑 {idx.name}
                            </text>
                          ))}
                      </>
                    )}
                </>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Selected Item Properties */}
      {(selectedTable || selectedRelationship) && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {selectedTable && (
            <div>
              <h3 className="font-medium mb-2">Table: {selectedTable.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowColumnDialog(true)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Column
                </button>
                <button
                  onClick={() => deleteTable(selectedTable.id)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete Table
                </button>
              </div>
            </div>
          )}

          {selectedRelationship && (
            <div>
              <h3 className="font-medium mb-2">Relationship: {selectedRelationship.name}</h3>
              <div className="text-sm text-gray-600">
                Type: {selectedRelationship.relationshipType} | On Delete:{' '}
                {selectedRelationship.onDelete} | On Update: {selectedRelationship.onUpdate}
              </div>
              <button
                onClick={() => deleteRelationship(selectedRelationship.id)}
                className="mt-2 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Relationship
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Table Dialog */}
      {showTableDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-medium mb-4">Add Table</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                <input
                  type="text"
                  value={tableForm.name}
                  onChange={e => setTableForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="TableName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
                <input
                  type="text"
                  value={tableForm.schema}
                  onChange={e => setTableForm(prev => ({ ...prev, schema: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="dbo"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowTableDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createTable}
                disabled={!tableForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Column Dialog */}
      {showColumnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h2 className="text-lg font-medium mb-4">Add Column to {selectedTable?.name}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Column Name
                  </label>
                  <input
                    type="text"
                    value={columnForm.name}
                    onChange={e => setColumnForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                  <select
                    value={columnForm.dataType}
                    onChange={e => setColumnForm(prev => ({ ...prev, dataType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.keys(DataTypes).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {DataTypes[columnForm.dataType as keyof typeof DataTypes]?.hasLength && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                  <input
                    type="number"
                    value={columnForm.length || ''}
                    onChange={e =>
                      setColumnForm(prev => ({
                        ...prev,
                        length: parseInt(e.target.value) || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              )}

              {DataTypes[columnForm.dataType as keyof typeof DataTypes]?.hasPrecisionScale && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precision
                    </label>
                    <input
                      type="number"
                      value={columnForm.precision || ''}
                      onChange={e =>
                        setColumnForm(prev => ({
                          ...prev,
                          precision: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scale</label>
                    <input
                      type="number"
                      value={columnForm.scale || ''}
                      onChange={e =>
                        setColumnForm(prev => ({
                          ...prev,
                          scale: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!columnForm.isNullable}
                    onChange={e =>
                      setColumnForm(prev => ({ ...prev, isNullable: !e.target.checked }))
                    }
                  />
                  <span className="text-sm">Not Null</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={columnForm.isPrimaryKey}
                    onChange={e =>
                      setColumnForm(prev => ({ ...prev, isPrimaryKey: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Primary Key</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={columnForm.isIdentity}
                    onChange={e =>
                      setColumnForm(prev => ({ ...prev, isIdentity: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Identity</span>
                </label>
              </div>

              {columnForm.isIdentity && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identity Seed
                    </label>
                    <input
                      type="number"
                      value={columnForm.identitySeed || 1}
                      onChange={e =>
                        setColumnForm(prev => ({
                          ...prev,
                          identitySeed: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identity Increment
                    </label>
                    <input
                      type="number"
                      value={columnForm.identityIncrement || 1}
                      onChange={e =>
                        setColumnForm(prev => ({
                          ...prev,
                          identityIncrement: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  value={columnForm.defaultValue || ''}
                  onChange={e => setColumnForm(prev => ({ ...prev, defaultValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="e.g., 0, 'N/A', GETDATE()"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowColumnDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addColumn}
                disabled={!columnForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Relationship Dialog */}
      {showRelationshipDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h2 className="text-lg font-medium mb-4">Add Relationship</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Table</label>
                  <select
                    value={relationshipForm.fromTable || ''}
                    onChange={e =>
                      setRelationshipForm(prev => ({ ...prev, fromTable: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select table...</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Column
                  </label>
                  <select
                    value={relationshipForm.fromColumn || ''}
                    onChange={e =>
                      setRelationshipForm(prev => ({ ...prev, fromColumn: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={!relationshipForm.fromTable}
                  >
                    <option value="">Select column...</option>
                    {relationshipForm.fromTable &&
                      tables
                        .find(t => t.id === relationshipForm.fromTable)
                        ?.columns.map(col => (
                          <option key={col.id} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Table</label>
                  <select
                    value={relationshipForm.toTable || ''}
                    onChange={e =>
                      setRelationshipForm(prev => ({ ...prev, toTable: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select table...</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Column</label>
                  <select
                    value={relationshipForm.toColumn || ''}
                    onChange={e =>
                      setRelationshipForm(prev => ({ ...prev, toColumn: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={!relationshipForm.toTable}
                  >
                    <option value="">Select column...</option>
                    {relationshipForm.toTable &&
                      tables
                        .find(t => t.id === relationshipForm.toTable)
                        ?.columns.map(col => (
                          <option key={col.id} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Name
                </label>
                <input
                  type="text"
                  value={relationshipForm.name || ''}
                  onChange={e => setRelationshipForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="FK_FromTable_ToTable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Type
                </label>
                <select
                  value={relationshipForm.relationshipType}
                  onChange={e =>
                    setRelationshipForm(prev => ({
                      ...prev,
                      relationshipType: e.target.value as RelationshipType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(RelationshipType).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">On Delete</label>
                  <select
                    value={relationshipForm.onDelete}
                    onChange={e =>
                      setRelationshipForm(prev => ({
                        ...prev,
                        onDelete: e.target.value as ReferentialAction,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(ReferentialAction).map(action => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">On Update</label>
                  <select
                    value={relationshipForm.onUpdate}
                    onChange={e =>
                      setRelationshipForm(prev => ({
                        ...prev,
                        onUpdate: e.target.value as ReferentialAction,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    {Object.values(ReferentialAction).map(action => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={relationshipForm.isEnforced}
                  onChange={e =>
                    setRelationshipForm(prev => ({ ...prev, isEnforced: e.target.checked }))
                  }
                />
                <span className="text-sm">Enforce relationship</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowRelationshipDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createRelationship}
                disabled={
                  !relationshipForm.fromTable ||
                  !relationshipForm.fromColumn ||
                  !relationshipForm.toTable ||
                  !relationshipForm.toColumn
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-medium mb-4">Diagram Settings</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showDataTypes}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, showDataTypes: e.target.checked }))
                  }
                />
                <span className="text-sm">Show data types</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showIndexes}
                  onChange={e => setSettings(prev => ({ ...prev, showIndexes: e.target.checked }))}
                />
                <span className="text-sm">Show indexes</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showRelationshipLabels}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, showRelationshipLabels: e.target.checked }))
                  }
                />
                <span className="text-sm">Show relationship labels</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.snapToGrid}
                  onChange={e => setSettings(prev => ({ ...prev, snapToGrid: e.target.checked }))}
                />
                <span className="text-sm">Snap to grid</span>
              </label>

              {settings.snapToGrid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grid Size</label>
                  <input
                    type="number"
                    value={settings.gridSize}
                    onChange={e =>
                      setSettings(prev => ({ ...prev, gridSize: parseInt(e.target.value) || 20 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    min="10"
                    max="50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notation</label>
                <select
                  value={settings.notation}
                  onChange={e =>
                    setSettings(prev => ({ ...prev, notation: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="IDEF1X">IDEF1X</option>
                  <option value="Crow's Foot">Crow's Foot</option>
                  <option value="UML">UML</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettingsDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseDiagramDesigner;
