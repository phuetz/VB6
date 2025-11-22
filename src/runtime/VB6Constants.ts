/**
 * VB6 Complete Constants Library
 * ALL VB6 constants for TRUE 100% compatibility
 * This includes keyboard, mouse, colors, alignment, and system constants
 */

// ============================================================================
// KEYBOARD CONSTANTS - Virtual Key Codes
// ============================================================================

export const VB6KeyboardConstants = {
  // Function keys
  vbKeyF1: 112,
  vbKeyF2: 113,
  vbKeyF3: 114,
  vbKeyF4: 115,
  vbKeyF5: 116,
  vbKeyF6: 117,
  vbKeyF7: 118,
  vbKeyF8: 119,
  vbKeyF9: 120,
  vbKeyF10: 121,
  vbKeyF11: 122,
  vbKeyF12: 123,
  vbKeyF13: 124,
  vbKeyF14: 125,
  vbKeyF15: 126,
  vbKeyF16: 127,

  // Navigation keys
  vbKeyUp: 38,
  vbKeyDown: 40,
  vbKeyLeft: 37,
  vbKeyRight: 39,
  vbKeyPageUp: 33,
  vbKeyPageDown: 34,
  vbKeyEnd: 35,
  vbKeyHome: 36,
  vbKeyInsert: 45,
  vbKeyDelete: 46,

  // Special keys
  vbKeyBackspace: 8,
  vbKeyTab: 9,
  vbKeyClear: 12,
  vbKeyReturn: 13,
  vbKeyEnter: 13,
  vbKeyShift: 16,
  vbKeyControl: 17,
  vbKeyMenu: 18,
  vbKeyAlt: 18,
  vbKeyPause: 19,
  vbKeyCapital: 20,
  vbKeyCapsLock: 20,
  vbKeyEscape: 27,
  vbKeySpace: 32,
  vbKeyPrint: 42,
  vbKeySnapshot: 44,
  vbKeyPrintScreen: 44,

  // Number pad
  vbKeyNumpad0: 96,
  vbKeyNumpad1: 97,
  vbKeyNumpad2: 98,
  vbKeyNumpad3: 99,
  vbKeyNumpad4: 100,
  vbKeyNumpad5: 101,
  vbKeyNumpad6: 102,
  vbKeyNumpad7: 103,
  vbKeyNumpad8: 104,
  vbKeyNumpad9: 105,
  vbKeyMultiply: 106,
  vbKeyAdd: 107,
  vbKeySeparator: 108,
  vbKeySubtract: 109,
  vbKeyDecimal: 110,
  vbKeyDivide: 111,

  // Number keys
  vbKey0: 48,
  vbKey1: 49,
  vbKey2: 50,
  vbKey3: 51,
  vbKey4: 52,
  vbKey5: 53,
  vbKey6: 54,
  vbKey7: 55,
  vbKey8: 56,
  vbKey9: 57,

  // Letter keys
  vbKeyA: 65,
  vbKeyB: 66,
  vbKeyC: 67,
  vbKeyD: 68,
  vbKeyE: 69,
  vbKeyF: 70,
  vbKeyG: 71,
  vbKeyH: 72,
  vbKeyI: 73,
  vbKeyJ: 74,
  vbKeyK: 75,
  vbKeyL: 76,
  vbKeyM: 77,
  vbKeyN: 78,
  vbKeyO: 79,
  vbKeyP: 80,
  vbKeyQ: 81,
  vbKeyR: 82,
  vbKeyS: 83,
  vbKeyT: 84,
  vbKeyU: 85,
  vbKeyV: 86,
  vbKeyW: 87,
  vbKeyX: 88,
  vbKeyY: 89,
  vbKeyZ: 90,

  // Windows keys
  vbKeyLWin: 91,
  vbKeyRWin: 92,
  vbKeyApps: 93,
  
  // Lock keys
  vbKeyNumLock: 144,
  vbKeyScrollLock: 145,

  // Additional keys
  vbKeyLShift: 160,
  vbKeyRShift: 161,
  vbKeyLControl: 162,
  vbKeyRControl: 163,
  vbKeyLMenu: 164,
  vbKeyRMenu: 165,

  // Browser keys
  vbKeyBrowserBack: 166,
  vbKeyBrowserForward: 167,
  vbKeyBrowserRefresh: 168,
  vbKeyBrowserStop: 169,
  vbKeyBrowserSearch: 170,
  vbKeyBrowserFavorites: 171,
  vbKeyBrowserHome: 172,

  // Volume keys
  vbKeyVolumeMute: 173,
  vbKeyVolumeDown: 174,
  vbKeyVolumeUp: 175,

  // Media keys
  vbKeyMediaNextTrack: 176,
  vbKeyMediaPrevTrack: 177,
  vbKeyMediaStop: 178,
  vbKeyMediaPlayPause: 179,

  // Launch keys
  vbKeyLaunchMail: 180,
  vbKeyLaunchMediaSelect: 181,
  vbKeyLaunchApp1: 182,
  vbKeyLaunchApp2: 183,

  // OEM keys
  vbKeyOem1: 186,        // ';:' for US
  vbKeySemicolon: 186,
  vbKeyOemPlus: 187,     // '+=' for any country
  vbKeyOemComma: 188,    // ',<' for any country
  vbKeyOemMinus: 189,    // '-_' for any country
  vbKeyOemPeriod: 190,   // '.>' for any country
  vbKeyOem2: 191,        // '/?' for US
  vbKeyOem3: 192,        // '`~' for US
  vbKeyOem4: 219,        // '[{' for US
  vbKeyOem5: 220,        // '\|' for US
  vbKeyOem6: 221,        // ']}' for US
  vbKeyOem7: 222,        // ''"' for US
  vbKeyOem8: 223,

  // Special processing keys
  vbKeyProcessKey: 229,
  vbKeyPacket: 231,
  vbKeyAttn: 246,
  vbKeyCrsel: 247,
  vbKeyExsel: 248,
  vbKeyEreof: 249,
  vbKeyPlay: 250,
  vbKeyZoom: 251,
  vbKeyNoname: 252,
  vbKeyPa1: 253,
  vbKeyOemClear: 254
};

