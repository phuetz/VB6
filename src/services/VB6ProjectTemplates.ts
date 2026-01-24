/**
 * VB6 Project Templates
 * Pre-built project templates for common application types
 */

// ============================================================================
// Types
// ============================================================================

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  files: ProjectFile[];
  references: ProjectReference[];
  controls: string[];
}

export type TemplateCategory =
  | 'standard'
  | 'database'
  | 'internet'
  | 'custom'
  | 'activex';

export interface ProjectFile {
  name: string;
  type: 'form' | 'module' | 'class' | 'resource' | 'designer';
  content: string;
  isStartup?: boolean;
}

export interface ProjectReference {
  name: string;
  guid: string;
  version: string;
  description: string;
}

// ============================================================================
// Standard References
// ============================================================================

const VB6_REFERENCES = {
  dao: {
    name: 'Microsoft DAO 3.6 Object Library',
    guid: '{00025E01-0000-0000-C000-000000000046}',
    version: '5.0',
    description: 'DAO Database Access Objects'
  },
  ado: {
    name: 'Microsoft ActiveX Data Objects 2.8 Library',
    guid: '{EF53050B-882E-4776-B643-EDA472E8E3F2}',
    version: '2.8',
    description: 'ADO Database Access'
  },
  scripting: {
    name: 'Microsoft Scripting Runtime',
    guid: '{420B2830-E718-11CF-893D-00A0C9054228}',
    version: '1.0',
    description: 'FileSystemObject and Dictionary'
  },
  winsock: {
    name: 'Microsoft Winsock Control 6.0',
    guid: '{248DD890-BB45-11CF-9ABC-0080C7E7B78D}',
    version: '6.0',
    description: 'TCP/IP Socket Control'
  },
  inet: {
    name: 'Microsoft Internet Transfer Control 6.0',
    guid: '{48E59290-9880-11CF-9754-00AA00C00908}',
    version: '6.0',
    description: 'Internet Transfer Control'
  },
  webbrowser: {
    name: 'Microsoft Internet Controls',
    guid: '{EAB22AC0-30C1-11CF-A7EB-0000C05BAE0B}',
    version: '1.1',
    description: 'WebBrowser Control'
  },
  commonDialog: {
    name: 'Microsoft Common Dialog Control 6.0',
    guid: '{F9043C85-F6F2-101A-A3C9-08002B2F49FB}',
    version: '6.0',
    description: 'Common Dialog Control'
  },
  msflexgrid: {
    name: 'Microsoft FlexGrid Control 6.0',
    guid: '{5E9E78A0-531B-11CF-91F6-C2863C385E30}',
    version: '6.0',
    description: 'FlexGrid Control'
  },
  dataGrid: {
    name: 'Microsoft DataGrid Control 6.0',
    guid: '{CDE57A40-8B86-11D0-B3C6-00A0C90AEA82}',
    version: '6.0',
    description: 'Data Grid Control'
  },
  treeview: {
    name: 'Microsoft Windows Common Controls 6.0',
    guid: '{6B7E6392-850A-101B-AFC0-4210102A8DA7}',
    version: '6.0',
    description: 'TreeView, ListView, ImageList, etc.'
  }
};

// ============================================================================
// Template: Standard EXE
// ============================================================================

