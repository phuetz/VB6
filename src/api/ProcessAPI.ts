/**
 * Process and Thread API - Complete VB6 Process/Thread Implementation
 * Provides comprehensive process and thread management functions
 */

// Process API Constants
export enum PROCESS_CREATION_FLAGS {
  DEBUG_PROCESS = 0x00000001,
  DEBUG_ONLY_THIS_PROCESS = 0x00000002,
  CREATE_SUSPENDED = 0x00000004,
  DETACHED_PROCESS = 0x00000008,
  CREATE_NEW_CONSOLE = 0x00000010,
  NORMAL_PRIORITY_CLASS = 0x00000020,
  IDLE_PRIORITY_CLASS = 0x00000040,
  HIGH_PRIORITY_CLASS = 0x00000080,
  REALTIME_PRIORITY_CLASS = 0x00000100,
  CREATE_NEW_PROCESS_GROUP = 0x00000200,
  CREATE_UNICODE_ENVIRONMENT = 0x00000400,
  CREATE_SEPARATE_WOW_VDM = 0x00000800,
  CREATE_SHARED_WOW_VDM = 0x00001000,
  CREATE_FORCEDOS = 0x00002000,
  BELOW_NORMAL_PRIORITY_CLASS = 0x00004000,
  ABOVE_NORMAL_PRIORITY_CLASS = 0x00008000,
  INHERIT_PARENT_AFFINITY = 0x00010000,
  INHERIT_CALLER_PRIORITY = 0x00020000,
  CREATE_PROTECTED_PROCESS = 0x00040000,
  EXTENDED_STARTUPINFO_PRESENT = 0x00080000,
  PROCESS_MODE_BACKGROUND_BEGIN = 0x00100000,
  PROCESS_MODE_BACKGROUND_END = 0x00200000
}

export enum THREAD_PRIORITY {
  THREAD_PRIORITY_IDLE = -15,
  THREAD_PRIORITY_LOWEST = -2,
  THREAD_PRIORITY_BELOW_NORMAL = -1,
  THREAD_PRIORITY_NORMAL = 0,
  THREAD_PRIORITY_ABOVE_NORMAL = 1,
  THREAD_PRIORITY_HIGHEST = 2,
  THREAD_PRIORITY_TIME_CRITICAL = 15
}

export enum PROCESS_ACCESS_RIGHTS {
  PROCESS_TERMINATE = 0x0001,
  PROCESS_CREATE_THREAD = 0x0002,
  PROCESS_SET_SESSIONID = 0x0004,
  PROCESS_VM_OPERATION = 0x0008,
  PROCESS_VM_READ = 0x0010,
  PROCESS_VM_WRITE = 0x0020,
  PROCESS_DUP_HANDLE = 0x0040,
  PROCESS_CREATE_PROCESS = 0x0080,
  PROCESS_SET_QUOTA = 0x0100,
  PROCESS_SET_INFORMATION = 0x0200,
  PROCESS_QUERY_INFORMATION = 0x0400,
  PROCESS_SUSPEND_RESUME = 0x0800,
  PROCESS_QUERY_LIMITED_INFORMATION = 0x1000,
  PROCESS_ALL_ACCESS = 0x1F0FFF,
  SYNCHRONIZE = 0x00100000
}

export enum WAIT_RESULT {
  WAIT_ABANDONED = 0x00000080,
  WAIT_OBJECT_0 = 0x00000000,
  WAIT_TIMEOUT = 0x00000102,
  WAIT_FAILED = 0xFFFFFFFF,
  INFINITE = 0xFFFFFFFE
}

export interface PROCESS_INFORMATION {
  hProcess: number;
  hThread: number;
  dwProcessId: number;
  dwThreadId: number;
}

export interface STARTUPINFO {
  cb: number;
  lpReserved?: string;
  lpDesktop?: string;
  lpTitle?: string;
  dwX: number;
  dwY: number;
  dwXSize: number;
  dwYSize: number;
  dwXCountChars: number;
  dwYCountChars: number;
  dwFillAttribute: number;
  dwFlags: number;
  wShowWindow: number;
  cbReserved2: number;
  lpReserved2?: Uint8Array;
  hStdInput?: number;
  hStdOutput?: number;
  hStdError?: number;
}

