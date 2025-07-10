/**
 * VB6 Code Converter
 * Utility for converting VB6 code to other modern languages
 */

export interface ConversionOptions {
  includeComments: boolean;
  modernizeApi: boolean;
  strictTypeChecking: boolean;
  removeGoto: boolean;
  convertForms: boolean;
  keepOriginalNames: boolean;
  targetFramework?: string;
  conversionLevel: 'minimal' | 'standard' | 'full';
}

export interface ConversionResult {
  code: string;
  success: boolean;
  issues: Array<{
    line: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    code?: string;
  }>;
  stats: {
    totalLines: number;
    convertedLines: number;
    issueCount: number;
    conversionRatio: number;
  };
}

export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  includeComments: true,
  modernizeApi: true,
  strictTypeChecking: true,
  removeGoto: true,
  convertForms: true,
  keepOriginalNames: false,
  targetFramework: 'net6',
  conversionLevel: 'standard'
};

/**
 * Convert VB6 code to VB.NET
 */
export function convertToVBNET(vb6Code: string, options: Partial<ConversionOptions> = {}): ConversionResult {
  // Merge options with defaults
  const opts: ConversionOptions = {
    ...DEFAULT_CONVERSION_OPTIONS,
    ...options
  };

  const lines = vb6Code.split('\n');
  const convertedLines: string[] = [];
  const issues: ConversionResult['issues'] = [];
  
  // Add VB.NET imports
  convertedLines.push('Imports System');
  convertedLines.push('Imports System.Windows.Forms');
  convertedLines.push('');

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let convertedLine = line;
    
    // Process line by line
    
    // Convert Sub/Function declarations
    if (/^\s*(?:Private|Public|Friend)?\s*Sub\s+/i.test(line)) {
      convertedLine = line.replace(/^\s*(?:(Private|Public|Friend))?\s*Sub\s+/i, (match, access) => {
        const accessModifier = access || 'Public';
        return `${accessModifier} Sub `;
      });
      
      // Add conversion comment if configured
      if (opts.includeComments) {
        convertedLine += ' ' + "' Converted from VB6 Sub";
      }
    }
    
    // Convert Function declarations
    else if (/^\s*(?:Private|Public|Friend)?\s*Function\s+.*\s+As\s+/i.test(line)) {
      convertedLine = line.replace(/^\s*(?:(Private|Public|Friend))?\s*Function\s+/i, (match, access) => {
        const accessModifier = access || 'Public';
        return `${accessModifier} Function `;
      });
      
      // Add conversion comment if configured
      if (opts.includeComments) {
        convertedLine += ' ' + "' Converted from VB6 Function";
      }
    }
    
    // Convert variable declarations
    else if (/^\s*Dim\s+(\w+)\s+As\s+(\w+)/i.test(line)) {
      const match = line.match(/^\s*Dim\s+(\w+)\s+As\s+(\w+)/i);
      if (match) {
        const varName = match[1];
        const varType = match[2];
        
        // Convert VB6 types to .NET types
        let netType = varType;
        if (/^Integer$/i.test(varType)) netType = 'Integer';
        else if (/^Long$/i.test(varType)) netType = 'Long';
        else if (/^Single$/i.test(varType)) netType = 'Single';
        else if (/^Double$/i.test(varType)) netType = 'Double';
        else if (/^Currency$/i.test(varType)) netType = 'Decimal';
        else if (/^String$/i.test(varType)) netType = 'String';
        else if (/^Boolean$/i.test(varType)) netType = 'Boolean';
        else if (/^Variant$/i.test(varType)) {
          netType = 'Object';
          issues.push({
            line: i + 1,
            message: `Variant type converted to Object`,
            severity: 'info',
            code: 'CONV001'
          });
        }
        
        convertedLine = line.replace(/^\s*Dim\s+(\w+)\s+As\s+(\w+)/i, `Dim ${varName} As ${netType}`);
      }
    }
    
    // Remove Set statements for object assignment
    else if (/^\s*Set\s+(\w+)\s*=\s*(.*)$/i.test(line)) {
      const match = line.match(/^\s*Set\s+(\w+)\s*=\s*(.*)$/i);
      if (match) {
        const objName = match[1];
        const objValue = match[2];
        
        convertedLine = line.replace(/^\s*Set\s+(\w+)\s*=\s*(.*)$/i, `${objName} = ${objValue}`);
        
        if (opts.includeComments) {
          convertedLine += ' ' + "' Set keyword removed";
        }
        
        issues.push({
          line: i + 1,
          message: 'Set keyword removed in VB.NET',
          severity: 'info',
          code: 'CONV002'
        });
      }
    }
    
    // Modernize API calls if configured
    if (opts.modernizeApi) {
      // Example: convert VB6 file operations to .NET
      if (/\bOpen\s+"([^"]+)"\s+For\s+(\w+)\s+As\s+#(\d+)/i.test(convertedLine)) {
        const oldLine = convertedLine;
        convertedLine = convertedLine.replace(
          /\bOpen\s+"([^"]+)"\s+For\s+(\w+)\s+As\s+#(\d+)/i,
          (match, file, mode, fileNum) => {
            const accessMode = mode.toLowerCase();
            if (accessMode === 'input') {
              return `Dim reader${fileNum} As New StreamReader("${file}")`;
            } else if (accessMode === 'output') {
              return `Dim writer${fileNum} As New StreamWriter("${file}")`;
            } else {
              return match; // Keep original if not recognized
            }
          }
        );
        
        if (convertedLine !== oldLine) {
          issues.push({
            line: i + 1,
            message: 'File I/O converted to .NET StreamReader/StreamWriter',
            severity: 'info',
            code: 'CONV003'
          });
        }
      }
    }
    
    // Handle GoTo statements
    if (opts.removeGoto && /\bGoTo\b/i.test(convertedLine)) {
      issues.push({
        line: i + 1,
        message: 'GoTo statement should be refactored in modern code',
        severity: 'warning',
        code: 'CONV004'
      });
      
      if (opts.includeComments) {
        convertedLine += ' ' + "' TODO: Refactor GoTo statement";
      }
    }
    
    convertedLines.push(convertedLine);
  }
  
  // Calculate stats
  const totalLines = lines.length;
  const issueCount = issues.length;
  
  return {
    code: convertedLines.join('\n'),
    success: true,
    issues,
    stats: {
      totalLines,
      convertedLines: totalLines,
      issueCount,
      conversionRatio: 1.0
    }
  };
}