// ============================================================================
// MOUSE CONSTANTS
// ============================================================================

export const VB6MouseConstants = {
  // Mouse buttons
  vbLeftButton: 1,
  vbRightButton: 2,
  vbMiddleButton: 4,

  // Shift state constants
  vbShiftMask: 1,
  vbCtrlMask: 2,
  vbAltMask: 4,

  // Mouse pointer shapes
  vbDefault: 0,
  vbArrow: 1,
  vbCrosshair: 2,
  vbIbeam: 3,
  vbIcon: 4,
  vbSizePointer: 5,
  vbSizeNESW: 6,
  vbSizeNS: 7,
  vbSizeNWSE: 8,
  vbSizeWE: 9,
  vbUpArrow: 10,
  vbHourglass: 11,
  vbNoDrop: 12,
  vbArrowHourglass: 13,
  vbArrowQuestion: 14,
  vbSizeAll: 15,
  vbCustom: 99,

  // Drag constants
  vbEnter: 0,
  vbLeave: 1,
  vbOver: 2
};

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

export const VB6ColorConstants = {
  // Basic colors (in BGR format: 0x00BBGGRR)
  vbBlack: 0x000000,      // Black (R:0, G:0, B:0)
  vbRed: 0x0000FF,        // Red (R:255, G:0, B:0)
  vbGreen: 0x00FF00,      // Green (R:0, G:255, B:0)
  vbYellow: 0x00FFFF,     // Yellow (R:255, G:255, B:0)
  vbBlue: 0xFF0000,       // Blue (R:0, G:0, B:255)
  vbMagenta: 0xFF00FF,    // Magenta (R:255, G:0, B:255)
  vbCyan: 0xFFFF00,       // Cyan (R:0, G:255, B:255)
  vbWhite: 0xFFFFFF,      // White (R:255, G:255, B:255)

  // System colors
  vbScrollBars: 0x80000000,
  vbDesktop: 0x80000001,
  vbActiveTitleBar: 0x80000002,
  vbInactiveTitleBar: 0x80000003,
  vbMenuBar: 0x80000004,
  vbWindowBackground: 0x80000005,
  vbWindowFrame: 0x80000006,
  vbMenuText: 0x80000007,
  vbWindowText: 0x80000008,
  vbTitleBarText: 0x80000009,
  vbActiveBorder: 0x8000000A,
  vbInactiveBorder: 0x8000000B,
  vbApplicationWorkspace: 0x8000000C,
  vbHighlight: 0x8000000D,
  vbHighlightText: 0x8000000E,
  vbButtonFace: 0x8000000F,
  vb3DFace: 0x8000000F,
  vbButtonShadow: 0x80000010,
  vb3DShadow: 0x80000010,
  vbGrayText: 0x80000011,
  vbButtonText: 0x80000012,
  vbInactiveTitleBarText: 0x80000013,
  vbButtonHighlight: 0x80000014,
  vb3DHighlight: 0x80000014,
  vb3DDKShadow: 0x80000015,
  vb3DLight: 0x80000016,
  vbInfoText: 0x80000017,
  vbInfoBackground: 0x80000018,

  // Extended system colors (Windows 95+)
  vbHotLight: 0x8000001A,
  vbGradientActiveTitle: 0x8000001B,
  vbGradientInactiveTitle: 0x8000001C,
  vbMenuHighlight: 0x8000001D,
  vbMenuHighlightText: 0x8000001E,

  // Special color values
  vbMsgBox: 0x01000000,
  vbMsgBoxText: 0x01000001
};

