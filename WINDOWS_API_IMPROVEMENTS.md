# Windows API Improvements - VB6 Web IDE

## Overview

Enhanced the Windows API simulation system to provide realistic values and proper implementations instead of just logging console warnings. The improvements include better registry simulation, proper system information retrieval, improved modal dialogs, and asynchronous sleep functionality.

## Files Modified

1. **src/runtime/VB6WindowsAPIBridge.ts** - Core Windows API bridge with comprehensive enhancements
2. **src/runtime/VB6WindowsAPIs.ts** - VB6-specific API functions and registry class
3. **src/services/VB6WindowsAPI.ts** - Service layer API implementations

## Key Improvements

### 1. Directory Path Functions

#### GetWindowsDirectory()
- Returns realistic Windows directory path: `C:\Windows`
- Properly fills buffer with directory string
- Logs operation with emoji indicator

```typescript
public GetWindowsDirectory(nBufferLength: number, lpBuffer: string[]): number {
  const windowsDir = 'C:\\Windows';
  // ... fills buffer and logs
  return length;
}
```

#### GetSystemDirectory()
- Returns system directory: `C:\Windows\System32`
- Properly handles buffer size validation
- Used for finding system libraries and tools

#### GetCurrentDirectory()
- Returns current directory (persisted in localStorage)
- Allows changing via SetCurrentDirectory()
- Defaults to `C:\` if not set

### 2. Computer and User Information

#### GetComputerName()
- Tries localStorage first for customized name
- Falls back to hostname from window.location
- Defaults to `VB6-COMPUTER` if unavailable
- Properly formats hostnames (removes domain, uppercase)

```typescript
private getComputerNameValue(): string {
  // Try localStorage first
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('vb6_computer_name');
    if (stored) return stored;
  }
  // Try hostname from window location
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '') {
      return hostname.split('.')[0].toUpperCase();
    }
  }
  return 'VB6-COMPUTER';
}
```

#### GetUserName()
- Retrieves from localStorage (`vb6_username`)
- Defaults to `User` if not set
- Can be set via SetUserName()

#### SetComputerName() / SetUserName()
- Store values in localStorage for persistence
- Allow dynamic configuration at runtime
- Return success/failure status

### 3. Enhanced Registry Simulation

#### VB6Registry Class
Complete localStorage-based registry simulation with the following features:

**Methods:**
- `RegOpenKeyEx()` - Open registry key
- `RegQueryValueEx()` - Read registry value
- `RegSetValueEx()` - Write registry value
- `RegCreateKeyEx()` - Create new registry key
- `RegDeleteValue()` - Delete registry value
- `RegDeleteKey()` - Delete entire registry key
- `RegCloseKey()` - Close registry key handle

**Features:**
- Full path support (e.g., `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion`)
- Default values initialized on first use
- Comprehensive error handling
- Detailed logging with emoji indicators

**Example:**
```typescript
// Read registry value
const value = VB6Registry.RegQueryValueEx(
  WIN32_CONSTANTS.HKEY_LOCAL_MACHINE,
  'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
  'ProgramFilesDir'
);
// Returns: 'C:\Program Files'

// Write registry value
VB6Registry.RegSetValueEx(
  WIN32_CONSTANTS.HKEY_CURRENT_USER,
  'SOFTWARE\\VB and VBA Program Settings\\MyApp',
  'Setting1',
  'MyValue'
);
```

### 4. Enhanced MessageBox Implementation

Improved MessageBox() supports all VB6 button types and icons:

**Button Types:**
- MB_OK - Single OK button
- MB_OKCANCEL - OK and Cancel buttons
- MB_YESNO - Yes and No buttons
- MB_YESNOCANCEL - Yes, No, and Cancel buttons (uses prompt)
- MB_RETRYCANCEL - Retry and Cancel buttons
- MB_ABORTRETRYIGNORE - Abort, Retry, and Ignore buttons

**Icon Types:**
- MB_ICONASTERISK/MB_ICONINFORMATION - ℹ️ Information icon
- MB_ICONQUESTION - ❓ Question icon
- MB_ICONEXCLAMATION/MB_ICONWARNING - ⚠️ Warning icon
- MB_ICONHAND/MB_ICONERROR/MB_ICONSTOP - ❌ Error icon

**Return Values (consistent with Windows):**
- IDOK = 1
- IDCANCEL = 2
- IDABORT = 3
- IDRETRY = 4
- IDIGNORE = 5
- IDYES = 6
- IDNO = 7

**Example:**
```typescript
// Show information dialog with Yes/No buttons
const result = MessageBox(hWnd, 'Save changes?', 'Confirm', MB_YESNO | MB_ICONQUESTION);
if (result === IDYES) {
  // User clicked Yes
}
```

### 5. Improved Time Functions

#### GetTickCount()
Returns milliseconds since system start:
- Uses `performance.now()` for accuracy (preferred)
- Falls back to `Date.now()` if performance API unavailable
- Returns 32-bit value (masked to match Windows behavior)
- Logs operation with timestamp

```typescript
public GetTickCount(): number {
  const tickCount = typeof performance !== 'undefined' && performance.now
    ? Math.floor(performance.now())
    : Date.now();

  console.log(`⏱️ GetTickCount: ${tickCount}ms`);
  return tickCount & 0xFFFFFFFF; // 32-bit value
}
```

#### Sleep()
Asynchronous sleep function:
- Returns Promise for non-blocking operation
- Properly logs start and completion
- Compatible with async/await syntax

```typescript
public async Sleep(dwMilliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`😴 Sleep completed: ${dwMilliseconds}ms`);
      resolve();
    }, dwMilliseconds);
  });
}
```

#### SleepSync()
Synchronous sleep function:
- Blocks execution (busy wait)
- For compatibility with legacy VB6 code
- Recommended to use async Sleep() instead

### 6. Logging Enhancement

All API calls now include descriptive emoji indicators in console logs:

- 📁 - Directory operations (GetCurrentDirectory, SetCurrentDirectory)
- 📂 - System directory (GetWindowsDirectory)
- 🔧 - System components (GetSystemDirectory)
- 💻 - Computer name operations
- 👤 - User name operations
- 🔑 - Registry operations (open/create/delete)
- 📖 - Registry queries (read)
- ✍️ - Registry writes
- 🗑️ - Registry deletions
- 📢 - Message box dialogs
- ⏱️ - Timer operations
- 😴 - Sleep operations

## Storage Backend

The implementation uses browser localStorage for persistence:

**Keys:**
- `vb6_computer_name` - Stored computer name
- `vb6_user_name` - Stored user name
- `vb6_current_dir` - Current working directory
- `vb6_username` - Alternative username storage
- `vb6_registry_*` - Registry key data

All values are JSON-serialized for complex data types.

## Backward Compatibility

All improvements maintain full backward compatibility:
- Existing code calling these APIs continues to work
- Return values match Windows API specifications
- All functions have proper error handling
- Default values provided when information unavailable

## Usage Examples

### Get System Information
```typescript
import { GetWindowsDirectory, GetSystemDirectory, GetComputerName, GetUserName } from 'src/runtime/VB6WindowsAPIBridge';

