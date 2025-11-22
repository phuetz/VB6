/**
 * VB6 WithEvents Support Implementation
 * 
 * Complete support for VB6 WithEvents declarations and event handling
 */

export interface VB6WithEventsDeclaration {
  variableName: string;
  className: string;
  public: boolean;
  module: string;
  line: number;
  eventHandlers: VB6EventHandler[];
}

export interface VB6EventHandler {
  eventName: string;
  handlerName: string;
  parameters: VB6EventParameter[];
  body: string[];
  line: number;
}

export interface VB6EventParameter {
  name: string;
  type: string;
  byRef: boolean;
}

export interface VB6EventDefinition {
  name: string;
  parameters: VB6EventParameter[];
  className: string;
}

export class VB6WithEventsProcessor {
  private withEventsVariables: Map<string, VB6WithEventsDeclaration> = new Map();
  private eventDefinitions: Map<string, VB6EventDefinition[]> = new Map();
  private currentModule: string = '';

  setCurrentModule(moduleName: string) {
    this.currentModule = moduleName;
  }

  /**
   * Parse VB6 WithEvents declaration
   * Example: Private WithEvents myButton As CommandButton
   */
  parseWithEventsDeclaration(code: string, line: number): VB6WithEventsDeclaration | null {
    const withEventsRegex = /^(Public\s+|Private\s+|Dim\s+)?WithEvents\s+(\w+)\s+As\s+(\w+)$/i;
    const match = code.match(withEventsRegex);
    
    if (!match) return null;

    const scope = match[1] ? match[1].trim().toLowerCase() : 'private';
    const variableName = match[2];
    const className = match[3];

    return {
      variableName,
      className,
      public: scope === 'public',
      module: this.currentModule,
      line,
      eventHandlers: []
    };
  }

  /**
   * Parse event handler procedure
   * Example: Private Sub myButton_Click()
   */
  parseEventHandler(code: string, line: number): VB6EventHandler | null {
    const handlerRegex = /^(Public\s+|Private\s+)?Sub\s+(\w+)_(\w+)\s*\(([^)]*)\)$/i;
    const match = code.match(handlerRegex);
    
    if (!match) return null;

    const variableName = match[2];
    const eventName = match[3];
    const parameterList = match[4] || '';
    const handlerName = `${variableName}_${eventName}`;

    // Check if this variable is declared WithEvents
    const withEventsVar = this.getWithEventsVariable(variableName);
    if (!withEventsVar) return null;

    const parameters = this.parseEventParameters(parameterList);

