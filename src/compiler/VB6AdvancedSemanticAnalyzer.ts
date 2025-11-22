/**
 * VB6 Advanced Semantic Analyzer - Analyse sémantique complète
 * 6 phases d'analyse: symboles, types, flux de contrôle, code mort, interfaces, optimisations
 */

import { VB6TypeSystem, TypeCheckResult, VB6TypeInfo } from './VB6TypeSystem';
import { 
  VB6ModuleNode, 
  VB6ProcedureNode, 
  VB6StatementNode, 
  VB6ExpressionNode,
  VB6DeclarationNode,
  VB6ASTNode,
  VB6AssignmentNode,
  VB6IfNode,
  VB6ForNode,
  VB6WhileNode,
  VB6CallNode
} from './VB6RecursiveDescentParser';

export enum SemanticErrorSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Hint = 'hint'
}

export interface SemanticError {
  line: number;
  column: number;
  message: string;
  severity: SemanticErrorSeverity;
  code?: string;
  suggestion?: string;
}

export interface Symbol {
  name: string;
  type: VB6TypeInfo | string;
  scope: string;
  line: number;
  column: number;
  isConstant?: boolean;
  isStatic?: boolean;
  isWithEvents?: boolean;
  value?: any;
  references?: number;
  initialized?: boolean;
}

export interface Scope {
  name: string;
  parent?: Scope;
  symbols: Map<string, Symbol>;
  children: Scope[];
}

export interface ControlFlowNode {
  id: string;
  type: string;
  predecessors: Set<string>;
  successors: Set<string>;
  statement?: VB6StatementNode;
  reachable: boolean;
}

export interface ControlFlowGraph {
  entry: ControlFlowNode;
  exit: ControlFlowNode;
  nodes: Map<string, ControlFlowNode>;
}

export interface AnalysisResult {
  ast: VB6ModuleNode;
  symbolTable: Map<string, Symbol>;
  scopes: Scope;
  typeSystem: VB6TypeSystem;
  controlFlow: Map<string, ControlFlowGraph>;
  errors: SemanticError[];
  warnings: SemanticError[];
  metrics: AnalysisMetrics;
}

export interface AnalysisMetrics {
  totalSymbols: number;
  totalScopes: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
  unreachableCode: number;
  typeErrors: number;
  uninitializedVariables: number;
  unusedVariables: number;
}

/**
 * Analyseur sémantique avancé avec 6 phases d'analyse
 */
export class VB6AdvancedSemanticAnalyzer {
  private typeSystem: VB6TypeSystem;
  private symbolTable: Map<string, Symbol>;
  private currentScope: Scope;
  private rootScope: Scope;
  private controlFlowGraphs: Map<string, ControlFlowGraph>;
  private errors: SemanticError[];
  private warnings: SemanticError[];
  private nodeIdCounter: number;

  constructor(typeSystem?: VB6TypeSystem) {
    this.typeSystem = typeSystem || new VB6TypeSystem();
    this.symbolTable = new Map();
    this.rootScope = this.createScope('global');
    this.currentScope = this.rootScope;
    this.controlFlowGraphs = new Map();
    this.errors = [];
    this.warnings = [];
    this.nodeIdCounter = 0;
  }

  /**
   * Analyser un module VB6 avec les 6 phases
   */
  public analyze(ast: VB6ModuleNode): AnalysisResult {
    // Réinitialiser l'état
    this.reset();

    // Phase 1: Construction de la table des symboles
    console.log('Phase 1: Building symbol table...');
    this.buildSymbolTable(ast);

    // Phase 2: Résolution des types
    console.log('Phase 2: Resolving types...');
    this.resolveTypes(ast);

    // Phase 3: Vérification des types
    console.log('Phase 3: Type checking...');
    this.checkTypes(ast);

    // Phase 4: Analyse de flux de contrôle
    console.log('Phase 4: Control flow analysis...');
    this.analyzeControlFlow(ast);

    // Phase 5: Détection du code mort
    console.log('Phase 5: Dead code detection...');
    this.detectDeadCode(ast);

    // Phase 6: Validation des interfaces et événements
    console.log('Phase 6: Interface validation...');
    this.validateInterfaces(ast);

    // Calculer les métriques
    const metrics = this.computeMetrics(ast);

    return {
      ast,
      symbolTable: this.symbolTable,
      scopes: this.rootScope,
      typeSystem: this.typeSystem,
      controlFlow: this.controlFlowGraphs,
      errors: this.errors,
      warnings: this.warnings,
      metrics
    };
  }

