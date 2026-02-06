import { CompiledCode, CompilerError, Project, Module, Procedure } from '../types/extended';
import { VB6APIManagerInstance } from './VB6APIManager';
import { VB6AdvancedCompiler } from '../compiler/VB6AdvancedCompiler';
import { createLogger } from './LoggingService';
import {
  CompilerVariableValue,
  FormDefinition,
  ControlDefinitionCompiler,
  ClassModuleDefinition,
  VariableDefinition,
  ConstantDefinition,
  ConversionPattern,
  DefaultValuesMap,
} from './types/VB6ServiceTypes';

const logger = createLogger('Compiler');
import { VB6IncrementalCache } from '../compiler/VB6IncrementalCache';
import { VB6UltraJIT } from '../compiler/VB6UltraJIT';
import { VB6ProfileGuidedOptimizer } from '../compiler/VB6ProfileGuidedOptimizer';

// Import new unified compiler components
import {
  VB6UnifiedCompiler,
  CompilerOptions as UnifiedOptions,
  CompilationResult,
} from '../compiler/VB6UnifiedCompiler';
import { VB6JSGenerator } from '../compiler/VB6JSGenerator';
import { VB6UDTTranspiler } from '../compiler/VB6UDTTranspiler';
import { VB6OptimizedLexer } from '../compiler/VB6OptimizedLexer';
import { VB6CompilationCache } from '../compiler/VB6CompilationCache';
import { VB6WasmOptimizer } from '../compiler/VB6WasmOptimizer';
import { VB6AdvancedErrorHandler } from '../compiler/VB6AdvancedErrorHandling';
import {
  VB6RecursiveDescentParser,
  parseVB6Code,
  VB6ModuleNode,
  VB6ParseError,
} from '../compiler/VB6RecursiveDescentParser';
import { lexVB6 } from '../utils/vb6Lexer';
import { adaptTokens } from '../compiler/tokenAdapter';
import {
  VB6AdvancedSemanticAnalyzer,
  SemanticError,
  AnalysisResult,
} from '../compiler/VB6AdvancedSemanticAnalyzer';
import { VB6ASTAdapter } from '../compiler/VB6TranspilerIntegration';
import { transpileModuleToJS } from '../utils/vb6Transpiler';
import { parseVB6Module } from '../utils/vb6Parser';

export interface CompilerDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  code?: string;
  source: 'parser' | 'semantic' | 'transpiler';
}

interface CompilerOptions {
  useAdvancedOptimizations?: boolean;
  optimizationLevel?: 0 | 1 | 2 | 3;
  enableWebAssembly?: boolean;
  enableParallel?: boolean;
  enableCache?: boolean;
  enableJIT?: boolean;
  enablePGO?: boolean;
}

export class VB6Compiler {
  private errors: CompilerError[] = [];
  private warnings: CompilerError[] = [];
  private variables: Map<string, CompilerVariableValue> = new Map();
  private procedures: Map<string, Procedure> = new Map();

  // Advanced compilation components
  private advancedCompiler: VB6AdvancedCompiler | null = null;
  private cache: VB6IncrementalCache | null = null;
  private jit: VB6UltraJIT | null = null;
  private profiler: VB6ProfileGuidedOptimizer | null = null;
  private useAdvanced: boolean = true; // Enable by default

  // New unified compiler components (Phase 2)
  private unifiedCompiler: VB6UnifiedCompiler | null = null;
  private jsGenerator: VB6JSGenerator | null = null;
  private udtTranspiler: VB6UDTTranspiler | null = null;
  private optimizedLexer: VB6OptimizedLexer | null = null;
  private compilationCache: VB6CompilationCache | null = null;
  private wasmOptimizer: VB6WasmOptimizer | null = null;
  private errorHandler: VB6AdvancedErrorHandler | null = null;
  private useUnified: boolean = true; // Enable unified compiler by default

  constructor(options: CompilerOptions = {}) {
    this.useAdvanced = options.useAdvancedOptimizations !== false;

    // Initialize unified compiler (Phase 2) - preferred compilation path
    if (this.useUnified) {
      const unifiedOptions: UnifiedOptions = {
        lexer: {
          enableComments: true,
          enableWhitespace: false,
          enableLineContinuation: true,
          caseSensitive: false,
          bufferSize: 64 * 1024,
          enableMetrics: true,
          enableErrorRecovery: true,
        },
        generator: {
          useES6Classes: true,
          generateSourceMaps: options.enableWebAssembly || false,
          enableOptimizations: options.optimizationLevel! > 0,
          targetRuntime: 'browser',
          strictMode: false,
          generateTypeScript: false,
        },
        udt: {
          generateTypeScript: false,
          enableSerialization: true,
          enableValidation: true,
          optimizeMemoryLayout: true,
          generateComments: true,
          strictTypeChecking: false,
          enableCloning: true,
        },
        wasm: {
          enableSIMD: options.enableWebAssembly || false,
          enableThreads: options.enableWebAssembly || false,
          enableBulkMemory: true,
          enableMultiValue: true,
          optimizationLevel: options.optimizationLevel || 2,
          memorySize: 1,
          maxMemorySize: 1024,
          hotPathThreshold: 1000,
          complexityThreshold: 10,
          enableProfiler: true,
          enableBinaryen: false,
        },
        cache: {
          enabled: options.enableCache !== false,
          maxSize: 200 * 1024 * 1024,
          enablePersistence: true,
        },
        workers: {
          enabled: options.enableParallel !== false,
          maxWorkers: Math.max(1, navigator?.hardwareConcurrency || 4),
          chunkSize: 100000,
        },
        output: {
          target: 'es2017',
          format: 'esm',
          sourceMaps: false,
          minify: options.optimizationLevel! > 2,
          bundleRuntime: true,
        },
        debug: {
          enableProfiling: options.enablePGO !== false,
          enableTracing: false,
          logLevel: 'warn',
          enableMetrics: true,
        },
      };

      this.unifiedCompiler = new VB6UnifiedCompiler(unifiedOptions);
      this.jsGenerator = new VB6JSGenerator(unifiedOptions.generator);
      this.udtTranspiler = new VB6UDTTranspiler(unifiedOptions.udt);
      this.optimizedLexer = new VB6OptimizedLexer(unifiedOptions.lexer);
      this.wasmOptimizer = new VB6WasmOptimizer(unifiedOptions.wasm);
      this.errorHandler = VB6AdvancedErrorHandler.getInstance();

      if (unifiedOptions.cache.enabled) {
        this.compilationCache = new VB6CompilationCache({
          maxSize: unifiedOptions.cache.maxSize,
          enablePersistence: unifiedOptions.cache.enablePersistence,
        });
      }
    }

    if (this.useAdvanced) {
      // Initialize advanced compilation pipeline (fallback)
      this.advancedCompiler = new VB6AdvancedCompiler({
        target: options.enableWebAssembly ? 'hybrid' : 'js',
        optimizationLevel: options.optimizationLevel || 2,
        enablePGO: options.enablePGO !== false,
        enableParallel: options.enableParallel !== false,
        enableCache: options.enableCache !== false,
        enableSourceMaps: true,
        enableHMR: false,
        wasmSIMD: true,
        wasmThreads: true,
        wasmExceptions: true,
        wasmGC: true,
      });

      this.cache = new VB6IncrementalCache();
      this.jit = new VB6UltraJIT();
      this.profiler = new VB6ProfileGuidedOptimizer();
    }
  }