    return {
      eventName,
      handlerName,
      parameters,
      body: [],
      line
    };
  }

  /**
   * Parse event parameters
   */
  private parseEventParameters(parameterList: string): VB6EventParameter[] {
    if (!parameterList.trim()) return [];

    const parameters: VB6EventParameter[] = [];
    const params = parameterList.split(',');

    for (const param of params) {
      const trimmed = param.trim();
      if (!trimmed) continue;

      const paramRegex = /^(ByRef\s+|ByVal\s+)?(\w+)(?:\s+As\s+(.+))?$/i;
      const match = trimmed.match(paramRegex);

      if (match) {
        const byRef = match[1] ? match[1].toLowerCase().includes('byref') : true; // Default to ByRef
        const paramName = match[2];
        const paramType = match[3] || 'Variant';

        parameters.push({
          name: paramName,
          type: paramType,
          byRef
        });
      }
    }

    return parameters;
  }

  /**
   * Register WithEvents variable
   */
  registerWithEventsVariable(declaration: VB6WithEventsDeclaration) {
    const key = declaration.public ? declaration.variableName : `${this.currentModule}.${declaration.variableName}`;
    this.withEventsVariables.set(key, declaration);
  }

  /**
   * Register event handler
   */
  registerEventHandler(variableName: string, handler: VB6EventHandler) {
    const withEventsVar = this.getWithEventsVariable(variableName);
    if (withEventsVar) {
      withEventsVar.eventHandlers.push(handler);
    }
  }

  /**
   * Get WithEvents variable
   */
  getWithEventsVariable(variableName: string): VB6WithEventsDeclaration | undefined {
    return this.withEventsVariables.get(variableName) || 
           this.withEventsVariables.get(`${this.currentModule}.${variableName}`);
  }

  /**
   * Register event definition for a class
   */
  registerEventDefinition(className: string, eventDef: VB6EventDefinition) {
    let events = this.eventDefinitions.get(className);
    if (!events) {
      events = [];
      this.eventDefinitions.set(className, events);
    }
    events.push(eventDef);
  }

  /**
   * Get event definitions for a class
   */
  getEventDefinitions(className: string): VB6EventDefinition[] {
    return this.eventDefinitions.get(className) || [];
  }

  /**
   * Generate JavaScript event handling code
   */
  generateJavaScript(withEventsVar: VB6WithEventsDeclaration): string {
    const varName = withEventsVar.variableName;
    const className = withEventsVar.className;
    
    let jsCode = `// WithEvents variable: ${varName} As ${className}\n`;
    jsCode += `${varName}: null,\n\n`;

    // Generate event handler wrapper
    jsCode += `// Event handlers for ${varName}\n`;
    
    for (const handler of withEventsVar.eventHandlers) {
      jsCode += this.generateEventHandlerJS(handler, varName);
    }

    // Generate event wiring method
    jsCode += this.generateEventWiringJS(withEventsVar);

    return jsCode;
  }

  /**
   * Generate JavaScript for individual event handler
   */
  private generateEventHandlerJS(handler: VB6EventHandler, variableName: string): string {
    let jsCode = `${handler.handlerName}: function(`;
    
    // Add parameters
    const paramNames = handler.parameters.map(p => p.name);
    jsCode += paramNames.join(', ');
    jsCode += `) {\n`;
    
    // Add event handler body (simplified transpilation)
    if (handler.body.length > 0) {
      for (const line of handler.body) {
        let jsLine = line;
        
        // Basic VB6 to JavaScript conversion
        jsLine = jsLine.replace(/\bMe\b/g, 'this');
        jsLine = jsLine.replace(/\bNothing\b/g, 'null');
        jsLine = jsLine.replace(/\bTrue\b/g, 'true');
        jsLine = jsLine.replace(/\bFalse\b/g, 'false');
        jsLine = jsLine.replace(/\bAnd\b/g, '&&');
        jsLine = jsLine.replace(/\bOr\b/g, '||');
        jsLine = jsLine.replace(/\bNot\b/g, '!');
        
        jsCode += `  ${jsLine}\n`;
      }
    } else {
      jsCode += `  // Event handler implementation\n`;
      jsCode += `  console.log('${handler.eventName} event fired on ${variableName}');\n`;
    }
    
    jsCode += `},\n\n`;
    
    return jsCode;
  }

  /**
   * Generate event wiring JavaScript
   */
  private generateEventWiringJS(withEventsVar: VB6WithEventsDeclaration): string {
    const varName = withEventsVar.variableName;
    const className = withEventsVar.className;
    
    let jsCode = `// Event wiring for ${varName}\n`;
    jsCode += `wire${varName}Events: function() {\n`;
    jsCode += `  if (!this.${varName}) return;\n\n`;
    
    for (const handler of withEventsVar.eventHandlers) {
      jsCode += `  // Wire ${handler.eventName} event\n`;
      jsCode += `  if (this.${varName}.addEventListener) {\n`;
      jsCode += `    this.${varName}.addEventListener('${handler.eventName.toLowerCase()}', this.${handler.handlerName}.bind(this));\n`;
      jsCode += `  } else if (this.${varName}.on${handler.eventName}) {\n`;
      jsCode += `    this.${varName}.on${handler.eventName} = this.${handler.handlerName}.bind(this);\n`;
      jsCode += `  }\n\n`;
    }
    
    jsCode += `},\n\n`;
    
    // Generate unwiring method
    jsCode += `unwire${varName}Events: function() {\n`;
    jsCode += `  if (!this.${varName}) return;\n\n`;
    
    for (const handler of withEventsVar.eventHandlers) {
      jsCode += `  // Unwire ${handler.eventName} event\n`;
      jsCode += `  if (this.${varName}.removeEventListener) {\n`;
      jsCode += `    this.${varName}.removeEventListener('${handler.eventName.toLowerCase()}', this.${handler.handlerName}.bind(this));\n`;
      jsCode += `  } else if (this.${varName}.on${handler.eventName}) {\n`;
      jsCode += `    this.${varName}.on${handler.eventName} = null;\n`;
      jsCode += `  }\n\n`;
    }
    
    jsCode += `},\n\n`;
    
    return jsCode;
  }

  /**
   * Generate object instantiation code with event wiring
   */
  generateInstantiationCode(withEventsVar: VB6WithEventsDeclaration): string {
    const varName = withEventsVar.variableName;
    const className = withEventsVar.className;
    
    let jsCode = `// Instantiate ${varName} with events\n`;
    jsCode += `create${varName}: function() {\n`;
    jsCode += `  // Unwire existing events\n`;
    jsCode += `  this.unwire${varName}Events();\n\n`;
    jsCode += `  // Create new instance\n`;
    jsCode += `  this.${varName} = new ${className}();\n\n`;
    jsCode += `  // Wire events\n`;
    jsCode += `  this.wire${varName}Events();\n`;
    jsCode += `},\n\n`;
    
    jsCode += `destroy${varName}: function() {\n`;
    jsCode += `  // Unwire events\n`;
    jsCode += `  this.unwire${varName}Events();\n\n`;
    jsCode += `  // Clean up\n`;
    jsCode += `  this.${varName} = null;\n`;
    jsCode += `},\n\n`;
    
    return jsCode;
  }

  /**
   * Generate TypeScript interface for WithEvents
   */
  generateTypeScript(withEventsVar: VB6WithEventsDeclaration): string {
    const varName = withEventsVar.variableName;
    const className = withEventsVar.className;
    
    let tsCode = `// WithEvents variable\n`;
    tsCode += `${varName}: ${className} | null;\n\n`;
    
    // Generate event handler signatures
    tsCode += `// Event handlers\n`;
    for (const handler of withEventsVar.eventHandlers) {
      tsCode += `${handler.handlerName}(`;
      
      const paramSignatures = handler.parameters.map(p => 
        `${p.name}: ${this.mapVB6TypeToTypeScript(p.type)}`
      );
      tsCode += paramSignatures.join(', ');
      
      tsCode += `): void;\n`;
    }
    
    tsCode += `\n// Event management methods\n`;
    tsCode += `wire${varName}Events(): void;\n`;
    tsCode += `unwire${varName}Events(): void;\n`;
    tsCode += `create${varName}(): void;\n`;
    tsCode += `destroy${varName}(): void;\n\n`;
    
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
        return 'object';
      default:
        return vb6Type; // Assume it's a custom type
    }
  }

  /**
   * Validate WithEvents usage
   */
  validateWithEvents(withEventsVar: VB6WithEventsDeclaration): string[] {
    const errors: string[] = [];
    const className = withEventsVar.className;
    const availableEvents = this.getEventDefinitions(className);
    
    // Check if all event handlers correspond to actual events
    for (const handler of withEventsVar.eventHandlers) {
      const eventExists = availableEvents.some(e => 
        e.name.toLowerCase() === handler.eventName.toLowerCase()
      );
      
      if (!eventExists && availableEvents.length > 0) {
        errors.push(`Event '${handler.eventName}' is not defined for class '${className}'`);
      }
      
      // Check parameter compatibility
      const eventDef = availableEvents.find(e => 
        e.name.toLowerCase() === handler.eventName.toLowerCase()
      );
      
      if (eventDef) {
        if (eventDef.parameters.length !== handler.parameters.length) {
          errors.push(`Event handler '${handler.handlerName}' has wrong number of parameters. Expected ${eventDef.parameters.length}, got ${handler.parameters.length}`);
        }
        
        // Check parameter types
        for (let i = 0; i < Math.min(eventDef.parameters.length, handler.parameters.length); i++) {
          const expectedType = eventDef.parameters[i].type.toLowerCase();
          const actualType = handler.parameters[i].type.toLowerCase();
          
          if (expectedType !== actualType && expectedType !== 'variant' && actualType !== 'variant') {
            errors.push(`Parameter '${handler.parameters[i].name}' in '${handler.handlerName}' should be ${eventDef.parameters[i].type}, not ${handler.parameters[i].type}`);
          }
        }
      }
    }
    
    return errors;
  }

  /**
   * Clear all WithEvents data (for new compilation)
   */
  clear() {
    this.withEventsVariables.clear();
    this.eventDefinitions.clear();
  }

  /**
   * Get all WithEvents variables in current module
   */
  getModuleWithEventsVariables(): VB6WithEventsDeclaration[] {
    return Array.from(this.withEventsVariables.values())
      .filter(v => v.module === this.currentModule);
  }

  /**
   * Export WithEvents data for serialization
   */
  export(): { variables: { [key: string]: VB6WithEventsDeclaration }, events: { [key: string]: VB6EventDefinition[] } } {
    const variables: { [key: string]: VB6WithEventsDeclaration } = {};
    const events: { [key: string]: VB6EventDefinition[] } = {};
    
    for (const [key, value] of this.withEventsVariables.entries()) {
      variables[key] = value;
    }
    
    for (const [key, value] of this.eventDefinitions.entries()) {
      events[key] = value;
    }
    
    return { variables, events };
  }

  /**
   * Import WithEvents data from serialization
   */
  import(data: { variables: { [key: string]: VB6WithEventsDeclaration }, events: { [key: string]: VB6EventDefinition[] } }) {
    this.withEventsVariables.clear();
    this.eventDefinitions.clear();
    
    for (const [key, value] of Object.entries(data.variables)) {
      this.withEventsVariables.set(key, value);
    }
    
    for (const [key, value] of Object.entries(data.events)) {
      this.eventDefinitions.set(key, value);
    }
  }
}

