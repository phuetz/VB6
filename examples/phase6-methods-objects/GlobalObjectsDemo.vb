' ========================================
' Phase 6 Demo: Global Objects
' ========================================
' Demonstrates all VB6 global objects:
' - App (application information)
' - Screen (screen and mouse info)
' - Printer (printing support)
' - Debug (debugging output)
' - Err (error handling)
' - Forms (forms collection)
' ========================================

Option Explicit

Private Sub Form_Load()
    DemoAppObject
    DemoScreenObject
    DemoDebugObject
    DemoErrObject
End Sub

' ========================================
' APP OBJECT
' ========================================

Private Sub DemoAppObject()
    Print "========== APP OBJECT =========="
    Print "Application Information:"
    Print "  Title: " & App.Title
    Print "  EXE Name: " & App.EXEName
    Print "  Path: " & App.Path
    Print "  Version: " & App.Major & "." & App.Minor & "." & App.Revision
    Print "  Product Name: " & App.ProductName
    Print "  Previous Instance: " & App.PrevInstance
    Print String(50, "-")
End Sub

Private Sub cmdSetAppTitle_Click()
    Dim newTitle As String

    newTitle = InputBox("Enter new application title:", "App Title", App.Title)
    If newTitle <> "" Then
        App.Title = newTitle
        Me.Caption = App.Title  ' Update form caption
        Print "App title changed to: " & App.Title
    End If
End Sub

Private Sub cmdLogEvent_Click()
    ' Log application events
    App.LogEvent "User clicked Log Event button", vbLogEventTypeInformation

    Print "Event logged to system log"
    Print "  Type: Information"
    Print "  Message: User clicked Log Event button"
End Sub

Private Sub cmdStartLogging_Click()
    ' Start logging to file
    App.StartLogging "C:\MyApp.log", vbLogAuto

    Print "Logging started"
    Print "  Log file: C:\MyApp.log"
    Print "  Mode: Auto"

    ' Log some events
    App.LogEvent "Logging started", vbLogEventTypeInformation
    App.LogEvent "Application initialized", vbLogEventTypeInformation
End Sub

' ========================================
' SCREEN OBJECT
' ========================================

Private Sub DemoScreenObject()
    Print "========== SCREEN OBJECT =========="
    Print "Screen Information:"
    Print "  Width: " & Screen.Width & " twips"
    Print "  Height: " & Screen.Height & " twips"
    Print "  Width (pixels): " & Screen.Width \ Screen.TwipsPerPixelX
    Print "  Height (pixels): " & Screen.Height \ Screen.TwipsPerPixelY
    Print "  Twips Per Pixel X: " & Screen.TwipsPerPixelX
    Print "  Twips Per Pixel Y: " & Screen.TwipsPerPixelY
    Print String(50, "-")
End Sub

Private Sub cmdGetMousePosition_Click()
    Print "Mouse Position:"
    Print "  X: " & Screen.MouseX & " twips"
    Print "  Y: " & Screen.MouseY & " twips"
    Print "  X (pixels): " & Screen.MouseX \ Screen.TwipsPerPixelX
    Print "  Y (pixels): " & Screen.MouseY \ Screen.TwipsPerPixelY
End Sub

Private Sub cmdListFonts_Click()
    Dim i As Integer

    Print "Available Fonts (" & Screen.Fonts.Count & "):"

    For i = 0 To Screen.Fonts.Count - 1
        If i < 20 Then  ' Show first 20
            Print "  " & (i + 1) & ". " & Screen.Fonts.Item(i)
        End If
    Next i

    If Screen.Fonts.Count > 20 Then
        Print "  ... and " & (Screen.Fonts.Count - 20) & " more"
    End If
End Sub

Private Sub cmdActiveControl_Click()
    If Not Screen.ActiveControl Is Nothing Then
        Print "Active Control:"
        Print "  Name: " & Screen.ActiveControl.Name
        Print "  Type: " & TypeName(Screen.ActiveControl)
    Else
        Print "No active control"
    End If
End Sub

Private Sub cmdActiveForm_Click()
    If Not Screen.ActiveForm Is Nothing Then
        Print "Active Form:"
        Print "  Name: " & Screen.ActiveForm.Name
        Print "  Caption: " & Screen.ActiveForm.Caption
    Else
        Print "No active form"
    End If
End Sub

' ========================================
' PRINTER OBJECT
' ========================================

Private Sub cmdPrintDocument_Click()
    Dim i As Integer

    With Printer
        ' Set printer properties
        .Orientation = vbPRORPortrait
        .Copies = 1

        ' Print header
        .FontBold = True
        .FontSize = 16
        .Print "VB6 Global Objects Demo"
        .Print ""

        ' Print body
        .FontBold = False
        .FontSize = 12
        .Print "Generated: " & Now
        .Print String(50, "-")
        .Print ""

        ' Print application info
        .Print "Application Information:"
        .Print "  Title: " & App.Title
        .Print "  Version: " & App.Major & "." & App.Minor
        .Print "  Path: " & App.Path
        .Print ""

        ' Print screen info
        .Print "Screen Information:"
        .Print "  Resolution: " & _
               (Screen.Width \ Screen.TwipsPerPixelX) & " x " & _
               (Screen.Height \ Screen.TwipsPerPixelY)
        .Print ""

        ' Print a table
        .Print "Sample Data Table:"
        .Print String(50, "-")
        For i = 1 To 10
            .Print Format$(i, "00") & ". Item " & i & _
                   String(10, " ") & "Value: " & (i * 100)
        Next i

        ' New page
        .NewPage
        .Print "Page 2: Graphics"
        .Print String(50, "-")

        ' Draw some graphics
        .Line (1000, 1000)-(3000, 2000), vbBlack, B
        .Circle (2000, 3000), 500, vbRed

        ' End document (send to printer)
        .EndDoc
    End With

    MsgBox "Document sent to printer!" & vbCrLf & vbCrLf & _
           "Total Pages: " & Printer.Page, vbInformation