const STANDARD_EXE_TEMPLATE: ProjectTemplate = {
  id: 'standard-exe',
  name: 'Standard EXE',
  description: 'Standard executable project with a single form',
  icon: '📦',
  category: 'standard',
  references: [],
  controls: [],
  files: [
    {
      name: 'Form1.frm',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Begin VB.Form Form1
   Caption         =   "Form1"
   ClientHeight    =   3015
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   ScaleHeight     =   3015
   ScaleWidth      =   4680
   StartUpPosition =   3  'Windows Default
End
Attribute VB_Name = "Form1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub Form_Load()
    ' Initialize your form here
End Sub
`
    }
  ]
};

// ============================================================================
// Template: MDI Application
// ============================================================================

const MDI_APPLICATION_TEMPLATE: ProjectTemplate = {
  id: 'mdi-application',
  name: 'MDI Application',
  description: 'Multiple Document Interface application',
  icon: '📋',
  category: 'standard',
  references: [],
  controls: [],
  files: [
    {
      name: 'MDIForm1.frm',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Begin VB.MDIForm MDIForm1
   Caption         =   "MDI Application"
   ClientHeight    =   4935
   ClientLeft      =   165
   ClientTop       =   735
   ClientWidth     =   7365
   LinkTopic       =   "MDIForm1"
   StartUpPosition =   3  'Windows Default
   Begin VB.Menu mnuFile
      Caption         =   "&File"
      Begin VB.Menu mnuFileNew
         Caption         =   "&New"
         Shortcut        =   ^N
      End
      Begin VB.Menu mnuFileOpen
         Caption         =   "&Open..."
         Shortcut        =   ^O
      End
      Begin VB.Menu mnuFileSave
         Caption         =   "&Save"
         Shortcut        =   ^S
      End
      Begin VB.Menu mnuFileSep
         Caption         =   "-"
      End
      Begin VB.Menu mnuFileExit
         Caption         =   "E&xit"
      End
   End
   Begin VB.Menu mnuWindow
      Caption         =   "&Window"
      WindowList      =   -1  'True
      Begin VB.Menu mnuWindowCascade
         Caption         =   "&Cascade"
      End
      Begin VB.Menu mnuWindowTileH
         Caption         =   "Tile &Horizontal"
      End
      Begin VB.Menu mnuWindowTileV
         Caption         =   "Tile &Vertical"
      End
      Begin VB.Menu mnuWindowArrangeIcons
         Caption         =   "&Arrange Icons"
      End
   End
   Begin VB.Menu mnuHelp
      Caption         =   "&Help"
      Begin VB.Menu mnuHelpAbout
         Caption         =   "&About..."
      End
   End
End
Attribute VB_Name = "MDIForm1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private childCount As Integer

Private Sub MDIForm_Load()
    childCount = 0
End Sub

Private Sub mnuFileNew_Click()
    Dim frmNew As Form1
    Set frmNew = New Form1
    childCount = childCount + 1
    frmNew.Caption = "Document " & childCount
    frmNew.Show
End Sub

Private Sub mnuFileExit_Click()
    Unload Me
End Sub

Private Sub mnuWindowCascade_Click()
    Me.Arrange vbCascade
End Sub

Private Sub mnuWindowTileH_Click()
    Me.Arrange vbTileHorizontal
End Sub

Private Sub mnuWindowTileV_Click()
    Me.Arrange vbTileVertical
End Sub

Private Sub mnuWindowArrangeIcons_Click()
    Me.Arrange vbArrangeIcons
End Sub

Private Sub mnuHelpAbout_Click()
    MsgBox "MDI Application" & vbCrLf & "Version 1.0", vbInformation, "About"
End Sub
`
    },
    {
      name: 'Form1.frm',
      type: 'form',
      content: `VERSION 5.00
Begin VB.Form Form1
   Caption         =   "Document"
   ClientHeight    =   3015
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   3015
   ScaleWidth      =   4680
   Begin VB.TextBox Text1
      Height          =   2895
      Left            =   0
      MultiLine       =   -1  'True
      ScrollBars      =   3  'Both
      TabIndex        =   0
      Top             =   0
      Width           =   4575
   End
End
Attribute VB_Name = "Form1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub Form_Resize()
    If WindowState <> vbMinimized Then
        Text1.Move 0, 0, ScaleWidth, ScaleHeight
    End If
End Sub
`
    }
  ]
};

// ============================================================================
// Template: Database Application
// ============================================================================

