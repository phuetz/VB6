/**
 * VB6 Service Types - Shared type definitions for services
 *
 * Provides strict typing for common patterns across VB6 services:
 * - Value types (VB6Value, DebugValue, PropertyValue)
 * - Event callbacks and handlers
 * - COM/ActiveX related types
 * - Debug and test framework types
 */

// ============================================================================
// FUNDAMENTAL VALUE TYPES
// ============================================================================

/** Scalar values that VB6 supports */
export type VB6Scalar = string | number | boolean | Date | null | undefined;

/** VB6 value - can be scalar, object, or array */
export type VB6Value = VB6Scalar | VB6Object | VB6Array;

/** VB6 object with string keys */
export type VB6Object = Record<string, unknown>;

/** VB6 array of values */
export type VB6Array = unknown[];

/** Property value for controls and objects */
export type PropertyValue = VB6Scalar | VB6Object;

// ============================================================================
// COM/ACTIVEX TYPES
// ============================================================================

/** COM property value */
export type COMPropertyValue = VB6Scalar | VB6Object | VB6Array;

/** COM object proxy - represents a late-bound COM object */
export interface COMObjectProxy {
  __progId?: string;
  __clsId?: string;
  [key: string]: unknown;
}

/** IDispatch parameter for Invoke calls */
export type DispatchParameter = unknown;

/** IDispatch result from Invoke calls */
export type DispatchResult = unknown;

/** Type library representation */
export interface TypeLibrary {
  guid: string;
  version: string;
  name: string;
  description?: string;
  types: Map<string, TypeInfo>;
}

/** Type information for COM types */
export interface TypeInfo {
  name: string;
  guid?: string;
  kind: 'class' | 'interface' | 'enum' | 'struct';
  members?: TypeMember[];
}

/** Member of a type (method, property, constant) */
export interface TypeMember {
  name: string;
  kind: 'method' | 'property' | 'constant';
  type?: string;
  dispId?: number;
}

// ============================================================================
// DEBUGGER TYPES
// ============================================================================

/** Value in debug context - can be any runtime value */
export type DebugValue = unknown;

/** Execution context for debugger */
export interface ExecutionContext {
  variables: Map<string, DebugValue>;
  scope: 'local' | 'module' | 'global';
  procedure?: string;
  module?: string;
  line?: number;
}

/** Debug event data - union of possible event payloads */
export type DebugEventData =
  | BreakpointEventData
  | StepEventData
  | ExceptionEventData
  | OutputEventData
  | StatusChangedEventData;

export interface BreakpointEventData {
  type: 'breakpoint';
  breakpointId: string;
  file: string;
  line: number;
}

export interface StepEventData {
  type: 'step';
  file: string;
  line: number;
  column?: number;
}

export interface ExceptionEventData {
  type: 'exception';
  message: string;
  errorType: string;
  stackTrace: string;
}

export interface OutputEventData {
  type: 'output';
  category: 'stdout' | 'stderr' | 'debug';
  output: string;
}

export interface StatusChangedEventData {
  type: 'statusChanged';
  oldStatus: string;
  newStatus: string;
}

// ============================================================================
// TEST FRAMEWORK TYPES
// ============================================================================

/** Value used in test assertions */
export type TestValue = unknown;

/** Test environment context */
export interface TestEnvironment {
  [key: string]: unknown;
}

/** Mock implementation function */
export type MockImplementation = (...args: unknown[]) => unknown;

/** Mock call arguments */
export type MockCallArgs = unknown[];

// ============================================================================
// EVENT EMITTER TYPES
// ============================================================================

/** Generic event callback */
export type EventCallback<T = unknown> = (data: T) => void;

/** Generic event listener with multiple arguments */
export type EventListener = (...args: unknown[]) => unknown;

/** Event handler that may be async */
export type AsyncEventHandler<T = unknown> = (data: T) => void | Promise<void>;

// ============================================================================
// DATABASE/ADO TYPES
// ============================================================================

/** Field value in ADO/database context */
export type FieldValue = VB6Scalar | Buffer | Blob;

/** Record/row from database query */
export type RecordData = Record<string, FieldValue>;

/** Query result set */
export type QueryResult = RecordData[];

// ============================================================================
// REPORT ENGINE TYPES
// ============================================================================

/** Report data row */
export type ReportDataRow = Record<string, VB6Value>;

/** Report parameter value */
export type ReportParameterValue = VB6Scalar;

// ============================================================================
// FILE FORMAT TYPES
// ============================================================================

/** Parsed metadata from VB6 files */
export interface ParsedMetadata {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  [key: string]: unknown;
}

