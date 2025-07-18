import { describe, it, expect, beforeEach } from 'vitest';
import { useVB6Store } from '../stores/vb6Store';

describe('VB6Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useVB6Store.setState({
      controls: [],
      selectedControls: [],
      nextId: 1,
      executionMode: 'design',
      history: [],
      historyIndex: -1,
    });
    useVB6Store.getState().pushHistory([], 1);
  });

  it('should create a control', () => {
    const { createControl, controls, nextId } = useVB6Store.getState();

    createControl('CommandButton', 100, 100);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('CommandButton');
    expect(state.controls[0].x).toBe(100);
    expect(state.controls[0].y).toBe(100);
    expect(state.nextId).toBe(2);
  });

  it('should update control properties', () => {
    const { createControl, updateControl } = useVB6Store.getState();

    createControl('Label', 50, 50);
    const controlId = useVB6Store.getState().controls[0].id;

    updateControl(controlId, 'caption', 'Hello World');

    const state = useVB6Store.getState();
    expect(state.controls[0].caption).toBe('Hello World');
  });

  it('should select controls', () => {
    const { createControl, selectControls } = useVB6Store.getState();

    createControl('TextBox', 75, 75);
    const controlId = useVB6Store.getState().controls[0].id;

    selectControls([controlId]);

    const state = useVB6Store.getState();
    expect(state.selectedControls).toHaveLength(1);
    expect(state.selectedControls[0].id).toBe(controlId);
  });

  it('should copy and paste controls', () => {
    const { createControl, selectControls, copyControls, pasteControls } = useVB6Store.getState();

    // Create and select a control
    createControl('CheckBox', 200, 200);
    const controlId = useVB6Store.getState().controls[0].id;
    selectControls([controlId]);

    // Copy the control
    copyControls();

    // Paste the control
    pasteControls();

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(2);
    expect(state.controls[1].type).toBe('CheckBox');
    expect(state.controls[1].x).toBe(220); // Original + 20
    expect(state.controls[1].y).toBe(220); // Original + 20
  });

  it('should duplicate selected controls', () => {
    const { createControl, selectControls, duplicateControls } = useVB6Store.getState();

    createControl('Label', 30, 40);
    const controlId = useVB6Store.getState().controls[0].id;
    selectControls([controlId]);

    duplicateControls();

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(2);
    expect(state.controls[1].type).toBe('Label');
    expect(state.controls[1].x).toBe(50);
    expect(state.controls[1].y).toBe(60);
  });

  it('should delete controls', () => {
    const { createControl, deleteControls } = useVB6Store.getState();

    createControl('Frame', 150, 150);
    const controlId = useVB6Store.getState().controls[0].id;

    deleteControls([controlId]);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(0);
    expect(state.selectedControls).toHaveLength(0);
  });

  it('should manage execution mode', () => {
    const { setExecutionMode } = useVB6Store.getState();

    setExecutionMode('run');
    expect(useVB6Store.getState().executionMode).toBe('run');

    setExecutionMode('break');
    expect(useVB6Store.getState().executionMode).toBe('break');

    setExecutionMode('design');
    expect(useVB6Store.getState().executionMode).toBe('design');
  });

  it('should manage event code', () => {
    const { updateEventCode } = useVB6Store.getState();

    updateEventCode('Button1_Click', 'MsgBox "Hello World"');

    const state = useVB6Store.getState();
    expect(state.eventCode['Button1_Click']).toBe('MsgBox "Hello World"');
  });

  it('should manage form properties', () => {
    const { updateFormProperty } = useVB6Store.getState();

    updateFormProperty('Caption', 'My Form');
    updateFormProperty('Width', 800);
    updateFormProperty('StartUpPosition', '1 - CenterOwner');

    const state = useVB6Store.getState();
    expect(state.formProperties.Caption).toBe('My Form');
    expect(state.formProperties.Width).toBe(800);
    expect(state.formProperties.StartUpPosition).toBe('1 - CenterOwner');
  });

  it('should create a PictureBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('PictureBox', 10, 20);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('PictureBox');
    expect(state.controls[0].x).toBe(10);
    expect(state.controls[0].y).toBe(20);
  });

  it('should create an OptionButton control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('OptionButton', 30, 40);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('OptionButton');
    expect(state.controls[0].x).toBe(30);
    expect(state.controls[0].y).toBe(40);
  });

  it('should create a ComboBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('ComboBox', 40, 60);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('ComboBox');
    expect(state.controls[0].x).toBe(40);
    expect(state.controls[0].y).toBe(60);
  });

  it('should create a ListBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('ListBox', 50, 70);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('ListBox');
    expect(state.controls[0].x).toBe(50);
    expect(state.controls[0].y).toBe(70);
  });

  it('should create a Timer control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Timer', 5, 5);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Timer');
    expect(state.controls[0].x).toBe(5);
    expect(state.controls[0].y).toBe(5);
  });

  it('should create a HScrollBar control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('HScrollBar', 15, 25);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('HScrollBar');
    expect(state.controls[0].x).toBe(15);
    expect(state.controls[0].y).toBe(25);
  });

  it('should create a VScrollBar control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('VScrollBar', 20, 30);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('VScrollBar');
    expect(state.controls[0].x).toBe(20);
    expect(state.controls[0].y).toBe(30);
  });

  it('should create a DriveListBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DriveListBox', 10, 10);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DriveListBox');
    expect(state.controls[0].x).toBe(10);
    expect(state.controls[0].y).toBe(10);
  });

  it('should create a DirListBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DirListBox', 15, 20);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DirListBox');
    expect(state.controls[0].x).toBe(15);
    expect(state.controls[0].y).toBe(20);
  });

  it('should create a FileListBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('FileListBox', 5, 5);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('FileListBox');
    expect(state.controls[0].x).toBe(5);
    expect(state.controls[0].y).toBe(5);
  });

  it('should create a Shape control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Shape', 20, 20);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Shape');
    expect(state.controls[0].x).toBe(20);
    expect(state.controls[0].y).toBe(20);
  });

  it('should create a Line control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Line', 0, 0);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Line');
    expect(state.controls[0].x).toBe(0);
    expect(state.controls[0].y).toBe(0);
  });

  it('should create an Image control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Image', 30, 40);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Image');
    expect(state.controls[0].x).toBe(30);
    expect(state.controls[0].y).toBe(40);
  });

  it('should create a Data control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Data', 10, 10);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Data');
    expect(state.controls[0].x).toBe(10);
    expect(state.controls[0].y).toBe(10);
  });

  it('should create an OLE control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('OLE', 20, 20);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('OLE');
    expect(state.controls[0].x).toBe(20);
    expect(state.controls[0].y).toBe(20);
  });

  it('should create a Toolbar control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Toolbar', 5, 5);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Toolbar');
    expect(state.controls[0].x).toBe(5);
    expect(state.controls[0].y).toBe(5);
  });

  it('should create a TreeView control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('TreeView', 10, 15);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('TreeView');
    expect(state.controls[0].x).toBe(10);
    expect(state.controls[0].y).toBe(15);
  });

  it('should create a ListView control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('ListView', 5, 5);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('ListView');
    expect(state.controls[0].x).toBe(5);
    expect(state.controls[0].y).toBe(5);
  });

  it('should create an ImageList control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('ImageList', 3, 4);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('ImageList');
    expect(state.controls[0].x).toBe(3);
    expect(state.controls[0].y).toBe(4);
  });

  it('should create a StatusBar control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('StatusBar', 0, 0);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('StatusBar');
    expect(state.controls[0].x).toBe(0);
    expect(state.controls[0].y).toBe(0);
  });

  it('should create a DateTimePicker control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DateTimePicker', 2, 3);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DateTimePicker');
    expect(state.controls[0].x).toBe(2);
    expect(state.controls[0].y).toBe(3);
  });

  it('should create a MonthView control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('MonthView', 5, 6);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('MonthView');
    expect(state.controls[0].x).toBe(5);
    expect(state.controls[0].y).toBe(6);
  });

  it('should create an UpDown control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('UpDown', 8, 9);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('UpDown');
    expect(state.controls[0].x).toBe(8);
    expect(state.controls[0].y).toBe(9);
  });

  it('should create an ImageCombo control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('ImageCombo', 12, 12);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('ImageCombo');
    expect(state.controls[0].x).toBe(12);
    expect(state.controls[0].y).toBe(12);
  });

  it('should create a FlatScrollBar control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('FlatScrollBar', 20, 5);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('FlatScrollBar');
    expect(state.controls[0].x).toBe(20);
    expect(state.controls[0].y).toBe(5);
  });

  it('should create a RichTextBox control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('RichTextBox', 30, 40);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('RichTextBox');
    expect(state.controls[0].x).toBe(30);
    expect(state.controls[0].y).toBe(40);
  });

  it('should create a MaskedEdit control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('MaskedEdit', 1, 2);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('MaskedEdit');
    expect(state.controls[0].x).toBe(1);
    expect(state.controls[0].y).toBe(2);
  });

  it('should create a WebBrowser control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('WebBrowser', 5, 5);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('WebBrowser');
    expect(state.controls[0].x).toBe(5);
    expect(state.controls[0].y).toBe(5);
  });

  it('should create an Inet control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Inet', 6, 7);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Inet');
    expect(state.controls[0].x).toBe(6);
    expect(state.controls[0].y).toBe(7);
  });

  it('should create a Winsock control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('Winsock', 8, 9);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('Winsock');
    expect(state.controls[0].x).toBe(8);
    expect(state.controls[0].y).toBe(9);
  });

  it('should create a DataGrid control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DataGrid', 2, 2);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DataGrid');
    expect(state.controls[0].x).toBe(2);
    expect(state.controls[0].y).toBe(2);
  });

  it('should create a DataList control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DataList', 3, 3);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DataList');
    expect(state.controls[0].x).toBe(3);
    expect(state.controls[0].y).toBe(3);
  });

  it('should create a DataCombo control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DataCombo', 4, 4);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DataCombo');
    expect(state.controls[0].x).toBe(4);
    expect(state.controls[0].y).toBe(4);
  });

  it('should create a DataRepeater control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DataRepeater', 7, 8);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DataRepeater');
    expect(state.controls[0].x).toBe(7);
    expect(state.controls[0].y).toBe(8);
  });

  it('should create a DataEnvironment control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DataEnvironment', 9, 1);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DataEnvironment');
    expect(state.controls[0].x).toBe(9);
    expect(state.controls[0].y).toBe(1);
  });

  it('should create a DataReport control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('DataReport', 11, 12);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('DataReport');
    expect(state.controls[0].x).toBe(11);
    expect(state.controls[0].y).toBe(12);
  });

  it('should create a CrystalReport control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('CrystalReport', 13, 14);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('CrystalReport');
    expect(state.controls[0].x).toBe(13);
    expect(state.controls[0].y).toBe(14);
  });

  it('should create a MediaPlayer control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('MediaPlayer', 15, 16);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('MediaPlayer');
    expect(state.controls[0].x).toBe(15);
    expect(state.controls[0].y).toBe(16);
  });

  it('should create an MMControl control', () => {
    const { createControl } = useVB6Store.getState();

    createControl('MMControl', 17, 18);

    const state = useVB6Store.getState();
    expect(state.controls).toHaveLength(1);
    expect(state.controls[0].type).toBe('MMControl');
    expect(state.controls[0].x).toBe(17);
    expect(state.controls[0].y).toBe(18);
  });

  it('should undo and redo control creation', () => {
    const { createControl, undo, redo } = useVB6Store.getState();

    createControl('CommandButton', 10, 10);
    expect(useVB6Store.getState().controls).toHaveLength(1);

    undo();
    expect(useVB6Store.getState().controls).toHaveLength(0);

    redo();
    expect(useVB6Store.getState().controls).toHaveLength(1);
    expect(useVB6Store.getState().controls[0].type).toBe('CommandButton');
  });

  it('should manage todo items', () => {
    const { addTodo, toggleTodo, deleteTodo } = useVB6Store.getState();

    addTodo('Task 1');
    const items = useVB6Store.getState().todoItems;
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe('Task 1');
    expect(items[0].completed).toBe(false);

    toggleTodo(items[0].id);
    expect(useVB6Store.getState().todoItems[0].completed).toBe(true);

    deleteTodo(items[0].id);
    expect(useVB6Store.getState().todoItems).toHaveLength(0);
  });

  it('should set designer zoom', () => {
    const { setDesignerZoom } = useVB6Store.getState();
    setDesignerZoom(150);
    expect(useVB6Store.getState().designerZoom).toBe(150);
  });
});
