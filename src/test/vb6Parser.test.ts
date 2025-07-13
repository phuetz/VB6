import { describe, it, expect } from 'vitest';
import { parseVB6Module } from '../utils/vb6Parser';

const sample = `Attribute VB_Name = "Module1"
Option Explicit
Dim x As Integer

Public Event SomethingHappened(value As Integer)

Private Sub Hello(name As String)
  MsgBox "Hi " & name
End Sub

Public Function Add(a As Integer, b As Integer) As Integer
  Add = a + b
End Function

Public Property Get Count() As Integer
  Count = x
End Property

Public Property Let Count(val As Integer)
  x = val
End Property`;

describe('parseVB6Module', () => {
  const ast = parseVB6Module(sample, 'Module1');

  it('parses module variables', () => {
    expect(ast.variables).toHaveLength(1);
    expect(ast.variables[0].name).toBe('x');
    expect(ast.variables[0].varType).toBe('Integer');
  });

  it('parses procedures', () => {
    expect(ast.procedures).toHaveLength(2);
    const names = ast.procedures.map(p => p.name);
    expect(names).toContain('Hello');
    expect(names).toContain('Add');
    const add = ast.procedures.find(p => p.name === 'Add')!;
    expect(add.parameters).toHaveLength(2);
    expect(add.returnType).toBe('Integer');
  });

  it('parses events', () => {
    expect(ast.events).toHaveLength(1);
    expect(ast.events[0].name).toBe('SomethingHappened');
    expect(ast.events[0].parameters[0].name).toBe('value');
  });

  it('parses properties', () => {
    expect(ast.properties).toHaveLength(1);
    const prop = ast.properties[0];
    expect(prop.name).toBe('Count');
    expect(prop.getter).toBeDefined();
    expect(prop.setter).toBeDefined();
  });
});
