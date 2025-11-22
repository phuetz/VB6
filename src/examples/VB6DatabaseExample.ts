/**
 * VB6 Database Connectivity Examples
 * Demonstrates practical usage of enhanced DAO/ADO with persistence and backend integration
 */

import {
  DBEngine,
  CreateDatabase,
  CreateBackendConnection,
  IndexedDBStore,
  DAORecordset,
  DAODatabase,
  DAO_CONSTANTS,
} from '../runtime/VB6DAOSystem';
import { dataBindingService } from '../services/VB6DataBindingService';
import { backendDataService } from '../services/VB6BackendDataService';

// ============================================================================
// Example 1: Basic Recordset Operations
// ============================================================================

export async function example1_BasicRecordsetOperations(): Promise<void> {
  console.log('=== Example 1: Basic Recordset Operations ===\n');

  // Create database
  const db = CreateDatabase('SampleDB', 'English');

  // Open recordset
  const recordset = db.OpenRecordset('Customers');

  console.log(`Total records: ${recordset.RecordCount}`);

  // Navigate to first record
  recordset.MoveFirst();
  if (!recordset.BOF) {
    console.log(`First customer: ${recordset.Fields('Name').Value}`);
  }

  // Move through records
  let counter = 0;
  recordset.MoveFirst();
  while (!recordset.EOF && counter < 5) {
    const name = recordset.Fields('Name').Value;
    const city = recordset.Fields('City').Value;
    console.log(`- ${name} (${city})`);

    recordset.MoveNext();
    counter++;
  }

  // Navigate to last
  recordset.MoveLast();
  console.log(`Last customer: ${recordset.Fields('Name').Value}`);

  recordset.Close();
}

// ============================================================================
// Example 2: Adding and Modifying Records
// ============================================================================

export async function example2_AddingAndModifyingRecords(): Promise<void> {
  console.log('\n=== Example 2: Adding and Modifying Records ===\n');

  const db = CreateDatabase('SampleDB', 'English');
  const recordset = db.OpenRecordset('Customers');

  // Add new record
  console.log('Adding new customer...');
  recordset.AddNew();
  recordset.Fields('Name').Value = 'Acme Corporation';
  recordset.Fields('City').Value = 'New York';
  recordset.Fields('Country').Value = 'USA';
  recordset.Update();

  console.log(`Added new record. Total now: ${recordset.RecordCount}`);

  // Edit existing record
  console.log('\nEditing customer...');
  recordset.MoveFirst();
  recordset.EditWithTracking(); // Use tracking for comparison
  const originalName = recordset.GetOriginalRecord().Name;
  recordset.Fields('City').Value = 'Boston';
  recordset.UpdateWithTracking();

  console.log(`Changed ${originalName}'s city to Boston`);

  // Delete record
  console.log('\nDeleting last record...');
  recordset.MoveLast();
  const nameToDelete = recordset.Fields('Name').Value;
  recordset.Delete();

  console.log(`Deleted ${nameToDelete}. Total now: ${recordset.RecordCount}`);

  recordset.Close();
}

// ============================================================================
// Example 3: Finding Records
// ============================================================================

export async function example3_FindingRecords(): Promise<void> {
  console.log('\n=== Example 3: Finding Records ===\n');

  const db = CreateDatabase('SampleDB', 'English');
  const recordset = db.OpenRecordset('Customers');

  // Find first
  console.log('Finding first customer in USA...');
  recordset.FindFirst("Country = 'USA'");

  if (!recordset.NoMatch) {
    console.log(`Found: ${recordset.Fields('Name').Value}`);

    // Find next
    console.log('Finding next customer in USA...');
    recordset.FindNext("Country = 'USA'");

    if (!recordset.NoMatch) {
      console.log(`Next: ${recordset.Fields('Name').Value}`);
    } else {
      console.log('No more USA customers found');
    }
  } else {
    console.log('No USA customers found');
  }

  recordset.Close();
}

// ============================================================================
// Example 4: Data Binding with Controls
// ============================================================================

