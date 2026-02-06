/**
 * UserControl - Base class for VB6 User Controls (.ctl)
 * Provides the foundation for creating custom VB6 user controls
 * Handles property management, events, and constituent control composition
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback, useMemo } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';
import {
  VB6UserControlManagerInstance,
  UserControlDefinition,
  UserControlInstance,
} from '../../services/VB6UserControlManager';
import { Control } from '../../context/types';

export interface UserControlProps extends VB6ControlPropsEnhanced {
  controlName: string; // Name of the registered user control
  initialProperties?: { [key: string]: any }; // Initial property values
  isDesignMode?: boolean;

  // Event handlers
  onPropertyChanged?: (propertyName: string, value: any, oldValue: any) => void;
  onMethodCalled?: (methodName: string, args: any[], result: any) => void;
  onEventFired?: (eventName: string, eventData: any) => void;
}

export const UserControl = forwardRef<HTMLDivElement, UserControlProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width: propsWidth,
    height: propsHeight,
    visible = true,
    enabled = true,
    controlName,
    initialProperties = {},
    isDesignMode = false,
    onPropertyChanged,
    onMethodCalled,
    onEventFired,
    ...rest
  } = props;

  // State management
  const [instance, setInstance] = useState<UserControlInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentProperties, setCurrentProperties] = useState<{ [key: string]: any }>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Get the user control definition
  const definition = useMemo(() => {
    return VB6UserControlManagerInstance.getUserControlDefinition(controlName);
  }, [controlName]);

  // Use definition dimensions if props don't specify
  const width = propsWidth || definition?.width || 150;
  const height = propsHeight || definition?.height || 150;

  // Create user control instance
  useEffect(() => {
    if (!definition) {
      setError(`User control '${controlName}' not found. Make sure it's registered.`);
      return;
    }

    try {
      const userControlInstance = VB6UserControlManagerInstance.createUserControlInstance(
        controlName,
        initialProperties
      );

      if (userControlInstance) {
        userControlInstance.isDesignMode = isDesignMode;
        setInstance(userControlInstance);
        setCurrentProperties({ ...userControlInstance.propertyValues });
        setIsInitialized(true);
        setError('');
      } else {
        setError(`Failed to create instance of user control '${controlName}'`);
      }
    } catch (err) {
      setError(`Error creating user control instance: ${err}`);
    }

    // Cleanup on unmount
    return () => {
      if (instance) {
        VB6UserControlManagerInstance.destroyUserControlInstance(instance.id);
      }
    };
  }, [controlName, initialProperties, isDesignMode]);

  // VB6 Methods for external access
  const vb6Methods = useMemo(() => {
    if (!instance || !definition) return {};

    const methods: { [key: string]: any } = {};

    // Property getters and setters
    definition.properties.forEach(prop => {
      Object.defineProperty(methods, prop.name, {
        get: () => {
          return VB6UserControlManagerInstance.getUserControlProperty(instance.id, prop.name);
        },
        set: (value: any) => {
          const oldValue = currentProperties[prop.name];
          if (VB6UserControlManagerInstance.setUserControlProperty(instance.id, prop.name, value)) {
            setCurrentProperties(prev => ({ ...prev, [prop.name]: value }));
            onPropertyChanged?.(prop.name, value, oldValue);
            fireEvent(name, 'PropertyChanged', { propertyName: prop.name, value, oldValue });
          }
        },
      });
    });

    // Custom methods
    definition.methods.forEach(method => {
      methods[method.name] = (...args: any[]) => {
        const result = VB6UserControlManagerInstance.callUserControlMethod(
          instance.id,
          method.name,
          ...args
        );
        onMethodCalled?.(method.name, args, result);
        fireEvent(name, 'MethodCalled', { methodName: method.name, args, result });
        return result;
      };
    });

    // Standard UserControl methods
    methods.Refresh = () => {
      // Force re-render
      setCurrentProperties({ ...instance.propertyValues });
    };

    methods.SetFocus = () => {
      if (containerRef.current) {
        containerRef.current.focus();
      }
    };

    methods.ZOrder = (position?: number) => {
      if (containerRef.current && position !== undefined) {
        containerRef.current.style.zIndex = String(position);
      }
    };

    methods.Move = (newLeft?: number, newTop?: number, newWidth?: number, newHeight?: number) => {
      if (containerRef.current) {
        if (newLeft !== undefined) containerRef.current.style.left = `${newLeft}px`;
        if (newTop !== undefined) containerRef.current.style.top = `${newTop}px`;
        if (newWidth !== undefined) containerRef.current.style.width = `${newWidth}px`;
        if (newHeight !== undefined) {
          containerRef.current.style.height = `${newHeight}px`;
          VB6UserControlManagerInstance.resizeUserControl(
            instance.id,
            newWidth || width,
            newHeight
          );
        }
      }
    };

    // Event subscription methods
    methods.AddEventHandler = (eventName: string, handler: (...args: any[]) => void) => {
      return VB6UserControlManagerInstance.addEventHandler(instance.id, eventName, handler);
    };

    methods.RemoveEventHandler = (eventName: string, handler: (...args: any[]) => void) => {
      return VB6UserControlManagerInstance.removeEventHandler(instance.id, eventName, handler);
    };

    return methods;
  }, [
    instance,
    definition,
    currentProperties,
    onPropertyChanged,
    onMethodCalled,
    fireEvent,
    name,
    width,
    height,
  ]);

  // Handle internal events from user control
  useEffect(() => {
    if (!instance) return;

    // Set up event forwarding
    const eventForwarder = (eventData: any) => {
      onEventFired?.(eventData.eventName, eventData);
      fireEvent(name, eventData.eventName, eventData);
    };

    // Subscribe to all events
    definition?.events.forEach(eventDef => {
      VB6UserControlManagerInstance.addEventHandler(instance.id, eventDef.name, eventForwarder);
    });

    return () => {
      // Cleanup event handlers
      definition?.events.forEach(eventDef => {
        VB6UserControlManagerInstance.removeEventHandler(
          instance.id,
          eventDef.name,
          eventForwarder
        );
      });
    };
  }, [instance, definition, onEventFired, fireEvent, name]);

  // Update control properties in store
  useEffect(() => {
    if (!instance) return;

    updateControl(id, 'userControlInstance', instance);
    updateControl(id, 'properties', currentProperties);
    updateControl(id, 'vb6Methods', vb6Methods);
    updateControl(id, 'definition', definition);

    Object.entries(currentProperties).forEach(([propName, value]) => {
      updateControl(id, propName, value);
    });
  }, [id, instance, currentProperties, vb6Methods, definition, updateControl]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined' && vb6Methods) {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = vb6Methods;
    }
  }, [name, vb6Methods]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (instance) {
      VB6UserControlManagerInstance.resizeUserControl(instance.id, width, height);
    }
  }, [instance, width, height]);

  // Handle clicks and other events
  const handleClick = useCallback(() => {
    if (!enabled || !instance) return;

    VB6UserControlManagerInstance.fireUserControlEvent(instance, 'Click', {});
    fireEvent(name, 'Click', {});
  }, [enabled, instance, fireEvent, name]);

  const handleDoubleClick = useCallback(() => {
    if (!enabled || !instance) return;

    VB6UserControlManagerInstance.fireUserControlEvent(instance, 'DblClick', {});
    fireEvent(name, 'DblClick', {});
  }, [enabled, instance, fireEvent, name]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !instance) return;

      const eventData = {
        button: e.button,
        shift: e.shiftKey,
        x: e.clientX,
        y: e.clientY,
      };

      VB6UserControlManagerInstance.fireUserControlEvent(instance, 'MouseDown', eventData);
      fireEvent(name, 'MouseDown', eventData);
    },
    [enabled, instance, fireEvent, name]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !instance) return;

      const eventData = {
        button: e.button,
        shift: e.shiftKey,
        x: e.clientX,
        y: e.clientY,
      };

      VB6UserControlManagerInstance.fireUserControlEvent(instance, 'MouseUp', eventData);
      fireEvent(name, 'MouseUp', eventData);
    },
    [enabled, instance, fireEvent, name]
  );

  if (!visible) return null;

  // Error state
  if (error) {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          border: '2px dashed #FF0000',
          backgroundColor: '#FFF0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#CC0000',
          textAlign: 'center',
          padding: '8px',
        }}
        {...rest}
      >
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>UserControl Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isInitialized || !instance || !definition) {
    return (
      <div
        ref={ref}
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          border: '1px dashed #808080',
          backgroundColor: '#F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666666',
        }}
        {...rest}
      >
        Loading {controlName}...
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    backgroundColor: definition.backColor || '#F0F0F0',
    color: definition.foreColor || '#000000',
    border: isDesignMode ? '1px dashed #0066CC' : 'none',
    overflow: 'hidden',
    opacity: enabled ? 1 : 0.5,
    cursor: enabled ? 'default' : 'not-allowed',
    userSelect: 'none',
  };

  return (
    <div
      ref={ref}
      style={containerStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      title={`UserControl: ${controlName}`}
      data-user-control={controlName}
      data-instance-id={instance.id}
      {...rest}
    >
      {/* Render constituent controls */}
      {instance.constituent.map((control, index) => (
        <ConstituentControlRenderer
          key={control.id}
          control={control}
          isDesignMode={isDesignMode}
          userControlInstance={instance}
        />
      ))}

      {/* Design mode overlay */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            border: '2px dashed #0066CC',
            backgroundColor: 'rgba(0, 102, 204, 0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: 0,
              backgroundColor: '#0066CC',
              color: '#FFFFFF',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            {controlName}
          </div>
        </div>
      )}

      {/* Runtime info (development mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            fontSize: '8px',
            color: '#666666',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '1px 3px',
            borderRadius: '2px',
          }}
        >
          {instance.id}
        </div>
      )}
    </div>
  );
});

// Helper component to render constituent controls
interface ConstituentControlRendererProps {
  control: Control;
  isDesignMode: boolean;
  userControlInstance: UserControlInstance;
}

const ConstituentControlRenderer: React.FC<ConstituentControlRendererProps> = ({
  control,
  isDesignMode,
  userControlInstance,
}) => {
  // This would render the appropriate VB6 control based on the control type
  // For now, render a placeholder
  return (
    <div
      style={{
        position: 'absolute',
        left: control.left || 0,
        top: control.top || 0,
        width: control.width || 50,
        height: control.height || 20,
        border: '1px solid #C0C0C0',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#666666',
      }}
    >
      {control.type}: {control.name}
    </div>
  );
};

UserControl.displayName = 'UserControl';

// Default properties for UserControl
export const getUserControlDefaults = (id: number, controlName: string) => ({
  id,
  type: 'UserControl',
  name: `${controlName}${id}`,
  left: 100,
  top: 100,
  width: 150,
  height: 150,
  controlName,
  visible: true,
  enabled: true,
  tabIndex: id,
});

export default UserControl;
