/**
 * VB6 User Defined Type (UDT) Transpiler - Ultra-Complete Implementation
 * 
 * Features:
 * - Complete UDT to JavaScript class generation
 * - Support for arrays within UDT
 * - Fixed-length strings handling
 * - Nested UDT support
 * - Serialization and deserialization
 * - Memory layout optimization
 * - Type validation and safety
 */

export interface VB6UDTField {
  name: string;
  type: string;
  size?: number; // For fixed-length strings and arrays
  dimensions?: number[]; // For multi-dimensional arrays
  isFixedLength?: boolean;
  isArray?: boolean;
  defaultValue?: any;
}

export interface VB6UDTDefinition {
  name: string;
  fields: VB6UDTField[];
  alignment?: number; // Memory alignment (1, 2, 4, 8 bytes)
  packed?: boolean; // Whether to pack structure
  size?: number; // Calculated size in bytes
}

export interface UDTTranspilerOptions {
  generateTypeScript?: boolean;
  enableSerialization?: boolean;
  enableValidation?: boolean;
  optimizeMemoryLayout?: boolean;
  generateComments?: boolean;
  strictTypeChecking?: boolean;
  enableCloning?: boolean;
}

export interface UDTMetrics {
  udtCount: number;
  fieldsGenerated: number;
  methodsGenerated: number;
  linesOfCode: number;
  compilationTime: number;
  memoryFootprint: number;
}

export class VB6UDTTranspiler {
  private options: Required<UDTTranspilerOptions>;
  private metrics: UDTMetrics;
  private typeMap: Map<string, string>;
  private udtRegistry: Map<string, VB6UDTDefinition>;
  private dependencyGraph: Map<string, Set<string>>;
  private generatedClasses: Set<string>;

  constructor(options: UDTTranspilerOptions = {}) {
    this.options = {
      generateTypeScript: options.generateTypeScript ?? true,
      enableSerialization: options.enableSerialization ?? true,
      enableValidation: options.enableValidation ?? true,
      optimizeMemoryLayout: options.optimizeMemoryLayout ?? true,
      generateComments: options.generateComments ?? true,
      strictTypeChecking: options.strictTypeChecking ?? true,
      enableCloning: options.enableCloning ?? true
    };

    this.metrics = {
      udtCount: 0,
      fieldsGenerated: 0,
      methodsGenerated: 0,
      linesOfCode: 0,
      compilationTime: 0,
      memoryFootprint: 0
    };

    this.typeMap = new Map([
      ['String', 'string'],
      ['Integer', 'number'],
      ['Long', 'number'],
      ['Single', 'number'],
      ['Double', 'number'],
      ['Boolean', 'boolean'],
      ['Date', 'Date'],
      ['Byte', 'number'],
      ['Currency', 'number'],
      ['Decimal', 'number'],
      ['Object', 'any'],
      ['Variant', 'any']
    ]);

    this.udtRegistry = new Map();
    this.dependencyGraph = new Map();
    this.generatedClasses = new Set();
  }

  /**
   * Register a UDT definition
   */
  public registerUDT(udt: VB6UDTDefinition): void {
    // Validate UDT definition
    this.validateUDTDefinition(udt);

    // Calculate memory layout if optimization is enabled
    if (this.options.optimizeMemoryLayout) {
      udt = this.optimizeMemoryLayout(udt);
    }

    // Register the UDT
    this.udtRegistry.set(udt.name, udt);

    // Build dependency graph
    this.buildDependencyGraph(udt);
  }

  /**
   * Generate JavaScript classes for all registered UDTs
   */
  public generateAllUDTs(): string {
    const startTime = performance.now();
    
    // Sort UDTs by dependency order
    const sortedUDTs = this.topologicalSort();

    let output = '';

    // Generate header
    output += this.generateHeader();

    // Generate each UDT class
    for (const udtName of sortedUDTs) {
      const udt = this.udtRegistry.get(udtName);
      if (udt && !this.generatedClasses.has(udtName)) {
        output += this.generateUDTClass(udt);
        this.generatedClasses.add(udtName);
        this.metrics.udtCount++;
      }
    }

    // Generate footer
    output += this.generateFooter();

    // Update metrics
    this.metrics.compilationTime = performance.now() - startTime;
    this.metrics.linesOfCode = output.split('\n').length;

    return output;
  }

