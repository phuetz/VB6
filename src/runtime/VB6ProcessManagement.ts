/**
 * VB6 Process Management and System APIs
 * Provides web-compatible alternatives for process and system operations
 */

// Process and System Constants
export const PROCESS_CONSTANTS = {
  // Process creation flags
  CREATE_NEW_CONSOLE: 0x00000010,
  CREATE_NO_WINDOW: 0x08000000,
  DETACHED_PROCESS: 0x00000008,
  
  // Priority classes
  IDLE_PRIORITY_CLASS: 0x00000040,
  NORMAL_PRIORITY_CLASS: 0x00000020,
  HIGH_PRIORITY_CLASS: 0x00000080,
  REALTIME_PRIORITY_CLASS: 0x00000100,
  
  // Wait constants
  WAIT_ABANDONED: 0x00000080,
  WAIT_OBJECT_0: 0x00000000,
  WAIT_TIMEOUT: 0x00000102,
  INFINITE: 0xFFFFFFFF,
  
  // System metrics
  SM_CPROCESSORS: 91,
  SM_CXSCREEN: 0,
  SM_CYSCREEN: 1,
  
  // Memory status
  GMEM_FIXED: 0x0000,
  GMEM_MOVEABLE: 0x0002,
  GMEM_NOCOMPACT: 0x0010,
  GMEM_NODISCARD: 0x0020,
  GMEM_ZEROINIT: 0x0040,
  GMEM_MODIFY: 0x0080,
  GMEM_DISCARDABLE: 0x0100,
  GMEM_NOT_BANKED: 0x1000,
  GMEM_SHARE: 0x2000,
  GMEM_DDESHARE: 0x2000,
  
  // File attributes for process files
  FILE_ATTRIBUTE_READONLY: 0x00000001,
  FILE_ATTRIBUTE_HIDDEN: 0x00000002,
  FILE_ATTRIBUTE_SYSTEM: 0x00000004,
  FILE_ATTRIBUTE_DIRECTORY: 0x00000010,
  FILE_ATTRIBUTE_ARCHIVE: 0x00000020,
  FILE_ATTRIBUTE_NORMAL: 0x00000080
};

// Process information structure
export interface ProcessInfo {
  processId: number;
  processName: string;
  commandLine: string;
  workingDirectory: string;
  creationTime: Date;
  priority: number;
  state: 'running' | 'suspended' | 'terminated';
  exitCode?: number;
  parentProcessId?: number;
}

// System information structure
export interface SystemInfo {
  computerName: string;
  userName: string;
  operatingSystem: string;
  version: string;
  processorCount: number;
  totalMemory: number;
  availableMemory: number;
  pageFileSize: number;
  systemDirectory: string;
  windowsDirectory: string;
  tempDirectory: string;
}

// Memory status structure
export interface MemoryStatus {
  totalPhysical: number;
  availablePhysical: number;
  totalPageFile: number;
  availablePageFile: number;
  totalVirtual: number;
  availableVirtual: number;
  memoryLoad: number;
}

// Process registry for web environment
class ProcessRegistry {
  private static instance: ProcessRegistry;
  private processes: Map<number, ProcessInfo> = new Map();
  private nextProcessId: number = 1000;
  private intervals: Map<number, NodeJS.Timeout> = new Map();
  
  static getInstance(): ProcessRegistry {
    if (!ProcessRegistry.instance) {
      ProcessRegistry.instance = new ProcessRegistry();
    }
    return ProcessRegistry.instance;
  }
  
  createProcess(commandLine: string, workingDirectory?: string, priority?: number): number {
    const processId = this.nextProcessId++;
    const processInfo: ProcessInfo = {
      processId,
      processName: this.extractProcessName(commandLine),
      commandLine,
      workingDirectory: workingDirectory || '/virtual',
      creationTime: new Date(),
      priority: priority || PROCESS_CONSTANTS.NORMAL_PRIORITY_CLASS,
      state: 'running'
    };
    
    this.processes.set(processId, processInfo);
    
    // Simulate process lifecycle
    const interval = setInterval(() => {
      const process = this.processes.get(processId);
      if (process && Math.random() < 0.001) { // 0.1% chance per check to terminate
        this.terminateProcess(processId, Math.floor(Math.random() * 256));
      }
    }, 1000);
    
    this.intervals.set(processId, interval);
    
    console.log(`Process created: ${processInfo.processName} (PID: ${processId})`);
    return processId;
  }
  
  private extractProcessName(commandLine: string): string {
    const parts = commandLine.split(' ');
    const executable = parts[0];
    const lastSlash = Math.max(executable.lastIndexOf('/'), executable.lastIndexOf('\\'));
    return lastSlash >= 0 ? executable.substring(lastSlash + 1) : executable;
  }
  
