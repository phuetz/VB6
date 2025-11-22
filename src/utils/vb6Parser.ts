export interface VB6Parameter {
  name: string;
  type: string | null;
}

export type VB6Visibility = 'public' | 'private';

export type VB6ProcedureType = 'sub' | 'function' | 'propertyGet' | 'propertyLet' | 'propertySet';

export interface VB6Procedure {
  name: string;
  type: VB6ProcedureType;
  parameters: VB6Parameter[];
  returnType?: string | null;
  visibility: VB6Visibility;
  body: string;
}

export interface VB6Event {
  name: string;
  parameters: VB6Parameter[];
  visibility: VB6Visibility;
}

export interface VB6Property {
  name: string;
  visibility: VB6Visibility;
  parameters: VB6Parameter[];
  getter?: VB6Procedure;
  setter?: VB6Procedure;
}

export interface VB6Variable {
  name: string;
  varType: string | null;
}

export interface VB6ModuleAST {
  name: string;
  variables: VB6Variable[];
  procedures: VB6Procedure[];
  properties: VB6Property[];
  events: VB6Event[];
}

function parseParams(paramStr?: string): VB6Parameter[] {
  if (!paramStr) return [];
  
  // PARSER BUG FIX: Add bounds checking to prevent DoS
  if (paramStr.length > 1000) {
    throw new Error('Parameter string too long');
  }
  
  const cleaned = paramStr.replace(/[()]/g, '').trim();
  if (!cleaned) return [];
  
  // PARSER BUG FIX: Limit number of parameters to prevent DoS
  const params = cleaned.split(',');
  if (params.length > 50) {
    throw new Error('Too many parameters');
  }
  
  return params.map(p => {
    // PARSER BUG FIX: Use safer regex with bounds
    const trimmedParam = p.trim().substring(0, 100);
    const m = trimmedParam.match(/^([a-zA-Z_][a-zA-Z0-9_]{0,63})(?:\s+As\s+([a-zA-Z_][a-zA-Z0-9_]{0,63}))?$/i);
    return {
      name: m ? m[1] : trimmedParam.split(/\s+/)[0] || 'invalid',
      type: m && m[2] ? m[2] : null,
    };
  });
}

/**
 * Very simple VB6 module parser extracting variable and procedure information.
 */
// VB6Parser class wrapper for compatibility
export class VB6Parser {
  constructor() {}
  
  parse(code: string, name = 'Module1') {
    const ast = parseVB6Module(code, name);
    return {
      success: true,
      ast,
      errors: []
    };
  }
}

