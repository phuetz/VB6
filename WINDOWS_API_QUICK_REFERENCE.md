# Windows API Quick Reference Guide

## Directory Functions

### GetWindowsDirectory()

```typescript
import { GetWindowsDirectory } from 'src/runtime/VB6WindowsAPIBridge';

const buffer = new Array(260);
const length = GetWindowsDirectory(260, buffer);
const path = buffer.slice(0, length).join('');
// Result: C:\Windows
```

### GetSystemDirectory()

```typescript
import { GetSystemDirectory } from 'src/runtime/VB6WindowsAPIBridge';

const buffer = new Array(260);
const length = GetSystemDirectory(260, buffer);
// Result: C:\Windows\System32
```

### GetCurrentDirectory()

```typescript
import { GetCurrentDirectory } from 'src/runtime/VB6WindowsAPIBridge';

const buffer = new Array(260);
const length = GetCurrentDirectory(260, buffer);
// Result: C:\ (or persisted value)
```

### SetCurrentDirectory()

```typescript
import { SetCurrentDirectory } from 'src/runtime/VB6WindowsAPIBridge';

SetCurrentDirectory('C:\\MyFolder');
// Persists to localStorage for next session
```

## System Information

### GetComputerName()

```typescript
import { GetComputerName } from 'src/runtime/VB6WindowsAPIBridge';

const buffer = new Array(32);
GetComputerName(buffer, 32);
const name = buffer.join('').replace(/\0.*/, '');
// Result: MYCOMPUTER (from hostname or storage)
```

### SetComputerName()

```typescript
import { SetComputerName } from 'src/runtime/VB6WindowsAPIBridge';

SetComputerName('MY-PC');
// Persists to localStorage
```

### GetUserName()

```typescript
import { GetUserName } from 'src/runtime/VB6WindowsAPIBridge';

const buffer = new Array(32);
GetUserName(buffer, 32);
// Result: User (or persisted value)
```

### SetUserName()

```typescript
import { SetUserName } from 'src/runtime/VB6WindowsAPIBridge';

SetUserName('John Doe');
// Persists to localStorage
```

## Registry Operations

### Import Registry Class

```typescript
import { VB6Registry, WIN32_CONSTANTS } from 'src/runtime/VB6WindowsAPIs';
```

### Open Registry Key

```typescript
const hKey = VB6Registry.RegOpenKeyEx(
  WIN32_CONSTANTS.HKEY_LOCAL_MACHINE,
  'SOFTWARE\\Microsoft\\Windows\\CurrentVersion'
);
// Returns: HKEY_LOCAL_MACHINE
```

### Read Registry Value

```typescript
const value = VB6Registry.RegQueryValueEx(
  WIN32_CONSTANTS.HKEY_LOCAL_MACHINE,
  'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
  'ProgramFilesDir'
);
// Returns: 'C:\Program Files'
```

### Write Registry Value

```typescript
VB6Registry.RegSetValueEx(
  WIN32_CONSTANTS.HKEY_CURRENT_USER,
  'SOFTWARE\\VB and VBA Program Settings\\MyApp',
  'SettingName',
  'SettingValue'
);
// Persists to localStorage
```

### Create Registry Key

```typescript
VB6Registry.RegCreateKeyEx(
  WIN32_CONSTANTS.HKEY_CURRENT_USER,
  'SOFTWARE\\VB and VBA Program Settings\\MyApp\\MySection'
);
// Creates new registry key
```

### Delete Registry Value

```typescript
VB6Registry.RegDeleteValue(
  WIN32_CONSTANTS.HKEY_CURRENT_USER,
  'SOFTWARE\\VB and VBA Program Settings\\MyApp',
  'SettingName'
);
```

### Delete Registry Key

```typescript
VB6Registry.RegDeleteKey(
  WIN32_CONSTANTS.HKEY_CURRENT_USER,
  'SOFTWARE\\VB and VBA Program Settings\\MyApp\\MySection'
);
```

