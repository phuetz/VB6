/**
 * Sample User Controls - Example VB6 User Control Definitions
 * Demonstrates how to create and register custom user controls
 */

import { UserControlDefinition, VB6UserControlManagerInstance } from '../services/VB6UserControlManager';

// Sample User Control 1: Enhanced Button with Icon and Animation
export const EnhancedButtonControl: UserControlDefinition = {
  name: 'EnhancedButton',
  description: 'A button control with icon support and hover animations',
  version: '1.0',
  author: 'VB6 IDE',
  
  width: 120,
  height: 32,
  backColor: '#F0F0F0',
  foreColor: '#000000',
  
  // Constituent controls
  controls: [
    {
      id: 'btnMain',
      name: 'btnMain',
      type: 'CommandButton',
      left: 0,
      top: 0,
      width: 120,
      height: 32,
      caption: 'Enhanced Button',
      backColor: '#E0E0E0',
      foreColor: '#000000'
    },
    {
      id: 'imgIcon',
      name: 'imgIcon', 
      type: 'Image',
      left: 4,
      top: 6,
      width: 20,
      height: 20,
      visible: false
    },
    {
      id: 'lblCaption',
      name: 'lblCaption',
      type: 'Label',
      left: 28,
      top: 8,
      width: 88,
      height: 16,
      caption: 'Enhanced Button',
      backStyle: 0, // Transparent
      alignment: 2 // Center
    }
  ],
  
  // Custom properties
  properties: [
    {
      name: 'Caption',
      type: 'String',
      defaultValue: 'Enhanced Button',
      description: 'The text displayed on the button'
    },
    {
      name: 'IconPath',
      type: 'String',
      defaultValue: '',
      description: 'Path to the icon image file'
    },
    {
      name: 'ShowIcon',
      type: 'Boolean',
      defaultValue: false,
      description: 'Whether to show the icon'
    },
    {
      name: 'ButtonStyle',
      type: 'Integer',
      defaultValue: 0,
      description: 'Button style: 0=Standard, 1=Flat, 2=Popup',
      enumValues: { Standard: 0, Flat: 1, Popup: 2 }
    },
    {
      name: 'HoverColor',
      type: 'String',
      defaultValue: '#E8F4FD',
      description: 'Background color when mouse hovers over button'
    },
    {
      name: 'ClickColor',
      type: 'String',
      defaultValue: '#CCE8FF',
      description: 'Background color when button is clicked'
    }
  ],
  
  // Custom methods
  methods: [
    {
      name: 'Flash',
      parameters: [
        { name: 'times', type: 'Integer', optional: true, defaultValue: 3 },
        { name: 'interval', type: 'Integer', optional: true, defaultValue: 200 }
      ],
      returnType: 'void',
      description: 'Flash the button to get attention',
      implementation: function(times = 3, interval = 200) {
        // Implementation would flash the button
        console.log(`Flashing button ${times} times with ${interval}ms interval`);
      }
    },
    {
      name: 'SetIcon',
      parameters: [
        { name: 'iconPath', type: 'String' }
      ],
      returnType: 'Boolean',
      description: 'Set the button icon from file path',
      implementation: function(iconPath: string) {
        this.propertyValues.IconPath = iconPath;
        this.propertyValues.ShowIcon = !!iconPath;
        return true;
      }
    }
  ],
  
  // Custom events
  events: [
    {
      name: 'Click',
      parameters: [],
      description: 'Fired when button is clicked'
    },
    {
      name: 'MouseEnter',
      parameters: [],
      description: 'Fired when mouse enters button area'
    },
    {
      name: 'MouseLeave',
      parameters: [],
      description: 'Fired when mouse leaves button area'
    }
  ],
  
  // Property procedures (VB6 code as strings)
  propertyGetCode: {
    Caption: 'Caption = lblCaption.Caption',
    IconPath: 'IconPath = m_IconPath',
    ShowIcon: 'ShowIcon = imgIcon.Visible'
  },
  
  propertySetCode: {
    Caption: `
      lblCaption.Caption = Value
      If imgIcon.Visible Then
        lblCaption.Left = 28
        lblCaption.Width = UserControl.Width - 32
      Else
        lblCaption.Left = 4
        lblCaption.Width = UserControl.Width - 8
      End If
    `,
    IconPath: `
      m_IconPath = Value
      If Len(Value) > 0 Then
        imgIcon.Picture = LoadPicture(Value)
        imgIcon.Visible = True
        lblCaption.Left = 28
        lblCaption.Width = UserControl.Width - 32
      Else
        imgIcon.Visible = False
        lblCaption.Left = 4
        lblCaption.Width = UserControl.Width - 8
      End If
    `,
    ShowIcon: `
      imgIcon.Visible = Value
      If Value Then
        lblCaption.Left = 28
        lblCaption.Width = UserControl.Width - 32
      Else
        lblCaption.Left = 4
        lblCaption.Width = UserControl.Width - 8
      End If
    `
  },
  
  // Initialize code
  initializeCode: `
    ' Initialize the enhanced button
    btnMain.Style = 1  ' Graphical
    lblCaption.Alignment = 2  ' Center
    imgIcon.Stretch = True
  `,
  
  // Resize code
  resizeCode: `
    ' Resize constituent controls
    btnMain.Width = UserControl.Width
    btnMain.Height = UserControl.Height
    imgIcon.Top = (UserControl.Height - imgIcon.Height) / 2
    lblCaption.Top = (UserControl.Height - lblCaption.Height) / 2
    
    If imgIcon.Visible Then
      lblCaption.Left = 28
      lblCaption.Width = UserControl.Width - 32
    Else
      lblCaption.Left = 4
      lblCaption.Width = UserControl.Width - 8
    End If
  `
};