/**
 * Convert VB6 code to C#
 */
export function convertToCSharp(vb6Code: string, options: Partial<ConversionOptions> = {}): ConversionResult {
  // Merge options with defaults
  const opts: ConversionOptions = {
    ...DEFAULT_CONVERSION_OPTIONS,
    ...options
  };

  const lines = vb6Code.split('\n');
  const convertedLines: string[] = [];
  const issues: ConversionResult['issues'] = [];
  
  // Add C# imports
  convertedLines.push('using System;');
  convertedLines.push('using System.Windows.Forms;');
  convertedLines.push('');
  convertedLines.push('namespace VB6Conversion {');
  
  // Add class wrapping for procedures
  convertedLines.push('    public class Program {');
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indentation = '        '; // Default C# indentation
    let convertedLine = '';
    
    // Process line by line
    
    // Convert Sub/Function declarations
    if (/^\s*(?:Private|Public|Friend)?\s*Sub\s+(\w+)\s*\((.*)\)/i.test(line)) {
      const match = line.match(/^\s*(?:Private|Public|Friend)?\s*Sub\s+(\w+)\s*\((.*)\)/i);
      if (match) {
        const subName = match[1];
        let parameters = match[2];
        
        // Convert VB6 parameters to C# format
        parameters = parameters.replace(/(\w+)\s+As\s+(\w+)/gi, '$2 $1');
        
        convertedLine = `public void ${subName}(${parameters}) {`;
        
        if (opts.includeComments) {
          convertedLine += ' // Converted from VB6 Sub';
        }
      }
    }
    
    // Convert Function declarations
    else if (/^\s*(?:Private|Public|Friend)?\s*Function\s+(\w+)\s*\((.*)\)\s+As\s+(\w+)/i.test(line)) {
      const match = line.match(/^\s*(?:Private|Public|Friend)?\s*Function\s+(\w+)\s*\((.*)\)\s+As\s+(\w+)/i);
      if (match) {
        const funcName = match[1];
        let parameters = match[2];
        let returnType = match[3];
        
        // Convert VB6 types to C# types
        parameters = parameters.replace(/(\w+)\s+As\s+(\w+)/gi, '$2 $1');
        
        switch (returnType.toLowerCase()) {
          case 'integer': returnType = 'int'; break;
          case 'long': returnType = 'long'; break;
          case 'single': returnType = 'float'; break;
          case 'double': returnType = 'double'; break;
          case 'currency': returnType = 'decimal'; break;
          case 'string': returnType = 'string'; break;
          case 'boolean': returnType = 'bool'; break;
          case 'variant': 
            returnType = 'object';
            issues.push({
              line: i + 1,
              message: 'Variant return type converted to object',
              severity: 'info',
              code: 'CONV001'
            });
            break;
          // Add more type conversions as needed
        }
        
        convertedLine = `public ${returnType} ${funcName}(${parameters}) {`;
        
        if (opts.includeComments) {
          convertedLine += ' // Converted from VB6 Function';
        }
      }
    }
    
    // Convert End Sub/Function/If etc.
    else if (/^\s*End\s+(Sub|Function|If|Select|Property|With|Type)/i.test(line)) {
      convertedLine = '}';
    }
    
    // Convert variable declarations
    else if (/^\s*Dim\s+(\w+)\s+As\s+(\w+)/i.test(line)) {
      const match = line.match(/^\s*Dim\s+(\w+)\s+As\s+(\w+)/i);
      if (match) {
        const varName = match[1];
        let varType = match[2];
        
        // Convert VB6 types to C# types
        switch (varType.toLowerCase()) {
          case 'integer': varType = 'int'; break;
          case 'long': varType = 'long'; break;
          case 'single': varType = 'float'; break;
          case 'double': varType = 'double'; break;
          case 'currency': varType = 'decimal'; break;
          case 'string': varType = 'string'; break;
          case 'boolean': varType = 'bool'; break;
          case 'variant': 
            varType = 'object';
            issues.push({
              line: i + 1,
              message: 'Variant type converted to object',
              severity: 'info',
              code: 'CONV001'
            });
            break;
          // Add more type conversions as needed
        }
        
        convertedLine = `${varType} ${varName};`;
      }
    }
    
    // Convert If statements
    else if (/^\s*If\s+(.*?)\s+Then\s*(?!.*End\s+If)/i.test(line)) {
      const match = line.match(/^\s*If\s+(.*?)\s+Then\s*(.*)/i);
      if (match) {
        let condition = match[1];
        const afterThen = match[2];
        
        // Convert VB6 operators to C# operators
        condition = condition
          .replace(/\bAnd\b/gi, '&&')
          .replace(/\bOr\b/gi, '||')
          .replace(/\bNot\b/gi, '!')
          .replace(/\b<>\b/g, '!=')
          .replace(/\b=\b/g, '==');
        
        convertedLine = `if (${condition}) {`;
        
        // Handle single-line If statements
        if (afterThen && afterThen.trim() !== '') {
          issues.push({
            line: i + 1,
            message: 'Single-line If statement converted to multi-line',
            severity: 'info',
            code: 'CONV005'
          });
          
          convertedLine += `\n${indentation}    ${afterThen.trim()};`;
        }
      }
    }
    
    // Convert ElseIf statements
    else if (/^\s*ElseIf\s+(.*?)\s+Then/i.test(line)) {
      const match = line.match(/^\s*ElseIf\s+(.*?)\s+Then/i);
      if (match) {
        let condition = match[1];
        
        // Convert VB6 operators to C# operators
        condition = condition
          .replace(/\bAnd\b/gi, '&&')
          .replace(/\bOr\b/gi, '||')
          .replace(/\bNot\b/gi, '!')
          .replace(/\b<>\b/g, '!=')
          .replace(/\b=\b/g, '==');
        
        convertedLine = `} else if (${condition}) {`;
      }
    }
    
    // Convert Else statements
    else if (/^\s*Else\s*$/i.test(line)) {
      convertedLine = '} else {';
    }
    
    // Convert For loops
    else if (/^\s*For\s+(\w+)\s*=\s*(.*?)\s+To\s+(.*?)(?:\s+Step\s+(.*?))?$/i.test(line)) {
      const match = line.match(/^\s*For\s+(\w+)\s*=\s*(.*?)\s+To\s+(.*?)(?:\s+Step\s+(.*?))?$/i);
      if (match) {
        const varName = match[1];
        const startVal = match[2];
        const endVal = match[3];
        const step = match[4] || '1';
        
        if (step === '1') {
          convertedLine = `for (int ${varName} = ${startVal}; ${varName} <= ${endVal}; ${varName}++) {`;
        } else if (step.startsWith('-')) {
          convertedLine = `for (int ${varName} = ${startVal}; ${varName} >= ${endVal}; ${varName} += ${step}) {`;
        } else {
          convertedLine = `for (int ${varName} = ${startVal}; ${varName} <= ${endVal}; ${varName} += ${step}) {`;
        }
      }
    }
    
    // Convert Next statement
    else if (/^\s*Next(?:\s+\w+)?$/i.test(line)) {
      convertedLine = '}';
    }
    
    // Convert Do While loops
    else if (/^\s*Do\s+While\s+(.*?)$/i.test(line)) {
      const match = line.match(/^\s*Do\s+While\s+(.*?)$/i);
      if (match) {
        let condition = match[1];
        
        // Convert VB6 operators to C# operators
        condition = condition
          .replace(/\bAnd\b/gi, '&&')
          .replace(/\bOr\b/gi, '||')
          .replace(/\bNot\b/gi, '!')
          .replace(/\b<>\b/g, '!=')
          .replace(/\b=\b/g, '==');
        
        convertedLine = `while (${condition}) {`;
      }
    }
    
    // Convert Loop statements
    else if (/^\s*Loop$/i.test(line)) {
      convertedLine = '}';
    }
    
    // Convert VB6 comments to C# comments
    else if (/^\s*'(.*)$/i.test(line)) {
      const match = line.match(/^\s*'(.*)$/i);
      if (match) {
        convertedLine = `// ${match[1]}`;
      }
    }
    
    // If no specific conversion was applied, keep the line as is
    if (convertedLine === '') {
      convertedLine = line;
    }
    
    convertedLines.push(convertedLine);
  }
  
  // Close the class and namespace
  convertedLines.push('    }');
  convertedLines.push('}');
  
  // Calculate stats
  const totalLines = lines.length;
  const issueCount = issues.length;
  
  return {
    code: convertedLines.join('\n'),
    success: true,
    issues,
    stats: {
      totalLines,
      convertedLines: totalLines,
      issueCount,
      conversionRatio: 1.0
    }
  };
}

