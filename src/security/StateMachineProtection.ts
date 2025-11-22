/**
 * STATE MACHINE ATTACK BUG FIX: Complex Application Logic and State Machine Protection
 * 
 * This module provides protection against state machine and business logic attacks:
 * - State confusion and desynchronization attacks
 * - Race conditions in state transitions
 * - Time-of-check to time-of-use (TOCTOU) vulnerabilities
 * - Business logic bypass and exploitation
 * - Workflow manipulation attacks
 * - Transaction replay and reordering
 * - State pollution and corruption
 * - Concurrency and parallelism vulnerabilities
 * - Asynchronous state corruption
 * - Invariant violation attacks
 */

export interface StateMachineThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  stateTransition?: string;
  invariantViolated?: string;
  evidence: string[];
  mitigated: boolean;
  timestamp: number;
}

export interface StateTransition {
  id: string;
  fromState: string;
  toState: string;
  condition: string;
  timestamp: number;
  duration: number;
  valid: boolean;
}

export interface StateInvariant {
  name: string;
  condition: (state: any) => boolean;
  description: string;
  critical: boolean;
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: (context: any) => boolean;
  priority: number;
  enforced: boolean;
}

export interface ConcurrencyViolation {
  type: 'race_condition' | 'deadlock' | 'livelock' | 'data_race';
  resources: string[];
  threads: number;
  timestamp: number;
}

export interface StateMachineConfig {
  enableStateValidation: boolean;
  enableRaceConditionDetection: boolean;
  enableTOCTOUProtection: boolean;
  enableBusinessLogicValidation: boolean;
  enableTransactionOrdering: boolean;
  enableConcurrencyProtection: boolean;
  enableAsyncStateProtection: boolean;
  stateTimeout: number; // milliseconds
  maxConcurrentTransitions: number;
  invariantCheckInterval: number; // milliseconds
}

/**
 * STATE MACHINE BUG FIX: Main state machine protection class
 */
export class StateMachineProtection {
  private static instance: StateMachineProtection;
  private config: StateMachineConfig;
  private threats: StateMachineThreat[] = [];
  private stateTransitions: Map<string, StateTransition[]> = new Map();
  private stateInvariants: Map<string, StateInvariant> = new Map();
  private businessRules: Map<string, BusinessRule> = new Map();
  private concurrencyViolations: ConcurrencyViolation[] = [];
  private currentStates: Map<string, any> = new Map();
  private transitionLocks: Map<string, boolean> = new Map();
  private transactionLog: Array<{ id: string; operation: string; timestamp: number }> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Common state machine vulnerabilities
  private readonly STATE_VULNERABILITIES = {
    // State confusion patterns
    invalidTransitions: [
      { from: 'authenticated', to: 'unauthenticated', valid: false },
      { from: 'paid', to: 'unpaid', valid: false },
      { from: 'verified', to: 'unverified', valid: false },
      { from: 'completed', to: 'pending', valid: false }
    ],
    
    // Race condition patterns
    raceConditionProne: [
      'payment_processing',
      'authentication_check',
      'permission_validation',
      'resource_allocation',
      'session_management'
    ],
    
    // TOCTOU vulnerable operations
    toctouVulnerable: [
      'file_access',
      'permission_check',
      'balance_check',
      'inventory_check',
      'rate_limit_check'
    ]
  };
  
  // Business logic attack patterns
  private readonly LOGIC_ATTACK_PATTERNS = {
    // Price manipulation
    priceManipulation: /price.*0|discount.*100|total.*negative/i,
    
    // Quantity manipulation
    quantityManipulation: /quantity.*-\d+|amount.*overflow/i,
    
    // Privilege escalation
    privilegeEscalation: /role.*admin|permission.*all|access.*unrestricted/i,
    
    // Workflow bypass
    workflowBypass: /skip.*verification|bypass.*approval|ignore.*validation/i,
    
    // Time manipulation
    timeManipulation: /expiry.*past|deadline.*extended|timestamp.*future/i
  };
  
