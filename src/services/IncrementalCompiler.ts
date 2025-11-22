/**
 * Incremental Compilation Service for VB6
 * 
 * Provides fast incremental compilation by tracking dependencies and changes
 */

import { VB6Parser } from '../parsers/vb6Parser';
import { VB6SemanticAnalyzer } from '../analyzers/vb6SemanticAnalyzer';
import { VB6Transpiler } from '../transpilers/vb6Transpiler';

interface FileInfo {
  path: string;
  content: string;
  hash: string;
  lastModified: number;
  ast?: any;
  dependencies: Set<string>;
  dependents: Set<string>;
}

interface CompilationResult {
  success: boolean;
  output?: string;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  duration: number;
}

interface CompilationError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

interface CompilationWarning {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

interface CompilationCache {
  files: Map<string, CompiledFile>;
  lastCompilation: number;
}

interface CompiledFile {
  path: string;
  output: string;
  sourceMap?: string;
  hash: string;
  dependencies: string[];
}

export class IncrementalCompiler {
  private files: Map<string, FileInfo> = new Map();
  private compilationCache: CompilationCache = {
    files: new Map(),
    lastCompilation: 0
  };
  private parser: VB6Parser;
  private analyzer: VB6SemanticAnalyzer;
  private transpiler: VB6Transpiler;
  private fileWatcher: Map<string, () => void> = new Map();
  private isWatching: boolean = false;
  private pendingCompilation: Set<string> = new Set();
  private compilationTimeout: number | null = null;

  constructor() {
    this.parser = new VB6Parser();
    this.analyzer = new VB6SemanticAnalyzer();
    this.transpiler = new VB6Transpiler();
  }

  /**
   * Add or update a file in the compilation context
   */
  addFile(path: string, content: string): void {
    const hash = this.computeHash(content);
    const existingFile = this.files.get(path);

    // Check if file has changed
    if (existingFile && existingFile.hash === hash) {
      return; // No changes
    }

    // Update file info
    const fileInfo: FileInfo = {
      path,
      content,
      hash,
      lastModified: Date.now(),
      dependencies: new Set(),
      dependents: new Set()
    };

    this.files.set(path, fileInfo);
    
    // Mark file for recompilation
    this.markForRecompilation(path);

    // Parse and analyze dependencies
    this.analyzeDependencies(fileInfo);
  }

  /**
   * Remove a file from compilation context
   */
  removeFile(path: string): void {
    const fileInfo = this.files.get(path);
    if (!fileInfo) return;

    // Update dependents
    for (const dep of fileInfo.dependencies) {
      const depFile = this.files.get(dep);
      if (depFile) {
        depFile.dependents.delete(path);
      }
    }

    // Mark dependents for recompilation
    for (const dependent of fileInfo.dependents) {
      this.markForRecompilation(dependent);
    }

    this.files.delete(path);
    this.compilationCache.files.delete(path);
  }

  /**
   * Perform incremental compilation
   */
  async compile(): Promise<CompilationResult> {
    const startTime = Date.now();
    const errors: CompilationError[] = [];
    const warnings: CompilationWarning[] = [];
    const filesToCompile = new Set<string>(this.pendingCompilation);

    // Clear pending compilation
    this.pendingCompilation.clear();

    // Compile each file that needs recompilation
    for (const path of filesToCompile) {
      const fileInfo = this.files.get(path);
      if (!fileInfo) continue;

      try {
        const result = await this.compileFile(fileInfo);
        
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        }
        
        if (result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }

        if (result.success && result.output) {
          // Cache compilation result
          this.compilationCache.files.set(path, {
            path,
            output: result.output,
            hash: fileInfo.hash,
            dependencies: Array.from(fileInfo.dependencies)
          });
        }
      } catch (error) {
        errors.push({
          file: path,
          line: 0,
          column: 0,
          message: error instanceof Error ? error.message : 'Unknown compilation error',
          code: 'COMPILATION_ERROR'
        });
      }
    }

