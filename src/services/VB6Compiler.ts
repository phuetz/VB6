import { CompiledCode, CompilerError, Project, Module, Procedure } from '../types/extended';

export class VB6Compiler {
  private errors: CompilerError[] = [];
  private warnings: CompilerError[] = [];
  private variables: Map<string, any> = new Map();
  private procedures: Map<string, Procedure> = new Map();

  compile(project: Project): CompiledCode {
    this.errors = [];
    this.warnings = [];
    this.variables.clear();
    this.procedures.clear();

    try {
      // Compile modules first
      const moduleCode = this.compileModules(project.modules);
      
      // Compile forms
      const formCode = this.compileForms(project.forms);
      
      // Compile class modules
      const classCode = this.compileClassModules(project.classModules);
      
      // Generate main application code
      const mainCode = this.generateMainCode(project);
      
      const javascript = [
        this.generateHeader(project),
        moduleCode,
        formCode,
        classCode,
        mainCode
      ].join('\n\n');

      return {
        javascript,
        sourceMap: this.generateSourceMap(),
        errors: [...this.errors, ...this.warnings],
        dependencies: this.extractDependencies(project)
      };
    } catch (error) {
      this.errors.push({
        type: 'error',
        message: `Compilation failed: ${error.message}`,
        file: 'compiler',
        line: 0,
        column: 0,
        code: 'COMP001'
      });

      return {
        javascript: '',
        sourceMap: '',
        errors: this.errors,
        dependencies: []
      };
    }
  }

  private compileModules(modules: Module[]): string {
    return modules.map(module => {
      return `
// Module: ${module.name}
class ${module.name} {
  constructor() {
    this.initialize();
  }

  initialize() {
    ${this.compileVariables(module.variables)}
    ${this.compileConstants(module.constants)}
  }

  ${this.compileProcedures(module.procedures)}
}
`;
    }).join('\n');
  }

  private compileForms(forms: any[]): string {
    return forms.map(form => {
      return `
// Form: ${form.name}
class ${form.name} {
  constructor() {
    this.controls = {};
    this.properties = ${JSON.stringify(form.properties || {})};
    this.initialize();
  }

  initialize() {
    this.createControls();
    this.setupEvents();
  }

  createControls() {
    ${form.controls?.map((control: any) => `
    this.controls['${control.name}'] = {
      type: '${control.type}',
      properties: ${JSON.stringify(control)},
      element: this.createElement('${control.type}', ${JSON.stringify(control)})
    };
    `).join('') || ''}
  }

  createElement(type, props) {
    const element = document.createElement(this.getHTMLElement(type));
    Object.assign(element.style, {
      position: 'absolute',
      left: props.x + 'px',
      top: props.y + 'px',
      width: props.width + 'px',
      height: props.height + 'px'
    });
    return element;
  }

  getHTMLElement(vbType) {
    const mapping = {
      'CommandButton': 'button',
      'TextBox': 'input',
      'Label': 'label',
      'CheckBox': 'input',
      'ListBox': 'select',
      'ComboBox': 'select'
    };
    return mapping[vbType] || 'div';
  }

  setupEvents() {
    // Event handlers will be added here
  }

  show() {
    const formElement = document.createElement('div');
    formElement.className = 'vb-form';
    formElement.style.width = this.properties.Width + 'px';
    formElement.style.height = this.properties.Height + 'px';
    formElement.style.backgroundColor = this.properties.BackColor;
    
    Object.values(this.controls).forEach(control => {
      formElement.appendChild(control.element);
    });
    
    document.body.appendChild(formElement);
  }

  hide() {
    const formElement = document.querySelector('.vb-form');
    if (formElement) {
      formElement.remove();
    }
  }
}
`;
    }).join('\n');
  }

  private compileClassModules(classModules: any[]): string {
    return classModules.map(cls => {
      return `
// Class Module: ${cls.name}
class ${cls.name} {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Class initialization
  }

  terminate() {
    // Class termination
  }
}
`;
    }).join('\n');
  }

  private compileVariables(variables: any[]): string {
    return variables.map(variable => {
      const defaultValue = this.getDefaultValue(variable.type);
      return `this.${variable.name} = ${JSON.stringify(defaultValue)};`;
    }).join('\n    ');
  }

  private compileConstants(constants: any[]): string {
    return constants.map(constant => {
      return `this.${constant.name} = ${JSON.stringify(constant.value)};`;
    }).join('\n    ');
  }

