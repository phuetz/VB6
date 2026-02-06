/**
 * VB6 Extended Constants
 * Complete collection of all VB6 constants for 100% compatibility
 */

// ============================================================================
// VarType Constants
// ============================================================================

export const vbEmpty = 0;
export const vbNull = 1;
export const vbInteger = 2;
export const vbLong = 3;
export const vbSingle = 4;
export const vbDouble = 5;
export const vbCurrency = 6;
export const vbDate = 7;
export const vbString = 8;
export const vbObject = 9;
export const vbError = 10;
export const vbBoolean = 11;
export const vbVariant = 12;
export const vbDataObject = 13;
export const vbDecimal = 14;
export const vbByte = 17;
export const vbUserDefinedType = 36;
export const vbArray = 8192;

// ============================================================================
// Comparison Constants
// ============================================================================

export const vbBinaryCompare = 0;
export const vbTextCompare = 1;
export const vbDatabaseCompare = 2;

// ============================================================================
// Date/Time Constants
// ============================================================================

export const vbUseSystemDayOfWeek = 0;
export const vbSunday = 1;
export const vbMonday = 2;
export const vbTuesday = 3;
export const vbWednesday = 4;
export const vbThursday = 5;
export const vbFriday = 6;
export const vbSaturday = 7;

export const vbUseSystem = 0;
export const vbFirstJan1 = 1;
export const vbFirstFourDays = 2;
export const vbFirstFullWeek = 3;

// DatePart intervals
export const vbYear = 'yyyy';
export const vbQuarter = 'q';
export const vbMonth = 'm';
export const vbDayOfYear = 'y';
export const vbDay = 'd';
export const vbWeekday = 'w';
export const vbWeekOfYear = 'ww';
export const vbHour = 'h';
export const vbMinute = 'n';
export const vbSecond = 's';

// ============================================================================
// MsgBox Constants
// ============================================================================

// Button types
export const vbOKOnly = 0;
export const vbOKCancel = 1;
export const vbAbortRetryIgnore = 2;
export const vbYesNoCancel = 3;
export const vbYesNo = 4;
export const vbRetryCancel = 5;

// Icon types
export const vbCritical = 16;
export const vbQuestion = 32;
export const vbExclamation = 48;
export const vbInformation = 64;

// Default button
export const vbDefaultButton1 = 0;
export const vbDefaultButton2 = 256;
export const vbDefaultButton3 = 512;
export const vbDefaultButton4 = 768;

// Modality
export const vbApplicationModal = 0;
export const vbSystemModal = 4096;

// Additional options
export const vbMsgBoxHelpButton = 16384;
export const vbMsgBoxSetForeground = 65536;
export const vbMsgBoxRight = 524288;
export const vbMsgBoxRtlReading = 1048576;

// Return values
export const vbOK = 1;
export const vbCancel = 2;
export const vbAbort = 3;
export const vbRetry = 4;
export const vbIgnore = 5;
export const vbYes = 6;
export const vbNo = 7;

// ============================================================================
// String Constants
// ============================================================================

export const vbCr = '\r';
export const vbLf = '\n';
export const vbCrLf = '\r\n';
export const vbNewLine = '\r\n';
export const vbNullChar = '\0';
export const vbNullString = '';
export const vbTab = '\t';
export const vbBack = '\b';
export const vbFormFeed = '\f';
export const vbVerticalTab = '\v';

// ============================================================================
// Tristate Constants
// ============================================================================

export const vbUseDefault = -2;
export const vbTrue = -1;
export const vbFalse = 0;

// ============================================================================
// Color Constants
// ============================================================================

export const vbBlack = 0x000000;
export const vbRed = 0x0000ff; // VB6 uses BGR format
export const vbGreen = 0x00ff00;
export const vbYellow = 0x00ffff;
export const vbBlue = 0xff0000; // VB6 uses BGR format
export const vbMagenta = 0xff00ff;
export const vbCyan = 0xffff00;
export const vbWhite = 0xffffff;

