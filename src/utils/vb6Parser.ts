export interface VB6Parameter {
  name: string;
  type: string | null;
}

export interface VB6Procedure {
  name: string;
  type: 'sub' | 'function';
  parameters: VB6Parameter[];
  returnType?: string | null;
  body: string;
}

export interface VB6Variable {
  name: string;
  varType: string | null;
}

export interface VB6ModuleAST {
  name: string;
  variables: VB6Variable[];
  procedures: VB6Procedure[];
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
  const variables: VB6Variable[] = [];
  const procedures: VB6Procedure[] = [];
  let current: VB6Procedure | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // variable declaration (module level)
    const varMatch = trimmed.match(/^Dim\s+(\w+)(?:\s+As\s+(\w+))?/i);
    if (varMatch && !current) {
      variables.push({ name: varMatch[1], varType: varMatch[2] || null });
      continue;
    }

    // procedure start
    const subMatch = trimmed.match(/^(?:Private|Public|Friend)?\s*Sub\s+(\w+)\s*(\([^)]*\))?/i);
    if (subMatch) {
      current = {
        name: subMatch[1],
        type: 'sub',
        parameters: parseParams(subMatch[2]),
        body: '',
      };
      continue;
    }
    const funcMatch = trimmed.match(/^(?:Private|Public|Friend)?\s*Function\s+(\w+)\s*(\([^)]*\))?\s*(?:As\s+(\w+))?/i);
    if (funcMatch) {
      current = {
        name: funcMatch[1],
        type: 'function',
        parameters: parseParams(funcMatch[2]),
        returnType: funcMatch[3] || null,
        body: '',
      };
      continue;
    }

    if (/^End\s+(Sub|Function)/i.test(trimmed)) {
      if (current) {
        procedures.push(current);
        current = null;
      }
      continue;
    }

    if (current) {
      current.body += line + '\n';
    }
  }

  return { name, variables, procedures };
}
