' ========================================
' Phase 5 Demo: TextBox Properties
' ========================================
' Demonstrates complete TextBox properties:
' - Selection properties (SelStart, SelLength, SelText)
' - MaxLength, MultiLine, ScrollBars
' - PasswordChar, Locked, TabIndex
' - Data binding properties
' ========================================

Option Explicit

Private Sub Form_Load()
    InitializeControls
    DemoSelectionProperties
End Sub

Private Sub InitializeControls()
    ' Main text box
    With txtMain
        .Text = "Visual Basic 6.0 is a powerful programming language!"
        .MultiLine = True
        .ScrollBars = 3  ' vbBoth
        .Width = 4000
        .Height = 2000
    End With

    ' Password box
    With txtPassword
        .PasswordChar = "*"
        .MaxLength = 20
        .Text = ""
    End With

    ' Read-only box
    With txtReadOnly
        .Locked = True
        .BackColor = &H8000000F  ' vbButtonFace
        .Text = "This text cannot be edited"
    End With
End Sub

' ========================================
' SELECTION PROPERTIES
' ========================================

Private Sub cmdSelectAll_Click()
    ' Select all text
    With txtMain
        .SelStart = 0
        .SelLength = Len(.Text)
        .SetFocus
    End With
End Sub

Private Sub cmdSelectWord_Click()
    ' Select first word
    With txtMain
        .SelStart = 0
        .SelLength = InStr(.Text, " ") - 1
        .SetFocus
    End With
End Sub

Private Sub cmdGetSelection_Click()
    With txtMain
        If .SelLength > 0 Then
            MsgBox "Selected text: " & vbCrLf & vbCrLf & .SelText, _
                   vbInformation, "Selection"
        Else
            MsgBox "No text selected!", vbExclamation
        End If
    End With
End Sub

Private Sub cmdReplaceSelection_Click()
    Dim newText As String

    With txtMain
        If .SelLength = 0 Then
            MsgBox "Please select some text first!", vbExclamation
            Exit Sub
        End If

        newText = InputBox("Enter replacement text:", "Replace", .SelText)
        If newText <> "" Then
            .SelText = newText  ' Replace selection
        End If
    End With
End Sub

Private Sub DemoSelectionProperties()
    Print "TextBox Selection Demo"
    Print String(40, "-")
    Print "Try these buttons:"
    Print "  - Select All: Selects entire text"
    Print "  - Select Word: Selects first word"
    Print "  - Get Selection: Shows selected text"
    Print "  - Replace: Replaces selected text"
    Print String(40, "-")
End Sub

' ========================================
' FORMATTING PROPERTIES
' ========================================

Private Sub cmdBold_Click()
    With txtMain
        .FontBold = Not .FontBold
    End With
End Sub

Private Sub cmdItalic_Click()
    With txtMain
        .FontItalic = Not .FontItalic
    End With
End Sub

Private Sub cmdIncreaseFontSize_Click()
    With txtMain
        If .FontSize < 72 Then
            .FontSize = .FontSize + 2
        End If
    End With
End Sub

Private Sub cmdDecreaseFontSize_Click()
    With txtMain
        If .FontSize > 8 Then
            .FontSize = .FontSize - 2
        End If
    End With
End Sub

' ========================================
' ALIGNMENT & BEHAVIOR
' ========================================

Private Sub optAlignLeft_Click()
    txtMain.Alignment = 0  ' vbLeftJustify
End Sub

Private Sub optAlignCenter_Click()
    txtMain.Alignment = 2  ' vbCenter
End Sub

Private Sub optAlignRight_Click()
    txtMain.Alignment = 1  ' vbRightJustify
End Sub

Private Sub chkHideSelection_Click()
    txtMain.HideSelection = (chkHideSelection.Value = 1)
End Sub

' ========================================
' TEXT MANIPULATION
' ========================================

Private Sub cmdInsertAtCursor_Click()
    Dim textToInsert As String

    textToInsert = InputBox("Enter text to insert:", "Insert Text")
    If textToInsert <> "" Then
        With txtMain
            ' Insert at current cursor position
            Dim cursorPos As Integer
            cursorPos = .SelStart

            .Text = Left$(.Text, cursorPos) & textToInsert & _
                    Mid$(.Text, cursorPos + 1)

            ' Move cursor after inserted text
            .SelStart = cursorPos + Len(textToInsert)
            .SelLength = 0
            .SetFocus
        End With
    End If
End Sub

Private Sub cmdUpperCase_Click()
    With txtMain
        If .SelLength > 0 Then
            .SelText = UCase$(.SelText)
        Else
            .Text = UCase$(.Text)
        End If
    End With
End Sub

Private Sub cmdLowerCase_Click()
    With txtMain
        If .SelLength > 0 Then
            .SelText = LCase$(.SelText)
        Else
            .Text = LCase$(.Text)
        End If
    End With
End Sub

' ========================================
' PASSWORD BOX DEMO
' ========================================

Private Sub txtPassword_Change()
    ' Update strength indicator
    Dim strength As String
    Dim length As Integer

    length = Len(txtPassword.Text)

    Select Case length
        Case 0 To 5
            strength = "Weak"
            lblStrength.ForeColor = vbRed
        Case 6 To 10
            strength = "Medium"
            lblStrength.ForeColor = &HFF8000  ' Orange
        Case Else
            strength = "Strong"
            lblStrength.ForeColor = vbGreen
    End Select

    lblStrength.Caption = "Strength: " & strength & " (" & length & " chars)"
End Sub

Private Sub cmdShowPassword_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
    ' Temporarily show password
    txtPassword.PasswordChar = ""
End Sub

Private Sub cmdShowPassword_MouseUp(Button As Integer, Shift As Integer, X As Single, Y As Single)
    ' Hide password again
    txtPassword.PasswordChar = "*"
End Sub

' ========================================
' VALIDATION
' ========================================

Private Sub txtNumericOnly_KeyPress(KeyAscii As Integer)
    ' Allow only numbers
    Select Case KeyAscii
        Case 48 To 57  ' 0-9
            ' Allow
        Case 8  ' Backspace
            ' Allow
        Case 13  ' Enter
            ' Allow
        Case Else
            KeyAscii = 0  ' Block character
            Beep
    End Select
End Sub

Private Sub txtMaxLength_Change()
    ' Show character count
    With txtMaxLength
        lblCharCount.Caption = Len(.Text) & " / " & .MaxLength
    End With
End Sub