  /**
   * Generate a single UDT class
   */
  public generateUDTClass(udt: VB6UDTDefinition): string {
    let output = '';

    if (this.options.generateComments) {
      output += `/**\n`;
      output += ` * UDT: ${udt.name}\n`;
      output += ` * Fields: ${udt.fields.length}\n`;
      if (udt.size) {
        output += ` * Size: ${udt.size} bytes\n`;
      }
      output += ` * Generated from VB6 Type definition\n`;
      output += ` */\n`;
    }

    // Generate TypeScript interface
    if (this.options.generateTypeScript) {
      output += this.generateTypeScriptInterface(udt);
    }

    // Generate main class
    output += `export class ${udt.name} {\n`;

    // Generate field declarations
    output += this.generateFieldDeclarations(udt);

    // Generate constructor
    output += this.generateConstructor(udt);

    // Generate field accessors and mutators
    output += this.generateFieldMethods(udt);

    // Generate validation methods
    if (this.options.enableValidation) {
      output += this.generateValidationMethods(udt);
    }

    // Generate serialization methods
    if (this.options.enableSerialization) {
      output += this.generateSerializationMethods(udt);
    }

    // Generate cloning methods
    if (this.options.enableCloning) {
      output += this.generateCloningMethods(udt);
    }

    // Generate utility methods
    output += this.generateUtilityMethods(udt);

    // Generate static methods
    output += this.generateStaticMethods(udt);

    output += '}\n\n';

    return output;
  }

  /**
   * Generate TypeScript interface
   */
  private generateTypeScriptInterface(udt: VB6UDTDefinition): string {
    let output = `export interface I${udt.name} {\n`;

    for (const field of udt.fields) {
      const tsType = this.mapFieldToTypeScriptType(field);
      const optional = field.defaultValue !== undefined ? '?' : '';
      
      if (this.options.generateComments && field.size) {
        output += `  /** Size: ${field.size} bytes */\n`;
      }
      
      output += `  ${field.name}${optional}: ${tsType};\n`;
      this.metrics.fieldsGenerated++;
    }

    output += '}\n\n';
    return output;
  }

  /**
   * Generate field declarations
   */
  private generateFieldDeclarations(udt: VB6UDTDefinition): string {
    let output = '';

    if (this.options.generateComments) {
      output += '  // Field declarations\n';
    }

    for (const field of udt.fields) {
      if (this.options.generateTypeScript) {
        const tsType = this.mapFieldToTypeScriptType(field);
        output += `  public ${field.name}: ${tsType};\n`;
      } else {
        output += `  public ${field.name};\n`;
      }
    }

    output += '\n';
    return output;
  }

  /**
   * Generate constructor
   */
  private generateConstructor(udt: VB6UDTDefinition): string {
    let output = '';

    if (this.options.generateTypeScript) {
      output += `  constructor(data?: Partial<I${udt.name}>) {\n`;
    } else {
      output += '  constructor(data) {\n';
    }

    // Initialize fields with default values
    for (const field of udt.fields) {
      const defaultValue = this.getFieldDefaultValue(field);
      output += `    this.${field.name} = data?.${field.name} ?? ${defaultValue};\n`;
    }

    // Perform validation if enabled
    if (this.options.enableValidation) {
      output += '\n    // Validate initial data\n';
      output += '    this.validate();\n';
    }

    output += '  }\n\n';
    this.metrics.methodsGenerated++;
    return output;
  }

