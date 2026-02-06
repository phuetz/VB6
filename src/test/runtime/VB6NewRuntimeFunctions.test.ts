/**
 * VB6 New Runtime Functions - Comprehensive Test Suite
 * Tests for the enhanced runtime functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import modules to test
import {
  VB6Collection,
  VB6Dictionary,
  VB6Stack,
  VB6Queue,
  VB6ArrayList,
  VB6SortedList,
  CreateCollection,
  CreateDictionary,
} from '../../runtime/VB6EnhancedCollections';

import { VB6CallStackManager, globalCallStack } from '../../runtime/VB6CallStackManager';

import {
  Abs,
  Sgn,
  Int,
  Fix,
  Round,
  Sqr,
  Exp,
  Log,
  Sin,
  Cos,
  Tan,
  Atn,
  Pmt,
  PV,
  FV,
  NPer,
  SLN,
  SYD,
  Min,
  Max,
  Mod,
  Power,
} from '../../runtime/VB6ComprehensiveMathFunctions';

import {
  Asc,
  Chr,
  LCase,
  UCase,
  Left,
  Right,
  Mid,
  Len,
  LTrim,
  RTrim,
  Trim,
  Space,
  InStr,
  InStrRev,
  StrComp,
  StrReverse,
  Replace,
  Split,
  Join,
} from '../../runtime/VB6ComprehensiveStringFunctions';

// ============================================================================
// VB6 Collection Tests
// ============================================================================

describe('VB6 Collection', () => {
  let collection: VB6Collection<string>;

  beforeEach(() => {
    collection = new VB6Collection<string>();
  });

  it('should create empty collection', () => {
    expect(collection.Count).toBe(0);
  });

  it('should add items', () => {
    collection.Add('item1', 'key1');
    collection.Add('item2', 'key2');
    expect(collection.Count).toBe(2);
  });

  it('should get items by key', () => {
    collection.Add('value1', 'key1');
    expect(collection.Item('key1')).toBe('value1');
  });

  it('should get items by 1-based index', () => {
    collection.Add('first');
    collection.Add('second');
    expect(collection.Item(1)).toBe('first');
    expect(collection.Item(2)).toBe('second');
  });

  it('should remove items by key', () => {
    collection.Add('value', 'key');
    collection.Remove('key');
    expect(collection.Count).toBe(0);
  });

  it('should throw on duplicate key', () => {
    collection.Add('value1', 'key');
    expect(() => collection.Add('value2', 'key')).toThrow();
  });

  it('should check if key exists', () => {
    collection.Add('value', 'key');
    expect(collection.Exists('key')).toBe(true);
    expect(collection.Exists('nonexistent')).toBe(false);
  });

  it('should iterate with for...of', () => {
    collection.Add('a', 'k1');
    collection.Add('b', 'k2');
    const items: string[] = [];
    for (const item of collection) {
      items.push(item);
    }
    expect(items).toEqual(['a', 'b']);
  });

  it('should add item before another', () => {
    collection.Add('first', 'k1');
    collection.Add('third', 'k3');
    collection.Add('second', 'k2', 'k3'); // before k3
    expect(collection.Item(2)).toBe('second');
  });

  it('should add item after another', () => {
    collection.Add('first', 'k1');
    collection.Add('third', 'k3');
    collection.Add('second', 'k2', undefined, 'k1'); // after k1
    expect(collection.Item(2)).toBe('second');
  });
});

// ============================================================================
// VB6 Dictionary Tests
// ============================================================================

describe('VB6 Dictionary', () => {
  let dict: VB6Dictionary<string, number>;

  beforeEach(() => {
    dict = new VB6Dictionary<string, number>();
  });

  it('should create empty dictionary', () => {
    expect(dict.Count).toBe(0);
  });

  it('should add key/value pairs', () => {
    dict.Add('one', 1);
    dict.Add('two', 2);
    expect(dict.Count).toBe(2);
  });

  it('should get items', () => {
    dict.Add('key', 42);
    expect(dict.Item('key')).toBe(42);
  });

  it('should check if key exists', () => {
    dict.Add('key', 1);
    expect(dict.Exists('key')).toBe(true);
    expect(dict.Exists('other')).toBe(false);
  });

  it('should remove items', () => {
    dict.Add('key', 1);
    dict.Remove('key');
    expect(dict.Count).toBe(0);
  });

  it('should get all keys', () => {
    dict.Add('a', 1);
    dict.Add('b', 2);
    expect(dict.Keys()).toEqual(['a', 'b']);
  });

  it('should get all items', () => {
    dict.Add('a', 1);
    dict.Add('b', 2);
    expect(dict.Items()).toEqual([1, 2]);
  });

  it('should change key', () => {
    dict.Add('old', 42);
    dict.Key('old', 'new');
    expect(dict.Exists('old')).toBe(false);
    expect(dict.Item('new')).toBe(42);
  });

  it('should support text compare mode', () => {
    const textDict = new VB6Dictionary<string, number>('TextCompare');
    textDict.Add('Key', 1);
    expect(textDict.Exists('KEY')).toBe(true);
    expect(textDict.Exists('key')).toBe(true);
  });
});

// ============================================================================
// VB6 Stack Tests
// ============================================================================

describe('VB6 Stack', () => {
  it('should push and pop items', () => {
    const stack = new VB6Stack<number>();
    stack.Push(1);
    stack.Push(2);
    stack.Push(3);
    expect(stack.Pop()).toBe(3);
    expect(stack.Pop()).toBe(2);
    expect(stack.Pop()).toBe(1);
  });

  it('should peek at top item', () => {
    const stack = new VB6Stack<string>();
    stack.Push('bottom');
    stack.Push('top');
    expect(stack.Peek()).toBe('top');
    expect(stack.Count).toBe(2);
  });

  it('should report empty status', () => {
    const stack = new VB6Stack();
    expect(stack.IsEmpty).toBe(true);
    stack.Push(1);
    expect(stack.IsEmpty).toBe(false);
  });
});

// ============================================================================
// VB6 Queue Tests
// ============================================================================

describe('VB6 Queue', () => {
  it('should enqueue and dequeue items', () => {
    const queue = new VB6Queue<number>();
    queue.Enqueue(1);
    queue.Enqueue(2);
    queue.Enqueue(3);
    expect(queue.Dequeue()).toBe(1);
    expect(queue.Dequeue()).toBe(2);
    expect(queue.Dequeue()).toBe(3);
  });

  it('should peek at first item', () => {
    const queue = new VB6Queue<string>();
    queue.Enqueue('first');
    queue.Enqueue('second');
    expect(queue.Peek()).toBe('first');
    expect(queue.Count).toBe(2);
  });
});

// ============================================================================
// VB6 ArrayList Tests
// ============================================================================

describe('VB6 ArrayList', () => {
  it('should add and retrieve items', () => {
    const list = new VB6ArrayList<number>();
    list.Add(10);
    list.Add(20);
    list.Add(30);
    expect(list.Item(0)).toBe(10);
    expect(list.Item(1)).toBe(20);
    expect(list.Item(2)).toBe(30);
  });

  it('should insert at index', () => {
    const list = new VB6ArrayList<string>();
    list.Add('a');
    list.Add('c');
    list.Insert(1, 'b');
    expect(list.ToArray()).toEqual(['a', 'b', 'c']);
  });

  it('should remove items', () => {
    const list = new VB6ArrayList<number>();
    list.Add(1);
    list.Add(2);
    list.Add(3);
    list.Remove(2);
    expect(list.ToArray()).toEqual([1, 3]);
  });

  it('should sort items', () => {
    const list = new VB6ArrayList<number>();
    list.Add(3);
    list.Add(1);
    list.Add(2);
    list.Sort((a, b) => a - b);
    expect(list.ToArray()).toEqual([1, 2, 3]);
  });

  it('should check contains', () => {
    const list = new VB6ArrayList<string>();
    list.Add('apple');
    list.Add('banana');
    expect(list.Contains('apple')).toBe(true);
    expect(list.Contains('cherry')).toBe(false);
  });
});

// ============================================================================
// VB6 SortedList Tests
// ============================================================================

describe('VB6 SortedList', () => {
  it('should maintain sorted order', () => {
    const list = new VB6SortedList<string, number>();
    list.Add('c', 3);
    list.Add('a', 1);
    list.Add('b', 2);
    expect(list.Keys()).toEqual(['a', 'b', 'c']);
    expect(list.Values()).toEqual([1, 2, 3]);
  });

  it('should get by key', () => {
    const list = new VB6SortedList<number, string>();
    list.Add(1, 'one');
    list.Add(2, 'two');
    expect(list.Item(1)).toBe('one');
  });

  it('should get by index', () => {
    const list = new VB6SortedList<string, number>();
    list.Add('b', 2);
    list.Add('a', 1);
    expect(list.GetKey(0)).toBe('a');
    expect(list.GetByIndex(0)).toBe(1);
  });
});

// ============================================================================
// VB6 Call Stack Manager Tests
// ============================================================================

describe('VB6 Call Stack Manager', () => {
  let manager: VB6CallStackManager;

  beforeEach(() => {
    manager = new VB6CallStackManager({ maxDepth: 10 });
  });

  it('should track procedure calls', () => {
    manager.enter('Sub1', 'Module1', 10);
    expect(manager.getDepth()).toBe(1);
    expect(manager.getCurrentProcedure()).toBe('Sub1');
    expect(manager.getCurrentModule()).toBe('Module1');
  });

  it('should handle enter and exit', () => {
    manager.enter('Sub1', 'Module1');
    manager.enter('Sub2', 'Module1');
    expect(manager.getDepth()).toBe(2);
    manager.exit();
    expect(manager.getDepth()).toBe(1);
    expect(manager.getCurrentProcedure()).toBe('Sub1');
  });

  it('should detect recursion', () => {
    manager.enter('RecursiveSub', 'Module1');
    manager.enter('RecursiveSub', 'Module1');
    expect(manager.isRecursive('RecursiveSub')).toBe(true);
    expect(manager.getRecursionCount('RecursiveSub')).toBe(2);
  });

  it('should throw on stack overflow', () => {
    for (let i = 0; i < 10; i++) {
      manager.enter(`Sub${i}`, 'Module1');
    }
    expect(() => manager.enter('TooMany', 'Module1')).toThrow(/Stack overflow/);
  });

  it('should format stack trace', () => {
    manager.enter('Main', 'Module1', 10);
    manager.enter('Helper', 'Module1', 20);
    const trace = manager.getStackTrace();
    expect(trace).toContain('Module1.Main');
    expect(trace).toContain('Module1.Helper');
  });

  it('should get caller info', () => {
    manager.enter('Caller', 'Module1');
    manager.enter('Callee', 'Module1');
    const caller = manager.getCaller();
    expect(caller?.procedureName).toBe('Caller');
  });
});

// ============================================================================
// VB6 Math Functions Tests
// ============================================================================

describe('VB6 Math Functions', () => {
  describe('Basic Math', () => {
    it('Abs should return absolute value', () => {
      expect(Abs(-5)).toBe(5);
      expect(Abs(5)).toBe(5);
      expect(Abs(0)).toBe(0);
    });

    it('Sgn should return sign', () => {
      expect(Sgn(-10)).toBe(-1);
      expect(Sgn(0)).toBe(0);
      expect(Sgn(10)).toBe(1);
    });

    it('Int should floor toward negative infinity', () => {
      expect(Int(5.7)).toBe(5);
      expect(Int(-5.7)).toBe(-6);
    });

    it('Fix should truncate toward zero', () => {
      expect(Fix(5.7)).toBe(5);
      expect(Fix(-5.7)).toBe(-5);
    });

    it('Round should use bankers rounding', () => {
      expect(Round(2.5)).toBe(2); // Round to even
      expect(Round(3.5)).toBe(4); // Round to even
      expect(Round(2.6)).toBe(3);
      expect(Round(2.4)).toBe(2);
    });

    it('Sqr should return square root', () => {
      expect(Sqr(4)).toBe(2);
      expect(Sqr(9)).toBe(3);
      expect(() => Sqr(-1)).toThrow();
    });

    it('Log should return natural log', () => {
      expect(Log(Math.E)).toBeCloseTo(1);
      expect(() => Log(0)).toThrow();
      expect(() => Log(-1)).toThrow();
    });
  });

  describe('Trigonometry', () => {
    it('Sin, Cos, Tan should work correctly', () => {
      expect(Sin(0)).toBe(0);
      expect(Cos(0)).toBe(1);
      expect(Tan(0)).toBe(0);
      expect(Sin(Math.PI / 2)).toBeCloseTo(1);
    });

    it('Atn should return arctangent', () => {
      expect(Atn(0)).toBe(0);
      expect(Atn(1)).toBeCloseTo(Math.PI / 4);
    });
  });

  describe('Financial Functions', () => {
    it('Pmt should calculate loan payment', () => {
      // $10000 loan at 6% for 5 years
      const payment = Pmt(0.06 / 12, 60, 10000);
      expect(payment).toBeCloseTo(-193.33, 0);
    });

    it('PV should calculate present value', () => {
      const pv = PV(0.06 / 12, 60, -193.33);
      expect(pv).toBeCloseTo(10000, 0);
    });

    it('FV should calculate future value', () => {
      const fv = FV(0.05, 10, -100, -1000);
      expect(fv).toBeGreaterThan(2000);
    });

    it('SLN should calculate straight-line depreciation', () => {
      expect(SLN(10000, 1000, 5)).toBe(1800);
    });

    it('SYD should calculate sum-of-years depreciation', () => {
      const dep = SYD(10000, 1000, 5, 1);
      expect(dep).toBeCloseTo(3000, 0);
    });
  });

  describe('Utility Functions', () => {
    it('Min and Max should work', () => {
      expect(Min(1, 2, 3)).toBe(1);
      expect(Max(1, 2, 3)).toBe(3);
    });

    it('Mod should return remainder', () => {
      expect(Mod(10, 3)).toBe(1);
      expect(Mod(15, 5)).toBe(0);
      expect(() => Mod(10, 0)).toThrow();
    });

    it('Power should raise to power', () => {
      expect(Power(2, 3)).toBe(8);
      expect(Power(10, 0)).toBe(1);
    });
  });
});

// ============================================================================
// VB6 String Functions Tests
// ============================================================================

describe('VB6 String Functions', () => {
  describe('Character Functions', () => {
    it('Asc should return character code', () => {
      expect(Asc('A')).toBe(65);
      expect(Asc('a')).toBe(97);
    });

    it('Chr should return character', () => {
      expect(Chr(65)).toBe('A');
      expect(Chr(97)).toBe('a');
    });
  });

  describe('Case Functions', () => {
    it('LCase and UCase should convert case', () => {
      expect(LCase('HELLO')).toBe('hello');
      expect(UCase('hello')).toBe('HELLO');
    });
  });

  describe('Substring Functions', () => {
    it('Left should return left characters', () => {
      expect(Left('Hello', 2)).toBe('He');
      expect(Left('Hi', 10)).toBe('Hi');
    });

    it('Right should return right characters', () => {
      expect(Right('Hello', 2)).toBe('lo');
      expect(Right('Hi', 10)).toBe('Hi');
    });

    it('Mid should return substring', () => {
      expect(Mid('Hello', 2, 3)).toBe('ell');
      expect(Mid('Hello', 2)).toBe('ello');
    });

    it('Len should return length', () => {
      expect(Len('Hello')).toBe(5);
      expect(Len('')).toBe(0);
    });
  });

  describe('Trim Functions', () => {
    it('LTrim should remove leading spaces', () => {
      expect(LTrim('  Hello')).toBe('Hello');
    });

    it('RTrim should remove trailing spaces', () => {
      expect(RTrim('Hello  ')).toBe('Hello');
    });

    it('Trim should remove both', () => {
      expect(Trim('  Hello  ')).toBe('Hello');
    });
  });

  describe('Search Functions', () => {
    it('InStr should find substring', () => {
      expect(InStr(1, 'Hello World', 'World')).toBe(7);
      expect(InStr(1, 'Hello', 'X')).toBe(0);
    });

    it('InStrRev should find from end', () => {
      expect(InStrRev('Hello World World', 'World')).toBe(13);
    });
  });

  describe('Manipulation Functions', () => {
    it('Space should create spaces', () => {
      expect(Space(3)).toBe('   ');
    });

    it('StrReverse should reverse string', () => {
      expect(StrReverse('Hello')).toBe('olleH');
    });

    it('Replace should replace substrings', () => {
      expect(Replace('Hello World', 'World', 'VB6')).toBe('Hello VB6');
    });

    it('Split should split string', () => {
      expect(Split('a,b,c', ',')).toEqual(['a', 'b', 'c']);
    });

    it('Join should join array', () => {
      expect(Join(['a', 'b', 'c'], ',')).toBe('a,b,c');
    });
  });

  describe('Comparison Functions', () => {
    it('StrComp should compare strings', () => {
      expect(StrComp('abc', 'abc')).toBe(0);
      expect(StrComp('abc', 'abd')).toBe(-1);
      expect(StrComp('abd', 'abc')).toBe(1);
    });
  });
});

// ============================================================================
// Factory Functions Tests
// ============================================================================

describe('Factory Functions', () => {
  it('CreateCollection should create collection', () => {
    const col = CreateCollection<number>();
    col.Add(1, 'key');
    expect(col.Item('key')).toBe(1);
  });

  it('CreateDictionary should create dictionary', () => {
    const dict = CreateDictionary<string, number>();
    dict.Add('key', 42);
    expect(dict.Item('key')).toBe(42);
  });
});
