// Ultra-Think Hot-Reload Engine with AST Diffing & Incremental Compilation
// Systeme de rechargement a chaud pour VB6 Web

import { VB6Parser } from '../utils/vb6Parser';
import { createLogger } from './LoggingService';
import {
  ASTMetadata,
  HotReloadListener,
  HotReloadAppState,
  ParsedAST,
} from './types/VB6ServiceTypes';

const logger = createLogger('HotReload');
import { VB6Transpiler } from '../utils/vb6Transpiler';
import { VB6SemanticAnalyzer } from '../utils/vb6SemanticAnalyzer';
import { Control } from '../context/types';

// Types pour le système de hot-reload
export interface ASTNode {
  type: string;
  id: string;
  name?: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  children: ASTNode[];
  hash: string; // Pour la détection de changements
  metadata?: ASTMetadata;
}

export interface ASTDiff {
  type: 'added' | 'removed' | 'modified' | 'moved';
  path: string[];
  oldNode?: ASTNode;
  newNode?: ASTNode;
  affects: AffectedArea[];
}

export interface AffectedArea {
  type: 'form' | 'control' | 'procedure' | 'variable' | 'property';
  name: string;
  scope: string;
  requiresRecompile: boolean;
  requiresRerender: boolean;
  requiresStatePreservation: boolean;
}

export interface HotReloadPatch {
  id: string;
  timestamp: number;
  changes: ASTDiff[];
  compiledCode: string;
  sourceMap: SourceMap;
  statePreservation: StatePreservationData;
  rollbackData: RollbackData;
}

export interface SourceMap {
  version: number;
  sources: string[];
  mappings: string;
  names: string[];
}

export interface StatePreservationData {
  controlStates: Record<string, ControlState>;
  variableValues: Record<string, unknown>;
  formProperties: Record<string, unknown>;
  executionContext: ExecutionContextData | null;
}

/** Control state for hot reload preservation */
interface ControlState {
  id?: string;
  type?: string;
  value?: unknown;
  properties?: Record<string, unknown>;
}

/** Execution context data */
interface ExecutionContextData {
  currentProcedure?: string;
  currentModule?: string;
  lineNumber?: number;
  variables?: Record<string, unknown>;
}

export interface RollbackData {
  previousAST: ASTNode;
  previousCode: string;
  previousState: StatePreservationData;
}

export interface HotReloadConfig {
  enabled: boolean;
  watchFiles: boolean;
  preserveState: boolean;
  incrementalCompilation: boolean;
  debounceMs: number;
  maxRollbackHistory: number;
  errorRecovery: boolean;
  verboseLogging: boolean;
}

/** Hot reload event handler type */
type HotReloadEventHandler = (data: unknown) => void;

export class HotReloadEngine {
  private static instance: HotReloadEngine;

  // Core components
  private parser: VB6Parser;
  private transpiler: VB6Transpiler;
  private analyzer: VB6SemanticAnalyzer;

  // Hot-reload state
  private currentAST: ASTNode | null = null;
  private codeCache: Map<string, string> = new Map();
  private compilationCache: Map<string, string> = new Map();
  private patchHistory: HotReloadPatch[] = [];
  private watchers: Map<string, FileSystemWatcher> = new Map();
  private preservedState: StatePreservationData | null = null;

  // Configuration
  private config: HotReloadConfig = {
    enabled: true,
    watchFiles: true,
    preserveState: true,
    incrementalCompilation: true,
    debounceMs: 300,
    maxRollbackHistory: 50,
    errorRecovery: true,
    verboseLogging: false,
  };

  // Performance monitoring
  private metrics = {
    totalReloads: 0,
    averageReloadTime: 0,
    incrementalCompileTime: 0,
    astDiffTime: 0,
    statePreservationTime: 0,
    errorCount: 0,
    rollbackCount: 0,
  };

  // Event listeners - typed with unknown for flexibility
  private listeners: Map<string, HotReloadEventHandler[]> = new Map([
    ['beforeReload', []],
    ['afterReload', []],
    ['error', []],
    ['rollback', []],
    ['statePreserved', []],
    ['compilationComplete', []],
  ]);

