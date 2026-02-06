// Export centralisé de tous les contrôles VB6
export * from './VB6Controls';
export * from './LineControl';
export * from './ShapeControl';
export * from './ImageControl';
export * from './AdvancedControls';
export * from './ComplexControls';
export * from './ListViewControl';
export * from './TreeViewControl';
export * from './VB6ControlsEnhanced';
export * from './DriveListBox';
export * from './DirListBox';
export * from './FileListBox';
export * from './DataControl';
export * from './ADODataControl';
export * from './OLEControl';
export * from './WinsockControl';
export * from './InetControl';

// Factory pour créer des contrôles dynamiquement
import { LineControl, getLineDefaults } from './LineControl';
import { ShapeControl, getShapeDefaults } from './ShapeControl';
import { ImageControl, getImageDefaults } from './ImageControl';
import { DriveListBox, getDriveListBoxDefaults } from './DriveListBox';
import { DirListBox, getDirListBoxDefaults } from './DirListBox';
import { FileListBox, getFileListBoxDefaults } from './FileListBox';
import { DataControl, getDataControlDefaults } from './DataControl';
import { ADODataControl, getADODataControlDefaults } from './ADODataControl';
import { OLEControl, getOLEControlDefaults } from './OLEControl';
import { WinsockControl, getWinsockControlDefaults } from './WinsockControl';
import { InetControl, getInetControlDefaults } from './InetControl';
import React from 'react';

export const ControlFactory = {
  Line: {
    component: LineControl,
    defaults: getLineDefaults,
  },
  Shape: {
    component: ShapeControl,
    defaults: getShapeDefaults,
  },
  Image: {
    component: ImageControl,
    defaults: getImageDefaults,
  },
  DriveListBox: {
    component: DriveListBox,
    defaults: getDriveListBoxDefaults,
  },
  DirListBox: {
    component: DirListBox,
    defaults: getDirListBoxDefaults,
  },
  FileListBox: {
    component: FileListBox,
    defaults: getFileListBoxDefaults,
  },
  Data: {
    component: DataControl,
    defaults: getDataControlDefaults,
  },
  ADODataControl: {
    component: ADODataControl,
    defaults: getADODataControlDefaults,
  },
  OLE: {
    component: OLEControl,
    defaults: getOLEControlDefaults,
  },
  Winsock: {
    component: WinsockControl,
    defaults: getWinsockControlDefaults,
  },
  Inet: {
    component: InetControl,
    defaults: getInetControlDefaults,
  },
  // Les autres contrôles suivront le même pattern
};

// Fonction helper pour créer un contrôle
export const createControl = (type: string, id: number, props?: any) => {
  const factory = ControlFactory[type as keyof typeof ControlFactory];
  if (!factory) {
    console.warn(`Control type "${type}" not found in factory`);
    return null;
  }

  const defaults = factory.defaults(id);
  const finalProps = { ...defaults, ...props };

  return React.createElement(factory.component, finalProps);
};
