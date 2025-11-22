import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronLeft, ChevronRight, Check, Settings, Palette, Type, Code, Eye, Copy, Download, FileCode, Layout, Grid, List, Target, Zap, Info, AlertTriangle, Link, Shield } from 'lucide-react';

// Types
export enum PropertyPageType {
  GENERAL = 'General',
  APPEARANCE = 'Appearance', 
  FONT = 'Font',
  COLOR = 'Color',
  PICTURE = 'Picture',
  DATA = 'Data',
  CUSTOM = 'Custom'
}

export enum ControlType {
  LABEL = 'Label',
  TEXTBOX = 'TextBox',
  CHECKBOX = 'CheckBox',
  OPTIONBUTTON = 'OptionButton',
  COMBOBOX = 'ComboBox',
  LISTBOX = 'ListBox',
  SPINBUTTON = 'SpinButton',
  SLIDER = 'Slider',
  COLORPICKER = 'ColorPicker',
  FONTPICKER = 'FontPicker',
  PICTUREBOX = 'PictureBox',
  COMMANDBUTTON = 'CommandButton',
  FRAME = 'Frame'
}

export enum PropertyDataType {
  STRING = 'String',
  LONG = 'Long',
  INTEGER = 'Integer',
  SINGLE = 'Single',
  DOUBLE = 'Double',
  BOOLEAN = 'Boolean',
  DATE = 'Date',
  VARIANT = 'Variant',
  COLOR = 'OLE_COLOR',
  FONT = 'StdFont',
  PICTURE = 'StdPicture',
  ENUM = 'Enum'
}

export interface PropertyPageControl {
  id: string;
  name: string;
  type: ControlType;
  caption: string;
  left: number;
  top: number;
  width: number;
  height: number;
  tabIndex: number;
  visible: boolean;
  enabled: boolean;
  mappedProperty?: string;
  validationRule?: string;
  defaultValue?: string;
  enumValues?: string[];
}

export interface PropertyMapping {
  id: string;
  propertyName: string;
  displayName: string;
  dataType: PropertyDataType;
  controlId: string;
  controlProperty: string;
  category: string;
  required: boolean;
  readOnly: boolean;
  validation?: {
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enumValues?: string[];
  };
}

export interface PropertyPageConfiguration {
  id: string;
  name: string;
  caption: string;
  description: string;
  type: PropertyPageType;
  width: number;
  height: number;
  controls: PropertyPageControl[];
  mappings: PropertyMapping[];
  targetControl: string;
  helpContextID: number;
  codeGeneration: {
    generateValidation: boolean;
    generateErrorHandling: boolean;
    includeComments: boolean;
    generateHelp: boolean;
  };
}

interface PropertyPageWizardProps {
  isOpen: boolean;
  onClose: () => void;
  configuration?: PropertyPageConfiguration;
  onSave?: (configuration: PropertyPageConfiguration) => void;
}