export function parseVB6Module(code: string, name = 'Module1'): VB6ModuleAST {
  // PARSER BUG FIX: Add input size limits to prevent DoS
  if (typeof code !== 'string') {
    throw new Error('Invalid code input');
  }
  if (code.length > 1000000) { // 1MB limit
    throw new Error('Code too large to parse');
  }
  if (typeof name !== 'string' || name.length > 100) {
    name = 'Module1';
  }
  const lines = code.split(/\r?\n/);
  let moduleName = name;
  const variables: VB6Variable[] = [];
  const procedures: VB6Procedure[] = [];
  const events: VB6Event[] = [];
  const properties: Record<string, VB6Property> = {};
  let current: VB6Procedure | null = null;

  const pushCurrent = () => {
    if (!current) return;
    if (
      current.type === 'propertyGet' ||
      current.type === 'propertyLet' ||
      current.type === 'propertySet'
    ) {
      const prop = properties[current.name] || {
        name: current.name,
        visibility: current.visibility,
        parameters: current.parameters,
        getter: undefined,
        setter: undefined,
      };
      if (current.type === 'propertyGet') prop.getter = current;
      else prop.setter = current;
      properties[current.name] = prop;
    } else {
      procedures.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // PARSER BUG FIX: Use safer regex with bounded quantifiers
    const attrMatch = trimmed.match(/^Attribute\s+VB_Name\s*=\s*"([^"]{1,100})"/i);
    if (attrMatch) {
      moduleName = attrMatch[1];
      continue;
    }

    // variable declaration (module level)
    // PARSER BUG FIX: Use bounded regex to prevent ReDoS
    const varMatch = trimmed.match(/^(Public|Private)?\s*Dim\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})(?:\s+As\s+([a-zA-Z_][a-zA-Z0-9_]{0,63}))?$/i);
    if (varMatch && !current) {
      variables.push({ name: varMatch[2], varType: varMatch[3] || null });
      continue;
    }

    // event declaration
    // PARSER BUG FIX: Bounded regex with limited parentheses content
    const eventMatch = trimmed.match(/^(Public|Private)?\s*Event\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})\s*(\([^)]{0,500}\))?$/i);
    if (eventMatch && !current) {
      events.push({
        name: eventMatch[2],
        parameters: parseParams(eventMatch[3]),
        visibility: (eventMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
      });
      continue;
    }

    // procedure start
    // PARSER BUG FIX: Bounded regex patterns
    const subMatch = trimmed.match(/^(Public|Private)?\s*Sub\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})\s*(\([^)]{0,500}\))?$/i);
    if (subMatch) {
      pushCurrent();
      current = {
        name: subMatch[2],
        type: 'sub',
        parameters: parseParams(subMatch[3]),
        visibility: (subMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: '',
      };
      continue;
    }
    // PARSER BUG FIX: Bounded regex patterns
    const funcMatch = trimmed.match(
      /^(Public|Private)?\s*Function\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})\s*(\([^)]{0,500}\))?\s*(?:As\s+([a-zA-Z_][a-zA-Z0-9_]{0,63}))?$/i
    );
    if (funcMatch) {
      pushCurrent();
      current = {
        name: funcMatch[2],
        type: 'function',
        parameters: parseParams(funcMatch[3]),
        returnType: funcMatch[4] || null,
        visibility: (funcMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: '',
      };
      continue;
    }
    // PARSER BUG FIX: Bounded regex patterns
    const propGetMatch = trimmed.match(
      /^(Public|Private)?\s*Property\s+Get\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})\s*(\([^)]{0,500}\))?\s*(?:As\s+([a-zA-Z_][a-zA-Z0-9_]{0,63}))?$/i
    );
    if (propGetMatch) {
      pushCurrent();
      current = {
        name: propGetMatch[2],
        type: 'propertyGet',
        parameters: parseParams(propGetMatch[3]),
        returnType: propGetMatch[4] || null,
        visibility: (propGetMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: '',
      };
      continue;
    }
    // PARSER BUG FIX: Bounded regex patterns
    const propLetMatch = trimmed.match(
      /^(Public|Private)?\s*Property\s+(Let|Set)\s+([a-zA-Z_][a-zA-Z0-9_]{0,63})\s*(\([^)]{0,500}\))?$/i
    );
    if (propLetMatch) {
      pushCurrent();
      current = {
        name: propLetMatch[3],
        type: propLetMatch[2].toLowerCase() === 'let' ? 'propertyLet' : 'propertySet',
        parameters: parseParams(propLetMatch[4]),
        visibility: (propLetMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: '',
      };
      continue;
    }

    if (/^End\s+(Sub|Function|Property)/i.test(trimmed)) {
      pushCurrent();
      continue;
    }

    if (current) {
      // PARSER BUG FIX: Limit body size to prevent memory exhaustion
      if (current.body.length < 100000) {
        current.body += line + '\n';
      }
    }
  }

  pushCurrent();

  return {
    name: moduleName,
    variables,
    procedures,
    properties: Object.values(properties),
    events,
  };
}

// Export object for backward compatibility with tests
export const vb6Parser = {
  parseVB6Code: (code: string) => {
    try {
      const result = parseVB6Module(code);
      return {
        success: true,
        procedures: result.procedures,
        variables: result.variables,
        events: result.events,
        properties: result.properties
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse error',
        procedures: [],
        variables: [],
        events: [],
        properties: []
      };
    }
  }
};
