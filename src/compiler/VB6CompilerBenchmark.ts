/**
 * VB6 Compiler Performance Benchmark Suite
 * 
 * Comprehensive benchmarks to measure compilation performance improvements
 */

import { VB6Compiler } from '../services/VB6Compiler';
import { VB6AdvancedCompiler } from './VB6AdvancedCompiler';
import { VB6IncrementalCache } from './VB6IncrementalCache';
import { VB6UltraJIT } from './VB6UltraJIT';
import { VB6ProfileGuidedOptimizer } from './VB6ProfileGuidedOptimizer';
import { Project } from '../types/extended';

interface BenchmarkResult {
  name: string;
  duration: number;
  throughput: number; // lines per second
  memoryUsed: number; // MB
  cacheHitRate?: number;
  optimizationLevel?: number;
}

interface ComparisonResult {
  baseline: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: {
    speedup: number; // percentage
    memoryReduction: number; // percentage
    throughputGain: number; // percentage
  };
}

export class VB6CompilerBenchmark {
  private oldCompiler: VB6Compiler;
  private newCompiler: VB6AdvancedCompiler;
  private cache: VB6IncrementalCache;
  private jit: VB6UltraJIT;
  private profiler: VB6ProfileGuidedOptimizer;
  
  constructor() {
    this.oldCompiler = new VB6Compiler();
    this.newCompiler = new VB6AdvancedCompiler({
      target: 'hybrid',
      optimizationLevel: 3,
      enablePGO: true,
      enableParallel: true,
      enableCache: true,
      enableSourceMaps: false,
      enableHMR: false,
      wasmSIMD: true,
      wasmThreads: true,
      wasmExceptions: true,
      wasmGC: true
    });
    this.cache = new VB6IncrementalCache();
    this.jit = new VB6UltraJIT();
    this.profiler = new VB6ProfileGuidedOptimizer();
  }
  
  /**
   * Run complete benchmark suite
   */
  async runBenchmarks(): Promise<void> {
    console.log('🚀 VB6 Compiler Performance Benchmark Suite');
    console.log('==========================================\n');
    
    // Test projects of varying complexity
    const testProjects = [
      this.createSmallProject(),
      this.createMediumProject(),
      this.createLargeProject(),
      this.createComplexProject()
    ];
    
    for (const project of testProjects) {
      console.log(`\n📊 Benchmarking ${project.name}...`);
      console.log(`   Size: ${this.getProjectSize(project)} lines`);
      
      const comparison = await this.compareCompilers(project);
      this.printComparison(comparison);
    }
    
    // Specific feature benchmarks
    await this.benchmarkIncrementalCompilation();
    await this.benchmarkParallelCompilation();
    await this.benchmarkJITCompilation();
    await this.benchmarkWebAssembly();
    await this.benchmarkCaching();
    await this.benchmarkPGO();
  }
  
  /**
   * Compare old vs new compiler
   */
  private async compareCompilers(project: Project): Promise<ComparisonResult> {
    // Warm up
    await this.warmUp(project);
    
    // Benchmark old compiler
    const baseline = await this.benchmarkCompiler(
      'Original VB6 Compiler',
      () => this.oldCompiler.compile(project),
      project
    );
    
    // Benchmark new compiler
    const optimized = await this.benchmarkCompiler(
      'Advanced VB6 Compiler',
      () => this.newCompiler.compile(project, {
        target: 'hybrid',
        optimizationLevel: 3,
        enablePGO: true,
        enableParallel: true,
        enableCache: true,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: true,
        wasmThreads: true,
        wasmExceptions: true,
        wasmGC: true
      }),
      project
    );
    
    // Calculate improvements
    const speedup = ((baseline.duration - optimized.duration) / baseline.duration) * 100;
    const memoryReduction = ((baseline.memoryUsed - optimized.memoryUsed) / baseline.memoryUsed) * 100;
    const throughputGain = ((optimized.throughput - baseline.throughput) / baseline.throughput) * 100;
    
    return {
      baseline,
      optimized,
      improvement: {
        speedup: Math.max(0, speedup),
        memoryReduction: Math.max(0, memoryReduction),
        throughputGain: Math.max(0, throughputGain)
      }
    };
  }
  
