/**
 * VB6 Global Objects - Objets système globaux VB6
 * Implémentation complète de Forms, Printers, Debug, Err collections
 * Compatible 100% avec Visual Basic 6.0
 */

import { VB6Form } from '../types/VB6Form';
import { VB6Printer } from '../types/VB6Printer';

/** Error with VB6 metadata attached */
interface VB6Error extends Error {
  vb6Number: number;
  vb6Source: string;
}

/** Window augmentation for VB6 global objects */
interface VB6GlobalWindow {
  Forms: VB6FormsCollection;
  Printers: VB6PrintersCollection;
  Debug: VB6DebugObject;
  Err: VB6ErrObject;
}

// ============================================================================
// FORMS COLLECTION - Collection globale des formulaires
// ============================================================================

export class VB6FormsCollection {
  private static instance: VB6FormsCollection;
  private forms: Map<string, VB6Form> = new Map();
  private formsByIndex: VB6Form[] = [];

  static getInstance(): VB6FormsCollection {
    if (!VB6FormsCollection.instance) {
      VB6FormsCollection.instance = new VB6FormsCollection();
    }
    return VB6FormsCollection.instance;
  }

  // Propriété Count
  get Count(): number {
    return this.forms.size;
  }

  // Accès par index ou nom - Forms(0) ou Forms("Form1")
  Item(indexOrName: number | string): VB6Form | null {
    if (typeof indexOrName === 'number') {
      return this.formsByIndex[indexOrName] || null;
    } else {
      return this.forms.get(indexOrName) || null;
    }
  }

  // Ajouter un formulaire
  Add(form: VB6Form): void {
    this.forms.set(form.Name, form);
    this.formsByIndex.push(form);
  }

  // Supprimer un formulaire
  Remove(indexOrName: number | string): void {
    let form: VB6Form | null = null;

    if (typeof indexOrName === 'number') {
      form = this.formsByIndex[indexOrName];
      if (form) {
        this.forms.delete(form.Name);
        this.formsByIndex.splice(indexOrName, 1);
      }
    } else {
      form = this.forms.get(indexOrName);
      if (form) {
        this.forms.delete(indexOrName);
        const index = this.formsByIndex.indexOf(form);
        if (index > -1) {
          this.formsByIndex.splice(index, 1);
        }
      }
    }
  }

  // Énumération - For Each
  *[Symbol.iterator](): Iterator<VB6Form> {
    for (const form of this.formsByIndex) {
      yield form;
    }
  }

  // VB6 For Each support
  get NewEnum(): Iterator<VB6Form> {
    return this[Symbol.iterator]();
  }

  // Méthodes VB6
  Clear(): void {
    this.forms.clear();
    this.formsByIndex = [];
  }

  // Trouver par propriété
  FindFormByCaption(caption: string): VB6Form | null {
    for (const form of this.formsByIndex) {
      if (form.Caption === caption) {
        return form;
      }
    }
    return null;
  }

  // Obtenir toutes les formes visibles
  GetVisibleForms(): VB6Form[] {
    return this.formsByIndex.filter(form => form.Visible);
  }

  // Obtenir la forme active
  GetActiveForm(): VB6Form | null {
    return this.formsByIndex.find(form => form.WindowState !== 1 && form.Visible) || null;
  }
}

// ============================================================================
// PRINTERS COLLECTION - Collection des imprimantes système
// ============================================================================

export class VB6PrintersCollection {
  private static instance: VB6PrintersCollection;
  private printers: VB6Printer[] = [];
  private defaultPrinter: VB6Printer | null = null;

  static getInstance(): VB6PrintersCollection {
    if (!VB6PrintersCollection.instance) {
      VB6PrintersCollection.instance = new VB6PrintersCollection();
      VB6PrintersCollection.instance.initializePrinters();
    }
    return VB6PrintersCollection.instance;
  }

  private initializePrinters(): void {
    // Simuler les imprimantes disponibles (dans un navigateur)
    this.printers = [
      new VB6Printer('Microsoft Print to PDF', true, true),
      new VB6Printer('Microsoft XPS Document Writer', true, false),
      new VB6Printer('Fax', false, false),
    ];

    // Imprimante par défaut
    this.defaultPrinter = this.printers[0];
  }