const DATABASE_APPLICATION_TEMPLATE: ProjectTemplate = {
  id: 'database-application',
  name: 'Database Application',
  description: 'Application with database connectivity',
  icon: '🗄️',
  category: 'database',
  references: [VB6_REFERENCES.dao, VB6_REFERENCES.ado],
  controls: ['DataGrid', 'DataCombo', 'DataList'],
  files: [
    {
      name: 'frmMain.frm',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Begin VB.Form frmMain
   Caption         =   "Database Application"
   ClientHeight    =   5055
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8535
   LinkTopic       =   "Form1"
   ScaleHeight     =   5055
   ScaleWidth      =   8535
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton cmdLast
      Caption         =   ">|"
      Height          =   375
      Left            =   2520
      TabIndex        =   5
      Top             =   4560
      Width           =   615
   End
   Begin VB.CommandButton cmdNext
      Caption         =   ">"
      Height          =   375
      Left            =   1920
      TabIndex        =   4
      Top             =   4560
      Width           =   615
   End
   Begin VB.CommandButton cmdPrevious
      Caption         =   "<"
      Height          =   375
      Left            =   1320
      TabIndex        =   3
      Top             =   4560
      Width           =   615
   End
   Begin VB.CommandButton cmdFirst
      Caption         =   "|<"
      Height          =   375
      Left            =   720
      TabIndex        =   2
      Top             =   4560
      Width           =   615
   End
   Begin VB.Data Data1
      Caption         =   "Data1"
      Connect         =   "Access"
      DatabaseName    =   ""
      DefaultCursorType=   0  'DefaultCursor
      DefaultType     =   2  'UseODBC
      Exclusive       =   0   'False
      Height          =   345
      Left            =   120
      Options         =   0
      ReadOnly        =   0   'False
      RecordsetType   =   1  'Dynaset
      RecordSource    =   ""
      Top             =   4080
      Width           =   8295
   End
   Begin VB.ListBox lstRecords
      Height          =   3570
      Left            =   120
      TabIndex        =   0
      Top             =   480
      Width           =   8295
   End
   Begin VB.Label Label1
      Caption         =   "Records:"
      Height          =   255
      Left            =   120
      TabIndex        =   1
      Top             =   120
      Width           =   1215
   End
End
Attribute VB_Name = "frmMain"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private db As Database
Private rs As Recordset

Private Sub Form_Load()
    ' Initialize database connection
    ConnectToDatabase
End Sub

Private Sub ConnectToDatabase()
    On Error GoTo ErrorHandler

    ' Modify this path to your database
    Dim dbPath As String
    dbPath = App.Path & "\\database.mdb"

    If Dir(dbPath) <> "" Then
        Set db = OpenDatabase(dbPath)
        ' Set rs = db.OpenRecordset("SELECT * FROM YourTable")
        ' LoadRecords
    Else
        MsgBox "Database not found: " & dbPath, vbExclamation
    End If

    Exit Sub

ErrorHandler:
    MsgBox "Error connecting to database: " & Err.Description, vbCritical
End Sub

Private Sub LoadRecords()
    lstRecords.Clear

    If Not rs Is Nothing Then
        rs.MoveFirst
        Do While Not rs.EOF
            ' Add records to list
            ' lstRecords.AddItem rs!FieldName
            rs.MoveNext
        Loop
        rs.MoveFirst
    End If
End Sub

Private Sub cmdFirst_Click()
    If Not rs Is Nothing Then
        rs.MoveFirst
    End If
End Sub

Private Sub cmdPrevious_Click()
    If Not rs Is Nothing Then
        If Not rs.BOF Then
            rs.MovePrevious
        End If
    End If
End Sub

Private Sub cmdNext_Click()
    If Not rs Is Nothing Then
        If Not rs.EOF Then
            rs.MoveNext
        End If
    End If
End Sub

Private Sub cmdLast_Click()
    If Not rs Is Nothing Then
        rs.MoveLast
    End If
End Sub

Private Sub Form_Unload(Cancel As Integer)
    If Not rs Is Nothing Then rs.Close
    If Not db Is Nothing Then db.Close
End Sub
`
    },
    {
      name: 'modDatabase.bas',
      type: 'module',
      content: `Attribute VB_Name = "modDatabase"
Option Explicit

' Database utility functions

Public Function ConnectDatabase(dbPath As String) As Database
    On Error GoTo ErrorHandler
    Set ConnectDatabase = OpenDatabase(dbPath)
    Exit Function
ErrorHandler:
    Set ConnectDatabase = Nothing
End Function

Public Function ExecuteQuery(db As Database, sql As String) As Recordset
    On Error GoTo ErrorHandler
    Set ExecuteQuery = db.OpenRecordset(sql)
    Exit Function
ErrorHandler:
    Set ExecuteQuery = Nothing
End Function

Public Sub ExecuteNonQuery(db As Database, sql As String)
    On Error GoTo ErrorHandler
    db.Execute sql, dbFailOnError
    Exit Sub
ErrorHandler:
    MsgBox "Database error: " & Err.Description, vbCritical
End Sub

Public Function RecordCount(rs As Recordset) As Long
    If rs Is Nothing Then
        RecordCount = 0
    ElseIf rs.EOF And rs.BOF Then
        RecordCount = 0
    Else
        rs.MoveLast
        RecordCount = rs.RecordCount
        rs.MoveFirst
    End If
End Function
`
    }
  ]
};

// ============================================================================
// Template: Internet Application
// ============================================================================

const INTERNET_APPLICATION_TEMPLATE: ProjectTemplate = {
  id: 'internet-application',
  name: 'Internet Application',
  description: 'Application with web browser and internet controls',
  icon: '🌐',
  category: 'internet',
  references: [VB6_REFERENCES.webbrowser, VB6_REFERENCES.inet],
  controls: ['WebBrowser', 'Inet'],
  files: [
    {
      name: 'frmBrowser.frm',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Object = "{EAB22AC0-30C1-11CF-A7EB-0000C05BAE0B}#1.1#0"; "SHDOCVW.dll"
Begin VB.Form frmBrowser
   Caption         =   "Web Browser"
   ClientHeight    =   6540
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9660
   LinkTopic       =   "Form1"
   ScaleHeight     =   6540
   ScaleWidth      =   9660
   StartUpPosition =   3  'Windows Default
   Begin SHDocVwCtl.WebBrowser WebBrowser1
      Height          =   5655
      Left            =   120
      TabIndex        =   4
      Top             =   720
      Width           =   9415
      ExtentX         =   16616
      ExtentY         =   9975
      ViewMode        =   0
      Offline         =   0
      Silent          =   0
      RegisterAsBrowser=   0
      RegisterAsDropTarget=   1
      AutoArrange     =   0
      NoClientEdge    =   0
      AlignLeft       =   0
      NoWebView       =   0
      HideFileNames   =   0
      SingleClick     =   0
      SingleSelection =   0
      NoFolders       =   0
      Transparent     =   0
      ViewID          =   "{0057D0E0-3573-11CF-AE69-08002B2E1262}"
      Location        =   ""
   End
   Begin VB.CommandButton cmdGo
      Caption         =   "Go"
      Height          =   375
      Left            =   8760
      TabIndex        =   3
      Top             =   120
      Width           =   735
   End
   Begin VB.CommandButton cmdRefresh
      Caption         =   "Refresh"
      Height          =   375
      Left            =   8040
      TabIndex        =   2
      Top             =   120
      Width           =   735
   End
   Begin VB.CommandButton cmdBack
      Caption         =   "Back"
      Height          =   375
      Left            =   120
      TabIndex        =   1
      Top             =   120
      Width           =   735
   End
   Begin VB.TextBox txtURL
      Height          =   375
      Left            =   960
      TabIndex        =   0
      Text            =   "https://www.google.com"
      Top             =   120
      Width           =   6975
   End
   Begin VB.Label lblStatus
      Caption         =   "Ready"
      Height          =   255
      Left            =   120
      TabIndex        =   5
      Top             =   6360
      Width           =   9415
   End
End
Attribute VB_Name = "frmBrowser"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub Form_Load()
    ' Navigate to default page
    WebBrowser1.Navigate txtURL.Text
End Sub

Private Sub Form_Resize()
    On Error Resume Next
    If WindowState <> vbMinimized Then
        WebBrowser1.Move 120, 720, ScaleWidth - 240, ScaleHeight - 960
        lblStatus.Top = ScaleHeight - 300
        lblStatus.Width = ScaleWidth - 240
        txtURL.Width = ScaleWidth - 2800
        cmdRefresh.Left = ScaleWidth - 1620
        cmdGo.Left = ScaleWidth - 900
    End If
End Sub

Private Sub cmdGo_Click()
    WebBrowser1.Navigate txtURL.Text
End Sub

Private Sub cmdBack_Click()
    On Error Resume Next
    WebBrowser1.GoBack
End Sub

Private Sub cmdRefresh_Click()
    WebBrowser1.Refresh
End Sub

Private Sub txtURL_KeyPress(KeyAscii As Integer)
    If KeyAscii = 13 Then
        cmdGo_Click
        KeyAscii = 0
    End If
End Sub

Private Sub WebBrowser1_StatusTextChange(ByVal Text As String)
    lblStatus.Caption = Text
End Sub

Private Sub WebBrowser1_NavigateComplete2(ByVal pDisp As Object, URL As Variant)
    txtURL.Text = URL
    Me.Caption = WebBrowser1.LocationName & " - Web Browser"
End Sub
`
    }
  ]
};