export interface PROCESS_MEMORY_COUNTERS {
  cb: number;
  PageFaultCount: number;
  PeakWorkingSetSize: number;
  WorkingSetSize: number;
  QuotaPeakPagedPoolUsage: number;
  QuotaPagedPoolUsage: number;
  QuotaPeakNonPagedPoolUsage: number;
  QuotaNonPagedPoolUsage: number;
  PagefileUsage: number;
  PeakPagefileUsage: number;
}

export interface SYSTEM_INFO {
  wProcessorArchitecture: number;
  wReserved: number;
  dwPageSize: number;
  lpMinimumApplicationAddress: number;
  lpMaximumApplicationAddress: number;
  dwActiveProcessorMask: number;
  dwNumberOfProcessors: number;
  dwProcessorType: number;
  dwAllocationGranularity: number;
  wProcessorLevel: number;
  wProcessorRevision: number;
}

// Browser-based Process Simulation
class ProcessAPI {
  private static processCounter = 1000;
  private static threadCounter = 2000;
  private static processes: Map<number, ProcessInfo> = new Map();
  private static threads: Map<number, ThreadInfo> = new Map();
  private static workers: Map<number, Worker> = new Map();
  private static waitIntervals: Map<number, NodeJS.Timeout> = new Map();
  private static intervalCounter = 1;

  // MEMORY LEAK FIX: Periodic cleanup of terminated processes/threads
  private static cleanupInterval: NodeJS.Timeout | null = null;
  
  private static initialize(): void {
    // Add current process
    ProcessAPI.processes.set(ProcessAPI.getCurrentProcessId(), {
      id: ProcessAPI.getCurrentProcessId(),
      name: 'VB6Studio.exe',
      commandLine: window.location.href,
      created: new Date(),
      priority: THREAD_PRIORITY.THREAD_PRIORITY_NORMAL,
      workingSet: 1024 * 1024 * 50, // 50MB simulated
      handles: 100,
      threads: 1,
      isRunning: true
    });

    // MEMORY LEAK FIX: Start periodic cleanup
    ProcessAPI.startPeriodicCleanup();
  }