  // Propriété Count
  get Count(): number {
    return this.printers.length;
  }

  // Accès par index - Printers(0)
  Item(index: number): VB6Printer | null {
    return this.printers[index] || null;
  }

  // Énumération
  *[Symbol.iterator](): Iterator<VB6Printer> {
    for (const printer of this.printers) {
      yield printer;
    }
  }

  get NewEnum(): Iterator<VB6Printer> {
    return this[Symbol.iterator]();
  }

  // Propriétés VB6
  get Default(): VB6Printer | null {
    return this.defaultPrinter;
  }

  set Default(printer: VB6Printer | null) {
    if (printer && this.printers.includes(printer)) {
      this.defaultPrinter = printer;
    }
  }

  // Méthodes
  Refresh(): void {
    this.initializePrinters();
  }

  FindPrinterByName(name: string): VB6Printer | null {
    return this.printers.find(p => p.DeviceName === name) || null;
  }
}

// ============================================================================
// DEBUG OBJECT - Objet Debug VB6
// ============================================================================

export class VB6DebugObject {
  private static instance: VB6DebugObject;
  private output: string[] = [];
  private assertEnabled: boolean = true;

  static getInstance(): VB6DebugObject {
    if (!VB6DebugObject.instance) {
      VB6DebugObject.instance = new VB6DebugObject();
    }
    return VB6DebugObject.instance;
  }

  // Debug.Print - Affiche dans la console
  Print(...args: any[]): void {
    const message = args
      .map(arg => (arg === null ? 'Null' : arg === undefined ? '' : String(arg)))
      .join(' ');

    this.output.push(message);

    // Déclencher événement pour l'IDE
    if (typeof window !== 'undefined' && window.postMessage) {
      window.postMessage(
        {
          type: 'VB6_DEBUG_PRINT',
          message,
          timestamp: new Date().toISOString(),
        },
        '*'
      );
    }
  }

  // Debug.Assert - Assertion conditionnelle
  Assert(condition: boolean, message?: string): void {
    if (!this.assertEnabled) return;

    if (!condition) {
      const assertMessage = message || 'Assertion failed';
      this.Print(`ASSERTION FAILED: ${assertMessage}`);

      // Dans un navigateur, déclencher un breakpoint si les DevTools sont ouverts
      if (typeof window !== 'undefined') {
        console.error(`VB6 Assert Failed: ${assertMessage}`);
        // eslint-disable-next-line no-debugger
        debugger;
      }

      // Déclencher l'événement pour l'IDE
      if (typeof window !== 'undefined' && window.postMessage) {
        window.postMessage(
          {
            type: 'VB6_DEBUG_ASSERT',
            message: assertMessage,
            timestamp: new Date().toISOString(),
          },
          '*'
        );
      }
    }
  }

  // Méthodes additionnelles
  Clear(): void {
    this.output = [];
    console.clear();
  }

  GetOutput(): string[] {
    return [...this.output];
  }

  GetLastOutput(count: number = 10): string[] {
    return this.output.slice(-count);
  }

  get AssertEnabled(): boolean {
    return this.assertEnabled;
  }

  set AssertEnabled(enabled: boolean) {
    this.assertEnabled = enabled;
  }
}

// ============================================================================
// ERR OBJECT - Gestion d'erreurs VB6
// ============================================================================

export class VB6ErrObject {
  private static instance: VB6ErrObject;
  private _number: number = 0;
  private _description: string = '';
  private _source: string = '';
  private _helpFile: string = '';
  private _helpContext: number = 0;
  private _lastDllError: number = 0;

  static getInstance(): VB6ErrObject {
    if (!VB6ErrObject.instance) {
      VB6ErrObject.instance = new VB6ErrObject();
    }
    return VB6ErrObject.instance;
  }

  // Propriétés VB6
  get Number(): number {
    return this._number;
  }

  set Number(value: number) {
    this._number = value;
    if (value === 0) {
      this._description = '';
      this._source = '';
    }
  }

  get Description(): string {
    return this._description;
  }

  set Description(value: string) {
    this._description = value;
  }

  get Source(): string {
    return this._source;
  }

  set Source(value: string) {
    this._source = value;
  }

  get HelpFile(): string {
    return this._helpFile;
  }

