/**
 * VB6 Code Snippets Library
 * Comprehensive collection of reusable VB6 code snippets
 */

// ============================================================================
// Types
// ============================================================================

export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  category: SnippetCategory;
  code: string;
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export type SnippetCategory =
  | 'string'
  | 'file'
  | 'database'
  | 'graphics'
  | 'forms'
  | 'controls'
  | 'api'
  | 'error'
  | 'date'
  | 'math'
  | 'array'
  | 'registry'
  | 'network'
  | 'utility';

// ============================================================================
// Code Snippets Collection
// ============================================================================

export const VB6_CODE_SNIPPETS: CodeSnippet[] = [
  // ============================================================================
  // String Manipulation
  // ============================================================================
  {
    id: 'str-reverse',
    name: 'Reverse String',
    description: 'Reverse the characters in a string',
    category: 'string',
    difficulty: 'beginner',
    keywords: ['string', 'reverse', 'text'],
    code: `Public Function ReverseString(ByVal s As String) As String
    Dim i As Long
    Dim result As String

    result = ""
    For i = Len(s) To 1 Step -1
        result = result & Mid$(s, i, 1)
    Next i

    ReverseString = result
End Function`
  },
  {
    id: 'str-word-count',
    name: 'Count Words in String',
    description: 'Count the number of words in a string',
    category: 'string',
    difficulty: 'beginner',
    keywords: ['string', 'word', 'count'],
    code: `Public Function WordCount(ByVal s As String) As Long
    Dim words() As String
    s = Trim$(s)

    If Len(s) = 0 Then
        WordCount = 0
    Else
        ' Replace multiple spaces with single space
        Do While InStr(s, "  ") > 0
            s = Replace(s, "  ", " ")
        Loop
        words = Split(s, " ")
        WordCount = UBound(words) - LBound(words) + 1
    End If
End Function`
  },
  {
    id: 'str-proper-case',
    name: 'Proper Case String',
    description: 'Convert string to proper case (capitalize first letter of each word)',
    category: 'string',
    difficulty: 'beginner',
    keywords: ['string', 'case', 'proper', 'title'],
    code: `Public Function ProperCase(ByVal s As String) As String
    Dim words() As String
    Dim i As Long

    words = Split(LCase$(s), " ")
    For i = LBound(words) To UBound(words)
        If Len(words(i)) > 0 Then
            words(i) = UCase$(Left$(words(i), 1)) & Mid$(words(i), 2)
        End If
    Next i

    ProperCase = Join(words, " ")
End Function`
  },
  {
    id: 'str-extract-numbers',
    name: 'Extract Numbers from String',
    description: 'Extract only numeric characters from a string',
    category: 'string',
    difficulty: 'intermediate',
    keywords: ['string', 'numbers', 'extract', 'parse'],
    code: `Public Function ExtractNumbers(ByVal s As String) As String
    Dim i As Long
    Dim c As String
    Dim result As String

    result = ""
    For i = 1 To Len(s)
        c = Mid$(s, i, 1)
        If c >= "0" And c <= "9" Then
            result = result & c
        End If
    Next i

    ExtractNumbers = result
End Function`
  },
  {
    id: 'str-pad',
    name: 'Pad String',
    description: 'Pad string to specified length with character',
    category: 'string',
    difficulty: 'beginner',
    keywords: ['string', 'pad', 'format'],
    code: `Public Function PadLeft(ByVal s As String, ByVal totalWidth As Long, Optional ByVal padChar As String = " ") As String
    If Len(s) >= totalWidth Then
        PadLeft = s
    Else
        PadLeft = String$(totalWidth - Len(s), padChar) & s
    End If
End Function

Public Function PadRight(ByVal s As String, ByVal totalWidth As Long, Optional ByVal padChar As String = " ") As String
    If Len(s) >= totalWidth Then
        PadRight = s
    Else
        PadRight = s & String$(totalWidth - Len(s), padChar)
    End If
End Function`
  },

  // ============================================================================
  // File Operations
  // ============================================================================
  {
    id: 'file-read-text',
    name: 'Read Text File',
    description: 'Read entire contents of a text file',
    category: 'file',
    difficulty: 'beginner',
    keywords: ['file', 'read', 'text', 'input'],
    code: `Public Function ReadTextFile(ByVal filePath As String) As String
    Dim fileNum As Integer
    Dim contents As String

    On Error GoTo ErrorHandler

    fileNum = FreeFile
    Open filePath For Input As #fileNum
    contents = Input$(LOF(fileNum), #fileNum)
    Close #fileNum

    ReadTextFile = contents
    Exit Function

ErrorHandler:
    If fileNum > 0 Then Close #fileNum
    ReadTextFile = ""
End Function`
  },
  {
    id: 'file-write-text',
    name: 'Write Text File',
    description: 'Write string contents to a text file',
    category: 'file',
    difficulty: 'beginner',
    keywords: ['file', 'write', 'text', 'output'],
    code: `Public Sub WriteTextFile(ByVal filePath As String, ByVal contents As String, Optional ByVal append As Boolean = False)
    Dim fileNum As Integer

    On Error GoTo ErrorHandler

    fileNum = FreeFile
    If append Then
        Open filePath For Append As #fileNum
    Else
        Open filePath For Output As #fileNum
    End If
    Print #fileNum, contents;
    Close #fileNum
    Exit Sub

ErrorHandler:
    If fileNum > 0 Then Close #fileNum
    MsgBox "Error writing file: " & Err.Description, vbCritical
End Sub`
  },
  {
    id: 'file-exists',
    name: 'Check File Exists',
    description: 'Check if a file exists',
    category: 'file',
    difficulty: 'beginner',
    keywords: ['file', 'exists', 'check'],
    code: `Public Function FileExists(ByVal filePath As String) As Boolean
    On Error Resume Next
    FileExists = (Dir$(filePath, vbNormal Or vbHidden Or vbSystem) <> "")
End Function`
  },
  {
    id: 'file-folder-exists',
    name: 'Check Folder Exists',
    description: 'Check if a folder exists',
    category: 'file',
    difficulty: 'beginner',
    keywords: ['folder', 'directory', 'exists', 'check'],
    code: `Public Function FolderExists(ByVal folderPath As String) As Boolean
    On Error Resume Next
    FolderExists = (Dir$(folderPath, vbDirectory) <> "")
End Function`
  },
  {
    id: 'file-list-files',
    name: 'List Files in Folder',
    description: 'Get array of files in a folder matching pattern',
    category: 'file',
    difficulty: 'intermediate',
    keywords: ['file', 'list', 'folder', 'directory', 'dir'],
    code: `Public Function ListFiles(ByVal folderPath As String, Optional ByVal pattern As String = "*.*") As String()
    Dim files() As String
    Dim fileName As String
    Dim count As Long

    ReDim files(0)
    count = 0

    ' Ensure path ends with backslash
    If Right$(folderPath, 1) <> "\\" Then folderPath = folderPath & "\\"

    fileName = Dir$(folderPath & pattern)
    Do While fileName <> ""
        ReDim Preserve files(count)
        files(count) = fileName
        count = count + 1
        fileName = Dir$()
    Loop

    ListFiles = files
End Function`
  },
  {
    id: 'file-copy-folder',
    name: 'Copy Folder Contents',
    description: 'Copy all files from one folder to another',
    category: 'file',
    difficulty: 'intermediate',
    keywords: ['file', 'copy', 'folder', 'directory'],
    code: `Public Sub CopyFolder(ByVal sourceFolder As String, ByVal destFolder As String)
    Dim fileName As String

    ' Ensure paths end with backslash
    If Right$(sourceFolder, 1) <> "\\" Then sourceFolder = sourceFolder & "\\"
    If Right$(destFolder, 1) <> "\\" Then destFolder = destFolder & "\\"

    ' Create destination folder if needed
    If Dir$(destFolder, vbDirectory) = "" Then MkDir destFolder

    ' Copy all files
    fileName = Dir$(sourceFolder & "*.*")
    Do While fileName <> ""
        FileCopy sourceFolder & fileName, destFolder & fileName
        fileName = Dir$()
    Loop
End Sub`
  },

  // ============================================================================
  // Database Operations
  // ============================================================================
  {
    id: 'db-connect-access',
    name: 'Connect to Access Database',
    description: 'Connect to Microsoft Access database using DAO',
    category: 'database',
    difficulty: 'intermediate',
    keywords: ['database', 'access', 'dao', 'connect'],
    code: `' Requires reference to Microsoft DAO 3.6 Object Library
Public Function ConnectToAccess(ByVal dbPath As String) As Database
    On Error GoTo ErrorHandler

    Set ConnectToAccess = OpenDatabase(dbPath)
    Exit Function

ErrorHandler:
    Set ConnectToAccess = Nothing
    MsgBox "Database connection error: " & Err.Description, vbCritical
End Function`
  },
  {
    id: 'db-execute-query',
    name: 'Execute SQL Query',
    description: 'Execute SQL query and return recordset',
    category: 'database',
    difficulty: 'intermediate',
    keywords: ['database', 'sql', 'query', 'recordset'],
    code: `' Execute SQL SELECT and return recordset
Public Function ExecuteQuery(ByVal db As Database, ByVal sql As String) As Recordset
    On Error GoTo ErrorHandler

    Set ExecuteQuery = db.OpenRecordset(sql, dbOpenDynaset)
    Exit Function

ErrorHandler:
    Set ExecuteQuery = Nothing
    MsgBox "Query error: " & Err.Description, vbCritical
End Function

' Execute SQL INSERT/UPDATE/DELETE
Public Sub ExecuteNonQuery(ByVal db As Database, ByVal sql As String)
    On Error GoTo ErrorHandler

    db.Execute sql, dbFailOnError
    Exit Sub

ErrorHandler:
    MsgBox "Execution error: " & Err.Description, vbCritical
End Sub`
  },
  {
    id: 'db-record-to-array',
    name: 'Recordset to Array',
    description: 'Convert recordset to 2D array',
    category: 'database',
    difficulty: 'advanced',
    keywords: ['database', 'recordset', 'array', 'convert'],
    code: `Public Function RecordsetToArray(ByVal rs As Recordset) As Variant
    Dim data As Variant
    Dim rowCount As Long
    Dim colCount As Long
    Dim i As Long, j As Long

    If rs.EOF And rs.BOF Then
        RecordsetToArray = Empty
        Exit Function
    End If

    rs.MoveLast
    rowCount = rs.RecordCount
    rs.MoveFirst

    colCount = rs.Fields.Count
    ReDim data(1 To rowCount, 1 To colCount)

    i = 1
    Do While Not rs.EOF
        For j = 1 To colCount
            data(i, j) = rs.Fields(j - 1).Value
        Next j
        rs.MoveNext
        i = i + 1
    Loop

    rs.MoveFirst
    RecordsetToArray = data
End Function`
  },

  // ============================================================================
  // Forms and Controls
  // ============================================================================
  {
    id: 'frm-center-form',
    name: 'Center Form on Screen',
    description: 'Center a form on the screen',
    category: 'forms',
    difficulty: 'beginner',
    keywords: ['form', 'center', 'screen', 'position'],
    code: `Public Sub CenterForm(frm As Form)
    frm.Move (Screen.Width - frm.Width) / 2, _
             (Screen.Height - frm.Height) / 2
End Sub`
  },
  {
    id: 'frm-disable-close',
    name: 'Disable Form Close Button',
    description: 'Prevent form from closing via X button',
    category: 'forms',
    difficulty: 'beginner',
    keywords: ['form', 'close', 'disable', 'unload'],
    code: `' In form module
Private Sub Form_QueryUnload(Cancel As Integer, UnloadMode As Integer)
    If UnloadMode = vbFormControlMenu Then
        Cancel = True
        MsgBox "Please use the Exit button to close.", vbInformation
    End If
End Sub`
  },
  {
    id: 'ctl-fill-combo',
    name: 'Fill ComboBox from Array',
    description: 'Populate a ComboBox from an array',
    category: 'controls',
    difficulty: 'beginner',
    keywords: ['combo', 'combobox', 'list', 'array', 'fill'],
    code: `Public Sub FillCombo(cbo As ComboBox, items() As String, Optional clearFirst As Boolean = True)
    Dim i As Long

    If clearFirst Then cbo.Clear

    For i = LBound(items) To UBound(items)
        cbo.AddItem items(i)
    Next i

    If cbo.ListCount > 0 Then cbo.ListIndex = 0
End Sub`
  },
  {
    id: 'ctl-listview-add',
    name: 'Add Items to ListView',
    description: 'Add item with subitems to ListView',
    category: 'controls',
    difficulty: 'intermediate',
    keywords: ['listview', 'list', 'item', 'add'],
    code: `Public Sub AddListViewItem(lv As ListView, ByVal text As String, ParamArray subItems())
    Dim li As ListItem
    Dim i As Long

    Set li = lv.ListItems.Add(, , text)

    For i = LBound(subItems) To UBound(subItems)
        li.SubItems(i + 1) = CStr(subItems(i))
    Next i
End Sub

' Usage example:
' AddListViewItem ListView1, "Item 1", "SubItem 1", "SubItem 2", "SubItem 3"`
  },
  {
    id: 'ctl-treeview-add',
    name: 'Add Items to TreeView',
    description: 'Add parent and child nodes to TreeView',
    category: 'controls',
    difficulty: 'intermediate',
    keywords: ['treeview', 'tree', 'node', 'add'],
    code: `Public Function AddTreeNode(tv As TreeView, _
                              Optional ByVal parentKey As String = "", _
                              Optional ByVal key As String = "", _
                              ByVal text As String) As Node
    Dim newNode As Node

    If Len(parentKey) = 0 Then
        If Len(key) > 0 Then
            Set newNode = tv.Nodes.Add(, , key, text)
        Else
            Set newNode = tv.Nodes.Add(, , , text)
        End If
    Else
        If Len(key) > 0 Then
            Set newNode = tv.Nodes.Add(parentKey, tvwChild, key, text)
        Else
            Set newNode = tv.Nodes.Add(parentKey, tvwChild, , text)
        End If
    End If

    Set AddTreeNode = newNode
End Function`
  },

  // ============================================================================
  // Date/Time Operations
  // ============================================================================
  {
    id: 'date-age-calc',
    name: 'Calculate Age',
    description: 'Calculate age in years from birth date',
    category: 'date',
    difficulty: 'beginner',
    keywords: ['date', 'age', 'calculate', 'years'],
    code: `Public Function CalculateAge(ByVal birthDate As Date) As Long
    Dim age As Long

    age = DateDiff("yyyy", birthDate, Date)

    ' Adjust if birthday hasn't occurred this year
    If DateSerial(Year(Date), Month(birthDate), Day(birthDate)) > Date Then
        age = age - 1
    End If

    CalculateAge = age
End Function`
  },
  {
    id: 'date-business-days',
    name: 'Calculate Business Days',
    description: 'Count business days between two dates (excluding weekends)',
    category: 'date',
    difficulty: 'intermediate',
    keywords: ['date', 'business', 'days', 'weekday', 'work'],
    code: `Public Function BusinessDays(ByVal startDate As Date, ByVal endDate As Date) As Long
    Dim days As Long
    Dim currentDate As Date

    days = 0
    currentDate = startDate

    Do While currentDate <= endDate
        If Weekday(currentDate) <> vbSaturday And _
           Weekday(currentDate) <> vbSunday Then
            days = days + 1
        End If
        currentDate = currentDate + 1
    Loop

    BusinessDays = days
End Function`
  },
  {
    id: 'date-format-friendly',
    name: 'Friendly Date Format',
    description: 'Format date as "Today", "Yesterday", or date string',
    category: 'date',
    difficulty: 'beginner',
    keywords: ['date', 'format', 'friendly', 'today', 'yesterday'],
    code: `Public Function FriendlyDate(ByVal d As Date) As String
    Dim diff As Long

    diff = DateDiff("d", d, Date)

    Select Case diff
        Case 0
            FriendlyDate = "Today"
        Case 1
            FriendlyDate = "Yesterday"
        Case 2 To 6
            FriendlyDate = Format(d, "dddd")
        Case 7 To 365
            FriendlyDate = Format(d, "mmmm d")
        Case Else
            FriendlyDate = Format(d, "mmmm d, yyyy")
    End Select
End Function`
  },

  // ============================================================================
  // Math Operations
  // ============================================================================
  {
    id: 'math-round-currency',
    name: 'Round to Currency',
    description: 'Round number to 2 decimal places for currency',
    category: 'math',
    difficulty: 'beginner',
    keywords: ['math', 'round', 'currency', 'decimal'],
    code: `Public Function RoundCurrency(ByVal value As Double) As Currency
    RoundCurrency = CCur(Round(value, 2))
End Function`
  },
  {
    id: 'math-random-range',
    name: 'Random Number in Range',
    description: 'Generate random number between min and max',
    category: 'math',
    difficulty: 'beginner',
    keywords: ['math', 'random', 'range', 'number'],
    code: `Public Function RandomInRange(ByVal minValue As Long, ByVal maxValue As Long) As Long
    RandomInRange = Int((maxValue - minValue + 1) * Rnd + minValue)
End Function

' Don't forget to call Randomize once at program start!`
  },
  {
    id: 'math-percentage',
    name: 'Calculate Percentage',
    description: 'Calculate percentage of a value',
    category: 'math',
    difficulty: 'beginner',
    keywords: ['math', 'percentage', 'percent', 'calculate'],
    code: `Public Function CalculatePercentage(ByVal value As Double, ByVal total As Double) As Double
    If total = 0 Then
        CalculatePercentage = 0
    Else
        CalculatePercentage = (value / total) * 100
    End If
End Function

Public Function ApplyPercentage(ByVal value As Double, ByVal percentage As Double) As Double
    ApplyPercentage = value * (percentage / 100)
End Function`
  },

  // ============================================================================
  // Array Operations
  // ============================================================================
  {
    id: 'arr-sort',
    name: 'Sort Array',
    description: 'Sort string or numeric array (bubble sort)',
    category: 'array',
    difficulty: 'intermediate',
    keywords: ['array', 'sort', 'order'],
    code: `Public Sub SortArray(arr() As Variant, Optional ByVal ascending As Boolean = True)
    Dim i As Long, j As Long
    Dim temp As Variant

    For i = LBound(arr) To UBound(arr) - 1
        For j = i + 1 To UBound(arr)
            If ascending Then
                If arr(i) > arr(j) Then
                    temp = arr(i)
                    arr(i) = arr(j)
                    arr(j) = temp
                End If
            Else
                If arr(i) < arr(j) Then
                    temp = arr(i)
                    arr(i) = arr(j)
                    arr(j) = temp
                End If
            End If
        Next j
    Next i
End Sub`
  },
  {
    id: 'arr-search',
    name: 'Search Array',
    description: 'Find index of value in array',
    category: 'array',
    difficulty: 'beginner',
    keywords: ['array', 'search', 'find', 'index'],
    code: `Public Function ArrayIndexOf(arr() As Variant, ByVal searchValue As Variant) As Long
    Dim i As Long

    For i = LBound(arr) To UBound(arr)
        If arr(i) = searchValue Then
            ArrayIndexOf = i
            Exit Function
        End If
    Next i

    ArrayIndexOf = -1 ' Not found
End Function`
  },
  {
    id: 'arr-remove',
    name: 'Remove Array Element',
    description: 'Remove element from array by index',
    category: 'array',
    difficulty: 'intermediate',
    keywords: ['array', 'remove', 'delete', 'element'],
    code: `Public Sub RemoveArrayElement(arr() As Variant, ByVal index As Long)
    Dim i As Long

    If index < LBound(arr) Or index > UBound(arr) Then Exit Sub

    For i = index To UBound(arr) - 1
        arr(i) = arr(i + 1)
    Next i

    ReDim Preserve arr(LBound(arr) To UBound(arr) - 1)
End Sub`
  },

  // ============================================================================
  // Windows API
  // ============================================================================
  {
    id: 'api-msgbox-sound',
    name: 'Play System Sound',
    description: 'Play Windows system sounds',
    category: 'api',
    difficulty: 'intermediate',
    keywords: ['api', 'sound', 'beep', 'windows'],
    code: `Private Declare Function MessageBeep Lib "user32" (ByVal wType As Long) As Long

Public Const MB_OK = &H0
Public Const MB_ICONERROR = &H10
Public Const MB_ICONQUESTION = &H20
Public Const MB_ICONEXCLAMATION = &H30
Public Const MB_ICONINFORMATION = &H40

Public Sub PlaySystemSound(ByVal soundType As Long)
    MessageBeep soundType
End Sub

' Usage:
' PlaySystemSound MB_ICONINFORMATION`
  },
  {
    id: 'api-sleep',
    name: 'Sleep Function',
    description: 'Pause execution for specified milliseconds',
    category: 'api',
    difficulty: 'beginner',
    keywords: ['api', 'sleep', 'pause', 'wait', 'delay'],
    code: `Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)

Public Sub Pause(ByVal milliseconds As Long)
    Sleep milliseconds
End Sub

' Usage:
' Pause 1000 ' Pause for 1 second`
  },
  {
    id: 'api-get-username',
    name: 'Get Windows Username',
    description: 'Get current Windows username',
    category: 'api',
    difficulty: 'intermediate',
    keywords: ['api', 'username', 'user', 'windows'],
    code: `Private Declare Function GetUserName Lib "advapi32.dll" _
    Alias "GetUserNameA" (ByVal lpBuffer As String, nSize As Long) As Long

Public Function GetWindowsUserName() As String
    Dim buffer As String
    Dim bufferSize As Long

    bufferSize = 256
    buffer = Space$(bufferSize)

    If GetUserName(buffer, bufferSize) <> 0 Then
        GetWindowsUserName = Left$(buffer, bufferSize - 1)
    Else
        GetWindowsUserName = ""
    End If
End Function`
  },
  {
    id: 'api-computer-name',
    name: 'Get Computer Name',
    description: 'Get Windows computer name',
    category: 'api',
    difficulty: 'intermediate',
    keywords: ['api', 'computer', 'name', 'windows'],
    code: `Private Declare Function GetComputerName Lib "kernel32" _
    Alias "GetComputerNameA" (ByVal lpBuffer As String, nSize As Long) As Long

Public Function GetWindowsComputerName() As String
    Dim buffer As String
    Dim bufferSize As Long

    bufferSize = 256
    buffer = Space$(bufferSize)

    If GetComputerName(buffer, bufferSize) <> 0 Then
        GetWindowsComputerName = Left$(buffer, bufferSize)
    Else
        GetWindowsComputerName = ""
    End If
End Function`
  },

  // ============================================================================
  // Error Handling
  // ============================================================================
  {
    id: 'err-handler-template',
    name: 'Error Handler Template',
    description: 'Standard error handling template for procedures',
    category: 'error',
    difficulty: 'beginner',
    keywords: ['error', 'handler', 'template', 'on error'],
    code: `Public Sub ProcedureName()
    On Error GoTo ErrorHandler

    ' Your code here

    Exit Sub

ErrorHandler:
    MsgBox "Error " & Err.Number & ": " & Err.Description, _
           vbCritical, "Error in ProcedureName"
End Sub`
  },
  {
    id: 'err-log-file',
    name: 'Log Errors to File',
    description: 'Log error information to a text file',
    category: 'error',
    difficulty: 'intermediate',
    keywords: ['error', 'log', 'file', 'debug'],
    code: `Public Sub LogError(ByVal procName As String, ByVal errNum As Long, ByVal errDesc As String)
    Dim fileNum As Integer
    Dim logPath As String

    logPath = App.Path & "\\error.log"
    fileNum = FreeFile

    On Error Resume Next
    Open logPath For Append As #fileNum
    Print #fileNum, Format$(Now, "yyyy-mm-dd hh:nn:ss") & " | " & _
                    procName & " | Error " & errNum & ": " & errDesc
    Close #fileNum
End Sub

' Usage in error handler:
' ErrorHandler:
'     LogError "ProcedureName", Err.Number, Err.Description`
  },

  // ============================================================================
  // Registry Operations
  // ============================================================================
  {
    id: 'reg-save-setting',
    name: 'Save Setting to Registry',
    description: 'Save application setting to registry',
    category: 'registry',
    difficulty: 'beginner',
    keywords: ['registry', 'save', 'setting', 'config'],
    code: `Public Sub SaveAppSetting(ByVal section As String, ByVal key As String, ByVal value As String)
    SaveSetting App.Title, section, key, value
End Sub

Public Function GetAppSetting(ByVal section As String, ByVal key As String, _
                               Optional ByVal defaultValue As String = "") As String
    GetAppSetting = GetSetting(App.Title, section, key, defaultValue)
End Function

' Usage:
' SaveAppSetting "Window", "Left", CStr(Me.Left)
' Me.Left = CLng(GetAppSetting("Window", "Left", "0"))`
  },

  // ============================================================================
  // Utility Functions
  // ============================================================================
  {
    id: 'util-is-running',
    name: 'Check If App Already Running',
    description: 'Check if application instance is already running',
    category: 'utility',
    difficulty: 'intermediate',
    keywords: ['running', 'instance', 'app', 'check'],
    code: `Public Function IsAppRunning(ByVal appTitle As String) As Boolean
    Dim prevHwnd As Long

    prevHwnd = FindWindow(vbNullString, appTitle)
    IsAppRunning = (prevHwnd <> 0)
End Function

' Add this declaration at module level:
' Private Declare Function FindWindow Lib "user32" Alias "FindWindowA" _
'     (ByVal lpClassName As String, ByVal lpWindowName As String) As Long

' Usage in Sub Main:
' If IsAppRunning(App.Title) Then
'     MsgBox "Application is already running!", vbExclamation
'     End
' End If`
  },
  {
    id: 'util-input-validation',
    name: 'Input Validation Functions',
    description: 'Common input validation functions',
    category: 'utility',
    difficulty: 'beginner',
    keywords: ['validation', 'input', 'check', 'validate'],
    code: `Public Function IsValidEmail(ByVal email As String) As Boolean
    Dim atPos As Long
    Dim dotPos As Long

    atPos = InStr(email, "@")
    If atPos = 0 Or atPos = 1 Or atPos = Len(email) Then
        IsValidEmail = False
        Exit Function
    End If

    dotPos = InStrRev(email, ".")
    If dotPos = 0 Or dotPos < atPos + 2 Or dotPos = Len(email) Then
        IsValidEmail = False
        Exit Function
    End If

    IsValidEmail = True
End Function

Public Function IsValidPhone(ByVal phone As String) As Boolean
    Dim digits As String
    digits = Replace(Replace(Replace(Replace(phone, "-", ""), "(", ""), ")", ""), " ", "")
    IsValidPhone = (Len(digits) = 10 And IsNumeric(digits))
End Function

Public Function IsRequired(ByVal value As String) As Boolean
    IsRequired = (Len(Trim$(value)) > 0)
End Function`
  },
  {
    id: 'util-format-bytes',
    name: 'Format Bytes',
    description: 'Format byte size to human readable format',
    category: 'utility',
    difficulty: 'beginner',
    keywords: ['format', 'bytes', 'size', 'file'],
    code: `Public Function FormatBytes(ByVal bytes As Double) As String
    Const KB As Double = 1024
    Const MB As Double = KB * 1024
    Const GB As Double = MB * 1024
    Const TB As Double = GB * 1024

    If bytes >= TB Then
        FormatBytes = Format$(bytes / TB, "#,##0.00") & " TB"
    ElseIf bytes >= GB Then
        FormatBytes = Format$(bytes / GB, "#,##0.00") & " GB"
    ElseIf bytes >= MB Then
        FormatBytes = Format$(bytes / MB, "#,##0.00") & " MB"
    ElseIf bytes >= KB Then
        FormatBytes = Format$(bytes / KB, "#,##0.00") & " KB"
    Else
        FormatBytes = Format$(bytes, "#,##0") & " bytes"
    End If
End Function`
  }
];

