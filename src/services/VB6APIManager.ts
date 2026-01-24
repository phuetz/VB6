/**
 * VB6 API Manager Service - Manages API declarations and function calls
 * Integrates with VB6 transpiler and runtime for seamless API access
 */

import { VB6API, VB6APIFunction, DeclareFunction, VB6Constants } from '../runtime/VB6APIDeclarations';
import { createLogger } from './LoggingService';

const logger = createLogger('APIManager');

export interface APIDeclaration {
  id: string;
  name: string;
  library: string;
  alias?: string;
  declaration: string;
  parameters: string[];
  returnType: string;
  isRegistered: boolean;
}

export class VB6APIManager {
  private static instance: VB6APIManager;
  private declarations: Map<string, APIDeclaration> = new Map();
  private codeAPIs: Map<string, string> = new Map(); // Store original code declarations

  static getInstance(): VB6APIManager {
    if (!VB6APIManager.instance) {
      VB6APIManager.instance = new VB6APIManager();
      VB6APIManager.instance.initializeGlobalAPIs();
    }
    return VB6APIManager.instance;
  }

  // Parse VB6 code for Declare Function statements
  parseCodeForAPIs(code: string): APIDeclaration[] {
    const declarations: APIDeclaration[] = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Handle multi-line declarations
      if (line.includes('Declare') && !line.includes('(')) {
        // Look for continuation on next lines
        let j = i + 1;
        while (j < lines.length && !line.includes(')')) {
          line += ' ' + lines[j].trim();
          j++;
        }
      }
      
      if (this.isDeclareStatement(line)) {
        const declaration = this.parseDeclaration(line);
        if (declaration) {
          declarations.push(declaration);
          this.registerDeclaration(declaration);
        }
      }
    }
    
