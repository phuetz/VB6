/**
 * VB6 Recursive Descent Parser - Ultra-Complete AST Generation
 * Remplace le parser regex par un vrai parser récursif
 * Support de TOUTES les constructions VB6
 */

import { VB6Token, VB6TokenType, VB6AdvancedLexer } from './VB6AdvancedLexer';

// ============================================================================
// AST NODE TYPES
// ============================================================================

export interface VB6ASTNode {
  type: string;
  line: number;
  column: number;
}

export interface VB6ModuleNode extends VB6ASTNode {
  type: 'Module';
  name: string;
  attributes: VB6AttributeNode[];
  declarations: VB6DeclarationNode[];
  procedures: VB6ProcedureNode[];
}

export interface VB6AttributeNode extends VB6ASTNode {
  type: 'Attribute';
  name: string;
  value: string;
}

export interface VB6DeclarationNode extends VB6ASTNode {
  type: 'Declaration';
  declarationType: 'Variable' | 'Constant' | 'Type' | 'Enum' | 'Declare' | 'Event';
  visibility: 'Public' | 'Private' | 'Friend' | 'Global' | null;
  name: string;
  dataType?: VB6TypeNode;
  initialValue?: VB6ExpressionNode;
  dimensions?: VB6ExpressionNode[];
  isStatic?: boolean;
  isWithEvents?: boolean;
  library?: string; // For Declare
  alias?: string; // For Declare
  parameters?: VB6ParameterNode[]; // For Event declarations
}

export interface VB6TypeNode extends VB6ASTNode {
  type: 'Type';
  typeName:
    | 'Integer'
    | 'Long'
    | 'Single'
    | 'Double'
    | 'String'
    | 'Boolean'
    | 'Variant'
    | 'Object'
    | 'Currency'
    | 'Decimal'
    | 'Date'
    | 'Byte'
    | 'Any'
    | string;
  isArray?: boolean;
  dimensions?: VB6ExpressionNode[];
  isFixedLength?: boolean;
  fixedLength?: number;
}

export interface VB6ProcedureNode extends VB6ASTNode {
  type: 'Procedure';
  procedureType: 'Sub' | 'Function' | 'PropertyGet' | 'PropertyLet' | 'PropertySet';
  name: string;
  visibility: 'Public' | 'Private' | 'Friend' | null;
  parameters: VB6ParameterNode[];
  returnType?: VB6TypeNode;
  isStatic?: boolean;
  body: VB6StatementNode[];
  implements?: string; // Interface name
}

export interface VB6ParameterNode extends VB6ASTNode {
  type: 'Parameter';
  name: string;
  parameterType: 'ByVal' | 'ByRef' | 'Optional' | 'ParamArray';
  dataType?: VB6TypeNode;
  defaultValue?: VB6ExpressionNode;
}

export interface VB6StatementNode extends VB6ASTNode {
  type: 'Statement';
  statementType: string;
  [key: string]: any;
}

export interface VB6ExpressionNode extends VB6ASTNode {
  type: 'Expression';
  expressionType: string;
  [key: string]: any;
}

export interface VB6ArrayAccessNode extends VB6ExpressionNode {
  expressionType: 'ArrayAccess';
  array: VB6ExpressionNode;
  indices: VB6ExpressionNode[];
}

// Statement types
export interface VB6AssignmentNode extends VB6StatementNode {
  statementType: 'Assignment';
  target: VB6ExpressionNode;
  value: VB6ExpressionNode;
  isSet?: boolean; // Set obj = ...
}

export interface VB6IfNode extends VB6StatementNode {
  statementType: 'If';
  condition: VB6ExpressionNode;
  thenStatements: VB6StatementNode[];
  elseIfClauses: { condition: VB6ExpressionNode; statements: VB6StatementNode[] }[];
  elseStatements: VB6StatementNode[];
}

export interface VB6ForNode extends VB6StatementNode {
  statementType: 'For';
  variable: string;
  startValue: VB6ExpressionNode;
  endValue: VB6ExpressionNode;
  stepValue?: VB6ExpressionNode;
  body: VB6StatementNode[];
}

export interface VB6ForEachNode extends VB6StatementNode {
  statementType: 'ForEach';
  variable: string;
  collection: VB6ExpressionNode;
  body: VB6StatementNode[];
}

export interface VB6SelectNode extends VB6StatementNode {
  statementType: 'Select';
  expression: VB6ExpressionNode;
  cases: VB6CaseNode[];
  elseStatements: VB6StatementNode[];
}

export interface VB6CaseNode extends VB6ASTNode {
  type: 'Case';
  values: VB6ExpressionNode[];
  isRange?: boolean;
  rangeStart?: VB6ExpressionNode;
  rangeEnd?: VB6ExpressionNode;
  statements: VB6StatementNode[];
}

export interface VB6WithNode extends VB6StatementNode {
  statementType: 'With';
  expression: VB6ExpressionNode;
  body: VB6StatementNode[];
}

export interface VB6DoNode extends VB6StatementNode {
  statementType: 'Do';
  conditionType: 'While' | 'Until' | 'None'; // None for Loop While/Until
  condition?: VB6ExpressionNode;
  isPostCondition?: boolean; // true for Do ... Loop While/Until
  body: VB6StatementNode[];
}

export interface VB6ErrorHandlingNode extends VB6StatementNode {
  statementType: 'OnError';
  action: 'GoTo' | 'Resume' | 'GoToZero';
  label?: string;
  resumeType?: 'Next' | 'Label';
}

// Expression types
export interface VB6BinaryOpNode extends VB6ExpressionNode {
  expressionType: 'BinaryOp';
  operator: string;
  left: VB6ExpressionNode;
  right: VB6ExpressionNode;
}

export interface VB6UnaryOpNode extends VB6ExpressionNode {
  expressionType: 'UnaryOp';
  operator: string;
  operand: VB6ExpressionNode;
}

export interface VB6FunctionCallNode extends VB6ExpressionNode {
  expressionType: 'FunctionCall';
  name: string;
  arguments: VB6ArgumentNode[];
}

export interface VB6ArgumentNode extends VB6ASTNode {
  type: 'Argument';
  value: VB6ExpressionNode;
  name?: string; // For named arguments
}

export interface VB6MemberAccessNode extends VB6ExpressionNode {
  expressionType: 'MemberAccess';
  object: VB6ExpressionNode;
  member: string;
}

export interface VB6LiteralNode extends VB6ExpressionNode {
  expressionType: 'Literal';
  literalType: 'String' | 'Number' | 'Boolean' | 'Date' | 'Nothing' | 'Null' | 'Empty';
  value: any;
}

export interface VB6IdentifierNode extends VB6ExpressionNode {
  expressionType: 'Identifier';
  name: string;
}

/** Visibility modifier type shared by declarations and procedures */
export type VB6Visibility = 'Public' | 'Private' | 'Friend' | 'Global' | null;

// ============================================================================
// PARSER ERROR TYPES
// ============================================================================

export interface VB6ParseError {
  message: string;
  line: number;
  column: number;
  expected?: string[];
  found?: string;
}

// ============================================================================
// RECURSIVE DESCENT PARSER
// ============================================================================

export class VB6RecursiveDescentParser {
  private tokens: VB6Token[];
  private position: number = 0;
  private errors: VB6ParseError[] = [];