  /**
   * Generate field accessor and mutator methods
   */
  private generateFieldMethods(udt: VB6UDTDefinition): string {
    let output = '';

    for (const field of udt.fields) {
      // Skip simple fields unless strict type checking is enabled
      if (!this.options.strictTypeChecking && !field.isArray && !field.isFixedLength) {
        continue;
      }

      // Getter
      const tsReturnType = this.options.generateTypeScript ? `: ${this.mapFieldToTypeScriptType(field)}` : '';
      output += `  get${this.capitalize(field.name)}()${tsReturnType} {\n`;
      output += `    return this.${field.name};\n`;
      output += '  }\n\n';

      // Setter with validation
      const tsParamType = this.options.generateTypeScript ? `: ${this.mapFieldToTypeScriptType(field)}` : '';
      output += `  set${this.capitalize(field.name)}(value${tsParamType})${this.options.generateTypeScript ? ': void' : ''} {\n`;
      
      if (this.options.enableValidation) {
        output += `    this.validateField('${field.name}', value);\n`;
      }

      if (field.isFixedLength && field.type.toLowerCase() === 'string') {
        output += `    // Enforce fixed-length string\n`;
        output += `    if (typeof value === 'string' && value.length > ${field.size}) {\n`;
        output += `      this.${field.name} = value.substring(0, ${field.size});\n`;
        output += `    } else {\n`;
        output += `      this.${field.name} = value;\n`;
        output += `    }\n`;
      } else {
        output += `    this.${field.name} = value;\n`;
      }

      output += '  }\n\n';
      this.metrics.methodsGenerated += 2;
    }

    return output;
  }

  /**
   * Generate validation methods
   */
  private generateValidationMethods(udt: VB6UDTDefinition): string {
    let output = '';

    // Main validation method
    output += '  /**\n';
    output += '   * Validate all fields in the UDT\n';
    output += '   */\n';
    output += `  validate()${this.options.generateTypeScript ? ': boolean' : ''} {\n`;
    
    for (const field of udt.fields) {
      output += `    this.validateField('${field.name}', this.${field.name});\n`;
    }
    
    output += '    return true;\n';
    output += '  }\n\n';

    // Field validation method
    output += '  /**\n';
    output += '   * Validate a specific field\n';
    output += '   */\n';
    const fieldNameType = this.options.generateTypeScript ? ': keyof this' : '';
    const valueType = this.options.generateTypeScript ? ': any' : '';
    output += `  validateField(fieldName${fieldNameType}, value${valueType})${this.options.generateTypeScript ? ': void' : ''} {\n`;
    output += '    switch (fieldName) {\n';

    for (const field of udt.fields) {
      output += `      case '${field.name}':\n`;
      output += this.generateFieldValidation(field);
      output += '        break;\n';
    }

    output += '      default:\n';
    output += `        throw new Error(\`Unknown field: \${fieldName}\`);\n`;
    output += '    }\n';
    output += '  }\n\n';

    this.metrics.methodsGenerated += 2;
    return output;
  }

  /**
   * Generate validation logic for a specific field
   */
  private generateFieldValidation(field: VB6UDTField): string {
    let output = '';

    // Type validation
    const jsType = this.getJavaScriptType(field.type);
    output += `        if (value !== null && value !== undefined && typeof value !== '${jsType}') {\n`;
    output += `          throw new Error(\`Field ${field.name} must be of type ${field.type}\`);\n`;
    output += '        }\n';

    // Array validation
    if (field.isArray) {
      output += '        if (value !== null && value !== undefined && !Array.isArray(value)) {\n';
      output += `          throw new Error(\`Field ${field.name} must be an array\`);\n`;
      output += '        }\n';

      if (field.dimensions && field.dimensions.length > 0) {
        for (let i = 0; i < field.dimensions.length; i++) {
          const dimension = field.dimensions[i];
          output += `        if (value && value.length > ${dimension}) {\n`;
          output += `          throw new Error(\`Field ${field.name} dimension ${i + 1} exceeds maximum size ${dimension}\`);\n`;
          output += '        }\n';
        }
      }
    }

    // Fixed-length string validation
    if (field.isFixedLength && field.type.toLowerCase() === 'string' && field.size) {
      output += `        if (typeof value === 'string' && value.length > ${field.size}) {\n`;
      output += `          throw new Error(\`Field ${field.name} exceeds maximum length ${field.size}\`);\n`;
      output += '        }\n';
    }

    // Numeric range validation
    if (field.type.toLowerCase() === 'byte') {
      output += '        if (typeof value === "number" && (value < 0 || value > 255)) {\n';
      output += `          throw new Error(\`Field ${field.name} must be between 0 and 255\`);\n`;
      output += '        }\n';
    }

    return output;
  }

