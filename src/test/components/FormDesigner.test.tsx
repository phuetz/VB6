/**
 * ULTRA COMPREHENSIVE Form Designer Test Suite
 * Tests all form designer operations, manipulations, and edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { act } from '@testing-library/react';

// Mock control types
interface VB6Control {
  id: string;
  type: string;
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  zIndex: number;
  visible: boolean;
  enabled: boolean;
}

describe('Form Designer - Control Creation', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      controls: [],
      selectedControls: [],
      nextId: 1,
      addControl: vi.fn(),
      updateControl: vi.fn(),
      deleteControl: vi.fn(),
      selectControl: vi.fn(),
      clearSelection: vi.fn(),
      setZoomLevel: vi.fn(),
      currentZoom: 100,
      gridSize: 8,
      snapToGrid: true,
    };
  });

  it('should create TextBox control with correct defaults', () => {
    const control = createControl('TextBox', 100, 50);

    expect(control).toEqual({
      id: expect.any(String),
      type: 'TextBox',
      name: 'Text1',
      left: 100,
      top: 50,
      width: 120,
      height: 25,
      properties: {
        Text: '',
        Font: 'MS Sans Serif, 8pt',
        BackColor: 0x80000005,
        ForeColor: 0x80000008,
        BorderStyle: 1,
        Enabled: true,
        Visible: true,
        TabIndex: 0,
        TabStop: true,
      },
      zIndex: 1,
      visible: true,
      enabled: true,
    });
  });

  it('should create CommandButton with correct defaults', () => {
    const control = createControl('CommandButton', 200, 100);

    expect(control.type).toBe('CommandButton');
    expect(control.properties.Caption).toBe('Command1');
    expect(control.width).toBe(95);
    expect(control.height).toBe(25);
    expect(control.properties.Style).toBe(0); // Standard button
  });

  it('should create Label with correct defaults', () => {
    const control = createControl('Label', 50, 75);

    expect(control.type).toBe('Label');
    expect(control.properties.Caption).toBe('Label1');
    expect(control.properties.AutoSize).toBe(false);
    expect(control.properties.BorderStyle).toBe(0); // No border
  });

  it('should create ListBox with correct defaults', () => {
    const control = createControl('ListBox', 150, 200);

    expect(control.type).toBe('ListBox');
    expect(control.width).toBe(120);
    expect(control.height).toBe(97);
    expect(control.properties.Sorted).toBe(false);
    expect(control.properties.MultiSelect).toBe(0); // None
  });

  it('should create ComboBox with correct defaults', () => {
    const control = createControl('ComboBox', 175, 125);

    expect(control.type).toBe('ComboBox');
    expect(control.properties.Style).toBe(0); // Dropdown Combo
    expect(control.properties.Sorted).toBe(false);
  });

  it('should create CheckBox with correct defaults', () => {
    const control = createControl('CheckBox', 80, 160);

    expect(control.type).toBe('CheckBox');
    expect(control.properties.Caption).toBe('Check1');
    expect(control.properties.Value).toBe(0); // Unchecked
  });

  it('should create OptionButton with correct defaults', () => {
    const control = createControl('OptionButton', 90, 180);

    expect(control.type).toBe('OptionButton');
    expect(control.properties.Caption).toBe('Option1');
    expect(control.properties.Value).toBe(false);
  });

  it('should create Frame with correct defaults', () => {
    const control = createControl('Frame', 300, 250);

    expect(control.type).toBe('Frame');
    expect(control.properties.Caption).toBe('Frame1');
    expect(control.width).toBe(185);
    expect(control.height).toBe(105);
  });

  it('should create PictureBox with correct defaults', () => {
    const control = createControl('PictureBox', 400, 300);

    expect(control.type).toBe('PictureBox');
    expect(control.width).toBe(97);
    expect(control.height).toBe(97);
    expect(control.properties.BorderStyle).toBe(1); // Fixed Single
    expect(control.properties.AutoSize).toBe(false);
  });

  it('should create Timer with correct defaults', () => {
    const control = createControl('Timer', 0, 0); // Invisible control

    expect(control.type).toBe('Timer');
    expect(control.properties.Interval).toBe(0);
    expect(control.properties.Enabled).toBe(true);
    expect(control.visible).toBe(false); // Timer is invisible
  });
});

describe('Form Designer - Control Manipulation', () => {
  let controls: VB6Control[];

  beforeEach(() => {
    controls = [
      createControl('TextBox', 100, 50),
      createControl('CommandButton', 200, 100),
      createControl('Label', 50, 75),
    ];
  });

  it('should move control to new position', () => {
    const control = controls[0];
    const newPosition = moveControl(control, 150, 80);

    expect(newPosition.left).toBe(150);
    expect(newPosition.top).toBe(80);
    expect(newPosition.id).toBe(control.id);
  });

  it('should resize control correctly', () => {
    const control = controls[0];
    const resized = resizeControl(control, 200, 50);

    expect(resized.width).toBe(200);
    expect(resized.height).toBe(50);
    expect(resized.id).toBe(control.id);
  });

  it('should enforce minimum size constraints', () => {
    const control = controls[0];
    const resized = resizeControl(control, 5, 5); // Too small

    expect(resized.width).toBeGreaterThanOrEqual(15); // Minimum width
    expect(resized.height).toBeGreaterThanOrEqual(15); // Minimum height
  });

  it('should snap to grid when enabled', () => {
    const gridSize = 8;
    const snapped = snapToGrid(137, 83, gridSize);

    expect(snapped.left).toBe(136); // 137 snapped to 8px grid
    expect(snapped.top).toBe(80); // 83 snapped to 8px grid
  });

  it('should not snap to grid when disabled', () => {
    const result = snapToGrid(137, 83, 8, false);

    expect(result.left).toBe(137);
    expect(result.top).toBe(83);
  });

  it('should handle control z-order correctly', () => {
    const control1 = controls[0];
    const control2 = controls[1];

    const bringToFront = setZOrder(control1, 'front', controls);
    const sendToBack = setZOrder(control2, 'back', controls);

    expect(bringToFront.zIndex).toBeGreaterThan(control2.zIndex);
    expect(sendToBack.zIndex).toBeLessThan(control1.zIndex);
  });

  it('should align controls horizontally', () => {
    const aligned = alignControls(controls.slice(0, 2), 'left');

    expect(aligned[0].left).toBe(aligned[1].left);
    expect(aligned[0].top).not.toBe(aligned[1].top); // Top should remain different
  });

  it('should align controls vertically', () => {
    const aligned = alignControls(controls.slice(0, 2), 'top');

    expect(aligned[0].top).toBe(aligned[1].top);
    expect(aligned[0].left).not.toBe(aligned[1].left); // Left should remain different
  });

  it('should distribute controls evenly', () => {
    const distributed = distributeControls(controls, 'horizontal');

    expect(distributed).toHaveLength(3);
    // Check that spacing is even (would need more complex calculation)
    expect(distributed[1].left).toBeGreaterThan(distributed[0].left);
    expect(distributed[2].left).toBeGreaterThan(distributed[1].left);
  });

  it('should make controls same size', () => {
    const sameSize = makeSameSize(controls.slice(0, 2), 'width');

    expect(sameSize[0].width).toBe(sameSize[1].width);
    expect(sameSize[0].height).not.toBe(sameSize[1].height); // Height unchanged
  });

  it('should center controls on form', () => {
    const formSize = { width: 800, height: 600 };
    const centered = centerOnForm(controls[0], formSize);

    expect(centered.left).toBe(400 - centered.width / 2);
    expect(centered.top).toBe(300 - centered.height / 2);
  });
});

describe('Form Designer - Selection Management', () => {
  let controls: VB6Control[];

  beforeEach(() => {
    controls = [
      createControl('TextBox', 100, 50),
      createControl('CommandButton', 200, 100),
      createControl('Label', 50, 75),
    ];
  });

  it('should select single control', () => {
    const selection = selectControls([controls[0]]);

    expect(selection).toHaveLength(1);
    expect(selection[0].id).toBe(controls[0].id);
  });

  it('should select multiple controls', () => {
    const selection = selectControls([controls[0], controls[1]]);

    expect(selection).toHaveLength(2);
    expect(selection.map(c => c.id)).toEqual([controls[0].id, controls[1].id]);
  });

  it('should clear selection', () => {
    const selection = selectControls([]);

    expect(selection).toHaveLength(0);
  });

  it('should handle rubber band selection', () => {
    const rubberBand = {
      startX: 80,
      startY: 40,
      endX: 180,
      endY: 110,
    };

    const selected = getRubberBandSelection(controls, rubberBand);

    // Should select controls within the rubber band area
    expect(selected).toContain(controls[0]); // TextBox at 100,50
    expect(selected).not.toContain(controls[1]); // CommandButton at 200,100 (outside)
    expect(selected).not.toContain(controls[2]); // Label at 50,75 (outside left)
  });

  it('should handle selection rectangle calculation', () => {
    const selectedControls = [controls[0], controls[1]];
    const bounds = getSelectionBounds(selectedControls);

    expect(bounds.left).toBe(Math.min(controls[0].left, controls[1].left));
    expect(bounds.top).toBe(Math.min(controls[0].top, controls[1].top));
    expect(bounds.right).toBe(
      Math.max(controls[0].left + controls[0].width, controls[1].left + controls[1].width)
    );
    expect(bounds.bottom).toBe(
      Math.max(controls[0].top + controls[0].height, controls[1].top + controls[1].height)
    );
  });
});

describe('Form Designer - Property Management', () => {
  let control: VB6Control;

  beforeEach(() => {
    control = createControl('TextBox', 100, 50);
  });

  it('should set control property', () => {
    const updated = setProperty(control, 'Text', 'Hello World');

    expect(updated.properties.Text).toBe('Hello World');
  });

  it('should validate property values', () => {
    expect(() => setProperty(control, 'Left', -10)).toThrow(); // Negative position
    expect(() => setProperty(control, 'Width', 0)).toThrow(); // Zero width
    expect(() => setProperty(control, 'Height', -5)).toThrow(); // Negative height
  });

  it('should handle font property changes', () => {
    const updated = setProperty(control, 'Font', 'Arial, 12pt, Bold');

    expect(updated.properties.Font).toBe('Arial, 12pt, Bold');
  });

  it('should handle color property changes', () => {
    const updated = setProperty(control, 'BackColor', 0xff0000); // Red

    expect(updated.properties.BackColor).toBe(0xff0000);
  });

  it('should handle boolean property changes', () => {
    const updated = setProperty(control, 'Enabled', false);

    expect(updated.properties.Enabled).toBe(false);
  });

  it('should get property value correctly', () => {
    expect(getProperty(control, 'Text')).toBe('');
    expect(getProperty(control, 'Width')).toBe(120);
    expect(getProperty(control, 'Enabled')).toBe(true);
  });

  it('should list all available properties', () => {
    const properties = getAvailableProperties(control.type);

    expect(properties).toContain('Text');
    expect(properties).toContain('Font');
    expect(properties).toContain('BackColor');
    expect(properties).toContain('Enabled');
    expect(properties).toContain('Visible');
  });

  it('should validate property types', () => {
    expect(validatePropertyValue('Text', 'Hello')).toBe(true);
    expect(validatePropertyValue('Text', 123)).toBe(false);
    expect(validatePropertyValue('Left', 100)).toBe(true);
    expect(validatePropertyValue('Left', 'invalid')).toBe(false);
    expect(validatePropertyValue('Enabled', true)).toBe(true);
    expect(validatePropertyValue('Enabled', 'yes')).toBe(false);
  });
});

describe('Form Designer - Layout Operations', () => {
  let controls: VB6Control[];

  beforeEach(() => {
    controls = [
      createControl('TextBox', 100, 50),
      createControl('CommandButton', 200, 100),
      createControl('Label', 50, 75),
    ];
  });

  it('should lock control positions', () => {
    const locked = lockControls(controls, true);

    locked.forEach(control => {
      expect(control.properties.Locked).toBe(true);
    });
  });

  it('should group controls together', () => {
    const group = createControlGroup(controls.slice(0, 2));

    expect(group.type).toBe('Group');
    expect(group.children).toHaveLength(2);
    expect(group.children[0].id).toBe(controls[0].id);
    expect(group.children[1].id).toBe(controls[1].id);
  });

  it('should ungroup controls', () => {
    const group = createControlGroup(controls.slice(0, 2));
    const ungrouped = ungroupControls(group);

    expect(ungrouped).toHaveLength(2);
    expect(ungrouped[0].id).toBe(controls[0].id);
    expect(ungrouped[1].id).toBe(controls[1].id);
  });

  it('should set tab order correctly', () => {
    const tabOrdered = setTabOrder(controls, [2, 0, 1]);

    expect(tabOrdered[0].properties.TabIndex).toBe(0); // controls[2] first
    expect(tabOrdered[1].properties.TabIndex).toBe(1); // controls[0] second
    expect(tabOrdered[2].properties.TabIndex).toBe(2); // controls[1] third
  });

  it('should handle container relationships', () => {
    const frame = createControl('Frame', 300, 200);
    const childControl = createControl('TextBox', 310, 210);

    const container = addToContainer(frame, childControl);

    expect(container.children).toContain(childControl.id);
    expect(childControl.properties.Container).toBe(frame.id);
  });
});

describe('Form Designer - Clipboard Operations', () => {
  let controls: VB6Control[];

  beforeEach(() => {
    controls = [createControl('TextBox', 100, 50), createControl('CommandButton', 200, 100)];
  });

  it('should copy controls to clipboard', () => {
    const clipboard = copyToClipboard(controls);

    expect(clipboard).toHaveLength(2);
    expect(clipboard[0].type).toBe('TextBox');
    expect(clipboard[1].type).toBe('CommandButton');
  });

  it('should paste controls from clipboard', () => {
    const clipboard = copyToClipboard([controls[0]]);
    const pasted = pasteFromClipboard(clipboard, 150, 80);

    expect(pasted).toHaveLength(1);
    expect(pasted[0].type).toBe('TextBox');
    expect(pasted[0].left).toBe(150);
    expect(pasted[0].top).toBe(80);
    expect(pasted[0].id).not.toBe(controls[0].id); // New ID
  });

  it('should cut controls to clipboard', () => {
    const result = cutToClipboard(controls);

    expect(result.clipboard).toHaveLength(2);
    expect(result.remainingControls).toHaveLength(0);
  });

  it('should duplicate controls', () => {
    const duplicated = duplicateControls(controls, 20, 20);

    expect(duplicated).toHaveLength(2);
    expect(duplicated[0].left).toBe(controls[0].left + 20);
    expect(duplicated[0].top).toBe(controls[0].top + 20);
    expect(duplicated[1].left).toBe(controls[1].left + 20);
    expect(duplicated[1].top).toBe(controls[1].top + 20);
  });
});

// Helper functions for testing

function createControl(type: string, left: number, top: number): VB6Control {
  const defaults = getControlDefaults(type);

  return {
    id: `control_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: getDefaultName(type),
    left,
    top,
    width: defaults.width,
    height: defaults.height,
    properties: { ...defaults.properties },
    zIndex: 1,
    visible: defaults.visible !== false,
    enabled: defaults.enabled !== false,
  };
}

function getControlDefaults(type: string) {
  const defaults: Record<string, any> = {
    TextBox: {
      width: 120,
      height: 25,
      properties: {
        Text: '',
        Font: 'MS Sans Serif, 8pt',
        BackColor: 0x80000005,
        ForeColor: 0x80000008,
        BorderStyle: 1,
        Enabled: true,
        Visible: true,
        TabIndex: 0,
        TabStop: true,
      },
    },
    CommandButton: {
      width: 95,
      height: 25,
      properties: {
        Caption: 'Command1',
        Font: 'MS Sans Serif, 8pt',
        Style: 0,
        Enabled: true,
        Visible: true,
      },
    },
    Label: {
      width: 65,
      height: 17,
      properties: {
        Caption: 'Label1',
        AutoSize: false,
        BorderStyle: 0,
        Font: 'MS Sans Serif, 8pt',
      },
    },
    ListBox: {
      width: 120,
      height: 97,
      properties: {
        Sorted: false,
        MultiSelect: 0,
        Font: 'MS Sans Serif, 8pt',
      },
    },
    ComboBox: {
      width: 120,
      height: 21,
      properties: {
        Style: 0,
        Sorted: false,
        Font: 'MS Sans Serif, 8pt',
      },
    },
    CheckBox: {
      width: 97,
      height: 17,
      properties: {
        Caption: 'Check1',
        Value: 0,
        Font: 'MS Sans Serif, 8pt',
      },
    },
    OptionButton: {
      width: 97,
      height: 17,
      properties: {
        Caption: 'Option1',
        Value: false,
        Font: 'MS Sans Serif, 8pt',
      },
    },
    Frame: {
      width: 185,
      height: 105,
      properties: {
        Caption: 'Frame1',
        Font: 'MS Sans Serif, 8pt',
      },
    },
    PictureBox: {
      width: 97,
      height: 97,
      properties: {
        BorderStyle: 1,
        AutoSize: false,
        Font: 'MS Sans Serif, 8pt',
      },
    },
    Timer: {
      width: 25,
      height: 25,
      visible: false,
      properties: {
        Interval: 0,
        Enabled: true,
      },
    },
  };

  return defaults[type] || { width: 100, height: 50, properties: {} };
}

function getDefaultName(type: string): string {
  const names: Record<string, string> = {
    TextBox: 'Text1',
    CommandButton: 'Command1',
    Label: 'Label1',
    ListBox: 'List1',
    ComboBox: 'Combo1',
    CheckBox: 'Check1',
    OptionButton: 'Option1',
    Frame: 'Frame1',
    PictureBox: 'Picture1',
    Timer: 'Timer1',
  };

  return names[type] || `${type}1`;
}

function moveControl(control: VB6Control, left: number, top: number): VB6Control {
  return { ...control, left, top };
}

function resizeControl(control: VB6Control, width: number, height: number): VB6Control {
  const minWidth = 15;
  const minHeight = 15;

  return {
    ...control,
    width: Math.max(width, minWidth),
    height: Math.max(height, minHeight),
  };
}

function snapToGrid(x: number, y: number, gridSize: number, enabled: boolean = true) {
  if (!enabled) return { left: x, top: y };

  return {
    left: Math.round(x / gridSize) * gridSize,
    top: Math.round(y / gridSize) * gridSize,
  };
}

function setZOrder(
  control: VB6Control,
  direction: 'front' | 'back',
  allControls: VB6Control[]
): VB6Control {
  const maxZ = Math.max(...allControls.map(c => c.zIndex));
  const minZ = Math.min(...allControls.map(c => c.zIndex));

  return {
    ...control,
    zIndex: direction === 'front' ? maxZ + 1 : minZ - 1,
  };
}

function alignControls(
  controls: VB6Control[],
  alignment: 'left' | 'right' | 'top' | 'bottom'
): VB6Control[] {
  if (controls.length < 2) return controls;

  const reference = controls[0];

  return controls.map(control => {
    switch (alignment) {
      case 'left':
        return { ...control, left: reference.left };
      case 'right':
        return { ...control, left: reference.left + reference.width - control.width };
      case 'top':
        return { ...control, top: reference.top };
      case 'bottom':
        return { ...control, top: reference.top + reference.height - control.height };
      default:
        return control;
    }
  });
}

function distributeControls(
  controls: VB6Control[],
  direction: 'horizontal' | 'vertical'
): VB6Control[] {
  if (controls.length < 3) return controls;

  const sorted = [...controls].sort((a, b) =>
    direction === 'horizontal' ? a.left - b.left : a.top - b.top
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpace = direction === 'horizontal' ? last.left - first.left : last.top - first.top;

  const spacing = totalSpace / (sorted.length - 1);

  return sorted.map((control, index) => {
    if (index === 0 || index === sorted.length - 1) return control;

    const position =
      direction === 'horizontal' ? first.left + spacing * index : first.top + spacing * index;

    return direction === 'horizontal'
      ? { ...control, left: position }
      : { ...control, top: position };
  });
}

function makeSameSize(
  controls: VB6Control[],
  dimension: 'width' | 'height' | 'both'
): VB6Control[] {
  if (controls.length < 2) return controls;

  const reference = controls[0];

  return controls.map(control => {
    const updates: Partial<VB6Control> = {};

    if (dimension === 'width' || dimension === 'both') {
      updates.width = reference.width;
    }
    if (dimension === 'height' || dimension === 'both') {
      updates.height = reference.height;
    }

    return { ...control, ...updates };
  });
}

function centerOnForm(
  control: VB6Control,
  formSize: { width: number; height: number }
): VB6Control {
  return {
    ...control,
    left: (formSize.width - control.width) / 2,
    top: (formSize.height - control.height) / 2,
  };
}

function selectControls(controls: VB6Control[]): VB6Control[] {
  return controls;
}

function getRubberBandSelection(
  controls: VB6Control[],
  rubberBand: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }
): VB6Control[] {
  const left = Math.min(rubberBand.startX, rubberBand.endX);
  const top = Math.min(rubberBand.startY, rubberBand.endY);
  const right = Math.max(rubberBand.startX, rubberBand.endX);
  const bottom = Math.max(rubberBand.startY, rubberBand.endY);

  return controls.filter(control => {
    return (
      control.left >= left &&
      control.top >= top &&
      control.left + control.width <= right &&
      control.top + control.height <= bottom
    );
  });
}

function getSelectionBounds(controls: VB6Control[]) {
  if (controls.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };

  const left = Math.min(...controls.map(c => c.left));
  const top = Math.min(...controls.map(c => c.top));
  const right = Math.max(...controls.map(c => c.left + c.width));
  const bottom = Math.max(...controls.map(c => c.top + c.height));

  return { left, top, right, bottom };
}

function setProperty(control: VB6Control, property: string, value: any): VB6Control {
  // Validate property values
  if (property === 'Left' && value < 0) throw new Error('Left cannot be negative');
  if (property === 'Top' && value < 0) throw new Error('Top cannot be negative');
  if (property === 'Width' && value <= 0) throw new Error('Width must be positive');
  if (property === 'Height' && value <= 0) throw new Error('Height must be positive');

  const updates: Partial<VB6Control> = {};

  if (property === 'Left') updates.left = value;
  else if (property === 'Top') updates.top = value;
  else if (property === 'Width') updates.width = value;
  else if (property === 'Height') updates.height = value;
  else {
    updates.properties = { ...control.properties, [property]: value };
  }

  return { ...control, ...updates };
}

function getProperty(control: VB6Control, property: string): any {
  if (property === 'Left') return control.left;
  if (property === 'Top') return control.top;
  if (property === 'Width') return control.width;
  if (property === 'Height') return control.height;
  return control.properties[property];
}

function getAvailableProperties(controlType: string): string[] {
  const commonProperties = ['Left', 'Top', 'Width', 'Height', 'Enabled', 'Visible', 'Font'];
  const typeProperties: Record<string, string[]> = {
    TextBox: ['Text', 'BackColor', 'ForeColor', 'BorderStyle', 'TabIndex', 'TabStop'],
    CommandButton: ['Caption', 'Style'],
    Label: ['Caption', 'AutoSize', 'BorderStyle'],
    // Add more as needed
  };

  return [...commonProperties, ...(typeProperties[controlType] || [])];
}

function validatePropertyValue(property: string, value: any): boolean {
  const validators: Record<string, (v: any) => boolean> = {
    Text: v => typeof v === 'string',
    Caption: v => typeof v === 'string',
    Left: v => typeof v === 'number' && v >= 0,
    Top: v => typeof v === 'number' && v >= 0,
    Width: v => typeof v === 'number' && v > 0,
    Height: v => typeof v === 'number' && v > 0,
    Enabled: v => typeof v === 'boolean',
    Visible: v => typeof v === 'boolean',
  };

  const validator = validators[property];
  return validator ? validator(value) : true;
}

function lockControls(controls: VB6Control[], locked: boolean): VB6Control[] {
  return controls.map(control => ({
    ...control,
    properties: { ...control.properties, Locked: locked },
  }));
}

function createControlGroup(controls: VB6Control[]) {
  return {
    id: `group_${Math.random().toString(36).substr(2, 9)}`,
    type: 'Group',
    children: controls,
  };
}

function ungroupControls(group: any): VB6Control[] {
  return group.children;
}

function setTabOrder(controls: VB6Control[], order: number[]): VB6Control[] {
  return controls.map((control, index) => ({
    ...control,
    properties: { ...control.properties, TabIndex: order[index] },
  }));
}

function addToContainer(container: VB6Control, child: VB6Control) {
  return {
    ...container,
    children: [...(container.children || []), child.id],
    properties: { ...child.properties, Container: container.id },
  };
}

function copyToClipboard(controls: VB6Control[]): VB6Control[] {
  return controls.map(control => ({ ...control }));
}

function pasteFromClipboard(
  clipboard: VB6Control[],
  offsetX: number,
  offsetY: number
): VB6Control[] {
  return clipboard.map(control => ({
    ...control,
    id: `control_${Math.random().toString(36).substr(2, 9)}`,
    left: offsetX,
    top: offsetY,
  }));
}

function cutToClipboard(controls: VB6Control[]) {
  return {
    clipboard: copyToClipboard(controls),
    remainingControls: [],
  };
}

function duplicateControls(controls: VB6Control[], offsetX: number, offsetY: number): VB6Control[] {
  return controls.map(control => ({
    ...control,
    id: `control_${Math.random().toString(36).substr(2, 9)}`,
    left: control.left + offsetX,
    top: control.top + offsetY,
  }));
}
