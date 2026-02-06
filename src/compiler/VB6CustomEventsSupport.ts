/**
 * VB6 Custom Events Support Implementation
 *
 * Complete support for VB6 Event declarations and RaiseEvent statements
 */

export interface VB6EventParameter {
  name: string;
  type: string;
  byRef: boolean;
  optional: boolean;
  defaultValue?: any;
}

export interface VB6EventDeclaration {
  name: string;
  parameters: VB6EventParameter[];
  public: boolean;
  module: string;
  className?: string; // For class events
  line: number;
}

export interface VB6RaiseEventStatement {
  eventName: string;
  arguments: string[];
  line: number;
  module: string;
  className?: string;
}

export interface VB6EventHandler {
  eventSource: string; // Object name that raises the event
  eventName: string;
  handlerName: string;
  parameters: VB6EventParameter[];
  body: string[];
  line: number;
}

export interface VB6EventBinding {
  objectName: string;
  className: string;
  eventName: string;
  handlerName: string;
  module: string;
}

export class VB6CustomEventsProcessor {
  private eventDeclarations: Map<string, VB6EventDeclaration> = new Map();
  private eventHandlers: Map<string, VB6EventHandler> = new Map();
  private eventBindings: Map<string, VB6EventBinding[]> = new Map();
  private raiseEventStatements: VB6RaiseEventStatement[] = [];
  private currentModule: string = '';
  private currentClass: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  setCurrentClass(className: string) {
    this.currentClass = className;
  }

  /**
   * Parse VB6 Event declaration
   * Examples:
   * Public Event Progress(ByVal Percent As Integer)
   * Public Event StatusChanged(ByVal NewStatus As String, ByRef Cancel As Boolean)
   * Event DataReceived(ByVal Data As String, ByVal Length As Long)
   */
  parseEventDeclaration(code: string, line: number): VB6EventDeclaration | null {
    const eventRegex = /^(Public\s+|Private\s+)?Event\s+(\w+)\s*\(([^)]*)\)$/i;
    const match = code.match(eventRegex);

    if (!match) return null;

    const scope = match[1] ? match[1].trim().toLowerCase() : 'public';
    const eventName = match[2];
    const parameterList = match[3] || '';

    const parameters = this.parseParameterList(parameterList);

