import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Import debugging components
import DebugPanel from '../../components/Debug/DebugPanel';
import BreakpointGutter from '../../components/Debug/BreakpointGutter';
import CallStackPanel from '../../components/Debug/CallStackPanel';
import LocalsPanel from '../../components/Debug/LocalsPanel';
import WatchPanel from '../../components/Debug/WatchPanel';
import ImmediateWindow from '../../components/Debug/ImmediateWindow';
import DebugToolbar from '../../components/Debug/DebugToolbar';
import MemoryProfiler from '../../components/Debug/MemoryProfiler';
import TimeTravelDebugger from '../../components/Debug/TimeTravelDebugger';
import VisualDebugger from '../../components/Debug/VisualDebugger';

// Mocks
vi.mock('../../stores/vb6Store');
vi.mock('../../services/VB6DebuggerService');

describe('Debugging Components Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockDebugger: any;

  beforeEach(() => {
    user = userEvent.setup();
    mockDebugger = {
      isRunning: false,
      isPaused: false,
      breakpoints: [],
      currentLine: null,
      callStack: [],
      locals: {},
      watches: [],
      addBreakpoint: vi.fn(),
      removeBreakpoint: vi.fn(),
      stepOver: vi.fn(),
      stepInto: vi.fn(),
      stepOut: vi.fn(),
      continue: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      evaluate: vi.fn()
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DebugPanel Component', () => {
    it('should render all debug panels', () => {
      render(<DebugPanel debugger={mockDebugger} />);
      
      expect(screen.getByTestId('debug-panel')).toBeInTheDocument();
      expect(screen.getByText('Call Stack')).toBeInTheDocument();
      expect(screen.getByText('Locals')).toBeInTheDocument();
      expect(screen.getByText('Watch')).toBeInTheDocument();
      expect(screen.getByText('Immediate')).toBeInTheDocument();
    });

    it('should show current execution state', () => {
      mockDebugger.isRunning = true;
      mockDebugger.isPaused = true;
      mockDebugger.currentLine = 42;
      
      render(<DebugPanel debugger={mockDebugger} />);
      
      expect(screen.getByText('Paused at line 42')).toBeInTheDocument();
      expect(screen.getByTestId('debug-status')).toHaveClass('paused');
    });

    it('should handle panel resizing', async () => {
      render(<DebugPanel debugger={mockDebugger} />);
      
      const resizer = screen.getByTestId('panel-resizer');
      const panel = screen.getByTestId('locals-panel');
      
      const initialHeight = parseInt(getComputedStyle(panel).height);
      
      fireEvent.mouseDown(resizer, { clientY: 200 });
      fireEvent.mouseMove(window, { clientY: 300 });
      fireEvent.mouseUp(window);
      
      const newHeight = parseInt(getComputedStyle(panel).height);
      expect(newHeight).not.toBe(initialHeight);
    });

    it('should allow panel collapsing', async () => {
      render(<DebugPanel debugger={mockDebugger} />);
      
      const collapseButton = screen.getByTestId('collapse-locals');
      const panel = screen.getByTestId('locals-panel');
      
      expect(panel).toBeVisible();
      
      await user.click(collapseButton);
      expect(panel).not.toBeVisible();
      
      await user.click(collapseButton);
      expect(panel).toBeVisible();
    });

    it('should persist panel layout', () => {
      render(<DebugPanel debugger={mockDebugger} />);
      
      // Modify layout
      const resizer = screen.getByTestId('panel-resizer');
      fireEvent.mouseDown(resizer, { clientY: 200 });
      fireEvent.mouseMove(window, { clientY: 300 });
      fireEvent.mouseUp(window);
      
      // Check localStorage
      const layout = JSON.parse(localStorage.getItem('debug-panel-layout') || '{}');
      expect(layout).toHaveProperty('localsHeight');
    });
  });

  describe('BreakpointGutter Component', () => {
    const defaultProps = {
      lines: 100,
      breakpoints: [5, 10, 15],
      currentLine: 10,
      onToggleBreakpoint: vi.fn()
    };

    it('should render line numbers and breakpoints', () => {
      render(<BreakpointGutter {...defaultProps} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      
      const bp5 = screen.getByTestId('breakpoint-5');
      const bp10 = screen.getByTestId('breakpoint-10');
      
      expect(bp5).toHaveClass('breakpoint');
      expect(bp10).toHaveClass('breakpoint', 'current-line');
    });

    it('should toggle breakpoints on click', async () => {
      render(<BreakpointGutter {...defaultProps} />);
      
      const line20 = screen.getByTestId('gutter-line-20');
      await user.click(line20);
      
      expect(defaultProps.onToggleBreakpoint).toHaveBeenCalledWith(20);
    });

    it('should show execution indicator', () => {
      render(<BreakpointGutter {...defaultProps} executionLine={7} />);
      
      const line7 = screen.getByTestId('gutter-line-7');
      expect(line7).toHaveClass('execution-line');
      
      const arrow = within(line7).getByTestId('execution-arrow');
      expect(arrow).toBeInTheDocument();
    });

    it('should support conditional breakpoints', async () => {
      const conditionalBreakpoints = [
        { line: 5, condition: 'x > 10' },
        { line: 10, condition: 'name === "test"' }
      ];
      
      render(
        <BreakpointGutter
          {...defaultProps}
          conditionalBreakpoints={conditionalBreakpoints}
        />
      );
      
      const bp5 = screen.getByTestId('breakpoint-5');
      expect(bp5).toHaveClass('conditional-breakpoint');
      
      await user.hover(bp5);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('x > 10');
      });
    });

    it('should handle right-click context menu', async () => {
      render(<BreakpointGutter {...defaultProps} />);
      
      const line10 = screen.getByTestId('gutter-line-10');
      fireEvent.contextMenu(line10);
      
      expect(screen.getByText('Remove Breakpoint')).toBeInTheDocument();
      expect(screen.getByText('Edit Condition')).toBeInTheDocument();
      expect(screen.getByText('Disable Breakpoint')).toBeInTheDocument();
    });

    it('should show hit count for breakpoints', () => {
      const breakpointsWithHits = [
        { line: 5, hits: 3 },
        { line: 10, hits: 0 }
      ];
      
      render(
        <BreakpointGutter
          {...defaultProps}
          breakpointHits={breakpointsWithHits}
        />
      );
      
      const bp5 = screen.getByTestId('breakpoint-5');
      expect(within(bp5).getByText('3')).toBeInTheDocument();
    });
  });

  describe('CallStackPanel Component', () => {
    const mockCallStack = [
      { function: 'Main', file: 'Module1.bas', line: 42 },
      { function: 'Calculate', file: 'Module1.bas', line: 15 },
      { function: 'GetData', file: 'DataModule.bas', line: 8 }
    ];

    it('should display call stack frames', () => {
      render(<CallStackPanel callStack={mockCallStack} />);
      
      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Calculate')).toBeInTheDocument();
      expect(screen.getByText('GetData')).toBeInTheDocument();
      
      expect(screen.getByText('Module1.bas:42')).toBeInTheDocument();
    });

    it('should highlight current frame', () => {
      render(<CallStackPanel callStack={mockCallStack} currentFrame={0} />);
      
      const mainFrame = screen.getByText('Main').closest('.stack-frame');
      expect(mainFrame).toHaveClass('current-frame');
    });

    it('should handle frame selection', async () => {
      const onSelectFrame = vi.fn();
      render(
        <CallStackPanel
          callStack={mockCallStack}
          onSelectFrame={onSelectFrame}
        />
      );
      
      await user.click(screen.getByText('Calculate'));
      expect(onSelectFrame).toHaveBeenCalledWith(1);
    });

    it('should show frame details on hover', async () => {
      render(<CallStackPanel callStack={mockCallStack} />);
      
      const frame = screen.getByText('Calculate').closest('.stack-frame');
      await user.hover(frame!);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('Arguments:');
        expect(tooltip).toHaveTextContent('Local Variables:');
      });
    });

    it('should support async stack traces', () => {
      const asyncStack = [
        { function: 'async Main', file: 'Module1.bas', line: 42, async: true },
        { function: 'await GetData', file: 'Module1.bas', line: 15, async: true }
      ];
      
      render(<CallStackPanel callStack={asyncStack} />);
      
      const asyncFrame = screen.getByText('async Main').closest('.stack-frame');
      expect(asyncFrame).toHaveClass('async-frame');
    });

    it('should handle empty call stack', () => {
      render(<CallStackPanel callStack={[]} />);
      
      expect(screen.getByText('No call stack available')).toBeInTheDocument();
    });
  });

  describe('LocalsPanel Component', () => {
    const mockLocals = {
      x: { value: 10, type: 'Integer' },
      name: { value: 'Test', type: 'String' },
      arr: { value: [1, 2, 3], type: 'Array' },
      obj: {
        value: { prop1: 'value1', prop2: 42 },
        type: 'Object'
      }
    };

    it('should display local variables', () => {
      render(<LocalsPanel locals={mockLocals} />);
      
      expect(screen.getByText('x')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Integer')).toBeInTheDocument();
      
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('"Test"')).toBeInTheDocument();
    });

    it('should handle expandable objects', async () => {
      render(<LocalsPanel locals={mockLocals} />);
      
      const objExpander = screen.getByTestId('expand-obj');
      
      expect(screen.queryByText('prop1')).not.toBeInTheDocument();
      
      await user.click(objExpander);
      
      expect(screen.getByText('prop1')).toBeInTheDocument();
      expect(screen.getByText('"value1"')).toBeInTheDocument();
      expect(screen.getByText('prop2')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle array expansion', async () => {
      render(<LocalsPanel locals={mockLocals} />);
      
      const arrExpander = screen.getByTestId('expand-arr');
      await user.click(arrExpander);
      
      expect(screen.getByText('[0]')).toBeInTheDocument();
      expect(screen.getByText('[1]')).toBeInTheDocument();
      expect(screen.getByText('[2]')).toBeInTheDocument();
    });

    it('should support inline editing', async () => {
      const onEditLocal = vi.fn();
      render(<LocalsPanel locals={mockLocals} onEditLocal={onEditLocal} />);
      
      const value = screen.getByText('10');
      await user.dblClick(value);
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, '20');
      await user.keyboard('{Enter}');
      
      expect(onEditLocal).toHaveBeenCalledWith('x', '20');
    });

    it('should filter variables', async () => {
      render(<LocalsPanel locals={mockLocals} />);
      
      const filterInput = screen.getByPlaceholderText('Filter locals...');
      await user.type(filterInput, 'name');
      
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.queryByText('x')).not.toBeInTheDocument();
    });

    it('should show variable scope', () => {
      const scopedLocals = {
        globalVar: { value: 1, type: 'Integer', scope: 'global' },
        localVar: { value: 2, type: 'Integer', scope: 'local' },
        moduleVar: { value: 3, type: 'Integer', scope: 'module' }
      };
      
      render(<LocalsPanel locals={scopedLocals} />);
      
      const globalVar = screen.getByText('globalVar').closest('.variable');
      expect(globalVar).toHaveClass('scope-global');
    });
  });

  describe('WatchPanel Component', () => {
    const mockWatches = [
      { id: '1', expression: 'x + y', value: 30, type: 'Integer' },
      { id: '2', expression: 'name.Length', value: 4, type: 'Integer' },
      { id: '3', expression: 'arr[0]', value: 1, type: 'Integer' }
    ];

    it('should display watch expressions', () => {
      render(<WatchPanel watches={mockWatches} />);
      
      expect(screen.getByText('x + y')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('name.Length')).toBeInTheDocument();
    });

    it('should add new watch expression', async () => {
      const onAddWatch = vi.fn();
      render(<WatchPanel watches={mockWatches} onAddWatch={onAddWatch} />);
      
      const addButton = screen.getByTestId('add-watch');
      await user.click(addButton);
      
      const input = screen.getByPlaceholderText('Enter expression...');
      await user.type(input, 'z * 2');
      await user.keyboard('{Enter}');
      
      expect(onAddWatch).toHaveBeenCalledWith('z * 2');
    });

    it('should remove watch expression', async () => {
      const onRemoveWatch = vi.fn();
      render(<WatchPanel watches={mockWatches} onRemoveWatch={onRemoveWatch} />);
      
      const removeButton = screen.getByTestId('remove-watch-1');
      await user.click(removeButton);
      
      expect(onRemoveWatch).toHaveBeenCalledWith('1');
    });

    it('should edit watch expression', async () => {
      const onEditWatch = vi.fn();
      render(<WatchPanel watches={mockWatches} onEditWatch={onEditWatch} />);
      
      const expression = screen.getByText('x + y');
      await user.dblClick(expression);
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'x * y');
      await user.keyboard('{Enter}');
      
      expect(onEditWatch).toHaveBeenCalledWith('1', 'x * y');
    });

    it('should show evaluation errors', () => {
      const watchesWithError = [
        ...mockWatches,
        { id: '4', expression: 'undefined.prop', error: 'Cannot read property of undefined' }
      ];
      
      render(<WatchPanel watches={watchesWithError} />);
      
      const errorWatch = screen.getByText('undefined.prop').closest('.watch-item');
      expect(errorWatch).toHaveClass('error');
      expect(screen.getByText('Cannot read property of undefined')).toBeInTheDocument();
    });

    it('should support drag and drop reordering', async () => {
      render(<WatchPanel watches={mockWatches} />);
      
      const watch1 = screen.getByText('x + y').closest('.watch-item');
      const watch3 = screen.getByText('arr[0]').closest('.watch-item');
      
      // Simulate drag and drop
      fireEvent.dragStart(watch1!);
      fireEvent.dragEnter(watch3!);
      fireEvent.dragEnd(watch1!);
      
      // Check reordering
      const items = screen.getAllByTestId(/watch-item/);
      expect(items[2]).toHaveTextContent('x + y');
    });
  });

  describe('ImmediateWindow Component', () => {
    it('should display command history', () => {
      const history = [
        { command: '? x', result: '10' },
        { command: 'x = 20', result: 'undefined' },
        { command: '? x', result: '20' }
      ];
      
      render(<ImmediateWindow history={history} />);
      
      expect(screen.getByText('> ? x')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should execute commands', async () => {
      const onExecute = vi.fn().mockResolvedValue('42');
      render(<ImmediateWindow onExecute={onExecute} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '? 40 + 2');
      await user.keyboard('{Enter}');
      
      expect(onExecute).toHaveBeenCalledWith('? 40 + 2');
      
      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
      });
    });

    it('should support command history navigation', async () => {
      const history = [
        { command: 'command1', result: 'result1' },
        { command: 'command2', result: 'result2' }
      ];
      
      render(<ImmediateWindow history={history} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      // Navigate up
      await user.click(input);
      await user.keyboard('{ArrowUp}');
      expect(input.value).toBe('command2');
      
      await user.keyboard('{ArrowUp}');
      expect(input.value).toBe('command1');
      
      // Navigate down
      await user.keyboard('{ArrowDown}');
      expect(input.value).toBe('command2');
    });

    it('should support auto-completion', async () => {
      const suggestions = ['variable1', 'variable2', 'value'];
      render(<ImmediateWindow suggestions={suggestions} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'var');
      
      await waitFor(() => {
        expect(screen.getByText('variable1')).toBeInTheDocument();
        expect(screen.getByText('variable2')).toBeInTheDocument();
        expect(screen.queryByText('value')).not.toBeInTheDocument();
      });
    });

    it('should clear window', async () => {
      const history = [
        { command: 'command1', result: 'result1' }
      ];
      
      render(<ImmediateWindow history={history} />);
      
      expect(screen.getByText('command1')).toBeInTheDocument();
      
      const clearButton = screen.getByTestId('clear-immediate');
      await user.click(clearButton);
      
      expect(screen.queryByText('command1')).not.toBeInTheDocument();
    });

    it('should handle multiline input', async () => {
      const onExecute = vi.fn();
      render(<ImmediateWindow onExecute={onExecute} multiline={true} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'For i = 1 To 10{Shift>}{Enter}');
      await user.type(input, '  Debug.Print i{Shift>}{Enter}');
      await user.type(input, 'Next i{Enter}');
      
      expect(onExecute).toHaveBeenCalledWith(
        'For i = 1 To 10\n  Debug.Print i\nNext i'
      );
    });
  });

  describe('DebugToolbar Component', () => {
    it('should render all debug controls', () => {
      render(<DebugToolbar debugger={mockDebugger} />);
      
      expect(screen.getByTestId('debug-start')).toBeInTheDocument();
      expect(screen.getByTestId('debug-pause')).toBeInTheDocument();
      expect(screen.getByTestId('debug-stop')).toBeInTheDocument();
      expect(screen.getByTestId('debug-step-over')).toBeInTheDocument();
      expect(screen.getByTestId('debug-step-into')).toBeInTheDocument();
      expect(screen.getByTestId('debug-step-out')).toBeInTheDocument();
    });

    it('should handle debug actions', async () => {
      render(<DebugToolbar debugger={mockDebugger} />);
      
      await user.click(screen.getByTestId('debug-start'));
      expect(mockDebugger.continue).toHaveBeenCalled();
      
      await user.click(screen.getByTestId('debug-pause'));
      expect(mockDebugger.pause).toHaveBeenCalled();
      
      await user.click(screen.getByTestId('debug-step-over'));
      expect(mockDebugger.stepOver).toHaveBeenCalled();
    });

    it('should disable controls based on state', () => {
      mockDebugger.isRunning = false;
      const { rerender } = render(<DebugToolbar debugger={mockDebugger} />);
      
      expect(screen.getByTestId('debug-pause')).toBeDisabled();
      expect(screen.getByTestId('debug-stop')).toBeDisabled();
      
      mockDebugger.isRunning = true;
      mockDebugger.isPaused = true;
      rerender(<DebugToolbar debugger={mockDebugger} />);
      
      expect(screen.getByTestId('debug-step-over')).not.toBeDisabled();
      expect(screen.getByTestId('debug-continue')).not.toBeDisabled();
    });

    it('should show keyboard shortcuts in tooltips', async () => {
      render(<DebugToolbar debugger={mockDebugger} />);
      
      await user.hover(screen.getByTestId('debug-step-over'));
      
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Step Over (F10)');
      });
    });

    it('should handle keyboard shortcuts', () => {
      render(<DebugToolbar debugger={mockDebugger} />);
      
      fireEvent.keyDown(window, { key: 'F5' });
      expect(mockDebugger.continue).toHaveBeenCalled();
      
      fireEvent.keyDown(window, { key: 'F10' });
      expect(mockDebugger.stepOver).toHaveBeenCalled();
      
      fireEvent.keyDown(window, { key: 'F11' });
      expect(mockDebugger.stepInto).toHaveBeenCalled();
    });
  });

  describe('MemoryProfiler Component', () => {
    const mockMemoryData = {
      heap: {
        used: 50 * 1024 * 1024, // 50MB
        total: 100 * 1024 * 1024, // 100MB
        limit: 512 * 1024 * 1024 // 512MB
      },
      objects: [
        { type: 'String', count: 1000, size: 50000 },
        { type: 'Array', count: 500, size: 100000 },
        { type: 'Object', count: 200, size: 80000 }
      ],
      leaks: [
        { location: 'Module1.bas:42', size: 10000, description: 'Unreleased object' }
      ]
    };

    it('should display memory usage', () => {
      render(<MemoryProfiler data={mockMemoryData} />);
      
      expect(screen.getByText('50 MB')).toBeInTheDocument();
      expect(screen.getByText('100 MB')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument(); // Usage percentage
    });

    it('should show object allocation breakdown', () => {
      render(<MemoryProfiler data={mockMemoryData} />);
      
      expect(screen.getByText('String')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('48.8 KB')).toBeInTheDocument(); // Size
    });

    it('should detect memory leaks', () => {
      render(<MemoryProfiler data={mockMemoryData} />);
      
      expect(screen.getByText('Memory Leaks Detected')).toBeInTheDocument();
      expect(screen.getByText('Module1.bas:42')).toBeInTheDocument();
      expect(screen.getByText('Unreleased object')).toBeInTheDocument();
    });

    it('should take heap snapshots', async () => {
      const onSnapshot = vi.fn();
      render(<MemoryProfiler data={mockMemoryData} onSnapshot={onSnapshot} />);
      
      await user.click(screen.getByTestId('take-snapshot'));
      
      expect(onSnapshot).toHaveBeenCalled();
      expect(screen.getByText('Snapshot taken')).toBeInTheDocument();
    });

    it('should compare snapshots', async () => {
      const snapshots = [
        { id: '1', timestamp: Date.now() - 60000, heap: 40 * 1024 * 1024 },
        { id: '2', timestamp: Date.now(), heap: 50 * 1024 * 1024 }
      ];
      
      render(<MemoryProfiler data={mockMemoryData} snapshots={snapshots} />);
      
      await user.click(screen.getByTestId('compare-snapshots'));
      
      expect(screen.getByText('+10 MB')).toBeInTheDocument();
      expect(screen.getByText('Memory increased')).toBeInTheDocument();
    });

    it('should show garbage collection events', () => {
      const gcEvents = [
        { timestamp: Date.now() - 5000, duration: 15, freed: 5 * 1024 * 1024 },
        { timestamp: Date.now() - 10000, duration: 20, freed: 8 * 1024 * 1024 }
      ];
      
      render(<MemoryProfiler data={mockMemoryData} gcEvents={gcEvents} />);
      
      expect(screen.getByText('GC Events')).toBeInTheDocument();
      expect(screen.getByText('15ms')).toBeInTheDocument();
      expect(screen.getByText('5 MB freed')).toBeInTheDocument();
    });
  });

  describe('TimeTravelDebugger Component', () => {
    const mockHistory = [
      { id: '1', timestamp: 1000, state: { x: 10 }, action: 'SET_X' },
      { id: '2', timestamp: 2000, state: { x: 20 }, action: 'SET_X' },
      { id: '3', timestamp: 3000, state: { x: 30 }, action: 'SET_X' }
    ];

    it('should display execution history', () => {
      render(<TimeTravelDebugger history={mockHistory} currentIndex={2} />);
      
      expect(screen.getByText('SET_X')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    it('should navigate through history', async () => {
      const onNavigate = vi.fn();
      render(
        <TimeTravelDebugger
          history={mockHistory}
          currentIndex={2}
          onNavigate={onNavigate}
        />
      );
      
      await user.click(screen.getByTestId('time-travel-prev'));
      expect(onNavigate).toHaveBeenCalledWith(1);
      
      await user.click(screen.getByTestId('time-travel-next'));
      expect(onNavigate).toHaveBeenCalledWith(2);
    });

    it('should show state diff', () => {
      render(<TimeTravelDebugger history={mockHistory} currentIndex={1} />);
      
      const diff = screen.getByTestId('state-diff');
      expect(diff).toHaveTextContent('x: 10 → 20');
    });

    it('should support timeline scrubbing', async () => {
      const onNavigate = vi.fn();
      render(
        <TimeTravelDebugger
          history={mockHistory}
          currentIndex={0}
          onNavigate={onNavigate}
        />
      );
      
      const timeline = screen.getByTestId('timeline-slider');
      fireEvent.change(timeline, { target: { value: '2' } });
      
      expect(onNavigate).toHaveBeenCalledWith(2);
    });

    it('should filter history by action type', async () => {
      const extendedHistory = [
        ...mockHistory,
        { id: '4', timestamp: 4000, state: {}, action: 'LOAD_DATA' },
        { id: '5', timestamp: 5000, state: {}, action: 'SAVE_DATA' }
      ];
      
      render(<TimeTravelDebugger history={extendedHistory} currentIndex={0} />);
      
      const filter = screen.getByPlaceholderText('Filter actions...');
      await user.type(filter, 'SET');
      
      const visibleActions = screen.getAllByTestId(/history-item/);
      expect(visibleActions).toHaveLength(3); // Only SET_X actions
    });

    it('should export/import history', async () => {
      const onExport = vi.fn();
      const onImport = vi.fn();
      
      render(
        <TimeTravelDebugger
          history={mockHistory}
          currentIndex={0}
          onExport={onExport}
          onImport={onImport}
        />
      );
      
      await user.click(screen.getByTestId('export-history'));
      expect(onExport).toHaveBeenCalled();
      
      const importButton = screen.getByTestId('import-history');
      const file = new File(['{}'], 'history.json');
      
      const input = within(importButton).getByTestId('file-input');
      await user.upload(input, file);
      
      expect(onImport).toHaveBeenCalled();
    });
  });

  describe('VisualDebugger Component', () => {
    const mockVisualizationData = {
      controls: [
        { id: 'btn1', type: 'Button', x: 10, y: 10, width: 100, height: 30 },
        { id: 'txt1', type: 'TextBox', x: 10, y: 50, width: 200, height: 25 }
      ],
      events: [
        { control: 'btn1', event: 'Click', timestamp: Date.now() }
      ],
      dataFlow: [
        { from: 'txt1', to: 'variable_x', value: 'test' }
      ]
    };

    it('should visualize control layout', () => {
      render(<VisualDebugger data={mockVisualizationData} />);
      
      const btn = screen.getByTestId('visual-btn1');
      const txt = screen.getByTestId('visual-txt1');
      
      expect(btn).toHaveStyle({ left: '10px', top: '10px' });
      expect(txt).toHaveStyle({ left: '10px', top: '50px' });
    });

    it('should highlight active controls', () => {
      render(
        <VisualDebugger
          data={mockVisualizationData}
          activeControl="btn1"
        />
      );
      
      const btn = screen.getByTestId('visual-btn1');
      expect(btn).toHaveClass('active');
    });

    it('should show event flow', () => {
      render(<VisualDebugger data={mockVisualizationData} showEvents={true} />);
      
      expect(screen.getByText('Click')).toBeInTheDocument();
      
      const eventMarker = screen.getByTestId('event-marker-btn1');
      expect(eventMarker).toHaveClass('pulse-animation');
    });

    it('should visualize data flow', () => {
      render(<VisualDebugger data={mockVisualizationData} showDataFlow={true} />);
      
      const arrow = screen.getByTestId('dataflow-txt1-variable_x');
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveTextContent('test');
    });

    it('should support zoom and pan', async () => {
      render(<VisualDebugger data={mockVisualizationData} />);
      
      const zoomIn = screen.getByTestId('zoom-in');
      const zoomOut = screen.getByTestId('zoom-out');
      const canvas = screen.getByTestId('visual-canvas');
      
      await user.click(zoomIn);
      expect(canvas).toHaveStyle({ transform: 'scale(1.2)' });
      
      await user.click(zoomOut);
      expect(canvas).toHaveStyle({ transform: 'scale(1)' });
      
      // Pan
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      expect(canvas).toHaveStyle({ transform: expect.stringContaining('translate') });
    });

    it('should export visualization as image', async () => {
      const onExport = vi.fn();
      render(
        <VisualDebugger
          data={mockVisualizationData}
          onExport={onExport}
        />
      );
      
      await user.click(screen.getByTestId('export-visualization'));
      
      expect(onExport).toHaveBeenCalledWith(expect.objectContaining({
        format: 'png',
        data: expect.any(String)
      }));
    });
  });
});