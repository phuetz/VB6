/**
 * Profile-Guided Optimization (PGO) System for VB6
 *
 * Collects runtime profiling data to guide compilation optimizations:
 * - Function execution frequency
 * - Branch prediction statistics
 * - Type profiling
 * - Memory access patterns
 * - Call graph analysis
 * - Loop iteration counts
 * - Hot path detection
 */

interface ProfileData {
  version: number;
  timestamp: number;
  executionProfiles: Map<string, ExecutionProfile>;
  typeProfiles: Map<string, TypeProfile>;
  branchProfiles: Map<string, BranchProfile>;
  memoryProfiles: Map<string, MemoryProfile>;
  callGraph: CallGraph;
  hotPaths: HotPath[];
}

interface ExecutionProfile {
  functionName: string;
  executionCount: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastExecutionTime: number;
  samples: number[];
}

interface TypeProfile {
  variableName: string;
  observedTypes: Map<string, number>;
  isMonomorphic: boolean;
  dominantType: string | null;
  stabilityScore: number;
}

interface BranchProfile {
  branchId: string;
  takenCount: number;
  notTakenCount: number;
  predictability: number;
  pattern: number[]; // Recent history for pattern detection
}

interface MemoryProfile {
  accessPattern: 'sequential' | 'random' | 'strided';
  cacheHitRate: number;
  workingSetSize: number;
  allocationRate: number;
  gcPressure: number;
}

interface CallGraph {
  nodes: Map<string, CallGraphNode>;
  edges: Map<string, CallGraphEdge[]>;
  hotCallChains: string[][];
}

interface CallGraphNode {
  functionName: string;
  selfTime: number;
  totalTime: number;
  callCount: number;
  callers: Set<string>;
  callees: Set<string>;
}

interface CallGraphEdge {
  from: string;
  to: string;
  count: number;
  avgTime: number;
}

interface HotPath {
  functions: string[];
  executionCount: number;
  totalTime: number;
  percentageOfTotal: number;
}

export class VB6ProfileGuidedOptimizer {
  private profileData: ProfileData;
  private isRecording: boolean = false;
  private samplingInterval: number = 1; // ms
  private samplingTimer: number | null = null;
  private callStack: string[] = [];
  private startTimes: Map<string, number> = new Map();