End Sub

Private Sub cmdPrinterSettings_Click()
    Print "Printer Settings:"
    Print "  Device Name: " & Printer.DeviceName
    Print "  Orientation: " & IIf(Printer.Orientation = vbPRORPortrait, "Portrait", "Landscape")
    Print "  Copies: " & Printer.Copies
    Print "  Current Page: " & Printer.Page
    Print "  Color Mode: " & Printer.ColorMode
End Sub

' ========================================
' DEBUG OBJECT
' ========================================

Private Sub DemoDebugObject()
    Print "========== DEBUG OBJECT =========="

    Debug.Print "This message appears in the debug window"
    Debug.Print "Current time: " & Now
    Debug.Print "Application: " & App.Title

    Print "Debug messages sent to Immediate Window"
    Print String(50, "-")
End Sub

Private Sub cmdDebugPrint_Click()
    Dim i As Integer

    Debug.Print "Debug Print Test"
    Debug.Print String(40, "-")

    For i = 1 To 5
        Debug.Print "Line " & i & ": " & Now
    Next i

    MsgBox "Check the Immediate Window (Ctrl+G) for debug output", vbInformation
End Sub

Private Sub cmdDebugAssert_Click()
    Dim value As Integer

    value = Val(InputBox("Enter a number (1-10):", "Assert Test", "5"))

    ' Assert that value is in range
    Debug.Assert value >= 1 And value <= 10

    If value >= 1 And value <= 10 Then
        Print "Assertion passed: value = " & value
    Else
        Print "Assertion FAILED: value = " & value & " (out of range)"
    End If
End Sub

' ========================================
' ERR OBJECT
' ========================================

Private Sub DemoErrObject()
    Print "========== ERR OBJECT =========="
    Print "Error Handling Object"
    Print "  Number: " & Err.Number
    Print "  Description: " & Err.Description
    Print "  Source: " & Err.Source
    Print String(50, "-")
End Sub

Private Sub cmdTriggerError_Click()
    On Error GoTo ErrorHandler

    Dim result As Double

    ' Trigger division by zero error
    result = 100 / 0

    Exit Sub

ErrorHandler:
    Print "ERROR CAUGHT:"
    Print "  Number: " & Err.Number
    Print "  Description: " & Err.Description
    Print "  Source: " & Err.Source

    MsgBox "Error " & Err.Number & ": " & Err.Description, _
           vbExclamation, "Error Handler"

    Err.Clear
    Resume Next
End Sub

Private Sub cmdRaiseCustomError_Click()
    On Error GoTo ErrorHandler

    Dim errorNum As Integer

    errorNum = Val(InputBox("Enter error number:", "Custom Error", "1000"))

    ' Raise custom error
    Err.Raise errorNum, App.EXEName, "This is a custom error message"

    Exit Sub

ErrorHandler:
    Print "CUSTOM ERROR:"
    Print "  Number: " & Err.Number
    Print "  Description: " & Err.Description
    Print "  Source: " & Err.Source

    Err.Clear
End Sub

Private Sub cmdClearError_Click()
    Err.Clear

    Print "Error object cleared:"
    Print "  Number: " & Err.Number
    Print "  Description: " & Err.Description
End Sub

' ========================================
' FORMS COLLECTION
' ========================================

Private Sub cmdListForms_Click()
    Dim frm As Form
    Dim i As Integer

    Print "Forms Collection (" & Forms.Count & " forms):"

    i = 0
    For Each frm In Forms
        Print "  " & (i + 1) & ". " & frm.Name & " - " & frm.Caption
        Print "     Visible: " & frm.Visible
        i = i + 1
    Next frm
End Sub

Private Sub cmdShowAllForms_Click()
    Dim frm As Form

    For Each frm In Forms
        frm.Show
        frm.WindowState = vbNormal
    Next frm

    Print "All forms shown (" & Forms.Count & " forms)"
End Sub

Private Sub cmdHideOtherForms_Click()
    Dim frm As Form

    For Each frm In Forms
        If Not frm Is Me Then
            frm.Hide
        End If
    Next frm

    Print "Other forms hidden"
End Sub

' ========================================
' COMPREHENSIVE DEMO
' ========================================

Private Sub cmdShowAll_Click()
    Cls  ' Clear form

    Print "========================================="
    Print "  VB6 GLOBAL OBJECTS - COMPLETE DEMO"
    Print "========================================="
    Print ""

    ' App Object
    DemoAppObject

    ' Screen Object
    DemoScreenObject

    ' Debug Object
    DemoDebugObject

    ' Err Object
    DemoErrObject

    ' Forms Collection
    Print "========== FORMS COLLECTION =========="
    cmdListForms_Click

    Print ""
    Print "Demo complete!"
    Print "========================================="
End Sub
