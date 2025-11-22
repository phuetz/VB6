import { VB6UDT, VB6Enum, VB6Const, VB6DeclareFunction, VB6ExtendedModuleAST } from '../utils/vb6ParserExtended';

/**
 * VB6 Type System - Manages UDTs, Enums, Constants, and Type Checking
 */
export class VB6TypeSystem {
  private udts: Map<string, VB6UDT> = new Map();
  private enums: Map<string, VB6Enum> = new Map();
  private constants: Map<string, VB6Const> = new Map();
  private declares: Map<string, VB6DeclareFunction> = new Map();
  
  // Runtime type instances
  private udtInstances: Map<string, Map<string, any>> = new Map(); // instanceId -> fieldName -> value
  private enumValues: Map<string, Map<string, number>> = new Map(); // enumName -> valueName -> numericValue

  constructor() {
    this.initializeBuiltInTypes();
  }

  /**
   * Initialize built-in VB6 types and constants
   */
  private initializeBuiltInTypes(): void {
    // Built-in constants
    const builtInConstants: VB6Const[] = [
      { name: 'vbCrLf', type: 'String', value: '\r\n', visibility: 'public' },
      { name: 'vbCr', type: 'String', value: '\r', visibility: 'public' },
      { name: 'vbLf', type: 'String', value: '\n', visibility: 'public' },
      { name: 'vbTab', type: 'String', value: '\t', visibility: 'public' },
      { name: 'vbNullString', type: 'String', value: '', visibility: 'public' },
      { name: 'vbTrue', type: 'Boolean', value: true, visibility: 'public' },
      { name: 'vbFalse', type: 'Boolean', value: false, visibility: 'public' },
      { name: 'vbEmpty', type: 'Variant', value: null, visibility: 'public' },
      { name: 'vbNull', type: 'Variant', value: null, visibility: 'public' },
      { name: 'vbNothing', type: 'Object', value: null, visibility: 'public' }
    ];

    builtInConstants.forEach(constant => {
      this.constants.set(constant.name, constant);
    });

    // Built-in enums
    const vbMsgBoxStyle: VB6Enum = {
      name: 'VbMsgBoxStyle',
      visibility: 'public',
      values: [
        { name: 'vbOKOnly', value: 0 },
        { name: 'vbOKCancel', value: 1 },
        { name: 'vbAbortRetryIgnore', value: 2 },
        { name: 'vbYesNoCancel', value: 3 },
        { name: 'vbYesNo', value: 4 },
        { name: 'vbRetryCancel', value: 5 }
      ]
    };
    this.registerEnum(vbMsgBoxStyle);

    const vbMsgBoxResult: VB6Enum = {
      name: 'VbMsgBoxResult',
      visibility: 'public',
      values: [
        { name: 'vbOK', value: 1 },
        { name: 'vbCancel', value: 2 },
        { name: 'vbAbort', value: 3 },
        { name: 'vbRetry', value: 4 },
        { name: 'vbIgnore', value: 5 },
        { name: 'vbYes', value: 6 },
        { name: 'vbNo', value: 7 }
      ]
    };
    this.registerEnum(vbMsgBoxResult);

    const vbColor: VB6Enum = {
      name: 'VbColor',
      visibility: 'public',
      values: [
        { name: 'vbBlack', value: 0x000000 },
        { name: 'vbRed', value: 0x0000FF },
        { name: 'vbGreen', value: 0x00FF00 },
        { name: 'vbYellow', value: 0x00FFFF },
        { name: 'vbBlue', value: 0xFF0000 },
        { name: 'vbMagenta', value: 0xFF00FF },
        { name: 'vbCyan', value: 0xFFFF00 },
        { name: 'vbWhite', value: 0xFFFFFF }
      ]
    };
    this.registerEnum(vbColor);
  }

  /**
   * Register a UDT in the type system
   */
  registerUDT(udt: VB6UDT): void {
    this.udts.set(udt.name.toLowerCase(), udt);
  }

