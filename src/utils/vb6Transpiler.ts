import { VB6ModuleAST, VB6Procedure } from './vb6Parser';

function transpileProcedure(proc: VB6Procedure): string {
  const params = proc.parameters.map(p => p.name).join(', ');
  let header = '';
  switch (proc.type) {
    case 'sub':
    case 'function':
      header = `function ${proc.name}(${params})`;
      break;
    case 'propertyGet':
      header = `get ${proc.name}(${params})`;
      break;
    case 'propertyLet':
    case 'propertySet':
      header = `set ${proc.name}(${params})`;
      break;
  }
  const body = proc.body.trimEnd();
  return `${header} {\n${body}\n}`;
}

/**
 * Very small VB6 to JavaScript transpiler using the AST produced by parseVB6Module.
 * Only converts procedures and properties to plain JavaScript functions.
 */
export function transpileModuleToJS(ast: VB6ModuleAST): string {
  const pieces: string[] = [];
  for (const proc of ast.procedures) {
    pieces.push(transpileProcedure(proc));
  }
  for (const prop of ast.properties) {
    if (prop.getter) pieces.push(transpileProcedure(prop.getter));
    if (prop.setter) pieces.push(transpileProcedure(prop.setter));
  }
  return pieces.join('\n\n');
}

export default transpileModuleToJS;