  /**
   * Phase 1: Construction de la table des symboles
   */
  private buildSymbolTable(node: VB6ASTNode): void {
    switch (node.type) {
      case 'Module': {
        const module = node as VB6ModuleNode;

        // Traiter les déclarations globales
        for (const decl of module.declarations || []) {
          this.processDeclaration(decl);
        }

        // Traiter les procédures
        for (const proc of module.procedures || []) {
          this.processProcedure(proc);
        }
        break;
      }

      case 'Declaration':
        this.processDeclaration(node as VB6DeclarationNode);
        break;

      case 'Procedure':
        this.processProcedure(node as VB6ProcedureNode);
        break;

      default:
        // Parcourir récursivement les enfants
        this.traverseNode(node, child => this.buildSymbolTable(child));
    }
  }

  /**
   * Traiter une déclaration
   */
  private processDeclaration(decl: VB6DeclarationNode): void {
    const symbol: Symbol = {
      name: decl.name,
      type: decl.dataType?.typeName || 'Variant',
      scope: this.currentScope.name,
      line: decl.line,
      column: decl.column,
      isConstant: decl.declarationType === 'Constant',
      isStatic: decl.isStatic,
      isWithEvents: decl.isWithEvents,
      initialized: decl.initialValue !== undefined,
      references: 0
    };

    // Vérifier les doublons
    if (this.currentScope.symbols.has(decl.name)) {
      this.addError(
        decl.line,
        decl.column,
        `Duplicate declaration: '${decl.name}' is already defined in this scope`,
        'DUPLICATE_SYMBOL'
      );
    } else {
      this.currentScope.symbols.set(decl.name, symbol);
      this.symbolTable.set(this.getQualifiedName(decl.name), symbol);
    }
  }

  /**
   * Traiter une procédure
   */
  private processProcedure(proc: VB6ProcedureNode): void {
    // Créer un nouveau scope pour la procédure
    const procScope = this.createScope(proc.name, this.currentScope);
    const previousScope = this.currentScope;
    this.currentScope = procScope;

    // Ajouter la procédure elle-même comme symbole
    const procSymbol: Symbol = {
      name: proc.name,
      type: proc.returnType?.typeName || (proc.procedureType === 'Function' ? 'Variant' : 'Void'),
      scope: previousScope.name,
      line: proc.line,
      column: proc.column,
      isStatic: proc.isStatic,
      references: 0
    };
    previousScope.symbols.set(proc.name, procSymbol);

    // Ajouter les paramètres
    for (const param of proc.parameters || []) {
      const paramSymbol: Symbol = {
        name: param.name,
        type: param.dataType?.typeName || 'Variant',
        scope: procScope.name,
        line: param.line,
        column: param.column,
        initialized: true,
        references: 0
      };
      procScope.symbols.set(param.name, paramSymbol);
    }

    // Analyser le corps de la procédure
    for (const stmt of proc.body || []) {
      this.buildSymbolTable(stmt);
    }

    // Restaurer le scope précédent
    this.currentScope = previousScope;
  }

  /**
   * Phase 2: Résolution des types
   */
  private resolveTypes(node: VB6ASTNode): void {
    // Parcourir l'AST et résoudre tous les types
    this.traverseNode(node, (child) => {
      if (child.type === 'Declaration') {
        const decl = child as VB6DeclarationNode;
        const symbol = this.findSymbol(decl.name);
        
        if (symbol && typeof symbol.type === 'string') {
          const typeInfo = this.typeSystem.getType(symbol.type);
          if (!typeInfo) {
            this.addWarning(
              decl.line,
              decl.column,
              `Unknown type '${symbol.type}', defaulting to Variant`,
              'UNKNOWN_TYPE'
            );
            symbol.type = this.typeSystem.getType('Variant')!;
          } else {
            symbol.type = typeInfo;
          }
        }
      }
    });
  }

  /**
   * Phase 3: Vérification des types
   */
  private checkTypes(node: VB6ASTNode): void {
    switch (node.type) {
      case 'Statement': {
        const stmt = node as VB6StatementNode;
        if (stmt.statementType === 'Assignment') {
          this.checkAssignment(stmt as VB6AssignmentNode);
        } else if (stmt.statementType === 'Call') {
          this.checkFunctionCall(stmt as VB6CallNode);
        }
        break;
      }

      default:
        this.traverseNode(node, child => this.checkTypes(child));
    }
  }

