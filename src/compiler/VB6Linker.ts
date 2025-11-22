/**
 * VB6 Native Linker
 * 
 * Links compiled VB6 modules with runtime libraries to create executables
 */

import { IRModule } from './VB6NativeCompiler';

export interface LinkOptions {
  outputFormat: OutputFormat;
  entryPoint: string;
  runtimePath: string;
  libraries: string[];
  stripSymbols: boolean;
  embedRuntime: boolean;
  targetPlatform: Platform;
}

export enum OutputFormat {
  ELF = 'elf',        // Linux
  PE = 'pe',          // Windows
  MACHO = 'mach-o',   // macOS
  WASM = 'wasm',      // WebAssembly
}

export enum Platform {
  WINDOWS_X86 = 'win32',
  WINDOWS_X64 = 'win64',
  LINUX_X86 = 'linux32',
  LINUX_X64 = 'linux64',
  MACOS_X64 = 'darwin64',
  MACOS_ARM = 'darwinarm',
  WEB = 'web',
}

export interface Symbol {
  name: string;
  address: number;
  size: number;
  type: SymbolType;
  binding: SymbolBinding;
  module?: string;
}

export enum SymbolType {
  FUNCTION = 'function',
  VARIABLE = 'variable',
  CONSTANT = 'constant',
  IMPORT = 'import',
  EXPORT = 'export',
}

export enum SymbolBinding {
  LOCAL = 'local',
  GLOBAL = 'global',
  WEAK = 'weak',
}

export interface Section {
  name: string;
  type: SectionType;
  flags: number;
  address: number;
  size: number;
  data: Uint8Array;
  relocations: Relocation[];
}

export enum SectionType {
  CODE = 'code',
  DATA = 'data',
  BSS = 'bss',
  RODATA = 'rodata',
  DEBUG = 'debug',
}

export interface Relocation {
  offset: number;
  symbol: string;
  type: RelocationType;
  addend: number;
}

export enum RelocationType {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  CALL = 'call',
  JUMP = 'jump',
  DATA = 'data',
}

export class VB6Linker {
  private symbols: Map<string, Symbol> = new Map();
  private sections: Section[] = [];
  private imports: Map<string, string[]> = new Map();
  private exports: string[] = [];
  
  /**
   * Link multiple modules into an executable
   */
  async link(
    modules: IRModule[],
    objectFiles: Uint8Array[],
    options: LinkOptions
  ): Promise<Uint8Array> {
    console.log('Linking VB6 executable...');
    
    // Reset state
    this.symbols.clear();
    this.sections = [];
    this.imports.clear();
    this.exports = [];
    
    // Phase 1: Collect symbols from all modules
    this.collectSymbols(modules);
    
    // Phase 2: Process object files
    this.processObjectFiles(objectFiles);
    
    // Phase 3: Resolve imports
    await this.resolveImports(options);
    
    // Phase 4: Perform relocations
    this.performRelocations();
    
    // Phase 5: Layout sections
    const layout = this.layoutSections(options);
    
    // Phase 6: Generate executable
    const executable = this.generateExecutable(layout, options);
    
    return executable;
  }
  
  /**
   * Collect symbols from IR modules
   */
  private collectSymbols(modules: IRModule[]): void {
    let address = 0x1000; // Start after headers
    
    for (const module of modules) {
      // Add functions
      for (const func of module.functions) {
        const size = func.body.length * 4; // Estimate size
        this.symbols.set(func.name, {
          name: func.name,
          address,
          size,
          type: SymbolType.FUNCTION,
          binding: SymbolBinding.GLOBAL,
          module: module.name,
        });
        address += size;
      }
      
      // Add globals
      for (const global of module.globals) {
        this.symbols.set(global.name, {
          name: global.name,
          address,
          size: 4, // Assume 32-bit for now
          type: SymbolType.VARIABLE,
          binding: SymbolBinding.GLOBAL,
          module: module.name,
        });
        address += 4;
      }
      
      // Collect imports
      if (module.imports.length > 0) {
        this.imports.set(module.name, module.imports);
      }
    }
  }
  