// ============================================================================
// Snippet Manager
// ============================================================================

export class VB6SnippetManager {
  private snippets: Map<string, CodeSnippet> = new Map();

  constructor() {
    for (const snippet of VB6_CODE_SNIPPETS) {
      this.snippets.set(snippet.id, snippet);
    }
  }

  /**
   * Get all snippets
   */
  getAllSnippets(): CodeSnippet[] {
    return Array.from(this.snippets.values());
  }

  /**
   * Get snippets by category
   */
  getByCategory(category: SnippetCategory): CodeSnippet[] {
    return this.getAllSnippets().filter(s => s.category === category);
  }

  /**
   * Get snippet by ID
   */
  getSnippet(id: string): CodeSnippet | undefined {
    return this.snippets.get(id);
  }

  /**
   * Search snippets by keyword
   */
  search(query: string): CodeSnippet[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSnippets().filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.keywords.some(k => k.includes(lowerQuery)) ||
      s.code.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all categories
   */
  getCategories(): SnippetCategory[] {
    const categories = new Set<SnippetCategory>();
    for (const snippet of this.snippets.values()) {
      categories.add(snippet.category);
    }
    return Array.from(categories);
  }

  /**
   * Add custom snippet
   */
  addSnippet(snippet: CodeSnippet): void {
    this.snippets.set(snippet.id, snippet);
  }

  /**
   * Remove snippet
   */
  removeSnippet(id: string): boolean {
    return this.snippets.delete(id);
  }
}

// ============================================================================
// Global Instance
// ============================================================================

export const snippetManager = new VB6SnippetManager();

// ============================================================================
// Export
// ============================================================================

export default {
  VB6_CODE_SNIPPETS,
  VB6SnippetManager,
  snippetManager
};
