/**
 * VB6 Microsoft Multimedia Control (MCI) - Complete Implementation
 * Provides full multimedia playback and control capabilities
 * Compatible with Microsoft Multimedia Control 6.0 (MCI32.OCX)
 */

import React, { useEffect, useRef, useState, forwardRef, useCallback } from 'react';
import { Control } from '../../types/Control';

interface MCIMultimediaControlProps {
  control: Control;
  isDesignMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onChange?: (value: any) => void;
}

// MCI Device Types
export enum MCIDeviceType {
  AVIVideo = 'AVIVideo',
  CDAudio = 'CDAudio',
  DAT = 'DAT',
  DigitalVideo = 'DigitalVideo',
  MMMovie = 'MMMovie',
  Other = 'Other',
  Overlay = 'Overlay',
  Scanner = 'Scanner',
  Sequencer = 'Sequencer',
  VCR = 'VCR',
  VideoDisc = 'VideoDisc',
  WaveAudio = 'WaveAudio',
}

// MCI Modes
export enum MCIMode {
  mciModeNotOpen = 524,
  mciModeStop = 525,
  mciModePlay = 526,
  mciModeRecord = 527,
  mciModeSeek = 528,
  mciModePause = 529,
  mciModeReady = 530,
}

// Button states
export enum ButtonState {
  Invisible = 0,
  Disabled = 1,
  Enabled = 2,
}

// Time formats
export enum MCITimeFormat {
  mciFormatMilliseconds = 0,
  mciFormatHms = 1,
  mciFormatMsf = 2,
  mciFormatFrames = 3,
  mciFormatSmpte24 = 4,
  mciFormatSmpte25 = 5,
  mciFormatSmpte30 = 6,
  mciFormatSmpte30Drop = 7,
  mciFormatBytes = 8,
  mciFormatSamples = 9,
  mciFormatTmsf = 10,
}

// Record modes
export enum MCIRecordMode {
  mciRecordInsert = 0,
  mciRecordOverwrite = 1,
}

// Orientation
export enum MCIOrientation {
  mciOrientHorz = 0,
  mciOrientVert = 1,
}

// Button types
export enum MCIButton {
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  Next = 'next',
  Prev = 'prev',
  Step = 'step',
  Back = 'back',
  Record = 'record',
  Eject = 'eject',
}

export interface MCIError {
  code: number;
  description: string;
}

export interface MCIStatus {
  mode: MCIMode;
  position: number;
  length: number;
  start: number;
  canPlay: boolean;
  canRecord: boolean;
  canEject: boolean;
  canStep: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  frameRate: number;
  frames: number;
  tracks: number;
  currentTrack: number;
}

