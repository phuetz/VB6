/* eslint-disable no-useless-escape -- VB6 code samples contain backslash operators */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VB6Compiler } from '../../services/VB6Compiler';
import { VB6Lexer } from '../../utils/vb6Lexer';
import { VB6Parser } from '../../utils/vb6Parser';
import { VB6SemanticAnalyzer } from '../../utils/vb6SemanticAnalyzer';
import { VB6Transpiler } from '../../utils/vb6Transpiler';

/**
 * Suite de tests d'intégration complète pour le compilateur VB6
 * Tests exhaustifs de tous les composants et de leur interaction
 *
 * OBJECTIFS:
 * - Vérifier l'intégration complète lexer -> parser -> analyzer -> transpiler
 * - Tester 5 programmes VB6 de référence
 * - Tester toutes les constructions VB6 critiques
 * - Benchmarks de performance
 * - Coverage >85%
 */

describe('VB6 Compiler Integration Tests - Phase 3', () => {
  let compiler: VB6Compiler;
  let performanceMetrics: any = {};

  beforeEach(() => {
    compiler = new VB6Compiler();
    performanceMetrics = {
      startTime: performance.now(),
      memoryBefore: (performance as any).memory?.usedJSHeapSize || 0,
    };
  });

  afterEach(() => {
    const endTime = performance.now();
    performanceMetrics.duration = endTime - performanceMetrics.startTime;
    performanceMetrics.memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
  });

  describe('Programme de Référence #1: Calculatrice Complète', () => {
    const calculatorProgram = `
Option Explicit

' Module Calculator - Calculatrice VB6 Complète
Private Declare Function GetTickCount Lib "kernel32" () As Long

Public Enum OperationType
    Addition = 1
    Subtraction = 2
    Multiplication = 3
    Division = 4
    Power = 5
    Modulus = 6
End Enum

Public Type CalculatorState
    CurrentValue As Double
    PreviousValue As Double
    Operation As OperationType
    IsNewNumber As Boolean
    History(1 To 100) As String
    HistoryCount As Integer
End Type

Private State As CalculatorState

Public Sub InitializeCalculator()
    State.CurrentValue = 0
    State.PreviousValue = 0
    State.Operation = 0
    State.IsNewNumber = True
    State.HistoryCount = 0
End Sub

Public Function Calculate(ByVal num1 As Double, ByVal num2 As Double, ByVal op As OperationType) As Double
    Dim result As Double
    Dim startTime As Long
    startTime = GetTickCount()
    
    Select Case op
        Case OperationType.Addition
            result = num1 + num2
        Case OperationType.Subtraction
            result = num1 - num2
        Case OperationType.Multiplication
            result = num1 * num2
        Case OperationType.Division
            If num2 = 0 Then
                Err.Raise 11, "Calculator", "Division by zero"
            End If
            result = num1 / num2
        Case OperationType.Power
            result = num1 ^ num2
        Case OperationType.Modulus
            result = num1 Mod num2
        Case Else
            Err.Raise 5, "Calculator", "Invalid operation"
    End Select
    
    AddToHistory num1, num2, op, result
    Calculate = result
End Function

Private Sub AddToHistory(num1 As Double, num2 As Double, op As OperationType, result As Double)
    If State.HistoryCount < 100 Then
        State.HistoryCount = State.HistoryCount + 1
        State.History(State.HistoryCount) = FormatNumber(num1, 2) & " " & GetOperatorSymbol(op) & " " & FormatNumber(num2, 2) & " = " & FormatNumber(result, 2)
    End If
End Sub

Private Function GetOperatorSymbol(op As OperationType) As String
    Select Case op
        Case OperationType.Addition: GetOperatorSymbol = "+"
        Case OperationType.Subtraction: GetOperatorSymbol = "-"
        Case OperationType.Multiplication: GetOperatorSymbol = "*"
        Case OperationType.Division: GetOperatorSymbol = "/"
        Case OperationType.Power: GetOperatorSymbol = "^"
        Case OperationType.Modulus: GetOperatorSymbol = "Mod"
    End Select
End Function

Public Function GetHistory() As String()
    Dim result() As String
    ReDim result(1 To State.HistoryCount)
    Dim i As Integer
    For i = 1 To State.HistoryCount
        result(i) = State.History(i)
    Next i
    GetHistory = result
End Function
`;

    it('should compile calculator program successfully', () => {
      const result = compiler.compile(calculatorProgram);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.transpiledCode).toBeDefined();
      expect(result.transpiledCode.length).toBeGreaterThan(0);
    });

    it('should handle all calculator operations', () => {
      const result = compiler.compile(calculatorProgram);
      expect(result.success).toBe(true);

      // Vérifier que toutes les opérations sont correctement transpilées
      const code = result.transpiledCode;
      expect(code).toContain('Addition');
      expect(code).toContain('Subtraction');
      expect(code).toContain('Multiplication');
      expect(code).toContain('Division');
      expect(code).toContain('Power');
      expect(code).toContain('Modulus');
    });

    it('should handle error conditions properly', () => {
      const result = compiler.compile(calculatorProgram);
      expect(result.success).toBe(true);

      // Vérifier la gestion d'erreur division par zéro
      const code = result.transpiledCode;
      expect(code).toContain('Division by zero');
      expect(code).toContain('Err.Raise');
    });
  });

  describe('Programme de Référence #2: Gestion de Base de Données', () => {
    const databaseProgram = `
Option Explicit

' Module DatabaseManager - Gestion complète BDD
Dim cn As ADODB.Connection
Dim rs As ADODB.Recordset

Public Type CustomerRecord
    ID As Long
    Name As String * 50
    Email As String * 100
    Phone As String * 20
    CreatedDate As Date
    IsActive As Boolean
End Type

Public Function ConnectToDatabase(ByVal connectionString As String) As Boolean
    On Error GoTo ErrorHandler
    
    Set cn = New ADODB.Connection
    cn.Open connectionString
    
    If cn.State = adStateOpen Then
        ConnectToDatabase = True
    Else
        ConnectToDatabase = False
    End If
    Exit Function
    
ErrorHandler:
    ConnectToDatabase = False
    If Not cn Is Nothing Then cn.Close
End Function

Public Function GetCustomers() As CustomerRecord()
    Dim customers() As CustomerRecord
    Dim count As Integer
    Dim i As Integer
    
    On Error GoTo ErrorHandler
    
    Set rs = New ADODB.Recordset
    rs.Open "SELECT * FROM Customers ORDER BY Name", cn, adOpenStatic, adLockReadOnly
    
    If Not rs.EOF Then
        count = rs.RecordCount
        ReDim customers(1 To count)
        
        rs.MoveFirst
        i = 1
        Do While Not rs.EOF
            customers(i).ID = rs("ID")
            customers(i).Name = rs("Name")
            customers(i).Email = rs("Email")
            customers(i).Phone = rs("Phone")
            customers(i).CreatedDate = rs("CreatedDate")
            customers(i).IsActive = rs("IsActive")
            i = i + 1
            rs.MoveNext
        Loop
    End If
    
    rs.Close
    GetCustomers = customers
    Exit Function
    
ErrorHandler:
    If Not rs Is Nothing Then rs.Close
    ReDim customers(0)
    GetCustomers = customers
End Function

Public Function AddCustomer(ByRef customer As CustomerRecord) As Boolean
    Dim sql As String
    On Error GoTo ErrorHandler
    
    sql = "INSERT INTO Customers (Name, Email, Phone, CreatedDate, IsActive) VALUES ('"
    sql = sql & Replace(customer.Name, "'", "''") & "', '"
    sql = sql & Replace(customer.Email, "'", "''") & "', '"
    sql = sql & Replace(customer.Phone, "'", "''") & "', #"
    sql = sql & Format(customer.CreatedDate, "mm/dd/yyyy") & "#, "
    sql = sql & IIf(customer.IsActive, "True", "False") & ")"
    
    cn.Execute sql
    AddCustomer = True
    Exit Function
    
ErrorHandler:
    AddCustomer = False
End Function

Public Sub DisconnectFromDatabase()
    If Not cn Is Nothing Then
        If cn.State = adStateOpen Then cn.Close
        Set cn = Nothing
    End If
    If Not rs Is Nothing Then Set rs = Nothing
End Sub
`;

    it('should compile database program successfully', () => {
      const result = compiler.compile(databaseProgram);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.transpiledCode).toBeDefined();
    });

    it('should handle ADO objects correctly', () => {
      const result = compiler.compile(databaseProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('ADODB.Connection');
      expect(code).toContain('ADODB.Recordset');
      expect(code).toContain('adStateOpen');
      expect(code).toContain('adOpenStatic');
    });

    it('should handle user-defined types', () => {
      const result = compiler.compile(databaseProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('CustomerRecord');
    });
  });

  describe('Programme de Référence #3: Interface Utilisateur Complexe', () => {
    const uiProgram = `
Option Explicit

' Module UIManager - Interface utilisateur complexe
Private WithEvents Timer1 As Timer
Private WithEvents Form1 As Form

Public Enum FormState
    Initializing = 0
    Ready = 1
    Processing = 2
    Error = 3
End Enum

Private CurrentState As FormState
Private Controls As Collection

Public Sub InitializeUI()
    Set Controls = New Collection
    CurrentState = FormState.Initializing
    
    ' Créer les contrôles dynamiquement
    CreateDynamicControls
    
    ' Configurer les events
    ConfigureEvents
    
    CurrentState = FormState.Ready
End Sub

Private Sub CreateDynamicControls()
    Dim i As Integer
    Dim btn As CommandButton
    Dim txt As TextBox
    Dim lbl As Label
    
    For i = 1 To 10
        ' Créer bouton
        Set btn = Controls.Add("VB.CommandButton", "btn" & i)
        With btn
            .Left = 100 + (i - 1) * 120
            .Top = 100
            .Width = 100
            .Height = 30
            .Caption = "Button " & i
            .Visible = True
        End With
        Controls.Add btn, "Button" & i
        
        ' Créer textbox
        Set txt = Controls.Add("VB.TextBox", "txt" & i)
        With txt
            .Left = 100 + (i - 1) * 120
            .Top = 150
            .Width = 100
            .Height = 20
            .Text = "Text " & i
            .Visible = True
        End With
        Controls.Add txt, "TextBox" & i
        
        ' Créer label
        Set lbl = Controls.Add("VB.Label", "lbl" & i)
        With lbl
            .Left = 100 + (i - 1) * 120
            .Top = 180
            .Width = 100
            .Height = 15
            .Caption = "Label " & i
            .Visible = True
        End With
        Controls.Add lbl, "Label" & i
    Next i
End Sub

Private Sub ConfigureEvents()
    Dim ctrl As Control
    For Each ctrl In Controls
        If TypeOf ctrl Is CommandButton Then
            ' Associer événement click
            AddHandler ctrl, "Click", "HandleButtonClick"
        ElseIf TypeOf ctrl Is TextBox Then
            ' Associer événements change et keypress
            AddHandler ctrl, "Change", "HandleTextChange"
            AddHandler ctrl, "KeyPress", "HandleKeyPress"
        End If
    Next ctrl
End Sub

Private Sub HandleButtonClick(sender As Object, e As EventArgs)
    Dim btn As CommandButton
    Set btn = sender
    
    CurrentState = FormState.Processing
    
    ' Animation du bouton
    AnimateButton btn
    
    ' Traitement
    ProcessButtonAction btn.Tag
    
    CurrentState = FormState.Ready
End Sub

Private Sub AnimateButton(btn As CommandButton)
    Dim originalColor As Long
    originalColor = btn.BackColor
    
    ' Animation flash
    btn.BackColor = vbYellow
    DoEvents
    Sleep 100
    btn.BackColor = originalColor
End Sub

Private Sub ProcessButtonAction(action As String)
    Select Case action
        Case "Save"
            SaveData
        Case "Load"
            LoadData
        Case "Clear"
            ClearData
        Case "Exit"
            UnloadForm
        Case Else
            MsgBox "Unknown action: " & action, vbInformation
    End Select
End Sub

Private Sub Timer1_Timer()
    Static counter As Long
    counter = counter + 1
    
    ' Mise à jour interface toutes les secondes
    UpdateStatusBar "Timer tick: " & counter
    
    ' Vérification mémoire
    If counter Mod 60 = 0 Then
        CheckMemoryUsage
    End If
End Sub

Private Sub CheckMemoryUsage()
    Dim memUsage As Long
    memUsage = GetProcessMemoryUsage()
    
    If memUsage > 50000000 Then ' 50MB
        MsgBox "High memory usage detected: " & Format(memUsage / 1024 / 1024, "0.0") & " MB", vbWarning
        CollectGarbage
    End If
End Sub

Private Sub CollectGarbage()
    Dim ctrl As Control
    For Each ctrl In Controls
        Set ctrl = Nothing
    Next ctrl
    Set Controls = New Collection
    CreateDynamicControls
End Sub
`;

    it('should compile UI program successfully', () => {
      const result = compiler.compile(uiProgram);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle WithEvents declarations', () => {
      const result = compiler.compile(uiProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('WithEvents');
    });

    it('should handle dynamic control creation', () => {
      const result = compiler.compile(uiProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('Controls.Add');
      expect(code).toContain('CommandButton');
      expect(code).toContain('TextBox');
    });
  });

  describe('Programme de Référence #4: Traitement de Fichiers', () => {
    const fileProcessingProgram = `
Option Explicit

' Module FileProcessor - Traitement avancé de fichiers
Private Const BUFFER_SIZE As Long = 8192

Public Enum FileFormat
    PlainText = 1
    CSV = 2
    XML = 3
    JSON = 4
    Binary = 5
End Enum

Public Type FileInfo
    FileName As String
    FilePath As String
    FileSize As Long
    CreatedDate As Date
    ModifiedDate As Date
    Format As FileFormat
    Encoding As String
End Type

Public Function ProcessFile(ByVal filePath As String, ByVal outputPath As String) As Boolean
    Dim fileInfo As FileInfo
    Dim success As Boolean
    
    On Error GoTo ErrorHandler
    
    ' Analyser le fichier
    fileInfo = AnalyzeFile(filePath)
    
    ' Traiter selon le format
    Select Case fileInfo.Format
        Case FileFormat.PlainText
            success = ProcessTextFile(filePath, outputPath)
        Case FileFormat.CSV
            success = ProcessCSVFile(filePath, outputPath)
        Case FileFormat.XML
            success = ProcessXMLFile(filePath, outputPath)
        Case FileFormat.JSON
            success = ProcessJSONFile(filePath, outputPath)
        Case FileFormat.Binary
            success = ProcessBinaryFile(filePath, outputPath)
        Case Else
            success = False
    End Select
    
    ProcessFile = success
    Exit Function
    
ErrorHandler:
    ProcessFile = False
End Function

Private Function AnalyzeFile(ByVal filePath As String) As FileInfo
    Dim info As FileInfo
    Dim fso As Object
    Dim file As Object
    Dim extension As String
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set file = fso.GetFile(filePath)
    
    With info
        .FileName = file.Name
        .FilePath = filePath
        .FileSize = file.Size
        .CreatedDate = file.DateCreated
        .ModifiedDate = file.DateLastModified
        
        ' Déterminer le format
        extension = LCase(fso.GetExtensionName(filePath))
        Select Case extension
            Case "txt", "log"
                .Format = FileFormat.PlainText
            Case "csv"
                .Format = FileFormat.CSV
            Case "xml"
                .Format = FileFormat.XML
            Case "json"
                .Format = FileFormat.JSON
            Case Else
                .Format = FileFormat.Binary
        End Select
        
        ' Détecter l'encodage
        .Encoding = DetectEncoding(filePath)
    End With
    
    AnalyzeFile = info
End Function

Private Function DetectEncoding(ByVal filePath As String) As String
    Dim fileNum As Integer
    Dim buffer() As Byte
    Dim encoding As String
    
    fileNum = FreeFile
    Open filePath For Binary Access Read As fileNum
    
    If LOF(fileNum) >= 3 Then
        ReDim buffer(0 To 2)
        Get fileNum, 1, buffer
        
        ' Vérifier BOM UTF-8
        If buffer(0) = &HEF And buffer(1) = &HBB And buffer(2) = &HBF Then
            encoding = "UTF-8"
        ' Vérifier BOM UTF-16 LE
        ElseIf buffer(0) = &HFF And buffer(1) = &HFE Then
            encoding = "UTF-16LE"
        ' Vérifier BOM UTF-16 BE
        ElseIf buffer(0) = &HFE And buffer(1) = &HFF Then
            encoding = "UTF-16BE"
        Else
            encoding = "ANSI"
        End If
    Else
        encoding = "ANSI"
    End If
    
    Close fileNum
    DetectEncoding = encoding
End Function

Private Function ProcessTextFile(ByVal inputPath As String, ByVal outputPath As String) As Boolean
    Dim inputFile As Integer, outputFile As Integer
    Dim line As String
    Dim lineCount As Long
    Dim processedCount As Long
    
    On Error GoTo ErrorHandler
    
    inputFile = FreeFile
    outputFile = FreeFile
    
    Open inputPath For Input As inputFile
    Open outputPath For Output As outputFile
    
    Do While Not EOF(inputFile)
        Line Input #inputFile, line
        lineCount = lineCount + 1
        
        ' Traitement de la ligne
        line = ProcessTextLine(line, lineCount)
        
        If Len(line) > 0 Then
            Print #outputFile, line
            processedCount = processedCount + 1
        End If
        
        ' Feedback utilisateur tous les 1000 lignes
        If lineCount Mod 1000 = 0 Then
            DoEvents
        End If
    Loop
    
    Close inputFile
    Close outputFile
    
    ProcessTextFile = True
    Exit Function
    
ErrorHandler:
    If inputFile > 0 Then Close inputFile
    If outputFile > 0 Then Close outputFile
    ProcessTextFile = False
End Function

Private Function ProcessTextLine(ByVal line As String, ByVal lineNumber As Long) As String
    Dim processedLine As String
    
    ' Nettoyer la ligne
    processedLine = Trim(line)
    
    ' Supprimer les lignes vides
    If Len(processedLine) = 0 Then
        ProcessTextLine = ""
        Exit Function
    End If
    
    ' Supprimer les commentaires
    If Left(processedLine, 1) = "#" Or Left(processedLine, 2) = "//" Then
        ProcessTextLine = ""
        Exit Function
    End If
    
    ' Préfixer avec numéro de ligne
    processedLine = Format(lineNumber, "00000") & ": " & processedLine
    
    ProcessTextLine = processedLine
End Function

Private Function ProcessCSVFile(ByVal inputPath As String, ByVal outputPath As String) As Boolean
    Dim data As Variant
    Dim rows As Long, cols As Long
    Dim i As Long, j As Long
    Dim outputData() As String
    
    On Error GoTo ErrorHandler
    
    ' Charger les données CSV
    data = LoadCSVData(inputPath)
    rows = UBound(data, 1)
    cols = UBound(data, 2)
    
    ' Traiter les données
    ReDim outputData(1 To rows, 1 To cols + 1) ' Colonne supplémentaire pour ID
    
    For i = 1 To rows
        outputData(i, 1) = i ' ID ligne
        For j = 1 To cols
            outputData(i, j + 1) = ProcessCSVField(CStr(data(i, j)))
        Next j
    Next i
    
    ' Sauvegarder les données traitées
    ProcessCSVFile = SaveCSVData(outputPath, outputData)
    Exit Function
    
ErrorHandler:
    ProcessCSVFile = False
End Function

Private Function LoadCSVData(ByVal filePath As String) As Variant
    ' Implémentation simplifiée - à compléter selon besoins
    Dim data() As String
    ReDim data(1 To 1, 1 To 1)
    data(1, 1) = "Sample Data"
    LoadCSVData = data
End Function

Private Function ProcessCSVField(ByVal field As String) As String
    ' Traitement spécifique des champs CSV
    ProcessCSVField = UCase(Trim(field))
End Function

Private Function SaveCSVData(ByVal filePath As String, ByRef data() As String) As Boolean
    ' Implémentation de sauvegarde CSV
    SaveCSVData = True
End Function
`;

    it('should compile file processing program successfully', () => {
      const result = compiler.compile(fileProcessingProgram);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle file operations correctly', () => {
      const result = compiler.compile(fileProcessingProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('Open');
      expect(code).toContain('Close');
      expect(code).toContain('FreeFile');
      expect(code).toContain('Line Input');
    });

    it('should handle FileSystemObject integration', () => {
      const result = compiler.compile(fileProcessingProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('Scripting.FileSystemObject');
      expect(code).toContain('CreateObject');
    });
  });

  describe('Programme de Référence #5: Algorithmes et Structures de Données', () => {
    const algorithmsProgram = `
Option Explicit

' Module Algorithms - Algorithmes et structures de données avancées

Public Type ListNode
    Data As Variant
    NextNode As Long
End Type

Public Type LinkedList
    Nodes() As ListNode
    Head As Long
    Tail As Long
    Count As Long
    FreeIndex As Long
End Type

Public Type BinaryTreeNode
    Data As Variant
    LeftChild As Long
    RightChild As Long
    Parent As Long
End Type

Public Type BinaryTree
    Nodes() As BinaryTreeNode
    Root As Long
    Count As Long
    FreeIndex As Long
End Type

' Implémentation LinkedList
Public Function CreateLinkedList() As LinkedList
    Dim list As LinkedList
    ReDim list.Nodes(1 To 1000)
    list.Head = 0
    list.Tail = 0
    list.Count = 0
    list.FreeIndex = 1
    CreateLinkedList = list
End Function

Public Sub LinkedList_Add(ByRef list As LinkedList, ByVal data As Variant)
    Dim newIndex As Long
    newIndex = list.FreeIndex
    
    If newIndex > UBound(list.Nodes) Then
        ' Redimensionner si nécessaire
        ReDim Preserve list.Nodes(1 To UBound(list.Nodes) * 2)
    End If
    
    With list.Nodes(newIndex)
        .Data = data
        .NextNode = 0
    End With
    
    If list.Head = 0 Then
        list.Head = newIndex
        list.Tail = newIndex
    Else
        list.Nodes(list.Tail).NextNode = newIndex
        list.Tail = newIndex
    End If
    
    list.Count = list.Count + 1
    list.FreeIndex = list.FreeIndex + 1
End Sub

Public Function LinkedList_Find(ByRef list As LinkedList, ByVal data As Variant) As Long
    Dim current As Long
    current = list.Head
    
    Do While current <> 0
        If list.Nodes(current).Data = data Then
            LinkedList_Find = current
            Exit Function
        End If
        current = list.Nodes(current).NextNode
    Loop
    
    LinkedList_Find = 0
End Function

Public Sub LinkedList_Remove(ByRef list As LinkedList, ByVal data As Variant)
    Dim current As Long, previous As Long
    current = list.Head
    previous = 0
    
    Do While current <> 0
        If list.Nodes(current).Data = data Then
            If previous = 0 Then
                list.Head = list.Nodes(current).NextNode
            Else
                list.Nodes(previous).NextNode = list.Nodes(current).NextNode
            End If
            
            If current = list.Tail Then
                list.Tail = previous
            End If
            
            list.Count = list.Count - 1
            Exit Sub
        End If
        previous = current
        current = list.Nodes(current).NextNode
    Loop
End Sub

' Implémentation BinaryTree
Public Function CreateBinaryTree() As BinaryTree
    Dim tree As BinaryTree
    ReDim tree.Nodes(1 To 1000)
    tree.Root = 0
    tree.Count = 0
    tree.FreeIndex = 1
    CreateBinaryTree = tree
End Function

Public Sub BinaryTree_Insert(ByRef tree As BinaryTree, ByVal data As Variant)
    Dim newIndex As Long
    newIndex = tree.FreeIndex
    
    If newIndex > UBound(tree.Nodes) Then
        ReDim Preserve tree.Nodes(1 To UBound(tree.Nodes) * 2)
    End If
    
    With tree.Nodes(newIndex)
        .Data = data
        .LeftChild = 0
        .RightChild = 0
        .Parent = 0
    End With
    
    If tree.Root = 0 Then
        tree.Root = newIndex
    Else
        BinaryTree_InsertRecursive tree, tree.Root, newIndex, data
    End If
    
    tree.Count = tree.Count + 1
    tree.FreeIndex = tree.FreeIndex + 1
End Sub

Private Sub BinaryTree_InsertRecursive(ByRef tree As BinaryTree, ByVal currentIndex As Long, ByVal newIndex As Long, ByVal data As Variant)
    If data < tree.Nodes(currentIndex).Data Then
        If tree.Nodes(currentIndex).LeftChild = 0 Then
            tree.Nodes(currentIndex).LeftChild = newIndex
            tree.Nodes(newIndex).Parent = currentIndex
        Else
            BinaryTree_InsertRecursive tree, tree.Nodes(currentIndex).LeftChild, newIndex, data
        End If
    Else
        If tree.Nodes(currentIndex).RightChild = 0 Then
            tree.Nodes(currentIndex).RightChild = newIndex
            tree.Nodes(newIndex).Parent = currentIndex
        Else
            BinaryTree_InsertRecursive tree, tree.Nodes(currentIndex).RightChild, newIndex, data
        End If
    End If
End Sub

Public Function BinaryTree_Search(ByRef tree As BinaryTree, ByVal data As Variant) As Long
    BinaryTree_Search = BinaryTree_SearchRecursive(tree, tree.Root, data)
End Function

Private Function BinaryTree_SearchRecursive(ByRef tree As BinaryTree, ByVal currentIndex As Long, ByVal data As Variant) As Long
    If currentIndex = 0 Then
        BinaryTree_SearchRecursive = 0
        Exit Function
    End If
    
    If tree.Nodes(currentIndex).Data = data Then
        BinaryTree_SearchRecursive = currentIndex
    ElseIf data < tree.Nodes(currentIndex).Data Then
        BinaryTree_SearchRecursive = BinaryTree_SearchRecursive(tree, tree.Nodes(currentIndex).LeftChild, data)
    Else
        BinaryTree_SearchRecursive = BinaryTree_SearchRecursive(tree, tree.Nodes(currentIndex).RightChild, data)
    End If
End Function

' Algorithmes de tri
Public Sub QuickSort(ByRef arr() As Variant, ByVal low As Long, ByVal high As Long)
    If low < high Then
        Dim pi As Long
        pi = Partition(arr, low, high)
        
        QuickSort arr, low, pi - 1
        QuickSort arr, pi + 1, high
    End If
End Sub

Private Function Partition(ByRef arr() As Variant, ByVal low As Long, ByVal high As Long) As Long
    Dim pivot As Variant
    Dim i As Long, j As Long
    
    pivot = arr(high)
    i = low - 1
    
    For j = low To high - 1
        If arr(j) <= pivot Then
            i = i + 1
            SwapElements arr, i, j
        End If
    Next j
    
    SwapElements arr, i + 1, high
    Partition = i + 1
End Function

Private Sub SwapElements(ByRef arr() As Variant, ByVal i As Long, ByVal j As Long)
    Dim temp As Variant
    temp = arr(i)
    arr(i) = arr(j)
    arr(j) = temp
End Sub

Public Sub MergeSort(ByRef arr() As Variant, ByVal left As Long, ByVal right As Long)
    If left < right Then
        Dim middle As Long
        middle = left + (right - left) \ 2
        
        MergeSort arr, left, middle
        MergeSort arr, middle + 1, right
        Merge arr, left, middle, right
    End If
End Sub

Private Sub Merge(ByRef arr() As Variant, ByVal left As Long, ByVal middle As Long, ByVal right As Long)
    Dim i As Long, j As Long, k As Long
    Dim n1 As Long, n2 As Long
    Dim leftArr() As Variant, rightArr() As Variant
    
    n1 = middle - left + 1
    n2 = right - middle
    
    ReDim leftArr(0 To n1 - 1)
    ReDim rightArr(0 To n2 - 1)
    
    For i = 0 To n1 - 1
        leftArr(i) = arr(left + i)
    Next i
    
    For j = 0 To n2 - 1
        rightArr(j) = arr(middle + 1 + j)
    Next j
    
    i = 0
    j = 0
    k = left
    
    Do While i < n1 And j < n2
        If leftArr(i) <= rightArr(j) Then
            arr(k) = leftArr(i)
            i = i + 1
        Else
            arr(k) = rightArr(j)
            j = j + 1
        End If
        k = k + 1
    Loop
    
    Do While i < n1
        arr(k) = leftArr(i)
        i = i + 1
        k = k + 1
    Loop
    
    Do While j < n2
        arr(k) = rightArr(j)
        j = j + 1
        k = k + 1
    Loop
End Sub

' Algorithme de recherche
Public Function BinarySearch(ByRef arr() As Variant, ByVal target As Variant, ByVal left As Long, ByVal right As Long) As Long
    If right >= left Then
        Dim middle As Long
        middle = left + (right - left) \ 2
        
        If arr(middle) = target Then
            BinarySearch = middle
        ElseIf arr(middle) > target Then
            BinarySearch = BinarySearch(arr, target, left, middle - 1)
        Else
            BinarySearch = BinarySearch(arr, target, middle + 1, right)
        End If
    Else
        BinarySearch = -1
    End If
End Function
`;

    it('should compile algorithms program successfully', () => {
      const result = compiler.compile(algorithmsProgram);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle complex user-defined types', () => {
      const result = compiler.compile(algorithmsProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('ListNode');
      expect(code).toContain('LinkedList');
      expect(code).toContain('BinaryTreeNode');
      expect(code).toContain('BinaryTree');
    });

    it('should handle recursive functions', () => {
      const result = compiler.compile(algorithmsProgram);
      expect(result.success).toBe(true);

      const code = result.transpiledCode;
      expect(code).toContain('BinaryTree_InsertRecursive');
      expect(code).toContain('BinaryTree_SearchRecursive');
      expect(code).toContain('QuickSort');
      expect(code).toContain('MergeSort');
      expect(code).toContain('BinarySearch');
    });
  });

  describe('Tests de Constructions VB6 Critiques', () => {
    it('should handle all VB6 data types', () => {
      const dataTypesProgram = `
Dim boolVar As Boolean
Dim byteVar As Byte
Dim intVar As Integer
Dim longVar As Long
Dim singleVar As Single
Dim doubleVar As Double
Dim currencyVar As Currency
Dim dateVar As Date
Dim stringVar As String
Dim variantVar As Variant
Dim objectVar As Object
Dim stringFixedVar As String * 50
`;

      const result = compiler.compile(dataTypesProgram);
      expect(result.success).toBe(true);
    });

    it('should handle all VB6 control structures', () => {
      const controlStructuresProgram = `
Sub TestControlStructures()
    Dim i As Integer, j As Integer
    Dim arr(1 To 10) As Integer
    
    ' If-Then-Else
    If i > 0 Then
        i = i + 1
    ElseIf i = 0 Then
        i = 1
    Else
        i = -1
    End If
    
    ' Select Case
    Select Case i
        Case 1, 2, 3
            j = 1
        Case 4 To 10
            j = 2
        Case Is > 10
            j = 3
        Case Else
            j = 0
    End Select
    
    ' For loops
    For i = 1 To 10
        arr(i) = i * 2
    Next i
    
    For i = 10 To 1 Step -1
        arr(i) = arr(i) + 1
    Next i
    
    ' While loops
    i = 1
    While i <= 10
        i = i + 1
    Wend
    
    Do While i > 0
        i = i - 1
    Loop
    
    Do
        i = i + 1
    Loop While i < 5
    
    Do Until i > 10
        i = i + 1
    Loop
    
    ' For Each
    Dim element As Variant
    For Each element In arr
        Debug.Print element
    Next element
End Sub
`;

      const result = compiler.compile(controlStructuresProgram);
      expect(result.success).toBe(true);
    });

    it('should handle all VB6 operators', () => {
      const operatorsProgram = `
Function TestOperators() As Boolean
    Dim a As Integer, b As Integer
    Dim result As Variant
    
    a = 10
    b = 3
    
    ' Arithmetic operators
    result = a + b     ' Addition
    result = a - b     ' Subtraction
    result = a * b     ' Multiplication
    result = a / b     ' Division
    result = a \ b     ' Integer division
    result = a Mod b   ' Modulus
    result = a ^ b     ' Exponentiation
    
    ' Comparison operators
    result = a = b     ' Equality
    result = a <> b    ' Inequality
    result = a < b     ' Less than
    result = a > b     ' Greater than
    result = a <= b    ' Less than or equal
    result = a >= b    ' Greater than or equal
    
    ' Logical operators
    result = True And False    ' And
    result = True Or False     ' Or
    result = Not True          ' Not
    result = True Xor False    ' Exclusive Or
    result = True Eqv False    ' Equivalence
    result = True Imp False    ' Implication
    
    ' String operators
    Dim str1 As String, str2 As String
    str1 = "Hello"
    str2 = "World"
    result = str1 & str2       ' Concatenation
    result = str1 Like "H*"    ' Pattern matching
    
    TestOperators = True
End Function
`;

      const result = compiler.compile(operatorsProgram);
      expect(result.success).toBe(true);
    });

    it('should handle error handling constructs', () => {
      const errorHandlingProgram = `
Sub TestErrorHandling()
    On Error GoTo ErrorHandler
    
    Dim x As Integer
    x = 10 / 0  ' Division by zero
    
    Exit Sub
    
ErrorHandler:
    Select Case Err.Number
        Case 11  ' Division by zero
            MsgBox "Division by zero error"
            Resume Next
        Case Else
            MsgBox "Unknown error: " & Err.Description
            Resume
    End Select
End Sub

Function TestErrorHandling2() As Boolean
    On Error Resume Next
    
    Dim result As Integer
    result = 10 / 0
    
    If Err.Number <> 0 Then
        Err.Clear
        TestErrorHandling2 = False
    Else
        TestErrorHandling2 = True
    End If
End Function
`;

      const result = compiler.compile(errorHandlingProgram);
      expect(result.success).toBe(true);
    });
  });

  describe('Benchmarks de Performance', () => {
    it('should compile within performance thresholds', () => {
      const largeProgram = Array(100)
        .fill(
          `
Sub TestSub${Math.random()}()
    Dim i As Integer
    For i = 1 To 1000
        Debug.Print "Test " & i
    Next i
End Sub
`
        )
        .join('\n');

      const startTime = performance.now();
      const result = compiler.compile(largeProgram);
      const endTime = performance.now();
      const compilationTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(compilationTime).toBeLessThan(5000); // 5 secondes max
    });

    it('should handle large data structures efficiently', () => {
      const largeDataProgram = `
Sub TestLargeData()
    Dim largeArray(1 To 10000) As Integer
    Dim i As Long
    
    For i = 1 To 10000
        largeArray(i) = i * 2
    Next i
    
    Dim total As Long
    For i = 1 To 10000
        total = total + largeArray(i)
    Next i
    
    Debug.Print "Total: " & total
End Sub
`;

      const result = compiler.compile(largeDataProgram);
      expect(result.success).toBe(true);
      expect(performanceMetrics.duration).toBeLessThan(1000); // 1 seconde max
    });

    it('should maintain memory usage within limits', () => {
      const memoryTestProgram = Array(50)
        .fill(
          `
Function MemoryTest${Math.random()}() As String
    Dim result As String
    Dim i As Integer
    For i = 1 To 100
        result = result & "Test string " & i & vbCrLf
    Next i
    MemoryTest${Math.random()} = result
End Function
`
        )
        .join('\n');

      const result = compiler.compile(memoryTestProgram);
      expect(result.success).toBe(true);

      const memoryIncrease = performanceMetrics.memoryAfter - performanceMetrics.memoryBefore;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max
    });
  });

  describe('Métriques de Succès', () => {
    it('should achieve target success rate', () => {
      const testPrograms = [
        'Sub Test1()\nEnd Sub',
        'Function Test2() As Integer\n    Test2 = 42\nEnd Function',
        'Dim x As Integer\nx = 10',
        'For i = 1 To 10\n    Debug.Print i\nNext i',
        'If True Then\n    Debug.Print "True"\nEnd If',
      ];

      let successCount = 0;
      testPrograms.forEach(program => {
        const result = compiler.compile(program);
        if (result.success) successCount++;
      });

      const successRate = (successCount / testPrograms.length) * 100;
      expect(successRate).toBeGreaterThanOrEqual(90); // 90% minimum
    });

    it('should generate valid JavaScript code', () => {
      const testProgram = `
Function Calculate(x As Integer, y As Integer) As Integer
    If x > y Then
        Calculate = x + y
    Else
        Calculate = x - y
    End If
End Function
`;

      const result = compiler.compile(testProgram);
      expect(result.success).toBe(true);
      expect(result.transpiledCode).toBeDefined();

      // Vérifier que le code généré est du JavaScript valide
      expect(() => {
        new Function(result.transpiledCode);
      }).not.toThrow();
    });
  });
});
