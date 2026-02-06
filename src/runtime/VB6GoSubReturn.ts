/**
 * VB6 GoSub/Return Implementation
 * Provides GoSub and Return statement support for VB6 compatibility
 */

export interface GoSubContext {
  returnAddress: number;
  returnLabel?: string;
  procedureName: string;
  localVariables: Map<string, any>;
}

/**
 * VB6 GoSub/Return Handler
 * Manages the GoSub return stack for VB6-style subroutine calls
 */
export class VB6GoSubHandler {
  private static instance: VB6GoSubHandler;
  private gosubStack: GoSubContext[] = [];
  private maxStackDepth = 1000; // Prevent stack overflow

  private constructor() {}

  static getInstance(): VB6GoSubHandler {
    if (!VB6GoSubHandler.instance) {
      VB6GoSubHandler.instance = new VB6GoSubHandler();
    }
    return VB6GoSubHandler.instance;
  }

  /**
   * GoSub - Jump to a label and remember return point
   * @param targetLabel The label to jump to
   * @param returnAddress The line number to return to
   * @param procedureName The current procedure name
   * @param localVars Local variables to preserve
   */
  goSub(
    targetLabel: string,
    returnAddress: number,
    procedureName: string = '',
    localVars: Map<string, any> = new Map()
  ): string {
    // Check stack depth
    if (this.gosubStack.length >= this.maxStackDepth) {
      throw new Error('Out of stack space (Error 28)');
    }

    // Push return context onto stack
    this.gosubStack.push({
      returnAddress,
      returnLabel: undefined,
      procedureName,
      localVariables: new Map(localVars), // Copy local variables
    });

    // Return the target label to jump to
    return targetLabel;
  }

  /**
   * Return - Return from GoSub to the saved return point
   * @returns The return address or null if stack is empty
   */
  return(): GoSubContext | null {
    if (this.gosubStack.length === 0) {
      throw new Error('Return without GoSub (Error 3)');
    }

    // Pop and return the context
    return this.gosubStack.pop() || null;
  }

  /**
   * Check if currently in a GoSub call
   */
  isInGoSub(): boolean {
    return this.gosubStack.length > 0;
  }

  /**
   * Get current stack depth
   */
  getStackDepth(): number {
    return this.gosubStack.length;
  }

  /**
   * Clear the GoSub stack (used when exiting a procedure)
   */
  clearStack(): void {
    this.gosubStack = [];
  }

  /**
   * Clear stack for a specific procedure
   */
  clearProcedureStack(procedureName: string): void {
    // Remove all GoSub contexts for this procedure
    this.gosubStack = this.gosubStack.filter(context => context.procedureName !== procedureName);
  }
}

// Export singleton instance
export const GoSubHandler = VB6GoSubHandler.getInstance();

/**
 * Helper functions for transpiled VB6 code
 */

/**
 * Execute a GoSub jump
 * @param label Target label
 * @param returnLine Return line number
 * @param procedure Current procedure name
 * @param locals Local variables
 */
export function GoSub(
  label: string,
  returnLine: number,
  procedure?: string,
  locals?: Record<string, any>
): string {
  const localVars = locals ? new Map(Object.entries(locals)) : new Map();
  return GoSubHandler.goSub(label, returnLine, procedure || '', localVars);
}

/**
 * Execute a Return statement
 * @returns Object with return address and restored variables
 */
export function Return(): {
  line: number;
  procedure: string;
  variables: Record<string, any>;
} | null {
  const context = GoSubHandler.return();
  if (!context) return null;

  return {
    line: context.returnAddress,
    procedure: context.procedureName,
    variables: Object.fromEntries(context.localVariables),
  };
}

/**
 * Check if in GoSub context
 */
export function IsInGoSub(): boolean {
  return GoSubHandler.isInGoSub();
}

/**
 * Clear GoSub stack for procedure exit
 */
export function ClearGoSubStack(procedure?: string): void {
  if (procedure) {
    GoSubHandler.clearProcedureStack(procedure);
  } else {
    GoSubHandler.clearStack();
  }
}