/**
 * Convert VB6 code to TypeScript
 */
export function convertToTypeScript(vb6Code: string, options: Partial<ConversionOptions> = {}): ConversionResult {
  // Implementation for converting VB6 to TypeScript
  // Similar to the other converters, but with TypeScript-specific translations
  
  const issues: ConversionResult['issues'] = [];
  
  // Simple placeholder implementation
  const convertedCode = vb6Code
    .replace(/Sub\s+/g, 'function ')
    .replace(/Function\s+(\w+)\s*\((.*)\)\s+As\s+(\w+)/g, 'function $1($2): $3')
    .replace(/Dim\s+(\w+)\s+As\s+(\w+)/g, 'let $1: $2;')
    .replace(/End\s+Sub/g, '}')
    .replace(/End\s+Function/g, '}')
    .replace(/If\s+(.*?)\s+Then/g, 'if ($1) {')
    .replace(/End\s+If/g, '}')
    .replace(/For\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/g, 'for (let $1 = $2; $1 <= $3; $1++)');
    
  issues.push({
    line: 1,
    message: 'Basic conversion completed, manual review needed',
    severity: 'info',
    code: 'TS001'
  });
  
  return {
    code: convertedCode,
    success: true,
    issues,
    stats: {
      totalLines: vb6Code.split('\n').length,
      convertedLines: vb6Code.split('\n').length,
      issueCount: issues.length,
      conversionRatio: 0.8  // Estimation for TypeScript conversion
    }
  };
}

