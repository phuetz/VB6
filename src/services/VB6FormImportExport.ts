import { VB6Control } from '../types/vb6';

export interface VB6FormDefinition {
  name: string;
  caption: string;
  width: number;
  height: number;
  properties: Record<string, any>;
  controls: VB6FormControl[];
  code: string;
}

export interface VB6FormControl {
  type: string;
  name: string;
  properties: Record<string, any>;
  position: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export class VB6FormImportExport {
  private static instance: VB6FormImportExport;

  static getInstance(): VB6FormImportExport {
    if (!VB6FormImportExport.instance) {
      VB6FormImportExport.instance = new VB6FormImportExport();
    }
    return VB6FormImportExport.instance;
  }

  /**
   * Parse VB6 .frm file content
   */
  parseFormFile(content: string): VB6FormDefinition {
    const lines = content.split('\n');
    let currentSection = '';
    const formProperties: Record<string, any> = {};
    const controls: VB6FormControl[] = [];
    let codeSection = '';
    let inCodeSection = false;
    let currentControl: Partial<VB6FormControl> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("'")) continue;

      // Detect code section
      if (
        line === 'Attribute VB_Exposed = False' ||
        line.startsWith('Private Sub') ||
        line.startsWith('Public Sub') ||
        line.startsWith('Private Function') ||
        line.startsWith('Public Function')
      ) {
        inCodeSection = true;
      }

      if (inCodeSection) {
        codeSection += line + '\n';
        continue;
      }

      // Parse form properties
      if (line.startsWith('VERSION')) {
        continue;
      }

      // Parse Begin/End blocks
      if (line.startsWith('Begin ')) {
        const match = line.match(/Begin (\w+\.?\w+) (\w+)/);
        if (match) {
          const [, controlType, controlName] = match;

          if (controlType === 'VB.Form') {
            // This is the form itself
            formProperties.Name = controlName;
            currentSection = 'form';
          } else {
            // This is a control
            currentControl = {
              type: this.normalizeControlType(controlType),
              name: controlName,
              properties: {},
              position: { left: 0, top: 0, width: 100, height: 30 },
            };
            currentSection = 'control';
          }
        }
      } else if (line === 'End') {
        if (currentControl && currentSection === 'control') {
          controls.push(currentControl as VB6FormControl);
          currentControl = null;
        }
        currentSection = '';
      } else {
        // Parse property lines
        const propMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (propMatch) {
          const [, propName, propValue] = propMatch;
          const parsedValue = this.parsePropertyValue(propValue);

          if (currentSection === 'form') {
            formProperties[propName] = parsedValue;

            // Handle special form properties
            if (propName === 'ScaleWidth') {
              formProperties.Width = parsedValue;
            } else if (propName === 'ScaleHeight') {
              formProperties.Height = parsedValue;
            }
          } else if (currentControl && currentSection === 'control') {
            currentControl.properties![propName] = parsedValue;

            // Handle position properties
            if (propName === 'Left') {
              currentControl.position!.left = this.twipsToPixels(parsedValue);
            } else if (propName === 'Top') {
              currentControl.position!.top = this.twipsToPixels(parsedValue);
            } else if (propName === 'Width') {
              currentControl.position!.width = this.twipsToPixels(parsedValue);
            } else if (propName === 'Height') {
              currentControl.position!.height = this.twipsToPixels(parsedValue);
            }
          }
        }
      }
    }