// ============================================================================
// Template: Data Report Application
// ============================================================================

const DATA_REPORT_TEMPLATE: ProjectTemplate = {
  id: 'data-report',
  name: 'Data Report Application',
  description: 'Application with data reporting capabilities',
  icon: '📊',
  category: 'database',
  references: [VB6_REFERENCES.dao, VB6_REFERENCES.ado],
  controls: ['DataEnvironment', 'DataReport'],
  files: [
    {
      name: 'frmMain.frm',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Begin VB.Form frmMain
   Caption         =   "Report Viewer"
   ClientHeight    =   3015
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   ScaleHeight     =   3015
   ScaleWidth      =   4680
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton cmdExport
      Caption         =   "Export to HTML"
      Height          =   495
      Left            =   2520
      TabIndex        =   2
      Top             =   1440
      Width           =   1935
   End
   Begin VB.CommandButton cmdPrint
      Caption         =   "Print Report"
      Height          =   495
      Left            =   240
      TabIndex        =   1
      Top             =   1440
      Width           =   1935
   End
   Begin VB.CommandButton cmdPreview
      Caption         =   "Preview Report"
      Height          =   495
      Left            =   240
      TabIndex        =   0
      Top             =   720
      Width           =   4215
   End
   Begin VB.Label Label1
      Caption         =   "Data Report Application"
      BeginProperty Font
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Left            =   240
      TabIndex        =   3
      Top             =   240
      Width           =   4215
   End
End
Attribute VB_Name = "frmMain"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cmdPreview_Click()
    ' DataReport1.Show vbModal
    MsgBox "Configure DataEnvironment and DataReport first", vbInformation
End Sub

Private Sub cmdPrint_Click()
    ' DataReport1.PrintReport False
    MsgBox "Configure DataEnvironment and DataReport first", vbInformation
End Sub

Private Sub cmdExport_Click()
    ' DataReport1.ExportReport rptKeyHTML, App.Path & "\\report.html"
    MsgBox "Configure DataEnvironment and DataReport first", vbInformation
End Sub
`
    }
  ]
};

// ============================================================================
// Template: ActiveX Control
// ============================================================================

const ACTIVEX_CONTROL_TEMPLATE: ProjectTemplate = {
  id: 'activex-control',
  name: 'ActiveX Control',
  description: 'Custom ActiveX control project',
  icon: '🔧',
  category: 'activex',
  references: [],
  controls: [],
  files: [
    {
      name: 'UserControl1.ctl',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Begin VB.UserControl UserControl1
   ClientHeight    =   1800
   ClientLeft      =   0
   ClientTop       =   0
   ClientWidth     =   2400
   ScaleHeight     =   1800
   ScaleWidth      =   2400
End
Attribute VB_Name = "UserControl1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = False
Attribute VB_Exposed = True
Option Explicit

' Property variables
Private m_BackColor As OLE_COLOR
Private m_Caption As String

' Events
Public Event Click()
Public Event DblClick()

' Initialize
Private Sub UserControl_Initialize()
    m_BackColor = vbButtonFace
    m_Caption = "UserControl1"
End Sub

' Paint
Private Sub UserControl_Paint()
    UserControl.BackColor = m_BackColor
    UserControl.Cls
    UserControl.CurrentX = (ScaleWidth - TextWidth(m_Caption)) / 2
    UserControl.CurrentY = (ScaleHeight - TextHeight(m_Caption)) / 2
    UserControl.Print m_Caption
End Sub

' Resize
Private Sub UserControl_Resize()
    UserControl_Paint
End Sub

' Click event
Private Sub UserControl_Click()
    RaiseEvent Click
End Sub

' DblClick event
Private Sub UserControl_DblClick()
    RaiseEvent DblClick
End Sub

' BackColor property
Public Property Get BackColor() As OLE_COLOR
    BackColor = m_BackColor
End Property

Public Property Let BackColor(ByVal NewValue As OLE_COLOR)
    m_BackColor = NewValue
    PropertyChanged "BackColor"
    UserControl_Paint
End Property

' Caption property
Public Property Get Caption() As String
    Caption = m_Caption
End Property

Public Property Let Caption(ByVal NewValue As String)
    m_Caption = NewValue
    PropertyChanged "Caption"
    UserControl_Paint
End Property

' Read properties
Private Sub UserControl_ReadProperties(PropBag As PropertyBag)
    m_BackColor = PropBag.ReadProperty("BackColor", vbButtonFace)
    m_Caption = PropBag.ReadProperty("Caption", "UserControl1")
End Sub

' Write properties
Private Sub UserControl_WriteProperties(PropBag As PropertyBag)
    PropBag.WriteProperty "BackColor", m_BackColor, vbButtonFace
    PropBag.WriteProperty "Caption", m_Caption, "UserControl1"
End Sub
`
    }
  ]
};