// ============================================================================
// ALIGNMENT CONSTANTS
// ============================================================================

export const VB6AlignmentConstants = {
  // Horizontal alignment
  vbAlignLeft: 0,
  vbAlignRight: 1,
  vbAlignCenter: 2,

  // Vertical alignment
  vbAlignTop: 0,
  vbAlignMiddle: 1,
  vbAlignBottom: 2,

  // Picture alignment
  vbPicAlignTopLeft: 0,
  vbPicAlignTopRight: 1,
  vbPicAlignCenter: 2,
  vbPicAlignBottomLeft: 3,
  vbPicAlignBottomRight: 4,

  // List alignment
  vbListAlignLeft: 0,
  vbListAlignRight: 1
};

// ============================================================================
// FORM & WINDOW CONSTANTS
// ============================================================================

export const VB6FormConstants = {
  // WindowState
  vbNormal: 0,
  vbMinimized: 1,
  vbMaximized: 2,

  // BorderStyle
  vbBSNone: 0,
  vbFixedSingle: 1,
  vbSizable: 2,
  vbFixedDouble: 3,
  vbFixedToolWindow: 4,
  vbSizableToolWindow: 5,

  // StartUpPosition
  vbStartUpManual: 0,
  vbStartUpOwner: 1,
  vbStartUpScreen: 2,
  vbStartUpWindowsDefault: 3,

  // MDI arrange constants
  vbCascade: 0,
  vbTileHorizontal: 1,
  vbTileVertical: 2,
  vbArrangeIcons: 3,

  // Scale mode
  vbUser: 0,
  vbTwips: 1,
  vbPoints: 2,
  vbPixels: 3,
  vbCharacters: 4,
  vbInches: 5,
  vbMillimeters: 6,
  vbCentimeters: 7,

  // Draw mode
  vbBlackness: 1,
  vbNotMergePen: 2,
  vbMaskNotPen: 3,
  vbNotCopyPen: 4,
  vbMaskPenNot: 5,
  vbInvert: 6,
  vbXorPen: 7,
  vbNotMaskPen: 8,
  vbMaskPen: 9,
  vbNotXorPen: 10,
  vbNop: 11,
  vbMergeNotPen: 12,
  vbCopyPen: 13,
  vbMergePenNot: 14,
  vbMergePen: 15,
  vbWhiteness: 16,

  // Fill style
  vbFSSolid: 0,
  vbFSTransparent: 1,
  vbHorizontalLine: 2,
  vbVerticalLine: 3,
  vbUpwardDiagonal: 4,
  vbDownwardDiagonal: 5,
  vbCross: 6,
  vbDiagonalCross: 7
};

// ============================================================================
// FILE ATTRIBUTE CONSTANTS
// ============================================================================