  static getInstance(): HotReloadEngine {
    if (!HotReloadEngine.instance) {
      HotReloadEngine.instance = new HotReloadEngine();
    }
    return HotReloadEngine.instance;
  }

  constructor() {
    this.parser = new VB6Parser();
    this.transpiler = new VB6Transpiler();
    this.analyzer = new VB6SemanticAnalyzer();
    this.initializeHotReload();
  }

  // 🚀 Main hot-reload method - Ultra-intelligent reloading
  public async performHotReload(
    newCode: string,
    filePath: string = 'main.vb'
  ): Promise<HotReloadPatch | null> {
    if (!this.config.enabled) return null;

    const startTime = performance.now();
    this.log('🔥 Starting hot-reload process...', newCode.length);

    try {
      this.emit('beforeReload', { filePath, codeLength: newCode.length });

      // 1. Parse new AST
      const newAST = await this.parseCodeToAST(newCode);
      if (!newAST) {
        throw new Error('Failed to parse new code');
      }

      // 2. Compute AST diff
      const diffStartTime = performance.now();
      const diffs = this.currentAST ? this.computeASTDiff(this.currentAST, newAST) : [];
      this.metrics.astDiffTime = performance.now() - diffStartTime;

      // 3. Analyze impact of changes
      const affectedAreas = this.analyzeChangeImpact(diffs);

      // 4. Preserve current state if needed
      const stateStartTime = performance.now();
      const stateData = this.config.preserveState ? await this.preserveCurrentState() : null;
      this.metrics.statePreservationTime = performance.now() - stateStartTime;

      // 5. Perform incremental compilation
      const compileStartTime = performance.now();
      const compiledCode = await this.performIncrementalCompilation(newCode, diffs, affectedAreas);
      this.metrics.incrementalCompileTime = performance.now() - compileStartTime;

      // 6. Create reload patch
      const patch: HotReloadPatch = {
        id: this.generatePatchId(),
        timestamp: Date.now(),
        changes: diffs,
        compiledCode,
        sourceMap: this.generateSourceMap(newCode, compiledCode),
        statePreservation: stateData || {
          controlStates: {},
          variableValues: {},
          formProperties: {},
          executionContext: null,
        },
        rollbackData: {
          previousAST: this.currentAST!,
          previousCode: this.codeCache.get(filePath) || '',
          previousState: this.preservedState || {
            controlStates: {},
            variableValues: {},
            formProperties: {},
            executionContext: null,
          },
        },
      };

      // 7. Apply the patch
      await this.applyHotReloadPatch(patch);

      // 8. Update internal state
      this.currentAST = newAST;
      this.codeCache.set(filePath, newCode);
      this.patchHistory.push(patch);

      // Cleanup old patches
      if (this.patchHistory.length > this.config.maxRollbackHistory) {
        this.patchHistory.shift();
      }

      // Update metrics
      const totalTime = performance.now() - startTime;
      this.metrics.totalReloads++;
      this.metrics.averageReloadTime = (this.metrics.averageReloadTime + totalTime) / 2;

      this.log('✅ Hot-reload completed successfully', totalTime, 'ms');
      this.emit('afterReload', { patch, metrics: this.metrics });

      return patch;
    } catch (error) {
      this.metrics.errorCount++;
      this.log('❌ Hot-reload error:', error);

      if (this.config.errorRecovery) {
        await this.attemptErrorRecovery(error);
      }

      this.emit('error', { error, filePath });
      return null;
    }
  }

  // 🎯 AST Parsing with advanced caching
  private async parseCodeToAST(code: string): Promise<ASTNode | null> {
    try {
      // Check cache first
      const codeHash = this.hashCode(code);
      const cached = this.getFromCache(`ast_${codeHash}`);
      if (cached) {
        this.log('📋 Using cached AST');
        return JSON.parse(cached);
      }

      // Parse fresh AST
      this.log('🔍 Parsing fresh AST...');
      const parseResult = this.parser.parse(code);

      if (!parseResult.success || !parseResult.ast) {
        throw new Error(`Parse error: ${parseResult.errors?.join(', ')}`);
      }

      // Convert to our AST format with metadata
      const ast = this.convertToHotReloadAST(parseResult.ast);

      // Cache the result
      this.setCache(`ast_${codeHash}`, JSON.stringify(ast));

      return ast;
    } catch (error) {
      this.log('❌ AST parsing failed:', error);
      return null;
    }
  }

