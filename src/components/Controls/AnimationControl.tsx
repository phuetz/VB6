/**
 * Animation Control - Complete VB6 Animation Control Implementation
 * Supports animated GIFs, AVI files (via web formats), and CSS animations
 * Provides full VB6 API compatibility for multimedia content
 */

import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { VB6ControlPropsEnhanced } from './VB6ControlsEnhanced';
import { useVB6Store } from '../../stores/vb6Store';

// Animation Control Constants
export enum AnimationAlign {
  aniLeft = 0,
  aniCenter = 1,
  aniRight = 2
}

export enum AnimationBackStyle {
  aniTransparent = 0,
  aniOpaque = 1
}

export enum AnimationState {
  aniClosed = 0,
  aniOpen = 1,
  aniPlaying = 2,
  aniPaused = 3,
  aniStopped = 4
}

export interface AnimationControlProps extends VB6ControlPropsEnhanced {
  // Animation properties
  filename?: string;
  align?: AnimationAlign;
  backStyle?: AnimationBackStyle;
  autoPlay?: boolean;
  center?: boolean;
  
  // Visual properties
  backColor?: string;
  borderStyle?: number;
  
  // Events
  onClick?: () => void;
  onDblClick?: () => void;
  onStatusUpdate?: (status: AnimationState) => void;
}

export const AnimationControl = forwardRef<HTMLDivElement, AnimationControlProps>((props, ref) => {
  const {
    id,
    name,
    left = 0,
    top = 0,
    width = 100,
    height = 100,
    visible = true,
    enabled = true,
    filename = '',
    align = AnimationAlign.aniCenter,
    backStyle = AnimationBackStyle.aniTransparent,
    autoPlay = true,
    center = true,
    backColor = '#C0C0C0',
    borderStyle = 1,
    onClick,
    onDblClick,
    onStatusUpdate,
    ...rest
  } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);

  // Load animation file
  useEffect(() => {
    if (filename && !isDesignMode) {
      loadAnimation(filename);
    }
  }, [filename, isDesignMode, loadAnimation]);

  // Auto-play when loaded
  useEffect(() => {
    if (isLoaded && autoPlay && !isDesignMode) {
      play();
    }
  }, [isLoaded, autoPlay, isDesignMode, play]);

  const loadAnimation = useCallback(async (path: string) => {
    try {
      setError(null);
      setIsLoaded(false);
      
      if (videoRef.current) {
        videoRef.current.src = path;
        
        // For modern browsers, we'll use video element to handle various formats
        videoRef.current.addEventListener('loadedmetadata', () => {
          const duration = videoRef.current?.duration || 0;
          const fps = 30; // Assume 30 FPS for frame calculations
          setFrameCount(Math.floor(duration * fps));
          setIsLoaded(true);
        });
        
        videoRef.current.addEventListener('error', () => {
          setError('Failed to load animation file');
        });
      }
    } catch (err) {
      setError(`Error loading animation: ${err}`);
    }
  }, []);

  const play = useCallback(() => {
    if (!isLoaded || isPlaying) return;
    
    setIsPlaying(true);
    setCurrentRepetition(0);
    
    if (videoRef.current) {
      const startTime = start > 0 ? start / 30 : 0; // Convert frame to seconds
      const endTime = stop > 0 ? stop / 30 : videoRef.current.duration;
      
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      
      // Monitor playback
      const checkPlayback = () => {
        if (!videoRef.current || !isPlaying) return;
        
        const currentTime = videoRef.current.currentTime;
        const currentFrameNum = Math.floor(currentTime * 30);
        setCurrentFrame(currentFrameNum);
        
        // Check if we've reached the end frame
        if (endTime > 0 && currentTime >= endTime) {
          if (repetitions === 0 || currentRepetition < repetitions - 1) {
            // Repeat animation
            setCurrentRepetition(prev => prev + 1);
            videoRef.current.currentTime = startTime;
          } else {
            // Stop animation
            stop();
            return;
          }
        }
        
        if (timers) {
          animationIdRef.current = requestAnimationFrame(checkPlayback);
        }
      };
      
      if (timers) {
        checkPlayback();
      }
    }
  }, [isLoaded, isPlaying, currentRepetition]);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
    setCurrentRepetition(0);
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = start > 0 ? start / 30 : 0;
    }
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  const seek = useCallback((frame: number) => {
    if (!isLoaded || !videoRef.current) return;
    
    const time = frame / 30; // Convert frame to seconds
    videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration));
    setCurrentFrame(frame);
  }, [isLoaded]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    onEvent?.('Click', { x: event.clientX, y: event.clientY });
  }, [enabled]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    onEvent?.('DblClick', { x: event.clientX, y: event.clientY });
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  const getBorderStyle = () => {
    if (borderStyle === 0) return 'none';
    return appearance === 0 ? '1px solid #808080' : '1px inset #d0d0d0';
  };

  const getCursorStyle = () => {
    const cursors = [
      'default', 'auto', 'crosshair', 'text', 'wait', 'help',
      'pointer', 'not-allowed', 'move', 'col-resize', 'row-resize',
      'n-resize', 's-resize', 'e-resize', 'w-resize'
    ];
    return cursors[mousePointer] || 'default';
  };

  const containerStyle = {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: getBorderStyle(),
    background: backstyle === 0 || transparent ? 'transparent' : '#f0f0f0',
    cursor: getCursorStyle(),
    opacity: enabled ? 1 : 0.5,
    outline: isDesignMode ? '1px dotted #333' : 'none',
    overflow: 'hidden',
    display: 'flex',
    alignItems: center ? 'center' : 'flex-start',
    justifyContent: center ? 'center' : 'flex-start'
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: center ? 'contain' : 'cover' as const,
    display: isDesignMode ? 'none' : 'block'
  };

  return (
    <div
      className={`vb6-animation ${!enabled ? 'disabled' : ''}`}
      style={containerStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-name={name}
      data-type="Animation"
    >
      {/* Video element for actual playback */}
      <video
        ref={videoRef}
        style={videoStyle}
        muted
        playsInline
        onLoadedMetadata={() => setIsLoaded(true)}
        onError={() => setError('Failed to load video')}
        onEnded={() => {
          if (repetitions > 0 && currentRepetition >= repetitions - 1) {
            stopAnimation();
          }
        }}
      />

      {/* Canvas for frame-by-frame control (if needed) */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={width}
        height={height}
      />

      {/* Design mode placeholder */}
      {isDesignMode && (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            padding: '4px'
          }}
        >
          <div style={{ fontSize: '16px', marginBottom: '4px' }}>🎬</div>
          <div>Animation</div>
          {filename && (
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              {filename.split('/').pop()}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && !isDesignMode && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#800000',
            textAlign: 'center',
            padding: '4px'
          }}
        >
          {error}
        </div>
      )}

      {/* Playback controls (design mode) */}
      {isDesignMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '2px',
            right: '2px',
            height: '16px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px'
          }}
        >
          <span>{isPlaying ? '▶️' : '⏸️'}</span>
          <span>{currentFrame}/{frameCount}</span>
        </div>
      )}

      {/* Design Mode Info */}
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
          {name} - Animation
          {autoPlay && <span> (AutoPlay)</span>}
        </div>
      )}
    </div>
  );
});