  // Concurrency patterns
  private readonly CONCURRENCY_PATTERNS = {
    // Lock ordering to prevent deadlock
    lockHierarchy: ['database', 'cache', 'session', 'file', 'network'],
    
    // Critical sections
    criticalSections: new Set([
      'payment_processing',
      'user_authentication',
      'inventory_update',
      'balance_transfer'
    ]),
    
    // Async dangerous patterns
    asyncDangerous: [
      /await.*await/g, // Nested awaits
      /Promise\.(all|race).*Promise\.(all|race)/g, // Nested Promise combinators
      /async.*setTimeout/g, // Async with setTimeout
      /for.*await.*of/g // Async iteration
    ]
  };
  
  private readonly DEFAULT_CONFIG: StateMachineConfig = {
    enableStateValidation: true,
    enableRaceConditionDetection: true,
    enableTOCTOUProtection: true,
    enableBusinessLogicValidation: true,
    enableTransactionOrdering: true,
    enableConcurrencyProtection: true,
    enableAsyncStateProtection: true,
    stateTimeout: 30000, // 30 seconds
    maxConcurrentTransitions: 5,
    invariantCheckInterval: 1000 // 1 second
  };
  
  static getInstance(config?: Partial<StateMachineConfig>): StateMachineProtection {
    if (!this.instance) {
      this.instance = new StateMachineProtection(config);
    }
    return this.instance;
  }
  