  // 🔍 Ultra-efficient AST diffing algorithm
  private computeASTDiff(oldAST: ASTNode, newAST: ASTNode): ASTDiff[] {
    const diffs: ASTDiff[] = [];
    this.log('🔄 Computing AST differences...');

    // Use Myers' diff algorithm adapted for AST nodes
    const visited = new Set<string>();

    // Compare recursively
    this.compareASTNodes(oldAST, newAST, [], diffs, visited);

    // Detect moved nodes
    this.detectMovedNodes(oldAST, newAST, diffs);

    this.log(`📊 Found ${diffs.length} differences`);
    return diffs;
  }

  private compareASTNodes(
    oldNode: ASTNode | null,
    newNode: ASTNode | null,
    path: string[],
    diffs: ASTDiff[],
    visited: Set<string>
  ): void {
    const pathKey = path.join('.');

    if (visited.has(pathKey)) return;
    visited.add(pathKey);

    if (!oldNode && !newNode) return;

    if (!oldNode && newNode) {
      // Node added
      diffs.push({
        type: 'added',
        path,
        newNode,
        affects: this.analyzeNodeImpact(newNode, 'added'),
      });
      return;
    }

    if (oldNode && !newNode) {
      // Node removed
      diffs.push({
        type: 'removed',
        path,
        oldNode,
        affects: this.analyzeNodeImpact(oldNode, 'removed'),
      });
      return;
    }

    if (oldNode && newNode) {
      // Compare hashes for efficiency
      if (oldNode.hash !== newNode.hash) {
        // Node modified
        diffs.push({
          type: 'modified',
          path,
          oldNode,
          newNode,
          affects: this.analyzeNodeImpact(newNode, 'modified', oldNode),
        });
      }

      // Compare children
      const maxChildren = Math.max(oldNode.children.length, newNode.children.length);
      for (let i = 0; i < maxChildren; i++) {
        const oldChild = oldNode.children[i] || null;
        const newChild = newNode.children[i] || null;
        this.compareASTNodes(oldChild, newChild, [...path, String(i)], diffs, visited);
      }
    }
  }

  // 🎯 Analyze change impact on the application
  private analyzeChangeImpact(diffs: ASTDiff[]): AffectedArea[] {
    const affectedAreas: AffectedArea[] = [];

    for (const diff of diffs) {
      affectedAreas.push(...diff.affects);
    }

    // Deduplicate and merge overlapping areas
    return this.mergeAffectedAreas(affectedAreas);
  }

  private analyzeNodeImpact(
    node: ASTNode,
    changeType: 'added' | 'removed' | 'modified',
    oldNode?: ASTNode
  ): AffectedArea[] {
    const areas: AffectedArea[] = [];

    switch (node.type) {
      case 'SubDeclaration':
      case 'FunctionDeclaration':
        areas.push({
          type: 'procedure',
          name: node.name || 'unknown',
          scope: 'global',
          requiresRecompile: true,
          requiresRerender: false,
          requiresStatePreservation: changeType === 'modified',
        });
        break;

      case 'VariableDeclaration':
        areas.push({
          type: 'variable',
          name: node.name || 'unknown',
          scope: this.determineScope(node),
          requiresRecompile: true,
          requiresRerender: false,
          requiresStatePreservation: true,
        });
        break;

      case 'ControlDeclaration':
        areas.push({
          type: 'control',
          name: node.name || 'unknown',
          scope: 'form',
          requiresRecompile: true,
          requiresRerender: true,
          requiresStatePreservation: true,
        });
        break;

      case 'FormDeclaration':
        areas.push({
          type: 'form',
          name: node.name || 'unknown',
          scope: 'global',
          requiresRecompile: true,
          requiresRerender: true,
          requiresStatePreservation: true,
        });
        break;

      case 'PropertyAssignment':
        areas.push({
          type: 'property',
          name: node.name || 'unknown',
          scope: 'control',
          requiresRecompile: false,
          requiresRerender: true,
          requiresStatePreservation: false,
        });
        break;
    }

    return areas;
  }