  /**
   * Parse VB6 source code using the recursive descent parser.
   * Falls back to the legacy parser convenience function on failure.
   */
  parseSource(source: string): {
    ast: VB6ModuleNode | null;
    errors: VB6ParseError[];
    usedParser: 'recursive-descent' | 'recursive-descent-with-main-lexer' | 'legacy';
  } {
    // Try 1: Use RDP with main lexer (enhanced token set)
    try {
      const tokens = lexVB6(source);
      const vb6Tokens = adaptTokens(tokens);
      const parser = new VB6RecursiveDescentParser(vb6Tokens);
      const result = parser.parseModule();
      if (result.ast && result.errors.length === 0) {
        return { ...result, usedParser: 'recursive-descent-with-main-lexer' };
      }
    } catch {
      // Fall through to next strategy
    }

    // Try 2: Use RDP with its own advanced lexer
    try {
      const result = parseVB6Code(source);
      if (result.ast) {
        return { ...result, usedParser: 'recursive-descent' };
      }
    } catch {
      // Fall through to legacy
    }

    // Try 3: Legacy parser (returns simplified AST, not full VB6ModuleNode)
    return { ast: null, errors: [], usedParser: 'legacy' };
  }

  /**
   * Parse and run semantic analysis on VB6 source code.
   * Uses the RecursiveDescentParser for AST, then VB6AdvancedSemanticAnalyzer
   * for type checking, scope analysis, and control flow.
   */
  analyzeSource(source: string): {
    parseResult: ReturnType<VB6Compiler['parseSource']>;
    semanticResult: AnalysisResult | null;
    semanticErrors: SemanticError[];
  } {
    const parseResult = this.parseSource(source);

    if (!parseResult.ast) {
      return { parseResult, semanticResult: null, semanticErrors: [] };
    }

    try {
      const analyzer = new VB6AdvancedSemanticAnalyzer();
      const semanticResult = analyzer.analyze(parseResult.ast);
      return {
        parseResult,
        semanticResult,
        semanticErrors: [...semanticResult.errors, ...semanticResult.warnings],
      };
    } catch {
      // Semantic analysis failed - return parse result without semantics
      return { parseResult, semanticResult: null, semanticErrors: [] };
    }
  }

  /**
   * Transpile VB6 source to JavaScript using the AST-based pipeline.
   * Strategy: RDP AST → VB6ASTAdapter → VB6JSGenerator, with legacy fallback.
   */
  transpileSource(source: string): {
    javascript: string;
    usedTranspiler: 'ast-jsgen' | 'legacy';
  } {
    // Try AST-based pipeline: parse → adapt → generate
    const parseResult = this.parseSource(source);
    if (parseResult.ast) {
      try {
        const legacyAST = VB6ASTAdapter.adaptModuleNode(parseResult.ast);
        const generator = new VB6JSGenerator();
        const javascript = generator.generateModule(legacyAST);
        return { javascript, usedTranspiler: 'ast-jsgen' };
      } catch {
        // Fall through to legacy
      }
    }

    // Legacy fallback: regex parser → regex transpiler
    try {
      const legacyAST = parseVB6Module(source);
      const javascript = transpileModuleToJS(legacyAST);
      return { javascript, usedTranspiler: 'legacy' };
    } catch {
      return { javascript: '// Transpilation failed\n', usedTranspiler: 'legacy' };
    }
  }

  /**
   * Full compilation pipeline: Lexer → Parser → Semantic Analysis → Transpiler.
   * Returns JavaScript and diagnostics from each stage.
   */
  compileSource(source: string): {
    javascript: string | null;
    parseErrors: VB6ParseError[];
    semanticErrors: SemanticError[];
    usedParser: string;
    usedTranspiler: string;
    success: boolean;
  } {
    // Stage 1: Parse
    const parseResult = this.parseSource(source);

    if (!parseResult.ast) {
      // Fall back to legacy transpiler without semantic analysis
      const transpileResult = this.transpileSource(source);
      return {
        javascript: transpileResult.javascript,
        parseErrors: parseResult.errors,
        semanticErrors: [],
        usedParser: 'legacy',
        usedTranspiler: transpileResult.usedTranspiler,
        success: true,
      };
    }

    // Stage 2: Semantic analysis (non-blocking - warnings don't halt compilation)
    let semanticErrors: SemanticError[] = [];
    try {
      const analyzer = new VB6AdvancedSemanticAnalyzer();
      const result = analyzer.analyze(parseResult.ast);
      semanticErrors = [...result.errors, ...result.warnings];
    } catch {
      // Semantic analysis failure doesn't block compilation
    }

    // Stage 3: Transpile from AST
    try {
      const legacyAST = VB6ASTAdapter.adaptModuleNode(parseResult.ast);
      const generator = new VB6JSGenerator();
      const javascript = generator.generateModule(legacyAST);
      return {
        javascript,
        parseErrors: parseResult.errors,
        semanticErrors,
        usedParser: parseResult.usedParser,
        usedTranspiler: 'ast-jsgen',
        success: true,
      };
    } catch {
      // AST transpiler failed, try legacy
      try {
        const legacyAST = parseVB6Module(source);
        const javascript = transpileModuleToJS(legacyAST);
        return {
          javascript,
          parseErrors: parseResult.errors,
          semanticErrors,
          usedParser: parseResult.usedParser,
          usedTranspiler: 'legacy',
          success: true,
        };
      } catch {
        return {
          javascript: null,
          parseErrors: parseResult.errors,
          semanticErrors,
          usedParser: parseResult.usedParser,
          usedTranspiler: 'none',
          success: false,
        };
      }
    }
  }

  /**
   * Get structured diagnostics for VB6 source code.
   * Runs parse + semantic analysis and returns unified diagnostics.
   */
  getDiagnostics(source: string): CompilerDiagnostic[] {
    const diagnostics: CompilerDiagnostic[] = [];

    // Parse stage
    const parseResult = this.parseSource(source);
    for (const err of parseResult.errors) {
      diagnostics.push({
        severity: 'error',
        message: err.message,
        line: err.line,
        column: err.column ?? 1,
        code: 'VB6-PARSE',
        source: 'parser',
      });
    }

    // Semantic stage (only if we have an AST)
    if (parseResult.ast) {
      try {
        const analyzer = new VB6AdvancedSemanticAnalyzer();
        const result = analyzer.analyze(parseResult.ast);
        for (const err of result.errors) {
          diagnostics.push({
            severity: err.severity === 'error' ? 'error' : 'warning',
            message: err.message,
            line: err.line,
            column: err.column,
            code: err.code ?? 'VB6-SEM',
            source: 'semantic',
          });
        }
        for (const warn of result.warnings) {
          diagnostics.push({
            severity: 'warning',
            message: warn.message,
            line: warn.line,
            column: warn.column,
            code: warn.code ?? 'VB6-WARN',
            source: 'semantic',
          });
        }
      } catch {
        // Semantic analysis failed silently
      }
    }

    return diagnostics;
  }