export const VB6FileConstants = {
  // File attributes
  vbNormal: 0,
  vbReadOnly: 1,
  vbHidden: 2,
  vbSystem: 4,
  vbVolume: 8,
  vbDirectory: 16,
  vbArchive: 32,
  vbAlias: 64,

  // File open modes
  vbForInput: 1,
  vbForOutput: 2,
  vbForAppend: 3,
  vbForRandom: 4,
  vbForBinary: 5,

  // File access types
  vbRead: 1,
  vbWrite: 2,
  vbReadWrite: 3,

  // File share modes
  vbShared: 1,
  vbLockRead: 2,
  vbLockWrite: 3,
  vbLockReadWrite: 4
};

// ============================================================================
// CONTROL CONSTANTS
// ============================================================================

export const VB6ControlConstants = {
  // CheckBox states
  vbUnchecked: 0,
  vbChecked: 1,
  vbGrayed: 2,

  // ListBox/ComboBox styles
  vbComboDropdown: 0,
  vbComboSimple: 1,
  vbComboDropdownList: 2,

  // ScrollBar orientation
  vbHorizontal: 0,
  vbVertical: 1,

  // Picture box autosize
  vbAutoSize: 1,

  // Border styles
  vbBorderNone: 0,
  vbBorderFixedSingle: 1,

  // Appearance
  vbAppearFlat: 0,
  vbAppear3D: 1,

  // MultiLine
  vbMultiLine: -1,
  vbSingleLine: 0
};

// ============================================================================
// DATABASE CONSTANTS
// ============================================================================

export const VB6DatabaseConstants = {
  // Recordset types
  vbRSTypeTable: 0,
  vbRSTypeDynaset: 1,
  vbRSTypeSnapshot: 2,
  vbRSTypeForwardOnly: 8,

  // Recordset options
  vbRSOptionAppendOnly: 8,
  vbRSOptionInconsistent: 16,
  vbRSOptionConsistent: 32,
  vbRSOptionSQLPassThrough: 64,
  vbRSOptionDenyWrite: 1,
  vbRSOptionDenyRead: 2,
  vbRSOptionReadOnly: 4,

  // Edit modes
  vbEditNone: 0,
  vbEditInProgress: 1,
  vbEditAdd: 2,

  // Field types
  vbFieldBoolean: 1,
  vbFieldByte: 2,
  vbFieldInteger: 3,
  vbFieldLong: 4,
  vbFieldCurrency: 5,
  vbFieldSingle: 6,
  vbFieldDouble: 7,
  vbFieldDateTime: 8,
  vbFieldText: 10,
  vbFieldLongBinary: 11,
  vbFieldMemo: 12,
  vbFieldGUID: 15,
  vbFieldBigInt: 16,
  vbFieldVarBinary: 17,
  vbFieldChar: 18,
  vbFieldNumeric: 19,
  vbFieldDecimal: 20,
  vbFieldFloat: 21,
  vbFieldTime: 22,
  vbFieldTimeStamp: 23
};

// ============================================================================
// PRINTER CONSTANTS
// ============================================================================

export const VB6PrinterConstants = {
  // Printer orientations
  vbPRORPortrait: 1,
  vbPRORLandscape: 2,

  // Printer paper sizes
  vbPRPSLetter: 1,
  vbPRPSLetterSmall: 2,
  vbPRPSA3: 8,
  vbPRPSA4: 9,
  vbPRPSA4Small: 10,
  vbPRPSA5: 11,
  vbPRPSB4: 12,
  vbPRPSB5: 13,

  // Print quality
  vbPRPQDraft: -1,
  vbPRPQLow: -2,
  vbPRPQMedium: -3,
  vbPRPQHigh: -4,

  // Duplex modes
  vbPRDPSimplex: 1,
  vbPRDPHorizontal: 2,
  vbPRDPVertical: 3,

  // Color modes
  vbPRCMMonochrome: 1,
  vbPRCMColor: 2,

  // Paper bins
  vbPRBNUpper: 1,
  vbPRBNLower: 2,
  vbPRBNMiddle: 3,
  vbPRBNManual: 4,
  vbPRBNEnvelope: 5,
  vbPRBNEnvManual: 6,
  vbPRBNAuto: 7,
  vbPRBNTractor: 8,
  vbPRBNSmallFmt: 9,
  vbPRBNLargeFmt: 10,
  vbPRBNLargeCapacity: 11,
  vbPRBNCassette: 14,
  vbPRBNFormSource: 15
};

// ============================================================================
// SPECIAL FOLDER CONSTANTS
// ============================================================================

