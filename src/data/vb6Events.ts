/**
 * VB6 Control Events
 * Complete list of standard events for all VB6 controls
 */

export interface VB6Event {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}

/**
 * Form Events
 */
export const FormEvents: VB6Event[] = [
  {
    name: 'Load',
    description: 'Occurs when a form is loaded',
    parameters: [],
  },
  {
    name: 'Initialize',
    description: 'Occurs when a form is created',
    parameters: [],
  },
  {
    name: 'Activate',
    description: 'Occurs when a form becomes the active window',
    parameters: [],
  },
  {
    name: 'Deactivate',
    description: 'Occurs when a form is no longer the active window',
    parameters: [],
  },
  {
    name: 'QueryUnload',
    description: 'Occurs before a form or application closes',
    parameters: [
      { name: 'Cancel', type: 'Integer', description: 'Set to True to prevent unloading' },
      {
        name: 'UnloadMode',
        type: 'Integer',
        description: 'Indicates the cause of the QueryUnload event',
      },
    ],
  },
  {
    name: 'Unload',
    description: 'Occurs when a form is about to be removed from memory',
    parameters: [
      { name: 'Cancel', type: 'Integer', description: 'Set to True to prevent unloading' },
    ],
  },
  {
    name: 'Terminate',
    description: 'Occurs when all references to a form are removed',
    parameters: [],
  },
  {
    name: 'Resize',
    description: 'Occurs when a form is resized',
    parameters: [],
  },
  {
    name: 'Paint',
    description:
      'Occurs when part or all of a form is exposed after being covered by another window',
    parameters: [],
  },
  {
    name: 'Click',
    description: 'Occurs when the user clicks the form',
    parameters: [],
  },
  {
    name: 'DblClick',
    description: 'Occurs when the user double-clicks the form',
    parameters: [],
  },
  {
    name: 'MouseDown',
    description: 'Occurs when the user presses a mouse button',
    parameters: [
      { name: 'Button', type: 'Integer', description: 'Which mouse button was pressed' },
      { name: 'Shift', type: 'Integer', description: 'State of Shift, Ctrl, and Alt keys' },
      { name: 'X', type: 'Single', description: 'X coordinate of mouse pointer' },
      { name: 'Y', type: 'Single', description: 'Y coordinate of mouse pointer' },
    ],
  },
  {
    name: 'MouseUp',
    description: 'Occurs when the user releases a mouse button',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseMove',
    description: 'Occurs when the user moves the mouse',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'KeyDown',
    description: 'Occurs when the user presses a key',
    parameters: [
      { name: 'KeyCode', type: 'Integer', description: 'Key code of the key pressed' },
      { name: 'Shift', type: 'Integer', description: 'State of Shift, Ctrl, and Alt keys' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when the user releases a key',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when the user presses and releases an ANSI key',
    parameters: [{ name: 'KeyAscii', type: 'Integer', description: 'ASCII code of the key' }],
  },
  {
    name: 'GotFocus',
    description: 'Occurs when an object receives focus',
    parameters: [],
  },
  {
    name: 'LostFocus',
    description: 'Occurs when an object loses focus',
    parameters: [],
  },
  {
    name: 'DragDrop',
    description: 'Occurs when a drag-and-drop operation is completed',
    parameters: [
      { name: 'Source', type: 'Control', description: 'Control being dragged' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'DragOver',
    description: 'Occurs when a drag-and-drop operation is in progress',
    parameters: [
      { name: 'Source', type: 'Control' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
      {
        name: 'State',
        type: 'Integer',
        description: 'Transition state (0=Enter, 1=Leave, 2=Over)',
      },
    ],
  },
];

/**
 * CommandButton Events
 */
export const CommandButtonEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks the button', parameters: [] },
  {
    name: 'DblClick',
    description: 'Occurs when the user double-clicks the button',
    parameters: [],
  },
  { name: 'GotFocus', description: 'Occurs when the button receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the button loses focus', parameters: [] },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
  {
    name: 'MouseDown',
    description: 'Occurs when a mouse button is pressed',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseUp',
    description: 'Occurs when a mouse button is released',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseMove',
    description: 'Occurs when the mouse is moved',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
];

/**
 * TextBox Events
 */
export const TextBoxEvents: VB6Event[] = [
  { name: 'Change', description: 'Occurs when the text content changes', parameters: [] },
  { name: 'Click', description: 'Occurs when the user clicks the textbox', parameters: [] },
  {
    name: 'DblClick',
    description: 'Occurs when the user double-clicks the textbox',
    parameters: [],
  },
  { name: 'GotFocus', description: 'Occurs when the textbox receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the textbox loses focus', parameters: [] },
  {
    name: 'Validate',
    description: 'Occurs before focus moves from the control',
    parameters: [{ name: 'Cancel', type: 'Boolean' }],
  },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
  {
    name: 'MouseDown',
    description: 'Occurs when a mouse button is pressed',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseUp',
    description: 'Occurs when a mouse button is released',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseMove',
    description: 'Occurs when the mouse is moved',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
];

/**
 * Label Events
 */
export const LabelEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks the label', parameters: [] },
  { name: 'DblClick', description: 'Occurs when the user double-clicks the label', parameters: [] },
  { name: 'Change', description: 'Occurs when the Caption property changes', parameters: [] },
  {
    name: 'MouseDown',
    description: 'Occurs when a mouse button is pressed',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseUp',
    description: 'Occurs when a mouse button is released',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseMove',
    description: 'Occurs when the mouse is moved',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
];

/**
 * CheckBox Events
 */
export const CheckBoxEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks the checkbox', parameters: [] },
  {
    name: 'DblClick',
    description: 'Occurs when the user double-clicks the checkbox',
    parameters: [],
  },
  { name: 'GotFocus', description: 'Occurs when the checkbox receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the checkbox loses focus', parameters: [] },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
];

/**
 * OptionButton (RadioButton) Events
 */
export const OptionButtonEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks the option button', parameters: [] },
  {
    name: 'DblClick',
    description: 'Occurs when the user double-clicks the option button',
    parameters: [],
  },
  { name: 'GotFocus', description: 'Occurs when the option button receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the option button loses focus', parameters: [] },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
];

/**
 * ListBox Events
 */
export const ListBoxEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks an item', parameters: [] },
  { name: 'DblClick', description: 'Occurs when the user double-clicks an item', parameters: [] },
  { name: 'GotFocus', description: 'Occurs when the listbox receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the listbox loses focus', parameters: [] },
  { name: 'Scroll', description: 'Occurs when the user scrolls the list', parameters: [] },
  {
    name: 'ItemCheck',
    description: 'Occurs when a checkbox in the list is clicked',
    parameters: [{ name: 'Item', type: 'Integer' }],
  },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
];

/**
 * ComboBox Events
 */
export const ComboBoxEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user selects an item', parameters: [] },
  { name: 'DblClick', description: 'Occurs when the user double-clicks an item', parameters: [] },
  { name: 'Change', description: 'Occurs when the text changes', parameters: [] },
  { name: 'DropDown', description: 'Occurs when the dropdown list is displayed', parameters: [] },
  { name: 'CloseUp', description: 'Occurs when the dropdown list closes', parameters: [] },
  { name: 'GotFocus', description: 'Occurs when the combobox receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the combobox loses focus', parameters: [] },
  { name: 'Scroll', description: 'Occurs when the user scrolls the dropdown list', parameters: [] },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
];

/**
 * PictureBox Events
 */
export const PictureBoxEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks the picture box', parameters: [] },
  {
    name: 'DblClick',
    description: 'Occurs when the user double-clicks the picture box',
    parameters: [],
  },
  { name: 'Paint', description: 'Occurs when the picture box needs to be redrawn', parameters: [] },
  { name: 'Resize', description: 'Occurs when the picture box is resized', parameters: [] },
  { name: 'GotFocus', description: 'Occurs when the picture box receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the picture box loses focus', parameters: [] },
  {
    name: 'MouseDown',
    description: 'Occurs when a mouse button is pressed',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseUp',
    description: 'Occurs when a mouse button is released',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseMove',
    description: 'Occurs when the mouse is moved',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
];

/**
 * Timer Events
 */
export const TimerEvents: VB6Event[] = [
  { name: 'Timer', description: 'Occurs when a preset interval has elapsed', parameters: [] },
];

/**
 * HScrollBar and VScrollBar Events
 */
export const ScrollBarEvents: VB6Event[] = [
  { name: 'Change', description: 'Occurs when the Value property changes', parameters: [] },
  { name: 'Scroll', description: 'Occurs when the user scrolls', parameters: [] },
  { name: 'GotFocus', description: 'Occurs when the scrollbar receives focus', parameters: [] },
  { name: 'LostFocus', description: 'Occurs when the scrollbar loses focus', parameters: [] },
  {
    name: 'KeyDown',
    description: 'Occurs when a key is pressed',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyUp',
    description: 'Occurs when a key is released',
    parameters: [
      { name: 'KeyCode', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
    ],
  },
  {
    name: 'KeyPress',
    description: 'Occurs when a key is pressed and released',
    parameters: [{ name: 'KeyAscii', type: 'Integer' }],
  },
];

/**
 * Frame Events
 */
export const FrameEvents: VB6Event[] = [
  { name: 'Click', description: 'Occurs when the user clicks the frame', parameters: [] },
  { name: 'DblClick', description: 'Occurs when the user double-clicks the frame', parameters: [] },
  {
    name: 'MouseDown',
    description: 'Occurs when a mouse button is pressed',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseUp',
    description: 'Occurs when a mouse button is released',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'MouseMove',
    description: 'Occurs when the mouse is moved',
    parameters: [
      { name: 'Button', type: 'Integer' },
      { name: 'Shift', type: 'Integer' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
];

/**
 * Map of control types to their events
 */
export const ControlEventsMap: Record<string, VB6Event[]> = {
  Form: FormEvents,
  CommandButton: CommandButtonEvents,
  TextBox: TextBoxEvents,
  Label: LabelEvents,
  CheckBox: CheckBoxEvents,
  OptionButton: OptionButtonEvents,
  ListBox: ListBoxEvents,
  ComboBox: ComboBoxEvents,
  PictureBox: PictureBoxEvents,
  Timer: TimerEvents,
  HScrollBar: ScrollBarEvents,
  VScrollBar: ScrollBarEvents,
  Frame: FrameEvents,
  Image: PictureBoxEvents, // Same events as PictureBox
  Shape: LabelEvents, // Similar to Label
  Line: LabelEvents, // Similar to Label
};

/**
 * Get events for a specific control type
 */
export function getEventsForControl(controlType: string): VB6Event[] {
  return ControlEventsMap[controlType] || [];
}

/**
 * Get event names for a specific control type
 */
export function getEventNamesForControl(controlType: string): string[] {
  const events = getEventsForControl(controlType);
  return events.map(e => e.name);
}

/**
 * Get event parameter signature
 */
export function getEventSignature(controlType: string, eventName: string): string {
  const events = getEventsForControl(controlType);
  const event = events.find(e => e.name === eventName);

  if (!event) return '';

  if (event.parameters.length === 0) {
    return `${eventName}()`;
  }

  const params = event.parameters.map(p => `${p.name} As ${p.type}`).join(', ');

  return `${eventName}(${params})`;
}

/**
 * Generate event procedure stub
 */
export function generateEventProcedure(
  controlName: string,
  controlType: string,
  eventName: string
): string {
  const signature = getEventSignature(controlType, eventName);
  const params = signature.substring(signature.indexOf('('));

  return `Private Sub ${controlName}_${eventName}${params}
    ' Add code here
End Sub`;
}