export const PropertyPageWizard: React.FC<PropertyPageWizardProps> = ({
  isOpen,
  onClose,
  configuration,
  onSave
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<PropertyPageConfiguration>(() => configuration || {
    id: `proppage-${Date.now()}`,
    name: 'PropertyPage1',
    caption: 'General',
    description: 'General properties for the control',
    type: PropertyPageType.GENERAL,
    width: 252,
    height: 156,
    controls: [],
    mappings: [],
    targetControl: 'MyControl',
    helpContextID: 0,
    codeGeneration: {
      generateValidation: true,
      generateErrorHandling: true,
      includeComments: true,
      generateHelp: false
    }
  });

  const totalSteps = 5;

  const availableProperties = [
    { name: 'Caption', displayName: 'Caption', dataType: PropertyDataType.STRING, category: 'Appearance' },
    { name: 'BackColor', displayName: 'Back Color', dataType: PropertyDataType.COLOR, category: 'Appearance' },
    { name: 'ForeColor', displayName: 'Fore Color', dataType: PropertyDataType.COLOR, category: 'Appearance' },
    { name: 'Font', displayName: 'Font', dataType: PropertyDataType.FONT, category: 'Appearance' },
    { name: 'Enabled', displayName: 'Enabled', dataType: PropertyDataType.BOOLEAN, category: 'Behavior' },
    { name: 'Visible', displayName: 'Visible', dataType: PropertyDataType.BOOLEAN, category: 'Behavior' },
    { name: 'Width', displayName: 'Width', dataType: PropertyDataType.LONG, category: 'Position' },
    { name: 'Height', displayName: 'Height', dataType: PropertyDataType.LONG, category: 'Position' },
    { name: 'Left', displayName: 'Left', dataType: PropertyDataType.LONG, category: 'Position' },
    { name: 'Top', displayName: 'Top', dataType: PropertyDataType.LONG, category: 'Position' },
    { name: 'TabIndex', displayName: 'Tab Index', dataType: PropertyDataType.INTEGER, category: 'Behavior' },
    { name: 'TabStop', displayName: 'Tab Stop', dataType: PropertyDataType.BOOLEAN, category: 'Behavior' },
    { name: 'Text', displayName: 'Text', dataType: PropertyDataType.STRING, category: 'Data' },
    { name: 'Value', displayName: 'Value', dataType: PropertyDataType.VARIANT, category: 'Data' },
    { name: 'Tag', displayName: 'Tag', dataType: PropertyDataType.STRING, category: 'Data' },
    { name: 'Picture', displayName: 'Picture', dataType: PropertyDataType.PICTURE, category: 'Appearance' },
    { name: 'BorderStyle', displayName: 'Border Style', dataType: PropertyDataType.ENUM, category: 'Appearance' },
    { name: 'Alignment', displayName: 'Alignment', dataType: PropertyDataType.ENUM, category: 'Appearance' }
  ];

  const templateLayouts = {
    [PropertyPageType.GENERAL]: [
      { type: ControlType.LABEL, caption: 'Name:', left: 8, top: 12, width: 40, height: 12 },
      { type: ControlType.TEXTBOX, caption: '', left: 56, top: 8, width: 120, height: 20, mappedProperty: 'Name' },
      { type: ControlType.LABEL, caption: 'Caption:', left: 8, top: 36, width: 40, height: 12 },
      { type: ControlType.TEXTBOX, caption: '', left: 56, top: 32, width: 120, height: 20, mappedProperty: 'Caption' },
      { type: ControlType.CHECKBOX, caption: 'Enabled', left: 8, top: 56, width: 60, height: 16, mappedProperty: 'Enabled' },
      { type: ControlType.CHECKBOX, caption: 'Visible', left: 8, top: 76, width: 60, height: 16, mappedProperty: 'Visible' }
    ],
    [PropertyPageType.APPEARANCE]: [
      { type: ControlType.LABEL, caption: 'Back Color:', left: 8, top: 12, width: 60, height: 12 },
      { type: ControlType.COLORPICKER, caption: '', left: 72, top: 8, width: 80, height: 20, mappedProperty: 'BackColor' },
      { type: ControlType.LABEL, caption: 'Fore Color:', left: 8, top: 36, width: 60, height: 12 },
      { type: ControlType.COLORPICKER, caption: '', left: 72, top: 32, width: 80, height: 20, mappedProperty: 'ForeColor' },
      { type: ControlType.LABEL, caption: 'Border Style:', left: 8, top: 60, width: 60, height: 12 },
      { type: ControlType.COMBOBOX, caption: '', left: 72, top: 56, width: 80, height: 20, mappedProperty: 'BorderStyle' }
    ],
    [PropertyPageType.FONT]: [
      { type: ControlType.LABEL, caption: 'Font:', left: 8, top: 12, width: 40, height: 12 },
      { type: ControlType.FONTPICKER, caption: '', left: 56, top: 8, width: 120, height: 20, mappedProperty: 'Font' }
    ],
    [PropertyPageType.COLOR]: [
      { type: ControlType.FRAME, caption: 'Colors', left: 8, top: 8, width: 180, height: 100 },
      { type: ControlType.LABEL, caption: 'Back Color:', left: 16, top: 28, width: 60, height: 12 },
      { type: ControlType.COLORPICKER, caption: '', left: 80, top: 24, width: 80, height: 20, mappedProperty: 'BackColor' },
      { type: ControlType.LABEL, caption: 'Fore Color:', left: 16, top: 52, width: 60, height: 12 },
      { type: ControlType.COLORPICKER, caption: '', left: 80, top: 48, width: 80, height: 20, mappedProperty: 'ForeColor' }
    ]
  };

  useEffect(() => {
    // Auto-generate controls based on selected type
    if (wizardData.type && templateLayouts[wizardData.type] && wizardData.controls.length === 0) {
      const template = templateLayouts[wizardData.type];
      const generatedControls: PropertyPageControl[] = template.map((ctrl, index) => ({
        id: `ctrl-${Date.now()}-${index}`,
        name: `${ctrl.type}${index + 1}`,
        type: ctrl.type,
        caption: ctrl.caption,
        left: ctrl.left,
        top: ctrl.top,
        width: ctrl.width,
        height: ctrl.height,
        tabIndex: index,
        visible: true,
        enabled: true,
        mappedProperty: ctrl.mappedProperty
      }));
      
      // Auto-generate mappings
      const generatedMappings: PropertyMapping[] = template
        .filter(ctrl => ctrl.mappedProperty)
        .map((ctrl, index) => {
          const prop = availableProperties.find(p => p.name === ctrl.mappedProperty);
          return {
            id: `mapping-${Date.now()}-${index}`,
            propertyName: ctrl.mappedProperty!,
            displayName: prop?.displayName || ctrl.mappedProperty!,
            dataType: prop?.dataType || PropertyDataType.STRING,
            controlId: generatedControls[template.indexOf(ctrl)].id,
            controlProperty: ctrl.type === ControlType.TEXTBOX ? 'Text' :
                           ctrl.type === ControlType.CHECKBOX ? 'Value' :
                           ctrl.type === ControlType.COMBOBOX ? 'Text' :
                           ctrl.type === ControlType.COLORPICKER ? 'Color' :
                           ctrl.type === ControlType.FONTPICKER ? 'Font' : 'Value',
            category: prop?.category || 'General',
            required: false,
            readOnly: false
          };
        });
      
      setWizardData({
        ...wizardData,
        controls: generatedControls,
        mappings: generatedMappings
      });
    }
  }, [wizardData.type]);

  const addControl = (type: ControlType) => {
    const newControl: PropertyPageControl = {
      id: `ctrl-${Date.now()}`,
      name: `${type}${wizardData.controls.length + 1}`,
      type,
      caption: type === ControlType.LABEL ? 'Label:' : type === ControlType.COMMANDBUTTON ? 'Button' : '',
      left: 8 + (wizardData.controls.length % 3) * 80,
      top: 8 + Math.floor(wizardData.controls.length / 3) * 32,
      width: type === ControlType.LABEL ? 60 : type === ControlType.TEXTBOX ? 80 : 75,
      height: type === ControlType.TEXTBOX || type === ControlType.COMBOBOX ? 20 : 16,
      tabIndex: wizardData.controls.length,
      visible: true,
      enabled: true
    };
    
    setWizardData({
      ...wizardData,
      controls: [...wizardData.controls, newControl]
    });
  };

  const updateControl = (controlId: string, updates: Partial<PropertyPageControl>) => {
    setWizardData({
      ...wizardData,
      controls: wizardData.controls.map(ctrl =>
        ctrl.id === controlId ? { ...ctrl, ...updates } : ctrl
      )
    });
  };

  const deleteControl = (controlId: string) => {
    setWizardData({
      ...wizardData,
      controls: wizardData.controls.filter(ctrl => ctrl.id !== controlId),
      mappings: wizardData.mappings.filter(mapping => mapping.controlId !== controlId)
    });
  };

  const addMapping = () => {
    const newMapping: PropertyMapping = {
      id: `mapping-${Date.now()}`,
      propertyName: 'NewProperty',
      displayName: 'New Property',
      dataType: PropertyDataType.STRING,
      controlId: wizardData.controls[0]?.id || '',
      controlProperty: 'Text',
      category: 'General',
      required: false,
      readOnly: false
    };
    
    setWizardData({
      ...wizardData,
      mappings: [...wizardData.mappings, newMapping]
    });
  };

  const updateMapping = (mappingId: string, updates: Partial<PropertyMapping>) => {
    setWizardData({
      ...wizardData,
      mappings: wizardData.mappings.map(mapping =>
        mapping.id === mappingId ? { ...mapping, ...updates } : mapping
      )
    });
  };

  const deleteMapping = (mappingId: string) => {
    setWizardData({
      ...wizardData,
      mappings: wizardData.mappings.filter(mapping => mapping.id !== mappingId)
    });
  };

  const generatePropertyPageCode = (): string => {
    let code = `VERSION 5.00\n`;
    code += `Begin VB.PropertyPage ${wizardData.name}\n`;
    code += `   Caption         =   "${wizardData.caption}"\n`;
    code += `   ClientHeight    =   ${wizardData.height * 15}\n`;
    code += `   ClientLeft      =   0\n`;
    code += `   ClientTop       =   0\n`;
    code += `   ClientWidth     =   ${wizardData.width * 15}\n`;
    code += `   PaletteMode     =   0  'Halftone\n`;
    code += `   ScaleHeight     =   ${Math.floor(wizardData.height / 4)}\n`;
    code += `   ScaleMode       =   3  'Pixel\n`;
    code += `   ScaleWidth      =   ${Math.floor(wizardData.width / 4)}\n`;
    
    // Generate controls
    wizardData.controls.forEach(control => {
      code += `   Begin VB.${control.type} ${control.name}\n`;
      if (control.caption) code += `      Caption         =   "${control.caption}"\n`;
      code += `      Height          =   ${control.height * 15}\n`;
      code += `      Left            =   ${control.left * 15}\n`;
      code += `      TabIndex        =   ${control.tabIndex}\n`;
      code += `      Top             =   ${control.top * 15}\n`;
      code += `      Width           =   ${control.width * 15}\n`;
      if (!control.visible) code += `      Visible         =   0   'False\n`;
      if (!control.enabled) code += `      Enabled         =   0   'False\n`;
      
      // Special properties for different control types
      if (control.type === ControlType.COMBOBOX) {
        code += `      Style           =   2  'Dropdown List\n`;
      }
      if (control.type === ControlType.TEXTBOX) {
        code += `      BackColor       =   &H80000005&\n`;
      }
      
      code += `   End\n`;
    });
    
    code += `End\n`;
    code += `Attribute VB_Name = "${wizardData.name}"\n`;
    code += `Attribute VB_GlobalNameSpace = False\n`;
    code += `Attribute VB_Creatable = False\n`;
    code += `Attribute VB_PredeclaredId = False\n`;
    code += `Attribute VB_Exposed = False\n\n`;
    
    if (wizardData.codeGeneration.includeComments) {
      code += `' Property Page: ${wizardData.caption}\n`;
      code += `' Generated by VB6 Property Page Wizard\n`;
      code += `' Target Control: ${wizardData.targetControl}\n`;
      code += `' Created: ${new Date().toLocaleDateString()}\n\n`;
    }
    
    // Property page events
    code += `Private Sub PropertyPage_Initialize()\n`;
    if (wizardData.codeGeneration.includeComments) {
      code += `    ' Initialize property page controls\n`;
    }
    if (wizardData.codeGeneration.generateErrorHandling) {
      code += `    On Error GoTo ErrorHandler\n    \n`;
    }
    
    // Initialize combo boxes with enum values
    wizardData.mappings.forEach(mapping => {
      if (mapping.validation?.enumValues) {
        const control = wizardData.controls.find(c => c.id === mapping.controlId);
        if (control?.type === ControlType.COMBOBOX) {
          mapping.validation.enumValues.forEach(value => {
            code += `    ${control.name}.AddItem "${value}"\n`;
          });
        }
      }
    });
    
    if (wizardData.codeGeneration.generateErrorHandling) {
      code += `    \n    Exit Sub\n    \nErrorHandler:\n`;
      code += `    MsgBox "Error initializing property page: " & Err.Description, vbCritical\n`;
    }
    code += `End Sub\n\n`;
    
    code += `Private Sub PropertyPage_SelectionChanged()\n`;
    if (wizardData.codeGeneration.includeComments) {
      code += `    ' Load current property values from selected controls\n`;
    }
    if (wizardData.codeGeneration.generateErrorHandling) {
      code += `    On Error GoTo ErrorHandler\n    \n`;
    }
    
    // Load current values
    wizardData.mappings.forEach(mapping => {
      const control = wizardData.controls.find(c => c.id === mapping.controlId);
      if (control) {
        code += `    If SelectedControls.Count > 0 Then\n`;
        code += `        ${control.name}.${mapping.controlProperty} = SelectedControls(0).${mapping.propertyName}\n`;
        code += `    End If\n`;
      }
    });
    
    if (wizardData.codeGeneration.generateErrorHandling) {
      code += `    \n    Exit Sub\n    \nErrorHandler:\n`;
      code += `    MsgBox "Error loading property values: " & Err.Description, vbCritical\n`;
    }
    code += `End Sub\n\n`;
    
    // Generate change event handlers for each mapped control
    wizardData.mappings.forEach(mapping => {
      const control = wizardData.controls.find(c => c.id === mapping.controlId);
      if (!control) return;
      
      let eventName = 'Change';
      if (control.type === ControlType.CHECKBOX) eventName = 'Click';
      if (control.type === ControlType.COMBOBOX) eventName = 'Click';
      if (control.type === ControlType.COMMANDBUTTON) eventName = 'Click';
      
      code += `Private Sub ${control.name}_${eventName}()\n`;
      if (wizardData.codeGeneration.generateValidation && mapping.validation) {
        code += `    ' Validate input\n`;
        if (mapping.validation.minLength) {
          code += `    If Len(${control.name}.${mapping.controlProperty}) < ${mapping.validation.minLength} Then\n`;
          code += `        MsgBox "${mapping.displayName} must be at least ${mapping.validation.minLength} characters.", vbExclamation\n`;
          code += `        Exit Sub\n`;
          code += `    End If\n`;
        }
        if (mapping.validation.maxLength) {
          code += `    If Len(${control.name}.${mapping.controlProperty}) > ${mapping.validation.maxLength} Then\n`;
          code += `        MsgBox "${mapping.displayName} cannot exceed ${mapping.validation.maxLength} characters.", vbExclamation\n`;
          code += `        Exit Sub\n`;
          code += `    End If\n`;
        }
        if (mapping.validation.minValue !== undefined) {
          code += `    If ${control.name}.${mapping.controlProperty} < ${mapping.validation.minValue} Then\n`;
          code += `        MsgBox "${mapping.displayName} must be at least ${mapping.validation.minValue}.", vbExclamation\n`;
          code += `        Exit Sub\n`;
          code += `    End If\n`;
        }
        if (mapping.validation.maxValue !== undefined) {
          code += `    If ${control.name}.${mapping.controlProperty} > ${mapping.validation.maxValue} Then\n`;
          code += `        MsgBox "${mapping.displayName} cannot exceed ${mapping.validation.maxValue}.", vbExclamation\n`;
          code += `        Exit Sub\n`;
          code += `    End If\n`;
        }
      }
      
      code += `    ' Mark page as changed\n`;
      code += `    PropertyPage.Changed = True\n`;
      code += `End Sub\n\n`;
    });
    
    code += `Private Sub PropertyPage_ApplyChanges()\n`;
    if (wizardData.codeGeneration.includeComments) {
      code += `    ' Apply property changes to all selected controls\n`;
    }
    if (wizardData.codeGeneration.generateErrorHandling) {
      code += `    On Error GoTo ErrorHandler\n    \n`;
    }
    
    code += `    Dim ctrl As Control\n`;
    code += `    For Each ctrl In SelectedControls\n`;
    
    wizardData.mappings.forEach(mapping => {
      const control = wizardData.controls.find(c => c.id === mapping.controlId);
      if (control) {
        code += `        ctrl.${mapping.propertyName} = ${control.name}.${mapping.controlProperty}\n`;
      }
    });
    
    code += `    Next ctrl\n`;
    
    if (wizardData.codeGeneration.generateErrorHandling) {
      code += `    \n    Exit Sub\n    \nErrorHandler:\n`;
      code += `    MsgBox "Error applying changes: " & Err.Description, vbCritical\n`;
    }
    code += `End Sub\n\n`;
    
    return code;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(wizardData);
    }
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Property Page Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Page Name</label>
          <input
            type="text"
            value={wizardData.name}
            onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Caption</label>
          <input
            type="text"
            value={wizardData.caption}
            onChange={(e) => setWizardData({ ...wizardData, caption: e.target.value })}
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
          <label className="block text-sm font-medium mb-1">Target Control</label>
          <input
            type="text"
            value={wizardData.targetControl}
            onChange={(e) => setWizardData({ ...wizardData, targetControl: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="MyControl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Help Context ID</label>
          <input
            type="number"
            value={wizardData.helpContextID}
            onChange={(e) => setWizardData({ ...wizardData, helpContextID: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Width (twips)</label>
          <input
            type="number"
            value={wizardData.width}
            onChange={(e) => setWizardData({ ...wizardData, width: parseInt(e.target.value) || 252 })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            min="100"
            max="800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Height (twips)</label>
          <input
            type="number"
            value={wizardData.height}
            onChange={(e) => setWizardData({ ...wizardData, height: parseInt(e.target.value) || 156 })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            min="80"
            max="600"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Property Page Type</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.values(PropertyPageType).map(type => (
          <div
            key={type}
            className={`p-4 border rounded cursor-pointer hover:bg-gray-50 ${
              wizardData.type === type ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setWizardData({ ...wizardData, type, controls: [], mappings: [] })}
          >
            <div className="flex items-center gap-3">
              {type === PropertyPageType.GENERAL && <Settings className="w-6 h-6 text-blue-600" />}
              {type === PropertyPageType.APPEARANCE && <Palette className="w-6 h-6 text-green-600" />}
              {type === PropertyPageType.FONT && <Type className="w-6 h-6 text-purple-600" />}
              {type === PropertyPageType.COLOR && <Palette className="w-6 h-6 text-red-600" />}
              {type === PropertyPageType.PICTURE && <Eye className="w-6 h-6 text-orange-600" />}
              {type === PropertyPageType.DATA && <Grid className="w-6 h-6 text-indigo-600" />}
              {type === PropertyPageType.CUSTOM && <Target className="w-6 h-6 text-gray-600" />}
              <div>
                <div className="font-medium">{type}</div>
                <div className="text-sm text-gray-600">
                  {type === PropertyPageType.GENERAL && 'Basic control properties like name, caption, enabled'}
                  {type === PropertyPageType.APPEARANCE && 'Visual properties like colors, borders, alignment'}
                  {type === PropertyPageType.FONT && 'Font selection and text formatting properties'}
                  {type === PropertyPageType.COLOR && 'Color picker interface for color properties'}
                  {type === PropertyPageType.PICTURE && 'Picture and image-related properties'}
                  {type === PropertyPageType.DATA && 'Data binding and value properties'}
                  {type === PropertyPageType.CUSTOM && 'Custom property page with manual layout'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Selected Type: {wizardData.type}
        </h4>
        <div className="text-sm text-blue-700">
          This will generate a template layout with appropriate controls and property mappings.
          You can customize the layout in the next steps.
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Controls Layout</h3>
        <div className="flex gap-2">
          <button
            onClick={() => addControl(ControlType.LABEL)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add Label
          </button>
          <button
            onClick={() => addControl(ControlType.TEXTBOX)}
            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Add TextBox
          </button>
          <button
            onClick={() => addControl(ControlType.CHECKBOX)}
            className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            Add CheckBox
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Controls</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {wizardData.controls.map(control => (
              <div key={control.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div>
                      <label className="block text-xs font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={control.name}
                        onChange={(e) => updateControl(control.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select
                        value={control.type}
                        onChange={(e) => updateControl(control.id, { type: e.target.value as ControlType })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        {Object.values(ControlType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteControl(control.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Caption</label>
                    <input
                      type="text"
                      value={control.caption}
                      onChange={(e) => updateControl(control.id, { caption: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tab Index</label>
                    <input
                      type="number"
                      value={control.tabIndex}
                      onChange={(e) => updateControl(control.id, { tabIndex: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Left</label>
                    <input
                      type="number"
                      value={control.left}
                      onChange={(e) => updateControl(control.id, { left: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Top</label>
                    <input
                      type="number"
                      value={control.top}
                      onChange={(e) => updateControl(control.id, { top: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Width</label>
                    <input
                      type="number"
                      value={control.width}
                      onChange={(e) => updateControl(control.id, { width: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Height</label>
                    <input
                      type="number"
                      value={control.height}
                      onChange={(e) => updateControl(control.id, { height: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Visual Preview</h4>
          <div 
            className="border-2 border-gray-300 bg-gray-100 relative overflow-hidden"
            style={{ 
              width: Math.max(200, wizardData.width), 
              height: Math.max(120, wizardData.height)
            }}
          >
            {wizardData.controls.map(control => (
              <div
                key={control.id}
                className={`absolute border bg-white text-xs flex items-center justify-center cursor-pointer hover:bg-blue-50 ${
                  control.type === ControlType.LABEL ? 'bg-transparent border-0 text-black' :
                  control.type === ControlType.CHECKBOX ? 'bg-white' :
                  'bg-white'
                }`}
                style={{
                  left: control.left,
                  top: control.top,
                  width: control.width,
                  height: control.height
                }}
                title={`${control.name} (${control.type})`}
              >
                {control.type === ControlType.CHECKBOX ? '☐ ' : ''}
                {control.caption || control.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Mappings</h3>
        <button
          onClick={addMapping}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {wizardData.mappings.map(mapping => (
          <div key={mapping.id} className="border rounded p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name</label>
                  <select
                    value={mapping.propertyName}
                    onChange={(e) => {
                      const prop = availableProperties.find(p => p.name === e.target.value);
                      updateMapping(mapping.id, { 
                        propertyName: e.target.value,
                        displayName: prop?.displayName || e.target.value,
                        dataType: prop?.dataType || PropertyDataType.STRING,
                        category: prop?.category || 'General'
                      });
                    }}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select Property...</option>
                    {availableProperties.map(prop => (
                      <option key={prop.name} value={prop.name}>{prop.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Control</label>
                  <select
                    value={mapping.controlId}
                    onChange={(e) => updateMapping(mapping.id, { controlId: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select Control...</option>
                    {wizardData.controls.map(ctrl => (
                      <option key={ctrl.id} value={ctrl.id}>{ctrl.name} ({ctrl.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Control Property</label>
                  <select
                    value={mapping.controlProperty}
                    onChange={(e) => updateMapping(mapping.id, { controlProperty: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="Text">Text</option>
                    <option value="Value">Value</option>
                    <option value="Checked">Checked</option>
                    <option value="ListIndex">ListIndex</option>
                    <option value="Color">Color</option>
                    <option value="Font">Font</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => deleteMapping(mapping.id)}
                className="ml-3 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={mapping.displayName}
                  onChange={(e) => updateMapping(mapping.id, { displayName: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Type</label>
                <select
                  value={mapping.dataType}
                  onChange={(e) => updateMapping(mapping.id, { dataType: e.target.value as PropertyDataType })}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  {Object.values(PropertyDataType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={mapping.category}
                  onChange={(e) => updateMapping(mapping.id, { category: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="General">General</option>
                  <option value="Appearance">Appearance</option>
                  <option value="Behavior">Behavior</option>
                  <option value="Data">Data</option>
                  <option value="Position">Position</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={mapping.required}
                  onChange={(e) => updateMapping(mapping.id, { required: e.target.checked })}
                />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={mapping.readOnly}
                  onChange={(e) => updateMapping(mapping.id, { readOnly: e.target.checked })}
                />
                Read Only
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block font-medium mb-1">Validation</label>
                <div className="space-y-1">
                  <input
                    type="number"
                    placeholder="Min value"
                    value={mapping.validation?.minValue || ''}
                    onChange={(e) => updateMapping(mapping.id, {
                      validation: { ...mapping.validation, minValue: parseFloat(e.target.value) || undefined }
                    })}
                    className="w-full px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max value"
                    value={mapping.validation?.maxValue || ''}
                    onChange={(e) => updateMapping(mapping.id, {
                      validation: { ...mapping.validation, maxValue: parseFloat(e.target.value) || undefined }
                    })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">String Validation</label>
                <div className="space-y-1">
                  <input
                    type="number"
                    placeholder="Min length"
                    value={mapping.validation?.minLength || ''}
                    onChange={(e) => updateMapping(mapping.id, {
                      validation: { ...mapping.validation, minLength: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full px-2 py-1 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max length"
                    value={mapping.validation?.maxLength || ''}
                    onChange={(e) => updateMapping(mapping.id, {
                      validation: { ...mapping.validation, maxLength: parseInt(e.target.value) || undefined }
                    })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {wizardData.mappings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Link className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No property mappings defined</p>
          <p className="text-sm">Click "Add Mapping" to connect control properties to your ActiveX control</p>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Code Generation & Preview</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Code Generation Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.generateValidation}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  codeGeneration: { ...wizardData.codeGeneration, generateValidation: e.target.checked }
                })}
              />
              Generate input validation
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.generateErrorHandling}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  codeGeneration: { ...wizardData.codeGeneration, generateErrorHandling: e.target.checked }
                })}
              />
              Include error handling
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.includeComments}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  codeGeneration: { ...wizardData.codeGeneration, includeComments: e.target.checked }
                })}
              />
              Generate code comments
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wizardData.codeGeneration.generateHelp}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  codeGeneration: { ...wizardData.codeGeneration, generateHelp: e.target.checked }
                })}
              />
              Generate help integration
            </label>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Property Page Summary
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Type: <strong>{wizardData.type}</strong></div>
            <div>Controls: <strong>{wizardData.controls.length}</strong></div>
            <div>Mappings: <strong>{wizardData.mappings.length}</strong></div>
            <div>Target: <strong>{wizardData.targetControl}</strong></div>
            <div>Size: <strong>{wizardData.width} × {wizardData.height}</strong></div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => navigator.clipboard.writeText(generatePropertyPageCode())}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Copy Code
        </button>
        <button
          onClick={() => {
            const blob = new Blob([generatePropertyPageCode()], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${wizardData.name}.pag`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Generated Property Page Code (.pag)</h4>
        <div className="border rounded">
          <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto h-80">
            {generatePropertyPageCode()}
          </pre>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <Check className="w-4 h-4" />
            What's Included
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Property page form with all controls</li>
            <li>• Property mapping and binding code</li>
            <li>• Change event handlers for each control</li>
            {wizardData.codeGeneration.generateValidation && <li>• Input validation routines</li>}
            {wizardData.codeGeneration.generateErrorHandling && <li>• Error handling and recovery</li>}
            <li>• ApplyChanges implementation</li>
            <li>• SelectionChanged event handler</li>
          </ul>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Next Steps
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Add the property page to your ActiveX control project</li>
            <li>• Register the property page with your control</li>
            <li>• Test the property page in the VB6 IDE</li>
            <li>• Customize the appearance and behavior</li>
            <li>• Add additional validation logic as needed</li>
            <li>• Update help file with property descriptions</li>
          </ul>
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
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Property Page Wizard</h2>
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
                     step === 2 ? 'Type' :
                     step === 3 ? 'Layout' :
                     step === 4 ? 'Mapping' : 'Generate'}
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
                Create Property Page
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