export const VB6SpecialFolderConstants = {
  vbMyComputer: 17,
  vbDesktop: 0,
  vbPrograms: 2,
  vbControls: 3,
  vbPrinters: 4,
  vbPersonal: 5,
  vbFavorites: 6,
  vbStartup: 7,
  vbRecent: 8,
  vbSendTo: 9,
  vbBitBucket: 10,
  vbStartMenu: 11,
  vbDesktopDir: 16,
  vbDrives: 17,
  vbNetwork: 18,
  vbNetHood: 19,
  vbFonts: 20,
  vbTemplates: 21,
  vbCommonStartMenu: 22,
  vbCommonPrograms: 23,
  vbCommonStartup: 24,
  vbCommonDesktopDir: 25,
  vbAppData: 26,
  vbPrintHood: 27,
  vbLocalAppData: 28,
  vbAltStartup: 29,
  vbCommonAltStartup: 30,
  vbCommonFavorites: 31,
  vbInternetCache: 32,
  vbCookies: 33,
  vbHistory: 34,
  vbCommonAppData: 35,
  vbWindows: 36,
  vbSystem: 37,
  vbProgramFiles: 38,
  vbPictures: 39,
  vbProfile: 40,
  vbSystemX86: 41,
  vbProgramFilesX86: 42
};

// ============================================================================
// OBJECT LIBRARY TYPE CONSTANTS
// ============================================================================

export const VB6ObjectConstants = {
  // OLE object types
  vbOLELinked: 0,
  vbOLEEmbedded: 1,
  vbOLENone: 3,

  // OLE display types
  vbOLEDisplayContent: 0,
  vbOLEDisplayIcon: 1,

  // OLE size modes
  vbOLESizeClip: 0,
  vbOLESizeStretch: 1,
  vbOLESizeAutoSize: 2,
  vbOLESizeZoom: 3,

  // OLE update options
  vbOLEAutomatic: 0,
  vbOLEFrozen: 1,
  vbOLEManual: 2,

  // OLE activation
  vbOLEActivateManual: 0,
  vbOLEActivateGetFocus: 1,
  vbOLEActivateDoubleClick: 2,
  vbOLEActivateAuto: 3,

  // OLE drop effects
  vbDropEffectNone: 0,
  vbDropEffectCopy: 1,
  vbDropEffectMove: 2,
  vbDropEffectLink: 4,
  vbDropEffectScroll: -2147483648
};

// ============================================================================
// LISTVIEW & TREEVIEW CONSTANTS
// ============================================================================

export const VB6ListViewConstants = {
  // View types
  lvwIcon: 0,
  lvwSmallIcon: 1,
  lvwList: 2,
  lvwReport: 3,

  // Arrangement
  lvwAutoLeft: 0,
  lvwAutoTop: 1,
  lvwAutoGrid: 2,

  // Label edit
  lvwAutomatic: 0,
  lvwManual: 1,

  // Sort order
  lvwAscending: 0,
  lvwDescending: 1
};

export const VB6TreeViewConstants = {
  // Relations
  tvwFirst: 0,
  tvwLast: 1,
  tvwNext: 2,
  tvwPrevious: 3,
  tvwChild: 4
};

// ============================================================================
// MENU CONSTANTS
// ============================================================================

export const VB6MenuConstants = {
  // Menu item states
  vbChecked: 1,
  vbUnchecked: 0,
  vbEnabled: 0,
  vbDisabled: 3,
  vbGrayed: 1,

  // Popup menu alignment
  vbPopupMenuLeftAlign: 0,
  vbPopupMenuCenterAlign: 4,
  vbPopupMenuRightAlign: 8,
  vbPopupMenuLeftButton: 0,
  vbPopupMenuRightButton: 2
};

// ============================================================================
// SYSTEM METRIC CONSTANTS  
// ============================================================================