  getProcess(processId: number): ProcessInfo | null {
    return this.processes.get(processId) || null;
  }
  
  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }
  
  terminateProcess(processId: number, exitCode: number = 0): boolean {
    const process = this.processes.get(processId);
    if (!process) return false;
    
    process.state = 'terminated';
    process.exitCode = exitCode;
    
    const interval = this.intervals.get(processId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(processId);
    }
    
    console.log(`Process terminated: ${process.processName} (PID: ${processId}, Exit Code: ${exitCode})`);
    return true;
  }
  
  suspendProcess(processId: number): boolean {
    const process = this.processes.get(processId);
    if (!process || process.state !== 'running') return false;
    
    process.state = 'suspended';
    console.log(`Process suspended: ${process.processName} (PID: ${processId})`);
    return true;
  }
  
  resumeProcess(processId: number): boolean {
    const process = this.processes.get(processId);
    if (!process || process.state !== 'suspended') return false;
    
    process.state = 'running';
    console.log(`Process resumed: ${process.processName} (PID: ${processId})`);
    return true;
  }
  
  setProcessPriority(processId: number, priority: number): boolean {
    const process = this.processes.get(processId);
    if (!process) return false;
    
    process.priority = priority;
    console.log(`Process priority changed: ${process.processName} (PID: ${processId}, Priority: ${priority})`);
    return true;
  }
  
  cleanup(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.processes.clear();
  }
}

const processRegistry = ProcessRegistry.getInstance();

// System information cache
let systemInfoCache: SystemInfo | null = null;

/**
 * Create a new process (VB6 CreateProcess equivalent)
 */
export function CreateProcess(
  applicationName: string | null,
  commandLine: string,
  processAttributes: any = null,
  threadAttributes: any = null,
  inheritHandles: boolean = false,
  creationFlags: number = 0,
  environment: any = null,
  currentDirectory: string | null = null,
  startupInfo: any = null,
  processInformation: any = null
): boolean {
  try {
    const actualCommandLine = applicationName || commandLine;
    const workingDir = currentDirectory || '/virtual';
    
    const processId = processRegistry.createProcess(actualCommandLine, workingDir);
    
    // Simulate process information structure
    if (processInformation) {
      processInformation.hProcess = processId;
      processInformation.hThread = processId + 10000;
      processInformation.dwProcessId = processId;
      processInformation.dwThreadId = processId + 10000;
    }
    
    return true;
  } catch (error) {
    console.error('CreateProcess failed:', error);
    return false;
  }
}

/**
 * Shell execute (VB6 ShellExecute equivalent)
 */
export function ShellExecute(
  hwnd: number = 0,
  operation: string = 'open',
  file: string,
  parameters: string = '',
  directory: string = '',
  showCmd: number = 1
): number {
  try {
    const commandLine = `${file} ${parameters}`.trim();
    const processId = processRegistry.createProcess(commandLine, directory || '/virtual');
    
    // Simulate opening URLs in browser
    if (operation === 'open' && (file.startsWith('http://') || file.startsWith('https://'))) {
      window.open(file, '_blank');
      return processId;
    }
    
    // Simulate opening files
    if (operation === 'open') {
      console.log(`Opening file: ${file}`);
      return processId;
    }
    
    return processId;
  } catch (error) {
    console.error('ShellExecute failed:', error);
    return 0;
  }
}

/**
 * Terminate a process
 */
export function TerminateProcess(processHandle: number, exitCode: number = 0): boolean {
  return processRegistry.terminateProcess(processHandle, exitCode);
}

/**
 * Get process exit code
 */
export function GetExitCodeProcess(processHandle: number): number | null {
  const process = processRegistry.getProcess(processHandle);
  if (!process) return null;
  
  return process.state === 'terminated' ? (process.exitCode || 0) : 259; // STILL_ACTIVE
}

/**
 * Wait for process to complete
 */
export function WaitForSingleObject(handle: number, timeout: number = PROCESS_CONSTANTS.INFINITE): Promise<number> {
  return new Promise((resolve) => {
    const process = processRegistry.getProcess(handle);
    if (!process) {
      resolve(PROCESS_CONSTANTS.WAIT_ABANDONED);
      return;
    }
    
    if (process.state === 'terminated') {
      resolve(PROCESS_CONSTANTS.WAIT_OBJECT_0);
      return;
    }
    
    const startTime = Date.now();
    const checkProcess = () => {
      const currentProcess = processRegistry.getProcess(handle);
      if (!currentProcess || currentProcess.state === 'terminated') {
        resolve(PROCESS_CONSTANTS.WAIT_OBJECT_0);
        return;
      }
      
      if (timeout !== PROCESS_CONSTANTS.INFINITE && Date.now() - startTime >= timeout) {
        resolve(PROCESS_CONSTANTS.WAIT_TIMEOUT);
        return;
      }
      
      setTimeout(checkProcess, 100);
    };
    
    checkProcess();
  });
}

