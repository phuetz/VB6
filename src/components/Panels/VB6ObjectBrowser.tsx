/**
 * VB6 Object Browser Component
 * Browse classes, properties, methods, and events in the project
 */

import React, { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type MemberType = 'property' | 'method' | 'event' | 'constant' | 'enum' | 'class' | 'module';

export interface ObjectMember {
  name: string;
  type: MemberType;
  returnType?: string;
  parameters?: ParameterInfo[];
  description?: string;
  isReadOnly?: boolean;
  isWriteOnly?: boolean;
  isDefault?: boolean;
  isHidden?: boolean;
  value?: string | number;
}

export interface ParameterInfo {
  name: string;
  type: string;
  isOptional?: boolean;
  defaultValue?: any;
  isByRef?: boolean;
  isParamArray?: boolean;
}

export interface ObjectClass {
  name: string;
  type: 'class' | 'module' | 'enum' | 'interface';
  description?: string;
  members: ObjectMember[];
  baseClass?: string;
  isHidden?: boolean;
}

export interface ObjectLibrary {
  name: string;
  description?: string;
  version?: string;
  guid?: string;
  classes: ObjectClass[];
  isProjectLibrary?: boolean;
}

// ============================================================================
// Built-in VB6 Libraries
// ============================================================================

const VB6_RUNTIME_LIBRARY: ObjectLibrary = {
  name: 'VBA',
  description: 'Visual Basic for Applications',
  version: '6.0',
  classes: [
    {
      name: 'Global',
      type: 'module',
      description: 'Global VB6 functions and statements',
      members: [
        // String Functions
        {
          name: 'Asc',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Returns the character code for the first character of a string',
        },
        {
          name: 'Chr',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'CharCode', type: 'Long' }],
          description: 'Returns the character for a given character code',
        },
        {
          name: 'InStr',
          type: 'method',
          returnType: 'Long',
          parameters: [
            { name: 'Start', type: 'Long', isOptional: true },
            { name: 'String1', type: 'String' },
            { name: 'String2', type: 'String' },
            { name: 'Compare', type: 'vbCompareMethod', isOptional: true },
          ],
          description: 'Returns the position of a substring within a string',
        },
        {
          name: 'InStrRev',
          type: 'method',
          returnType: 'Long',
          parameters: [
            { name: 'StringCheck', type: 'String' },
            { name: 'StringMatch', type: 'String' },
            { name: 'Start', type: 'Long', isOptional: true },
          ],
          description:
            'Returns the position of a substring within a string, searching from the end',
        },
        {
          name: 'LCase',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Converts a string to lowercase',
        },
        {
          name: 'UCase',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Converts a string to uppercase',
        },
        {
          name: 'Left',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'String', type: 'String' },
            { name: 'Length', type: 'Long' },
          ],
          description: 'Returns a specified number of characters from the left side of a string',
        },
        {
          name: 'Right',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'String', type: 'String' },
            { name: 'Length', type: 'Long' },
          ],
          description: 'Returns a specified number of characters from the right side of a string',
        },
        {
          name: 'Mid',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'String', type: 'String' },
            { name: 'Start', type: 'Long' },
            { name: 'Length', type: 'Long', isOptional: true },
          ],
          description: 'Returns a specified number of characters from a string',
        },
        {
          name: 'Len',
          type: 'method',
          returnType: 'Long',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Returns the length of a string',
        },
        {
          name: 'LTrim',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Removes leading spaces from a string',
        },
        {
          name: 'RTrim',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Removes trailing spaces from a string',
        },
        {
          name: 'Trim',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Removes leading and trailing spaces from a string',
        },
        {
          name: 'Replace',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'Expression', type: 'String' },
            { name: 'Find', type: 'String' },
            { name: 'Replace', type: 'String' },
          ],
          description: 'Replaces occurrences of a substring within a string',
        },
        {
          name: 'Space',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'Number', type: 'Long' }],
          description: 'Returns a string of spaces',
        },
        {
          name: 'String',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'Number', type: 'Long' },
            { name: 'Character', type: 'Variant' },
          ],
          description: 'Returns a string of repeated characters',
        },
        {
          name: 'StrComp',
          type: 'method',
          returnType: 'Integer',
          parameters: [
            { name: 'String1', type: 'String' },
            { name: 'String2', type: 'String' },
          ],
          description: 'Compares two strings',
        },
        {
          name: 'StrConv',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'String', type: 'String' },
            { name: 'Conversion', type: 'vbStrConv' },
          ],
          description: 'Converts a string',
        },
        {
          name: 'StrReverse',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'Expression', type: 'String' }],
          description: 'Reverses a string',
        },
        {
          name: 'Split',
          type: 'method',
          returnType: 'String()',
          parameters: [
            { name: 'Expression', type: 'String' },
            { name: 'Delimiter', type: 'String', isOptional: true },
          ],
          description: 'Splits a string into an array',
        },
        {
          name: 'Join',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'SourceArray', type: 'Variant' },
            { name: 'Delimiter', type: 'String', isOptional: true },
          ],
          description: 'Joins an array into a string',
        },
        {
          name: 'Format',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'Expression', type: 'Variant' },
            { name: 'Format', type: 'String', isOptional: true },
          ],
          description: 'Formats a value as a string',
        },

        // Math Functions
        {
          name: 'Abs',
          type: 'method',
          returnType: 'Variant',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the absolute value of a number',
        },
        {
          name: 'Atn',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns the arctangent of a number',
        },
        {
          name: 'Cos',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns the cosine of an angle',
        },
        {
          name: 'Sin',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns the sine of an angle',
        },
        {
          name: 'Tan',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns the tangent of an angle',
        },
        {
          name: 'Exp',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns e raised to a power',
        },
        {
          name: 'Log',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns the natural logarithm of a number',
        },
        {
          name: 'Sqr',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Number', type: 'Double' }],
          description: 'Returns the square root of a number',
        },
        {
          name: 'Int',
          type: 'method',
          returnType: 'Variant',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the integer portion of a number',
        },
        {
          name: 'Fix',
          type: 'method',
          returnType: 'Variant',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the integer portion of a number (truncates toward zero)',
        },
        {
          name: 'Sgn',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the sign of a number',
        },
        {
          name: 'Rnd',
          type: 'method',
          returnType: 'Single',
          parameters: [{ name: 'Number', type: 'Single', isOptional: true }],
          description: 'Returns a random number',
        },
        {
          name: 'Randomize',
          type: 'method',
          returnType: 'void',
          parameters: [{ name: 'Number', type: 'Variant', isOptional: true }],
          description: 'Initializes the random number generator',
        },
        {
          name: 'Round',
          type: 'method',
          returnType: 'Variant',
          parameters: [
            { name: 'Number', type: 'Variant' },
            { name: 'NumDigitsAfterDecimal', type: 'Long', isOptional: true },
          ],
          description: 'Rounds a number to a specified number of decimal places',
        },

        // Date/Time Functions
        {
          name: 'Now',
          type: 'property',
          returnType: 'Date',
          description: 'Returns the current date and time',
          isReadOnly: true,
        },
        {
          name: 'Date',
          type: 'property',
          returnType: 'Date',
          description: 'Returns or sets the current system date',
        },
        {
          name: 'Time',
          type: 'property',
          returnType: 'Date',
          description: 'Returns or sets the current system time',
        },
        {
          name: 'Timer',
          type: 'property',
          returnType: 'Single',
          description: 'Returns the number of seconds since midnight',
          isReadOnly: true,
        },
        {
          name: 'Year',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Date', type: 'Date' }],
          description: 'Returns the year from a date',
        },
        {
          name: 'Month',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Date', type: 'Date' }],
          description: 'Returns the month from a date',
        },
        {
          name: 'Day',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Date', type: 'Date' }],
          description: 'Returns the day from a date',
        },
        {
          name: 'Hour',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Time', type: 'Date' }],
          description: 'Returns the hour from a time',
        },
        {
          name: 'Minute',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Time', type: 'Date' }],
          description: 'Returns the minute from a time',
        },
        {
          name: 'Second',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Time', type: 'Date' }],
          description: 'Returns the second from a time',
        },
        {
          name: 'Weekday',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Date', type: 'Date' }],
          description: 'Returns the day of the week from a date',
        },
        {
          name: 'DateAdd',
          type: 'method',
          returnType: 'Date',
          parameters: [
            { name: 'Interval', type: 'String' },
            { name: 'Number', type: 'Long' },
            { name: 'Date', type: 'Date' },
          ],
          description: 'Adds an interval to a date',
        },
        {
          name: 'DateDiff',
          type: 'method',
          returnType: 'Long',
          parameters: [
            { name: 'Interval', type: 'String' },
            { name: 'Date1', type: 'Date' },
            { name: 'Date2', type: 'Date' },
          ],
          description: 'Returns the difference between two dates',
        },
        {
          name: 'DatePart',
          type: 'method',
          returnType: 'Integer',
          parameters: [
            { name: 'Interval', type: 'String' },
            { name: 'Date', type: 'Date' },
          ],
          description: 'Returns a specified part of a date',
        },
        {
          name: 'DateSerial',
          type: 'method',
          returnType: 'Date',
          parameters: [
            { name: 'Year', type: 'Integer' },
            { name: 'Month', type: 'Integer' },
            { name: 'Day', type: 'Integer' },
          ],
          description: 'Returns a Date for a specified year, month, and day',
        },
        {
          name: 'TimeSerial',
          type: 'method',
          returnType: 'Date',
          parameters: [
            { name: 'Hour', type: 'Integer' },
            { name: 'Minute', type: 'Integer' },
            { name: 'Second', type: 'Integer' },
          ],
          description: 'Returns a Date for a specified hour, minute, and second',
        },
        {
          name: 'DateValue',
          type: 'method',
          returnType: 'Date',
          parameters: [{ name: 'Date', type: 'String' }],
          description: 'Converts a string to a Date',
        },
        {
          name: 'TimeValue',
          type: 'method',
          returnType: 'Date',
          parameters: [{ name: 'Time', type: 'String' }],
          description: 'Converts a string to a time',
        },
        {
          name: 'IsDate',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Returns True if an expression is a valid date',
        },

        // Conversion Functions
        {
          name: 'CBool',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Boolean',
        },
        {
          name: 'CByte',
          type: 'method',
          returnType: 'Byte',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Byte',
        },
        {
          name: 'CCur',
          type: 'method',
          returnType: 'Currency',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Currency',
        },
        {
          name: 'CDate',
          type: 'method',
          returnType: 'Date',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Date',
        },
        {
          name: 'CDbl',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Double',
        },
        {
          name: 'CDec',
          type: 'method',
          returnType: 'Decimal',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Decimal',
        },
        {
          name: 'CInt',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Integer',
        },
        {
          name: 'CLng',
          type: 'method',
          returnType: 'Long',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Long',
        },
        {
          name: 'CSng',
          type: 'method',
          returnType: 'Single',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Single',
        },
        {
          name: 'CStr',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to String',
        },
        {
          name: 'CVar',
          type: 'method',
          returnType: 'Variant',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Converts an expression to Variant',
        },
        {
          name: 'Val',
          type: 'method',
          returnType: 'Double',
          parameters: [{ name: 'String', type: 'String' }],
          description: 'Returns the numeric value of a string',
        },
        {
          name: 'Str',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the string representation of a number',
        },
        {
          name: 'Hex',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the hexadecimal representation of a number',
        },
        {
          name: 'Oct',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'Number', type: 'Variant' }],
          description: 'Returns the octal representation of a number',
        },

        // Type Checking Functions
        {
          name: 'IsArray',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'VarName', type: 'Variant' }],
          description: 'Returns True if a variable is an array',
        },
        {
          name: 'IsEmpty',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Returns True if a variable is uninitialized',
        },
        {
          name: 'IsError',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Returns True if an expression is an error value',
        },
        {
          name: 'IsMissing',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'ArgName', type: 'Variant' }],
          description: 'Returns True if an optional argument was not passed',
        },
        {
          name: 'IsNull',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Returns True if an expression is Null',
        },
        {
          name: 'IsNumeric',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Expression', type: 'Variant' }],
          description: 'Returns True if an expression can be evaluated as a number',
        },
        {
          name: 'IsObject',
          type: 'method',
          returnType: 'Boolean',
          parameters: [{ name: 'Identifier', type: 'Variant' }],
          description: 'Returns True if an identifier represents an object variable',
        },
        {
          name: 'TypeName',
          type: 'method',
          returnType: 'String',
          parameters: [{ name: 'VarName', type: 'Variant' }],
          description: 'Returns a string describing the data type of a variable',
        },
        {
          name: 'VarType',
          type: 'method',
          returnType: 'Integer',
          parameters: [{ name: 'VarName', type: 'Variant' }],
          description: 'Returns an integer indicating the data type of a variable',
        },

        // Array Functions
        {
          name: 'Array',
          type: 'method',
          returnType: 'Variant',
          parameters: [{ name: 'ArgList', type: 'Variant', isParamArray: true }],
          description: 'Creates an array from a list of values',
        },
        {
          name: 'LBound',
          type: 'method',
          returnType: 'Long',
          parameters: [
            { name: 'ArrayName', type: 'Variant' },
            { name: 'Dimension', type: 'Long', isOptional: true },
          ],
          description: 'Returns the lower bound of an array dimension',
        },
        {
          name: 'UBound',
          type: 'method',
          returnType: 'Long',
          parameters: [
            { name: 'ArrayName', type: 'Variant' },
            { name: 'Dimension', type: 'Long', isOptional: true },
          ],
          description: 'Returns the upper bound of an array dimension',
        },
        {
          name: 'Filter',
          type: 'method',
          returnType: 'String()',
          parameters: [
            { name: 'SourceArray', type: 'Variant' },
            { name: 'Match', type: 'String' },
          ],
          description: 'Filters an array based on a string',
        },

        // Miscellaneous Functions
        {
          name: 'MsgBox',
          type: 'method',
          returnType: 'vbMsgBoxResult',
          parameters: [
            { name: 'Prompt', type: 'String' },
            { name: 'Buttons', type: 'vbMsgBoxStyle', isOptional: true },
            { name: 'Title', type: 'String', isOptional: true },
          ],
          description: 'Displays a message box',
        },
        {
          name: 'InputBox',
          type: 'method',
          returnType: 'String',
          parameters: [
            { name: 'Prompt', type: 'String' },
            { name: 'Title', type: 'String', isOptional: true },
            { name: 'Default', type: 'String', isOptional: true },
          ],
          description: 'Displays an input dialog',
        },
        {
          name: 'Shell',
          type: 'method',
          returnType: 'Double',
          parameters: [
            { name: 'PathName', type: 'String' },
            { name: 'WindowStyle', type: 'vbAppWinStyle', isOptional: true },
          ],
          description: 'Runs an executable program',
        },
        {
          name: 'DoEvents',
          type: 'method',
          returnType: 'Integer',
          description: 'Yields execution to process events',
        },
        {
          name: 'QBColor',
          type: 'method',
          returnType: 'Long',
          parameters: [{ name: 'Color', type: 'Integer' }],
          description: 'Returns an RGB color value from a QuickBasic color number',
        },
        {
          name: 'RGB',
          type: 'method',
          returnType: 'Long',
          parameters: [
            { name: 'Red', type: 'Integer' },
            { name: 'Green', type: 'Integer' },
            { name: 'Blue', type: 'Integer' },
          ],
          description: 'Returns an RGB color value',
        },
        {
          name: 'IIf',
          type: 'method',
          returnType: 'Variant',
          parameters: [
            { name: 'Expression', type: 'Boolean' },
            { name: 'TruePart', type: 'Variant' },
            { name: 'FalsePart', type: 'Variant' },
          ],
          description: 'Returns one of two values depending on an expression',
        },
        {
          name: 'Choose',
          type: 'method',
          returnType: 'Variant',
          parameters: [
            { name: 'Index', type: 'Double' },
            { name: 'Choice', type: 'Variant', isParamArray: true },
          ],
          description: 'Selects and returns a value from a list of arguments',
        },
        {
          name: 'Switch',
          type: 'method',
          returnType: 'Variant',
          parameters: [{ name: 'VarExpr', type: 'Variant', isParamArray: true }],
          description: 'Evaluates a list of expressions and returns a value',
        },
      ],
    },
    {
      name: 'Collection',
      type: 'class',
      description: 'A Collection object is an ordered set of items',
      members: [
        {
          name: 'Add',
          type: 'method',
          parameters: [
            { name: 'Item', type: 'Variant' },
            { name: 'Key', type: 'String', isOptional: true },
            { name: 'Before', type: 'Variant', isOptional: true },
            { name: 'After', type: 'Variant', isOptional: true },
          ],
          description: 'Adds a member to a Collection object',
        },
        {
          name: 'Count',
          type: 'property',
          returnType: 'Long',
          isReadOnly: true,
          description: 'Returns the number of members in a Collection',
        },
        {
          name: 'Item',
          type: 'property',
          returnType: 'Variant',
          parameters: [{ name: 'Index', type: 'Variant' }],
          isDefault: true,
          description: 'Returns a specific member of a Collection',
        },
        {
          name: 'Remove',
          type: 'method',
          parameters: [{ name: 'Index', type: 'Variant' }],
          description: 'Removes a member from a Collection',
        },
      ],
    },
    {
      name: 'Err',
      type: 'class',
      description: 'Contains information about runtime errors',
      members: [
        {
          name: 'Clear',
          type: 'method',
          description: 'Clears all property settings of the Err object',
        },
        {
          name: 'Description',
          type: 'property',
          returnType: 'String',
          description: 'Error description string',
        },
        {
          name: 'HelpContext',
          type: 'property',
          returnType: 'Long',
          description: 'Help context ID',
        },
        { name: 'HelpFile', type: 'property', returnType: 'String', description: 'Help file path' },
        {
          name: 'LastDllError',
          type: 'property',
          returnType: 'Long',
          isReadOnly: true,
          description: 'Last DLL error code',
        },
        {
          name: 'Number',
          type: 'property',
          returnType: 'Long',
          isDefault: true,
          description: 'Error number',
        },
        {
          name: 'Raise',
          type: 'method',
          parameters: [
            { name: 'Number', type: 'Long' },
            { name: 'Source', type: 'String', isOptional: true },
            { name: 'Description', type: 'String', isOptional: true },
          ],
          description: 'Generates a runtime error',
        },
        {
          name: 'Source',
          type: 'property',
          returnType: 'String',
          description: 'Name of the object or application that raised the error',
        },
      ],
    },
  ],
};