    // Generate final output
    const output = this.generateOutput();

    const duration = Date.now() - startTime;
    this.compilationCache.lastCompilation = Date.now();

    return {
      success: errors.length === 0,
      output,
      errors,
      warnings,
      duration
    };
  }

  /**
   * Watch files for changes and trigger incremental compilation
   */
  watch(onChange?: (result: CompilationResult) => void): void {
    this.isWatching = true;

    // Set up file watchers
    for (const [path, fileInfo] of this.files) {
      if (!this.fileWatcher.has(path)) {
        // In a real implementation, this would use fs.watch or similar
        // For now, we'll simulate with polling
        const watcher = () => {
          // Check if file has changed
          const currentContent = this.readFile(path);
          if (currentContent && currentContent !== fileInfo.content) {
            this.addFile(path, currentContent);
            this.scheduleCompilation(onChange);
          }
        };

        this.fileWatcher.set(path, watcher);
      }
    }
  }

  /**
   * Stop watching files
   */
  stopWatch(): void {
    this.isWatching = false;
    this.fileWatcher.clear();
    
    if (this.compilationTimeout) {
      clearTimeout(this.compilationTimeout);
      this.compilationTimeout = null;
    }
  }

  /**
   * Get compilation statistics
   */
  getStats(): {
    totalFiles: number;
    cachedFiles: number;
    pendingFiles: number;
    lastCompilation: number;
    cacheHitRate: number;
  } {
    const totalFiles = this.files.size;
    const cachedFiles = this.compilationCache.files.size;
    const pendingFiles = this.pendingCompilation.size;

    // Calculate cache hit rate
    let cacheHits = 0;
    let totalRequests = 0;

    for (const [path, cached] of this.compilationCache.files) {
      const file = this.files.get(path);
      if (file && file.hash === cached.hash) {
        cacheHits++;
      }
      totalRequests++;
    }

    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    return {
      totalFiles,
      cachedFiles,
      pendingFiles,
      lastCompilation: this.compilationCache.lastCompilation,
      cacheHitRate
    };
  }

  /**
   * Clear compilation cache
   */
  clearCache(): void {
    this.compilationCache.files.clear();
    this.compilationCache.lastCompilation = 0;
    
    // Mark all files for recompilation
    for (const path of this.files.keys()) {
      this.pendingCompilation.add(path);
    }
  }

  // Private methods

  private computeHash(content: string): string {
    // Simple hash implementation - in production, use crypto.createHash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private markForRecompilation(path: string): void {
    this.pendingCompilation.add(path);
    
    // Also mark all dependents
    const fileInfo = this.files.get(path);
    if (fileInfo) {
      for (const dependent of fileInfo.dependents) {
        this.pendingCompilation.add(dependent);
      }
    }
  }

