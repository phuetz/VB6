import React, { useCallback, useRef } from 'react';

export interface VB6RuntimeProps {
  code: string;
  onOutput: (message: string) => void;
  onError: (error: string) => void;
}

export function createRuntimeFunctions(
  onOutput: (msg: string) => void,
  onError: (msg: string) => void
) {
  return {
    MsgBox: (message: string, buttons: number = 0, title: string = 'VB6 App') => {
      if (buttons === 0) {
        alert(`${title}\n\n${message}`);
        return 1; // vbOK
      } else {
        const result = confirm(`${title}\n\n${message}`);
        return result ? 1 : 2; // vbOK : vbCancel
      }
    },

    InputBox: (prompt: string, title: string = 'VB6 App', defaultValue: string = '') => {
      return window.prompt(`${title}\n\n${prompt}`, defaultValue) || '';
    },

    Print: (message: string) => {
      onOutput(String(message));
    },

    // Object handling (simplified COM/ActiveX)
    CreateObject: (progId: string): any => {
      if (typeof (window as any).ActiveXObject === 'function') {
        return new (window as any).ActiveXObject(progId);
      }
      if ((window as any)[progId]) {
        return new (window as any)[progId]();
      }
      throw new Error('ActiveX not supported');
    },
    ReleaseObject: (_obj: any) => {},

    // String functions
    Len: (str: string) => String(str).length,
    Left: (str: string, n: number) => String(str).substring(0, n),
    Right: (str: string, n: number) => String(str).substring(String(str).length - n),
    Mid: (str: string, start: number, length?: number) =>
      String(str).substring(start - 1, length ? start - 1 + length : undefined),
    UCase: (str: string) => String(str).toUpperCase(),
    LCase: (str: string) => String(str).toLowerCase(),
    Trim: (str: string) => String(str).trim(),
    LTrim: (str: string) => String(str).replace(/^\s+/, ''),
    RTrim: (str: string) => String(str).replace(/\s+$/, ''),
    InStr: (start: number | string, str1?: string, str2?: string) => {
      if (typeof start === 'string') {
        return String(start).indexOf(String(str1)) + 1;
      } else {
        return String(str1).indexOf(String(str2), start - 1) + 1;
      }
    },
    Replace: (str: string, find: string, replace: string) =>
      String(str).replace(new RegExp(find, 'g'), replace),

    // Math functions
    Abs: Math.abs,
    Int: Math.floor,
    Fix: (n: number) => (n >= 0 ? Math.floor(n) : Math.ceil(n)),
    Round: (n: number, decimals: number = 0) => {
      const factor = Math.pow(10, decimals);
      return Math.round(n * factor) / factor;
    },
    Sqr: Math.sqrt,
    Sin: Math.sin,
    Cos: Math.cos,
    Tan: Math.tan,
    Atn: Math.atan,
    Exp: Math.exp,
    Log: Math.log,
    Rnd: Math.random,
    Sgn: (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0),

    // Conversion functions
    Val: (str: string) => {
      const num = parseFloat(String(str));
      return isNaN(num) ? 0 : num;
    },
    Str: (num: number) => ' ' + String(num),
    Chr: (code: number) => String.fromCharCode(code),
    Asc: (char: string) => String(char).charCodeAt(0),
    Hex: (num: number) => num.toString(16).toUpperCase(),
    Oct: (num: number) => num.toString(8),

    // Date/Time functions
    Now: () => new Date(),
    Date: () => new Date().toDateString(),
    Time: () => new Date().toTimeString(),
    Timer: () => {
      const now = new Date();
      return (
        now.getHours() * 3600 +
        now.getMinutes() * 60 +
        now.getSeconds() +
        now.getMilliseconds() / 1000
      );
    },
    Year: (date: Date = new Date()) => date.getFullYear(),
    Month: (date: Date = new Date()) => date.getMonth() + 1,
    Day: (date: Date = new Date()) => date.getDate(),
    Hour: (date: Date = new Date()) => date.getHours(),
    Minute: (date: Date = new Date()) => date.getMinutes(),
    Second: (date: Date = new Date()) => date.getSeconds(),
    DateAdd: (interval: string, number: number, date: Date) => {
      const newDate = new Date(date);
      switch (interval.toLowerCase()) {
        case 'yyyy':
          newDate.setFullYear(newDate.getFullYear() + number);
          break;
        case 'm':
          newDate.setMonth(newDate.getMonth() + number);
          break;
        case 'd':
          newDate.setDate(newDate.getDate() + number);
          break;
        case 'h':
          newDate.setHours(newDate.getHours() + number);
          break;
        case 'n':
          newDate.setMinutes(newDate.getMinutes() + number);
          break;
        case 's':
          newDate.setSeconds(newDate.getSeconds() + number);
          break;
      }
      return newDate;
    },
    DateDiff: (interval: string, date1: Date, date2: Date) => {
      const diff = date2.getTime() - date1.getTime();
      switch (interval.toLowerCase()) {
        case 's':
          return Math.floor(diff / 1000);
        case 'n':
          return Math.floor(diff / (1000 * 60));
        case 'h':
          return Math.floor(diff / (1000 * 60 * 60));
        case 'd':
          return Math.floor(diff / (1000 * 60 * 60 * 24));
        case 'm':
          return (
            (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth())
          );
        case 'yyyy':
          return date2.getFullYear() - date1.getFullYear();
      }
      return 0;
    },
    Weekday: (date: Date = new Date(), firstDay: number = 1) => {
      const day = date.getDay() + 1;
      const adjusted = day - firstDay + 1;
      return adjusted <= 0 ? adjusted + 7 : adjusted;
    },
    MonthName: (month: number) => {
      const names = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return names[month - 1] || '';
    },
    WeekdayName: (weekday: number) => {
      const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return names[weekday - 1] || '';
    },

    // Array functions
    UBound: (arr: any[]) => arr.length - 1,
    LBound: (_arr: any[]) => 0,

    // Type checking functions
    IsNumeric: (value: any) => !isNaN(parseFloat(value)) && isFinite(value),
    IsDate: (value: any) => value instanceof Date && !isNaN(value.getTime()),
    IsEmpty: (value: any) => value === null || value === undefined || value === '',
    IsNull: (value: any) => value === null,

    // File system functions (limited in browser)
    Dir: (_path: string = '') => {
      onError('Dir function not supported in browser environment');
      return '';
    },

    // Format functions
    Format: (expression: any, format?: string) => {
      if (format) {
        if (typeof expression === 'number') {
          if (format.toLowerCase() === 'currency') {
            return '$' + expression.toFixed(2);
          } else if (format.toLowerCase() === 'percent') {
            return (expression * 100).toFixed(2) + '%';
          }
        }
      }
      return String(expression);
    },
  };
}

