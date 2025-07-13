import { describe, it, expect } from 'vitest';
import { parseVBP, parseFRM } from '../utils/vb6ProjectImporter';

const vbpSample = `Type=Exe
Form=Form1.frm
Module=Module1.bas
Class=Class1.cls
Reference=*
Startup="Form1"`;

const frmSample = `VERSION 5.00
Begin VB.Form Form1
   Caption         =   "Form1"
   ClientHeight    =   3000
   ClientWidth     =   4800
   Begin VB.CommandButton Command1
      Caption         =   "OK"
      Left            =   60
      Top             =   60
      Width           =   1200
      Height          =   375
   End
End
Attribute VB_Name = "Form1"`;

describe('parseVBP', () => {
  const info = parseVBP(vbpSample);
  it('parses forms', () => {
    expect(info.forms).toContain('Form1.frm');
  });
  it('parses modules', () => {
    expect(info.modules).toContain('Module1.bas');
  });
  it('parses classes', () => {
    expect(info.classes).toContain('Class1.cls');
  });
  it('reads startup object', () => {
    expect(info.startup).toBe('Form1');
  });
});

describe('parseFRM', () => {
  const info = parseFRM(frmSample);
  it('extracts name', () => {
    expect(info.name).toBe('Form1');
  });
  it('keeps code', () => {
    expect(info.code).toContain('VERSION 5.00');
  });
  it('parses form properties', () => {
    expect(info.properties.Caption).toBe('Form1');
    expect(info.properties.ClientWidth).toBe('4800');
  });
  it('parses controls', () => {
    expect(info.controls.length).toBe(1);
    expect(info.controls[0].name).toBe('Command1');
    expect(info.controls[0].properties.Left).toBe('60');
  });
});
