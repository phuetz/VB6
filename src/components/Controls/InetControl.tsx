/**
 * Internet Transfer Control (Inet) - Complete VB6 HTTP/FTP Implementation
 * Provides comprehensive internet data transfer capabilities
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// Inet Constants
export enum InetAccessType {
  icUseDefault = 0,
  icDirect = 1,
  icNamedProxy = 3,
}

export enum InetProtocol {
  icUnknown = -1,
  icDefault = 0,
  icFTP = 1,
  icGopher = 2,
  icHTTP = 3,
  icHTTPS = 4,
}

export enum InetState {
  icNone = 0,
  icHostResolvingHost = 1,
  icHostResolved = 2,
  icConnecting = 3,
  icConnected = 4,
  icRequesting = 5,
  icRequestSent = 6,
  icReceivingResponse = 7,
  icResponseReceived = 8,
  icDisconnecting = 9,
  icDisconnected = 10,
  icError = 11,
  icResponseCompleted = 12,
}

export enum InetResponseCode {
  icDefault = 0,
  icContinue = 100,
  icSwitchingProtocols = 101,
  icOK = 200,
  icCreated = 201,
  icAccepted = 202,
  icNonAuthoritativeInformation = 203,
  icNoContent = 204,
  icResetContent = 205,
  icPartialContent = 206,
  icMultipleChoices = 300,
  icMovedPermanently = 301,
  icMovedTemporarily = 302,
  icSeeOther = 303,
  icNotModified = 304,
  icUseProxy = 305,
  icBadRequest = 400,
  icUnauthorized = 401,
  icPaymentRequired = 402,
  icForbidden = 403,
  icNotFound = 404,
  icMethodNotAllowed = 405,
  icNotAcceptable = 406,
  icProxyAuthenticationRequired = 407,
  icRequestTimeout = 408,
  icConflict = 409,
  icGone = 410,
  icLengthRequired = 411,
  icPreconditionFailed = 412,
  icRequestEntityTooLarge = 413,
  icRequestURITooLarge = 414,
  icUnsupportedMediaType = 415,
  icInternalServerError = 500,
  icNotImplemented = 501,
  icBadGateway = 502,
  icServiceUnavailable = 503,
  icGatewayTimeout = 504,
  icHTTPVersionNotSupported = 505,
}

export interface InetProps extends VB6ControlPropsEnhanced {
  // Connection properties
  accessType?: InetAccessType;
  proxy?: string;
  protocol?: InetProtocol;
  remoteHost?: string;
  remotePort?: number;
  requestTimeout?: number;

  // Authentication
  userName?: string;
  password?: string;

  // HTTP specific
  document?: string;
  hWndParent?: number;
  responseCode?: InetResponseCode;
  responseInfo?: string;

  // State
  stillExecuting?: boolean;
  state?: InetState;

  // Data
  tag?: string;
  url?: string;

  // Events
  onStateChanged?: (state: InetState) => void;
  onDataArrival?: (bytesTotal: number) => void;
}

export const InetControl = forwardRef<HTMLDivElement, InetProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 32,
    height = 32,
    visible = true,
    enabled = true,
    accessType = InetAccessType.icUseDefault,
    proxy = '',
    protocol = InetProtocol.icHTTP,
    remoteHost = '',
    remotePort = 80,
    requestTimeout = 60,
    userName = '',
    password = '',
    document = '',
    hWndParent = 0,
    tag = '',
    url = '',
    onStateChanged,
    onDataArrival,
    ...rest
  } = props;

  const [currentState, setCurrentState] = useState<InetState>(InetState.icNone);
  const [currentResponseCode, setCurrentResponseCode] = useState<InetResponseCode>(
    InetResponseCode.icDefault
  );
  const [currentResponseInfo, setCurrentResponseInfo] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [downloadedData, setDownloadedData] = useState<string>('');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    Cancel: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setCurrentState(InetState.icDisconnected);
      setIsExecuting(false);
      fireEvent(name, 'StateChanged', { state: InetState.icDisconnected });
      onStateChanged?.(InetState.icDisconnected);
    },

    Execute: (url?: string, operation?: string, data?: string, requestHeaders?: string) => {
      if (isExecuting) {
        vb6Methods.Cancel();
      }

      const targetUrl = url || props.url || '';
      if (!targetUrl) {
        throw new Error('URL is required');
      }

      setIsExecuting(true);
      setDownloadedData('');
      setProgress({ loaded: 0, total: 0 });

      executeRequest(targetUrl, operation || 'GET', data, requestHeaders);
    },

    GetChunk: (size?: number, dataType?: number) => {
      const chunkSize = size || 1024;
      const chunk = downloadedData.substring(0, chunkSize);
      setDownloadedData(downloadedData.substring(chunkSize));
      return chunk;
    },

    GetHeader: (headerName?: string) => {
      if (!headerName) {
        return currentResponseInfo;
      }

      // Parse response headers
      const headers = currentResponseInfo.split('\r\n');
      for (const header of headers) {
        const [key, value] = header.split(': ');
        if (key && key.toLowerCase() === headerName.toLowerCase()) {
          return value;
        }
      }
      return '';
    },

    OpenURL: (url: string, dataType?: number) => {
      return new Promise((resolve, reject) => {
        executeRequest(url, 'GET')
          .then(() => {
            resolve(downloadedData);
          })
          .catch(reject);
      });
    },

    PeekData: (size?: number, dataType?: number) => {
      const peekSize = size || downloadedData.length;
      return downloadedData.substring(0, peekSize);
    },
  };

  const setState = useCallback(
    (newState: InetState) => {
      setCurrentState(newState);
      fireEvent(name, 'StateChanged', { state: newState });
      onStateChanged?.(newState);
    },
    [name, fireEvent, onStateChanged]
  );

  const executeRequest = async (
    targetUrl: string,
    method: string = 'GET',
    data?: string,
    requestHeaders?: string
  ) => {
    try {
      // State progression
      setState(InetState.icHostResolvingHost);

      await new Promise(resolve => setTimeout(resolve, 100));
      setState(InetState.icHostResolved);

      await new Promise(resolve => setTimeout(resolve, 50));
      setState(InetState.icConnecting);

      await new Promise(resolve => setTimeout(resolve, 100));
      setState(InetState.icConnected);

      setState(InetState.icRequesting);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Prepare request
      const fetchOptions: RequestInit = {
        method,
        signal: abortControllerRef.current.signal,
        headers: {
          'User-Agent': 'VB6 Inet Control',
          Accept: '*/*',
          ...parseHeaders(requestHeaders),
        },
      };

      // Add authentication if provided
      if (userName && password) {
        const credentials = btoa(`${userName}:${password}`);
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Basic ${credentials}`,
        };
      }

      // Add data for POST/PUT requests
      if (data && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = data;
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      }

      setState(InetState.icRequestSent);
      setState(InetState.icReceivingResponse);

      const response = await fetch(targetUrl, fetchOptions);

      setCurrentResponseCode(response.status as InetResponseCode);

      // Build response info string
      let responseInfo = `HTTP/1.1 ${response.status} ${response.statusText}\r\n`;
      response.headers.forEach((value, key) => {
        responseInfo += `${key}: ${value}\r\n`;
      });
      setCurrentResponseInfo(responseInfo);

      setState(InetState.icResponseReceived);

      // Handle response body
      const reader = response.body?.getReader();
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength) : 0;

      let loaded = 0;
      let result = '';

      if (reader) {
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          loaded += value.length;

          setProgress({ loaded, total });
          setDownloadedData(result);

          // Fire data arrival event
          fireEvent(name, 'DataArrival', { bytesTotal: loaded });
          onDataArrival?.(loaded);

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      setState(InetState.icResponseCompleted);
      setIsExecuting(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setState(InetState.icDisconnected);
      } else {
        setState(InetState.icError);
        setCurrentResponseCode(InetResponseCode.icInternalServerError);
        setCurrentResponseInfo(`Error: ${error.message}`);
        console.error('Inet request failed:', error);
      }
      setIsExecuting(false);
    }
  };

  const parseHeaders = (headerString?: string): Record<string, string> => {
    if (!headerString) return {};

    const headers: Record<string, string> = {};
    const lines = headerString.split('\r\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }

    return headers;
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'State', currentState);
    updateControl(id, 'StillExecuting', isExecuting);
    updateControl(id, 'ResponseCode', currentResponseCode);
    updateControl(id, 'ResponseInfo', currentResponseInfo);
  }, [id, currentState, isExecuting, currentResponseCode, currentResponseInfo, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Expose methods globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalAny = window as any;
      globalAny.VB6Controls = globalAny.VB6Controls || {};
      globalAny.VB6Controls[name] = {
        Execute: vb6Methods.Execute,
        OpenURL: vb6Methods.OpenURL,
        Cancel: vb6Methods.Cancel,
        GetChunk: vb6Methods.GetChunk,
        GetHeader: vb6Methods.GetHeader,
        PeekData: vb6Methods.PeekData,
        get State() {
          return currentState;
        },
        get StillExecuting() {
          return isExecuting;
        },
        get ResponseCode() {
          return currentResponseCode;
        },
        get ResponseInfo() {
          return currentResponseInfo;
        },
      };
    }
  }, [name, vb6Methods, currentState, isExecuting, currentResponseCode, currentResponseInfo]);

  if (!visible) return null;

  const getStateIcon = () => {
    switch (currentState) {
      case InetState.icNone:
      case InetState.icDisconnected:
        return '🌐';
      case InetState.icHostResolvingHost:
      case InetState.icHostResolved:
        return '🔍';
      case InetState.icConnecting:
      case InetState.icConnected:
        return '🔗';
      case InetState.icRequesting:
      case InetState.icRequestSent:
        return '📤';
      case InetState.icReceivingResponse:
      case InetState.icResponseReceived:
        return '📥';
      case InetState.icResponseCompleted:
        return '✅';
      case InetState.icError:
        return '❌';
      default:
        return '❓';
    }
  };

  const getStateText = () => {
    const stateNames = {
      [InetState.icNone]: 'None',
      [InetState.icHostResolvingHost]: 'Resolving',
      [InetState.icHostResolved]: 'Resolved',
      [InetState.icConnecting]: 'Connecting',
      [InetState.icConnected]: 'Connected',
      [InetState.icRequesting]: 'Requesting',
      [InetState.icRequestSent]: 'Sent',
      [InetState.icReceivingResponse]: 'Receiving',
      [InetState.icResponseReceived]: 'Received',
      [InetState.icDisconnecting]: 'Disconnecting',
      [InetState.icDisconnected]: 'Disconnected',
      [InetState.icError]: 'Error',
      [InetState.icResponseCompleted]: 'Complete',
    };
    return stateNames[currentState] || 'Unknown';
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
        backgroundColor: isExecuting ? '#ffffcc' : '#f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontFamily: 'MS Sans Serif',
        opacity: enabled ? 1 : 0.5,
        cursor: enabled ? 'default' : 'not-allowed',
        overflow: 'hidden',
      }}
      title={`Inet Control - ${getStateText()}${currentResponseCode ? ` (${currentResponseCode})` : ''}`}
      {...rest}
    >
      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{getStateIcon()}</div>

      <div
        style={{
          fontSize: '8px',
          textAlign: 'center',
          lineHeight: '1.1',
          color: currentState === InetState.icError ? '#cc0000' : '#000000',
        }}
      >
        <div>Inet</div>
        <div>{getStateText()}</div>
        {currentResponseCode !== InetResponseCode.icDefault && (
          <div style={{ color: currentResponseCode >= 400 ? '#cc0000' : '#006600' }}>
            {currentResponseCode}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {isExecuting && progress.total > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '2px',
            right: '2px',
            height: '2px',
            backgroundColor: '#ffffff',
            border: '1px inset #c0c0c0',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#0000ff',
              width: `${(progress.loaded / progress.total) * 100}%`,
              transition: 'width 0.1s ease',
            }}
          />
        </div>
      )}
    </div>
  );
});

InetControl.displayName = 'InetControl';

export default InetControl;
