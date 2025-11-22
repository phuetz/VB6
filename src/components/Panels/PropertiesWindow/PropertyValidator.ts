/**
 * Property Validator for VB6 Controls
 * 
 * Provides comprehensive validation for all VB6 property types
 * with appropriate error messages and type coercion
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  correctedValue?: any;
  warnings?: string[];
}

export class PropertyValidator {
  
  /**
   * Validate a color property
   */
  static validateColor(value: any): ValidationResult {
    if (typeof value !== 'string') {
      return { isValid: false, errorMessage: 'Color must be a string' };
    }

    // VB6 system colors (&H8000000X&)
    if (value.match(/^&H8[0-9A-F]{7}&$/i)) {
      return { isValid: true };
    }

    // VB6 hex colors (&HBBGGRR&)
    if (value.match(/^&H[0-9A-F]{1,6}&$/i)) {
      return { isValid: true };
    }

    // HTML hex colors (#RRGGBB)
    if (value.match(/^#[0-9A-F]{6}$/i)) {
      return { isValid: true };
    }

    // HTML hex colors (#RGB)
    if (value.match(/^#[0-9A-F]{3}$/i)) {
      return { isValid: true };
    }

    // Named colors
    const namedColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
      'gray', 'grey', 'darkred', 'darkgreen', 'darkblue'
    ];
    
    if (namedColors.includes(value.toLowerCase())) {
      return { isValid: true };
    }

    return { 
      isValid: false, 
      errorMessage: 'Invalid color format. Use VB6 format (&HBBGGRR&) or HTML format (#RRGGBB)' 
    };
  }

  /**
   * Validate a numeric property
   */
  static validateNumber(value: any, min?: number, max?: number, allowFloat: boolean = true): ValidationResult {
    let numValue: number;

    if (typeof value === 'number') {
      numValue = value;
    } else if (typeof value === 'string') {
      // Handle VB6 numeric formats
      let cleanValue = value.trim();
      
      // Remove VB6 type suffixes
      cleanValue = cleanValue.replace(/[%&!#@]$/, '');
      
      numValue = parseFloat(cleanValue);
    } else {
      return { isValid: false, errorMessage: 'Must be a number' };
    }

    if (isNaN(numValue)) {
      return { isValid: false, errorMessage: 'Must be a valid number' };
    }

    if (!allowFloat && numValue !== Math.floor(numValue)) {
      return { 
        isValid: true, 
        correctedValue: Math.floor(numValue),
        warnings: ['Decimal part truncated to integer']
      };
    }

    if (min !== undefined && numValue < min) {
      return { 
        isValid: true, 
        correctedValue: min,
        warnings: [`Value adjusted to minimum of ${min}`]
      };
    }

    if (max !== undefined && numValue > max) {
      return { 
        isValid: true, 
        correctedValue: max,
        warnings: [`Value adjusted to maximum of ${max}`]
      };
    }

    return { isValid: true };
  }

  /**
   * Validate a boolean property
   */
  static validateBoolean(value: any): ValidationResult {
    if (typeof value === 'boolean') {
      return { isValid: true };
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === 'yes' || lower === '1' || lower === 'on') {
        return { isValid: true, correctedValue: true };
      }
      if (lower === 'false' || lower === 'no' || lower === '0' || lower === 'off') {
        return { isValid: true, correctedValue: false };
      }
    }

    if (typeof value === 'number') {
      return { isValid: true, correctedValue: value !== 0 };
    }

    return { isValid: false, errorMessage: 'Must be True or False' };
  }

  /**
   * Validate an enumeration property
   */
  static validateEnum(value: any, enumValues: string[]): ValidationResult {
    if (typeof value !== 'string') {
      return { isValid: false, errorMessage: 'Must be a string' };
    }

    // Exact match
    if (enumValues.includes(value)) {
      return { isValid: true };
    }

    // Try to match by number prefix (e.g., "0" matches "0 - None")
    const numericValue = value.trim();
    const matchByNumber = enumValues.find(enumVal => enumVal.startsWith(numericValue + ' '));
    if (matchByNumber) {
      return { isValid: true, correctedValue: matchByNumber };
    }

    // Try case-insensitive match
    const caseInsensitiveMatch = enumValues.find(enumVal => 
      enumVal.toLowerCase() === value.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      return { isValid: true, correctedValue: caseInsensitiveMatch };
    }

    return { 
      isValid: false, 
      errorMessage: `Must be one of: ${enumValues.join(', ')}` 
    };
  }

  /**
   * Validate a string property
   */
  static validateString(value: any, maxLength?: number, pattern?: RegExp): ValidationResult {
    if (value === null || value === undefined) {
      return { isValid: true, correctedValue: '' };
    }

    const stringValue = String(value);

    if (maxLength !== undefined && stringValue.length > maxLength) {
      return { 
        isValid: true, 
        correctedValue: stringValue.substring(0, maxLength),
        warnings: [`Text truncated to ${maxLength} characters`]
      };
    }

    if (pattern && !pattern.test(stringValue)) {
      return { isValid: false, errorMessage: 'Invalid format' };
    }

    return { isValid: true };
  }

  /**
   * Validate a font property
   */
  static validateFont(value: any): ValidationResult {
    if (typeof value === 'string') {
      try {
        const fontObj = JSON.parse(value);
        return this.validateFontObject(fontObj);
      } catch {
        return { isValid: false, errorMessage: 'Invalid font format' };
      }
    }

    if (typeof value === 'object' && value !== null) {
      return this.validateFontObject(value);
    }

    return { isValid: false, errorMessage: 'Font must be an object or JSON string' };
  }

  private static validateFontObject(fontObj: any): ValidationResult {
    const warnings: string[] = [];
    const correctedFont = { ...fontObj };

    // Validate font name
    if (!fontObj.name || typeof fontObj.name !== 'string') {
      correctedFont.name = 'MS Sans Serif';
      warnings.push('Font name corrected to "MS Sans Serif"');
    }

    // Validate font size
    const sizeResult = this.validateNumber(fontObj.size, 6, 72, false);
    if (!sizeResult.isValid) {
      correctedFont.size = 8;
      warnings.push('Font size corrected to 8pt');
    } else if (sizeResult.correctedValue !== undefined) {
      correctedFont.size = sizeResult.correctedValue;
      if (sizeResult.warnings) warnings.push(...sizeResult.warnings);
    }

    // Validate boolean properties
    ['bold', 'italic', 'underline', 'strikethrough'].forEach(prop => {
      if (fontObj[prop] !== undefined) {
        const boolResult = this.validateBoolean(fontObj[prop]);
        if (boolResult.correctedValue !== undefined) {
          correctedFont[prop] = boolResult.correctedValue;
        }
      }
    });

    return { 
      isValid: true, 
      correctedValue: warnings.length > 0 ? correctedFont : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate a picture property (base64 data URL)
   */
  static validatePicture(value: any): ValidationResult {
    if (!value || value === '') {
      return { isValid: true };
    }

    if (typeof value !== 'string') {
      return { isValid: false, errorMessage: 'Picture must be a string' };
    }

    // Check for data URL format
    if (value.startsWith('data:image/')) {
      try {
        // Basic validation of data URL structure
        const [header, data] = value.split(',');
        if (!header || !data) {
          return { isValid: false, errorMessage: 'Invalid picture format' };
        }
        return { isValid: true };
      } catch {
        return { isValid: false, errorMessage: 'Invalid picture format' };
      }
    }

    // Check for file path (for compatibility)
    if (value.match(/\.(bmp|jpg|jpeg|gif|png|ico)$/i)) {
      return { isValid: true };
    }

    return { isValid: false, errorMessage: 'Picture must be a valid image file or data URL' };
  }

  /**
   * Validate VB6 control name
   */
  static validateControlName(value: any, existingNames: string[] = []): ValidationResult {
    if (typeof value !== 'string') {
      return { isValid: false, errorMessage: 'Name must be a string' };
    }

    const name = value.trim();

    // Check empty
    if (name === '') {
      return { isValid: false, errorMessage: 'Name cannot be empty' };
    }

    // Check VB6 identifier rules
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      return { 
        isValid: false, 
        errorMessage: 'Name must start with a letter and contain only letters, numbers, and underscores' 
      };
    }

    // Check length (VB6 limit is 255 characters)
    if (name.length > 255) {
      return { isValid: false, errorMessage: 'Name cannot exceed 255 characters' };
    }

    // Check for VB6 reserved words
    const reservedWords = [
      'and', 'as', 'boolean', 'byref', 'byte', 'byval', 'call', 'case', 'class',
      'const', 'currency', 'date', 'declare', 'dim', 'do', 'double', 'each',
      'else', 'elseif', 'end', 'enum', 'event', 'exit', 'false', 'for', 'function',
      'get', 'global', 'gosub', 'goto', 'if', 'implements', 'in', 'integer',
      'is', 'let', 'lib', 'long', 'loop', 'me', 'mod', 'new', 'next', 'not',
      'nothing', 'object', 'on', 'option', 'optional', 'or', 'paramarray',
      'preserve', 'private', 'property', 'public', 'raiseevent', 'redim',
      'rem', 'resume', 'return', 'select', 'set', 'single', 'static', 'step',
      'stop', 'string', 'sub', 'then', 'to', 'true', 'type', 'typeof', 'until',
      'variant', 'wend', 'while', 'with', 'withevents', 'xor'
    ];

    if (reservedWords.includes(name.toLowerCase())) {
      return { isValid: false, errorMessage: 'Name cannot be a VB6 reserved word' };
    }

    // Check for duplicates
    if (existingNames.includes(name)) {
      return { isValid: false, errorMessage: 'Name already exists' };
    }

    return { isValid: true };
  }

  /**
   * Validate a tab index
   */
  static validateTabIndex(value: any, maxIndex?: number): ValidationResult {
    const numResult = this.validateNumber(value, 0, maxIndex, false);
    
    if (!numResult.isValid) {
      return numResult;
    }

    // Ensure it's an integer
    const intValue = Math.floor(Number(value));
    if (intValue !== Number(value)) {
      return { 
        isValid: true, 
        correctedValue: intValue,
        warnings: ['Tab index corrected to integer value']
      };
    }

    return numResult;
  }

  /**
   * Master validation function that routes to appropriate validators
   */
  static validateProperty(
    propertyType: string, 
    value: any, 
    options: {
      enumValues?: string[];
      min?: number;
      max?: number;
      maxLength?: number;
      pattern?: RegExp;
      existingNames?: string[];
    } = {}
  ): ValidationResult {
    
    switch (propertyType) {
      case 'color':
        return this.validateColor(value);
        
      case 'number':
        return this.validateNumber(value, options.min, options.max);
        
      case 'boolean':
        return this.validateBoolean(value);
        
      case 'enum':
        return this.validateEnum(value, options.enumValues || []);
        
      case 'string':
        return this.validateString(value, options.maxLength, options.pattern);
        
      case 'font':
        return this.validateFont(value);
        
      case 'picture':
        return this.validatePicture(value);
        
      case 'name':
        return this.validateControlName(value, options.existingNames);
        
      case 'tabindex':
        return this.validateTabIndex(value, options.max);
        
      default:
        return { isValid: true };
    }
  }

  /**
   * Convert value to VB6 format for saving
   */
  static formatForVB6(propertyType: string, value: any): string {
    switch (propertyType) {
      case 'boolean':
        return value ? 'True' : 'False';
        
      case 'string':
        return `"${String(value).replace(/"/g, '""')}"`;
        
      case 'number':
        return String(value);
        
      case 'color':
        // Convert HTML color to VB6 format if needed
        if (typeof value === 'string' && value.startsWith('#')) {
          const hex = value.substring(1);
          if (hex.length === 6) {
            // Convert #RRGGBB to &HBBGGRR&
            const r = hex.substring(0, 2);
            const g = hex.substring(2, 4);
            const b = hex.substring(4, 6);
            return `&H${b}${g}${r}&`;
          }
        }
        return String(value);
        
      case 'font':
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
        
      default:
        return String(value);
    }
  }
}