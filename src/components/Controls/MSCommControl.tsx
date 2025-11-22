/**
 * VB6 MSComm Control Implementation
 * 
 * Serial communication control with web-compatible simulation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface MSCommControl {
  type: 'MSComm';
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  
  // Communication Properties
  commPort: number; // COM port number (1-16)
  settings: string; // "9600,N,8,1" format
  portOpen: boolean;
  handshaking: number; // 0=None, 1=XOnXOff, 2=RTS, 3=RTSXOnXOff
  dtREnable: boolean; // Data Terminal Ready
  rtSEnable: boolean; // Request To Send
  
  // Buffer Properties
  inBufferSize: number;
  inBufferCount: number;
  outBufferSize: number;
  outBufferCount: number;
  
  // Input/Output
  input: string;
  output: string;
  
  // Timeouts
  sThreshold: number; // Send threshold
  rThreshold: number; // Receive threshold
  
  // Status Properties
  cdHolding: boolean; // Carrier Detect
  ctsHolding: boolean; // Clear To Send
  dsrHolding: boolean; // Data Set Ready
  
  // Error Properties
  commEvent: number; // Last communication event
  commID: number; // Communication ID
  
  // Behavior
  enabled: boolean;
  visible: boolean;
  tag: string;
  
  // Events
  onComm?: string;
}

// MSComm Constants
export const MSCommConstants = {
  // Communication Events
  comEvSend: 1,     // Send event
  comEvReceive: 2,  // Receive event
  comEvCTS: 3,      // Change in CTS
  comEvDSR: 4,      // Change in DSR
  comEvCD: 5,       // Change in CD
  comEvRing: 6,     // Ring detect
  comEvEOF: 7,      // EOF detect
  
  // Error Events  
  comBreak: 1001,   // Break signal received
  comCDTO: 1002,    // Carrier Detect Timeout
  comCTSTO: 1003,   // Clear To Send Timeout
  comDSRTO: 1004,   // Data Set Ready Timeout
  comFrame: 1005,   // Framing Error
  comOverrun: 1006, // Data Lost
  comRxOver: 1007,  // Receive buffer overflow
  comRxParity: 1008, // Parity Error
  comTxFull: 1009,  // Transmit buffer full
  comDCB: 1010,     // Unexpected error retrieving DCB
  
  // Handshaking Constants
  comNone: 0,       // No handshaking
  comXOnXOff: 1,    // XOn/XOff handshaking
  comRTS: 2,        // Request-to-send handshaking
  comRTSXOnXOff: 3, // Both RTS and XOn/XOff
  
  // Input Mode Constants
  comInputModeText: 0,   // Text mode
  comInputModeBinary: 1, // Binary mode
  
  // OnComm Constants
  comEventBreak: 1001,
  comEventFrame: 1004,
  comEventOverrun: 1006,
  comEventRxOver: 1007,
  comEventRxParity: 1008,
  comEventTxFull: 1009,
  comEventDCB: 1010
};

interface MSCommControlProps {
  control: MSCommControl;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
  onEvent?: (eventName: string, eventData?: any) => void;
}

export const MSCommControl: React.FC<MSCommControlProps> = ({
  control,
  isDesignMode = false,
  onPropertyChange,
  onEvent
}) => {
  const {
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    commPort = 1,
    settings = "9600,N,8,1",
    portOpen = false,
    handshaking = MSCommConstants.comNone,
    dtREnable = true,
    rtSEnable = true,
    inBufferSize = 1024,
    inBufferCount = 0,
    outBufferSize = 512,
    outBufferCount = 0,
    input = '',
    output = '',
    sThreshold = 0,
    rThreshold = 0,
    cdHolding = false,
    ctsHolding = true,
    dsrHolding = true,
    commEvent = 0,
    commID = 0,
    enabled = true,
    visible = true,
    tag = ''
  } = control;

  const [isPortOpen, setIsPortOpen] = useState(portOpen);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [outputBuffer, setOutputBuffer] = useState<string>('');
  const [lastCommEvent, setLastCommEvent] = useState(commEvent);
  const [currentCommID, setCurrentCommID] = useState(commID);
  const [serialPort, setSerialPort] = useState<any>(null);
  
  const inputBufferRef = useRef<string>('');
  const outputBufferRef = useRef<string>('');

  // Parse settings string (e.g., "9600,N,8,1")
  const parseSettings = useCallback((settingsStr: string) => {
    const parts = settingsStr.split(',');
    return {
      baudRate: parseInt(parts[0]) || 9600,
      parity: parts[1] || 'N',
      dataBits: parseInt(parts[2]) || 8,
      stopBits: parseInt(parts[3]) || 1
    };
  }, []);

  // Open the communication port
  const openPort = useCallback(async () => {
    if (!enabled) return;

    try {
      // Check for Web Serial API support
      if ('serial' in navigator) {
        try {
          const port = await (navigator as any).serial.requestPort();
          const parsedSettings = parseSettings(settings);
          
          await port.open({
            baudRate: parsedSettings.baudRate,
            dataBits: parsedSettings.dataBits,
            stopBits: parsedSettings.stopBits,
            parity: parsedSettings.parity === 'N' ? 'none' : 
                   parsedSettings.parity === 'E' ? 'even' : 'odd'
          });
          
          setSerialPort(port);
          setIsPortOpen(true);
          onPropertyChange?.('portOpen', true);
          
          // Start reading from port
          readFromPort(port);
          
          setLastCommEvent(MSCommConstants.comEvSend);
          onEvent?.('Comm', { event: MSCommConstants.comEvSend });
          
        } catch (error) {
          console.warn('Serial port access denied or failed:', error);
          // Fallback to simulation mode
          simulatePortOpen();
        }
      } else {
        // Fallback to simulation mode
        simulatePortOpen();
      }
    } catch (error) {
      setLastCommEvent(MSCommConstants.comDCB);
      onEvent?.('Comm', { event: MSCommConstants.comDCB, error });
    }
  }, [enabled, settings, parseSettings, onPropertyChange, onEvent]);

  // Simulate port opening for demo/testing
  const simulatePortOpen = useCallback(() => {
    setIsPortOpen(true);
    onPropertyChange?.('portOpen', true);
    
    // Simulate some initial status
    onPropertyChange?.('ctsHolding', true);
    onPropertyChange?.('dsrHolding', true);
    onPropertyChange?.('cdHolding', true);
    
    setLastCommEvent(MSCommConstants.comEvSend);
    onEvent?.('Comm', { event: MSCommConstants.comEvSend });
    
    // Simulate receiving some data after a delay
    setTimeout(() => {
      simulateDataReceived('AT\r\nOK\r\n');
    }, 1000);
  }, [onPropertyChange, onEvent]);

  // Close the communication port
  const closePort = useCallback(async () => {
    try {
      if (serialPort) {
        await serialPort.close();
        setSerialPort(null);
      }
      
      setIsPortOpen(false);
      onPropertyChange?.('portOpen', false);
      
      // Clear buffers
      setInputBuffer('');
      setOutputBuffer('');
      inputBufferRef.current = '';
      outputBufferRef.current = '';
      
      onPropertyChange?.('inBufferCount', 0);
      onPropertyChange?.('outBufferCount', 0);
      
    } catch (error) {
      console.error('Error closing port:', error);
    }
  }, [serialPort, onPropertyChange]);

  // Read from serial port
  const readFromPort = useCallback(async (port: any) => {
    try {
      const reader = port.readable.getReader();
      
      while (port.readable) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        inputBufferRef.current += text;
        setInputBuffer(inputBufferRef.current);
        
        onPropertyChange?.('inBufferCount', inputBufferRef.current.length);
        onPropertyChange?.('input', inputBufferRef.current);
        
        if (inputBufferRef.current.length >= rThreshold && rThreshold > 0) {
          setLastCommEvent(MSCommConstants.comEvReceive);
          onEvent?.('Comm', { event: MSCommConstants.comEvReceive });
        }
      }
      
      reader.releaseLock();
    } catch (error) {
      console.error('Error reading from port:', error);
    }
  }, [rThreshold, onPropertyChange, onEvent]);

  // Write to serial port
  const writeToPort = useCallback(async (data: string) => {
    if (!isPortOpen) return;

    try {
      if (serialPort) {
        const writer = serialPort.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(data));
        writer.releaseLock();
      } else {
        // Simulation mode - echo data back
        setTimeout(() => {
          simulateDataReceived(`ECHO: ${data}`);
        }, 100);
      }
      
      // Update output buffer
      outputBufferRef.current += data;
      setOutputBuffer(outputBufferRef.current);
      onPropertyChange?.('outBufferCount', outputBufferRef.current.length);
      
      if (outputBufferRef.current.length >= sThreshold && sThreshold > 0) {
        setLastCommEvent(MSCommConstants.comEvSend);
        onEvent?.('Comm', { event: MSCommConstants.comEvSend });
      }
      
    } catch (error) {
      setLastCommEvent(MSCommConstants.comTxFull);
      onEvent?.('Comm', { event: MSCommConstants.comTxFull, error });
    }
  }, [isPortOpen, serialPort, sThreshold, onPropertyChange, onEvent]);

  // Simulate data received (for demo purposes)
  const simulateDataReceived = useCallback((data: string) => {
    inputBufferRef.current += data;
    setInputBuffer(inputBufferRef.current);
    
    onPropertyChange?.('inBufferCount', inputBufferRef.current.length);
    onPropertyChange?.('input', inputBufferRef.current);
    
    setLastCommEvent(MSCommConstants.comEvReceive);
    onEvent?.('Comm', { event: MSCommConstants.comEvReceive });
  }, [onPropertyChange, onEvent]);

  // Handle double click to open/close port
  const handleDoubleClick = useCallback(() => {
    if (!enabled) return;
    
    if (isPortOpen) {
      closePort();
    } else {
      openPort();
    }
  }, [enabled, isPortOpen, openPort, closePort]);

  // Send data
  const sendData = useCallback((data: string) => {
    if (!isPortOpen) {
      throw new Error('Port is not open');
    }
    
    writeToPort(data);
    onPropertyChange?.('output', data);
  }, [isPortOpen, writeToPort, onPropertyChange]);

  // Clear input buffer
  const clearInput = useCallback(() => {
    inputBufferRef.current = '';
    setInputBuffer('');
    onPropertyChange?.('inBufferCount', 0);
    onPropertyChange?.('input', '');
  }, [onPropertyChange]);

  // Clear output buffer
  const clearOutput = useCallback(() => {
    outputBufferRef.current = '';
    setOutputBuffer('');
    onPropertyChange?.('outBufferCount', 0);
  }, [onPropertyChange]);

  // Effect to handle port open state changes
  useEffect(() => {
    if (portOpen !== isPortOpen) {
      if (portOpen) {
        openPort();
      } else {
        closePort();
      }
    }
  }, [portOpen, isPortOpen, openPort, closePort]);

  if (!visible) {
    return null;
  }

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid #808080',
    background: isPortOpen ? '#90EE90' : '#F0F0F0',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontFamily: 'Tahoma, Arial, sans-serif'
  };

  return (
    <div
      className={`vb6-mscomm ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
      data-name={name}
      data-type="MSComm"
      title={`MSComm - COM${commPort} ${isPortOpen ? 'Open' : 'Closed'}`}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', marginBottom: '2px' }}>
          {isPortOpen ? '🔌' : '📱'}
        </div>
        <div>COM{commPort}</div>
        <div style={{ fontSize: '8px' }}>
          {isPortOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            fontSize: '10px',
            color: '#666',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {name} - COM{commPort} ({settings})
        </div>
      )}
    </div>
  );
};

// MSComm Helper Functions
export const MSCommHelpers = {
  /**
   * Create default MSComm control
   */
  createMSComm: (commPort: number = 1, settings: string = "9600,N,8,1"): MSCommControl => {
    return {
      type: 'MSComm',
      name: 'MSComm1',
      left: 0,
      top: 0,
      width: 32,
      height: 32,
      commPort,
      settings,
      portOpen: false,
      handshaking: MSCommConstants.comNone,
      dtREnable: true,
      rtSEnable: true,
      inBufferSize: 1024,
      inBufferCount: 0,
      outBufferSize: 512,
      outBufferCount: 0,
      input: '',
      output: '',
      sThreshold: 0,
      rThreshold: 0,
      cdHolding: false,
      ctsHolding: true,
      dsrHolding: true,
      commEvent: 0,
      commID: 0,
      enabled: true,
      visible: true,
      tag: ''
    };
  },

  /**
   * Parse communication settings
   */
  parseSettings: (settings: string) => {
    const parts = settings.split(',');
    return {
      baudRate: parseInt(parts[0]) || 9600,
      parity: parts[1] || 'N', // N=None, E=Even, O=Odd
      dataBits: parseInt(parts[2]) || 8,
      stopBits: parseInt(parts[3]) || 1
    };
  },

  /**
   * Format settings string
   */
  formatSettings: (baudRate: number, parity: string, dataBits: number, stopBits: number): string => {
    return `${baudRate},${parity},${dataBits},${stopBits}`;
  },

  /**
   * Get available COM ports (simulation)
   */
  getAvailablePorts: (): number[] => {
    // In real implementation, this would query the system
    return [1, 2, 3, 4]; // Simulate COM1-COM4
  },

  /**
   * Validate settings string
   */
  validateSettings: (settings: string): boolean => {
    const parts = settings.split(',');
    if (parts.length !== 4) return false;
    
    const baudRate = parseInt(parts[0]);
    const parity = parts[1].toUpperCase();
    const dataBits = parseInt(parts[2]);
    const stopBits = parseInt(parts[3]);
    
    const validBaudRates = [110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 56000, 57600, 115200];
    const validParity = ['N', 'E', 'O', 'M', 'S'];
    const validDataBits = [4, 5, 6, 7, 8];
    const validStopBits = [1, 1.5, 2];
    
    return validBaudRates.includes(baudRate) &&
           validParity.includes(parity) &&
           validDataBits.includes(dataBits) &&
           validStopBits.includes(stopBits);
  },

  /**
   * Format comm event name
   */
  getCommEventName: (eventCode: number): string => {
    const eventNames: { [key: number]: string } = {
      [MSCommConstants.comEvSend]: 'Send',
      [MSCommConstants.comEvReceive]: 'Receive',
      [MSCommConstants.comEvCTS]: 'CTS Changed',
      [MSCommConstants.comEvDSR]: 'DSR Changed', 
      [MSCommConstants.comEvCD]: 'CD Changed',
      [MSCommConstants.comEvRing]: 'Ring Detect',
      [MSCommConstants.comEvEOF]: 'EOF Detect',
      [MSCommConstants.comBreak]: 'Break Signal',
      [MSCommConstants.comCDTO]: 'CD Timeout',
      [MSCommConstants.comCTSTO]: 'CTS Timeout',
      [MSCommConstants.comDSRTO]: 'DSR Timeout',
      [MSCommConstants.comFrame]: 'Framing Error',
      [MSCommConstants.comOverrun]: 'Data Lost',
      [MSCommConstants.comRxOver]: 'RX Buffer Overflow',
      [MSCommConstants.comRxParity]: 'Parity Error',
      [MSCommConstants.comTxFull]: 'TX Buffer Full',
      [MSCommConstants.comDCB]: 'DCB Error'
    };

    return eventNames[eventCode] || `Unknown Event ${eventCode}`;
  }
};

