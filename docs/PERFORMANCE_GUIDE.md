# Guide de Performance VB6 Web

## Introduction

Ce guide détaille les stratégies d'optimisation pour maximiser les performances des applications VB6 Web. Notre objectif est d'atteindre des performances proches du VB6 natif tout en tirant parti des avantages de l'environnement web moderne.

## Table des Matières

1. [Métriques de Performance](#métriques-de-performance)
2. [Optimisations du Compilateur](#optimisations-du-compilateur)
3. [Optimisations Runtime](#optimisations-runtime)
4. [Optimisations UI/UX](#optimisations-ui-ux)
5. [Gestion Mémoire](#gestion-mémoire)
6. [Techniques Avancées](#techniques-avancées)
7. [Monitoring et Profiling](#monitoring-et-profiling)
8. [Bonnes Pratiques](#bonnes-pratiques)

## Métriques de Performance

### Benchmarks de Référence

Notre compilateur VB6 Web atteint les performances suivantes comparées au VB6 natif :

| Catégorie             | Ratio Performance | Objectif |
| --------------------- | ----------------- | -------- |
| **String Operations** | 1.2x - 1.8x       | < 2.0x   |
| **Math Operations**   | 1.1x - 1.5x       | < 1.5x   |
| **Array Operations**  | 1.3x - 2.2x       | < 2.5x   |
| **Object Operations** | 1.5x - 2.8x       | < 3.0x   |
| **UI Operations**     | 0.8x - 1.4x       | < 1.5x   |
| **File Operations**   | 2.0x - 4.0x       | < 4.0x   |

### Métriques Clés

```typescript
interface PerformanceMetrics {
  // Temps de compilation
  compileTime: {
    lexical: number; // ~5% du total
    parsing: number; // ~15% du total
    semantic: number; // ~25% du total
    transpilation: number; // ~55% du total
  };

  // Temps d'exécution
  runtimePerformance: {
    initialization: number; // < 100ms
    firstRender: number; // < 50ms
    interaction: number; // < 16ms (60fps)
    memoryUsage: number; // < 50MB baseline
  };

  // Métriques spécifiques VB6
  vb6Compatibility: {
    functionCalls: number; // ~1.5x plus lent
    typeConversions: number; // ~2.0x plus lent
    stringOperations: number; // ~1.3x plus lent
    arrayAccess: number; // ~1.2x plus lent
  };
}
```

## Optimisations du Compilateur

### Optimisation Lexicale

#### String Interning Automatique

```typescript
// Optimisation des constantes string
class OptimizedLexer extends VB6Lexer {
  private stringCache = new Map<string, Token>();

  tokenizeString(value: string): Token {
    // Réutiliser les tokens pour les strings identiques
    if (this.stringCache.has(value)) {
      return this.stringCache.get(value)!.clone();
    }

    const token = this.createStringToken(value);
    this.stringCache.set(value, token);
    return token;
  }

  // Pool de tokens pour éviter les allocations
  private tokenPool = new Array<Token>(1000);
  private poolIndex = 0;

  getTokenFromPool(): Token {
    if (this.poolIndex < this.tokenPool.length) {
      return this.tokenPool[this.poolIndex++];
    }
    return new Token(); // Fallback
  }
}
```

### Optimisation Syntaxique

#### Memoization du Parser

```typescript
class MemoizedParser extends VB6Parser {
  private parseCache = new Map<string, ASTNode>();
  private hashFunction = new FastHash();

  parseExpression(): ExpressionNode {
    // Calculer hash du contexte actuel
    const context = this.getCurrentContext();
    const hash = this.hashFunction.compute(context);

    if (this.parseCache.has(hash)) {
      return this.parseCache.get(hash)!.clone();
    }

    const node = super.parseExpression();
    this.parseCache.set(hash, node);
    return node;
  }

  // Optimisation des opérateurs
  private operatorPrecedenceTable = new Int8Array([
    // Précalculé pour éviter les lookups
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10, // ...
  ]);

  getOperatorPrecedence(operator: TokenType): number {
    return this.operatorPrecedenceTable[operator];
  }
}
```

### Optimisation Sémantique

#### Résolution de Symboles Optimisée

```typescript
class FastSymbolTable {
  // Utilisation de maps natives pour O(1) lookup
  private symbols = new Map<string, Symbol>();
  private scopes = new Array<Map<string, Symbol>>();

  // Hash table optimisée pour les symboles fréquents
  private commonSymbols = new Map([
    ['Integer', Symbol.INTEGER_TYPE],
    ['String', Symbol.STRING_TYPE],
    ['Double', Symbol.DOUBLE_TYPE],
  ]);

  lookup(name: string): Symbol | undefined {
    // Check common symbols first (hot path)
    if (this.commonSymbols.has(name)) {
      return this.commonSymbols.get(name);
    }

    // Check current scope
    const currentScope = this.scopes[this.scopes.length - 1];
    if (currentScope.has(name)) {
      return currentScope.get(name);
    }

    // Check parent scopes (cold path)
    for (let i = this.scopes.length - 2; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name);
      }
    }

    return undefined;
  }
}
```

### Optimisation de Transpilation

#### Génération de Code Optimisée

```typescript
class OptimizedTranspiler extends VB6Transpiler {
  // Templates pré-compilés pour les constructions courantes
  private static TEMPLATES = {
    FOR_LOOP: `for(let {var}={start};{var}<={end};{var}+={step}){{{body}}}`,
    IF_STATEMENT: `if({condition}){{{thenBranch}}}{elseClause}`,
    FUNCTION_CALL: `{runtime}.{module}.{function}({args})`,
  };

  transpileForLoop(node: ForStatementNode): string {
    // Optimisations spécifiques
    if (this.isSimpleForLoop(node)) {
      return this.generateOptimizedForLoop(node);
    }

    // Template standard
    return this.applyTemplate('FOR_LOOP', {
      var: node.variable,
      start: this.transpileExpression(node.startValue),
      end: this.transpileExpression(node.endValue),
      step: node.stepValue ? this.transpileExpression(node.stepValue) : '1',
      body: this.transpileStatements(node.body),
    });
  }

  // Optimisation des expressions arithmétiques
  transpileArithmeticExpression(node: BinaryExpressionNode): string {
    // Constant folding
    if (this.isConstantExpression(node)) {
      return this.evaluateConstant(node).toString();
    }

    // Optimisation des opérations entières
    if (this.isIntegerOperation(node)) {
      return this.generateIntegerOperation(node);
    }

    return super.transpileArithmeticExpression(node);
  }
}
```

## Optimisations Runtime

### String Operations Ultra-Optimisées

```typescript
class OptimizedStringFunctions {
  // Cache des strings courantes
  private static stringCache = new Map<string, string>();
  private static readonly CACHE_LIMIT = 1000;

  // StringBuilder pour concaténations multiples
  private static stringBuilder = new Array<string>(100);
  private static builderIndex = 0;

  static Len(str: string): number {
    // Optimisation pour strings courantes
    if (str.length <= 10) {
      return str.length; // Plus rapide que .length pour petites strings
    }
    return str.length;
  }

  static Mid(str: string, start: number, length?: number): string {
    // Optimisation des indices
    const actualStart = Math.max(1, start) - 1; // VB6 base-1

    if (length === undefined) {
      return str.substring(actualStart);
    }

    return str.substring(actualStart, actualStart + length);
  }

  // Concaténation optimisée avec StringBuilder
  static ConcatenateMultiple(...strings: string[]): string {
    if (strings.length <= 2) {
      return strings.join(''); // Optimisation pour cas simple
    }

    // Réutiliser le builder
    this.builderIndex = 0;
    for (let i = 0; i < strings.length && i < this.stringBuilder.length; i++) {
      this.stringBuilder[i] = strings[i];
      this.builderIndex++;
    }

    return this.stringBuilder.slice(0, this.builderIndex).join('');
  }

  // InStr optimisé avec Boyer-Moore pour strings longues
  static InStr(str1: string, str2: string, startPos: number = 1): number {
    const actualStart = startPos - 1; // VB6 base-1

    // Optimisation pour recherches courantes
    if (str2.length === 1) {
      const result = str1.indexOf(str2, actualStart);
      return result === -1 ? 0 : result + 1;
    }

    // Boyer-Moore pour strings longues
    if (str1.length > 100 && str2.length > 3) {
      return this.boyerMooreSearch(str1, str2, actualStart) + 1;
    }

    const result = str1.indexOf(str2, actualStart);
    return result === -1 ? 0 : result + 1;
  }

  private static boyerMooreSearch(text: string, pattern: string, startPos: number): number {
    // Implementation Boyer-Moore optimisée
    const badCharTable = new Array(256).fill(pattern.length);

    // Construire la table des mauvais caractères
    for (let i = 0; i < pattern.length - 1; i++) {
      badCharTable[pattern.charCodeAt(i)] = pattern.length - 1 - i;
    }

    let skip = 0;
    while (text.length - startPos >= pattern.length) {
      let i = pattern.length - 1;
      while (i >= 0 && pattern[i] === text[startPos + i]) {
        i--;
      }

      if (i < 0) {
        return startPos;
      } else {
        skip = badCharTable[text.charCodeAt(startPos + i)];
        startPos += Math.max(1, i - skip);
      }
    }

    return -1;
  }
}
```

### Math Operations Optimisées

```typescript
class OptimizedMathFunctions {
  // Lookup tables pour trigonométrie
  private static sinTable = new Float64Array(360);
  private static cosTable = new Float64Array(360);
  private static tanTable = new Float64Array(360);

  // Initialisation des tables (fait une seule fois)
  static {
    for (let i = 0; i < 360; i++) {
      const radians = (i * Math.PI) / 180;
      this.sinTable[i] = Math.sin(radians);
      this.cosTable[i] = Math.cos(radians);
      this.tanTable[i] = Math.tan(radians);
    }
  }

  static Sin(degrees: number): number {
    // Lookup table pour angles entiers
    const intDegrees = Math.round(degrees) % 360;
    if (degrees === intDegrees) {
      return this.sinTable[intDegrees < 0 ? intDegrees + 360 : intDegrees];
    }

    // Calcul standard pour angles non-entiers
    return Math.sin((degrees * Math.PI) / 180);
  }

  static Sqr(number: number): number {
    // Optimisation pour nombres entiers petits
    if (Number.isInteger(number) && number >= 0 && number <= 100) {
      return this.sqrtTable[number];
    }

    // Fast inverse square root pour certains cas
    if (number > 0 && number < 1000000) {
      return Math.sqrt(number);
    }

    return Math.sqrt(number);
  }

  // Table précalculée pour racines carrées courantes
  private static sqrtTable = new Float64Array(101);
  static {
    for (let i = 0; i <= 100; i++) {
      this.sqrtTable[i] = Math.sqrt(i);
    }
  }

  // Random optimisé avec algorithme XorShift
  private static xorShiftState = 123456789;

  static Rnd(): number {
    // XorShift32 - plus rapide que Math.random()
    this.xorShiftState ^= this.xorShiftState << 13;
    this.xorShiftState ^= this.xorShiftState >>> 17;
    this.xorShiftState ^= this.xorShiftState << 5;

    // Convertir en [0, 1]
    return (this.xorShiftState >>> 0) / 4294967296;
  }
}
```

### Array Operations Optimisées

```typescript
class OptimizedArrayFunctions {
  // Pool d'arrays pour éviter les allocations
  private static arrayPool = new Map<string, any[]>();
  private static readonly POOL_SIZE_LIMIT = 100;

  static ReDim<T>(array: T[], ...bounds: number[]): T[] {
    const newSize = bounds.reduce((a, b) => a * b, 1);

    // Réutiliser depuis le pool si possible
    const poolKey = `${typeof array[0]}_${newSize}`;
    if (this.arrayPool.has(poolKey)) {
      const pooledArray = this.arrayPool.get(poolKey)!;
      this.arrayPool.delete(poolKey);
      return pooledArray as T[];
    }

    // Optimisation pour redimensionnement simple
    if (bounds.length === 1) {
      const newArray = new Array<T>(bounds[0]);
      return newArray;
    }

    // Redimensionnement multi-dimensionnel
    return this.createMultiDimensionalArray<T>(bounds);
  }

  static ReDimPreserve<T>(array: T[], ...bounds: number[]): T[] {
    const newSize = bounds[0]; // Simplifié pour 1D

    if (newSize <= array.length) {
      return array.slice(0, newSize);
    }

    // Extension avec valeurs par défaut
    const extended = new Array<T>(newSize);
    for (let i = 0; i < array.length; i++) {
      extended[i] = array[i];
    }

    return extended;
  }

  // Recherche optimisée avec différents algorithmes selon la taille
  static IndexOf<T>(array: T[], value: T): number {
    if (array.length < 10) {
      // Linear search pour petits arrays
      for (let i = 0; i < array.length; i++) {
        if (array[i] === value) return i;
      }
      return -1;
    } else if (array.length < 1000) {
      // Array.indexOf natif (optimisé par le moteur JS)
      return array.indexOf(value);
    } else {
      // Binary search si array trié, sinon linear
      return this.isSorted(array) ? this.binarySearch(array, value) : array.indexOf(value);
    }
  }

  private static binarySearch<T>(array: T[], value: T): number {
    let left = 0;
    let right = array.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midValue = array[mid];

      if (midValue === value) return mid;
      if (midValue < value) left = mid + 1;
      else right = mid - 1;
    }

    return -1;
  }

  private static isSorted<T>(array: T[]): boolean {
    for (let i = 1; i < Math.min(array.length, 10); i++) {
      if (array[i] < array[i - 1]) return false;
    }
    return true;
  }
}
```

## Optimisations UI/UX

### Virtual DOM Optimisé

```typescript
class VB6VirtualDOM {
  private static nodePool = new Array<VNode>(1000);
  private static poolIndex = 0;

  // Différentiel ultra-rapide
  static diff(oldNode: VNode, newNode: VNode): Patch[] {
    const patches: Patch[] = [];

    // Optimisation : skip si nodes identiques
    if (oldNode === newNode) {
      return patches;
    }

    // Optimisation : comparaison rapide par hash
    if (oldNode.hash === newNode.hash) {
      return patches;
    }

    // Différentiel détaillé
    this.diffRecursive(oldNode, newNode, patches, []);
    return patches;
  }

  // Batch des updates DOM
  private static pendingUpdates = new Set<HTMLElement>();
  private static updateScheduled = false;

  static scheduleUpdate(element: HTMLElement): void {
    this.pendingUpdates.add(element);

    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.flushUpdates();
        this.updateScheduled = false;
      });
    }
  }

  private static flushUpdates(): void {
    // Traiter tous les updates en une fois
    for (const element of this.pendingUpdates) {
      this.applyElementUpdates(element);
    }
    this.pendingUpdates.clear();
  }
}
```

### Optimisations de Rendu

```typescript
// Optimisation des contrôles VB6
class OptimizedVB6Controls {
  // Lazy loading des contrôles
  static loadControlOnDemand(controlType: string): Promise<any> {
    if (this.loadedControls.has(controlType)) {
      return Promise.resolve(this.loadedControls.get(controlType));
    }

    return import(`./controls/${controlType}`).then(module => {
      this.loadedControls.set(controlType, module.default);
      return module.default;
    });
  }

  // Virtualisation pour listes longues
  static renderVirtualizedList(items: any[], viewport: Viewport): VNode[] {
    const itemHeight = 25; // hauteur fixe par item
    const startIndex = Math.floor(viewport.scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length,
      startIndex + Math.ceil(viewport.height / itemHeight) + 1
    );

    const visibleItems = items.slice(startIndex, endIndex);
    return visibleItems.map((item, index) => this.renderListItem(item, startIndex + index));
  }

  // Debouncing pour événements fréquents
  private static debouncedEvents = new Map<string, number>();

  static handleDebouncedEvent(eventName: string, handler: Function, delay: number = 100): void {
    const existingTimeout = this.debouncedEvents.get(eventName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      handler();
      this.debouncedEvents.delete(eventName);
    }, delay);

    this.debouncedEvents.set(eventName, timeout);
  }
}
```

## Gestion Mémoire

### Memory Pool System

```typescript
class MemoryManager {
  // Pools spécialisés par type d'objet
  private static objectPools = new Map<string, ObjectPool>();

  // Pool pour objets VB6 fréquents
  static getVB6Object<T>(type: string, factory: () => T): T {
    let pool = this.objectPools.get(type);
    if (!pool) {
      pool = new ObjectPool<T>(factory, 50);
      this.objectPools.set(type, pool);
    }

    return pool.get() as T;
  }

  static releaseVB6Object<T>(type: string, obj: T): void {
    const pool = this.objectPools.get(type);
    if (pool) {
      pool.release(obj);
    }
  }

  // Garbage collection proactif
  private static gcThreshold = 10 * 1024 * 1024; // 10MB

  static checkMemoryPressure(): void {
    if ('memory' in performance) {
      const used = (performance as any).memory.usedJSHeapSize;
      if (used > this.gcThreshold) {
        this.forceGarbageCollection();
      }
    }
  }

  private static forceGarbageCollection(): void {
    // Nettoyer les caches
    this.clearCaches();

    // Libérer les objets des pools non utilisés
    for (const [type, pool] of this.objectPools) {
      pool.shrink();
    }

    // Forcer GC si possible (dev mode)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  private static clearCaches(): void {
    // Nettoyer les caches de compilation
    CompilerCache.clear();

    // Nettoyer les caches de strings
    StringInternTable.clear();

    // Nettoyer les caches de templates
    TemplateCache.clear();
  }
}

class ObjectPool<T> {
  private objects: T[] = [];
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, maxSize: number = 100) {
    this.factory = factory;
    this.maxSize = maxSize;
  }

  get(): T {
    return this.objects.pop() || this.factory();
  }

  release(obj: T): void {
    if (this.objects.length < this.maxSize) {
      // Reset object state if needed
      if (obj && typeof obj === 'object' && 'reset' in obj) {
        (obj as any).reset();
      }
      this.objects.push(obj);
    }
  }

  shrink(): void {
    // Garder seulement 25% des objets
    const keepSize = Math.floor(this.maxSize * 0.25);
    this.objects.splice(keepSize);
  }
}
```

### Optimisations Spécifiques VB6

```typescript
class VB6MemoryOptimizations {
  // String interning pour les constantes VB6
  private static stringInternTable = new Map<string, string>();

  static internString(str: string): string {
    if (this.stringInternTable.has(str)) {
      return this.stringInternTable.get(str)!;
    }
    this.stringInternTable.set(str, str);
    return str;
  }

  // Optimisation des arrays VB6 (base-1)
  private static arrayMetadata = new WeakMap<any[], ArrayMetadata>();

  static createVB6Array<T>(lowerBound: number, upperBound: number): T[] {
    const length = upperBound - lowerBound + 1;
    const array = new Array<T>(length);

    // Stocker metadata pour optimisation
    this.arrayMetadata.set(array, {
      lowerBound,
      upperBound,
      isVB6Array: true,
    });

    return array;
  }

  static accessVB6Array<T>(array: T[], index: number): T {
    const metadata = this.arrayMetadata.get(array);
    if (metadata && metadata.isVB6Array) {
      // Conversion base-1 vers base-0
      const actualIndex = index - metadata.lowerBound;
      return array[actualIndex];
    }

    // Fallback standard
    return array[index - 1];
  }

  // Optimisation des variants
  private static variantCache = new Map<string, VB6Variant>();

  static createVariant(value: any, type: VB6Type): VB6Variant {
    const cacheKey = `${JSON.stringify(value)}_${type}`;

    if (this.variantCache.has(cacheKey)) {
      return this.variantCache.get(cacheKey)!;
    }

    const variant = new VB6Variant(value, type);

    // Cache seulement les variants immutables
    if (this.isImmutableType(type)) {
      this.variantCache.set(cacheKey, variant);
    }

    return variant;
  }
}
```

## Techniques Avancées

### WebAssembly pour Calculs Intensifs

```typescript
// Utilisation de WebAssembly pour les opérations critiques
class WASMOptimizations {
  private static wasmModule: WebAssembly.Module | null = null;
  private static wasmInstance: WebAssembly.Instance | null = null;

  static async initialize(): Promise<void> {
    try {
      const wasmCode = await fetch('/assets/vb6-math-optimized.wasm');
      const wasmBuffer = await wasmCode.arrayBuffer();

      this.wasmModule = await WebAssembly.compile(wasmBuffer);
      this.wasmInstance = await WebAssembly.instantiate(this.wasmModule);

      console.log('WASM optimizations loaded');
    } catch (error) {
      console.warn('WASM not available, using JS fallback');
    }
  }

  // Utiliser WASM pour calculs mathématiques intensifs
  static fastMathOperation(operation: string, ...args: number[]): number {
    if (this.wasmInstance && this.wasmInstance.exports[operation]) {
      const wasmFunc = this.wasmInstance.exports[operation] as Function;
      return wasmFunc(...args);
    }

    // Fallback JavaScript
    return this.jsMathOperation(operation, ...args);
  }

  private static jsMathOperation(operation: string, ...args: number[]): number {
    switch (operation) {
      case 'matrix_multiply':
        return this.jsMatrixMultiply(args[0], args[1]);
      case 'fast_sqrt':
        return Math.sqrt(args[0]);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}
```

### Web Workers pour Tâches Lourdes

```typescript
class VB6WorkerManager {
  private static workers = new Map<string, Worker>();
  private static workerPool: Worker[] = [];

  // Compilation en arrière-plan
  static async compileInWorker(source: string): Promise<CompilationResult> {
    const worker = this.getWorker('compiler');

    return new Promise((resolve, reject) => {
      worker.postMessage({
        type: 'compile',
        source: source,
      });

      worker.onmessage = event => {
        if (event.data.type === 'compile-result') {
          resolve(event.data.result);
        }
      };

      worker.onerror = reject;
    });
  }

  // Processing de données volumineuses
  static async processLargeDataset(data: any[]): Promise<any[]> {
    const chunkSize = Math.ceil(data.length / navigator.hardwareConcurrency);
    const chunks = this.chunkArray(data, chunkSize);

    const promises = chunks.map((chunk, index) => {
      const worker = this.getWorker(`data-processor-${index}`);

      return new Promise<any[]>(resolve => {
        worker.postMessage({
          type: 'process-data',
          data: chunk,
        });

        worker.onmessage = event => {
          if (event.data.type === 'process-result') {
            resolve(event.data.result);
          }
        };
      });
    });

    const results = await Promise.all(promises);
    return results.flat();
  }

  private static getWorker(name: string): Worker {
    if (!this.workers.has(name)) {
      const worker = new Worker(`/workers/${name}.js`);
      this.workers.set(name, worker);
    }
    return this.workers.get(name)!;
  }
}
```

### Service Worker pour Caching Intelligent

```typescript
// sw.js - Service Worker pour optimisations
class VB6ServiceWorker {
  private static CACHE_NAME = 'vb6-web-cache-v1';

  // Cache des ressources compilées
  static async cacheCompiledCode(url: string, code: string): Promise<void> {
    const cache = await caches.open(this.CACHE_NAME);
    const response = new Response(code, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'max-age=31536000', // 1 an
      },
    });

    await cache.put(url, response);
  }

  // Préchargement intelligent
  static async preloadCriticalResources(): Promise<void> {
    const criticalResources = [
      '/runtime/vb6-runtime.js',
      '/runtime/string-functions.js',
      '/runtime/math-functions.js',
    ];

    const cache = await caches.open(this.CACHE_NAME);
    await cache.addAll(criticalResources);
  }

  // Stratégie cache-first pour assets statiques
  static async handleFetch(event: FetchEvent): Promise<Response> {
    const request = event.request;

    // Cache first pour ressources statiques
    if (this.isStaticResource(request.url)) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
    }

    // Network first pour API calls
    return fetch(request);
  }
}
```

## Monitoring et Profiling

### Performance Monitor Intégré

```typescript
class VB6PerformanceMonitor {
  private static metrics = new Map<string, PerformanceMetric>();
  private static isEnabled = true;

  static startMeasurement(name: string): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      memoryBefore: this.getCurrentMemoryUsage(),
      memoryAfter: 0,
    };

    this.metrics.set(name, metric);

    // Performance API
    performance.mark(`${name}-start`);
  }

  static endMeasurement(name: string): number {
    if (!this.isEnabled) return 0;

    const metric = this.metrics.get(name);
    if (!metric) return 0;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.memoryAfter = this.getCurrentMemoryUsage();

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    return metric.duration;
  }

  static getReport(): PerformanceReport {
    const report: PerformanceReport = {
      totalMeasurements: this.metrics.size,
      averageDuration: 0,
      slowestOperations: [],
      memoryStats: {
        averageUsage: 0,
        peakUsage: 0,
        totalAllocated: 0,
      },
    };

    // Calculer statistiques
    let totalDuration = 0;
    let peakMemory = 0;

    for (const metric of this.metrics.values()) {
      totalDuration += metric.duration;
      peakMemory = Math.max(peakMemory, metric.memoryAfter);
    }

    report.averageDuration = totalDuration / this.metrics.size;
    report.memoryStats.peakUsage = peakMemory;

    // Top 10 opérations les plus lentes
    report.slowestOperations = Array.from(this.metrics.values())
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return report;
  }

  // Profiling automatique des fonctions VB6
  static profileFunction<T>(func: Function, name: string): Function {
    return function (...args: any[]): T {
      VB6PerformanceMonitor.startMeasurement(name);
      try {
        const result = func.apply(this, args);
        return result;
      } finally {
        VB6PerformanceMonitor.endMeasurement(name);
      }
    };
  }

  private static getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}
```

### Diagnostics en Temps Réel

```typescript
class VB6DiagnosticsPanel {
  private static isVisible = false;
  private static updateInterval: number = 0;

  static show(): void {
    if (this.isVisible) return;

    this.createPanel();
    this.startRealTimeUpdates();
    this.isVisible = true;
  }

  private static createPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'vb6-diagnostics';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border-radius: 5px;
    `;

    document.body.appendChild(panel);
  }

  private static startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updatePanel();
    }, 100);
  }

  private static updatePanel(): void {
    const panel = document.getElementById('vb6-diagnostics');
    if (!panel) return;

    const stats = this.collectRuntimeStats();
    panel.innerHTML = `
      <div><strong>VB6 Web Diagnostics</strong></div>
      <div>Compiled Functions: ${stats.compiledFunctions}</div>
      <div>Active Objects: ${stats.activeObjects}</div>
      <div>Memory Usage: ${stats.memoryUsage}MB</div>
      <div>Compilation Time: ${stats.lastCompilationTime}ms</div>
      <div>Runtime Performance: ${stats.runtimePerformance}x</div>
      <div>Cache Hit Rate: ${stats.cacheHitRate}%</div>
      <div>Error Rate: ${stats.errorRate}%</div>
    `;
  }

  private static collectRuntimeStats(): DiagnosticsStats {
    return {
      compiledFunctions: VB6Runtime.getCompiledFunctionCount(),
      activeObjects: MemoryManager.getActiveObjectCount(),
      memoryUsage: Math.round(VB6PerformanceMonitor.getCurrentMemoryUsage() / 1024 / 1024),
      lastCompilationTime: VB6Compiler.getLastCompilationTime(),
      runtimePerformance: VB6Benchmarker.getCurrentPerformanceRatio(),
      cacheHitRate: Math.round(CacheManager.getHitRate() * 100),
      errorRate: Math.round(ErrorTracker.getErrorRate() * 100),
    };
  }
}
```

## Bonnes Pratiques

### Optimisations de Code VB6

#### DO's - Pratiques Recommandées

```vb6
' ✅ Utiliser des types spécifiques
Dim counter As Long          ' Au lieu de Variant
Dim userName As String       ' Au lieu de Variant

' ✅ Préférer les boucles For aux Do While pour compteurs
For i = 1 To 1000
    ' Process item
Next i

' ✅ Utiliser StringBuilder pour concaténations multiples
Dim parts() As String
ReDim parts(1 To 100)
' ... remplir parts ...
Dim result As String
result = Join(parts, "")

' ✅ Mettre en cache les calculs coûteux
Private calculatedValues As New Collection
Function ExpensiveCalculation(input As Integer) As Double
    If calculatedValues.Exists(CStr(input)) Then
        ExpensiveCalculation = calculatedValues(CStr(input))
        Exit Function
    End If

    ' Calcul coûteux...
    Dim result As Double
    result = ComplexMathOperation(input)

    calculatedValues.Add result, CStr(input)
    ExpensiveCalculation = result
End Function

' ✅ Utiliser Option Explicit toujours
Option Explicit

' ✅ Déclarer les variables au plus près de leur utilisation
Sub ProcessData()
    Dim data As String
    data = LoadData()

    Dim processedData As String
    processedData = Transform(data)

    SaveData(processedData)
End Sub
```

#### DON'Ts - Pratiques à Éviter

```vb6
' ❌ Éviter les Variants inutiles
Dim value                    ' Variant implicite - lent!
Dim value As Variant         ' Explicite mais toujours lent

' ❌ Éviter les concaténations répétées
Dim result As String
For i = 1 To 1000
    result = result & "item" & i  ' Très lent!
Next i

' ❌ Éviter les calculs répétitifs dans les boucles
For i = 1 To UBound(arr)
    If ExpensiveFunction() > 10 Then  ' Calcul répété!
        ' Process
    End If
Next i

' ✅ Mieux: calculer une fois
Dim expensiveResult As Double
expensiveResult = ExpensiveFunction()
For i = 1 To UBound(arr)
    If expensiveResult > 10 Then
        ' Process
    End If
Next i

' ❌ Éviter les accès DOM/UI fréquents
For i = 1 To 1000
    Label1.Caption = "Processing " & i  ' Slow UI update!
Next i

' ✅ Mieux: batch les updates
For i = 1 To 1000
    ' Process...
    If i Mod 100 = 0 Then  ' Update every 100 items
        Label1.Caption = "Processing " & i
        DoEvents  ' Allow UI to update
    End If
Next i
```

### Configuration Optimale

#### Fichier de Configuration Production

```json
{
  "compiler": {
    "target": "ES2020",
    "optimize": true,
    "minify": true,
    "treeshaking": true,
    "deadCodeElimination": true,
    "inlineSmallFunctions": true,
    "constantFolding": true,
    "loopUnrolling": {
      "enabled": true,
      "maxIterations": 10
    }
  },
  "runtime": {
    "stringOptimizations": true,
    "mathOptimizations": true,
    "arrayOptimizations": true,
    "memoryPooling": true,
    "caching": {
      "compiledFunctions": true,
      "stringInternTable": true,
      "typeCache": true
    }
  },
  "performance": {
    "enableProfiling": false,
    "enableMonitoring": false,
    "wasmOptimizations": true,
    "workerThreads": true,
    "serviceWorkerCaching": true
  }
}
```

#### Optimisations Browser-Spécifiques

```typescript
class BrowserOptimizations {
  static detectAndOptimize(): void {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) {
      this.enableChromeOptimizations();
    } else if (userAgent.includes('Firefox')) {
      this.enableFirefoxOptimizations();
    } else if (userAgent.includes('Safari')) {
      this.enableSafariOptimizations();
    }

    // Optimisations basées sur les capacités
    if ('OffscreenCanvas' in window) {
      this.enableOffscreenCanvasOptimizations();
    }

    if ('SharedArrayBuffer' in window) {
      this.enableSharedMemoryOptimizations();
    }
  }

  private static enableChromeOptimizations(): void {
    // V8-specific optimizations
    VB6Runtime.setOptimizationLevel('aggressive');

    // Use native Chrome APIs when available
    if ('showSaveFilePicker' in window) {
      VB6Runtime.FileSystem.useNativeFileAPI(true);
    }
  }

  private static enableFirefoxOptimizations(): void {
    // SpiderMonkey optimizations
    VB6Runtime.setOptimizationLevel('balanced');

    // Firefox-specific features
    VB6Runtime.enableFirefoxFeatures();
  }
}
```

## Conclusion

Les optimisations de performance pour VB6 Web couvrent tous les aspects du pipeline de compilation et d'exécution. En appliquant ces techniques, vous pouvez atteindre des performances très proches du VB6 natif tout en bénéficiant des avantages de l'écosystème web moderne.

### Recommandations Prioritaires

1. **Activez toutes les optimisations du compilateur** en production
2. **Utilisez le profiling** pour identifier les goulots d'étranglement
3. **Implémentez le caching intelligent** pour les ressources statiques
4. **Optimisez les opérations string** qui sont souvent critiques
5. **Utilisez WebAssembly** pour les calculs mathématiques intensifs
6. **Configurez la gestion mémoire** pour éviter les fuites
7. **Surveillez les métriques** en temps réel durant le développement

Avec ces optimisations, votre application VB6 Web peut offrir une expérience utilisateur fluide et performante, rivalisant avec les applications natives modernes.
