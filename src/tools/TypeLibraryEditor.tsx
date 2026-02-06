import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// Type Library Types
export enum TypeKind {
  Enum = 'Enum',
  Record = 'Record',
  Module = 'Module',
  Interface = 'Interface',
  Dispatch = 'Dispatch',
  CoClass = 'CoClass',
  Alias = 'Alias',
  Union = 'Union',
}

export enum ParameterDirection {
  In = 'In',
  Out = 'Out',
  InOut = 'InOut',
  RetVal = 'RetVal',
}

export enum VariantType {
  Empty = 'VT_EMPTY',
  Null = 'VT_NULL',
  I2 = 'VT_I2',
  I4 = 'VT_I4',
  R4 = 'VT_R4',
  R8 = 'VT_R8',
  CY = 'VT_CY',
  Date = 'VT_DATE',
  BSTR = 'VT_BSTR',
  Dispatch = 'VT_DISPATCH',
  Error = 'VT_ERROR',
  Bool = 'VT_BOOL',
  Variant = 'VT_VARIANT',
  Unknown = 'VT_UNKNOWN',
  Decimal = 'VT_DECIMAL',
  I1 = 'VT_I1',
  UI1 = 'VT_UI1',
  UI2 = 'VT_UI2',
  UI4 = 'VT_UI4',
  I8 = 'VT_I8',
  UI8 = 'VT_UI8',
  Int = 'VT_INT',
  UInt = 'VT_UINT',
  Void = 'VT_VOID',
  HResult = 'VT_HRESULT',
  Ptr = 'VT_PTR',
  SafeArray = 'VT_SAFEARRAY',
  CArray = 'VT_CARRAY',
  UserDefined = 'VT_USERDEFINED',
  LPSTR = 'VT_LPSTR',
  LPWSTR = 'VT_LPWSTR',
}

// Type Library Parameter
export interface TypeLibParameter {
  id: string;
  name: string;
  type: VariantType | string;
  direction: ParameterDirection;
  optional: boolean;
  defaultValue?: any;
  description?: string;
  attributes: string[];
}

// Type Library Method
export interface TypeLibMethod {
  id: string;
  name: string;
  dispId: number;
  returnType: VariantType | string;
  parameters: TypeLibParameter[];
  description?: string;
  helpString?: string;
  helpContext?: number;
  attributes: string[];
  bindable: boolean;
  displayBind: boolean;
  defaultBind: boolean;
  requestEdit: boolean;
  propertyGet: boolean;
  propertyPut: boolean;
  propertyPutRef: boolean;
  restricted: boolean;
  source: boolean;
  varArg: boolean;
}

// Type Library Property
export interface TypeLibProperty {
  id: string;
  name: string;
  dispId: number;
  type: VariantType | string;
  readonly: boolean;
  writeonly: boolean;
  description?: string;
  helpString?: string;
  helpContext?: number;
  attributes: string[];
  bindable: boolean;
  displayBind: boolean;
  defaultBind: boolean;
  requestEdit: boolean;
  restricted: boolean;
  source: boolean;
  defaultValue?: any;
}

// Type Library Enum Value
export interface TypeLibEnumValue {
  id: string;
  name: string;
  value: number;
  description?: string;
  helpString?: string;
}

// Type Library Record Field
export interface TypeLibRecordField {
  id: string;
  name: string;
  type: VariantType | string;
  offset: number;
  size: number;
  description?: string;
}

// Type Library Interface
export interface TypeLibInterface {
  id: string;
  name: string;
  kind: TypeKind;
  guid: string;
  version: {
    major: number;
    minor: number;
  };
  description?: string;
  helpString?: string;
  helpFile?: string;
  helpContext?: number;
  attributes: string[];
  baseInterface?: string;
  methods: TypeLibMethod[];
  properties: TypeLibProperty[];
  enumValues: TypeLibEnumValue[];
  recordFields: TypeLibRecordField[];
  constants: Array<{
    id: string;
    name: string;
    type: VariantType | string;
    value: any;
    description?: string;
  }>;
  flags: {
    dual: boolean;
    oleAutomation: boolean;
    restricted: boolean;
    hidden: boolean;
    control: boolean;
    licensed: boolean;
    predeclId: boolean;
    nonExtensible: boolean;
    aggregatable: boolean;
    replaceable: boolean;
    reverseBind: boolean;
  };
}

