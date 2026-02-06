# VB6 Web Compiler - API Reference

## Vue d'ensemble

Cette référence API décrit toutes les interfaces, classes et fonctions disponibles dans le compilateur VB6 Web. L'API est organisée en modules fonctionnels pour faciliter l'utilisation et la maintenance.

## Table des Matières

1. [Core Compiler API](#core-compiler-api)
2. [Runtime Functions](#runtime-functions)
3. [AST Nodes](#ast-nodes)
4. [Error Handling](#error-handling)
5. [Plugin System](#plugin-system)
6. [Configuration](#configuration)
7. [Utilities](#utilities)

## Core Compiler API

### VB6Compiler

La classe principale pour compiler du code VB6.

```typescript
class VB6Compiler {
  constructor(options?: CompilerOptions);

  // Méthodes principales
  compile(source: string): CompilationResult;
  compileFile(filePath: string): Promise<CompilationResult>;
  compileProject(projectPath: string): Promise<ProjectCompilationResult>;

  // Configuration
  setOptions(options: Partial<CompilerOptions>): void;
  getOptions(): CompilerOptions;

  // Diagnostics
  validate(source: string): ValidationResult;
  getAST(source: string): ProgramNode;
  getTokens(source: string): Token[];
}
```

#### CompilerOptions

```typescript
interface CompilerOptions {
  // Options de compilation
  target: 'ES5' | 'ES2015' | 'ES2020' | 'ESNEXT';
  strict: boolean;
  optimize: boolean;
  generateSourceMaps: boolean;

  // Options de comportement VB6
  optionExplicit: boolean;
  optionBase: 0 | 1;
  optionCompare: 'Binary' | 'Text';

  // Options de runtime
  includeRuntime: boolean;
  runtimePath?: string;
  polyfills: string[];

  // Options de debug
  debug: boolean;
  verboseLogging: boolean;
  preserveComments: boolean;

  // Options de performance
  memoryLimit: number;
  timeoutMs: number;
  parallelProcessing: boolean;
}
```

#### CompilationResult

```typescript
interface CompilationResult {
  success: boolean;
  source: string;
  transpiledCode: string;
  sourceMap?: string;

  // Diagnostics
  errors: CompilerError[];
  warnings: CompilerWarning[];
  metrics: CompilationMetrics;

  // AST et métadonnées
  ast?: ProgramNode;
  symbols?: SymbolTable;
  dependencies?: string[];
}

interface CompilationMetrics {
  lexTime: number;
  parseTime: number;
  analyzeTime: number;
  transpileTime: number;
  totalTime: number;

  sourceLines: number;
  outputLines: number;
  memoryUsed: number;

  tokensCount: number;
  astNodesCount: number;
  symbolsCount: number;
}
```

### VB6Lexer

Analyseur lexical pour tokeniser le code VB6.

```typescript
class VB6Lexer {
  constructor(source: string, options?: LexerOptions);

  tokenize(): Token[];
  nextToken(): Token;
  peek(offset?: number): Token;

  getCurrentPosition(): Position;
  hasError(): boolean;
  getErrors(): LexerError[];
}

interface Token {
  type: TokenType;
  value: string;
  position: Position;
  metadata?: TokenMetadata;
}

enum TokenType {
  // Identifiers et literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',

  // Mots-clés
  KEYWORD = 'KEYWORD',

  // Opérateurs
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  INTEGER_DIVIDE = 'INTEGER_DIVIDE',
  MODULO = 'MODULO',
  POWER = 'POWER',
  CONCATENATE = 'CONCATENATE',

  // Comparaison
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_EQUAL = 'GREATER_EQUAL',

  // Logique
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  XOR = 'XOR',
  EQV = 'EQV',
  IMP = 'IMP',

  // Délimiteurs
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  DOT = 'DOT',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',

  // Structure
  NEWLINE = 'NEWLINE',
  WHITESPACE = 'WHITESPACE',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
}

interface Position {
  line: number;
  column: number;
  offset: number;
}
```

### VB6Parser

Analyseur syntaxique pour construire l'AST.

```typescript
class VB6Parser {
  constructor(tokens: Token[], options?: ParserOptions);

  parse(): ProgramNode;
  parseStatement(): StatementNode;
  parseExpression(): ExpressionNode;
  parseDeclaration(): DeclarationNode;

  hasError(): boolean;
  getErrors(): ParserError[];
  getWarnings(): ParserWarning[];
}

interface ParserOptions {
  allowPartialParsing: boolean;
  maxErrors: number;
  enableRecovery: boolean;
  preserveWhitespace: boolean;
}
```

### VB6SemanticAnalyzer

Analyseur sémantique pour la vérification de types et de cohérence.

```typescript
class VB6SemanticAnalyzer {
  constructor(options?: AnalyzerOptions);

  analyze(ast: ProgramNode): AnalysisResult;
  checkTypes(node: ASTNode): TypeCheckResult;
  resolveSymbols(ast: ProgramNode): SymbolTable;

  addBuiltinSymbols(): void;
  defineCustomType(name: string, definition: TypeDefinition): void;
}

interface AnalysisResult {
  success: boolean;
  ast: ProgramNode;
  symbolTable: SymbolTable;
  errors: SemanticError[];
  warnings: SemanticWarning[];
  typeInfo: TypeInformation;
}

interface SymbolTable {
  enterScope(scopeName?: string): void;
  exitScope(): void;
  declare(name: string, symbol: Symbol): boolean;
  lookup(name: string): Symbol | undefined;
  resolve(name: string): Symbol | undefined;
  getCurrentScope(): Scope;
  getAllScopes(): Scope[];
}

interface Symbol {
  name: string;
  type: VB6Type;
  kind: SymbolKind;
  scope: Scope;
  declaration: ASTNode;
  usages: ASTNode[];
  metadata?: SymbolMetadata;
}

enum SymbolKind {
  VARIABLE = 'VARIABLE',
  CONSTANT = 'CONSTANT',
  FUNCTION = 'FUNCTION',
  SUB = 'SUB',
  PROPERTY = 'PROPERTY',
  TYPE = 'TYPE',
  ENUM = 'ENUM',
  CLASS = 'CLASS',
  MODULE = 'MODULE',
}
```

### VB6Transpiler

Générateur de code JavaScript.

```typescript
class VB6Transpiler {
  constructor(options?: TranspilerOptions);

  transpile(ast: ProgramNode): TranspileResult;
  transpileNode(node: ASTNode): string;
  transpileExpression(expr: ExpressionNode): string;
  transpileStatement(stmt: StatementNode): string;

  setTemplate(nodeType: string, template: CodeTemplate): void;
  addRuntime(runtimeModule: string): void;
}

interface TranspileResult {
  code: string;
  sourceMap?: string;
  dependencies: string[];
  runtimeModules: string[];
}

interface TranspilerOptions {
  target: JavaScriptTarget;
  minify: boolean;
  generateComments: boolean;
  includeDebugInfo: boolean;
  useStrict: boolean;
  moduleSystem: 'CommonJS' | 'ES6' | 'AMD' | 'UMD';
}
```

## Runtime Functions

### VB6Runtime

Module principal du runtime VB6.

```typescript
class VB6Runtime {
  static String: VB6StringFunctions;
  static Math: VB6MathFunctions;
  static DateTime: VB6DateTimeFunctions;
  static Conversion: VB6ConversionFunctions;
  static FileSystem: VB6FileSystemFunctions;
  static Array: VB6ArrayFunctions;
  static Debug: VB6DebugFunctions;
  static Err: VB6ErrorObject;

  static initialize(): void;
  static cleanup(): void;
  static getVersion(): string;
}
```

### String Functions

```typescript
interface VB6StringFunctions {
  // Fonctions de base
  Len(str: string): number;
  Left(str: string, length: number): string;
  Right(str: string, length: number): string;
  Mid(str: string, start: number, length?: number): string;

  // Recherche et remplacement
  InStr(start: number, str1: string, str2: string, compare?: CompareMethod): number;
  InStr(str1: string, str2: string, compare?: CompareMethod): number;
  InStrRev(str1: string, str2: string, start?: number, compare?: CompareMethod): number;
  Replace(
    expr: string,
    find: string,
    replace: string,
    start?: number,
    count?: number,
    compare?: CompareMethod
  ): string;

  // Transformation
  UCase(str: string): string;
  LCase(str: string): string;
  Trim(str: string): string;
  LTrim(str: string): string;
  RTrim(str: string): string;

  // Génération
  Space(number: number): string;
  String(number: number, character: string | number): string;

  // Manipulation
  StrReverse(str: string): string;
  StrConv(str: string, conversion: VbStrConv, localeID?: number): string;

  // Arrays
  Split(expression: string, delimiter?: string, limit?: number, compare?: CompareMethod): string[];
  Join(sourceArray: string[], delimiter?: string): string;
  Filter(
    sourceArray: string[],
    match: string,
    include?: boolean,
    compare?: CompareMethod
  ): string[];

  // Comparaison
  StrComp(str1: string, str2: string, compare?: CompareMethod): CompareResult;
  Like(str: string, pattern: string): boolean;

  // Conversion
  Asc(str: string): number;
  AscW(str: string): number;
  Chr(charCode: number): string;
  ChrW(charCode: number): string;

  // Formatage
  Format(expression: any, format?: string): string;
  FormatCurrency(
    expression: number,
    numDigitsAfterDecimal?: number,
    includeLeadingDigit?: TriState,
    useParensForNegativeNumbers?: TriState,
    groupDigits?: TriState
  ): string;
  FormatDateTime(date: Date, namedFormat?: VbDateTimeFormat): string;
  FormatNumber(
    expression: number,
    numDigitsAfterDecimal?: number,
    includeLeadingDigit?: TriState,
    useParensForNegativeNumbers?: TriState,
    groupDigits?: TriState
  ): string;
  FormatPercent(
    expression: number,
    numDigitsAfterDecimal?: number,
    includeLeadingDigit?: TriState,
    useParensForNegativeNumbers?: TriState,
    groupDigits?: TriState
  ): string;
}

enum CompareMethod {
  Binary = 0,
  Text = 1,
}
```

### Math Functions

```typescript
interface VB6MathFunctions {
  // Fonctions de base
  Abs(number: number): number;
  Sgn(number: number): number;
  Sqr(number: number): number;

  // Fonctions trigonométriques
  Sin(number: number): number;
  Cos(number: number): number;
  Tan(number: number): number;
  Atn(number: number): number;

  // Fonctions exponentielles et logarithmiques
  Exp(number: number): number;
  Log(number: number): number;

  // Fonctions de troncature
  Int(number: number): number;
  Fix(number: number): number;
  Round(number: number, numDigitsAfterDecimal?: number): number;

  // Fonctions aléatoires
  Rnd(number?: number): number;
  Randomize(number?: number): void;

  // Utilitaires
  Timer(): number;
}
```

### DateTime Functions

```typescript
interface VB6DateTimeFunctions {
  // Fonctions courantes
  Now(): Date;
  Date(): Date;
  Time(): Date;

  // Extraction de composants
  Year(date: Date): number;
  Month(date: Date): number;
  Day(date: Date): number;
  Hour(date: Date): number;
  Minute(date: Date): number;
  Second(date: Date): number;
  Weekday(date: Date, firstDayOfWeek?: VbDayOfWeek): number;

  // Construction de dates
  DateSerial(year: number, month: number, day: number): Date;
  TimeSerial(hour: number, minute: number, second: number): Date;
  DateValue(date: string): Date;
  TimeValue(time: string): Date;

  // Manipulation de dates
  DateAdd(interval: string, number: number, date: Date): Date;
  DateDiff(
    interval: string,
    date1: Date,
    date2: Date,
    firstDayOfWeek?: VbDayOfWeek,
    firstWeekOfYear?: VbFirstWeekOfYear
  ): number;
  DatePart(
    interval: string,
    date: Date,
    firstDayOfWeek?: VbDayOfWeek,
    firstWeekOfYear?: VbFirstWeekOfYear
  ): number;

  // Validation
  IsDate(expression: any): boolean;

  // Formatage
  MonthName(month: number, abbreviate?: boolean): string;
  WeekdayName(weekday: VbDayOfWeek, abbreviate?: boolean, firstDayOfWeek?: VbDayOfWeek): string;
}

enum VbDayOfWeek {
  vbUseSystemDayOfWeek = 0,
  vbSunday = 1,
  vbMonday = 2,
  vbTuesday = 3,
  vbWednesday = 4,
  vbThursday = 5,
  vbFriday = 6,
  vbSaturday = 7,
}
```

### Conversion Functions

```typescript
interface VB6ConversionFunctions {
  // Conversions numériques
  CByte(expression: any): number;
  CInt(expression: any): number;
  CLng(expression: any): number;
  CSng(expression: any): number;
  CDbl(expression: any): number;
  CCur(expression: any): number;
  CDec(expression: any): number;

  // Conversions de type
  CBool(expression: any): boolean;
  CDate(expression: any): Date;
  CStr(expression: any): string;
  CVar(expression: any): any;
  CVErr(errorNumber: number): Error;

  // Fonctions de conversion texte/nombre
  Val(string: string): number;
  Str(number: number): string;
  Hex(number: number): string;
  Oct(number: number): string;

  // Validation de type
  IsArray(varname: any): boolean;
  IsDate(expression: any): boolean;
  IsEmpty(expression: any): boolean;
  IsError(expression: any): boolean;
  IsMissing(argName: any): boolean;
  IsNull(expression: any): boolean;
  IsNumeric(expression: any): boolean;
  IsObject(expression: any): boolean;

  // Informations de type
  TypeName(varname: any): string;
  VarType(varname: any): VbVarType;
}

enum VbVarType {
  vbEmpty = 0,
  vbNull = 1,
  vbInteger = 2,
  vbLong = 3,
  vbSingle = 4,
  vbDouble = 5,
  vbCurrency = 6,
  vbDate = 7,
  vbString = 8,
  vbObject = 9,
  vbError = 10,
  vbBoolean = 11,
  vbVariant = 12,
  vbDataObject = 13,
  vbDecimal = 14,
  vbByte = 17,
  vbUserDefinedType = 36,
  vbArray = 8192,
}
```

### Array Functions

```typescript
interface VB6ArrayFunctions {
  // Informations sur les arrays
  UBound(arrayName: any[], dimension?: number): number;
  LBound(arrayName: any[], dimension?: number): number;

  // Manipulation d'arrays
  ReDim<T>(arrayName: T[], ...bounds: number[]): void;
  ReDimPreserve<T>(arrayName: T[], ...bounds: number[]): void;
  Erase(...arrays: any[][]): void;

  // Création d'arrays
  Array(...values: any[]): any[];

  // Utilitaires
  IsArray(varname: any): boolean;
}
```

### File System Functions

```typescript
interface VB6FileSystemFunctions {
  // Navigation de fichiers
  Dir(pathName?: string, attributes?: VbFileAttribute): string;
  ChDir(path: string): void;
  ChDrive(drive: string): void;
  CurDir(drive?: string): string;

  // Informations de fichiers
  FileLen(pathName: string): number;
  FileDateTime(pathName: string): Date;
  FileExists(pathName: string): boolean;
  GetAttr(pathName: string): VbFileAttribute;
  SetAttr(pathName: string, attributes: VbFileAttribute): void;

  // Opérations sur fichiers
  Kill(pathName: string): void;
  Name(oldPathName: string, newPathName: string): void;
  MkDir(path: string): void;
  RmDir(path: string): void;

  // I/O de fichiers
  FreeFile(rangeNumber?: number): number;
  Open(
    pathName: string,
    mode: VbIOMode,
    access?: VbAccessMode,
    lock?: VbLockType,
    fileNumber?: number
  ): void;
  Close(...fileNumbers: number[]): void;
  Reset(): void;

  // Lecture/Écriture
  EOF(fileNumber: number): boolean;
  LOF(fileNumber: number): number;
  Loc(fileNumber: number): number;
  Seek(fileNumber: number, position?: number): number;

  Input(length: number, fileNumber: number): string;
  LineInput(fileNumber: number): string;
  InputB(length: number, fileNumber: number): any;

  Print(fileNumber: number, ...outputList: any[]): void;
  Write(fileNumber: number, ...outputList: any[]): void;

  // Fonctions spéciales
  Spc(n: number): string;
  Tab(n?: number): string;
}

enum VbFileAttribute {
  vbNormal = 0,
  vbReadOnly = 1,
  vbHidden = 2,
  vbSystem = 4,
  vbDirectory = 16,
  vbArchive = 32,
}

enum VbIOMode {
  Input = 1,
  Output = 2,
  Random = 3,
  Append = 4,
  Binary = 5,
}
```

## AST Nodes

### Base Node Types

```typescript
interface ASTNode {
  type: string;
  position: Position;
  parent?: ASTNode;
  metadata?: NodeMetadata;
}

interface StatementNode extends ASTNode {
  // Base pour tous les statements
}

interface ExpressionNode extends ASTNode {
  valueType?: VB6Type;
  // Base pour toutes les expressions
}

interface DeclarationNode extends ASTNode {
  name: string;
  // Base pour toutes les déclarations
}
```

### Program Structure

```typescript
interface ProgramNode extends ASTNode {
  type: 'Program';
  modules: ModuleNode[];
  forms: FormNode[];
  classes: ClassNode[];
}

interface ModuleNode extends ASTNode {
  type: 'Module';
  name: string;
  declarations: DeclarationNode[];
  procedures: ProcedureNode[];
  options: OptionStatement[];
}

interface FormNode extends ASTNode {
  type: 'Form';
  name: string;
  controls: ControlNode[];
  procedures: ProcedureNode[];
  properties: PropertyDeclaration[];
}

interface ClassNode extends ASTNode {
  type: 'Class';
  name: string;
  members: ClassMemberNode[];
  implements: string[];
}
```

### Declarations

```typescript
interface VariableDeclarationNode extends DeclarationNode {
  type: 'VariableDeclaration';
  variableType: VB6Type;
  initialValue?: ExpressionNode;
  isStatic: boolean;
  visibility: VisibilityModifier;
}

interface FunctionDeclarationNode extends DeclarationNode {
  type: 'FunctionDeclaration';
  parameters: ParameterNode[];
  returnType: VB6Type;
  body: StatementNode[];
  visibility: VisibilityModifier;
  isStatic: boolean;
}

interface SubDeclarationNode extends DeclarationNode {
  type: 'SubDeclaration';
  parameters: ParameterNode[];
  body: StatementNode[];
  visibility: VisibilityModifier;
  isStatic: boolean;
}
```

### Statements

```typescript
interface AssignmentStatementNode extends StatementNode {
  type: 'AssignmentStatement';
  target: ExpressionNode;
  value: ExpressionNode;
  isSet: boolean; // Pour les objets
}

interface IfStatementNode extends StatementNode {
  type: 'IfStatement';
  condition: ExpressionNode;
  thenBranch: StatementNode[];
  elseIfBranches: ElseIfBranch[];
  elseBranch?: StatementNode[];
}

interface ForStatementNode extends StatementNode {
  type: 'ForStatement';
  variable: string;
  startValue: ExpressionNode;
  endValue: ExpressionNode;
  stepValue?: ExpressionNode;
  body: StatementNode[];
}

interface WhileStatementNode extends StatementNode {
  type: 'WhileStatement';
  condition: ExpressionNode;
  body: StatementNode[];
}

interface DoLoopStatementNode extends StatementNode {
  type: 'DoLoopStatement';
  condition?: ExpressionNode;
  body: StatementNode[];
  isWhile: boolean; // true pour While, false pour Until
  conditionAtEnd: boolean; // true pour Do...Loop While/Until
}
```

### Expressions

```typescript
interface BinaryExpressionNode extends ExpressionNode {
  type: 'BinaryExpression';
  left: ExpressionNode;
  operator: BinaryOperator;
  right: ExpressionNode;
}

interface UnaryExpressionNode extends ExpressionNode {
  type: 'UnaryExpression';
  operator: UnaryOperator;
  operand: ExpressionNode;
}

interface CallExpressionNode extends ExpressionNode {
  type: 'CallExpression';
  callee: ExpressionNode;
  arguments: ExpressionNode[];
}

interface MemberExpressionNode extends ExpressionNode {
  type: 'MemberExpression';
  object: ExpressionNode;
  property: string;
  computed: boolean; // true pour obj[prop], false pour obj.prop
}

interface LiteralNode extends ExpressionNode {
  type: 'Literal';
  value: any;
  raw: string;
  literalType: LiteralType;
}
```

## Error Handling

### Error Types

```typescript
interface CompilerError {
  type: 'CompilerError';
  phase: CompilerPhase;
  severity: ErrorSeverity;
  code: string;
  message: string;
  position: Position;
  suggestion?: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}

interface CompilerWarning {
  type: 'CompilerWarning';
  code: string;
  message: string;
  position: Position;
  suggestion?: string;
}

enum CompilerPhase {
  Lexical = 'lexical',
  Syntactic = 'syntactic',
  Semantic = 'semantic',
  CodeGeneration = 'codeGeneration',
}

enum ErrorSeverity {
  Error = 'error',
  Warning = 'warning',
  Information = 'information',
  Hint = 'hint',
}
```

### Error Recovery

```typescript
interface ErrorRecoveryStrategy {
  canRecover(error: CompilerError): boolean;
  recover(parser: VB6Parser, error: CompilerError): RecoveryResult;
}

interface RecoveryResult {
  success: boolean;
  resumePosition: number;
  syntheticNode?: ASTNode;
}
```

## Plugin System

### Plugin Interface

```typescript
interface CompilerPlugin {
  name: string;
  version: string;
  description?: string;

  // Lifecycle hooks
  initialize?(compiler: VB6Compiler): void;
  finalize?(compiler: VB6Compiler): void;

  // Compilation phase hooks
  onPreLex?(source: string): string;
  onPostLex?(tokens: Token[]): Token[];

  onPreParse?(tokens: Token[]): Token[];
  onPostParse?(ast: ProgramNode): ProgramNode;

  onPreAnalyze?(ast: ProgramNode): ProgramNode;
  onPostAnalyze?(
    ast: ProgramNode,
    symbolTable: SymbolTable
  ): { ast: ProgramNode; symbolTable: SymbolTable };

  onPreTranspile?(ast: ProgramNode): ProgramNode;
  onPostTranspile?(code: string): string;

  // Custom transformations
  transformNode?(node: ASTNode): ASTNode;
  addBuiltinFunctions?(): { [name: string]: Function };
  addRuntimeModules?(): string[];
}

class PluginManager {
  register(plugin: CompilerPlugin): void;
  unregister(pluginName: string): void;
  getPlugin(name: string): CompilerPlugin | undefined;
  getPlugins(): CompilerPlugin[];

  executeHook<T>(hookName: string, ...args: any[]): T[];
}
```

## Configuration

### Compiler Configuration

```typescript
interface CompilerConfig {
  // Project settings
  projectName: string;
  projectVersion: string;
  outputDirectory: string;

  // Compilation options
  compiler: CompilerOptions;

  // Runtime options
  runtime: RuntimeOptions;

  // Development options
  development: DevelopmentOptions;

  // Plugin configuration
  plugins: PluginConfig[];
}

interface RuntimeOptions {
  includePolyfills: boolean;
  targetBrowser: BrowserTarget;
  enableDebugging: boolean;
  performanceLogging: boolean;
}

interface DevelopmentOptions {
  enableHotReload: boolean;
  generateDeclarations: boolean;
  enableLinting: boolean;
  formatOnSave: boolean;
}
```

### Configuration Management

```typescript
class ConfigurationManager {
  static load(configPath: string): CompilerConfig;
  static save(config: CompilerConfig, configPath: string): void;
  static validate(config: CompilerConfig): ValidationResult;
  static merge(base: CompilerConfig, override: Partial<CompilerConfig>): CompilerConfig;

  static getDefault(): CompilerConfig;
  static createTemplate(projectType: ProjectType): CompilerConfig;
}

enum ProjectType {
  StandardExe = 'standardExe',
  ActiveXExe = 'activeXExe',
  ActiveXDll = 'activeXDll',
  ActiveXControl = 'activeXControl',
  WebApplication = 'webApplication',
}
```

## Utilities

### Source Maps

```typescript
interface SourceMapGenerator {
  addMapping(originalPosition: Position, generatedPosition: Position): void;
  setSourceContent(filename: string, content: string): void;
  generate(): string;
}

class SourceMapConsumer {
  constructor(sourceMap: string);

  originalPositionFor(position: Position): Position | null;
  generatedPositionFor(position: Position): Position | null;
  sourceContentFor(source: string): string | null;
}
```

### Performance Profiling

```typescript
interface PerformanceProfiler {
  start(name: string): void;
  end(name: string): number;
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): number;

  getReport(): PerformanceReport;
  reset(): void;
}

interface PerformanceReport {
  totalTime: number;
  phases: { [phase: string]: number };
  marks: { [mark: string]: number };
  measures: { [measure: string]: number };
  memoryUsage: MemoryUsageInfo;
}
```

### Debugging Support

```typescript
interface DebugInformation {
  breakpoints: Breakpoint[];
  watchExpressions: WatchExpression[];
  callStack: CallFrame[];
  variables: Variable[];
}

interface Debugger {
  setBreakpoint(position: Position): void;
  removeBreakpoint(position: Position): void;
  stepOver(): void;
  stepInto(): void;
  stepOut(): void;
  continue(): void;

  evaluateExpression(expression: string): any;
  getVariables(scope?: string): Variable[];
  getCallStack(): CallFrame[];
}
```

## Version Information

```typescript
interface VersionInfo {
  version: string;
  buildDate: string;
  buildNumber: number;
  gitCommit?: string;

  // Compatibility
  vb6Compatibility: string; // "95%+"
  jsTarget: string; // "ES2020"

  // Features
  supportedFeatures: string[];
  experimentalFeatures: string[];
  deprecatedFeatures: string[];
}

class Version {
  static getCurrent(): VersionInfo;
  static isCompatible(requiredVersion: string): boolean;
  static compare(version1: string, version2: string): number;
}
```

Cette API reference complète couvre tous les aspects du compilateur VB6 Web, de l'utilisation basique aux fonctionnalités avancées. Elle sert de référence pour les développeurs utilisant le compilateur et pour ceux contribuant à son développement.