  constructor(tokens: VB6Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse VB6 module
   */
  parseModule(): { ast: VB6ModuleNode | null; errors: VB6ParseError[] } {
    this.position = 0;
    this.errors = [];

    try {
      const ast = this.module();
      return { ast, errors: this.errors };
    } catch (error) {
      this.addError(`Parse failed: ${error instanceof Error ? error.message : error}`);
      return { ast: null, errors: this.errors };
    }
  }

  // ============================================================================
  // GRAMMAR RULES
  // ============================================================================

  /**
   * Module := [Attributes] [Declarations] [Procedures]
   */
  private module(): VB6ModuleNode {
    const startToken = this.currentToken();

    // Parse attributes
    const attributes: VB6AttributeNode[] = [];
    while (this.matchKeyword('attribute')) {
      const attr = this.attributeDeclaration();
      if (attr) attributes.push(attr);
    }

    // Extract module name from VB_Name attribute
    const nameAttr = attributes.find(a => a.name === 'VB_Name');
    const moduleName = nameAttr ? nameAttr.value.replace(/"/g, '') : 'Module1';

    // Parse option statements
    while (this.matchKeyword('option')) {
      this.optionStatement();
    }

    // Parse declarations and procedures
    const declarations: VB6DeclarationNode[] = [];
    const procedures: VB6ProcedureNode[] = [];

    while (!this.isAtEnd()) {
      this.skipNewlinesAndComments();

      if (this.isAtEnd()) break;

      const current = this.currentToken();

      // Check for procedure
      if (this.isProcedureStart()) {
        const proc = this.procedureDeclaration();
        if (proc) procedures.push(proc);
      }
      // Check for declaration
      else if (this.isDeclarationStart()) {
        const decl = this.declaration();
        if (decl) {
          if (Array.isArray(decl)) {
            declarations.push(...decl);
          } else {
            declarations.push(decl);
          }
        }
      }
      // Skip unknown tokens
      else {
        this.advance();
      }
    }

    return {
      type: 'Module',
      line: startToken.line,
      column: startToken.column,
      name: moduleName,
      attributes,
      declarations,
      procedures,
    };
  }

  /**
   * AttributeDeclaration := 'Attribute' Identifier '=' StringLiteral
   */
  private attributeDeclaration(): VB6AttributeNode | null {
    const startToken = this.currentToken();

    if (!this.consumeKeyword('attribute')) return null;

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected attribute name');
    if (!nameToken) return null;

    if (!this.consume(VB6TokenType.Operator, 'Expected =')) return null;

    const valueToken = this.consume(VB6TokenType.StringLiteral, 'Expected attribute value');
    if (!valueToken) return null;

    this.skipNewlinesAndComments();

    return {
      type: 'Attribute',
      line: startToken.line,
      column: startToken.column,
      name: nameToken.value,
      value: valueToken.value,
    };
  }

  /**
   * Option Statement := 'Option' ('Explicit' | 'Base' Number | 'Compare' CompareMode)
   */
  private optionStatement(): void {
    this.consumeKeyword('option');

    if (this.matchKeyword('explicit')) {
      this.advance();
    } else if (this.matchKeyword('base')) {
      this.advance();
      this.consume(VB6TokenType.NumberLiteral, 'Expected base number');
    } else if (this.matchKeyword('compare')) {
      this.advance();
      this.consume(VB6TokenType.Identifier, 'Expected compare mode');
    } else if (this.matchKeyword('private')) {
      this.advance();
      this.consumeKeyword('module');
    }

    this.skipNewlinesAndComments();
  }

  /**
   * Declaration := VariableDeclaration | ConstantDeclaration | TypeDeclaration | EnumDeclaration | DeclareDeclaration | EventDeclaration
   */
  private declaration(): VB6DeclarationNode | VB6DeclarationNode[] | null {
    const startToken = this.currentToken();
    const visibility = this.parseVisibility();

    this.skipWhitespace();

    if (this.matchKeyword('dim') || this.matchKeyword('static')) {
      return this.variableDeclarationList(startToken, visibility);
    } else if (this.matchKeyword('const')) {
      return this.constantDeclaration(startToken, visibility);
    } else if (this.matchKeyword('type')) {
      return this.typeDeclaration(startToken, visibility);
    } else if (this.matchKeyword('enum')) {
      return this.enumDeclaration(startToken, visibility);
    } else if (this.matchKeyword('declare')) {
      return this.declareDeclaration(startToken, visibility);
    } else if (this.matchKeyword('event')) {
      return this.eventDeclaration(startToken, visibility);
    } else if (visibility && this.currentToken().type === VB6TokenType.Identifier) {
      // VB6 allows variable declarations without Dim after visibility keywords
      // e.g., "Private myVar As Long" is equivalent to "Private Dim myVar As Long"
      return this.variableDeclarationList(startToken, visibility);
    }

    return null;
  }

  /**
   * Variable Declaration List := [Visibility] ['Static'] ['Dim'] Variable {',' Variable}
   * Variable := Identifier [WithEvents] ['(' ArrayDimensions ')'] ['As' Type]
   * In VB6, 'Dim' is optional after visibility keywords at module level
   *
   * VB6 Behavior:
   * - Dim a, b, c As Long: a and b are Variant, c is Long (type applies only to last)
   * - Dim a As Integer, b As String: each variable has its own type
   */
  private variableDeclarationList(
    startToken: VB6Token,
    visibility: VB6Visibility
  ): VB6DeclarationNode[] {
    const isStatic = this.matchKeyword('static');
    if (isStatic) this.advance();

    this.skipWhitespace();

    // Dim is optional after visibility keywords
    if (this.matchKeyword('dim')) {
      this.advance();
      this.skipWhitespace();
    }

    const declarations: VB6DeclarationNode[] = [];

    do {
      const varDecl = this.parseSingleVariable(startToken, visibility, isStatic);
      if (varDecl) {
        declarations.push(varDecl);
      } else {
        break;
      }

      this.skipWhitespace();

      // Check for comma (more variables follow)
      if (this.match(VB6TokenType.Punctuation, ',')) {
        this.advance(); // consume comma
        this.skipWhitespace();
      } else {
        break; // No more variables
      }
    } while (true);

    this.skipNewlinesAndComments();

    return declarations;
  }

  /**
   * Parse a single variable in a declaration list
   */
  private parseSingleVariable(
    startToken: VB6Token,
    visibility: VB6Visibility,
    isStatic: boolean
  ): VB6DeclarationNode | null {
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected variable name');
    if (!nameToken) return null;

    let dataType: VB6TypeNode | undefined;
    let dimensions: VB6ExpressionNode[] | undefined;
    let isWithEvents = false;

    this.skipWhitespace();

    // Check for WithEvents
    if (this.matchKeyword('withevents')) {
      this.advance();
      this.skipWhitespace();
      isWithEvents = true;
    }

    this.skipWhitespace();

    // Check for array dimensions
    if (this.match(VB6TokenType.Punctuation, '(')) {
      dimensions = this.parseArrayDimensions();
      this.skipWhitespace();
    }

    // Check for As clause
    if (this.matchKeyword('as')) {
      this.advance();
      this.skipWhitespace();
      dataType = this.parseType();
      this.skipWhitespace();
    }

    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Variable',
      visibility: visibility,
      name: nameToken.value,
      dataType,
      dimensions,
      isStatic,
      isWithEvents,
    };
  }

  /**
   * Procedure Declaration := [Visibility] ('Sub' | 'Function' | 'Property') ProcedureName [Parameters] [AsType] NewLine [Body] 'End' ProcedureType
   */
  private procedureDeclaration(): VB6ProcedureNode | null {
    const startToken = this.currentToken();
    const visibility = this.parseVisibility();
    const isStatic = this.matchKeyword('static');
    if (isStatic) this.advance();

    let procedureType: 'Sub' | 'Function' | 'PropertyGet' | 'PropertyLet' | 'PropertySet';

    if (this.matchKeyword('sub')) {
      procedureType = 'Sub';
      this.advance();
      this.skipWhitespace();
    } else if (this.matchKeyword('function')) {
      procedureType = 'Function';
      this.advance();
      this.skipWhitespace();
    } else if (this.matchKeyword('property')) {
      this.advance();
      this.skipWhitespace();
      if (this.matchKeyword('get')) {
        procedureType = 'PropertyGet';
        this.advance();
        this.skipWhitespace();
      } else if (this.matchKeyword('let')) {
        procedureType = 'PropertyLet';
        this.advance();
        this.skipWhitespace();
      } else if (this.matchKeyword('set')) {
        procedureType = 'PropertySet';
        this.advance();
        this.skipWhitespace();
      } else {
        this.addError('Expected Get, Let, or Set after Property');
        return null;
      }
    } else {
      return null;
    }

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected procedure name');
    if (!nameToken) return null;

    // Parse parameters
    let parameters: VB6ParameterNode[] = [];
    if (this.match(VB6TokenType.Punctuation, '(')) {
      parameters = this.parseParameterList();
    }

    // Parse return type for functions and property gets
    let returnType: VB6TypeNode | undefined;
    if (procedureType === 'Function' || procedureType === 'PropertyGet') {
      this.skipWhitespace();
      if (this.matchKeyword('as')) {
        this.advance();
        this.skipWhitespace();
        returnType = this.parseType();
      }
    }

    this.skipNewlinesAndComments();

    // Parse body
    const body: VB6StatementNode[] = [];

    while (!this.isAtEnd()) {
      if (this.matchKeyword('end')) {
        break;
      }

      this.skipNewlinesAndComments();

      // Check again after skipping whitespace
      if (this.matchKeyword('end')) {
        break;
      }

      const stmt = this.statement();
      if (stmt) {
        if (Array.isArray(stmt)) {
          body.push(...stmt);
        } else {
          body.push(stmt);
        }
      } else {
        // If statement parsing failed, check if we've hit a block-ending keyword
        // If so, break out of the loop rather than advancing
        if (this.matchKeyword('end') || this.matchKeyword('else') || this.matchKeyword('elseif')) {
          break;
        }
        // Otherwise advance past the problematic token
        this.advance();
      }
    }

    // Consume End keyword
    if (this.matchKeyword('end')) {
      this.advance();
      this.skipWhitespace();
      // Verify procedure type matches
      if (procedureType === 'Sub' && !this.matchKeyword('sub')) {
        this.addError('Expected End Sub');
      } else if (procedureType === 'Function' && !this.matchKeyword('function')) {
        this.addError('Expected End Function');
      } else if (procedureType.startsWith('Property') && !this.matchKeyword('property')) {
        this.addError('Expected End Property');
      } else {
        this.advance(); // Consume the procedure type keyword
        this.skipWhitespace();
      }
    }

    this.skipNewlinesAndComments();

    return {
      type: 'Procedure',
      line: startToken.line,
      column: startToken.column,
      procedureType,
      name: nameToken.value,
      visibility: visibility,
      parameters,
      returnType,
      isStatic,
      body,
    };
  }

  /**
   * Parse statement
   * Returns an array when parsing multiple variable declarations (Dim a, b, c)
   */
  private statement(): VB6StatementNode | VB6StatementNode[] | null {
    this.skipNewlinesAndComments();

    if (this.isAtEnd()) return null;

    const token = this.currentToken();

    // Keywords that end statement blocks - don't try to parse them as statements
    const blockEndKeywords = ['end', 'else', 'elseif', 'case', 'loop', 'next', 'wend', 'until'];
    if (
      token.type === VB6TokenType.Keyword &&
      blockEndKeywords.includes(token.value.toLowerCase())
    ) {
      return null;
    }

    // Check for labels (identifier followed by colon)
    // Labels are only valid at statement boundaries, not in expressions
    if (token.type === VB6TokenType.Identifier) {
      // Look ahead to see if this is a label (identifier:)
      // We need to check if the next token is a colon (peekToken(1) gives us position + 1)
      const nextToken = this.peekToken(1); // Get next token (position + 1)
      if (nextToken && nextToken.type === VB6TokenType.Punctuation && nextToken.value === ':') {
        return this.labelStatement();
      }
      return this.assignmentOrCall();
    }

    // Special keywords that can be used in expression statements (Me, This, etc.)
    if (this.matchKeyword('me')) {
      return this.assignmentOrCall();
    }

    // Control structures
    if (token.type === VB6TokenType.Keyword) {
      switch (token.value.toLowerCase()) {
        case 'if':
          return this.ifStatement();
        case 'for':
          return this.forStatement();
        case 'do':
          return this.doStatement();
        case 'select':
          return this.selectStatement();
        case 'with':
          return this.withStatement();
        case 'on':
          return this.errorHandlingStatement();
        case 'dim':
          return this.localVariableDeclaration();
        case 'redim':
          return this.redimStatement();
        case 'set':
          return this.setStatement();
        case 'call':
          return this.callStatement();
        case 'exit':
          return this.exitStatement();
        case 'goto':
          return this.gotoStatement();
        case 'gosub':
          return this.gosubStatement();
        case 'return':
          return this.returnStatement();
        case 'resume':
          return this.resumeStatement();
        default:
          // Return null for other keywords (they shouldn't be treated as expression statements)
          return null;
      }
    }

    return this.expressionStatement();
  }

  /**
   * Parse expression
   */
  private expression(): VB6ExpressionNode | null {
    return this.logicalOr();
  }

  private logicalOr(): VB6ExpressionNode | null {
    let expr = this.logicalAnd();
    if (!expr) return null;

    while (this.matchKeyword('or')) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.logicalAnd();
      if (!right) break;

      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: 'Or',
        left: expr,
        right,
      };
    }

