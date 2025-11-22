/**
 * Property Manager for VB6 Controls
 * 
 * Manages property definitions, validation, and type conversion
 * for all VB6 control types with their specific properties
 */

export interface PropertyValidation {
  min?: number;
  max?: number;
  pattern?: RegExp;
  required?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface PropertyDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'color' | 'font' | 'picture' | 'code' | 'datasource' | 'menu' | 'icon' | 'cursor';
  category: string;
  description: string;
  enumValues?: string[];
  defaultValue?: any;
  readOnly?: boolean;
  browsable?: boolean;
  validation?: PropertyValidation;
  designTime?: boolean;
  runtime?: boolean;
  dependsOn?: string[]; // Properties that this property depends on
  affects?: string[]; // Properties affected by changes to this property
}

export class PropertyManager {
  private static propertyRegistry: Map<string, Map<string, PropertyDefinition>> = new Map();

  /**
   * Register properties for a control type
   */
  static registerControlProperties(controlType: string, properties: PropertyDefinition[]): void {
    const controlProps = new Map<string, PropertyDefinition>();
    properties.forEach(prop => {
      controlProps.set(prop.name, prop);
    });
    this.propertyRegistry.set(controlType, controlProps);
  }

  /**
   * Get all properties for a control type
   */
  static getControlProperties(controlType: string): PropertyDefinition[] {
    const controlProps = this.propertyRegistry.get(controlType);
    if (!controlProps) return [];
    
    return Array.from(controlProps.values()).filter(prop => prop.browsable !== false);
  }

  /**
   * Get a specific property definition
   */
  static getPropertyDefinition(controlType: string, propertyName: string): PropertyDefinition | null {
    const controlProps = this.propertyRegistry.get(controlType);
    return controlProps?.get(propertyName) || null;
  }

  /**
   * Validate a property value
   */
  static validateProperty(controlType: string, propertyName: string, value: any): boolean | string {
    const propDef = this.getPropertyDefinition(controlType, propertyName);
    if (!propDef || !propDef.validation) return true;

    const validation = propDef.validation;

    // Required validation
    if (validation.required && (value === null || value === undefined || value === '')) {
      return 'This property is required';
    }

    // Type-specific validation
    switch (propDef.type) {
      case 'number': {
        const numValue = Number(value);
        if (isNaN(numValue)) return 'Must be a valid number';
        if (validation.min !== undefined && numValue < validation.min) {
          return `Must be greater than or equal to ${validation.min}`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return `Must be less than or equal to ${validation.max}`;
        }
        break;
      }

      case 'string':
        if (validation.pattern && !validation.pattern.test(value)) {
          return 'Invalid format';
        }
        break;
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value);
    }

    return true;
  }

  /**
   * Convert value to appropriate type
   */
  static convertValue(controlType: string, propertyName: string, value: any): any {
    const propDef = this.getPropertyDefinition(controlType, propertyName);
    if (!propDef) return value;

    switch (propDef.type) {
      case 'boolean':
        return Boolean(value);
      case 'number':
        return Number(value) || 0;
      case 'string':
        return String(value);
      default:
        return value;
    }
  }

  /**
   * Get default value for a property
   */
  static getDefaultValue(controlType: string, propertyName: string): any {
    const propDef = this.getPropertyDefinition(controlType, propertyName);
    return propDef?.defaultValue;
  }

  /**
   * Check if property is design-time only
   */
  static isDesignTimeProperty(controlType: string, propertyName: string): boolean {
    const propDef = this.getPropertyDefinition(controlType, propertyName);
    return propDef?.designTime === true;
  }

  /**
   * Check if property is runtime only
   */
  static isRuntimeProperty(controlType: string, propertyName: string): boolean {
    const propDef = this.getPropertyDefinition(controlType, propertyName);
    return propDef?.runtime === true;
  }

  /**
   * Get properties that depend on a given property
   */
  static getDependentProperties(controlType: string, propertyName: string): string[] {
    const allProps = this.getControlProperties(controlType);
    return allProps
      .filter(prop => prop.dependsOn?.includes(propertyName))
      .map(prop => prop.name);
  }

  /**
   * Get properties affected by a given property
   */
  static getAffectedProperties(controlType: string, propertyName: string): string[] {
    const propDef = this.getPropertyDefinition(controlType, propertyName);
    return propDef?.affects || [];
  }
}

