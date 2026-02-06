import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EventEmitter } from 'events';

// COM Component Types
export enum COMComponentType {
  InProcessServer = 'In-Process Server (DLL)',
  OutOfProcessServer = 'Out-of-Process Server (EXE)',
  LocalServer = 'Local Server',
  RemoteServer = 'Remote Server',
  Control = 'ActiveX Control',
  Document = 'ActiveX Document',
  PropertyPage = 'Property Page',
}

export enum InterfaceType {
  Custom = 'Custom Interface',
  Dual = 'Dual Interface',
  Dispatch = 'Dispatch Interface',
  Event = 'Event Interface',
}

export enum ThreadingModel {
  Apartment = 'Apartment',
  Free = 'Free',
  Both = 'Both',
  Neutral = 'Neutral',
}

// Method Parameter
export interface COMMethodParameter {
  id: string;
  name: string;
  type: string;
  direction: 'in' | 'out' | 'in_out' | 'retval';
  optional: boolean;
  defaultValue?: string;
  description: string;
}

// COM Method
export interface COMMethod {
  id: string;
  name: string;
  returnType: string;
  parameters: COMMethodParameter[];
  description: string;
  helpContext?: number;
  dispId?: number;
  attributes: string[];
  isProperty: boolean;
  propertyType?: 'get' | 'put' | 'putref';
}

// COM Property
export interface COMProperty {
  id: string;
  name: string;
  type: string;
  readonly: boolean;
  description: string;
  defaultValue?: string;
  dispId?: number;
  helpContext?: number;
  attributes: string[];
}

// COM Event
export interface COMEvent {
  id: string;
  name: string;
  parameters: COMMethodParameter[];
  description: string;
  helpContext?: number;
  dispId?: number;
}

// COM Interface
export interface COMInterface {
  id: string;
  name: string;
  type: InterfaceType;
  description: string;
  guid: string;
  baseInterface: string;
  methods: COMMethod[];
  properties: COMProperty[];
  events: COMEvent[];
  helpString?: string;
  helpFile?: string;
  helpContext?: number;
  version: {
    major: number;
    minor: number;
  };
  attributes: string[];
}

// COM Component
export interface COMComponent {
  id: string;
  name: string;
  progId: string;
  description: string;
  type: COMComponentType;
  threadingModel: ThreadingModel;
  guid: string;
  typeLibGuid: string;
  interfaces: COMInterface[];
  properties: COMProperty[];
  registration: {
    description: string;
    version: string;
    company: string;
    filename: string;
    helpFile?: string;
    icon?: string;
  };
  files: {
    interface: string;
    implementation: string;
    idl: string;
    typelib: string;
    registration: string;
  };
}

// Wizard Steps
enum WizardStep {
  ComponentType = 0,
  ComponentInfo = 1,
  Interfaces = 2,
  Methods = 3,
  Properties = 4,
  Events = 5,
  Options = 6,
  Files = 7,
  Summary = 8,
}

interface COMInterfaceWizardProps {
  onComplete?: (component: COMComponent) => void;
  onCancel?: () => void;
  onPreview?: (code: string, filename: string) => void;
}