### Close Registry Key

```typescript
VB6Registry.RegCloseKey(hKey);
```

## Message Boxes

### Import Constants

```typescript
import { WindowsAPI } from 'src/services/VB6WindowsAPI';

// Or use individual constants
const { MB_OK, MB_YESNO, MB_ICONQUESTION, IDYES, IDNO } = WindowsAPI;
```

### Simple OK Dialog

```typescript
MessageBox(hWnd, 'Operation complete!', 'Success', MB_OK);
// Returns: IDOK (1)
```

### Confirm Yes/No

```typescript
const result = MessageBox(hWnd, 'Continue?', 'Confirm', MB_YESNO | MB_ICONQUESTION);

if (result === IDYES) {
  // User clicked Yes
} else {
  // User clicked No
}
```

### Yes/No/Cancel Dialog

```typescript
const result = MessageBox(
  hWnd,
  'Save changes?',
  'Unsaved Changes',
  MB_YESNOCANCEL | MB_ICONQUESTION
);

switch (result) {
  case IDYES: // 6
    // Save
    break;
  case IDNO: // 7
    // Don't save
    break;
  case IDCANCEL: // 2
    // Cancel operation
    break;
}
```

### Error Dialog

```typescript
MessageBox(hWnd, 'An error occurred!', 'Error', MB_OK | MB_ICONERROR);
// Returns: IDOK (1)
```

### Warning Dialog

```typescript
MessageBox(hWnd, 'This action cannot be undone.', 'Warning', MB_OKCANCEL | MB_ICONWARNING);
```

### Retry/Cancel Dialog

```typescript
const result = MessageBox(
  hWnd,
  'Connection failed. Retry?',
  'Network Error',
  MB_RETRYCANCEL | MB_ICONERROR
);

if (result === IDRETRY) {
  // 4
  // Retry operation
} else {
  // Cancel
}
```

### Abort/Retry/Ignore Dialog

```typescript
const result = MessageBox(
  hWnd,
  'Print job failed.',
  'Printer Error',
  MB_ABORTRETRYIGNORE | MB_ICONERROR
);

switch (result) {
  case IDABORT: // 3
    // Abort operation
    break;
  case IDRETRY: // 4
    // Retry operation
    break;
  case IDIGNORE: // 5
    // Ignore error and continue
    break;
}
```

## Time Functions

### Get Tick Count

```typescript
import { GetTickCount } from 'src/runtime/VB6WindowsAPIBridge';

const start = GetTickCount();
// ... do something ...
const end = GetTickCount();
const elapsed = end - start;
console.log(`Elapsed: ${elapsed}ms`);
```

### Asynchronous Sleep

```typescript
import { Sleep } from 'src/runtime/VB6WindowsAPIs';

async function delayedOperation() {
  console.log('Starting...');
  await Sleep(2000); // Wait 2 seconds
  console.log('Done!');
}
```

### Synchronous Sleep (Not Recommended)

```typescript
import { SleepSync } from 'src/runtime/VB6WindowsAPIs';

SleepSync(1000); // Blocks for 1 second
console.log('Done!');
```

## Button Type Constants

```typescript
MB_OK; // 0 - OK button only
MB_OKCANCEL; // 1 - OK and Cancel buttons
MB_ABORTRETRYIGNORE; // 2 - Abort, Retry, Ignore buttons
MB_YESNOCANCEL; // 3 - Yes, No, Cancel buttons
MB_YESNO; // 4 - Yes and No buttons
MB_RETRYCANCEL; // 5 - Retry and Cancel buttons
```

## Icon Type Constants

```typescript
MB_ICONASTERISK; // Information icon (ℹ️)
MB_ICONQUESTION; // Question icon (❓)
MB_ICONEXCLAMATION; // Warning icon (⚠️)
MB_ICONHAND; // Error icon (❌)
MB_ICONERROR; // Error icon (❌)
MB_ICONWARNING; // Warning icon (⚠️)
MB_ICONINFORMATION; // Information icon (ℹ️)
```

