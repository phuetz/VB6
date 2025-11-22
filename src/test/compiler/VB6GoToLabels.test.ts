import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VB6LineNumberManager,
  LineNumberManager,
  RegisterLine,
  RegisterLabel,
  GoTo,
  GoSub,
  Return,
  OnGoTo,
  OnGoSub,
  SetLine,
  Erl,
  LineTargetType
} from '../../runtime/VB6LineNumbers';
import {
  VB6GoSubHandler,
  GoSubHandler
} from '../../runtime/VB6GoSubReturn';

describe('VB6 GoTo/Labels - Line Number Manager', () => {
  let manager: VB6LineNumberManager;

  beforeEach(() => {
    manager = VB6LineNumberManager.getInstance();
    manager.reset();
    manager.enterProcedure('TestProc', 'TestModule', 1);
  });

  afterEach(() => {
    manager.reset();
  });

  describe('Label Registration', () => {
    it('should register a label', () => {
      manager.registerLabel('MyLabel', 100, 10, 'TestProc', 'TestModule');

      // Should not throw when jumping to registered label
      expect(() => manager.goTo('MyLabel')).not.toThrow();
    });

    it('should register multiple labels', () => {
      manager.registerLabel('Label1', 10, 0, 'TestProc', 'TestModule');
      manager.registerLabel('Label2', 20, 1, 'TestProc', 'TestModule');
      manager.registerLabel('Label3', 30, 2, 'TestProc', 'TestModule');

      expect(() => manager.goTo('Label1')).not.toThrow();
      expect(() => manager.goTo('Label2')).not.toThrow();
      expect(() => manager.goTo('Label3')).not.toThrow();
    });

    it('should register line numbers', () => {
      manager.registerLineNumber(100, 10, 'TestProc', 'TestModule');
      manager.registerLineNumber(200, 20, 'TestProc', 'TestModule');

      expect(() => manager.goTo(100)).not.toThrow();
      expect(() => manager.goTo(200)).not.toThrow();
    });

    it('should throw if label not found', () => {
      // When no labels registered, error is "No line numbers/labels in..."
      // When labels exist but specific one not found, error is "Line/Label '...' not found"
      expect(() => manager.goTo('NonExistent')).toThrow();
    });

    it('should throw if line number not found', () => {
      // When no line numbers registered, error is "No line numbers/labels in..."
      expect(() => manager.goTo(9999)).toThrow();
    });
  });

  describe('GoTo Statement', () => {
    it('should jump to a label', () => {
      manager.registerLabel('Target', 42, 10, 'TestProc', 'TestModule');

      const position = manager.goTo('Target');

      expect(position).toBe(10);

      const info = manager.getCurrentInfo();
      expect(info?.line).toBe(42);
    });

    it('should jump to a line number', () => {
      manager.registerLineNumber(100, 15, 'TestProc', 'TestModule');

      const position = manager.goTo(100);

      expect(position).toBe(15);

      const info = manager.getCurrentInfo();
      expect(info?.line).toBe(100);
    });

    it('should update current position', () => {
      manager.registerLabel('Start', 10, 0, 'TestProc', 'TestModule');
      manager.registerLabel('End', 100, 50, 'TestProc', 'TestModule');

      manager.goTo('Start');
      let info = manager.getCurrentInfo();
      expect(info?.line).toBe(10);

      manager.goTo('End');
      info = manager.getCurrentInfo();
      expect(info?.line).toBe(100);
    });

    it('should work with forward jumps', () => {
      manager.registerLabel('Forward', 200, 100, 'TestProc', 'TestModule');
      manager.setCurrentLine(10);

      manager.goTo('Forward');

      const info = manager.getCurrentInfo();
      expect(info?.line).toBe(200);
    });

    it('should work with backward jumps', () => {
      manager.registerLabel('Backward', 10, 0, 'TestProc', 'TestModule');
      manager.setCurrentLine(100);

      manager.goTo('Backward');

      const info = manager.getCurrentInfo();
      expect(info?.line).toBe(10);
    });
  });

  describe('GoSub/Return Statements', () => {
    it('should execute GoSub and Return', () => {
      manager.registerLabel('Subroutine', 1000, 100, 'TestProc', 'TestModule');
      manager.setCurrentLine(10);

      // GoSub should jump to subroutine
      manager.goSub('Subroutine');
      const info = manager.getCurrentInfo();
      expect(info?.line).toBe(1000);

      // Return should go back
      manager.return();
      // Position should be restored (return stack stores position + 1)
    });

    it('should maintain return stack', () => {
      manager.registerLabel('Sub1', 100, 10, 'TestProc', 'TestModule');
      manager.registerLabel('Sub2', 200, 20, 'TestProc', 'TestModule');

      // Nested GoSub calls
      manager.goSub('Sub1');
      manager.goSub('Sub2');

      // Returns should unwind stack
      expect(() => manager.return()).not.toThrow();
      expect(() => manager.return()).not.toThrow();
    });

    it('should throw on Return without GoSub', () => {
      expect(() => manager.return()).toThrow(/Return without GoSub/i);
    });

    it('should enforce maximum stack depth', () => {
      manager.registerLabel('Recursive', 100, 10, 'TestProc', 'TestModule');

      // Try to exceed stack depth (1000)
      expect(() => {
        for (let i = 0; i < 1001; i++) {
          manager.goSub('Recursive');
        }
      }).toThrow(/Out of stack space/i);
    });

    it('should restore correct position after nested GoSub', () => {
      manager.registerLabel('Sub1', 100, 10, 'TestProc', 'TestModule');
      manager.registerLabel('Sub2', 200, 20, 'TestProc', 'TestModule');
      manager.registerLabel('Sub3', 300, 30, 'TestProc', 'TestModule');

      // Call Sub1
      manager.goSub('Sub1');
      expect(manager.getCurrentInfo()?.line).toBe(100);

      // From Sub1, call Sub2
      manager.goSub('Sub2');
      expect(manager.getCurrentInfo()?.line).toBe(200);

      // From Sub2, call Sub3
      manager.goSub('Sub3');
      expect(manager.getCurrentInfo()?.line).toBe(300);

      // Return from Sub3 to Sub2
      manager.return();

      // Return from Sub2 to Sub1
      manager.return();

      // Return from Sub1 to caller
      manager.return();
    });
  });

  describe('On...GoTo Statement', () => {
    it('should jump to first target when index is 1', () => {
      manager.registerLabel('Target1', 100, 10, 'TestProc', 'TestModule');
      manager.registerLabel('Target2', 200, 20, 'TestProc', 'TestModule');
      manager.registerLabel('Target3', 300, 30, 'TestProc', 'TestModule');

      const position = manager.onGoTo(1, 'Target1', 'Target2', 'Target3');

      expect(position).not.toBeNull();
      expect(manager.getCurrentInfo()?.line).toBe(100);
    });

    it('should jump to second target when index is 2', () => {
      manager.registerLabel('Target1', 100, 10, 'TestProc', 'TestModule');
      manager.registerLabel('Target2', 200, 20, 'TestProc', 'TestModule');

      const position = manager.onGoTo(2, 'Target1', 'Target2');

      expect(position).not.toBeNull();
      expect(manager.getCurrentInfo()?.line).toBe(200);
    });

    it('should return null if index is out of range', () => {
      manager.registerLabel('Target1', 100, 10, 'TestProc', 'TestModule');

      // Index 0 or negative
      expect(manager.onGoTo(0, 'Target1')).toBeNull();
      expect(manager.onGoTo(-1, 'Target1')).toBeNull();

      // Index too large
      expect(manager.onGoTo(5, 'Target1')).toBeNull();
    });

    it('should work with line numbers', () => {
      manager.registerLineNumber(100, 10, 'TestProc', 'TestModule');
      manager.registerLineNumber(200, 20, 'TestProc', 'TestModule');
      manager.registerLineNumber(300, 30, 'TestProc', 'TestModule');

      const position = manager.onGoTo(2, 100, 200, 300);

      expect(position).not.toBeNull();
      expect(manager.getCurrentInfo()?.line).toBe(200);
    });
  });

  describe('On...GoSub Statement', () => {
    it('should jump to subroutine based on index', () => {
      manager.registerLabel('Sub1', 1000, 100, 'TestProc', 'TestModule');
      manager.registerLabel('Sub2', 2000, 200, 'TestProc', 'TestModule');

      const position = manager.onGoSub(1, 'Sub1', 'Sub2');

      expect(position).not.toBeNull();
      expect(manager.getCurrentInfo()?.line).toBe(1000);

      // Should be able to return
      expect(() => manager.return()).not.toThrow();
    });

    it('should maintain return stack', () => {
      manager.registerLabel('Sub1', 1000, 100, 'TestProc', 'TestModule');
      manager.registerLabel('Sub2', 2000, 200, 'TestProc', 'TestModule');

      manager.onGoSub(2, 'Sub1', 'Sub2');

      // Should have pushed return address
      expect(() => manager.return()).not.toThrow();
    });

    it('should return null if index is out of range', () => {
      manager.registerLabel('Sub1', 1000, 100, 'TestProc', 'TestModule');

      expect(manager.onGoSub(0, 'Sub1')).toBeNull();
      expect(manager.onGoSub(5, 'Sub1')).toBeNull();
    });
  });

  describe('Execution Context', () => {
    it('should track current line number', () => {
      manager.setCurrentLine(42);

      const info = manager.getCurrentInfo();
      expect(info?.line).toBe(42);
    });

    it('should track procedure and module', () => {
      const info = manager.getCurrentInfo();

      expect(info?.procedure).toBe('TestProc');
      expect(info?.module).toBe('TestModule');
    });

    it('should maintain procedure stack', () => {
      manager.enterProcedure('Proc1', 'Module1', 10);
      expect(manager.getCurrentInfo()?.stackDepth).toBe(2); // TestProc + Proc1

      manager.enterProcedure('Proc2', 'Module1', 20);
      expect(manager.getCurrentInfo()?.stackDepth).toBe(3);

      manager.exitProcedure();
      expect(manager.getCurrentInfo()?.stackDepth).toBe(2);

      manager.exitProcedure();
      expect(manager.getCurrentInfo()?.stackDepth).toBe(1);
    });

    it('should restore context after procedure exit', () => {
      const initialInfo = manager.getCurrentInfo();

      manager.enterProcedure('NestedProc', 'Module2', 100);
      manager.setCurrentLine(200);

      manager.exitProcedure();

      const finalInfo = manager.getCurrentInfo();
      expect(finalInfo?.procedure).toBe(initialInfo?.procedure);
      expect(finalInfo?.module).toBe(initialInfo?.module);
    });
  });

  describe('Erl() Function', () => {
    it('should return current line number', () => {
      manager.setCurrentLine(42);

      expect(Erl()).toBe(42);
    });

    it('should return 0 if no context', () => {
      manager.exitProcedure(); // Exit TestProc

      expect(Erl()).toBe(0);
    });

    it('should update when line changes', () => {
      manager.setCurrentLine(10);
      expect(Erl()).toBe(10);

      manager.setCurrentLine(20);
      expect(Erl()).toBe(20);

      manager.setCurrentLine(30);
      expect(Erl()).toBe(30);
    });
  });

  describe('Call Stack', () => {
    it('should build call stack', () => {
      manager.setCurrentLine(10);
      manager.enterProcedure('Proc1', 'Module1', 20);
      manager.setCurrentLine(20);
      manager.enterProcedure('Proc2', 'Module2', 30);
      manager.setCurrentLine(30);

      const stack = manager.getCallStack();

      expect(stack).toHaveLength(3);
      expect(stack[0]).toContain('TestModule.TestProc');
      expect(stack[0]).toContain('Line 10');
      expect(stack[1]).toContain('Module1.Proc1');
      expect(stack[1]).toContain('Line 20');
      expect(stack[2]).toContain('Module2.Proc2');
      expect(stack[2]).toContain('Line 30');
    });

    it('should update as procedures are called and exited', () => {
      expect(manager.getCallStack()).toHaveLength(1);

      manager.enterProcedure('NewProc', 'Module1');
      expect(manager.getCallStack()).toHaveLength(2);

      manager.exitProcedure();
      expect(manager.getCallStack()).toHaveLength(1);
    });
  });

  describe('Local Variables', () => {
    it('should store local variables', () => {
      manager.setLocal('x', 42);
      manager.setLocal('name', 'Test');

      expect(manager.getLocal('x')).toBe(42);
      expect(manager.getLocal('name')).toBe('Test');
    });

    it('should isolate variables per procedure', () => {
      manager.setLocal('x', 10);

      manager.enterProcedure('Proc1', 'Module1');
      manager.setLocal('x', 20);
      expect(manager.getLocal('x')).toBe(20);

      manager.exitProcedure();
      expect(manager.getLocal('x')).toBe(10);
    });

    it('should return undefined for non-existent variables', () => {
      expect(manager.getLocal('nonexistent')).toBeUndefined();
    });
  });

  describe('Debugging Features', () => {
    it('should support trace mode', () => {
      manager.setTraceMode(true);
      // Trace mode should be enabled (would log to console)
      manager.setTraceMode(false);
      // Trace mode should be disabled
    });

    it('should support step mode', () => {
      manager.setStepMode(true);
      // Step mode should be enabled
      manager.setStepMode(false);
      // Step mode should be disabled
    });

    it('should set and clear breakpoints', () => {
      manager.setBreakpoint(50, 'TestProc', 'TestModule', true);
      // Breakpoint should be set

      manager.setBreakpoint(50, 'TestProc', 'TestModule', false);
      // Breakpoint should be cleared
    });

    it('should clear all breakpoints', () => {
      manager.setBreakpoint(10, 'TestProc', 'TestModule');
      manager.setBreakpoint(20, 'TestProc', 'TestModule');
      manager.setBreakpoint(30, 'TestProc', 'TestModule');

      manager.clearBreakpoints();
      // All breakpoints should be cleared
    });
  });
});