export const COMInterfaceWizard: React.FC<COMInterfaceWizardProps> = ({
  onComplete,
  onCancel,
  onPreview,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.ComponentType);
  const [component, setComponent] = useState<Partial<COMComponent>>({
    type: COMComponentType.InProcessServer,
    threadingModel: ThreadingModel.Apartment,
    interfaces: [],
    properties: [],
    registration: {
      description: '',
      version: '1.0',
      company: '',
      filename: '',
    },
    files: {
      interface: '',
      implementation: '',
      idl: '',
      typelib: '',
      registration: '',
    },
  });
  const [selectedInterface, setSelectedInterface] = useState<COMInterface | null>(null);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [methodForm, setMethodForm] = useState<Partial<COMMethod>>({
    returnType: 'HRESULT',
    parameters: [],
    attributes: [],
    isProperty: false,
  });
  const [propertyForm, setPropertyForm] = useState<Partial<COMProperty>>({
    type: 'VARIANT',
    readonly: false,
    attributes: [],
  });
  const [eventForm, setEventForm] = useState<Partial<COMEvent>>({
    parameters: [],
  });
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});

  const eventEmitter = useRef(new EventEmitter());
  const nextId = useRef(1);

  // Generate unique ID
  const generateId = useCallback(() => `item_${nextId.current++}`, []);

  // Generate GUID
  const generateGUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16).toUpperCase();
    });
  }, []);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (currentStep < WizardStep.Summary) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > WizardStep.ComponentType) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case WizardStep.ComponentType:
        return !!component.type;
      case WizardStep.ComponentInfo:
        return !!(component.name && component.progId && component.description);
      case WizardStep.Interfaces:
        return (component.interfaces && component.interfaces.length > 0) || false;
      default:
        return true;
    }
  }, [currentStep, component]);

  // Add interface
  const addInterface = useCallback(() => {
    const newInterface: COMInterface = {
      id: generateId(),
      name: 'INewInterface',
      type: InterfaceType.Dual,
      description: 'New COM Interface',
      guid: generateGUID(),
      baseInterface: 'IDispatch',
      methods: [],
      properties: [],
      events: [],
      version: { major: 1, minor: 0 },
      attributes: ['oleautomation', 'dual'],
    };

    setComponent(prev => ({
      ...prev,
      interfaces: [...(prev.interfaces || []), newInterface],
    }));

    setSelectedInterface(newInterface);
  }, [generateId, generateGUID]);

  // Add method to interface
  const addMethod = useCallback(() => {
    if (!methodForm.name || !selectedInterface) return;

    const newMethod: COMMethod = {
      id: generateId(),
      name: methodForm.name,
      returnType: methodForm.returnType || 'HRESULT',
      parameters: methodForm.parameters || [],
      description: methodForm.description || '',
      helpContext: methodForm.helpContext,
      dispId: methodForm.dispId,
      attributes: methodForm.attributes || [],
      isProperty: methodForm.isProperty || false,
      propertyType: methodForm.propertyType,
    };

    setComponent(prev => ({
      ...prev,
      interfaces: prev.interfaces?.map(iface =>
        iface.id === selectedInterface.id
          ? { ...iface, methods: [...iface.methods, newMethod] }
          : iface
      ),
    }));

    setMethodForm({
      returnType: 'HRESULT',
      parameters: [],
      attributes: [],
      isProperty: false,
    });
    setShowMethodDialog(false);
  }, [methodForm, selectedInterface, generateId]);

  // Add property to interface
  const addProperty = useCallback(() => {
    if (!propertyForm.name || !selectedInterface) return;

    const newProperty: COMProperty = {
      id: generateId(),
      name: propertyForm.name,
      type: propertyForm.type || 'VARIANT',
      readonly: propertyForm.readonly || false,
      description: propertyForm.description || '',
      defaultValue: propertyForm.defaultValue,
      dispId: propertyForm.dispId,
      helpContext: propertyForm.helpContext,
      attributes: propertyForm.attributes || [],
    };

    setComponent(prev => ({
      ...prev,
      interfaces: prev.interfaces?.map(iface =>
        iface.id === selectedInterface.id
          ? { ...iface, properties: [...iface.properties, newProperty] }
          : iface
      ),
    }));

    setPropertyForm({
      type: 'VARIANT',
      readonly: false,
      attributes: [],
    });
    setShowPropertyDialog(false);
  }, [propertyForm, selectedInterface, generateId]);

  // Generate files
  const generateFiles = useCallback(() => {
    if (!component.name) return {};

    const files: Record<string, string> = {};

    // Generate IDL file
    files.idl = generateIDL();

    // Generate VB6 interface file
    files.interface = generateVB6Interface();

    // Generate VB6 implementation file
    files.implementation = generateVB6Implementation();

    // Generate registration file
    files.registration = generateRegistration();

    setGeneratedFiles(files);
    return files;
  }, [component]);

  // Generate IDL
  const generateIDL = useCallback((): string => {
    let idl = `// ${component.name} Interface Definition\n`;
    idl += `// Generated by VB6 COM Interface Wizard\n\n`;
    idl += `import "oaidl.idl";\nimport "ocidl.idl";\n\n`;

    // Type library
    idl += `[\n`;
    idl += `    uuid(${component.typeLibGuid || generateGUID()}),\n`;
    idl += `    version(1.0),\n`;
    idl += `    helpstring("${component.description}")\n`;
    idl += `]\n`;
    idl += `library ${component.name}Lib\n`;
    idl += `{\n`;
    idl += `    importlib("stdole2.tlb");\n\n`;

    // Generate interfaces
    component.interfaces?.forEach(iface => {
      idl += `    [\n`;
      idl += `        object,\n`;
      idl += `        uuid(${iface.guid}),\n`;
      if (iface.type === InterfaceType.Dual) {
        idl += `        dual,\n`;
        idl += `        oleautomation,\n`;
      }
      idl += `        helpstring("${iface.description}")\n`;
      idl += `    ]\n`;
      idl += `    interface ${iface.name} : ${iface.baseInterface}\n`;
      idl += `    {\n`;

      // Methods
      iface.methods.forEach(method => {
        const params = method.parameters
          .map(p => `[${p.direction}] ${p.type} ${p.name}`)
          .join(', ');
        idl += `        HRESULT ${method.name}(${params});\n`;
      });

      // Properties
      iface.properties.forEach(prop => {
        if (!prop.readonly) {
          idl += `        [propget] HRESULT ${prop.name}([out, retval] ${prop.type}* value);\n`;
        }
        idl += `        [propput] HRESULT ${prop.name}([in] ${prop.type} value);\n`;
      });

      idl += `    };\n\n`;
    });

    // CoClass
    idl += `    [\n`;
    idl += `        uuid(${component.guid || generateGUID()}),\n`;
    idl += `        helpstring("${component.description}")\n`;
    idl += `    ]\n`;
    idl += `    coclass ${component.name}\n`;
    idl += `    {\n`;
    component.interfaces?.forEach(iface => {
      idl += `        [default] interface ${iface.name};\n`;
    });
    idl += `    };\n`;

    idl += `};\n`;

    return idl;
  }, [component, generateGUID]);

  // Generate VB6 Interface
  const generateVB6Interface = useCallback((): string => {
    let vb6 = `' ${component.name} Interface Declarations\n`;
    vb6 += `' Generated by VB6 COM Interface Wizard\n\n`;
    vb6 += `Option Explicit\n\n`;

    // Interface constants
    component.interfaces?.forEach(iface => {
      vb6 += `' Interface: ${iface.name}\n`;
      vb6 += `' GUID: ${iface.guid}\n`;
      vb6 += `Public Const IID_${iface.name} = "${iface.guid}"\n\n`;

      // Methods
      if (iface.methods.length > 0) {
        vb6 += `' Methods\n`;
        iface.methods.forEach(method => {
          const params = method.parameters
            .filter(p => p.direction !== 'retval')
            .map(p => {
              const direction = p.direction === 'out' ? 'ByRef' : 'ByVal';
              const optional = p.optional ? 'Optional ' : '';
              return `${optional}${direction} ${p.name} As ${getVB6Type(p.type)}`;
            })
            .join(', ');

          const returnParam = method.parameters.find(p => p.direction === 'retval');
          const returnType = returnParam ? ` As ${getVB6Type(returnParam.type)}` : '';

          vb6 += `Public Function ${method.name}(${params})${returnType}\n`;
          vb6 += `    ' TODO: Implement ${method.name}\n`;
          if (method.description) {
            vb6 += `    ' ${method.description}\n`;
          }
          vb6 += `End Function\n\n`;
        });
      }

      // Properties
      if (iface.properties.length > 0) {
        vb6 += `' Properties\n`;
        iface.properties.forEach(prop => {
          if (!prop.readonly) {
            vb6 += `Public Property Get ${prop.name}() As ${getVB6Type(prop.type)}\n`;
            vb6 += `    ' TODO: Implement ${prop.name} getter\n`;
            if (prop.description) {
              vb6 += `    ' ${prop.description}\n`;
            }
            vb6 += `End Property\n\n`;
          }

          vb6 += `Public Property Let ${prop.name}(ByVal value As ${getVB6Type(prop.type)})\n`;
          vb6 += `    ' TODO: Implement ${prop.name} setter\n`;
          if (prop.description) {
            vb6 += `    ' ${prop.description}\n`;
          }
          vb6 += `End Property\n\n`;
        });
      }
    });

    return vb6;
  }, [component]);

  // Generate VB6 Implementation
  const generateVB6Implementation = useCallback((): string => {
    let vb6 = `' ${component.name} Implementation\n`;
    vb6 += `' Generated by VB6 COM Interface Wizard\n\n`;
    vb6 += `Option Explicit\n\n`;

    // Class module header
    vb6 += `' Class: ${component.name}\n`;
    vb6 += `' Description: ${component.description}\n`;
    vb6 += `' ProgID: ${component.progId}\n`;
    vb6 += `' CLSID: ${component.guid}\n\n`;

    // Private variables
    vb6 += `' Private member variables\n`;
    component.interfaces?.forEach(iface => {
      iface.properties.forEach(prop => {
        vb6 += `Private m_${prop.name} As ${getVB6Type(prop.type)}\n`;
      });
    });
    vb6 += `\n`;

    // Class events
    vb6 += `' Class Events\n`;
    vb6 += `Private Sub Class_Initialize()\n`;
    vb6 += `    ' Initialize component\n`;
    component.interfaces?.forEach(iface => {
      iface.properties.forEach(prop => {
        if (prop.defaultValue) {
          vb6 += `    m_${prop.name} = ${prop.defaultValue}\n`;
        }
      });
    });
    vb6 += `End Sub\n\n`;

    vb6 += `Private Sub Class_Terminate()\n`;
    vb6 += `    ' Cleanup component\n`;
    vb6 += `End Sub\n\n`;

    // Interface implementations
    component.interfaces?.forEach(iface => {
      vb6 += `' ${iface.name} Implementation\n`;

      // Methods
      iface.methods.forEach(method => {
        const params = method.parameters
          .filter(p => p.direction !== 'retval')
          .map(p => {
            const direction = p.direction === 'out' ? 'ByRef' : 'ByVal';
            const optional = p.optional ? 'Optional ' : '';
            return `${optional}${direction} ${p.name} As ${getVB6Type(p.type)}`;
          })
          .join(', ');

        const returnParam = method.parameters.find(p => p.direction === 'retval');
        const returnType = returnParam ? ` As ${getVB6Type(returnParam.type)}` : '';

        vb6 += `Public Function ${method.name}(${params})${returnType}\n`;
        vb6 += `    ' Implementation for ${method.name}\n`;
        if (method.description) {
          vb6 += `    ' ${method.description}\n`;
        }
        vb6 += `    \n`;
        vb6 += `    ' TODO: Add your implementation here\n`;
        vb6 += `    \n`;
        if (returnParam) {
          vb6 += `    ' Return value\n`;
          vb6 += `    ${method.name} = ' TODO: Return appropriate value\n`;
        }
        vb6 += `End Function\n\n`;
      });

      // Properties
      iface.properties.forEach(prop => {
        // Getter
        if (!prop.readonly) {
          vb6 += `Public Property Get ${prop.name}() As ${getVB6Type(prop.type)}\n`;
          if (prop.description) {
            vb6 += `    ' ${prop.description}\n`;
          }
          vb6 += `    ${prop.name} = m_${prop.name}\n`;
          vb6 += `End Property\n\n`;
        }

        // Setter
        vb6 += `Public Property Let ${prop.name}(ByVal value As ${getVB6Type(prop.type)})\n`;
        if (prop.description) {
          vb6 += `    ' ${prop.description}\n`;
        }
        vb6 += `    m_${prop.name} = value\n`;
        vb6 += `End Property\n\n`;
      });
    });

    return vb6;
  }, [component]);

  // Generate Registration
  const generateRegistration = useCallback((): string => {
    let reg = `' Component Registration for ${component.name}\n`;
    reg += `' Generated by VB6 COM Interface Wizard\n\n`;
    reg += `Option Explicit\n\n`;

    reg += `' Registration constants\n`;
    reg += `Private Const CLSID_${component.name} = "${component.guid}"\n`;
    reg += `Private Const PROGID_${component.name} = "${component.progId}"\n`;
    reg += `Private Const DESCRIPTION_${component.name} = "${component.description}"\n\n`;

    reg += `' Register the component\n`;
    reg += `Public Sub RegisterServer()\n`;
    reg += `    Dim regKey As String\n`;
    reg += `    \n`;
    reg += `    ' Register CLSID\n`;
    reg += `    regKey = "HKEY_CLASSES_ROOT\\CLSID\\" & CLSID_${component.name}\n`;
    reg += `    CreateRegKey regKey, DESCRIPTION_${component.name}\n`;
    reg += `    CreateRegKey regKey & "\\InprocServer32", App.Path & "\\" & App.EXEName & ".dll"\n`;
    reg += `    CreateRegKey regKey & "\\InprocServer32", "ThreadingModel", "${component.threadingModel}"\n`;
    reg += `    CreateRegKey regKey & "\\ProgID", PROGID_${component.name}\n`;
    reg += `    CreateRegKey regKey & "\\TypeLib", "${component.typeLibGuid}"\n`;
    reg += `    CreateRegKey regKey & "\\Version", "${component.registration?.version}"\n`;
    reg += `    \n`;
    reg += `    ' Register ProgID\n`;
    reg += `    regKey = "HKEY_CLASSES_ROOT\\" & PROGID_${component.name}\n`;
    reg += `    CreateRegKey regKey, DESCRIPTION_${component.name}\n`;
    reg += `    CreateRegKey regKey & "\\CLSID", CLSID_${component.name}\n`;
    reg += `End Sub\n\n`;

    reg += `' Unregister the component\n`;
    reg += `Public Sub UnregisterServer()\n`;
    reg += `    Dim regKey As String\n`;
    reg += `    \n`;
    reg += `    ' Remove CLSID\n`;
    reg += `    regKey = "HKEY_CLASSES_ROOT\\CLSID\\" & CLSID_${component.name}\n`;
    reg += `    DeleteRegKey regKey\n`;
    reg += `    \n`;
    reg += `    ' Remove ProgID\n`;
    reg += `    regKey = "HKEY_CLASSES_ROOT\\" & PROGID_${component.name}\n`;
    reg += `    DeleteRegKey regKey\n`;
    reg += `End Sub\n\n`;

    reg += `' Helper functions\n`;
    reg += `Private Sub CreateRegKey(keyPath As String, value As String, Optional valueName As String = "")\n`;
    reg += `    ' TODO: Implement registry key creation\n`;
    reg += `End Sub\n\n`;

    reg += `Private Sub DeleteRegKey(keyPath As String)\n`;
    reg += `    ' TODO: Implement registry key deletion\n`;
    reg += `End Sub\n`;

    return reg;
  }, [component]);

  // Helper function for VB6 type conversion
  const getVB6Type = (comType: string): string => {
    const typeMap: Record<string, string> = {
      BSTR: 'String',
      VARIANT_BOOL: 'Boolean',
      short: 'Integer',
      long: 'Long',
      float: 'Single',
      double: 'Double',
      VARIANT: 'Variant',
      'IDispatch*': 'Object',
      'IUnknown*': 'Object',
      HRESULT: 'Long',
      void: 'void',
    };
    return typeMap[comType] || comType;
  };

  // Complete wizard
  const completeWizard = useCallback(() => {
    if (!component.name) return;

    const finalComponent: COMComponent = {
      id: generateId(),
      name: component.name,
      progId: component.progId || `${component.name}.Application`,
      description: component.description || '',
      type: component.type || COMComponentType.InProcessServer,
      threadingModel: component.threadingModel || ThreadingModel.Apartment,
      guid: component.guid || generateGUID(),
      typeLibGuid: component.typeLibGuid || generateGUID(),
      interfaces: component.interfaces || [],
      properties: component.properties || [],
      registration: component.registration || {
        description: component.description || '',
        version: '1.0',
        company: '',
        filename: `${component.name}.dll`,
      },
      files: {
        interface: `${component.name}Interface.bas`,
        implementation: `${component.name}.cls`,
        idl: `${component.name}.idl`,
        typelib: `${component.name}.tlb`,
        registration: `${component.name}Reg.bas`,
      },
    };

    // Generate all files
    const files = generateFiles();

    onComplete?.(finalComponent);
    eventEmitter.current.emit('wizardComplete', finalComponent, files);
  }, [component, generateId, generateGUID, generateFiles, onComplete]);

  // Generate files when needed
  useEffect(() => {
    if (currentStep === WizardStep.Files || currentStep === WizardStep.Summary) {
      generateFiles();
    }
  }, [currentStep, generateFiles]);

  const renderWizardStep = (): React.ReactNode => {
    switch (currentStep) {
      case WizardStep.ComponentType:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Component Type</h2>
            <p className="text-gray-600 mb-6">What type of COM component do you want to create?</p>

            <div className="space-y-4">
              {Object.values(COMComponentType).map(type => (
                <label
                  key={type}
                  className="flex items-start gap-3 p-4 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="componentType"
                    value={type}
                    checked={component.type === type}
                    onChange={e =>
                      setComponent(prev => ({ ...prev, type: e.target.value as COMComponentType }))
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{type}</div>
                    <div className="text-sm text-gray-600">
                      {type === COMComponentType.InProcessServer &&
                        'Creates a DLL that runs in the client process'}
                      {type === COMComponentType.OutOfProcessServer &&
                        'Creates an EXE that runs in its own process'}
                      {type === COMComponentType.Control &&
                        'Creates an ActiveX control for use in forms'}
                      {type === COMComponentType.Document &&
                        'Creates an ActiveX document for container applications'}
                      {type === COMComponentType.PropertyPage &&
                        'Creates a property page for ActiveX controls'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case WizardStep.ComponentInfo:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Component Information</h2>
            <p className="text-gray-600 mb-6">Enter basic information about your COM component:</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Name
                  </label>
                  <input
                    type="text"
                    value={component.name || ''}
                    onChange={e => setComponent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MyComponent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ProgID</label>
                  <input
                    type="text"
                    value={component.progId || ''}
                    onChange={e => setComponent(prev => ({ ...prev, progId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MyApp.MyComponent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={component.description || ''}
                  onChange={e => setComponent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter a description for your component"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Threading Model
                  </label>
                  <select
                    value={component.threadingModel}
                    onChange={e =>
                      setComponent(prev => ({
                        ...prev,
                        threadingModel: e.target.value as ThreadingModel,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(ThreadingModel).map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                  <input
                    type="text"
                    value={component.registration?.version || '1.0'}
                    onChange={e =>
                      setComponent(prev => ({
                        ...prev,
                        registration: { ...prev.registration, version: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1.0"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case WizardStep.Interfaces:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">COM Interfaces</h2>
            <p className="text-gray-600 mb-6">
              Define the interfaces that your component will implement:
            </p>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Interfaces ({component.interfaces?.length || 0})</h3>
              <button
                onClick={addInterface}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Interface
              </button>
            </div>

            <div className="space-y-4">
              {component.interfaces?.map(iface => (
                <div
                  key={iface.id}
                  className={`border border-gray-300 rounded p-4 cursor-pointer ${
                    selectedInterface?.id === iface.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedInterface(iface)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{iface.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {iface.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{iface.description}</p>
                  <div className="text-xs text-gray-500">
                    Methods: {iface.methods.length} | Properties: {iface.properties.length} |
                    Events: {iface.events.length}
                  </div>
                </div>
              ))}

              {(!component.interfaces || component.interfaces.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No interfaces defined yet.</p>
                  <p className="text-sm mt-1">
                    Click "Add Interface" to create your first interface.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case WizardStep.Methods:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Interface Methods</h2>
            {selectedInterface ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-gray-600">
                      Add methods to interface: <strong>{selectedInterface.name}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMethodDialog(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Add Method
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedInterface.methods.map(method => (
                    <div key={method.id} className="border border-gray-300 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{method.name}</span>
                        <span className="text-xs text-gray-500">{method.returnType}</span>
                      </div>
                      <p className="text-xs text-gray-600">{method.description}</p>
                      {method.parameters.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Parameters:{' '}
                          {method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedInterface.methods.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No methods defined yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select an interface from the previous step to add methods.</p>
              </div>
            )}
          </div>
        );

      case WizardStep.Summary:
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
            <p className="text-gray-600 mb-6">Review your COM component configuration:</p>

            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h3 className="font-medium mb-3">Component Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {component.name}
                  </div>
                  <div>
                    <strong>Type:</strong> {component.type}
                  </div>
                  <div>
                    <strong>ProgID:</strong> {component.progId}
                  </div>
                  <div>
                    <strong>Threading:</strong> {component.threadingModel}
                  </div>
                  <div>
                    <strong>Interfaces:</strong> {component.interfaces?.length || 0}
                  </div>
                  <div>
                    <strong>Version:</strong> {component.registration?.version}
                  </div>
                </div>
              </div>

              {component.interfaces && component.interfaces.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <h3 className="font-medium mb-3">Interfaces</h3>
                  {component.interfaces.map(iface => (
                    <div key={iface.id} className="mb-3 last:mb-0">
                      <div className="font-medium">
                        {iface.name} ({iface.type})
                      </div>
                      <div className="text-sm text-gray-600 ml-4">
                        Methods: {iface.methods.length} | Properties: {iface.properties.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h3 className="font-medium mb-3">Generated Files</h3>
                <div className="space-y-2 text-sm">
                  <div>• {component.files?.interface} - Interface declarations</div>
                  <div>• {component.files?.implementation} - Component implementation</div>
                  <div>• {component.files?.idl} - Interface Definition Language</div>
                  <div>• {component.files?.registration} - Registration code</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COM Interface Wizard</h1>
            <p className="text-sm text-gray-600 mt-1">Create COM components and interfaces</p>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          {Array.from({ length: Object.keys(WizardStep).length / 2 }, (_, i) => (
            <React.Fragment key={i}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
              {i < Object.keys(WizardStep).length / 2 - 1 && (
                <div className={`h-1 w-12 ${i < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">{renderWizardStep()}</div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === WizardStep.ComponentType}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {currentStep < WizardStep.Summary ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={completeWizard}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
              >
                Generate Component
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Method Dialog */}
      {showMethodDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-medium mb-4">Add Method</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method Name
                  </label>
                  <input
                    type="text"
                    value={methodForm.name || ''}
                    onChange={e => setMethodForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="DoSomething"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Type
                  </label>
                  <select
                    value={methodForm.returnType}
                    onChange={e => setMethodForm(prev => ({ ...prev, returnType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="HRESULT">HRESULT</option>
                    <option value="void">void</option>
                    <option value="BSTR">BSTR</option>
                    <option value="long">long</option>
                    <option value="VARIANT_BOOL">VARIANT_BOOL</option>
                    <option value="VARIANT">VARIANT</option>
                  </select>
                </div>
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
};

export default COMInterfaceWizard;
