import { describe, it, expect } from 'vitest';
import { exportFRM, colorToVB6 } from '../utils/vb6FormExporter';
import { Form, Control } from '../context/types';

const form: Form = { id: 1, name: 'Form1', caption: 'Form1', controls: [] };
const controls: Control[] = [
  { id: 1, type: 'CommandButton', name: 'Command1', x: 10, y: 20, width: 80, height: 24, visible: true, enabled: true, caption: 'OK', tabIndex: 0, tabStop: true, tag: '', toolTipText: '' },
];

const formProps = { Width: 320, Height: 240, BackColor: '#8080FF' };

describe('colorToVB6', () => {
  it('converts hex color to BGR format', () => {
    expect(colorToVB6('#FF0000')).toBe('&H000000FF&');
  });
});

describe('exportFRM', () => {
  const frm = exportFRM(form, controls, formProps);
  it('includes form name', () => {
    expect(frm).toContain('Begin VB.Form Form1');
  });
  it('includes control definition', () => {
    expect(frm).toContain('Begin VB.CommandButton Command1');
  });
});