    return expr;
  }

  private logicalAnd(): VB6ExpressionNode | null {
    let expr = this.equality();
    if (!expr) return null;

    this.skipWhitespace();
    while (this.matchKeyword('and')) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.equality();
      if (!right) break;

      this.skipWhitespace();
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: 'And',
        left: expr,
        right,
      };
    }

    return expr;
  }

  private equality(): VB6ExpressionNode | null {
    let expr = this.comparison();
    if (!expr) return null;

    this.skipWhitespace();
    while (
      this.match(VB6TokenType.Operator, '=') ||
      this.match(VB6TokenType.Operator, '<>') ||
      this.matchKeyword('is') ||
      this.matchKeyword('like')
    ) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.comparison();
      if (!right) break;

      this.skipWhitespace();
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private comparison(): VB6ExpressionNode | null {
    let expr = this.addition();
    if (!expr) return null;

    this.skipWhitespace();
    while (
      this.match(VB6TokenType.Operator, '>') ||
      this.match(VB6TokenType.Operator, '>=') ||
      this.match(VB6TokenType.Operator, '<') ||
      this.match(VB6TokenType.Operator, '<=')
    ) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.addition();
      if (!right) break;

      this.skipWhitespace();
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private addition(): VB6ExpressionNode | null {
    let expr = this.multiplication();
    if (!expr) return null;

    this.skipWhitespace();
    while (
      this.match(VB6TokenType.Operator, '+') ||
      this.match(VB6TokenType.Operator, '-') ||
      this.match(VB6TokenType.Operator, '&')
    ) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.multiplication();
      if (!right) break;

      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right,
      };

      this.skipWhitespace();
    }

    return expr;
  }

  private multiplication(): VB6ExpressionNode | null {
    let expr = this.exponentiation();
    if (!expr) return null;

    this.skipWhitespace();
    while (
      this.match(VB6TokenType.Operator, '*') ||
      this.match(VB6TokenType.Operator, '/') ||
      this.match(VB6TokenType.Operator, '\\') ||
      this.matchKeyword('mod')
    ) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.exponentiation();
      if (!right) break;

      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private exponentiation(): VB6ExpressionNode | null {
    let expr = this.unary();
    if (!expr) return null;

    if (this.match(VB6TokenType.Operator, '^')) {
      const operator = this.currentToken();
      this.advance();
      this.skipWhitespace();
      const right = this.exponentiation(); // Right associative
      if (!right) return expr;

      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: '^',
        left: expr,
        right,
      };
    }

    return expr;
  }

  private unary(): VB6ExpressionNode | null {
    if (
      this.match(VB6TokenType.Operator, '-') ||
      this.match(VB6TokenType.Operator, '+') ||
      this.matchKeyword('not')
    ) {
      const operator = this.currentToken();
      this.advance();
      const expr = this.unary();
      if (!expr) return null;

      return {
        type: 'Expression',
        expressionType: 'UnaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        operand: expr,
      };
    }

    return this.primary();
  }

  private primary(): VB6ExpressionNode | null {
    const token = this.currentToken();

    // Literals
    if (token.type === VB6TokenType.StringLiteral) {
      this.advance();
      return {
        type: 'Expression',
        expressionType: 'Literal',
        line: token.line,
        column: token.column,
        literalType: 'String',
        value: token.value,
      };
    }

    if (token.type === VB6TokenType.NumberLiteral || token.type === VB6TokenType.FloatLiteral) {
      this.advance();
      return {
        type: 'Expression',
        expressionType: 'Literal',
        line: token.line,
        column: token.column,
        literalType: 'Number',
        value:
          token.type === VB6TokenType.FloatLiteral
            ? parseFloat(token.value)
            : parseInt(token.value),
      };
    }

    if (token.type === VB6TokenType.DateLiteral) {
      this.advance();
      return {
        type: 'Expression',
        expressionType: 'Literal',
        line: token.line,
        column: token.column,
        literalType: 'Date',
        value: new Date(token.value),
      };
    }

    // Keywords as literals
    if (this.matchKeyword('true') || this.matchKeyword('false')) {
      this.advance();
      return {
        type: 'Expression',
        expressionType: 'Literal',
        line: token.line,
        column: token.column,
        literalType: 'Boolean',
        value: token.value.toLowerCase() === 'true',
      };
    }

    if (this.matchKeyword('nothing') || this.matchKeyword('null') || this.matchKeyword('empty')) {
      this.advance();
      return {
        type: 'Expression',
        expressionType: 'Literal',
        line: token.line,
        column: token.column,
        literalType:
          token.value.toLowerCase() === 'nothing'
            ? 'Nothing'
            : token.value.toLowerCase() === 'null'
              ? 'Null'
              : 'Empty',
        value: null,
      };
    }

    // Parenthesized expression
    if (this.match(VB6TokenType.Punctuation, '(')) {
      this.advance();
      const expr = this.expression();
      if (!this.consume(VB6TokenType.Punctuation, 'Expected )')) return null;
      return expr;
    }

    // Implicit With member access (.PropertyName in With block)
    if (this.match(VB6TokenType.Punctuation, '.')) {
      this.advance();
      const member = this.consume(VB6TokenType.Identifier, 'Expected member name after .');
      if (!member) return null;

      // Create a WithMemberAccess expression (the With object will be resolved at runtime)
      let expr: VB6ExpressionNode = {
        type: 'Expression',
        expressionType: 'WithMemberAccess',
        line: token.line,
        column: token.column,
        member: member.value,
      };

      // Handle chained member access or function calls
      while (true) {
        this.skipWhitespace();
        if (this.match(VB6TokenType.Punctuation, '.')) {
          this.advance();
          const nextMember = this.consume(VB6TokenType.Identifier, 'Expected member name');
          if (!nextMember) break;
          expr = {
            type: 'Expression',
            expressionType: 'MemberAccess',
            line: expr.line,
            column: expr.column,
            object: expr,
            member: nextMember.value,
          };
        } else if (this.match(VB6TokenType.Punctuation, '(')) {
          // Function call or array access on the member
          this.advance();
          const args: VB6ExpressionNode[] = [];
          this.skipWhitespace();
          if (!this.match(VB6TokenType.Punctuation, ')')) {
            do {
              this.skipWhitespace();
              const arg = this.expression();
              if (arg) args.push(arg);
              this.skipWhitespace();
            } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
          }
          this.consume(VB6TokenType.Punctuation, 'Expected )');
          expr = {
            type: 'Expression',
            expressionType: 'FunctionCall',
            line: expr.line,
            column: expr.column,
            name: (expr.member as string) || 'unknown',
            callee: expr,
            arguments: args.map(a => ({
              type: 'Argument',
              value: a,
              line: a.line,
              column: a.column,
            })),
          };
        } else {
          break;
        }
      }

      return expr;
    }

    // Identifier (variable, function call, or member access)
    if (token.type === VB6TokenType.Identifier) {
      return this.identifierExpression();
    }

    // Special keywords that can be used like identifiers (Me, This, etc.)
    if (this.matchKeyword('me')) {
      return this.identifierExpression();
    }

    // Don't treat statement-ending keywords or parameter keywords as errors in expressions
    // These should be handled at the statement or parameter level
    if (
      this.matchKeyword('end') ||
      this.matchKeyword('else') ||
      this.matchKeyword('elseif') ||
      this.matchKeyword('case') ||
      this.matchKeyword('loop') ||
      this.matchKeyword('next') ||
      this.matchKeyword('wend') ||
      this.matchKeyword('until') ||
      this.matchKeyword('sub') ||
      this.matchKeyword('function') ||
      this.matchKeyword('property') ||
      this.matchKeyword('byval') ||
      this.matchKeyword('byref') ||
      this.matchKeyword('optional') ||
      this.matchKeyword('paramarray')
    ) {
      return null;
    }

    // Skip whitespace tokens silently
    if (token.type === VB6TokenType.Whitespace) {
      this.advance();
      return this.primary();
    }

    // Don't report errors for empty values (likely whitespace that wasn't filtered)
    if (!token.value || token.value.trim() === '') {
      return null;
    }

    this.addError(`Unexpected token: ${token.value}`);
    return null;
  }

  // Helper methods (simplified for space)

  private identifierExpression(): VB6ExpressionNode | null {
    const token = this.currentToken();
    this.advance();

    let expr: VB6ExpressionNode = {
      type: 'Expression',
      expressionType: 'Identifier',
      line: token.line,
      column: token.column,
      name: token.value,
    };

    // Handle member access, array subscripting, and function calls
    while (true) {
      // Check if there's whitespace before the next token
      // This is important for distinguishing:
      // - Debug.Print (member access, no space before .)
      // - Debug.Print .FirstName (Print is member, .FirstName is argument with space before)
      const hadWhitespace = this.currentToken().type === VB6TokenType.Whitespace;
      this.skipWhitespace();

      if (this.match(VB6TokenType.Punctuation, '.')) {
        // If there was whitespace before the '.', this might be a With member access
        // used as an argument, not a continuation of member access chain.
        // Check if the next token after '.' is an identifier (member access)
        // vs if this could be a With member access (.PropertyName as argument)
        if (hadWhitespace) {
          // Space before '.' suggests this is a new expression (With member access)
          // Don't treat it as member access continuation
          break;
        }

        this.advance();
        const member = this.consume(VB6TokenType.Identifier, 'Expected member name');
        if (!member) break;

        expr = {
          type: 'Expression',
          expressionType: 'MemberAccess',
          line: expr.line,
          column: expr.column,
          object: expr,
          member: member.value,
        };
      } else if (this.match(VB6TokenType.Punctuation, '(')) {
        // Could be array subscripting or function call
        // Look ahead to determine which one
        const savedPosition = this.position;
        this.advance(); // consume '('
        this.skipWhitespace();

        // Parse indices/arguments
        const indices: VB6ExpressionNode[] = [];
        let isValidArrayAccess = true;

        if (!this.match(VB6TokenType.Punctuation, ')')) {
          do {
            this.skipWhitespace();
            const indexExpr = this.expression();
            if (!indexExpr) {
              isValidArrayAccess = false;
              break;
            }

            indices.push(indexExpr);
            this.skipWhitespace();
          } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
        }

        if (!this.consume(VB6TokenType.Punctuation, 'Expected )')) {
          isValidArrayAccess = false;
        }

        // Both array access and function calls look the same syntactically
        // In VB6, we don't have a way to distinguish them at parse time
        // So we treat them as array access for now (the transpiler will handle function calls differently)
        if (isValidArrayAccess && indices.length > 0) {
          expr = {
            type: 'Expression',
            expressionType: 'ArrayAccess',
            line: expr.line,
            column: expr.column,
            array: expr,
            indices,
          } as VB6ArrayAccessNode;
        } else if (isValidArrayAccess) {
          // Empty parentheses - could be parameterless function call
          expr = {
            type: 'Expression',
            expressionType: 'FunctionCall',
            line: expr.line,
            column: expr.column,
            name: (expr as VB6IdentifierNode).name,
            arguments: [],
          };
        } else {
          // Failed to parse, restore position and break
          this.position = savedPosition;
          break;
        }
      } else {
        break;
      }
    }

    return expr;
  }

  // Additional parsing methods would go here...
  // (ifStatement, forStatement, etc. - simplified for space)

  private ifStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'If'
    this.skipWhitespace();

    const condition = this.expression();
    if (!condition) return null;

    this.skipWhitespace();
    if (!this.matchKeyword('then')) {
      return null; // Not a valid If statement
    }
    this.advance(); // consume 'Then'

    this.skipNewlinesAndComments();

    const thenStatements: VB6StatementNode[] = [];
    const elseIfClauses: { condition: VB6ExpressionNode; statements: VB6StatementNode[] }[] = [];
    const elseStatements: VB6StatementNode[] = [];

    // Parse then statements - stop at ElseIf, Else, or End
    while (!this.isAtEnd()) {
      // Check for end of if block
      if (
        this.matchKeyword('elseif') ||
        this.matchKeyword('else') ||
        (this.matchKeyword('end') && this.peekKeyword('if'))
      ) {
        break;
      }

      const stmt = this.statement();
      if (stmt) {
        if (Array.isArray(stmt)) {
          thenStatements.push(...stmt);
        } else {
          thenStatements.push(stmt);
        }
      } else {
        // Skip to next potential keyword if not at a control keyword
        if (
          !this.matchKeyword('elseif') &&
          !this.matchKeyword('else') &&
          !this.matchKeyword('end')
        ) {
          this.advance();
        } else {
          break;
        }
      }
    }

    // Parse ElseIf clauses
    while (this.matchKeyword('elseif')) {
      this.advance(); // consume 'ElseIf'
      this.skipWhitespace();

      const elseIfCondition = this.expression();
      if (!elseIfCondition) break;

      this.skipWhitespace();
      if (!this.matchKeyword('then')) {
        break;
      }
      this.advance(); // consume 'Then'

      this.skipNewlinesAndComments();

      const elseIfStatements: VB6StatementNode[] = [];
      while (!this.isAtEnd()) {
        // Check for next control structure
        if (
          this.matchKeyword('elseif') ||
          this.matchKeyword('else') ||
          (this.matchKeyword('end') && this.peekKeyword('if'))
        ) {
          break;
        }

        const stmt = this.statement();
        if (stmt) {
          if (Array.isArray(stmt)) {
            elseIfStatements.push(...stmt);
          } else {
            elseIfStatements.push(stmt);
          }
        } else {
          // Skip to next potential keyword if not at a control keyword
          if (
            !this.matchKeyword('elseif') &&
            !this.matchKeyword('else') &&
            !this.matchKeyword('end')
          ) {
            this.advance();
          } else {
            break;
          }
        }
      }

      elseIfClauses.push({
        condition: elseIfCondition,
        statements: elseIfStatements,
      });
    }

    // Parse Else clause
    if (this.matchKeyword('else')) {
      this.advance(); // consume 'Else'
      this.skipNewlinesAndComments();

      while (!this.isAtEnd()) {
        // Check for End If
        if (this.matchKeyword('end') && this.peekKeyword('if')) {
          break;
        }

        const stmt = this.statement();
        if (stmt) {
          if (Array.isArray(stmt)) {
            elseStatements.push(...stmt);
          } else {
            elseStatements.push(stmt);
          }
        } else {
          // Skip to next potential keyword if not at a control keyword
          if (!this.matchKeyword('end')) {
            this.advance();
          } else {
            break;
          }
        }
      }
    }

    // Consume End If
    if (this.matchKeyword('end')) {
      this.advance(); // consume 'End'
      this.skipWhitespace();
      if (this.matchKeyword('if')) {
        this.advance(); // consume 'If'
      }
    }

    this.skipNewlinesAndComments();

    return {
      type: 'Statement',
      statementType: 'If',
      line: startToken.line,
      column: startToken.column,
      condition,
      thenStatements,
      elseIfClauses,
      elseStatements,
    };
  }

  // Utility methods

  private currentToken(): VB6Token {
    return (
      this.tokens[this.position] || {
        type: VB6TokenType.EOF,
        value: '',
        line: 0,
        column: 0,
        length: 0,
      }
    );
  }

  private peekToken(offset: number = 1): VB6Token | null {
    let index = this.position + offset;
    // Skip whitespace tokens when peeking ahead
    while (index < this.tokens.length && this.tokens[index].type === VB6TokenType.Whitespace) {
      index++;
    }
    if (index < this.tokens.length) {
      return this.tokens[index];
    }
    return null;
  }

  private advance(): VB6Token {
    if (!this.isAtEnd()) this.position++;
    return this.tokens[this.position - 1];
  }

  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.currentToken().type === VB6TokenType.EOF;
  }

  private match(type: VB6TokenType, value?: string): boolean {
    const token = this.currentToken();
    return token.type === type && (value === undefined || token.value === value);
  }

  private matchKeyword(keyword: string): boolean {
    const token = this.currentToken();
    return (
      token.type === VB6TokenType.Keyword && token.value.toLowerCase() === keyword.toLowerCase()
    );
  }

  private consume(type: VB6TokenType, message: string): VB6Token | null {
    // Skip whitespace before consuming
    this.skipWhitespace();

    if (this.currentToken().type === type) {
      return this.advance();
    }

    this.addError(message);
    return null;
  }

  private consumeKeyword(keyword: string): boolean {
    if (this.matchKeyword(keyword)) {
      this.advance();
      return true;
    }
    return false;
  }

  private skipNewlinesAndComments(): void {
    while (
      this.currentToken().type === VB6TokenType.NewLine ||
      this.currentToken().type === VB6TokenType.Comment ||
      this.currentToken().type === VB6TokenType.Whitespace
    ) {
      this.advance();
    }
  }

  private skipWhitespace(): void {
    while (this.currentToken().type === VB6TokenType.Whitespace) {
      this.advance();
    }
  }

  private addError(message: string): void {
    const token = this.currentToken();
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
      found: token.value,
    });
  }

  // Additional helper methods (simplified)...

  private parseVisibility(): VB6Visibility {
    if (this.matchKeyword('public')) {
      this.advance();
      return 'Public';
    } else if (this.matchKeyword('private')) {
      this.advance();
      return 'Private';
    } else if (this.matchKeyword('friend')) {
      this.advance();
      return 'Friend';
    } else if (this.matchKeyword('global')) {
      this.advance();
      return 'Global';
    }
    return null;
  }

  private parseType(): VB6TypeNode {
    const token = this.currentToken();

    // Valid VB6 data types
    const validTypes = new Set([
      'integer',
      'long',
      'single',
      'double',
      'string',
      'boolean',
      'variant',
      'object',
      'date',
      'byte',
      'currency',
      'decimal',
      'any',
    ]);

    // Normalize type name (case-insensitive)
    const lowerValue = token.value.toLowerCase();

    // Validate it's a valid VB6 type
    if (!validTypes.has(lowerValue)) {
      // Still advance to avoid infinite loops, but don't error - let other parts of the parser handle it
      this.advance();
      return {
        type: 'Type',
        line: token.line,
        column: token.column,
        typeName: token.value, // Use as-is if not recognized
      };
    }

    this.advance();

    // Normalize the type name to match what mapVB6TypeToJS expects (PascalCase)
    // Handle all VB6 types
    const typeMap: Record<string, string> = {
      integer: 'Integer',
      long: 'Long',
      single: 'Single',
      double: 'Double',
      string: 'String',
      boolean: 'Boolean',
      variant: 'Variant',
      object: 'Object',
      date: 'Date',
      byte: 'Byte',
      currency: 'Currency',
      decimal: 'Decimal',
      any: 'Any',
    };

    const normalizedType = typeMap[lowerValue] || 'Variant';

    return {
      type: 'Type',
      line: token.line,
      column: token.column,
      typeName: normalizedType,
    };
  }

  private parseParameterList(): VB6ParameterNode[] {
    const parameters: VB6ParameterNode[] = [];

    this.advance(); // consume (
    this.skipWhitespace();

    if (!this.match(VB6TokenType.Punctuation, ')')) {
      do {
        this.skipWhitespace();
        const param = this.parseParameter();
        if (param) parameters.push(param);
        this.skipWhitespace();
      } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
    }

    this.skipWhitespace();
    this.consume(VB6TokenType.Punctuation, 'Expected )');

    return parameters;
  }

  private parseParameter(): VB6ParameterNode | null {
    const startToken = this.currentToken();

    // Parse parameter type
    let parameterType: 'ByVal' | 'ByRef' | 'Optional' | 'ParamArray' = 'ByVal';

    if (this.matchKeyword('byval')) {
      parameterType = 'ByVal';
      this.advance();
      this.skipWhitespace();
    } else if (this.matchKeyword('byref')) {
      parameterType = 'ByRef';
      this.advance();
      this.skipWhitespace();
    } else if (this.matchKeyword('optional')) {
      parameterType = 'Optional';
      this.advance();
      this.skipWhitespace();
    } else if (this.matchKeyword('paramarray')) {
      parameterType = 'ParamArray';
      this.advance();
      this.skipWhitespace();
    }

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected parameter name');
    if (!nameToken) return null;

    this.skipWhitespace();

    let dataType: VB6TypeNode | undefined;
    let defaultValue: VB6ExpressionNode | undefined;

    if (this.matchKeyword('as')) {
      this.advance();
      this.skipWhitespace();
      dataType = this.parseType();
      this.skipWhitespace();
    }

    if (this.match(VB6TokenType.Operator, '=')) {
      this.advance();
      this.skipWhitespace();
      defaultValue = this.expression();
    }

    return {
      type: 'Parameter',
      line: startToken.line,
      column: startToken.column,
      name: nameToken.value,
      parameterType,
      dataType,
      defaultValue,
    };
  }

  private parseArrayDimensions(): VB6ExpressionNode[] {
    this.advance(); // consume (
    const dimensions: VB6ExpressionNode[] = [];

    this.skipWhitespace();

    // Handle empty dimensions: arr()
    if (this.match(VB6TokenType.Punctuation, ')')) {
      this.advance(); // consume )
      return dimensions;
    }

    // Parse comma-separated dimensions
    do {
      this.skipWhitespace();
      const expr = this.expression();
      if (expr) {
        dimensions.push(expr);
      }
      this.skipWhitespace();

      // Check for comma
      if (this.match(VB6TokenType.Punctuation, ',')) {
        this.advance(); // consume comma
      } else {
        break; // No more dimensions
      }
    } while (true);

    this.skipWhitespace();
    this.consume(VB6TokenType.Punctuation, 'Expected )');

    return dimensions;
  }

  // Complete implementations of statement types
  private constantDeclaration(
    startToken: VB6Token,
    visibility: VB6Visibility
  ): VB6DeclarationNode | null {
    if (!this.consumeKeyword('const')) return null;

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected constant name');
    if (!nameToken) return null;

    let dataType: VB6TypeNode | undefined;
    if (this.matchKeyword('as')) {
      this.advance();
      dataType = this.parseType();
    }

    if (!this.consume(VB6TokenType.Operator, 'Expected = in constant declaration')) return null;

    const initialValue = this.expression();
    if (!initialValue) return null;

    this.skipNewlinesAndComments();

    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Constant',
      visibility: visibility,
      name: nameToken.value,
      dataType,
      initialValue,
    };
  }

  private typeDeclaration(
    startToken: VB6Token,
    visibility: VB6Visibility
  ): VB6DeclarationNode | null {
    if (!this.consumeKeyword('type')) return null;

    this.skipWhitespace();
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected type name');
    if (!nameToken) return null;

    this.skipNewlinesAndComments();

    // Parse type members properly
    const properties: { name: string; dataType?: VB6TypeNode; dimensions?: VB6ExpressionNode[] }[] =
      [];

    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      this.skipWhitespace();

      // Skip newlines and comments
      if (
        this.currentToken().type === VB6TokenType.Newline ||
        this.currentToken().type === VB6TokenType.Comment
      ) {
        this.advance();
        continue;
      }

      // Parse property: PropertyName[(dimensions)] As Type
      if (this.currentToken().type === VB6TokenType.Identifier) {
        const propName = this.currentToken().value;
        this.advance();
        this.skipWhitespace();

        let dimensions: VB6ExpressionNode[] | undefined;

        // Check for array dimensions
        if (this.match(VB6TokenType.Punctuation, '(')) {
          dimensions = this.parseArrayDimensions();
          this.skipWhitespace();
        }

        let dataType: VB6TypeNode | undefined;

        // Parse As Type
        if (this.matchKeyword('as')) {
          this.advance();
          this.skipWhitespace();
          dataType = this.parseType();
        }

        properties.push({ name: propName, dataType, dimensions });

        this.skipNewlinesAndComments();
      } else {
        // Skip unknown tokens
        this.advance();
      }
    }

    if (this.matchKeyword('end')) {
      this.advance();
      this.skipWhitespace();
      this.consumeKeyword('type');
    }

    const decl: VB6DeclarationNode & { properties?: typeof properties } = {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Type',
      visibility: visibility,
      name: nameToken.value,
    };

    // Attach properties to the declaration
    decl.properties = properties;

    return decl;
  }

  private enumDeclaration(
    startToken: VB6Token,
    visibility: VB6Visibility
  ): VB6DeclarationNode | null {
    if (!this.consumeKeyword('enum')) return null;

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected enum name');
    if (!nameToken) return null;

    this.skipNewlinesAndComments();

    // Parse enum members (simplified - just skip to End Enum)
    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      this.advance();
    }

    if (this.matchKeyword('end')) {
      this.advance();
      this.consumeKeyword('enum');
    }

    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Enum',
      visibility: visibility,
      name: nameToken.value,
    };
  }

  private declareDeclaration(
    startToken: VB6Token,
    visibility: VB6Visibility
  ): VB6DeclarationNode | null {
    if (!this.consumeKeyword('declare')) return null;

    // Parse Declare Function/Sub
    let procedureType = 'function';
    if (this.matchKeyword('function')) {
      this.advance();
    } else if (this.matchKeyword('sub')) {
      this.advance();
      procedureType = 'sub';
    }

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected function name');
    if (!nameToken) return null;

    if (!this.consumeKeyword('lib')) return null;

    const libToken = this.consume(VB6TokenType.StringLiteral, 'Expected library name');
    if (!libToken) return null;

    let alias: string | undefined;
    if (this.matchKeyword('alias')) {
      this.advance();
      const aliasToken = this.consume(VB6TokenType.StringLiteral, 'Expected alias name');
      if (aliasToken) alias = aliasToken.value;
    }

    // Parse parameters if present
    if (this.match(VB6TokenType.Punctuation, '(')) {
      this.parseParameterList();
    }

    // Parse return type for functions
    if (procedureType === 'function' && this.matchKeyword('as')) {
      this.advance();
      this.parseType();
    }

    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Declare',
      visibility: visibility,
      name: nameToken.value,
      library: libToken.value,
      alias,
    };
  }

  private eventDeclaration(
    startToken: VB6Token,
    visibility: VB6Visibility
  ): VB6DeclarationNode | null {
    if (!this.consumeKeyword('event')) return null;

    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected event name');
    if (!nameToken) return null;

    // Parse parameters if present
    let parameters: VB6ParameterNode[] = [];
    if (this.match(VB6TokenType.Punctuation, '(')) {
      parameters = this.parseParameterList();
    }

    this.skipNewlinesAndComments();

    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Event',
      visibility: visibility,
      name: nameToken.value,
      parameters,
    };
  }

  private assignmentOrCall(): VB6StatementNode | null {
    const startToken = this.currentToken();

    // Parse the full target expression (handles member access, array subscripting, etc.)
    const target = this.identifierExpression();
    if (!target) return null;

    this.skipWhitespace();

    // Check for assignment
    if (this.match(VB6TokenType.Operator, '=')) {
      this.advance();
      this.skipWhitespace();
      const value = this.expression();
      if (!value) return null;

      return {
        type: 'Statement',
        statementType: 'Assignment',
        line: startToken.line,
        column: startToken.column,
        target,
        value,
        isSet: false,
      } as VB6AssignmentNode;
    }

    // Check for VB6-style subroutine call without parentheses
    // In VB6, you can call a sub like: MsgBox "Hello"
    // We need to check if the next token could be an argument
    // Don't do this if target is already a function call or array access
    const nextToken = this.currentToken();
    const isAlreadyCallOrArray =
      target.expressionType === 'FunctionCall' || target.expressionType === 'ArrayAccess';

    // Allow '.' as argument start for With member access (.PropertyName)
    const isPunctuationAllowed =
      nextToken.type === VB6TokenType.Punctuation && nextToken.value === '.';

    if (
      !isAlreadyCallOrArray &&
      !this.isAtEnd() &&
      nextToken.type !== VB6TokenType.NewLine &&
      nextToken.type !== VB6TokenType.EOF &&
      !this.matchKeyword('end') &&
      !this.matchKeyword('else') &&
      !this.matchKeyword('elseif') &&
      !this.matchKeyword('then') &&
      !this.matchKeyword('loop') &&
      !this.matchKeyword('next') &&
      !this.matchKeyword('wend') &&
      (nextToken.type !== VB6TokenType.Punctuation || isPunctuationAllowed)
    ) {
      // Parse arguments without parentheses
      const args: VB6ArgumentNode[] = [];

      // Parse first argument
      const firstArg = this.expression();
      if (firstArg) {
        args.push({
          type: 'Argument',
          line: firstArg.line,
          column: firstArg.column,
          value: firstArg,
        });

        // Parse additional comma-separated arguments
        while (this.match(VB6TokenType.Punctuation, ',')) {
          this.advance();
          const argExpr = this.expression();
          if (!argExpr) break;

          args.push({
            type: 'Argument',
            line: argExpr.line,
            column: argExpr.column,
            value: argExpr,
          });
        }
      }

      if (args.length > 0) {
        const funcCall: VB6ExpressionNode = {
          type: 'Expression',
          expressionType: 'FunctionCall',
          line: target.line,
          column: target.column,
          name: (target as VB6IdentifierNode).name,
          arguments: args,
        };

        return {
          type: 'Statement',
          statementType: 'Expression',
          line: startToken.line,
          column: startToken.column,
          expression: funcCall,
        };
      }
    }

    // Otherwise treat as a simple expression statement
    return {
      type: 'Statement',
      statementType: 'Expression',
      line: startToken.line,
      column: startToken.column,
      expression: target,
    };
  }

  private forStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'For'
    this.skipWhitespace();

    // Check for For Each
    if (this.matchKeyword('each')) {
      this.advance();
      this.skipWhitespace();

      const varToken = this.consume(VB6TokenType.Identifier, 'Expected variable name');
      if (!varToken) return null;

      this.skipWhitespace();
      if (!this.consumeKeyword('in')) return null;
      this.skipWhitespace();

      const collection = this.expression();
      if (!collection) return null;

      this.skipNewlinesAndComments();

      // Parse body
      const body: VB6StatementNode[] = [];
      while (!this.isAtEnd()) {
        // Check for Next before calling statement() since statement() skips newlines
        this.skipNewlinesAndComments();
        if (this.matchKeyword('next')) break;

        const stmt = this.statement();
        if (stmt) {
          if (Array.isArray(stmt)) {
            body.push(...stmt);
          } else {
            body.push(stmt);
          }
        } else {
          // If statement() returned null and we're at a block-ending keyword, don't advance
          if (this.matchKeyword('next')) break;
          this.advance();
        }
      }

      if (this.matchKeyword('next')) {
        this.advance();
        this.skipWhitespace();
        // Optional variable name after Next
        if (this.match(VB6TokenType.Identifier)) this.advance();
      }

      this.skipNewlinesAndComments();

      return {
        type: 'Statement',
        statementType: 'ForEach',
        line: startToken.line,
        column: startToken.column,
        variable: varToken.value,
        collection,
        body,
      } as VB6ForEachNode;
    }

    // Regular For loop
    const varToken = this.consume(VB6TokenType.Identifier, 'Expected variable name');
    if (!varToken) return null;

    this.skipWhitespace();
    if (!this.consume(VB6TokenType.Operator, 'Expected =')) return null;

    this.skipWhitespace();
    const startValue = this.expression();
    if (!startValue) return null;

    this.skipWhitespace();
    if (!this.consumeKeyword('to')) return null;

    this.skipWhitespace();
    const endValue = this.expression();
    if (!endValue) return null;

    let stepValue: VB6ExpressionNode | undefined;
    this.skipWhitespace();
    if (this.matchKeyword('step')) {
      this.advance();
      this.skipWhitespace();
      stepValue = this.expression();
    }

    this.skipNewlinesAndComments();

    // Parse body
    const body: VB6StatementNode[] = [];
    while (!this.isAtEnd()) {
      // Check for Next before calling statement() since statement() skips newlines
      this.skipNewlinesAndComments();
      if (this.matchKeyword('next')) break;

      const stmt = this.statement();
      if (stmt) {
        if (Array.isArray(stmt)) {
          body.push(...stmt);
        } else {
          body.push(stmt);
        }
      } else {
        // If statement() returned null and we're at a block-ending keyword, don't advance
        if (this.matchKeyword('next')) break;
        this.advance();
      }
    }

    if (this.matchKeyword('next')) {
      this.advance();
      this.skipWhitespace();
      // Optional variable name after Next
      if (this.match(VB6TokenType.Identifier)) this.advance();
    }

    this.skipNewlinesAndComments();

    return {
      type: 'Statement',
      statementType: 'For',
      line: startToken.line,
      column: startToken.column,
      variable: varToken.value,
      startValue,
      endValue,
      stepValue,
      body,
    } as VB6ForNode;
  }

  /**
   * Do Loop Statement:
   * - Do While condition ... Loop
   * - Do Until condition ... Loop
   * - Do ... Loop While condition
   * - Do ... Loop Until condition
   * - Do ... Loop (infinite loop)
   */
  private doStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Do'
    this.skipWhitespace();

    let conditionType: 'While' | 'Until' | 'None' = 'None';
    let condition: VB6ExpressionNode | undefined;
    let isPostCondition = false;

    // Check for pre-condition (Do While / Do Until)
    if (this.matchKeyword('while')) {
      conditionType = 'While';
      this.advance();
      this.skipWhitespace();
      condition = this.expression();
      if (!condition) return null;
      this.skipWhitespace();
    } else if (this.matchKeyword('until')) {
      conditionType = 'Until';
      this.advance();
      this.skipWhitespace();
      condition = this.expression();
      if (!condition) return null;
      this.skipWhitespace();
    }

    this.skipNewlinesAndComments();

    // Parse body statements
    const body: VB6StatementNode[] = [];
    while (!this.isAtEnd() && !this.matchKeyword('loop')) {
      const stmt = this.statement();
      if (stmt) {
        if (Array.isArray(stmt)) {
          body.push(...stmt);
        } else {
          body.push(stmt);
        }
      } else {
        // Don't advance if we're at Loop - let the outer check handle it
        if (this.matchKeyword('loop')) {
          break;
        }
        this.advance();
      }
    }

    // Consume Loop keyword
    if (this.matchKeyword('loop')) {
      this.advance();
      this.skipWhitespace();

      // Check for post-condition (Loop While / Loop Until)
      if (this.matchKeyword('while')) {
        conditionType = 'While';
        isPostCondition = true;
        this.advance();
        this.skipWhitespace();
        condition = this.expression();
        if (!condition) return null;
        this.skipWhitespace();
      } else if (this.matchKeyword('until')) {
        conditionType = 'Until';
        isPostCondition = true;
        this.advance();
        this.skipWhitespace();
        condition = this.expression();
        if (!condition) return null;
        this.skipWhitespace();
      }
    }

    this.skipNewlinesAndComments();

    return {
      type: 'Statement',
      statementType: 'Do',
      line: startToken.line,
      column: startToken.column,
      conditionType,
      condition,
      isPostCondition,
      body,
    } as VB6DoNode;
  }

  private selectStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Select'
    this.skipWhitespace();

    if (!this.consumeKeyword('case')) return null;
    this.skipWhitespace();

    const expression = this.expression();
    if (!expression) return null;

    this.skipNewlinesAndComments();

    const cases: VB6CaseNode[] = [];
    const elseStatements: VB6StatementNode[] = [];

    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      this.skipNewlinesAndComments();

      if (this.matchKeyword('case')) {
        this.advance(); // consume 'Case'
        this.skipWhitespace();

        if (this.matchKeyword('else')) {
          // Case Else
          this.advance();
          this.skipNewlinesAndComments();

          while (!this.isAtEnd() && !this.matchKeyword('end') && !this.matchKeyword('case')) {
            const stmt = this.statement();
            if (stmt) {
              if (Array.isArray(stmt)) {
                elseStatements.push(...stmt);
              } else {
                elseStatements.push(stmt);
              }
            } else {
              // Don't advance if we hit End - let the outer loop handle it
              if (this.matchKeyword('end')) {
                break;
              }
              this.advance();
            }
          }
        } else {
          // Regular case - parse case values (can be single values, comma-separated, or ranges)
          const values: VB6ExpressionNode[] = [];
          let caseNode: any = {
            type: 'Case',
            line: startToken.line,
            column: startToken.column,
            values,
            statements: [],
          };

          // Parse first value
          const firstValue = this.expression();
          if (firstValue) {
            this.skipWhitespace();

            // Check for range (To keyword)
            if (this.matchKeyword('to')) {
              caseNode.isRange = true;
              caseNode.rangeStart = firstValue;
              this.advance(); // consume 'To'
              this.skipWhitespace();

              const rangeEnd = this.expression();
              if (rangeEnd) {
                caseNode.rangeEnd = rangeEnd;
                values.push(firstValue);
                values.push(rangeEnd);
              }
              this.skipWhitespace();
            } else {
              values.push(firstValue);

              // Parse comma-separated additional values
              while (this.match(VB6TokenType.Punctuation, ',')) {
                this.advance(); // consume comma
                this.skipWhitespace();

                const nextValue = this.expression();
                if (nextValue) {
                  this.skipWhitespace();

                  // Check for range in comma-separated list
                  if (this.matchKeyword('to')) {
                    caseNode.isRange = true;
                    caseNode.rangeStart = nextValue;
                    this.advance(); // consume 'To'
                    this.skipWhitespace();

                    const rangeEnd = this.expression();
                    if (rangeEnd) {
                      caseNode.rangeEnd = rangeEnd;
                      values.push(nextValue);
                      values.push(rangeEnd);
                    }
                    this.skipWhitespace();
                    break; // Can't have more values after a range
                  } else {
                    values.push(nextValue);
                  }
                }
              }
            }
          }

          this.skipNewlinesAndComments();

          const statements: VB6StatementNode[] = [];
          while (!this.isAtEnd() && !this.matchKeyword('end') && !this.matchKeyword('case')) {
            const stmt = this.statement();
            if (stmt) {
              if (Array.isArray(stmt)) {
                statements.push(...stmt);
              } else {
                statements.push(stmt);
              }
            } else {
              // Don't advance if we hit Case or End - let the outer loop handle them
              if (this.matchKeyword('case') || this.matchKeyword('end')) {
                break;
              }
              this.advance();
            }
          }

          caseNode.statements = statements;
          cases.push(caseNode);
        }
      } else {
        this.advance();
      }
    }

    if (this.matchKeyword('end')) {
      this.advance();
      this.skipWhitespace();
      this.consumeKeyword('select');
    }

    return {
      type: 'Statement',
      statementType: 'Select',
      line: startToken.line,
      column: startToken.column,
      expression,
      cases,
      elseStatements,
    } as VB6SelectNode;
  }

  private withStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'With'
    this.skipWhitespace();

    const expression = this.expression();
    if (!expression) return null;

    this.skipNewlinesAndComments();

    const body: VB6StatementNode[] = [];
    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      this.skipWhitespace();

      // Check for End With
      if (this.matchKeyword('end')) {
        if (this.peekKeyword('with')) {
          break;
        }
      }

      // Handle statements that start with a dot (implicit member access)
      if (this.match(VB6TokenType.Punctuation, '.')) {
        const stmt = this.withMemberStatement();
        if (stmt) {
          body.push(stmt);
        } else {
          this.advance();
        }
      } else {
        const stmt = this.statement();
        if (stmt) {
          if (Array.isArray(stmt)) {
            body.push(...stmt);
          } else {
            body.push(stmt);
          }
        } else {
          this.advance();
        }
      }

      this.skipNewlinesAndComments();
    }

    // Consume End With
    if (this.matchKeyword('end')) {
      this.advance();
      this.skipWhitespace();
      if (this.matchKeyword('with')) {
        this.advance();
      }
    }

    return {
      type: 'Statement',
      statementType: 'With',
      line: startToken.line,
      column: startToken.column,
      expression,
      body,
    } as VB6WithNode;
  }

  /**
   * Parse statements with implicit With object reference (starting with .)
   * Examples: .Property = value, .Method()
   */
  private withMemberStatement(): VB6StatementNode | null {
    this.skipWhitespace();

    if (!this.match(VB6TokenType.Punctuation, '.')) {
      return null;
    }

    const dotToken = this.currentToken();
    this.advance(); // consume '.'
    this.skipWhitespace();

    // Get member name
    const memberToken = this.consume(VB6TokenType.Identifier, 'Expected member name after .');
    if (!memberToken) return null;

    this.skipWhitespace();

    // Create member access expression with implicit context (using empty identifier as placeholder)
    let memberExpr: VB6ExpressionNode = {
      type: 'Expression',
      expressionType: 'Identifier',
      line: dotToken.line,
      column: dotToken.column,
      name: memberToken.value,
    };

    // Handle chained member access (.Property.SubProperty) or method calls
    while (true) {
      if (this.match(VB6TokenType.Punctuation, '.')) {
        this.advance();
        this.skipWhitespace();
        const nextMember = this.consume(VB6TokenType.Identifier, 'Expected member name');
        if (!nextMember) break;

        memberExpr = {
          type: 'Expression',
          expressionType: 'MemberAccess',
          line: memberExpr.line,
          column: memberExpr.column,
          object: memberExpr,
          member: nextMember.value,
        };
      } else if (this.match(VB6TokenType.Punctuation, '(')) {
        // Method call
        this.advance();
        this.skipWhitespace();
        const args: VB6ArgumentNode[] = [];

        if (!this.match(VB6TokenType.Punctuation, ')')) {
          do {
            this.skipWhitespace();
            const argExpr = this.expression();
            if (!argExpr) break;

            args.push({
              type: 'Argument',
              line: argExpr.line,
              column: argExpr.column,
              value: argExpr,
            });

            this.skipWhitespace();
            if (!this.match(VB6TokenType.Punctuation, ',')) break;
            this.advance();
          } while (true);
        }

        this.skipWhitespace();
        if (!this.consume(VB6TokenType.Punctuation, 'Expected )')) break;

        memberExpr = {
          type: 'Expression',
          expressionType: 'FunctionCall',
          line: memberExpr.line,
          column: memberExpr.column,
          name: (memberExpr as VB6IdentifierNode).name,
          arguments: args,
        };
        break;
      } else {
        break;
      }
    }

    this.skipWhitespace();

    // Check for assignment
    if (this.match(VB6TokenType.Operator, '=') || this.matchKeyword('set')) {
      const isSet = this.matchKeyword('set');
      this.advance();
      this.skipWhitespace();

      const value = this.expression();
      if (!value) return null;

      return {
        type: 'Statement',
        statementType: 'Assignment',
        line: dotToken.line,
        column: dotToken.column,
        target: memberExpr,
        value,
        isSet,
      } as VB6AssignmentNode;
    }

    // Otherwise it's a statement expression (method call, etc.)
    return {
      type: 'Statement',
      statementType: 'ExpressionStatement',
      line: dotToken.line,
      column: dotToken.column,
      expression: memberExpr,
    };
  }

  private errorHandlingStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'On'
    this.skipWhitespace();

    // Must have 'Error' keyword
    if (!this.consumeKeyword('error')) {
      this.addError('Expected "Error" keyword after "On"');
      return {
        type: 'Statement',
        statementType: 'OnError',
        line: startToken.line,
        column: startToken.column,
        action: 'GoTo',
        label: undefined,
      } as VB6ErrorHandlingNode;
    }

    this.skipWhitespace();

    let action: 'GoTo' | 'Resume' | 'GoToZero';
    let label: string | undefined;

    if (this.consumeKeyword('goto')) {
      this.skipWhitespace();

      // Check for "On Error GoTo 0" - clears error handler
      if (this.match(VB6TokenType.NumberLiteral, '0')) {
        action = 'GoToZero';
        this.advance();
      } else {
        // "On Error GoTo label"
        action = 'GoTo';
        const labelToken = this.consume(VB6TokenType.Identifier, 'Expected label after "GoTo"');
        if (labelToken) {
          label = labelToken.value;
        }
      }
    } else if (this.consumeKeyword('resume')) {
      // "On Error Resume Next" or just "On Error Resume"
      this.skipWhitespace();
      action = 'Resume';

      if (this.matchKeyword('next')) {
        this.advance();
        // "On Error Resume Next"
      }
      // else: just "On Error Resume"
    } else {
      // No action specified - default to Resume Next for VB6 compatibility
      action = 'Resume';
      this.addError('Expected "GoTo" or "Resume" after "Error" keyword');
    }

    return {
      type: 'Statement',
      statementType: 'OnError',
      line: startToken.line,
      column: startToken.column,
      action,
      label,
    } as VB6ErrorHandlingNode;
  }

  /**
   * Local variable declaration (inside procedures)
   * Returns an array of statements for multiple variables: Dim a, b, c As Long
   */
  private localVariableDeclaration(): VB6StatementNode | VB6StatementNode[] | null {
    const declarations = this.variableDeclarationList(this.currentToken(), null);
    if (declarations.length === 0) return null;
    if (declarations.length === 1) return declarations[0] as VB6StatementNode;
    // Return array of statements for multiple variable declarations
    return declarations as VB6StatementNode[];
  }

  /**
   * ReDim Statement: ReDim [Preserve] arrayName(subscripts) [As type]
   * Used to re-dimension dynamic arrays
   */
  private redimStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    if (!this.consumeKeyword('redim')) return null;

    this.skipWhitespace();

    // Check for Preserve keyword
    let preserve = false;
    if (this.matchKeyword('preserve')) {
      preserve = true;
      this.advance();
      this.skipWhitespace();
    }

    // Get array name
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected array name after ReDim');
    if (!nameToken) return null;

    this.skipWhitespace();

    // Parse array dimensions
    let dimensions: VB6ExpressionNode[] | undefined;
    if (this.match(VB6TokenType.Punctuation, '(')) {
      dimensions = this.parseArrayDimensions();
      this.skipWhitespace();
    }

    // Optional: As type clause
    let dataType: VB6TypeNode | undefined;
    if (this.matchKeyword('as')) {
      this.advance();
      this.skipWhitespace();
      dataType = this.parseType();
      this.skipWhitespace();
    }

    this.skipNewlinesAndComments();

    return {
      type: 'Statement',
      statementType: 'ReDim',
      line: startToken.line,
      column: startToken.column,
      name: nameToken.value,
      dimensions,
      dataType,
      preserve,
    };
  }

  private setStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Set'
    this.skipWhitespace();

    // Build target expression manually (like assignmentOrCall) to avoid consuming '='
    if (!this.match(VB6TokenType.Identifier)) {
      return null;
    }

    const identToken = this.currentToken();
    this.advance();
    this.skipWhitespace();

    let target: VB6ExpressionNode = {
      type: 'Expression',
      expressionType: 'Identifier',
      line: identToken.line,
      column: identToken.column,
      name: identToken.value,
    };

    // Handle member access chain
    while (this.match(VB6TokenType.Punctuation, '.')) {
      this.advance();
      this.skipWhitespace();
      const member = this.consume(VB6TokenType.Identifier, 'Expected member name');
      if (!member) return null;

      this.skipWhitespace();

      target = {
        type: 'Expression',
        expressionType: 'MemberAccess',
        line: target.line,
        column: target.column,
        object: target,
        member: member.value,
      };
    }

    // Expect '=' operator
    if (!this.consume(VB6TokenType.Operator, 'Expected =')) return null;
    this.skipWhitespace();

    const value = this.expression();
    if (!value) return null;

    return {
      type: 'Statement',
      statementType: 'Assignment',
      line: startToken.line,
      column: startToken.column,
      target,
      value,
      isSet: true,
    } as VB6AssignmentNode;
  }

  private callStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Call'
    this.skipWhitespace();

    const expression = this.expression();
    if (!expression) return null;

    return {
      type: 'Statement',
      statementType: 'Call',
      line: startToken.line,
      column: startToken.column,
      expression,
    };
  }

  private exitStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Exit'

    let exitType = 'Sub';
    if (this.matchKeyword('sub')) {
      this.advance();
      exitType = 'Sub';
    } else if (this.matchKeyword('function')) {
      this.advance();
      exitType = 'Function';
    } else if (this.matchKeyword('for')) {
      this.advance();
      exitType = 'For';
    } else if (this.matchKeyword('do')) {
      this.advance();
      exitType = 'Do';
    }

    return {
      type: 'Statement',
      statementType: 'Exit',
      line: startToken.line,
      column: startToken.column,
      exitType,
    };
  }

  private gotoStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'GoTo'

    const labelToken = this.consume(VB6TokenType.Identifier, 'Expected label');
    if (!labelToken) return null;

    return {
      type: 'Statement',
      statementType: 'GoTo',
      line: startToken.line,
      column: startToken.column,
      label: labelToken.value,
    };
  }

  private gosubStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'GoSub'

    const labelToken = this.consume(VB6TokenType.Identifier, 'Expected label');
    if (!labelToken) return null;

    return {
      type: 'Statement',
      statementType: 'GoSub',
      line: startToken.line,
      column: startToken.column,
      label: labelToken.value,
    };
  }

  private returnStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Return'

    return {
      type: 'Statement',
      statementType: 'Return',
      line: startToken.line,
      column: startToken.column,
    };
  }

  private resumeStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Resume'
    this.skipWhitespace();

    let resumeType = 'Label';
    let label: string | undefined;

    if (this.matchKeyword('next')) {
      this.advance();
      resumeType = 'Next';
    } else if (this.match(VB6TokenType.Identifier)) {
      const labelToken = this.advance();
      label = labelToken.value;
      // If no label token found, default to plain "Resume"
      if (!label) {
        resumeType = 'Plain';
      }
    } else {
      // Plain "Resume" with no Next or label
      resumeType = 'Plain';
    }

    return {
      type: 'Statement',
      statementType: 'Resume',
      line: startToken.line,
      column: startToken.column,
      resumeType,
      label,
    };
  }

  private labelStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    const labelName = startToken.value;
    this.advance(); // consume identifier
    this.skipWhitespace();

    // Must have colon after label name
    if (!this.consume(VB6TokenType.Punctuation, 'Expected ":" after label name')) {
      return null;
    }

    return {
      type: 'Statement',
      statementType: 'Label',
      line: startToken.line,
      column: startToken.column,
      name: labelName,
    };
  }

  private expressionStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    const expression = this.expression();
    if (!expression) return null;

    return {
      type: 'Statement',
      statementType: 'Expression',
      line: startToken.line,
      column: startToken.column,
      expression,
    };
  }

  private isProcedureStart(): boolean {
    return (
      this.matchKeyword('sub') ||
      this.matchKeyword('function') ||
      this.matchKeyword('property') ||
      (this.matchKeyword('private') && this.peekProcedureKeyword()) ||
      (this.matchKeyword('public') && this.peekProcedureKeyword()) ||
      (this.matchKeyword('friend') && this.peekProcedureKeyword())
    );
  }

  private isDeclarationStart(): boolean {
    return (
      this.matchKeyword('dim') ||
      this.matchKeyword('const') ||
      this.matchKeyword('type') ||
      this.matchKeyword('enum') ||
      this.matchKeyword('declare') ||
      this.matchKeyword('event') ||
      (this.matchKeyword('private') &&
        (this.peekDeclarationKeyword() || this.peekVariableName())) ||
      (this.matchKeyword('public') && (this.peekDeclarationKeyword() || this.peekVariableName())) ||
      (this.matchKeyword('global') && (this.peekDeclarationKeyword() || this.peekVariableName())) ||
      (this.matchKeyword('friend') && (this.peekDeclarationKeyword() || this.peekVariableName()))
    );
  }

  private peekKeyword(keyword: string): boolean {
    const nextPos = this.position + 1;
    if (nextPos >= this.tokens.length) return false;
    const nextToken = this.tokens[nextPos];
    return (
      nextToken.type === VB6TokenType.Keyword &&
      nextToken.value.toLowerCase() === keyword.toLowerCase()
    );
  }

  private peekProcedureKeyword(): boolean {
    let nextPos = this.position + 1;
    // Skip whitespace
    while (nextPos < this.tokens.length && this.tokens[nextPos].type === VB6TokenType.Whitespace) {
      nextPos++;
    }
    if (nextPos >= this.tokens.length) return false;
    const nextToken = this.tokens[nextPos];
    return (
      nextToken.type === VB6TokenType.Keyword &&
      ['sub', 'function', 'property'].includes(nextToken.value.toLowerCase())
    );
  }

  private peekDeclarationKeyword(): boolean {
    let nextPos = this.position + 1;
    // Skip whitespace
    while (nextPos < this.tokens.length && this.tokens[nextPos].type === VB6TokenType.Whitespace) {
      nextPos++;
    }
    if (nextPos >= this.tokens.length) return false;
    const nextToken = this.tokens[nextPos];
    return (
      nextToken.type === VB6TokenType.Keyword &&
      ['dim', 'const', 'type', 'enum', 'declare', 'event'].includes(nextToken.value.toLowerCase())
    );
  }

  private peekVariableName(): boolean {
    let nextPos = this.position + 1;
    // Skip whitespace
    while (nextPos < this.tokens.length && this.tokens[nextPos].type === VB6TokenType.Whitespace) {
      nextPos++;
    }
    if (nextPos >= this.tokens.length) return false;
    const nextToken = this.tokens[nextPos];
    // Check if next token is an identifier (could be a variable declaration without Dim)
    return nextToken.type === VB6TokenType.Identifier;
  }
}

/**
 * Convenience function to parse VB6 code
 */
export function parseVB6Code(source: string): {
  ast: VB6ModuleNode | null;
  errors: VB6ParseError[];
} {
  const lexer = new VB6AdvancedLexer(source);
  const tokens = lexer.tokenize();

  const parser = new VB6RecursiveDescentParser(tokens);
  return parser.parseModule();
}
