/**
 * Matrice de compatibilité VB6 complète
 * Référence exhaustive de toutes les propriétés, méthodes et événements VB6
 */

export interface VB6Property {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'enum' | 'color' | 'font' | 'picture';
  defaultValue?: any;
  readOnly?: boolean;
  designTime?: boolean;
  runTime?: boolean;
  enumValues?: string[];
  description?: string;
}

export interface VB6Method {
  name: string;
  parameters: Array<{
    name: string;
    type: string;
    optional?: boolean;
    defaultValue?: any;
  }>;
  returnType?: string;
  description?: string;
}

export interface VB6Event {
  name: string;
  parameters: Array<{
    name: string;
    type: string;
  }>;
  description?: string;
}

export interface VB6ControlSpec {
  name: string;
  properties: VB6Property[];
  methods: VB6Method[];
  events: VB6Event[];
  implementationStatus: 'complete' | 'partial' | 'missing';
}

// Propriétés communes à tous les contrôles
const COMMON_PROPERTIES: VB6Property[] = [
  { name: 'Name', type: 'string', designTime: true, description: 'Nom du contrôle' },
  {
    name: 'Index',
    type: 'number',
    designTime: true,
    description: 'Index dans un tableau de contrôles',
  },
  { name: 'Left', type: 'number', defaultValue: 0, description: 'Position horizontale' },
  { name: 'Top', type: 'number', defaultValue: 0, description: 'Position verticale' },
  { name: 'Width', type: 'number', defaultValue: 100, description: 'Largeur' },
  { name: 'Height', type: 'number', defaultValue: 100, description: 'Hauteur' },
  { name: 'Visible', type: 'boolean', defaultValue: true, description: 'Visibilité' },
  { name: 'Enabled', type: 'boolean', defaultValue: true, description: 'État activé/désactivé' },
  { name: 'TabIndex', type: 'number', defaultValue: 0, description: 'Ordre de tabulation' },
  { name: 'TabStop', type: 'boolean', defaultValue: true, description: 'Peut recevoir le focus' },
  { name: 'Tag', type: 'string', defaultValue: '', description: 'Données utilisateur' },
  { name: 'ToolTipText', type: 'string', defaultValue: '', description: "Texte d'aide" },
  { name: 'Container', type: 'object', readOnly: true, description: 'Conteneur parent' },
  { name: 'Parent', type: 'object', readOnly: true, description: 'Objet parent' },
  { name: 'HelpContextID', type: 'number', defaultValue: 0, description: "ID contexte d'aide" },
  { name: 'WhatsThisHelpID', type: 'number', defaultValue: 0, description: 'ID aide contextuelle' },
];

const COMMON_METHODS: VB6Method[] = [
  {
    name: 'Move',
    parameters: [
      { name: 'Left', type: 'number' },
      { name: 'Top', type: 'number', optional: true },
      { name: 'Width', type: 'number', optional: true },
      { name: 'Height', type: 'number', optional: true },
    ],
    description: 'Déplace et redimensionne le contrôle',
  },
  { name: 'SetFocus', parameters: [], description: 'Donne le focus au contrôle' },
  { name: 'Refresh', parameters: [], description: 'Force le redessin' },
  {
    name: 'ZOrder',
    parameters: [{ name: 'Position', type: 'number', optional: true }],
    description: "Change l'ordre Z",
  },
];

