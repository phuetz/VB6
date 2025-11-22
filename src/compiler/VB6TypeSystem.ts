/**
 * VB6 Type System - Système de types complet pour VB6
 * Gère tous les types primitifs, conversions, et vérifications de compatibilité
 */

export enum VB6PrimitiveType {
  Byte = 'Byte',
  Boolean = 'Boolean', 
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  Decimal = 'Decimal',
  Date = 'Date',
  String = 'String',
  Object = 'Object',
  Variant = 'Variant',
  Empty = 'Empty',
  Null = 'Null',
  Nothing = 'Nothing',
  Any = 'Any'
}

export interface VB6TypeInfo {
  name: string;
  primitive?: VB6PrimitiveType;
  size: number | 'variable';
  range?: [number, number];
  precision?: number;
  fixed?: boolean;
  encoding?: string;
  reference?: boolean;
  dynamic?: boolean;
  nullable?: boolean;
  defaultValue?: any;
}

export interface TypeCheckResult {
  valid: boolean;
  lossless?: boolean;
  warning?: string;
  error?: string;
  runtime?: boolean;
  conversion?: string;
}

export interface VB6ArrayType {
  elementType: VB6TypeInfo;
  dimensions: number[];
  lowerBounds?: number[];
  dynamic?: boolean;
}

export interface VB6UDTField {
  name: string;
  type: VB6TypeInfo;
  offset?: number;
  size?: number;
  fixedLength?: number; // For fixed-length strings
}

export interface VB6UserDefinedType {
  name: string;
  fields: VB6UDTField[];
  size: number;
  public: boolean;
  module?: string;
}

export interface VB6EnumMember {
  name: string;
  value: number;
}

export interface VB6Enum {
  name: string;
  members: VB6EnumMember[];
  public: boolean;
  module?: string;
}

/**
 * Système de types VB6 complet avec gestion des conversions et vérifications
 */
export class VB6TypeSystem {
  private primitiveTypes: Map<string, VB6TypeInfo>;
  private userDefinedTypes: Map<string, VB6UserDefinedType>;
  private enums: Map<string, VB6Enum>;
  private typeAliases: Map<string, string>;
  
  constructor() {
    this.primitiveTypes = new Map();
    this.userDefinedTypes = new Map();
    this.enums = new Map();
    this.typeAliases = new Map();
    
    this.registerPrimitiveTypes();
    this.registerTypeAliases();
  }