// Sample User Control 2: Data Entry Panel with validation
export const DataEntryPanelControl: UserControlDefinition = {
  name: 'DataEntryPanel',
  description: 'A panel with label, textbox, and validation for data entry',
  version: '1.0',
  author: 'VB6 IDE',
  
  width: 200,
  height: 60,
  backColor: '#F0F0F0',
  
  // Constituent controls
  controls: [
    {
      id: 'lblLabel',
      name: 'lblLabel',
      type: 'Label',
      left: 4,
      top: 4,
      width: 192,
      height: 16,
      caption: 'Data Field:',
      alignment: 0 // Left align
    },
    {
      id: 'txtValue',
      name: 'txtValue',
      type: 'TextBox',
      left: 4,
      top: 24,
      width: 140,
      height: 20,
      text: ''
    },
    {
      id: 'imgStatus',
      name: 'imgStatus',
      type: 'Image',
      left: 148,
      top: 26,
      width: 16,
      height: 16,
      visible: false
    },
    {
      id: 'cmdClear',
      name: 'cmdClear',
      type: 'CommandButton',
      left: 168,
      top: 24,
      width: 28,
      height: 20,
      caption: 'X',
      font: { name: 'Arial', size: 8, bold: true }
    }
  ],
  
  properties: [
    {
      name: 'Label',
      type: 'String',
      defaultValue: 'Data Field:',
      description: 'The label text'
    },
    {
      name: 'Value',
      type: 'String',
      defaultValue: '',
      description: 'The current value'
    },
    {
      name: 'Required',
      type: 'Boolean',
      defaultValue: false,
      description: 'Whether this field is required'
    },
    {
      name: 'ValidationPattern',
      type: 'String',
      defaultValue: '',
      description: 'Regular expression pattern for validation'
    },
    {
      name: 'MaxLength',
      type: 'Integer',
      defaultValue: 0,
      description: 'Maximum length of input (0 = no limit)'
    },
    {
      name: 'IsValid',
      type: 'Boolean',
      defaultValue: true,
      description: 'Whether current value is valid',
      isReadOnly: true
    },
    {
      name: 'ShowClearButton',
      type: 'Boolean',
      defaultValue: true,
      description: 'Whether to show the clear button'
    }
  ],
  
  methods: [
    {
      name: 'Validate',
      parameters: [],
      returnType: 'Boolean',
      description: 'Validate the current value',
      implementation: function() {
        const value = this.propertyValues.Value || '';
        const required = this.propertyValues.Required;
        const pattern = this.propertyValues.ValidationPattern;
        
        // Check required
        if (required && !value.trim()) {
          this.propertyValues.IsValid = false;
          return false;
        }
        
        // Check pattern
        if (pattern && value) {
          const regex = new RegExp(pattern);
          if (!regex.test(value)) {
            this.propertyValues.IsValid = false;
            return false;
          }
        }
        
        this.propertyValues.IsValid = true;
        return true;
      }
    },
    {
      name: 'Clear',
      parameters: [],
      returnType: 'void',
      description: 'Clear the input value',
      implementation: function() {
        this.propertyValues.Value = '';
      }
    },
    {
      name: 'SetFocus',
      parameters: [],
      returnType: 'void',
      description: 'Set focus to the input textbox',
      implementation: function() {
        // Would focus the textbox
        console.log('Setting focus to textbox');
      }
    }
  ],
  
  events: [
    {
      name: 'ValueChanged',
      parameters: [
        { name: 'newValue', type: 'String' },
        { name: 'isValid', type: 'Boolean' }
      ],
      description: 'Fired when value changes'
    },
    {
      name: 'ValidationChanged',
      parameters: [
        { name: 'isValid', type: 'Boolean' }
      ],
      description: 'Fired when validation status changes'
    }
  ],
  
  propertySetCode: {
    Label: 'lblLabel.Caption = Value',
    Value: `
      txtValue.Text = Value
      Call Validate
      RaiseEvent ValueChanged(Value, IsValid)
    `,
    Required: `
      m_Required = Value
      Call Validate
    `,
    ShowClearButton: 'cmdClear.Visible = Value'
  },
  
  initializeCode: `
    m_Required = False
    m_IsValid = True
    cmdClear.ToolTipText = "Clear field"
  `
};