// System Colors
export const vbScrollBars = 0x80000000;
export const vbDesktop = 0x80000001;
export const vbActiveTitleBar = 0x80000002;
export const vbInactiveTitleBar = 0x80000003;
export const vbMenuBar = 0x80000004;
export const vbWindowBackground = 0x80000005;
export const vbWindowFrame = 0x80000006;
export const vbMenuText = 0x80000007;
export const vbWindowText = 0x80000008;
export const vbTitleBarText = 0x80000009;
export const vbActiveBorder = 0x8000000a;
export const vbInactiveBorder = 0x8000000b;
export const vbApplicationWorkspace = 0x8000000c;
export const vbHighlight = 0x8000000d;
export const vbHighlightText = 0x8000000e;
export const vbButtonFace = 0x8000000f;
export const vb3DFace = 0x8000000f;
export const vbButtonShadow = 0x80000010;
export const vb3DShadow = 0x80000010;
export const vbGrayText = 0x80000011;
export const vbButtonText = 0x80000012;
export const vbInactiveCaptionText = 0x80000013;
export const vbButtonHighlight = 0x80000014;
export const vb3DHighlight = 0x80000014;
export const vb3DDKShadow = 0x80000015;
export const vb3DLight = 0x80000016;
export const vbInfoText = 0x80000017;
export const vbInfoBackground = 0x80000018;

// ============================================================================
// File Attributes
// ============================================================================

export const vbNormal = 0;
export const vbReadOnly = 1;
export const vbHidden = 2;
export const vbSystem = 4;
export const vbVolume = 8;
export const vbDirectory = 16;
export const vbArchive = 32;
export const vbAlias = 64;

// ============================================================================
// Key Code Constants
// ============================================================================

export const vbKeyLButton = 0x1;
export const vbKeyRButton = 0x2;
export const vbKeyCancel = 0x3;
export const vbKeyMButton = 0x4;
export const vbKeyBack = 0x8;
export const vbKeyTab = 0x9;
export const vbKeyClear = 0xc;
export const vbKeyReturn = 0xd;
export const vbKeyShift = 0x10;
export const vbKeyControl = 0x11;
export const vbKeyMenu = 0x12;
export const vbKeyPause = 0x13;
export const vbKeyCapital = 0x14;
export const vbKeyEscape = 0x1b;
export const vbKeySpace = 0x20;
export const vbKeyPageUp = 0x21;
export const vbKeyPageDown = 0x22;
export const vbKeyEnd = 0x23;
export const vbKeyHome = 0x24;
export const vbKeyLeft = 0x25;
export const vbKeyUp = 0x26;
export const vbKeyRight = 0x27;
export const vbKeyDown = 0x28;
export const vbKeySelect = 0x29;
export const vbKeyPrint = 0x2a;
export const vbKeyExecute = 0x2b;
export const vbKeySnapshot = 0x2c;
export const vbKeyInsert = 0x2d;
export const vbKeyDelete = 0x2e;
export const vbKeyHelp = 0x2f;

// Numbers
export const vbKey0 = 0x30;
export const vbKey1 = 0x31;
export const vbKey2 = 0x32;
export const vbKey3 = 0x33;
export const vbKey4 = 0x34;
export const vbKey5 = 0x35;
export const vbKey6 = 0x36;
export const vbKey7 = 0x37;
export const vbKey8 = 0x38;
export const vbKey9 = 0x39;

// Letters
export const vbKeyA = 0x41;
export const vbKeyB = 0x42;
export const vbKeyC = 0x43;
export const vbKeyD = 0x44;
export const vbKeyE = 0x45;
export const vbKeyF = 0x46;
export const vbKeyG = 0x47;
export const vbKeyH = 0x48;
export const vbKeyI = 0x49;
export const vbKeyJ = 0x4a;
export const vbKeyK = 0x4b;
export const vbKeyL = 0x4c;
export const vbKeyM = 0x4d;
export const vbKeyN = 0x4e;
export const vbKeyO = 0x4f;
export const vbKeyP = 0x50;
export const vbKeyQ = 0x51;
export const vbKeyR = 0x52;
export const vbKeyS = 0x53;
export const vbKeyT = 0x54;
export const vbKeyU = 0x55;
export const vbKeyV = 0x56;
export const vbKeyW = 0x57;
export const vbKeyX = 0x58;
export const vbKeyY = 0x59;
export const vbKeyZ = 0x5a;

