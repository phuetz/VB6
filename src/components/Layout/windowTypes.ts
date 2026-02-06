import React from 'react';

export interface PanelConfig {
  id: string;
  storeKey: string;
  component: React.ComponentType<any>;
  boundaryType: 'panel' | 'debug';
  panelName?: string;
  className?: string;
  /** When true, passes `visible` and `onClose` props to the component */
  visibilityControlled?: boolean;
}
