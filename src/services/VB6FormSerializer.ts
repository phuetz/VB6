/**
 * VB6 Form Serializer
 * Handles saving and loading VB6 .frm files
 * Provides full compatibility with VB6 form format
 */

import { Control } from '../context/types';

// ============================================================================
// Types
// ============================================================================

export interface VB6FormHeader {
  version: string;
  objectType: string;
  name: string;
  caption: string;
}

export interface VB6FormProperties {
  [key: string]: string | number | boolean;
}

export interface VB6ControlDefinition {
  type: string;
  name: string;
  index?: number;
  properties: VB6FormProperties;
  children?: VB6ControlDefinition[];
}

export interface VB6FormDefinition {
  header: VB6FormHeader;
  properties: VB6FormProperties;
  controls: VB6ControlDefinition[];
  code: string;
}

export interface VB6MenuDefinition {
  name: string;
  caption: string;
  index?: number;
  checked?: boolean;
  enabled?: boolean;
  visible?: boolean;
  shortcut?: string;
  children?: VB6MenuDefinition[];
}

// ============================================================================
// VB6 Form Parser
// ============================================================================

export class VB6FormParser {
  private lines: string[] = [];
  private currentLine: number = 0;

  /**
   * Parse a VB6 .frm file content
   */
  parse(content: string): VB6FormDefinition {
    this.lines = content.split(/\r?\n/);
    this.currentLine = 0;

    const header = this.parseHeader();
    const { properties, controls, menus } = this.parseFormBody();
    const code = this.parseCode();

    return {
      header,
      properties: { ...properties, menus },
      controls,
      code,
    };
  }

  private parseHeader(): VB6FormHeader {
    const header: VB6FormHeader = {
      version: '5.00',
      objectType: 'Form',
      name: 'Form1',
      caption: 'Form1',
    };

    // Parse VERSION line
    const versionLine = this.lines[this.currentLine];
    if (versionLine?.startsWith('VERSION')) {
      const match = versionLine.match(/VERSION\s+(\d+\.\d+)/);
      if (match) header.version = match[1];
      this.currentLine++;
    }

    // Parse Object references
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine].trim();
      if (line.startsWith('Object')) {
        this.currentLine++;
        continue;
      }
      break;
    }

    return header;
  }

  private parseFormBody(): {
    properties: VB6FormProperties;
    controls: VB6ControlDefinition[];
    menus: VB6MenuDefinition[];
  } {
    const properties: VB6FormProperties = {};
    const controls: VB6ControlDefinition[] = [];
    const menus: VB6MenuDefinition[] = [];

    // Find Begin Form line
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine].trim();
      if (line.startsWith('Begin VB.Form') || line.startsWith('Begin Form')) {
        const nameMatch = line.match(/Begin\s+(?:VB\.)?Form\s+(\w+)/);
        if (nameMatch) properties.Name = nameMatch[1];
        this.currentLine++;
        break;
      }
      this.currentLine++;
    }

    // Parse form content
    let indentLevel = 1;

    while (this.currentLine < this.lines.length && indentLevel > 0) {
      const line = this.lines[this.currentLine];
      const trimmedLine = line.trim();

      if (trimmedLine === 'End') {
        indentLevel--;
        this.currentLine++;
        continue;
      }

      if (trimmedLine.startsWith('Begin VB.Menu')) {
        const menu = this.parseMenu();
        menus.push(menu);
        continue;
      }

      if (trimmedLine.startsWith('Begin ')) {
        const control = this.parseControl();
        controls.push(control);
        continue;
      }

      // Parse property
      const propMatch = trimmedLine.match(/^(\w+)\s*=\s*(.+)$/);
      if (propMatch) {
        properties[propMatch[1]] = this.parseValue(propMatch[2]);
      }

      this.currentLine++;
    }

    return { properties, controls, menus };
  }

  private parseControl(): VB6ControlDefinition {
    const line = this.lines[this.currentLine].trim();
    const match = line.match(/Begin\s+(\S+)\s+(\w+)(?:\((\d+)\))?/);

    const control: VB6ControlDefinition = {
      type: match ? match[1].replace('VB.', '') : 'Unknown',
      name: match ? match[2] : 'Unknown',
      index: match && match[3] ? parseInt(match[3]) : undefined,
      properties: {},
      children: [],
    };

    this.currentLine++;

    while (this.currentLine < this.lines.length) {
      const currentLine = this.lines[this.currentLine].trim();

      if (currentLine === 'End') {
        this.currentLine++;
        break;
      }

      if (currentLine.startsWith('Begin ')) {
        const child = this.parseControl();
        control.children?.push(child);
        continue;
      }

      const propMatch = currentLine.match(/^(\w+)\s*=\s*(.+)$/);
      if (propMatch) {
        control.properties[propMatch[1]] = this.parseValue(propMatch[2]);
      }

      this.currentLine++;
    }

    return control;
  }

  private parseMenu(): VB6MenuDefinition {
    const line = this.lines[this.currentLine].trim();
    const match = line.match(/Begin\s+VB\.Menu\s+(\w+)(?:\((\d+)\))?/);

    const menu: VB6MenuDefinition = {
      name: match ? match[1] : 'Unknown',
      caption: '',
      index: match && match[2] ? parseInt(match[2]) : undefined,
      children: [],
    };

    this.currentLine++;

    while (this.currentLine < this.lines.length) {
      const currentLine = this.lines[this.currentLine].trim();

      if (currentLine === 'End') {
        this.currentLine++;
        break;
      }

      if (currentLine.startsWith('Begin VB.Menu')) {
        const child = this.parseMenu();
        menu.children?.push(child);
        continue;
      }

      const propMatch = currentLine.match(/^(\w+)\s*=\s*(.+)$/);
      if (propMatch) {
        const [, key, value] = propMatch;
        switch (key) {
          case 'Caption':
            menu.caption = this.parseStringValue(value);
            break;
          case 'Checked':
            menu.checked = value === '-1' || value.toLowerCase() === 'true';
            break;
          case 'Enabled':
            menu.enabled = value !== '0' && value.toLowerCase() !== 'false';
            break;
          case 'Visible':
            menu.visible = value !== '0' && value.toLowerCase() !== 'false';
            break;
          case 'Shortcut':
            menu.shortcut = this.parseStringValue(value);
            break;
        }
      }

      this.currentLine++;
    }

    return menu;
  }

  private parseCode(): string {
    // Find Attribute VB_Name or first code
    while (this.currentLine < this.lines.length) {
      const line = this.lines[this.currentLine];
      if (
        line.startsWith('Attribute') ||
        line.startsWith('Option') ||
        line.startsWith('Private') ||
        line.startsWith('Public') ||
        line.startsWith('Sub') ||
        line.startsWith("'")
      ) {
        break;
      }
      this.currentLine++;
    }

    // Collect remaining lines as code
    const codeLines = this.lines.slice(this.currentLine);

    // Filter out Attribute lines (VB6 metadata)
    const filteredCode = codeLines.filter(line => !line.startsWith('Attribute VB_'));

    return filteredCode.join('\r\n');
  }

  private parseValue(value: string): string | number | boolean {
    value = value.trim();

    // Boolean
    if (value === '-1' || value.toLowerCase() === 'true') return true;
    if (value === '0' || value.toLowerCase() === 'false') return false;

    // String
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    // Hex number
    if (value.startsWith('&H')) {
      return parseInt(value.slice(2), 16);
    }

    // Number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;

    return value;
  }

  private parseStringValue(value: string): string {
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }
}