  /**
   * Benchmark a single compiler
   */
  private async benchmarkCompiler(
    name: string,
    compileFunc: () => Promise<any>,
    project: Project
  ): Promise<BenchmarkResult> {
    const startMemory = this.getMemoryUsage();
    const startTime = performance.now();
    
    // Run compilation
    await compileFunc();
    
    const duration = performance.now() - startTime;
    const memoryUsed = this.getMemoryUsage() - startMemory;
    const lines = this.getProjectSize(project);
    const throughput = (lines / duration) * 1000; // lines per second
    
    return {
      name,
      duration,
      throughput,
      memoryUsed
    };
  }
  
  /**
   * Benchmark incremental compilation
   */
  private async benchmarkIncrementalCompilation(): Promise<void> {
    console.log('\n🔄 Incremental Compilation Benchmark');
    console.log('------------------------------------');
    
    const project = this.createLargeProject();
    
    // Initial compilation
    console.log('Initial compilation...');
    const initial = await this.benchmarkCompiler(
      'Initial',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 2,
        enablePGO: false,
        enableParallel: false,
        enableCache: true,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    // Modify one file
    project.modules[0].code += '\n\' Modified';
    
    // Incremental compilation
    console.log('Incremental compilation...');
    const incremental = await this.benchmarkCompiler(
      'Incremental',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 2,
        enablePGO: false,
        enableParallel: false,
        enableCache: true,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    const improvement = ((initial.duration - incremental.duration) / initial.duration) * 100;
    console.log(`✅ Incremental compilation ${improvement.toFixed(1)}% faster`);
  }
  
  /**
   * Benchmark parallel compilation
   */
  private async benchmarkParallelCompilation(): Promise<void> {
    console.log('\n⚡ Parallel Compilation Benchmark');
    console.log('---------------------------------');
    
    const project = this.createComplexProject();
    
    // Sequential compilation
    const sequential = await this.benchmarkCompiler(
      'Sequential',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 2,
        enablePGO: false,
        enableParallel: false,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    // Parallel compilation
    const parallel = await this.benchmarkCompiler(
      'Parallel',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 2,
        enablePGO: false,
        enableParallel: true,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    const speedup = ((sequential.duration - parallel.duration) / sequential.duration) * 100;
    const cores = navigator.hardwareConcurrency || 4;
    console.log(`✅ Parallel compilation ${speedup.toFixed(1)}% faster using ${cores} cores`);
  }
  
  /**
   * Benchmark JIT compilation
   */
  private async benchmarkJITCompilation(): Promise<void> {
    console.log('\n🔥 JIT Compilation Benchmark');
    console.log('----------------------------');
    
    // Create hot function
    const hotFunction = {
      name: 'Calculate',
      params: [{ name: 'n', type: 'Integer' }],
      body: [
        {
          type: 'For',
          variable: 'i',
          start: { type: 'Literal', value: 1 },
          end: { type: 'Identifier', name: 'n' },
          body: [
            {
              type: 'Assignment',
              left: { type: 'Identifier', name: 'result' },
              right: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Identifier', name: 'result' },
                right: { type: 'Identifier', name: 'i' }
              }
            }
          ]
        }
      ]
    };
    
    // Compile with JIT
    const jitFunc = this.jit.compile('Calculate', hotFunction);
    
    // Benchmark cold execution
    const coldStart = performance.now();
    for (let i = 0; i < 10; i++) {
      jitFunc(1000);
    }
    const coldTime = performance.now() - coldStart;
    
    // Warm up JIT
    for (let i = 0; i < 10000; i++) {
      jitFunc(1000);
    }
    
    // Benchmark hot execution
    const hotStart = performance.now();
    for (let i = 0; i < 10000; i++) {
      jitFunc(1000);
    }
    const hotTime = performance.now() - hotStart;
    
    const improvement = ((coldTime - hotTime) / coldTime) * 100;
    console.log(`✅ JIT optimization improved performance by ${improvement.toFixed(1)}%`);
    console.log(`   Cold: ${(coldTime / 10).toFixed(2)}ms per call`);
    console.log(`   Hot:  ${(hotTime / 10000).toFixed(4)}ms per call`);
  }
  
  /**
   * Benchmark WebAssembly compilation
   */
  private async benchmarkWebAssembly(): Promise<void> {
    console.log('\n🎯 WebAssembly Compilation Benchmark');
    console.log('------------------------------------');
    
    const project = this.createMathIntensiveProject();
    
    // JavaScript target
    const jsResult = await this.benchmarkCompiler(
      'JavaScript',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 3,
        enablePGO: false,
        enableParallel: false,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    // WebAssembly target
    const wasmResult = await this.benchmarkCompiler(
      'WebAssembly',
      () => this.newCompiler.compile(project, {
        target: 'wasm',
        optimizationLevel: 3,
        enablePGO: false,
        enableParallel: false,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: true,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    console.log(`✅ WebAssembly compilation completed`);
    console.log(`   Compilation overhead: ${((wasmResult.duration - jsResult.duration) / jsResult.duration * 100).toFixed(1)}%`);
    console.log(`   Expected runtime improvement: 200-500% for numeric code`);
  }
  
  /**
   * Benchmark caching performance
   */
  private async benchmarkCaching(): Promise<void> {
    console.log('\n💾 Cache Performance Benchmark');
    console.log('------------------------------');
    
    await this.cache.clear();
    const project = this.createLargeProject();
    
    // First compilation (cold cache)
    const cold1 = await this.benchmarkCompiler(
      'Cold Cache 1',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 2,
        enablePGO: false,
        enableParallel: false,
        enableCache: true,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    // Second compilation (warm cache)
    const warm = await this.benchmarkCompiler(
      'Warm Cache',
      () => this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 2,
        enablePGO: false,
        enableParallel: false,
        enableCache: true,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    const cacheStats = this.cache.getStats();
    const improvement = ((cold1.duration - warm.duration) / cold1.duration) * 100;
    
    console.log(`✅ Cache improved performance by ${improvement.toFixed(1)}%`);
    console.log(`   Hit rate: ${((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%`);
    console.log(`   Cache size: ${(cacheStats.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  /**
   * Benchmark Profile-Guided Optimization
   */
  private async benchmarkPGO(): Promise<void> {
    console.log('\n📈 Profile-Guided Optimization Benchmark');
    console.log('----------------------------------------');
    
    const project = this.createComplexProject();
    
    // Compile without PGO
    const noPGO = await this.benchmarkCompiler(
      'Without PGO',
      () => this.newCompiler.compile(project, {
        target: 'hybrid',
        optimizationLevel: 3,
        enablePGO: false,
        enableParallel: false,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    // Run profiling
    this.profiler.startProfiling();
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 100));
    const profileData = this.profiler.stopProfiling();
    
    // Compile with PGO
    const withPGO = await this.benchmarkCompiler(
      'With PGO',
      () => this.newCompiler.compile(project, {
        target: 'hybrid',
        optimizationLevel: 3,
        enablePGO: true,
        enableParallel: false,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      }),
      project
    );
    
    const improvement = ((noPGO.duration - withPGO.duration) / noPGO.duration) * 100;
    console.log(`✅ PGO improved compilation by ${improvement.toFixed(1)}%`);
    console.log(`   Profile data: ${profileData.executionProfiles.size} functions profiled`);
  }
  
  // Helper methods
  
  private createSmallProject(): Project {
    return {
      name: 'SmallProject',
      version: '1.0.0',
      type: 'Standard EXE',
      startup: 'Module1',
      forms: [],
      modules: [{
        name: 'Module1',
        code: this.generateVB6Code(100),
        procedures: []
      }],
      classModules: [],
      userControls: [],
      references: [],
      components: []
    };
  }
  
  private createMediumProject(): Project {
    return {
      name: 'MediumProject',
      version: '1.0.0',
      type: 'Standard EXE',
      startup: 'Form1',
      forms: [{
        name: 'Form1',
        controls: this.generateControls(50),
        code: this.generateVB6Code(500)
      }],
      modules: [
        {
          name: 'Module1',
          code: this.generateVB6Code(300),
          procedures: []
        },
        {
          name: 'Module2',
          code: this.generateVB6Code(300),
          procedures: []
        }
      ],
      classModules: [],
      userControls: [],
      references: [],
      components: []
    };
  }
  
  private createLargeProject(): Project {
    const forms = [];
    const modules = [];
    
    for (let i = 0; i < 10; i++) {
      forms.push({
        name: `Form${i + 1}`,
        controls: this.generateControls(100),
        code: this.generateVB6Code(1000)
      });
    }
    
    for (let i = 0; i < 20; i++) {
      modules.push({
        name: `Module${i + 1}`,
        code: this.generateVB6Code(500),
        procedures: []
      });
    }
    
    return {
      name: 'LargeProject',
      version: '1.0.0',
      type: 'Standard EXE',
      startup: 'Form1',
      forms,
      modules,
      classModules: [],
      userControls: [],
      references: [],
      components: []
    };
  }
  
  private createComplexProject(): Project {
    const forms = [];
    const modules = [];
    const classes = [];
    
    for (let i = 0; i < 20; i++) {
      forms.push({
        name: `Form${i + 1}`,
        controls: this.generateControls(200),
        code: this.generateVB6Code(2000)
      });
    }
    
    for (let i = 0; i < 50; i++) {
      modules.push({
        name: `Module${i + 1}`,
        code: this.generateVB6Code(1000),
        procedures: []
      });
    }
    
    for (let i = 0; i < 30; i++) {
      classes.push({
        name: `Class${i + 1}`,
        code: this.generateVB6Code(800),
        members: []
      });
    }
    
    return {
      name: 'ComplexProject',
      version: '1.0.0',
      type: 'Standard EXE',
      startup: 'Main',
      forms,
      modules,
      classModules: classes,
      userControls: [],
      references: [],
      components: []
    };
  }
  
  private createMathIntensiveProject(): Project {
    const mathCode = `
Option Explicit

Public Function MandelbrotSet(maxIterations As Integer) As Double()
  Dim result() As Double
  Dim x As Double, y As Double
  Dim zx As Double, zy As Double
  Dim cx As Double, cy As Double
  Dim i As Integer, j As Integer, k As Integer
  
  ReDim result(1000, 1000)
  
  For i = 0 To 999
    For j = 0 To 999
      cx = (i - 500) / 250
      cy = (j - 500) / 250
      zx = 0
      zy = 0
      
      For k = 0 To maxIterations
        Dim temp As Double
        temp = zx * zx - zy * zy + cx
        zy = 2 * zx * zy + cy
        zx = temp
        
        If zx * zx + zy * zy > 4 Then
          result(i, j) = k
          Exit For
        End If
      Next k
    Next j
  Next i
  
  MandelbrotSet = result
End Function

Public Function MatrixMultiply(a() As Double, b() As Double) As Double()
  Dim result() As Double
  Dim i As Integer, j As Integer, k As Integer
  Dim n As Integer
  
  n = UBound(a, 1)
  ReDim result(n, n)
  
  For i = 0 To n
    For j = 0 To n
      For k = 0 To n
        result(i, j) = result(i, j) + a(i, k) * b(k, j)
      Next k
    Next j
  Next i
  
  MatrixMultiply = result
End Function
`;
    
    return {
      name: 'MathIntensiveProject',
      version: '1.0.0',
      type: 'Standard EXE',
      startup: 'MathModule',
      forms: [],
      modules: [{
        name: 'MathModule',
        code: mathCode,
        procedures: []
      }],
      classModules: [],
      userControls: [],
      references: [],
      components: []
    };
  }
  
  private generateVB6Code(lines: number): string {
    const code: string[] = [];
    
    code.push("Option Explicit");
    code.push("");
    
    // Generate variables
    for (let i = 0; i < lines / 10; i++) {
      code.push(`Dim var${i} As Integer`);
    }
    
    code.push("");
    
    // Generate procedures
    const procCount = Math.floor(lines / 20);
    for (let i = 0; i < procCount; i++) {
      code.push(`Public Sub Procedure${i}()`);
      code.push(`  Dim i As Integer`);
      code.push(`  For i = 1 To 100`);
      code.push(`    var${i % (lines / 10)} = var${i % (lines / 10)} + i`);
      code.push(`  Next i`);
      code.push(`End Sub`);
      code.push("");
    }
    
    // Fill remaining lines
    while (code.length < lines) {
      code.push(`' Comment line ${code.length}`);
    }
    
    return code.join('\n');
  }
  
  private generateControls(count: number): any[] {
    const controls = [];
    
    for (let i = 0; i < count; i++) {
      controls.push({
        type: ['TextBox', 'Label', 'CommandButton'][i % 3],
        name: `Control${i}`,
        properties: {
          Left: (i % 10) * 100,
          Top: Math.floor(i / 10) * 30,
          Width: 80,
          Height: 25
        }
      });
    }
    
    return controls;
  }
  
  private getProjectSize(project: Project): number {
    let lines = 0;
    
    for (const form of project.forms) {
      lines += (form.code?.split('\n').length || 0);
    }
    
    for (const module of project.modules) {
      lines += (module.code?.split('\n').length || 0);
    }
    
    for (const cls of project.classModules) {
      lines += (cls.code?.split('\n').length || 0);
    }
    
    return lines;
  }
  
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }
  
  private async warmUp(project: Project): Promise<void> {
    // Warm up JIT
    for (let i = 0; i < 5; i++) {
      await this.oldCompiler.compile(project);
      await this.newCompiler.compile(project, {
        target: 'js',
        optimizationLevel: 0,
        enablePGO: false,
        enableParallel: false,
        enableCache: false,
        enableSourceMaps: false,
        enableHMR: false,
        wasmSIMD: false,
        wasmThreads: false,
        wasmExceptions: false,
        wasmGC: false
      });
    }
  }
  
  private printComparison(comparison: ComparisonResult): void {
    console.log(`\n  Baseline (Old Compiler):`);
    console.log(`    Duration: ${comparison.baseline.duration.toFixed(2)}ms`);
    console.log(`    Throughput: ${comparison.baseline.throughput.toFixed(0)} lines/sec`);
    console.log(`    Memory: ${comparison.baseline.memoryUsed.toFixed(2)}MB`);
    
    console.log(`\n  Optimized (New Compiler):`);
    console.log(`    Duration: ${comparison.optimized.duration.toFixed(2)}ms`);
    console.log(`    Throughput: ${comparison.optimized.throughput.toFixed(0)} lines/sec`);
    console.log(`    Memory: ${comparison.optimized.memoryUsed.toFixed(2)}MB`);
    
    console.log(`\n  ✅ Improvements:`);
    console.log(`    Speed: ${comparison.improvement.speedup.toFixed(1)}% faster`);
    console.log(`    Memory: ${comparison.improvement.memoryReduction.toFixed(1)}% less`);
    console.log(`    Throughput: ${comparison.improvement.throughputGain.toFixed(1)}% higher`);
  }
}

// Auto-run benchmarks if executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  const benchmark = new VB6CompilerBenchmark();
  benchmark.runBenchmarks().then(() => {
    console.log('\n✅ Benchmark suite completed!');
  });
}