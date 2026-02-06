import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { EventEmitter } from 'events';

// VB6 Data Types
export enum VB6DataType {
  Boolean = 'Boolean',
  Byte = 'Byte',
  Integer = 'Integer',
  Long = 'Long',
  Single = 'Single',
  Double = 'Double',
  Currency = 'Currency',
  Date = 'Date',
  String = 'String',
  Variant = 'Variant',
  Object = 'Object',
  Collection = 'Collection',
  Custom = 'Custom',
}

// Access Modifiers
export enum AccessModifier {
  Public = 'Public',
  Private = 'Private',
  Friend = 'Friend',
}

// Parameter Passing
export enum ParameterPassing {
  ByVal = 'ByVal',
  ByRef = 'ByRef',
  Optional = 'Optional',
}

// Class Member Types
export enum MemberType {
  Property = 'Property',
  Method = 'Method',
  Event = 'Event',
  Field = 'Field',
}

// COM Threading Models
export enum ThreadingModel {
  Apartment = 'Apartment',
  Free = 'Free',
  Both = 'Both',
  Neutral = 'Neutral',
}

// Class Parameter
export interface ClassParameter {
  name: string;
  dataType: VB6DataType;
  customType?: string;
  passing: ParameterPassing;
  defaultValue?: string;
  description: string;
}

// Class Property
export interface ClassProperty {
  id: string;
  name: string;
  dataType: VB6DataType;
  customType?: string;
  accessModifier: AccessModifier;
  hasGet: boolean;
  hasSet: boolean;
  hasLet: boolean;
  defaultValue?: string;
  description: string;
  validation?: string;
  readOnly: boolean;
  withEvents: boolean;
  array: boolean;
  arrayDimensions?: string;
}

// Class Method
export interface ClassMethod {
  id: string;
  name: string;
  accessModifier: AccessModifier;
  returnType?: VB6DataType;
  customReturnType?: string;
  parameters: ClassParameter[];
  description: string;
  isFunction: boolean;
  isStatic: boolean;
  implementation?: string;
}

// Class Event
export interface ClassEvent {
  id: string;
  name: string;
  parameters: ClassParameter[];
  description: string;
}

// Class Field
export interface ClassField {
  id: string;
  name: string;
  dataType: VB6DataType;
  customType?: string;
  accessModifier: AccessModifier;
  defaultValue?: string;
  description: string;
  isConstant: boolean;
  withEvents: boolean;
}

// Class Interface
export interface ClassInterface {
  name: string;
  description: string;
  methods: ClassMethod[];
  properties: ClassProperty[];
  events: ClassEvent[];
}

// Class Definition
export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  baseClass?: string;
  interfaces: string[];
  threadingModel: ThreadingModel;
  classType: 'Class' | 'ActiveX Control' | 'ActiveX DLL' | 'ActiveX EXE';
  properties: ClassProperty[];
  methods: ClassMethod[];
  events: ClassEvent[];
  fields: ClassField[];
  constructorCode?: string;
  destructorCode?: string;
  isCreatable: boolean;
  isPublic: boolean;
  version: string;
  author: string;
  created: Date;
  lastModified: Date;
}

// Class Builder Props
interface ClassBuilderUtilityProps {
  projectPath: string;
  onClassGenerated?: (classDefinition: ClassDefinition, code: string) => void;
  onClose?: () => void;
}