  /**
   * Process assembled object files
   */
  private processObjectFiles(objectFiles: Uint8Array[]): void {
    // In a real implementation, this would parse object file formats
    // (ELF, COFF, Mach-O) and extract sections and symbols
    
    // For now, create basic sections
    const codeSection: Section = {
      name: '.text',
      type: SectionType.CODE,
      flags: 0x6, // Executable + Readable
      address: 0x1000,
      size: 0,
      data: new Uint8Array(0),
      relocations: [],
    };
    
    const dataSection: Section = {
      name: '.data',
      type: SectionType.DATA,
      flags: 0x3, // Writable + Readable
      address: 0x2000,
      size: 0,
      data: new Uint8Array(0),
      relocations: [],
    };
    
    const bssSection: Section = {
      name: '.bss',
      type: SectionType.BSS,
      flags: 0x3, // Writable + Readable
      address: 0x3000,
      size: 0,
      data: new Uint8Array(0),
      relocations: [],
    };
    
    // Concatenate object file data
    for (const objFile of objectFiles) {
      // Simple concatenation - real implementation would parse properly
      const newCode = new Uint8Array(codeSection.data.length + objFile.length);
      newCode.set(codeSection.data);
      newCode.set(objFile, codeSection.data.length);
      codeSection.data = newCode;
      codeSection.size = newCode.length;
    }
    
    this.sections.push(codeSection, dataSection, bssSection);
  }
  
  /**
   * Resolve imports from runtime and libraries
   */
  private async resolveImports(options: LinkOptions): Promise<void> {
    // VB6 Runtime imports
    const runtimeSymbols = [
      'vb6_allocate',
      'vb6_free',
      'vb6_createString',
      'vb6_getString',
      'vb6_msgBox',
      'vb6_inputBox',
      'vb6_fileOpen',
      'vb6_fileClose',
      'vb6_fileRead',
      'vb6_fileWrite',
      'vb6_abs',
      'vb6_sgn',
      'vb6_int',
      'vb6_rnd',
      'vb6_len',
      'vb6_left',
      'vb6_right',
      'vb6_mid',
      'vb6_inStr',
      'vb6_uCase',
      'vb6_lCase',
      'vb6_now',
      'vb6_date',
      'vb6_time',
    ];
    
    // Add runtime symbols
    let importAddress = 0x4000;
    for (const symbol of runtimeSymbols) {
      this.symbols.set(symbol, {
        name: symbol,
        address: importAddress,
        size: 8, // Import table entry size
        type: SymbolType.IMPORT,
        binding: SymbolBinding.GLOBAL,
      });
      importAddress += 8;
    }
    
    // Process library imports
    for (const lib of options.libraries) {
      // In real implementation, would load library and extract symbols
      console.log(`Loading library: ${lib}`);
    }
  }
  
  /**
   * Perform relocations
   */
  private performRelocations(): void {
    for (const section of this.sections) {
      for (const reloc of section.relocations) {
        const symbol = this.symbols.get(reloc.symbol);
        if (!symbol) {
          throw new Error(`Undefined symbol: ${reloc.symbol}`);
        }
        
        // Apply relocation based on type
        switch (reloc.type) {
          case RelocationType.ABSOLUTE:
            this.applyAbsoluteRelocation(section, reloc, symbol);
            break;
          case RelocationType.RELATIVE:
            this.applyRelativeRelocation(section, reloc, symbol);
            break;
          case RelocationType.CALL:
            this.applyCallRelocation(section, reloc, symbol);
            break;
          default:
            console.warn(`Unknown relocation type: ${reloc.type}`);
        }
      }
    }
  }
  
  private applyAbsoluteRelocation(section: Section, reloc: Relocation, symbol: Symbol): void {
    const view = new DataView(section.data.buffer);
    view.setUint32(reloc.offset, symbol.address + reloc.addend, true);
  }
  
  private applyRelativeRelocation(section: Section, reloc: Relocation, symbol: Symbol): void {
    const view = new DataView(section.data.buffer);
    const pc = section.address + reloc.offset + 4; // PC after instruction
    const target = symbol.address + reloc.addend;
    view.setInt32(reloc.offset, target - pc, true);
  }
  
  private applyCallRelocation(section: Section, reloc: Relocation, symbol: Symbol): void {
    // x86 CALL instruction uses relative addressing
    this.applyRelativeRelocation(section, reloc, symbol);
  }
  
