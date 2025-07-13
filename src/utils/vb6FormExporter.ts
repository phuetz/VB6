export function colorToVB6(color: string): string {
  const hex = color.replace('#', '').padStart(6, '0');
  const r = hex.substring(0, 2);
  const g = hex.substring(2, 4);
  const b = hex.substring(4, 6);
  return `&H00${b}${g}${r}&`;
}

import { Form, Control } from '../context/types';

export function exportFRM(form: Form, controls: Control[], formProps: any): string {
  const tw = (n: number) => Math.round(n * 15);
  const lines: string[] = [];
  lines.push('VERSION 5.00');
  lines.push(`Begin VB.Form ${form.name}`);
  lines.push(`   Caption         =   "${form.caption}"`);
  if (formProps.Width) lines.push(`   ClientWidth     =   ${tw(formProps.Width)}`);
  if (formProps.Height) lines.push(`   ClientHeight    =   ${tw(formProps.Height)}`);
  if (formProps.BackColor) lines.push(`   BackColor       =   ${colorToVB6(formProps.BackColor)}`);

  controls.forEach(ctrl => {
    lines.push(`   Begin VB.${ctrl.type} ${ctrl.name}`);
    if (ctrl.caption) lines.push(`      Caption         =   "${ctrl.caption}"`);
    lines.push(`      Left            =   ${tw(ctrl.x)}`);
    lines.push(`      Top             =   ${tw(ctrl.y)}`);
    lines.push(`      Width           =   ${tw(ctrl.width)}`);
    lines.push(`      Height          =   ${tw(ctrl.height)}`);
    lines.push('   End');
  });

  lines.push('End');
  lines.push(`Attribute VB_Name = "${form.name}"`);
  return lines.join('\n');
}
