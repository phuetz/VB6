/**
 * DESIGN PATTERN FIX: Extracted memory management from god object
 * Single Responsibility: Memory allocation, deallocation, and garbage collection
 */

import { EventEmitter } from 'events';

export interface MemoryAllocation {
  id: string;
  size: number;
  type: 'string' | 'array' | 'object' | 'variant' | 'buffer';
  timestamp: number;
  module: string;
  procedure?: string;
  references: number;
}

export interface MemoryStats {
  totalAllocated: number;
  totalDeallocated: number;
  currentUsage: number;
  availableMemory: number;
  allocationsCount: number;
  largestAllocation: number;
  fragmentationRatio: number;
  gcCollections: number;
}

export class VB6MemoryManager extends EventEmitter {
  private allocations: Map<string, MemoryAllocation> = new Map();
  private allocatedMemory: Map<any, MemoryAllocation> = new Map();
  private totalAllocated: number = 0;
  private totalDeallocated: number = 0;
  private maxMemory: number = 1024 * 1024 * 1024; // 1GB default
  private gcThreshold: number = 0.8; // 80% memory usage triggers GC
  private nextAllocationId: number = 1;
  private gcCollections: number = 0;

  constructor(maxMemory?: number) {
    super();
    if (maxMemory) {
      this.maxMemory = maxMemory;
    }
  }

  /**
   * DESIGN PATTERN FIX: Type-safe memory allocation with tracking
   */
  allocate(
    size: number,
    type: 'string' | 'array' | 'object' | 'variant' | 'buffer',
    module: string,
    procedure?: string
  ): any {
    // DESIGN PATTERN FIX: Validate allocation request
    if (size <= 0) {
      throw new Error('Allocation size must be positive');
    }

    if (size > this.maxMemory) {
      throw new Error(`Allocation size ${size} exceeds maximum memory limit ${this.maxMemory}`);
    }

    // Check if we need garbage collection
    if (this.getCurrentUsage() + size > this.maxMemory * this.gcThreshold) {
      this.collectGarbage();
    }

    // Check if allocation would exceed memory limit
    if (this.getCurrentUsage() + size > this.maxMemory) {
      throw new Error(
        `Out of memory: Cannot allocate ${size} bytes (${this.getCurrentUsage()} already in use)`
      );
    }

    // Create allocation record
    const allocation: MemoryAllocation = {
      id: `alloc_${this.nextAllocationId++}`,
      size,
      type,
      timestamp: Date.now(),
      module,
      procedure,
      references: 1,
    };

    // Create the actual memory object/pointer
    const ptr = this.createMemoryObject(type, size);

    // Track the allocation
    this.allocations.set(allocation.id, allocation);
    this.allocatedMemory.set(ptr, allocation);
    this.totalAllocated += size;

    this.emit('memoryAllocated', {
      allocation,
      currentUsage: this.getCurrentUsage(),
      availableMemory: this.getAvailableMemory(),
    });

    return ptr;
  }

  /**
   * DESIGN PATTERN FIX: Safe memory deallocation with reference counting
   */
  deallocate(ptr: any): boolean {
    const allocation = this.allocatedMemory.get(ptr);
    if (!allocation) {
      console.warn('Attempted to deallocate unknown memory pointer');
      return false;
    }

    // Decrease reference count
    allocation.references--;

    // Only actually deallocate when no more references
    if (allocation.references <= 0) {
      this.allocatedMemory.delete(ptr);
      this.allocations.delete(allocation.id);
      this.totalDeallocated += allocation.size;

      this.emit('memoryDeallocated', {
        allocation,
        currentUsage: this.getCurrentUsage(),
        availableMemory: this.getAvailableMemory(),
      });

      return true;
    }

    return false; // Still has references
  }

  /**
   * DESIGN PATTERN FIX: Reference counting for memory objects
   */
  addReference(ptr: any): boolean {
    const allocation = this.allocatedMemory.get(ptr);
    if (allocation) {
      allocation.references++;
      this.emit('referenceAdded', allocation);
      return true;
    }
    return false;
  }

  removeReference(ptr: any): boolean {
    const allocation = this.allocatedMemory.get(ptr);
    if (allocation && allocation.references > 0) {
      allocation.references--;
      this.emit('referenceRemoved', allocation);

      // Auto-deallocate if no more references
      if (allocation.references === 0) {
        return this.deallocate(ptr);
      }
      return true;
    }
    return false;
  }

  /**
   * DESIGN PATTERN FIX: Garbage collection with mark-and-sweep
   */
  collectGarbage(): number {
    const beforeCount = this.allocations.size;
    const beforeMemory = this.getCurrentUsage();

    let collected = 0;
    const toDelete: any[] = [];

    // Mark phase: find unreferenced allocations
    for (const [ptr, allocation] of this.allocatedMemory) {
      if (allocation.references <= 0) {
        toDelete.push(ptr);
      }
    }

    // Sweep phase: delete unreferenced allocations
    for (const ptr of toDelete) {
      if (this.deallocate(ptr)) {
        collected++;
      }
    }

    this.gcCollections++;
    const afterMemory = this.getCurrentUsage();
    const freedMemory = beforeMemory - afterMemory;

    this.emit('garbageCollected', {
      collectedAllocations: collected,
      freedMemory,
      remainingAllocations: this.allocations.size,
      gcCollections: this.gcCollections,
    });

    return freedMemory;
  }