// ============================================================================
// VB6 Form Generator
// ============================================================================

export class VB6FormGenerator {
  private indentLevel: number = 0;
  private output: string[] = [];

  /**
   * Generate VB6 .frm file content from form definition
   */
  generate(form: VB6FormDefinition): string {
    this.output = [];
    this.indentLevel = 0;

    // Version header
    this.writeLine('VERSION 5.00');

    // Object references (for ActiveX controls)
    this.writeObjectReferences(form.controls);

    // Form begin
    this.writeLine(`Begin VB.Form ${form.header.name}`);
    this.indentLevel++;

    // Form properties
    this.writeProperties(form.properties);

    // Controls
    for (const control of form.controls) {
      this.writeControl(control);
    }

    // Menus
    const menus = form.properties.menus as VB6MenuDefinition[] | undefined;
    if (menus && Array.isArray(menus)) {
      for (const menu of menus) {
        this.writeMenu(menu);
      }
    }

    // Form end
    this.indentLevel--;
    this.writeLine('End');

    // Attributes
    this.writeLine(`Attribute VB_Name = "${form.header.name}"`);
    this.writeLine('Attribute VB_GlobalNameSpace = False');
    this.writeLine('Attribute VB_Creatable = False');
    this.writeLine('Attribute VB_PredeclaredId = True');
    this.writeLine('Attribute VB_Exposed = False');

    // Code
    if (form.code) {
      this.writeLine(form.code);
    }

    return this.output.join('\r\n');
  }

