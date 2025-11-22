import { describe, it, expect, beforeEach } from 'vitest';
import { VB6UnifiedASTTranspiler } from '../../compiler/VB6UnifiedASTTranspiler';

/**
 * VB6 Controls Compatibility Tests
 *
 * Tests compiler's ability to recognize and compile code with all 40+ VB6 controls
 *
 * Categories:
 * - Basic Controls (TextBox, Label, CommandButton, etc.)
 * - Container Controls (Frame, PictureBox, etc.)
 * - List Controls (ListBox, ComboBox, ListView, TreeView, etc.)
 * - Data Controls (Data, ADO Data, DataGrid, etc.)
 * - Common Dialogs
 * - ActiveX Controls
 * - Advanced Controls (MSFlexGrid, TabStrip, Toolbar, etc.)
 */

describe('VB6 Controls Compatibility', () => {
  let transpiler: VB6UnifiedASTTranspiler;

  beforeEach(() => {
    transpiler = new VB6UnifiedASTTranspiler({
      strict: true,
      generateTypeScript: false,
      generateSourceMaps: false,
      optimize: false,
      runtimeTarget: 'es2015'
    });
  });

  describe('Basic Controls', () => {
    it('should compile form with TextBox control', () => {
      const vb6Code = `
Sub Form_Load()
    Text1.Text = "Hello World"
    Text1.Enabled = True
    Text1.Visible = True
    Text1.MaxLength = 100
End Sub

Private Sub Text1_Change()
    MsgBox "Text changed: " & Text1.Text
End Sub

Private Sub Text1_GotFocus()
    Text1.SelStart = 0
    Text1.SelLength = Len(Text1.Text)
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'TextBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('Text1');
    });

    it('should compile form with Label control', () => {
      const vb6Code = `
Sub Form_Load()
    Label1.Caption = "Hello World"
    Label1.Font.Name = "Arial"
    Label1.Font.Size = 12
    Label1.ForeColor = vbRed
    Label1.Alignment = vbCenter
End Sub

Private Sub Label1_Click()
    MsgBox "Label clicked"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LabelTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('Label1');
    });

    it('should compile form with CommandButton control', () => {
      const vb6Code = `
Private Sub Command1_Click()
    MsgBox "Button clicked"
    Command1.Caption = "Clicked!"
    Command1.Enabled = False
End Sub

Sub Form_Load()
    Command1.Caption = "Click Me"
    Command1.Default = True
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'CommandButtonTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('Command1');
    });

    it('should compile form with CheckBox control', () => {
      const vb6Code = `
Sub Form_Load()
    Check1.Caption = "Enable Feature"
    Check1.Value = vbChecked
End Sub

Private Sub Check1_Click()
    If Check1.Value = vbChecked Then
        MsgBox "Checked"
    Else
        MsgBox "Unchecked"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'CheckBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('Check1');
    });

    it('should compile form with OptionButton control', () => {
      const vb6Code = `
Sub Form_Load()
    Option1.Caption = "Option 1"
    Option2.Caption = "Option 2"
    Option1.Value = True
End Sub

Private Sub Option1_Click()
    If Option1.Value Then
        MsgBox "Option 1 selected"
    End If
End Sub

Private Sub Option2_Click()
    If Option2.Value Then
        MsgBox "Option 2 selected"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'OptionButtonTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('List Controls', () => {
    it('should compile form with ListBox control', () => {
      const vb6Code = `
Sub Form_Load()
    List1.AddItem "Item 1"
    List1.AddItem "Item 2"
    List1.AddItem "Item 3"
End Sub

Private Sub List1_Click()
    If List1.ListIndex >= 0 Then
        MsgBox "Selected: " & List1.List(List1.ListIndex)
    End If
End Sub

Sub ClearList()
    List1.Clear
End Sub

Sub RemoveSelected()
    If List1.ListIndex >= 0 Then
        List1.RemoveItem List1.ListIndex
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ListBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('List1');
    });

    it('should compile form with ComboBox control', () => {
      const vb6Code = `
Sub Form_Load()
    Combo1.AddItem "Item 1"
    Combo1.AddItem "Item 2"
    Combo1.AddItem "Item 3"
    Combo1.ListIndex = 0
    Combo1.Style = vbComboDropDown
End Sub

Private Sub Combo1_Click()
    MsgBox "Selected: " & Combo1.Text
End Sub

Private Sub Combo1_Change()
    Debug.Print "Text: " & Combo1.Text
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ComboBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('Combo1');
    });

    it('should compile form with ListView control', () => {
      const vb6Code = `
Sub Form_Load()
    Dim item As ListItem
    ListView1.View = lvwReport
    ListView1.ColumnHeaders.Add , , "Name", 2000
    ListView1.ColumnHeaders.Add , , "Value", 1500

    Set item = ListView1.ListItems.Add(, , "Item 1")
    item.SubItems(1) = "Value 1"
End Sub

Private Sub ListView1_ItemClick(ByVal item As MSComctlLib.ListItem)
    MsgBox "Clicked: " & item.Text
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ListViewTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with TreeView control', () => {
      const vb6Code = `
Sub Form_Load()
    Dim node As Node
    Set node = TreeView1.Nodes.Add(, , "Root", "Root Node")
    TreeView1.Nodes.Add node, tvwChild, "Child1", "Child Node 1"
    TreeView1.Nodes.Add node, tvwChild, "Child2", "Child Node 2"
End Sub

Private Sub TreeView1_NodeClick(ByVal Node As MSComctlLib.Node)
    MsgBox "Clicked: " & Node.Text
End Sub

Private Sub TreeView1_Expand(ByVal Node As MSComctlLib.Node)
    Debug.Print "Expanded: " & Node.Key
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'TreeViewTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Container Controls', () => {
    it('should compile form with Frame control', () => {
      const vb6Code = `
Sub Form_Load()
    Frame1.Caption = "Options"
    Frame1.Enabled = True
    Frame1.Visible = True
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'FrameTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.javascript).toContain('Frame1');
    });

    it('should compile form with PictureBox control', () => {
      const vb6Code = `
Sub Form_Load()
    Picture1.Picture = LoadPicture("C:\\image.bmp")
    Picture1.AutoSize = True
End Sub

Private Sub Picture1_Click()
    MsgBox "Picture clicked"
End Sub

Private Sub Picture1_Paint()
    Picture1.Print "Text on picture"
    Picture1.Line (0, 0)-(100, 100)
    Picture1.Circle (50, 50), 25
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'PictureBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with Image control', () => {
      const vb6Code = `
Sub Form_Load()
    Image1.Picture = LoadPicture("C:\\image.bmp")
    Image1.Stretch = True
End Sub

Private Sub Image1_Click()
    MsgBox "Image clicked"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ImageTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Scroll Controls', () => {
    it('should compile form with HScrollBar control', () => {
      const vb6Code = `
Sub Form_Load()
    HScroll1.Min = 0
    HScroll1.Max = 100
    HScroll1.Value = 50
    HScroll1.SmallChange = 1
    HScroll1.LargeChange = 10
End Sub

Private Sub HScroll1_Change()
    Label1.Caption = "Value: " & HScroll1.Value
End Sub

Private Sub HScroll1_Scroll()
    Debug.Print "Scrolling: " & HScroll1.Value
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'HScrollBarTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with VScrollBar control', () => {
      const vb6Code = `
Sub Form_Load()
    VScroll1.Min = 0
    VScroll1.Max = 100
    VScroll1.Value = 50
End Sub

Private Sub VScroll1_Change()
    Label1.Caption = "Value: " & VScroll1.Value
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'VScrollBarTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with Slider control', () => {
      const vb6Code = `
Sub Form_Load()
    Slider1.Min = 0
    Slider1.Max = 100
    Slider1.Value = 50
    Slider1.TickFrequency = 10
    Slider1.Orientation = sldHorizontal
End Sub

Private Sub Slider1_Change()
    Label1.Caption = "Value: " & Slider1.Value
End Sub

Private Sub Slider1_Scroll()
    Debug.Print "Scrolling: " & Slider1.Value
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'SliderTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('File System Controls', () => {
    it('should compile form with DriveListBox control', () => {
      const vb6Code = `
Sub Form_Load()
    Drive1.Drive = "C:"
End Sub

Private Sub Drive1_Change()
    Dir1.Path = Drive1.Drive
    MsgBox "Selected drive: " & Drive1.Drive
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DriveListBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with DirListBox control', () => {
      const vb6Code = `
Sub Form_Load()
    Dir1.Path = "C:\\"
End Sub

Private Sub Dir1_Change()
    File1.Path = Dir1.Path
    MsgBox "Selected path: " & Dir1.Path
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DirListBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with FileListBox control', () => {
      const vb6Code = `
Sub Form_Load()
    File1.Path = "C:\\"
    File1.Pattern = "*.txt"
End Sub

Private Sub File1_Click()
    If File1.ListIndex >= 0 Then
        MsgBox "Selected file: " & File1.FileName
    End If
End Sub

Private Sub File1_DblClick()
    MsgBox "Opening: " & File1.Path & "\\" & File1.FileName
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'FileListBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Timer and Shape Controls', () => {
    it('should compile form with Timer control', () => {
      const vb6Code = `
Sub Form_Load()
    Timer1.Interval = 1000
    Timer1.Enabled = True
End Sub

Private Sub Timer1_Timer()
    Static counter As Integer
    counter = counter + 1
    Label1.Caption = "Timer: " & counter

    If counter >= 10 Then
        Timer1.Enabled = False
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'TimerTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with Shape control', () => {
      const vb6Code = `
Sub Form_Load()
    Shape1.Shape = vbShapeCircle
    Shape1.FillStyle = vbFSSolid
    Shape1.FillColor = vbRed
    Shape1.BorderWidth = 2
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ShapeTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with Line control', () => {
      const vb6Code = `
Sub Form_Load()
    Line1.X1 = 0
    Line1.Y1 = 0
    Line1.X2 = 100
    Line1.Y2 = 100
    Line1.BorderWidth = 2
    Line1.BorderColor = vbBlue
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'LineTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Data Controls', () => {
    it('should compile form with Data control', () => {
      const vb6Code = `
Sub Form_Load()
    Data1.DatabaseName = "C:\\database.mdb"
    Data1.RecordSource = "Customers"
    Data1.Refresh
End Sub

Private Sub Data1_Reposition()
    UpdateDisplay
End Sub

Private Sub Data1_Validate(Action As Integer, Save As Integer)
    If Save Then
        If Trim(Text1.Text) = "" Then
            MsgBox "Name required"
            Action = vbDataActionCancel
        End If
    End If
End Sub

Sub UpdateDisplay()
    If Not Data1.Recordset.EOF And Not Data1.Recordset.BOF Then
        Text1.DataField = "CustomerName"
    End If
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DataControlTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with ADO Data control', () => {
      const vb6Code = `
Sub Form_Load()
    Adodc1.ConnectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=C:\\database.mdb"
    Adodc1.RecordSource = "SELECT * FROM Customers"
    Adodc1.Refresh
End Sub

Private Sub Adodc1_MoveComplete(ByVal adReason As ADODB.EventReasonEnum, ByVal pError As ADODB.Error, adStatus As ADODB.EventStatusEnum, ByVal pRecordset As ADODB.Recordset)
    UpdateDisplay
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ADODataControlTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with DataGrid control', () => {
      const vb6Code = `
Sub Form_Load()
    Set DataGrid1.DataSource = Adodc1
    DataGrid1.AllowAddNew = True
    DataGrid1.AllowDelete = True
    DataGrid1.AllowUpdate = True
End Sub

Private Sub DataGrid1_RowColChange(LastRow As Variant, ByVal LastCol As Integer)
    Debug.Print "Row changed"
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DataGridTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with MSFlexGrid control', () => {
      const vb6Code = `
Sub Form_Load()
    MSFlexGrid1.Rows = 10
    MSFlexGrid1.Cols = 5
    MSFlexGrid1.FixedRows = 1
    MSFlexGrid1.FixedCols = 1

    MSFlexGrid1.Row = 0
    MSFlexGrid1.Col = 0
    MSFlexGrid1.Text = "Header"
End Sub

Private Sub MSFlexGrid1_Click()
    MsgBox "Cell: " & MSFlexGrid1.Row & "," & MSFlexGrid1.Col
End Sub

Sub FillGrid()
    Dim i As Integer, j As Integer
    For i = 1 To MSFlexGrid1.Rows - 1
        For j = 1 To MSFlexGrid1.Cols - 1
            MSFlexGrid1.TextMatrix(i, j) = "R" & i & "C" & j
        Next j
    Next i
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MSFlexGridTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Common Dialogs', () => {
    it('should compile form with CommonDialog control', () => {
      const vb6Code = `
Sub ShowOpenDialog()
    CommonDialog1.Filter = "Text Files (*.txt)|*.txt|All Files (*.*)|*.*"
    CommonDialog1.FilterIndex = 1
    CommonDialog1.ShowOpen
    If CommonDialog1.FileName <> "" Then
        MsgBox "Selected: " & CommonDialog1.FileName
    End If
End Sub

Sub ShowSaveDialog()
    CommonDialog1.Filter = "Text Files (*.txt)|*.txt|All Files (*.*)|*.*"
    CommonDialog1.ShowSave
    If CommonDialog1.FileName <> "" Then
        MsgBox "Save to: " & CommonDialog1.FileName
    End If
End Sub

Sub ShowColorDialog()
    CommonDialog1.ShowColor
    MsgBox "Selected color: " & CommonDialog1.Color
End Sub

Sub ShowFontDialog()
    CommonDialog1.Flags = cdlCFScreenFonts
    CommonDialog1.ShowFont
    Text1.Font.Name = CommonDialog1.FontName
    Text1.Font.Size = CommonDialog1.FontSize
End Sub

Sub ShowPrintDialog()
    CommonDialog1.ShowPrinter
    MsgBox "Copies: " & CommonDialog1.Copies
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'CommonDialogTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Advanced Controls', () => {
    it('should compile form with TabStrip control', () => {
      const vb6Code = `
Sub Form_Load()
    TabStrip1.Tabs.Add , , "Tab 1"
    TabStrip1.Tabs.Add , , "Tab 2"
    TabStrip1.Tabs.Add , , "Tab 3"
    TabStrip1.SelectedItem = TabStrip1.Tabs(1)
End Sub

Private Sub TabStrip1_Click()
    MsgBox "Selected tab: " & TabStrip1.SelectedItem.Caption
    ShowTabContent TabStrip1.SelectedItem.Index
End Sub

Sub ShowTabContent(index As Integer)
    Select Case index
        Case 1
            Frame1.Visible = True
            Frame2.Visible = False
        Case 2
            Frame1.Visible = False
            Frame2.Visible = True
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'TabStripTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with Toolbar control', () => {
      const vb6Code = `
Sub Form_Load()
    Dim btn As Button
    Set btn = Toolbar1.Buttons.Add(, "New", "New", tbrDefault)
    Set btn = Toolbar1.Buttons.Add(, "Open", "Open", tbrDefault)
    Set btn = Toolbar1.Buttons.Add(, "Save", "Save", tbrDefault)
End Sub

Private Sub Toolbar1_ButtonClick(ByVal Button As MSComctlLib.Button)
    Select Case Button.Key
        Case "New"
            MsgBox "New file"
        Case "Open"
            MsgBox "Open file"
        Case "Save"
            MsgBox "Save file"
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ToolbarTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with StatusBar control', () => {
      const vb6Code = `
Sub Form_Load()
    StatusBar1.Panels.Add , "Status", "Ready"
    StatusBar1.Panels.Add , "Time", Time
    StatusBar1.Panels.Add , "Date", Date
End Sub

Sub UpdateStatus(msg As String)
    StatusBar1.Panels("Status").Text = msg
End Sub

Private Sub Timer1_Timer()
    StatusBar1.Panels("Time").Text = Time
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'StatusBarTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with ProgressBar control', () => {
      const vb6Code = `
Sub Form_Load()
    ProgressBar1.Min = 0
    ProgressBar1.Max = 100
    ProgressBar1.Value = 0
End Sub

Sub ProcessData()
    Dim i As Integer
    For i = 1 To 100
        DoSomething i
        ProgressBar1.Value = i
        DoEvents
    Next i
    MsgBox "Complete!"
End Sub

Sub DoSomething(index As Integer)
    ' Simulate work
    Dim j As Long
    For j = 1 To 100000
    Next j
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ProgressBarTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with ImageList control', () => {
      const vb6Code = `
Sub Form_Load()
    Dim img As ListImage
    Set img = ImageList1.ListImages.Add(, "Icon1", LoadPicture("C:\\icon1.ico"))
    Set img = ImageList1.ListImages.Add(, "Icon2", LoadPicture("C:\\icon2.ico"))

    ListView1.Icons = ImageList1
    TreeView1.ImageList = ImageList1
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'ImageListTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with RichTextBox control', () => {
      const vb6Code = `
Sub Form_Load()
    RichTextBox1.Text = "Hello World"
    RichTextBox1.SelStart = 0
    RichTextBox1.SelLength = 5
    RichTextBox1.SelBold = True
    RichTextBox1.SelFontSize = 14
End Sub

Private Sub RichTextBox1_Change()
    UpdateStatus "Text length: " & Len(RichTextBox1.Text)
End Sub

Sub LoadRTF()
    RichTextBox1.LoadFile "C:\\document.rtf"
End Sub

Sub SaveRTF()
    RichTextBox1.SaveFile "C:\\document.rtf"
End Sub

Sub FormatText()
    With RichTextBox1
        .SelStart = 0
        .SelLength = Len(.Text)
        .SelFontName = "Arial"
        .SelFontSize = 12
        .SelColor = vbBlue
    End With
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'RichTextBoxTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with UpDown control', () => {
      const vb6Code = `
Sub Form_Load()
    UpDown1.Min = 0
    UpDown1.Max = 100
    UpDown1.Value = 50
    UpDown1.BuddyControl = Text1
End Sub

Private Sub UpDown1_Change()
    Label1.Caption = "Value: " & UpDown1.Value
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'UpDownTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with MonthView control', () => {
      const vb6Code = `
Sub Form_Load()
    MonthView1.Value = Date
    MonthView1.MultiSelect = False
End Sub

Private Sub MonthView1_DateClick(ByVal DateClicked As Date)
    MsgBox "Selected date: " & DateClicked
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MonthViewTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with DateTimePicker control', () => {
      const vb6Code = `
Sub Form_Load()
    DTPicker1.Format = dtpShortDate
    DTPicker1.Value = Date
End Sub

Private Sub DTPicker1_Change()
    Label1.Caption = "Selected: " & DTPicker1.Value
End Sub

Private Sub DTPicker1_CloseUp()
    MsgBox "Date selected: " & DTPicker1.Value
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'DateTimePickerTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with Animation control', () => {
      const vb6Code = `
Sub Form_Load()
    Animation1.AutoPlay = True
    Animation1.Center = True
End Sub

Sub PlayAnimation()
    Animation1.Open "C:\\animation.avi"
    Animation1.Play
End Sub

Sub StopAnimation()
    Animation1.Stop
    Animation1.Close
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'AnimationTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with WebBrowser control', () => {
      const vb6Code = `
Sub Form_Load()
    WebBrowser1.Navigate "http://www.example.com"
End Sub

Private Sub WebBrowser1_DocumentComplete(ByVal pDisp As Object, URL As Variant)
    MsgBox "Loaded: " & URL
End Sub

Sub NavigateBack()
    WebBrowser1.GoBack
End Sub

Sub NavigateForward()
    WebBrowser1.GoForward
End Sub

Sub RefreshPage()
    WebBrowser1.Refresh
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'WebBrowserTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with MaskedEdit control', () => {
      const vb6Code = `
Sub Form_Load()
    MaskEdBox1.Mask = "###-##-####"
    MaskEdBox1.Format = "ddddd"
    MaskEdBox1.PromptChar = "_"
End Sub

Private Sub MaskEdBox1_ValidationError(InvalidText As String, StartPosition As Integer)
    MsgBox "Invalid input: " & InvalidText
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MaskedEditTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Communication Controls', () => {
    it('should compile form with Winsock control', () => {
      const vb6Code = `
Sub Form_Load()
    Winsock1.Protocol = sckTCPProtocol
End Sub

Sub ConnectToServer()
    Winsock1.RemoteHost = "localhost"
    Winsock1.RemotePort = 8080
    Winsock1.Connect
End Sub

Private Sub Winsock1_Connect()
    MsgBox "Connected"
    Winsock1.SendData "Hello Server"
End Sub

Private Sub Winsock1_DataArrival(ByVal bytesTotal As Long)
    Dim data As String
    Winsock1.GetData data
    MsgBox "Received: " & data
End Sub

Private Sub Winsock1_Error(ByVal Number As Integer, Description As String, ByVal Scode As Long, ByVal Source As String, ByVal HelpFile As String, ByVal HelpContext As Long, CancelDisplay As Boolean)
    MsgBox "Error: " & Description
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'WinsockTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with MSComm control', () => {
      const vb6Code = `
Sub Form_Load()
    MSComm1.CommPort = 1
    MSComm1.Settings = "9600,N,8,1"
    MSComm1.PortOpen = True
End Sub

Sub SendData()
    MSComm1.Output = "Hello Serial"
End Sub

Private Sub MSComm1_OnComm()
    Dim buffer As String
    Select Case MSComm1.CommEvent
        Case comEvReceive
            buffer = MSComm1.Input
            MsgBox "Received: " & buffer
        Case comEvSend
            Debug.Print "Data sent"
    End Select
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MSCommTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Menu and Form Events', () => {
    it('should compile form with menu events', () => {
      const vb6Code = `
Private Sub mnuFileNew_Click()
    MsgBox "New file"
End Sub

Private Sub mnuFileOpen_Click()
    CommonDialog1.ShowOpen
    If CommonDialog1.FileName <> "" Then
        LoadFile CommonDialog1.FileName
    End If
End Sub

Private Sub mnuFileSave_Click()
    SaveFile
End Sub

Private Sub mnuFileExit_Click()
    Unload Me
End Sub

Private Sub mnuEditCut_Click()
    Clipboard.SetText Text1.SelText
    Text1.SelText = ""
End Sub

Private Sub mnuEditCopy_Click()
    Clipboard.SetText Text1.SelText
End Sub

Private Sub mnuEditPaste_Click()
    Text1.SelText = Clipboard.GetText
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'MenuEventsTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should compile form with standard form events', () => {
      const vb6Code = `
Private Sub Form_Load()
    MsgBox "Form loading"
End Sub

Private Sub Form_Activate()
    Debug.Print "Form activated"
End Sub

Private Sub Form_Deactivate()
    Debug.Print "Form deactivated"
End Sub

Private Sub Form_Resize()
    Label1.Caption = "Size: " & Me.Width & " x " & Me.Height
End Sub

Private Sub Form_QueryUnload(Cancel As Integer, UnloadMode As Integer)
    If MsgBox("Really quit?", vbYesNo) = vbNo Then
        Cancel = True
    End If
End Sub

Private Sub Form_Unload(Cancel As Integer)
    SaveSettings
End Sub

Private Sub Form_Paint()
    Me.Print "Custom drawing"
End Sub

Private Sub Form_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
    Debug.Print "Mouse down at: " & X & ", " & Y
End Sub

Private Sub Form_MouseMove(Button As Integer, Shift As Integer, X As Single, Y As Single)
    Label1.Caption = "Mouse: " & X & ", " & Y
End Sub

Private Sub Form_MouseUp(Button As Integer, Shift As Integer, X As Single, Y As Single)
    Debug.Print "Mouse up"
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
    Debug.Print "Key down: " & KeyCode
End Sub

Private Sub Form_KeyPress(KeyAscii As Integer)
    Debug.Print "Key press: " & Chr(KeyAscii)
End Sub

Private Sub Form_KeyUp(KeyCode As Integer, Shift As Integer)
    Debug.Print "Key up: " & KeyCode
End Sub
`;
      const result = transpiler.transpile(vb6Code, 'FormEventsTest');

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