  /**
   * Vérifier une assignation
   */
  private checkAssignment(assignment: VB6AssignmentNode): void {
    const targetType = this.getExpressionType(assignment.target);
    const valueType = this.getExpressionType(assignment.value);

    if (targetType && valueType) {
      const compatibility = this.typeSystem.checkTypeCompatibility(valueType, targetType);
      
      if (!compatibility.valid) {
        this.addError(
          assignment.line,
          assignment.column,
          `Type mismatch: ${compatibility.error}`,
          'TYPE_MISMATCH'
        );
      } else if (compatibility.warning) {
        this.addWarning(
          assignment.line,
          assignment.column,
          compatibility.warning,
          'TYPE_WARNING'
        );
      }
    }
  }

  /**
   * Vérifier un appel de fonction
   */
  private checkFunctionCall(call: VB6CallNode): void {
    const func = this.findSymbol(call.name);
    
    if (!func) {
      // Vérifier si c'est une fonction built-in
      const builtins = new Set([
        'MsgBox', 'InputBox', 'Print', 'Len', 'Left', 'Right', 'Mid',
        'UCase', 'LCase', 'Trim', 'Val', 'Str', 'Now', 'Timer'
      ]);
      
      if (!builtins.has(call.name)) {
        this.addError(
          call.line,
          call.column,
          `Undefined function or sub: '${call.name}'`,
          'UNDEFINED_FUNCTION'
        );
      }
    } else {
      func.references++;
    }
  }

  /**
   * Phase 4: Analyse de flux de contrôle
   */
  private analyzeControlFlow(node: VB6ASTNode): void {
    if (node.type === 'Procedure') {
      const proc = node as VB6ProcedureNode;
      const cfg = this.buildControlFlowGraph(proc);
      this.controlFlowGraphs.set(proc.name, cfg);
      
      // Vérifier les chemins de retour
      if (proc.procedureType === 'Function') {
        this.checkReturnPaths(proc, cfg);
      }
    }
    
    this.traverseNode(node, child => this.analyzeControlFlow(child));
  }

  /**
   * Construire le graphe de flux de contrôle
   */
  private buildControlFlowGraph(proc: VB6ProcedureNode): ControlFlowGraph {
    const entry: ControlFlowNode = {
      id: this.generateNodeId(),
      type: 'entry',
      predecessors: new Set(),
      successors: new Set(),
      reachable: true
    };

    const exit: ControlFlowNode = {
      id: this.generateNodeId(),
      type: 'exit',
      predecessors: new Set(),
      successors: new Set(),
      reachable: false
    };

    const nodes = new Map<string, ControlFlowNode>();
    nodes.set(entry.id, entry);
    nodes.set(exit.id, exit);

    // Construire le graphe à partir des statements
    let currentNode = entry;
    for (const stmt of proc.body || []) {
      const nextNode = this.processStatement(stmt, nodes, exit);
      currentNode.successors.add(nextNode.id);
      nextNode.predecessors.add(currentNode.id);
      currentNode = nextNode;
    }

    // Connecter le dernier nœud à la sortie
    currentNode.successors.add(exit.id);
    exit.predecessors.add(currentNode.id);

    // Marquer les nœuds atteignables
    this.markReachableNodes(entry, nodes);

    return { entry, exit, nodes };
  }

  /**
   * Traiter un statement pour le CFG
   */
  private processStatement(
    stmt: VB6StatementNode,
    nodes: Map<string, ControlFlowNode>,
    exit: ControlFlowNode
  ): ControlFlowNode {
    const node: ControlFlowNode = {
      id: this.generateNodeId(),
      type: stmt.statementType,
      predecessors: new Set(),
      successors: new Set(),
      statement: stmt,
      reachable: false
    };
    nodes.set(node.id, node);

    // Gérer les structures de contrôle
    switch (stmt.statementType) {
      case 'If': {
        const ifStmt = stmt as VB6IfNode;
        // Créer des branches pour then et else
        // Simplification pour l'exemple
        break;
      }

      case 'For':
      case 'While':
      case 'Do':
        // Créer une boucle dans le CFG
        break;

      case 'Exit':
      case 'Return':
        // Connecter directement à la sortie
        node.successors.add(exit.id);
        exit.predecessors.add(node.id);
        break;
    }

    return node;
  }

  /**
   * Phase 5: Détection du code mort
   */
  private detectDeadCode(node: VB6ASTNode): void {
    // Vérifier les variables non utilisées
    for (const [name, symbol] of this.symbolTable) {
      if (symbol.references === 0 && !symbol.name.startsWith('_')) {
        this.addWarning(
          symbol.line,
          symbol.column,
          `Unused variable: '${symbol.name}' is declared but never used`,
          'UNUSED_VARIABLE'
        );
      }
    }

    // Vérifier le code non atteignable dans les CFG
    for (const [procName, cfg] of this.controlFlowGraphs) {
      for (const [nodeId, node] of cfg.nodes) {
        if (!node.reachable && node.type !== 'exit') {
          if (node.statement) {
            this.addWarning(
              node.statement.line,
              node.statement.column,
              'Unreachable code detected',
              'UNREACHABLE_CODE'
            );
          }
        }
      }
    }

    // Vérifier les boucles infinies
    this.detectInfiniteLoops(node);
  }