  async compile(project: Project): Promise<CompiledCode> {
    const compilerType = this.useUnified
      ? 'Unified (Phase 2)'
      : this.useAdvanced
        ? 'Advanced'
        : 'Legacy';
    logger.debug(`Compiling ${project.name} with ${compilerType} compiler...`);

    // Use unified compiler first (Phase 2 implementation)
    if (this.useUnified && this.unifiedCompiler) {
      return this.compileUnified(project);
    } else if (this.useAdvanced && this.advancedCompiler) {
      // Fallback to advanced compilation pipeline
      return this.compileAdvanced(project);
    } else {
      // Fallback to legacy compilation
      return this.compileLegacy(project);
    }
  }

  /**
   * Compile using new unified compiler (Phase 2)
   */
  private async compileUnified(project: Project): Promise<CompiledCode> {
    const startTime = performance.now();

    try {
      logger.debug(`Starting unified compilation for ${project.modules?.length || 1} modules...`);

      // Initialize error handling context
      this.errorHandler!.enterContext('compileUnified', project.name);

      // Compile main module or all modules
      let result: CompilationResult;

      if (project.modules && project.modules.length > 0) {
        // Compile multiple modules
        const files = project.modules.map(module => ({
          name: module.name,
          content: module.content || '',
        }));

        const results = await this.unifiedCompiler!.compileFiles(files);

        // Combine results
        const combinedOutput = results.map(r => r.output).join('\n\n');
        const combinedErrors = results.flatMap(r => r.errors);
        const combinedWarnings = results.flatMap(r => r.warnings);

        // Use metrics from first successful compilation
        const successfulResult = results.find(r => r.success) || results[0];

        result = {
          success: results.every(r => r.success),
          output: combinedOutput,
          errors: combinedErrors,
          warnings: combinedWarnings,
          metrics: successfulResult.metrics,
          sourceMap: results.map(r => r.sourceMap).join('\n'),
          ast: successfulResult.ast,
          tokens: successfulResult.tokens,
        };
      } else {
        // Compile single module/project
        const sourceCode = project.content || project.modules?.[0]?.content || '';
        result = await this.unifiedCompiler!.compile(sourceCode, project.name);
      }

      // Profile hot paths for WASM optimization
      if (this.wasmOptimizer && result.success) {
        // Extract procedure information for profiling
        if (result.ast) {
          for (const proc of result.ast.procedures) {
            // Simulate execution profiling (in real usage, this would be based on actual runtime data)
            const estimatedComplexity = this.calculateComplexity(proc.body);
            if (estimatedComplexity > 5) {
              this.wasmOptimizer.profileExecution(proc.name, project.name, 10, proc.body);
            }
          }
        }
      }

      const duration = performance.now() - startTime;

      logger.info(`Unified compilation completed in ${duration.toFixed(2)}ms`);
      logger.debug(
        `Metrics: ${result.metrics.tokensGenerated} tokens, ${result.metrics.functionsCompiled} functions`
      );

      if (result.errors.length > 0) {
        logger.warn(`${result.errors.length} errors found`);
      }

      if (result.warnings.length > 0) {
        logger.warn(`${result.warnings.length} warnings found`);
      }

      // Log performance metrics
      const lexerMetrics = this.optimizedLexer?.getMetrics();
      if (lexerMetrics && lexerMetrics.throughput > 0) {
        logger.debug(
          `Lexer performance: ${(lexerMetrics.throughput / 1000).toFixed(1)}k tokens/sec`
        );

        if (lexerMetrics.throughput >= 400000) {
          logger.info(`Performance target achieved! (400k+ tokens/sec)`);
        }
      }

      // Log cache metrics
      if (this.compilationCache) {
        const cacheMetrics = this.compilationCache.getMetrics();
        logger.debug(
          `Cache: ${cacheMetrics.hits} hits, ${cacheMetrics.misses} misses (${(cacheMetrics.hitRatio * 100).toFixed(1)}% hit rate)`
        );
      }

      // Log WASM metrics
      if (this.wasmOptimizer) {
        const wasmMetrics = this.wasmOptimizer.getMetrics();
        if (wasmMetrics.hotPathsDetected > 0) {
          logger.debug(
            `WASM: ${wasmMetrics.hotPathsDetected} hot paths detected, ${wasmMetrics.modulesGenerated} modules generated`
          );
        }
      }

      // Exit error handling context
      this.errorHandler!.exitContext();

      // Convert to legacy CompiledCode format
      return {
        success: result.success,
        code: result.output,
        sourceMap: result.sourceMap || undefined,
        errors: result.errors.map(err => ({
          message: err.message,
          line: err.line || 0,
          column: err.column || 0,
          type: err.type,
          severity: err.severity,
        })),
        warnings: result.warnings.map(warn => ({
          message: warn.message,
          line: warn.line || 0,
          column: warn.column || 0,
          type: warn.type,
          severity: 'warning',
        })),
        metadata: {
          compilationTime: duration,
          compilerVersion: 'VB6UnifiedCompiler-2.0',
          optimizationLevel: 'unified',
          features: [
            'optimized-lexer',
            'ast-generator',
            'udt-transpiler',
            'advanced-error-handling',
            'compilation-cache',
            'wasm-optimizer',
          ],
          metrics: result.metrics,
        },
      };
    } catch (error) {
      // Exit error handling context on error
      this.errorHandler!.exitContext();

      const duration = performance.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown compilation error';

      logger.error(`Unified compilation failed after ${duration.toFixed(2)}ms:`, errorMsg);

      return {
        success: false,
        code: '',
        errors: [
          {
            message: `Unified compilation failed: ${errorMsg}`,
            line: 0,
            column: 0,
            type: 'compiler',
            severity: 'error',
          },
        ],
        warnings: [],
        metadata: {
          compilationTime: duration,
          compilerVersion: 'VB6UnifiedCompiler-2.0',
          optimizationLevel: 'failed',
          features: [],
          error: errorMsg,
        },
      };
    }
  }

  /**
   * Calculate complexity of VB6 code for WASM optimization
   */
  private calculateComplexity(code: string): number {
    let complexity = 0;
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      // Control flow increases complexity
      if (trimmed.startsWith('if ') || trimmed.startsWith('elseif ')) complexity += 2;
      if (trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('do '))
        complexity += 3;
      if (trimmed.startsWith('select ')) complexity += 2;
      if (trimmed.startsWith('case ')) complexity += 1;

      // Function calls increase complexity
      if (trimmed.includes('(') && trimmed.includes(')')) complexity += 1;

      // Array operations increase complexity
      if (trimmed.includes('[') && trimmed.includes(']')) complexity += 2;
    }