// Numpad
export const vbKeyNumpad0 = 0x60;
export const vbKeyNumpad1 = 0x61;
export const vbKeyNumpad2 = 0x62;
export const vbKeyNumpad3 = 0x63;
export const vbKeyNumpad4 = 0x64;
export const vbKeyNumpad5 = 0x65;
export const vbKeyNumpad6 = 0x66;
export const vbKeyNumpad7 = 0x67;
export const vbKeyNumpad8 = 0x68;
export const vbKeyNumpad9 = 0x69;
export const vbKeyMultiply = 0x6a;
export const vbKeyAdd = 0x6b;
export const vbKeySeparator = 0x6c;
export const vbKeySubtract = 0x6d;
export const vbKeyDecimal = 0x6e;
export const vbKeyDivide = 0x6f;

// Function keys
export const vbKeyF1 = 0x70;
export const vbKeyF2 = 0x71;
export const vbKeyF3 = 0x72;
export const vbKeyF4 = 0x73;
export const vbKeyF5 = 0x74;
export const vbKeyF6 = 0x75;
export const vbKeyF7 = 0x76;
export const vbKeyF8 = 0x77;
export const vbKeyF9 = 0x78;
export const vbKeyF10 = 0x79;
export const vbKeyF11 = 0x7a;
export const vbKeyF12 = 0x7b;
export const vbKeyF13 = 0x7c;
export const vbKeyF14 = 0x7d;
export const vbKeyF15 = 0x7e;
export const vbKeyF16 = 0x7f;

export const vbKeyNumlock = 0x90;
export const vbKeyScrollLock = 0x91;

// ============================================================================
// Mouse Button Constants
// ============================================================================

export const vbLeftButton = 1;
export const vbRightButton = 2;
export const vbMiddleButton = 4;

// Shift/Alt/Ctrl mask
export const vbShiftMask = 1;
export const vbCtrlMask = 2;
export const vbAltMask = 4;

// ============================================================================
// Form Constants
// ============================================================================

export const vbModal = 1;
export const vbModeless = 0;

// Form BorderStyle
export const vbBSNone = 0;
export const vbFixedSingle = 1;
export const vbSizable = 2;
export const vbFixedDialog = 3;
export const vbFixedToolWindow = 4;
export const vbSizableToolWindow = 5;

// Form WindowState
export const vbNormalForm = 0;
export const vbMinimized = 1;
export const vbMaximized = 2;

// StartUpPosition
export const vbStartUpManual = 0;
export const vbStartUpOwner = 1;
export const vbStartUpScreen = 2;
export const vbStartUpWindowsDefault = 3;

// ============================================================================
// Control Constants
// ============================================================================

// Alignment
export const vbLeftJustify = 0;
export const vbRightJustify = 1;
export const vbCenter = 2;

// ScrollBars
export const vbSBNone = 0;
export const vbHorizontal = 1;
export const vbVertical = 2;
export const vbBoth = 3;

// CheckBox Value
export const vbUnchecked = 0;
export const vbChecked = 1;
export const vbGrayed = 2;

// ListBox Style
export const vbListBoxStandard = 0;
export const vbListBoxCheckbox = 1;

// ComboBox Style
export const vbComboDropdown = 0;
export const vbComboSimple = 1;
export const vbComboDropdownList = 2;

// ============================================================================
// Drawing Constants
// ============================================================================

// DrawMode
export const vbBlackness = 1;
export const vbNotMergePen = 2;
export const vbMaskNotPen = 3;
export const vbNotCopyPen = 4;
export const vbMaskPenNot = 5;
export const vbInvert = 6;
export const vbXorPen = 7;
export const vbNotMaskPen = 8;
export const vbMaskPen = 9;
export const vbNotXorPen = 10;
export const vbNop = 11;
export const vbMergeNotPen = 12;
export const vbCopyPen = 13;
export const vbMergePenNot = 14;
export const vbMergePen = 15;
export const vbWhiteness = 16;

// DrawStyle
export const vbSolid = 0;
export const vbDash = 1;
export const vbDot = 2;
export const vbDashDot = 3;
export const vbDashDotDot = 4;
export const vbInvisible = 5;
export const vbInsideSolid = 6;

// FillStyle
export const vbFSSolid = 0;
export const vbFSTransparent = 1;
export const vbHorizontalLine = 2;
export const vbVerticalLine = 3;
export const vbUpwardDiagonal = 4;
export const vbDownwardDiagonal = 5;
export const vbCross = 6;
export const vbDiagonalCross = 7;