const VB6_FORMS_LIBRARY: ObjectLibrary = {
  name: 'VB',
  description: 'Visual Basic Objects and Procedures',
  version: '6.0',
  classes: [
    {
      name: 'Form',
      type: 'class',
      description: 'A Form object represents a window or dialog box',
      members: [
        {
          name: 'BackColor',
          type: 'property',
          returnType: 'Long',
          description: 'Background color',
        },
        {
          name: 'Caption',
          type: 'property',
          returnType: 'String',
          description: 'Text in title bar',
        },
        {
          name: 'Enabled',
          type: 'property',
          returnType: 'Boolean',
          description: 'Enable or disable the form',
        },
        { name: 'Height', type: 'property', returnType: 'Single', description: 'Height in twips' },
        {
          name: 'Left',
          type: 'property',
          returnType: 'Single',
          description: 'Left position in twips',
        },
        { name: 'Name', type: 'property', returnType: 'String', description: 'Name of the form' },
        {
          name: 'Top',
          type: 'property',
          returnType: 'Single',
          description: 'Top position in twips',
        },
        {
          name: 'Visible',
          type: 'property',
          returnType: 'Boolean',
          description: 'Show or hide the form',
        },
        { name: 'Width', type: 'property', returnType: 'Single', description: 'Width in twips' },
        {
          name: 'WindowState',
          type: 'property',
          returnType: 'Integer',
          description: 'Form window state',
        },
        {
          name: 'Show',
          type: 'method',
          parameters: [{ name: 'Modal', type: 'Integer', isOptional: true }],
          description: 'Display the form',
        },
        { name: 'Hide', type: 'method', description: 'Hide the form' },
        {
          name: 'Print',
          type: 'method',
          parameters: [{ name: 'OutputList', type: 'Variant', isParamArray: true }],
          description: 'Print text on the form',
        },
        { name: 'Cls', type: 'method', description: 'Clear graphics and text' },
        { name: 'Refresh', type: 'method', description: 'Repaint the form' },
        { name: 'SetFocus', type: 'method', description: 'Set focus to the form' },
        { name: 'Click', type: 'event', description: 'Occurs when the user clicks the form' },
        {
          name: 'DblClick',
          type: 'event',
          description: 'Occurs when the user double-clicks the form',
        },
        { name: 'Load', type: 'event', description: 'Occurs when a form is loaded' },
        {
          name: 'Unload',
          type: 'event',
          parameters: [{ name: 'Cancel', type: 'Integer', isByRef: true }],
          description: 'Occurs when a form is about to be removed',
        },
        { name: 'Resize', type: 'event', description: 'Occurs when a form is resized' },
        {
          name: 'Activate',
          type: 'event',
          description: 'Occurs when a form becomes the active window',
        },
        {
          name: 'Deactivate',
          type: 'event',
          description: 'Occurs when a form is no longer the active window',
        },
        {
          name: 'QueryUnload',
          type: 'event',
          parameters: [
            { name: 'Cancel', type: 'Integer', isByRef: true },
            { name: 'UnloadMode', type: 'Integer' },
          ],
          description: 'Occurs before a form closes',
        },
      ],
    },
    {
      name: 'CommandButton',
      type: 'class',
      description: 'A CommandButton control',
      members: [
        {
          name: 'Caption',
          type: 'property',
          returnType: 'String',
          description: 'Text displayed on button',
        },
        {
          name: 'Enabled',
          type: 'property',
          returnType: 'Boolean',
          description: 'Enable or disable the button',
        },
        { name: 'Height', type: 'property', returnType: 'Single', description: 'Height in twips' },
        {
          name: 'Left',
          type: 'property',
          returnType: 'Single',
          description: 'Left position in twips',
        },
        {
          name: 'Name',
          type: 'property',
          returnType: 'String',
          description: 'Name of the control',
        },
        {
          name: 'TabIndex',
          type: 'property',
          returnType: 'Integer',
          description: 'Tab order position',
        },
        {
          name: 'Top',
          type: 'property',
          returnType: 'Single',
          description: 'Top position in twips',
        },
        {
          name: 'Visible',
          type: 'property',
          returnType: 'Boolean',
          description: 'Show or hide the control',
        },
        { name: 'Width', type: 'property', returnType: 'Single', description: 'Width in twips' },
        { name: 'SetFocus', type: 'method', description: 'Set focus to the control' },
        { name: 'Click', type: 'event', description: 'Occurs when the user clicks the button' },
        { name: 'GotFocus', type: 'event', description: 'Occurs when the control receives focus' },
        { name: 'LostFocus', type: 'event', description: 'Occurs when the control loses focus' },
      ],
    },
    {
      name: 'TextBox',
      type: 'class',
      description: 'A TextBox control',
      members: [
        {
          name: 'Text',
          type: 'property',
          returnType: 'String',
          isDefault: true,
          description: 'Text content',
        },
        {
          name: 'Enabled',
          type: 'property',
          returnType: 'Boolean',
          description: 'Enable or disable the control',
        },
        { name: 'Height', type: 'property', returnType: 'Single', description: 'Height in twips' },
        {
          name: 'Left',
          type: 'property',
          returnType: 'Single',
          description: 'Left position in twips',
        },
        {
          name: 'MaxLength',
          type: 'property',
          returnType: 'Long',
          description: 'Maximum number of characters',
        },
        {
          name: 'MultiLine',
          type: 'property',
          returnType: 'Boolean',
          description: 'Allow multiple lines',
        },
        {
          name: 'Name',
          type: 'property',
          returnType: 'String',
          description: 'Name of the control',
        },
        {
          name: 'PasswordChar',
          type: 'property',
          returnType: 'String',
          description: 'Character to display for password',
        },
        {
          name: 'SelLength',
          type: 'property',
          returnType: 'Long',
          description: 'Length of selected text',
        },
        {
          name: 'SelStart',
          type: 'property',
          returnType: 'Long',
          description: 'Start position of selected text',
        },
        { name: 'SelText', type: 'property', returnType: 'String', description: 'Selected text' },
        {
          name: 'Top',
          type: 'property',
          returnType: 'Single',
          description: 'Top position in twips',
        },
        {
          name: 'Visible',
          type: 'property',
          returnType: 'Boolean',
          description: 'Show or hide the control',
        },
        { name: 'Width', type: 'property', returnType: 'Single', description: 'Width in twips' },
        { name: 'SetFocus', type: 'method', description: 'Set focus to the control' },
        { name: 'Change', type: 'event', description: 'Occurs when the text changes' },
        { name: 'Click', type: 'event', description: 'Occurs when the user clicks the control' },
        { name: 'GotFocus', type: 'event', description: 'Occurs when the control receives focus' },
        {
          name: 'KeyDown',
          type: 'event',
          parameters: [
            { name: 'KeyCode', type: 'Integer', isByRef: true },
            { name: 'Shift', type: 'Integer' },
          ],
          description: 'Occurs when a key is pressed',
        },
        {
          name: 'KeyPress',
          type: 'event',
          parameters: [{ name: 'KeyAscii', type: 'Integer', isByRef: true }],
          description: 'Occurs when an ASCII key is pressed',
        },
        {
          name: 'KeyUp',
          type: 'event',
          parameters: [
            { name: 'KeyCode', type: 'Integer', isByRef: true },
            { name: 'Shift', type: 'Integer' },
          ],
          description: 'Occurs when a key is released',
        },
        { name: 'LostFocus', type: 'event', description: 'Occurs when the control loses focus' },
      ],
    },
    {
      name: 'Label',
      type: 'class',
      description: 'A Label control',
      members: [
        {
          name: 'Caption',
          type: 'property',
          returnType: 'String',
          isDefault: true,
          description: 'Text displayed on label',
        },
        {
          name: 'Alignment',
          type: 'property',
          returnType: 'Integer',
          description: 'Text alignment',
        },
        {
          name: 'AutoSize',
          type: 'property',
          returnType: 'Boolean',
          description: 'Auto-size to fit content',
        },
        {
          name: 'BackColor',
          type: 'property',
          returnType: 'Long',
          description: 'Background color',
        },
        {
          name: 'BackStyle',
          type: 'property',
          returnType: 'Integer',
          description: 'Background style',
        },
        {
          name: 'BorderStyle',
          type: 'property',
          returnType: 'Integer',
          description: 'Border style',
        },
        {
          name: 'Enabled',
          type: 'property',
          returnType: 'Boolean',
          description: 'Enable or disable the control',
        },
        {
          name: 'ForeColor',
          type: 'property',
          returnType: 'Long',
          description: 'Foreground color',
        },
        { name: 'Height', type: 'property', returnType: 'Single', description: 'Height in twips' },
        {
          name: 'Left',
          type: 'property',
          returnType: 'Single',
          description: 'Left position in twips',
        },
        {
          name: 'Name',
          type: 'property',
          returnType: 'String',
          description: 'Name of the control',
        },
        {
          name: 'Top',
          type: 'property',
          returnType: 'Single',
          description: 'Top position in twips',
        },
        {
          name: 'Visible',
          type: 'property',
          returnType: 'Boolean',
          description: 'Show or hide the control',
        },
        { name: 'Width', type: 'property', returnType: 'Single', description: 'Width in twips' },
        {
          name: 'WordWrap',
          type: 'property',
          returnType: 'Boolean',
          description: 'Allow word wrapping',
        },
        { name: 'Click', type: 'event', description: 'Occurs when the user clicks the label' },
        {
          name: 'DblClick',
          type: 'event',
          description: 'Occurs when the user double-clicks the label',
        },
      ],
    },
  ],
};