  /**
   * Layout sections in memory
   */
  private layoutSections(options: LinkOptions): MemoryLayout {
    const layout: MemoryLayout = {
      entryPoint: 0,
      sections: [],
      totalSize: 0,
    };
    
    // Find entry point
    const entrySymbol = this.symbols.get(options.entryPoint);
    if (!entrySymbol) {
      throw new Error(`Entry point not found: ${options.entryPoint}`);
    }
    layout.entryPoint = entrySymbol.address;
    
    // Arrange sections
    let currentAddress = 0x1000; // Start after headers
    for (const section of this.sections) {
      section.address = currentAddress;
      layout.sections.push({
        name: section.name,
        address: currentAddress,
        size: section.size,
        data: section.data,
      });
      currentAddress += Math.ceil(section.size / 0x1000) * 0x1000; // Page align
    }
    
    layout.totalSize = currentAddress;
    return layout;
  }
  
  /**
   * Generate final executable
   */
  private generateExecutable(layout: MemoryLayout, options: LinkOptions): Uint8Array {
    switch (options.outputFormat) {
      case OutputFormat.PE:
        return this.generatePE(layout, options);
      case OutputFormat.ELF:
        return this.generateELF(layout, options);
      case OutputFormat.WASM:
        return this.generateWASM(layout, options);
      default:
        throw new Error(`Unsupported output format: ${options.outputFormat}`);
    }
  }
  
  /**
   * Generate PE (Windows) executable
   */
  private generatePE(layout: MemoryLayout, options: LinkOptions): Uint8Array {
    const pe = new PEBuilder();
    
    // DOS header
    pe.writeDOSHeader();
    
    // PE signature
    pe.write32(0x00004550); // "PE\0\0"
    
    // COFF header
    pe.write16(0x014c); // Machine (i386)
    pe.write16(layout.sections.length); // Number of sections
    pe.write32(Date.now() / 1000); // Timestamp
    pe.write32(0); // Symbol table pointer
    pe.write32(0); // Number of symbols
    pe.write16(224); // Size of optional header
    pe.write16(0x0102); // Characteristics
    
    // Optional header
    pe.write16(0x010b); // Magic (PE32)
    pe.write8(14); // Linker version major
    pe.write8(0); // Linker version minor
    pe.write32(this.getCodeSize(layout)); // Size of code
    pe.write32(this.getDataSize(layout)); // Size of initialized data
    pe.write32(0); // Size of uninitialized data
    pe.write32(layout.entryPoint); // Entry point
    pe.write32(0x1000); // Base of code
    pe.write32(0x2000); // Base of data
    pe.write32(0x400000); // Image base
    pe.write32(0x1000); // Section alignment
    pe.write32(0x200); // File alignment
    pe.write16(6); // OS version major
    pe.write16(0); // OS version minor
    pe.write16(0); // Image version major
    pe.write16(0); // Image version minor
    pe.write16(6); // Subsystem version major
    pe.write16(0); // Subsystem version minor
    pe.write32(0); // Win32 version
    pe.write32(layout.totalSize); // Size of image
    pe.write32(0x200); // Size of headers
    pe.write32(0); // Checksum
    pe.write16(options.targetPlatform === Platform.WINDOWS_X86 ? 3 : 2); // Subsystem
    pe.write16(0); // DLL characteristics
    pe.write32(0x100000); // Size of stack reserve
    pe.write32(0x1000); // Size of stack commit
    pe.write32(0x100000); // Size of heap reserve
    pe.write32(0x1000); // Size of heap commit
    pe.write32(0); // Loader flags
    pe.write32(16); // Number of data directories
    
    // Data directories
    for (let i = 0; i < 16; i++) {
      pe.write32(0); // RVA
      pe.write32(0); // Size
    }
    
    // Section headers
    for (const section of layout.sections) {
      pe.writeSectionHeader(section);
    }
    
    // Section data
    for (const section of layout.sections) {
      pe.alignTo(0x200);
      pe.writeBytes(section.data);
    }
    
    return pe.build();
  }
  