/**
 * Get list of all processes
 */
export function EnumProcesses(): ProcessInfo[] {
  return processRegistry.getAllProcesses();
}

/**
 * Find process by name
 */
export function FindProcess(processName: string): ProcessInfo[] {
  return processRegistry.getAllProcesses().filter(p => 
    p.processName.toLowerCase().includes(processName.toLowerCase())
  );
}

/**
 * Get current process ID
 */
export function GetCurrentProcessId(): number {
  // Return a simulated current process ID
  return 9999;
}

/**
 * Get system information
 */
export function GetSystemInfo(): SystemInfo {
  if (systemInfoCache) {
    return systemInfoCache;
  }
  
  const nav = navigator as any;
  const systemInfo: SystemInfo = {
    computerName: window.location.hostname || 'VB6-BROWSER',
    userName: 'User',
    operatingSystem: nav.platform || 'Web Browser',
    version: nav.userAgent,
    processorCount: nav.hardwareConcurrency || 1,
    totalMemory: nav.deviceMemory ? nav.deviceMemory * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024, // 4GB default
    availableMemory: 2 * 1024 * 1024 * 1024, // 2GB simulated
    pageFileSize: 8 * 1024 * 1024 * 1024, // 8GB simulated
    systemDirectory: '/virtual/Windows/System32',
    windowsDirectory: '/virtual/Windows',
    tempDirectory: '/virtual/temp'
  };
  
  systemInfoCache = systemInfo;
  return systemInfo;
}

/**
 * Get memory status
 */
export function GlobalMemoryStatus(): MemoryStatus {
  const systemInfo = GetSystemInfo();
  
  return {
    totalPhysical: systemInfo.totalMemory,
    availablePhysical: systemInfo.availableMemory,
    totalPageFile: systemInfo.pageFileSize,
    availablePageFile: systemInfo.pageFileSize / 2,
    totalVirtual: 2 * 1024 * 1024 * 1024, // 2GB virtual
    availableVirtual: 1 * 1024 * 1024 * 1024, // 1GB available
    memoryLoad: Math.floor(((systemInfo.totalMemory - systemInfo.availableMemory) / systemInfo.totalMemory) * 100)
  };
}

/**
 * Allocate global memory
 */
export function GlobalAlloc(flags: number, size: number): ArrayBuffer | null {
  try {
    const buffer = new ArrayBuffer(size);
    
    if (flags & PROCESS_CONSTANTS.GMEM_ZEROINIT) {
      const view = new Uint8Array(buffer);
      view.fill(0);
    }
    
    return buffer;
  } catch (error) {
    console.error('GlobalAlloc failed:', error);
    return null;
  }
}

/**
 * Free global memory
 */
export function GlobalFree(handle: ArrayBuffer): boolean {
  // In JavaScript, we can't explicitly free memory, but we can dereference
  // The garbage collector will handle the actual cleanup
  try {
    return true;
  } catch (error) {
    console.error('GlobalFree failed:', error);
    return false;
  }
}

/**
 * Get memory size
 */
export function GlobalSize(handle: ArrayBuffer): number {
  return handle ? handle.byteLength : 0;
}

/**
 * Lock global memory
 */
export function GlobalLock(handle: ArrayBuffer): Uint8Array | null {
  try {
    return new Uint8Array(handle);
  } catch (error) {
    console.error('GlobalLock failed:', error);
    return null;
  }
}

/**
 * Unlock global memory
 */
export function GlobalUnlock(handle: ArrayBuffer): boolean {
  // No-op in JavaScript environment
  return true;
}

/**
 * Get system metrics
 */
export function GetSystemMetrics(index: number): number {
  switch (index) {
    case PROCESS_CONSTANTS.SM_CPROCESSORS:
      return navigator.hardwareConcurrency || 1;
    case PROCESS_CONSTANTS.SM_CXSCREEN:
      return window.screen.width;
    case PROCESS_CONSTANTS.SM_CYSCREEN:
      return window.screen.height;
    default:
      return 0;
  }
}

/**
 * Get Windows version (simulated)
 */
export function GetVersion(): number {
  // Return Windows 10 version (10.0) encoded as DWORD
  return (10 << 16) | 0; // Major: 10, Minor: 0
}

