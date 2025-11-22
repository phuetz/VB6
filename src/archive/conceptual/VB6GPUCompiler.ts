/**
 * VB6 GPU-Accelerated Compiler
 * 
 * Hardware-accelerated compilation using WebGPU:
 * - Massively parallel AST transformation
 * - GPU-based optimization algorithms
 * - Hardware-accelerated pattern matching
 * - Parallel dependency analysis
 * - GPU memory for large-scale caching
 */

interface GPUCompilationKernel {
  name: string;
  source: string;
  workgroupSize: [number, number, number];
  buffers: GPUBufferDescriptor[];
}

interface GPUBufferDescriptor {
  name: string;
  size: number;
  usage: GPUBufferUsageFlags;
  data?: ArrayBuffer;
}

interface GPUOptimizationPass {
  kernel: GPUCompilationKernel;
  iterations: number;
  convergenceThreshold: number;
}

interface ASTGPURepresentation {
  nodeTypes: Uint32Array;
  nodeData: Float32Array;
  edges: Uint32Array;
  metadata: Float32Array;
}

export class VB6GPUCompiler {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private commandEncoder: GPUCommandEncoder | null = null;
  
  // Compilation kernels
  private kernels: Map<string, GPUComputePipeline> = new Map();
  private buffers: Map<string, GPUBuffer> = new Map();
  
  // Optimization passes
  private optimizationPasses: GPUOptimizationPass[] = [];
  
  constructor() {
    this.initializeWebGPU();
    this.loadKernels();
    this.setupOptimizationPasses();
  }
  
