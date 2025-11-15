/**
 * VB6 Runtime - Central Export
 *
 * This module exports all VB6 runtime components for easy importing.
 * Complete Visual Basic 6.0 compatibility layer.
 */

// Core Runtime Functions
export { createRuntimeFunctions, basicTranspile } from './VB6Runtime';
export type { VB6RuntimeProps } from './VB6Runtime';

// Extended Runtime Library (100+ functions)
export { default as VB6RuntimeExtended } from './VB6RuntimeExtended';

// Control Flow (Select Case, ReDim, Exit, GoTo)
export {
  VB6SelectCaseEvaluator,
  VB6ReDimManager,
  VB6ExitException,
  VB6GoToException,
  VB6ControlFlowManager,
} from './VB6ControlFlow';

// Control Methods (Form, List, Graphics, TreeView, etc.)
export {
  VB6Form,
  VB6ListControl,
  VB6PictureBox,
  VB6TreeView,
  VB6ListView,
  VB6ControlMethods,
  DoEvents,
} from './VB6ControlMethods';

// Global Objects (App, Screen, Printer, Debug, Err, etc.)
export {
  VB6App,
  VB6Screen,
  VB6Printer,
  VB6PrintersCollection,
  VB6FormsCollection,
  VB6FontsCollection,
  VB6Debug,
  VB6Err,
  App,
  Screen,
  Printer,
  Printers,
  Forms,
  Debug,
  Err,
} from './VB6GlobalObjects';

// Graphics Methods (Line, Circle, PSet, Point, etc.)
export { VB6GraphicsMethods, VB6DrawingContext, VB6GraphicsConstants } from './VB6GraphicsMethods';

// File System Operations
export { VB6FileSystem, VB6FileSystemObject, VB6TextStream } from './VB6FileSystem';

// Error Handling
export { VB6ErrorHandler, VB6ErrorInfo, OnError, Resume } from './VB6ErrorHandling';

/**
 * Complete VB6 Runtime Environment
 *
 * Usage:
 * ```typescript
 * import { createRuntimeFunctions, App, Screen, VB6Form } from '@/components/Runtime';
 *
 * const runtime = createRuntimeFunctions(
 *   (msg) => console.log(msg),
 *   (err) => console.error(err)
 * );
 *
 * // Use VB6 functions
 * runtime.MsgBox("Hello from VB6!");
 *
 * // Access global objects
 * console.log(App.Title);
 * console.log(Screen.Width);
 *
 * // Use control methods
 * VB6Form.Show(myForm);
 * ```
 */
export default {
  createRuntimeFunctions,
  VB6RuntimeExtended,
  VB6SelectCaseEvaluator,
  VB6ReDimManager,
  VB6ControlFlowManager,
  VB6Form,
  VB6ListControl,
  VB6PictureBox,
  VB6TreeView,
  VB6ListView,
  VB6ControlMethods,
  DoEvents,
  App,
  Screen,
  Printer,
  Printers,
  Forms,
  Debug,
  Err,
  VB6GraphicsMethods,
  VB6FileSystem,
  VB6ErrorHandler,
};
