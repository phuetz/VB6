import React, { useEffect, useRef, useState } from 'react';
import { 
  vb6ActiveXService, 
  IActiveXControl, 
  ActiveXControlType,
  MSChartControl,
  WebBrowserControl
} from '../../services/VB6ActiveXService';
import { AlertTriangle, Loader } from 'lucide-react';

interface ActiveXControlProps {
  id: string;
  name: string;
  progId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  properties?: { [key: string]: any };
  events?: { [key: string]: string };
  isDesignMode?: boolean;
  onPropertyChange?: (name: string, value: any) => void;
  onEvent?: (eventName: string, eventData: any) => void;
}

export const ActiveXControl: React.FC<ActiveXControlProps> = ({
  id,
  name,
  progId,
  left,
  top,
  width,
  height,
  properties = {},
  events = {},
  isDesignMode = true,
  onPropertyChange,
  onEvent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [control, setControl] = useState<IActiveXControl | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize ActiveX control
  useEffect(() => {
    const initializeControl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create control instance
        const activeXControl = await vb6ActiveXService.createControl(progId, id);
        
        // Set initial properties
        Object.entries(properties).forEach(([key, value]) => {
          activeXControl.setProperty(key, value);
        });

        // Subscribe to events
        Object.entries(events).forEach(([eventName, handlerCode]) => {
          activeXControl.events.on(eventName, (eventData: any) => {
            if (!isDesignMode && onEvent) {
              onEvent(eventName, eventData);
            }
          });
        });

        // Subscribe to property changes
        activeXControl.events.on('PropertyChanged', (data: any) => {
          if (onPropertyChange) {
            onPropertyChange(data.name, data.newValue);
          }
        });

        setControl(activeXControl);
      } catch (err: any) {
        setError(err.message || 'Failed to load ActiveX control');
      } finally {
        setIsLoading(false);
      }
    };

    initializeControl();

    // Cleanup
    return () => {
      if (control) {
        vb6ActiveXService.destroyControl(id);
      }
    };
  }, [id, progId]);

  // Update properties when they change
  useEffect(() => {
    if (control) {
      Object.entries(properties).forEach(([key, value]) => {
        if (control.getProperty(key) !== value) {
          control.setProperty(key, value);
        }
      });
    }
  }, [properties, control]);

  // Render control-specific UI
  const renderControlUI = () => {
    if (!control) return null;

    switch (control.type) {
      case ActiveXControlType.MSChart:
        return <MSChartRenderer control={control as MSChartControl} />;
      
      case ActiveXControlType.WebBrowser:
        return <WebBrowserRenderer 
          control={control as WebBrowserControl} 
          isDesignMode={isDesignMode} 
        />;
      
      case ActiveXControlType.MSComm:
        return <MSCommRenderer control={control} isDesignMode={isDesignMode} />;
      
      case ActiveXControlType.CommonDialog:
        return <CommonDialogRenderer control={control} isDesignMode={isDesignMode} />;
      
      default:
        return <GenericActiveXRenderer control={control} isDesignMode={isDesignMode} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute border border-gray-400 bg-white overflow-hidden"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      {isLoading && (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <Loader className="animate-spin text-gray-500" size={24} />
          <span className="ml-2 text-sm text-gray-600">Loading ActiveX...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-2">
          <AlertTriangle className="text-red-500 mb-2" size={24} />
          <div className="text-xs text-red-600 text-center">
            {error}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {progId}
          </div>
        </div>
      )}

      {!isLoading && !error && control && (
        <div className="w-full h-full relative">
          {isDesignMode && (
            <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 z-10">
              {name} ({control.type})
            </div>
          )}
          {renderControlUI()}
        </div>
      )}
    </div>
  );
};

// MSChart Renderer
const MSChartRenderer: React.FC<{ control: MSChartControl }> = ({ control }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = control.getCanvas();
    if (canvas && canvasRef.current) {
      // Safely clear content and append new canvas
      while (canvasRef.current.firstChild) {
        canvasRef.current.removeChild(canvasRef.current.firstChild);
      }
      canvasRef.current.appendChild(canvas);
    }
  }, [control]);

  return <div ref={canvasRef} className="w-full h-full" />;
};

// WebBrowser Renderer
const WebBrowserRenderer: React.FC<{ 
  control: WebBrowserControl; 
  isDesignMode: boolean;
}> = ({ control, isDesignMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const iframe = control.getIFrame();
    if (iframe && containerRef.current) {
      // Safely clear content
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      if (isDesignMode) {
        // In design mode, show a preview using safe DOM creation
        const preview = document.createElement('div');
        preview.className = 'w-full h-full bg-gray-100 flex flex-col';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'bg-gray-200 p-1 flex items-center gap-1';
        
        const urlBox = document.createElement('div');
        urlBox.className = 'bg-white rounded px-2 py-1 text-xs flex-1';
        urlBox.textContent = control.getProperty('LocationURL') || '';
        header.appendChild(urlBox);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'flex-1 bg-white border-t border-gray-300 flex items-center justify-center';
        
        const label = document.createElement('div');
        label.className = 'text-gray-400 text-sm';
        label.textContent = 'Web Browser Control';
        content.appendChild(label);
        
        preview.appendChild(header);
        preview.appendChild(content);
        containerRef.current.appendChild(preview);
      } else {
        // In runtime mode, show actual iframe
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        containerRef.current.appendChild(iframe);
      }
    }
  }, [control, isDesignMode]);

  return <div ref={containerRef} className="w-full h-full" />;
};

// MSComm Renderer
const MSCommRenderer: React.FC<{ 
  control: IActiveXControl; 
  isDesignMode: boolean;
}> = ({ control, isDesignMode }) => {
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    const updateStatus = () => {
      const portOpen = control.getProperty('PortOpen');
      const commPort = control.getProperty('CommPort');
      const settings = control.getProperty('Settings');
      setStatus(portOpen ? `COM${commPort} (${settings})` : 'Disconnected');
    };

    updateStatus();
    control.events.on('PropertyChanged', updateStatus);
    
    return () => {
      control.events.off('PropertyChanged', updateStatus);
    };
  }, [control]);

  return (
    <div className="w-full h-full bg-gray-900 text-green-400 p-2 font-mono text-xs">
      <div className="mb-2">MSComm Control</div>
      <div>Port: {status}</div>
      {!isDesignMode && (
        <div className="mt-2">
          <div>RX: {control.getProperty('Input')?.length || 0} bytes</div>
          <div>TX: {control.getProperty('Output')?.length || 0} bytes</div>
        </div>
      )}
    </div>
  );
};

// CommonDialog Renderer
const CommonDialogRenderer: React.FC<{ 
  control: IActiveXControl; 
  isDesignMode: boolean;
}> = ({ control, isDesignMode }) => {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center p-2">
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700">CommonDialog</div>
        <div className="text-xs text-gray-500 mt-1">
          {control.getProperty('DialogTitle') || 'File Dialog Control'}
        </div>
        {isDesignMode && (
          <div className="text-xs text-gray-400 mt-2">
            (Invisible at runtime)
          </div>
        )}
      </div>
    </div>
  );
};

// Generic ActiveX Renderer
const GenericActiveXRenderer: React.FC<{ 
  control: IActiveXControl; 
  isDesignMode: boolean;
}> = ({ control, isDesignMode }) => {
  return (
    <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center p-2">
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700">{control.type}</div>
        <div className="text-xs text-gray-500 mt-1">
          Version {control.version}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          ActiveX Control
        </div>
      </div>
    </div>
  );
};

export default ActiveXControl;