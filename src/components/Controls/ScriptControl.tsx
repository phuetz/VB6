/**
 * VB6 Script Control - Complete Scripting Engine Integration
 * Provides VBScript and JScript execution capabilities within VB6 applications
 * Compatible with Microsoft Script Control 1.0
 */

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Control } from '../../types/Control';

interface ScriptControlProps {
  control: Control;
  isDesignMode?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onChange?: (value: any) => void;
}

// Script languages supported
export enum ScriptLanguage {
  VBScript = 'VBScript',
  JScript = 'JScript',
  JavaScript = 'JavaScript'
}

// Script control states
export enum ScriptState {
  Initialized = 0,
  Started = 1,
  Connected = 2,
  Disconnected = 3,
  Closed = 4
}

// Error object interface
export interface ScriptError {
  number: number;
  source: string;
  description: string;
  helpFile: string;
  helpContext: number;
  text: string;
  line: number;
  column: number;
}

// Procedure info
export interface ScriptProcedure {
  name: string;
  numArgs: number;
  hasReturnValue: boolean;
}

// Module interface
export interface ScriptModule {
  name: string;
  procedures: ScriptProcedure[];
  codeObject: any;
}

export const ScriptControl = forwardRef<HTMLDivElement, ScriptControlProps>(
  ({ control, isDesignMode = false, onClick, onDoubleClick, onChange }, ref) => {
    const [language, setLanguage] = useState<ScriptLanguage>(
      control.language || ScriptLanguage.VBScript
    );
    const [state, setState] = useState<ScriptState>(ScriptState.Initialized);
    const [error, setError] = useState<ScriptError | null>(null);
    const [timeout, setTimeout] = useState(control.timeout || 10000);
    const [allowUI, setAllowUI] = useState(control.allowUI !== false);
    const [useSafeSubset, setUseSafeSubset] = useState(control.useSafeSubset === true);
    
    const globalScopeRef = useRef<Record<string, any>>({});
    const modulesRef = useRef<Map<string, ScriptModule>>(new Map());
    const proceduresRef = useRef<Map<string, (...args: any[]) => any>>(new Map());

    // Initialize script engine
    useEffect(() => {
      initializeScriptEngine();
      return () => {
        cleanup();
      };
    }, [language]);

    const initializeScriptEngine = () => {
      // Reset state
      setState(ScriptState.Started);
      setError(null);
      globalScopeRef.current = {};
      modulesRef.current.clear();
      proceduresRef.current.clear();

      // Add built-in objects based on language
      if (language === ScriptLanguage.VBScript) {
        initializeVBScriptEnvironment();
      } else {
        initializeJScriptEnvironment();
      }

      setState(ScriptState.Connected);
    };

    const initializeVBScriptEnvironment = () => {
      // VBScript built-in functions
      const vbBuiltins = {
        // String functions
        Len: (str: string) => str?.length || 0,
        Left: (str: string, length: number) => str?.substring(0, length) || '',
        Right: (str: string, length: number) => str?.substring(str.length - length) || '',
        Mid: (str: string, start: number, length?: number) => {
          const startIdx = Math.max(0, start - 1); // VB uses 1-based indexing
          return length !== undefined 
            ? str?.substring(startIdx, startIdx + length) || ''
            : str?.substring(startIdx) || '';
        },
        InStr: (start: number | string, str1?: string, str2?: string) => {
          if (typeof start === 'string') {
            return (start.indexOf(str1 || '') + 1) || 0;
          }
          return ((str1?.indexOf(str2 || '', start - 1) || -1) + 1) || 0;
        },
        Replace: (str: string, find: string, replace: string) => 
          str?.replace(new RegExp(find, 'g'), replace) || '',
        UCase: (str: string) => str?.toUpperCase() || '',
        LCase: (str: string) => str?.toLowerCase() || '',
        Trim: (str: string) => str?.trim() || '',
        LTrim: (str: string) => str?.trimStart() || '',
        RTrim: (str: string) => str?.trimEnd() || '',
        Space: (count: number) => ' '.repeat(count),
        String: (count: number, char: string) => char.charAt(0).repeat(count),
        
        // Numeric functions
        Abs: Math.abs,
        Atn: Math.atan,
        Cos: Math.cos,
        Exp: Math.exp,
        Log: Math.log,
        Rnd: Math.random,
        Round: (num: number, decimals: number = 0) => {
          const factor = Math.pow(10, decimals);
          return Math.round(num * factor) / factor;
        },
        Sgn: (num: number) => num > 0 ? 1 : num < 0 ? -1 : 0,
        Sin: Math.sin,
        Sqr: Math.sqrt,
        Tan: Math.tan,
        
        // Date/Time functions
        Now: () => new Date(),
        Date: () => new Date().toLocaleDateString(),
        Time: () => new Date().toLocaleTimeString(),
        DateAdd: (interval: string, number: number, date: Date) => {
          const result = new Date(date);
          switch (interval.toLowerCase()) {
            case 'yyyy': result.setFullYear(result.getFullYear() + number); break;
            case 'q': result.setMonth(result.getMonth() + (number * 3)); break;
            case 'm': result.setMonth(result.getMonth() + number); break;
            case 'y':
            case 'd': result.setDate(result.getDate() + number); break;
            case 'w': result.setDate(result.getDate() + (number * 7)); break;
            case 'h': result.setHours(result.getHours() + number); break;
            case 'n': result.setMinutes(result.getMinutes() + number); break;
            case 's': result.setSeconds(result.getSeconds() + number); break;
          }
          return result;
        },
        DateDiff: (interval: string, date1: Date, date2: Date) => {
          const diff = date2.getTime() - date1.getTime();
          switch (interval.toLowerCase()) {
            case 'yyyy': return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
            case 'q': return Math.floor(diff / (3 * 30 * 24 * 60 * 60 * 1000));
            case 'm': return Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
            case 'd': return Math.floor(diff / (24 * 60 * 60 * 1000));
            case 'h': return Math.floor(diff / (60 * 60 * 1000));
            case 'n': return Math.floor(diff / (60 * 1000));
            case 's': return Math.floor(diff / 1000);
            default: return 0;
          }
        },
        
        // Type conversion
        CBool: (val: any) => Boolean(val),
        CByte: (val: any) => Math.max(0, Math.min(255, parseInt(val) || 0)),
        CCur: (val: any) => parseFloat(val) || 0,
        CDate: (val: any) => new Date(val),
        CDbl: (val: any) => parseFloat(val) || 0,
        CInt: (val: any) => parseInt(val) || 0,
        CLng: (val: any) => parseInt(val) || 0,
        CSng: (val: any) => parseFloat(val) || 0,
        CStr: (val: any) => String(val),
        
        // Array functions
        Array: (...args: any[]) => args,
        UBound: (arr: any[]) => arr.length - 1,
        LBound: (arr: any[]) => 0,
        Split: (str: string, delimiter: string = ' ') => str.split(delimiter),
        Join: (arr: any[], delimiter: string = ' ') => arr.join(delimiter),
        
        // Utility functions
        IsArray: Array.isArray,
        IsDate: (val: any) => val instanceof Date,
        IsEmpty: (val: any) => val === null || val === undefined || val === '',
        IsNull: (val: any) => val === null,
        IsNumeric: (val: any) => !isNaN(parseFloat(val)) && isFinite(val),
        IsObject: (val: any) => typeof val === 'object' && val !== null,
        TypeName: (val: any) => {
          if (val === null) return 'Null';
          if (val === undefined) return 'Empty';
          if (Array.isArray(val)) return 'Variant()';
          if (val instanceof Date) return 'Date';
          const type = typeof val;
          return type.charAt(0).toUpperCase() + type.slice(1);
        },
        
        // I/O functions (limited in browser)
        MsgBox: (prompt: string, buttons: number = 0, title: string = '') => {
          if (allowUI) {
            alert(`${title}\n\n${prompt}`);
          }
          return 1; // OK
        },
        InputBox: (prompt: string, title: string = '', defaultValue: string = '') => {
          if (allowUI) {
            return window.prompt(`${title}\n\n${prompt}`, defaultValue) || '';
          }
          return defaultValue;
        }
      };

      Object.assign(globalScopeRef.current, vbBuiltins);
    };

    const initializeJScriptEnvironment = () => {
      // JScript/JavaScript already has most built-ins
      // Add any VB6-specific compatibility functions
      const jsBuiltins = {
        // VB compatibility layer
        MsgBox: (message: string) => {
          if (allowUI) {
            alert(message);
          }
        },
        InputBox: (prompt: string, defaultValue: string = '') => {
          if (allowUI) {
            return window.prompt(prompt, defaultValue) || '';
          }
          return defaultValue;
        }
      };

      Object.assign(globalScopeRef.current, jsBuiltins);
    };

    const cleanup = () => {
      setState(ScriptState.Disconnected);
      globalScopeRef.current = {};
      modulesRef.current.clear();
      proceduresRef.current.clear();
      setState(ScriptState.Closed);
    };

    // VB6 Methods implementation
    const vb6Methods = {
      // Properties
      get Language() { return language; },
      set Language(value: ScriptLanguage) {
        setLanguage(value);
        initializeScriptEngine();
      },

      get State() { return state; },
      
      get Error() { return error; },
      
      get Timeout() { return timeout; },
      set Timeout(value: number) { setTimeout(value); },
      
      get AllowUI() { return allowUI; },
      set AllowUI(value: boolean) { setAllowUI(value); },
      
      get UseSafeSubset() { return useSafeSubset; },
      set UseSafeSubset(value: boolean) { setUseSafeSubset(value); },

      // Methods
      AddCode: (code: string) => {
        try {
          if (language === ScriptLanguage.VBScript) {
            executeVBScriptCode(code);
          } else {
            executeJScriptCode(code);
          }
          return true;
        } catch (err) {
          handleScriptError(err);
          return false;
        }
      },

      AddObject: (name: string, object: any, addMembers: boolean = true) => {
        try {
          if (addMembers && typeof object === 'object') {
            // Add object with all its members
            globalScopeRef.current[name] = object;
          } else {
            // Add object reference only
            globalScopeRef.current[name] = object;
          }
          return true;
        } catch (err) {
          handleScriptError(err);
          return false;
        }
      },

      Eval: (expression: string): any => {
        try {
          if (language === ScriptLanguage.VBScript) {
            return evaluateVBScriptExpression(expression);
          } else {
            return evaluateJScriptExpression(expression);
          }
        } catch (err) {
          handleScriptError(err);
          return null;
        }
      },

      ExecuteStatement: (statement: string) => {
        try {
          if (language === ScriptLanguage.VBScript) {
            executeVBScriptStatement(statement);
          } else {
            executeJScriptStatement(statement);
          }
          return true;
        } catch (err) {
          handleScriptError(err);
          return false;
        }
      },

      Run: (procedureName: string, ...args: any[]): any => {
        try {
          const procedure = proceduresRef.current.get(procedureName);
          if (procedure) {
            return procedure(...args);
          } else {
            throw new Error(`Procedure '${procedureName}' not found`);
          }
        } catch (err) {
          handleScriptError(err);
          return null;
        }
      },

      Reset: () => {
        cleanup();
        initializeScriptEngine();
      },

      // Module management
      Modules: {
        get Count() { return modulesRef.current.size; },
        
        Item: (index: number | string) => {
          if (typeof index === 'number') {
            return Array.from(modulesRef.current.values())[index];
          } else {
            return modulesRef.current.get(index);
          }
        },
        
        Add: (name: string) => {
          const module: ScriptModule = {
            name,
            procedures: [],
            codeObject: {}
          };
          modulesRef.current.set(name, module);
          return module;
        }
      },

      // Procedure management
      Procedures: {
        get Count() { return proceduresRef.current.size; },
        
        Item: (index: number | string) => {
          if (typeof index === 'number') {
            return Array.from(proceduresRef.current.keys())[index];
          } else {
            return proceduresRef.current.get(index);
          }
        }
      },

      // Code object access
      CodeObject: globalScopeRef.current
    };

    // Script execution functions
    const executeVBScriptCode = (code: string) => {
      // Parse and execute VBScript code
      // This is a simplified implementation - in real VB6, this would use the actual scripting engine
      const lines = code.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("'")) continue; // Skip empty lines and comments
        
        // Handle function/sub declarations
        if (trimmed.match(/^(Function|Sub)\s+(\w+)/i)) {
          parseVBScriptProcedure(code);
          return;
        }
        
        // Execute statement
        executeVBScriptStatement(trimmed);
      }
    };

    const executeJScriptCode = (code: string) => {
      // Create a new function with the global scope
      const func = new Function(...Object.keys(globalScopeRef.current), code);
      func(...Object.values(globalScopeRef.current));
    };

    const evaluateVBScriptExpression = (expression: string): any => {
      // Simple expression evaluator for VBScript
      // This would need a full parser for complete compatibility
      try {
        const func = new Function(...Object.keys(globalScopeRef.current), `return ${expression}`);
        return func(...Object.values(globalScopeRef.current));
      } catch {
        // If it fails, try as a simple value
        return expression;
      }
    };

    const evaluateJScriptExpression = (expression: string): any => {
      const func = new Function(...Object.keys(globalScopeRef.current), `return ${expression}`);
      return func(...Object.values(globalScopeRef.current));
    };

    const executeVBScriptStatement = (statement: string) => {
      // Handle variable assignment
      const assignMatch = statement.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, varName, value] = assignMatch;
        globalScopeRef.current[varName] = evaluateVBScriptExpression(value);
        return;
      }
      
      // Handle procedure calls
      const callMatch = statement.match(/^(\w+)(?:\s+(.+))?$/);
      if (callMatch) {
        const [, procName, args] = callMatch;
        const proc = globalScopeRef.current[procName] || proceduresRef.current.get(procName);
        if (typeof proc === 'function') {
          const argList = args ? args.split(',').map(arg => evaluateVBScriptExpression(arg.trim())) : [];
          proc(...argList);
        }
      }
    };

    const executeJScriptStatement = (statement: string) => {
      const func = new Function(...Object.keys(globalScopeRef.current), statement);
      func(...Object.values(globalScopeRef.current));
    };

    const parseVBScriptProcedure = (code: string) => {
      // Simple procedure parser
      const match = code.match(/^(Function|Sub)\s+(\w+)\s*\(([^)]*)\)/im);
      if (match) {
        const [, type, name, params] = match;
        const paramList = params.split(',').map(p => p.trim()).filter(p => p);
        
        // Create procedure
        const procFunc = new Function(...paramList, ...Object.keys(globalScopeRef.current), 
          code.substring(code.indexOf('\n') + 1, code.lastIndexOf('\n')));
        
        proceduresRef.current.set(name, procFunc);
        globalScopeRef.current[name] = procFunc;
      }
    };

    const handleScriptError = (err: any) => {
      const scriptError: ScriptError = {
        number: err.number || -1,
        source: 'Script Control',
        description: err.message || String(err),
        helpFile: '',
        helpContext: 0,
        text: err.stack || '',
        line: err.line || 0,
        column: err.column || 0
      };
      setError(scriptError);
      onChange?.({ error: scriptError });
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
      width: control.width || 32,
      height: control.height || 32,
      border: isDesignMode ? '1px dashed #808080' : 'none',
      backgroundColor: isDesignMode ? '#f0f0f0' : 'transparent',
      display: isDesignMode ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'default',
      fontSize: '20px',
      opacity: control.visible !== false ? 1 : 0,
      zIndex: control.zIndex || 'auto'
    };

    // Script Control is invisible at runtime
    if (!isDesignMode) {
      return null;
    }

    return (
      <div
        ref={ref}
        style={containerStyle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        data-control-type="ScriptControl"
        data-control-name={control.name}
        title={`Script Control (${language})`}
      >
        📜
      </div>
    );
  }
);

ScriptControl.displayName = 'ScriptControl';

export default ScriptControl;