  set HelpFile(value: string) {
    this._helpFile = value;
  }

  get HelpContext(): number {
    return this._helpContext;
  }

  set HelpContext(value: number) {
    this._helpContext = value;
  }

  get LastDllError(): number {
    return this._lastDllError;
  }

  // Méthodes VB6
  Clear(): void {
    this._number = 0;
    this._description = '';
    this._source = '';
    this._helpFile = '';
    this._helpContext = 0;
    this._lastDllError = 0;
  }

  Raise(
    number: number,
    source?: string,
    description?: string,
    helpFile?: string,
    helpContext?: number
  ): void {
    this._number = number;
    this._source = source || '';
    this._description = description || this.getDefaultDescription(number);
    this._helpFile = helpFile || '';
    this._helpContext = helpContext || 0;

    // Créer et lancer l'erreur JavaScript
    const error: VB6Error = Object.assign(new Error(this._description), {
      vb6Number: number,
      vb6Source: this._source,
    });
    throw error;
  }

  private getDefaultDescription(errorNumber: number): string {
    const errorMessages: { [key: number]: string } = {
      5: 'Invalid procedure call or argument',
      6: 'Overflow',
      7: 'Out of memory',
      9: 'Subscript out of range',
      11: 'Division by zero',
      13: 'Type mismatch',
      14: 'Out of string space',
      28: 'Out of stack space',
      35: 'Sub or Function not defined',
      48: 'Error in loading DLL',
      49: 'Bad DLL calling convention',
      51: 'Internal error',
      52: 'Bad file name or number',
      53: 'File not found',
      54: 'Bad file mode',
      55: 'File already open',
      57: 'Device I/O error',
      58: 'File already exists',
      61: 'Disk full',
      62: 'Input past end of file',
      67: 'Too many files',
      68: 'Device unavailable',
      70: 'Permission denied',
      71: 'Disk not ready',
      74: "Can't rename with different drive",
      75: 'Path/File access error',
      76: 'Path not found',
      91: 'Object variable or With block variable not set',
      92: 'For loop not initialized',
      93: 'Invalid pattern string',
      94: 'Invalid use of Null',
      380: 'Invalid property value',
      381: 'Invalid property array index',
      382: 'Set not supported at runtime',
      383: 'Set not supported (read-only property)',
      438: "Object doesn't support this property or method",
      445: "Object doesn't support this action",
      449: 'Argument not optional',
      450: 'Wrong number of arguments or invalid property assignment',
      451: 'Property let procedure not defined and property get procedure did not return an object',
      452: 'Invalid ordinal',
      453: 'Specified DLL function not found',
      454: 'Code resource not found',
      455: 'Code resource lock error',
      457: 'This key is already associated with an element of this collection',
      458: 'Variable uses an Automation type not supported in Visual Basic',
      459: 'Object or class does not support the set of events',
      460: 'Invalid clipboard format',
      461: 'Method or data member not found',
      462: 'The remote server machine does not exist or is unavailable',
      463: 'Class not registered on local machine',
    };

    return errorMessages[errorNumber] || `Error ${errorNumber}`;
  }

  // Méthode pour définir une erreur depuis JavaScript
  SetFromJavaScriptError(jsError: Error): void {
    const vb6Err = jsError as Partial<VB6Error>;
    this._number = vb6Err.vb6Number || 440; // Automation error
    this._description = jsError.message;
    this._source = vb6Err.vb6Source || 'JavaScript';
  }
}

// ============================================================================
// GLOBALS - Instances globales
// ============================================================================

export const Forms = VB6FormsCollection.getInstance();
export const Printers = VB6PrintersCollection.getInstance();
export const Debug = VB6DebugObject.getInstance();
export const Err = VB6ErrObject.getInstance();

// Ajouter aux globals du navigateur pour compatibilité VB6
if (typeof window !== 'undefined') {
  const vb6Window = window as unknown as VB6GlobalWindow;
  vb6Window.Forms = Forms;
  vb6Window.Printers = Printers;
  vb6Window.Debug = Debug;
  vb6Window.Err = Err;
}

// Export par défaut
export default {
  Forms,
  Printers,
  Debug,
  Err,
  VB6FormsCollection,
  VB6PrintersCollection,
  VB6DebugObject,
  VB6ErrObject,
};