  private compileProcedures(procedures: Procedure[]): string {
    return procedures.map(proc => {
      const params = proc.parameters.map(p => p.name).join(', ');
      const jsCode = this.convertVBToJS(proc.code);
      
      return `
  ${proc.name}(${params}) {
    ${jsCode}
  }
`;
    }).join('\n');
  }

  private convertVBToJS(vbCode: string): string {
    let jsCode = vbCode;
    
    // Basic VB6 to JavaScript conversions
    const conversions = [
      // Comments
      [/'/g, '//'],
      
      // Variable declarations
      [/\bDim\s+(\w+)\s+As\s+(\w+)/gi, 'let $1 = this.getDefaultValue("$2");'],
      [/\bPrivate\s+(\w+)\s+As\s+(\w+)/gi, 'this.$1 = this.getDefaultValue("$2");'],
      [/\bPublic\s+(\w+)\s+As\s+(\w+)/gi, 'this.$1 = this.getDefaultValue("$2");'],
      
      // Control structures
      [/\bIf\b/gi, 'if'],
      [/\bThen\b/gi, '{'],
      [/\bEnd\s+If\b/gi, '}'],
      [/\bElse\b/gi, '} else {'],
      [/\bElseIf\b/gi, '} else if'],
      
      // Loops
      [/\bFor\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/gi, 'for (let $1 = $2; $1 <= $3; $1++)'],
      [/\bNext\s+\w+/gi, '}'],
      [/\bNext\b/gi, '}'],
      [/\bWhile\s+(.+)/gi, 'while ($1) {'],
      [/\bWend\b/gi, '}'],
      [/\bDo\s+While\s+(.+)/gi, 'do {'],
      [/\bLoop\b/gi, '} while ($1);'],
      
      // String operations
      [/\b&\b/g, '+'],
      [/\bLen\(/gi, 'this.Len('],
      [/\bLeft\(/gi, 'this.Left('],
      [/\bRight\(/gi, 'this.Right('],
      [/\bMid\(/gi, 'this.Mid('],
      
      // Object references
      [/\bMe\./g, 'this.'],
      [/\.Caption\b/g, '.textContent'],
      [/\.Text\b/g, '.value'],
      [/\.Value\b/g, '.value'],
      
      // Functions
      [/\bMsgBox\s*\(/gi, 'this.MsgBox('],
      [/\bInputBox\s*\(/gi, 'this.InputBox('],
      [/\bPrint\s+(.+)/gi, 'console.log($1);'],
      
      // Sub/Function definitions
      [/\bSub\s+(\w+)\s*\(/gi, '$1('],
      [/\bFunction\s+(\w+)\s*\(/gi, '$1('],
      [/\bEnd\s+Sub\b/gi, '}'],
      [/\bEnd\s+Function\b/gi, '}'],
      
      // Exit statements
      [/\bExit\s+Sub\b/gi, 'return;'],
      [/\bExit\s+Function\b/gi, 'return;'],
      
      // Boolean values
      [/\bTrue\b/gi, 'true'],
      [/\bFalse\b/gi, 'false'],
      
      // Null values
      [/\bNothing\b/gi, 'null'],
      [/\bEmpty\b/gi, '""'],
      
      // Comparison operators
      [/\bAnd\b/gi, '&&'],
      [/\bOr\b/gi, '||'],
      [/\bNot\b/gi, '!'],
      
      // Assignment
      [/\bSet\s+(\w+)\s*=/gi, '$1 ='],
      
      // Line continuation
      [/\s+_\s*\n/g, ' '],
    ];
    
    conversions.forEach(([pattern, replacement]) => {
      jsCode = jsCode.replace(pattern, replacement);
    });
    
    return jsCode;
  }

  private getDefaultValue(type: string): any {
    const defaults: { [key: string]: any } = {
      'String': '',
      'Integer': 0,
      'Long': 0,
      'Single': 0.0,
      'Double': 0.0,
      'Boolean': false,
      'Date': new Date(),
      'Currency': 0,
      'Byte': 0,
      'Object': null,
      'Variant': null
    };
    
    return defaults[type] || null;
  }

  private generateHeader(project: Project): string {
    return `
// Generated code for ${project.name}
// Generated on ${new Date().toISOString()}
// VB6 Clone IDE

// VB6 Runtime functions
const VB6Runtime = {
  MsgBox: function(message, buttons = 0, title = '${project.name}') {
    if (buttons === 0) {
      alert(title + '\\n\\n' + message);
      return 1; // vbOK
    } else {
      const result = confirm(title + '\\n\\n' + message);
      return result ? 1 : 2; // vbOK : vbCancel
    }
  },
  
  InputBox: function(prompt, title = '${project.name}', defaultValue = '') {
    return window.prompt(title + '\\n\\n' + prompt, defaultValue) || '';
  },
  
  Len: function(str) {
    return String(str).length;
  },
  
  Left: function(str, n) {
    return String(str).substring(0, n);
  },
  
  Right: function(str, n) {
    return String(str).substring(String(str).length - n);
  },
  
  Mid: function(str, start, length) {
    return String(str).substring(start - 1, length ? start - 1 + length : undefined);
  },
  
  UCase: function(str) {
    return String(str).toUpperCase();
  },
  
  LCase: function(str) {
    return String(str).toLowerCase();
  },
  
  Trim: function(str) {
    return String(str).trim();
  },
  
  Val: function(str) {
    const num = parseFloat(String(str));
    return isNaN(num) ? 0 : num;
  },
  
  Str: function(num) {
    return ' ' + String(num);
  },
  
  Now: function() {
    return new Date();
  },
  
  Timer: function() {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }
};

// Make runtime functions available globally
Object.assign(window, VB6Runtime);
`;
  }

  private generateMainCode(project: Project): string {
    return `
// Main application class
class ${project.name}Application {
  constructor() {
    this.forms = new Map();
    this.modules = new Map();
    this.initialize();
  }

  initialize() {
    // Initialize application
  }

  run() {
    // Start the application
    const startupForm = '${project.settings.startupObject}';
    if (window[startupForm]) {
      const form = new window[startupForm]();
      form.show();
    }
  }
}

// Auto-start application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const app = new ${project.name}Application();
  app.run();
});
`;
  }

  private generateSourceMap(): string {
    // Simple source map implementation
    return JSON.stringify({
      version: 3,
      sources: ['generated.js'],
      mappings: '',
      names: []
    });
  }

  private extractDependencies(project: Project): string[] {
    const dependencies: string[] = [];
    
    // Add references as dependencies
    project.references.forEach(ref => {
      if (ref.checked) {
        dependencies.push(ref.name);
      }
    });
    
    return dependencies;
  }

  validateCode(code: string): CompilerError[] {
    const errors: CompilerError[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("'")) {
        // Check for common syntax errors
        
        // If without Then
        if (/\bif\b/i.test(trimmed) && !/\bthen\b/i.test(trimmed)) {
          errors.push({
            type: 'error',
            message: 'Expected "Then" after "If"',
            file: 'current',
            line: index + 1,
            column: 0,
            code: 'VB001'
          });
        }
        
        // For without To
        if (/\bfor\b/i.test(trimmed) && !/\bto\b/i.test(trimmed) && !/\beach\b/i.test(trimmed)) {
          errors.push({
            type: 'error',
            message: 'Expected "To" in For statement',
            file: 'current',
            line: index + 1,
            column: 0,
            code: 'VB002'
          });
        }
        
        // Unmatched parentheses
        const openParens = (trimmed.match(/\(/g) || []).length;
        const closeParens = (trimmed.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push({
            type: 'error',
            message: 'Mismatched parentheses',
            file: 'current',
            line: index + 1,
            column: 0,
            code: 'VB003'
          });
        }
        
        // Undeclared variables (basic check)
        const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
        const variables = trimmed.match(variablePattern) || [];
        variables.forEach(variable => {
          if (!this.variables.has(variable) && !this.isBuiltinFunction(variable)) {
            errors.push({
              type: 'warning',
              message: `Variable '${variable}' is not declared`,
              file: 'current',
              line: index + 1,
              column: trimmed.indexOf(variable),
              code: 'VB004'
            });
          }
        });
      }
    });
    
    return errors;
  }

  private isBuiltinFunction(name: string): boolean {
    const builtins = [
      'MsgBox', 'InputBox', 'Print', 'Len', 'Left', 'Right', 'Mid',
      'UCase', 'LCase', 'Trim', 'Val', 'Str', 'Now', 'Timer',
      'If', 'Then', 'Else', 'End', 'For', 'To', 'Next', 'While',
      'Wend', 'Do', 'Loop', 'Sub', 'Function', 'Dim', 'Private',
      'Public', 'Static', 'Const', 'True', 'False', 'Nothing'
    ];
    
    return builtins.includes(name);
  }
}