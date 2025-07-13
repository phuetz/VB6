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
  const cleaned = paramStr.replace(/[()]/g, '').trim();
  if (!cleaned) return [];
  return cleaned.split(',').map(p => {
    const m = p.trim().match(/^(\w+)(?:\s+As\s+(\w+))?/i);
    return {
      name: m ? m[1] : p.trim(),
      type: m && m[2] ? m[2] : null,
    };
  });
}

/**
 * Very simple VB6 module parser extracting variable and procedure information.
 */
export function parseVB6Module(code: string, name = 'Module1'): VB6ModuleAST {
  const lines = code.split(/\r?\n/);
  let moduleName = name;
  const variables: VB6Variable[] = [];
  const procedures: VB6Procedure[] = [];
  const events: VB6Event[] = [];
  const properties: Record<string, VB6Property> = {};
  let current: VB6Procedure | null = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.type === 'propertyGet' || current.type === 'propertyLet' || current.type === 'propertySet') {
      const prop = properties[current.name] || {
        name: current.name,
        visibility: current.visibility,
        parameters: current.parameters,
        getter: undefined,
        setter: undefined
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
    let trimmed = line.trim();

    const attrMatch = trimmed.match(/^Attribute\s+VB_Name\s*=\s*"(.+)"/i);
    if (attrMatch) {
      moduleName = attrMatch[1];
      continue;
    }

    // variable declaration (module level)
    const varMatch = trimmed.match(/^(Public|Private)?\s*Dim\s+(\w+)(?:\s+As\s+(\w+))?/i);
    if (varMatch && !current) {
      variables.push({ name: varMatch[2], varType: varMatch[3] || null });
      continue;
    }

    // event declaration
    const eventMatch = trimmed.match(/^(Public|Private)?\s*Event\s+(\w+)\s*(\([^)]*\))?/i);
    if (eventMatch && !current) {
      events.push({
        name: eventMatch[2],
        parameters: parseParams(eventMatch[3]),
        visibility: (eventMatch[1]?.toLowerCase() as VB6Visibility) || 'public'
      });
      continue;
    }

    // procedure start
    const subMatch = trimmed.match(/^(Public|Private)?\s*Sub\s+(\w+)\s*(\([^)]*\))?/i);
    if (subMatch) {
      pushCurrent();
      current = {
        name: subMatch[2],
        type: 'sub',
        parameters: parseParams(subMatch[3]),
        visibility: (subMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: ''
      };
      continue;
    }
    const funcMatch = trimmed.match(/^(Public|Private)?\s*Function\s+(\w+)\s*(\([^)]*\))?\s*(?:As\s+(\w+))?/i);
    if (funcMatch) {
      pushCurrent();
      current = {
        name: funcMatch[2],
        type: 'function',
        parameters: parseParams(funcMatch[3]),
        returnType: funcMatch[4] || null,
        visibility: (funcMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: ''
      };
      continue;
    }
    const propGetMatch = trimmed.match(/^(Public|Private)?\s*Property\s+Get\s+(\w+)\s*(\([^)]*\))?\s*(?:As\s+(\w+))?/i);
    if (propGetMatch) {
      pushCurrent();
      current = {
        name: propGetMatch[2],
        type: 'propertyGet',
        parameters: parseParams(propGetMatch[3]),
        returnType: propGetMatch[4] || null,
        visibility: (propGetMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: ''
      };
      continue;
    }
    const propLetMatch = trimmed.match(/^(Public|Private)?\s*Property\s+(Let|Set)\s+(\w+)\s*(\([^)]*\))?/i);
    if (propLetMatch) {
      pushCurrent();
      current = {
        name: propLetMatch[3],
        type: propLetMatch[2].toLowerCase() === 'let' ? 'propertyLet' : 'propertySet',
        parameters: parseParams(propLetMatch[4]),
        visibility: (propLetMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        body: ''
      };
      continue;
    }

    if (/^End\s+(Sub|Function|Property)/i.test(trimmed)) {
      pushCurrent();
      continue;
    }

    if (current) {
      current.body += line + '\n';
    }
  }

  pushCurrent();

  return {
    name: moduleName,
    variables,
    procedures,
    properties: Object.values(properties),
    events
  };
}