// ============================================================================
// Object Browser Component
// ============================================================================

interface VB6ObjectBrowserProps {
  libraries?: ObjectLibrary[];
  onMemberSelect?: (library: string, className: string, member: ObjectMember) => void;
  onCopyText?: (text: string) => void;
  width?: number | string;
  height?: number | string;
}

export const VB6ObjectBrowser: React.FC<VB6ObjectBrowserProps> = ({
  libraries: customLibraries,
  onMemberSelect,
  onCopyText,
  width = '100%',
  height = '100%',
}) => {
  const [selectedLibrary, setSelectedLibrary] = useState<string>('<All Libraries>');
  const [selectedClass, setSelectedClass] = useState<ObjectClass | null>(null);
  const [selectedMember, setSelectedMember] = useState<ObjectMember | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const libraries = useMemo(() => {
    const defaultLibraries = [VB6_RUNTIME_LIBRARY, VB6_FORMS_LIBRARY];
    return customLibraries ? [...defaultLibraries, ...customLibraries] : defaultLibraries;
  }, [customLibraries]);

  const filteredClasses = useMemo(() => {
    let classes: { library: ObjectLibrary; cls: ObjectClass }[] = [];

    for (const lib of libraries) {
      if (selectedLibrary === '<All Libraries>' || selectedLibrary === lib.name) {
        for (const cls of lib.classes) {
          if (!showHidden && cls.isHidden) continue;
          if (searchText) {
            const searchLower = searchText.toLowerCase();
            const nameMatch = cls.name.toLowerCase().includes(searchLower);
            const memberMatch = cls.members.some(m => m.name.toLowerCase().includes(searchLower));
            if (!nameMatch && !memberMatch) continue;
          }
          classes.push({ library: lib, cls });
        }
      }
    }

    return classes.sort((a, b) => a.cls.name.localeCompare(b.cls.name));
  }, [libraries, selectedLibrary, searchText, showHidden]);

  const filteredMembers = useMemo(() => {
    if (!selectedClass) return [];

    let members = selectedClass.members;

    if (!showHidden) {
      members = members.filter(m => !m.isHidden);
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      members = members.filter(m => m.name.toLowerCase().includes(searchLower));
    }

    return members.sort((a, b) => {
      // Sort by type first, then by name
      const typeOrder = {
        property: 0,
        method: 1,
        event: 2,
        constant: 3,
        enum: 4,
        class: 5,
        module: 6,
      };
      const typeCompare = typeOrder[a.type] - typeOrder[b.type];
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });
  }, [selectedClass, searchText, showHidden]);

  const getMemberSignature = useCallback((member: ObjectMember): string => {
    let signature = '';

    if (member.type === 'property') {
      signature = member.isReadOnly
        ? 'Property Get '
        : member.isWriteOnly
          ? 'Property Let '
          : 'Property ';
    } else if (member.type === 'method') {
      signature = member.returnType ? 'Function ' : 'Sub ';
    } else if (member.type === 'event') {
      signature = 'Event ';
    } else if (member.type === 'constant') {
      signature = 'Const ';
    }

    signature += member.name;

    if (member.parameters && member.parameters.length > 0) {
      const params = member.parameters.map(p => {
        let param = '';
        if (p.isOptional) param += 'Optional ';
        if (p.isByRef) param += 'ByRef ';
        if (p.isParamArray) param += 'ParamArray ';
        param += `${p.name} As ${p.type}`;
        if (p.defaultValue !== undefined) param += ` = ${p.defaultValue}`;
        return param;
      });
      signature += `(${params.join(', ')})`;
    } else if (member.type === 'method' || member.type === 'event') {
      signature += '()';
    }

    if (member.returnType && member.type !== 'property') {
      signature += ` As ${member.returnType}`;
    } else if (member.type === 'property' && member.returnType) {
      signature += ` As ${member.returnType}`;
    }

    if (member.type === 'constant' && member.value !== undefined) {
      signature += ` = ${member.value}`;
    }

    return signature;
  }, []);

  const getMemberIcon = useCallback((type: MemberType): string => {
    switch (type) {
      case 'property':
        return '🔵';
      case 'method':
        return '🟢';
      case 'event':
        return '⚡';
      case 'constant':
        return '🔷';
      case 'enum':
        return '📋';
      case 'class':
        return '📦';
      case 'module':
        return '📁';
      default:
        return '⬜';
    }
  }, []);

  const getClassIcon = useCallback((type: ObjectClass['type']): string => {
    switch (type) {
      case 'class':
        return '📦';
      case 'module':
        return '📁';
      case 'enum':
        return '📋';
      case 'interface':
        return '🔗';
      default:
        return '⬜';
    }
  }, []);

  const handleClassSelect = useCallback((cls: ObjectClass) => {
    setSelectedClass(cls);
    setSelectedMember(null);
  }, []);

  const handleMemberSelect = useCallback(
    (member: ObjectMember) => {
      setSelectedMember(member);
      if (onMemberSelect && selectedClass) {
        const lib = libraries.find(l => l.classes.includes(selectedClass));
        if (lib) {
          onMemberSelect(lib.name, selectedClass.name, member);
        }
      }
    },
    [selectedClass, libraries, onMemberSelect]
  );

  const handleCopy = useCallback(() => {
    if (selectedMember && onCopyText) {
      onCopyText(getMemberSignature(selectedMember));
    }
  }, [selectedMember, onCopyText, getMemberSignature]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width,
      height,
      backgroundColor: '#F0F0F0',
      border: '1px solid #808080',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontSize: '12px',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      backgroundColor: '#E0E0E0',
      borderBottom: '1px solid #808080',
    },
    searchInput: {
      flex: 1,
      padding: '2px 4px',
      border: '1px solid #808080',
      fontSize: '12px',
    },
    librarySelect: {
      padding: '2px 4px',
      border: '1px solid #808080',
      fontSize: '12px',
      minWidth: '150px',
    },
    contentArea: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    classPanel: {
      width: '200px',
      borderRight: '1px solid #808080',
      overflow: 'auto',
      backgroundColor: '#FFFFFF',
    },
    memberPanel: {
      flex: 1,
      overflow: 'auto',
      backgroundColor: '#FFFFFF',
    },
    listItem: {
      padding: '2px 8px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    listItemSelected: {
      backgroundColor: '#0078D7',
      color: '#FFFFFF',
    },
    detailPanel: {
      borderTop: '1px solid #808080',
      padding: '8px',
      backgroundColor: '#FFFFFF',
      minHeight: '80px',
    },
    detailTitle: {
      fontWeight: 'bold',
      marginBottom: '4px',
      fontFamily: 'Consolas, monospace',
    },
    detailDescription: {
      color: '#333333',
      marginTop: '8px',
    },
    panelHeader: {
      padding: '4px 8px',
      backgroundColor: '#E0E0E0',
      borderBottom: '1px solid #808080',
      fontWeight: 'bold',
      fontSize: '11px',
    },
    checkbox: {
      marginLeft: '8px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <select
          style={styles.librarySelect}
          value={selectedLibrary}
          onChange={e => {
            setSelectedLibrary(e.target.value);
            setSelectedClass(null);
            setSelectedMember(null);
          }}
        >
          <option value="<All Libraries>">&lt;All Libraries&gt;</option>
          {libraries.map(lib => (
            <option key={lib.name} value={lib.name}>
              {lib.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />

        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={e => setShowHidden(e.target.checked)}
          />
          Show Hidden
        </label>

        <button onClick={handleCopy} disabled={!selectedMember}>
          Copy
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.contentArea}>
        {/* Classes Panel */}
        <div style={styles.classPanel}>
          <div style={styles.panelHeader}>Classes</div>
          {filteredClasses.map(({ library, cls }) => (
            <div
              key={`${library.name}-${cls.name}`}
              style={{
                ...styles.listItem,
                ...(selectedClass === cls ? styles.listItemSelected : {}),
              }}
              onClick={() => handleClassSelect(cls)}
              title={cls.description}
            >
              {getClassIcon(cls.type)} {cls.name}
            </div>
          ))}
        </div>

        {/* Members Panel */}
        <div style={styles.memberPanel}>
          <div style={styles.panelHeader}>Members of '{selectedClass?.name || ''}'</div>
          {filteredMembers.map((member, idx) => (
            <div
              key={`${member.name}-${idx}`}
              style={{
                ...styles.listItem,
                ...(selectedMember === member ? styles.listItemSelected : {}),
              }}
              onClick={() => handleMemberSelect(member)}
              title={member.description}
            >
              {getMemberIcon(member.type)} {member.name}
              {member.isDefault && ' *'}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={styles.detailPanel}>
        {selectedMember ? (
          <>
            <div style={styles.detailTitle}>{getMemberSignature(selectedMember)}</div>
            {selectedMember.description && (
              <div style={styles.detailDescription}>{selectedMember.description}</div>
            )}
          </>
        ) : selectedClass ? (
          <>
            <div style={styles.detailTitle}>
              {selectedClass.type === 'class' ? 'Class' : selectedClass.type} {selectedClass.name}
            </div>
            {selectedClass.description && (
              <div style={styles.detailDescription}>{selectedClass.description}</div>
            )}
          </>
        ) : (
          <div style={styles.detailDescription}>Select a class or member to view details</div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Object Browser Dialog
// ============================================================================

interface VB6ObjectBrowserDialogProps {
  isOpen: boolean;
  libraries?: ObjectLibrary[];
  onClose: () => void;
  onMemberSelect?: (library: string, className: string, member: ObjectMember) => void;
}

export const VB6ObjectBrowserDialog: React.FC<VB6ObjectBrowserDialogProps> = ({
  isOpen,
  libraries,
  onClose,
  onMemberSelect,
}) => {
  if (!isOpen) return null;

  const dialogStyles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    },
    dialog: {
      width: '800px',
      height: '600px',
      backgroundColor: '#F0F0F0',
      border: '2px solid #333333',
      display: 'flex',
      flexDirection: 'column',
    },
    titleBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 8px',
      backgroundColor: '#000080',
      color: '#FFFFFF',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '0 4px',
    },
    content: {
      flex: 1,
      overflow: 'hidden',
    },
  };

  return (
    <div style={dialogStyles.overlay} onClick={onClose}>
      <div style={dialogStyles.dialog} onClick={e => e.stopPropagation()}>
        <div style={dialogStyles.titleBar}>
          <span>Object Browser</span>
          <button style={dialogStyles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={dialogStyles.content}>
          <VB6ObjectBrowser libraries={libraries} onMemberSelect={onMemberSelect} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default {
  VB6ObjectBrowser,
  VB6ObjectBrowserDialog,
  VB6_RUNTIME_LIBRARY,
  VB6_FORMS_LIBRARY,
};