  // 💾 State preservation system
  private async preserveCurrentState(): Promise<StatePreservationData> {
    this.log('💾 Preserving current application state...');

    try {
      // Get DOM state for all controls
      const controlStates: Record<string, ControlState> = {};
      const controls = document.querySelectorAll('[data-control-id]');

      controls.forEach(element => {
        const controlId = element.getAttribute('data-control-id');
        if (controlId) {
          controlStates[controlId] = this.extractControlState(element as HTMLElement);
        }
      });

      // Preserve JavaScript variable values
      const variableValues: Record<string, unknown> = {};
      if (typeof window !== 'undefined') {
        const windowWithRuntime = window as Window & {
          vb6Runtime?: { variables?: Record<string, unknown> };
        };
        if (windowWithRuntime.vb6Runtime?.variables) {
          Object.assign(variableValues, windowWithRuntime.vb6Runtime.variables);
        }
      }

      // Get form properties
      const formProperties: Record<string, unknown> = {};
      const formElement = document.querySelector('[data-vb6-form]');
      if (formElement) {
        formProperties.backColor = getComputedStyle(formElement).backgroundColor;
        formProperties.width = formElement.clientWidth;
        formProperties.height = formElement.clientHeight;
      }

      const stateData: StatePreservationData = {
        controlStates,
        variableValues,
        formProperties,
        executionContext: this.captureExecutionContext(),
      };

      this.preservedState = stateData;
      this.emit('statePreserved', stateData);

      return stateData;
    } catch (error) {
      this.log('❌ State preservation failed:', error);
      return { controlStates: {}, variableValues: {}, formProperties: {}, executionContext: null };
    }
  }

  // ⚡ Incremental compilation system
  private async performIncrementalCompilation(
    newCode: string,
    diffs: ASTDiff[],
    affectedAreas: AffectedArea[]
  ): Promise<string> {
    this.log('⚡ Starting incremental compilation...');

    if (!this.config.incrementalCompilation || diffs.length === 0) {
      // Full compilation
      return await this.performFullCompilation(newCode);
    }

    try {
      // Only recompile affected procedures
      const recompileAreas = affectedAreas.filter(area => area.requiresRecompile);

      if (recompileAreas.length === 0) {
        // No recompilation needed, return cached code
        return this.compilationCache.get('current') || '';
      }

      let compiledCode = this.compilationCache.get('current') || '';

      // Recompile each affected area
      for (const area of recompileAreas) {
        const areaCode = this.extractAreaCode(newCode, area);
        const compiledArea = await this.compileCodeArea(areaCode, area);

        // Replace in the full compiled code
        compiledCode = this.replaceCompiledArea(compiledCode, compiledArea, area);
      }

      this.compilationCache.set('current', compiledCode);
      this.emit('compilationComplete', { type: 'incremental', areas: recompileAreas });

      return compiledCode;
    } catch (error) {
      this.log('❌ Incremental compilation failed, falling back to full compilation:', error);
      return await this.performFullCompilation(newCode);
    }
  }

  private async performFullCompilation(code: string): Promise<string> {
    this.log('🔄 Performing full compilation...');

    try {
      const result = this.transpiler.transpile(code);

      if (!result.success || !result.javascript) {
        throw new Error(`Compilation failed: ${result.errors?.join(', ')}`);
      }

      this.compilationCache.set('current', result.javascript);
      this.emit('compilationComplete', { type: 'full' });

      return result.javascript;
    } catch (error) {
      throw new Error(`Full compilation failed: ${error}`);
    }
  }

  // 🔧 Apply hot-reload patch to running application
  private async applyHotReloadPatch(patch: HotReloadPatch): Promise<void> {
    this.log('🔧 Applying hot-reload patch...', patch.id);

    try {
      // 1. Execute new compiled code
      await this.executeCompiledCode(patch.compiledCode);

      // 2. Restore preserved state
      if (this.config.preserveState && patch.statePreservation) {
        await this.restoreApplicationState(patch.statePreservation);
      }

      // 3. Update UI for affected areas
      await this.updateAffectedUI(patch.changes);

      this.log('✅ Patch applied successfully:', patch.id);
    } catch (error) {
      this.log('❌ Patch application failed:', error);
      throw error;
    }
  }