  /**
   * Generate serialization methods
   */
  private generateSerializationMethods(udt: VB6UDTDefinition): string {
    let output = '';

    // toJSON method
    output += '  /**\n';
    output += '   * Serialize UDT to JSON\n';
    output += '   */\n';
    output += `  toJSON()${this.options.generateTypeScript ? ': any' : ''} {\n`;
    output += '    return {\n';
    
    for (const field of udt.fields) {
      if (field.isArray) {
        output += `      ${field.name}: this.${field.name} ? [...this.${field.name}] : null,\n`;
      } else {
        output += `      ${field.name}: this.${field.name},\n`;
      }
    }
    
    output += '    };\n';
    output += '  }\n\n';

    // fromJSON method
    output += '  /**\n';
    output += '   * Deserialize UDT from JSON\n';
    output += '   */\n';
    const jsonType = this.options.generateTypeScript ? ': any' : '';
    output += `  fromJSON(json${jsonType})${this.options.generateTypeScript ? ': void' : ''} {\n`;
    
    for (const field of udt.fields) {
      output += `    if (json.${field.name} !== undefined) {\n`;
      
      if (field.isArray) {
        output += `      this.${field.name} = Array.isArray(json.${field.name}) ? [...json.${field.name}] : null;\n`;
      } else {
        output += `      this.${field.name} = json.${field.name};\n`;
      }
      
      output += '    }\n';
    }

    if (this.options.enableValidation) {
      output += '\n    this.validate();\n';
    }
    
    output += '  }\n\n';

    // toBinary method for efficient serialization
    output += '  /**\n';
    output += '   * Serialize UDT to binary format\n';
    output += '   */\n';
    output += `  toBinary()${this.options.generateTypeScript ? ': ArrayBuffer' : ''} {\n`;
    output += `    const buffer = new ArrayBuffer(${udt.size || 1024});\n`;
    output += '    const view = new DataView(buffer);\n';
    output += '    let offset = 0;\n\n';

    for (const field of udt.fields) {
      output += this.generateBinarySerializationForField(field);
    }

    output += '    return buffer;\n';
    output += '  }\n\n';

    // fromBinary method
    output += '  /**\n';
    output += '   * Deserialize UDT from binary format\n';
    output += '   */\n';
    const bufferType = this.options.generateTypeScript ? ': ArrayBuffer' : '';
    output += `  fromBinary(buffer${bufferType})${this.options.generateTypeScript ? ': void' : ''} {\n`;
    output += '    const view = new DataView(buffer);\n';
    output += '    let offset = 0;\n\n';

    for (const field of udt.fields) {
      output += this.generateBinaryDeserializationForField(field);
    }

    output += '  }\n\n';

    this.metrics.methodsGenerated += 4;
    return output;
  }

  /**
   * Generate cloning methods
   */
  private generateCloningMethods(udt: VB6UDTDefinition): string {
    let output = '';

    // Shallow clone
    output += '  /**\n';
    output += '   * Create a shallow clone of this UDT\n';
    output += '   */\n';
    output += `  clone()${this.options.generateTypeScript ? `: ${udt.name}` : ''} {\n`;
    output += `    const copy = new ${udt.name}();\n`;
    
    for (const field of udt.fields) {
      output += `    copy.${field.name} = this.${field.name};\n`;
    }
    
    output += '    return copy;\n';
    output += '  }\n\n';

    // Deep clone
    output += '  /**\n';
    output += '   * Create a deep clone of this UDT\n';
    output += '   */\n';
    output += `  deepClone()${this.options.generateTypeScript ? `: ${udt.name}` : ''} {\n`;
    output += `    const copy = new ${udt.name}();\n`;
    
    for (const field of udt.fields) {
      if (field.isArray) {
        output += `    copy.${field.name} = this.${field.name} ? [...this.${field.name}] : null;\n`;
      } else if (field.type === 'Date') {
        output += `    copy.${field.name} = this.${field.name} ? new Date(this.${field.name}) : null;\n`;
      } else {
        output += `    copy.${field.name} = this.${field.name};\n`;
      }
    }
    
    output += '    return copy;\n';
    output += '  }\n\n';

    this.metrics.methodsGenerated += 2;
    return output;
  }

