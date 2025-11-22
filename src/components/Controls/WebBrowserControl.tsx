/**
 * WebBrowser Control - Complete VB6 Internet Explorer Integration
 * Provides full web browsing capabilities with VB6 API compatibility
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// WebBrowser Constants
export enum WebBrowserReadyState {
  READYSTATE_UNINITIALIZED = 0,
  READYSTATE_LOADING = 1,
  READYSTATE_LOADED = 2,
  READYSTATE_INTERACTIVE = 3,
  READYSTATE_COMPLETE = 4
}

export enum WebBrowserRefreshConstants {
  REFRESH_NORMAL = 0,
  REFRESH_IFEXPIRED = 1,
  REFRESH_CONTINUE = 2,
  REFRESH_COMPLETELY = 3
}

export enum WebBrowserCommandStateChangeConstants {
  CSC_UPDATECOMMANDS = -1,
  CSC_NAVIGATEFORWARD = 1,
  CSC_NAVIGATEBACK = 2
}

export interface WebBrowserProps extends VB6ControlPropsEnhanced {
  // Navigation properties
  addressBar?: boolean;
  fullScreen?: boolean;
  menuBar?: boolean;
  offLine?: boolean;
  silent?: boolean;
  statusBar?: boolean;
  toolBar?: boolean;
  visible?: boolean;
  
  // Document properties
  busy?: boolean;
  readyState?: WebBrowserReadyState;
  
  // Events
  onBeforeNavigate?: (url: string, flags: number, targetFrameName: string, postData: any, headers: string, cancel: boolean) => void;
  onNavigateComplete?: (url: string) => void;
  onDocumentComplete?: (url: string) => void;
  onDownloadBegin?: () => void;
  onDownloadComplete?: () => void;
  onProgressChange?: (progress: number, progressMax: number) => void;
  onCommandStateChange?: (command: number, enable: boolean) => void;
  onTitleChange?: (text: string) => void;
  onStatusTextChange?: (text: string) => void;
  onNewWindow?: (url: string, flags: number, targetFrameName: string, postData: any, headers: string, processed: boolean) => void;
}

export const WebBrowserControl = forwardRef<HTMLDivElement, WebBrowserProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 400,
    height = 300,
    visible = true,
    enabled = true,
    addressBar = true,
    fullScreen = false,
    menuBar = true,
    offLine = false,
    silent = false,
    statusBar = true,
    toolBar = true,
    onBeforeNavigate,
    onNavigateComplete,
    onDocumentComplete,
    onDownloadBegin,
    onDownloadComplete,
    onProgressChange,
    onCommandStateChange,
    onTitleChange,
    onStatusTextChange,
    onNewWindow,
    ...rest
  } = props;

  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const [documentTitle, setDocumentTitle] = useState('');
  const [statusText, setStatusText] = useState('Done');
  const [isBusy, setIsBusy] = useState(false);
  const [readyState, setReadyState] = useState(WebBrowserReadyState.READYSTATE_UNINITIALIZED);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMax, setProgressMax] = useState(100);
  const [addressBarUrl, setAddressBarUrl] = useState('about:blank');
  const [history, setHistory] = useState<string[]>(['about:blank']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { fireEvent, updateControl } = useVB6Store();

  // VB6 Methods
  const vb6Methods = {
    Navigate: (url: string, flags?: number, targetFrameName?: string, postData?: any, headers?: string) => {
      const cancel = false;
      onBeforeNavigate?.(url, flags || 0, targetFrameName || '', postData, headers || '', cancel);
      
      if (cancel) {
        fireEvent(name, 'BeforeNavigate', { url, cancel: true });
        return;
      }

      setIsBusy(true);
      setReadyState(WebBrowserReadyState.READYSTATE_LOADING);
      setProgress(0);
      setStatusText('Loading...');
      
      onDownloadBegin?.();
      fireEvent(name, 'DownloadBegin', {});

      // Simulate navigation
      setTimeout(() => {
        setCurrentUrl(url);
        setAddressBarUrl(url);
        
        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(url);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        setCanGoBack(newHistory.length > 1);
        setCanGoForward(false);
        
        // Simulate progress
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += Math.random() * 30;
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(progressInterval);
            
            setProgress(100);
            setProgressMax(100);
            setIsBusy(false);
            setReadyState(WebBrowserReadyState.READYSTATE_COMPLETE);
            setStatusText('Done');
            setDocumentTitle(url.includes('://') ? new URL(url).hostname : 'Document');
            
            onProgressChange?.(100, 100);
            onNavigateComplete?.(url);
            onDocumentComplete?.(url);
            onDownloadComplete?.(url);
            onTitleChange?.(documentTitle);
            
            fireEvent(name, 'ProgressChange', { progress: 100, progressMax: 100 });
            fireEvent(name, 'NavigateComplete', { url });
            fireEvent(name, 'DocumentComplete', { url });
            fireEvent(name, 'DownloadComplete', {});
            fireEvent(name, 'TitleChange', { text: documentTitle });
          } else {
            setProgress(currentProgress);
            onProgressChange?.(currentProgress, 100);
            fireEvent(name, 'ProgressChange', { progress: currentProgress, progressMax: 100 });
          }
        }, 100);
      }, 200);
    },

    Navigate2: (url: string, flags?: number, targetFrameName?: string, postData?: any, headers?: string) => {
      // Navigate2 is identical to Navigate in VB6
      vb6Methods.Navigate(url, flags, targetFrameName, postData, headers);
    },

    GoBack: () => {
      if (canGoBack && historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const url = history[newIndex];
        setHistoryIndex(newIndex);
        setCurrentUrl(url);
        setAddressBarUrl(url);
        setCanGoBack(newIndex > 0);
        setCanGoForward(true);
        
        onNavigateComplete?.(url);
        fireEvent(name, 'NavigateComplete', { url });
      }
    },

    GoForward: () => {
      if (canGoForward && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const url = history[newIndex];
        setHistoryIndex(newIndex);
        setCurrentUrl(url);
        setAddressBarUrl(url);
        setCanGoBack(true);
        setCanGoForward(newIndex < history.length - 1);
        
        onNavigateComplete?.(url);
        fireEvent(name, 'NavigateComplete', { url });
      }
    },

    GoHome: () => {
      vb6Methods.Navigate('about:home');
    },

    GoSearch: () => {
      vb6Methods.Navigate('about:search');
    },

    Refresh: () => {
      vb6Methods.Navigate(currentUrl);
    },

    Refresh2: (level: WebBrowserRefreshConstants = WebBrowserRefreshConstants.REFRESH_NORMAL) => {
      vb6Methods.Navigate(currentUrl);
    },

    Stop: () => {
      setIsBusy(false);
      setReadyState(WebBrowserReadyState.READYSTATE_COMPLETE);
      setStatusText('Stopped');
      setProgress(0);
      
      fireEvent(name, 'NavigateComplete', { url: currentUrl });
    },

    ExecWB: (cmdID: number, cmdexecopt: number, pvaIn?: any, pvaOut?: any) => {
      // Execute Web Browser command
      switch (cmdID) {
        case 6: // OLECMDID_PRINT
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.print();
          }
          break;
        case 10: // OLECMDID_PROPERTIES
          alert('Page Properties not available in browser environment');
          break;
        case 17: // OLECMDID_SELECTALL
          if (iframeRef.current?.contentDocument) {
            iframeRef.current.contentDocument.execCommand('selectAll');
          }
          break;
        case 21: // OLECMDID_REFRESH
          vb6Methods.Refresh();
          break;
      }
    },

    AboutBox: () => {
      alert('Microsoft Web Browser Control\\nVersion 6.0\\n© Microsoft Corporation');
    }
  };

  const handleAddressBarKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let url = addressBarUrl.trim();
      if (!url.includes('://') && !url.startsWith('about:')) {
        if (url.includes('.')) {
          url = 'http://' + url;
        } else {
          url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
        }
      }
      vb6Methods.Navigate(url);
    }
  };

  const handleIframeLoad = () => {
    if (iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          const title = iframeDoc.title || 'Document';
          setDocumentTitle(title);
          onTitleChange?.(title);
          fireEvent(name, 'TitleChange', { text: title });
        }
      } catch (error) {
        // Cross-origin restrictions
        console.warn('Cannot access iframe document due to cross-origin restrictions');
      }
    }
  };

  // Update control properties
  useEffect(() => {
    updateControl(id, 'LocationURL', currentUrl);
    updateControl(id, 'LocationName', documentTitle);
    updateControl(id, 'Busy', isBusy);
    updateControl(id, 'ReadyState', readyState);
    updateControl(id, 'StatusText', statusText);
  }, [id, currentUrl, documentTitle, isBusy, readyState, statusText, updateControl]);

  // Register VB6 methods
  useEffect(() => {
    updateControl(id, 'vb6Methods', vb6Methods);
  }, [id, updateControl, vb6Methods]);

  // Update command states
  useEffect(() => {
    onCommandStateChange?.(WebBrowserCommandStateChangeConstants.CSC_NAVIGATEBACK, canGoBack);
    onCommandStateChange?.(WebBrowserCommandStateChangeConstants.CSC_NAVIGATEFORWARD, canGoForward);
    
    fireEvent(name, 'CommandStateChange', { 
      command: WebBrowserCommandStateChangeConstants.CSC_NAVIGATEBACK, 
      enable: canGoBack 
    });
    fireEvent(name, 'CommandStateChange', { 
      command: WebBrowserCommandStateChangeConstants.CSC_NAVIGATEFORWARD, 
      enable: canGoForward 
    });
  }, [canGoBack, canGoForward, onCommandStateChange, fireEvent, name]);

  if (!visible) return null;

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
        opacity: enabled ? 1 : 0.5
      }}
      {...rest}
    >
      {/* Menu Bar */}
      {menuBar && (
        <div style={{
          height: '20px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #c0c0c0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          fontSize: '11px'
        }}>
          <span style={{ marginRight: '12px', cursor: 'pointer' }}>File</span>
          <span style={{ marginRight: '12px', cursor: 'pointer' }}>Edit</span>
          <span style={{ marginRight: '12px', cursor: 'pointer' }}>View</span>
          <span style={{ marginRight: '12px', cursor: 'pointer' }}>Go</span>
          <span style={{ marginRight: '12px', cursor: 'pointer' }}>Favorites</span>
          <span style={{ marginRight: '12px', cursor: 'pointer' }}>Help</span>
        </div>
      )}

      {/* Tool Bar */}
      {toolBar && (
        <div style={{
          height: '28px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #c0c0c0',
          display: 'flex',
          alignItems: 'center',
          padding: '2px 4px',
          gap: '2px'
        }}>
          <button
            onClick={vb6Methods.GoBack}
            disabled={!canGoBack}
            style={{
              width: '24px',
              height: '24px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#f0f0f0',
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
            title="Back"
          >
            ←
          </button>
          
          <button
            onClick={vb6Methods.GoForward}
            disabled={!canGoForward}
            style={{
              width: '24px',
              height: '24px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#f0f0f0',
              cursor: canGoForward ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
            title="Forward"
          >
            →
          </button>
          
          <button
            onClick={vb6Methods.Stop}
            disabled={!isBusy}
            style={{
              width: '24px',
              height: '24px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#f0f0f0',
              cursor: isBusy ? 'pointer' : 'not-allowed',
              fontSize: '12px'
            }}
            title="Stop"
          >
            ✕
          </button>
          
          <button
            onClick={vb6Methods.Refresh}
            style={{
              width: '24px',
              height: '24px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Refresh"
          >
            ↻
          </button>
          
          <button
            onClick={vb6Methods.GoHome}
            style={{
              width: '24px',
              height: '24px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '10px'
            }}
            title="Home"
          >
            🏠
          </button>
        </div>
      )}

      {/* Address Bar */}
      {addressBar && (
        <div style={{
          height: '24px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #c0c0c0',
          display: 'flex',
          alignItems: 'center',
          padding: '2px 4px',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', minWidth: 'auto' }}>Address:</span>
          <input
            type="text"
            value={addressBarUrl}
            onChange={(e) => setAddressBarUrl(e.target.value)}
            onKeyPress={handleAddressBarKeyPress}
            style={{
              flex: 1,
              height: '18px',
              border: '1px inset #c0c0c0',
              padding: '1px 4px',
              fontSize: '11px'
            }}
          />
          <button
            onClick={() => vb6Methods.Navigate(addressBarUrl)}
            style={{
              width: '20px',
              height: '18px',
              border: '1px outset #c0c0c0',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
              fontSize: '10px'
            }}
            title="Go"
          >
            Go
          </button>
        </div>
      )}

      {/* Progress Bar (when loading) */}
      {isBusy && (
        <div style={{
          height: '4px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #c0c0c0'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#0000ff',
            width: `${progress}%`,
            transition: 'width 0.1s ease'
          }} />
        </div>
      )}

      {/* Web Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentUrl === 'about:blank' ? (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>VB6 WebBrowser Control</h2>
              <p style={{ margin: 0 }}>Navigate to a URL to begin browsing</p>
            </div>
          </div>
        ) : currentUrl.startsWith('about:') ? (
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            padding: '20px',
            fontSize: '12px'
          }}>
            <h1>About Page</h1>
            <p>This is a simulated browser page for: {currentUrl}</p>
            <p>Ready State: {readyState}</p>
            <p>Status: {statusText}</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white'
            }}
            onLoad={handleIframeLoad}
            title="Web Browser Content"
          />
        )}
      </div>

      {/* Status Bar */}
      {statusBar && (
        <div style={{
          height: '20px',
          backgroundColor: '#f0f0f0',
          borderTop: '1px solid #c0c0c0',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          fontSize: '11px',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{statusText}</span>
            {isBusy && (
              <span style={{ fontSize: '10px', color: '#666' }}>
                Loading... ({Math.round(progress)}%)
              </span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Ready State: {readyState}
          </div>
        </div>
      )}
    </div>
  );
});

WebBrowserControl.displayName = 'WebBrowserControl';

export default WebBrowserControl;