  /**
   * Détecter les boucles infinies potentielles
   */
  private detectInfiniteLoops(node: VB6ASTNode): void {
    if (node.type === 'Statement') {
      const stmt = node as VB6StatementNode;
      
      if (stmt.statementType === 'While' || stmt.statementType === 'Do') {
        const loop = stmt as VB6WhileNode;
        
        // Vérifier si la condition est une constante true
        if (this.isConstantTrue(loop.condition)) {
          // Vérifier s'il y a un Exit dans le corps
          const hasExit = this.containsExit(loop.body);
          
          if (!hasExit) {
            this.addWarning(
              loop.line,
              loop.column,
              'Potential infinite loop detected',
              'INFINITE_LOOP'
            );
          }
        }
      }
    }
    
    this.traverseNode(node, child => this.detectInfiniteLoops(child));
  }

  /**
   * Phase 6: Validation des interfaces et événements
   */
  private validateInterfaces(node: VB6ASTNode): void {
    // Vérifier les implémentations d'interface
    // Vérifier les WithEvents et RaiseEvent
    // Vérifier les propriétés Get/Let/Set cohérentes
    
    if (node.type === 'Module') {
      const module = node as VB6ModuleNode;
      
      // Vérifier les propriétés
      const properties = new Map<string, Set<string>>();
      
      for (const proc of module.procedures || []) {
        if (proc.procedureType.startsWith('Property')) {
          const propType = proc.procedureType.substring(8); // Remove 'Property'
          
          if (!properties.has(proc.name)) {
            properties.set(proc.name, new Set());
          }
          properties.get(proc.name)!.add(propType);
        }
      }
      
      // Vérifier la cohérence des propriétés
      for (const [propName, types] of properties) {
        if (types.has('Let') && types.has('Set')) {
          this.addWarning(
            0, 0,
            `Property '${propName}' has both Let and Set accessors`,
            'PROPERTY_AMBIGUOUS'
          );
        }
      }
    }
  }

  // Méthodes utilitaires

  private createScope(name: string, parent?: Scope): Scope {
    const scope: Scope = {
      name,
      parent,
      symbols: new Map(),
      children: []
    };
    
    if (parent) {
      parent.children.push(scope);
    }
    
    return scope;
  }

  private findSymbol(name: string): Symbol | undefined {
    // Chercher dans le scope actuel et remonter
    let scope: Scope | undefined = this.currentScope;
    
    while (scope) {
      if (scope.symbols.has(name)) {
        return scope.symbols.get(name);
      }
      scope = scope.parent;
    }
    
    // Chercher dans la table globale
    return this.symbolTable.get(name);
  }

  private getQualifiedName(name: string): string {
    if (this.currentScope.name === 'global') {
      return name;
    }
    return `${this.currentScope.name}.${name}`;
  }

  private getExpressionType(expr: VB6ExpressionNode): VB6TypeInfo | undefined {
    // Simplification - devrait analyser l'expression complète
    if (expr.expressionType === 'Identifier') {
      const symbol = this.findSymbol((expr as any).name);
      return symbol ? (symbol.type as VB6TypeInfo) : undefined;
    }
    
    if (expr.expressionType === 'Literal') {
      const literal = expr as any;
      if (typeof literal.value === 'number') {
        return this.typeSystem.getType('Double');
      }
      if (typeof literal.value === 'string') {
        return this.typeSystem.getType('String');
      }
      if (typeof literal.value === 'boolean') {
        return this.typeSystem.getType('Boolean');
      }
    }
    
    return this.typeSystem.getType('Variant');
  }