// ScaleMode
export const vbUser = 0;
export const vbTwips = 1;
export const vbPoints = 2;
export const vbPixels = 3;
export const vbCharacters = 4;
export const vbInches = 5;
export const vbMillimeters = 6;
export const vbCentimeters = 7;
export const vbHimetric = 8;

// Shape
export const vbShapeRectangle = 0;
export const vbShapeSquare = 1;
export const vbShapeOval = 2;
export const vbShapeCircle = 3;
export const vbShapeRoundedRectangle = 4;
export const vbShapeRoundedSquare = 5;

// ============================================================================
// StrConv Constants
// ============================================================================

export const vbUpperCase = 1;
export const vbLowerCase = 2;
export const vbProperCase = 3;
export const vbWide = 4;
export const vbNarrow = 8;
export const vbKatakana = 16;
export const vbHiragana = 32;
export const vbUnicode = 64;
export const vbFromUnicode = 128;

// ============================================================================
// Format Constants
// ============================================================================

// Date Format Named Formats
export const vbGeneralDate = 0;
export const vbLongDate = 1;
export const vbShortDate = 2;
export const vbLongTime = 3;
export const vbShortTime = 4;

// ============================================================================
// Error Constants
// ============================================================================

export const vbObjectError = 0x80040000;

// ============================================================================
// Clipboard Constants
// ============================================================================

export const vbCFText = 1;
export const vbCFBitmap = 2;
export const vbCFMetafile = 3;
export const vbCFDIB = 8;
export const vbCFPalette = 9;
export const vbCFEMetafile = 14;
export const vbCFFiles = 15;
export const vbCFRTF = -16639;
export const vbCFLink = -16640;

// ============================================================================
// IME Constants
// ============================================================================

export const vbIMENoOp = 0;
export const vbIMEModeNoControl = 0;
export const vbIMEModeOn = 1;
export const vbIMEModeOff = 2;
export const vbIMEModeDisable = 3;
export const vbIMEModeHiragana = 4;
export const vbIMEModeKatakana = 5;
export const vbIMEModeKatakanaHalf = 6;
export const vbIMEModeAlphaFull = 7;
export const vbIMEModeAlpha = 8;

// ============================================================================
// Print Constants
// ============================================================================

export const vbPRBNAuto = 7;
export const vbPRBNEnvelope = 5;
export const vbPRBNEnvManual = 6;
export const vbPRBNLargeCapacity = 11;
export const vbPRBNLargeFmt = 10;
export const vbPRBNLower = 2;
export const vbPRBNManual = 4;
export const vbPRBNMiddle = 3;
export const vbPRBNSmallFmt = 9;
export const vbPRBNTractor = 8;
export const vbPRBNUpper = 1;

export const vbPRCMColor = 2;
export const vbPRCMMonochrome = 1;

export const vbPRDPHorizontal = 2;
export const vbPRDPVertical = 1;

export const vbPRDXPRes = 4;
export const vbPRDXHigh = 2;
export const vbPRDXLow = 3;
export const vbPRDXMedium = 1;
export const vbPRDXDraft = 1;

export const vbPRORLandscape = 2;
export const vbPRORPortrait = 1;

export const vbPRPQDraft = 1;
export const vbPRPQLow = 2;
export const vbPRPQMedium = 3;
export const vbPRPQHigh = 4;

// ============================================================================
// All Constants Object
// ============================================================================

