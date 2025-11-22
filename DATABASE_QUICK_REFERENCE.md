# VB6 Database Connectivity - Quick Reference Guide

## Quick Start

### Basic Recordset Operations

```typescript
import { CreateDatabase } from './runtime/VB6DAOSystem';

// Create database
const db = CreateDatabase('MyDatabase', 'English');

// Open recordset
const rs = db.OpenRecordset('Customers');

// Navigate
rs.MoveFirst();           // First record
rs.MoveLast();            // Last record
rs.MoveNext();            // Next record
rs.MovePrevious();        // Previous record
rs.Move(5);               // Move 5 records

// Check position
if (rs.BOF) console.log('At beginning');
if (rs.EOF) console.log('At end');

// Access fields
const name = rs.Fields('CustomerName').Value;
rs.Fields('City').Value = 'New York';
```

## Key Methods Reference

### Navigation
| Method | Purpose |
|--------|---------|
| `MoveFirst()` | Go to first record |
| `MoveLast()` | Go to last record |
| `MoveNext()` | Go to next record |
| `MovePrevious()` | Go to previous record |
| `Move(n)` | Move n records |

### Modification
| Method | Purpose |
|--------|---------|
| `AddNew()` | Create new record |
| `Edit()` | Edit current record |
| `Update()` | Save changes |
| `Delete()` | Delete current record |
| `CancelUpdate()` | Discard changes |

### Searching
| Method | Purpose |
|--------|---------|
| `FindFirst(criteria)` | Find first match |
| `FindLast(criteria)` | Find last match |
| `FindNext(criteria)` | Find next match |
| `FindPrevious(criteria)` | Find previous match |

### Data Binding
| Method | Purpose |
|--------|---------|
| `BindControl(name, field)` | Bind control to field |
| `UnbindControl(name)` | Unbind control |
| `SetBoundValue(name, value)` | Update bound control |
| `GetBoundValue(name)` | Get bound value |
| `RefreshBoundControls()` | Refresh all controls |

### Persistence
| Method | Purpose |
|--------|---------|
| `SaveToPersistence()` | Save to IndexedDB |
| `LoadFromPersistence()` | Load from IndexedDB |
| `DeleteFromPersistence()` | Delete from IndexedDB |
| `IsDirty()` | Has unsaved changes? |

### Backend
| Method | Purpose |
|--------|---------|
| `ConnectToBackend(conn)` | Connect to backend |
| `LoadFromBackend(sql)` | Load from database |
| `SaveToBackend(sql)` | Save to database |
| `BeginTransaction()` | Start transaction |
| `CommitTransaction()` | Commit transaction |
| `RollbackTransaction()` | Rollback transaction |

## Property Reference

### Status Properties
```typescript
rs.BOF                    // At beginning?
rs.EOF                    // At end?
rs.RecordCount            // Total records
rs.AbsolutePosition       // Current position
rs.PercentPosition        // Position percentage
rs.NoMatch                // Find failed?
rs.IsDirty()              // Has changes?
```

### Data Properties
```typescript
rs.Filter = "City='NY'"   // Apply filter
rs.Sort = "Name ASC"      // Apply sort
rs.Index = "PrimaryKey"   // Set index
```

### Field Properties
```typescript
rs.Fields(index)          // Get field by index
rs.Fields(name)           // Get field by name
rs.Fields(name).Value     // Get value
rs.Fields(name).Type      // Get type
rs.Fields(name).Size      // Get size
```

## Common Patterns

### Pattern 1: Loop Through All Records
```typescript
rs.MoveFirst();
while (!rs.EOF) {
  console.log(rs.Fields('Name').Value);
  rs.MoveNext();
}
```

### Pattern 2: Find and Update
```typescript
rs.FindFirst("City = 'Boston'");
if (!rs.NoMatch) {
  rs.Edit();
  rs.Fields('Phone').Value = '555-0001';
  rs.Update();
}
```

### Pattern 3: Add Multiple Records
```typescript
const customers = ['John', 'Jane', 'Bob'];
for (const name of customers) {
  rs.AddNew();
  rs.Fields('Name').Value = name;
  rs.Update();
}
```

### Pattern 4: Bind Form Controls
```typescript
dataBindingService.bindControl(rs, {
  controlName: 'txtName',
  fieldName: 'Name'
});

rs.MoveFirst();
rs.RefreshBoundControls();
```