  /**
   * Generate from Controls array
   */
  generateFromControls(
    formName: string,
    formCaption: string,
    controls: Control[],
    formProperties: VB6FormProperties = {},
    code: string = ''
  ): string {
    const form: VB6FormDefinition = {
      header: {
        version: '5.00',
        objectType: 'Form',
        name: formName,
        caption: formCaption,
      },
      properties: {
        Caption: formCaption,
        ClientHeight: formProperties.ClientHeight || 3600,
        ClientLeft: formProperties.ClientLeft || 60,
        ClientTop: formProperties.ClientTop || 450,
        ClientWidth: formProperties.ClientWidth || 4800,
        ScaleHeight: formProperties.ScaleHeight || 3600,
        ScaleWidth: formProperties.ScaleWidth || 4800,
        StartUpPosition: formProperties.StartUpPosition || 3,
        ...formProperties,
      },
      controls: controls.map(c => this.controlToDefinition(c)),
      code,
    };

    return this.generate(form);
  }

  private controlToDefinition(control: Control): VB6ControlDefinition {
    const properties: VB6FormProperties = {};

    // Convert pixel coordinates to twips (1 pixel = 15 twips)
    const pixelToTwips = (px: number) => Math.round(px * 15);

    // Standard properties
    if (control.left !== undefined) properties.Left = pixelToTwips(control.left);
    if (control.top !== undefined) properties.Top = pixelToTwips(control.top);
    if (control.width !== undefined) properties.Width = pixelToTwips(control.width);
    if (control.height !== undefined) properties.Height = pixelToTwips(control.height);

    // Copy all other properties
    const props = control.properties || control;
    for (const [key, value] of Object.entries(props)) {
      if (
        !['id', 'type', 'name', 'left', 'top', 'width', 'height', 'events', 'properties'].includes(
          key
        )
      ) {
        properties[this.capitalizeFirst(key)] = value;
      }
    }

    return {
      type: this.mapControlType(control.type),
      name: control.name,
      properties,
    };
  }

  private mapControlType(type: string): string {
    const typeMap: Record<string, string> = {
      TextBox: 'VB.TextBox',
      Label: 'VB.Label',
      CommandButton: 'VB.CommandButton',
      CheckBox: 'VB.CheckBox',
      OptionButton: 'VB.OptionButton',
      ComboBox: 'VB.ComboBox',
      ListBox: 'VB.ListBox',
      Frame: 'VB.Frame',
      PictureBox: 'VB.PictureBox',
      Image: 'VB.Image',
      Timer: 'VB.Timer',
      HScrollBar: 'VB.HScrollBar',
      VScrollBar: 'VB.VScrollBar',
      DriveListBox: 'VB.DriveListBox',
      DirListBox: 'VB.DirListBox',
      FileListBox: 'VB.FileListBox',
      Shape: 'VB.Shape',
      Line: 'VB.Line',
      Data: 'VB.Data',
      OLE: 'VB.OLE',
      Menu: 'VB.Menu',
      // Common controls
      TreeView: 'MSComctlLib.TreeCtrl',
      ListView: 'MSComctlLib.ListViewCtrl',
      ProgressBar: 'MSComctlLib.ProgressBar',
      Slider: 'MSComctlLib.Slider',
      StatusBar: 'MSComctlLib.StatusBar',
      Toolbar: 'MSComctlLib.Toolbar',
      TabStrip: 'MSComctlLib.TabStrip',
      ImageList: 'MSComctlLib.ImageListCtrl',
      // Data controls
      MSFlexGrid: 'MSFlexGridLib.MSFlexGrid',
      MSHFlexGrid: 'MSHierarchicalFlexGridLib.MSHFlexGrid',
      DataGrid: 'MSDataGridLib.DataGrid',
      ADODC: 'MSAdodcLib.Adodc',
      // RichText
      RichTextBox: 'RichTextLib.RichTextBox',
      // Common dialog
      CommonDialog: 'MSComDlg.CommonDialog',
    };

    return typeMap[type] || `VB.${type}`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private writeObjectReferences(controls: VB6ControlDefinition[]): void {
    const refs = new Set<string>();

    const addRef = (type: string) => {
      if (type.includes('MSComctlLib')) {
        refs.add('Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"');
      }
      if (type.includes('MSFlexGridLib')) {
        refs.add('Object = "{5E9E78A0-531B-11CF-91F6-C2863C385E30}#1.0#0"; "MSFLXGRD.OCX"');
      }
      if (type.includes('RichTextLib')) {
        refs.add('Object = "{3B7C8863-D78F-101B-B9B5-04021C009402}#1.2#0"; "RICHTX32.OCX"');
      }
      if (type.includes('MSComDlg')) {
        refs.add('Object = "{F9043C88-F6F2-101A-A3C9-08002B2F49FB}#1.2#0"; "COMDLG32.OCX"');
      }
      if (type.includes('MSAdodcLib')) {
        refs.add('Object = "{67397AA1-7FB1-11D0-B148-00A0C922E820}#6.0#0"; "MSADODC.OCX"');
      }
    };

    const scanControls = (ctrls: VB6ControlDefinition[]) => {
      for (const ctrl of ctrls) {
        addRef(ctrl.type);
        if (ctrl.children) scanControls(ctrl.children);
      }
    };

    scanControls(controls);

    refs.forEach(ref => this.writeLine(ref));
  }

  private writeProperties(props: VB6FormProperties): void {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'menus') continue;
      this.writeProperty(key, value);
    }
  }

  private writeProperty(name: string, value: string | number | boolean): void {
    let formatted: string;

    if (typeof value === 'boolean') {
      formatted = value ? "-1  'True" : "0   'False";
    } else if (typeof value === 'number') {
      if (name.includes('Color') || name === 'BackColor' || name === 'ForeColor') {
        formatted = `&H${value.toString(16).toUpperCase().padStart(8, '0')}&`;
      } else {
        formatted = value.toString();
      }
    } else if (typeof value === 'string') {
      formatted = `"${value}"`;
    } else {
      formatted = String(value);
    }

    this.writeLine(`${name.padEnd(16)}=   ${formatted}`);
  }

  private writeControl(control: VB6ControlDefinition): void {
    const indexPart = control.index !== undefined ? `(${control.index})` : '';
    this.writeLine(`Begin ${control.type} ${control.name}${indexPart}`);
    this.indentLevel++;

    this.writeProperties(control.properties);

    if (control.children) {
      for (const child of control.children) {
        this.writeControl(child);
      }
    }

    this.indentLevel--;
    this.writeLine('End');
  }

  private writeMenu(menu: VB6MenuDefinition): void {
    const indexPart = menu.index !== undefined ? `(${menu.index})` : '';
    this.writeLine(`Begin VB.Menu ${menu.name}${indexPart}`);
    this.indentLevel++;

    this.writeProperty('Caption', menu.caption);
    if (menu.checked) this.writeProperty('Checked', true);
    if (menu.enabled === false) this.writeProperty('Enabled', false);
    if (menu.visible === false) this.writeProperty('Visible', false);
    if (menu.shortcut) this.writeProperty('Shortcut', menu.shortcut);

    if (menu.children) {
      for (const child of menu.children) {
        this.writeMenu(child);
      }
    }

    this.indentLevel--;
    this.writeLine('End');
  }

  private writeLine(text: string): void {
    const indent = '   '.repeat(this.indentLevel);
    this.output.push(indent + text);
  }
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Parse a VB6 .frm file
 */