/**
 * Get Windows directory
 */
export function GetWindowsDirectoryA(): string {
  return GetSystemInfo().windowsDirectory;
}

/**
 * Get system directory
 */
export function GetSystemDirectoryA(): string {
  return GetSystemInfo().systemDirectory;
}

/**
 * Get temporary path
 */
export function GetTempPathA(): string {
  return GetSystemInfo().tempDirectory;
}

/**
 * Process priority functions
 */
export function SetPriorityClass(processHandle: number, priorityClass: number): boolean {
  return processRegistry.setProcessPriority(processHandle, priorityClass);
}

export function GetPriorityClass(processHandle: number): number {
  const process = processRegistry.getProcess(processHandle);
  return process ? process.priority : PROCESS_CONSTANTS.NORMAL_PRIORITY_CLASS;
}

/**
 * Suspend/Resume process functions
 */
export function SuspendThread(threadHandle: number): number {
  // In our simulation, thread handle is process handle + 10000
  const processHandle = threadHandle - 10000;
  return processRegistry.suspendProcess(processHandle) ? 0 : -1;
}

export function ResumeThread(threadHandle: number): number {
  // In our simulation, thread handle is process handle + 10000
  const processHandle = threadHandle - 10000;
  return processRegistry.resumeProcess(processHandle) ? 1 : -1;
}

/**
 * Get current thread ID
 */
export function GetCurrentThreadId(): number {
  return GetCurrentProcessId() + 10000;
}

/**
 * Sleep function
 */
export function Sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Get tick count
 */
export function GetTickCount(): number {
  return Date.now() & 0xFFFFFFFF; // Return as 32-bit value like Windows
}

/**
 * Performance counter
 */
export function QueryPerformanceCounter(): number {
  return performance.now() * 1000; // Convert to microseconds
}

export function QueryPerformanceFrequency(): number {
  return 1000000; // 1 MHz (microsecond resolution)
}

// Export all process management functions
export const VB6ProcessManagement = {
  // Process creation and management
  CreateProcess,
  ShellExecute,
  TerminateProcess,
  GetExitCodeProcess,
  WaitForSingleObject,
  
  // Process enumeration
  EnumProcesses,
  FindProcess,
  GetCurrentProcessId,
  GetCurrentThreadId,
  
  // System information
  GetSystemInfo,
  GetSystemMetrics,
  GetVersion,
  GetWindowsDirectoryA,
  GetSystemDirectoryA,
  GetTempPathA,
  
  // Memory management
  GlobalMemoryStatus,
  GlobalAlloc,
  GlobalFree,
  GlobalSize,
  GlobalLock,
  GlobalUnlock,
  
  // Process priority
  SetPriorityClass,
  GetPriorityClass,
  
  // Thread management
  SuspendThread,
  ResumeThread,
  
  // Timing functions
  Sleep,
  GetTickCount,
  QueryPerformanceCounter,
  QueryPerformanceFrequency,
  
  // Constants
  PROCESS_CONSTANTS,
  
  // Registry access
  ProcessRegistry: processRegistry
};

// Make functions globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  globalAny.VB6ProcessManagement = VB6ProcessManagement;
  
  // Expose individual functions globally for VB6 compatibility
  Object.assign(globalAny, {
    CreateProcess,
    ShellExecute,
    TerminateProcess,
    GetExitCodeProcess,
    WaitForSingleObject,
    EnumProcesses,
    FindProcess,
    GetCurrentProcessId,
    GetSystemInfo,
    GlobalMemoryStatus,
    GlobalAlloc,
    GlobalFree,
    GetSystemMetrics,
    GetVersion,
    GetWindowsDirectory: GetWindowsDirectoryA,
    GetSystemDirectory: GetSystemDirectoryA,
    GetTempPath: GetTempPathA,
    SetPriorityClass,
    GetPriorityClass,
    Sleep,
    GetTickCount
  });
  
  // EVENT HANDLING BUG FIX: Track beforeunload listener for cleanup
  const beforeUnloadHandler = () => {
    processRegistry.cleanup();
  };
  
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // Store reference for cleanup
  (VB6ProcessManagement as any)._beforeUnloadHandler = beforeUnloadHandler;
}

/**
 * EVENT HANDLING BUG FIX: Cleanup function to remove global listeners
 * Call this when the module is no longer needed
 */
export function disposeVB6ProcessManagement(): void {
  const handler = (VB6ProcessManagement as any)._beforeUnloadHandler;
  if (handler && typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handler);
    (VB6ProcessManagement as any)._beforeUnloadHandler = null;
  }
}

export default VB6ProcessManagement;