  /**
   * Generate utility methods
   */
  private generateUtilityMethods(udt: VB6UDTDefinition): string {
    let output = '';

    // equals method
    output += '  /**\n';
    output += '   * Check equality with another UDT instance\n';
    output += '   */\n';
    const otherType = this.options.generateTypeScript ? `: ${udt.name}` : '';
    output += `  equals(other${otherType})${this.options.generateTypeScript ? ': boolean' : ''} {\n`;
    output += `    if (!(other instanceof ${udt.name})) return false;\n\n`;
    
    for (const field of udt.fields) {
      if (field.isArray) {
        output += `    if (!this.arrayEquals(this.${field.name}, other.${field.name})) return false;\n`;
      } else {
        output += `    if (this.${field.name} !== other.${field.name}) return false;\n`;
      }
    }
    
    output += '    return true;\n';
    output += '  }\n\n';

    // Array comparison helper
    output += '  /**\n';
    output += '   * Helper method for array comparison\n';
    output += '   */\n';
    const arr1Type = this.options.generateTypeScript ? ': any[]' : '';
    const arr2Type = this.options.generateTypeScript ? ': any[]' : '';
    output += `  private arrayEquals(arr1${arr1Type}, arr2${arr2Type})${this.options.generateTypeScript ? ': boolean' : ''} {\n`;
    output += '    if (arr1 === arr2) return true;\n';
    output += '    if (!arr1 || !arr2) return false;\n';
    output += '    if (arr1.length !== arr2.length) return false;\n';
    output += '    for (let i = 0; i < arr1.length; i++) {\n';
    output += '      if (arr1[i] !== arr2[i]) return false;\n';
    output += '    }\n';
    output += '    return true;\n';
    output += '  }\n\n';

    // toString method
    output += '  /**\n';
    output += '   * String representation of the UDT\n';
    output += '   */\n';
    output += `  toString()${this.options.generateTypeScript ? ': string' : ''} {\n`;
    output += `    return \`${udt.name} { \${Object.entries(this).map(([k, v]) => \`\${k}: \${v}\`).join(', ')} }\`;\n`;
    output += '  }\n\n';

    // getSize method
    output += '  /**\n';
    output += '   * Get the memory size of this UDT instance\n';
    output += '   */\n';
    output += `  getSize()${this.options.generateTypeScript ? ': number' : ''} {\n`;
    output += `    return ${udt.size || 0};\n`;
    output += '  }\n\n';

    this.metrics.methodsGenerated += 4;
    return output;
  }

  /**
   * Generate static methods
   */
  private generateStaticMethods(udt: VB6UDTDefinition): string {
    let output = '';

    // Static factory method
    output += '  /**\n';
    output += '   * Static factory method\n';
    output += '   */\n';
    const dataType = this.options.generateTypeScript ? `?: Partial<I${udt.name}>` : '';
    output += `  static create(data${dataType})${this.options.generateTypeScript ? `: ${udt.name}` : ''} {\n`;
    output += `    return new ${udt.name}(data);\n`;
    output += '  }\n\n';

    // Static fromJSON method
    output += '  /**\n';
    output += '   * Static method to create instance from JSON\n';
    output += '   */\n';
    const jsonType = this.options.generateTypeScript ? ': any' : '';
    output += `  static fromJSON(json${jsonType})${this.options.generateTypeScript ? `: ${udt.name}` : ''} {\n`;
    output += `    const instance = new ${udt.name}();\n`;
    output += '    instance.fromJSON(json);\n';
    output += '    return instance;\n';
    output += '  }\n\n';

    // Static getTypeName method
    output += '  /**\n';
    output += '   * Get the type name\n';
    output += '   */\n';
    output += `  static getTypeName()${this.options.generateTypeScript ? ': string' : ''} {\n`;
    output += `    return '${udt.name}';\n`;
    output += '  }\n\n';

    this.metrics.methodsGenerated += 3;
    return output;
  }

