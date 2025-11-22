import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Check, Settings, Code, Eye, Copy, Download, Upload, FileCode, AlertTriangle, Info, Zap, Target, Link, Shield, Palette, Wrench } from 'lucide-react';

// Types
export enum PropertyType {
  STRING = 'String',
  LONG = 'Long',
  INTEGER = 'Integer',
  SINGLE = 'Single',
  DOUBLE = 'Double',
  BOOLEAN = 'Boolean',
  DATE = 'Date',
  VARIANT = 'Variant',
  OBJECT = 'Object',
  CURRENCY = 'Currency',
  BYTE = 'Byte',
  COLOR = 'OLE_COLOR',
  FONT = 'StdFont',
  PICTURE = 'StdPicture',
  ENUM = 'Enum'
}

export enum MethodType {
  SUB = 'Sub',
  FUNCTION = 'Function'
}

export enum EventType {
  CLICK = 'Click',
  DBLCLICK = 'DblClick',
  MOUSEDOWN = 'MouseDown',
  MOUSEUP = 'MouseUp',
  MOUSEMOVE = 'MouseMove',
  KEYDOWN = 'KeyDown',
  KEYUP = 'KeyUp',
  KEYPRESS = 'KeyPress',
  GOTFOCUS = 'GotFocus',
  LOSTFOCUS = 'LostFocus',
  CHANGE = 'Change',
  VALIDATE = 'Validate',
  CUSTOM = 'Custom'
}

export enum AccessModifier {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
  FRIEND = 'Friend'
}