// ============================================================================
// Template: Dialog-Based Application
// ============================================================================

const DIALOG_APPLICATION_TEMPLATE: ProjectTemplate = {
  id: 'dialog-application',
  name: 'Dialog Application',
  description: 'Application with dialog forms',
  icon: '💬',
  category: 'standard',
  references: [VB6_REFERENCES.commonDialog],
  controls: ['CommonDialog'],
  files: [
    {
      name: 'frmMain.frm',
      type: 'form',
      isStartup: true,
      content: `VERSION 5.00
Object = "{F9043C85-F6F2-101A-A3C9-08002B2F49FB}#1.2#0"; "COMDLG32.OCX"
Begin VB.Form frmMain
   Caption         =   "Dialog Application"
   ClientHeight    =   3015
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   ScaleHeight     =   3015
   ScaleWidth      =   4680
   StartUpPosition =   3  'Windows Default
   Begin MSComDlg.CommonDialog CommonDialog1
      Left            =   3960
      Top             =   2400
      _ExtentX        =   847
      _ExtentY        =   847
      _Version        =   393216
   End
   Begin VB.CommandButton cmdColor
      Caption         =   "Choose Color"
      Height          =   495
      Left            =   2520
      TabIndex        =   3
      Top             =   1680
      Width           =   1935
   End
   Begin VB.CommandButton cmdFont
      Caption         =   "Choose Font"
      Height          =   495
      Left            =   240
      TabIndex        =   2
      Top             =   1680
      Width           =   1935
   End
   Begin VB.CommandButton cmdSave
      Caption         =   "Save As..."
      Height          =   495
      Left            =   2520
      TabIndex        =   1
      Top             =   960
      Width           =   1935
   End
   Begin VB.CommandButton cmdOpen
      Caption         =   "Open File..."
      Height          =   495
      Left            =   240
      TabIndex        =   0
      Top             =   960
      Width           =   1935
   End
   Begin VB.Label Label1
      Caption         =   "Common Dialog Examples"
      BeginProperty Font
         Name            =   "MS Sans Serif"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   375
      Left            =   240
      TabIndex        =   4
      Top             =   240
      Width           =   4215
   End
End
Attribute VB_Name = "frmMain"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Private Sub cmdOpen_Click()
    On Error Resume Next
    CommonDialog1.Filter = "All Files (*.*)|*.*|Text Files (*.txt)|*.txt"
    CommonDialog1.FilterIndex = 2
    CommonDialog1.DialogTitle = "Open File"
    CommonDialog1.ShowOpen

    If Err.Number = 0 And CommonDialog1.FileName <> "" Then
        MsgBox "Selected file: " & CommonDialog1.FileName
    End If
End Sub

Private Sub cmdSave_Click()
    On Error Resume Next
    CommonDialog1.Filter = "All Files (*.*)|*.*|Text Files (*.txt)|*.txt"
    CommonDialog1.FilterIndex = 2
    CommonDialog1.DialogTitle = "Save File As"
    CommonDialog1.ShowSave

    If Err.Number = 0 And CommonDialog1.FileName <> "" Then
        MsgBox "Save to: " & CommonDialog1.FileName
    End If
End Sub

Private Sub cmdFont_Click()
    On Error Resume Next
    CommonDialog1.Flags = cdlCFBoth Or cdlCFEffects
    CommonDialog1.ShowFont

    If Err.Number = 0 Then
        MsgBox "Selected font: " & CommonDialog1.FontName & ", Size: " & CommonDialog1.FontSize
    End If
End Sub

Private Sub cmdColor_Click()
    On Error Resume Next
    CommonDialog1.ShowColor

    If Err.Number = 0 Then
        Me.BackColor = CommonDialog1.Color
    End If
End Sub
`
    }
  ]
};