## Return Value Constants

```typescript
IDOK; // 1
IDCANCEL; // 2
IDABORT; // 3
IDRETRY; // 4
IDIGNORE; // 5
IDYES; // 6
IDNO; // 7
```

## Registry Key Constants

```typescript
HKEY_CLASSES_ROOT; // 0x80000000
HKEY_CURRENT_USER; // 0x80000001
HKEY_LOCAL_MACHINE; // 0x80000002
HKEY_USERS; // 0x80000003
HKEY_PERFORMANCE_DATA; // 0x80000004
HKEY_CURRENT_CONFIG; // 0x80000005
HKEY_DYN_DATA; // 0x80000006
```

## Common Registry Paths

```typescript
// Program Files
SOFTWARE\Microsoft\Windows\CurrentVersion
  → ProgramFilesDir: C:\Program Files

// VB6 Settings
SOFTWARE\VB and VBA Program Settings\[AppName]\[Section]\[Key]

// Windows Version
SOFTWARE\Microsoft\Windows NT\CurrentVersion
  → CurrentVersion: 10.0
  → CurrentBuild: 19045
```

## Complete Example

```typescript
import { GetComputerName, GetUserName, SetUserName } from 'src/runtime/VB6WindowsAPIBridge';
import { MessageBox } from 'src/services/VB6WindowsAPI';
import { VB6Registry, WIN32_CONSTANTS } from 'src/runtime/VB6WindowsAPIs';
import { WindowsAPI } from 'src/services/VB6WindowsAPI';

// Get system info
const computerBuf = new Array(32);
GetComputerName(computerBuf, 32);
const computer = computerBuf.join('').replace(/\0.*/, '');

const userBuf = new Array(32);
GetUserName(userBuf, 32);
const user = userBuf.join('').replace(/\0.*/, '');

// Confirm user identity
const result = MessageBox(
  0,
  `Logged in as: ${user}`,
  `Welcome to ${computer}`,
  WindowsAPI.MB_OKCANCEL | WindowsAPI.MB_ICONINFORMATION
);

if (result === WindowsAPI.IDOK) {
  // Save user setting
  VB6Registry.RegSetValueEx(
    WIN32_CONSTANTS.HKEY_CURRENT_USER,
    'SOFTWARE\\VB and VBA Program Settings\\MyApp\\Settings',
    'LastUser',
    user
  );
}
```

## Tips & Best Practices

1. **Buffer Management**: Always allocate buffers large enough for results
2. **Error Handling**: Check return values and handle failures gracefully
3. **Async Sleep**: Use `async/await` with `Sleep()` instead of `SleepSync()`
4. **Registry Keys**: Use full paths including hive name
5. **Persistence**: Values persist in localStorage across sessions
6. **Logging**: Check console with emoji indicators for debugging
7. **Backward Compat**: All APIs match Windows specifications
8. **Testing**: Test with various registry keys and paths

## Troubleshooting

**Q: GetComputerName returns 'VB6-COMPUTER'?**
A: Set via `SetComputerName()` or hostname must not be 'localhost'

**Q: Registry value not found?**
A: Check registry path, use correct HKEY constant, verify spelling

**Q: MessageBox doesn't show?**
A: Ensure window handle is valid, check browser console for errors

**Q: Sleep not waiting?**
A: Use `await Sleep()` in async context, not `SleepSync()`

**Q: Values not persisting?**
A: Check localStorage quota, verify browser allows storage

## Performance Notes

- Registry operations: O(1) via localStorage
- GetTickCount(): Microsecond precision with performance.now()
- MessageBox(): Synchronous with native browser dialogs
- Sleep(): Non-blocking with Promise-based async
- Directory operations: Instant with optional persistence