export interface ControlProperty {
  id: string;
  name: string;
  type: PropertyType;
  defaultValue?: string;
  description: string;
  category: string;
  readOnly: boolean;
  designTime: boolean;
  runtime: boolean;
  propertyPage?: string;
  enumValues?: string[];
  validation?: {
    required: boolean;
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface ControlMethod {
  id: string;
  name: string;
  type: MethodType;
  returnType?: PropertyType;
  parameters: Array<{
    name: string;
    type: PropertyType;
    optional: boolean;
    defaultValue?: string;
  }>;
  description: string;
  accessModifier: AccessModifier;
}

export interface ControlEvent {
  id: string;
  name: string;
  type: EventType;
  parameters: Array<{
    name: string;
    type: PropertyType;
  }>;
  description: string;
  cancelable: boolean;
}

export interface PropertyPage {
  id: string;
  name: string;
  caption: string;
  properties: string[];
  tabOrder: number;
}

export interface ActiveXControlInterface {
  id: string;
  name: string;
  description: string;
  version: string;
  guid: string;
  progId: string;
  clsId: string;
  typeLibId: string;
  properties: ControlProperty[];
  methods: ControlMethod[];
  events: ControlEvent[];
  propertyPages: PropertyPage[];
  supportedContainers: string[];
  threading: 'Apartment' | 'Both' | 'Free';
  registrationInfo: {
    description: string;
    version: string;
    bitmap?: string;
    toolboxBitmap?: string;
    miscStatus: number;
    viewStatus: number;
  };
}

interface ActiveXControlInterfaceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  controlInterface?: ActiveXControlInterface;
  onSave?: (controlInterface: ActiveXControlInterface) => void;
}

export const ActiveXControlInterfaceWizard: React.FC<ActiveXControlInterfaceWizardProps> = ({
  isOpen,
  onClose,
  controlInterface,
  onSave
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<ActiveXControlInterface>(() => controlInterface || {
    id: `control-${Date.now()}`,
    name: 'MyControl',
    description: 'Custom ActiveX Control',
    version: '1.0.0',
    guid: `{${generateGUID()}}`,
    progId: 'MyProject.MyControl',
    clsId: `{${generateGUID()}}`,
    typeLibId: `{${generateGUID()}}`,
    properties: [
      {
        id: 'prop-1',
        name: 'Caption',
        type: PropertyType.STRING,
        defaultValue: '""',
        description: 'The text displayed on the control',
        category: 'Appearance',
        readOnly: false,
        designTime: true,
        runtime: true
      },
      {
        id: 'prop-2',
        name: 'Enabled',
        type: PropertyType.BOOLEAN,
        defaultValue: 'True',
        description: 'Determines whether the control can respond to user interaction',
        category: 'Behavior',
        readOnly: false,
        designTime: true,
        runtime: true
      },
      {
        id: 'prop-3',
        name: 'BackColor',
        type: PropertyType.COLOR,
        defaultValue: '&H8000000F',
        description: 'The background color of the control',
        category: 'Appearance',
        readOnly: false,
        designTime: true,
        runtime: true
      }
    ],
    methods: [
      {
        id: 'method-1',
        name: 'Refresh',
        type: MethodType.SUB,
        parameters: [],
        description: 'Forces the control to repaint',
        accessModifier: AccessModifier.PUBLIC
      },
      {
        id: 'method-2',
        name: 'AboutBox',
        type: MethodType.SUB,
        parameters: [],
        description: 'Displays the About dialog for the control',
        accessModifier: AccessModifier.PUBLIC
      }
    ],
    events: [
      {
        id: 'event-1',
        name: 'Click',
        type: EventType.CLICK,
        parameters: [],
        description: 'Occurs when the user clicks the control',
        cancelable: false
      },
      {
        id: 'event-2',
        name: 'Change',
        type: EventType.CHANGE,
        parameters: [],
        description: 'Occurs when the control value changes',
        cancelable: false
      }
    ],
    propertyPages: [
      {
        id: 'page-1',
        name: 'GeneralPage',
        caption: 'General',
        properties: ['Caption', 'Enabled'],
        tabOrder: 0
      },
      {
        id: 'page-2',
        name: 'AppearancePage',
        caption: 'Appearance',
        properties: ['BackColor'],
        tabOrder: 1
      }
    ],
    supportedContainers: ['Visual Basic', 'Visual C++', 'Internet Explorer', 'Office Applications'],
    threading: 'Apartment',
    registrationInfo: {
      description: 'Custom ActiveX Control',
      version: '1.0.0',
      miscStatus: 0,
      viewStatus: 0
    }
  });

  const totalSteps = 6;

  function generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }

  const addProperty = () => {
    const newProperty: ControlProperty = {
      id: `prop-${Date.now()}`,
      name: `Property${wizardData.properties.length + 1}`,
      type: PropertyType.STRING,
      defaultValue: '""',
      description: 'New property',
      category: 'General',
      readOnly: false,
      designTime: true,
      runtime: true
    };
    
    setWizardData({
      ...wizardData,
      properties: [...wizardData.properties, newProperty]
    });
  };

  const updateProperty = (propertyId: string, updates: Partial<ControlProperty>) => {
    setWizardData({
      ...wizardData,
      properties: wizardData.properties.map(prop =>
        prop.id === propertyId ? { ...prop, ...updates } : prop
      )
    });
  };

  const deleteProperty = (propertyId: string) => {
    setWizardData({
      ...wizardData,
      properties: wizardData.properties.filter(prop => prop.id !== propertyId)
    });
  };

  const addMethod = () => {
    const newMethod: ControlMethod = {
      id: `method-${Date.now()}`,
      name: `Method${wizardData.methods.length + 1}`,
      type: MethodType.SUB,
      parameters: [],
      description: 'New method',
      accessModifier: AccessModifier.PUBLIC
    };
    
    setWizardData({
      ...wizardData,
      methods: [...wizardData.methods, newMethod]
    });
  };

  const updateMethod = (methodId: string, updates: Partial<ControlMethod>) => {
    setWizardData({
      ...wizardData,
      methods: wizardData.methods.map(method =>
        method.id === methodId ? { ...method, ...updates } : method
      )
    });
  };

  const deleteMethod = (methodId: string) => {
    setWizardData({
      ...wizardData,
      methods: wizardData.methods.filter(method => method.id !== methodId)
    });
  };

  const addEvent = () => {
    const newEvent: ControlEvent = {
      id: `event-${Date.now()}`,
      name: `Event${wizardData.events.length + 1}`,
      type: EventType.CUSTOM,
      parameters: [],
      description: 'New event',
      cancelable: false
    };
    
    setWizardData({
      ...wizardData,
      events: [...wizardData.events, newEvent]
    });
  };

  const updateEvent = (eventId: string, updates: Partial<ControlEvent>) => {
    setWizardData({
      ...wizardData,
      events: wizardData.events.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    });
  };

  const deleteEvent = (eventId: string) => {
    setWizardData({
      ...wizardData,
      events: wizardData.events.filter(event => event.id !== eventId)
    });
  };

  const generateControlCode = (): string => {
    let code = `' ActiveX Control: ${wizardData.name}\n`;
    code += `' Generated by ActiveX Control Interface Wizard\n`;
    code += `' GUID: ${wizardData.guid}\n\n`;
    
    code += `VERSION 5.00\n`;
    code += `Begin VB.UserControl ${wizardData.name}\n`;
    code += `   BackColor       =   &H80000005&\n`;
    code += `   ClientHeight    =   3600\n`;
    code += `   ClientLeft      =   0\n`;
    code += `   ClientTop       =   0\n`;
    code += `   ClientWidth     =   4800\n`;
    code += `   PropertyPages   =   "${wizardData.propertyPages.map(p => p.name).join(';')}"\n`;
    code += `   ScaleHeight     =   3600\n`;
    code += `   ScaleWidth      =   4800\n`;
    code += `End\n\n`;
    
    code += `Attribute VB_Name = "${wizardData.name}"\n`;
    code += `Attribute VB_GlobalNameSpace = False\n`;
    code += `Attribute VB_Creatable = True\n`;
    code += `Attribute VB_PredeclaredId = False\n`;
    code += `Attribute VB_Exposed = True\n\n`;
    
    // Property declarations
    wizardData.properties.forEach(prop => {
      code += `' Property: ${prop.name}\n`;
      code += `Private m_${prop.name} As ${prop.type}\n`;
    });
    code += '\n';
    
    // Events declarations
    if (wizardData.events.length > 0) {
      code += "' Events\n";
      wizardData.events.forEach(event => {
        const params = event.parameters.map(p => `${p.name} As ${p.type}`).join(', ');
        code += `Public Event ${event.name}(${params})\n`;
      });
      code += '\n';
    }
    
    // Initialize
    code += `Private Sub UserControl_Initialize()\n`;
    wizardData.properties.forEach(prop => {
      if (prop.defaultValue) {
        code += `    m_${prop.name} = ${prop.defaultValue}\n`;
      }
    });
    code += `End Sub\n\n`;
    
    // Property procedures
    wizardData.properties.forEach(prop => {
      if (!prop.readOnly) {
        // Property Get
        code += `Public Property Get ${prop.name}() As ${prop.type}\n`;
        code += `Attribute ${prop.name}.VB_Description = "${prop.description}"\n`;
        code += `Attribute ${prop.name}.VB_UserMemId = 0\n`;
        code += `    ${prop.name} = m_${prop.name}\n`;
        code += `End Property\n\n`;
        
        // Property Let/Set
        const letOrSet = prop.type === PropertyType.OBJECT ? 'Set' : 'Let';
        code += `Public Property ${letOrSet} ${prop.name}(ByVal New_${prop.name} As ${prop.type})\n`;
        code += `    m_${prop.name} = New_${prop.name}\n`;
        code += `    PropertyChanged "${prop.name}"\n`;
        if (prop.name === 'BackColor' || prop.name === 'ForeColor') {
          code += `    UserControl.BackColor = m_${prop.name}\n`;
        }
        code += `    UserControl.Refresh\n`;
        code += `End Property\n\n`;
      } else {
        // Read-only property
        code += `Public Property Get ${prop.name}() As ${prop.type}\n`;
        code += `Attribute ${prop.name}.VB_Description = "${prop.description}"\n`;
        code += `    ${prop.name} = m_${prop.name}\n`;
        code += `End Property\n\n`;
      }
    });
    
    // Methods
    wizardData.methods.forEach(method => {
      const params = method.parameters.map(p => 
        `${p.optional ? 'Optional ' : ''}${p.name} As ${p.type}${p.defaultValue ? ' = ' + p.defaultValue : ''}`
      ).join(', ');
      
      const returnType = method.type === MethodType.FUNCTION && method.returnType ? ` As ${method.returnType}` : '';
      code += `${method.accessModifier} ${method.type} ${method.name}(${params})${returnType}\n`;
      code += `Attribute ${method.name}.VB_Description = "${method.description}"\n`;
      
      if (method.name === 'AboutBox') {
        code += `    MsgBox "${wizardData.name} Control" & vbCrLf & "Version ${wizardData.version}", vbInformation, "About ${wizardData.name}"\n`;
      } else if (method.name === 'Refresh') {
        code += `    UserControl.Refresh\n`;
      } else {
        code += `    ' TODO: Implement ${method.name}\n`;
      }
      
      code += `End ${method.type}\n\n`;
    });
    
    // Property bag procedures
    code += `Private Sub UserControl_ReadProperties(PropBag As PropertyBag)\n`;
    wizardData.properties.forEach(prop => {
      code += `    m_${prop.name} = PropBag.ReadProperty("${prop.name}", ${prop.defaultValue || '""'})\n`;
    });
    code += `End Sub\n\n`;
    
    code += `Private Sub UserControl_WriteProperties(PropBag As PropertyBag)\n`;
    wizardData.properties.forEach(prop => {
      code += `    Call PropBag.WriteProperty("${prop.name}", m_${prop.name}, ${prop.defaultValue || '""'})\n`;
    });
    code += `End Sub\n\n`;
    
    return code;
  };

  const generateTypeLibrary = (): string => {
    let tlb = `; Type Library for ${wizardData.name}\n`;
    tlb += `; Generated by ActiveX Control Interface Wizard\n\n`;
    
    tlb += `[\n`;
    tlb += `  uuid(${wizardData.typeLibId}),\n`;
    tlb += `  version(1.0),\n`;
    tlb += `  helpstring("${wizardData.description}")\n`;
    tlb += `]\n`;
    tlb += `library ${wizardData.name}Lib\n`;
    tlb += `{\n`;
    tlb += `  importlib("stdole2.tlb");\n\n`;
    
    // Interface definition
    tlb += `  [\n`;
    tlb += `    uuid(${generateGUID()}),\n`;
    tlb += `    helpstring("${wizardData.name} Interface"),\n`;
    tlb += `    dual,\n`;
    tlb += `    oleautomation\n`;
    tlb += `  ]\n`;
    tlb += `  interface I${wizardData.name} : IDispatch\n`;
    tlb += `  {\n`;
    
    // Properties
    wizardData.properties.forEach(prop => {
      tlb += `    [id(${prop.id.replace('prop-', '')}), propget, helpstring("${prop.description}")]\n`;
      tlb += `    HRESULT ${prop.name}([out, retval] ${prop.type}* pVal);\n`;
      
      if (!prop.readOnly) {
        tlb += `    [id(${prop.id.replace('prop-', '')}), propput, helpstring("${prop.description}")]\n`;
        tlb += `    HRESULT ${prop.name}([in] ${prop.type} newVal);\n`;
      }
    });
    
    // Methods
    wizardData.methods.forEach(method => {
      const params = method.parameters.map((p, i) => `[in] ${p.type} ${p.name}`).join(', ');
      tlb += `    [id(${method.id.replace('method-', '')}), helpstring("${method.description}")]\n`;
      tlb += `    HRESULT ${method.name}(${params});\n`;
    });
    
    tlb += `  };\n\n`;
    
    // CoClass definition
    tlb += `  [\n`;
    tlb += `    uuid(${wizardData.clsId}),\n`;
    tlb += `    helpstring("${wizardData.name} Class"),\n`;
    tlb += `    control\n`;
    tlb += `  ]\n`;
    tlb += `  coclass ${wizardData.name}\n`;
    tlb += `  {\n`;
    tlb += `    [default] interface I${wizardData.name};\n`;
    tlb += `  };\n`;
    tlb += `}\n`;
    
    return tlb;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(wizardData);
    }
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Control Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Control Name</label>
              <input
                type="text"
                value={wizardData.name}
                onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version</label>
              <input
                type="text"
                value={wizardData.version}
                onChange={(e) => setWizardData({ ...wizardData, version: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={wizardData.description}
              onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ProgID</label>
              <input
                type="text"
                value={wizardData.progId}
                onChange={(e) => setWizardData({ ...wizardData, progId: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Threading Model</label>
              <select
                value={wizardData.threading}
                onChange={(e) => setWizardData({ ...wizardData, threading: e.target.value as any })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Apartment">Apartment</option>
                <option value="Both">Both</option>
                <option value="Free">Free</option>
              </select>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">Generated GUIDs</h4>
            <div className="space-y-2 text-sm font-mono">
              <div>CLSID: <span className="text-blue-600">{wizardData.clsId}</span></div>
              <div>GUID: <span className="text-blue-600">{wizardData.guid}</span></div>
              <div>TypeLib ID: <span className="text-blue-600">{wizardData.typeLibId}</span></div>
            </div>
            <button
              onClick={() => setWizardData({
                ...wizardData,
                clsId: `{${generateGUID()}}`,
                guid: `{${generateGUID()}}`,
                typeLibId: `{${generateGUID()}}`
              })}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Regenerate GUIDs
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Properties</h3>
        <button
          onClick={addProperty}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {wizardData.properties.map(property => (
          <div key={property.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={property.name}
                    onChange={(e) => updateProperty(property.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={property.type}
                    onChange={(e) => updateProperty(property.id, { type: e.target.value as PropertyType })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    {Object.values(PropertyType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Value</label>
                  <input
                    type="text"
                    value={property.defaultValue || ''}
                    onChange={(e) => updateProperty(property.id, { defaultValue: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => deleteProperty(property.id)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={property.category}
                  onChange={(e) => updateProperty(property.id, { category: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="General">General</option>
                  <option value="Appearance">Appearance</option>
                  <option value="Behavior">Behavior</option>
                  <option value="Data">Data</option>
                  <option value="Font">Font</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={property.readOnly}
                    onChange={(e) => updateProperty(property.id, { readOnly: e.target.checked })}
                  />
                  Read Only
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={property.designTime}
                    onChange={(e) => updateProperty(property.id, { designTime: e.target.checked })}
                  />
                  Design Time
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={property.runtime}
                    onChange={(e) => updateProperty(property.id, { runtime: e.target.checked })}
                  />
                  Runtime
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={property.description}
                onChange={(e) => updateProperty(property.id, { description: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Methods</h3>
        <button
          onClick={addMethod}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Method
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {wizardData.methods.map(method => (
          <div key={method.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={method.name}
                    onChange={(e) => updateMethod(method.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={method.type}
                    onChange={(e) => updateMethod(method.id, { type: e.target.value as MethodType })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value={MethodType.SUB}>Sub</option>
                    <option value={MethodType.FUNCTION}>Function</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Access</label>
                  <select
                    value={method.accessModifier}
                    onChange={(e) => updateMethod(method.id, { accessModifier: e.target.value as AccessModifier })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value={AccessModifier.PUBLIC}>Public</option>
                    <option value={AccessModifier.PRIVATE}>Private</option>
                    <option value={AccessModifier.FRIEND}>Friend</option>
                  </select>
                </div>
                {method.type === MethodType.FUNCTION && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Return Type</label>
                    <select
                      value={method.returnType || PropertyType.STRING}
                      onChange={(e) => updateMethod(method.id, { returnType: e.target.value as PropertyType })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      {Object.values(PropertyType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteMethod(method.id)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={method.description}
                onChange={(e) => updateMethod(method.id, { description: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Parameters</label>
              <div className="space-y-2">
                {method.parameters.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => {
                        const newParams = [...method.parameters];
                        newParams[index] = { ...param, name: e.target.value };
                        updateMethod(method.id, { parameters: newParams });
                      }}
                      placeholder="Parameter name"
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => {
                        const newParams = [...method.parameters];
                        newParams[index] = { ...param, type: e.target.value as PropertyType };
                        updateMethod(method.id, { parameters: newParams });
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {Object.values(PropertyType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={param.optional}
                        onChange={(e) => {
                          const newParams = [...method.parameters];
                          newParams[index] = { ...param, optional: e.target.checked };
                          updateMethod(method.id, { parameters: newParams });
                        }}
                      />
                      Optional
                    </label>
                    <button
                      onClick={() => {
                        const newParams = method.parameters.filter((_, i) => i !== index);
                        updateMethod(method.id, { parameters: newParams });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newParams = [...method.parameters, { name: '', type: PropertyType.STRING, optional: false }];
                    updateMethod(method.id, { parameters: newParams });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Parameter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Events</h3>
        <button
          onClick={addEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {wizardData.events.map(event => (
          <div key={event.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={event.name}
                    onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={event.type}
                    onChange={(e) => updateEvent(event.id, { type: e.target.value as EventType })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    {Object.values(EventType).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={event.cancelable}
                      onChange={(e) => updateEvent(event.id, { cancelable: e.target.checked })}
                    />
                    Cancelable
                  </label>
                </div>
              </div>
              <button
                onClick={() => deleteEvent(event.id)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={event.description}
                onChange={(e) => updateEvent(event.id, { description: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Parameters</label>
              <div className="space-y-2">
                {event.parameters.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => {
                        const newParams = [...event.parameters];
                        newParams[index] = { ...param, name: e.target.value };
                        updateEvent(event.id, { parameters: newParams });
                      }}
                      placeholder="Parameter name"
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <select
                      value={param.type}
                      onChange={(e) => {
                        const newParams = [...event.parameters];
                        newParams[index] = { ...param, type: e.target.value as PropertyType };
                        updateEvent(event.id, { parameters: newParams });
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {Object.values(PropertyType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const newParams = event.parameters.filter((_, i) => i !== index);
                        updateEvent(event.id, { parameters: newParams });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newParams = [...event.parameters, { name: '', type: PropertyType.STRING }];
                    updateEvent(event.id, { parameters: newParams });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Parameter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuration</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Supported Containers</h4>
          <div className="space-y-2">
            {['Visual Basic', 'Visual C++', 'Internet Explorer', 'Office Applications', 'Visual FoxPro', 'PowerBuilder', 'Delphi'].map(container => (
              <label key={container} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wizardData.supportedContainers.includes(container)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWizardData({
                        ...wizardData,
                        supportedContainers: [...wizardData.supportedContainers, container]
                      });
                    } else {
                      setWizardData({
                        ...wizardData,
                        supportedContainers: wizardData.supportedContainers.filter(c => c !== container)
                      });
                    }
                  }}
                />
                {container}
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Registration Information</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={wizardData.registrationInfo.description}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  registrationInfo: { ...wizardData.registrationInfo, description: e.target.value }
                })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version</label>
              <input
                type="text"
                value={wizardData.registrationInfo.version}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  registrationInfo: { ...wizardData.registrationInfo, version: e.target.value }
                })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Toolbox Bitmap</label>
              <input
                type="text"
                value={wizardData.registrationInfo.toolboxBitmap || ''}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  registrationInfo: { ...wizardData.registrationInfo, toolboxBitmap: e.target.value }
                })}
                placeholder="Path to 16x16 bitmap"
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Property Pages</h4>
        <div className="space-y-2">
          {wizardData.propertyPages.map(page => (
            <div key={page.id} className="flex items-center gap-4 p-3 border rounded">
              <input
                type="text"
                value={page.caption}
                onChange={(e) => {
                  setWizardData({
                    ...wizardData,
                    propertyPages: wizardData.propertyPages.map(p =>
                      p.id === page.id ? { ...p, caption: e.target.value } : p
                    )
                  });
                }}
                className="flex-1 px-2 py-1 border rounded text-sm"
                placeholder="Page caption"
              />
              <div className="text-sm text-gray-600">
                {page.properties.length} properties
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Generated Code Preview</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => navigator.clipboard.writeText(generateControlCode())}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Copy Control Code
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(generateTypeLibrary())}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Copy Type Library
        </button>
        <button
          onClick={() => {
            const zip = `${wizardData.name}_Control.zip`;
            const blob = new Blob([generateControlCode()], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${wizardData.name}.ctl`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          Download Files
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h4 className="font-medium mb-2">UserControl Code (.ctl)</h4>
          <div className="border rounded">
            <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto h-64">
              {generateControlCode()}
            </pre>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Type Library (.odl)</h4>
          <div className="border rounded">
            <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto h-64">
              {generateTypeLibrary()}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Summary
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Control Name: <strong>{wizardData.name}</strong></div>
          <div>Properties: <strong>{wizardData.properties.length}</strong></div>
          <div>Methods: <strong>{wizardData.methods.length}</strong></div>
          <div>Events: <strong>{wizardData.events.length}</strong></div>
          <div>Property Pages: <strong>{wizardData.propertyPages.length}</strong></div>
          <div>Supported Containers: <strong>{wizardData.supportedContainers.length}</strong></div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90%] h-[85%] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">ActiveX Control Interface Wizard</h2>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
                <div
                  key={step}
                  className={`flex items-center gap-2 ${
                    step === currentStep ? 'text-blue-600' : step < currentStep ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === currentStep ? 'bg-blue-100 border-2 border-blue-600' :
                      step < currentStep ? 'bg-green-100 border-2 border-green-600' :
                      'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    {step < currentStep ? <Check className="w-3 h-3" /> : step}
                  </div>
                  <span className="font-medium">
                    {step === 1 ? 'Info' :
                     step === 2 ? 'Properties' :
                     step === 3 ? 'Methods' :
                     step === 4 ? 'Events' :
                     step === 5 ? 'Config' : 'Generate'}
                  </span>
                  {step < totalSteps && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex gap-2">
            {currentStep === totalSteps ? (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Create Control
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};