  /**
   * Enregistrer tous les types primitifs VB6
   */
  private registerPrimitiveTypes(): void {
    // Types numériques
    this.primitiveTypes.set('Byte', {
      name: 'Byte',
      primitive: VB6PrimitiveType.Byte,
      size: 1,
      range: [0, 255],
      defaultValue: 0
    });

    this.primitiveTypes.set('Boolean', {
      name: 'Boolean',
      primitive: VB6PrimitiveType.Boolean,
      size: 2,
      range: [-1, 0], // True = -1, False = 0 in VB6
      defaultValue: false
    });

    this.primitiveTypes.set('Integer', {
      name: 'Integer',
      primitive: VB6PrimitiveType.Integer,
      size: 2,
      range: [-32768, 32767],
      defaultValue: 0
    });

    this.primitiveTypes.set('Long', {
      name: 'Long',
      primitive: VB6PrimitiveType.Long,
      size: 4,
      range: [-2147483648, 2147483647],
      defaultValue: 0
    });

    this.primitiveTypes.set('Single', {
      name: 'Single',
      primitive: VB6PrimitiveType.Single,
      size: 4,
      precision: 7,
      range: [-3.402823e38, 3.402823e38],
      defaultValue: 0.0
    });

    this.primitiveTypes.set('Double', {
      name: 'Double',
      primitive: VB6PrimitiveType.Double,
      size: 8,
      precision: 15,
      range: [-Number.MAX_VALUE, Number.MAX_VALUE],
      defaultValue: 0.0
    });

    this.primitiveTypes.set('Currency', {
      name: 'Currency',
      primitive: VB6PrimitiveType.Currency,
      size: 8,
      precision: 4,
      fixed: true,
      range: [-9.223372036854776e+15, 9.223372036854776e+15],
      defaultValue: 0
    });

    this.primitiveTypes.set('Decimal', {
      name: 'Decimal',
      primitive: VB6PrimitiveType.Decimal,
      size: 14,
      precision: 28,
      defaultValue: 0
    });

    this.primitiveTypes.set('Date', {
      name: 'Date',
      primitive: VB6PrimitiveType.Date,
      size: 8,
      range: [new Date('1/1/100').getTime(), new Date('12/31/9999').getTime()],
      defaultValue: new Date(0)
    });

    // Types chaîne et objet
    this.primitiveTypes.set('String', {
      name: 'String',
      primitive: VB6PrimitiveType.String,
      size: 'variable',
      encoding: 'UTF-16',
      defaultValue: ''
    });

    this.primitiveTypes.set('Object', {
      name: 'Object',
      primitive: VB6PrimitiveType.Object,
      size: 4,
      reference: true,
      nullable: true,
      defaultValue: null
    });

    this.primitiveTypes.set('Variant', {
      name: 'Variant',
      primitive: VB6PrimitiveType.Variant,
      size: 16,
      dynamic: true,
      defaultValue: null
    });

    // Types spéciaux
    this.primitiveTypes.set('Empty', {
      name: 'Empty',
      primitive: VB6PrimitiveType.Empty,
      size: 0,
      defaultValue: undefined
    });

    this.primitiveTypes.set('Null', {
      name: 'Null',
      primitive: VB6PrimitiveType.Null,
      size: 0,
      nullable: true,
      defaultValue: null
    });

    this.primitiveTypes.set('Nothing', {
      name: 'Nothing',
      primitive: VB6PrimitiveType.Nothing,
      size: 4,
      reference: true,
      nullable: true,
      defaultValue: null
    });

    this.primitiveTypes.set('Any', {
      name: 'Any',
      primitive: VB6PrimitiveType.Any,
      size: 'variable',
      dynamic: true,
      defaultValue: undefined
    });
  }

  /**
   * Enregistrer les alias de types courants
   */
  private registerTypeAliases(): void {
    this.typeAliases.set('%', 'Integer');
    this.typeAliases.set('&', 'Long');
    this.typeAliases.set('!', 'Single');
    this.typeAliases.set('#', 'Double');
    this.typeAliases.set('@', 'Currency');
    this.typeAliases.set('$', 'String');
  }

  /**
   * Obtenir information sur un type
   */
  public getType(typeName: string): VB6TypeInfo | undefined {
    // Vérifier les primitifs
    const primitive = this.primitiveTypes.get(typeName);
    if (primitive) return primitive;

    // Vérifier les alias
    const alias = this.typeAliases.get(typeName);
    if (alias) {
      return this.primitiveTypes.get(alias);
    }

    // Vérifier les UDT
    const udt = this.userDefinedTypes.get(typeName);
    if (udt) {
      return {
        name: udt.name,
        size: udt.size,
        reference: true,
        defaultValue: null
      };
    }

    // Vérifier les enums
    const enumType = this.enums.get(typeName);
    if (enumType) {
      return {
        name: enumType.name,
        size: 4, // Enums are Long in VB6
        defaultValue: 0
      };
    }

    return undefined;
  }

  /**
   * Vérifier si un type est numérique
   */
  public isNumeric(type: VB6TypeInfo | string): boolean {
    const typeInfo = typeof type === 'string' ? this.getType(type) : type;
    if (!typeInfo || !typeInfo.primitive) return false;

    const numericTypes = [
      VB6PrimitiveType.Byte,
      VB6PrimitiveType.Integer,
      VB6PrimitiveType.Long,
      VB6PrimitiveType.Single,
      VB6PrimitiveType.Double,
      VB6PrimitiveType.Currency,
      VB6PrimitiveType.Decimal
    ];

    return numericTypes.includes(typeInfo.primitive);
  }