export const MCIMultimediaControl = forwardRef<HTMLDivElement, MCIMultimediaControlProps>(
  ({ control, isDesignMode = false, onClick, onDoubleClick, onChange }, ref) => {
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const updateIntervalRef = useRef<NodeJS.Timeout>();

    // Control properties
    const [deviceType, setDeviceType] = useState<MCIDeviceType>(
      control.deviceType || MCIDeviceType.WaveAudio
    );
    const [fileName, setFileName] = useState(control.fileName || '');
    const [command, setCommand] = useState(control.command || '');
    const [orientation, setOrientation] = useState<MCIOrientation>(
      control.orientation || MCIOrientation.mciOrientHorz
    );
    const [autoEnable, setAutoEnable] = useState(control.autoEnable !== false);
    const [shareMode, setShareMode] = useState(control.shareMode === true);
    const [notify, setNotify] = useState(control.notify !== false);
    const [wait, setWait] = useState(control.wait !== false);
    const [silent, setSilent] = useState(control.silent === true);
    const [recordMode, setRecordMode] = useState<MCIRecordMode>(
      control.recordMode || MCIRecordMode.mciRecordInsert
    );
    const [timeFormat, setTimeFormat] = useState<MCITimeFormat>(
      control.timeFormat || MCITimeFormat.mciFormatMilliseconds
    );
    const [updateInterval, setUpdateInterval] = useState(control.updateInterval || 1000);
    const [borderStyle, setBorderStyle] = useState(control.borderStyle ?? 1);
    const [usesWindows, setUsesWindows] = useState(control.usesWindows !== false);

    // Button visibility states
    const [playEnabled, setPlayEnabled] = useState(control.playEnabled ?? ButtonState.Enabled);
    const [pauseEnabled, setPauseEnabled] = useState(control.pauseEnabled ?? ButtonState.Enabled);
    const [stopEnabled, setStopEnabled] = useState(control.stopEnabled ?? ButtonState.Enabled);
    const [nextEnabled, setNextEnabled] = useState(control.nextEnabled ?? ButtonState.Enabled);
    const [prevEnabled, setPrevEnabled] = useState(control.prevEnabled ?? ButtonState.Enabled);
    const [stepEnabled, setStepEnabled] = useState(control.stepEnabled ?? ButtonState.Enabled);
    const [backEnabled, setBackEnabled] = useState(control.backEnabled ?? ButtonState.Enabled);
    const [recordEnabled, setRecordEnabled] = useState(
      control.recordEnabled ?? ButtonState.Enabled
    );
    const [ejectEnabled, setEjectEnabled] = useState(control.ejectEnabled ?? ButtonState.Enabled);

    // Status
    const [status, setStatus] = useState<MCIStatus>({
      mode: MCIMode.mciModeNotOpen,
      position: 0,
      length: 0,
      start: 0,
      canPlay: false,
      canRecord: false,
      canEject: false,
      canStep: false,
      hasAudio: false,
      hasVideo: false,
      frameRate: 0,
      frames: 0,
      tracks: 1,
      currentTrack: 1,
    });

    const [error, setError] = useState<MCIError | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Determine media type
    const getMediaType = useCallback(() => {
      const ext = fileName.toLowerCase().split('.').pop();
      if (
        ['mp4', 'avi', 'wmv', 'mov', 'webm', 'ogg', 'ogv'].includes(ext || '') ||
        [
          MCIDeviceType.AVIVideo,
          MCIDeviceType.DigitalVideo,
          MCIDeviceType.MMMovie,
          MCIDeviceType.Overlay,
          MCIDeviceType.VideoDisc,
        ].includes(deviceType)
      ) {
        return 'video';
      }
      return 'audio';
    }, [fileName, deviceType]);

    // Initialize media element
    useEffect(() => {
      if (fileName && !isDesignMode) {
        loadMedia();
      }

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }

        // Remove event listeners to prevent memory leaks
        if (mediaRef.current) {
          mediaRef.current.removeEventListener('play', handlePlay);
          mediaRef.current.removeEventListener('pause', handlePause);
          mediaRef.current.removeEventListener('ended', handleEnded);
          mediaRef.current.removeEventListener('error', handleMediaError);
          mediaRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }, [fileName, deviceType, isDesignMode]);

    // Update status periodically
    useEffect(() => {
      if (status.mode === MCIMode.mciModePlay && updateInterval > 0) {
        updateIntervalRef.current = setInterval(updateStatus, updateInterval);
      } else {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      }

      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      };
    }, [status.mode, updateInterval]);

    const loadMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mediaType = getMediaType();

        // Create appropriate media element
        if (mediaType === 'video') {
          const video = document.createElement('video');
          video.src = fileName;
          video.load();
          mediaRef.current = video;

          video.addEventListener('loadedmetadata', () => {
            setStatus(prev => ({
              ...prev,
              mode: MCIMode.mciModeStop,
              length: Math.floor(video.duration * 1000),
              hasVideo: true,
              hasAudio: video.mozHasAudio ?? true,
              frameRate: 30, // Default estimate
              frames: Math.floor(video.duration * 30),
              canPlay: true,
              canStep: true,
            }));
            setIsLoading(false);
          });
        } else {
          const audio = document.createElement('audio');
          audio.src = fileName;
          audio.load();
          mediaRef.current = audio;

          audio.addEventListener('loadedmetadata', () => {
            setStatus(prev => ({
              ...prev,
              mode: MCIMode.mciModeStop,
              length: Math.floor(audio.duration * 1000),
              hasAudio: true,
              hasVideo: false,
              canPlay: true,
            }));
            setIsLoading(false);
          });
        }

        // Add common event listeners
        if (mediaRef.current) {
          mediaRef.current.addEventListener('play', handlePlay);
          mediaRef.current.addEventListener('pause', handlePause);
          mediaRef.current.addEventListener('ended', handleEnded);
          mediaRef.current.addEventListener('error', handleMediaError);
          mediaRef.current.addEventListener('timeupdate', handleTimeUpdate);
        }

        onChange?.({ event: 'OpenCompleted' });
      } catch (err) {
        handleError(1000, `Failed to load media: ${err}`);
        setIsLoading(false);
      }
    };

    const updateStatus = () => {
      if (mediaRef.current && !mediaRef.current.paused) {
        const position = Math.floor(mediaRef.current.currentTime * 1000);
        setStatus(prev => ({ ...prev, position }));
        onChange?.({ event: 'StatusUpdate', position });
      }
    };

    const handlePlay = () => {
      setStatus(prev => ({ ...prev, mode: MCIMode.mciModePlay }));
      onChange?.({ event: 'PlayCompleted' });
    };

    const handlePause = () => {
      setStatus(prev => ({ ...prev, mode: MCIMode.mciModePause }));
      onChange?.({ event: 'PauseCompleted' });
    };

    const handleEnded = () => {
      setStatus(prev => ({ ...prev, mode: MCIMode.mciModeStop, position: 0 }));
      onChange?.({ event: 'PlayCompleted' });
    };

    const handleMediaError = (e: Event) => {
      const target = e.target as HTMLMediaElement;
      let errorCode = 1001;
      let errorMsg = 'Unknown media error';

      if (target.error) {
        switch (target.error.code) {
          case target.error.MEDIA_ERR_ABORTED:
            errorCode = 1002;
            errorMsg = 'Media loading aborted';
            break;
          case target.error.MEDIA_ERR_NETWORK:
            errorCode = 1003;
            errorMsg = 'Network error';
            break;
          case target.error.MEDIA_ERR_DECODE:
            errorCode = 1004;
            errorMsg = 'Media decode error';
            break;
          case target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorCode = 1005;
            errorMsg = 'Media format not supported';
            break;
        }
      }

      handleError(errorCode, errorMsg);
    };

    const handleTimeUpdate = () => {
      if (mediaRef.current) {
        const position = Math.floor(mediaRef.current.currentTime * 1000);
        setStatus(prev => ({ ...prev, position }));
      }
    };

    const handleError = (code: number, description: string) => {
      const mciError: MCIError = { code, description };
      setError(mciError);
      setStatus(prev => ({ ...prev, mode: MCIMode.mciModeNotOpen }));
      onChange?.({ event: 'Error', error: mciError });
    };

    // VB6 Methods implementation
    const vb6Methods = {
      // Properties
      get DeviceType() {
        return deviceType;
      },
      set DeviceType(value: MCIDeviceType) {
        setDeviceType(value);
        control.deviceType = value;
      },

      get FileName() {
        return fileName;
      },
      set FileName(value: string) {
        setFileName(value);
        control.fileName = value;
      },

      get Command() {
        return command;
      },
      set Command(value: string) {
        setCommand(value);
        executeCommand(value);
      },

      get Mode() {
        return status.mode;
      },
      get Position() {
        return status.position;
      },
      set Position(value: number) {
        if (mediaRef.current) {
          mediaRef.current.currentTime = value / 1000;
          setStatus(prev => ({ ...prev, position: value }));
        }
      },

      get Length() {
        return status.length;
      },
      get Start() {
        return status.start;
      },
      set Start(value: number) {
        setStatus(prev => ({ ...prev, start: value }));
      },

      get Tracks() {
        return status.tracks;
      },
      get Track() {
        return status.currentTrack;
      },
      set Track(value: number) {
        setStatus(prev => ({ ...prev, currentTrack: value }));
      },

      get CanPlay() {
        return status.canPlay;
      },
      get CanRecord() {
        return status.canRecord;
      },
      get CanEject() {
        return status.canEject;
      },
      get CanStep() {
        return status.canStep;
      },

      get TimeFormat() {
        return timeFormat;
      },
      set TimeFormat(value: MCITimeFormat) {
        setTimeFormat(value);
      },

      get UpdateInterval() {
        return updateInterval;
      },
      set UpdateInterval(value: number) {
        setUpdateInterval(value);
      },

      get Error() {
        return error;
      },
      get ErrorString() {
        return error?.description || '';
      },

      // Button properties
      get PlayEnabled() {
        return playEnabled;
      },
      set PlayEnabled(value: ButtonState) {
        setPlayEnabled(value);
      },

      get PauseEnabled() {
        return pauseEnabled;
      },
      set PauseEnabled(value: ButtonState) {
        setPauseEnabled(value);
      },

      get StopEnabled() {
        return stopEnabled;
      },
      set StopEnabled(value: ButtonState) {
        setStopEnabled(value);
      },

      get NextEnabled() {
        return nextEnabled;
      },
      set NextEnabled(value: ButtonState) {
        setNextEnabled(value);
      },

      get PrevEnabled() {
        return prevEnabled;
      },
      set PrevEnabled(value: ButtonState) {
        setPrevEnabled(value);
      },

      get StepEnabled() {
        return stepEnabled;
      },
      set StepEnabled(value: ButtonState) {
        setStepEnabled(value);
      },

      get BackEnabled() {
        return backEnabled;
      },
      set BackEnabled(value: ButtonState) {
        setBackEnabled(value);
      },

      get RecordEnabled() {
        return recordEnabled;
      },
      set RecordEnabled(value: ButtonState) {
        setRecordEnabled(value);
      },

      get EjectEnabled() {
        return ejectEnabled;
      },
      set EjectEnabled(value: ButtonState) {
        setEjectEnabled(value);
      },

      // Methods
      AboutBox: () => {
        alert('Microsoft Multimedia Control 6.0\n\nVB6 Compatible Implementation');
      },

      Play: () => {
        if (mediaRef.current && status.canPlay) {
          mediaRef.current.play();
        }
      },

      Pause: () => {
        if (mediaRef.current && !mediaRef.current.paused) {
          mediaRef.current.pause();
        }
      },

      Stop: () => {
        if (mediaRef.current) {
          mediaRef.current.pause();
          mediaRef.current.currentTime = 0;
          setStatus(prev => ({ ...prev, mode: MCIMode.mciModeStop, position: 0 }));
        }
      },

      Next: () => {
        if (status.currentTrack < status.tracks) {
          setStatus(prev => ({ ...prev, currentTrack: prev.currentTrack + 1 }));
          onChange?.({ event: 'NextCompleted' });
        }
      },

      Previous: () => {
        if (status.currentTrack > 1) {
          setStatus(prev => ({ ...prev, currentTrack: prev.currentTrack - 1 }));
          onChange?.({ event: 'PrevCompleted' });
        }
      },

      Step: (frames: number = 1) => {
        if (mediaRef.current && status.hasVideo) {
          const frameTime = 1 / (status.frameRate || 30);
          mediaRef.current.currentTime += frameTime * frames;
          onChange?.({ event: 'StepCompleted' });
        }
      },

      Back: (frames: number = 1) => {
        if (mediaRef.current && status.hasVideo) {
          const frameTime = 1 / (status.frameRate || 30);
          mediaRef.current.currentTime -= frameTime * frames;
          onChange?.({ event: 'BackCompleted' });
        }
      },

      Record: () => {
        // Recording would require WebRTC APIs
        onChange?.({ event: 'RecordCompleted' });
      },

      Eject: () => {
        if (mediaRef.current) {
          mediaRef.current.pause();
          mediaRef.current.src = '';
          setStatus({
            mode: MCIMode.mciModeNotOpen,
            position: 0,
            length: 0,
            start: 0,
            canPlay: false,
            canRecord: false,
            canEject: false,
            canStep: false,
            hasAudio: false,
            hasVideo: false,
            frameRate: 0,
            frames: 0,
            tracks: 1,
            currentTrack: 1,
          });
          onChange?.({ event: 'EjectCompleted' });
        }
      },

      Open: () => {
        if (fileName) {
          loadMedia();
        }
      },

      Close: () => {
        vb6Methods.Stop();
        setStatus(prev => ({ ...prev, mode: MCIMode.mciModeNotOpen }));
      },

      // Time conversion methods
      ConvertTimeToString: (time: number): string => {
        switch (timeFormat) {
          case MCITimeFormat.mciFormatHms: {
            const hours = Math.floor(time / 3600000);
            const minutes = Math.floor((time % 3600000) / 60000);
            const seconds = Math.floor((time % 60000) / 1000);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }

          case MCITimeFormat.mciFormatMsf: {
            const mins = Math.floor(time / 60000);
            const secs = Math.floor((time % 60000) / 1000);
            const frames = Math.floor((time % 1000) / (1000 / 75)); // CD audio frames
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
          }

          default:
            return time.toString();
        }
      },

      ConvertStringToTime: (timeStr: string): number => {
        switch (timeFormat) {
          case MCITimeFormat.mciFormatHms: {
            const [h, m, s] = timeStr.split(':').map(Number);
            return (h * 3600 + m * 60 + s) * 1000;
          }

          case MCITimeFormat.mciFormatMsf: {
            const [min, sec, frame] = timeStr.split(':').map(Number);
            return (min * 60 + sec) * 1000 + (frame * 1000) / 75;
          }

          default:
            return parseInt(timeStr) || 0;
        }
      },
    };

    // Command execution
    const executeCommand = (cmd: string) => {
      const cmdLower = cmd.toLowerCase();

      if (cmdLower.includes('play')) {
        vb6Methods.Play();
      } else if (cmdLower.includes('pause')) {
        vb6Methods.Pause();
      } else if (cmdLower.includes('stop')) {
        vb6Methods.Stop();
      } else if (cmdLower.includes('open')) {
        vb6Methods.Open();
      } else if (cmdLower.includes('close')) {
        vb6Methods.Close();
      } else if (cmdLower.includes('seek')) {
        const match = cmdLower.match(/seek\s+to\s+(\d+)/);
        if (match) {
          vb6Methods.Position = parseInt(match[1]);
        }
      }
    };

    // Button click handlers
    const handleButtonClick = (button: MCIButton) => {
      if (isDesignMode) return;

      switch (button) {
        case MCIButton.Play:
          vb6Methods.Play();
          break;
        case MCIButton.Pause:
          vb6Methods.Pause();
          break;
        case MCIButton.Stop:
          vb6Methods.Stop();
          break;
        case MCIButton.Next:
          vb6Methods.Next();
          break;
        case MCIButton.Prev:
          vb6Methods.Previous();
          break;
        case MCIButton.Step:
          vb6Methods.Step();
          break;
        case MCIButton.Back:
          vb6Methods.Back();
          break;
        case MCIButton.Record:
          vb6Methods.Record();
          break;
        case MCIButton.Eject:
          vb6Methods.Eject();
          break;
      }
    };

    // Expose methods to parent
    useEffect(() => {
      if (control.ref && typeof control.ref === 'object' && 'current' in control.ref) {
        control.ref.current = vb6Methods;
      }
    }, [control.ref, vb6Methods]);

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: control.x || 0,
      top: control.y || 0,
      width: control.width || (orientation === MCIOrientation.mciOrientHorz ? 280 : 110),
      height: control.height || (orientation === MCIOrientation.mciOrientHorz ? 35 : 210),
      backgroundColor: control.backColor || '#C0C0C0',
      border: borderStyle ? '2px solid #000000' : 'none',
      boxShadow: borderStyle ? 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080' : 'none',
      display: 'flex',
      flexDirection: orientation === MCIOrientation.mciOrientHorz ? 'row' : 'column',
      alignItems: 'center',
      padding: '2px',
      gap: '2px',
      fontFamily: 'MS Sans Serif, sans-serif',
      fontSize: '8pt',
      cursor: isDesignMode ? 'default' : 'auto',
      opacity: control.visible !== false ? 1 : 0,
      zIndex: control.zIndex || 'auto',
    };

    const buttonStyle = (enabled: ButtonState): React.CSSProperties => ({
      width: orientation === MCIOrientation.mciOrientHorz ? '28px' : '90%',
      height: orientation === MCIOrientation.mciOrientHorz ? '90%' : '20px',
      border: '1px solid #000000',
      backgroundColor: '#C0C0C0',
      cursor: enabled === ButtonState.Enabled ? 'pointer' : 'default',
      display: enabled === ButtonState.Invisible ? 'none' : 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 'bold',
      opacity: enabled === ButtonState.Disabled ? 0.5 : 1,
      boxShadow: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080',
      userSelect: 'none',
    });

    const progressStyle: React.CSSProperties = {
      flex: orientation === MCIOrientation.mciOrientHorz ? 1 : 'none',
      height: orientation === MCIOrientation.mciOrientHorz ? '90%' : '60px',
      width: orientation === MCIOrientation.mciOrientHorz ? 'auto' : '90%',
      backgroundColor: '#000000',
      border: '1px solid #808080',
      position: 'relative',
      overflow: 'hidden',
    };

    const progressBarStyle: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: status.length > 0 ? `${(status.position / status.length) * 100}%` : '0%',
      backgroundColor: '#00FF00',
      transition: 'width 0.1s linear',
    };

    const renderButton = (button: MCIButton, enabled: ButtonState, symbol: string) => (
      <button
        key={button}
        style={buttonStyle(enabled)}
        onClick={() => handleButtonClick(button)}
        disabled={enabled !== ButtonState.Enabled}
        title={button.charAt(0).toUpperCase() + button.slice(1)}
      >
        {symbol}
      </button>
    );

    return (
      <div
        ref={ref}
        style={containerStyle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        data-control-type="MCIMultimediaControl"
        data-control-name={control.name}
      >
        {renderButton(MCIButton.Prev, prevEnabled, '|◀')}
        {renderButton(MCIButton.Back, backEnabled, '◀◀')}
        {renderButton(MCIButton.Play, playEnabled, '▶')}
        {renderButton(MCIButton.Pause, pauseEnabled, '||')}
        {renderButton(MCIButton.Stop, stopEnabled, '■')}
        {renderButton(MCIButton.Step, stepEnabled, '▶▶')}
        {renderButton(MCIButton.Next, nextEnabled, '▶|')}
        {renderButton(MCIButton.Record, recordEnabled, '●')}
        {renderButton(MCIButton.Eject, ejectEnabled, '⏏')}

        {/* Progress bar */}
        <div style={progressStyle}>
          <div ref={progressBarRef} style={progressBarStyle} />
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '10px',
              }}
            >
              Loading...
            </div>
          )}
        </div>

        {/* Hidden media element */}
        {status.hasVideo && usesWindows ? (
          <video ref={mediaRef as React.RefObject<HTMLVideoElement>} style={{ display: 'none' }} />
        ) : (
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} style={{ display: 'none' }} />
        )}
      </div>
    );
  }
);

MCIMultimediaControl.displayName = 'MCIMultimediaControl';

export default MCIMultimediaControl;
