/**
 * SERVICE WORKER PERSISTENCE BUG FIX: Comprehensive Service Worker and Background Exploitation Protection
 * 
 * This module provides protection against Service Worker persistence attacks,
 * background exploitation, and related web worker vulnerabilities.
 */

export interface ServiceWorkerThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigated: boolean;
  timestamp: number;
}

export interface ServiceWorkerSecurityConfig {
  maxWorkerLifetime: number;
  maxConcurrentWorkers: number;
  maxMemoryUsage: number;
  allowServiceWorkers: boolean;
  allowBackgroundSync: boolean;
  allowPersistentNotifications: boolean;
  blockSuspiciousOrigins: boolean;
}

/**
 * SERVICE WORKER PERSISTENCE BUG FIX: Main protection class
 */
export class ServiceWorkerProtection {
  private static instance: ServiceWorkerProtection;
  private config: ServiceWorkerSecurityConfig;
  private activeWorkers: Map<string, { worker: Worker; startTime: number; operations: number }> = new Map();
  private threats: ServiceWorkerThreat[] = [];
  private monitorInterval: NodeJS.Timeout | null = null;
  
  private readonly DEFAULT_CONFIG: ServiceWorkerSecurityConfig = {
    maxWorkerLifetime: 10 * 60 * 1000, // 10 minutes
    maxConcurrentWorkers: 5,
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    allowServiceWorkers: false, // Disabled by default for security
    allowBackgroundSync: false,
    allowPersistentNotifications: false,
    blockSuspiciousOrigins: true
  };
  
  static getInstance(config?: Partial<ServiceWorkerSecurityConfig>): ServiceWorkerProtection {
    if (!this.instance) {
      this.instance = new ServiceWorkerProtection(config);
    }
    return this.instance;
  }
  