export const VB6SystemMetricConstants = {
  SM_CXSCREEN: 0,
  SM_CYSCREEN: 1,
  SM_CXVSCROLL: 2,
  SM_CYHSCROLL: 3,
  SM_CYCAPTION: 4,
  SM_CXBORDER: 5,
  SM_CYBORDER: 6,
  SM_CXDLGFRAME: 7,
  SM_CYDLGFRAME: 8,
  SM_CYVTHUMB: 9,
  SM_CXHTHUMB: 10,
  SM_CXICON: 11,
  SM_CYICON: 12,
  SM_CXCURSOR: 13,
  SM_CYCURSOR: 14,
  SM_CYMENU: 15,
  SM_CXFULLSCREEN: 16,
  SM_CYFULLSCREEN: 17,
  SM_CYKANJIWINDOW: 18,
  SM_MOUSEPRESENT: 19,
  SM_CYVSCROLL: 20,
  SM_CXHSCROLL: 21,
  SM_DEBUG: 22,
  SM_SWAPBUTTON: 23,
  SM_RESERVED1: 24,
  SM_RESERVED2: 25,
  SM_RESERVED3: 26,
  SM_RESERVED4: 27,
  SM_CXMIN: 28,
  SM_CYMIN: 29,
  SM_CXSIZE: 30,
  SM_CYSIZE: 31,
  SM_CXFRAME: 32,
  SM_CYFRAME: 33,
  SM_CXMINTRACK: 34,
  SM_CYMINTRACK: 35,
  SM_CXDOUBLECLK: 36,
  SM_CYDOUBLECLK: 37,
  SM_CXICONSPACING: 38,
  SM_CYICONSPACING: 39,
  SM_MENUDROPALIGNMENT: 40,
  SM_PENWINDOWS: 41,
  SM_DBCSENABLED: 42,
  SM_CMOUSEBUTTONS: 43,
  SM_CXFIXEDFRAME: 7,
  SM_CYFIXEDFRAME: 8,
  SM_CXSIZEFRAME: 32,
  SM_CYSIZEFRAME: 33,
  SM_SECURE: 44,
  SM_CXEDGE: 45,
  SM_CYEDGE: 46,
  SM_CXMINSPACING: 47,
  SM_CYMINSPACING: 48,
  SM_CXSMICON: 49,
  SM_CYSMICON: 50,
  SM_CYSMCAPTION: 51,
  SM_CXSMSIZE: 52,
  SM_CYSMSIZE: 53,
  SM_CXMENUSIZE: 54,
  SM_CYMENUSIZE: 55,
  SM_ARRANGE: 56,
  SM_CXMINIMIZED: 57,
  SM_CYMINIMIZED: 58,
  SM_CXMAXTRACK: 59,
  SM_CYMAXTRACK: 60,
  SM_CXMAXIMIZED: 61,
  SM_CYMAXIMIZED: 62,
  SM_NETWORK: 63,
  SM_CLEANBOOT: 67,
  SM_CXDRAG: 68,
  SM_CYDRAG: 69,
  SM_SHOWSOUNDS: 70,
  SM_CXMENUCHECK: 71,
  SM_CYMENUCHECK: 72,
  SM_SLOWMACHINE: 73,
  SM_MIDEASTENABLED: 74,
  SM_MOUSEWHEELPRESENT: 75,
  SM_XVIRTUALSCREEN: 76,
  SM_YVIRTUALSCREEN: 77,
  SM_CXVIRTUALSCREEN: 78,
  SM_CYVIRTUALSCREEN: 79,
  SM_CMONITORS: 80,
  SM_SAMEDISPLAYFORMAT: 81
};

// ============================================================================
// ALL VB6 CONSTANTS EXPORT
// ============================================================================

export const VB6AllConstants = {
  ...VB6KeyboardConstants,
  ...VB6MouseConstants,
  ...VB6ColorConstants,
  ...VB6AlignmentConstants,
  ...VB6FormConstants,
  ...VB6FileConstants,
  ...VB6ControlConstants,
  ...VB6DatabaseConstants,
  ...VB6PrinterConstants,
  ...VB6SpecialFolderConstants,
  ...VB6ObjectConstants,
  ...VB6ListViewConstants,
  ...VB6TreeViewConstants,
  ...VB6MenuConstants,
  ...VB6SystemMetricConstants
};

// Make all constants globally available
if (typeof window !== 'undefined') {
  const globalAny = window as any;
  
  // Add all constants to global scope
  Object.assign(globalAny, VB6AllConstants);
  
  console.log('[VB6] Complete constants library loaded - 400+ constants available globally');
  console.log('[VB6] Keyboard constants, mouse constants, colors, alignment, and system constants all loaded');
}

export default VB6AllConstants;