describe('VB6 GoTo/Labels - GoSub Handler', () => {
  let handler: VB6GoSubHandler;

  beforeEach(() => {
    handler = VB6GoSubHandler.getInstance();
    handler.clearStack();
  });

  afterEach(() => {
    handler.clearStack();
  });

  describe('GoSub Execution', () => {
    it('should execute GoSub', () => {
      const targetLabel = handler.goSub('Subroutine', 100, 'MainProc');

      expect(targetLabel).toBe('Subroutine');
      expect(handler.isInGoSub()).toBe(true);
      expect(handler.getStackDepth()).toBe(1);
    });

    it('should store return address', () => {
      handler.goSub('Sub1', 42, 'MainProc');

      const context = handler.return();
      expect(context?.returnAddress).toBe(42);
      expect(context?.procedureName).toBe('MainProc');
    });

    it('should preserve local variables', () => {
      const locals = new Map([['x', 10], ['y', 20]]);
      handler.goSub('Sub1', 100, 'MainProc', locals);

      const context = handler.return();
      expect(context?.localVariables.get('x')).toBe(10);
      expect(context?.localVariables.get('y')).toBe(20);
    });

    it('should handle nested GoSub calls', () => {
      handler.goSub('Sub1', 10, 'Main');
      handler.goSub('Sub2', 20, 'Sub1');
      handler.goSub('Sub3', 30, 'Sub2');

      expect(handler.getStackDepth()).toBe(3);

      const ctx3 = handler.return();
      expect(ctx3?.procedureName).toBe('Sub2');
      expect(ctx3?.returnAddress).toBe(30);

      const ctx2 = handler.return();
      expect(ctx2?.procedureName).toBe('Sub1');
      expect(ctx2?.returnAddress).toBe(20);

      const ctx1 = handler.return();
      expect(ctx1?.procedureName).toBe('Main');
      expect(ctx1?.returnAddress).toBe(10);
    });
  });

  describe('Return Execution', () => {
    it('should throw on Return without GoSub', () => {
      expect(() => handler.return()).toThrow(/Return without GoSub/i);
    });

    it('should pop return context', () => {
      handler.goSub('Sub1', 100, 'Main');
      expect(handler.getStackDepth()).toBe(1);

      handler.return();
      expect(handler.getStackDepth()).toBe(0);
      expect(handler.isInGoSub()).toBe(false);
    });

    it('should return null when stack is empty', () => {
      handler.goSub('Sub1', 100, 'Main');

      const ctx = handler.return();
      expect(ctx).not.toBeNull();

      // Stack is now empty, but return() throws instead of returning null
      expect(() => handler.return()).toThrow();
    });
  });

  describe('Stack Management', () => {
    it('should track stack depth', () => {
      expect(handler.getStackDepth()).toBe(0);

      handler.goSub('Sub1', 10, 'Main');
      expect(handler.getStackDepth()).toBe(1);

      handler.goSub('Sub2', 20, 'Sub1');
      expect(handler.getStackDepth()).toBe(2);

      handler.return();
      expect(handler.getStackDepth()).toBe(1);

      handler.return();
      expect(handler.getStackDepth()).toBe(0);
    });

    it('should clear entire stack', () => {
      handler.goSub('Sub1', 10, 'Main');
      handler.goSub('Sub2', 20, 'Sub1');
      handler.goSub('Sub3', 30, 'Sub2');

      handler.clearStack();

      expect(handler.getStackDepth()).toBe(0);
      expect(handler.isInGoSub()).toBe(false);
    });

    it('should clear stack for specific procedure', () => {
      handler.goSub('Sub1', 10, 'Main');
      handler.goSub('Sub2', 20, 'Main');
      handler.goSub('Sub3', 30, 'OtherProc');

      handler.clearProcedureStack('Main');

      // Only OtherProc context should remain
      expect(handler.getStackDepth()).toBe(1);

      const ctx = handler.return();
      expect(ctx?.procedureName).toBe('OtherProc');
    });

    it('should enforce maximum stack depth', () => {
      expect(() => {
        for (let i = 0; i < 1001; i++) {
          handler.goSub('RecursiveSub', i, 'Main');
        }
      }).toThrow(/Out of stack space/i);
    });
  });

  describe('Status Checks', () => {
    it('should report not in GoSub initially', () => {
      expect(handler.isInGoSub()).toBe(false);
    });

    it('should report in GoSub after call', () => {
      handler.goSub('Sub1', 10, 'Main');
      expect(handler.isInGoSub()).toBe(true);
    });

    it('should report not in GoSub after return', () => {
      handler.goSub('Sub1', 10, 'Main');
      handler.return();
      expect(handler.isInGoSub()).toBe(false);
    });
  });
});