  private constructor(config?: Partial<StateMachineConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.initializeProtection();
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize protection
   */
  private initializeProtection(): void {
    // Initialize state validation
    if (this.config.enableStateValidation) {
      this.initializeStateValidation();
    }
    
    // Initialize race condition detection
    if (this.config.enableRaceConditionDetection) {
      this.initializeRaceDetection();
    }
    
    // Initialize TOCTOU protection
    if (this.config.enableTOCTOUProtection) {
      this.initializeTOCTOUProtection();
    }
    
    // Initialize business logic validation
    if (this.config.enableBusinessLogicValidation) {
      this.initializeBusinessLogicValidation();
    }
    
    // Initialize transaction ordering
    if (this.config.enableTransactionOrdering) {
      this.initializeTransactionOrdering();
    }
    
    // Initialize concurrency protection
    if (this.config.enableConcurrencyProtection) {
      this.initializeConcurrencyProtection();
    }
    
    // Initialize async state protection
    if (this.config.enableAsyncStateProtection) {
      this.initializeAsyncProtection();
    }
    
    // Start monitoring
    this.startStateMonitoring();
    
    console.log('StateMachineProtection initialized with config:', this.config);
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize state validation
   */
  private initializeStateValidation(): void {
    // Add common invariants
    this.addStateInvariant('authentication_consistency', (state) => {
      // If user is authenticated, session must exist
      return !(state.authenticated && !state.sessionId);
    }, 'Authentication state must be consistent with session', true);
    
    this.addStateInvariant('payment_integrity', (state) => {
      // Payment amount must be positive
      return !(state.paymentAmount && state.paymentAmount <= 0);
    }, 'Payment amount must be positive', true);
    
    this.addStateInvariant('permission_hierarchy', (state) => {
      // Admin implies user permissions
      return !(state.isAdmin && !state.isUser);
    }, 'Permission hierarchy must be maintained', true);
    
    // Override state setters to validate transitions
    this.wrapStateSetters();
  }
  
  /**
   * STATE MACHINE BUG FIX: Wrap state setters
   */
  private wrapStateSetters(): void {
    if (typeof window === 'undefined') return;
    
    // Wrap common state management patterns
    const originalSetState = (window as any).setState;
    if (originalSetState) {
      (window as any).setState = (newState: any) => {
        this.validateStateTransition(this.currentStates.get('global'), newState);
        return originalSetState(newState);
      };
    }
    
    // Wrap Redux dispatch if available
    if ((window as any).store && (window as any).store.dispatch) {
      const originalDispatch = (window as any).store.dispatch;
      
      (window as any).store.dispatch = (action: any) => {
        this.validateAction(action);
        return originalDispatch(action);
      };
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Validate state transition
   */
  private validateStateTransition(fromState: any, toState: any): void {
    const transitionId = `${JSON.stringify(fromState)}_to_${JSON.stringify(toState)}`;
    
    // Check for invalid transitions
    for (const pattern of this.STATE_VULNERABILITIES.invalidTransitions) {
      if (fromState?.[pattern.from] && !toState?.[pattern.from] && !pattern.valid) {
        this.recordThreat({
          type: 'invalid_state_transition',
          severity: 'high',
          description: `Invalid transition from ${pattern.from} to ${pattern.to}`,
          stateTransition: transitionId,
          evidence: [`pattern: ${pattern.from} -> ${pattern.to}`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
    
    // Check invariants
    this.checkInvariants(toState);
    
    // Record transition
    this.recordStateTransition({
      id: transitionId,
      fromState: JSON.stringify(fromState),
      toState: JSON.stringify(toState),
      condition: 'manual',
      timestamp: Date.now(),
      duration: 0,
      valid: true
    });
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize race detection
   */
  private initializeRaceDetection(): void {
    // Monitor concurrent access to critical resources
    this.wrapCriticalSections();
    
    // Detect concurrent state modifications
    this.detectConcurrentModifications();
  }
  
  /**
   * STATE MACHINE BUG FIX: Wrap critical sections
   */
  private wrapCriticalSections(): void {
    // Create mutex-like protection for critical sections
    (window as any).enterCriticalSection = async (sectionName: string) => {
      const lockKey = `lock_${sectionName}`;
      
      // Check if already locked
      if (this.transitionLocks.get(lockKey)) {
        // Potential race condition
        this.recordThreat({
          type: 'race_condition_detected',
          severity: 'high',
          description: `Race condition in critical section: ${sectionName}`,
          evidence: ['concurrent_access_attempt'],
          mitigated: false,
          timestamp: Date.now()
        });
        
        // Wait for lock with timeout
        const startTime = Date.now();
        while (this.transitionLocks.get(lockKey)) {
          if (Date.now() - startTime > 5000) {
            throw new Error(`Deadlock detected in ${sectionName}`);
          }
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // Acquire lock
      this.transitionLocks.set(lockKey, true);
      
      return {
        release: () => {
          this.transitionLocks.delete(lockKey);
        }
      };
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize TOCTOU protection
   */
  private initializeTOCTOUProtection(): void {
    // Wrap vulnerable operations
    this.wrapTOCTOUOperations();
    
    // Implement atomic operations
    this.implementAtomicOperations();
  }
  
  /**
   * STATE MACHINE BUG FIX: Wrap TOCTOU operations
   */
  private wrapTOCTOUOperations(): void {
    // Create TOCTOU-safe wrappers
    (window as any).toctouSafeCheck = async (
      checkFn: () => Promise<boolean>,
      executeFn: () => Promise<any>
    ) => {
      // Use a transaction-like approach
      const transactionId = `toctou_${Date.now()}_${Math.random()}`;
      
      // Lock the resource
      const lock = await (window as any).enterCriticalSection(transactionId);
      
      try {
        // Check
        const checkResult = await checkFn();
        
        if (!checkResult) {
          return { success: false, reason: 'check_failed' };
        }
        
        // Use immediately
        const useResult = await executeFn();
        
        // Verify state hasn't changed
        const recheckResult = await checkFn();
        
        if (!recheckResult) {
          // TOCTOU vulnerability exploited
          this.recordThreat({
            type: 'toctou_vulnerability_exploited',
            severity: 'critical',
            description: 'Time-of-check to time-of-use vulnerability exploited',
            evidence: ['state_changed_between_check_and_use'],
            mitigated: false,
            timestamp: Date.now()
          });
          
          throw new Error('TOCTOU vulnerability detected');
        }
        
        return { success: true, result: useResult };
        
      } finally {
        lock.release();
      }
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Implement atomic operations
   */
  private implementAtomicOperations(): void {
    // Atomic compare-and-swap
    (window as any).compareAndSwap = (
      obj: any,
      property: string,
      expectedValue: any,
      newValue: any
    ): boolean => {
      if (obj[property] === expectedValue) {
        obj[property] = newValue;
        return true;
      }
      
      // CAS failed - potential race condition
      this.recordThreat({
        type: 'cas_failure',
        severity: 'medium',
        description: 'Compare-and-swap failed - possible race condition',
        evidence: [`property: ${property}`, `expected: ${expectedValue}`, `actual: ${obj[property]}`],
        mitigated: false,
        timestamp: Date.now()
      });
      
      return false;
    };
    
    // Atomic increment/decrement
    (window as any).atomicIncrement = (obj: any, property: string, delta: number = 1): number => {
      const current = obj[property] || 0;
      obj[property] = current + delta;
      
      // Check for overflow
      if (obj[property] > Number.MAX_SAFE_INTEGER || obj[property] < Number.MIN_SAFE_INTEGER) {
        this.recordThreat({
          type: 'integer_overflow',
          severity: 'high',
          description: 'Integer overflow in atomic operation',
          evidence: [`property: ${property}`, `value: ${obj[property]}`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
      
      return obj[property];
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize business logic validation
   */
  private initializeBusinessLogicValidation(): void {
    // Add common business rules
    this.addBusinessRule('price_validation', (context) => {
      return context.price >= 0 && context.price <= 1000000;
    }, 100);
    
    this.addBusinessRule('quantity_validation', (context) => {
      return context.quantity >= 0 && context.quantity <= 10000;
    }, 90);
    
    this.addBusinessRule('discount_validation', (context) => {
      return context.discount >= 0 && context.discount <= 100;
    }, 80);
    
    // Monitor for logic manipulation
    this.monitorBusinessLogic();
  }
  
  /**
   * STATE MACHINE BUG FIX: Monitor business logic
   */
  private monitorBusinessLogic(): void {
    // Check for common manipulation patterns
    (window as any).validateBusinessOperation = (operation: any) => {
      const operationStr = JSON.stringify(operation);
      
      // Check against attack patterns
      for (const [attackType, pattern] of Object.entries(this.LOGIC_ATTACK_PATTERNS)) {
        if (pattern.test(operationStr)) {
          this.recordThreat({
            type: 'business_logic_manipulation',
            severity: 'high',
            description: `Business logic manipulation detected: ${attackType}`,
            evidence: [`pattern: ${pattern}`, `operation: ${operationStr.substring(0, 100)}`],
            mitigated: false,
            timestamp: Date.now()
          });
        }
      }
      
      // Validate against rules
      for (const [ruleId, rule] of this.businessRules) {
        if (!rule.condition(operation)) {
          this.recordThreat({
            type: 'business_rule_violation',
            severity: 'medium',
            description: `Business rule violated: ${rule.name}`,
            evidence: [`rule: ${ruleId}`],
            mitigated: false,
            timestamp: Date.now()
          });
        }
      }
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize transaction ordering
   */
  private initializeTransactionOrdering(): void {
    // Implement transaction serialization
    this.implementTransactionQueue();
    
    // Detect replay attacks
    this.detectReplayAttacks();
  }
  
  /**
   * STATE MACHINE BUG FIX: Implement transaction queue
   */
  private implementTransactionQueue(): void {
    const transactionQueue: Array<{ id: string; fn: (...args: any[]) => any; timestamp: number }> = [];
    let processing = false;
    
    (window as any).queueTransaction = async (transactionFn: (...args: any[]) => any) => {
      const transactionId = `tx_${Date.now()}_${Math.random()}`;
      
      transactionQueue.push({
        id: transactionId,
        fn: transactionFn,
        timestamp: Date.now()
      });
      
      // Process queue if not already processing
      if (!processing) {
        processing = true;
        
        while (transactionQueue.length > 0) {
          const transaction = transactionQueue.shift()!;
          
          // Check for transaction timeout
          if (Date.now() - transaction.timestamp > this.config.stateTimeout) {
            this.recordThreat({
              type: 'transaction_timeout',
              severity: 'medium',
              description: 'Transaction timed out',
              evidence: [`transaction_id: ${transaction.id}`],
              mitigated: false,
              timestamp: Date.now()
            });
            continue;
          }
          
          try {
            await transaction.fn();
            
            // Log transaction
            this.transactionLog.push({
              id: transaction.id,
              operation: 'completed',
              timestamp: Date.now()
            });
            
          } catch (error) {
            // Transaction failed
            this.recordThreat({
              type: 'transaction_failure',
              severity: 'medium',
              description: 'Transaction execution failed',
              evidence: [`transaction_id: ${transaction.id}`, `error: ${error}`],
              mitigated: false,
              timestamp: Date.now()
            });
          }
        }
        
        processing = false;
      }
      
      return transactionId;
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Detect replay attacks
   */
  private detectReplayAttacks(): void {
    const seenTransactions = new Set<string>();
    
    (window as any).checkReplay = (transactionHash: string) => {
      if (seenTransactions.has(transactionHash)) {
        this.recordThreat({
          type: 'transaction_replay_attack',
          severity: 'critical',
          description: 'Transaction replay attack detected',
          evidence: [`transaction_hash: ${transactionHash}`],
          mitigated: true,
          timestamp: Date.now()
        });
        
        return true; // Replay detected
      }
      
      seenTransactions.add(transactionHash);
      
      // Clean up old transactions
      if (seenTransactions.size > 10000) {
        const toDelete = Array.from(seenTransactions).slice(0, 5000);
        toDelete.forEach(tx => seenTransactions.delete(tx));
      }
      
      return false;
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize concurrency protection
   */
  private initializeConcurrencyProtection(): void {
    // Implement deadlock detection
    this.implementDeadlockDetection();
    
    // Monitor for data races
    this.monitorDataRaces();
  }
  
  /**
   * STATE MACHINE BUG FIX: Implement deadlock detection
   */
  private implementDeadlockDetection(): void {
    const resourceGraph = new Map<string, Set<string>>();
    const waitingThreads = new Map<string, string>();
    
    (window as any).acquireResource = async (threadId: string, resourceId: string) => {
      // Check for circular dependencies
      if (this.detectCircularDependency(threadId, resourceId, resourceGraph, waitingThreads)) {
        this.recordConcurrencyViolation({
          type: 'deadlock',
          resources: [resourceId],
          threads: resourceGraph.size,
          timestamp: Date.now()
        });
        
        throw new Error('Deadlock detected');
      }
      
      // Add to wait graph
      waitingThreads.set(threadId, resourceId);
      
      // Simulate resource acquisition
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Remove from wait graph
      waitingThreads.delete(threadId);
      
      // Add to ownership graph
      if (!resourceGraph.has(threadId)) {
        resourceGraph.set(threadId, new Set());
      }
      resourceGraph.get(threadId)!.add(resourceId);
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Detect circular dependency
   */
  private detectCircularDependency(
    threadId: string,
    resourceId: string,
    resourceGraph: Map<string, Set<string>>,
    waitingThreads: Map<string, string>
  ): boolean {
    // Simple cycle detection algorithm
    const visited = new Set<string>();
    const stack = [threadId];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (visited.has(current)) {
        return true; // Cycle detected
      }
      
      visited.add(current);
      
      // Find who owns the resource this thread is waiting for
      const waitingFor = waitingThreads.get(current);
      if (waitingFor) {
        // Find owner of that resource
        for (const [owner, resources] of resourceGraph) {
          if (resources.has(waitingFor)) {
            stack.push(owner);
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * STATE MACHINE BUG FIX: Initialize async protection
   */
  private initializeAsyncProtection(): void {
    // Monitor Promise patterns
    this.monitorPromisePatterns();
    
    // Protect async state updates
    this.protectAsyncStateUpdates();
  }
  
  /**
   * STATE MACHINE BUG FIX: Monitor Promise patterns
   */
  private monitorPromisePatterns(): void {
    // Override Promise methods
    const originalThen = Promise.prototype.then;
    const originalCatch = Promise.prototype.catch;
    
    Promise.prototype.then = function(onFulfilled, onRejected) {
      const protection = StateMachineProtection.getInstance();
      
      // Check for dangerous patterns
      if (onFulfilled) {
        const fnString = onFulfilled.toString();
        
        for (const pattern of protection.CONCURRENCY_PATTERNS.asyncDangerous) {
          if (pattern.test(fnString)) {
            protection.recordThreat({
              type: 'dangerous_async_pattern',
              severity: 'medium',
              description: 'Dangerous async pattern detected',
              evidence: [`pattern: ${pattern}`],
              mitigated: false,
              timestamp: Date.now()
            });
          }
        }
      }
      
      return originalThen.call(this, onFulfilled, onRejected);
    };
    
    // Monitor unhandled rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.recordThreat({
          type: 'unhandled_async_rejection',
          severity: 'medium',
          description: 'Unhandled Promise rejection - potential state corruption',
          evidence: [`reason: ${event.reason}`],
          mitigated: false,
          timestamp: Date.now()
        });
      });
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Protect async state updates
   */
  private protectAsyncStateUpdates(): void {
    // Create safe async state update mechanism
    (window as any).safeAsyncStateUpdate = async (
      updateFn: (state: any) => Promise<any>
    ) => {
      const stateId = 'async_state';
      const lock = await (window as any).enterCriticalSection(stateId);
      
      try {
        const currentState = this.currentStates.get(stateId) || {};
        const newState = await updateFn(currentState);
        
        // Validate new state
        this.validateStateTransition(currentState, newState);
        
        // Update state atomically
        this.currentStates.set(stateId, newState);
        
        return newState;
        
      } finally {
        lock.release();
      }
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Start state monitoring
   */
  private startStateMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performStateChecks();
    }, this.config.invariantCheckInterval);
  }
  
  /**
   * STATE MACHINE BUG FIX: Perform state checks
   */
  private performStateChecks(): void {
    // Check all invariants
    for (const state of this.currentStates.values()) {
      this.checkInvariants(state);
    }
    
    // Check for stuck transitions
    this.checkStuckTransitions();
    
    // Analyze concurrency violations
    this.analyzeConcurrencyViolations();
    
    // Clean up old data
    this.cleanupOldData();
  }
  
  /**
   * STATE MACHINE BUG FIX: Check invariants
   */
  private checkInvariants(state: any): void {
    for (const [name, invariant] of this.stateInvariants) {
      try {
        if (!invariant.condition(state)) {
          this.recordThreat({
            type: 'invariant_violation',
            severity: invariant.critical ? 'critical' : 'high',
            description: `State invariant violated: ${invariant.description}`,
            invariantViolated: name,
            evidence: [`state: ${JSON.stringify(state).substring(0, 100)}`],
            mitigated: false,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Invariant check failed
        this.recordThreat({
          type: 'invariant_check_failure',
          severity: 'medium',
          description: `Invariant check failed: ${name}`,
          evidence: [`error: ${error}`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Check stuck transitions
   */
  private checkStuckTransitions(): void {
    const now = Date.now();
    
    for (const [stateId, transitions] of this.stateTransitions) {
      const lastTransition = transitions[transitions.length - 1];
      
      if (lastTransition && now - lastTransition.timestamp > this.config.stateTimeout) {
        this.recordThreat({
          type: 'stuck_state_transition',
          severity: 'medium',
          description: `State transition stuck for ${(now - lastTransition.timestamp) / 1000}s`,
          stateTransition: stateId,
          evidence: [`duration: ${now - lastTransition.timestamp}ms`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Detect concurrent modifications
   */
  private detectConcurrentModifications(): void {
    const modificationTimestamps = new Map<string, number[]>();
    
    (window as any).trackModification = (resourceId: string) => {
      const now = Date.now();
      const timestamps = modificationTimestamps.get(resourceId) || [];
      
      timestamps.push(now);
      
      // Keep only recent timestamps
      const recentTimestamps = timestamps.filter(t => now - t < 1000);
      modificationTimestamps.set(resourceId, recentTimestamps);
      
      // Check for concurrent modifications
      if (recentTimestamps.length > this.config.maxConcurrentTransitions) {
        this.recordThreat({
          type: 'concurrent_modification',
          severity: 'high',
          description: `Concurrent modifications detected on resource: ${resourceId}`,
          evidence: [`modification_count: ${recentTimestamps.length}`],
          mitigated: false,
          timestamp: Date.now()
        });
      }
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Monitor data races
   */
  private monitorDataRaces(): void {
    const accessLog = new Map<string, Array<{ type: 'read' | 'write'; timestamp: number }>>();
    
    (window as any).logDataAccess = (dataId: string, accessType: 'read' | 'write') => {
      const log = accessLog.get(dataId) || [];
      log.push({ type: accessType, timestamp: Date.now() });
      
      // Keep only recent accesses
      const recentLog = log.filter(l => Date.now() - l.timestamp < 100);
      accessLog.set(dataId, recentLog);
      
      // Check for write-write or read-write races
      const writes = recentLog.filter(l => l.type === 'write');
      const reads = recentLog.filter(l => l.type === 'read');
      
      if (writes.length > 1 || (writes.length > 0 && reads.length > 0)) {
        this.recordConcurrencyViolation({
          type: 'data_race',
          resources: [dataId],
          threads: writes.length + reads.length,
          timestamp: Date.now()
        });
      }
    };
  }
  
  /**
   * STATE MACHINE BUG FIX: Validate action
   */
  private validateAction(action: any): void {
    // Check for dangerous action patterns
    if (action.type) {
      const actionStr = JSON.stringify(action);
      
      // Check for state pollution
      if (actionStr.includes('__proto__') || actionStr.includes('constructor')) {
        this.recordThreat({
          type: 'state_pollution_attempt',
          severity: 'critical',
          description: 'Attempt to pollute application state',
          evidence: ['prototype_pollution_pattern'],
          mitigated: true,
          timestamp: Date.now()
        });
        
        throw new Error('State pollution blocked');
      }
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Add state invariant
   */
  addStateInvariant(
    name: string,
    condition: (state: any) => boolean,
    description: string,
    critical: boolean = false
  ): void {
    this.stateInvariants.set(name, {
      name,
      condition,
      description,
      critical
    });
  }
  
  /**
   * STATE MACHINE BUG FIX: Add business rule
   */
  addBusinessRule(
    id: string,
    condition: (context: any) => boolean,
    priority: number = 50
  ): void {
    this.businessRules.set(id, {
      id,
      name: id,
      condition,
      priority,
      enforced: true
    });
  }
  
  /**
   * STATE MACHINE BUG FIX: Record state transition
   */
  private recordStateTransition(transition: StateTransition): void {
    const transitions = this.stateTransitions.get(transition.fromState) || [];
    transitions.push(transition);
    
    // Keep only recent transitions
    if (transitions.length > 100) {
      transitions.shift();
    }
    
    this.stateTransitions.set(transition.fromState, transitions);
  }
  
  /**
   * STATE MACHINE BUG FIX: Record concurrency violation
   */
  private recordConcurrencyViolation(violation: ConcurrencyViolation): void {
    this.concurrencyViolations.push(violation);
    
    // Keep only recent violations
    if (this.concurrencyViolations.length > 1000) {
      this.concurrencyViolations = this.concurrencyViolations.slice(-1000);
    }
    
    this.recordThreat({
      type: `concurrency_${violation.type}`,
      severity: violation.type === 'deadlock' ? 'critical' : 'high',
      description: `Concurrency violation: ${violation.type}`,
      evidence: [`resources: ${violation.resources.join(', ')}`, `threads: ${violation.threads}`],
      mitigated: false,
      timestamp: violation.timestamp
    });
  }
  
  /**
   * STATE MACHINE BUG FIX: Analyze concurrency violations
   */
  private analyzeConcurrencyViolations(): void {
    const recentViolations = this.concurrencyViolations.filter(v => 
      Date.now() - v.timestamp < 60000 // Last minute
    );
    
    if (recentViolations.length > 10) {
      this.recordThreat({
        type: 'excessive_concurrency_violations',
        severity: 'critical',
        description: `Excessive concurrency violations: ${recentViolations.length} in last minute`,
        evidence: [`violation_count: ${recentViolations.length}`],
        mitigated: false,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Record threat
   */
  private recordThreat(threat: StateMachineThreat): void {
    this.threats.push(threat);
    
    // Keep only recent threats
    if (this.threats.length > 1000) {
      this.threats = this.threats.slice(-1000);
    }
    
    console.warn('State machine threat detected:', threat);
    
    // Alert for critical threats
    if (threat.severity === 'critical') {
      this.alertSecurityTeam(threat);
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Alert security team
   */
  private alertSecurityTeam(threat: StateMachineThreat): void {
    console.error('CRITICAL STATE MACHINE THREAT:', threat);
    
    // Store alert
    if (typeof localStorage !== 'undefined') {
      const alerts = JSON.parse(localStorage.getItem('state_machine_alerts') || '[]');
      alerts.push({
        ...threat,
        alertTime: Date.now()
      });
      
      localStorage.setItem('state_machine_alerts', JSON.stringify(alerts.slice(-100)));
    }
  }
  
  /**
   * STATE MACHINE BUG FIX: Clean up old data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - 3600000; // 1 hour
    
    // Clean up old transitions
    for (const [stateId, transitions] of this.stateTransitions) {
      const recentTransitions = transitions.filter(t => t.timestamp > cutoffTime);
      if (recentTransitions.length === 0) {
        this.stateTransitions.delete(stateId);
      } else {
        this.stateTransitions.set(stateId, recentTransitions);
      }
    }
    
    // Clean up old violations
    this.concurrencyViolations = this.concurrencyViolations.filter(v => 
      v.timestamp > cutoffTime
    );
    
    // Clean up transaction log
    this.transactionLog = this.transactionLog.filter(t => 
      t.timestamp > cutoffTime
    );
  }
  
  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalThreats: number;
    criticalThreats: number;
    stateViolations: number;
    concurrencyViolations: number;
    businessLogicViolations: number;
    activeStates: number;
  } {
    const stateViolations = this.threats.filter(t => 
      t.type.includes('state') || t.type.includes('invariant')
    ).length;
    
    const businessLogicViolations = this.threats.filter(t => 
      t.type.includes('business')
    ).length;
    
    return {
      totalThreats: this.threats.length,
      criticalThreats: this.threats.filter(t => t.severity === 'critical').length,
      stateViolations,
      concurrencyViolations: this.concurrencyViolations.length,
      businessLogicViolations,
      activeStates: this.currentStates.size
    };
  }
  
  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): StateMachineThreat[] {
    return this.threats.slice(-limit);
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StateMachineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('State machine protection configuration updated:', this.config);
  }
  
  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.threats = [];
    this.stateTransitions.clear();
    this.stateInvariants.clear();
    this.businessRules.clear();
    this.concurrencyViolations = [];
    this.currentStates.clear();
    this.transitionLocks.clear();
    this.transactionLog = [];
    
    console.log('StateMachineProtection shutdown complete');
  }
}

// Auto-initialize protection
let autoProtection: StateMachineProtection | null = null;

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoProtection = StateMachineProtection.getInstance();
    });
  } else {
    autoProtection = StateMachineProtection.getInstance();
  }
  
  window.addEventListener('beforeunload', () => {
    if (autoProtection) {
      autoProtection.shutdown();
    }
  });
}

export default StateMachineProtection;