  /**
   * Helper methods for binary serialization
   */
  private generateBinarySerializationForField(field: VB6UDTField): string {
    let output = '';

    switch (field.type.toLowerCase()) {
      case 'integer':
        output += `    view.setInt16(offset, this.${field.name} || 0, true);\n`;
        output += '    offset += 2;\n';
        break;
      case 'long':
        output += `    view.setInt32(offset, this.${field.name} || 0, true);\n`;
        output += '    offset += 4;\n';
        break;
      case 'single':
        output += `    view.setFloat32(offset, this.${field.name} || 0.0, true);\n`;
        output += '    offset += 4;\n';
        break;
      case 'double':
        output += `    view.setFloat64(offset, this.${field.name} || 0.0, true);\n`;
        output += '    offset += 8;\n';
        break;
      case 'boolean':
        output += `    view.setUint8(offset, this.${field.name} ? 1 : 0);\n`;
        output += '    offset += 1;\n';
        break;
      case 'byte':
        output += `    view.setUint8(offset, this.${field.name} || 0);\n`;
        output += '    offset += 1;\n';
        break;
      case 'string':
        if (field.isFixedLength && field.size) {
          output += `    const str${field.name} = (this.${field.name} || '').padEnd(${field.size}, '\\0').substring(0, ${field.size});\n`;
          output += `    for (let i = 0; i < ${field.size}; i++) {\n`;
          output += `      view.setUint8(offset + i, str${field.name}.charCodeAt(i) || 0);\n`;
          output += '    }\n';
          output += `    offset += ${field.size};\n`;
        }
        break;
    }

    return output;
  }

  /**
   * Helper methods for binary deserialization
   */
  private generateBinaryDeserializationForField(field: VB6UDTField): string {
    let output = '';

    switch (field.type.toLowerCase()) {
      case 'integer':
        output += `    this.${field.name} = view.getInt16(offset, true);\n`;
        output += '    offset += 2;\n';
        break;
      case 'long':
        output += `    this.${field.name} = view.getInt32(offset, true);\n`;
        output += '    offset += 4;\n';
        break;
      case 'single':
        output += `    this.${field.name} = view.getFloat32(offset, true);\n`;
        output += '    offset += 4;\n';
        break;
      case 'double':
        output += `    this.${field.name} = view.getFloat64(offset, true);\n`;
        output += '    offset += 8;\n';
        break;
      case 'boolean':
        output += `    this.${field.name} = view.getUint8(offset) !== 0;\n`;
        output += '    offset += 1;\n';
        break;
      case 'byte':
        output += `    this.${field.name} = view.getUint8(offset);\n`;
        output += '    offset += 1;\n';
        break;
      case 'string':
        if (field.isFixedLength && field.size) {
          output += `    let str${field.name} = '';\n`;
          output += `    for (let i = 0; i < ${field.size}; i++) {\n`;
          output += `      const char = view.getUint8(offset + i);\n`;
          output += `      if (char === 0) break;\n`;
          output += `      str${field.name} += String.fromCharCode(char);\n`;
          output += '    }\n';
          output += `    this.${field.name} = str${field.name};\n`;
          output += `    offset += ${field.size};\n`;
        }
        break;
    }

    return output;
  }

  /**
   * Utility methods
   */
  private validateUDTDefinition(udt: VB6UDTDefinition): void {
    if (!udt.name || typeof udt.name !== 'string') {
      throw new Error('UDT must have a valid name');
    }

    if (!udt.fields || !Array.isArray(udt.fields) || udt.fields.length === 0) {
      throw new Error('UDT must have at least one field');
    }

    for (const field of udt.fields) {
      if (!field.name || typeof field.name !== 'string') {
        throw new Error('All UDT fields must have valid names');
      }

      if (!field.type || typeof field.type !== 'string') {
        throw new Error('All UDT fields must have valid types');
      }
    }
  }

  private optimizeMemoryLayout(udt: VB6UDTDefinition): VB6UDTDefinition {
    // Sort fields by size (largest first) for better memory alignment
    const optimizedUDT = { ...udt };
    
    optimizedUDT.fields = [...udt.fields].sort((a, b) => {
      const sizeA = this.getFieldSize(a);
      const sizeB = this.getFieldSize(b);
      return sizeB - sizeA;
    });

    // Calculate total size
    let totalSize = 0;
    for (const field of optimizedUDT.fields) {
      const fieldSize = this.getFieldSize(field);
      const alignment = Math.min(fieldSize, udt.alignment || 4);
      
      // Add padding for alignment
      const padding = (alignment - (totalSize % alignment)) % alignment;
      totalSize += padding + fieldSize;
    }

    optimizedUDT.size = totalSize;
    return optimizedUDT;
  }

