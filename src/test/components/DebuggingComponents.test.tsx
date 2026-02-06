import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

// Import debugging components
import DebugPanel from '../../components/Debug/DebugPanel';
import BreakpointGutter from '../../components/Debug/BreakpointGutter';
import DebugToolbar from '../../components/Debug/DebugToolbar';
import MemoryProfiler from '../../components/Debug/MemoryProfiler';
import TimeTravelDebugger from '../../components/Debug/TimeTravelDebugger';

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
      evaluate: vi.fn(),
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
      onToggleBreakpoint: vi.fn(),
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
        { line: 10, condition: 'name === "test"' },
      ];

      render(
        <BreakpointGutter {...defaultProps} conditionalBreakpoints={conditionalBreakpoints} />
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
        { line: 10, hits: 0 },
      ];

      render(<BreakpointGutter {...defaultProps} breakpointHits={breakpointsWithHits} />);

      const bp5 = screen.getByTestId('breakpoint-5');
      expect(within(bp5).getByText('3')).toBeInTheDocument();
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
        limit: 512 * 1024 * 1024, // 512MB
      },
      objects: [
        { type: 'String', count: 1000, size: 50000 },
        { type: 'Array', count: 500, size: 100000 },
        { type: 'Object', count: 200, size: 80000 },
      ],
      leaks: [{ location: 'Module1.bas:42', size: 10000, description: 'Unreleased object' }],
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
        { id: '2', timestamp: Date.now(), heap: 50 * 1024 * 1024 },
      ];

      render(<MemoryProfiler data={mockMemoryData} snapshots={snapshots} />);

      await user.click(screen.getByTestId('compare-snapshots'));

      expect(screen.getByText('+10 MB')).toBeInTheDocument();
      expect(screen.getByText('Memory increased')).toBeInTheDocument();
    });

    it('should show garbage collection events', () => {
      const gcEvents = [
        { timestamp: Date.now() - 5000, duration: 15, freed: 5 * 1024 * 1024 },
        { timestamp: Date.now() - 10000, duration: 20, freed: 8 * 1024 * 1024 },
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
      { id: '3', timestamp: 3000, state: { x: 30 }, action: 'SET_X' },
    ];

    it('should display execution history', () => {
      render(<TimeTravelDebugger history={mockHistory} currentIndex={2} />);

      expect(screen.getByText('SET_X')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    it('should navigate through history', async () => {
      const onNavigate = vi.fn();
      render(<TimeTravelDebugger history={mockHistory} currentIndex={2} onNavigate={onNavigate} />);

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
      render(<TimeTravelDebugger history={mockHistory} currentIndex={0} onNavigate={onNavigate} />);

      const timeline = screen.getByTestId('timeline-slider');
      fireEvent.change(timeline, { target: { value: '2' } });

      expect(onNavigate).toHaveBeenCalledWith(2);
    });

    it('should filter history by action type', async () => {
      const extendedHistory = [
        ...mockHistory,
        { id: '4', timestamp: 4000, state: {}, action: 'LOAD_DATA' },
        { id: '5', timestamp: 5000, state: {}, action: 'SAVE_DATA' },
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
});