// Sample User Control 3: Progress Indicator with custom styling
export const ProgressIndicatorControl: UserControlDefinition = {
  name: 'ProgressIndicator',
  description: 'Enhanced progress bar with custom styling and animation',
  version: '1.0',
  author: 'VB6 IDE',
  
  width: 200,
  height: 24,
  backColor: '#F0F0F0',
  
  controls: [
    {
      id: 'shpBackground',
      name: 'shpBackground',
      type: 'Shape',
      left: 2,
      top: 2,
      width: 196,
      height: 20,
      shape: 0, // Rectangle
      fillStyle: 0, // Solid
      fillColor: '#FFFFFF',
      borderColor: '#808080'
    },
    {
      id: 'shpProgress',
      name: 'shpProgress',
      type: 'Shape',
      left: 2,
      top: 2,
      width: 0,
      height: 20,
      shape: 0, // Rectangle
      fillStyle: 0, // Solid
      fillColor: '#0066CC',
      borderStyle: 0 // No border
    },
    {
      id: 'lblText',
      name: 'lblText',
      type: 'Label',
      left: 4,
      top: 4,
      width: 192,
      height: 16,
      caption: '',
      alignment: 2, // Center
      backStyle: 0, // Transparent
      font: { name: 'Arial', size: 8, bold: true }
    }
  ],
  
  properties: [
    {
      name: 'Value',
      type: 'Integer',
      defaultValue: 0,
      description: 'Current progress value'
    },
    {
      name: 'Maximum',
      type: 'Integer',
      defaultValue: 100,
      description: 'Maximum progress value'
    },
    {
      name: 'Minimum',
      type: 'Integer',
      defaultValue: 0,
      description: 'Minimum progress value'
    },
    {
      name: 'ShowText',
      type: 'Boolean',
      defaultValue: true,
      description: 'Whether to show percentage text'
    },
    {
      name: 'TextFormat',
      type: 'String',
      defaultValue: '{0}%',
      description: 'Format string for text display'
    },
    {
      name: 'ProgressColor',
      type: 'String',
      defaultValue: '#0066CC',
      description: 'Color of the progress bar'
    },
    {
      name: 'BackgroundColor',
      type: 'String',
      defaultValue: '#FFFFFF',
      description: 'Background color of the progress area'
    }
  ],
  
  methods: [
    {
      name: 'Increment',
      parameters: [
        { name: 'amount', type: 'Integer', optional: true, defaultValue: 1 }
      ],
      returnType: 'void',
      description: 'Increment progress by specified amount',
      implementation: function(amount = 1) {
        const newValue = Math.min(this.propertyValues.Maximum, this.propertyValues.Value + amount);
        this.propertyValues.Value = newValue;
      }
    },
    {
      name: 'Reset',
      parameters: [],
      returnType: 'void',
      description: 'Reset progress to minimum value',
      implementation: function() {
        this.propertyValues.Value = this.propertyValues.Minimum;
      }
    }
  ],
  
  events: [
    {
      name: 'ProgressChanged',
      parameters: [
        { name: 'value', type: 'Integer' },
        { name: 'percentage', type: 'Single' }
      ],
      description: 'Fired when progress value changes'
    },
    {
      name: 'Complete',
      parameters: [],
      description: 'Fired when progress reaches maximum'
    }
  ],
  
  propertySetCode: {
    Value: `
      Dim newValue As Integer
      newValue = Value
      If newValue < Minimum Then newValue = Minimum
      If newValue > Maximum Then newValue = Maximum
      m_Value = newValue
      
      ' Update progress bar width
      Dim percentage As Single
      percentage = (newValue - Minimum) / (Maximum - Minimum)
      shpProgress.Width = (UserControl.Width - 4) * percentage
      
      ' Update text
      If ShowText Then
        Dim displayText As String
        displayText = Replace(TextFormat, "{0}", CStr(Int(percentage * 100)))
        lblText.Caption = displayText
      End If
      
      RaiseEvent ProgressChanged(newValue, percentage)
      
      If newValue = Maximum Then
        RaiseEvent Complete
      End If
    `,
    ProgressColor: 'shpProgress.FillColor = Value',
    BackgroundColor: 'shpBackground.FillColor = Value',
    ShowText: 'lblText.Visible = Value'
  }
};

