/**
 * Winsock Control - Complete VB6 Network Control Implementation
 * Provides TCP/UDP networking with modern web APIs (WebSocket, Fetch)
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// Winsock Constants
export enum WinsockProtocol {
  sckTCPProtocol = 0,
  sckUDPProtocol = 1
}

export enum WinsockState {
  sckClosed = 0,
  sckOpen = 1,
  sckListening = 2,
  sckConnectionPending = 3,
  sckResolvingHost = 4,
  sckHostResolved = 5,
  sckConnecting = 6,
  sckConnected = 7,
  sckClosing = 8,
  sckError = 9
}

export interface WinsockProps extends VB6ControlPropsEnhanced {
  // Network properties
  protocol?: WinsockProtocol;
  remoteHost?: string;
  remotePort?: number;
  localPort?: number;
  
  // Connection properties
  backlog?: number; // For server mode
  
  // Events
  onConnect?: () => void;
  onDataArrival?: (bytesTotal: number) => void;
  onClose?: () => void;
  onError?: (number: number, description: string, scode: number, source: string, helpFile: string, helpContext: number, cancelDisplay: boolean) => void;
  onConnectionRequest?: (requestId: number) => void;
  onSendComplete?: () => void;
  onSendProgress?: (bytesSent: number, bytesRemaining: number) => void;
}

export const WinsockControl = forwardRef<HTMLDivElement, WinsockProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    visible = true,
    enabled = true,
    protocol = WinsockProtocol.sckTCPProtocol,
    remoteHost = '',
    remotePort = 80,
    localPort = 0,
    backlog = 5,
    onConnect,
    onDataArrival,
    onClose,
    onError,
    onConnectionRequest,
    onSendComplete,
    onSendProgress,
    ...rest
  } = props;

  // State management
  const [currentState, setCurrentState] = useState<WinsockState>(WinsockState.sckClosed);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [dataBuffer, setDataBuffer] = useState<string>('');
  const [bytesTotal, setBytesTotal] = useState(0);
  const [isServer, setIsServer] = useState(false);
  const [connections, setConnections] = useState<Map<number, WebSocket>>(new Map());
  const [nextRequestId, setNextRequestId] = useState(1);
  
  const winsockRef = useRef<HTMLDivElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // Network operations
  const vb6Methods = {
    // Connection methods
    Connect: (remoteHostParam?: string, remotePortParam?: number) => {
      const host = remoteHostParam || remoteHost;
      const port = remotePortParam || remotePort;
      
      if (!host) {
        fireError(10060, 'Host not specified', 0, name, '', 0, false);
        return;
      }

      if (currentState !== WinsockState.sckClosed) {
        fireError(10056, 'Already connected', 0, name, '', 0, false);
        return;
      }

      try {
        setCurrentState(WinsockState.sckResolvingHost);
        fireEvent(name, 'StateChange', { state: WinsockState.sckResolvingHost });
        
        // Use WebSocket for TCP-like connections
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}:${port}`;
        
        setCurrentState(WinsockState.sckConnecting);
        fireEvent(name, 'StateChange', { state: WinsockState.sckConnecting });
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setCurrentState(WinsockState.sckConnected);
          setSocket(ws);
          updateControl(id, 'State', WinsockState.sckConnected);
          onConnect?.();
          fireEvent(name, 'Connect', {});
          fireEvent(name, 'StateChange', { state: WinsockState.sckConnected });
        };
        
        ws.onmessage = (event) => {
          const data = event.data;
          setDataBuffer(prev => prev + data);
          setBytesTotal(prev => prev + data.length);
          onDataArrival?.(data.length);
          fireEvent(name, 'DataArrival', { bytesTotal: data.length });
        };
        
        ws.onclose = () => {
          setCurrentState(WinsockState.sckClosed);
          setSocket(null);
          updateControl(id, 'State', WinsockState.sckClosed);
          onClose?.();
          fireEvent(name, 'Close', {});
          fireEvent(name, 'StateChange', { state: WinsockState.sckClosed });
        };
        
        ws.onerror = (error) => {
          setCurrentState(WinsockState.sckError);
          fireError(10061, 'Connection failed', 0, name, '', 0, false);
        };
        
      } catch (error) {
        fireError(10061, `Connection error: ${error}`, 0, name, '', 0, false);
      }
    },

    // Server methods
    Listen: (port?: number) => {
      const listenPort = port || localPort || 8080;
      
      if (currentState !== WinsockState.sckClosed) {
        fireError(10056, 'Socket not closed', 0, name, '', 0, false);
        return;
      }

      // In browser environment, we can't create true servers
      // Simulate server behavior with connection requests
      setCurrentState(WinsockState.sckListening);
      setIsServer(true);
      updateControl(id, 'State', WinsockState.sckListening);
      updateControl(id, 'LocalPort', listenPort);
      fireEvent(name, 'StateChange', { state: WinsockState.sckListening });
      
      // Simulate incoming connection requests
      setTimeout(() => {
        if (currentState === WinsockState.sckListening) {
          const requestId = nextRequestId;
          setNextRequestId(prev => prev + 1);
          onConnectionRequest?.(requestId);
          fireEvent(name, 'ConnectionRequest', { requestId });
        }
      }, 1000);
    },

    Accept: (requestId: number) => {
      if (currentState !== WinsockState.sckListening) {
        fireError(10056, 'Not listening', 0, name, '', 0, false);
        return;
      }

      // Simulate accepting a connection
      try {
        // In a real implementation, this would accept the WebSocket connection
        // For simulation, create a mock connection
        const mockConnection = {
          readyState: WebSocket.OPEN,
          send: (data: string) => {
            console.log(`Mock connection ${requestId} sent:`, data);
          },
          close: () => {
            connections.delete(requestId);
            setConnections(new Map(connections));
          }
        } as WebSocket;
        
        connections.set(requestId, mockConnection);
        setConnections(new Map(connections));
        
        fireEvent(name, 'Accept', { requestId });
        
      } catch (error) {
        fireError(10061, `Accept error: ${error}`, 0, name, '', 0, false);
      }
    },

    // Data methods
    SendData: (data: string | ArrayBuffer, connection?: number) => {
      if (protocol === WinsockProtocol.sckTCPProtocol) {
        // TCP mode
        if (isServer && connection !== undefined) {
          // Server mode - send to specific connection
          const conn = connections.get(connection);
          if (conn && conn.readyState === WebSocket.OPEN) {
            conn.send(data);
            onSendComplete?.();
            fireEvent(name, 'SendComplete', {});
          } else {
            fireError(10057, 'Connection not found', 0, name, '', 0, false);
          }
        } else {
          // Client mode - send to main connection
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(data);
            onSendComplete?.();
            fireEvent(name, 'SendComplete', {});
          } else {
            fireError(10057, 'Not connected', 0, name, '', 0, false);
          }
        }
      } else {
        // UDP mode - use fetch for HTTP-like requests
        vb6Methods.SendUDPData(data as string);
      }
    },

    SendUDPData: async (data: string) => {
      if (!remoteHost) {
        fireError(10060, 'Remote host not specified', 0, name, '', 0, false);
        return;
      }

      try {
        const url = `http://${remoteHost}:${remotePort}`;
        const response = await fetch(url, {
          method: 'POST',
          body: data,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });

        if (response.ok) {
          const responseData = await response.text();
          if (responseData) {
            setDataBuffer(prev => prev + responseData);
            setBytesTotal(prev => prev + responseData.length);
            onDataArrival?.(responseData.length);
            fireEvent(name, 'DataArrival', { bytesTotal: responseData.length });
          }
          onSendComplete?.();
          fireEvent(name, 'SendComplete', {});
        } else {
          fireError(10061, `HTTP ${response.status}: ${response.statusText}`, 0, name, '', 0, false);
        }
      } catch (error) {
        fireError(10061, `UDP send error: ${error}`, 0, name, '', 0, false);
      }
    },

    GetData: (dataType?: number, maxLen?: number): string | ArrayBuffer => {
      const data = maxLen ? dataBuffer.substring(0, maxLen) : dataBuffer;
      
      // Remove retrieved data from buffer
      if (maxLen && maxLen < dataBuffer.length) {
        setDataBuffer(dataBuffer.substring(maxLen));
        setBytesTotal(dataBuffer.length - maxLen);
      } else {
        setDataBuffer('');
        setBytesTotal(0);
      }
      
      return data;
    },

    PeekData: (dataType?: number, maxLen?: number): string => {
      // Peek without removing data from buffer
      return maxLen ? dataBuffer.substring(0, maxLen) : dataBuffer;
    },

    // Connection control
    Close: (connection?: number) => {
      if (isServer && connection !== undefined) {
        // Close specific connection
        const conn = connections.get(connection);
        if (conn) {
          conn.close();
          connections.delete(connection);
          setConnections(new Map(connections));
        }
      } else {
        // Close main connection
        if (socket) {
          setCurrentState(WinsockState.sckClosing);
          socket.close();
        } else {
          setCurrentState(WinsockState.sckClosed);
          updateControl(id, 'State', WinsockState.sckClosed);
          fireEvent(name, 'StateChange', { state: WinsockState.sckClosed });
        }
      }
    },

    // Utility methods
    Bind: (localPortParam?: number, localIP?: string) => {
      const port = localPortParam || localPort;
      updateControl(id, 'LocalPort', port);
      // In browser environment, binding is limited
      console.log(`Winsock bound to port ${port}`);
    },

    Resolve: async (hostName: string): Promise<string> => {
      // Simulate DNS resolution
      try {
        // In real environment, this would do actual DNS lookup
        // For simulation, return the hostname as IP
        const simulatedIP = hostName.includes('.') ? hostName : '127.0.0.1';
        return simulatedIP;
      } catch (error) {
        fireError(11001, 'Host not found', 0, name, '', 0, false);
        return '';
      }
    }
  };

  const fireError = (number: number, description: string, scode: number, source: string, helpFile: string, helpContext: number, cancelDisplay: boolean) => {
    setCurrentState(WinsockState.sckError);
    updateControl(id, 'State', WinsockState.sckError);
    onError?.(number, description, scode, source, helpFile, helpContext, cancelDisplay);
    fireEvent(name, 'Error', { number, description, scode, source, helpFile, helpContext, cancelDisplay });
    fireEvent(name, 'StateChange', { state: WinsockState.sckError });
  };

  // Properties
  const winsockProperties = {
    get State() { return currentState; },
    get Protocol() { return protocol; },
    set Protocol(value: WinsockProtocol) { updateControl(id, 'protocol', value); },
    
    get RemoteHost() { return remoteHost; },
    set RemoteHost(value: string) { updateControl(id, 'remoteHost', value); },
    
    get RemotePort() { return remotePort; },
    set RemotePort(value: number) { updateControl(id, 'remotePort', value); },
    
    get LocalPort() { return localPort; },
    set LocalPort(value: number) { updateControl(id, 'localPort', value); },
    
    get BytesReceived() { return bytesTotal; },
    
    get SocketHandle() { return socket ? 1 : 0; }, // Simulated handle
    
    get Tag() { return props.tag || ''; },
    set Tag(value: string) { updateControl(id, 'tag', value); }
  };

  // Combine methods and properties
  const winsockAPI = {
    ...winsockProperties,
    ...vb6Methods
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'State', currentState);
    updateControl(id, 'BytesReceived', bytesTotal);
    updateControl(id, 'Protocol', protocol);
    updateControl(id, 'RemoteHost', remoteHost);
    updateControl(id, 'RemotePort', remotePort);
    updateControl(id, 'LocalPort', localPort);
  }, [id, currentState, bytesTotal, protocol, remoteHost, remotePort, localPort, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', winsockAPI);
  }, [id, updateControl, winsockAPI]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = winsockAPI;
    }
  }, [name, winsockAPI]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
      connections.forEach(conn => conn.close());
    };
  }, [socket, connections]);

  if (!visible) return null;

  const getStateColor = (state: WinsockState): string => {
    switch (state) {
      case WinsockState.sckClosed: return '#808080';
      case WinsockState.sckListening: return '#0000FF';
      case WinsockState.sckConnected: return '#00FF00';
      case WinsockState.sckConnecting: return '#FFFF00';
      case WinsockState.sckError: return '#FF0000';
      default: return '#C0C0C0';
    }
  };

  const getProtocolIcon = () => {
    return protocol === WinsockProtocol.sckTCPProtocol ? '🔌' : '📡';
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '2px inset #c0c0c0',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'MS Sans Serif',
        fontSize: '8pt',
        opacity: enabled ? 1 : 0.5,
        cursor: 'default',
        overflow: 'hidden'
      }}
      title={`Winsock: ${WinsockState[currentState]} (${protocol === WinsockProtocol.sckTCPProtocol ? 'TCP' : 'UDP'})`}
      {...rest}
    >
      {/* Protocol and state indicator */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Network icon */}
        <div style={{
          fontSize: '16px',
          marginBottom: '2px',
          filter: enabled ? 'none' : 'grayscale(100%)'
        }}>
          {getProtocolIcon()}
        </div>
        
        {/* State indicator */}
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getStateColor(currentState),
          marginBottom: '2px',
          border: '1px solid #000000'
        }} />
        
        {/* Control info */}
        <div style={{
          fontSize: '6pt',
          color: '#666666',
          lineHeight: '1.0',
          textAlign: 'center'
        }}>
          <div>Winsock</div>
          <div>{protocol === WinsockProtocol.sckTCPProtocol ? 'TCP' : 'UDP'}</div>
          <div>{WinsockState[currentState]}</div>
        </div>
      </div>
      
      {/* Connection indicator */}
      {(currentState === WinsockState.sckConnected || currentState === WinsockState.sckListening) && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#00FF00',
          animation: 'blink 1s infinite'
        }} />
      )}
      
      {/* Data indicator */}
      {bytesTotal > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          fontSize: '5pt',
          color: '#000080',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '1px 2px',
          borderRadius: '2px'
        }}>
          {bytesTotal}B
        </div>
      )}
      
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
});

WinsockControl.displayName = 'WinsockControl';

export default WinsockControl;