    return declarations;
  }

  // Check if line is a Declare Function/Sub statement
  private isDeclareStatement(line: string): boolean {
    return /^\s*(?:Private\s+|Public\s+)?Declare\s+(Function|Sub)\s+/i.test(line);
  }

  // Parse individual declaration
  private parseDeclaration(line: string): APIDeclaration | null {
    try {
      const declareRegex = /(?:Private\s+|Public\s+)?Declare\s+(Function|Sub)\s+(\w+)\s+Lib\s+"([^"]+)"(?:\s+Alias\s+"([^"]+)")?\s*\(([^)]*)\)(?:\s+As\s+(\w+))?/i;
      const match = line.match(declareRegex);
      
      if (!match) return null;
      
      const [fullMatch, funcType, funcName, library, alias, paramStr, returnType] = match;
      
      // Parse parameters
      const parameters: string[] = [];
      if (paramStr.trim()) {
        const paramParts = paramStr.split(',');
        for (const param of paramParts) {
          parameters.push(param.trim());
        }
      }
      
      const declaration: APIDeclaration = {
        id: `${library.toLowerCase()}_${(alias || funcName).toLowerCase()}`,
        name: funcName,
        library: library.toLowerCase(),
        alias: alias,
        declaration: line,
        parameters,
        returnType: returnType || 'void',
        isRegistered: false
      };
      
      return declaration;

    } catch (error) {
      logger.error('Error parsing API declaration:', error);
      return null;
    }
  }

  // Register declaration with API system
  private registerDeclaration(declaration: APIDeclaration): void {
    this.declarations.set(declaration.id, declaration);
    this.codeAPIs.set(declaration.name.toLowerCase(), declaration.declaration);
    
    // Register with VB6API system
    const success = DeclareFunction(declaration.declaration);
    declaration.isRegistered = success;

    logger.info(`API Declaration registered: ${declaration.name} from ${declaration.library} - ${success ? 'Success' : 'Failed'}`);
  }

  // Get all registered declarations
  getDeclarations(): APIDeclaration[] {
    return Array.from(this.declarations.values());
  }

  // Get declaration by function name
  getDeclaration(functionName: string): APIDeclaration | undefined {
    for (const [, declaration] of this.declarations) {
      if (declaration.name.toLowerCase() === functionName.toLowerCase()) {
        return declaration;
      }
    }
    return undefined;
  }

  // Call API function with proper error handling
  callAPI(functionName: string, ...args: any[]): any {
    try {
      const declaration = this.getDeclaration(functionName);
      if (!declaration || !declaration.isRegistered) {
        logger.warn(`API function ${functionName} not declared or not registered`);
        return null;
      }
      
      // Validate parameters
      const validatedArgs = this.validateParameters(declaration, args);
      
      // Call through VB6API system
      return VB6API.callAPI(functionName, ...validatedArgs);

    } catch (error) {
      logger.error(`Error calling API ${functionName}:`, error);
      return null;
    }
  }

  // Validate and convert parameters
  private validateParameters(declaration: APIDeclaration, args: any[]): any[] {
    const validatedArgs: any[] = [];
    
    for (let i = 0; i < declaration.parameters.length; i++) {
      const param = declaration.parameters[i];
      const arg = args[i];
      
      // Parse parameter info
      const paramMatch = param.match(/(ByVal|ByRef)?\s*(\w+)\s+As\s+(\w+)(?:\s*=\s*(.+))?/i);
      if (!paramMatch) {
        validatedArgs.push(arg);
        continue;
      }
      
      const [, byRefVal, paramName, paramType, defaultVal] = paramMatch;
      const isByRef = byRefVal?.toLowerCase() === 'byref';
      const hasDefault = !!defaultVal;
      
      let validatedArg = arg;
      
      // Handle missing optional parameters
      if (validatedArg === undefined && hasDefault) {
        validatedArg = this.parseDefaultValue(defaultVal, paramType);
      }
      
      // Handle ByRef parameters
      if (isByRef && typeof validatedArg !== 'object') {
        validatedArg = { value: validatedArg };
      }
      
      // Type conversion
      validatedArg = this.convertType(validatedArg, paramType, isByRef);
      
      validatedArgs.push(validatedArg);
    }
    
    return validatedArgs;
  }

  // Convert parameter to appropriate type
  private convertType(value: any, targetType: string, isByRef: boolean): any {
    if (isByRef) {
      return value; // ByRef parameters are handled as objects
    }
    
    switch (targetType.toLowerCase()) {
      case 'long':
      case 'integer':
      case 'byte':
        return parseInt(value) || 0;
      case 'double':
      case 'single':
      case 'currency':
        return parseFloat(value) || 0.0;
      case 'string':
        return String(value || '');
      case 'boolean':
        return Boolean(value);
      case 'date':
        return value instanceof Date ? value : new Date(value);
      default:
        return value;
    }
  }

  // Parse default parameter value
  private parseDefaultValue(defaultVal: string, paramType: string): any {
    const trimmed = defaultVal.trim();
    
    switch (paramType.toLowerCase()) {
      case 'long':
      case 'integer':
      case 'byte':
        return parseInt(trimmed) || 0;
      case 'double':
      case 'single':
      case 'currency':
        return parseFloat(trimmed) || 0.0;
      case 'string':
        return trimmed.replace(/^"|"$/g, ''); // Remove quotes
      case 'boolean':
        return trimmed.toLowerCase() === 'true';
      default:
        return trimmed;
    }
  }

  // Generate code completion suggestions for API functions
  getAPICompletions(): { name: string; signature: string; description: string }[] {
    const completions: { name: string; signature: string; description: string }[] = [];
    
    for (const [, declaration] of this.declarations) {
      const params = declaration.parameters.join(', ');
      const signature = `${declaration.name}(${params})${declaration.returnType !== 'void' ? ` As ${declaration.returnType}` : ''}`;
      const description = `API function from ${declaration.library}.dll`;
      
      completions.push({
        name: declaration.name,
        signature,
        description
      });
    }
    
    return completions;
  }

  // Initialize global APIs and constants
  private initializeGlobalAPIs(): void {
    // Make VB6 constants globally available
    const globalAny = globalThis as any;
    
    // MessageBox constants
    Object.assign(globalAny, VB6Constants);
    
    // Common API declarations that are frequently used
    const commonAPIs = [
      'Declare Function GetTickCount Lib "kernel32" () As Long',
      'Declare Function MessageBox Lib "user32" Alias "MessageBoxA" (ByVal hwnd As Long, ByVal lpText As String, ByVal lpCaption As String, ByVal wType As Long) As Long',
      'Declare Function FindWindow Lib "user32" Alias "FindWindowA" (ByVal lpClassName As String, ByVal lpWindowName As String) As Long',
      'Declare Function GetWindowText Lib "user32" Alias "GetWindowTextA" (ByVal hwnd As Long, ByVal lpString As String, ByVal nMaxCount As Long) As Long',
      'Declare Function ShellExecute Lib "shell32" Alias "ShellExecuteA" (ByVal hwnd As Long, ByVal lpOperation As String, ByVal lpFile As String, ByVal lpParameters As String, ByVal lpDirectory As String, ByVal nShowCmd As Long) As Long',
      'Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)',
      'Declare Function GetComputerName Lib "kernel32" Alias "GetComputerNameA" (ByVal lpBuffer As String, nSize As Long) As Long',
      'Declare Function GetUserName Lib "kernel32" Alias "GetUserNameA" (ByVal lpBuffer As String, nSize As Long) As Long'
    ];
    
    // Register common APIs
    for (const apiDecl of commonAPIs) {
      const declaration = this.parseDeclaration(apiDecl);
      if (declaration) {
        this.registerDeclaration(declaration);
      }
    }
    
    // Make API manager globally available
    globalAny.VB6APIManager = this;
    globalAny.CallAPI = (functionName: string, ...args: any[]) => this.callAPI(functionName, ...args);

    logger.info('VB6 API Manager initialized with', this.declarations.size, 'API declarations');
  }

  // Helper method for transpiler integration
  processSourceCode(sourceCode: string): string {
    // Find and process all Declare Function statements
    const declarations = this.parseCodeForAPIs(sourceCode);
    
    let processedCode = sourceCode;
    
    // Replace Declare Function statements with placeholder comments
    for (const declaration of declarations) {
      const escapedDeclaration = declaration.declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^\\s*${escapedDeclaration}\\s*$`, 'gm');
      processedCode = processedCode.replace(regex, `// API Declaration: ${declaration.name} from ${declaration.library}`);
    }
    
    return processedCode;
  }

  // Generate TypeScript definitions for declared APIs
  generateTypeDefinitions(): string {
    let definitions = '// VB6 API Type Definitions\n\n';
    
    for (const [, declaration] of this.declarations) {
      const params = declaration.parameters.map(param => {
        const paramMatch = param.match(/(ByVal|ByRef)?\s*(\w+)\s+As\s+(\w+)(?:\s*=\s*(.+))?/i);
        if (paramMatch) {
          const [, byRefVal, paramName, paramType, defaultVal] = paramMatch;
          const isByRef = byRefVal?.toLowerCase() === 'byref';
          const isOptional = !!defaultVal;
          const tsType = this.vb6TypeToTS(paramType);
          const paramDecl = `${paramName}${isOptional ? '?' : ''}: ${isByRef ? `{value: ${tsType}}` : tsType}`;
          return paramDecl;
        }
        return param;
      }).join(', ');
      
      const returnType = this.vb6TypeToTS(declaration.returnType);
      definitions += `declare function ${declaration.name}(${params}): ${returnType};\n`;
    }
    
    return definitions;
  }

  // Convert VB6 type to TypeScript type
  private vb6TypeToTS(vb6Type: string): string {
    const typeMap: { [key: string]: string } = {
      'Long': 'number',
      'Integer': 'number',
      'String': 'string',
      'Boolean': 'boolean',
      'Byte': 'number',
      'Double': 'number',
      'Single': 'number',
      'Currency': 'number',
      'Date': 'Date',
      'Variant': 'any',
      'Object': 'any',
      'void': 'void'
    };
    
    return typeMap[vb6Type] || 'any';
  }

  // Reset all declarations (for testing)
  reset(): void {
    this.declarations.clear();
    this.codeAPIs.clear();
  }
}

// Global instance
export const VB6APIManagerInstance = VB6APIManager.getInstance();

export default VB6APIManager;