  // MEMORY LEAK FIX: Cleanup terminated processes and threads
  private static startPeriodicCleanup(): void {
    if (ProcessAPI.cleanupInterval) {
      clearInterval(ProcessAPI.cleanupInterval);
    }

    ProcessAPI.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const cleanupThreshold = 5 * 60 * 1000; // 5 minutes

      // Clean up terminated processes older than 5 minutes
      ProcessAPI.processes.forEach((process, id) => {
        if (!process.isRunning && process.exitCode !== undefined) {
          const terminatedTime = now - process.created.getTime();
          if (terminatedTime > cleanupThreshold) {
            ProcessAPI.processes.delete(id);
          }
        }
      });

      // Clean up terminated threads older than 5 minutes
      ProcessAPI.threads.forEach((thread, id) => {
        if (!thread.isRunning && thread.exitCode !== undefined) {
          const terminatedTime = now - thread.created.getTime();
          if (terminatedTime > cleanupThreshold) {
            ProcessAPI.threads.delete(id);
            // Also clean up associated worker if still exists
            const worker = ProcessAPI.workers.get(id);
            if (worker) {
              worker.terminate();
              ProcessAPI.workers.delete(id);
            }
          }
        }
      });
    }, 60000); // Run cleanup every minute
  }

  // MEMORY LEAK FIX: Shutdown method to clean up resources
  static shutdown(): void {
    if (ProcessAPI.cleanupInterval) {
      clearInterval(ProcessAPI.cleanupInterval);
      ProcessAPI.cleanupInterval = null;
    }

    // Clear all wait intervals
    ProcessAPI.waitIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    ProcessAPI.waitIntervals.clear();

    // Terminate all workers
    ProcessAPI.workers.forEach((worker) => {
      worker.terminate();
    });
    ProcessAPI.workers.clear();

    // Clear all data structures
    ProcessAPI.processes.clear();
    ProcessAPI.threads.clear();
  }
  
  // Process Management Functions
  static CreateProcess(
    applicationName: string | null,
    commandLine: string,
    processAttributes: any = null,
    threadAttributes: any = null,
    inheritHandles: boolean = false,
    creationFlags: PROCESS_CREATION_FLAGS = PROCESS_CREATION_FLAGS.NORMAL_PRIORITY_CLASS,
    environment: any = null,
    currentDirectory: string | null = null,
    startupInfo: STARTUPINFO | null = null
  ): { success: boolean; processInfo: PROCESS_INFORMATION | null } {
    
    try {
      // In browser environment, we can only simulate process creation
      // Real process creation would require native capabilities
      
      const processId = ++ProcessAPI.processCounter;
      const threadId = ++ProcessAPI.threadCounter;
      const processHandle = processId;
      const threadHandle = threadId;
      
      // Create simulated process
      const commandParts = commandLine.split(' ');
      const processInfo: ProcessInfo = {
        id: processId,
        name: applicationName || (commandParts.length > 0 ? commandParts[0] : 'Unknown'),
        commandLine,
        created: new Date(),
        priority: THREAD_PRIORITY.THREAD_PRIORITY_NORMAL,
        workingSet: 1024 * 1024 * 10, // 10MB default
        handles: 10,
        threads: 1,
        isRunning: !(creationFlags & PROCESS_CREATION_FLAGS.CREATE_SUSPENDED)
      };
      
      ProcessAPI.processes.set(processId, processInfo);
      
      // Create main thread
      const threadInfo: ThreadInfo = {
        id: threadId,
        processId: processId,
        priority: THREAD_PRIORITY.THREAD_PRIORITY_NORMAL,
        created: new Date(),
        isRunning: processInfo.isRunning,
        isSuspended: !processInfo.isRunning
      };
      
      ProcessAPI.threads.set(threadId, threadInfo);
      
      // For web applications, try to open in new window/tab
      if (commandLine.startsWith('http') || commandLine.startsWith('file:')) {
        window.open(commandLine, '_blank');
      }
      
      const result: PROCESS_INFORMATION = {
        hProcess: processHandle,
        hThread: threadHandle,
        dwProcessId: processId,
        dwThreadId: threadId
      };
      
      return { success: true, processInfo: result };
      
    } catch (error) {
      console.error('CreateProcess failed:', error);
      return { success: false, processInfo: null };
    }
  }
  
  static OpenProcess(desiredAccess: PROCESS_ACCESS_RIGHTS, inheritHandle: boolean, processId: number): number {
    const process = ProcessAPI.processes.get(processId);
    if (!process) {
      return 0; // Invalid handle
    }
    
    // Return the process ID as handle (simplified)
    return processId;
  }
  
  static TerminateProcess(processHandle: number, exitCode: number): boolean {
    try {
      const process = ProcessAPI.processes.get(processHandle);
      if (!process) {
        return false;
      }
      
      process.isRunning = false;
      process.exitCode = exitCode;
      
      // Terminate associated threads
      ProcessAPI.threads.forEach((thread, threadId) => {
        if (thread.processId === processHandle) {
          thread.isRunning = false;
          
          // Terminate web worker if exists
          const worker = ProcessAPI.workers.get(threadId);
          if (worker) {
            worker.terminate();
            ProcessAPI.workers.delete(threadId);
          }
        }
      });
      
      return true;
    } catch {
      return false;
    }
  }
  
  static GetExitCodeProcess(processHandle: number): { success: boolean; exitCode: number } {
    const process = ProcessAPI.processes.get(processHandle);
    if (!process) {
      return { success: false, exitCode: 0 };
    }
    
    if (process.isRunning) {
      return { success: true, exitCode: 259 }; // STILL_ACTIVE
    }
    
    return { success: true, exitCode: process.exitCode || 0 };
  }
  
  static GetCurrentProcess(): number {
    return ProcessAPI.getCurrentProcessId();
  }
  
  static GetCurrentProcessId(): number {
    // Return a consistent process ID for the current browser tab
    let processId = parseInt(sessionStorage.getItem('VB6_PROCESS_ID') || '0', 10);
    if (processId === 0) {
      // SECURITY FIX: Use sequential ID instead of Math.random() to avoid collisions
      processId = ++ProcessAPI.processCounter;
      sessionStorage.setItem('VB6_PROCESS_ID', processId.toString());
    }
    return processId;
  }
  
  static GetProcessMemoryInfo(processHandle: number): PROCESS_MEMORY_COUNTERS | null {
    const process = ProcessAPI.processes.get(processHandle);
    if (!process) {
      return null;
    }
    
    // Return simulated memory information
    return {
      cb: 40, // Size of structure
      PageFaultCount: Math.floor(Math.random() * 10000),
      PeakWorkingSetSize: process.workingSet * 1.2,
      WorkingSetSize: process.workingSet,
      QuotaPeakPagedPoolUsage: process.workingSet * 0.3,
      QuotaPagedPoolUsage: process.workingSet * 0.2,
      QuotaPeakNonPagedPoolUsage: process.workingSet * 0.1,
      QuotaNonPagedPoolUsage: process.workingSet * 0.05,
      PagefileUsage: process.workingSet * 0.8,
      PeakPagefileUsage: process.workingSet * 1.1
    };
  }
  
  // Thread Management Functions
  static CreateThread(
    threadAttributes: any = null,
    stackSize: number = 0,
    startAddress: (param: any) => void,
    parameter: any = null,
    creationFlags: number = 0,
    threadId: { value: number } = { value: 0 }
  ): number {
    
    try {
      const newThreadId = ++ProcessAPI.threadCounter;
      const processId = ProcessAPI.getCurrentProcessId();
      
      const threadInfo: ThreadInfo = {
        id: newThreadId,
        processId: processId,
        priority: THREAD_PRIORITY.THREAD_PRIORITY_NORMAL,
        created: new Date(),
        isRunning: !(creationFlags & PROCESS_CREATION_FLAGS.CREATE_SUSPENDED),
        isSuspended: !!(creationFlags & PROCESS_CREATION_FLAGS.CREATE_SUSPENDED)
      };
      
      ProcessAPI.threads.set(newThreadId, threadInfo);
      threadId.value = newThreadId;
      
      // BROWSER COMPATIBILITY FIX: Create Web Worker for thread simulation with feature detection
      if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        try {
          const workerCode = `
            // Safe function whitelist - no eval() usage
            const allowedFunctions = {
              'Math.random': () => Math.random(),
              'Date.now': () => Date.now(),
              'console.log': (msg) => console.log('[Worker]:', msg),
              'setTimeout': (fn, delay) => setTimeout(fn, delay),
              'setInterval': (fn, delay) => setInterval(fn, delay)
            };
            
            onmessage = function(e) {
              try {
                const { funcName, params } = e.data;
                
                // Only allow whitelisted functions
                if (allowedFunctions[funcName]) {
                  const result = allowedFunctions[funcName].apply(null, params || []);
                  postMessage({ success: true, result });
                } else {
                  postMessage({ success: false, error: 'Function not allowed: ' + funcName });
                }
              } catch (error) {
                postMessage({ success: false, error: error.message });
              }
            };
          `;
          
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);
          
          // WEBWORKER DEADLOCK FIX: Revoke blob URL after worker creation to prevent memory leak
          URL.revokeObjectURL(workerUrl);
          
          worker.onmessage = (e) => {
            const { success, result, error } = e.data;
            if (!success) {
              console.error('Thread execution error:', error);
            }
          };
          
          worker.onerror = (error) => {
            console.error('Worker error:', error);
            threadInfo.isRunning = false;
          };
          
          ProcessAPI.workers.set(newThreadId, worker);
          
          // Start thread if not suspended
          if (threadInfo.isRunning) {
            worker.postMessage({
              funcName: 'console.log', // Safe default function
              params: [`Thread ${newThreadId} started`]
            });
          }
          
        } catch (error) {
          console.warn('Web Worker creation failed, using setTimeout simulation:', error);
          
          // Fallback to setTimeout for thread simulation
          if (threadInfo.isRunning) {
            setTimeout(() => {
              try {
                startAddress(parameter);
              } catch (error) {
                console.error('Thread execution error:', error);
                threadInfo.isRunning = false;
              }
            }, 0);
          }
        }
      } else {
        console.warn('Web Worker not supported, using setTimeout simulation');
        
        // Fallback to setTimeout for thread simulation
        if (threadInfo.isRunning) {
          setTimeout(() => {
            try {
              startAddress(parameter);
            } catch (error) {
              console.error('Thread execution error:', error);
              threadInfo.isRunning = false;
            }
          }, 0);
        }
      }
      
      return newThreadId;
      
    } catch (error) {
      console.error('CreateThread failed:', error);
      return 0;
    }
  }
  
  static GetCurrentThread(): number {
    return ProcessAPI.getCurrentThreadId();
  }
  
  static GetCurrentThreadId(): number {
    // Return main thread ID
    return 1;
  }
  
  static SuspendThread(threadHandle: number): number {
    const thread = ProcessAPI.threads.get(threadHandle);
    if (!thread) {
      return 0xFFFFFFFF; // Error
    }
    
    const previousSuspendCount = thread.isSuspended ? 1 : 0;
    thread.isSuspended = true;
    thread.isRunning = false;
    
    // Suspend web worker
    const worker = ProcessAPI.workers.get(threadHandle);
    if (worker) {
      worker.terminate();
      ProcessAPI.workers.delete(threadHandle);
    }
    
    return previousSuspendCount;
  }
  
  static ResumeThread(threadHandle: number): number {
    const thread = ProcessAPI.threads.get(threadHandle);
    if (!thread) {
      return 0xFFFFFFFF; // Error
    }
    
    const previousSuspendCount = thread.isSuspended ? 1 : 0;
    thread.isSuspended = false;
    thread.isRunning = true;
    
    return previousSuspendCount;
  }
  
  static TerminateThread(threadHandle: number, exitCode: number): boolean {
    try {
      const thread = ProcessAPI.threads.get(threadHandle);
      if (!thread) {
        return false;
      }
      
      thread.isRunning = false;
      thread.exitCode = exitCode;
      
      // Terminate web worker
      const worker = ProcessAPI.workers.get(threadHandle);
      if (worker) {
        worker.terminate();
        ProcessAPI.workers.delete(threadHandle);
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  static GetThreadPriority(threadHandle: number): number {
    const thread = ProcessAPI.threads.get(threadHandle);
    return thread ? thread.priority : THREAD_PRIORITY.THREAD_PRIORITY_NORMAL;
  }
  
  static SetThreadPriority(threadHandle: number, priority: THREAD_PRIORITY): boolean {
    const thread = ProcessAPI.threads.get(threadHandle);
    if (!thread) {
      return false;
    }
    
    thread.priority = priority;
    return true;
  }
  
  // Synchronization Functions
  static WaitForSingleObject(handle: number, milliseconds: number): Promise<WAIT_RESULT> {
    return new Promise((resolve) => {
      const process = ProcessAPI.processes.get(handle);
      const thread = ProcessAPI.threads.get(handle);
      
      if (!process && !thread) {
        resolve(WAIT_RESULT.WAIT_FAILED);
        return;
      }
      
      const target = process || thread;
      
      if (!target!.isRunning) {
        resolve(WAIT_RESULT.WAIT_OBJECT_0);
        return;
      }
      
      if (milliseconds === 0) {
        resolve(WAIT_RESULT.WAIT_TIMEOUT);
        return;
      }
      
      const startTime = Date.now();
      const intervalId = ProcessAPI.intervalCounter++;
      
      const checkInterval = setInterval(() => {
        if (!target!.isRunning) {
          clearInterval(checkInterval);
          ProcessAPI.waitIntervals.delete(intervalId);
          resolve(WAIT_RESULT.WAIT_OBJECT_0);
          return;
        }
        
        if (milliseconds !== WAIT_RESULT.INFINITE && Date.now() - startTime >= milliseconds) {
          clearInterval(checkInterval);
          ProcessAPI.waitIntervals.delete(intervalId);
          resolve(WAIT_RESULT.WAIT_TIMEOUT);
          return;
        }
      }, 10);
      
      // MEMORY LEAK FIX: Track interval for cleanup
      ProcessAPI.waitIntervals.set(intervalId, checkInterval);
    });
  }
  
  static WaitForMultipleObjects(
    handles: number[],
    waitAll: boolean,
    milliseconds: number
  ): Promise<WAIT_RESULT> {
    return new Promise((resolve) => {
      if (handles.length === 0) {
        resolve(WAIT_RESULT.WAIT_FAILED);
        return;
      }
      
      const startTime = Date.now();
      let completedCount = 0;
      const intervalId = ProcessAPI.intervalCounter++;
      
      const checkCompletion = () => {
        completedCount = 0;
        
        for (let i = 0; i < handles.length; i++) {
          const handle = handles[i];
          const process = ProcessAPI.processes.get(handle);
          const thread = ProcessAPI.threads.get(handle);
          const target = process || thread;
          
          if (target && !target.isRunning) {
            completedCount++;
            if (!waitAll) {
              return WAIT_RESULT.WAIT_OBJECT_0 + i;
            }
          }
        }
        
        if (waitAll && completedCount === handles.length) {
          return WAIT_RESULT.WAIT_OBJECT_0;
        }
        
        return null;
      };
      
      const checkInterval = setInterval(() => {
        const result = checkCompletion();
        if (result !== null) {
          clearInterval(checkInterval);
          ProcessAPI.waitIntervals.delete(intervalId);
          resolve(result);
          return;
        }
        
        if (milliseconds !== WAIT_RESULT.INFINITE && Date.now() - startTime >= milliseconds) {
          clearInterval(checkInterval);
          ProcessAPI.waitIntervals.delete(intervalId);
          resolve(WAIT_RESULT.WAIT_TIMEOUT);
          return;
        }
      }, 10);
      
      // MEMORY LEAK FIX: Track interval for cleanup
      ProcessAPI.waitIntervals.set(intervalId, checkInterval);
    });
  }
  
  // System Information Functions
  static GetSystemInfo(): SYSTEM_INFO {
    return {
      wProcessorArchitecture: 9, // PROCESSOR_ARCHITECTURE_AMD64
      wReserved: 0,
      dwPageSize: 4096,
      lpMinimumApplicationAddress: 0x00010000,
      lpMaximumApplicationAddress: 0x7FFEFFFF,
      dwActiveProcessorMask: (1 << navigator.hardwareConcurrency) - 1,
      dwNumberOfProcessors: navigator.hardwareConcurrency || 1,
      dwProcessorType: 586, // PROCESSOR_INTEL_PENTIUM
      dwAllocationGranularity: 65536,
      wProcessorLevel: 6,
      wProcessorRevision: 0x3A09
    };
  }
  
  static GetProcessTimes(processHandle: number): {
    creationTime: Date;
    exitTime: Date;
    kernelTime: number;
    userTime: number;
  } | null {
    const process = ProcessAPI.processes.get(processHandle);
    if (!process) {
      return null;
    }
    
    const now = new Date();
    const runTime = now.getTime() - process.created.getTime();
    
    return {
      creationTime: process.created,
      exitTime: process.isRunning ? new Date(0) : now,
      kernelTime: Math.floor(runTime * 0.1), // 10% kernel time (simulated)
      userTime: Math.floor(runTime * 0.9)   // 90% user time (simulated)
    };
  }
  
  // Process Enumeration
  static EnumProcesses(): number[] {
    return Array.from(ProcessAPI.processes.keys());
  }
  
  static GetProcessImageFileName(processHandle: number): string {
    const process = ProcessAPI.processes.get(processHandle);
    return process ? process.name : '';
  }
  
  // VB6-compatible helper functions
  static Shell(pathname: string, windowStyle: number = 1): number {
    // VB6 Shell function equivalent
    const result = ProcessAPI.CreateProcess(null, pathname);
    return result.success && result.processInfo ? result.processInfo.dwProcessId : 0;
  }
  
  static CloseHandle(handle: number): boolean {
    // Close process or thread handle
    return true; // Simplified - no actual cleanup needed in simulation
  }
}

// Internal interfaces
interface ProcessInfo {
  id: number;
  name: string;
  commandLine: string;
  created: Date;
  priority: THREAD_PRIORITY;
  workingSet: number;
  handles: number;
  threads: number;
  isRunning: boolean;
  exitCode?: number;
}

interface ThreadInfo {
  id: number;
  processId: number;
  priority: THREAD_PRIORITY;
  created: Date;
  isRunning: boolean;
  isSuspended: boolean;
  exitCode?: number;
}

// Initialize on module load
ProcessAPI.initialize();

export { ProcessAPI };
export default ProcessAPI;