const windowsDir = GetWindowsDirectory(260, []);
const systemDir = GetSystemDirectory(260, []);
const computerName = GetComputerName([], 32);
const userName = GetUserName([], 32);

console.log(`Computer: ${computerName}\\${userName}`);
console.log(`Windows: ${windowsDir}`);
```

### Registry Operations
```typescript
import { VB6Registry } from 'src/runtime/VB6WindowsAPIs';
import { WIN32_CONSTANTS } from 'src/runtime/VB6WindowsAPIs';

// Read registry value
const value = VB6Registry.RegQueryValueEx(
  WIN32_CONSTANTS.HKEY_LOCAL_MACHINE,
  'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
  'ProgramFilesDir'
);

// Write registry value
VB6Registry.RegSetValueEx(
  WIN32_CONSTANTS.HKEY_CURRENT_USER,
  'SOFTWARE\\VB and VBA Program Settings\\MyApp',
  'WindowWidth',
  '800'
);
```

### MessageBox with User Response
```typescript
import { MessageBox } from 'src/services/VB6WindowsAPI';
import { WindowsAPI } from 'src/services/VB6WindowsAPI';

const result = MessageBox(
  hWnd,
  'Save changes before closing?',
  'Confirm Exit',
  WindowsAPI.MB_YESNOCANCEL | WindowsAPI.MB_ICONQUESTION
);

switch (result) {
  case WindowsAPI.IDYES:
    // Save and exit
    break;
  case WindowsAPI.IDNO:
    // Exit without saving
    break;
  case WindowsAPI.IDCANCEL:
    // Cancel exit
    break;
}
```

### Async Sleep
```typescript
import { Sleep } from 'src/runtime/VB6WindowsAPIs';

async function delayedOperation() {
  console.log('Starting operation...');
  await Sleep(3000); // Wait 3 seconds
  console.log('Operation complete!');
}
```

## Testing

To verify the improvements:

1. **Directory Operations:**
   - Call GetWindowsDirectory(), GetSystemDirectory(), GetCurrentDirectory()
   - Check console logs for proper emoji indicators
   - Verify SetCurrentDirectory() persists value to localStorage

2. **Computer/User Info:**
   - Call GetComputerName(), GetUserName()
   - Set values via SetComputerName(), SetUserName()
   - Verify localStorage persistence

3. **Registry:**
   - Use VB6Registry to create/read/write/delete keys
   - Check localStorage for registry data
   - Verify proper path formatting

4. **MessageBox:**
   - Test all button types (OK, OKCANCEL, YESNO, etc.)
   - Test all icon types
   - Verify correct return values based on user interaction

5. **Time Functions:**
   - Call GetTickCount() multiple times
   - Verify timestamps are increasing
   - Test Sleep() with async/await

## Performance Considerations

- Registry operations use localStorage (minimal overhead)
- No blocking operations (except SleepSync for compatibility)
- Efficient string handling with emoji logging
- Memory-efficient value caching where needed

## Future Enhancements

Possible improvements for future versions:

1. **Custom Modal Dialog Component**
   - Replace browser alert/confirm/prompt with custom styled dialogs
   - Better multi-button support without prompt()
   - Enhanced user experience

2. **Extended Registry Support**
   - Enumeration of keys and values
   - Recursive key operations
   - Registry export/import

3. **File System Simulation**
   - Enhanced file operations with virtual filesystem
   - Directory traversal
   - File attribute simulation

4. **Performance Metrics**
   - Detailed timing information
   - Performance counter simulation
   - Memory usage tracking

## Conclusion

These improvements transform the Windows API simulation from basic logging to a fully functional environment suitable for running VB6 applications that depend on system information, registry access, and user interaction dialogs. All improvements maintain full backward compatibility while providing realistic and useful return values.