export async function example4_DataBindingWithControls(): Promise<void> {
  console.log('\n=== Example 4: Data Binding with Controls ===\n');

  // In a real application, these would be actual form controls
  // For this example, we'll simulate them

  const db = CreateDatabase('SampleDB', 'English');
  const recordset = db.OpenRecordset('Customers');

  // Create simulated HTML controls
  const htmlContent = `
    <div>
      <input id="txtName" type="text" placeholder="Customer Name" />
      <input id="txtCity" type="text" placeholder="City" />
      <input id="txtCountry" type="text" placeholder="Country" />
    </div>
  `;

  // Create a container for our simulated controls
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // Bind controls
    dataBindingService.bindControl(recordset, {
      controlName: 'txtName',
      fieldName: 'Name',
      autoUpdate: true,
    });

    dataBindingService.bindControl(recordset, {
      controlName: 'txtCity',
      fieldName: 'City',
      autoUpdate: true,
    });

    dataBindingService.bindControl(recordset, {
      controlName: 'txtCountry',
      fieldName: 'Country',
      autoUpdate: true,
    });

    console.log('Controls bound to recordset');

    // Navigate records - controls update automatically
    recordset.MoveFirst();
    recordset.RefreshBoundControls();
    console.log('Displayed first record in controls');

    // Move to next record
    recordset.MoveNext();
    recordset.RefreshBoundControls();
    console.log('Moved to next record - controls updated');

    // Get control values
    const name = dataBindingService.getControlValue('txtName');
    const city = dataBindingService.getControlValue('txtCity');
    console.log(`Current values: ${name}, ${city}`);

    // Update via control
    dataBindingService.setControlValue(recordset, 'txtCity', 'San Francisco');
    console.log('Updated city via control binding');

  } finally {
    // Cleanup
    document.body.removeChild(container);
    recordset.Close();
  }
}

// ============================================================================
// Example 5: Persistence with IndexedDB
// ============================================================================

export async function example5_PersistenceWithIndexedDB(): Promise<void> {
  console.log('\n=== Example 5: Persistence with IndexedDB ===\n');

  // Initialize IndexedDB store
  await IndexedDBStore.initialize();
  console.log('IndexedDB store initialized');

  const db = CreateDatabase('SampleDB', 'English');
  const recordset = db.OpenRecordset('Customers');

  // Add some test data
  recordset.AddNew();
  recordset.Fields('Name').Value = 'Test Company 1';
  recordset.Fields('City').Value = 'Test City 1';
  recordset.Update();

  recordset.AddNew();
  recordset.Fields('Name').Value = 'Test Company 2';
  recordset.Fields('City').Value = 'Test City 2';
  recordset.Update();

  console.log(`Created ${recordset.RecordCount} test records`);

  // Save to IndexedDB
  await recordset.SaveToPersistence();
  console.log('Recordset saved to IndexedDB');

  // Clear recordset
  recordset.Close();

  // Create new recordset and load from persistence
  const recordset2 = db.OpenRecordset('Customers');
  await recordset2.LoadFromPersistence();

  console.log(`Loaded ${recordset2.RecordCount} records from IndexedDB`);
  recordset2.MoveFirst();
  console.log(`First loaded record: ${recordset2.Fields('Name').Value}`);

  recordset2.Close();
}

// ============================================================================
// Example 6: Backend Database Connection
// ============================================================================

export async function example6_BackendDatabaseConnection(): Promise<void> {
  console.log('\n=== Example 6: Backend Database Connection ===\n');

  try {
    // Initialize backend service
    const connectionString = 'mysql://user:password@localhost:3306/mydb';

    console.log('Connecting to backend database...');
    const connected = await backendDataService.connect(connectionString);

    if (!connected) {
      console.log('Failed to connect to backend (server may not be running)');
      return;
    }

    console.log('Connected to backend database');

    // Create database and recordset
    const db = CreateDatabase('ProductDB', 'English');
    const recordset = db.OpenRecordset('Products');

    // Connect recordset to backend
    const backendConn = CreateBackendConnection('/api/database');
    await backendConn.connect(connectionString);
    recordset.ConnectToBackend(backendConn);

    // Load data from backend
    console.log('Loading data from backend...');
    await recordset.LoadFromBackend(
      'SELECT * FROM Products WHERE Category = ? LIMIT 10',
      ['Electronics']
    );

    console.log(`Loaded ${recordset.RecordCount} products from backend`);

    // Display first few records
    recordset.MoveFirst();
    let count = 0;
    while (!recordset.EOF && count < 3) {
      const productId = recordset.Fields('ProductID').Value;
      const productName = recordset.Fields('ProductName').Value;
      const price = recordset.Fields('Price').Value;
      console.log(`- Product #${productId}: ${productName} ($${price})`);

      recordset.MoveNext();
      count++;
    }

    recordset.Close();
  } catch (error) {
    console.error('Backend example error:', error);
  }
}