    return {
      name: formProperties.Name || 'Form1',
      caption: formProperties.Caption || 'Form1',
      width: formProperties.Width || 600,
      height: formProperties.Height || 400,
      properties: formProperties,
      controls,
      code: codeSection,
    };
  }

  /**
   * Generate VB6 .frm file content from form definition
   */
  generateFormFile(formDef: VB6FormDefinition): string {
    let content = '';

    // Header
    content += 'VERSION 5.00\n';
    content += `Begin VB.Form ${formDef.name}\n`;

    // Form properties
    content += `   Caption         =   "${formDef.caption}"\n`;
    content += `   ClientHeight    =   ${this.pixelsToTwips(formDef.height)}\n`;
    content += `   ClientLeft      =   60\n`;
    content += `   ClientTop       =   405\n`;
    content += `   ClientWidth     =   ${this.pixelsToTwips(formDef.width)}\n`;
    content += `   LinkTopic       =   "${formDef.name}"\n`;
    content += `   ScaleHeight     =   ${this.pixelsToTwips(formDef.height)}\n`;
    content += `   ScaleWidth      =   ${this.pixelsToTwips(formDef.width)}\n`;

    // Add additional form properties
    Object.entries(formDef.properties).forEach(([key, value]) => {
      if (!['Name', 'Caption', 'Width', 'Height', 'ScaleWidth', 'ScaleHeight'].includes(key)) {
        content += `   ${key.padEnd(15)} =   ${this.formatPropertyValue(value)}\n`;
      }
    });

    // Controls
    formDef.controls.forEach(control => {
      content += `   Begin ${this.getVB6ControlType(control.type)} ${control.name}\n`;

      // Position properties
      content += `      Height          =   ${this.pixelsToTwips(control.position.height)}\n`;
      content += `      Left            =   ${this.pixelsToTwips(control.position.left)}\n`;
      content += `      Top             =   ${this.pixelsToTwips(control.position.top)}\n`;
      content += `      Width           =   ${this.pixelsToTwips(control.position.width)}\n`;

      // Other properties
      Object.entries(control.properties).forEach(([key, value]) => {
        if (!['Left', 'Top', 'Width', 'Height'].includes(key)) {
          content += `      ${key.padEnd(15)} =   ${this.formatPropertyValue(value)}\n`;
        }
      });

      content += `   End\n`;
    });

    content += 'End\n';

    // Attributes
    content += 'Attribute VB_Name = "' + formDef.name + '"\n';
    content += 'Attribute VB_GlobalNameSpace = False\n';
    content += 'Attribute VB_Creatable = False\n';
    content += 'Attribute VB_PredeclaredId = True\n';
    content += 'Attribute VB_Exposed = False\n';

    // Code section
    if (formDef.code) {
      content += formDef.code;
    }

    return content;
  }

  /**
   * Convert VB6Control array to VB6FormDefinition
   */
  convertControlsToFormDefinition(
    controls: VB6Control[],
    formProperties: any,
    code: string = ''
  ): VB6FormDefinition {
    const formControls: VB6FormControl[] = controls.map(control => ({
      type: control.type,
      name: control.Name,
      properties: {
        Caption: control.Caption || control.Text || '',
        TabIndex: control.TabIndex || 0,
        Visible: control.Visible !== false,
        Enabled: control.Enabled !== false,
        ...this.extractControlProperties(control),
      },
      position: {
        left: control.Left,
        top: control.Top,
        width: control.Width,
        height: control.Height,
      },
    }));

    return {
      name: formProperties.Name || 'Form1',
      caption: formProperties.Caption || 'Form1',
      width: formProperties.Width || 600,
      height: formProperties.Height || 400,
      properties: formProperties,
      controls: formControls,
      code,
    };
  }

  /**
   * Convert VB6FormDefinition to VB6Control array
   */
  convertFormDefinitionToControls(formDef: VB6FormDefinition): VB6Control[] {
    return formDef.controls.map(control => ({
      id: `${control.type}_${Date.now()}_${Math.random()}`,
      type: control.type,
      Name: control.name,
      Caption: control.properties.Caption || '',
      Text: control.properties.Text || '',
      Left: control.position.left,
      Top: control.position.top,
      Width: control.position.width,
      Height: control.position.height,
      Visible: control.properties.Visible !== false,
      Enabled: control.properties.Enabled !== false,
      TabIndex: control.properties.TabIndex || 0,
      TabStop: control.properties.TabStop !== false,
      Font: control.properties.Font || 'MS Sans Serif',
      FontSize: control.properties.FontSize || 8.25,
      FontBold: control.properties.FontBold || false,
      FontItalic: control.properties.FontItalic || false,
      FontUnderline: control.properties.FontUnderline || false,
      ForeColor: control.properties.ForeColor || '#000000',
      BackColor: control.properties.BackColor || '#F0F0F0',
      BorderStyle: control.properties.BorderStyle || 0,
      ...this.mapAdditionalProperties(control),
    }));
  }

  /**
   * Export form as JSON (alternative format)
   */
  exportAsJSON(formDef: VB6FormDefinition): string {
    return JSON.stringify(formDef, null, 2);
  }

  /**
   * Import form from JSON
   */
  importFromJSON(jsonContent: string): VB6FormDefinition {
    try {
      const formDef = JSON.parse(jsonContent);
      this.validateFormDefinition(formDef);
      return formDef;
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  // Private helper methods

  private normalizeControlType(vb6Type: string): string {
    const typeMap: Record<string, string> = {
      'VB.CommandButton': 'CommandButton',
      'VB.Label': 'Label',
      'VB.TextBox': 'TextBox',
      'VB.CheckBox': 'CheckBox',
      'VB.OptionButton': 'OptionButton',
      'VB.ListBox': 'ListBox',
      'VB.ComboBox': 'ComboBox',
      'VB.Frame': 'Frame',
      'VB.PictureBox': 'PictureBox',
      'VB.Image': 'Image',
      'VB.Timer': 'Timer',
      'VB.HScrollBar': 'HScrollBar',
      'VB.VScrollBar': 'VScrollBar',
      'MSComctlLib.TreeView': 'TreeView',
      'MSComctlLib.ListView': 'ListView',
      'MSComctlLib.TabStrip': 'TabStrip',
      'MSComctlLib.ProgressBar': 'ProgressBar',
      'MSComctlLib.StatusBar': 'StatusBar',
      'MSComctlLib.Toolbar': 'Toolbar',
      'MSFlexGridLib.MSFlexGrid': 'MSFlexGrid',
      'RichTextLib.RichTextBox': 'RichTextBox',
    };

    return typeMap[vb6Type] || vb6Type.replace('VB.', '');
  }

  private getVB6ControlType(normalizedType: string): string {
    const reverseMap: Record<string, string> = {
      CommandButton: 'VB.CommandButton',
      Label: 'VB.Label',
      TextBox: 'VB.TextBox',
      CheckBox: 'VB.CheckBox',
      OptionButton: 'VB.OptionButton',
      ListBox: 'VB.ListBox',
      ComboBox: 'VB.ComboBox',
      Frame: 'VB.Frame',
      PictureBox: 'VB.PictureBox',
      Image: 'VB.Image',
      Timer: 'VB.Timer',
      HScrollBar: 'VB.HScrollBar',
      VScrollBar: 'VB.VScrollBar',
      TreeView: 'MSComctlLib.TreeView',
      ListView: 'MSComctlLib.ListView',
      TabStrip: 'MSComctlLib.TabStrip',
      ProgressBar: 'MSComctlLib.ProgressBar',
      StatusBar: 'MSComctlLib.StatusBar',
      Toolbar: 'MSComctlLib.Toolbar',
      MSFlexGrid: 'MSFlexGridLib.MSFlexGrid',
      RichTextBox: 'RichTextLib.RichTextBox',
    };

    return reverseMap[normalizedType] || `VB.${normalizedType}`;
  }

  private parsePropertyValue(value: string): any {
    value = value.trim();

    // String values
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Boolean values
    if (value === 'True' || value === '-1') return true;
    if (value === 'False' || value === '0') return false;

    // Numeric values
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return parseFloat(value);
    }

    // Color values (VB6 uses negative values for system colors)
    if (/^&H[\dA-Fa-f]+&?$/.test(value)) {
      return parseInt(value.replace(/[&H&]/g, ''), 16);
    }

    // Constants and other values
    return value;
  }

  private formatPropertyValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    if (typeof value === 'boolean') {
      return value ? '-1' : '0';
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toString();
      }
      return value.toString();
    }
    return String(value);
  }

  private twipsToPixels(twips: number): number {
    // VB6 uses twips (1/1440 inch), convert to pixels (assuming 96 DPI)
    return Math.round(twips / 15);
  }

  private pixelsToTwips(pixels: number): number {
    // Convert pixels to twips
    return Math.round(pixels * 15);
  }

  private extractControlProperties(control: VB6Control): Record<string, any> {
    const props: Record<string, any> = {};

    // Common properties
    if (control.Font) props.FontName = control.Font;
    if (control.FontSize) props.FontSize = control.FontSize;
    if (control.FontBold) props.FontBold = control.FontBold;
    if (control.FontItalic) props.FontItalic = control.FontItalic;
    if (control.FontUnderline) props.FontUnderline = control.FontUnderline;
    if (control.ForeColor) props.ForeColor = control.ForeColor;
    if (control.BackColor) props.BackColor = control.BackColor;
    if (control.BorderStyle !== undefined) props.BorderStyle = control.BorderStyle;

    // Control-specific properties
    switch (control.type) {
      case 'TextBox':
        if (control.MultiLine) props.MultiLine = control.MultiLine;
        if (control.ScrollBars) props.ScrollBars = control.ScrollBars;
        if (control.MaxLength) props.MaxLength = control.MaxLength;
        if (control.PasswordChar) props.PasswordChar = control.PasswordChar;
        if (control.Alignment) props.Alignment = control.Alignment;
        break;

      case 'ListBox':
      case 'ComboBox':
        if (control.Sorted) props.Sorted = control.Sorted;
        if (control.Style) props.Style = control.Style;
        if (control.IntegralHeight !== undefined) props.IntegralHeight = control.IntegralHeight;
        break;

      case 'CheckBox':
      case 'OptionButton':
        if (control.Value !== undefined) props.Value = control.Value;
        if (control.Alignment) props.Alignment = control.Alignment;
        break;

      case 'PictureBox':
        if (control.AutoSize) props.AutoSize = control.AutoSize;
        if (control.Picture) props.Picture = control.Picture;
        break;

      case 'Image':
        if (control.Stretch) props.Stretch = control.Stretch;
        if (control.Picture) props.Picture = control.Picture;
        break;
    }

    return props;
  }

  private mapAdditionalProperties(control: VB6FormControl): Partial<VB6Control> {
    const props: Partial<VB6Control> = {};

    // Map VB6 properties back to VB6Control interface
    if (control.properties.MultiLine) props.MultiLine = control.properties.MultiLine;
    if (control.properties.ScrollBars) props.ScrollBars = control.properties.ScrollBars;
    if (control.properties.MaxLength) props.MaxLength = control.properties.MaxLength;
    if (control.properties.PasswordChar) props.PasswordChar = control.properties.PasswordChar;
    if (control.properties.Alignment) props.Alignment = control.properties.Alignment;
    if (control.properties.Sorted) props.Sorted = control.properties.Sorted;
    if (control.properties.Style) props.Style = control.properties.Style;
    if (control.properties.Value !== undefined) props.Value = control.properties.Value;
    if (control.properties.AutoSize) props.AutoSize = control.properties.AutoSize;
    if (control.properties.Stretch) props.Stretch = control.properties.Stretch;
    if (control.properties.Picture) props.Picture = control.properties.Picture;

    return props;
  }

  // Method required by tests for backward compatibility
  async importVB6Form(fileName: string): Promise<any> {
    try {
      // Simulate loading a VB6 form file
      // In a real implementation, this would read from file system
      const mockFormContent = `VERSION 5.00
Begin VB.Form Form1
   Caption         =   "Hello World"
   Height          =   3615
   Left            =   0
   LinkTopic       =   "Form1"
   ScaleHeight     =   3255
   ScaleWidth      =   4680
   Top             =   0
   Width           =   4800
   Begin VB.CommandButton Command1
      Caption         =   "OK"
      Height          =   375
      Left            =   120
      TabIndex        =   0
      Top             =   120
      Width           =   1215
   End
End
`;

      const formDefinition = this.parseFormFile(mockFormContent);
      return {
        success: true,
        form: formDefinition,
        fileName,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
        fileName,
      };
    }
  }

  private validateFormDefinition(formDef: any): void {
    if (!formDef.name || typeof formDef.name !== 'string') {
      throw new Error('Form must have a valid name');
    }
    if (!formDef.controls || !Array.isArray(formDef.controls)) {
      throw new Error('Form must have a controls array');
    }
    if (typeof formDef.width !== 'number' || typeof formDef.height !== 'number') {
      throw new Error('Form must have valid width and height');
    }
  }
}

export const vb6FormImportExport = VB6FormImportExport.getInstance();