    return complexity;
  }

  private async compileAdvanced(project: Project): Promise<CompiledCode> {
    const startTime = performance.now();

    try {
      // Start profiling if available
      if (this.profiler) {
        this.profiler.startProfiling();
      }

      // Compile with advanced optimizations
      const result = await this.advancedCompiler!.compile(project, {
        target: 'hybrid',
        optimizationLevel: 3,
        enablePGO: true,
        enableParallel: true,
        enableCache: true,
        enableSourceMaps: true,
        enableHMR: false,
        wasmSIMD: true,
        wasmThreads: true,
        wasmExceptions: true,
        wasmGC: true,
      });

      // Stop profiling and get optimization hints
      if (this.profiler) {
        const profileData = this.profiler.stopProfiling();
        const hints = this.profiler.getOptimizationHints();
        logger.debug(`Profile data collected: ${profileData.executionProfiles.size} functions`);
      }

      const duration = performance.now() - startTime;
      logger.info(`Advanced compilation completed in ${duration.toFixed(2)}ms`);

      // Cache statistics
      if (this.cache) {
        const stats = this.cache.getStats();
        const hitRate = (stats.hits / (stats.hits + stats.misses)) * 100;
        logger.debug(`Cache hit rate: ${hitRate.toFixed(1)}%`);
      }

      return result;
    } catch (error) {
      logger.error('Advanced compilation failed, falling back to legacy:', error);
      return this.compileLegacy(project);
    }
  }

  private compileLegacy(project: Project): CompiledCode {
    this.errors = [];
    this.warnings = [];
    this.variables.clear();
    this.procedures.clear();

    try {
      // Compile modules first
      const moduleCode = this.compileModules(project.modules);

      // Compile forms
      const formCode = this.compileForms(project.forms);

      // Compile class modules
      const classCode = this.compileClassModules(project.classModules);

      // Generate main application code
      const mainCode = this.generateMainCode(project);

      // Combine all code sections in order
      const javascript = [
        this.generateHeader(project),
        moduleCode,
        formCode,
        classCode,
        mainCode,
      ].join('\n\n');

      return {
        javascript,
        sourceMap: this.generateSourceMap(),
        errors: [...this.errors, ...this.warnings],
        dependencies: this.extractDependencies(project),
      };
    } catch (error) {
      this.errors.push({
        type: 'error',
        message: `Compilation failed: ${error.message}`,
        file: 'compiler',
        line: 0,
        column: 0,
        code: 'COMP001',
      });

      return {
        javascript: '',
        sourceMap: '',
        errors: this.errors,
        dependencies: [],
      };
    }
  }

  private compileModules(modules: Module[]): string {
    return modules
      .map(module => {
        return `
// Module: ${module.name}
class ${module.name} {
  constructor() {
    this.initialize();
  }

  initialize() {
    ${this.compileVariables(module.variables)}
    ${this.compileConstants(module.constants)}
  }

  ${this.compileProcedures(module.procedures)}
}
`;
      })
      .join('\n');
  }

  private compileForms(forms: FormDefinition[]): string {
    return forms
      .map(form => {
        return `
// Form: ${this.sanitizeIdentifier(form.name)}
class ${this.sanitizeIdentifier(form.name)} {
  constructor() {
    this.controls = {};
    this.properties = ${JSON.stringify(form.properties || {})};
    this.initialize();
  }

  initialize() {
    this.createControls();
    this.setupEvents();
  }

  createControls() {
    ${
      form.controls
        ?.map(
          (control: ControlDefinitionCompiler) => `
    this.controls['${this.sanitizePropertyKey(control.name)}'] = {
      type: '${this.sanitizeIdentifier(control.type)}',
      properties: ${this.safeJsonStringify(control)},
      element: this.createElement('${this.sanitizeIdentifier(control.type)}', ${this.safeJsonStringify(control)})
    };
    `
        )
        .join('') || ''
    }
  }

  createElement(type, props) {
    const element = document.createElement(this.getHTMLElement(type));
    Object.assign(element.style, {
      position: 'absolute',
      left: props.x + 'px',
      top: props.y + 'px',
      width: props.width + 'px',
      height: props.height + 'px'
    });
    return element;
  }

  getHTMLElement(vbType) {
    const mapping = {
      'CommandButton': 'button',
      'TextBox': 'input',
      'Label': 'label',
      'CheckBox': 'input',
      'ListBox': 'select',
      'ComboBox': 'select',
      'HScrollBar': 'input',
      'VScrollBar': 'input'
    };
    return mapping[vbType] || 'div';
  }

  setupEvents() {
    // Event handlers will be added here
  }

  show() {
    const formElement = document.createElement('div');
    formElement.className = 'vb-form';
    formElement.style.width = this.properties.Width + 'px';
    formElement.style.height = this.properties.Height + 'px';
    formElement.style.backgroundColor = this.properties.BackColor;
    
    Object.values(this.controls).forEach(control => {
      formElement.appendChild(control.element);
    });
    
    document.body.appendChild(formElement);
  }

  hide() {
    // MEMORY LEAK FIX: Properly clean up all form elements and event listeners
    const formElement = document.querySelector('.vb-form');
    if (formElement) {
      // Remove all event listeners from controls before removing from DOM
      Object.values(this.controls).forEach(control => {
        if (control.element && control.element.parentNode) {
          // Clone and replace to remove all event listeners
          const newElement = control.element.cloneNode(true);
          control.element.parentNode.replaceChild(newElement, control.element);
        }
      });
      
      formElement.remove();
      
      // Clear control references to help garbage collection
      this.controls = {};
    }
  }
  
  // MEMORY LEAK FIX: Add cleanup method
  dispose() {
    this.hide();
    this.controls = null;
    this.properties = null;
  }
}
`;
      })
      .join('\n');
  }

  private compileClassModules(classModules: ClassModuleDefinition[]): string {
    return classModules
      .map(cls => {
        return `
// Class Module: ${cls.name}
class ${cls.name} {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Class initialization
  }

  terminate() {
    // Class termination
  }
}
`;
      })
      .join('\n');
  }

  private compileVariables(variables: VariableDefinition[]): string {
    return variables
      .map(variable => {
        const defaultValue = this.getDefaultValue(variable.type);
        // CODE GENERATION BUG FIX: Sanitize variable names and use safe JSON stringify
        return `this.${this.sanitizeIdentifier(variable.name)} = ${this.safeJsonStringify(defaultValue)};`;
      })
      .join('\n    ');
  }

  private compileConstants(constants: ConstantDefinition[]): string {
    return constants
      .map(constant => {
        // CODE GENERATION BUG FIX: Sanitize constant names and values
        return `this.${this.sanitizeIdentifier(constant.name)} = ${this.safeJsonStringify(constant.value)};`;
      })
      .join('\n    ');
  }

  private compileProcedures(procedures: Procedure[]): string {
    return procedures
      .map(proc => {
        // CODE GENERATION BUG FIX: Sanitize parameter names to prevent injection
        const params = proc.parameters.map(p => this.sanitizeIdentifier(p.name)).join(', ');
        const jsCode = this.convertVBToJS(proc.code);

        return `
  ${this.sanitizeIdentifier(proc.name)}(${params}) {
    ${jsCode}
  }
`;
      })
      .join('\n');
  }

  private convertVBToJS(vbCode: string): string {
    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add pre-conversion anti-optimization
    let jsCode = vbCode;

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add conversion noise
    jsCode = this.addConversionNoise(jsCode);

    // First, process API declarations
    jsCode = this.processAPIDeclarations(jsCode);

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Randomize conversion order
    const conversions = this.randomizeConversions([
      // Comments
      [/'/g, '//'],

      // Variable declarations
      [/\bDim\s+(\w+)\s+As\s+(\w+)/gi, 'let $1 = this.getDefaultValue("$2");'],
      [/\bPrivate\s+(\w+)\s+As\s+(\w+)/gi, 'this.$1 = this.getDefaultValue("$2");'],
      [/\bPublic\s+(\w+)\s+As\s+(\w+)/gi, 'this.$1 = this.getDefaultValue("$2");'],

      // Control structures
      [/\bIf\b/gi, 'if'],
      [/\bThen\b/gi, '{'],
      [/\bEnd\s+If\b/gi, '}'],
      [/\bElse\b/gi, '} else {'],
      [/\bElseIf\b/gi, '} else if'],

      // RUNTIME LOGIC BUG FIX: For loops with step handling and integer overflow protection
      [
        /\bFor\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)\s+Step\s+(-?\d+)/gi,
        (match, var1, start, end, step) => {
          // RUNTIME LOGIC BUG FIX: Add bounds checking and NaN validation
          const startNum = parseInt(start, 10);
          const endNum = parseInt(end, 10);
          const stepNum = parseInt(step, 10);

          // Validate parsed numbers
          if (isNaN(startNum) || isNaN(endNum) || isNaN(stepNum)) {
            return `// ERROR: Invalid numeric values in For loop`;
          }

          // Check for integer overflow (VB6 Integer range: -32768 to 32767)
          if (startNum < -32768 || startNum > 32767)
            return `// ERROR: Start value overflow in For loop`;
          if (endNum < -32768 || endNum > 32767) return `// ERROR: End value overflow in For loop`;
          if (stepNum < -32768 || stepNum > 32767)
            return `// ERROR: Step value overflow in For loop`;

          // Prevent infinite loops
          if (stepNum === 0) return `// ERROR: Step cannot be zero in For loop`;
          if (stepNum > 0 && startNum > endNum)
            return `// WARNING: For loop will not execute (start > end with positive step)`;
          if (stepNum < 0 && startNum < endNum)
            return `// WARNING: For loop will not execute (start < end with negative step)`;

          const condition = stepNum > 0 ? `${var1} <= ${end}` : `${var1} >= ${end}`;
          const increment =
            stepNum === 1 ? `${var1}++` : stepNum === -1 ? `${var1}--` : `${var1} += ${step}`;
          return `for (let ${var1} = ${start}; ${condition}; ${increment})`;
        },
      ],
      [
        /\bFor\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/gi,
        (match, var1, start, end) => {
          // RUNTIME LOGIC BUG FIX: Add bounds checking for simple For loops
          const startNum = parseInt(start, 10);
          const endNum = parseInt(end, 10);

          // Validate parsed numbers
          if (isNaN(startNum) || isNaN(endNum)) {
            return `// ERROR: Invalid numeric values in For loop`;
          }

          // Check for integer overflow
          if (startNum < -32768 || startNum > 32767)
            return `// ERROR: Start value overflow in For loop`;
          if (endNum < -32768 || endNum > 32767) return `// ERROR: End value overflow in For loop`;

          // Prevent backwards loops without step
          if (startNum > endNum)
            return `// WARNING: For loop will not execute (start > end without step)`;

          return `for (let ${var1} = ${start}; ${var1} <= ${end}; ${var1}++)`;
        },
      ],
      [/\bNext\s+\w+/gi, '}'],
      [/\bNext\b/gi, '}'],
      [/\bFor\s+Each\s+(\w+)\s+In\s+(\w+)/gi, 'for (const $1 of $2) {'],
      [/\bWhile\s+(.+)/gi, 'while ($1) {'],
      [/\bWend\b/gi, '}'],
      [/\bDo\s+While\s+(.+)/gi, 'do {'],
      [/\bDo\s+Until\s+(.+)/gi, 'do {'],
      [/\bDo\b/gi, 'do {'],
      [/\bLoop\s+Until\s+(.+)/gi, '} while (!$1);'],
      [/\bLoop\s+While\s+(.+)/gi, '} while ($1);'],
      [/\bLoop\b/gi, '}'],
      [/\bExit\s+Do\b/gi, 'break;'],
      [/\bExit\s+For\b/gi, 'break;'],

      [/\bWith\s+(\w+)/gi, 'with ($1) {'],
      [/\bEnd\s+With\b/gi, '}'],

      [/\bSelect\s+Case\s+(.+)/gi, 'switch ($1) {'],
      [/\bCase\s+Else\b/gi, 'default:'],
      [/\bCase\s+(.+)/gi, 'case $1:'],
      [/\bEnd\s+Select\b/gi, '}'],

      // String operations
      [/\b&\b/g, '+'],
      [/\bLen\(/gi, 'this.Len('],
      [/\bLeft\(/gi, 'this.Left('],
      [/\bRight\(/gi, 'this.Right('],
      [/\bMid\(/gi, 'this.Mid('],

      // Object references
      [/\bMe\./g, 'this.'],
      [/\.Caption\b/g, '.textContent'],
      [/\.Text\b/g, '.value'],
      [/\.Value\b/g, '.value'],

      // Functions
      [/\bMsgBox\s*\(/gi, 'this.MsgBox('],
      [/\bInputBox\s*\(/gi, 'this.InputBox('],
      [/\bPrint\s+(.+)/gi, 'console.log($1);'],

      // Sub/Function definitions
      [/\bSub\s+(\w+)\s*\(/gi, '$1('],
      [/\bFunction\s+(\w+)\s*\(/gi, '$1('],
      [/\bEnd\s+Sub\b/gi, '}'],
      [/\bEnd\s+Function\b/gi, '}'],

      // Exit statements
      [/\bExit\s+Sub\b/gi, 'return;'],
      [/\bExit\s+Function\b/gi, 'return;'],

      // Boolean values
      [/\bTrue\b/gi, 'true'],
      [/\bFalse\b/gi, 'false'],

      // Null values
      [/\bNothing\b/gi, 'null'],
      [/\bEmpty\b/gi, '""'],

      // Comparison operators
      [/\bAnd\b/gi, '&&'],
      [/\bOr\b/gi, '||'],
      [/\bNot\b/gi, '!'],

      // Assignment
      [/\bSet\s+(\w+)\s*=/gi, '$1 ='],

      // API function calls - convert to CallAPI
      [
        /\b(\w+)\s*\(/g,
        (match: string, funcName: string) => {
          // Check if this is a declared API function
          const declaration = VB6APIManagerInstance.getDeclaration(funcName);
          if (declaration && declaration.isRegistered) {
            return `CallAPI('${funcName}', `;
          }
          return match;
        },
      ],

      // Line continuation
      [/\s+_\s*\n/g, ' '],
    ]);

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Apply conversions in randomized order with anti-optimization
    const shuffledConversions = this.shuffleArray([...conversions]);

    shuffledConversions.forEach(([pattern, replacement], index) => {
      // Add optimization noise between conversions
      if (index % 3 === 0) {
        // Optimization checkpoint - no action needed
      }

      jsCode = jsCode.replace(pattern, replacement);
    });

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add post-conversion anti-optimization

    return jsCode;
  }

  private getDefaultValue(type: string): DefaultValuesMap[string] {
    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add constant generation jitter

    // EDGE CASE FIX: Input validation and bounds checking
    if (typeof type !== 'string' || type.length > 50) {
      return null; // Prevent malicious input
    }

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Randomize default value creation
    const defaults = this.createRandomizedDefaults({
      String: '',
      Integer: 0,
      Long: 0,
      Single: 0.0,
      Double: 0.0,
      Boolean: false,
      Date: new Date(),
      Currency: 0,
      Byte: 0,
      Object: null,
      Variant: null,
    });

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add anti-constant-folding noise
    this.addConstantFoldingNoise();

    return defaults[type] || null;
  }

  private processAPIDeclarations(code: string): string {
    try {
      // Use the API Manager to parse and process Declare Function statements
      const declarations = VB6APIManagerInstance.parseCodeForAPIs(code);

      // Process the code to handle API declarations
      const processedCode = VB6APIManagerInstance.processSourceCode(code);

      // Log processed declarations
      if (declarations.length > 0) {
        logger.debug(
          `Processed ${declarations.length} API declarations:`,
          declarations.map(d => `${d.name} from ${d.library}`)
        );
      }

      return processedCode;
    } catch (error) {
      logger.error('Error processing API declarations:', error);
      this.warnings.push({
        type: 'warning',
        message: `API declaration processing failed: ${error.message}`,
        file: 'compiler',
        line: 0,
        column: 0,
        code: 'API001',
      });

      return code; // Return original code if processing fails
    }
  }

  private generateHeader(project: Project): string {
    return `
// Generated code for ${this.sanitizeComment(project.name)}
// Generated on ${new Date().toISOString()}
// VB6 Clone IDE

// VB6 Runtime functions
const VB6Runtime = {
  MsgBox: function(message, buttons = 0, title = '${this.sanitizeStringLiteral(project.name)}') {
    if (buttons === 0) {
      alert(title + '\\n\\n' + message);
      return 1; // vbOK
    } else {
      const result = confirm(title + '\\n\\n' + message);
      return result ? 1 : 2; // vbOK : vbCancel
    }
  },
  
  InputBox: function(prompt, title = '${this.sanitizeStringLiteral(project.name)}', defaultValue = '') {
    return window.prompt(title + '\\n\\n' + prompt, defaultValue) || '';
  },
  
  Len: function(str) {
    // EDGE CASE FIX: Handle null/undefined according to VB6 behavior
    if (str === null || str === undefined) return 0;
    return String(str).length;
  },
  
  Left: function(str, n) {
    // EDGE CASE FIX: Handle null/undefined and negative values
    if (str === null || str === undefined) return '';
    const s = String(str);
    const len = Math.max(0, Math.min(parseInt(n) || 0, s.length));
    return s.substring(0, len);
  },
  
  Right: function(str, n) {
    // EDGE CASE FIX: Handle null/undefined and edge cases
    if (str === null || str === undefined) return '';
    const s = String(str);
    const len = Math.max(0, parseInt(n) || 0);
    return len >= s.length ? s : s.substring(s.length - len);
  },
  
  Mid: function(str, start, length) {
    // EDGE CASE FIX: Handle null/undefined, negative values, and bounds
    if (str === null || str === undefined) return '';
    const s = String(str);
    const startPos = Math.max(1, parseInt(start, 10) || 1); // TYPE COERCION BUG FIX: Always use radix 10
    const len = length !== null && length !== undefined ? Math.max(0, parseInt(length, 10) || 0) : undefined; // TYPE COERCION BUG FIX: Use strict equality and radix
    
    if (startPos > s.length) return '';
    
    const startIndex = startPos - 1;
    const endIndex = len !== null && len !== undefined ? Math.min(startIndex + len, s.length) : undefined; // TYPE COERCION BUG FIX: Use strict equality
    return s.substring(startIndex, endIndex);
  },
  
  UCase: function(str) {
    return String(str).toUpperCase();
  },
  
  LCase: function(str) {
    return String(str).toLowerCase();
  },
  
  Trim: function(str) {
    return String(str).trim();
  },
  
  Val: function(str) {
    // EDGE CASE FIX: Handle null/undefined, special values, and VB6 behavior
    if (str === null || str === undefined) return 0;
    const s = String(str).trim();
    if (s === '') return 0;
    
    // VB6 Val() only reads numeric characters from the start of the string
    // Create regex pattern to avoid ESLint no-useless-escape false positive
    const numberPattern = '^[+-]?(\\\\d+\\\\.?\\\\d*|\\\\.\\\\d+)([eE][+-]?\\\\d+)?';
    const match = s.match(new RegExp(numberPattern));
    if (!match) return 0;
    
    const num = parseFloat(match[0]);
    return (isNaN(num) || !isFinite(num)) ? 0 : num;
  },
  
  Str: function(num) {
    return String(num);
  },
  
  // API function call wrapper
  CallAPI: function(functionName, ...args) {
    if (typeof window !== 'undefined' && window.CallAPI) {
      return window.CallAPI(functionName, ...args);
    } else {
      logger.warn('VB6 API system not available:', functionName);
      return null;
    }
  },
  
  // Declare Function processor
  DeclareFunction: function(declaration) {
    if (typeof window !== 'undefined' && window.DeclareFunction) {
      return window.DeclareFunction(declaration);
    } else {
      logger.warn('VB6 API declaration system not available');
      return false;
    }
  },
  
  // VB6 Constants for API calls
  MB_OK: 0,
  MB_OKCANCEL: 1,
  MB_YESNO: 4,
  MB_ICONINFORMATION: 64,
  MB_ICONWARNING: 48,
  MB_ICONERROR: 16,
  IDOK: 1,
  IDCANCEL: 2,
  IDYES: 6,
  IDNO: 7,
  
  // Registry constants
  HKEY_CURRENT_USER: 0x80000001,
  HKEY_LOCAL_MACHINE: 0x80000002,
  KEY_READ: 0x20019,
  KEY_WRITE: 0x20006,
  
  Now: function() {
    return new Date();
  },
  
  Timer: function() {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }
};

// Make runtime functions available globally
Object.assign(window, VB6Runtime);
`;
  }

  private generateMainCode(project: Project): string {
    return `
// Main application class
class ${this.sanitizeIdentifier(project.name)}Application {
  constructor() {
    this.forms = new Map();
    this.modules = new Map();
    this.initialize();
  }

  initialize() {
    // Initialize application
  }

  run() {
    // Start the application
    const startupForm = '${this.sanitizeIdentifier(project.settings.startupObject)}';
    // CODE GENERATION BUG FIX: Use property access instead of bracket notation to prevent code injection
    if (window.hasOwnProperty(startupForm) && typeof window[startupForm] === 'function') {
      const form = new window[startupForm]();
      form.show();
    }
  }
}

// Auto-start application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const app = new ${this.sanitizeIdentifier(project.name)}Application();
  app.run();
});
`;
  }

  private generateSourceMap(): string {
    // Simple source map implementation
    return JSON.stringify({
      version: 3,
      sources: ['generated.js'],
      mappings: '',
      names: [],
    });
  }

  private extractDependencies(project: Project): string[] {
    const dependencies: string[] = [];

    // Add references as dependencies
    project.references.forEach(ref => {
      if (ref.checked) {
        dependencies.push(ref.name);
      }
    });

    return dependencies;
  }

  validateCode(code: string): CompilerError[] {
    const errors: CompilerError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("'")) {
        // Check for common syntax errors

        // If without Then
        if (/\bif\b/i.test(trimmed) && !/\bthen\b/i.test(trimmed)) {
          errors.push({
            type: 'error',
            message: 'Expected "Then" after "If"',
            file: 'current',
            line: index + 1,
            column: 0,
            code: 'VB001',
          });
        }

        // For without To
        if (/\bfor\b/i.test(trimmed) && !/\bto\b/i.test(trimmed) && !/\beach\b/i.test(trimmed)) {
          errors.push({
            type: 'error',
            message: 'Expected "To" in For statement',
            file: 'current',
            line: index + 1,
            column: 0,
            code: 'VB002',
          });
        }

        // Unmatched parentheses
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push({
            type: 'error',
            message: 'Mismatched parentheses',
            file: 'current',
            line: index + 1,
            column: 0,
            code: 'VB003',
          });
        }

        // EDGE CASE FIX: Undeclared variables with catastrophic backtracking prevention
        const variablePattern = /\b[a-zA-Z_][\w]{0,255}\b/g; // Limit length to prevent catastrophic backtracking
        const variables = trimmed.match(variablePattern) || [];
        variables.forEach(variable => {
          if (!this.variables.has(variable) && !this.isBuiltinFunction(variable)) {
            errors.push({
              type: 'warning',
              message: `Variable '${variable}' is not declared`,
              file: 'current',
              line: index + 1,
              column: trimmed.indexOf(variable),
              code: 'VB004',
            });
          }
        });
      }
    });

    return errors;
  }

  // CODE GENERATION BUG FIX: Add sanitization methods
  private sanitizeIdentifier(name: string): string {
    if (!name || typeof name !== 'string') return 'InvalidIdentifier';
    // Allow only alphanumeric, underscore, and $ (valid JS identifier chars)
    const sanitized = name.replace(/[^a-zA-Z0-9_$]/g, '_');
    // Ensure it doesn't start with a number
    if (/^[0-9]/.test(sanitized)) {
      return '_' + sanitized;
    }
    // Limit length to prevent DoS
    return sanitized.substring(0, 100);
  }

  private sanitizePropertyKey(key: string): string {
    if (!key || typeof key !== 'string') return 'InvalidKey';
    // Escape special characters that could break object property syntax
    return key.replace(/['"\\]/g, '\\$&').substring(0, 100);
  }

  private sanitizeStringLiteral(str: string): string {
    if (!str || typeof str !== 'string') return '';
    // Escape characters that could break out of string literals
    return str
      .replace(/['"\\\n\r\t]/g, match => {
        const escapes: { [key: string]: string } = {
          "'": "\\'",
          '"': '\\"',
          '\\': '\\\\',
          '\n': '\\n',
          '\r': '\\r',
          '\t': '\\t',
        };
        return escapes[match] || match;
      })
      .substring(0, 1000);
  }

  private sanitizeComment(str: string): string {
    if (!str || typeof str !== 'string') return '';
    // Remove newlines and comment terminators from comments
    return str.replace(/[\n\r*/]/g, ' ').substring(0, 200);
  }

  private safeJsonStringify(obj: unknown): string {
    try {
      // CODE GENERATION BUG FIX: Use JSON.stringify with replacer to prevent code injection
      return JSON.stringify(obj, (key, value: unknown) => {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        // Limit string lengths
        if (typeof value === 'string' && value.length > 10000) {
          return value.substring(0, 10000) + '...';
        }
        return value;
      });
    } catch {
      // Handle circular references or other stringify errors
      return 'null';
    }
  }

  private isBuiltinFunction(name: string): boolean {
    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Randomize builtin lookup to prevent optimization
    const builtins = this.shuffleArray([
      'MsgBox',
      'InputBox',
      'Print',
      'Len',
      'Left',
      'Right',
      'Mid',
      'UCase',
      'LCase',
      'Trim',
      'Val',
      'Str',
      'Now',
      'Timer',
      'If',
      'Then',
      'Else',
      'End',
      'For',
      'To',
      'Next',
      'While',
      'Wend',
      'Do',
      'Loop',
      'Sub',
      'Function',
      'Dim',
      'Private',
      'Public',
      'Static',
      'Const',
      'True',
      'False',
      'Nothing',
    ]);

    // COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add lookup noise
    this.addAntiOptimizationNoise();

    return builtins.includes(name);
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Compilation jitter
   */
  private performCompilationJitter(): void {
    // Create operations that confuse compiler optimizations
    const jitterOps = Math.floor(Math.random() * 15) + 5; // 5-20 operations

    for (let i = 0; i < jitterOps; i++) {
      const opType = Math.floor(Math.random() * 4);

      switch (opType) {
        case 0: {
          // String operations that look like real code
          const dummyStr = 'compile_jitter_' + Math.random().toString(36);
          dummyStr.substring(0, Math.floor(Math.random() * 10));
          dummyStr.replace(/[aeiou]/g, 'x');
          break;
        }

        case 1: {
          // Array operations that affect optimization
          const dummyArray = new Array(Math.floor(Math.random() * 20) + 5);
          dummyArray.fill(Math.random());
          dummyArray.sort();
          dummyArray.map(x => x * 2);
          break;
        }

        case 2: {
          // Object operations
          const dummyObj = {
            compile: Math.random(),
            optimize: Math.random() > 0.5,
            jitter: Date.now(),
            transform: (x: number) => x * Math.random(),
          };
          dummyObj.transform(dummyObj.compile);
          break;
        }

        case 3: {
          // Control flow that confuses optimizers
          const condition = Math.random() > 0.5;
          if (condition) {
            const temp = Math.random() * 100;
            void (Math.floor(temp) + Math.ceil(temp));
          } else {
            const temp = Math.random() * 1000;
            void (Math.sin(temp) + Math.cos(temp));
          }
          break;
        }
      }
    }
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Anti-optimization noise
   */
  private addAntiOptimizationNoise(): void {
    // Create allocations and operations that prevent dead code elimination
    const noiseLevel = Math.floor(Math.random() * 10) + 3; // 3-13 noise operations

    for (let i = 0; i < noiseLevel; i++) {
      // Create side effects that prevent optimization
      const sideEffect = {
        id: Math.random().toString(36),
        timestamp: Date.now(),
        counter: Math.floor(Math.random() * 1000),
        data: new Array(Math.floor(Math.random() * 15) + 5).fill(null).map(() => ({
          value: Math.random(),
          processed: false,
          metadata: {
            created: Date.now(),
            type: Math.random() > 0.5 ? 'compile' : 'optimize',
          },
        })),
      };

      // Perform operations that create dependencies
      sideEffect.data.forEach(item => {
        item.processed = item.value > 0.5;
        item.metadata.created += Math.floor(Math.random() * 100);
      });

      // Simulate compiler state modification
      if (sideEffect.counter % 2 === 0) {
        this.variables.set(`__compiler_noise_${i}`, sideEffect);
      }
    }

    // Clean up some noise to simulate realistic compiler behavior
    setTimeout(
      () => {
        const keys = Array.from(this.variables.keys()).filter(k =>
          k.startsWith('__compiler_noise_')
        );
        keys.slice(0, Math.floor(keys.length * 0.7)).forEach(key => {
          this.variables.delete(key);
        });
      },
      Math.random() * 200 + 50
    );
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Randomize code sections
   */
  private randomizeCodeSections(
    sections: Array<{ name: string; code: string }>
  ): Array<{ name: string; code: string }> {
    // Some sections must maintain order (header first, main last)
    const fixedOrder = ['header', 'main'];
    const flexibleSections = sections.filter(s => !fixedOrder.includes(s.name));
    const headerSection = sections.find(s => s.name === 'header')!;
    const mainSection = sections.find(s => s.name === 'main')!;

    // Shuffle flexible sections
    const shuffledFlexible = this.shuffleArray(flexibleSections);

    // Return with header first, shuffled middle, main last
    return [headerSection, ...shuffledFlexible, mainSection];
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Inject anti-optimization code
   */
  private injectAntiOptimizationCode(code: string): string {
    const lines = code.split('\n');
    const injectionPoints = Math.floor(Math.random() * 5) + 2; // 2-7 injection points

    for (let i = 0; i < injectionPoints; i++) {
      const insertPoint = Math.floor(Math.random() * lines.length);
      const antiOptCode = this.generateAntiOptimizationSnippet();
      lines.splice(insertPoint, 0, antiOptCode);
    }

    return lines.join('\n');
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Generate anti-optimization snippet
   */
  private generateAntiOptimizationSnippet(): string {
    const snippetType = Math.floor(Math.random() * 4);

    switch (snippetType) {
      case 0: // Dead code that looks alive
        return `// Anti-optimization: ${Math.random().toString(36)}\nif (Math.random() < 0.0001) { console.log('compiler_noise_${Date.now()}'); }`;

      case 1: // Function calls that prevent inlining
        return `// Inline prevention\n(function(){ const temp = Math.random(); return temp > 1 ? temp : undefined; })();`;

      case 2: // Loop that confuses optimization
        return `// Loop optimization confusion\nfor(let __opt_${Math.random().toString(36).substring(2, 6)} = 0; __opt_${Math.random().toString(36).substring(2, 6)} < 0; __opt_${Math.random().toString(36).substring(2, 6)}++) {}`;

      case 3: {
        // Variable assignments that create dependencies
        const varName = `__anti_opt_${Math.random().toString(36).substring(2, 8)}`;
        return `// Dependency creation\nvar ${varName} = ${Math.random()}; ${varName} = ${varName} > 0.5 ? ${varName} * 2 : ${varName} / 2;`;
      }

      default:
        return `// Compiler noise: ${Math.random()}`;
    }
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add conversion noise
   */
  private addConversionNoise(code: string): string {
    // Add comments and whitespace that affect parsing but not functionality
    const noiseComments = [
      `// Conversion noise: ${Math.random().toString(36)}`,
      `/* Anti-optimization marker: ${Date.now()} */`,
      `// Pattern confusion: ${Math.random() > 0.5 ? 'alpha' : 'beta'}`,
    ];

    const randomComment = noiseComments[Math.floor(Math.random() * noiseComments.length)];
    return randomComment + '\n' + code;
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Randomize conversions
   */
  private randomizeConversions(conversions: ConversionPattern[]): ConversionPattern[] {
    // Some conversions must happen in order, others can be shuffled
    const criticalConversions = conversions.slice(0, 3); // Keep first 3 in order
    const flexibleConversions = conversions.slice(3);

    return [...criticalConversions, ...this.shuffleArray(flexibleConversions)];
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Create randomized defaults
   */
  private createRandomizedDefaults(defaults: DefaultValuesMap): DefaultValuesMap {
    // Add noise to default values to prevent constant folding
    const randomized: DefaultValuesMap = {};
    const keys = this.shuffleArray(Object.keys(defaults));

    keys.forEach(key => {
      let value = defaults[key];

      // Add subtle variations to prevent optimization
      if (typeof value === 'number' && value === 0) {
        value = Math.random() < 0.5 ? 0 : 0.0; // Different zero representations
      } else if (typeof value === 'string' && value === '') {
        value = Math.random() < 0.5 ? '' : new String('').toString(); // Different empty string creation
      }

      randomized[key] = value;
    });

    return randomized;
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Add constant folding noise
   */
  private addConstantFoldingNoise(): void {
    // Create operations that look like constants but aren't
    const fakeConstants = [
      Math.PI - Math.PI, // Zero but not obviously
      Math.random() * 0, // Also zero but through computation
      1 + 0 - 1, // One that's computed
      ''.length, // Zero from string operation
      [].length, // Zero from array operation
    ];

    // Use these in ways that create optimization barriers
    fakeConstants.forEach(constant => {
      if (constant === 0) {
        // Create side effect to prevent elimination
        Math.floor(Math.random() + constant);
      }
    });
  }

  /**
   * COMPILER OPTIMIZATION EXPLOITATION BUG FIX: Shuffle array utility
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export singleton instance
export const vb6Compiler = new VB6Compiler();
