/**
 * VB6 Control Properties
 * Comprehensive list of all standard VB6 control properties
 */

export interface VB6Property {
  name: string;
  type: string;
  category: string;
  description: string;
  defaultValue?: any;
  readOnly?: boolean;
  designTime?: boolean;
  runtime?: boolean;
}

/**
 * Common properties shared by all controls
 */
export const CommonProperties: VB6Property[] = [
  {
    name: 'Name',
    type: 'String',
    category: 'Misc',
    description: 'The name used in code to identify the control',
    designTime: true,
    runtime: false,
  },
  {
    name: 'Index',
    type: 'Integer',
    category: 'Misc',
    description: 'A number that uniquely identifies a control in a control array',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Left',
    type: 'Single',
    category: 'Position',
    description: 'Distance from left edge of container',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Top',
    type: 'Single',
    category: 'Position',
    description: 'Distance from top edge of container',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Width',
    type: 'Single',
    category: 'Position',
    description: 'Width of the control',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Height',
    type: 'Single',
    category: 'Position',
    description: 'Height of the control',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Visible',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines whether the control is visible or hidden',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
  {
    name: 'Enabled',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines whether the control can respond to user events',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
  {
    name: 'TabIndex',
    type: 'Integer',
    category: 'Behavior',
    description: 'Tab order of the control',
    designTime: true,
    runtime: true,
  },
  {
    name: 'TabStop',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines whether the user can use Tab to give focus',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
  {
    name: 'Tag',
    type: 'String',
    category: 'Misc',
    description: 'Stores additional data about the control',
    defaultValue: '',
    designTime: true,
    runtime: true,
  },
  {
    name: 'ToolTipText',
    type: 'String',
    category: 'Misc',
    description: 'Text displayed when mouse hovers over control',
    defaultValue: '',
    designTime: true,
    runtime: true,
  },
  {
    name: 'HelpContextID',
    type: 'Long',
    category: 'Misc',
    description: 'Help context ID for the control',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'WhatsThisHelpID',
    type: 'Long',
    category: 'Misc',
    description: "What's This help context ID",
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'CausesValidation',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines if Validate event occurs',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
];

/**
 * Form-specific properties
 */
export const FormProperties: VB6Property[] = [
  ...CommonProperties,
  {
    name: 'Caption',
    type: 'String',
    category: 'Appearance',
    description: 'Text displayed in the title bar',
    designTime: true,
    runtime: true,
  },
  {
    name: 'BackColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Background color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'ForeColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Foreground color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'BorderStyle',
    type: 'Integer',
    category: 'Appearance',
    description:
      '0=None, 1=Fixed Single, 2=Sizable, 3=Fixed Dialog, 4=Fixed ToolWindow, 5=Sizable ToolWindow',
    defaultValue: 2,
    designTime: true,
    runtime: false,
  },
  {
    name: 'StartUpPosition',
    type: 'Integer',
    category: 'Position',
    description: '0=Manual, 1=CenterOwner, 2=CenterScreen, 3=Windows Default',
    defaultValue: 0,
    designTime: true,
    runtime: false,
  },
  {
    name: 'WindowState',
    type: 'Integer',
    category: 'Misc',
    description: '0=Normal, 1=Minimized, 2=Maximized',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'MaxButton',
    type: 'Boolean',
    category: 'Appearance',
    description: 'Shows or hides the Maximize button',
    defaultValue: true,
    designTime: true,
    runtime: false,
  },
  {
    name: 'MinButton',
    type: 'Boolean',
    category: 'Appearance',
    description: 'Shows or hides the Minimize button',
    defaultValue: true,
    designTime: true,
    runtime: false,
  },
  {
    name: 'ControlBox',
    type: 'Boolean',
    category: 'Appearance',
    description: 'Shows or hides the control menu box',
    defaultValue: true,
    designTime: true,
    runtime: false,
  },
  {
    name: 'ShowInTaskbar',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines if form appears in Windows taskbar',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
  {
    name: 'Icon',
    type: 'Picture',
    category: 'Appearance',
    description: 'Icon displayed in title bar',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Picture',
    type: 'Picture',
    category: 'Appearance',
    description: 'Background picture',
    designTime: true,
    runtime: true,
  },
  {
    name: 'AutoRedraw',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines if graphics persist',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'ClipControls',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Determines painting behavior',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
  {
    name: 'MDIChild',
    type: 'Boolean',
    category: 'Misc',
    description: 'Determines if form is an MDI child window',
    defaultValue: false,
    designTime: true,
    runtime: false,
  },
  {
    name: 'DrawMode',
    type: 'Integer',
    category: 'Graphics',
    description: 'Drawing mode for graphics methods',
    defaultValue: 13,
    designTime: true,
    runtime: true,
  },
  {
    name: 'DrawStyle',
    type: 'Integer',
    category: 'Graphics',
    description: 'Line style for graphics methods',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'DrawWidth',
    type: 'Integer',
    category: 'Graphics',
    description: 'Line width for graphics methods',
    defaultValue: 1,
    designTime: true,
    runtime: true,
  },
  {
    name: 'FillColor',
    type: 'Long',
    category: 'Graphics',
    description: 'Fill color for shapes',
    designTime: true,
    runtime: true,
  },
  {
    name: 'FillStyle',
    type: 'Integer',
    category: 'Graphics',
    description: 'Fill pattern for shapes',
    defaultValue: 1,
    designTime: true,
    runtime: true,
  },
  {
    name: 'ScaleMode',
    type: 'Integer',
    category: 'Graphics',
    description: 'Unit of measure for coordinates',
    defaultValue: 1,
    designTime: true,
    runtime: true,
  },
  {
    name: 'ScaleLeft',
    type: 'Single',
    category: 'Graphics',
    description: 'Custom left coordinate',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'ScaleTop',
    type: 'Single',
    category: 'Graphics',
    description: 'Custom top coordinate',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'ScaleWidth',
    type: 'Single',
    category: 'Graphics',
    description: 'Custom width in scale units',
    designTime: true,
    runtime: true,
  },
  {
    name: 'ScaleHeight',
    type: 'Single',
    category: 'Graphics',
    description: 'Custom height in scale units',
    designTime: true,
    runtime: true,
  },
  {
    name: 'hDC',
    type: 'Long',
    category: 'Graphics',
    description: 'Handle to device context',
    readOnly: true,
    designTime: false,
    runtime: true,
  },
  {
    name: 'hWnd',
    type: 'Long',
    category: 'Misc',
    description: 'Window handle',
    readOnly: true,
    designTime: false,
    runtime: true,
  },
];

/**
 * CommandButton properties
 */
export const CommandButtonProperties: VB6Property[] = [
  ...CommonProperties,
  {
    name: 'Caption',
    type: 'String',
    category: 'Appearance',
    description: 'Text displayed on the button',
    designTime: true,
    runtime: true,
  },
  {
    name: 'BackColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Background color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'ForeColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Text color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Style',
    type: 'Integer',
    category: 'Appearance',
    description: '0=Standard, 1=Graphical',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'Picture',
    type: 'Picture',
    category: 'Appearance',
    description: 'Picture displayed on button (when Style=1)',
    designTime: true,
    runtime: true,
  },
  {
    name: 'DisabledPicture',
    type: 'Picture',
    category: 'Appearance',
    description: 'Picture when disabled',
    designTime: true,
    runtime: true,
  },
  {
    name: 'DownPicture',
    type: 'Picture',
    category: 'Appearance',
    description: 'Picture when pressed',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Default',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Invoked when user presses Enter',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'Cancel',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Invoked when user presses Escape',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'Appearance',
    type: 'Integer',
    category: 'Appearance',
    description: '0=Flat, 1=3D',
    defaultValue: 1,
    designTime: true,
    runtime: true,
  },
  {
    name: 'UseMaskColor',
    type: 'Boolean',
    category: 'Appearance',
    description: 'Use mask color for transparency',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'MaskColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Color used for transparency',
    designTime: true,
    runtime: true,
  },
];

/**
 * TextBox properties
 */
export const TextBoxProperties: VB6Property[] = [
  ...CommonProperties,
  {
    name: 'Text',
    type: 'String',
    category: 'Data',
    description: 'Text contained in the control',
    defaultValue: '',
    designTime: true,
    runtime: true,
  },
  {
    name: 'MultiLine',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Allows multiple lines of text',
    defaultValue: false,
    designTime: true,
    runtime: false,
  },
  {
    name: 'ScrollBars',
    type: 'Integer',
    category: 'Appearance',
    description: '0=None, 1=Horizontal, 2=Vertical, 3=Both',
    defaultValue: 0,
    designTime: true,
    runtime: false,
  },
  {
    name: 'Alignment',
    type: 'Integer',
    category: 'Appearance',
    description: '0=Left, 1=Right, 2=Center',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'BackColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Background color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'ForeColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Text color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'BorderStyle',
    type: 'Integer',
    category: 'Appearance',
    description: '0=None, 1=Fixed Single',
    defaultValue: 1,
    designTime: true,
    runtime: false,
  },
  {
    name: 'MaxLength',
    type: 'Long',
    category: 'Behavior',
    description: 'Maximum number of characters (0=unlimited)',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'PasswordChar',
    type: 'String',
    category: 'Behavior',
    description: 'Character to display instead of actual text',
    defaultValue: '',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Locked',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Prevents editing',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'SelStart',
    type: 'Long',
    category: 'Data',
    description: 'Starting position of selected text',
    readOnly: false,
    designTime: false,
    runtime: true,
  },
  {
    name: 'SelLength',
    type: 'Long',
    category: 'Data',
    description: 'Length of selected text',
    readOnly: false,
    designTime: false,
    runtime: true,
  },
  {
    name: 'SelText',
    type: 'String',
    category: 'Data',
    description: 'Selected text',
    readOnly: false,
    designTime: false,
    runtime: true,
  },
  {
    name: 'HideSelection',
    type: 'Boolean',
    category: 'Appearance',
    description: 'Hides selection when control loses focus',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
];

/**
 * Label properties
 */
export const LabelProperties: VB6Property[] = [
  ...CommonProperties,
  {
    name: 'Caption',
    type: 'String',
    category: 'Appearance',
    description: 'Text displayed in the label',
    designTime: true,
    runtime: true,
  },
  {
    name: 'Alignment',
    type: 'Integer',
    category: 'Appearance',
    description: '0=Left, 1=Right, 2=Center',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'AutoSize',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Automatically sizes to fit content',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'BackColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Background color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'ForeColor',
    type: 'Long',
    category: 'Appearance',
    description: 'Text color',
    designTime: true,
    runtime: true,
  },
  {
    name: 'BackStyle',
    type: 'Integer',
    category: 'Appearance',
    description: '0=Transparent, 1=Opaque',
    defaultValue: 1,
    designTime: true,
    runtime: true,
  },
  {
    name: 'BorderStyle',
    type: 'Integer',
    category: 'Appearance',
    description: '0=None, 1=Fixed Single',
    defaultValue: 0,
    designTime: true,
    runtime: true,
  },
  {
    name: 'WordWrap',
    type: 'Boolean',
    category: 'Appearance',
    description: 'Wraps text to multiple lines',
    defaultValue: false,
    designTime: true,
    runtime: true,
  },
  {
    name: 'UseMnemonic',
    type: 'Boolean',
    category: 'Behavior',
    description: 'Enables use of & for hotkeys',
    defaultValue: true,
    designTime: true,
    runtime: true,
  },
];

/**
 * Map of control types to their properties
 */
export const ControlPropertiesMap: Record<string, VB6Property[]> = {
  Form: FormProperties,
  CommandButton: CommandButtonProperties,
  TextBox: TextBoxProperties,
  Label: LabelProperties,
  CheckBox: CommandButtonProperties, // Similar to CommandButton
  OptionButton: CommandButtonProperties, // Similar to CommandButton
  ListBox: [...CommonProperties],
  ComboBox: [...CommonProperties],
  PictureBox: [...CommonProperties],
  Timer: [...CommonProperties],
  HScrollBar: [...CommonProperties],
  VScrollBar: [...CommonProperties],
  Frame: [...CommonProperties],
  Image: [...CommonProperties],
  Shape: [...CommonProperties],
  Line: [...CommonProperties],
};

/**
 * Get properties for a specific control type
 */
export function getPropertiesForControl(controlType: string): VB6Property[] {
  return ControlPropertiesMap[controlType] || CommonProperties;
}

/**
 * Get property categories for a control
 */
export function getPropertyCategories(controlType: string): string[] {
  const properties = getPropertiesForControl(controlType);
  const categories = new Set(properties.map(p => p.category));
  return Array.from(categories).sort();
}

/**
 * Get properties by category
 */
export function getPropertiesByCategory(controlType: string, category: string): VB6Property[] {
  const properties = getPropertiesForControl(controlType);
  return properties.filter(p => p.category === category);
}

/**
 * Check if property is design-time only
 */
export function isDesignTimeOnly(controlType: string, propertyName: string): boolean {
  const properties = getPropertiesForControl(controlType);
  const property = properties.find(p => p.name === propertyName);
  return property?.designTime === true && property?.runtime === false;
}

/**
 * Check if property is read-only
 */
export function isReadOnly(controlType: string, propertyName: string): boolean {
  const properties = getPropertiesForControl(controlType);
  const property = properties.find(p => p.name === propertyName);
  return property?.readOnly === true;
}