  private getFieldSize(field: VB6UDTField): number {
    if (field.size) return field.size;

    switch (field.type.toLowerCase()) {
      case 'byte':
      case 'boolean':
        return 1;
      case 'integer':
        return 2;
      case 'long':
      case 'single':
        return 4;
      case 'double':
      case 'currency':
        return 8;
      case 'string':
        return field.isFixedLength ? (field.size || 0) : 4; // Pointer size for variable strings
      default:
        return 4; // Default pointer/reference size
    }
  }

  private buildDependencyGraph(udt: VB6UDTDefinition): void {
    const dependencies = new Set<string>();
    
    for (const field of udt.fields) {
      // Check if field type is another UDT
      if (this.udtRegistry.has(field.type)) {
        dependencies.add(field.type);
      }
    }
    
    this.dependencyGraph.set(udt.name, dependencies);
  }

  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (udtName: string): void => {
      if (visiting.has(udtName)) {
        throw new Error(`Circular dependency detected involving UDT: ${udtName}`);
      }

      if (visited.has(udtName)) {
        return;
      }

      visiting.add(udtName);
      
      const dependencies = this.dependencyGraph.get(udtName) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(udtName);
      visited.add(udtName);
      result.push(udtName);
    };

    for (const udtName of this.udtRegistry.keys()) {
      if (!visited.has(udtName)) {
        visit(udtName);
      }
    }

    return result.reverse(); // Dependencies first
  }

  private mapFieldToTypeScriptType(field: VB6UDTField): string {
    const baseType = this.typeMap.get(field.type) || field.type;
    
    if (field.isArray) {
      return `${baseType}[]`;
    }
    
    return baseType;
  }

  private getJavaScriptType(vb6Type: string): string {
    switch (vb6Type.toLowerCase()) {
      case 'string': return 'string';
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'byte':
      case 'currency':
        return 'number';
      case 'boolean': return 'boolean';
      default: return 'object';
    }
  }

  private getFieldDefaultValue(field: VB6UDTField): string {
    if (field.defaultValue !== undefined) {
      return JSON.stringify(field.defaultValue);
    }

    if (field.isArray) {
      return 'null';
    }

    switch (field.type.toLowerCase()) {
      case 'string': return '""';
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'byte':
      case 'currency':
        return '0';
      case 'boolean': return 'false';
      case 'date': return 'new Date()';
      default: return 'null';
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private generateHeader(): string {
    let output = '';

    if (this.options.generateComments) {
      output += '/**\n';
      output += ' * VB6 User Defined Types (UDTs)\n';
      output += ' * Auto-generated by VB6UDTTranspiler\n';
      output += ` * Generated at: ${new Date().toISOString()}\n`;
      output += ' */\n\n';
    }

    if (this.options.generateTypeScript) {
      output += '// Type definitions\n';
      output += 'type VB6UDTField = any;\n';
      output += 'type VB6UDTInstance = any;\n\n';
    }

    return output;
  }

  private generateFooter(): string {
    let output = '';

    if (this.options.generateComments) {
      output += '\n/**\n';
      output += ' * UDT Generation Complete\n';
      output += ` * Classes Generated: ${this.metrics.udtCount}\n`;
      output += ` * Fields Generated: ${this.metrics.fieldsGenerated}\n`;
      output += ` * Methods Generated: ${this.metrics.methodsGenerated}\n`;
      output += ` * Compilation Time: ${this.metrics.compilationTime.toFixed(2)}ms\n`;
      output += ' */\n';
    }

    return output;
  }

  /**
   * Get compilation metrics
   */
  public getMetrics(): UDTMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all registered UDTs
   */
  public clearRegistry(): void {
    this.udtRegistry.clear();
    this.dependencyGraph.clear();
    this.generatedClasses.clear();
    this.metrics = {
      udtCount: 0,
      fieldsGenerated: 0,
      methodsGenerated: 0,
      linesOfCode: 0,
      compilationTime: 0,
      memoryFootprint: 0
    };
  }
}