// Register all sample user controls
export function registerSampleUserControls(): void {
  console.log('Registering sample user controls...');
  
  VB6UserControlManagerInstance.registerUserControl(EnhancedButtonControl);
  VB6UserControlManagerInstance.registerUserControl(DataEntryPanelControl);
  VB6UserControlManagerInstance.registerUserControl(ProgressIndicatorControl);
  
  console.log('Sample user controls registered:', 
    VB6UserControlManagerInstance.getRegisteredUserControls());
}

// Export individual controls for selective registration
export { EnhancedButtonControl, DataEntryPanelControl, ProgressIndicatorControl };

// Example usage code generator
export function generateUsageExample(): string {
  return `
' VB6 User Control Usage Examples

Private Sub Form_Load()
    ' Create Enhanced Button
    Dim enhancedBtn As New EnhancedButton
    enhancedBtn.Caption = "Click Me!"
    enhancedBtn.ShowIcon = True
    enhancedBtn.IconPath = "icons/button.ico"
    enhancedBtn.HoverColor = "#E8F4FD"
    
    ' Create Data Entry Panel
    Dim dataPanel As New DataEntryPanel
    dataPanel.Label = "Enter Name:"
    dataPanel.Required = True
    dataPanel.ValidationPattern = "^[A-Za-z\\s]+$"
    dataPanel.MaxLength = 50
    
    ' Create Progress Indicator
    Dim progress As New ProgressIndicator
    progress.Maximum = 100
    progress.Value = 50
    progress.ShowText = True
    progress.TextFormat = "Loading... {0}%"
    progress.ProgressColor = "#00AA00"
End Sub

Private Sub EnhancedButton1_Click()
    MsgBox "Enhanced button clicked!"
    EnhancedButton1.Flash 3, 150
End Sub

Private Sub DataEntryPanel1_ValueChanged(newValue As String, isValid As Boolean)
    If Not isValid Then
        MsgBox "Please enter a valid name (letters only)"
    End If
End Sub

Private Sub Timer1_Timer()
    ' Animate progress
    ProgressIndicator1.Increment 1
    If ProgressIndicator1.Value >= ProgressIndicator1.Maximum Then
        Timer1.Enabled = False
        MsgBox "Progress complete!"
    End If
End Sub
`;
}

export default {
  registerSampleUserControls,
  EnhancedButtonControl,
  DataEntryPanelControl, 
  ProgressIndicatorControl,
  generateUsageExample
};