/** Control definition from form file */
export interface ControlDefinition {
  type: string;
  name: string;
  properties: Record<string, PropertyValue>;
  children?: ControlDefinition[];
}

/** Procedure/function info extracted from code */
export interface ProcedureInfo {
  name: string;
  type: 'sub' | 'function' | 'property';
  visibility: 'public' | 'private' | 'friend';
  parameters?: ParameterInfo[];
  returnType?: string;
  startLine: number;
  endLine: number;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  optional: boolean;
  byRef: boolean;
  defaultValue?: VB6Scalar;
}

// ============================================================================
// ADO/DATABASE EXTENDED TYPES
// ============================================================================

/** ADO value type - scalar, binary, or Variant */
export type ADOValue = VB6Scalar | ArrayBuffer | Uint8Array;

/** ADO record (row data) */
export type ADORecord = Record<string, ADOValue>;

/** ADO bookmark for record positioning */
export type ADOBookmark = string | number;

/** ADO data source - array of records */
export type ADODataSource = ADORecord[];

/** ADO data format object */
export interface ADODataFormat {
  format: string;
  options?: Record<string, unknown>;
}

/** ADO restrictions for schema queries */
export type ADOSchemaRestrictions = (string | number | boolean | null)[];

// ============================================================================
// ACTIVEX EXTENDED TYPES
// ============================================================================

/** ActiveX property value */
export type ActiveXPropertyValue = VB6Scalar | VB6Object | VB6Array;

/** ActiveX property map */
export type ActiveXPropertyMap = Record<string, ActiveXPropertyValue>;

/** ActiveX method function */
export type ActiveXMethod = (...args: unknown[]) => unknown;

/** ActiveX method map */
export type ActiveXMethodMap = Record<string, ActiveXMethod>;

/** ActiveX event handler error */
export interface ActiveXError {
  name: string;
  message: string;
  code?: number;
  stack?: string;
}

/** ActiveX navigation POST data */
export type ActiveXPostData = string | ArrayBuffer | FormData;

// ============================================================================
// HOT RELOAD TYPES
// ============================================================================

/** AST metadata attached to nodes */
export type ASTMetadata = Record<string, unknown>;

/** Hot reload event listener */
export type HotReloadListener = (data: HotReloadEventData) => void;

/** Hot reload event data union */
export type HotReloadEventData =
  | HotReloadBeforeReloadEvent
  | HotReloadAfterReloadEvent
  | HotReloadErrorEvent
  | HotReloadRollbackEvent
  | HotReloadCompilationEvent;

export interface HotReloadBeforeReloadEvent {
  type: 'beforeReload';
  filePath: string;
  codeLength: number;
}

export interface HotReloadAfterReloadEvent {
  type: 'afterReload';
  patch: unknown;
  metrics: HotReloadMetrics;
}

export interface HotReloadErrorEvent {
  type: 'error';
  error: Error;
  filePath: string;
}

export interface HotReloadRollbackEvent {
  type: 'rollback';
  reason: unknown;
  patch: unknown;
}

export interface HotReloadCompilationEvent {
  type: 'compilationComplete';
  compilationType: 'full' | 'incremental';
}

export interface HotReloadMetrics {
  totalReloads: number;
  averageReloadTime: number;
  incrementalCompileTime: number;
  astDiffTime: number;
  statePreservationTime: number;
  errorCount: number;
  rollbackCount: number;
}

/** Control state snapshot for hot reload */
export interface HotReloadControlState {
  id: string;
  type: string;
  value?: unknown;
  properties: Record<string, unknown>;
}

/** Application state for hot reload preservation */
export interface HotReloadAppState {
  controlStates: Record<string, HotReloadControlState>;
  variableValues: Record<string, unknown>;
  formProperties: Record<string, unknown>;
  executionContext: unknown;
}

/** Parsed AST from parser - generic structure */
export interface ParsedAST {
  type: string;
  name?: string;
  identifier?: string;
  text?: string;
  children?: ParsedAST[];
  metadata?: ASTMetadata;
}

// ============================================================================
// ADVANCED DEBUGGER TYPES
// ============================================================================

/** Evaluation context - variables and built-in functions */
export type EvaluationContext = Record<string, unknown>;

/** Memory snapshot for profiling */
export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

// ============================================================================
// DATA ENVIRONMENT TYPES
// ============================================================================

/** Value type for data parameters and fields */
export type DataParameterValue = VB6Scalar;

/** Record from data environment query */
export type DataEnvRecord = Record<string, DataParameterValue>;

/** Data environment event payload */
export type DataEnvEventPayload = Record<string, unknown>;

