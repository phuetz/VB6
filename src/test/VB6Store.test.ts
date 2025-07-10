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
    });
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
});