// VB6 MSComm Methods simulation
export const MSCommMethods = {
  /**
   * Open communication port
   */
  openPort: (control: MSCommControl): boolean => {
    try {
      // Validation
      if (control.commPort < 1 || control.commPort > 16) {
        throw new Error('Invalid port number');
      }
      
      if (!MSCommHelpers.validateSettings(control.settings)) {
        throw new Error('Invalid settings');
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Close communication port
   */
  closePort: (control: MSCommControl): boolean => {
    return true;
  },

  /**
   * Send string to port
   */
  sendString: (control: MSCommControl, data: string): boolean => {
    if (!control.portOpen) {
      throw new Error('Port is not open');
    }
    
    return true;
  },

  /**
   * Send binary data to port
   */
  sendBinary: (control: MSCommControl, data: number[]): boolean => {
    if (!control.portOpen) {
      throw new Error('Port is not open');
    }
    
    return true;
  },

  /**
   * Read string from input buffer
   */
  readString: (control: MSCommControl, length?: number): string => {
    const input = control.input;
    if (length === undefined) {
      return input;
    }
    return input.substring(0, length);
  },

  /**
   * Read binary data from input buffer
   */
  readBinary: (control: MSCommControl, length: number): number[] => {
    const input = control.input;
    const result: number[] = [];
    
    for (let i = 0; i < Math.min(length, input.length); i++) {
      result.push(input.charCodeAt(i));
    }
    
    return result;
  },

  /**
   * Clear input buffer
   */
  clearInput: (control: MSCommControl): void => {
    // This would be handled by the component
  },

  /**
   * Clear output buffer
   */
  clearOutput: (control: MSCommControl): void => {
    // This would be handled by the component
  },

  /**
   * Check if data is available
   */
  dataAvailable: (control: MSCommControl): boolean => {
    return control.inBufferCount > 0;
  },

  /**
   * Wait for data with timeout
   */
  waitForData: (control: MSCommControl, timeout: number = 1000): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkData = () => {
        if (control.inBufferCount > 0) {
          resolve(true);
        } else if (Date.now() - startTime >= timeout) {
          resolve(false);
        } else {
          setTimeout(checkData, 10);
        }
      };
      
      checkData();
    });
  }
};

export default MSCommControl;