// Common VB6 control events
export const VB6CommonEvents = {
  CommandButton: [
    { name: 'Click', parameters: [], className: 'CommandButton' },
    { name: 'DblClick', parameters: [], className: 'CommandButton' },
    { name: 'KeyDown', parameters: [
      { name: 'KeyCode', type: 'Integer', byRef: true },
      { name: 'Shift', type: 'Integer', byRef: false }
    ], className: 'CommandButton' },
    { name: 'KeyPress', parameters: [
      { name: 'KeyAscii', type: 'Integer', byRef: true }
    ], className: 'CommandButton' },
    { name: 'KeyUp', parameters: [
      { name: 'KeyCode', type: 'Integer', byRef: true },
      { name: 'Shift', type: 'Integer', byRef: false }
    ], className: 'CommandButton' }
  ],
  
  TextBox: [
    { name: 'Change', parameters: [], className: 'TextBox' },
    { name: 'GotFocus', parameters: [], className: 'TextBox' },
    { name: 'LostFocus', parameters: [], className: 'TextBox' },
    { name: 'KeyDown', parameters: [
      { name: 'KeyCode', type: 'Integer', byRef: true },
      { name: 'Shift', type: 'Integer', byRef: false }
    ], className: 'TextBox' },
    { name: 'KeyPress', parameters: [
      { name: 'KeyAscii', type: 'Integer', byRef: true }
    ], className: 'TextBox' }
  ],
  
  Form: [
    { name: 'Load', parameters: [], className: 'Form' },
    { name: 'Unload', parameters: [
      { name: 'Cancel', type: 'Integer', byRef: true }
    ], className: 'Form' },
    { name: 'Activate', parameters: [], className: 'Form' },
    { name: 'Deactivate', parameters: [], className: 'Form' },
    { name: 'Resize', parameters: [], className: 'Form' },
    { name: 'Paint', parameters: [], className: 'Form' }
  ]
};

// Global WithEvents processor instance
export const withEventsProcessor = new VB6WithEventsProcessor();

// Initialize with common events
for (const [className, events] of Object.entries(VB6CommonEvents)) {
  for (const event of events) {
    withEventsProcessor.registerEventDefinition(className, event);
  }
}