  private constructor(config?: Partial<ServiceWorkerSecurityConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Initialize comprehensive protection
   */
  private initializeProtection(): void {
    // Block Service Worker registration if disabled
    if (!this.config.allowServiceWorkers && typeof navigator !== 'undefined') {
      this.blockServiceWorkerRegistration();
    }
    
    // Monitor existing workers
    this.startWorkerMonitoring();
    
    // Block dangerous APIs
    this.blockDangerousAPIs();
    
    // Monitor storage persistence
    this.monitorStoragePersistence();
    
    if (process.env.NODE_ENV === 'development') { console.log('ServiceWorkerProtection initialized with config:', this.config); }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Block Service Worker registration
   */
  private blockServiceWorkerRegistration(): void {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      // Override service worker registration
      const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
      
      navigator.serviceWorker.register = async (scriptURL: string | URL, options?: RegistrationOptions) => {
        const threat: ServiceWorkerThreat = {
          type: 'service_worker_registration_blocked',
          severity: 'high',
          description: `Service Worker registration blocked: ${scriptURL}`,
          mitigated: true,
          timestamp: Date.now()
        };
        
        this.threats.push(threat);
        console.warn('Service Worker registration blocked for security:', scriptURL);
        
        // Return rejected promise
        throw new Error('Service Worker registration blocked by security policy');
      };
      
      // Block getRegistration and getRegistrations
      const originalGetRegistration = navigator.serviceWorker.getRegistration.bind(navigator.serviceWorker);
      navigator.serviceWorker.getRegistration = async (scope?: string) => {
        console.warn('Service Worker getRegistration blocked');
        return undefined;
      };
      
      const originalGetRegistrations = navigator.serviceWorker.getRegistrations.bind(navigator.serviceWorker);
      navigator.serviceWorker.getRegistrations = async () => {
        console.warn('Service Worker getRegistrations blocked');
        return [];
      };
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Monitor worker activity
   */
  private startWorkerMonitoring(): void {
    this.monitorInterval = setInterval(() => {
      this.checkWorkerLimits();
      this.cleanupExpiredWorkers();
      this.monitorMemoryUsage();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Check worker limits
   */
  private checkWorkerLimits(): void {
    const currentTime = Date.now();
    
    for (const [id, workerInfo] of this.activeWorkers) {
      const lifetime = currentTime - workerInfo.startTime;
      
      // Check lifetime limit
      if (lifetime > this.config.maxWorkerLifetime) {
        this.terminateWorker(id, 'Lifetime limit exceeded');
      }
      
      // Check operation count (suspicious if too many)
      if (workerInfo.operations > 1000) {
        this.recordThreat({
          type: 'excessive_worker_operations',
          severity: 'medium',
          description: `Worker ${id} has performed ${workerInfo.operations} operations`,
          mitigated: false,
          timestamp: currentTime
        });
      }
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Memory usage monitoring
   */
  private monitorMemoryUsage(): void {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize;
      
      if (memoryUsage > this.config.maxMemoryUsage) {
        this.recordThreat({
          type: 'excessive_memory_usage',
          severity: 'high',
          description: `Memory usage exceeded limit: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
          mitigated: false,
          timestamp: Date.now()
        });
        
        // Terminate workers to free memory
        this.emergencyWorkerCleanup();
      }
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Block dangerous APIs
   */
  private blockDangerousAPIs(): void {
    // Block SharedArrayBuffer if available (Spectre mitigation)
    if (typeof SharedArrayBuffer !== 'undefined') {
      (window as any).SharedArrayBuffer = undefined;
      if (process.env.NODE_ENV === 'development') { console.log('SharedArrayBuffer blocked for Spectre protection'); }
    }
    
    // Monitor and limit Web Workers
    if (typeof Worker !== 'undefined') {
      const OriginalWorker = Worker;
      
      (window as any).Worker = class extends OriginalWorker {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          // Check concurrent worker limit
          if (ServiceWorkerProtection.getInstance().activeWorkers.size >= ServiceWorkerProtection.getInstance().config.maxConcurrentWorkers) {
            throw new Error('Maximum concurrent workers exceeded');
          }
          
          super(scriptURL, options);
          
          // Register worker
          const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          ServiceWorkerProtection.getInstance().registerWorker(workerId, this);
          
          // Monitor worker messages
          this.addEventListener('message', (event) => {
            ServiceWorkerProtection.getInstance().monitorWorkerMessage(workerId, event);
          });
          
          // Handle worker termination
          this.addEventListener('error', () => {
            ServiceWorkerProtection.getInstance().unregisterWorker(workerId);
          });
        }
      };
    }
    
    // Block dangerous storage APIs
    this.blockPersistentStorage();
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Block persistent storage
   */
  private blockPersistentStorage(): void {
    // Block persistent storage requests
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const originalPersist = navigator.storage.persist.bind(navigator.storage);
      
      navigator.storage.persist = async () => {
        this.recordThreat({
          type: 'persistent_storage_blocked',
          severity: 'medium',
          description: 'Persistent storage request blocked',
          mitigated: true,
          timestamp: Date.now()
        });
        
        console.warn('Persistent storage request blocked');
        return false;
      };
    }
    
    // Monitor localStorage and sessionStorage for suspicious patterns
    this.monitorStorageAPIs();
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Monitor storage APIs
   */
  private monitorStorageAPIs(): void {
    if (typeof Storage !== 'undefined') {
      // Monitor localStorage
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key: string, value: string) {
        if (ServiceWorkerProtection.getInstance().isSuspiciousStorageKey(key, value)) {
          console.warn('Suspicious storage operation blocked:', key);
          return;
        }
        
        return originalSetItem.call(this, key, value);
      };
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Check for suspicious storage patterns
   */
  private isSuspiciousStorageKey(key: string, value: string): boolean {
    const suspiciousPatterns = [
      /service.*worker/i,
      /background.*sync/i,
      /persistent.*data/i,
      /cross.*session/i,
      /exploit/i,
      /payload/i,
      /backdoor/i,
      /__proto__/i,
      /constructor/i,
      /eval/i,
      /function.*\\(/i,
      /<script/i
    ];
    
    const combinedData = key + value;
    
    return suspiciousPatterns.some(pattern => pattern.test(combinedData));
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Monitor storage persistence
   */
  private monitorStoragePersistence(): void {
    if (typeof navigator !== 'undefined' && navigator.storage) {
      // Check storage estimate periodically
      setInterval(async () => {
        try {
          if (navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usagePercent = estimate.usage && estimate.quota ? 
              (estimate.usage / estimate.quota) * 100 : 0;
            
            if (usagePercent > 90) {
              this.recordThreat({
                type: 'excessive_storage_usage',
                severity: 'medium',
                description: `Storage usage at ${usagePercent.toFixed(2)}%`,
                mitigated: false,
                timestamp: Date.now()
              });
            }
          }
        } catch (error) {
          // Storage API not available or blocked
        }
      }, 60000); // Every minute
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Register worker
   */
  registerWorker(id: string, worker: Worker): void {
    this.activeWorkers.set(id, {
      worker,
      startTime: Date.now(),
      operations: 0
    });
    
    if (process.env.NODE_ENV === 'development') { console.log(`Worker registered: ${id}`); }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Unregister worker
   */
  unregisterWorker(id: string): void {
    this.activeWorkers.delete(id);
    if (process.env.NODE_ENV === 'development') { console.log(`Worker unregistered: ${id}`); }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Monitor worker messages
   */
  private monitorWorkerMessage(workerId: string, event: MessageEvent): void {
    const workerInfo = this.activeWorkers.get(workerId);
    if (workerInfo) {
      workerInfo.operations++;
      
      // Check message size
      try {
        const messageSize = JSON.stringify(event.data).length;
        if (messageSize > 10 * 1024 * 1024) { // 10MB
          this.recordThreat({
            type: 'large_worker_message',
            severity: 'high',
            description: `Large message from worker ${workerId}: ${messageSize} bytes`,
            mitigated: false,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Message not serializable
      }
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Terminate worker
   */
  private terminateWorker(workerId: string, reason: string): void {
    const workerInfo = this.activeWorkers.get(workerId);
    if (workerInfo) {
      try {
        workerInfo.worker.terminate();
        this.activeWorkers.delete(workerId);
        
        this.recordThreat({
          type: 'worker_terminated',
          severity: 'medium',
          description: `Worker ${workerId} terminated: ${reason}`,
          mitigated: true,
          timestamp: Date.now()
        });
        
        if (process.env.NODE_ENV === 'development') { console.log(`Worker ${workerId} terminated: ${reason}`); }
      } catch (error) {
        console.error(`Error terminating worker ${workerId}:`, error);
      }
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Emergency worker cleanup
   */
  private emergencyWorkerCleanup(): void {
    console.warn('Emergency worker cleanup initiated due to memory pressure');
    
    for (const [id, workerInfo] of this.activeWorkers) {
      this.terminateWorker(id, 'Emergency cleanup');
    }
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Clean up expired workers
   */
  private cleanupExpiredWorkers(): void {
    const currentTime = Date.now();
    const expiredWorkers: string[] = [];
    
    for (const [id, workerInfo] of this.activeWorkers) {
      const lifetime = currentTime - workerInfo.startTime;
      if (lifetime > this.config.maxWorkerLifetime) {
        expiredWorkers.push(id);
      }
    }
    
    expiredWorkers.forEach(id => this.terminateWorker(id, 'Lifetime expired'));
  }
  
  /**
   * SERVICE WORKER PERSISTENCE BUG FIX: Record security threat
   */
  private recordThreat(threat: ServiceWorkerThreat): void {
    this.threats.push(threat);
    
    // Keep only recent threats (last 1000)
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
    
    console.warn('Security threat recorded:', threat);
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats(): {
    activeWorkers: number;
    totalThreats: number;
    criticalThreats: number;
    highThreats: number;
    mediumThreats: number;
    lowThreats: number;
    config: ServiceWorkerSecurityConfig;
  } {
    const threatCounts = this.threats.reduce((acc, threat) => {
      acc[threat.severity]++;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });
    
    return {
      activeWorkers: this.activeWorkers.size,
      totalThreats: this.threats.length,
      criticalThreats: threatCounts.critical,
      highThreats: threatCounts.high,
      mediumThreats: threatCounts.medium,
      lowThreats: threatCounts.low,
      config: this.config
    };
  }
  
  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): ServiceWorkerThreat[] {
    return this.threats.slice(-limit);
  }
  
  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    // Clear monitoring interval
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    // Terminate all workers
    for (const [id] of this.activeWorkers) {
      this.terminateWorker(id, 'Shutdown');
    }
    
    // Clear threats
    this.threats = [];
    
    if (process.env.NODE_ENV === 'development') { 
      console.log('ServiceWorkerProtection shutdown complete');
    }
  }
}

// Auto-initialize protection with default settings
let autoProtection: ServiceWorkerProtection | null = null;

if (typeof window !== 'undefined') {
  // Initialize protection on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = ServiceWorkerProtection.getInstance();
    });
  } else {
    autoProtection = ServiceWorkerProtection.getInstance();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default ServiceWorkerProtection;