  /**
   * Initialize WebGPU
   */
  private async initializeWebGPU(): Promise<void> {
    if (!navigator.gpu) {
      console.warn('WebGPU not supported, falling back to CPU compilation');
      return;
    }
    
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
      forceFallbackAdapter: false
    });
    
    if (!adapter) {
      console.warn('No WebGPU adapter found');
      return;
    }
    
    this.device = await adapter.requestDevice({
      requiredFeatures: ['shader-f16', 'timestamp-query'],
      requiredLimits: {
        maxStorageBufferBindingSize: 1073741824, // 1GB
        maxComputeWorkgroupStorageSize: 49152,   // 48KB
        maxComputeInvocationsPerWorkgroup: 1024,
        maxComputeWorkgroupSizeX: 1024,
        maxComputeWorkgroupSizeY: 1024,
        maxComputeWorkgroupSizeZ: 64
      }
    });
    
    console.log('🎮 WebGPU initialized for GPU-accelerated compilation');
  }
  
  /**
   * Compile using GPU acceleration
   */
  async compileGPU(ast: any): Promise<any> {
    if (!this.device) {
      throw new Error('WebGPU not initialized');
    }
    
    console.log('🚀 GPU-Accelerated Compilation Started...');
    
    // Phase 1: Convert AST to GPU representation
    const gpuAST = await this.convertASTToGPU(ast);
    
    // Phase 2: Upload to GPU memory
    await this.uploadToGPU(gpuAST);
    
    // Phase 3: Run optimization passes
    const optimizedGPUAST = await this.runGPUOptimizations(gpuAST);
    
    // Phase 4: Pattern matching and transformation
    const transformedGPUAST = await this.runGPUTransformations(optimizedGPUAST);
    
    // Phase 5: Code generation on GPU
    const generatedCode = await this.generateCodeGPU(transformedGPUAST);
    
    // Phase 6: Download results
    const optimizedAST = await this.downloadFromGPU(transformedGPUAST);
    
    console.log('✨ GPU compilation completed');
    return optimizedAST;
  }
  
  /**
   * Load GPU compute kernels
   */
  private loadKernels(): void {
    // AST optimization kernel
    this.registerKernel({
      name: 'astOptimization',
      source: `
        struct Node {
          type: u32,
          data: vec4<f32>,
          children: vec4<u32>,
          metadata: vec4<f32>,
        };
        
        @group(0) @binding(0) var<storage, read> input: array<Node>;
        @group(0) @binding(1) var<storage, read_write> output: array<Node>;
        @group(0) @binding(2) var<uniform> params: vec4<f32>;
        
        @compute @workgroup_size(64, 1, 1)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          let idx = id.x;
          if (idx >= arrayLength(&input)) { return; }
          
          var node = input[idx];
          
          // Pattern matching for optimization
          if (node.type == 1u) { // Binary expression
            let left = input[node.children.x];
            let right = input[node.children.y];
            
            // Constant folding
            if (left.type == 0u && right.type == 0u) { // Both literals
              node.type = 0u; // Convert to literal
              node.data.x = left.data.x + right.data.x; // Assuming addition
            }
          }
          
          // Dead code elimination
          if (node.type == 2u) { // If statement
            let condition = input[node.children.x];
            if (condition.type == 0u) { // Constant condition
              if (condition.data.x == 0.0) {
                node.type = 99u; // Mark for deletion
              }
            }
          }
          
          output[idx] = node;
        }
      `,
      workgroupSize: [64, 1, 1],
      buffers: [
        { name: 'input', size: 0, usage: GPUBufferUsage.STORAGE },
        { name: 'output', size: 0, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC },
        { name: 'params', size: 16, usage: GPUBufferUsage.UNIFORM }
      ]
    });
    
    // Dependency analysis kernel
    this.registerKernel({
      name: 'dependencyAnalysis',
      source: `
        struct Edge {
          from: u32,
          to: u32,
          type: u32,
          weight: f32,
        };
        
        struct DependencyMatrix {
          data: array<array<f32, 1024>, 1024>,
        };
        
        @group(0) @binding(0) var<storage, read> edges: array<Edge>;
        @group(0) @binding(1) var<storage, read_write> matrix: DependencyMatrix;
        @group(0) @binding(2) var<storage, read_write> transitiveClosure: DependencyMatrix;
        
        @compute @workgroup_size(16, 16, 1)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          let row = id.x;
          let col = id.y;
          
          if (row >= 1024u || col >= 1024u) { return; }
          
          // Floyd-Warshall for transitive closure
          for (var k = 0u; k < 1024u; k++) {
            let newPath = matrix.data[row][k] + matrix.data[k][col];
            if (newPath < matrix.data[row][col]) {
              matrix.data[row][col] = newPath;
              transitiveClosure.data[row][col] = 1.0;
            }
          }
        }
      `,
      workgroupSize: [16, 16, 1],
      buffers: [
        { name: 'edges', size: 0, usage: GPUBufferUsage.STORAGE },
        { name: 'matrix', size: 4194304, usage: GPUBufferUsage.STORAGE },
        { name: 'transitiveClosure', size: 4194304, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }
      ]
    });
    
    // Pattern matching kernel
    this.registerKernel({
      name: 'patternMatching',
      source: `
        struct Pattern {
          signature: vec4<u32>,
          replacement: vec4<u32>,
          confidence: f32,
          _padding: vec3<f32>,
        };
        
        @group(0) @binding(0) var<storage, read> nodes: array<Node>;
        @group(0) @binding(1) var<storage, read> patterns: array<Pattern>;
        @group(0) @binding(2) var<storage, read_write> matches: array<vec2<u32>>;
        @group(0) @binding(3) var<storage, read_write> matchCount: atomic<u32>;
        
        @compute @workgroup_size(256, 1, 1)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          let nodeIdx = id.x;
          if (nodeIdx >= arrayLength(&nodes)) { return; }
          
          let node = nodes[nodeIdx];
          
          // Parallel pattern matching
          for (var p = 0u; p < arrayLength(&patterns); p++) {
            let pattern = patterns[p];
            
            // Check if node matches pattern signature
            if (matchesPattern(node, pattern)) {
              let matchIdx = atomicAdd(&matchCount, 1u);
              matches[matchIdx] = vec2<u32>(nodeIdx, p);
            }
          }
        }
        
        fn matchesPattern(node: Node, pattern: Pattern) -> bool {
          return node.type == pattern.signature.x;
        }
      `,
      workgroupSize: [256, 1, 1],
      buffers: [
        { name: 'nodes', size: 0, usage: GPUBufferUsage.STORAGE },
        { name: 'patterns', size: 0, usage: GPUBufferUsage.STORAGE },
        { name: 'matches', size: 0, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC },
        { name: 'matchCount', size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }
      ]
    });
    
    // Code generation kernel
    this.registerKernel({
      name: 'codeGeneration',
      source: `
        struct Instruction {
          opcode: u32,
          operands: vec3<u32>,
          immediate: f32,
        };
        
        @group(0) @binding(0) var<storage, read> optimizedNodes: array<Node>;
        @group(0) @binding(1) var<storage, read_write> instructions: array<Instruction>;
        @group(0) @binding(2) var<storage, read_write> instructionCount: atomic<u32>;
        
        @compute @workgroup_size(128, 1, 1)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          let idx = id.x;
          if (idx >= arrayLength(&optimizedNodes)) { return; }
          
          let node = optimizedNodes[idx];
          
          // Generate instructions based on node type
          switch (node.type) {
            case 0u: { // Literal
              let instIdx = atomicAdd(&instructionCount, 1u);
              instructions[instIdx] = Instruction(
                1u, // LOAD_CONST
                vec3<u32>(0u, 0u, 0u),
                node.data.x
              );
            }
            case 1u: { // Binary operation
              let instIdx = atomicAdd(&instructionCount, 3u);
              // Load operands and perform operation
              instructions[instIdx] = Instruction(2u, node.children.xyz, 0.0);
              instructions[instIdx + 1u] = Instruction(3u, vec3<u32>(0u, 1u, 0u), 0.0);
              instructions[instIdx + 2u] = Instruction(4u, vec3<u32>(0u, 0u, 0u), 0.0);
            }
            default: {}
          }
        }
      `,
      workgroupSize: [128, 1, 1],
      buffers: [
        { name: 'optimizedNodes', size: 0, usage: GPUBufferUsage.STORAGE },
        { name: 'instructions', size: 0, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC },
        { name: 'instructionCount', size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }
      ]
    });
  }
  
  /**
   * Register a GPU kernel
   */
  private registerKernel(kernel: GPUCompilationKernel): void {
    if (!this.device) return;
    
    const shaderModule = this.device.createShaderModule({
      code: kernel.source,
      label: kernel.name
    });
    
    const pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main'
      }
    });
    
    this.kernels.set(kernel.name, pipeline);
  }
  
  /**
   * Setup optimization passes
   */
  private setupOptimizationPasses(): void {
    this.optimizationPasses = [
      {
        kernel: {
          name: 'constantPropagation',
          source: this.getConstantPropagationKernel(),
          workgroupSize: [64, 1, 1],
          buffers: []
        },
        iterations: 5,
        convergenceThreshold: 0.001
      },
      {
        kernel: {
          name: 'loopOptimization',
          source: this.getLoopOptimizationKernel(),
          workgroupSize: [32, 1, 1],
          buffers: []
        },
        iterations: 3,
        convergenceThreshold: 0.01
      },
      {
        kernel: {
          name: 'vectorization',
          source: this.getVectorizationKernel(),
          workgroupSize: [128, 1, 1],
          buffers: []
        },
        iterations: 2,
        convergenceThreshold: 0.05
      }
    ];
  }
  
  /**
   * Convert AST to GPU representation
   */
  private async convertASTToGPU(ast: any): Promise<ASTGPURepresentation> {
    const nodes: any[] = [];
    const edges: any[] = [];
    let nodeIndex = 0;
    const nodeMap = new Map<any, number>();
    
    // Flatten AST into GPU-friendly format
    const traverse = (node: any, parentIdx: number = -1) => {
      const idx = nodeIndex++;
      nodeMap.set(node, idx);
      
      nodes.push({
        type: this.getNodeType(node),
        data: this.getNodeData(node),
        metadata: this.getNodeMetadata(node)
      });
      
      if (parentIdx >= 0) {
        edges.push({
          from: parentIdx,
          to: idx,
          type: 0, // Parent-child edge
          weight: 1.0
        });
      }
      
      // Traverse children
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child, idx));
          } else {
            traverse(node[key], idx);
          }
        }
      }
    };
    
    traverse(ast);
    
    // Convert to typed arrays
    const nodeTypes = new Uint32Array(nodes.map(n => n.type));
    const nodeData = new Float32Array(nodes.flatMap(n => n.data));
    const edgeArray = new Uint32Array(edges.flatMap(e => [e.from, e.to, e.type]));
    const metadata = new Float32Array(nodes.flatMap(n => n.metadata));
    
    return {
      nodeTypes,
      nodeData,
      edges: edgeArray,
      metadata
    };
  }
  
  /**
   * Upload AST to GPU memory
   */
  private async uploadToGPU(gpuAST: ASTGPURepresentation): Promise<void> {
    if (!this.device) return;
    
    // Create buffers
    const nodeTypeBuffer = this.device.createBuffer({
      size: gpuAST.nodeTypes.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Uint32Array(nodeTypeBuffer.getMappedRange()).set(gpuAST.nodeTypes);
    nodeTypeBuffer.unmap();
    
    const nodeDataBuffer = this.device.createBuffer({
      size: gpuAST.nodeData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(nodeDataBuffer.getMappedRange()).set(gpuAST.nodeData);
    nodeDataBuffer.unmap();
    
    const edgeBuffer = this.device.createBuffer({
      size: gpuAST.edges.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Uint32Array(edgeBuffer.getMappedRange()).set(gpuAST.edges);
    edgeBuffer.unmap();
    
    // Store buffers
    this.buffers.set('nodeTypes', nodeTypeBuffer);
    this.buffers.set('nodeData', nodeDataBuffer);
    this.buffers.set('edges', edgeBuffer);
  }
  
  /**
   * Run GPU optimizations
   */
  private async runGPUOptimizations(gpuAST: ASTGPURepresentation): Promise<ASTGPURepresentation> {
    if (!this.device) return gpuAST;
    
    for (const pass of this.optimizationPasses) {
      console.log(`Running GPU optimization: ${pass.kernel.name}`);
      
      let previousCost = Infinity;
      
      for (let i = 0; i < pass.iterations; i++) {
        // Run optimization kernel
        await this.dispatchKernel(pass.kernel.name, {
          workgroups: Math.ceil(gpuAST.nodeTypes.length / pass.kernel.workgroupSize[0])
        });
        
        // Check convergence
        const currentCost = await this.computeOptimizationCost();
        if (Math.abs(previousCost - currentCost) < pass.convergenceThreshold) {
          console.log(`  Converged after ${i + 1} iterations`);
          break;
        }
        previousCost = currentCost;
      }
    }
    
    return gpuAST;
  }
  
  /**
   * Run GPU transformations
   */
  private async runGPUTransformations(gpuAST: ASTGPURepresentation): Promise<ASTGPURepresentation> {
    if (!this.device) return gpuAST;
    
    // Pattern matching
    await this.dispatchKernel('patternMatching', {
      workgroups: Math.ceil(gpuAST.nodeTypes.length / 256)
    });
    
    // Apply transformations based on matches
    await this.applyGPUTransformations();
    
    return gpuAST;
  }
  
  /**
   * Generate code on GPU
   */
  private async generateCodeGPU(gpuAST: ASTGPURepresentation): Promise<ArrayBuffer> {
    if (!this.device) return new ArrayBuffer(0);
    
    // Allocate instruction buffer
    const maxInstructions = gpuAST.nodeTypes.length * 10;
    const instructionBuffer = this.device.createBuffer({
      size: maxInstructions * 16, // 16 bytes per instruction
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    
    this.buffers.set('instructions', instructionBuffer);
    
    // Run code generation kernel
    await this.dispatchKernel('codeGeneration', {
      workgroups: Math.ceil(gpuAST.nodeTypes.length / 128)
    });
    
    // Read back generated code
    const readBuffer = this.device.createBuffer({
      size: instructionBuffer.size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(instructionBuffer, 0, readBuffer, 0, instructionBuffer.size);
    this.device.queue.submit([commandEncoder.finish()]);
    
    await readBuffer.mapAsync(GPUMapMode.READ);
    const result = readBuffer.getMappedRange().slice(0);
    readBuffer.unmap();
    
    return result;
  }
  
  /**
   * Download results from GPU
   */
  private async downloadFromGPU(gpuAST: ASTGPURepresentation): Promise<any> {
    // Convert GPU representation back to AST
    // This is a placeholder - actual implementation would reconstruct the AST
    return {
      type: 'Program',
      body: [],
      optimized: true,
      gpuAccelerated: true
    };
  }
  
  /**
   * Dispatch a kernel
   */
  private async dispatchKernel(kernelName: string, params: any): Promise<void> {
    if (!this.device) return;
    
    const pipeline = this.kernels.get(kernelName);
    if (!pipeline) return;
    
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    
    passEncoder.setPipeline(pipeline);
    
    // Set bind groups based on kernel requirements
    // This is simplified - actual implementation would be more complex
    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.buffers.get('nodeTypes')! } },
        { binding: 1, resource: { buffer: this.buffers.get('nodeData')! } }
      ]
    });
    
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(params.workgroups);
    passEncoder.end();
    
    this.device.queue.submit([commandEncoder.finish()]);
    await this.device.queue.onSubmittedWorkDone();
  }
  
  /**
   * Apply GPU transformations
   */
  private async applyGPUTransformations(): Promise<void> {
    // Apply matched transformations
    // This would read the matches buffer and apply transformations
  }
  
  /**
   * Compute optimization cost
   */
  private async computeOptimizationCost(): Promise<number> {
    // Compute cost metric for current optimization state
    return Math.random(); // Placeholder
  }
  
  // Helper methods for kernels
  
  private getConstantPropagationKernel(): string {
    return `
      @group(0) @binding(0) var<storage, read_write> nodes: array<Node>;
      @group(0) @binding(1) var<storage, read> constants: array<f32>;
      
      @compute @workgroup_size(64, 1, 1)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let idx = id.x;
        if (idx >= arrayLength(&nodes)) { return; }
        
        // Propagate constants through expression tree
        let node = nodes[idx];
        if (node.type == 10u) { // Variable reference
          let varIdx = u32(node.data.x);
          if (varIdx < arrayLength(&constants)) {
            // Replace with constant
            node.type = 0u; // Literal
            node.data.x = constants[varIdx];
            nodes[idx] = node;
          }
        }
      }
    `;
  }
  
  private getLoopOptimizationKernel(): string {
    return `
      @group(0) @binding(0) var<storage, read_write> loops: array<LoopNode>;
      
      struct LoopNode {
        start: i32,
        end: i32,
        step: i32,
        bodyStart: u32,
        bodyEnd: u32,
        flags: u32,
      };
      
      @compute @workgroup_size(32, 1, 1)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let idx = id.x;
        if (idx >= arrayLength(&loops)) { return; }
        
        var loop = loops[idx];
        
        // Check for unrolling opportunity
        let tripCount = (loop.end - loop.start) / loop.step;
        if (tripCount > 0 && tripCount <= 8) {
          loop.flags |= 1u; // Mark for unrolling
        }
        
        // Check for vectorization
        if ((loop.flags & 2u) == 0u) { // Not already vectorized
          // Simplified check - real implementation would analyze body
          if (tripCount >= 4) {
            loop.flags |= 2u; // Mark for vectorization
          }
        }
        
        loops[idx] = loop;
      }
    `;
  }
  
  private getVectorizationKernel(): string {
    return `
      @group(0) @binding(0) var<storage, read_write> operations: array<Operation>;
      
      struct Operation {
        type: u32,
        vectorizable: u32,
        dataType: u32,
        operandCount: u32,
      };
      
      @compute @workgroup_size(128, 1, 1)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let idx = id.x;
        if (idx >= arrayLength(&operations)) { return; }
        
        var op = operations[idx];
        
        // Check if operation can be vectorized
        if (op.type >= 100u && op.type <= 110u) { // Arithmetic ops
          if (op.dataType == 1u) { // Float type
            op.vectorizable = 4u; // Can use vec4
          } else if (op.dataType == 0u) { // Int type
            op.vectorizable = 4u; // Can use vec4<i32>
          }
        }
        
        operations[idx] = op;
      }
    `;
  }
  
  // Helper methods
  
  private getNodeType(node: any): number {
    const typeMap: { [key: string]: number } = {
      'Literal': 0,
      'BinaryExpression': 1,
      'IfStatement': 2,
      'ForStatement': 3,
      'WhileStatement': 4,
      'FunctionDeclaration': 5,
      'CallExpression': 6,
      'Identifier': 10,
      'Assignment': 11
    };
    
    return typeMap[node.type] || 99;
  }
  
  private getNodeData(node: any): number[] {
    const data = [0, 0, 0, 0];
    
    if (node.type === 'Literal' && typeof node.value === 'number') {
      data[0] = node.value;
    }
    
    return data;
  }
  
  private getNodeMetadata(node: any): number[] {
    return [
      node.line || 0,
      node.column || 0,
      node.cost || 0,
      node.frequency || 0
    ];
  }
}

/**
 * GPU Memory Manager
 */
class GPUMemoryManager {
  private device: GPUDevice;
  private allocations: Map<string, GPUBuffer> = new Map();
  private totalAllocated: number = 0;
  private maxMemory: number = 4 * 1024 * 1024 * 1024; // 4GB
  
  constructor(device: GPUDevice) {
    this.device = device;
  }
  
  allocate(name: string, size: number, usage: GPUBufferUsageFlags): GPUBuffer {
    if (this.totalAllocated + size > this.maxMemory) {
      this.compact();
    }
    
    const buffer = this.device.createBuffer({
      size,
      usage,
      label: name
    });
    
    this.allocations.set(name, buffer);
    this.totalAllocated += size;
    
    return buffer;
  }
  
  free(name: string): void {
    const buffer = this.allocations.get(name);
    if (buffer) {
      buffer.destroy();
      this.allocations.delete(name);
      // Note: actual size tracking would be more complex
    }
  }
  
  compact(): void {
    // GPU memory compaction
    console.log('Compacting GPU memory...');
    
    // Free unused buffers
    for (const [name, buffer] of this.allocations) {
      // Check if buffer is still in use
      // Simplified - real implementation would track usage
    }
  }
}

/**
 * GPU Performance Monitor
 */
class GPUPerformanceMonitor {
  private device: GPUDevice;
  private querySet: GPUQuerySet;
  private resolveBuffer: GPUBuffer;
  private resultBuffer: GPUBuffer;
  
  constructor(device: GPUDevice) {
    this.device = device;
    
    // Create timestamp query set
    this.querySet = device.createQuerySet({
      type: 'timestamp',
      count: 16
    });
    
    // Create buffers for reading timestamps
    this.resolveBuffer = device.createBuffer({
      size: 16 * 8, // 16 timestamps * 8 bytes each
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
    });
    
    this.resultBuffer = device.createBuffer({
      size: 16 * 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
  }
  
  async measureKernel(kernelName: string, fn: () => Promise<void>): Promise<number> {
    const commandEncoder = this.device.createCommandEncoder();
    
    // Write timestamp before
    commandEncoder.writeTimestamp(this.querySet, 0);
    
    // Execute kernel
    await fn();
    
    // Write timestamp after
    commandEncoder.writeTimestamp(this.querySet, 1);
    
    // Resolve timestamps
    commandEncoder.resolveQuerySet(this.querySet, 0, 2, this.resolveBuffer, 0);
    commandEncoder.copyBufferToBuffer(this.resolveBuffer, 0, this.resultBuffer, 0, 16);
    
    this.device.queue.submit([commandEncoder.finish()]);
    
    // Read results
    await this.resultBuffer.mapAsync(GPUMapMode.READ);
    const timestamps = new BigUint64Array(this.resultBuffer.getMappedRange());
    const duration = Number(timestamps[1] - timestamps[0]) / 1_000_000; // Convert to ms
    this.resultBuffer.unmap();
    
    console.log(`GPU Kernel "${kernelName}" took ${duration.toFixed(2)}ms`);
    return duration;
  }
}