  /**
   * Generate ELF (Linux) executable
   */
  private generateELF(layout: MemoryLayout, options: LinkOptions): Uint8Array {
    const elf = new ELFBuilder();
    
    // ELF header
    elf.write32(0x464c457f); // Magic "\x7fELF"
    elf.write8(1); // 32-bit
    elf.write8(1); // Little endian
    elf.write8(1); // Current version
    elf.write8(0); // System V ABI
    elf.write8(0); // ABI version
    elf.writeBytes(new Uint8Array(7)); // Padding
    
    elf.write16(2); // Executable file
    elf.write16(3); // x86
    elf.write32(1); // Current version
    elf.write32(layout.entryPoint); // Entry point
    elf.write32(52); // Program header offset
    elf.write32(0); // Section header offset
    elf.write32(0); // Flags
    elf.write16(52); // ELF header size
    elf.write16(32); // Program header size
    elf.write16(2); // Program header count
    elf.write16(40); // Section header size
    elf.write16(0); // Section header count
    elf.write16(0); // Section name string table
    
    // Program headers
    // LOAD segment for code
    elf.write32(1); // Type: LOAD
    elf.write32(0); // Offset
    elf.write32(0x08048000); // Virtual address
    elf.write32(0x08048000); // Physical address
    elf.write32(layout.totalSize); // File size
    elf.write32(layout.totalSize); // Memory size
    elf.write32(5); // Flags: R+X
    elf.write32(0x1000); // Alignment
    
    // LOAD segment for data
    elf.write32(1); // Type: LOAD
    elf.write32(0x2000); // Offset
    elf.write32(0x08049000); // Virtual address
    elf.write32(0x08049000); // Physical address
    elf.write32(0x1000); // File size
    elf.write32(0x1000); // Memory size
    elf.write32(6); // Flags: R+W
    elf.write32(0x1000); // Alignment
    
    // Section data
    for (const section of layout.sections) {
      elf.writeBytes(section.data);
    }
    
    return elf.build();
  }
  
  /**
   * Generate WebAssembly module
   */
  private generateWASM(layout: MemoryLayout, options: LinkOptions): Uint8Array {
    const wasm = new WASMBuilder();
    
    // WASM magic and version
    wasm.write32(0x6d736100); // "\0asm"
    wasm.write32(1); // Version
    
    // Type section
    wasm.writeSection(1, () => {
      wasm.writeVarUint(1); // Number of types
      wasm.write8(0x60); // Function type
      wasm.writeVarUint(0); // No parameters
      wasm.writeVarUint(0); // No results
    });
    
    // Import section
    if (options.embedRuntime) {
      wasm.writeSection(2, () => {
        wasm.writeVarUint(4); // Number of imports
        
        // Memory
        wasm.writeString('env');
        wasm.writeString('memory');
        wasm.write8(2); // Memory import
        wasm.writeVarUint(1); // Initial pages
        wasm.writeVarUint(10); // Maximum pages
        
        // Runtime functions
        const imports = ['print', 'input', 'allocate'];
        for (const imp of imports) {
          wasm.writeString('vb6');
          wasm.writeString(imp);
          wasm.write8(0); // Function import
          wasm.writeVarUint(0); // Type index
        }
      });
    }
    
    // Function section
    wasm.writeSection(3, () => {
      const funcCount = this.symbols.size;
      wasm.writeVarUint(funcCount);
      for (let i = 0; i < funcCount; i++) {
        wasm.writeVarUint(0); // Type index
      }
    });
    
    // Export section
    wasm.writeSection(7, () => {
      wasm.writeVarUint(1); // Number of exports
      wasm.writeString('main');
      wasm.write8(0); // Function export
      wasm.writeVarUint(0); // Function index
    });
    
    // Code section
    wasm.writeSection(10, () => {
      wasm.writeVarUint(layout.sections.length);
      for (const section of layout.sections) {
        wasm.writeVarUint(section.data.length + 2);
        wasm.writeVarUint(0); // Local count
        wasm.writeBytes(section.data);
        wasm.write8(0x0b); // End
      }
    });
    
    return wasm.build();
  }
  
  private getCodeSize(layout: MemoryLayout): number {
    return layout.sections
      .filter(s => s.name === '.text')
      .reduce((sum, s) => sum + s.size, 0);
  }
  
  private getDataSize(layout: MemoryLayout): number {
    return layout.sections
      .filter(s => s.name === '.data' || s.name === '.rodata')
      .reduce((sum, s) => sum + s.size, 0);
  }
}