// ============================================================================
// All Templates
// ============================================================================

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  STANDARD_EXE_TEMPLATE,
  MDI_APPLICATION_TEMPLATE,
  DATABASE_APPLICATION_TEMPLATE,
  INTERNET_APPLICATION_TEMPLATE,
  DATA_REPORT_TEMPLATE,
  DIALOG_APPLICATION_TEMPLATE,
  ACTIVEX_CONTROL_TEMPLATE
];

// ============================================================================
// Template Manager
// ============================================================================

export class VB6ProjectTemplateManager {
  private templates: Map<string, ProjectTemplate> = new Map();

  constructor() {
    for (const template of PROJECT_TEMPLATES) {
      this.templates.set(template.id, template);
    }
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ProjectTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get a specific template
   */
  getTemplate(id: string): ProjectTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Create a project from template
   */
  createFromTemplate(templateId: string, projectName: string): { files: ProjectFile[]; references: ProjectReference[] } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Clone files and update project name
    const files = template.files.map(file => ({
      ...file,
      content: file.content.replace(/Form1|frmMain|UserControl1/g, projectName)
    }));

    return {
      files,
      references: [...template.references]
    };
  }

  /**
   * Register a custom template
   */
  registerTemplate(template: ProjectTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Remove a template
   */
  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const projectTemplateManager = new VB6ProjectTemplateManager();

// ============================================================================
// Export
// ============================================================================

export default {
  PROJECT_TEMPLATES,
  VB6ProjectTemplateManager,
  projectTemplateManager,
  VB6_REFERENCES
};
