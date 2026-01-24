import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Control } from '../../context/types';

interface MMControlProps {
  control: Control;
  isDesignMode?: boolean;
  onPropertyChange?: (property: string, value: any) => void;
}

// Microsoft Multimedia Control (MMControl) - VB6 Compatible
export const MMControl: React.FC<MMControlProps> = ({ 
  control, 
  isDesignMode = false,
  onPropertyChange 
}) => {
  // VB6 MMControl properties
  const {
    x = 0,
    y = 0,
    width = 315,
    height = 35,
    fileName = '',
    deviceType = 'WaveAudio',
    command = '',
    orientation = 0, // 0=horizontal, 1=vertical
    mode = 524, // mmNotOpen
    position = 0,
    length = 0,
    start = 0,
    to = 0,
    from = 0,
    frames = 0,
    tracks = 1,
    trackLength = [],
    trackPosition = [],
    autoEnable = true,
    enabled = true,
    visible = true,
    shareMode = false,
    updateInterval = 1000,
    timeFormat = 0, // 0=milliseconds, 1=HMS, 2=MSFT, 3=frames, 4=SMPTE24, 5=SMPTE25, 6=SMPTE30, 7=SMPTE30Drop
    notify = true,
    wait = true,
    silent = false,
    recordMode = 0,
    usesWindows = true,
    hWndDisplay = 0,
    borderStyle = 1,
    toolTipText = '',
    tag = '',
    index,
  } = control;

  // Internal state
  const [currentMode, setCurrentMode] = useState(mode);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentLength, setCurrentLength] = useState(length);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>('');
  
  // HTML5 Audio/Video refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const updateTimerRef = useRef<NodeJS.Timeout>();

  // Determine media type from device type or file extension
  const getMediaType = useCallback(() => {
    if (deviceType.toLowerCase().includes('video') || 
        fileName.match(/\.(mp4|avi|wmv|mov|flv|webm|ogg)$/i)) {
      return 'video';
    }
    return 'audio';
  }, [deviceType, fileName]);

  const mediaType = getMediaType();
  const mediaRef = mediaType === 'video' ? videoRef : audioRef;

  // VB6 MMControl Mode constants
  const MMControlModes = {
    mmNotOpen: 524,
    mmOpen: 525,
    mmPlaying: 526,
    mmStopped: 527,
    mmPaused: 528,
    mmRecording: 529,
    mmSeeking: 530,
  };

  // Initialize media element when filename changes
  useEffect(() => {
    if (fileName && !isDesignMode) {
      if (mediaRef.current) {
        mediaRef.current.src = fileName;
        setCurrentMode(MMControlModes.mmOpen);
        onPropertyChange?.('mode', MMControlModes.mmOpen);
        
        // Fire VB6 events
        if (window.VB6Runtime?.fireEvent) {
          window.VB6Runtime.fireEvent(control.name, 'StatusUpdate');
        }
      }
    }
  }, [fileName, isDesignMode, control.name, mediaRef, onPropertyChange]);

  // Update timer for position tracking
  useEffect(() => {
    // Clear any existing timer first
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = undefined;
    }

    if (updateInterval > 0 && !isDesignMode) {
      const controlName = control.name;
      const media = mediaRef.current;

      updateTimerRef.current = setInterval(() => {
        if (media && !media.paused) {
          const newPosition = Math.floor(media.currentTime * 1000);
          setCurrentPosition(newPosition);
          onPropertyChange?.('position', newPosition);

          if (window.VB6Runtime?.fireEvent) {
            window.VB6Runtime.fireEvent(controlName, 'PositionChange', newPosition);
          }
        }
      }, updateInterval);
    }

    // Cleanup function that always runs
    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
        updateTimerRef.current = undefined;
      }
    };
  }, [updateInterval, isDesignMode, control.name, onPropertyChange]);

  // Media event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (mediaRef.current) {
      const duration = Math.floor(mediaRef.current.duration * 1000);
      setCurrentLength(duration);
      onPropertyChange?.('length', duration);
      
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'StatusUpdate');
      }
    }
  }, [control.name, mediaRef, onPropertyChange]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentMode(MMControlModes.mmPlaying);
    onPropertyChange?.('mode', MMControlModes.mmPlaying);
    
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'StatusUpdate');
    }
  }, [control.name, onPropertyChange]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
    setCurrentMode(MMControlModes.mmPaused);
    onPropertyChange?.('mode', MMControlModes.mmPaused);
    
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'StatusUpdate');
    }
  }, [control.name, onPropertyChange]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentMode(MMControlModes.mmStopped);
    onPropertyChange?.('mode', MMControlModes.mmStopped);
    
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'Done', currentPosition);
    }
  }, [control.name, currentPosition, onPropertyChange]);

  const handleError = useCallback((e: any) => {
    const errorMsg = `Media error: ${e.target.error?.message || 'Unknown error'}`;
    setError(errorMsg);
    setCurrentMode(MMControlModes.mmStopped);
    
    if (window.VB6Runtime?.fireEvent) {
      window.VB6Runtime.fireEvent(control.name, 'StatusUpdate');
    }
  }, [control.name]);

  // VB6 MMControl command processing
  const executeCommand = useCallback((cmd: string) => {
    if (!mediaRef.current) return;
    
    const commands = cmd.toLowerCase().split(' ');
    const primaryCommand = commands[0];
    
    try {
      switch (primaryCommand) {
        case 'open':
          if (fileName) {
            mediaRef.current.src = fileName;
            mediaRef.current.load();
          }
          break;
          
        case 'close':
          mediaRef.current.src = '';
          setCurrentMode(MMControlModes.mmNotOpen);
          break;
          
        case 'play':
          if (from > 0) {
            mediaRef.current.currentTime = from / 1000;
          }
          mediaRef.current.play();
          break;
          
        case 'stop':
          mediaRef.current.pause();
          mediaRef.current.currentTime = 0;
          setCurrentPosition(0);
          setCurrentMode(MMControlModes.mmStopped);
          break;
          
        case 'pause':
          mediaRef.current.pause();
          break;
          
        case 'resume':
          mediaRef.current.play();
          break;
          
        case 'seek':
          if (to > 0) {
            mediaRef.current.currentTime = to / 1000;
          } else if (position > 0) {
            mediaRef.current.currentTime = position / 1000;
          }
          setCurrentMode(MMControlModes.mmSeeking);
          break;
          
        case 'step': {
          // Step forward/backward by frames (approximate)
          const stepAmount = 1000 / 30; // Assume 30fps
          mediaRef.current.currentTime += stepAmount / 1000;
          break;
        }
          
        case 'record':
          // Recording not supported in browser, simulate
          setIsRecording(true);
          setCurrentMode(MMControlModes.mmRecording);
          console.log('MMControl: Record command (simulated)');
          break;
          
        case 'save':
          console.log('MMControl: Save command (not supported in browser)');
          break;
          
        default:
          console.warn(`MMControl: Unknown command '${primaryCommand}'`);
      }
      
      // Fire command complete event
      if (window.VB6Runtime?.fireEvent) {
        window.VB6Runtime.fireEvent(control.name, 'StatusUpdate');
      }
    } catch (err: any) {
      setError(`Command error: ${err.message}`);
    }
  }, [fileName, from, mediaRef, position, to, control.name]);

  // Execute command when command property changes
  useEffect(() => {
    if (command && !isDesignMode) {
      executeCommand(command);
    }
  }, [command, executeCommand, isDesignMode]);

  // Format time display
  const formatTime = useCallback((milliseconds: number): string => {
    switch (timeFormat) {
      case 1: { // HMS
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      case 2: { // MSFT (Minutes:Seconds:Frames:Tenths)
        const mins = Math.floor(milliseconds / 60000);
        const secs = Math.floor((milliseconds % 60000) / 1000);
        const frames = Math.floor((milliseconds % 1000) / 33.33); // Assume 30fps
        const tenths = Math.floor((milliseconds % 33.33) / 3.333);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}:${tenths}`;
      }
      
      case 3: // Frames
        return Math.floor(milliseconds / 33.33).toString(); // Assume 30fps
      
      default: // Milliseconds
        return milliseconds.toString();
    }
  }, [timeFormat]);

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!mediaRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * mediaRef.current.duration;
    
    mediaRef.current.currentTime = newTime;
    setCurrentPosition(Math.floor(newTime * 1000));
  }, [mediaRef]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    height: height,
    backgroundColor: '#C0C0C0',
    border: borderStyle === 1 ? '2px inset #FFFFFF' : 'none',
    display: 'flex',
    flexDirection: orientation === 1 ? 'column' : 'row',
    alignItems: 'center',
    padding: '2px',
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? 'auto' : 'none',
    userSelect: 'none',
    fontFamily: 'MS Sans Serif',
    fontSize: '8pt',
  };

  const buttonStyle: React.CSSProperties = {
    width: '24px',
    height: '20px',
    backgroundColor: '#C0C0C0',
    border: '1px outset #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '10px',
    margin: '1px',
  };

  const progressStyle: React.CSSProperties = {
    flex: 1,
    height: '8px',
    backgroundColor: '#808080',
    border: '1px inset #FFFFFF',
    margin: '0 4px',
    position: 'relative',
    cursor: 'pointer',
  };

  const progressBarStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#0078D4',
    width: currentLength > 0 ? `${(currentPosition / currentLength) * 100}%` : '0%',
    transition: 'width 0.1s ease',
  };

  const timeDisplayStyle: React.CSSProperties = {
    minWidth: '60px',
    textAlign: 'center',
    fontSize: '8pt',
    color: '#000000',
  };

  return (
    <>
      {/* Hidden media elements */}
      {!isDesignMode && (
        <>
          <audio
            ref={audioRef}
            style={{ display: 'none' }}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            muted={silent}
          />
          <video
            ref={videoRef}
            style={{ display: 'none' }}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            muted={silent}
          />
        </>
      )}
      
      {/* MMControl UI */}
      <div
        style={containerStyle}
        title={toolTipText || `MMControl: ${deviceType}`}
        data-control-type="MMControl"
        data-control-name={control.name}
        data-control-index={index}
      >
        {/* Control Buttons */}
        <button
          style={buttonStyle}
          onClick={() => executeCommand('play')}
          disabled={!enabled || currentMode === MMControlModes.mmNotOpen}
          title="Play"
        >
          ▶
        </button>
        
        <button
          style={buttonStyle}
          onClick={() => executeCommand('pause')}
          disabled={!enabled || !isPlaying}
          title="Pause"
        >
          ⏸
        </button>
        
        <button
          style={buttonStyle}
          onClick={() => executeCommand('stop')}
          disabled={!enabled || currentMode === MMControlModes.mmNotOpen}
          title="Stop"
        >
          ⏹
        </button>
        
        <button
          style={buttonStyle}
          onClick={() => executeCommand('seek')}
          disabled={!enabled || currentMode === MMControlModes.mmNotOpen}
          title="Previous"
        >
          ⏮
        </button>
        
        <button
          style={buttonStyle}
          onClick={() => executeCommand('seek')}
          disabled={!enabled || currentMode === MMControlModes.mmNotOpen}
          title="Next"
        >
          ⏭
        </button>
        
        {/* Progress Bar */}
        <div
          ref={progressRef}
          style={progressStyle}
          onClick={handleProgressClick}
          title={`Position: ${formatTime(currentPosition)} / ${formatTime(currentLength)}`}
        >
          <div style={progressBarStyle} />
        </div>
        
        {/* Time Display */}
        <div style={timeDisplayStyle}>
          {formatTime(currentPosition)}
        </div>
        
        {/* Error Display */}
        {error && (
          <div
            style={{
              position: 'absolute',
              top: height + 2,
              left: 0,
              fontSize: '8pt',
              color: 'red',
              backgroundColor: '#FFEEEE',
              padding: '2px',
              border: '1px solid red',
              maxWidth: width,
            }}
          >
            {error}
          </div>
        )}
      </div>
      
      {/* Design mode indicator */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            left: x - 1,
            top: y - 1,
            width: width + 2,
            height: height + 2,
            border: '1px dashed #0066cc',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

// VB6 MMControl events
export const MMControlEvents = {
  StatusUpdate: 'StatusUpdate',
  PositionChange: 'PositionChange',
  Done: 'Done',
  BackClick: 'BackClick',
  NextClick: 'NextClick',
  PlayClick: 'PlayClick',
  PauseClick: 'PauseClick',
  StopClick: 'StopClick',
  RecordClick: 'RecordClick',
  EjectClick: 'EjectClick',
};

// VB6 MMControl methods
export const MMControlMethods = {
  About: 'About',
  Refresh: 'Refresh',
};

// VB6 MMControl constants
export const MMControlConstants = {
  // Mode constants
  mmNotOpen: 524,
  mmOpen: 525,
  mmPlaying: 526,
  mmStopped: 527,
  mmPaused: 528,
  mmRecording: 529,
  mmSeeking: 530,
  
  // Time format constants
  mmTimeFormatMs: 0,
  mmTimeFormatHms: 1,
  mmTimeFormatMsf: 2,
  mmTimeFormatFrames: 3,
  mmTimeFormatSmpte24: 4,
  mmTimeFormatSmpte25: 5,
  mmTimeFormatSmpte30: 6,
  mmTimeFormatSmpte30Drop: 7,
  
  // Device type constants
  mmDeviceTypeAnimation: 'Animation',
  mmDeviceTypeAudioCD: 'CDAudio', 
  mmDeviceTypeDAT: 'DAT',
  mmDeviceTypeDigitalVideo: 'DigitalVideo',
  mmDeviceTypeMMMovie: 'MMMovie',
  mmDeviceTypeOther: 'Other',
  mmDeviceTypeOverlay: 'Overlay',
  mmDeviceTypeScanner: 'Scanner',
  mmDeviceTypeSequencer: 'Sequencer',
  mmDeviceTypeVCR: 'VCR',
  mmDeviceTypeVideodisc: 'Videodisc',
  mmDeviceTypeWaveAudio: 'WaveAudio',
};

// VB6 MMControl default properties
export const getMMControlDefaults = (id: number) => ({
  id,
  type: 'MMControl',
  name: `MMControl${id}`,
  x: 100,
  y: 100,
  width: 315,
  height: 35,
  fileName: '',
  deviceType: 'WaveAudio',
  command: '',
  orientation: 0,
  mode: 524,
  position: 0,
  length: 0,
  start: 0,
  to: 0,
  from: 0,
  frames: 0,
  tracks: 1,
  trackLength: [],
  trackPosition: [],
  autoEnable: true,
  enabled: true,
  visible: true,
  shareMode: false,
  updateInterval: 1000,
  timeFormat: 0,
  notify: true,
  wait: true,
  silent: false,
  recordMode: 0,
  usesWindows: true,
  hWndDisplay: 0,
  borderStyle: 1,
  toolTipText: '',
  tag: '',
  tabIndex: id,
});

// Declare global VB6Runtime interface
declare global {
  interface Window {
    VB6Runtime?: {
      fireEvent: (controlName: string, eventName: string, eventData?: any) => void;
    };
  }
}

export default MMControl;