export const VB6ExtendedConstants = {
  // VarType
  vbEmpty,
  vbNull,
  vbInteger,
  vbLong,
  vbSingle,
  vbDouble,
  vbCurrency,
  vbDate,
  vbString,
  vbObject,
  vbError,
  vbBoolean,
  vbVariant,
  vbDataObject,
  vbDecimal,
  vbByte,
  vbUserDefinedType,
  vbArray,

  // Comparison
  vbBinaryCompare,
  vbTextCompare,
  vbDatabaseCompare,

  // Date/Time
  vbUseSystemDayOfWeek,
  vbSunday,
  vbMonday,
  vbTuesday,
  vbWednesday,
  vbThursday,
  vbFriday,
  vbSaturday,
  vbUseSystem,
  vbFirstJan1,
  vbFirstFourDays,
  vbFirstFullWeek,
  vbYear,
  vbQuarter,
  vbMonth,
  vbDayOfYear,
  vbDay,
  vbWeekday,
  vbWeekOfYear,
  vbHour,
  vbMinute,
  vbSecond,

  // MsgBox
  vbOKOnly,
  vbOKCancel,
  vbAbortRetryIgnore,
  vbYesNoCancel,
  vbYesNo,
  vbRetryCancel,
  vbCritical,
  vbQuestion,
  vbExclamation,
  vbInformation,
  vbDefaultButton1,
  vbDefaultButton2,
  vbDefaultButton3,
  vbDefaultButton4,
  vbApplicationModal,
  vbSystemModal,
  vbMsgBoxHelpButton,
  vbMsgBoxSetForeground,
  vbMsgBoxRight,
  vbMsgBoxRtlReading,
  vbOK,
  vbCancel,
  vbAbort,
  vbRetry,
  vbIgnore,
  vbYes,
  vbNo,

  // String
  vbCr,
  vbLf,
  vbCrLf,
  vbNewLine,
  vbNullChar,
  vbNullString,
  vbTab,
  vbBack,
  vbFormFeed,
  vbVerticalTab,

  // Tristate
  vbUseDefault,
  vbTrue,
  vbFalse,

  // Colors
  vbBlack,
  vbRed,
  vbGreen,
  vbYellow,
  vbBlue,
  vbMagenta,
  vbCyan,
  vbWhite,
  vbScrollBars,
  vbDesktop,
  vbActiveTitleBar,
  vbInactiveTitleBar,
  vbMenuBar,
  vbWindowBackground,
  vbWindowFrame,
  vbMenuText,
  vbWindowText,
  vbTitleBarText,
  vbActiveBorder,
  vbInactiveBorder,
  vbApplicationWorkspace,
  vbHighlight,
  vbHighlightText,
  vbButtonFace,
  vb3DFace,
  vbButtonShadow,
  vb3DShadow,
  vbGrayText,
  vbButtonText,
  vbInactiveCaptionText,
  vbButtonHighlight,
  vb3DHighlight,
  vb3DDKShadow,
  vb3DLight,
  vbInfoText,
  vbInfoBackground,

  // File Attributes
  vbNormal,
  vbReadOnly,
  vbHidden,
  vbSystem,
  vbVolume,
  vbDirectory,
  vbArchive,
  vbAlias,

  // Key Codes (abbreviated for export)
  vbKeyReturn,
  vbKeyEscape,
  vbKeySpace,
  vbKeyF1,
  vbKeyF2,
  vbKeyF3,
  vbKeyF4,
  vbKeyF5,
  vbKeyF6,
  vbKeyF7,
  vbKeyF8,
  vbKeyF9,
  vbKeyF10,
  vbKeyF11,
  vbKeyF12,

  // Mouse
  vbLeftButton,
  vbRightButton,
  vbMiddleButton,
  vbShiftMask,
  vbCtrlMask,
  vbAltMask,

  // Form
  vbModal,
  vbModeless,
  vbBSNone,
  vbFixedSingle,
  vbSizable,
  vbFixedDialog,
  vbFixedToolWindow,
  vbSizableToolWindow,
  vbNormalForm,
  vbMinimized,
  vbMaximized,

  // Control
  vbLeftJustify,
  vbRightJustify,
  vbCenter,
  vbSBNone,
  vbHorizontal,
  vbVertical,
  vbBoth,
  vbUnchecked,
  vbChecked,
  vbGrayed,

  // Drawing
  vbCopyPen,
  vbInvert,
  vbXorPen,
  vbSolid,
  vbDash,
  vbDot,
  vbDashDot,
  vbDashDotDot,
  vbInvisible,
  vbFSSolid,
  vbFSTransparent,
  vbUser,
  vbTwips,
  vbPoints,
  vbPixels,
  vbCharacters,
  vbInches,
  vbMillimeters,
  vbCentimeters,

  // StrConv
  vbUpperCase,
  vbLowerCase,
  vbProperCase,
  vbWide,
  vbNarrow,
  vbKatakana,
  vbHiragana,
  vbUnicode,
  vbFromUnicode,

  // Format
  vbGeneralDate,
  vbLongDate,
  vbShortDate,
  vbLongTime,
  vbShortTime,

  // Error
  vbObjectError,

  // Clipboard
  vbCFText,
  vbCFBitmap,
  vbCFMetafile,
  vbCFDIB,
};

export default VB6ExtendedConstants;