// Helper functions for Animation control
export const AnimationHelpers = {
  /**
   * Check if file is a supported animation format
   */
  isSupportedFormat: (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['avi', 'mp4', 'webm', 'mov', 'gif'].includes(ext || '');
  },

  /**
   * Convert AVI path to web-compatible format
   */
  convertPath: (aviPath: string): string => {
    // In a real implementation, this would convert VB6 paths to web paths
    if (aviPath.includes('\\')) {
      return aviPath.replace(/\\/g, '/');
    }
    return aviPath;
  },

  /**
   * Get frame rate from duration and frame count
   */
  calculateFrameRate: (duration: number, frames: number): number => {
    return frames > 0 && duration > 0 ? frames / duration : 30;
  },

  /**
   * Convert frame number to time
   */
  frameToTime: (frame: number, fps: number = 30): number => {
    return frame / fps;
  },

  /**
   * Convert time to frame number
   */
  timeToFrame: (time: number, fps: number = 30): number => {
    return Math.floor(time * fps);
  }
};

// VB6 Animation methods simulation
export const AnimationMethods = {
  /**
   * Open animation file
   */
  open: (control: AnimationControl, filename: string) => {
    return {
      ...control,
      filename: AnimationHelpers.convertPath(filename)
    };
  },

  /**
   * Play animation
   */
  play: (control: AnimationControl, repeat: number = 1, start?: number, stop?: number) => {
    return {
      ...control,
      repetitions: repeat,
      start: start !== undefined ? start : control.start,
      stop: stop !== undefined ? stop : control.stop
    };
  },

  /**
   * Stop animation
   */
  stop: (control: AnimationControl) => {
    // This would trigger the stop method in the component
    return control;
  },

  /**
   * Close animation
   */
  close: (control: AnimationControl) => {
    return {
      ...control,
      filename: ''
    };
  }
};

export default AnimationControl;