  /**
   * Vérifier la compatibilité entre deux types
   */
  public checkTypeCompatibility(source: VB6TypeInfo | string, target: VB6TypeInfo | string): TypeCheckResult {
    const sourceType = typeof source === 'string' ? this.getType(source) : source;
    const targetType = typeof target === 'string' ? this.getType(target) : target;

    if (!sourceType || !targetType) {
      return {
        valid: false,
        error: 'Unknown type'
      };
    }

    // Variant peut accepter n'importe quoi
    if (targetType.primitive === VB6PrimitiveType.Variant) {
      return { valid: true, lossless: true };
    }

    // Any accepte tout
    if (targetType.primitive === VB6PrimitiveType.Any) {
      return { valid: true, runtime: true };
    }

    // Types identiques
    if (sourceType.name === targetType.name) {
      return { valid: true, lossless: true };
    }

    // Conversions numériques
    if (this.isNumeric(sourceType) && this.isNumeric(targetType)) {
      return this.checkNumericCompatibility(sourceType, targetType);
    }

    // String vers numérique
    if (sourceType.primitive === VB6PrimitiveType.String && this.isNumeric(targetType)) {
      return {
        valid: true,
        runtime: true,
        warning: 'Type mismatch: String to numeric conversion at runtime',
        conversion: 'Val'
      };
    }

    // Numérique vers String
    if (this.isNumeric(sourceType) && targetType.primitive === VB6PrimitiveType.String) {
      return {
        valid: true,
        lossless: true,
        conversion: 'CStr'
      };
    }

    // Boolean conversions
    if (sourceType.primitive === VB6PrimitiveType.Boolean || targetType.primitive === VB6PrimitiveType.Boolean) {
      return this.checkBooleanCompatibility(sourceType, targetType);
    }

    // Object compatibility
    if (sourceType.primitive === VB6PrimitiveType.Object || targetType.primitive === VB6PrimitiveType.Object) {
      return this.checkObjectCompatibility(sourceType, targetType);
    }

    // Date conversions
    if (sourceType.primitive === VB6PrimitiveType.Date || targetType.primitive === VB6PrimitiveType.Date) {
      return this.checkDateCompatibility(sourceType, targetType);
    }

    return {
      valid: false,
      error: `Cannot convert ${sourceType.name} to ${targetType.name}`
    };
  }

  /**
   * Vérifier compatibilité numérique avec gestion overflow
   */
  private checkNumericCompatibility(source: VB6TypeInfo, target: VB6TypeInfo): TypeCheckResult {
    // Vérifier les ranges si disponibles
    if (source.range && target.range) {
      const [sourceMin, sourceMax] = source.range;
      const [targetMin, targetMax] = target.range;

      // Conversion sans perte
      if (sourceMin >= targetMin && sourceMax <= targetMax) {
        return { valid: true, lossless: true };
      }

      // Conversion avec risque d'overflow
      return {
        valid: true,
        warning: `Possible overflow: ${source.name} (${sourceMin} to ${sourceMax}) to ${target.name} (${targetMin} to ${targetMax})`
      };
    }

    // Vérifier la précision pour les flottants
    if (source.precision && target.precision) {
      if (source.precision > target.precision) {
        return {
          valid: true,
          warning: `Precision loss: ${source.name} (${source.precision} digits) to ${target.name} (${target.precision} digits)`
        };
      }
    }

    // Conversion par défaut autorisée entre numériques
    return { valid: true };
  }

  /**
   * Vérifier compatibilité Boolean
   */
  private checkBooleanCompatibility(source: VB6TypeInfo, target: VB6TypeInfo): TypeCheckResult {
    // Boolean vers numérique
    if (source.primitive === VB6PrimitiveType.Boolean && this.isNumeric(target)) {
      return {
        valid: true,
        lossless: true,
        conversion: 'CBool'
      };
    }

    // Numérique vers Boolean
    if (this.isNumeric(source) && target.primitive === VB6PrimitiveType.Boolean) {
      return {
        valid: true,
        warning: 'Non-zero values become True',
        conversion: 'CBool'
      };
    }

    // String vers Boolean
    if (source.primitive === VB6PrimitiveType.String && target.primitive === VB6PrimitiveType.Boolean) {
      return {
        valid: true,
        runtime: true,
        warning: 'String to Boolean conversion at runtime',
        conversion: 'CBool'
      };
    }

    return { valid: false };
  }