    return {
      name: eventName,
      parameters,
      public: scope === 'public',
      module: this.currentModule,
      className: this.currentClass || undefined,
      line,
    };
  }

  /**
   * Parse RaiseEvent statement
   * Examples:
   * RaiseEvent Progress(50)
   * RaiseEvent StatusChanged("Working", bCancel)
   * RaiseEvent DataReceived(buffer, Len(buffer))
   */
  parseRaiseEventStatement(code: string, line: number): VB6RaiseEventStatement | null {
    const raiseEventRegex = /^RaiseEvent\s+(\w+)\s*\(([^)]*)\)$/i;
    const match = code.match(raiseEventRegex);

    if (!match) return null;

    const eventName = match[1];
    const argumentList = match[2] || '';
    const args = this.parseArgumentList(argumentList);

    return {
      eventName,
      arguments: args,
      line,
      module: this.currentModule,
      className: this.currentClass || undefined,
    };
  }

  /**
   * Parse event handler (WithEvents object event handler)
   * Example: Private Sub myObject_StatusChanged(NewStatus As String, Cancel As Boolean)
   */
  parseEventHandler(code: string, line: number): VB6EventHandler | null {
    const handlerRegex = /^(Private\s+|Public\s+)?Sub\s+(\w+)_(\w+)\s*\(([^)]*)\)$/i;
    const match = code.match(handlerRegex);

    if (!match) return null;

    const objectName = match[2];
    const eventName = match[3];
    const parameterList = match[4] || '';
    const handlerName = `${objectName}_${eventName}`;

    const parameters = this.parseParameterList(parameterList);

    return {
      eventSource: objectName,
      eventName,
      handlerName,
      parameters,
      body: [],
      line,
    };
  }

  /**
   * Parse parameter list
   */
  private parseParameterList(parameterList: string): VB6EventParameter[] {
    if (!parameterList.trim()) return [];

    const parameters: VB6EventParameter[] = [];
    const params = parameterList.split(',');

    for (const param of params) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      const paramRegex =
        /^(Optional\s+)?(ByRef\s+|ByVal\s+)?(\w+)(?:\s+As\s+(.+?))?(?:\s*=\s*(.+))?$/i;
      const match = trimmed.match(paramRegex);

      if (match) {
        const isOptional = match[1] ? true : false;
        const byRef = match[2] ? !match[2].toLowerCase().includes('byval') : false; // Events default to ByVal
        const paramName = match[3];
        const paramType = match[4] || 'Variant';
        const defaultValue = match[5];

        parameters.push({
          name: paramName,
          type: paramType,
          byRef,
          optional: isOptional,
          defaultValue: defaultValue ? this.parseDefaultValue(defaultValue) : undefined,
        });
      }
    }

    return parameters;
  }

  /**
   * Parse argument list for RaiseEvent
   */
  private parseArgumentList(argumentList: string): string[] {
    if (!argumentList.trim()) return [];

    const args: string[] = [];
    let current = '';
    let parenCount = 0;
    let inQuotes = false;

    for (let i = 0; i < argumentList.length; i++) {
      const char = argumentList[i];

      if (char === '"' && (i === 0 || argumentList[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      }

      if (!inQuotes) {
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === ',' && parenCount === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  /**
   * Parse default value
   */
  private parseDefaultValue(value: string): any {
    const trimmed = value.trim();

    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.substring(1, trimmed.length - 1);
    }

    if (!isNaN(Number(trimmed))) {
      return Number(trimmed);
    }

    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed.toLowerCase() === 'nothing') return null;

    return trimmed;
  }

  /**
   * Register event declaration
   */
  registerEvent(eventDecl: VB6EventDeclaration) {
    const key = this.getEventKey(eventDecl.name, eventDecl.className, eventDecl.module);
    this.eventDeclarations.set(key, eventDecl);
  }

  /**
   * Register RaiseEvent statement
   */
  registerRaiseEvent(raiseEvent: VB6RaiseEventStatement) {
    this.raiseEventStatements.push(raiseEvent);
  }

  /**
   * Register event handler
   */
  registerEventHandler(handler: VB6EventHandler) {
    const key = `${this.currentModule}.${handler.handlerName}`;
    this.eventHandlers.set(key, handler);

    // Also register the binding
    this.registerEventBinding(handler.eventSource, handler.eventName, handler.handlerName);
  }

  /**
   * Register event binding (WithEvents object to handler)
   */
  registerEventBinding(objectName: string, eventName: string, handlerName: string) {
    const key = `${this.currentModule}.${objectName}`;

    if (!this.eventBindings.has(key)) {
      this.eventBindings.set(key, []);
    }

    const bindings = this.eventBindings.get(key)!;
    bindings.push({
      objectName,
      className: '', // Will be resolved later
      eventName,
      handlerName,
      module: this.currentModule,
    });
  }

  /**
   * Get event key
   */
  private getEventKey(eventName: string, className?: string, module?: string): string {
    if (className) {
      return `${module || this.currentModule}.${className}.${eventName}`;
    }
    return `${module || this.currentModule}.${eventName}`;
  }

  /**
   * Get event declaration
   */
  getEvent(eventName: string, className?: string): VB6EventDeclaration | undefined {
    const key = this.getEventKey(eventName, className);
    return this.eventDeclarations.get(key);
  }

  /**
   * Generate JavaScript event system
   */
  generateEventSystemJS(): string {
    let jsCode = `// VB6 Custom Events System\n`;
    jsCode += `// Event emitter base class\n\n`;

    jsCode += `class VB6EventEmitter {\n`;
    jsCode += `  constructor() {\n`;
    jsCode += `    this._eventHandlers = new Map();\n`;
    jsCode += `  }\n\n`;

    jsCode += `  // Add event listener\n`;
    jsCode += `  addEventListener(eventName, handler) {\n`;
    jsCode += `    if (!this._eventHandlers.has(eventName)) {\n`;
    jsCode += `      this._eventHandlers.set(eventName, []);\n`;
    jsCode += `    }\n`;
    jsCode += `    this._eventHandlers.get(eventName).push(handler);\n`;
    jsCode += `  }\n\n`;

    jsCode += `  // Remove event listener\n`;
    jsCode += `  removeEventListener(eventName, handler) {\n`;
    jsCode += `    const handlers = this._eventHandlers.get(eventName);\n`;
    jsCode += `    if (handlers) {\n`;
    jsCode += `      const index = handlers.indexOf(handler);\n`;
    jsCode += `      if (index >= 0) handlers.splice(index, 1);\n`;
    jsCode += `    }\n`;
    jsCode += `  }\n\n`;

    jsCode += `  // Raise event (VB6 RaiseEvent equivalent)\n`;
    jsCode += `  raiseEvent(eventName, ...args) {\n`;
    jsCode += `    const handlers = this._eventHandlers.get(eventName);\n`;
    jsCode += `    if (handlers) {\n`;
    jsCode += `      for (const handler of handlers) {\n`;
    jsCode += `        try {\n`;
    jsCode += `          handler.apply(this, args);\n`;
    jsCode += `        } catch (error) {\n`;
    jsCode += `          console.error('Event handler error:', error);\n`;
    jsCode += `        }\n`;
    jsCode += `      }\n`;
    jsCode += `    }\n`;
    jsCode += `  }\n`;
    jsCode += `}\n\n`;

    return jsCode;
  }

  /**
   * Generate JavaScript for specific event declaration
   */
  generateEventDeclarationJS(eventDecl: VB6EventDeclaration): string {
    let jsCode = `// Event: ${eventDecl.name}\n`;
    jsCode += `// Parameters: ${eventDecl.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}\n`;

    jsCode += `${eventDecl.name}: function(`;
    const paramNames = eventDecl.parameters.map(p => p.name);
    jsCode += paramNames.join(', ');
    jsCode += `) {\n`;

    // Add parameter validation
    for (const param of eventDecl.parameters) {
      if (!param.optional) {
        jsCode += `  if (${param.name} === undefined) {\n`;
        jsCode += `    throw new Error('Required event parameter ${param.name} is missing');\n`;
        jsCode += `  }\n`;
      }
    }

    // Handle ByRef parameters (create wrapper objects)
    const byRefParams = eventDecl.parameters.filter(p => p.byRef);
    if (byRefParams.length > 0) {
      jsCode += `  // Handle ByRef parameters\n`;
      for (const param of byRefParams) {
        jsCode += `  const ${param.name}_ref = { value: ${param.name} };\n`;
      }
    }

    jsCode += `  // Raise the event\n`;
    jsCode += `  this.raiseEvent('${eventDecl.name}'`;

    if (paramNames.length > 0) {
      jsCode += ', ';
      // Use ref objects for ByRef parameters
      const eventArgs = eventDecl.parameters.map(p => (p.byRef ? `${p.name}_ref` : p.name));
      jsCode += eventArgs.join(', ');
    }

    jsCode += `);\n`;

    // Update original variables with ByRef values
    if (byRefParams.length > 0) {
      jsCode += `  // Update ByRef parameters\n`;
      for (const param of byRefParams) {
        jsCode += `  ${param.name} = ${param.name}_ref.value;\n`;
      }
    }

    jsCode += `},\n\n`;

    return jsCode;
  }

  /**
   * Generate JavaScript for RaiseEvent statement
   */
  generateRaiseEventJS(raiseEvent: VB6RaiseEventStatement): string {
    const eventDecl = this.getEvent(raiseEvent.eventName, raiseEvent.className);

    if (!eventDecl) {
      return `// Error: Event ${raiseEvent.eventName} not declared\n`;
    }

    let jsCode = `// RaiseEvent ${raiseEvent.eventName}\n`;

    // Validate argument count
    const requiredParams = eventDecl.parameters.filter(p => !p.optional).length;
    if (raiseEvent.arguments.length < requiredParams) {
      jsCode += `// Warning: Not enough arguments for event ${raiseEvent.eventName}\n`;
    }

    jsCode += `this.${raiseEvent.eventName}(`;
    jsCode += raiseEvent.arguments.join(', ');
    jsCode += `);\n`;

    return jsCode;
  }

  /**
   * Generate JavaScript for event handler
   */
  generateEventHandlerJS(handler: VB6EventHandler): string {
    let jsCode = `// Event handler: ${handler.handlerName}\n`;
    jsCode += `${handler.handlerName}: function(`;

    const paramNames = handler.parameters.map(p => p.name);
    jsCode += paramNames.join(', ');
    jsCode += `) {\n`;

    // Generate handler body
    if (handler.body.length > 0) {
      for (const line of handler.body) {
        jsCode += `  ${this.transpileVB6Line(line)}\n`;
      }
    } else {
      jsCode += `  // Event handler implementation\n`;
      jsCode += `  console.log('Event ${handler.eventName} fired on ${handler.eventSource}', arguments);\n`;
    }

    jsCode += `},\n\n`;

    return jsCode;
  }

  /**
   * Generate event binding JavaScript
   */
  generateEventBindingJS(): string {
    let jsCode = `// Event binding setup\n`;
    jsCode += `setupEventBindings: function() {\n`;

    for (const [objectKey, bindings] of this.eventBindings.entries()) {
      const objectName = objectKey.split('.').pop();

      jsCode += `  // Bind events for ${objectName}\n`;
      jsCode += `  if (this.${objectName}) {\n`;

      for (const binding of bindings) {
        jsCode += `    this.${objectName}.addEventListener('${binding.eventName}', this.${binding.handlerName}.bind(this));\n`;
      }

      jsCode += `  }\n\n`;
    }

    jsCode += `},\n\n`;

    // Generate cleanup method
    jsCode += `cleanupEventBindings: function() {\n`;

    for (const [objectKey, bindings] of this.eventBindings.entries()) {
      const objectName = objectKey.split('.').pop();

      jsCode += `  // Cleanup events for ${objectName}\n`;
      jsCode += `  if (this.${objectName}) {\n`;

      for (const binding of bindings) {
        jsCode += `    this.${objectName}.removeEventListener('${binding.eventName}', this.${binding.handlerName}.bind(this));\n`;
      }

      jsCode += `  }\n\n`;
    }

    jsCode += `},\n\n`;

    return jsCode;
  }

  /**
   * Basic VB6 to JavaScript line transpilation
   */
  private transpileVB6Line(line: string): string {
    let jsLine = line;

    // Basic VB6 to JavaScript conversions
    jsLine = jsLine.replace(/\bMe\b/g, 'this');
    jsLine = jsLine.replace(/\bNothing\b/g, 'null');
    jsLine = jsLine.replace(/\bTrue\b/g, 'true');
    jsLine = jsLine.replace(/\bFalse\b/g, 'false');
    jsLine = jsLine.replace(/\bAnd\b/g, '&&');
    jsLine = jsLine.replace(/\bOr\b/g, '||');
    jsLine = jsLine.replace(/\bNot\b/g, '!');

    return jsLine;
  }

  /**
   * Generate TypeScript definitions
   */
  generateTypeScript(): string {
    let tsCode = `// VB6 Custom Events TypeScript Definitions\n\n`;

    // Generate event emitter interface
    tsCode += `interface VB6EventEmitter {\n`;
    tsCode += `  addEventListener(eventName: string, handler: (...args: any[]) => any): void;\n`;
    tsCode += `  removeEventListener(eventName: string, handler: (...args: any[]) => any): void;\n`;
    tsCode += `  raiseEvent(eventName: string, ...args: any[]): void;\n`;
    tsCode += `}\n\n`;

    // Generate event interfaces
    for (const [key, eventDecl] of this.eventDeclarations.entries()) {
      tsCode += `// Event: ${eventDecl.name}\n`;
      tsCode += `interface ${eventDecl.name}EventArgs {\n`;

      for (const param of eventDecl.parameters) {
        const tsType = this.mapVB6TypeToTypeScript(param.type);
        const optional = param.optional ? '?' : '';
        tsCode += `  ${param.name}${optional}: ${tsType};\n`;
      }

      tsCode += `}\n\n`;

      tsCode += `interface ${eventDecl.name}Event {\n`;
      tsCode += `  (`;

      const paramSignatures = eventDecl.parameters.map(param => {
        const tsType = this.mapVB6TypeToTypeScript(param.type);
        const optional = param.optional ? '?' : '';
        return `${param.name}${optional}: ${tsType}`;
      });

      tsCode += paramSignatures.join(', ');
      tsCode += `): void;\n`;
      tsCode += `}\n\n`;
    }

    return tsCode;
  }

  /**
   * Map VB6 types to TypeScript types
   */
  private mapVB6TypeToTypeScript(vb6Type: string): string {
    switch (vb6Type.toLowerCase()) {
      case 'integer':
      case 'long':
      case 'single':
      case 'double':
      case 'currency':
      case 'byte':
        return 'number';
      case 'string':
        return 'string';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'Date';
      case 'variant':
        return 'any';
      case 'object':
        return 'object | null';
      default:
        return vb6Type;
    }
  }

  /**
   * Validate event usage
   */
  validateEventUsage(): string[] {
    const errors: string[] = [];

    // Check all RaiseEvent statements have corresponding Event declarations
    for (const raiseEvent of this.raiseEventStatements) {
      const eventDecl = this.getEvent(raiseEvent.eventName, raiseEvent.className);

      if (!eventDecl) {
        errors.push(`Event ${raiseEvent.eventName} is not declared (line ${raiseEvent.line})`);
        continue;
      }

      // Check argument count
      const requiredParams = eventDecl.parameters.filter(p => !p.optional).length;
      if (raiseEvent.arguments.length < requiredParams) {
        errors.push(
          `RaiseEvent ${raiseEvent.eventName} has insufficient arguments. Expected at least ${requiredParams}, got ${raiseEvent.arguments.length} (line ${raiseEvent.line})`
        );
      }

      if (raiseEvent.arguments.length > eventDecl.parameters.length) {
        errors.push(
          `RaiseEvent ${raiseEvent.eventName} has too many arguments. Expected at most ${eventDecl.parameters.length}, got ${raiseEvent.arguments.length} (line ${raiseEvent.line})`
        );
      }
    }

    return errors;
  }

  /**
   * Clear all event data
   */
  clear() {
    this.eventDeclarations.clear();
    this.eventHandlers.clear();
    this.eventBindings.clear();
    this.raiseEventStatements = [];
  }

  /**
   * Get all events in current module
   */
  getModuleEvents(): VB6EventDeclaration[] {
    return Array.from(this.eventDeclarations.values()).filter(
      event => event.module === this.currentModule
    );
  }

  /**
   * Get all event handlers in current module
   */
  getModuleEventHandlers(): VB6EventHandler[] {
    return Array.from(this.eventHandlers.values()).filter(handler =>
      handler.handlerName.startsWith(this.currentModule)
    );
  }

  /**
   * Export event data for serialization
   */
  export(): {
    events: { [key: string]: VB6EventDeclaration };
    handlers: { [key: string]: VB6EventHandler };
    bindings: { [key: string]: VB6EventBinding[] };
    raiseEvents: VB6RaiseEventStatement[];
  } {
    const events: { [key: string]: VB6EventDeclaration } = {};
    const handlers: { [key: string]: VB6EventHandler } = {};
    const bindings: { [key: string]: VB6EventBinding[] } = {};

    for (const [key, value] of this.eventDeclarations.entries()) {
      events[key] = value;
    }

    for (const [key, value] of this.eventHandlers.entries()) {
      handlers[key] = value;
    }

    for (const [key, value] of this.eventBindings.entries()) {
      bindings[key] = value;
    }

    return {
      events,
      handlers,
      bindings,
      raiseEvents: this.raiseEventStatements,
    };
  }

  /**
   * Import event data from serialization
   */
  import(data: {
    events: { [key: string]: VB6EventDeclaration };
    handlers: { [key: string]: VB6EventHandler };
    bindings: { [key: string]: VB6EventBinding[] };
    raiseEvents: VB6RaiseEventStatement[];
  }) {
    this.eventDeclarations.clear();
    this.eventHandlers.clear();
    this.eventBindings.clear();
    this.raiseEventStatements = [];

    for (const [key, value] of Object.entries(data.events)) {
      this.eventDeclarations.set(key, value);
    }

    for (const [key, value] of Object.entries(data.handlers)) {
      this.eventHandlers.set(key, value);
    }

    for (const [key, value] of Object.entries(data.bindings)) {
      this.eventBindings.set(key, value);
    }

    this.raiseEventStatements = data.raiseEvents || [];
  }
}

// Example VB6 Custom Events patterns
export const VB6CustomEventsExamples = {
  // Simple event
  SimpleEvent: `
Public Event Progress(ByVal Percent As Integer)

Private Sub DoWork()
    For i = 1 To 100
        ' Do work
        RaiseEvent Progress(i)
        DoEvents
    Next i
End Sub
`,

  // Event with multiple parameters
  ComplexEvent: `
Public Event StatusChanged(ByVal NewStatus As String, ByRef Cancel As Boolean)
Public Event DataReceived(ByVal Data As String, ByVal Length As Long, ByVal Source As String)

Private Sub ChangeStatus(newStatus As String)
    Dim bCancel As Boolean
    bCancel = False
    RaiseEvent StatusChanged(newStatus, bCancel)
    
    If Not bCancel Then
        m_status = newStatus
    End If
End Sub
`,

  // Event handler with WithEvents
  EventHandler: `
Private WithEvents myWorker As Worker

Private Sub myWorker_Progress(ByVal Percent As Integer)
    ProgressBar1.Value = Percent
    Label1.Caption = "Progress: " & Percent & "%"
End Sub

Private Sub myWorker_StatusChanged(ByVal NewStatus As String, Cancel As Boolean)
    StatusBar1.SimpleText = NewStatus
    
    If NewStatus = "Error" Then
        Cancel = True
        MsgBox "Operation cancelled due to error"
    End If
End Sub
`,

  // Class with events
  EventClass: `
Public Class FileProcessor
    Public Event FileProcessed(ByVal FileName As String, ByVal Success As Boolean)
    Public Event ProgressUpdate(ByVal Current As Long, ByVal Total As Long)
    
    Public Sub ProcessFiles(fileList As Collection)
        Dim i As Long
        For i = 1 To fileList.Count
            RaiseEvent ProgressUpdate(i, fileList.Count)
            
            Dim success As Boolean
            success = ProcessSingleFile(fileList(i))
            
            RaiseEvent FileProcessed(fileList(i), success)
        Next i
    End Sub
    
    Private Function ProcessSingleFile(fileName As String) As Boolean
        ' File processing logic
        ProcessSingleFile = True
    End Function
End Class
`,
};

// Global custom events processor instance
export const customEventsProcessor = new VB6CustomEventsProcessor();