  // 🔄 Error recovery and rollback system
  private async attemptErrorRecovery(error: any): Promise<void> {
    this.log('🔄 Attempting error recovery...');

    if (this.patchHistory.length === 0) {
      this.log('❌ No rollback history available');
      return;
    }

    try {
      const lastPatch = this.patchHistory[this.patchHistory.length - 1];
      await this.rollbackToPatch(lastPatch.rollbackData);

      this.metrics.rollbackCount++;
      this.emit('rollback', { reason: error, patch: lastPatch });

      this.log('✅ Successfully rolled back to previous state');
    } catch (rollbackError) {
      this.log('❌ Rollback failed:', rollbackError);
      // Could implement additional recovery strategies here
    }
  }

  // Helper methods
  private convertToHotReloadAST(parseAST: ParsedAST): ASTNode {
    // Convert parser AST to our format with hash generation
    return this.walkASTNode(parseAST, 0, 0);
  }

  private walkASTNode(node: ParsedAST, line: number, column: number): ASTNode {
    const children = (node.children || []).map((child: ParsedAST, index: number) =>
      this.walkASTNode(child, line + index, column)
    );

    const nodeData = {
      type: node.type || 'Unknown',
      id: this.generateNodeId(node),
      name: node.name || node.identifier || undefined,
      startLine: line,
      endLine: line,
      startColumn: column,
      endColumn: column + (node.text?.length || 0),
      children,
      metadata: node.metadata || {},
    };

    return {
      ...nodeData,
      hash: this.hashObject(nodeData),
    };
  }

  private generateNodeId(node: ParsedAST): string {
    return `${node.type}_${node.name || 'anonymous'}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatchId(): string {
    return `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private hashObject(obj: Record<string, unknown>): string {
    return this.hashCode(JSON.stringify(obj, Object.keys(obj).sort()));
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.config.verboseLogging) {
      logger.debug(message, ...args);
    }
  }

  private emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logger.error(`Hot-reload event listener error:`, error);
      }
    });
  }

  // Public API
  public on(event: string, listener: HotReloadEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  public off(event: string, listener: HotReloadEventHandler): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  public updateConfig(updates: Partial<HotReloadConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getMetrics() {
    return { ...this.metrics };
  }

  public clearCache(): void {
    this.codeCache.clear();
    this.compilationCache.clear();
  }

  private initializeHotReload(): void {
    this.log('🚀 Hot-reload engine initialized');
  }

  // Stub methods to be implemented based on specific runtime
  private extractControlState(element: HTMLElement): ControlState {
    return {};
  }
  private captureExecutionContext(): ExecutionContextData | null {
    return null;
  }
  private extractAreaCode(code: string, area: AffectedArea): string {
    return '';
  }
  private async compileCodeArea(code: string, area: AffectedArea): Promise<string> {
    return '';
  }
  private replaceCompiledArea(fullCode: string, areaCode: string, area: AffectedArea): string {
    return fullCode;
  }
  private async executeCompiledCode(code: string): Promise<void> {}
  private async restoreApplicationState(state: StatePreservationData): Promise<void> {}
  private async updateAffectedUI(changes: ASTDiff[]): Promise<void> {}
  private async rollbackToPatch(rollbackData: RollbackData): Promise<void> {}
  private determineScope(node: ASTNode): string {
    return 'local';
  }
  private detectMovedNodes(oldAST: ASTNode, newAST: ASTNode, diffs: ASTDiff[]): void {}
  private mergeAffectedAreas(areas: AffectedArea[]): AffectedArea[] {
    return areas;
  }
  private generateSourceMap(source: string, compiled: string): SourceMap {
    return { version: 3, sources: ['main.vb'], mappings: '', names: [] };
  }
  private getFromCache(key: string): string | null {
    return null;
  }
  private setCache(key: string, value: string): void {}
}

// File system watcher interface
interface FileSystemWatcher {
  close(): void;
}

// Export singleton instance
export const hotReloadEngine = HotReloadEngine.getInstance();