  /**
   * DESIGN PATTERN FIX: Memory defragmentation simulation
   */
  defragment(): void {
    // Simulate memory defragmentation
    // In a real implementation, this would reorganize memory blocks

    this.emit('memoryDefragmented', {
      allocationsCount: this.allocations.size,
      currentUsage: this.getCurrentUsage(),
      fragmentationRatio: this.getFragmentationRatio(),
    });
  }

  /**
   * DESIGN PATTERN FIX: Get comprehensive memory statistics
   */
  getMemoryStats(): MemoryStats {
    const currentUsage = this.getCurrentUsage();
    const largestAllocation = Math.max(
      0,
      ...Array.from(this.allocations.values()).map(a => a.size)
    );

    return {
      totalAllocated: this.totalAllocated,
      totalDeallocated: this.totalDeallocated,
      currentUsage,
      availableMemory: this.maxMemory - currentUsage,
      allocationsCount: this.allocations.size,
      largestAllocation,
      fragmentationRatio: this.getFragmentationRatio(),
      gcCollections: this.gcCollections,
    };
  }

  /**
   * DESIGN PATTERN FIX: Current memory usage calculation
   */
  getCurrentUsage(): number {
    return Array.from(this.allocations.values()).reduce((total, alloc) => total + alloc.size, 0);
  }

  /**
   * DESIGN PATTERN FIX: Available memory calculation
   */
  getAvailableMemory(): number {
    return this.maxMemory - this.getCurrentUsage();
  }

  /**
   * DESIGN PATTERN FIX: Memory usage by module for debugging
   */
  getUsageByModule(): Map<string, number> {
    const usage = new Map<string, number>();

    for (const allocation of this.allocations.values()) {
      const current = usage.get(allocation.module) || 0;
      usage.set(allocation.module, current + allocation.size);
    }

    return usage;
  }

  /**
   * DESIGN PATTERN FIX: Find memory leaks (long-lived allocations)
   */
  findPotentialLeaks(ageThresholdMs: number = 60000): MemoryAllocation[] {
    const now = Date.now();
    const leaks: MemoryAllocation[] = [];

    for (const allocation of this.allocations.values()) {
      if (now - allocation.timestamp > ageThresholdMs) {
        leaks.push(allocation);
      }
    }

    return leaks;
  }

  /**
   * DESIGN PATTERN FIX: Cleanup all memory (for shutdown)
   */
  cleanup(): void {
    const allocatedCount = this.allocations.size;
    const allocatedMemory = this.getCurrentUsage();

    this.allocations.clear();
    this.allocatedMemory.clear();
    this.totalDeallocated += allocatedMemory;

    this.emit('memoryCleanup', {
      deallocatedCount: allocatedCount,
      deallocatedMemory: allocatedMemory,
    });
  }

  /**
   * DESIGN PATTERN FIX: Configure memory limits
   */
  setMaxMemory(maxMemory: number): void {
    if (maxMemory < this.getCurrentUsage()) {
      throw new Error(
        `Cannot set max memory ${maxMemory} below current usage ${this.getCurrentUsage()}`
      );
    }

    this.maxMemory = maxMemory;
    this.emit('maxMemoryChanged', { maxMemory });
  }

  setGcThreshold(threshold: number): void {
    if (threshold < 0.1 || threshold > 1.0) {
      throw new Error('GC threshold must be between 0.1 and 1.0');
    }

    this.gcThreshold = threshold;
    this.emit('gcThresholdChanged', { threshold });
  }

  /**
   * DESIGN PATTERN FIX: Private helper to create memory objects
   */
  private createMemoryObject(type: string, size: number): any {
    switch (type) {
      case 'string':
        return new Array(size).fill('\0').join(''); // Pre-allocated string
      case 'array':
        return new Array(size);
      case 'buffer':
        return new ArrayBuffer(size);
      case 'object':
      case 'variant':
      default:
        return {}; // Generic object
    }
  }

  /**
   * DESIGN PATTERN FIX: Calculate memory fragmentation ratio
   */
  private getFragmentationRatio(): number {
    // Simplified fragmentation calculation
    // In reality, this would analyze memory block distribution
    const allocCount = this.allocations.size;
    if (allocCount === 0) return 0;

    const avgSize = this.getCurrentUsage() / allocCount;
    const maxSize = Math.max(...Array.from(this.allocations.values()).map(a => a.size));

    return maxSize > 0 ? 1 - avgSize / maxSize : 0;
  }
}