// ============================================================================
// ADD-IN MANAGER TYPES
// ============================================================================

/** Add-in setting value */
export type AddInSettingValue = VB6Scalar | VB6Object | VB6Array;

/** Add-in event data payload */
export type AddInEventPayload = Record<string, unknown>;

/** IDE context object reference (form, project, module, control) */
export interface IDEObjectReference {
  name: string;
  type: string;
  properties?: Record<string, unknown>;
}

/** IDE control reference */
export interface IDEControlReference {
  name: string;
  type: string;
  container?: string;
}

// ============================================================================
// INTELLISENSE ENGINE TYPES
// ============================================================================

/** Parsed context from IntelliSense analysis */
export interface ParsedIntelliSenseContext {
  ast: unknown;
  currentLine: string;
  beforeCursor: string;
  afterCursor: string;
  contextType: string;
  codeWindow: string;
}

/** Command arguments for IntelliSense */
export type CommandArguments = unknown[];

/** Stored pattern data from JSON */
export interface StoredPatternData {
  id: string;
  pattern: string;
  context: string;
  frequency: number;
  lastUsed: string;
  suggestions: string[];
  category: string;
}

// ============================================================================
// COMPILER TYPES
// ============================================================================

/** Compiler variable value */
export type CompilerVariableValue = unknown;

/** Form definition for compilation */
export interface FormDefinition {
  name: string;
  properties?: Record<string, unknown>;
  controls?: ControlDefinitionCompiler[];
}

/** Control definition for compiler */
export interface ControlDefinitionCompiler {
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: Record<string, unknown>;
}

/** Class module definition for compilation */
export interface ClassModuleDefinition {
  name: string;
  content?: string;
}

/** Variable definition for compilation */
export interface VariableDefinition {
  name: string;
  type: string;
  value?: unknown;
}

/** Constant definition for compilation */
export interface ConstantDefinition {
  name: string;
  value: VB6Scalar;
}

/** Regex conversion pattern */
export type ConversionPattern = [RegExp, string | ((...args: string[]) => string)];

/** Default values map */
export type DefaultValuesMap = Record<string, VB6Scalar | Date | null>

// ============================================================================
// LOGGING SERVICE TYPES
// ============================================================================

/** Log argument - can be any value for console output */
export type LogArgument = unknown;

/** Log arguments array */
export type LogArguments = LogArgument[];

/** Tabular data for console.table */
export type TableData = Record<string, unknown> | unknown[];

// ============================================================================
// PROPERTY SYSTEM TYPES
// ============================================================================

/** Property accessor function signature */
export type PropertyAccessor = (...args: unknown[]) => unknown;

/** Property accessor map for an instance */
export type PropertyAccessorMap = Map<string, PropertyAccessor>;

/** Property arguments for indexed properties */
export type PropertyArgs = unknown[];

/** Property value store for runtime */
export interface VB6PropertyValue {
  value: PropertyValue;
  type: string;
  isObject: boolean;
  lastModified: Date;
  accessCount: number;
}

/** Instance statistics */
export interface InstanceStats {
  instanceId: string;
  propertyCount: number;
  totalAccesses: number;
  properties: PropertyStatInfo[];
}

/** Property statistics info */
export interface PropertyStatInfo {
  name: string;
  type: string;
  isObject: boolean;
  accessCount: number;
  lastModified: Date;
}

// ============================================================================
// USER CONTROL TYPES
// ============================================================================

/** User control property values map */
export type UserControlPropertyValues = Record<string, PropertyValue>;

/** User control event data payload */
export type UserControlEventData = Record<string, unknown>;

/** User control code execution context variables */
export type UserControlCodeVars = Record<string, unknown>;

/** Global VB6 user controls registry */
export interface VB6UserControlsGlobal {
  [controlName: string]: {
    definition: unknown;
    create: (props?: UserControlPropertyValues) => unknown;
  };
}

// ============================================================================
// REPORT ENGINE EXTENDED TYPES
// ============================================================================

/** Report context for generation */
export interface ReportGenerationContext {
  data: ReportDataRow[];
  parameters: ReportParameters;
  pageNumber: number;
  totalPages: number;
  currentRecord: ReportDataRow;
  recordNumber: number;
  totalRecords: number;
  groupValues: ReportParameters;
  formulas: ReportParameters;
}

/** Report parameters map */
export type ReportParameters = Record<string, ReportParameterValue | VB6Value>;

/** Grouped report data */
export interface ReportDataGroup {
  key: string;
  data: ReportDataRow[];
}

/** Formula evaluation result */
export type FormulaResult = VB6Value | '#ERROR'
