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
  isArray?: boolean;
  arrayBounds?: string;
}

export interface VB6TypeField {
  name: string;
  type: string;
}

export interface VB6UserDefinedType {
  name: string;
  visibility: VB6Visibility;
  fields: VB6TypeField[];
}

export interface VB6ControlArray {
  name: string;
  controlType: string;
  indices: number[];
}

export interface VB6WithBlock {
  object: string;
  startLine: number;
  endLine: number;
  body: string;
}

export interface VB6EnumMember {
  name: string;
  value?: number;
}

export interface VB6Enum {
  name: string;
  visibility: VB6Visibility;
  members: VB6EnumMember[];
}

export interface VB6Constant {
  name: string;
  visibility: VB6Visibility;
  type: string | null;
  value: string;
}

export interface VB6ApiDeclaration {
  name: string;
  aliasName?: string;
  library: string;
  type: 'function' | 'sub';
  parameters: VB6Parameter[];
  returnType?: string | null;
}

export interface VB6ModuleAST {
  name: string;
  variables: VB6Variable[];
  constants: VB6Constant[];
  enums: VB6Enum[];
  apiDeclarations: VB6ApiDeclaration[];
  procedures: VB6Procedure[];
  properties: VB6Property[];
  events: VB6Event[];
  userDefinedTypes: VB6UserDefinedType[];
  controlArrays: VB6ControlArray[];
  withBlocks: VB6WithBlock[];
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
 * VB6 module parser extracting variable, procedure, type, and other information.
 */
export function parseVB6Module(code: string, name = 'Module1'): VB6ModuleAST {
  const lines = code.split(/\r?\n/);
  let moduleName = name;
  const variables: VB6Variable[] = [];
  const constants: VB6Constant[] = [];
  const enums: VB6Enum[] = [];
  const apiDeclarations: VB6ApiDeclaration[] = [];
  const procedures: VB6Procedure[] = [];
  const events: VB6Event[] = [];
  const properties: Record<string, VB6Property> = {};
  const userDefinedTypes: VB6UserDefinedType[] = [];
  const controlArrays: VB6ControlArray[] = [];
  const withBlocks: VB6WithBlock[] = [];
  let current: VB6Procedure | null = null;
  let currentType: VB6UserDefinedType | null = null;
  let currentEnum: VB6Enum | null = null;
  let currentWith: VB6WithBlock | null = null;
  let lineNumber = 0;

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
    lineNumber++;

    const attrMatch = trimmed.match(/^Attribute\s+VB_Name\s*=\s*"(.+)"/i);
    if (attrMatch) {
      moduleName = attrMatch[1];
      continue;
    }

    // Type...End Type (User Defined Type)
    const typeStartMatch = trimmed.match(/^(Public|Private)?\s*Type\s+(\w+)/i);
    if (typeStartMatch && !current) {
      currentType = {
        name: typeStartMatch[2],
        visibility: (typeStartMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        fields: [],
      };
      continue;
    }

    if (currentType) {
      if (/^End\s+Type/i.test(trimmed)) {
        userDefinedTypes.push(currentType);
        currentType = null;
        continue;
      }

      // Parse type field
      const fieldMatch = trimmed.match(/^(\w+)(?:\(.*?\))?\s+As\s+(\w+)/i);
      if (fieldMatch) {
        currentType.fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2],
        });
      }
      continue;
    }

    // Enum...End Enum
    const enumStartMatch = trimmed.match(/^(Public|Private)?\s*Enum\s+(\w+)/i);
    if (enumStartMatch && !current) {
      currentEnum = {
        name: enumStartMatch[2],
        visibility: (enumStartMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        members: [],
      };
      continue;
    }

    if (currentEnum) {
      if (/^End\s+Enum/i.test(trimmed)) {
        enums.push(currentEnum);
        currentEnum = null;
        continue;
      }

      // Parse enum member: Name or Name = Value
      const memberMatch = trimmed.match(/^(\w+)(?:\s*=\s*(.+))?/i);
      if (memberMatch) {
        currentEnum.members.push({
          name: memberMatch[1],
          value: memberMatch[2] ? parseInt(memberMatch[2], 10) : undefined,
        });
      }
      continue;
    }

    // Const declaration
    const constMatch = trimmed.match(
      /^(Public|Private)?\s*Const\s+(\w+)(?:\s+As\s+(\w+))?\s*=\s*(.+)/i
    );
    if (constMatch && !current) {
      constants.push({
        name: constMatch[2],
        visibility: (constMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
        type: constMatch[3] || null,
        value: constMatch[4],
      });
      continue;
    }

    // Declare Function/Sub (Windows API)
    const declareMatch = trimmed.match(
      /^(Public|Private)?\s*Declare\s+(Function|Sub)\s+(\w+)\s+Lib\s+"([^"]+)"(?:\s+Alias\s+"([^"]+)")?\s*(\([^)]*\))?(?:\s+As\s+(\w+))?/i
    );
    if (declareMatch && !current) {
      apiDeclarations.push({
        name: declareMatch[3],
        aliasName: declareMatch[5],
        library: declareMatch[4],
        type: declareMatch[2].toLowerCase() as 'function' | 'sub',
        parameters: parseParams(declareMatch[6]),
        returnType: declareMatch[7] || null,
      });
      continue;
    }

    // With...End With block
    const withStartMatch = trimmed.match(/^With\s+(.+)/i);
    if (withStartMatch && current) {
      currentWith = {
        object: withStartMatch[1],
        startLine: lineNumber,
        endLine: 0,
        body: '',
      };
      continue;
    }

    if (currentWith) {
      if (/^End\s+With/i.test(trimmed)) {
        currentWith.endLine = lineNumber;
        withBlocks.push(currentWith);
        currentWith = null;
        continue;
      }
      currentWith.body += line + '\n';
      continue;
    }

    // variable declaration (module level) - enhanced to detect arrays
    const varMatch = trimmed.match(
      /^(Public|Private)?\s*Dim\s+(\w+)(\([^)]*\))?(?:\s+As\s+(\w+))?/i
    );
    if (varMatch && !current) {
      variables.push({
        name: varMatch[2],
        varType: varMatch[4] || null,
        isArray: !!varMatch[3],
        arrayBounds: varMatch[3] || undefined,
      });
      continue;
    }

    // event declaration
    const eventMatch = trimmed.match(/^(Public|Private)?\s*Event\s+(\w+)\s*(\([^)]*\))?/i);
    if (eventMatch && !current) {
      events.push({
        name: eventMatch[2],
        parameters: parseParams(eventMatch[3]),
        visibility: (eventMatch[1]?.toLowerCase() as VB6Visibility) || 'public',
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
        body: '',
      };
      continue;
    }
    const funcMatch = trimmed.match(
      /^(Public|Private)?\s*Function\s+(\w+)\s*(\([^)]*\))?\s*(?:As\s+(\w+))?/i
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
    const propGetMatch = trimmed.match(
      /^(Public|Private)?\s*Property\s+Get\s+(\w+)\s*(\([^)]*\))?\s*(?:As\s+(\w+))?/i
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
    const propLetMatch = trimmed.match(
      /^(Public|Private)?\s*Property\s+(Let|Set)\s+(\w+)\s*(\([^)]*\))?/i
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
      current.body += line + '\n';
    }
  }

  pushCurrent();

  return {
    name: moduleName,
    variables,
    constants,
    enums,
    apiDeclarations,
    procedures,
    properties: Object.values(properties),
    events,
    userDefinedTypes,
    controlArrays,
    withBlocks,
  };
}