// ============================================================================
// Example 7: Transaction Management
// ============================================================================

export async function example7_TransactionManagement(): Promise<void> {
  console.log('\n=== Example 7: Transaction Management ===\n');

  try {
    // Connect to backend
    const connectionString = 'mysql://localhost/mydb';
    const backendConn = CreateBackendConnection('/api/database');
    const connected = await backendConn.connect(connectionString);

    if (!connected) {
      console.log('Backend not available for transaction example');
      return;
    }

    const db = CreateDatabase('OrderDB', 'English');
    const ordersRs = db.OpenRecordset('Orders');
    const detailsRs = db.OpenRecordset('OrderDetails');

    ordersRs.ConnectToBackend(backendConn);
    detailsRs.ConnectToBackend(backendConn);

    try {
      console.log('Starting transaction...');
      await ordersRs.BeginTransaction();

      // Add order
      ordersRs.AddNew();
      ordersRs.Fields('CustomerID').Value = 123;
      ordersRs.Fields('OrderDate').Value = new Date();
      ordersRs.Fields('TotalAmount').Value = 1500;
      ordersRs.Update();

      const orderId = ordersRs.Fields('OrderID').Value;
      console.log(`Created order #${orderId}`);

      // Add order details
      detailsRs.AddNew();
      detailsRs.Fields('OrderID').Value = orderId;
      detailsRs.Fields('ProductID').Value = 1;
      detailsRs.Fields('Quantity').Value = 5;
      detailsRs.Fields('UnitPrice').Value = 100;
      detailsRs.Update();

      detailsRs.AddNew();
      detailsRs.Fields('OrderID').Value = orderId;
      detailsRs.Fields('ProductID').Value = 2;
      detailsRs.Fields('Quantity').Value = 10;
      detailsRs.Fields('UnitPrice').Value = 50;
      detailsRs.Update();

      console.log('Added order details');

      // Commit transaction
      console.log('Committing transaction...');
      await ordersRs.CommitTransaction();
      console.log('Transaction committed successfully');

    } catch (error) {
      console.error('Error in transaction, rolling back...');
      try {
        await ordersRs.RollbackTransaction();
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    ordersRs.Close();
    detailsRs.Close();

  } catch (error) {
    console.error('Transaction example error:', error);
  }
}

// ============================================================================
// Example 8: Filtering and Sorting
// ============================================================================

export async function example8_FilteringAndSorting(): Promise<void> {
  console.log('\n=== Example 8: Filtering and Sorting ===\n');

  const db = CreateDatabase('SampleDB', 'English');
  const recordset = db.OpenRecordset('Customers');

  // Apply filter
  console.log('Applying filter: Country = USA...');
  recordset.Filter = "Country = 'USA'";

  recordset.MoveFirst();
  let count = 0;
  console.log('Filtered results:');
  while (!recordset.EOF && count < 3) {
    console.log(`- ${recordset.Fields('Name').Value} (${recordset.Fields('City').Value})`);
    recordset.MoveNext();
    count++;
  }

  // Apply sort
  console.log('\nSorting by Name (A-Z)...');
  recordset.Sort = 'Name ASC';

  recordset.MoveFirst();
  count = 0;
  console.log('Sorted results:');
  while (!recordset.EOF && count < 3) {
    console.log(`- ${recordset.Fields('Name').Value}`);
    recordset.MoveNext();
    count++;
  }

  recordset.Close();
}

// ============================================================================
// Example 9: Batch Operations
// ============================================================================

export async function example9_BatchOperations(): Promise<void> {
  console.log('\n=== Example 9: Batch Operations ===\n');

  const db = CreateDatabase('SampleDB', 'English');
  const recordset = db.OpenRecordset('Customers');

  // Simulate batch insert
  const newCustomers = [
    { Name: 'Company A', City: 'New York', Country: 'USA' },
    { Name: 'Company B', City: 'Los Angeles', Country: 'USA' },
    { Name: 'Company C', City: 'Chicago', Country: 'USA' },
  ];

  console.log('Inserting batch of customers...');
  for (const customer of newCustomers) {
    recordset.AddNew();
    recordset.Fields('Name').Value = customer.Name;
    recordset.Fields('City').Value = customer.City;
    recordset.Fields('Country').Value = customer.Country;
    recordset.Update();
  }

  console.log(`Inserted ${newCustomers.length} customers`);
  console.log(`Total records now: ${recordset.RecordCount}`);

  recordset.Close();
}

// ============================================================================
// Example 10: Combining All Features
// ============================================================================

export async function example10_CompleteApplication(): Promise<void> {
  console.log('\n=== Example 10: Complete Application ===\n');

  try {
    // Initialize services
    await IndexedDBStore.initialize();
    console.log('Application initialized');

    // Create database
    const db = CreateDatabase('AppDatabase', 'English');
    console.log('Database created');

    // Open recordset
    const recordset = db.OpenRecordset('Customers');
    console.log(`Opened recordset with ${recordset.RecordCount} records`);

    // Setup controls (simulated)
    const container = document.createElement('div');
    container.id = 'appContainer';
    container.innerHTML = `
      <h3>Customer Management</h3>
      <div>
        <label>Name:</label>
        <input id="customerName" type="text" />
      </div>
      <div>
        <label>City:</label>
        <input id="customerCity" type="text" />
      </div>
      <div>
        <button id="btnFirst">First</button>
        <button id="btnPrevious">Previous</button>
        <button id="btnNext">Next</button>
        <button id="btnLast">Last</button>
        <button id="btnSave">Save</button>
      </div>
      <div id="status"></div>
    `;

    document.body.appendChild(container);

    try {
      // Bind controls
      dataBindingService.bindControl(recordset, {
        controlName: 'customerName',
        fieldName: 'Name',
      });

      dataBindingService.bindControl(recordset, {
        controlName: 'customerCity',
        fieldName: 'City',
      });

      console.log('Controls bound');

      // Display first record
      recordset.MoveFirst();
      recordset.RefreshBoundControls();

      // Setup button handlers
      const updateStatus = () => {
        const status = document.getElementById('status');
        if (status) {
          status.textContent = `Record ${recordset.AbsolutePosition + 1} of ${recordset.RecordCount}`;
        }
      };

      document.getElementById('btnFirst')?.addEventListener('click', () => {
        recordset.MoveFirst();
        recordset.RefreshBoundControls();
        updateStatus();
      });

      document.getElementById('btnNext')?.addEventListener('click', () => {
        if (!recordset.EOF) {
          recordset.MoveNext();
          if (!recordset.EOF) {
            recordset.RefreshBoundControls();
          }
        }
        updateStatus();
      });

      document.getElementById('btnPrevious')?.addEventListener('click', () => {
        if (!recordset.BOF) {
          recordset.MovePrevious();
          if (!recordset.BOF) {
            recordset.RefreshBoundControls();
          }
        }
        updateStatus();
      });

      document.getElementById('btnLast')?.addEventListener('click', () => {
        recordset.MoveLast();
        recordset.RefreshBoundControls();
        updateStatus();
      });

      document.getElementById('btnSave')?.addEventListener('click', async () => {
        recordset.Edit();
        dataBindingService.collectFromControls(recordset);
        recordset.Update();
        await recordset.SaveToPersistence();
        console.log('Changes saved');
      });

      updateStatus();
      console.log('Application running');

    } finally {
      document.body.removeChild(container);
      recordset.Close();
    }

  } catch (error) {
    console.error('Application error:', error);
  }
}

// ============================================================================
// Test Runner
// ============================================================================

export async function runAllExamples(): Promise<void> {
  console.log('Starting VB6 Database Examples...\n');

  const examples = [
    { name: 'Basic Operations', fn: example1_BasicRecordsetOperations },
    { name: 'Add/Modify', fn: example2_AddingAndModifyingRecords },
    { name: 'Finding', fn: example3_FindingRecords },
    { name: 'Data Binding', fn: example4_DataBindingWithControls },
    { name: 'Persistence', fn: example5_PersistenceWithIndexedDB },
    { name: 'Backend Connection', fn: example6_BackendDatabaseConnection },
    { name: 'Transactions', fn: example7_TransactionManagement },
    { name: 'Filter/Sort', fn: example8_FilteringAndSorting },
    { name: 'Batch Operations', fn: example9_BatchOperations },
  ];

  for (const example of examples) {
    try {
      await example.fn();
    } catch (error) {
      console.error(`Error in ${example.name}:`, error);
    }
  }

  console.log('\n=== All Examples Complete ===');
}

// Auto-run on import (in development)
if (typeof window !== 'undefined' && (window as any).DEBUG_VB6_EXAMPLES) {
  runAllExamples().catch(console.error);
}