const COMMON_EVENTS: VB6Event[] = [
  {
    name: 'DragDrop',
    parameters: [
      { name: 'Source', type: 'Control' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
    ],
  },
  {
    name: 'DragOver',
    parameters: [
      { name: 'Source', type: 'Control' },
      { name: 'X', type: 'Single' },
      { name: 'Y', type: 'Single' },
      { name: 'State', type: 'Integer' },
    ],
  },
  { name: 'GotFocus', parameters: [] },
  { name: 'LostFocus', parameters: [] },
];

// Spécifications complètes des contrôles VB6
export const VB6_CONTROLS: VB6ControlSpec[] = [
  {
    name: 'CommandButton',
    properties: [
      ...COMMON_PROPERTIES,
      { name: 'Caption', type: 'string', defaultValue: 'Command1', description: 'Texte du bouton' },
      { name: 'Default', type: 'boolean', defaultValue: false, description: 'Bouton par défaut' },
      { name: 'Cancel', type: 'boolean', defaultValue: false, description: "Bouton d'annulation" },
      {
        name: 'Style',
        type: 'enum',
        enumValues: ['Standard', 'Graphical'],
        defaultValue: 'Standard',
      },
      { name: 'Picture', type: 'picture', description: 'Image du bouton' },
      { name: 'DisabledPicture', type: 'picture', description: 'Image en mode désactivé' },
      { name: 'DownPicture', type: 'picture', description: 'Image en mode enfoncé' },
      { name: 'MaskColor', type: 'color', description: 'Couleur de transparence' },
      { name: 'UseMaskColor', type: 'boolean', defaultValue: false },
      { name: 'BackColor', type: 'color', defaultValue: '#C0C0C0' },
      { name: 'ForeColor', type: 'color', defaultValue: '#000000' },
      { name: 'Font', type: 'font', description: 'Police du texte' },
    ],
    methods: [...COMMON_METHODS],
    events: [
      ...COMMON_EVENTS,
      { name: 'Click', parameters: [] },
      {
        name: 'MouseDown',
        parameters: [
          { name: 'Button', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
          { name: 'X', type: 'Single' },
          { name: 'Y', type: 'Single' },
        ],
      },
      {
        name: 'MouseMove',
        parameters: [
          { name: 'Button', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
          { name: 'X', type: 'Single' },
          { name: 'Y', type: 'Single' },
        ],
      },
      {
        name: 'MouseUp',
        parameters: [
          { name: 'Button', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
          { name: 'X', type: 'Single' },
          { name: 'Y', type: 'Single' },
        ],
      },
      {
        name: 'KeyDown',
        parameters: [
          { name: 'KeyCode', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
        ],
      },
      { name: 'KeyPress', parameters: [{ name: 'KeyAscii', type: 'Integer' }] },
      {
        name: 'KeyUp',
        parameters: [
          { name: 'KeyCode', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
        ],
      },
    ],
    implementationStatus: 'complete',
  },
  {
    name: 'TextBox',
    properties: [
      ...COMMON_PROPERTIES,
      { name: 'Text', type: 'string', defaultValue: '', description: 'Texte du contrôle' },
      { name: 'MultiLine', type: 'boolean', defaultValue: false, description: 'Multi-lignes' },
      {
        name: 'ScrollBars',
        type: 'enum',
        enumValues: ['None', 'Horizontal', 'Vertical', 'Both'],
        defaultValue: 'None',
      },
      {
        name: 'Alignment',
        type: 'enum',
        enumValues: ['Left', 'Right', 'Center'],
        defaultValue: 'Left',
      },
      { name: 'MaxLength', type: 'number', defaultValue: 0, description: 'Longueur maximale' },
      {
        name: 'PasswordChar',
        type: 'string',
        defaultValue: '',
        description: 'Caractère de masquage',
      },
      { name: 'Locked', type: 'boolean', defaultValue: false, description: 'Verrouillé' },
      { name: 'HideSelection', type: 'boolean', defaultValue: true },
      { name: 'SelStart', type: 'number', description: 'Début de sélection' },
      { name: 'SelLength', type: 'number', description: 'Longueur de sélection' },
      { name: 'SelText', type: 'string', description: 'Texte sélectionné' },
      {
        name: 'BorderStyle',
        type: 'enum',
        enumValues: ['None', 'Fixed Single'],
        defaultValue: 'Fixed Single',
      },
      { name: 'BackColor', type: 'color', defaultValue: '#FFFFFF' },
      { name: 'ForeColor', type: 'color', defaultValue: '#000000' },
      { name: 'Font', type: 'font' },
    ],
    methods: [
      ...COMMON_METHODS,
      {
        name: 'SetSel',
        parameters: [
          { name: 'Start', type: 'number' },
          { name: 'Length', type: 'number' },
        ],
        description: 'Sélectionne du texte',
      },
    ],
    events: [
      ...COMMON_EVENTS,
      { name: 'Change', parameters: [] },
      { name: 'Click', parameters: [] },
      { name: 'DblClick', parameters: [] },
      {
        name: 'KeyDown',
        parameters: [
          { name: 'KeyCode', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
        ],
      },
      { name: 'KeyPress', parameters: [{ name: 'KeyAscii', type: 'Integer' }] },
      {
        name: 'KeyUp',
        parameters: [
          { name: 'KeyCode', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
        ],
      },
      {
        name: 'MouseDown',
        parameters: [
          { name: 'Button', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
          { name: 'X', type: 'Single' },
          { name: 'Y', type: 'Single' },
        ],
      },
      {
        name: 'MouseMove',
        parameters: [
          { name: 'Button', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
          { name: 'X', type: 'Single' },
          { name: 'Y', type: 'Single' },
        ],
      },
      {
        name: 'MouseUp',
        parameters: [
          { name: 'Button', type: 'Integer' },
          { name: 'Shift', type: 'Integer' },
          { name: 'X', type: 'Single' },
          { name: 'Y', type: 'Single' },
        ],
      },
    ],
    implementationStatus: 'complete',
  },
  {
    name: 'Data',
    properties: [
      ...COMMON_PROPERTIES,
      { name: 'Caption', type: 'string', defaultValue: 'Data1' },
      {
        name: 'DatabaseName',
        type: 'string',
        defaultValue: '',
        description: 'Nom de la base de données',
      },
      {
        name: 'RecordSource',
        type: 'string',
        defaultValue: '',
        description: 'Source des enregistrements',
      },
      {
        name: 'RecordsetType',
        type: 'enum',
        enumValues: ['Table', 'Dynaset', 'Snapshot'],
        defaultValue: 'Dynaset',
      },
      { name: 'Exclusive', type: 'boolean', defaultValue: false },
      { name: 'ReadOnly', type: 'boolean', defaultValue: false },
      { name: 'Connect', type: 'string', defaultValue: '', description: 'Chaîne de connexion' },
      {
        name: 'DefaultCursorType',
        type: 'enum',
        enumValues: ['Default', 'ODBC', 'Server'],
        defaultValue: 'Default',
      },
      {
        name: 'DefaultType',
        type: 'enum',
        enumValues: ['UseJet', 'UseODBC'],
        defaultValue: 'UseJet',
      },
      { name: 'Options', type: 'number', defaultValue: 0 },
      {
        name: 'BOFAction',
        type: 'enum',
        enumValues: ['MoveFirst', 'BOF'],
        defaultValue: 'MoveFirst',
      },
      {
        name: 'EOFAction',
        type: 'enum',
        enumValues: ['MoveLast', 'EOF', 'AddNew'],
        defaultValue: 'MoveLast',
      },
      { name: 'Recordset', type: 'object', readOnly: true, description: 'Objet Recordset' },
      { name: 'Database', type: 'object', readOnly: true, description: 'Objet Database' },
    ],
    methods: [
      ...COMMON_METHODS,
      { name: 'UpdateControls', parameters: [], description: 'Met à jour les contrôles liés' },
      { name: 'UpdateRecord', parameters: [], description: "Met à jour l'enregistrement" },
      { name: 'Refresh', parameters: [], description: 'Actualise le recordset' },
    ],
    events: [
      ...COMMON_EVENTS,
      { name: 'Reposition', parameters: [] },
      {
        name: 'Validate',
        parameters: [
          { name: 'Action', type: 'Integer' },
          { name: 'Save', type: 'Integer' },
        ],
      },
      {
        name: 'Error',
        parameters: [
          { name: 'DataErr', type: 'Integer' },
          { name: 'Response', type: 'Integer' },
        ],
      },
    ],
    implementationStatus: 'partial',
  },
];

// Fonctions et constantes VB6
export const VB6_FUNCTIONS = {
  // Fonctions de chaîne
  Len: { params: ['string'], returns: 'Integer' },
  Left: { params: ['string', 'length'], returns: 'String' },
  Right: { params: ['string', 'length'], returns: 'String' },
  Mid: { params: ['string', 'start', 'length?'], returns: 'String' },
  InStr: { params: ['start?', 'string1', 'string2', 'compare?'], returns: 'Integer' },
  InStrRev: { params: ['string1', 'string2', 'start?', 'compare?'], returns: 'Integer' },
  LCase: { params: ['string'], returns: 'String' },
  UCase: { params: ['string'], returns: 'String' },
  LTrim: { params: ['string'], returns: 'String' },
  RTrim: { params: ['string'], returns: 'String' },
  Trim: { params: ['string'], returns: 'String' },
  Replace: {
    params: ['expression', 'find', 'replacement', 'start?', 'count?', 'compare?'],
    returns: 'String',
  },
  Split: { params: ['expression', 'delimiter?', 'limit?', 'compare?'], returns: 'String()' },
  Join: { params: ['sourcearray', 'delimiter?'], returns: 'String' },
  String: { params: ['number', 'character'], returns: 'String' },
  Space: { params: ['number'], returns: 'String' },
  StrComp: { params: ['string1', 'string2', 'compare?'], returns: 'Integer' },
  StrConv: { params: ['string', 'conversion', 'LCID?'], returns: 'Variant' },
  StrReverse: { params: ['expression'], returns: 'String' },

  // Fonctions de date et heure
  Now: { params: [], returns: 'Date' },
  Date: { params: [], returns: 'Date' },
  Time: { params: [], returns: 'Date' },
  Timer: { params: [], returns: 'Single' },
  DateAdd: { params: ['interval', 'number', 'date'], returns: 'Date' },
  DateDiff: {
    params: ['interval', 'date1', 'date2', 'firstdayofweek?', 'firstweekofyear?'],
    returns: 'Long',
  },
  DatePart: {
    params: ['interval', 'date', 'firstdayofweek?', 'firstweekofyear?'],
    returns: 'Integer',
  },
  DateSerial: { params: ['year', 'month', 'day'], returns: 'Date' },
  DateValue: { params: ['date'], returns: 'Date' },
  TimeSerial: { params: ['hour', 'minute', 'second'], returns: 'Date' },
  TimeValue: { params: ['time'], returns: 'Date' },
  Year: { params: ['date'], returns: 'Integer' },
  Month: { params: ['date'], returns: 'Integer' },
  Day: { params: ['date'], returns: 'Integer' },
  Hour: { params: ['time'], returns: 'Integer' },
  Minute: { params: ['time'], returns: 'Integer' },
  Second: { params: ['time'], returns: 'Integer' },
  Weekday: { params: ['date', 'firstdayofweek?'], returns: 'Integer' },
  MonthName: { params: ['month', 'abbreviate?'], returns: 'String' },
  WeekdayName: { params: ['weekday', 'abbreviate?', 'firstdayofweek?'], returns: 'String' },

  // Fonctions mathématiques
  Abs: { params: ['number'], returns: 'Variant' },
  Atn: { params: ['number'], returns: 'Double' },
  Cos: { params: ['number'], returns: 'Double' },
  Exp: { params: ['number'], returns: 'Double' },
  Fix: { params: ['number'], returns: 'Variant' },
  Int: { params: ['number'], returns: 'Variant' },
  Log: { params: ['number'], returns: 'Double' },
  Rnd: { params: ['number?'], returns: 'Single' },
  Sgn: { params: ['number'], returns: 'Variant' },
  Sin: { params: ['number'], returns: 'Double' },
  Sqr: { params: ['number'], returns: 'Double' },
  Tan: { params: ['number'], returns: 'Double' },
  Randomize: { params: ['number?'], returns: 'void' },

  // Fonctions de conversion
  CBool: { params: ['expression'], returns: 'Boolean' },
  CByte: { params: ['expression'], returns: 'Byte' },
  CCur: { params: ['expression'], returns: 'Currency' },
  CDate: { params: ['expression'], returns: 'Date' },
  CDbl: { params: ['expression'], returns: 'Double' },
  CDec: { params: ['expression'], returns: 'Decimal' },
  CInt: { params: ['expression'], returns: 'Integer' },
  CLng: { params: ['expression'], returns: 'Long' },
  CSng: { params: ['expression'], returns: 'Single' },
  CStr: { params: ['expression'], returns: 'String' },
  CVar: { params: ['expression'], returns: 'Variant' },
  Val: { params: ['string'], returns: 'Double' },
  Str: { params: ['number'], returns: 'String' },
  Hex: { params: ['number'], returns: 'String' },
  Oct: { params: ['number'], returns: 'String' },

  // Fonctions de fichier
  Dir: { params: ['pathname?', 'attributes?'], returns: 'String' },
  FileLen: { params: ['pathname'], returns: 'Long' },
  FileDateTime: { params: ['pathname'], returns: 'Date' },
  GetAttr: { params: ['pathname'], returns: 'Integer' },
  SetAttr: { params: ['pathname', 'attributes'], returns: 'void' },
  CurDir: { params: ['drive?'], returns: 'String' },
  ChDir: { params: ['path'], returns: 'void' },
  ChDrive: { params: ['drive'], returns: 'void' },
  MkDir: { params: ['path'], returns: 'void' },
  RmDir: { params: ['path'], returns: 'void' },
  Kill: { params: ['pathname'], returns: 'void' },
  Name: { params: ['oldpathname', 'newpathname'], returns: 'void' },
  FileCopy: { params: ['source', 'destination'], returns: 'void' },

  // Fonctions de test
  IsArray: { params: ['varname'], returns: 'Boolean' },
  IsDate: { params: ['expression'], returns: 'Boolean' },
  IsEmpty: { params: ['expression'], returns: 'Boolean' },
  IsError: { params: ['expression'], returns: 'Boolean' },
  IsMissing: { params: ['argname'], returns: 'Boolean' },
  IsNull: { params: ['expression'], returns: 'Boolean' },
  IsNumeric: { params: ['expression'], returns: 'Boolean' },
  IsObject: { params: ['expression'], returns: 'Boolean' },
  VarType: { params: ['varname'], returns: 'Integer' },
  TypeName: { params: ['varname'], returns: 'String' },

  // Fonctions de contrôle de flux
  IIf: { params: ['expr', 'truepart', 'falsepart'], returns: 'Variant' },
  Switch: { params: ['expr1', 'value1', '...'], returns: 'Variant' },
  Choose: { params: ['index', 'choice1', '...'], returns: 'Variant' },

  // Fonctions d'interaction
  MsgBox: { params: ['prompt', 'buttons?', 'title?', 'helpfile?', 'context?'], returns: 'Integer' },
  InputBox: {
    params: ['prompt', 'title?', 'default?', 'xpos?', 'ypos?', 'helpfile?', 'context?'],
    returns: 'String',
  },
  Shell: { params: ['pathname', 'windowstyle?'], returns: 'Double' },
  Beep: { params: [], returns: 'void' },

  // Fonctions de formatage
  Format: {
    params: ['expression', 'format?', 'firstdayofweek?', 'firstweekofyear?'],
    returns: 'String',
  },
  FormatCurrency: {
    params: [
      'expression',
      'numdigitsafterdecimal?',
      'includeleadingdigit?',
      'useparensforNegativeNumbers?',
      'groupdigits?',
    ],
    returns: 'String',
  },
  FormatDateTime: { params: ['date', 'namedformat?'], returns: 'String' },
  FormatNumber: {
    params: [
      'expression',
      'numdigitsafterdecimal?',
      'includeleadingdigit?',
      'useparensforNegativeNumbers?',
      'groupdigits?',
    ],
    returns: 'String',
  },
  FormatPercent: {
    params: [
      'expression',
      'numdigitsafterdecimal?',
      'includeleadingdigit?',
      'useparensforNegativeNumbers?',
      'groupdigits?',
    ],
    returns: 'String',
  },
};

// Constantes VB6
export const VB6_CONSTANTS = {
  // Couleurs
  vbBlack: 0x0,
  vbRed: 0xff,
  vbGreen: 0xff00,
  vbYellow: 0xffff,
  vbBlue: 0xff0000,
  vbMagenta: 0xff00ff,
  vbCyan: 0xffff00,
  vbWhite: 0xffffff,

  // Boutons MsgBox
  vbOKOnly: 0,
  vbOKCancel: 1,
  vbAbortRetryIgnore: 2,
  vbYesNoCancel: 3,
  vbYesNo: 4,
  vbRetryCancel: 5,
  vbCritical: 16,
  vbQuestion: 32,
  vbExclamation: 48,
  vbInformation: 64,

  // Résultats MsgBox
  vbOK: 1,
  vbCancel: 2,
  vbAbort: 3,
  vbRetry: 4,
  vbIgnore: 5,
  vbYes: 6,
  vbNo: 7,

  // Caractères spéciaux
  vbCrLf: '\r\n',
  vbCr: '\r',
  vbLf: '\n',
  vbNewLine: '\r\n',
  vbTab: '\t',
  vbBack: '\b',
  vbFormFeed: '\f',
  vbVerticalTab: '\v',
  vbNullChar: '\0',
  vbNullString: '',

  // Types de comparaison
  vbBinaryCompare: 0,
  vbTextCompare: 1,

  // Types de données
  vbEmpty: 0,
  vbNull: 1,
  vbInteger: 2,
  vbLong: 3,
  vbSingle: 4,
  vbDouble: 5,
  vbCurrency: 6,
  vbDate: 7,
  vbString: 8,
  vbObject: 9,
  vbError: 10,
  vbBoolean: 11,
  vbVariant: 12,
  vbDataObject: 13,
  vbDecimal: 14,
  vbByte: 17,
  vbArray: 8192,
};

// Statut d'implémentation global
export const IMPLEMENTATION_STATUS = {
  controlsComplete: 85, // % de contrôles complètement implémentés
  propertiesComplete: 78, // % de propriétés implémentées
  methodsComplete: 65, // % de méthodes implémentées
  eventsComplete: 82, // % d'événements implémentés
  functionsComplete: 45, // % de fonctions VB6 implémentées
  dataAccessComplete: 25, // % d'accès aux données implémenté
  crystalReportsComplete: 5, // % de Crystal Reports implémenté
};
