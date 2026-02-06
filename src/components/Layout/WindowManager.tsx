import React from 'react';
import { useWindowStore } from '../../stores/windowStore';
import { shallow } from 'zustand/shallow';
import { PanelErrorBoundary, DebugErrorBoundary } from '../ErrorBoundary';
import type { PanelConfig } from './windowTypes';

interface WindowManagerProps {
  panels: PanelConfig[];
}

const WindowManager: React.FC<WindowManagerProps> = ({ panels }) => {
  const storeKeys = panels.map(p => p.storeKey);
  const visibility = useWindowStore(state => {
    const result: Record<string, boolean> = {};
    for (const key of storeKeys) {
      result[key] = !!(state as any)[key];
    }
    return result;
  }, shallow);
  const toggleWindow = useWindowStore(state => state.toggleWindow);

  return (
    <>
      {panels.map(panel => {
        const visible = visibility[panel.storeKey];
        if (!visible) return null;

        const Component = panel.component;
        const props: Record<string, any> = {};
        if (panel.className) props.className = panel.className;
        if (panel.visibilityControlled) {
          props.visible = visible;
          props.onClose = () => toggleWindow(panel.storeKey);
        }

        if (panel.boundaryType === 'debug') {
          return (
            <DebugErrorBoundary key={panel.id}>
              <Component {...props} />
            </DebugErrorBoundary>
          );
        }

        return (
          <PanelErrorBoundary key={panel.id} panelName={panel.panelName || panel.id}>
            <Component {...props} />
          </PanelErrorBoundary>
        );
      })}
    </>
  );
};

export default WindowManager;
