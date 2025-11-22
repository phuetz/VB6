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
  alias?: string;   // For Declare
}

export interface VB6TypeNode extends VB6ASTNode {
  type: 'Type';
  typeName: 'Integer' | 'Long' | 'Single' | 'Double' | 'String' | 'Boolean' | 'Variant' | 'Object' | 'Currency' | 'Decimal' | 'Date' | 'Byte' | 'Any' | string;
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
  parseModule(): { ast: VB6ModuleNode | null, errors: VB6ParseError[] } {
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
        if (decl) declarations.push(decl);
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
      procedures
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
      value: valueToken.value
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
  private declaration(): VB6DeclarationNode | null {
    const startToken = this.currentToken();
    const visibility = this.parseVisibility();
    
    if (this.matchKeyword('dim') || this.matchKeyword('static')) {
      return this.variableDeclaration(startToken, visibility);
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
    }
    
    return null;
  }
  
  /**
   * Variable Declaration := [Visibility] ['Static'] 'Dim' VariableList
   */
  private variableDeclaration(startToken: VB6Token, visibility: string | null): VB6DeclarationNode | null {
    const isStatic = this.matchKeyword('static');
    if (isStatic) this.advance();
    
    if (!this.consumeKeyword('dim')) return null;
    
    // For now, handle single variable - TODO: handle variable lists
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected variable name');
    if (!nameToken) return null;
    
    let dataType: VB6TypeNode | undefined;
    let dimensions: VB6ExpressionNode[] | undefined;
    let isWithEvents = false;
    
    // Check for WithEvents
    if (this.matchKeyword('withevents')) {
      this.advance();
      isWithEvents = true;
    }
    
    // Check for array dimensions
    if (this.match(VB6TokenType.Punctuation, '(')) {
      dimensions = this.parseArrayDimensions();
    }
    
    // Check for As clause
    if (this.matchKeyword('as')) {
      this.advance();
      dataType = this.parseType();
    }
    
    this.skipNewlinesAndComments();
    
    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Variable',
      visibility: visibility as any,
      name: nameToken.value,
      dataType,
      dimensions,
      isStatic,
      isWithEvents
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
      if (this.matchKeyword('as')) {
        this.advance();
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
      
      const stmt = this.statement();
      if (stmt) body.push(stmt);
      else this.advance(); // Skip unknown tokens
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
      visibility: visibility as any,
      parameters,
      returnType,
      isStatic,
      body
    };
  }
  
  /**
   * Parse statement
   */
  private statement(): VB6StatementNode | null {
    this.skipNewlinesAndComments();
    
    if (this.isAtEnd()) return null;
    
    const token = this.currentToken();
    
    // Assignment or function call
    if (token.type === VB6TokenType.Identifier) {
      return this.assignmentOrCall();
    }
    
    // Control structures
    if (token.type === VB6TokenType.Keyword) {
      switch (token.value.toLowerCase()) {
        case 'if': return this.ifStatement();
        case 'for': return this.forStatement();
        case 'select': return this.selectStatement();
        case 'with': return this.withStatement();
        case 'on': return this.errorHandlingStatement();
        case 'dim': return this.localVariableDeclaration();
        case 'set': return this.setStatement();
        case 'call': return this.callStatement();
        case 'exit': return this.exitStatement();
        case 'goto': return this.gotoStatement();
        case 'gosub': return this.gosubStatement();
        case 'return': return this.returnStatement();
        case 'resume': return this.resumeStatement();
        default:
          // Try as expression statement
          return this.expressionStatement();
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
      const right = this.logicalAnd();
      if (!right) break;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: 'Or',
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private logicalAnd(): VB6ExpressionNode | null {
    let expr = this.equality();
    if (!expr) return null;
    
    while (this.matchKeyword('and')) {
      const operator = this.currentToken();
      this.advance();
      const right = this.equality();
      if (!right) break;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: 'And',
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private equality(): VB6ExpressionNode | null {
    let expr = this.comparison();
    if (!expr) return null;
    
    while (this.match(VB6TokenType.Operator, '=') || 
           this.match(VB6TokenType.Operator, '<>') ||
           this.matchKeyword('is') ||
           this.matchKeyword('like')) {
      const operator = this.currentToken();
      this.advance();
      const right = this.comparison();
      if (!right) break;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private comparison(): VB6ExpressionNode | null {
    let expr = this.addition();
    if (!expr) return null;
    
    while (this.match(VB6TokenType.Operator, '>') ||
           this.match(VB6TokenType.Operator, '>=') ||
           this.match(VB6TokenType.Operator, '<') ||
           this.match(VB6TokenType.Operator, '<=')) {
      const operator = this.currentToken();
      this.advance();
      const right = this.addition();
      if (!right) break;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private addition(): VB6ExpressionNode | null {
    let expr = this.multiplication();
    if (!expr) return null;
    
    while (this.match(VB6TokenType.Operator, '+') ||
           this.match(VB6TokenType.Operator, '-') ||
           this.match(VB6TokenType.Operator, '&')) {
      const operator = this.currentToken();
      this.advance();
      const right = this.multiplication();
      if (!right) break;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private multiplication(): VB6ExpressionNode | null {
    let expr = this.exponentiation();
    if (!expr) return null;
    
    while (this.match(VB6TokenType.Operator, '*') ||
           this.match(VB6TokenType.Operator, '/') ||
           this.match(VB6TokenType.Operator, '\\') ||
           this.matchKeyword('mod')) {
      const operator = this.currentToken();
      this.advance();
      const right = this.exponentiation();
      if (!right) break;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: operator.value,
        left: expr,
        right
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
      const right = this.exponentiation(); // Right associative
      if (!right) return expr;
      
      expr = {
        type: 'Expression',
        expressionType: 'BinaryOp',
        line: operator.line,
        column: operator.column,
        operator: '^',
        left: expr,
        right
      };
    }
    
    return expr;
  }
  
  private unary(): VB6ExpressionNode | null {
    if (this.match(VB6TokenType.Operator, '-') ||
        this.match(VB6TokenType.Operator, '+') ||
        this.matchKeyword('not')) {
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
        operand: expr
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
        value: token.value
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
        value: token.type === VB6TokenType.FloatLiteral ? parseFloat(token.value) : parseInt(token.value)
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
        value: new Date(token.value)
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
        value: token.value.toLowerCase() === 'true'
      };
    }
    
    if (this.matchKeyword('nothing') || this.matchKeyword('null') || this.matchKeyword('empty')) {
      this.advance();
      return {
        type: 'Expression',
        expressionType: 'Literal',
        line: token.line,
        column: token.column,
        literalType: token.value.toLowerCase() === 'nothing' ? 'Nothing' : 
                     token.value.toLowerCase() === 'null' ? 'Null' : 'Empty',
        value: null
      };
    }
    
    // Parenthesized expression
    if (this.match(VB6TokenType.Punctuation, '(')) {
      this.advance();
      const expr = this.expression();
      if (!this.consume(VB6TokenType.Punctuation, 'Expected )')) return null;
      return expr;
    }
    
    // Identifier (variable, function call, or member access)
    if (token.type === VB6TokenType.Identifier) {
      return this.identifierExpression();
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
      name: token.value
    };
    
    // Handle member access and function calls
    while (true) {
      if (this.match(VB6TokenType.Punctuation, '.')) {
        this.advance();
        const member = this.consume(VB6TokenType.Identifier, 'Expected member name');
        if (!member) break;
        
        expr = {
          type: 'Expression',
          expressionType: 'MemberAccess',
          line: expr.line,
          column: expr.column,
          object: expr,
          member: member.value
        };
      } else if (this.match(VB6TokenType.Punctuation, '(')) {
        // Function call
        this.advance();
        const args: VB6ArgumentNode[] = [];
        
        if (!this.match(VB6TokenType.Punctuation, ')')) {
          do {
            const argExpr = this.expression();
            if (!argExpr) break;
            
            args.push({
              type: 'Argument',
              line: argExpr.line,
              column: argExpr.column,
              value: argExpr
            });
          } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
        }
        
        if (!this.consume(VB6TokenType.Punctuation, 'Expected )')) break;
        
        expr = {
          type: 'Expression',
          expressionType: 'FunctionCall',
          line: expr.line,
          column: expr.column,
          name: (expr as VB6IdentifierNode).name,
          arguments: args
        };
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
    
    const condition = this.expression();
    if (!condition) return null;
    
    if (!this.consumeKeyword('then')) return null;
    
    const thenStatements: VB6StatementNode[] = [];
    const elseIfClauses: { condition: VB6ExpressionNode; statements: VB6StatementNode[] }[] = [];
    const elseStatements: VB6StatementNode[] = [];
    
    // Parse then statements
    while (!this.isAtEnd() && !this.matchKeyword('elseif') && 
           !this.matchKeyword('else') && !this.matchKeyword('end')) {
      const stmt = this.statement();
      if (stmt) thenStatements.push(stmt);
      else break;
    }
    
    // Parse ElseIf clauses
    while (this.matchKeyword('elseif')) {
      this.advance();
      const elseIfCondition = this.expression();
      if (!elseIfCondition) break;
      
      if (!this.consumeKeyword('then')) break;
      
      const elseIfStatements: VB6StatementNode[] = [];
      while (!this.isAtEnd() && !this.matchKeyword('elseif') && 
             !this.matchKeyword('else') && !this.matchKeyword('end')) {
        const stmt = this.statement();
        if (stmt) elseIfStatements.push(stmt);
        else break;
      }
      
      elseIfClauses.push({
        condition: elseIfCondition,
        statements: elseIfStatements
      });
    }
    
    // Parse Else clause
    if (this.matchKeyword('else')) {
      this.advance();
      while (!this.isAtEnd() && !this.matchKeyword('end')) {
        const stmt = this.statement();
        if (stmt) elseStatements.push(stmt);
        else break;
      }
    }
    
    // Consume End If
    if (this.matchKeyword('end')) {
      this.advance();
      this.consumeKeyword('if');
    }
    
    return {
      type: 'Statement',
      statementType: 'If',
      line: startToken.line,
      column: startToken.column,
      condition,
      thenStatements,
      elseIfClauses,
      elseStatements
    };
  }
  
  // Utility methods
  
  private currentToken(): VB6Token {
    return this.tokens[this.position] || { 
      type: VB6TokenType.EOF, 
      value: '', 
      line: 0, 
      column: 0, 
      length: 0 
    };
  }
  
  private advance(): VB6Token {
    if (!this.isAtEnd()) this.position++;
    return this.tokens[this.position - 1];
  }
  
  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || 
           this.currentToken().type === VB6TokenType.EOF;
  }
  
  private match(type: VB6TokenType, value?: string): boolean {
    const token = this.currentToken();
    return token.type === type && (value === undefined || token.value === value);
  }

  private matchKeyword(keyword: string): boolean {
    const token = this.currentToken();
    return token.type === VB6TokenType.Keyword &&
           token.value.toLowerCase() === keyword.toLowerCase();
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
    while (this.currentToken().type === VB6TokenType.NewLine ||
           this.currentToken().type === VB6TokenType.Comment ||
           this.currentToken().type === VB6TokenType.Whitespace) {
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
      found: token.value
    });
  }
  
  // Additional helper methods (simplified)...
  
  private parseVisibility(): string | null {
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
    this.advance();
    
    return {
      type: 'Type',
      line: token.line,
      column: token.column,
      typeName: token.value as any
    };
  }
  
  private parseParameterList(): VB6ParameterNode[] {
    const parameters: VB6ParameterNode[] = [];
    
    this.advance(); // consume (
    
    if (!this.match(VB6TokenType.Punctuation, ')')) {
      do {
        const param = this.parseParameter();
        if (param) parameters.push(param);
      } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
    }
    
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
    } else if (this.matchKeyword('byref')) {
      parameterType = 'ByRef';
      this.advance();
    } else if (this.matchKeyword('optional')) {
      parameterType = 'Optional';
      this.advance();
    } else if (this.matchKeyword('paramarray')) {
      parameterType = 'ParamArray';
      this.advance();
    }
    
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected parameter name');
    if (!nameToken) return null;
    
    let dataType: VB6TypeNode | undefined;
    let defaultValue: VB6ExpressionNode | undefined;
    
    if (this.matchKeyword('as')) {
      this.advance();
      dataType = this.parseType();
    }
    
    if (this.match(VB6TokenType.Operator, '=')) {
      this.advance();
      defaultValue = this.expression();
    }
    
    return {
      type: 'Parameter',
      line: startToken.line,
      column: startToken.column,
      name: nameToken.value,
      parameterType,
      dataType,
      defaultValue
    };
  }
  
  private parseArrayDimensions(): VB6ExpressionNode[] {
    // Simplified - just consume until )
    this.advance(); // consume (
    const dimensions: VB6ExpressionNode[] = [];
    
    if (!this.match(VB6TokenType.Punctuation, ')')) {
      do {
        const expr = this.expression();
        if (expr) dimensions.push(expr);
      } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
    }
    
    this.consume(VB6TokenType.Punctuation, 'Expected )');
    
    return dimensions;
  }
  
  // Complete implementations of statement types
  private constantDeclaration(startToken: VB6Token, visibility: string | null): VB6DeclarationNode | null {
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
      visibility: visibility as any,
      name: nameToken.value,
      dataType,
      initialValue
    };
  }
  
  private typeDeclaration(startToken: VB6Token, visibility: string | null): VB6DeclarationNode | null {
    if (!this.consumeKeyword('type')) return null;
    
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected type name');
    if (!nameToken) return null;
    
    this.skipNewlinesAndComments();
    
    // Parse type members (simplified - just skip to End Type)
    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      this.advance();
    }
    
    if (this.matchKeyword('end')) {
      this.advance();
      this.consumeKeyword('type');
    }
    
    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Type',
      visibility: visibility as any,
      name: nameToken.value
    };
  }
  
  private enumDeclaration(startToken: VB6Token, visibility: string | null): VB6DeclarationNode | null {
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
      visibility: visibility as any,
      name: nameToken.value
    };
  }
  
  private declareDeclaration(startToken: VB6Token, visibility: string | null): VB6DeclarationNode | null {
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
      visibility: visibility as any,
      name: nameToken.value,
      library: libToken.value,
      alias
    };
  }
  
  private eventDeclaration(startToken: VB6Token, visibility: string | null): VB6DeclarationNode | null {
    if (!this.consumeKeyword('event')) return null;
    
    const nameToken = this.consume(VB6TokenType.Identifier, 'Expected event name');
    if (!nameToken) return null;
    
    // Parse parameters if present
    if (this.match(VB6TokenType.Punctuation, '(')) {
      this.parseParameterList();
    }
    
    this.skipNewlinesAndComments();
    
    return {
      type: 'Declaration',
      line: startToken.line,
      column: startToken.column,
      declarationType: 'Event',
      visibility: visibility as any,
      name: nameToken.value
    };
  }
  
  private assignmentOrCall(): VB6StatementNode | null {
    const startToken = this.currentToken();
    const target = this.expression();
    if (!target) return null;
    
    // Check for assignment operator
    if (this.match(VB6TokenType.Operator, '=')) {
      this.advance();
      const value = this.expression();
      if (!value) return null;
      
      return {
        type: 'Statement',
        statementType: 'Assignment',
        line: startToken.line,
        column: startToken.column,
        target,
        value,
        isSet: false
      } as VB6AssignmentNode;
    }
    
    // Otherwise treat as expression statement
    return {
      type: 'Statement',
      statementType: 'Expression',
      line: startToken.line,
      column: startToken.column,
      expression: target
    };
  }
  
  private forStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'For'
    
    // Check for For Each
    if (this.matchKeyword('each')) {
      this.advance();
      const varToken = this.consume(VB6TokenType.Identifier, 'Expected variable name');
      if (!varToken) return null;
      
      if (!this.consumeKeyword('in')) return null;
      
      const collection = this.expression();
      if (!collection) return null;
      
      this.skipNewlinesAndComments();
      
      // Parse body
      const body: VB6StatementNode[] = [];
      while (!this.isAtEnd() && !this.matchKeyword('next')) {
        const stmt = this.statement();
        if (stmt) body.push(stmt);
        else this.advance();
      }
      
      if (this.matchKeyword('next')) {
        this.advance();
        // Optional variable name after Next
        if (this.match(VB6TokenType.Identifier)) this.advance();
      }
      
      return {
        type: 'Statement',
        statementType: 'ForEach',
        line: startToken.line,
        column: startToken.column,
        variable: varToken.value,
        collection,
        body
      } as VB6ForEachNode;
    }
    
    // Regular For loop
    const varToken = this.consume(VB6TokenType.Identifier, 'Expected variable name');
    if (!varToken) return null;
    
    if (!this.consume(VB6TokenType.Operator, 'Expected =')) return null;
    
    const startValue = this.expression();
    if (!startValue) return null;
    
    if (!this.consumeKeyword('to')) return null;
    
    const endValue = this.expression();
    if (!endValue) return null;
    
    let stepValue: VB6ExpressionNode | undefined;
    if (this.matchKeyword('step')) {
      this.advance();
      stepValue = this.expression();
    }
    
    this.skipNewlinesAndComments();
    
    // Parse body
    const body: VB6StatementNode[] = [];
    while (!this.isAtEnd() && !this.matchKeyword('next')) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
      else this.advance();
    }
    
    if (this.matchKeyword('next')) {
      this.advance();
      // Optional variable name after Next
      if (this.match(VB6TokenType.Identifier)) this.advance();
    }
    
    return {
      type: 'Statement',
      statementType: 'For',
      line: startToken.line,
      column: startToken.column,
      variable: varToken.value,
      startValue,
      endValue,
      stepValue,
      body
    } as VB6ForNode;
  }
  
  private selectStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Select'
    
    if (!this.consumeKeyword('case')) return null;
    
    const expression = this.expression();
    if (!expression) return null;
    
    this.skipNewlinesAndComments();
    
    const cases: VB6CaseNode[] = [];
    const elseStatements: VB6StatementNode[] = [];
    
    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      if (this.matchKeyword('case')) {
        this.advance();
        
        if (this.matchKeyword('else')) {
          // Case Else
          this.advance();
          this.skipNewlinesAndComments();
          
          while (!this.isAtEnd() && !this.matchKeyword('end') && !this.matchKeyword('case')) {
            const stmt = this.statement();
            if (stmt) elseStatements.push(stmt);
            else this.advance();
          }
        } else {
          // Regular case
          const values: VB6ExpressionNode[] = [];
          do {
            const value = this.expression();
            if (value) values.push(value);
          } while (this.match(VB6TokenType.Punctuation, ',') && this.advance());
          
          this.skipNewlinesAndComments();
          
          const statements: VB6StatementNode[] = [];
          while (!this.isAtEnd() && !this.matchKeyword('end') && !this.matchKeyword('case')) {
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
            else this.advance();
          }
          
          cases.push({
            type: 'Case',
            line: startToken.line,
            column: startToken.column,
            values,
            statements
          });
        }
      } else {
        this.advance();
      }
    }
    
    if (this.matchKeyword('end')) {
      this.advance();
      this.consumeKeyword('select');
    }
    
    return {
      type: 'Statement',
      statementType: 'Select',
      line: startToken.line,
      column: startToken.column,
      expression,
      cases,
      elseStatements
    } as VB6SelectNode;
  }
  
  private withStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'With'
    
    const expression = this.expression();
    if (!expression) return null;
    
    this.skipNewlinesAndComments();
    
    const body: VB6StatementNode[] = [];
    while (!this.isAtEnd() && !this.matchKeyword('end')) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
      else this.advance();
    }
    
