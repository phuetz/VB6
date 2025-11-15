' ========================================
' Phase 4 Demo: Exit & GoTo Statements
' ========================================
' Demonstrates:
' - Exit Function, Exit Sub
' - Exit For, Exit Do
' - GoTo with labels
' - Error handling with GoTo
' ========================================

Option Explicit

Private Sub Form_Load()
    DemoExitFunction
    DemoExitLoops
    DemoGoTo
    DemoErrorHandling
End Sub

' ========================================
' EXIT FUNCTION / EXIT SUB
' ========================================

' Function that finds first occurrence
Function FindInArray(arr() As String, target As String) As Integer
    Dim i As Integer

    FindInArray = -1  ' Default: not found

    For i = 0 To UBound(arr)
        If arr(i) = target Then
            FindInArray = i
            Exit Function  ' Early return when found
        End If
    Next i

    ' Only reaches here if not found
End Function

Private Sub DemoExitFunction()
    Dim fruits(4) As String
    Dim index As Integer

    Print "Demo 1: Exit Function"
    Print String(40, "-")

    fruits(0) = "Apple"
    fruits(1) = "Banana"
    fruits(2) = "Cherry"
    fruits(3) = "Date"
    fruits(4) = "Elderberry"

    index = FindInArray(fruits, "Cherry")
    Print "Found 'Cherry' at index: " & index

    index = FindInArray(fruits, "Grape")
    Print "Found 'Grape' at index: " & index & " (not found)"

    Print String(40, "-")
End Sub

' ========================================
' EXIT FOR / EXIT DO
' ========================================

Private Sub DemoExitLoops()
    Dim i As Integer
    Dim sum As Integer

    Print "Demo 2: Exit For/Do"
    Print String(40, "-")

    ' Exit For example
    Print "Counting until sum > 50:"
    sum = 0
    For i = 1 To 100
        sum = sum + i
        If sum > 50 Then
            Print "  Stopped at i=" & i & ", sum=" & sum
            Exit For
        End If
    Next i

    ' Exit Do example
    Print ""
    Print "Password validation (max 3 attempts):"
    Dim attempts As Integer
    Dim password As String

    attempts = 0
    Do
        attempts = attempts + 1
        password = "attempt" & attempts  ' Simulated input

        If password = "secret" Then
            Print "  Access granted!"
            Exit Do
        End If

        If attempts >= 3 Then
            Print "  Too many attempts!"
            Exit Do
        End If

        Print "  Attempt " & attempts & " failed"
    Loop

    Print String(40, "-")
End Sub

' ========================================
' GOTO AND LABELS
' ========================================

Private Sub DemoGoTo()
    Dim choice As Integer

    Print "Demo 3: GoTo Labels"
    Print String(40, "-")

    choice = 2  ' Simulate user choice

    Select Case choice
        Case 1
            GoTo Option1
        Case 2
            GoTo Option2
        Case 3
            GoTo Option3
        Case Else
            GoTo InvalidOption
    End Select

Option1:
    Print "Processing Option 1..."
    GoTo Cleanup

Option2:
    Print "Processing Option 2..."
    GoTo Cleanup

Option3:
    Print "Processing Option 3..."
    GoTo Cleanup

InvalidOption:
    Print "Invalid option selected!"
    ' Fall through to Cleanup

Cleanup:
    Print "Operation completed."
    Print String(40, "-")
End Sub

' ========================================
' ERROR HANDLING WITH GOTO
' ========================================

Private Sub DemoErrorHandling()
    On Error GoTo ErrorHandler

    Dim result As Double
    Dim x As Double, y As Double

    Print "Demo 4: Error Handling with GoTo"
    Print String(40, "-")

    x = 100
    y = 0

    Print "Attempting: " & x & " / " & y

    result = x / y  ' Division by zero!

    Print "Result: " & result

    ' Normal exit
    Exit Sub

ErrorHandler:
    Print "ERROR: " & Err.Description
    Print "Error Number: " & Err.Number
    Print "Handled gracefully!"

    ' Option 1: Resume Next (continue)
    ' Resume Next

    ' Option 2: Resume (retry)
    ' Resume

    ' Option 3: Exit (we use this)
    Print String(40, "-")
End Sub

' Advanced error handling example
Sub ProcessFile(filename As String)
    On Error GoTo FileError

    Print "Opening file: " & filename

    ' Simulate file operations
    If filename = "" Then
        Err.Raise 53, , "File not found"  ' Trigger error
    End If

    Print "Processing file..."
    Print "File processed successfully!"

    Exit Sub

FileError:
    Select Case Err.Number
        Case 53  ' File not found
            Print "ERROR: File '" & filename & "' not found!"
        Case 70  ' Permission denied
            Print "ERROR: Permission denied!"
        Case Else
            Print "ERROR: " & Err.Description
    End Select

    Err.Clear
End Sub

Private Sub cmdProcessFile_Click()
    ProcessFile ""  ' Test error
    Print String(40, "-")
    ProcessFile "data.txt"  ' Test success
End Sub

' Complex control flow with multiple labels
Sub ComplexFlow()
    Dim stage As Integer

    stage = 1

Start:
    Print "Stage " & stage & ": Initialization"
    stage = stage + 1

    If stage <= 3 Then
        GoTo Processing
    Else
        GoTo Finalize
    End If

Processing:
    Print "Stage " & stage & ": Processing"
    stage = stage + 1

    If stage < 5 Then
        GoTo Processing
    Else
        GoTo Finalize
    End If

Finalize:
    Print "Stage " & stage & ": Finalization"
    Print "Process complete!"
End Sub