/**
 * Convert VB6 code to JavaScript
 */
export function convertToJavaScript(vb6Code: string, options: Partial<ConversionOptions> = {}): ConversionResult {
  // Implementation for converting VB6 to JavaScript
  // Similar to TypeScript but without type annotations
  
  const issues: ConversionResult['issues'] = [];
  
  // Simple placeholder implementation
  const convertedCode = vb6Code
    .replace(/Sub\s+/g, 'function ')
    .replace(/Function\s+(\w+)\s*\((.*)\)(?:\s+As\s+\w+)?/g, 'function $1($2)')
    .replace(/Dim\s+(\w+)(?:\s+As\s+\w+)?/g, 'let $1;')
    .replace(/End\s+Sub/g, '}')
    .replace(/End\s+Function/g, '}')
    .replace(/If\s+(.*?)\s+Then/g, 'if ($1) {')
    .replace(/End\s+If/g, '}')
    .replace(/For\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/g, 'for (let $1 = $2; $1 <= $3; $1++)');
    
  issues.push({
    line: 1,
    message: 'Basic conversion completed, manual review needed',
    severity: 'info',
    code: 'JS001'
  });
  
  return {
    code: convertedCode,
    success: true,
    issues,
    stats: {
      totalLines: vb6Code.split('\n').length,
      convertedLines: vb6Code.split('\n').length,
      issueCount: issues.length,
      conversionRatio: 0.7  // Estimation for JavaScript conversion
    }
  };
}

