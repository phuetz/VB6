import React, { useEffect, useRef } from 'react';
import { vb6Debugger, Breakpoint } from '../../services/VB6DebuggerService';

interface BreakpointGutterProps {
  editor: any; // Monaco editor instance
  file: string;
  onBreakpointToggle?: (line: number) => void;
}

export const BreakpointGutter: React.FC<BreakpointGutterProps> = ({
  editor,
  file,
  onBreakpointToggle
}) => {
  const breakpointsRef = useRef<Breakpoint[]>([]);
  const decorationsRef = useRef<string[]>([]);

  // Update breakpoint decorations in Monaco editor
  const updateDecorations = (breakpoints: Breakpoint[]) => {
    if (!editor) return;

    const newDecorations = breakpoints
      .filter(bp => bp.file === file)
      .map(bp => ({
        range: new editor.getModel().constructor.Range(bp.line, 1, bp.line, 1),
        options: {
          isWholeLine: true,
          className: bp.enabled ? 'debug-breakpoint-enabled' : 'debug-breakpoint-disabled',
          glyphMarginClassName: bp.enabled 
            ? 'debug-breakpoint-glyph-enabled'
            : 'debug-breakpoint-glyph-disabled',
          glyphMarginHoverMessage: {
            value: `**Breakpoint** ${bp.condition ? `\n\nCondition: \`${bp.condition}\`` : ''}${
              bp.hitCount ? `\n\nHit count: ${bp.hitCount}` : ''
            }`
          },
          stickiness: 1 // TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      }));

    // Update decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  // Add current line decoration
  const updateCurrentLine = (line?: number) => {
    if (!editor || !line) return;

    const currentLineDecorations = [{
      range: new editor.getModel().constructor.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'debug-current-line',
        glyphMarginClassName: 'debug-current-line-glyph'
      }
    }];

    editor.deltaDecorations([], currentLineDecorations);
  };

  // Handle gutter clicks
  useEffect(() => {
    if (!editor) return;

    const handleGutterClick = (e: any) => {
      const line = e.target.position?.lineNumber;
      if (line && e.target.type === 2) { // GUTTER_GLYPH_MARGIN
        // Toggle breakpoint
        const existingBreakpoint = breakpointsRef.current.find(
          bp => bp.file === file && bp.line === line
        );

        if (existingBreakpoint) {
          vb6Debugger.removeBreakpoint(existingBreakpoint.id);
        } else {
          vb6Debugger.addBreakpoint(file, line);
        }

        onBreakpointToggle?.(line);
      }
    };

    editor.onMouseDown(handleGutterClick);
  }, [editor, file, onBreakpointToggle]);

  // Subscribe to debugger events
  useEffect(() => {
    const handleBreakpointEvent = () => {
      const breakpoints = vb6Debugger.getBreakpoints();
      breakpointsRef.current = breakpoints;
      updateDecorations(breakpoints);
    };

    const handleDebugEvent = (event: any) => {
      const state = vb6Debugger.getState();
      
      // Update current line
      if (state.currentFile === file && state.currentLine) {
        updateCurrentLine(state.currentLine);
      }
    };

    vb6Debugger.on('breakpoint', handleBreakpointEvent);
    vb6Debugger.on('debug', handleDebugEvent);

    // Initial update
    handleBreakpointEvent();

    return () => {
      vb6Debugger.off('breakpoint', handleBreakpointEvent);
      vb6Debugger.off('debug', handleDebugEvent);
      
      // Clean up decorations
      if (editor && decorationsRef.current.length > 0) {
        editor.deltaDecorations(decorationsRef.current, []);
      }
    };
  }, [editor, file]);

  // Add CSS styles for breakpoint decorations
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .debug-breakpoint-enabled {
        background-color: rgba(255, 0, 0, 0.1);
        border-left: 3px solid #ff0000;
      }
      
      .debug-breakpoint-disabled {
        background-color: rgba(128, 128, 128, 0.1);
        border-left: 3px solid #808080;
      }
      
      .debug-breakpoint-glyph-enabled:before {
        content: '●';
        color: #ff0000;
        font-size: 14px;
        font-weight: bold;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .debug-breakpoint-glyph-disabled:before {
        content: '○';
        color: #808080;
        font-size: 14px;
        font-weight: bold;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .debug-current-line {
        background-color: rgba(255, 255, 0, 0.2);
        border-left: 3px solid #ffff00;
      }
      
      .debug-current-line-glyph:before {
        content: '▶';
        color: #ffa500;
        font-size: 12px;
        font-weight: bold;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .monaco-editor .margin-view-overlays .debug-breakpoint-glyph-enabled,
      .monaco-editor .margin-view-overlays .debug-breakpoint-glyph-disabled,
      .monaco-editor .margin-view-overlays .debug-current-line-glyph {
        cursor: pointer;
        width: 16px;
        height: 18px;
        position: relative;
      }
    `;
    
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default BreakpointGutter;