### Pattern 5: Save to IndexedDB
```typescript
// Make changes
rs.MoveFirst();
rs.Edit();
rs.Fields('Name').Value = 'Updated';
rs.Update();

// Persist to browser
await rs.SaveToPersistence();
```

### Pattern 6: Load from Backend
```typescript
const backendConn = CreateBackendConnection();
await backendConn.connect('mysql://localhost/mydb');

rs.ConnectToBackend(backendConn);
await rs.LoadFromBackend('SELECT * FROM Customers');

rs.MoveFirst();
console.log(`Loaded ${rs.RecordCount} records`);
```

### Pattern 7: Transaction with Rollback
```typescript
try {
  await rs.BeginTransaction();

  rs.AddNew();
  rs.Fields('Name').Value = 'John';
  rs.Update();

  await rs.CommitTransaction();
} catch (error) {
  await rs.RollbackTransaction();
}
```

## Field Types

```typescript
DAO_CONSTANTS.dbText        // String (10)
DAO_CONSTANTS.dbInteger     // 32-bit integer (3)
DAO_CONSTANTS.dbLong        // Long integer (4)
DAO_CONSTANTS.dbSingle      // Float (6)
DAO_CONSTANTS.dbDouble      // Double (7)
DAO_CONSTANTS.dbCurrency    // Currency (5)
DAO_CONSTANTS.dbDate        // Date/Time (8)
DAO_CONSTANTS.dbBoolean     // Boolean (1)
DAO_CONSTANTS.dbMemo        // Memo/Text (12)
DAO_CONSTANTS.dbBinary      // Binary (9)
```

## Error Handling

```typescript
try {
  await rs.LoadFromBackend(sql);
} catch (error) {
  if (error.message.includes('table')) {
    console.log('Table not found');
  } else if (error.message.includes('Syntax')) {
    console.log('SQL syntax error');
  } else {
    console.log('Unknown error:', error);
  }
}
```

## Global Objects

```typescript
// Get global DBEngine
const engine = (window as any).DBEngine;

// Create database
const db = (window as any).OpenDatabase('MyDB');

// Create recordset
const rs = db.OpenRecordset('Table');

// Create backend connection
const conn = (window as any).CreateBackendConnection();

// Access IndexedDB store
const store = (window as any).IndexedDBStore;
```

## Services

### Data Binding Service
```typescript
import { dataBindingService } from './services/VB6DataBindingService';

// Bind control
dataBindingService.bindControl(rs, {
  controlName: 'txtField',
  fieldName: 'FieldName'
});

// Get control value
const value = dataBindingService.getControlValue('txtField');

// Collect all control values
dataBindingService.collectFromControls(rs);
```

### Backend Data Service
```typescript
import { backendDataService } from './services/VB6BackendDataService';

// Connect
await backendDataService.connect('mysql://localhost/db');

// Load recordset
await backendDataService.loadRecordset(rs, 'SELECT * FROM Customers');

// Execute query
const result = await backendDataService.executeQuery('SELECT COUNT(*) FROM Customers');

// Clear cache
backendDataService.clearCache();
```

## Keyboard Shortcuts (in Data Controls)

| Key | Action |
|-----|--------|
| `Ctrl+Home` | First record |
| `Ctrl+End` | Last record |
| `Page Down` | Next record |
| `Page Up` | Previous record |
| `F7` | Filter |
| `F8` | Sort |

## Tips & Tricks

1. **Performance**: Use Index for frequently searched fields
2. **Caching**: Enable caching for read-heavy queries
3. **Binding**: Use binding for automatic UI synchronization
4. **Persistence**: Save frequently accessed data locally with IndexedDB
5. **Transactions**: Group multiple operations in transactions for consistency

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Recordset is empty | Check filter, check database connection |
| Controls don't update | Call RefreshBoundControls() |
| Data not persisting | Check IndexedDB quota, verify SaveToPersistence() |
| Backend connection fails | Verify server is running, check connection string |
| Transaction fails | Check database constraints, verify field values |

## See Also

- Full Guide: `/docs/VB6_DATABASE_CONNECTIVITY_GUIDE.md`
- Examples: `/src/examples/VB6DatabaseExample.ts`
- Summary: `/DATABASE_ENHANCEMENT_SUMMARY.md`

## Version

- Database Connectivity Enhancement: v2.0
- VB6 DAOSystem Compatibility: 100%
- Last Updated: 2024
