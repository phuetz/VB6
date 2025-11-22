/**
 * DESIGN PATTERN FIX: Extracted type definitions from god object
 * Single Responsibility: Only type definitions and enums
 */

export enum VB6DataType {
  vbEmpty = 0,
  vbNull = 1,
  vbInteger = 2,
  vbLong = 3,
  vbSingle = 4,
  vbDouble = 5,
  vbCurrency = 6,
  vbDate = 7,
  vbString = 8,
  vbObject = 9,
  vbError = 10,
  vbBoolean = 11,
  vbVariant = 12,
  vbDataObject = 13,
  vbDecimal = 14,
  vbByte = 17,
  vbUserDefinedType = 36,
  vbArray = 8192
}

export interface VB6Variable {
  name: string;
  type: VB6DataType;
  value: any;
  isArray: boolean;
  dimensions?: number[];
  isPublic: boolean;
  isPrivate: boolean;
  isStatic: boolean;
  isDim: boolean;
  isConst: boolean;
  scope: 'module' | 'procedure' | 'global';
}

export interface VB6Parameter {
  name: string;
  type: VB6DataType;
  isOptional: boolean;
  defaultValue?: any;
  isParamArray: boolean;
  direction: 'ByVal' | 'ByRef';
}

export interface VB6Procedure {
  name: string;
  type: 'sub' | 'function' | 'property';
  parameters: VB6Parameter[];
  returnType?: VB6DataType;
  body: string;
  isPublic: boolean;
  isPrivate: boolean;
  isStatic: boolean;
  isAbstract?: boolean;
  isMustOverride?: boolean;
  module: string;
}

export interface VB6Module {
  name: string;
  type: 'standard' | 'class' | 'form' | 'usercontrol';
  path: string;
  procedures: Map<string, VB6Procedure>;
  variables: Map<string, VB6Variable>;
  constants: Map<string, any>;
  dependencies: string[];
  isCompiled: boolean;
  lastModified: Date;
}