  // Performance measurement
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.profileData = this.createEmptyProfile();
    this.initializePerformanceObserver();
  }

  /**
   * Start profiling session
   */
  startProfiling(): void {
    this.isRecording = true;
    this.profileData = this.createEmptyProfile();

    // Start sampling timer
    this.samplingTimer = window.setInterval(() => {
      this.takeSample();
    }, this.samplingInterval);
  }

  /**
   * Stop profiling and return collected data
   */
  stopProfiling(): ProfileData {
    this.isRecording = false;

    if (this.samplingTimer !== null) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }

    // Analyze collected data
    this.analyzeProfiles();

    return this.profileData;
  }

  /**
   * Record function entry
   */
  enterFunction(functionName: string, args: any[]): void {
    if (!this.isRecording) return;

    // Record call stack
    this.callStack.push(functionName);

    // Record start time
    this.startTimes.set(functionName, performance.now());

    // Update call graph
    if (this.callStack.length > 1) {
      const caller = this.callStack[this.callStack.length - 2];
      this.updateCallGraph(caller, functionName);
    }

    // Type profiling
    this.profileArgumentTypes(functionName, args);
  }

  /**
   * Record function exit
   */
  exitFunction(functionName: string, returnValue: any): void {
    if (!this.isRecording) return;

    // Calculate execution time
    const startTime = this.startTimes.get(functionName);
    if (startTime) {
      const executionTime = performance.now() - startTime;
      this.recordExecutionTime(functionName, executionTime);
      this.startTimes.delete(functionName);
    }

    // Update call stack
    const index = this.callStack.lastIndexOf(functionName);
    if (index >= 0) {
      this.callStack.splice(index, 1);
    }

    // Profile return type
    this.profileReturnType(functionName, returnValue);
  }

  /**
   * Record branch execution
   */
  recordBranch(branchId: string, taken: boolean): void {
    if (!this.isRecording) return;

    let profile = this.profileData.branchProfiles.get(branchId);
    if (!profile) {
      profile = {
        branchId,
        takenCount: 0,
        notTakenCount: 0,
        predictability: 0,
        pattern: [],
      };
      this.profileData.branchProfiles.set(branchId, profile);
    }

    // Update counts
    if (taken) {
      profile.takenCount++;
    } else {
      profile.notTakenCount++;
    }

    // Record pattern
    profile.pattern.push(taken ? 1 : 0);
    if (profile.pattern.length > 32) {
      profile.pattern.shift();
    }

    // Calculate predictability
    const total = profile.takenCount + profile.notTakenCount;
    const ratio = profile.takenCount / total;
    profile.predictability = Math.max(ratio, 1 - ratio);
  }

  /**
   * Record memory access pattern
   */
  recordMemoryAccess(address: number, size: number, isWrite: boolean): void {
    if (!this.isRecording) return;

    // This would track memory access patterns in a real implementation
    // For now, we simulate pattern detection
  }

  /**
   * Record loop iteration
   */
  recordLoopIteration(loopId: string, iterationCount: number): void {
    if (!this.isRecording) return;

    const key = `loop_${loopId}`;
    let profile = this.profileData.executionProfiles.get(key);

    if (!profile) {
      profile = {
        functionName: key,
        executionCount: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Number.MAX_VALUE,
        maxTime: 0,
        lastExecutionTime: 0,
        samples: [],
      };
      this.profileData.executionProfiles.set(key, profile);
    }

    profile.samples.push(iterationCount);
    profile.executionCount++;
  }

  /**
   * Get optimization hints based on profile
   */
  getOptimizationHints(): OptimizationHints {
    const hints: OptimizationHints = {
      hotFunctions: this.identifyHotFunctions(),
      coldFunctions: this.identifyColdFunctions(),
      inlineCandidates: this.identifyInlineCandidates(),
      branchHints: this.generateBranchHints(),
      typeSpecializations: this.identifyTypeSpecializations(),
      loopOptimizations: this.identifyLoopOptimizations(),
      memoryOptimizations: this.identifyMemoryOptimizations(),
    };

    return hints;
  }

  /**
   * Export profile data for offline analysis
   */
  exportProfile(): string {
    const exportData = {
      version: this.profileData.version,
      timestamp: this.profileData.timestamp,
      executionProfiles: Array.from(this.profileData.executionProfiles.entries()),
      typeProfiles: Array.from(this.profileData.typeProfiles.entries()),
      branchProfiles: Array.from(this.profileData.branchProfiles.entries()),
      memoryProfiles: Array.from(this.profileData.memoryProfiles.entries()),
      callGraph: {
        nodes: Array.from(this.profileData.callGraph.nodes.entries()),
        edges: Array.from(this.profileData.callGraph.edges.entries()),
      },
      hotPaths: this.profileData.hotPaths,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import profile data
   */
  importProfile(data: string): void {
    const importData = JSON.parse(data);

    this.profileData = {
      version: importData.version,
      timestamp: importData.timestamp,
      executionProfiles: new Map(importData.executionProfiles),
      typeProfiles: new Map(importData.typeProfiles),
      branchProfiles: new Map(importData.branchProfiles),
      memoryProfiles: new Map(importData.memoryProfiles),
      callGraph: {
        nodes: new Map(importData.callGraph.nodes),
        edges: new Map(importData.callGraph.edges),
        hotCallChains: [],
      },
      hotPaths: importData.hotPaths,
    };
  }

  // Private methods

  private createEmptyProfile(): ProfileData {
    return {
      version: 1,
      timestamp: Date.now(),
      executionProfiles: new Map(),
      typeProfiles: new Map(),
      branchProfiles: new Map(),
      memoryProfiles: new Map(),
      callGraph: {
        nodes: new Map(),
        edges: new Map(),
        hotCallChains: [],
      },
      hotPaths: [],
    };
  }

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'function') {
            this.processFunctionEntry(entry);
          }
        }
      });

      // Observe function entries if supported
      try {
        // 'function' is not a valid entryType, use 'measure' or 'navigation' instead
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported:', e.message);
      }
    }
  }

  private takeSample(): void {
    // Sample current call stack
    if (this.callStack.length > 0) {
      const currentFunction = this.callStack[this.callStack.length - 1];
      const profile = this.profileData.executionProfiles.get(currentFunction);

      if (profile) {
        profile.samples.push(1); // Sampling hit
      }
    }
  }

  private recordExecutionTime(functionName: string, time: number): void {
    let profile = this.profileData.executionProfiles.get(functionName);

    if (!profile) {
      profile = {
        functionName,
        executionCount: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Number.MAX_VALUE,
        maxTime: 0,
        lastExecutionTime: 0,
        samples: [],
      };
      this.profileData.executionProfiles.set(functionName, profile);
    }

    profile.executionCount++;
    profile.totalTime += time;
    profile.avgTime = profile.totalTime / profile.executionCount;
    profile.minTime = Math.min(profile.minTime, time);
    profile.maxTime = Math.max(profile.maxTime, time);
    profile.lastExecutionTime = time;
  }

  private updateCallGraph(caller: string, callee: string): void {
    const graph = this.profileData.callGraph;

    // Update nodes
    if (!graph.nodes.has(caller)) {
      graph.nodes.set(caller, {
        functionName: caller,
        selfTime: 0,
        totalTime: 0,
        callCount: 0,
        callers: new Set(),
        callees: new Set(),
      });
    }

    if (!graph.nodes.has(callee)) {
      graph.nodes.set(callee, {
        functionName: callee,
        selfTime: 0,
        totalTime: 0,
        callCount: 0,
        callers: new Set(),
        callees: new Set(),
      });
    }

    const callerNode = graph.nodes.get(caller)!;
    const calleeNode = graph.nodes.get(callee)!;

    callerNode.callees.add(callee);
    calleeNode.callers.add(caller);
    calleeNode.callCount++;

    // Update edges
    if (!graph.edges.has(caller)) {
      graph.edges.set(caller, []);
    }

    const edges = graph.edges.get(caller)!;
    let edge = edges.find(e => e.to === callee);

    if (!edge) {
      edge = { from: caller, to: callee, count: 0, avgTime: 0 };
      edges.push(edge);
    }

    edge.count++;
  }

  private profileArgumentTypes(functionName: string, args: any[]): void {
    args.forEach((arg, index) => {
      const key = `${functionName}_arg${index}`;
      this.profileType(key, arg);
    });
  }

  private profileReturnType(functionName: string, value: any): void {
    const key = `${functionName}_return`;
    this.profileType(key, value);
  }

  private profileType(key: string, value: any): void {
    let profile = this.profileData.typeProfiles.get(key);

    if (!profile) {
      profile = {
        variableName: key,
        observedTypes: new Map(),
        isMonomorphic: true,
        dominantType: null,
        stabilityScore: 1.0,
      };
      this.profileData.typeProfiles.set(key, profile);
    }

    const type = this.getDetailedType(value);
    const count = profile.observedTypes.get(type) || 0;
    profile.observedTypes.set(type, count + 1);

    // Update monomorphic status
    profile.isMonomorphic = profile.observedTypes.size === 1;

    // Find dominant type
    let maxCount = 0;
    let dominant = null;
    for (const [t, c] of profile.observedTypes) {
      if (c > maxCount) {
        maxCount = c;
        dominant = t;
      }
    }
    profile.dominantType = dominant;

    // Calculate stability score
    const total = Array.from(profile.observedTypes.values()).reduce((a, b) => a + b, 0);
    profile.stabilityScore = maxCount / total;
  }

  private getDetailedType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    if (type === 'object') {
      if (Array.isArray(value)) {
        return `array[${value.length}]`;
      }
      if (value.constructor) {
        return value.constructor.name;
      }
      return 'object';
    }

    if (type === 'number') {
      if (Number.isInteger(value)) {
        return 'integer';
      }
      return 'float';
    }

    return type;
  }

  private analyzeProfiles(): void {
    // Identify hot paths
    this.identifyHotPaths();

    // Analyze call chains
    this.analyzeCallChains();

    // Calculate function self times
    this.calculateSelfTimes();
  }

  private identifyHotPaths(): void {
    const paths: Map<string, HotPath> = new Map();

    // Build paths from call graph
    for (const [func, profile] of this.profileData.executionProfiles) {
      if (profile.executionCount > 100) {
        // Trace hot call paths
        const path = this.traceCallPath(func);
        const pathKey = path.join(' -> ');

        if (!paths.has(pathKey)) {
          paths.set(pathKey, {
            functions: path,
            executionCount: 0,
            totalTime: 0,
            percentageOfTotal: 0,
          });
        }

        const hotPath = paths.get(pathKey)!;
        hotPath.executionCount += profile.executionCount;
        hotPath.totalTime += profile.totalTime;
      }
    }

    // Calculate percentages and sort
    const totalTime = Array.from(this.profileData.executionProfiles.values()).reduce(
      (sum, p) => sum + p.totalTime,
      0
    );

    this.profileData.hotPaths = Array.from(paths.values())
      .map(path => ({
        ...path,
        percentageOfTotal: (path.totalTime / totalTime) * 100,
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10); // Top 10 hot paths
  }

  private traceCallPath(func: string): string[] {
    const path: string[] = [func];
    const node = this.profileData.callGraph.nodes.get(func);

    if (node && node.callers.size > 0) {
      // Find most frequent caller
      let maxCaller = '';
      let maxCount = 0;

      for (const caller of node.callers) {
        const edge = this.profileData.callGraph.edges.get(caller)?.find(e => e.to === func);

        if (edge && edge.count > maxCount) {
          maxCount = edge.count;
          maxCaller = caller;
        }
      }

      if (maxCaller) {
        path.unshift(...this.traceCallPath(maxCaller));
      }
    }

    return path;
  }

  private analyzeCallChains(): void {
    // Identify hot call chains for inlining
    const chains: string[][] = [];

    for (const [caller, edges] of this.profileData.callGraph.edges) {
      for (const edge of edges) {
        if (edge.count > 1000) {
          chains.push([caller, edge.to]);
        }
      }
    }

    this.profileData.callGraph.hotCallChains = chains;
  }

  private calculateSelfTimes(): void {
    // Calculate self time for each function
    for (const [func, node] of this.profileData.callGraph.nodes) {
      const profile = this.profileData.executionProfiles.get(func);

      if (profile) {
        node.totalTime = profile.totalTime;

        // Subtract callee times
        let calleeTime = 0;
        for (const callee of node.callees) {
          const calleeProfile = this.profileData.executionProfiles.get(callee);
          if (calleeProfile) {
            calleeTime += calleeProfile.totalTime;
          }
        }

        node.selfTime = Math.max(0, node.totalTime - calleeTime);
      }
    }
  }

  private identifyHotFunctions(): Set<string> {
    const hot = new Set<string>();
    const threshold = this.calculateHotThreshold();

    for (const [func, profile] of this.profileData.executionProfiles) {
      if (profile.totalTime > threshold) {
        hot.add(func);
      }
    }

    return hot;
  }

  private identifyColdFunctions(): Set<string> {
    const cold = new Set<string>();

    for (const [func, profile] of this.profileData.executionProfiles) {
      if (profile.executionCount < 10) {
        cold.add(func);
      }
    }

    return cold;
  }

  private identifyInlineCandidates(): Map<string, string[]> {
    const candidates = new Map<string, string[]>();

    for (const chain of this.profileData.callGraph.hotCallChains) {
      if (chain.length === 2) {
        const [caller, callee] = chain;

        if (!candidates.has(caller)) {
          candidates.set(caller, []);
        }

        candidates.get(caller)!.push(callee);
      }
    }

    return candidates;
  }

  private generateBranchHints(): Map<string, BranchHint> {
    const hints = new Map<string, BranchHint>();

    for (const [id, profile] of this.profileData.branchProfiles) {
      if (profile.predictability > 0.95) {
        hints.set(id, {
          likely: profile.takenCount > profile.notTakenCount,
          confidence: profile.predictability,
        });
      }
    }

    return hints;
  }

  private identifyTypeSpecializations(): Map<string, string> {
    const specializations = new Map<string, string>();

    for (const [var_name, profile] of this.profileData.typeProfiles) {
      if (profile.isMonomorphic || profile.stabilityScore > 0.9) {
        specializations.set(var_name, profile.dominantType!);
      }
    }

    return specializations;
  }

  private identifyLoopOptimizations(): LoopOptimizationHints[] {
    const hints: LoopOptimizationHints[] = [];

    for (const [key, profile] of this.profileData.executionProfiles) {
      if (key.startsWith('loop_')) {
        const avgIterations = profile.samples.reduce((a, b) => a + b, 0) / profile.samples.length;

        hints.push({
          loopId: key.replace('loop_', ''),
          avgIterations,
          shouldUnroll: avgIterations < 10 && avgIterations > 0,
          shouldVectorize: avgIterations > 100,
        });
      }
    }

    return hints;
  }

  private identifyMemoryOptimizations(): MemoryOptimizationHints {
    // Analyze memory profiles
    const sequential = Array.from(this.profileData.memoryProfiles.values()).filter(
      p => p.accessPattern === 'sequential'
    );

    return {
      prefetchCandidates: sequential.map(p => p.accessPattern),
      cacheOptimizations: [],
    };
  }

  private calculateHotThreshold(): number {
    const times = Array.from(this.profileData.executionProfiles.values())
      .map(p => p.totalTime)
      .sort((a, b) => b - a);

    // Hot threshold is top 10% of execution time
    const index = Math.floor(times.length * 0.1);
    return times[index] || 0;
  }

  private processFunctionEntry(entry: PerformanceEntry): void {
    // Process performance entry if available
  }
}

// Type definitions for optimization hints

interface OptimizationHints {
  hotFunctions: Set<string>;
  coldFunctions: Set<string>;
  inlineCandidates: Map<string, string[]>;
  branchHints: Map<string, BranchHint>;
  typeSpecializations: Map<string, string>;
  loopOptimizations: LoopOptimizationHints[];
  memoryOptimizations: MemoryOptimizationHints;
}

interface BranchHint {
  likely: boolean;
  confidence: number;
}

interface LoopOptimizationHints {
  loopId: string;
  avgIterations: number;
  shouldUnroll: boolean;
  shouldVectorize: boolean;
}

interface MemoryOptimizationHints {
  prefetchCandidates: string[];
  cacheOptimizations: string[];
}