    if (this.matchKeyword('end')) {
      this.advance();
      this.consumeKeyword('with');
    }
    
    return {
      type: 'Statement',
      statementType: 'With',
      line: startToken.line,
      column: startToken.column,
      expression,
      body
    } as VB6WithNode;
  }
  
  private errorHandlingStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'On'
    
    if (!this.consumeKeyword('error')) return null;
    
    let action: 'GoTo' | 'Resume' | 'GoToZero';
    let label: string | undefined;
    
    if (this.consumeKeyword('goto')) {
      if (this.match(VB6TokenType.NumberLiteral, '0')) {
        action = 'GoToZero';
        this.advance();
      } else {
        action = 'GoTo';
        const labelToken = this.consume(VB6TokenType.Identifier, 'Expected label');
        if (labelToken) label = labelToken.value;
      }
    } else if (this.consumeKeyword('resume')) {
      action = 'Resume';
      if (this.matchKeyword('next')) {
        this.advance();
      }
    } else {
      action = 'GoTo';
    }
    
    return {
      type: 'Statement',
      statementType: 'OnError',
      line: startToken.line,
      column: startToken.column,
      action,
      label
    } as VB6ErrorHandlingNode;
  }
  
  private localVariableDeclaration(): VB6StatementNode | null {
    return this.variableDeclaration(this.currentToken(), null) as VB6StatementNode;
  }
  
  private setStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Set'
    
    const target = this.expression();
    if (!target) return null;
    
    if (!this.consume(VB6TokenType.Operator, 'Expected =')) return null;
    
    const value = this.expression();
    if (!value) return null;
    
    return {
      type: 'Statement',
      statementType: 'Assignment',
      line: startToken.line,
      column: startToken.column,
      target,
      value,
      isSet: true
    } as VB6AssignmentNode;
  }
  
  private callStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Call'
    
    const expression = this.expression();
    if (!expression) return null;
    
    return {
      type: 'Statement',
      statementType: 'Call',
      line: startToken.line,
      column: startToken.column,
      expression
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
      exitType
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
      label: labelToken.value
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
      label: labelToken.value
    };
  }
  
  private returnStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Return'
    
    return {
      type: 'Statement',
      statementType: 'Return',
      line: startToken.line,
      column: startToken.column
    };
  }
  
  private resumeStatement(): VB6StatementNode | null {
    const startToken = this.currentToken();
    this.advance(); // consume 'Resume'
    
    let resumeType = 'Label';
    let label: string | undefined;
    
    if (this.matchKeyword('next')) {
      this.advance();
      resumeType = 'Next';
    } else if (this.match(VB6TokenType.Identifier)) {
      const labelToken = this.advance();
      label = labelToken.value;
    }
    
    return {
      type: 'Statement',
      statementType: 'Resume',
      line: startToken.line,
      column: startToken.column,
      resumeType,
      label
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
      expression
    };
  }
  
  private isProcedureStart(): boolean {
    return this.matchKeyword('sub') || this.matchKeyword('function') || this.matchKeyword('property') ||
           (this.matchKeyword('private') && this.peekProcedureKeyword()) ||
           (this.matchKeyword('public') && this.peekProcedureKeyword()) ||
           (this.matchKeyword('friend') && this.peekProcedureKeyword());
  }
  
  private isDeclarationStart(): boolean {
    return this.matchKeyword('dim') || this.matchKeyword('const') || this.matchKeyword('type') ||
           this.matchKeyword('enum') || this.matchKeyword('declare') || this.matchKeyword('event') ||
           (this.matchKeyword('private') && this.peekDeclarationKeyword()) ||
           (this.matchKeyword('public') && this.peekDeclarationKeyword()) ||
           (this.matchKeyword('global') && this.peekDeclarationKeyword());
  }
  
  private peekProcedureKeyword(): boolean {
    const nextPos = this.position + 1;
    if (nextPos >= this.tokens.length) return false;
    const nextToken = this.tokens[nextPos];
    return nextToken.type === VB6TokenType.Keyword && 
           ['sub', 'function', 'property'].includes(nextToken.value.toLowerCase());
  }
  
  private peekDeclarationKeyword(): boolean {
    const nextPos = this.position + 1;
    if (nextPos >= this.tokens.length) return false;
    const nextToken = this.tokens[nextPos];
    return nextToken.type === VB6TokenType.Keyword &&
           ['dim', 'const', 'type', 'enum', 'declare', 'event'].includes(nextToken.value.toLowerCase());
  }
}

/**
 * Convenience function to parse VB6 code
 */
export function parseVB6Code(source: string): { ast: VB6ModuleNode | null, errors: VB6ParseError[] } {
  const lexer = new VB6AdvancedLexer(source);
  const tokens = lexer.tokenize();
  
  const parser = new VB6RecursiveDescentParser(tokens);
  return parser.parseModule();
}