  /**
   * Register an Enum in the type system
   */
  registerEnum(enumDef: VB6Enum): void {
    this.enums.set(enumDef.name.toLowerCase(), enumDef);
    
    // Create enum value lookup
    const enumValueMap = new Map<string, number>();
    let currentValue = 0;
    
    for (const value of enumDef.values) {
      if (value.value !== undefined) {
        if (typeof value.value === 'number') {
          currentValue = value.value;
        } else {
          // Try to resolve string values (could be expressions)
          currentValue = this.resolveEnumValue(value.value.toString());
        }
      }
      
      enumValueMap.set(value.name.toLowerCase(), currentValue);
      this.constants.set(value.name, {
        name: value.name,
        type: enumDef.name,
        value: currentValue,
        visibility: 'public'
      });
      
      currentValue++;
    }
    
    this.enumValues.set(enumDef.name.toLowerCase(), enumValueMap);
  }

  /**
   * Register a constant
   */
  registerConstant(constant: VB6Const): void {
    this.constants.set(constant.name.toLowerCase(), constant);
  }

  /**
   * Register a declare function
   */
  registerDeclare(declare: VB6DeclareFunction): void {
    this.declares.set(declare.name.toLowerCase(), declare);
  }

  /**
   * Create a new UDT instance
   */
  createUDTInstance(udtName: string, instanceId?: string): string {
    const udt = this.udts.get(udtName.toLowerCase());
    if (!udt) {
      throw new Error(`UDT '${udtName}' not found`);
    }

    const id = instanceId || `${udtName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const instance = new Map<string, any>();

    // Initialize fields with default values
    for (const field of udt.fields) {
      instance.set(field.name.toLowerCase(), this.getDefaultValue(field.type, field.isArray));
    }

    this.udtInstances.set(id, instance);
    return id;
  }

  /**
   * Get UDT field value
   */
  getUDTField(instanceId: string, fieldName: string): any {
    const instance = this.udtInstances.get(instanceId);
    if (!instance) {
      throw new Error(`UDT instance '${instanceId}' not found`);
    }
    
    return instance.get(fieldName.toLowerCase());
  }

  /**
   * Set UDT field value
   */
  setUDTField(instanceId: string, fieldName: string, value: any): void {
    const instance = this.udtInstances.get(instanceId);
    if (!instance) {
      throw new Error(`UDT instance '${instanceId}' not found`);
    }

    // TODO: Add type checking here
    instance.set(fieldName.toLowerCase(), value);
  }

  /**
   * Get enum value by name
   */
  getEnumValue(enumName: string, valueName: string): number {
    const enumValues = this.enumValues.get(enumName.toLowerCase());
    if (!enumValues) {
      throw new Error(`Enum '${enumName}' not found`);
    }

    const value = enumValues.get(valueName.toLowerCase());
    if (value === undefined) {
      throw new Error(`Enum value '${valueName}' not found in '${enumName}'`);
    }

    return value;
  }

  /**
   * Get constant value by name
   */
  getConstantValue(name: string): any {
    const constant = this.constants.get(name.toLowerCase());
    if (!constant) {
      throw new Error(`Constant '${name}' not found`);
    }

    return constant.value;
  }

  /**
   * Check if a type exists (built-in or user-defined)
   */
  isValidType(typeName: string): boolean {
    const lowerName = typeName.toLowerCase();
    
    // Built-in types
    const builtInTypes = ['byte', 'boolean', 'integer', 'long', 'single', 'double', 
                         'currency', 'string', 'variant', 'object', 'date'];
    if (builtInTypes.includes(lowerName)) {
      return true;
    }

    // User-defined types
    if (this.udts.has(lowerName)) {
      return true;
    }

    // Enums
    if (this.enums.has(lowerName)) {
      return true;
    }

    return false;
  }

  /**
   * Get default value for a type
   */
  private getDefaultValue(typeName: string, isArray?: boolean): any {
    if (isArray) {
      return []; // Empty array
    }

    const lowerName = typeName.toLowerCase();
    
    switch (lowerName) {
      case 'byte':
      case 'integer':
      case 'long':
        return 0;
      case 'single':
      case 'double':
      case 'currency':
        return 0.0;
      case 'string':
        return '';
      case 'boolean':
        return false;
      case 'date':
        return new Date(1899, 11, 30); // VB6 date zero
      case 'variant':
        return null;
      case 'object':
        return null;
      default:
        // UDT or Enum
        if (this.udts.has(lowerName)) {
          return this.createUDTInstance(typeName);
        }
        if (this.enums.has(lowerName)) {
          return 0; // First enum value
        }
        return null;
    }
  }

  /**
   * Resolve enum value from string expression
   */
  private resolveEnumValue(expression: string): number {
    // Try to parse as number first
    const numValue = parseFloat(expression);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Try to resolve as constant reference
    const constant = this.constants.get(expression.toLowerCase());
    if (constant && typeof constant.value === 'number') {
      return constant.value;
    }

    // Default to 0 if can't resolve
    return 0;
  }

  /**
   * Load type definitions from extended AST
   */
  loadFromAST(ast: VB6ExtendedModuleAST): void {
    // Register UDTs
    ast.udts.forEach(udt => this.registerUDT(udt));
    
    // Register Enums
    ast.enums.forEach(enumDef => this.registerEnum(enumDef));
    
    // Register Constants
    ast.constants.forEach(constant => this.registerConstant(constant));
    
    // Register Declares
    ast.declares.forEach(declare => this.registerDeclare(declare));
  }

  /**
   * Get all registered UDTs
   */
  getAllUDTs(): VB6UDT[] {
    return Array.from(this.udts.values());
  }

  /**
   * Get all registered Enums
   */
  getAllEnums(): VB6Enum[] {
    return Array.from(this.enums.values());
  }

  /**
   * Get all registered Constants
   */
  getAllConstants(): VB6Const[] {
    return Array.from(this.constants.values());
  }

  /**
   * Get all registered Declares
   */
  getAllDeclares(): VB6DeclareFunction[] {
    return Array.from(this.declares.values());
  }

  /**
   * Validate UDT assignment
   */
  validateUDTAssignment(udtName: string, fieldName: string, value: any): boolean {
    const udt = this.udts.get(udtName.toLowerCase());
    if (!udt) return false;

    const field = udt.fields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
    if (!field) return false;

    // Basic type validation
    return this.validateTypeAssignment(field.type, value);
  }

  /**
   * Validate type assignment
   */
  private validateTypeAssignment(expectedType: string, value: any): boolean {
    const lowerType = expectedType.toLowerCase();
    
    switch (lowerType) {
      case 'byte':
        return typeof value === 'number' && value >= 0 && value <= 255 && Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'integer':
        return typeof value === 'number' && value >= -32768 && value <= 32767 && Number.isInteger(value);
      case 'long':
        return typeof value === 'number' && Number.isInteger(value);
      case 'single':
      case 'double':
      case 'currency':
        return typeof value === 'number';
      case 'string':
        return typeof value === 'string';
      case 'date':
        return value instanceof Date;
      case 'variant':
        return true; // Variant can hold any type
      case 'object':
        return typeof value === 'object';
      default:
        // UDT or Enum - more complex validation needed
        return true;
    }
  }

  /**
   * Convert VB6 type to JavaScript type
   */
  vb6ToJSType(vb6Type: string): string {
    const lowerType = vb6Type.toLowerCase();
    
    switch (lowerType) {
      case 'byte':
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'string':
        return 'string';
      case 'date':
        return 'Date';
      case 'variant':
      case 'object':
        return 'any';
      default:
        if (this.udts.has(lowerType)) {
          return 'object'; // UDT instances are objects
        }
        if (this.enums.has(lowerType)) {
          return 'number'; // Enums are numbers
        }
        return 'any';
    }
  }

  /**
   * Clear all type definitions (for testing)
   */
  clear(): void {
    this.udts.clear();
    this.enums.clear();
    this.constants.clear();
    this.declares.clear();
    this.udtInstances.clear();
    this.enumValues.clear();
    this.initializeBuiltInTypes();
  }
}

// Singleton instance
export const vb6TypeSystem = new VB6TypeSystem();

export default vb6TypeSystem;