  private traverseNode(node: VB6ASTNode, visitor: (node: VB6ASTNode) => void): void {
    if (!node) return;
    
    // Parcourir tous les champs qui pourraient contenir des nœuds
    for (const key in node) {
      const value = (node as any)[key];
      
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && 'type' in item) {
            visitor(item);
          }
        }
      } else if (value && typeof value === 'object' && 'type' in value) {
        visitor(value);
      }
    }
  }

  private generateNodeId(): string {
    return `node_${this.nodeIdCounter++}`;
  }

  private markReachableNodes(
    start: ControlFlowNode,
    nodes: Map<string, ControlFlowNode>
  ): void {
    const visited = new Set<string>();
    const queue = [start];
    
    while (queue.length > 0) {
      const node = queue.shift()!;
      
      if (visited.has(node.id)) continue;
      
      visited.add(node.id);
      node.reachable = true;
      
      for (const successorId of node.successors) {
        const successor = nodes.get(successorId);
        if (successor && !visited.has(successorId)) {
          queue.push(successor);
        }
      }
    }
  }

  private checkReturnPaths(proc: VB6ProcedureNode, cfg: ControlFlowGraph): void {
    // Vérifier que tous les chemins mènent à un return pour les fonctions
    const hasReturn = this.allPathsReturn(cfg.entry, cfg.exit, cfg.nodes, new Set());
    
    if (!hasReturn) {
      this.addWarning(
        proc.line,
        proc.column,
        `Function '${proc.name}' doesn't return a value on all code paths`,
        'MISSING_RETURN'
      );
    }
  }

  private allPathsReturn(
    node: ControlFlowNode,
    exit: ControlFlowNode,
    nodes: Map<string, ControlFlowNode>,
    visited: Set<string>
  ): boolean {
    if (visited.has(node.id)) return true;
    visited.add(node.id);
    
    if (node.id === exit.id) return true;
    
    if (node.statement && node.statement.statementType === 'Return') {
      return true;
    }
    
    if (node.successors.size === 0) return false;
    
    for (const successorId of node.successors) {
      const successor = nodes.get(successorId);
      if (successor && !this.allPathsReturn(successor, exit, nodes, visited)) {
        return false;
      }
    }
    
    return true;
  }

  private isConstantTrue(expr: VB6ExpressionNode): boolean {
    // Simplification - vérifier si c'est littéralement True
    return expr.expressionType === 'Literal' && (expr as any).value === true;
  }

  private containsExit(statements: VB6StatementNode[]): boolean {
    for (const stmt of statements) {
      if (stmt.statementType === 'Exit') return true;
      
      // Vérifier récursivement dans les sous-statements
      if (stmt.statementType === 'If') {
        const ifStmt = stmt as VB6IfNode;
        if (this.containsExit(ifStmt.thenStatements)) return true;
        if (ifStmt.elseStatements && this.containsExit(ifStmt.elseStatements)) return true;
      }
    }
    return false;
  }

  private computeMetrics(ast: VB6ModuleNode): AnalysisMetrics {
    let cyclomaticComplexity = 1;
    let linesOfCode = 0;
    let unreachableCode = 0;
    let uninitializedVariables = 0;
    let unusedVariables = 0;

    // Calculer la complexité cyclomatique
    this.traverseNode(ast, (node) => {
      if (node.type === 'Statement') {
        const stmt = node as VB6StatementNode;
        if (['If', 'For', 'While', 'Do', 'Case'].includes(stmt.statementType)) {
          cyclomaticComplexity++;
        }
      }
      linesOfCode++;
    });

    // Compter les variables non initialisées et non utilisées
    for (const symbol of this.symbolTable.values()) {
      if (!symbol.initialized) uninitializedVariables++;
      if (symbol.references === 0) unusedVariables++;
    }

    // Compter le code non atteignable
    for (const cfg of this.controlFlowGraphs.values()) {
      for (const node of cfg.nodes.values()) {
        if (!node.reachable) unreachableCode++;
      }
    }

    return {
      totalSymbols: this.symbolTable.size,
      totalScopes: this.countScopes(this.rootScope),
      cyclomaticComplexity,
      linesOfCode,
      unreachableCode,
      typeErrors: this.errors.filter(e => e.code?.includes('TYPE')).length,
      uninitializedVariables,
      unusedVariables
    };
  }

  private countScopes(scope: Scope): number {
    return 1 + scope.children.reduce((sum, child) => sum + this.countScopes(child), 0);
  }

  private addError(line: number, column: number, message: string, code?: string): void {
    this.errors.push({
      line,
      column,
      message,
      severity: SemanticErrorSeverity.Error,
      code
    });
  }

  private addWarning(line: number, column: number, message: string, code?: string): void {
    this.warnings.push({
      line,
      column,
      message,
      severity: SemanticErrorSeverity.Warning,
      code
    });
  }

  private reset(): void {
    this.symbolTable.clear();
    this.rootScope = this.createScope('global');
    this.currentScope = this.rootScope;
    this.controlFlowGraphs.clear();
    this.errors = [];
    this.warnings = [];
    this.nodeIdCounter = 0;
  }
}

export default VB6AdvancedSemanticAnalyzer;