// Register common VB6 control properties
PropertyManager.registerControlProperties('Form', [
  { name: 'Name', type: 'string', category: 'Design', description: 'Returns the name used in code to identify a form.', readOnly: true, defaultValue: 'Form1' },
  { name: 'Caption', type: 'string', category: 'Appearance', description: 'Returns/sets the text displayed in the form\'s title bar.', defaultValue: 'Form1' },
  { name: 'BackColor', type: 'color', category: 'Appearance', description: 'Returns/sets the background color of the form.', defaultValue: '#8000000F' },
  { name: 'ForeColor', type: 'color', category: 'Appearance', description: 'Returns/sets the foreground color of the form.', defaultValue: '#80000012' },
  { name: 'BorderStyle', type: 'enum', category: 'Appearance', description: 'Returns/sets the border style for the form.', enumValues: ['0 - None', '1 - Fixed Single', '2 - Sizable', '3 - Fixed Dialog', '4 - Fixed ToolWindow', '5 - Sizable ToolWindow'], defaultValue: '2 - Sizable' },
  { name: 'ControlBox', type: 'boolean', category: 'Appearance', description: 'Returns/sets a value indicating whether a Control-menu box is displayed at run time.', defaultValue: true },
  { name: 'MaxButton', type: 'boolean', category: 'Appearance', description: 'Returns/sets a value indicating whether a Maximize button is displayed in the title bar.', defaultValue: true },
  { name: 'MinButton', type: 'boolean', category: 'Appearance', description: 'Returns/sets a value indicating whether a Minimize button is displayed in the title bar.', defaultValue: true },
  { name: 'Icon', type: 'icon', category: 'Appearance', description: 'Returns/sets the icon displayed when the form is minimized.', defaultValue: '' },
  { name: 'Picture', type: 'picture', category: 'Appearance', description: 'Returns/sets a graphic to be displayed on the form.', defaultValue: '' },
  { name: 'StartUpPosition', type: 'enum', category: 'Layout', description: 'Returns/sets the startup position of the form.', enumValues: ['0 - Manual', '1 - CenterOwner', '2 - CenterScreen', '3 - Windows Default'], defaultValue: '2 - CenterScreen' },
  { name: 'WindowState', type: 'enum', category: 'Layout', description: 'Returns/sets the visual state of the form window at run time.', enumValues: ['0 - Normal', '1 - Minimized', '2 - Maximized'], defaultValue: '0 - Normal' },
  { name: 'Left', type: 'number', category: 'Layout', description: 'Returns/sets the distance between the left edge of the form and the left edge of the screen.', defaultValue: 0 },
  { name: 'Top', type: 'number', category: 'Layout', description: 'Returns/sets the distance between the top edge of the form and the top edge of the screen.', defaultValue: 0 },
  { name: 'Width', type: 'number', category: 'Layout', description: 'Returns/sets the width of the form.', validation: { min: 0 }, defaultValue: 640 },
  { name: 'Height', type: 'number', category: 'Layout', description: 'Returns/sets the height of the form.', validation: { min: 0 }, defaultValue: 480 },
  { name: 'Enabled', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value that determines whether the form can respond to user-generated events.', defaultValue: true },
  { name: 'Visible', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether the form is visible or hidden.', defaultValue: true },
  { name: 'ShowInTaskbar', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether the form is displayed in the Windows taskbar.', defaultValue: true },
  { name: 'KeyPreview', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether the form will receive key events before the event is passed to the control that has focus.', defaultValue: false },
  { name: 'MDIChild', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value that determines whether the form is a Multiple Document Interface (MDI) child form.', defaultValue: false },
  { name: 'Moveable', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether the user can move the form.', defaultValue: true },
  { name: 'Font', type: 'font', category: 'Font', description: 'Returns a Font object.', defaultValue: JSON.stringify({ name: 'MS Sans Serif', size: 8 }) },
  { name: 'Tag', type: 'string', category: 'Data', description: 'Stores any extra data needed for your program.', defaultValue: '' },
  { name: 'HelpContextID', type: 'number', category: 'Misc', description: 'Returns/sets an associated context number for an object.', defaultValue: 0 },
  { name: 'WhatsThisHelp', type: 'boolean', category: 'Misc', description: 'Returns/sets a value indicating whether context-sensitive Help uses the What\'s This pop-up window.', defaultValue: false },
  { name: 'WhatsThisButton', type: 'boolean', category: 'Misc', description: 'Returns/sets a value indicating whether the What\'s This button appears in the title bar of the form.', defaultValue: false }
]);

PropertyManager.registerControlProperties('TextBox', [
  { name: 'Name', type: 'string', category: 'Design', description: 'Returns the name used in code to identify a text box.', readOnly: true },
  { name: 'Text', type: 'string', category: 'Data', description: 'Returns/sets the text contained in the control.', defaultValue: '' },
  { name: 'Left', type: 'number', category: 'Layout', description: 'Returns/sets the distance between the internal left edge of an object and the left edge of its container.', validation: { min: 0 } },
  { name: 'Top', type: 'number', category: 'Layout', description: 'Returns/sets the distance between the internal top edge of an object and the top edge of its container.', validation: { min: 0 } },
  { name: 'Width', type: 'number', category: 'Layout', description: 'Returns/sets the width of an object.', validation: { min: 0 } },
  { name: 'Height', type: 'number', category: 'Layout', description: 'Returns/sets the height of an object.', validation: { min: 0 } },
  { name: 'BackColor', type: 'color', category: 'Appearance', description: 'Returns/sets the background color of an object.', defaultValue: '#80000005' },
  { name: 'ForeColor', type: 'color', category: 'Appearance', description: 'Returns/sets the foreground color used to display text and graphics in an object.', defaultValue: '#80000008' },
  { name: 'BorderStyle', type: 'enum', category: 'Appearance', description: 'Returns/sets the border style for an object.', enumValues: ['0 - None', '1 - Fixed Single'], defaultValue: '1 - Fixed Single' },
  { name: 'Font', type: 'font', category: 'Font', description: 'Returns a Font object.', defaultValue: JSON.stringify({ name: 'MS Sans Serif', size: 8 }) },
  { name: 'Enabled', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value that determines whether an object can respond to user-generated events.', defaultValue: true },
  { name: 'Visible', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether an object is visible or hidden.', defaultValue: true },
  { name: 'TabStop', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether a user can use the TAB key to give the focus to an object.', defaultValue: true },
  { name: 'TabIndex', type: 'number', category: 'Behavior', description: 'Returns/sets the tab order of an object within its parent form.', validation: { min: 0 }, defaultValue: 0 },
  { name: 'Locked', type: 'boolean', category: 'Behavior', description: 'Determines whether a control can be edited.', defaultValue: false },
  { name: 'MaxLength', type: 'number', category: 'Behavior', description: 'Returns/sets the maximum number of characters that can be entered in a text box or the text portion of a combo box.', validation: { min: 0 }, defaultValue: 0 },
  { name: 'MultiLine', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether a text box control can accept and display multiple lines of text.', defaultValue: false },
  { name: 'PasswordChar', type: 'string', category: 'Behavior', description: 'Returns/sets a value indicating the character to display in place of the actual characters typed in a text box.', defaultValue: '' },
  { name: 'ScrollBars', type: 'enum', category: 'Behavior', description: 'Returns/sets a value indicating whether a text box has horizontal or vertical scroll bars.', enumValues: ['0 - None', '1 - Horizontal', '2 - Vertical', '3 - Both'], defaultValue: '0 - None' },
  { name: 'Alignment', type: 'enum', category: 'Appearance', description: 'Returns/sets a value that determines the alignment of text displayed in an object.', enumValues: ['0 - Left Justify', '1 - Right Justify', '2 - Center'], defaultValue: '0 - Left Justify' },
  { name: 'ToolTipText', type: 'string', category: 'Misc', description: 'Returns/sets the text displayed when the mouse is paused over the control.', defaultValue: '' },
  { name: 'Tag', type: 'string', category: 'Data', description: 'Stores any extra data needed for your program.', defaultValue: '' },
  { name: 'MousePointer', type: 'enum', category: 'Behavior', description: 'Returns/sets the type of mouse pointer displayed when over part of an object.', enumValues: ['0 - Default', '1 - Arrow', '2 - Cross', '3 - I-Beam', '4 - Icon', '5 - Size', '6 - Size NE SW', '7 - Size N S', '8 - Size NW SE', '9 - Size W E', '10 - Up Arrow', '11 - Hourglass', '12 - No Drop', '99 - Custom'], defaultValue: '0 - Default' },
  { name: 'CausesValidation', type: 'boolean', category: 'Misc', description: 'Returns/sets whether validation occurs on the control that is losing focus.', defaultValue: true },
  { name: 'OLEDragMode', type: 'enum', category: 'Misc', description: 'Returns/sets whether this control can act as an OLE drag/drop source.', enumValues: ['0 - None', '1 - Manual', '2 - Automatic'], defaultValue: '0 - None' },
  { name: 'OLEDropMode', type: 'enum', category: 'Misc', description: 'Returns/sets whether this control can act as an OLE drop target.', enumValues: ['0 - None', '1 - Manual', '2 - Accept'], defaultValue: '0 - None' },
  { name: 'RightToLeft', type: 'boolean', category: 'Misc', description: 'Determines text display direction and control visual appearance on a bidirectional system.', defaultValue: false },
  { name: 'HelpContextID', type: 'number', category: 'Misc', description: 'Returns/sets an associated context number for an object.', defaultValue: 0 },
  { name: 'WhatsThisHelpID', type: 'number', category: 'Misc', description: 'Returns/sets an associated context number for an object.', defaultValue: 0 }
]);

PropertyManager.registerControlProperties('CommandButton', [
  { name: 'Name', type: 'string', category: 'Design', description: 'Returns the name used in code to identify a command button.', readOnly: true },
  { name: 'Caption', type: 'string', category: 'Appearance', description: 'Returns/sets the text displayed in an object\'s title bar or below an object\'s icon.', defaultValue: 'Command1' },
  { name: 'Left', type: 'number', category: 'Layout', description: 'Returns/sets the distance between the internal left edge of an object and the left edge of its container.', validation: { min: 0 } },
  { name: 'Top', type: 'number', category: 'Layout', description: 'Returns/sets the distance between the internal top edge of an object and the top edge of its container.', validation: { min: 0 } },
  { name: 'Width', type: 'number', category: 'Layout', description: 'Returns/sets the width of an object.', validation: { min: 0 }, defaultValue: 75 },
  { name: 'Height', type: 'number', category: 'Layout', description: 'Returns/sets the height of an object.', validation: { min: 0 }, defaultValue: 25 },
  { name: 'BackColor', type: 'color', category: 'Appearance', description: 'Returns/sets the background color of an object.', defaultValue: '#8000000F' },
  { name: 'ForeColor', type: 'color', category: 'Appearance', description: 'Returns/sets the foreground color used to display text and graphics in an object.', defaultValue: '#80000012' },
  { name: 'Font', type: 'font', category: 'Font', description: 'Returns a Font object.', defaultValue: JSON.stringify({ name: 'MS Sans Serif', size: 8 }) },
  { name: 'Enabled', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value that determines whether an object can respond to user-generated events.', defaultValue: true },
  { name: 'Visible', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether an object is visible or hidden.', defaultValue: true },
  { name: 'TabStop', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether a user can use the TAB key to give the focus to an object.', defaultValue: true },
  { name: 'TabIndex', type: 'number', category: 'Behavior', description: 'Returns/sets the tab order of an object within its parent form.', validation: { min: 0 }, defaultValue: 0 },
  { name: 'Default', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value that determines whether a command button is the default button.', defaultValue: false },
  { name: 'Cancel', type: 'boolean', category: 'Behavior', description: 'Returns/sets a value indicating whether a command button is the Cancel button.', defaultValue: false },
  { name: 'Picture', type: 'picture', category: 'Appearance', description: 'Returns/sets a graphic to be displayed in a control.', defaultValue: '' },
  { name: 'Style', type: 'enum', category: 'Appearance', description: 'Returns/sets a value that determines whether a command button displays text or graphics.', enumValues: ['0 - Standard', '1 - Graphical'], defaultValue: '0 - Standard' },
  { name: 'ToolTipText', type: 'string', category: 'Misc', description: 'Returns/sets the text displayed when the mouse is paused over the control.', defaultValue: '' },
  { name: 'Tag', type: 'string', category: 'Data', description: 'Stores any extra data needed for your program.', defaultValue: '' },
  { name: 'MousePointer', type: 'enum', category: 'Behavior', description: 'Returns/sets the type of mouse pointer displayed when over part of an object.', enumValues: ['0 - Default', '1 - Arrow', '2 - Cross', '3 - I-Beam', '4 - Icon', '5 - Size', '6 - Size NE SW', '7 - Size N S', '8 - Size NW SE', '9 - Size W E', '10 - Up Arrow', '11 - Hourglass', '12 - No Drop', '99 - Custom'], defaultValue: '0 - Default' },
  { name: 'CausesValidation', type: 'boolean', category: 'Misc', description: 'Returns/sets whether validation occurs on the control that is losing focus.', defaultValue: true },
  { name: 'OLEDragMode', type: 'enum', category: 'Misc', description: 'Returns/sets whether this control can act as an OLE drag/drop source.', enumValues: ['0 - None', '1 - Manual', '2 - Automatic'], defaultValue: '0 - None' },
  { name: 'OLEDropMode', type: 'enum', category: 'Misc', description: 'Returns/sets whether this control can act as an OLE drop target.', enumValues: ['0 - None', '1 - Manual', '2 - Accept'], defaultValue: '0 - None' },
  { name: 'RightToLeft', type: 'boolean', category: 'Misc', description: 'Determines text display direction and control visual appearance on a bidirectional system.', defaultValue: false },
  { name: 'HelpContextID', type: 'number', category: 'Misc', description: 'Returns/sets an associated context number for an object.', defaultValue: 0 },
  { name: 'WhatsThisHelpID', type: 'number', category: 'Misc', description: 'Returns/sets an associated context number for an object.', defaultValue: 0 },
  { name: 'UseMaskColor', type: 'boolean', category: 'Appearance', description: 'Returns/sets a value that determines whether bitmap graphics in a button are displayed with a transparent background.', defaultValue: false },
  { name: 'MaskColor', type: 'color', category: 'Appearance', description: 'Returns/sets the color in a bitmap graphic that will appear transparent.', defaultValue: '#C0C0C0' }
]);

// Export for use in other components
export default PropertyManager;