  /**
   * Vérifier compatibilité Object
   */
  private checkObjectCompatibility(source: VB6TypeInfo, target: VB6TypeInfo): TypeCheckResult {
    // Nothing peut être assigné à n'importe quel Object
    if (source.primitive === VB6PrimitiveType.Nothing && target.primitive === VB6PrimitiveType.Object) {
      return { valid: true, lossless: true };
    }

    // Object vers Object (nécessite vérification runtime)
    if (source.primitive === VB6PrimitiveType.Object && target.primitive === VB6PrimitiveType.Object) {
      return {
        valid: true,
        runtime: true,
        warning: 'Object type compatibility checked at runtime'
      };
    }

    return {
      valid: false,
      error: 'Object type mismatch'
    };
  }

  /**
   * Vérifier compatibilité Date
   */
  private checkDateCompatibility(source: VB6TypeInfo, target: VB6TypeInfo): TypeCheckResult {
    // String vers Date
    if (source.primitive === VB6PrimitiveType.String && target.primitive === VB6PrimitiveType.Date) {
      return {
        valid: true,
        runtime: true,
        warning: 'String to Date conversion at runtime',
        conversion: 'CDate'
      };
    }

    // Date vers String
    if (source.primitive === VB6PrimitiveType.Date && target.primitive === VB6PrimitiveType.String) {
      return {
        valid: true,
        lossless: true,
        conversion: 'Format'
      };
    }

    // Numérique vers Date (Double représentation)
    if (this.isNumeric(source) && target.primitive === VB6PrimitiveType.Date) {
      return {
        valid: true,
        conversion: 'CDate'
      };
    }

    // Date vers numérique
    if (source.primitive === VB6PrimitiveType.Date && this.isNumeric(target)) {
      return {
        valid: true,
        conversion: 'CDbl'
      };
    }

    return { valid: false };
  }

  /**
   * Enregistrer un type défini par l'utilisateur
   */
  public registerUserDefinedType(udt: VB6UserDefinedType): void {
    this.userDefinedTypes.set(udt.name, udt);
  }

  /**
   * Enregistrer une énumération
   */
  public registerEnum(enumDef: VB6Enum): void {
    this.enums.set(enumDef.name, enumDef);
  }

  /**
   * Calculer la taille d'un type en octets
   */
  public getTypeSize(typeName: string): number | 'variable' {
    const type = this.getType(typeName);
    return type ? type.size : 0;
  }

  /**
   * Obtenir la valeur par défaut d'un type
   */
  public getDefaultValue(typeName: string): any {
    const type = this.getType(typeName);
    return type ? type.defaultValue : null;
  }

  /**
   * Vérifier si un type est nullable
   */
  public isNullable(typeName: string): boolean {
    const type = this.getType(typeName);
    return type ? type.nullable === true : false;
  }

  /**
   * Vérifier si un type est une référence
   */
  public isReference(typeName: string): boolean {
    const type = this.getType(typeName);
    return type ? type.reference === true : false;
  }

  /**
   * Obtenir tous les types enregistrés
   */
  public getAllTypes(): string[] {
    return [
      ...Array.from(this.primitiveTypes.keys()),
      ...Array.from(this.userDefinedTypes.keys()),
      ...Array.from(this.enums.keys())
    ];
  }

  /**
   * Créer un type array
   */
  public createArrayType(elementType: string, dimensions: number[]): VB6ArrayType {
    const typeInfo = this.getType(elementType);
    if (!typeInfo) {
      throw new Error(`Unknown element type: ${elementType}`);
    }

    return {
      elementType: typeInfo,
      dimensions,
      dynamic: dimensions.some(d => d === -1) // -1 indicates dynamic dimension
    };
  }

  /**
   * Créer un type string de longueur fixe
   */
  public createFixedLengthString(length: number): VB6TypeInfo {
    return {
      name: `String * ${length}`,
      primitive: VB6PrimitiveType.String,
      size: length * 2, // UTF-16 encoding
      encoding: 'UTF-16',
      defaultValue: ' '.repeat(length)
    };
  }
}

// Export singleton instance
export const vb6TypeSystem = new VB6TypeSystem();

export default VB6TypeSystem;