import { VB6Control } from '../types/vb6';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'database' | 'graphics' | 'utilities' | 'games' | 'business';
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  forms: FormTemplate[];
  modules?: ModuleTemplate[];
  references?: string[];
  settings?: ProjectSettings;
}

export interface FormTemplate {
  name: string;
  caption: string;
  width: number;
  height: number;
  controls: Partial<VB6Control>[];
  code: string;
}

export interface ModuleTemplate {
  name: string;
  type: 'standard' | 'class';
  code: string;
}

export interface ProjectSettings {
  startupForm: string;
  icon?: string;
  versionInfo?: {
    major: number;
    minor: number;
    revision: number;
    companyName?: string;
    productName?: string;
  };
}

export const projectTemplates: ProjectTemplate[] = [
  // Standard Templates
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start with an empty form and build from scratch',
    category: 'standard',
    icon: '📄',
    difficulty: 'beginner',
    tags: ['basic', 'empty', 'starter'],
    forms: [
      {
        name: 'Form1',
        caption: 'Form1',
        width: 600,
        height: 400,
        controls: [],
        code: `Option Explicit

Private Sub Form_Load()
    ' Initialize your form here
End Sub`
      }
    ]
  },
  
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Classic Hello World application with a button and label',
    category: 'standard',
    icon: '👋',
    difficulty: 'beginner',
    tags: ['basic', 'tutorial', 'starter'],
    forms: [
      {
        name: 'frmMain',
        caption: 'Hello World Demo',
        width: 400,
        height: 300,
        controls: [
          {
            type: 'Label',
            Name: 'lblMessage',
            Caption: 'Click the button!',
            Left: 100,
            Top: 50,
            Width: 200,
            Height: 30,
            FontSize: 12,
            Alignment: 2 // Center
          },
          {
            type: 'CommandButton',
            Name: 'cmdGreet',
            Caption: 'Say Hello',
            Left: 150,
            Top: 150,
            Width: 100,
            Height: 40
          }
        ],
        code: `Option Explicit

Private Sub cmdGreet_Click()
    lblMessage.Caption = "Hello, World!"
    MsgBox "Welcome to VB6 Web IDE!", vbInformation, "Greeting"
End Sub

Private Sub Form_Load()
    Me.Caption = "Hello World Demo"
End Sub`
      }
    ]
  },

  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Simple calculator with basic arithmetic operations',
    category: 'utilities',
    icon: '🧮',
    difficulty: 'intermediate',
    tags: ['math', 'calculator', 'utility'],
    forms: [
      {
        name: 'frmCalculator',
        caption: 'Calculator',
        width: 300,
        height: 400,
        controls: [
          {
            type: 'TextBox',
            Name: 'txtDisplay',
            Text: '0',
            Left: 10,
            Top: 10,
            Width: 280,
            Height: 40,
            FontSize: 18,
            Alignment: 1, // Right align
            Locked: true
          },
          // Number buttons
          ...Array.from({ length: 10 }, (_, i) => ({
            type: 'CommandButton' as const,
            Name: `cmd${i}`,
            Caption: i.toString(),
            Left: 10 + ((i - 1) % 3) * 70,
            Top: 250 - Math.floor((i - 1) / 3) * 60,
            Width: 60,
            Height: 50,
            FontSize: 16
          })),
          // Operation buttons
          {
            type: 'CommandButton',
            Name: 'cmdAdd',
            Caption: '+',
            Left: 220,
            Top: 70,
            Width: 60,
            Height: 50,
            FontSize: 16
          },
          {
            type: 'CommandButton',
            Name: 'cmdSubtract',
            Caption: '-',
            Left: 220,
            Top: 130,
            Width: 60,
            Height: 50,
            FontSize: 16
          },
          {
            type: 'CommandButton',
            Name: 'cmdMultiply',
            Caption: '×',
            Left: 220,
            Top: 190,
            Width: 60,
            Height: 50,
            FontSize: 16
          },
          {
            type: 'CommandButton',
            Name: 'cmdDivide',
            Caption: '÷',
            Left: 220,
            Top: 250,
            Width: 60,
            Height: 50,
            FontSize: 16
          },
          {
            type: 'CommandButton',
            Name: 'cmdEquals',
            Caption: '=',
            Left: 150,
            Top: 310,
            Width: 130,
            Height: 50,
            FontSize: 16
          },
          {
            type: 'CommandButton',
            Name: 'cmdClear',
            Caption: 'C',
            Left: 10,
            Top: 310,
            Width: 60,
            Height: 50,
            FontSize: 16
          },
          {
            type: 'CommandButton',
            Name: 'cmdDecimal',
            Caption: '.',
            Left: 80,
            Top: 310,
            Width: 60,
            Height: 50,
            FontSize: 16
          }
        ],
        code: `Option Explicit

Private firstNumber As Double
Private secondNumber As Double
Private operation As String
Private isNewNumber As Boolean

Private Sub Form_Load()
    isNewNumber = True
End Sub

Private Sub cmd0_Click()
    AddDigit "0"
End Sub

Private Sub cmd1_Click()
    AddDigit "1"
End Sub

Private Sub cmd2_Click()
    AddDigit "2"
End Sub

Private Sub cmd3_Click()
    AddDigit "3"
End Sub

Private Sub cmd4_Click()
    AddDigit "4"
End Sub

Private Sub cmd5_Click()
    AddDigit "5"
End Sub

Private Sub cmd6_Click()
    AddDigit "6"
End Sub

Private Sub cmd7_Click()
    AddDigit "7"
End Sub

Private Sub cmd8_Click()
    AddDigit "8"
End Sub

Private Sub cmd9_Click()
    AddDigit "9"
End Sub

Private Sub cmdDecimal_Click()
    If InStr(txtDisplay.Text, ".") = 0 Then
        txtDisplay.Text = txtDisplay.Text & "."
        isNewNumber = False
    End If
End Sub

Private Sub AddDigit(digit As String)
    If isNewNumber Then
        txtDisplay.Text = digit
        isNewNumber = False
    Else
        If txtDisplay.Text = "0" Then
            txtDisplay.Text = digit
        Else
            txtDisplay.Text = txtDisplay.Text & digit
        End If
    End If
End Sub

Private Sub cmdAdd_Click()
    SetOperation "+"
End Sub

Private Sub cmdSubtract_Click()
    SetOperation "-"
End Sub

Private Sub cmdMultiply_Click()
    SetOperation "*"
End Sub

Private Sub cmdDivide_Click()
    SetOperation "/"
End Sub

Private Sub SetOperation(op As String)
    firstNumber = Val(txtDisplay.Text)
    operation = op
    isNewNumber = True
End Sub

Private Sub cmdEquals_Click()
    Dim result As Double
    secondNumber = Val(txtDisplay.Text)
    
    Select Case operation
        Case "+"
            result = firstNumber + secondNumber
        Case "-"
            result = firstNumber - secondNumber
        Case "*"
            result = firstNumber * secondNumber
        Case "/"
            If secondNumber <> 0 Then
                result = firstNumber / secondNumber
            Else
                MsgBox "Cannot divide by zero!", vbExclamation
                Exit Sub
            End If
    End Select
    
    txtDisplay.Text = CStr(result)
    isNewNumber = True
End Sub

Private Sub cmdClear_Click()
    txtDisplay.Text = "0"
    firstNumber = 0
    secondNumber = 0
    operation = ""
    isNewNumber = True
End Sub`
      }
    ]
  },

  {
    id: 'database-crud',
    name: 'Database CRUD Application',
    description: 'Complete database application with Create, Read, Update, Delete operations',
    category: 'database',
    icon: '🗄️',
    difficulty: 'advanced',
    tags: ['database', 'CRUD', 'ADO', 'data'],
    forms: [
      {
        name: 'frmMain',
        caption: 'Customer Management System',
        width: 800,
        height: 600,
        controls: [
          {
            type: 'MSFlexGrid',
            Name: 'grdCustomers',
            Left: 10,
            Top: 60,
            Width: 780,
            Height: 400,
            FixedCols: 0,
            FixedRows: 1,
            Cols: 5,
            Rows: 2
          },
          {
            type: 'Label',
            Name: 'lblTitle',
            Caption: 'Customer Management System',
            Left: 10,
            Top: 10,
            Width: 400,
            Height: 30,
            FontSize: 16,
            FontBold: true
          },
          {
            type: 'CommandButton',
            Name: 'cmdAdd',
            Caption: 'Add New',
            Left: 10,
            Top: 480,
            Width: 100,
            Height: 40
          },
          {
            type: 'CommandButton',
            Name: 'cmdEdit',
            Caption: 'Edit',
            Left: 120,
            Top: 480,
            Width: 100,
            Height: 40
          },
          {
            type: 'CommandButton',
            Name: 'cmdDelete',
            Caption: 'Delete',
            Left: 230,
            Top: 480,
            Width: 100,
            Height: 40
          },
          {
            type: 'CommandButton',
            Name: 'cmdRefresh',
            Caption: 'Refresh',
            Left: 340,
            Top: 480,
            Width: 100,
            Height: 40
          },
          {
            type: 'TextBox',
            Name: 'txtSearch',
            Left: 550,
            Top: 20,
            Width: 200,
            Height: 25
          },
          {
            type: 'Label',
            Name: 'lblSearch',
            Caption: 'Search:',
            Left: 490,
            Top: 23,
            Width: 50,
            Height: 20
          }
        ],
        code: `Option Explicit

' This is a template for database operations
' In a real application, you would connect to an actual database

Private Type Customer
    ID As Long
    Name As String
    Email As String
    Phone As String
    City As String
End Type

Private customers() As Customer
Private customerCount As Long

Private Sub Form_Load()
    InitializeGrid
    LoadSampleData
    DisplayCustomers
End Sub

Private Sub InitializeGrid()
    With grdCustomers
        .TextMatrix(0, 0) = "ID"
        .TextMatrix(0, 1) = "Name"
        .TextMatrix(0, 2) = "Email"
        .TextMatrix(0, 3) = "Phone"
        .TextMatrix(0, 4) = "City"
        
        .ColWidth(0) = 800
        .ColWidth(1) = 2000
        .ColWidth(2) = 2500
        .ColWidth(3) = 1500
        .ColWidth(4) = 1500
    End With
End Sub

Private Sub LoadSampleData()
    ' Sample data - replace with actual database connection
    customerCount = 3
    ReDim customers(1 To customerCount)
    
    customers(1).ID = 1
    customers(1).Name = "John Doe"
    customers(1).Email = "john@example.com"
    customers(1).Phone = "555-0101"
    customers(1).City = "New York"
    
    customers(2).ID = 2
    customers(2).Name = "Jane Smith"
    customers(2).Email = "jane@example.com"
    customers(2).Phone = "555-0102"
    customers(2).City = "Los Angeles"
    
    customers(3).ID = 3
    customers(3).Name = "Bob Johnson"
    customers(3).Email = "bob@example.com"
    customers(3).Phone = "555-0103"
    customers(3).City = "Chicago"
End Sub

Private Sub DisplayCustomers()
    Dim i As Long
    
    grdCustomers.Rows = customerCount + 1
    
    For i = 1 To customerCount
        With grdCustomers
            .TextMatrix(i, 0) = CStr(customers(i).ID)
            .TextMatrix(i, 1) = customers(i).Name
            .TextMatrix(i, 2) = customers(i).Email
            .TextMatrix(i, 3) = customers(i).Phone
            .TextMatrix(i, 4) = customers(i).City
        End With
    Next i
End Sub

Private Sub cmdAdd_Click()
    MsgBox "Add new customer functionality", vbInformation
    ' Open add/edit form
End Sub

Private Sub cmdEdit_Click()
    If grdCustomers.Row > 0 Then
        MsgBox "Edit customer: " & grdCustomers.TextMatrix(grdCustomers.Row, 1), vbInformation
        ' Open add/edit form with selected customer
    End If
End Sub

Private Sub cmdDelete_Click()
    If grdCustomers.Row > 0 Then
        If MsgBox("Delete customer: " & grdCustomers.TextMatrix(grdCustomers.Row, 1) & "?", _
                  vbQuestion + vbYesNo) = vbYes Then
            MsgBox "Customer deleted", vbInformation
            ' Delete from database and refresh
        End If
    End If
End Sub

Private Sub cmdRefresh_Click()
    DisplayCustomers
    MsgBox "Data refreshed", vbInformation
End Sub

Private Sub txtSearch_Change()
    ' Implement search functionality
    Dim searchText As String
    searchText = LCase(txtSearch.Text)
    
    ' Filter customers based on search
    ' This is a simple example - implement actual filtering
    If Len(searchText) > 0 Then
        MsgBox "Searching for: " & searchText, vbInformation
    End If
End Sub`
      }
    ],
    modules: [
      {
        name: 'modDatabase',
        type: 'standard',
        code: `Option Explicit

' Database connection module
' This would contain actual ADO/DAO connection code

Public Function ConnectToDatabase() As Boolean
    ' Connection code here
    ConnectToDatabase = True
End Function

Public Function ExecuteQuery(sql As String) As Variant
    ' Query execution code
End Function

Public Sub CloseDatabase()
    ' Cleanup code
End Sub`
      }
    ]
  },

  {
    id: 'file-explorer',
    name: 'File Explorer',
    description: 'Windows Explorer-like file browser with tree view and list view',
    category: 'utilities',
    icon: '📁',
    difficulty: 'advanced',
    tags: ['files', 'explorer', 'treeview', 'listview'],
    forms: [
      {
        name: 'frmExplorer',
        caption: 'File Explorer',
        width: 900,
        height: 600,
        controls: [
          {
            type: 'TreeView',
            Name: 'tvFolders',
            Left: 10,
            Top: 40,
            Width: 250,
            Height: 500
          },
          {
            type: 'ListView',
            Name: 'lvFiles',
            Left: 270,
            Top: 40,
            Width: 620,
            Height: 500,
            View: 3 // Report view
          },
          {
            type: 'Label',
            Name: 'lblPath',
            Caption: 'C:\\',
            Left: 10,
            Top: 10,
            Width: 600,
            Height: 20,
            FontBold: true
          },
          {
            type: 'CommandButton',
            Name: 'cmdRefresh',
            Caption: 'Refresh',
            Left: 800,
            Top: 5,
            Width: 80,
            Height: 30
          }
        ],
        code: `Option Explicit

Private Sub Form_Load()
    InitializeExplorer
    LoadDrives
End Sub

Private Sub InitializeExplorer()
    ' Set up TreeView
    tvFolders.LineStyle = tvwRootLines
    
    ' Set up ListView columns
    With lvFiles.ColumnHeaders
        .Add , , "Name", 2500
        .Add , , "Size", 1000, lvwColumnRight
        .Add , , "Type", 1500
        .Add , , "Modified", 2000
    End With
End Sub

Private Sub LoadDrives()
    ' Add sample drives to TreeView
    Dim nodDrive As Node
    
    Set nodDrive = tvFolders.Nodes.Add(, , "C:", "C:\\ (Local Disk)")
    nodDrive.Tag = "C:\\"
    
    ' Add sample folders
    tvFolders.Nodes.Add "C:", tvwChild, "C:Windows", "Windows"
    tvFolders.Nodes.Add "C:", tvwChild, "C:Program", "Program Files"
    tvFolders.Nodes.Add "C:", tvwChild, "C:Users", "Users"
End Sub

Private Sub tvFolders_NodeClick(ByVal Node As Node)
    lblPath.Caption = Node.Tag
    LoadFiles Node.Tag
End Sub

Private Sub LoadFiles(path As String)
    ' Load files into ListView
    lvFiles.ListItems.Clear
    
    ' Add sample files
    Dim li As ListItem
    
    Set li = lvFiles.ListItems.Add(, , "Document.txt")
    li.SubItems(1) = "2 KB"
    li.SubItems(2) = "Text File"
    li.SubItems(3) = "2024-01-15 10:30"
    
    Set li = lvFiles.ListItems.Add(, , "Image.jpg")
    li.SubItems(1) = "145 KB"
    li.SubItems(2) = "JPEG Image"
    li.SubItems(3) = "2024-01-14 15:45"
    
    Set li = lvFiles.ListItems.Add(, , "Spreadsheet.xlsx")
    li.SubItems(1) = "23 KB"
    li.SubItems(2) = "Excel File"
    li.SubItems(3) = "2024-01-13 09:00"
End Sub

Private Sub cmdRefresh_Click()
    LoadFiles lblPath.Caption
End Sub

Private Sub lvFiles_DblClick()
    If Not lvFiles.SelectedItem Is Nothing Then
        MsgBox "Opening: " & lvFiles.SelectedItem.Text, vbInformation
    End If
End Sub`
      }
    ]
  },

  {
    id: 'drawing-app',
    name: 'Drawing Application',
    description: 'Simple paint program with drawing tools and color selection',
    category: 'graphics',
    icon: '🎨',
    difficulty: 'intermediate',
    tags: ['graphics', 'drawing', 'paint', 'art'],
    forms: [
      {
        name: 'frmDrawing',
        caption: 'Drawing Application',
        width: 800,
        height: 600,
        controls: [
          {
            type: 'PictureBox',
            Name: 'picCanvas',
            Left: 100,
            Top: 10,
            Width: 690,
            Height: 500,
            BackColor: 0xFFFFFF, // White
            BorderStyle: 1
          },
          {
            type: 'Frame',
            Name: 'fraTools',
            Caption: 'Tools',
            Left: 10,
            Top: 10,
            Width: 80,
            Height: 200
          },
          {
            type: 'OptionButton',
            Name: 'optPencil',
            Caption: 'Pencil',
            Left: 20,
            Top: 40,
            Width: 60,
            Height: 20,
            Value: true
          },
          {
            type: 'OptionButton',
            Name: 'optLine',
            Caption: 'Line',
            Left: 20,
            Top: 70,
            Width: 60,
            Height: 20
          },
          {
            type: 'OptionButton',
            Name: 'optRect',
            Caption: 'Rect',
            Left: 20,
            Top: 100,
            Width: 60,
            Height: 20
          },
          {
            type: 'OptionButton',
            Name: 'optCircle',
            Caption: 'Circle',
            Left: 20,
            Top: 130,
            Width: 60,
            Height: 20
          },
          {
            type: 'Frame',
            Name: 'fraColors',
            Caption: 'Colors',
            Left: 10,
            Top: 220,
            Width: 80,
            Height: 200
          },
          {
            type: 'Label',
            Name: 'lblColor1',
            BackColor: 0x000000, // Black
            Left: 20,
            Top: 250,
            Width: 25,
            Height: 25,
            BorderStyle: 1
          },
          {
            type: 'Label',
            Name: 'lblColor2',
            BackColor: 0xFF0000, // Red
            Left: 50,
            Top: 250,
            Width: 25,
            Height: 25,
            BorderStyle: 1
          },
          {
            type: 'Label',
            Name: 'lblColor3',
            BackColor: 0x00FF00, // Green
            Left: 20,
            Top: 280,
            Width: 25,
            Height: 25,
            BorderStyle: 1
          },
          {
            type: 'Label',
            Name: 'lblColor4',
            BackColor: 0x0000FF, // Blue
            Left: 50,
            Top: 280,
            Width: 25,
            Height: 25,
            BorderStyle: 1
          },
          {
            type: 'CommandButton',
            Name: 'cmdClear',
            Caption: 'Clear',
            Left: 10,
            Top: 520,
            Width: 80,
            Height: 30
          },
          {
            type: 'Label',
            Name: 'lblStatus',
            Caption: 'Ready to draw',
            Left: 100,
            Top: 525,
            Width: 200,
            Height: 20
          }
        ],
        code: `Option Explicit

Private drawing As Boolean
Private startX As Single, startY As Single
Private currentColor As Long
Private currentTool As String

Private Sub Form_Load()
    currentColor = vbBlack
    currentTool = "Pencil"
    picCanvas.AutoRedraw = True
End Sub

Private Sub picCanvas_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
    If Button = 1 Then
        drawing = True
        startX = X
        startY = Y
        picCanvas.CurrentX = X
        picCanvas.CurrentY = Y
    End If
End Sub

Private Sub picCanvas_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
    lblStatus.Caption = "X: " & CInt(X) & ", Y: " & CInt(Y)
    
    If drawing And currentTool = "Pencil" Then
        picCanvas.Line -(X, Y), currentColor
    End If
End Sub

Private Sub picCanvas_MouseUp(Button As Integer, Shift As Integer, X As Single, Y As Single)
    If drawing Then
        drawing = False
        
        Select Case currentTool
            Case "Line"
                picCanvas.Line (startX, startY)-(X, Y), currentColor
            Case "Rect"
                picCanvas.Line (startX, startY)-(X, Y), currentColor, B
            Case "Circle"
                Dim radius As Single
                radius = Sqr((X - startX) ^ 2 + (Y - startY) ^ 2)
                picCanvas.Circle (startX, startY), radius, currentColor
        End Select
    End If
End Sub

Private Sub optPencil_Click()
    currentTool = "Pencil"
End Sub

Private Sub optLine_Click()
    currentTool = "Line"
End Sub

Private Sub optRect_Click()
    currentTool = "Rect"
End Sub

Private Sub optCircle_Click()
    currentTool = "Circle"
End Sub

Private Sub lblColor1_Click()
    currentColor = lblColor1.BackColor
    HighlightColor lblColor1
End Sub

Private Sub lblColor2_Click()
    currentColor = lblColor2.BackColor
    HighlightColor lblColor2
End Sub

Private Sub lblColor3_Click()
    currentColor = lblColor3.BackColor
    HighlightColor lblColor3
End Sub

Private Sub lblColor4_Click()
    currentColor = lblColor4.BackColor
    HighlightColor lblColor4
End Sub

Private Sub HighlightColor(selectedLabel As Label)
    ' Reset all borders
    lblColor1.BorderStyle = 1
    lblColor2.BorderStyle = 1
    lblColor3.BorderStyle = 1
    lblColor4.BorderStyle = 1
    
    ' Highlight selected
    selectedLabel.BorderStyle = 1
End Sub

Private Sub cmdClear_Click()
    picCanvas.Cls
    lblStatus.Caption = "Canvas cleared"
End Sub`
      }
    ]
  },

  {
    id: 'notepad-clone',
    name: 'Notepad Clone',
    description: 'Simple text editor with file operations and basic editing features',
    category: 'utilities',
    icon: '📝',
    difficulty: 'beginner',
    tags: ['editor', 'text', 'notepad'],
    forms: [
      {
        name: 'frmNotepad',
        caption: 'Notepad',
        width: 700,
        height: 500,
        controls: [
          {
            type: 'TextBox',
            Name: 'txtEditor',
            MultiLine: true,
            ScrollBars: 3, // Both
            Left: 0,
            Top: 0,
            Width: 700,
            Height: 450,
            Text: ''
          },
          {
            type: 'Menu',
            Name: 'mnuFile',
            Caption: '&File'
          },
          {
            type: 'Menu',
            Name: 'mnuFileNew',
            Caption: '&New',
            Parent: 'mnuFile'
          },
          {
            type: 'Menu',
            Name: 'mnuFileOpen',
            Caption: '&Open...',
            Parent: 'mnuFile'
          },
          {
            type: 'Menu',
            Name: 'mnuFileSave',
            Caption: '&Save',
            Parent: 'mnuFile'
          },
          {
            type: 'Menu',
            Name: 'mnuFileSaveAs',
            Caption: 'Save &As...',
            Parent: 'mnuFile'
          },
          {
            type: 'Menu',
            Name: 'mnuFileSep',
            Caption: '-',
            Parent: 'mnuFile'
          },
          {
            type: 'Menu',
            Name: 'mnuFileExit',
            Caption: 'E&xit',
            Parent: 'mnuFile'
          },
          {
            type: 'Menu',
            Name: 'mnuEdit',
            Caption: '&Edit'
          },
          {
            type: 'Menu',
            Name: 'mnuEditCut',
            Caption: 'Cu&t',
            Parent: 'mnuEdit'
          },
          {
            type: 'Menu',
            Name: 'mnuEditCopy',
            Caption: '&Copy',
            Parent: 'mnuEdit'
          },
          {
            type: 'Menu',
            Name: 'mnuEditPaste',
            Caption: '&Paste',
            Parent: 'mnuEdit'
          }
        ],
        code: `Option Explicit

Private fileName As String
Private fileChanged As Boolean

Private Sub Form_Load()
    fileName = ""
    fileChanged = False
    UpdateTitle
End Sub

Private Sub Form_Resize()
    If Me.WindowState <> vbMinimized Then
        txtEditor.Width = Me.ScaleWidth
        txtEditor.Height = Me.ScaleHeight
    End If
End Sub

Private Sub txtEditor_Change()
    fileChanged = True
    UpdateTitle
End Sub

Private Sub UpdateTitle()
    Dim title As String
    title = "Notepad"
    
    If fileName <> "" Then
        title = title & " - " & fileName
    Else
        title = title & " - Untitled"
    End If
    
    If fileChanged Then
        title = title & " *"
    End If
    
    Me.Caption = title
End Sub

Private Sub mnuFileNew_Click()
    If CheckSaveChanges() Then
        txtEditor.Text = ""
        fileName = ""
        fileChanged = False
        UpdateTitle
    End If
End Sub

Private Sub mnuFileOpen_Click()
    If CheckSaveChanges() Then
        ' In a real app, show file dialog
        fileName = "document.txt"
        txtEditor.Text = "Sample file content"
        fileChanged = False
        UpdateTitle
    End If
End Sub

Private Sub mnuFileSave_Click()
    If fileName = "" Then
        mnuFileSaveAs_Click
    Else
        SaveFile
    End If
End Sub

Private Sub mnuFileSaveAs_Click()
    ' In a real app, show save dialog
    fileName = "document.txt"
    SaveFile
End Sub

Private Sub SaveFile()
    ' Save file logic here
    fileChanged = False
    UpdateTitle
    MsgBox "File saved: " & fileName, vbInformation
End Sub

Private Function CheckSaveChanges() As Boolean
    If fileChanged Then
        Dim result As Integer
        result = MsgBox("Do you want to save changes?", vbYesNoCancel + vbQuestion)
        
        Select Case result
            Case vbYes
                mnuFileSave_Click
                CheckSaveChanges = True
            Case vbNo
                CheckSaveChanges = True
            Case vbCancel
                CheckSaveChanges = False
        End Select
    Else
        CheckSaveChanges = True
    End If
End Function

Private Sub mnuFileExit_Click()
    If CheckSaveChanges() Then
        Unload Me
    End If
End Sub

Private Sub mnuEditCut_Click()
    Clipboard.Clear
    Clipboard.SetText txtEditor.SelText
    txtEditor.SelText = ""
End Sub

Private Sub mnuEditCopy_Click()
    Clipboard.Clear
    Clipboard.SetText txtEditor.SelText
End Sub

Private Sub mnuEditPaste_Click()
    txtEditor.SelText = Clipboard.GetText
End Sub`
      }
    ]
  }
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  return projectTemplates.filter(t => t.category === category);
}

export function getTemplatesByDifficulty(difficulty: string): ProjectTemplate[] {
  return projectTemplates.filter(t => t.difficulty === difficulty);
}

export function searchTemplates(query: string): ProjectTemplate[] {
  const lowerQuery = query.toLowerCase();
  return projectTemplates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}