export const ClassBuilderUtility: React.FC<ClassBuilderUtilityProps> = ({
  projectPath,
  onClassGenerated,
  onClose,
}) => {
  const [classes, setClasses] = useState<ClassDefinition[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<
    'properties' | 'methods' | 'events' | 'fields' | 'interfaces' | 'code'
  >('properties');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState<MemberType>(MemberType.Property);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const eventEmitter = useRef(new EventEmitter());

  // Sample interfaces for demonstration
  const availableInterfaces: ClassInterface[] = [
    {
      name: 'IUnknown',
      description: 'Base COM interface',
      methods: [
        {
          id: 'iunknown_queryinterface',
          name: 'QueryInterface',
          accessModifier: AccessModifier.Public,
          returnType: VB6DataType.Long,
          parameters: [
            {
              name: 'riid',
              dataType: VB6DataType.String,
              passing: ParameterPassing.ByRef,
              description: 'Interface ID',
            },
            {
              name: 'ppvObj',
              dataType: VB6DataType.Object,
              passing: ParameterPassing.ByRef,
              description: 'Object pointer',
            },
          ],
          description: 'Query for interface support',
          isFunction: true,
          isStatic: false,
        },
      ],
      properties: [],
      events: [],
    },
    {
      name: 'IDispatch',
      description: 'Automation interface',
      methods: [
        {
          id: 'idispatch_invoke',
          name: 'Invoke',
          accessModifier: AccessModifier.Public,
          returnType: VB6DataType.Long,
          parameters: [
            {
              name: 'dispIdMember',
              dataType: VB6DataType.Long,
              passing: ParameterPassing.ByVal,
              description: 'Member ID',
            },
            {
              name: 'riid',
              dataType: VB6DataType.String,
              passing: ParameterPassing.ByRef,
              description: 'Interface ID',
            },
          ],
          description: 'Invoke method or property',
          isFunction: true,
          isStatic: false,
        },
      ],
      properties: [],
      events: [],
    },
  ];

  // Create new class
  const createNewClass = useCallback(
    (name: string, classType: ClassDefinition['classType'] = 'Class') => {
      const newClass: ClassDefinition = {
        id: `class_${Date.now()}`,
        name,
        description: `${name} class`,
        interfaces: [],
        threadingModel: ThreadingModel.Apartment,
        classType,
        properties: [],
        methods: [],
        events: [],
        fields: [],
        isCreatable: true,
        isPublic: true,
        version: '1.0',
        author: 'Class Builder',
        created: new Date(),
        lastModified: new Date(),
      };

      setClasses(prev => [...prev, newClass]);
      setSelectedClass(newClass);
      setIsModified(true);
      eventEmitter.current.emit('classCreated', newClass);
    },
    []
  );

  // Add property to class
  const addProperty = useCallback(
    (property: Omit<ClassProperty, 'id'>) => {
      if (!selectedClass) return;

      const newProperty: ClassProperty = {
        ...property,
        id: `prop_${Date.now()}`,
      };

      const updatedClass = {
        ...selectedClass,
        properties: [...selectedClass.properties, newProperty],
        lastModified: new Date(),
      };

      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => (c.id === selectedClass.id ? updatedClass : c)));
      setIsModified(true);
      eventEmitter.current.emit('propertyAdded', { class: updatedClass, property: newProperty });
    },
    [selectedClass]
  );

  // Add method to class
  const addMethod = useCallback(
    (method: Omit<ClassMethod, 'id'>) => {
      if (!selectedClass) return;

      const newMethod: ClassMethod = {
        ...method,
        id: `method_${Date.now()}`,
      };

      const updatedClass = {
        ...selectedClass,
        methods: [...selectedClass.methods, newMethod],
        lastModified: new Date(),
      };

      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => (c.id === selectedClass.id ? updatedClass : c)));
      setIsModified(true);
      eventEmitter.current.emit('methodAdded', { class: updatedClass, method: newMethod });
    },
    [selectedClass]
  );

  // Add event to class
  const addEvent = useCallback(
    (event: Omit<ClassEvent, 'id'>) => {
      if (!selectedClass) return;

      const newEvent: ClassEvent = {
        ...event,
        id: `event_${Date.now()}`,
      };

      const updatedClass = {
        ...selectedClass,
        events: [...selectedClass.events, newEvent],
        lastModified: new Date(),
      };

      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => (c.id === selectedClass.id ? updatedClass : c)));
      setIsModified(true);
      eventEmitter.current.emit('eventAdded', { class: updatedClass, event: newEvent });
    },
    [selectedClass]
  );

  // Add field to class
  const addField = useCallback(
    (field: Omit<ClassField, 'id'>) => {
      if (!selectedClass) return;

      const newField: ClassField = {
        ...field,
        id: `field_${Date.now()}`,
      };

      const updatedClass = {
        ...selectedClass,
        fields: [...selectedClass.fields, newField],
        lastModified: new Date(),
      };

      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => (c.id === selectedClass.id ? updatedClass : c)));
      setIsModified(true);
      eventEmitter.current.emit('fieldAdded', { class: updatedClass, field: newField });
    },
    [selectedClass]
  );

  // Generate VB6 class code
  const generateClassCode = useCallback(
    (classDefinition: ClassDefinition): string => {
      let code = '';

      // Class header comments
      code += `'===============================================================================\n`;
      code += `' Class: ${classDefinition.name}\n`;
      code += `' Description: ${classDefinition.description}\n`;
      code += `' Author: ${classDefinition.author}\n`;
      code += `' Version: ${classDefinition.version}\n`;
      code += `' Created: ${classDefinition.created.toLocaleDateString()}\n`;
      code += `' Modified: ${classDefinition.lastModified.toLocaleDateString()}\n`;
      code += `'===============================================================================\n\n`;

      // Class options
      code += `Option Explicit\n\n`;

      if (
        classDefinition.classType === 'ActiveX Control' ||
        classDefinition.classType === 'ActiveX DLL'
      ) {
        code += `Option Base 0\n`;
        code += `Option Compare Binary\n\n`;
      }

      // Implements statements
      if (classDefinition.interfaces.length > 0) {
        classDefinition.interfaces.forEach(interfaceName => {
          code += `Implements ${interfaceName}\n`;
        });
        code += '\n';
      }

      // Private fields
      if (classDefinition.fields.length > 0) {
        code += `'--- Private Fields ---\n`;
        classDefinition.fields.forEach(field => {
          if (field.accessModifier === AccessModifier.Private) {
            code += `${field.accessModifier} `;
            if (field.isConstant) code += 'Const ';
            code += `${field.name} As ${field.dataType === VB6DataType.Custom ? field.customType : field.dataType}`;
            if (field.defaultValue) {
              code += ` = ${field.defaultValue}`;
            }
            code += `  ' ${field.description}\n`;
          }
        });
        code += '\n';
      }

      // Property backing fields
      classDefinition.properties.forEach(prop => {
        if (prop.hasGet || prop.hasSet || prop.hasLet) {
          const fieldName = `m_${prop.name}`;
          code += `Private ${fieldName} As ${prop.dataType === VB6DataType.Custom ? prop.customType : prop.dataType}`;
          if (prop.defaultValue) {
            code += ` = ${prop.defaultValue}`;
          }
          code += `  ' Backing field for ${prop.name}\n`;
        }
      });

      if (classDefinition.properties.length > 0) code += '\n';

      // Events
      if (classDefinition.events.length > 0) {
        code += `'--- Events ---\n`;
        classDefinition.events.forEach(event => {
          code += `Public Event ${event.name}(`;
          code += event.parameters
            .map(
              p =>
                `${p.passing} ${p.name} As ${p.dataType === VB6DataType.Custom ? p.customType : p.dataType}`
            )
            .join(', ');
          code += `)  ' ${event.description}\n`;
        });
        code += '\n';
      }

      // Constructor (Class_Initialize)
      code += `'--- Constructor ---\n`;
      code += `Private Sub Class_Initialize()\n`;
      if (classDefinition.constructorCode) {
        code += `    ${classDefinition.constructorCode.replace(/\n/g, '\n    ')}\n`;
      } else {
        code += `    ' Initialize class members\n`;
      }
      code += `End Sub\n\n`;

      // Destructor (Class_Terminate)
      code += `'--- Destructor ---\n`;
      code += `Private Sub Class_Terminate()\n`;
      if (classDefinition.destructorCode) {
        code += `    ${classDefinition.destructorCode.replace(/\n/g, '\n    ')}\n`;
      } else {
        code += `    ' Clean up class members\n`;
      }
      code += `End Sub\n\n`;

      // Properties
      if (classDefinition.properties.length > 0) {
        code += `'--- Properties ---\n`;
        classDefinition.properties.forEach(prop => {
          const dataTypeStr =
            prop.dataType === VB6DataType.Custom ? prop.customType : prop.dataType;
          const fieldName = `m_${prop.name}`;

          // Property Get
          if (prop.hasGet) {
            code += `${prop.accessModifier} Property Get ${prop.name}() As ${dataTypeStr}\n`;
            if (prop.validation) {
              code += `    ' Validation: ${prop.validation}\n`;
            }
            if (prop.dataType === VB6DataType.Object) {
              code += `    Set ${prop.name} = ${fieldName}\n`;
            } else {
              code += `    ${prop.name} = ${fieldName}\n`;
            }
            code += `End Property\n\n`;
          }

          // Property Let
          if (prop.hasLet && prop.dataType !== VB6DataType.Object) {
            code += `${prop.accessModifier} Property Let ${prop.name}(ByVal vNewValue As ${dataTypeStr})\n`;
            if (prop.validation) {
              code += `    ' Validation: ${prop.validation}\n`;
              code += `    ' Add validation code here\n`;
            }
            code += `    ${fieldName} = vNewValue\n`;
            code += `End Property\n\n`;
          }

          // Property Set
          if (prop.hasSet && prop.dataType === VB6DataType.Object) {
            code += `${prop.accessModifier} Property Set ${prop.name}(ByVal vNewValue As ${dataTypeStr})\n`;
            if (prop.validation) {
              code += `    ' Validation: ${prop.validation}\n`;
              code += `    ' Add validation code here\n`;
            }
            code += `    Set ${fieldName} = vNewValue\n`;
            code += `End Property\n\n`;
          }
        });
      }

      // Methods
      if (classDefinition.methods.length > 0) {
        code += `'--- Methods ---\n`;
        classDefinition.methods.forEach(method => {
          const methodType = method.isFunction ? 'Function' : 'Sub';
          const returnTypeStr =
            method.isFunction && method.returnType
              ? ` As ${method.returnType === VB6DataType.Custom ? method.customReturnType : method.returnType}`
              : '';

          code += `${method.accessModifier} ${methodType} ${method.name}(`;
          code += method.parameters
            .map(
              p =>
                `${p.passing} ${p.name} As ${p.dataType === VB6DataType.Custom ? p.customType : p.dataType}${p.defaultValue ? ` = ${p.defaultValue}` : ''}`
            )
            .join(', ');
          code += `)${returnTypeStr}\n`;

          code += `    ' ${method.description}\n`;

          if (method.implementation) {
            code += `    ${method.implementation.replace(/\n/g, '\n    ')}\n`;
          } else {
            code += `    ' TODO: Implement ${method.name}\n`;
            if (method.isFunction) {
              const defaultReturn =
                method.returnType === VB6DataType.String
                  ? '""'
                  : method.returnType === VB6DataType.Boolean
                    ? 'False'
                    : method.returnType === VB6DataType.Object
                      ? 'Nothing'
                      : '0';
              code += `    ${method.name} = ${defaultReturn}\n`;
            }
          }

          code += `End ${methodType}\n\n`;
        });
      }

      // Interface implementations
      classDefinition.interfaces.forEach(interfaceName => {
        const interfaceImpl = availableInterfaces.find(i => i.name === interfaceName);
        if (interfaceImpl) {
          code += `'--- ${interfaceName} Implementation ---\n`;
          interfaceImpl.methods.forEach(method => {
            const methodType = method.isFunction ? 'Function' : 'Sub';
            const returnTypeStr =
              method.isFunction && method.returnType
                ? ` As ${method.returnType === VB6DataType.Custom ? method.customReturnType : method.returnType}`
                : '';

            code += `Private ${methodType} ${interfaceName}_${method.name}(`;
            code += method.parameters
              .map(
                p =>
                  `${p.passing} ${p.name} As ${p.dataType === VB6DataType.Custom ? p.customType : p.dataType}`
              )
              .join(', ');
            code += `)${returnTypeStr}\n`;

            code += `    ' ${method.description}\n`;
            code += `    ' TODO: Implement ${interfaceName}.${method.name}\n`;

            if (method.isFunction) {
              const defaultReturn =
                method.returnType === VB6DataType.String
                  ? '""'
                  : method.returnType === VB6DataType.Boolean
                    ? 'False'
                    : method.returnType === VB6DataType.Object
                      ? 'Nothing'
                      : '0';
              code += `    ${interfaceName}_${method.name} = ${defaultReturn}\n`;
            }

            code += `End ${methodType}\n\n`;
          });
        }
      });

      return code;
    },
    [availableInterfaces]
  );

  // Validate class definition
  const validateClass = useCallback((classDefinition: ClassDefinition): string[] => {
    const errors: string[] = [];

    // Check class name
    if (!classDefinition.name || classDefinition.name.trim() === '') {
      errors.push('Class name is required');
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(classDefinition.name)) {
      errors.push(
        'Class name must start with a letter and contain only letters, numbers, and underscores'
      );
    }

    // Check for duplicate property names
    const propertyNames = new Set<string>();
    classDefinition.properties.forEach(prop => {
      if (propertyNames.has(prop.name)) {
        errors.push(`Duplicate property name: ${prop.name}`);
      }
      propertyNames.add(prop.name);
    });

    // Check for duplicate method names
    const methodNames = new Set<string>();
    classDefinition.methods.forEach(method => {
      if (methodNames.has(method.name)) {
        errors.push(`Duplicate method name: ${method.name}`);
      }
      methodNames.add(method.name);
    });

    // Check for invalid property/method names
    const reservedWords = [
      'Class',
      'Sub',
      'Function',
      'Property',
      'Event',
      'End',
      'If',
      'Then',
      'Else',
    ];
    [...classDefinition.properties, ...classDefinition.methods].forEach(member => {
      if (reservedWords.includes(member.name)) {
        errors.push(`'${member.name}' is a reserved word and cannot be used as a member name`);
      }
    });

    return errors;
  }, []);

  // Generate and preview code
  const previewCode = useCallback(() => {
    if (!selectedClass) return;

    const errors = validateClass(selectedClass);
    setValidationErrors(errors);

    if (errors.length === 0) {
      const code = generateClassCode(selectedClass);
      setGeneratedCode(code);
      setShowPreview(true);
    }
  }, [selectedClass, validateClass, generateClassCode]);

  // Export class code
  const exportClass = useCallback(() => {
    if (!selectedClass) return;

    const code = generateClassCode(selectedClass);
    onClassGenerated?.(selectedClass, code);

    // Also create downloadable file
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedClass.name}.cls`;
    link.click();
    URL.revokeObjectURL(url);

    eventEmitter.current.emit('classExported', { class: selectedClass, code });
  }, [selectedClass, generateClassCode, onClassGenerated]);

  // Remove member from class
  const removeMember = useCallback(
    (type: MemberType, id: string) => {
      if (!selectedClass) return;

      const updatedClass = { ...selectedClass };

      switch (type) {
        case MemberType.Property:
          updatedClass.properties = updatedClass.properties.filter(p => p.id !== id);
          break;
        case MemberType.Method:
          updatedClass.methods = updatedClass.methods.filter(m => m.id !== id);
          break;
        case MemberType.Event:
          updatedClass.events = updatedClass.events.filter(e => e.id !== id);
          break;
        case MemberType.Field:
          updatedClass.fields = updatedClass.fields.filter(f => f.id !== id);
          break;
      }

      updatedClass.lastModified = new Date();
      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => (c.id === selectedClass.id ? updatedClass : c)));
      setIsModified(true);
    },
    [selectedClass]
  );

  // Initialize with sample class
  useEffect(() => {
    if (classes.length === 0) {
      createNewClass('SampleClass');
    }
  }, [classes.length, createNewClass]);

  const renderClassList = () => (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700">Classes</h3>
        <button
          onClick={() => {
            const name = prompt('Enter class name:');
            if (name) createNewClass(name);
          }}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          New Class
        </button>
      </div>

      <div className="space-y-2">
        {classes.map(cls => (
          <div
            key={cls.id}
            onClick={() => setSelectedClass(cls)}
            className={`p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 ${
              selectedClass?.id === cls.id ? 'bg-blue-50 border-blue-500' : ''
            }`}
          >
            <div className="font-medium text-sm">{cls.name}</div>
            <div className="text-xs text-gray-600 mt-1">{cls.description}</div>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span>{cls.properties.length} props</span>
              <span>{cls.methods.length} methods</span>
              <span>{cls.events.length} events</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAddMemberDialog = () => {
    if (!showAddDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Add {addDialogType}</h2>

          {addDialogType === MemberType.Property && (
            <PropertyForm
              onAdd={property => {
                addProperty(property);
                setShowAddDialog(false);
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          )}

          {addDialogType === MemberType.Method && (
            <MethodForm
              onAdd={method => {
                addMethod(method);
                setShowAddDialog(false);
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          )}

          {addDialogType === MemberType.Event && (
            <EventForm
              onAdd={event => {
                addEvent(event);
                setShowAddDialog(false);
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          )}

          {addDialogType === MemberType.Field && (
            <FieldForm
              onAdd={field => {
                addField(field);
                setShowAddDialog(false);
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          )}
        </div>
      </div>
    );
  };

  const renderMemberList = (type: MemberType) => {
    if (!selectedClass) return null;

    const members =
      type === MemberType.Property
        ? selectedClass.properties
        : type === MemberType.Method
          ? selectedClass.methods
          : type === MemberType.Event
            ? selectedClass.events
            : type === MemberType.Field
              ? selectedClass.fields
              : [];

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-700">{type}s</h4>
          <button
            onClick={() => {
              setAddDialogType(type);
              setShowAddDialog(true);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add {type}
          </button>
        </div>

        <div className="space-y-2">
          {members.map((member: any) => (
            <div key={member.id} className="p-3 border border-gray-200 rounded hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{member.name}</span>
                    {'accessModifier' in member && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {member.accessModifier}
                      </span>
                    )}
                    {'dataType' in member && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {member.dataType === VB6DataType.Custom
                          ? member.customType
                          : member.dataType}
                      </span>
                    )}
                    {'returnType' in member && member.returnType && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        →{' '}
                        {member.returnType === VB6DataType.Custom
                          ? member.customReturnType
                          : member.returnType}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{member.description}</div>
                  {'parameters' in member && member.parameters.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Parameters: {member.parameters.map((p: ClassParameter) => p.name).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeMember(type, member.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No {type.toLowerCase()}s defined</p>
              <p className="text-xs mt-1">Click "Add {type}" to create one</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!selectedClass) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Class Builder Utility</h1>
        </div>
        <div className="flex-1">{renderClassList()}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Class Builder Utility</h1>
            <p className="text-sm text-gray-600">Building: {selectedClass.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedClass(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back to List
            </button>
            <button
              onClick={previewCode}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Preview Code
            </button>
            <button
              onClick={exportClass}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Class
            </button>
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <h3 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Class Properties */}
        <div className="w-1/3 border-r border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700">Class Properties</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  value={selectedClass.name}
                  onChange={e => {
                    const updatedClass = {
                      ...selectedClass,
                      name: e.target.value,
                      lastModified: new Date(),
                    };
                    setSelectedClass(updatedClass);
                    setClasses(prev =>
                      prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                    );
                    setIsModified(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedClass.description}
                  onChange={e => {
                    const updatedClass = {
                      ...selectedClass,
                      description: e.target.value,
                      lastModified: new Date(),
                    };
                    setSelectedClass(updatedClass);
                    setClasses(prev =>
                      prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                    );
                    setIsModified(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                <select
                  value={selectedClass.classType}
                  onChange={e => {
                    const updatedClass = {
                      ...selectedClass,
                      classType: e.target.value as ClassDefinition['classType'],
                      lastModified: new Date(),
                    };
                    setSelectedClass(updatedClass);
                    setClasses(prev =>
                      prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                    );
                    setIsModified(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="Class">Class</option>
                  <option value="ActiveX Control">ActiveX Control</option>
                  <option value="ActiveX DLL">ActiveX DLL</option>
                  <option value="ActiveX EXE">ActiveX EXE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threading Model
                </label>
                <select
                  value={selectedClass.threadingModel}
                  onChange={e => {
                    const updatedClass = {
                      ...selectedClass,
                      threadingModel: e.target.value as ThreadingModel,
                      lastModified: new Date(),
                    };
                    setSelectedClass(updatedClass);
                    setClasses(prev =>
                      prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                    );
                    setIsModified(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {Object.values(ThreadingModel).map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClass.isCreatable}
                    onChange={e => {
                      const updatedClass = {
                        ...selectedClass,
                        isCreatable: e.target.checked,
                        lastModified: new Date(),
                      };
                      setSelectedClass(updatedClass);
                      setClasses(prev =>
                        prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                      );
                      setIsModified(true);
                    }}
                  />
                  <span className="text-sm">Creatable</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClass.isPublic}
                    onChange={e => {
                      const updatedClass = {
                        ...selectedClass,
                        isPublic: e.target.checked,
                        lastModified: new Date(),
                      };
                      setSelectedClass(updatedClass);
                      setClasses(prev =>
                        prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                      );
                      setIsModified(true);
                    }}
                  />
                  <span className="text-sm">Public</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={selectedClass.version}
                  onChange={e => {
                    const updatedClass = {
                      ...selectedClass,
                      version: e.target.value,
                      lastModified: new Date(),
                    };
                    setSelectedClass(updatedClass);
                    setClasses(prev =>
                      prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                    );
                    setIsModified(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Members */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {['properties', 'methods', 'events', 'fields', 'interfaces', 'code'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'properties' && renderMemberList(MemberType.Property)}
            {activeTab === 'methods' && renderMemberList(MemberType.Method)}
            {activeTab === 'events' && renderMemberList(MemberType.Event)}
            {activeTab === 'fields' && renderMemberList(MemberType.Field)}

            {activeTab === 'interfaces' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700">Interfaces</h4>
                </div>
                <div className="space-y-2">
                  {availableInterfaces.map(intf => (
                    <label
                      key={intf.name}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClass.interfaces.includes(intf.name)}
                        onChange={e => {
                          const interfaces = e.target.checked
                            ? [...selectedClass.interfaces, intf.name]
                            : selectedClass.interfaces.filter(i => i !== intf.name);
                          const updatedClass = {
                            ...selectedClass,
                            interfaces,
                            lastModified: new Date(),
                          };
                          setSelectedClass(updatedClass);
                          setClasses(prev =>
                            prev.map(c => (c.id === selectedClass.id ? updatedClass : c))
                          );
                          setIsModified(true);
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm">{intf.name}</div>
                        <div className="text-xs text-gray-600">{intf.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Generated Code Preview</h4>
                  <button
                    onClick={previewCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
                  >
                    Generate Code
                  </button>
                </div>

                {generatedCode && (
                  <pre className="bg-gray-50 border border-gray-300 rounded p-4 text-xs font-mono overflow-auto h-96">
                    {generatedCode}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {renderAddMemberDialog()}

      {/* Code Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90vw] h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Generated Code: {selectedClass.name}.cls</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-gray-300 rounded">
              <pre className="p-4 text-sm font-mono bg-gray-50 h-full">{generatedCode}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>
            Class: {selectedClass.name} • Type: {selectedClass.classType} •
            {selectedClass.properties.length} properties, {selectedClass.methods.length} methods,{' '}
            {selectedClass.events.length} events
          </span>
          <span>{isModified ? 'Modified' : 'Saved'}</span>
        </div>
      </div>
    </div>
  );
};

// Property Form Component
const PropertyForm: React.FC<{
  onAdd: (property: Omit<ClassProperty, 'id'>) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [property, setProperty] = useState<Omit<ClassProperty, 'id'>>({
    name: '',
    dataType: VB6DataType.String,
    accessModifier: AccessModifier.Public,
    hasGet: true,
    hasSet: false,
    hasLet: true,
    description: '',
    readOnly: false,
    withEvents: false,
    array: false,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={property.name}
            onChange={e => setProperty({ ...property, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
          <select
            value={property.dataType}
            onChange={e => setProperty({ ...property, dataType: e.target.value as VB6DataType })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {Object.values(VB6DataType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={property.description}
          onChange={e => setProperty({ ...property, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={property.hasGet}
            onChange={e => setProperty({ ...property, hasGet: e.target.checked })}
          />
          <span className="text-sm">Property Get</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={property.hasLet}
            onChange={e => setProperty({ ...property, hasLet: e.target.checked })}
          />
          <span className="text-sm">Property Let</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={property.hasSet}
            onChange={e => setProperty({ ...property, hasSet: e.target.checked })}
          />
          <span className="text-sm">Property Set</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          onClick={() => onAdd(property)}
          disabled={!property.name}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add Property
        </button>
      </div>
    </div>
  );
};

// Method Form Component
const MethodForm: React.FC<{
  onAdd: (method: Omit<ClassMethod, 'id'>) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [method, setMethod] = useState<Omit<ClassMethod, 'id'>>({
    name: '',
    accessModifier: AccessModifier.Public,
    parameters: [],
    description: '',
    isFunction: false,
    isStatic: false,
  });

  const addParameter = () => {
    setMethod({
      ...method,
      parameters: [
        ...method.parameters,
        {
          name: '',
          dataType: VB6DataType.String,
          passing: ParameterPassing.ByVal,
          description: '',
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={method.name}
            onChange={e => setMethod({ ...method, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Access</label>
          <select
            value={method.accessModifier}
            onChange={e =>
              setMethod({ ...method, accessModifier: e.target.value as AccessModifier })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {Object.values(AccessModifier).map(access => (
              <option key={access} value={access}>
                {access}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={method.description}
          onChange={e => setMethod({ ...method, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={2}
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={method.isFunction}
            onChange={e => setMethod({ ...method, isFunction: e.target.checked })}
          />
          <span className="text-sm">Function (returns value)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={method.isStatic}
            onChange={e => setMethod({ ...method, isStatic: e.target.checked })}
          />
          <span className="text-sm">Static</span>
        </label>
      </div>

      {method.isFunction && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
          <select
            value={method.returnType || VB6DataType.String}
            onChange={e => setMethod({ ...method, returnType: e.target.value as VB6DataType })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {Object.values(VB6DataType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Parameters</label>
          <button
            onClick={addParameter}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Add Parameter
          </button>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {method.parameters.map((param, index) => (
            <div key={index} className="grid grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={param.name}
                onChange={e => {
                  const newParams = [...method.parameters];
                  newParams[index].name = e.target.value;
                  setMethod({ ...method, parameters: newParams });
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              />

              <select
                value={param.dataType}
                onChange={e => {
                  const newParams = [...method.parameters];
                  newParams[index].dataType = e.target.value as VB6DataType;
                  setMethod({ ...method, parameters: newParams });
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {Object.values(VB6DataType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={param.passing}
                onChange={e => {
                  const newParams = [...method.parameters];
                  newParams[index].passing = e.target.value as ParameterPassing;
                  setMethod({ ...method, parameters: newParams });
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {Object.values(ParameterPassing).map(passing => (
                  <option key={passing} value={passing}>
                    {passing}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const newParams = method.parameters.filter((_, i) => i !== index);
                  setMethod({ ...method, parameters: newParams });
                }}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          onClick={() => onAdd(method)}
          disabled={!method.name}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add Method
        </button>
      </div>
    </div>
  );
};

// Event Form Component
const EventForm: React.FC<{
  onAdd: (event: Omit<ClassEvent, 'id'>) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [event, setEvent] = useState<Omit<ClassEvent, 'id'>>({
    name: '',
    parameters: [],
    description: '',
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
        <input
          type="text"
          value={event.name}
          onChange={e => setEvent({ ...event, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={event.description}
          onChange={e => setEvent({ ...event, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          onClick={() => onAdd(event)}
          disabled={!event.name}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add Event
        </button>
      </div>
    </div>
  );
};

// Field Form Component
const FieldForm: React.FC<{
  onAdd: (field: Omit<ClassField, 'id'>) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [field, setField] = useState<Omit<ClassField, 'id'>>({
    name: '',
    dataType: VB6DataType.String,
    accessModifier: AccessModifier.Private,
    description: '',
    isConstant: false,
    withEvents: false,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={field.name}
            onChange={e => setField({ ...field, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
          <select
            value={field.dataType}
            onChange={e => setField({ ...field, dataType: e.target.value as VB6DataType })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {Object.values(VB6DataType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={field.description}
          onChange={e => setField({ ...field, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={2}
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.isConstant}
            onChange={e => setField({ ...field, isConstant: e.target.checked })}
          />
          <span className="text-sm">Constant</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.withEvents}
            onChange={e => setField({ ...field, withEvents: e.target.checked })}
          />
          <span className="text-sm">WithEvents</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          onClick={() => onAdd(field)}
          disabled={!field.name}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Add Field
        </button>
      </div>
    </div>
  );
};

export default ClassBuilderUtility;