export function parseVB6Form(content: string): VB6FormDefinition {
  const parser = new VB6FormParser();
  return parser.parse(content);
}

/**
 * Generate a VB6 .frm file
 */
export function generateVB6Form(form: VB6FormDefinition): string {
  const generator = new VB6FormGenerator();
  return generator.generate(form);
}

/**
 * Generate VB6 .frm from Controls
 */
export function generateVB6FormFromControls(
  formName: string,
  formCaption: string,
  controls: Control[],
  formProperties?: VB6FormProperties,
  code?: string
): string {
  const generator = new VB6FormGenerator();
  return generator.generateFromControls(formName, formCaption, controls, formProperties, code);
}

/**
 * Convert VB6 form definition to Controls array
 */
export function vb6FormToControls(form: VB6FormDefinition): Control[] {
  const twipsToPixel = (twips: number) => Math.round(twips / 15);

  let idCounter = 1;

  const convertControl = (def: VB6ControlDefinition): Control => {
    const props = def.properties;

    const control: Control = {
      id: idCounter++,
      type: def.type.replace('VB.', '').replace(/Lib\.\w+$/, ''),
      name: def.name,
      left: twipsToPixel((props.Left as number) || 0),
      top: twipsToPixel((props.Top as number) || 0),
      width: twipsToPixel((props.Width as number) || 100),
      height: twipsToPixel((props.Height as number) || 25),
      properties: {},
    };

    // Copy properties
    for (const [key, value] of Object.entries(props)) {
      if (!['Left', 'Top', 'Width', 'Height'].includes(key)) {
        control.properties![key.toLowerCase()] = value;
      }
    }

    return control;
  };

  return form.controls.map(convertControl);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  VB6FormParser,
  VB6FormGenerator,
  parseVB6Form,
  generateVB6Form,
  generateVB6FormFromControls,
  vb6FormToControls,
};
