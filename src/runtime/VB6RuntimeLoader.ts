/**
 * VB6 Runtime Lazy Loader
 * Loads the VB6 runtime on demand to reduce initial bundle size.
 * The runtime (72 files) is split into a separate chunk by Vite.
 */

type RuntimeModule = typeof import('./index');

let runtimePromise: Promise<RuntimeModule> | null = null;
let runtimeCache: RuntimeModule | null = null;

/**
 * Lazy-load the VB6 runtime. Caches the result after first load.
 */
export async function loadVB6Runtime(): Promise<RuntimeModule> {
  if (runtimeCache) return runtimeCache;
  if (!runtimePromise) {
    runtimePromise = import('./index').then(mod => {
      runtimeCache = mod;
      return mod;
    });
  }
  return runtimePromise;
}

/**
 * Check if the runtime has already been loaded.
 */
export function isRuntimeLoaded(): boolean {
  return runtimeCache !== null;
}

/**
 * Get the runtime synchronously (throws if not yet loaded).
 */
export function getRuntime(): RuntimeModule {
  if (!runtimeCache) {
    throw new Error('VB6 runtime not loaded. Call loadVB6Runtime() first.');
  }
  return runtimeCache;
}