/**
 * Convert VB6 code to Python
 */
export function convertToPython(vb6Code: string, options: Partial<ConversionOptions> = {}): ConversionResult {
  // Implementation for converting VB6 to Python
  
  const issues: ConversionResult['issues'] = [];
  
  // Simple placeholder implementation - in a real implementation this would be much more sophisticated
  const convertedCode = vb6Code
    .replace(/Sub\s+(\w+)\s*\((.*)\)/g, 'def $1($2):')
    .replace(/Function\s+(\w+)\s*\((.*)\)(?:\s+As\s+\w+)?/g, 'def $1($2):')
    .replace(/Dim\s+(\w+)(?:\s+As\s+\w+)?/g, '$1 = None')
    .replace(/End\s+Sub/g, '')
    .replace(/End\s+Function/g, '')
    .replace(/If\s+(.*?)\s+Then/g, 'if $1:')
    .replace(/End\s+If/g, '')
    .replace(/For\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/g, 'for $1 in range($2, $3+1):')
    .replace(/Next(?:\s+\w+)?/g, '')
    .replace(/'/g, '#');
    
  issues.push({
    line: 1,
    message: 'Basic conversion to Python completed, manual review needed',
    severity: 'warning',
    code: 'PY001'
  });
  
  return {
    code: convertedCode,
    success: true,
    issues,
    stats: {
      totalLines: vb6Code.split('\n').length,
      convertedLines: vb6Code.split('\n').length,
      issueCount: issues.length,
      conversionRatio: 0.6  // Estimation for Python conversion
    }
  };
}

/**
 * Convert VB6 code to the specified target language
 */
export function convertVB6Code(
  vb6Code: string, 
  targetLanguage: 'vbnet' | 'csharp' | 'typescript' | 'javascript' | 'python',
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  switch (targetLanguage) {
    case 'vbnet':
      return convertToVBNET(vb6Code, options);
    case 'csharp':
      return convertToCSharp(vb6Code, options);
    case 'typescript':
      return convertToTypeScript(vb6Code, options);
    case 'javascript':
      return convertToJavaScript(vb6Code, options);
    case 'python':
      return convertToPython(vb6Code, options);
    default:
      throw new Error(`Unsupported target language: ${targetLanguage}`);
  }
}