  private analyzeDependencies(fileInfo: FileInfo): void {
    try {
      // Parse the file
      const ast = this.parser.parse(fileInfo.content);
      fileInfo.ast = ast;

      // Extract dependencies (imports, references, etc.)
      const dependencies = this.extractDependencies(ast);
      
      // Update dependency graph
      const oldDependencies = new Set(fileInfo.dependencies);
      fileInfo.dependencies.clear();

      for (const dep of dependencies) {
        fileInfo.dependencies.add(dep);
        
        // Update dependents in referenced file
        const depFile = this.files.get(dep);
        if (depFile) {
          depFile.dependents.add(fileInfo.path);
        }
      }

      // Clean up old dependencies
      for (const oldDep of oldDependencies) {
        if (!fileInfo.dependencies.has(oldDep)) {
          const depFile = this.files.get(oldDep);
          if (depFile) {
            depFile.dependents.delete(fileInfo.path);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to analyze dependencies for ${fileInfo.path}:`, error);
    }
  }

  private extractDependencies(ast: any): string[] {
    const dependencies: string[] = [];

    // Extract module imports
    if (ast.imports) {
      for (const imp of ast.imports) {
        dependencies.push(imp.module);
      }
    }

    // Extract form references
    if (ast.type === 'Module' && ast.body) {
      const visitor = (node: any) => {
        if (node.type === 'MemberExpression' && node.object.type === 'Identifier') {
          // Check if it's a form reference
          const formName = node.object.name;
          if (formName.endsWith('Form') || this.files.has(`${formName}.frm`)) {
            dependencies.push(`${formName}.frm`);
          }
        }

        // Recursively visit child nodes
        for (const key in node) {
          if (Object.prototype.hasOwnProperty.call(node, key) && node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              node[key].forEach(visitor);
            } else {
              visitor(node[key]);
            }
          }
        }
      };

      visitor(ast);
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  private async compileFile(fileInfo: FileInfo): Promise<CompilationResult> {
    const errors: CompilationError[] = [];
    const warnings: CompilationWarning[] = [];

    try {
      // Check cache first
      const cached = this.compilationCache.files.get(fileInfo.path);
      if (cached && cached.hash === fileInfo.hash) {
        // Dependencies haven't changed either
        const depsChanged = cached.dependencies.some(dep => {
          const depFile = this.files.get(dep);
          return !depFile || this.pendingCompilation.has(dep);
        });

        if (!depsChanged) {
          return {
            success: true,
            output: cached.output,
            errors: [],
            warnings: [],
            duration: 0
          };
        }
      }

      // Parse if not already parsed
      if (!fileInfo.ast) {
        fileInfo.ast = this.parser.parse(fileInfo.content);
      }

      // Semantic analysis
      const analysisResult = this.analyzer.analyze(fileInfo.ast);
      
      if (analysisResult.errors.length > 0) {
        errors.push(...analysisResult.errors.map(err => ({
          file: fileInfo.path,
          line: err.line || 0,
          column: err.column || 0,
          message: err.message,
          code: err.code || 'SEMANTIC_ERROR'
        })));
      }

      if (analysisResult.warnings.length > 0) {
        warnings.push(...analysisResult.warnings.map(warn => ({
          file: fileInfo.path,
          line: warn.line || 0,
          column: warn.column || 0,
          message: warn.message,
          code: warn.code || 'WARNING'
        })));
      }

      // Transpile to JavaScript
      const output = this.transpiler.transpile(fileInfo.ast);

      return {
        success: errors.length === 0,
        output,
        errors,
        warnings,
        duration: 0
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          file: fileInfo.path,
          line: 0,
          column: 0,
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'COMPILATION_ERROR'
        }],
        warnings,
        duration: 0
      };
    }
  }

  private generateOutput(): string {
    // Combine all compiled files in dependency order
    const output: string[] = [];
    const processed = new Set<string>();

    const processFile = (path: string) => {
      if (processed.has(path)) return;
      
      const fileInfo = this.files.get(path);
      if (!fileInfo) return;

      // Process dependencies first
      for (const dep of fileInfo.dependencies) {
        processFile(dep);
      }

      // Add this file's output
      const compiled = this.compilationCache.files.get(path);
      if (compiled) {
        output.push(`// File: ${path}`);
        output.push(compiled.output);
        output.push('');
      }

      processed.add(path);
    };

    // Process all files
    for (const path of this.files.keys()) {
      processFile(path);
    }

    return output.join('\n');
  }

  private scheduleCompilation(onChange?: (result: CompilationResult) => void): void {
    if (this.compilationTimeout) {
      clearTimeout(this.compilationTimeout);
    }

    // Debounce compilation
    this.compilationTimeout = window.setTimeout(async () => {
      const result = await this.compile();
      if (onChange) {
        onChange(result);
      }
    }, 300);
  }

  private readFile(path: string): string | null {
    // In a real implementation, this would read from the file system
    // For now, return null to indicate no change
    return null;
  }
}

// Export singleton instance
export const incrementalCompiler = new IncrementalCompiler();