// Supporting types
interface MemoryLayout {
  entryPoint: number;
  sections: {
    name: string;
    address: number;
    size: number;
    data: Uint8Array;
  }[];
  totalSize: number;
}

// Binary builders
class BinaryBuilder {
  protected buffer: number[] = [];
  
  write8(value: number): void {
    this.buffer.push(value & 0xff);
  }
  
  write16(value: number): void {
    this.write8(value);
    this.write8(value >> 8);
  }
  
  write32(value: number): void {
    this.write16(value);
    this.write16(value >> 16);
  }
  
  writeBytes(bytes: Uint8Array): void {
    for (const byte of bytes) {
      this.write8(byte);
    }
  }
  
  writeString(str: string): void {
    const bytes = new TextEncoder().encode(str);
    this.writeVarUint(bytes.length);
    this.writeBytes(bytes);
  }
  
  writeVarUint(value: number): void {
    while (value >= 0x80) {
      this.write8((value & 0x7f) | 0x80);
      value >>= 7;
    }
    this.write8(value);
  }
  
  alignTo(alignment: number): void {
    while (this.buffer.length % alignment !== 0) {
      this.write8(0);
    }
  }
  
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

class PEBuilder extends BinaryBuilder {
  writeDOSHeader(): void {
    this.write16(0x5a4d); // "MZ"
    this.write16(0x90); // Bytes on last page
    this.write16(3); // Pages
    this.write16(0); // Relocations
    this.write16(4); // Header size in paragraphs
    this.write16(0); // Minimum extra paragraphs
    this.write16(0xffff); // Maximum extra paragraphs
    this.write16(0); // Initial SS
    this.write16(0xb8); // Initial SP
    this.write16(0); // Checksum
    this.write16(0); // Initial IP
    this.write16(0); // Initial CS
    this.write16(0x40); // Relocation table offset
    this.write16(0); // Overlay number
    this.writeBytes(new Uint8Array(32)); // Reserved
    this.write32(0x80); // PE header offset
    
    // DOS stub
    const stub = [
      0x0e, 0x1f, 0xba, 0x0e, 0x00, 0xb4, 0x09, 0xcd,
      0x21, 0xb8, 0x01, 0x4c, 0xcd, 0x21, 0x54, 0x68,
      0x69, 0x73, 0x20, 0x70, 0x72, 0x6f, 0x67, 0x72,
      0x61, 0x6d, 0x20, 0x63, 0x61, 0x6e, 0x6e, 0x6f,
      0x74, 0x20, 0x62, 0x65, 0x20, 0x72, 0x75, 0x6e,
      0x20, 0x69, 0x6e, 0x20, 0x44, 0x4f, 0x53, 0x20,
      0x6d, 0x6f, 0x64, 0x65, 0x2e, 0x0d, 0x0d, 0x0a,
      0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    this.writeBytes(new Uint8Array(stub));
  }
  
  writeSectionHeader(section: { name: string; address: number; size: number }): void {
    // Name (8 bytes)
    const name = section.name.padEnd(8, '\0').substring(0, 8);
    this.writeBytes(new TextEncoder().encode(name));
    
    this.write32(section.size); // Virtual size
    this.write32(section.address); // Virtual address
    this.write32(section.size); // Raw size
    this.write32(section.address); // Raw offset
    this.write32(0); // Relocations offset
    this.write32(0); // Line numbers offset
    this.write16(0); // Number of relocations
    this.write16(0); // Number of line numbers
    this.write32(0x60000020); // Characteristics: Code, Executable, Readable
  }
}

class ELFBuilder extends BinaryBuilder {}

class WASMBuilder extends BinaryBuilder {
  writeSection(id: number, writer: () => void): void {
    this.write8(id);
    const sizePos = this.buffer.length;
    this.writeVarUint(0); // Placeholder for size
    
    const startPos = this.buffer.length;
    writer();
    const size = this.buffer.length - startPos;
    
    // Update size
    const sizeBytes: number[] = [];
    let sizeValue = size;
    while (sizeValue >= 0x80) {
      sizeBytes.push((sizeValue & 0x7f) | 0x80);
      sizeValue >>= 7;
    }
    sizeBytes.push(sizeValue);
    
    this.buffer.splice(sizePos, 1, ...sizeBytes);
  }
}

// Export factory function
export function createVB6Linker(): VB6Linker {
  return new VB6Linker();
}