export function basicTranspile(vbCode: string): string {
  let jsCode = vbCode;
  const conversions: Array<[RegExp, string]> = [
    [/'/g, '//'],
    [/\bDim\s+(\w+)\s+As\s+(\w+)/gi, 'let $1'],
    [/\bPrivate\s+(\w+)\s+As\s+(\w+)/gi, 'let $1'],
    [/\bPublic\s+(\w+)\s+As\s+(\w+)/gi, 'let $1'],
    [/\bCase\s+Else\b/gi, 'default:'],
    [/\bCase\s+(.+)/gi, 'case $1:'],
    [/^\s*Else\b/gi, '} else {'],
    [/\bElseIf\b/gi, '} else if'],
    [/\bFor\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/gi, 'for (let $1 = $2; $1 <= $3; $1++)'],
    [/\bNext\s+\w+/gi, '}'],
    [/\bNext\b/gi, '}'],
    [/\bDo\s+While\s+(.+)/gi, 'while ($1) {'],
    [/\bDo\s+Until\s+(.+)/gi, 'while (!($1)) {'],
    [/^\s*While\s+(.+)/gm, 'while ($1) {'],
    [/\bWend\b/gi, '}'],
    [/\bLoop\b/gi, '}'],
    [/\bSelect\s+Case\s+([^\n\r]+)/gi, 'switch ($1) {'],
    [/\bEnd\s+Select\b/gi, '}'],
    [/\b&\b/g, '+'],
    [/\bTrue\b/gi, 'true'],
    [/\bFalse\b/gi, 'false'],
    [/\bAnd\b/gi, '&&'],
    [/\bOr\b/gi, '||'],
    [/\bNot\b/gi, '!'],
    [/\bPrint\s+(.+)/gi, 'Print($1);'],
  ];
  conversions.forEach(([p, r]) => {
    jsCode = jsCode.replace(p, r);
  });
  return jsCode;
}

export const VB6Runtime: React.FC<VB6RuntimeProps> = ({ code, onOutput, onError }) => {
  const runtimeRef = useRef<any>(null);

  // VB6 Runtime Functions
  const runtimeFunctions = createRuntimeFunctions(onOutput, onError);

  const executeVB6Code = useCallback(
    (vbCode: string) => {
      try {
        const jsCode = basicTranspile(vbCode);

        // Create execution context with runtime functions
        const context = {
          ...runtimeFunctions,
          console: { log: onOutput },
          alert: runtimeFunctions.MsgBox,
        };

        // Execute the code
        const func = new Function(...Object.keys(context), jsCode);
        func(...Object.values(context));
      } catch (error) {
        onError(`Runtime Error: ${(error as Error).message}`);
      }
    },
    [onOutput, onError]
  );

  // Expose execute function
  React.useImperativeHandle(runtimeRef, () => ({
    execute: executeVB6Code,
  }));

  return null; // This is a runtime component, no UI
};

export default VB6Runtime;
