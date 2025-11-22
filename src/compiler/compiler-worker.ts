/**
 * VB6 Compiler Worker - Parallel Compilation Support
 * 
 * This worker handles intensive compilation tasks in parallel
 * to avoid blocking the main thread during large compilations.
 */

import { VB6UnifiedCompiler, CompilerOptions, CompilationResult } from './VB6UnifiedCompiler';

// Worker-specific compiler instance
let compiler: VB6UnifiedCompiler | null = null;

// Message handler
self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    switch (type) {
      case 'initialize':
        await handleInitialize(id, payload);
        break;
        
      case 'compile':
        await handleCompile(id, payload);
        break;
        
      case 'compile-batch':
        await handleCompileBatch(id, payload);
        break;
        
      case 'get-metrics':
        handleGetMetrics(id);
        break;
        
      case 'clear-cache':
        handleClearCache(id);
        break;
        
      case 'dispose':
        handleDispose(id);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
};

/**
 * Initialize compiler with options
 */
async function handleInitialize(id: string, options: CompilerOptions): Promise<void> {
  compiler = new VB6UnifiedCompiler(options);
  
  self.postMessage({
    type: 'initialized',
    id,
    success: true
  });
}

/**
 * Compile single source file
 */
async function handleCompile(id: string, payload: { source: string; filename?: string }): Promise<void> {
  if (!compiler) {
    throw new Error('Compiler not initialized');
  }

  const { source, filename } = payload;
  const result = await compiler.compile(source, filename);
  
  self.postMessage({
    type: 'compilation-complete',
    id,
    result
  });
}

/**
 * Compile multiple files in batch
 */
async function handleCompileBatch(id: string, payload: { files: { name: string; content: string }[] }): Promise<void> {
  if (!compiler) {
    throw new Error('Compiler not initialized');
  }

  const { files } = payload;
  const results = await compiler.compileFiles(files);
  
  self.postMessage({
    type: 'batch-compilation-complete',
    id,
    results
  });
}

/**
 * Get compilation metrics
 */
function handleGetMetrics(id: string): void {
  if (!compiler) {
    throw new Error('Compiler not initialized');
  }

  const globalMetrics = compiler.getGlobalMetrics();
  const wasmMetrics = compiler.getWasmMetrics();
  const cacheMetrics = compiler.getCacheMetrics();
  
  self.postMessage({
    type: 'metrics',
    id,
    metrics: {
      global: globalMetrics,
      wasm: wasmMetrics,
      cache: cacheMetrics
    }
  });
}

/**
 * Clear compilation cache
 */
function handleClearCache(id: string): void {
  if (!compiler) {
    throw new Error('Compiler not initialized');
  }

  compiler.clearCache();
  
  self.postMessage({
    type: 'cache-cleared',
    id,
    success: true
  });
}

/**
 * Dispose compiler resources
 */
function handleDispose(id: string): void {
  if (compiler) {
    compiler.dispose();
    compiler = null;
  }
  
  self.postMessage({
    type: 'disposed',
    id,
    success: true
  });
}

// Handle worker errors
self.onerror = (error) => {
  self.postMessage({
    type: 'worker-error',
    error: {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno
    }
  });
};

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  self.postMessage({
    type: 'worker-error',
    error: {
      message: event.reason?.message || 'Unhandled promise rejection',
      reason: event.reason
    }
  });
});

export {}; // Make this a module