// Type Library
export interface TypeLibrary {
  id: string;
  name: string;
  filename: string;
  path: string;
  guid: string;
  version: {
    major: number;
    minor: number;
  };
  description?: string;
  helpString?: string;
  helpFile?: string;
  helpContext?: number;
  lcid: number;
  created: Date;
  modified: Date;
  interfaces: TypeLibInterface[];
  attributes: string[];
  flags: {
    restricted: boolean;
    control: boolean;
    hidden: boolean;
    hasLicensedComponents: boolean;
  };
}

interface TypeLibraryEditorProps {
  typeLibrary?: TypeLibrary;
  onTypeLibraryChange?: (typeLib: TypeLibrary) => void;
  onSave?: (typeLib: TypeLibrary) => void;
  onExport?: (typeLib: TypeLibrary, format: 'IDL' | 'VB6' | 'C++') => void;
}

export const TypeLibraryEditor: React.FC<TypeLibraryEditorProps> = ({
  typeLibrary: initialTypeLibrary,
  onTypeLibraryChange,
  onSave,
  onExport,
}) => {
  const [typeLibrary, setTypeLibrary] = useState<TypeLibrary>(
    initialTypeLibrary || {
      id: 'tlib_1',
      name: 'NewTypeLibrary',
      filename: 'NewTypeLibrary.tlb',
      path: 'C:\\TypeLibraries\\NewTypeLibrary.tlb',
      guid: generateGUID(),
      version: { major: 1, minor: 0 },
      description: 'New Type Library',
      lcid: 0x0409, // English US
      created: new Date(),
      modified: new Date(),
      interfaces: [],
      attributes: [],
      flags: {
        restricted: false,
        control: false,
        hidden: false,
        hasLicensedComponents: false,
      },
    }
  );

  const [selectedTab, setSelectedTab] = useState<'browser' | 'interface' | 'properties' | 'code'>(
    'browser'
  );
  const [selectedInterface, setSelectedInterface] = useState<TypeLibInterface | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<TypeLibMethod | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<TypeLibProperty | null>(null);
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(new Set(['interfaces']));
  const [showInterfaceDialog, setShowInterfaceDialog] = useState(false);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [interfaceForm, setInterfaceForm] = useState<Partial<TypeLibInterface>>({
    kind: TypeKind.Interface,
    version: { major: 1, minor: 0 },
    methods: [],
    properties: [],
    enumValues: [],
    recordFields: [],
    constants: [],
    attributes: [],
    flags: {
      dual: false,
      oleAutomation: true,
      restricted: false,
      hidden: false,
      control: false,
      licensed: false,
      predeclId: false,
      nonExtensible: false,
      aggregatable: false,
      replaceable: false,
      reverseBind: false,
    },
  });
  const [methodForm, setMethodForm] = useState<Partial<TypeLibMethod>>({
    returnType: VariantType.Void,
    parameters: [],
    attributes: [],
    bindable: false,
    displayBind: false,
    defaultBind: false,
    requestEdit: false,
    propertyGet: false,
    propertyPut: false,
    propertyPutRef: false,
    restricted: false,
    source: false,
    varArg: false,
  });
  const [propertyForm, setPropertyForm] = useState<Partial<TypeLibProperty>>({
    type: VariantType.Variant,
    readonly: false,
    writeonly: false,
    attributes: [],
    bindable: false,
    displayBind: false,
    defaultBind: false,
    requestEdit: false,
    restricted: false,
    source: false,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeFormat, setCodeFormat] = useState<'IDL' | 'VB6' | 'C++'>('VB6');

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `item_${nextId.current++}`, []);

  // Generate GUID
  function generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Sample type library data
  const sampleTypeLibrary: TypeLibrary = {
    id: 'tlib_sample',
    name: 'SampleLibrary',
    filename: 'SampleLibrary.tlb',
    path: 'C:\\TypeLibraries\\SampleLibrary.tlb',
    guid: '{12345678-1234-4567-8901-123456789ABC}',
    version: { major: 1, minor: 0 },
    description: 'Sample Type Library for demonstration',
    helpString: 'This is a sample type library',
    lcid: 0x0409,
    created: new Date('2023-01-01'),
    modified: new Date(),
    interfaces: [
      {
        id: 'iface_1',
        name: 'IMyInterface',
        kind: TypeKind.Interface,
        guid: '{87654321-4321-4321-4321-210987654321}',
        version: { major: 1, minor: 0 },
        description: 'Sample interface',
        helpString: 'A sample interface for demonstration',
        attributes: ['oleautomation', 'dual'],
        methods: [
          {
            id: 'method_1',
            name: 'DoSomething',
            dispId: 1,
            returnType: VariantType.HResult,
            parameters: [
              {
                id: 'param_1',
                name: 'input',
                type: VariantType.BSTR,
                direction: ParameterDirection.In,
                optional: false,
                attributes: ['in'],
              },
              {
                id: 'param_2',
                name: 'result',
                type: VariantType.I4,
                direction: ParameterDirection.Out,
                optional: false,
                attributes: ['out', 'retval'],
              },
            ],
            description: 'Performs some operation',
            attributes: ['id(1)'],
            bindable: false,
            displayBind: false,
            defaultBind: false,
            requestEdit: false,
            propertyGet: false,
            propertyPut: false,
            propertyPutRef: false,
            restricted: false,
            source: false,
            varArg: false,
          },
        ],
        properties: [
          {
            id: 'prop_1',
            name: 'Value',
            dispId: 2,
            type: VariantType.Variant,
            readonly: false,
            writeonly: false,
            description: 'Sample property',
            attributes: ['id(2)', 'propget', 'propput'],
            bindable: true,
            displayBind: false,
            defaultBind: false,
            requestEdit: false,
            restricted: false,
            source: false,
          },
        ],
        enumValues: [],
        recordFields: [],
        constants: [],
        baseInterface: 'IDispatch',
        flags: {
          dual: true,
          oleAutomation: true,
          restricted: false,
          hidden: false,
          control: false,
          licensed: false,
          predeclId: false,
          nonExtensible: false,
          aggregatable: false,
          replaceable: false,
          reverseBind: false,
        },
      },
      {
        id: 'enum_1',
        name: 'MyEnum',
        kind: TypeKind.Enum,
        guid: '{11111111-2222-3333-4444-555555555555}',
        version: { major: 1, minor: 0 },
        description: 'Sample enumeration',
        attributes: [],
        methods: [],
        properties: [],
        enumValues: [
          {
            id: 'enum_val_1',
            name: 'Value1',
            value: 0,
            description: 'First value',
          },
          {
            id: 'enum_val_2',
            name: 'Value2',
            value: 1,
            description: 'Second value',
          },
        ],
        recordFields: [],
        constants: [],
        flags: {
          dual: false,
          oleAutomation: false,
          restricted: false,
          hidden: false,
          control: false,
          licensed: false,
          predeclId: false,
          nonExtensible: false,
          aggregatable: false,
          replaceable: false,
          reverseBind: false,
        },
      },
    ],
    attributes: ['version(1.0)', 'uuid({12345678-1234-4567-8901-123456789ABC})'],
    flags: {
      restricted: false,
      control: false,
      hidden: false,
      hasLicensedComponents: false,
    },
  };

  // Initialize with sample data
  useEffect(() => {
    if (!initialTypeLibrary) {
      setTypeLibrary(sampleTypeLibrary);
    }
  }, [initialTypeLibrary]);

  // Add interface
  const addInterface = useCallback(() => {
    if (!interfaceForm.name) return;

    const newInterface: TypeLibInterface = {
      id: generateId(),
      name: interfaceForm.name,
      kind: interfaceForm.kind || TypeKind.Interface,
      guid: generateGUID(),
      version: interfaceForm.version || { major: 1, minor: 0 },
      description: interfaceForm.description,
      helpString: interfaceForm.helpString,
      helpFile: interfaceForm.helpFile,
      helpContext: interfaceForm.helpContext,
      attributes: interfaceForm.attributes || [],
      baseInterface: interfaceForm.baseInterface,
      methods: [],
      properties: [],
      enumValues: [],
      recordFields: [],
      constants: [],
      flags: interfaceForm.flags || {
        dual: false,
        oleAutomation: true,
        restricted: false,
        hidden: false,
        control: false,
        licensed: false,
        predeclId: false,
        nonExtensible: false,
        aggregatable: false,
        replaceable: false,
        reverseBind: false,
      },
    };

    setTypeLibrary(prev => ({
      ...prev,
      interfaces: [...prev.interfaces, newInterface],
      modified: new Date(),
    }));

    setInterfaceForm({
      kind: TypeKind.Interface,
      version: { major: 1, minor: 0 },
      methods: [],
      properties: [],
      enumValues: [],
      recordFields: [],
      constants: [],
      attributes: [],
      flags: {
        dual: false,
        oleAutomation: true,
        restricted: false,
        hidden: false,
        control: false,
        licensed: false,
        predeclId: false,
        nonExtensible: false,
        aggregatable: false,
        replaceable: false,
        reverseBind: false,
      },
    });
    setShowInterfaceDialog(false);
    setIsDirty(true);
  }, [interfaceForm, generateId]);

  // Add method
  const addMethod = useCallback(() => {
    if (!methodForm.name || !selectedInterface) return;

    const newMethod: TypeLibMethod = {
      id: generateId(),
      name: methodForm.name,
      dispId: methodForm.dispId || Math.max(0, ...selectedInterface.methods.map(m => m.dispId)) + 1,
      returnType: methodForm.returnType || VariantType.Void,
      parameters: methodForm.parameters || [],
      description: methodForm.description,
      helpString: methodForm.helpString,
      helpContext: methodForm.helpContext,
      attributes: methodForm.attributes || [],
      bindable: methodForm.bindable || false,
      displayBind: methodForm.displayBind || false,
      defaultBind: methodForm.defaultBind || false,
      requestEdit: methodForm.requestEdit || false,
      propertyGet: methodForm.propertyGet || false,
      propertyPut: methodForm.propertyPut || false,
      propertyPutRef: methodForm.propertyPutRef || false,
      restricted: methodForm.restricted || false,
      source: methodForm.source || false,
      varArg: methodForm.varArg || false,
    };

    setTypeLibrary(prev => ({
      ...prev,
      interfaces: prev.interfaces.map(iface =>
        iface.id === selectedInterface.id
          ? { ...iface, methods: [...iface.methods, newMethod] }
          : iface
      ),
      modified: new Date(),
    }));

    setMethodForm({
      returnType: VariantType.Void,
      parameters: [],
      attributes: [],
      bindable: false,
      displayBind: false,
      defaultBind: false,
      requestEdit: false,
      propertyGet: false,
      propertyPut: false,
      propertyPutRef: false,
      restricted: false,
      source: false,
      varArg: false,
    });
    setShowMethodDialog(false);
    setIsDirty(true);
  }, [methodForm, selectedInterface, generateId]);

  // Generate code
  const generateCode = useCallback(
    (format: 'IDL' | 'VB6' | 'C++') => {
      let code = '';

      if (format === 'VB6') {
        code += `' Type Library: ${typeLibrary.name}\n`;
        code += `' GUID: ${typeLibrary.guid}\n`;
        code += `' Version: ${typeLibrary.version.major}.${typeLibrary.version.minor}\n\n`;

        typeLibrary.interfaces.forEach(iface => {
          if (iface.kind === TypeKind.Interface) {
            code += `' Interface: ${iface.name}\n`;
            code += `' GUID: ${iface.guid}\n\n`;

            // Constants
            if (iface.constants.length > 0) {
              code += `' Constants\n`;
              iface.constants.forEach(constant => {
                code += `Public Const ${constant.name} As ${getVB6Type(constant.type)} = ${constant.value}\n`;
              });
              code += `\n`;
            }

            // Methods
            iface.methods.forEach(method => {
              const params = method.parameters
                .filter(p => p.direction !== ParameterDirection.RetVal)
                .map(p => {
                  const direction = p.direction === ParameterDirection.Out ? 'ByRef' : 'ByVal';
                  const optional = p.optional ? 'Optional ' : '';
                  return `${optional}${direction} ${p.name} As ${getVB6Type(p.type)}`;
                })
                .join(', ');

              const returnParam = method.parameters.find(
                p => p.direction === ParameterDirection.RetVal
              );
              const returnType = returnParam ? ` As ${getVB6Type(returnParam.type)}` : '';

              code += `${method.description ? `' ${method.description}\n` : ''}`;
              code += `Function ${method.name}(${params})${returnType}\n`;
              code += `End Function\n\n`;
            });

            // Properties
            iface.properties.forEach(prop => {
              code += `${prop.description ? `' ${prop.description}\n` : ''}`;
              if (!prop.writeonly) {
                code += `Property Get ${prop.name}() As ${getVB6Type(prop.type)}\n`;
                code += `End Property\n\n`;
              }
              if (!prop.readonly) {
                code += `Property Let ${prop.name}(ByVal value As ${getVB6Type(prop.type)})\n`;
                code += `End Property\n\n`;
              }
            });
          } else if (iface.kind === TypeKind.Enum) {
            code += `' Enumeration: ${iface.name}\n`;
            code += `Public Enum ${iface.name}\n`;
            iface.enumValues.forEach(enumVal => {
              code += `    ${enumVal.name} = ${enumVal.value}\n`;
            });
            code += `End Enum\n\n`;
          }
        });
      } else if (format === 'IDL') {
        code += `// Type Library: ${typeLibrary.name}\n`;
        code += `// Generated IDL file\n\n`;
        code += `[\n`;
        code += `    uuid(${typeLibrary.guid}),\n`;
        code += `    version(${typeLibrary.version.major}.${typeLibrary.version.minor}),\n`;
        code += `    helpstring("${typeLibrary.description || typeLibrary.name}")\n`;
        code += `]\n`;
        code += `library ${typeLibrary.name}\n`;
        code += `{\n`;
        code += `    importlib("stdole2.tlb");\n\n`;

        typeLibrary.interfaces.forEach(iface => {
          if (iface.kind === TypeKind.Interface) {
            code += `    [\n`;
            code += `        object,\n`;
            code += `        uuid(${iface.guid}),\n`;
            if (iface.flags.dual) code += `        dual,\n`;
            if (iface.flags.oleAutomation) code += `        oleautomation,\n`;
            code += `        helpstring("${iface.description || iface.name}")\n`;
            code += `    ]\n`;
            code += `    interface ${iface.name} : ${iface.baseInterface || 'IUnknown'}\n`;
            code += `    {\n`;

            iface.methods.forEach(method => {
              const params = method.parameters
                .map(p => {
                  const direction = p.direction.toLowerCase();
                  return `[${direction}] ${getIDLType(p.type)} ${p.name}`;
                })
                .join(', ');

              code += `        HRESULT ${method.name}(${params});\n`;
            });

            iface.properties.forEach(prop => {
              if (!prop.writeonly) {
                code += `        [propget] HRESULT ${prop.name}([out, retval] ${getIDLType(prop.type)}* value);\n`;
              }
              if (!prop.readonly) {
                code += `        [propput] HRESULT ${prop.name}([in] ${getIDLType(prop.type)} value);\n`;
              }
            });

            code += `    };\n\n`;
          } else if (iface.kind === TypeKind.Enum) {
            code += `    typedef enum ${iface.name}\n`;
            code += `    {\n`;
            iface.enumValues.forEach(enumVal => {
              code += `        ${enumVal.name} = ${enumVal.value},\n`;
            });
            code += `    } ${iface.name};\n\n`;
          }
        });

        code += `};\n`;
      } else if (format === 'C++') {
        code += `// Type Library: ${typeLibrary.name}\n`;
        code += `// Generated C++ header file\n\n`;
        code += `#pragma once\n`;
        code += `#include <windows.h>\n`;
        code += `#include <objbase.h>\n\n`;

        typeLibrary.interfaces.forEach(iface => {
          if (iface.kind === TypeKind.Interface) {
            code += `// Interface: ${iface.name}\n`;
            code += `MIDL_INTERFACE("${iface.guid}")\n`;
            code += `${iface.name} : public ${iface.baseInterface || 'IUnknown'}\n`;
            code += `{\n`;
            code += `public:\n`;

            iface.methods.forEach(method => {
              const params = method.parameters
                .map(p => {
                  const direction =
                    p.direction === ParameterDirection.Out ? '/* [out] */' : '/* [in] */';
                  return `${direction} ${getCppType(p.type)} ${p.name}`;
                })
                .join(', ');

              code += `    virtual HRESULT STDMETHODCALLTYPE ${method.name}(${params}) = 0;\n`;
            });

            iface.properties.forEach(prop => {
              if (!prop.writeonly) {
                code += `    virtual HRESULT STDMETHODCALLTYPE get_${prop.name}(/* [out, retval] */ ${getCppType(prop.type)}* value) = 0;\n`;
              }
              if (!prop.readonly) {
                code += `    virtual HRESULT STDMETHODCALLTYPE put_${prop.name}(/* [in] */ ${getCppType(prop.type)} value) = 0;\n`;
              }
            });

            code += `};\n\n`;
          } else if (iface.kind === TypeKind.Enum) {
            code += `enum ${iface.name}\n`;
            code += `{\n`;
            iface.enumValues.forEach(enumVal => {
              code += `    ${enumVal.name} = ${enumVal.value},\n`;
            });
            code += `};\n\n`;
          }
        });
      }

      setGeneratedCode(code);
      return code;
    },
    [typeLibrary]
  );

  // Helper functions for type conversion
  const getVB6Type = (varType: VariantType | string): string => {
    const typeMap: Record<string, string> = {
      [VariantType.I2]: 'Integer',
      [VariantType.I4]: 'Long',
      [VariantType.R4]: 'Single',
      [VariantType.R8]: 'Double',
      [VariantType.CY]: 'Currency',
      [VariantType.Date]: 'Date',
      [VariantType.BSTR]: 'String',
      [VariantType.Dispatch]: 'Object',
      [VariantType.Bool]: 'Boolean',
      [VariantType.Variant]: 'Variant',
      [VariantType.Decimal]: 'Decimal',
      [VariantType.I1]: 'Byte',
      [VariantType.UI1]: 'Byte',
      [VariantType.Void]: 'void',
    };
    return typeMap[varType] || varType;
  };

  const getIDLType = (varType: VariantType | string): string => {
    const typeMap: Record<string, string> = {
      [VariantType.I2]: 'short',
      [VariantType.I4]: 'long',
      [VariantType.R4]: 'float',
      [VariantType.R8]: 'double',
      [VariantType.BSTR]: 'BSTR',
      [VariantType.Bool]: 'VARIANT_BOOL',
      [VariantType.Variant]: 'VARIANT',
      [VariantType.I1]: 'signed char',
      [VariantType.UI1]: 'unsigned char',
      [VariantType.Void]: 'void',
    };
    return typeMap[varType] || varType;
  };

  const getCppType = (varType: VariantType | string): string => {
    const typeMap: Record<string, string> = {
      [VariantType.I2]: 'short',
      [VariantType.I4]: 'long',
      [VariantType.R4]: 'float',
      [VariantType.R8]: 'double',
      [VariantType.BSTR]: 'BSTR',
      [VariantType.Bool]: 'VARIANT_BOOL',
      [VariantType.Variant]: 'VARIANT*',
      [VariantType.I1]: 'signed char',
      [VariantType.UI1]: 'unsigned char',
      [VariantType.Void]: 'void',
    };
    return typeMap[varType] || varType;
  };

  // Toggle tree expansion
  const toggleTreeExpansion = (nodeId: string) => {
    setTreeExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Update the code when format changes
  useEffect(() => {
    generateCode(codeFormat);
  }, [codeFormat, typeLibrary, generateCode]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Type Library Editor</h1>
            <span className="text-sm text-gray-600">{typeLibrary.name}</span>
            {isDirty && <span className="text-sm text-orange-600">* Unsaved changes</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInterfaceDialog(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Interface
            </button>
            <button
              onClick={() => onExport?.(typeLibrary, codeFormat)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export {codeFormat}
            </button>
            <button
              onClick={() => onSave?.(typeLibrary)}
              disabled={!isDirty}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'browser', label: 'Type Browser', count: typeLibrary.interfaces.length },
            { key: 'interface', label: 'Interface Designer', count: 0 },
            { key: 'properties', label: 'Properties', count: 0 },
            { key: 'code', label: 'Generated Code', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-2 border-b-2 ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {selectedTab === 'browser' && (
          <>
            {/* Type Tree */}
            <div className="w-80 border-r border-gray-200 overflow-y-auto">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Type Library Browser</h3>
              </div>
              <div className="p-2">
                {/* Library Info */}
                <div className="mb-4">
                  <div
                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => toggleTreeExpansion('library')}
                  >
                    <span className="text-xs">{treeExpanded.has('library') ? '▼' : '▶'}</span>
                    <span className="text-sm font-medium">📚 {typeLibrary.name}</span>
                  </div>
                  {treeExpanded.has('library') && (
                    <div className="ml-6 text-xs text-gray-600">
                      <div>GUID: {typeLibrary.guid}</div>
                      <div>
                        Version: {typeLibrary.version.major}.{typeLibrary.version.minor}
                      </div>
                      <div>Interfaces: {typeLibrary.interfaces.length}</div>
                    </div>
                  )}
                </div>

                {/* Interfaces */}
                <div>
                  <div
                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => toggleTreeExpansion('interfaces')}
                  >
                    <span className="text-xs">{treeExpanded.has('interfaces') ? '▼' : '▶'}</span>
                    <span className="text-sm font-medium">
                      Interfaces ({typeLibrary.interfaces.length})
                    </span>
                  </div>
                  {treeExpanded.has('interfaces') && (
                    <div className="ml-4">
                      {typeLibrary.interfaces.map(iface => (
                        <div key={iface.id} className="mb-2">
                          <div
                            className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
                              selectedInterface?.id === iface.id ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => {
                              setSelectedInterface(iface);
                              toggleTreeExpansion(iface.id);
                            }}
                          >
                            <span className="text-xs">
                              {treeExpanded.has(iface.id) ? '▼' : '▶'}
                            </span>
                            <span className="text-xs">{getInterfaceIcon(iface.kind)}</span>
                            <span className="text-sm">{iface.name}</span>
                          </div>
                          {treeExpanded.has(iface.id) && (
                            <div className="ml-6">
                              {iface.methods.length > 0 && (
                                <div className="mb-1">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    Methods ({iface.methods.length})
                                  </div>
                                  {iface.methods.map(method => (
                                    <div
                                      key={method.id}
                                      className={`text-xs py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
                                        selectedMethod?.id === method.id ? 'bg-blue-100' : ''
                                      }`}
                                      onClick={() => setSelectedMethod(method)}
                                    >
                                      🔧 {method.name}()
                                    </div>
                                  ))}
                                </div>
                              )}
                              {iface.properties.length > 0 && (
                                <div className="mb-1">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    Properties ({iface.properties.length})
                                  </div>
                                  {iface.properties.map(prop => (
                                    <div
                                      key={prop.id}
                                      className={`text-xs py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
                                        selectedProperty?.id === prop.id ? 'bg-blue-100' : ''
                                      }`}
                                      onClick={() => setSelectedProperty(prop)}
                                    >
                                      ⚙️ {prop.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {iface.enumValues.length > 0 && (
                                <div className="mb-1">
                                  <div className="text-xs font-medium text-gray-600 mb-1">
                                    Values ({iface.enumValues.length})
                                  </div>
                                  {iface.enumValues.map(enumVal => (
                                    <div
                                      key={enumVal.id}
                                      className="text-xs py-1 px-2 text-gray-600"
                                    >
                                      📝 {enumVal.name} = {enumVal.value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedInterface ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        {getInterfaceIcon(selectedInterface.kind)} {selectedInterface.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">{selectedInterface.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowMethodDialog(true)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Add Method
                      </button>
                      <button
                        onClick={() => setShowPropertyDialog(true)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add Property
                      </button>
                    </div>
                  </div>

                  {/* Interface Info */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-medium mb-2">Interface Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>GUID:</strong> {selectedInterface.guid}
                        </div>
                        <div>
                          <strong>Version:</strong> {selectedInterface.version.major}.
                          {selectedInterface.version.minor}
                        </div>
                        <div>
                          <strong>Kind:</strong> {selectedInterface.kind}
                        </div>
                        {selectedInterface.baseInterface && (
                          <div>
                            <strong>Base Interface:</strong> {selectedInterface.baseInterface}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Methods:</strong> {selectedInterface.methods.length}
                        </div>
                        <div>
                          <strong>Properties:</strong> {selectedInterface.properties.length}
                        </div>
                        <div>
                          <strong>Enum Values:</strong> {selectedInterface.enumValues.length}
                        </div>
                        <div>
                          <strong>Constants:</strong> {selectedInterface.constants.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Methods */}
                  {selectedInterface.methods.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Methods</h3>
                      <div className="border border-gray-300 rounded">
                        {selectedInterface.methods.map((method, index) => (
                          <div
                            key={method.id}
                            className="p-3 border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm">{method.name}</span>
                              <span className="text-xs text-gray-500">ID: {method.dispId}</span>
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              Returns: {getVB6Type(method.returnType)}
                            </div>
                            {method.parameters.length > 0 && (
                              <div className="text-xs text-gray-600">
                                Parameters:{' '}
                                {method.parameters
                                  .map(p => `${p.name}: ${getVB6Type(p.type)} (${p.direction})`)
                                  .join(', ')}
                              </div>
                            )}
                            {method.description && (
                              <div className="text-xs text-gray-700 mt-1">{method.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Properties */}
                  {selectedInterface.properties.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Properties</h3>
                      <div className="border border-gray-300 rounded">
                        {selectedInterface.properties.map((prop, index) => (
                          <div
                            key={prop.id}
                            className="p-3 border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm">{prop.name}</span>
                              <span className="text-xs text-gray-500">ID: {prop.dispId}</span>
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              Type: {getVB6Type(prop.type)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Access:{' '}
                              {prop.readonly
                                ? 'Read-only'
                                : prop.writeonly
                                  ? 'Write-only'
                                  : 'Read/Write'}
                            </div>
                            {prop.description && (
                              <div className="text-xs text-gray-700 mt-1">{prop.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-lg">Select an interface or type</p>
                  <p className="text-sm mt-2">
                    Choose an item from the type browser to view its details
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedTab === 'interface' && (
          <div className="flex-1 p-6">
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🛠️</div>
              <p className="text-lg">Interface Designer</p>
              <p className="text-sm mt-2">Visual interface design tools coming soon</p>
            </div>
          </div>
        )}

        {selectedTab === 'properties' && (
          <div className="flex-1 p-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Type Library Properties</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={typeLibrary.name}
                      onChange={e => setTypeLibrary(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                    <input
                      type="text"
                      value={typeLibrary.filename}
                      onChange={e =>
                        setTypeLibrary(prev => ({ ...prev, filename: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={typeLibrary.description || ''}
                    onChange={e =>
                      setTypeLibrary(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Major Version
                    </label>
                    <input
                      type="number"
                      value={typeLibrary.version.major}
                      onChange={e =>
                        setTypeLibrary(prev => ({
                          ...prev,
                          version: { ...prev.version, major: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minor Version
                    </label>
                    <input
                      type="number"
                      value={typeLibrary.version.minor}
                      onChange={e =>
                        setTypeLibrary(prev => ({
                          ...prev,
                          version: { ...prev.version, minor: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GUID</label>
                  <input
                    type="text"
                    value={typeLibrary.guid}
                    onChange={e => setTypeLibrary(prev => ({ ...prev, guid: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'code' && (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Generated Code</h2>
                <select
                  value={codeFormat}
                  onChange={e => setCodeFormat(e.target.value as 'IDL' | 'VB6' | 'C++')}
                  className="px-3 py-1 border border-gray-300 rounded"
                >
                  <option value="VB6">VB6 Declarations</option>
                  <option value="IDL">IDL Definition</option>
                  <option value="C++">C++ Header</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <textarea
                value={generatedCode}
                readOnly
                className="w-full h-full p-4 font-mono text-sm border-none outline-none resize-none bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Interface Dialog */}
      {showInterfaceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-medium mb-4">Add Interface</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={interfaceForm.name || ''}
                  onChange={e => setInterfaceForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="IMyInterface"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
                <select
                  value={interfaceForm.kind}
                  onChange={e =>
                    setInterfaceForm(prev => ({ ...prev, kind: e.target.value as TypeKind }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(TypeKind).map(kind => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={interfaceForm.description || ''}
                  onChange={e =>
                    setInterfaceForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Interface
                </label>
                <input
                  type="text"
                  value={interfaceForm.baseInterface || ''}
                  onChange={e =>
                    setInterfaceForm(prev => ({ ...prev, baseInterface: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="IDispatch"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowInterfaceDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addInterface}
                disabled={!interfaceForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Interface
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Method Dialog */}
      {showMethodDialog && selectedInterface && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-medium mb-4">Add Method to {selectedInterface.name}</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={methodForm.name || ''}
                    onChange={e => setMethodForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="MethodName"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispatch ID
                  </label>
                  <input
                    type="number"
                    value={methodForm.dispId || ''}
                    onChange={e =>
                      setMethodForm(prev => ({ ...prev, dispId: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
                <select
                  value={methodForm.returnType}
                  onChange={e =>
                    setMethodForm(prev => ({ ...prev, returnType: e.target.value as VariantType }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(VariantType).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={methodForm.description || ''}
                  onChange={e => setMethodForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowMethodDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addMethod}
                disabled={!methodForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Add Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getInterfaceIcon(kind: TypeKind): string {
    switch (kind) {
      case TypeKind.Interface:
        return '🔗';
      case TypeKind.Dispatch:
        return '📡';
      case TypeKind.CoClass:
        return '🏭';
      case TypeKind.Enum:
        return '📋';
      case TypeKind.Record:
        return '📊';
      case TypeKind.Module:
        return '📦';
      case TypeKind.Alias:
        return '🏷️';
      case TypeKind.Union:
        return '🔀';
      default:
        return '❓';
    }
  }
};

export default TypeLibraryEditor;