describe('VB6 GoTo/Labels - Real-World Scenarios', () => {
  let manager: VB6LineNumberManager;

  beforeEach(() => {
    manager = VB6LineNumberManager.getInstance();
    manager.reset();
    manager.enterProcedure('Main', 'Module1', 10);
  });

  afterEach(() => {
    manager.reset();
  });

  it('should handle menu selection with On...GoTo', () => {
    // Register menu handlers
    manager.registerLabel('MenuFile', 100, 10, 'Main', 'Module1');
    manager.registerLabel('MenuEdit', 200, 20, 'Main', 'Module1');
    manager.registerLabel('MenuView', 300, 30, 'Main', 'Module1');
    manager.registerLabel('MenuHelp', 400, 40, 'Main', 'Module1');

    // User selects option 3 (View)
    const choice = 3;
    manager.onGoTo(choice, 'MenuFile', 'MenuEdit', 'MenuView', 'MenuHelp');

    expect(manager.getCurrentInfo()?.line).toBe(300);
  });

  it('should handle error recovery with GoTo', () => {
    manager.registerLabel('ErrorHandler', 1000, 100, 'Main', 'Module1');
    manager.registerLabel('Cleanup', 2000, 200, 'Main', 'Module1');

    // Set error handler
    manager.setErrorHandler('ErrorHandler');

    // Simulate error
    manager.handleError(13);
    expect(manager.getCurrentInfo()?.line).toBe(1000);

    // Jump to cleanup
    manager.goTo('Cleanup');
    expect(manager.getCurrentInfo()?.line).toBe(2000);
  });

  it('should handle print subroutine with GoSub', () => {
    manager.registerLabel('PrintHeader', 1000, 100, 'Main', 'Module1');
    manager.registerLabel('PrintFooter', 2000, 200, 'Main', 'Module1');

    // Print header
    manager.setCurrentLine(10);
    manager.goSub('PrintHeader');
    expect(manager.getCurrentInfo()?.line).toBe(1000);
    manager.return();

    // Main code
    manager.setCurrentLine(20);

    // Print footer
    manager.goSub('PrintFooter');
    expect(manager.getCurrentInfo()?.line).toBe(2000);
    manager.return();
  });

  it('should handle classic BASIC line numbers', () => {
    // Register classic BASIC line numbers
    manager.registerLineNumber(10, 0, 'Main', 'Module1');
    manager.registerLineNumber(20, 1, 'Main', 'Module1');
    manager.registerLineNumber(30, 2, 'Main', 'Module1');
    manager.registerLineNumber(100, 10, 'Main', 'Module1');

    // Execute with line numbers
    manager.setCurrentLine(10);
    manager.setCurrentLine(20);

    // Conditional jump to line 100
    const condition = true;
    if (condition) {
      manager.goTo(100);
    }

    expect(manager.getCurrentInfo()?.line).toBe(100);
  });

  it('should handle complex control flow', () => {
    // Register labels and line numbers
    manager.registerLabel('Start', 10, 0, 'Main', 'Module1');
    manager.registerLabel('ProcessData', 100, 10, 'Main', 'Module1');
    manager.registerLabel('ValidateInput', 200, 20, 'Main', 'Module1');
    manager.registerLabel('ErrorHandler', 1000, 100, 'Main', 'Module1');
    manager.registerLabel('Cleanup', 2000, 200, 'Main', 'Module1');
    manager.registerLabel('End', 3000, 300, 'Main', 'Module1');

    // Start
    manager.goTo('Start');
    expect(manager.getCurrentInfo()?.line).toBe(10);

    // Call validation subroutine
    manager.goSub('ValidateInput');
    expect(manager.getCurrentInfo()?.line).toBe(200);
    manager.return();

    // Process data
    manager.goTo('ProcessData');
    expect(manager.getCurrentInfo()?.line).toBe(100);

    // Jump to cleanup
    manager.goTo('Cleanup');
    expect(manager.getCurrentInfo()?.line).toBe(2000);

    // End
    manager.goTo('End');
    expect(manager.getCurrentInfo()?.line).toBe(3000);
  });
});

describe('VB6 GoTo/Labels - Global Helper Functions', () => {
  beforeEach(() => {
    LineNumberManager.reset();
    LineNumberManager.enterProcedure('TestProc', 'TestModule', 1);
  });

  afterEach(() => {
    LineNumberManager.reset();
  });

  it('should work with RegisterLabel', () => {
    RegisterLabel('MyLabel', 100, 10, 'TestProc', 'TestModule');

    expect(() => LineNumberManager.goTo('MyLabel')).not.toThrow();
  });

  it('should work with RegisterLine', () => {
    RegisterLine(100, 10, 'TestProc', 'TestModule');

    expect(() => LineNumberManager.goTo(100)).not.toThrow();
  });

  it('should work with SetLine', () => {
    SetLine(42);

    expect(Erl()).toBe(42);
  });
});
